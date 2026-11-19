"""Entrena la red de EL·IA, elige la regla de decisión, escribe REPORT.md y exporta el modelo.

  python tools/elia/train.py                 validación cruzada (base → +keys → +plantillas), modelo final,
                                             exportación y regla escrita en content.js
  python tools/elia/train.py --no-export     solo validación cruzada y reporte
  python tools/elia/train.py --tpl 0         sin plantillas

Método
  - Features: tools/elia/common.py (hashing FNV-1a a 4096 dimensiones).
  - Red: 4096 → 64 (ReLU, dropout 0.3) → N intenciones (softmax), y de la capa oculta una
    salida sigmoide asks_how. Pérdida = CE ponderada por clase + how_weight × BCE + L2.
    Adam escrito a mano en NumPy.
  - Keys (common.py): fuertes de una sola intención → p = w·p_red + (1 − w)·[key] (basta para
    responder); débiles → p ∝ p_red·e^β (β ≤ 1, nunca basta sin la red); oosCues anula los keys.
  - Reglas sociales (common.py): saludos, despedidas y gracias cortos → respuesta directa.
  - Plantillas (templates.py): filas extra solo para entrenamiento, generadas desde content.js.
  - Evaluación: validación cruzada estratificada de 5 pliegues SOLO con preguntas originales.
    Las variantes y las plantillas nunca caen en validación. Early stopping y temperatura con
    una pregunta original por clase separada del entrenamiento.
  - Regla: grilla de threshold, margin, clarify y mezcla con keys sobre las probabilidades fuera
    de pliegue. Se elige la que maximiza las respuestas correctas con ≤ 5 % de respuestas
    equivocadas y ≥ 85 % de rechazo fuera de alcance. Una versión anidada (elegir con 4
    pliegues, medir en el 5.º) da la estimación sin optimismo.
  - Modelo final: 100 % de las preguntas, número de épocas y temperatura medianos de la
    validación cruzada. Pesos int8 con una escala por capa, en base64.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import random
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import templates  # noqa: E402
from augment import variants  # noqa: E402
from common import (CHAR_N, CONTENT, DIM, QUESTIONS, ROOT, compile_keys, featurize, key_intent,  # noqa: E402
                    load_elia, load_questions, social_intent)

OUT_JS = ROOT / "assets" / "data" / "elia-model.js"
REPORT = HERE / "REPORT.md"
PARITY = HERE / "parity.json"
OOS = "out_of_scope"


# ───────────────────────── red ─────────────────────────
def init(rng, D, H, K):
    P = {"W1": rng.normal(0, 0.1, (D, H)), "b1": np.zeros(H),
         "W2": rng.normal(0, np.sqrt(2 / H), (H, K)), "b2": np.zeros(K),
         "Wh": rng.normal(0, np.sqrt(2 / H), H), "bh": np.zeros(1)}
    return {k: v.astype(np.float32) for k, v in P.items()}   # float32: entrena ~2× más rápido


def forward(P, X, drop=0.0, rng=None):
    z1 = X @ P["W1"] + P["b1"]
    a = np.maximum(z1, 0)
    mask = None
    if drop and rng is not None:
        mask = (rng.random(a.shape) >= drop) / (1 - drop)
        a = a * mask
    return z1, a, mask, a @ P["W2"] + P["b2"], a @ P["Wh"] + P["bh"][0]


def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def losses(P, X, y, h, sw, cfg):
    _, _, _, logits, hz = forward(P, X)
    p = softmax(logits)
    ce = -np.log(p[np.arange(len(y)), y] + 1e-12)
    q = np.clip(sigmoid(hz), 1e-7, 1 - 1e-7)
    bce = -(h * np.log(q) + (1 - h) * np.log(1 - q))
    return float((ce * sw).mean() + cfg.how_weight * bce.mean())


def step_grads(P, X, y, h, sw, cfg, rng):
    z1, a, mask, logits, hz = forward(P, X, cfg.dropout, rng)
    n, K = logits.shape
    p = softmax(logits)
    g_logits = p.copy()
    g_logits[np.arange(n), y] -= 1
    g_logits *= sw[:, None] / n
    g_hz = cfg.how_weight * (sigmoid(hz) - h) / n
    G = {"W2": a.T @ g_logits + cfg.l2 * P["W2"], "b2": g_logits.sum(0),
         "Wh": a.T @ g_hz + cfg.l2 * P["Wh"], "bh": np.array([g_hz.sum()])}
    g_a = g_logits @ P["W2"].T + np.outer(g_hz, P["Wh"])
    if mask is not None:
        g_a *= mask
    g_z1 = g_a * (z1 > 0)
    G["W1"] = X.T @ g_z1 + cfg.l2 * P["W1"]
    G["b1"] = g_z1.sum(0)
    return G


def train(X, y, h, sw, Xv, yv, hv, K, cfg, seed, epochs=None):
    """Entrena con early stopping sobre (Xv, yv) o, si epochs está dado, un número fijo de épocas."""
    rng = np.random.default_rng(seed)
    P = init(rng, X.shape[1], cfg.hidden, K)
    m = {k: np.zeros_like(v) for k, v in P.items()}
    v2 = {k: np.zeros_like(v) for k, v in P.items()}
    b1, b2, eps, t = 0.9, 0.999, 1e-8, 0
    best, best_P, best_ep, bad = np.inf, None, 0, 0
    n_ep = epochs or cfg.max_epochs
    for ep in range(1, n_ep + 1):
        order = rng.permutation(len(y))
        for s in range(0, len(y), cfg.batch):
            idx = order[s:s + cfg.batch]
            G = step_grads(P, X[idx], y[idx], h[idx], sw[idx], cfg, rng)
            t += 1
            lr_t = cfg.lr * np.sqrt(1 - b2 ** t) / (1 - b1 ** t)   # corrección de sesgo en la tasa
            for k in P:   # Adam in situ: evita copias de la matriz 4096×64 en cada paso
                g = G[k].astype(np.float32, copy=False)
                m[k] *= b1; m[k] += (1 - b1) * g
                v2[k] *= b2; g *= g; g *= (1 - b2); v2[k] += g
                upd = np.sqrt(v2[k]); upd += eps; np.divide(m[k], upd, out=upd); upd *= lr_t
                P[k] -= upd
        if epochs:
            continue
        vl = losses(P, Xv, yv, hv, np.ones(len(yv)), cfg)
        if vl < best - 1e-4:
            best, best_P, best_ep, bad = vl, {k: v.copy() for k, v in P.items()}, ep, 0
        else:
            bad += 1
            if bad >= cfg.patience:
                break
    return (best_P, best_ep) if not epochs else (P, n_ep)


def fit_temperature(logits, y):
    """Temperature scaling: la T que minimiza la NLL en validación (búsqueda en rejilla)."""
    best_T, best = 1.0, np.inf
    for T in np.exp(np.linspace(np.log(0.2), np.log(5), 121)):
        p = softmax(logits / T)
        nll = -np.log(p[np.arange(len(y)), y] + 1e-12).mean()
        if nll < best:
            best, best_T = nll, float(T)
    return best_T


# ───────────────────────── datos ─────────────────────────
class Feats:
    def __init__(self):
        self.cache = {}

    def __call__(self, texts):
        out = np.zeros((len(texts), DIM), dtype=np.float32)
        for i, t in enumerate(texts):
            if t not in self.cache:
                self.cache[t] = featurize(t)
            out[i] = self.cache[t]
        return out


def stratified_folds(y, k, rng):
    fold = np.zeros(len(y), dtype=int)
    by = defaultdict(list)
    for i, c in enumerate(y):
        by[c].append(i)
    for c, idx in sorted(by.items()):
        idx = list(idx)
        rng.shuffle(idx)
        off = rng.randrange(k)
        for j, i in enumerate(idx):
            fold[i] = (off + j) % k
    return fold


def inner_split(idx, y, rng):
    """Una pregunta original por clase (si la clase tiene ≥ 4 en entrenamiento) para early stopping."""
    by = defaultdict(list)
    for i in idx:
        by[y[i]].append(i)
    val = []
    for c, ii in sorted(by.items()):
        if len(ii) >= 4:
            val.append(rng.choice(ii))
    vs = set(val)
    return [i for i in idx if i not in vs], val


def class_weights(y_tr, K, mode):
    cnt = np.bincount(y_tr, minlength=K).astype(float)
    cnt[cnt == 0] = 1
    if mode == "none":
        w = np.ones(K)
    elif mode == "sqrt":
        w = 1 / np.sqrt(cnt)
    else:
        w = 1 / cnt
    w = w / (w[y_tr].mean())
    return w


def build_train(rows, idx, y, h, feats, cfg, rng_aug, K, extra=None):
    """Originales de entrenamiento + sus variantes (+ las filas de plantillas, si se pasan)."""
    texts, ys, hs = [], [], []
    for i in idx:
        texts.append(rows[i]["text"]); ys.append(y[i]); hs.append(h[i])
        for v in variants(rows[i]["text"], cfg.aug, rng_aug):
            texts.append(v); ys.append(y[i]); hs.append(h[i])
    X, ys, hs = feats(texts), np.array(ys), np.array(hs, dtype=float)
    if extra is not None:
        X, ys, hs = np.vstack([X, extra[0]]), np.concatenate([ys, extra[1]]), np.concatenate([hs, extra[2]])
    cw = class_weights(np.array([y[i] for i in idx]), K, cfg.class_weight)
    return X, ys, hs, cw[ys]




# ───────────────────────── keys y reglas (post-proceso) ─────────────────────────
def apply_keys(P, sk, wk, so, w, beta):
    """Combina la red con las reglas. sk / wk / so: índice de la intención del key fuerte, del key
    débil o de la regla social por pregunta (−1 si no hay).
      fuerte:  p = w · p_red + (1 − w) · [intención]            (basta para responder)
      débil:   p ∝ p_red · e^β en la intención                   (nunca basta sin la red)
      social:  p = [intención]                                   (respuesta directa, sin red)"""
    P = P.copy()
    r = np.where(sk >= 0)[0]
    if len(r) and w < 1:
        P[r] *= w
        P[r, sk[r]] += 1 - w
    r = np.where((wk >= 0) & (sk < 0))[0]
    if len(r) and beta > 0:
        P[r, wk[r]] *= np.exp(beta)
        P[r] /= P[r].sum(1, keepdims=True)
    r = np.where(so >= 0)[0]
    if len(r):
        P[r] = 0
        P[r, so[r]] = 1
    return P


W_GRID = (0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3)
B_GRID = (0.0, 0.25, 0.5, 0.75, 1.0)   # bonus débil acotado: ≤ e^1, la red tiene que dar ≥ ~0.36 para responder
T_GRID = np.round(np.arange(0.30, 0.901, 0.05), 2)
M_GRID = np.round(np.arange(0.00, 0.501, 0.05), 2)
C_GRID = np.round(np.arange(0.10, 0.601, 0.05), 2)
MAX_WRONG, MIN_REJECT = 0.05, 0.85


class Outcomes:
    """Lo que la regla de decisión necesita de cada pregunta, calculado una vez por matriz P."""
    def __init__(self, P, y, oos):
        o = np.argsort(-P, axis=1, kind="stable")
        self.top, self.p1 = o[:, 0], P[np.arange(len(P)), o[:, 0]]
        self.p2 = P[np.arange(len(P)), o[:, 1]]
        self.ok = self.top == y
        self.hit3 = (o[:, :3] == y[:, None]).any(1)
        self.isoos, self.topoos = y == oos, self.top == oos

    def answered(self, t, m):
        return ~self.topoos & (self.p1 >= t) & (self.p1 - self.p2 >= m)

    def rates(self, S, t, m, c):
        ans = self.answered(t, m)
        cl = ~ans & ~self.topoos & (self.p1 >= c)
        I, O = S & ~self.isoos, S & self.isoos
        mean = lambda a, B: float(a[B].mean()) if B.any() else np.nan
        return {"acc_in": mean(self.ok, I),
                "answered_correct": mean(ans & self.ok, I), "answered_wrong": mean(ans & ~self.ok, I),
                "clarify": mean(cl, I), "clarify_hit": mean(cl & self.hit3, I),
                "miss": mean(~ans & ~cl, I), "oos_reject": mean(~ans, O),
                "oos_clarify": mean(cl, O)}


def select(outs, S, ES):
    """Busca (w, β, threshold, margin) con responde mal ≤ 5 % (en todas y en ES) y rechazo ≥ 85 % que
    maximice responde bien; luego el clarify que maximiza (aciertos − fallos) en "¿Te refieres a…?"."""
    best = None
    for hk, O in outs.items():
        for t in T_GRID:
            for m in M_GRID:
                r = O.rates(S, t, m, 1.0)
                if r["answered_wrong"] > MAX_WRONG or r["oos_reject"] < MIN_REJECT:
                    continue
                if O.rates(S & ES, t, m, 1.0)["answered_wrong"] > MAX_WRONG:
                    continue
                key = (round(r["answered_correct"], 9), -r["answered_wrong"], t)
                if best is None or key > best[0]:
                    best = (key, hk, float(t), float(m))
    if best is None:
        return None
    _, hk, t, m = best
    O, bc, bv = outs[hk], t, -np.inf
    for c in C_GRID[C_GRID <= t + 1e-9][::-1]:
        r = O.rates(S, t, m, c)
        v = 2 * r["clarify_hit"] - r["clarify"]
        if v > bv + 1e-9:
            bv, bc = v, float(c)
    return {"keyWeight": hk[0], "weakBonus": hk[1], "threshold": t, "margin": m, "clarify": bc}


def per_fold(O, fold, nf, L, prm, lang="all"):
    return [O.rates((fold == f) & ((L == lang) if lang != "all" else True),
                    prm["threshold"], prm["margin"], prm["clarify"]) for f in range(nf)]


def ms(vals):
    v = np.array([x for x in vals if not np.isnan(x)], dtype=float)
    return (v.mean(), v.std()) if len(v) else (np.nan, np.nan)


def evaluate_stage(P, y, sk, wk, so, fold, nf, L, oos, hybrids):
    outs = {hk: Outcomes(apply_keys(P, sk, wk, so, *hk), y, oos) for hk in hybrids}
    ES = L == "es"
    prm = select(outs, np.ones(len(y), bool), ES)
    res = {"params": prm, "outs": outs}
    if prm:
        O = outs[(prm["keyWeight"], prm["weakBonus"])]
        res["folds"] = {lang: per_fold(O, fold, nf, L, prm, lang) for lang in ("all", "es", "en")}
    # estimación anidada: parámetros elegidos con los otros 4 pliegues, medidos en el que queda fuera
    nested = {"all": [], "es": [], "en": []}
    for f in range(nf):
        p = select(outs, fold != f, ES)
        if p:
            O = outs[(p["keyWeight"], p["weakBonus"])]
            for lang in nested:
                S = (fold == f) & ((L == lang) if lang != "all" else True)
                nested[lang].append(O.rates(S, p["threshold"], p["margin"], p["clarify"]))
    res["nested"] = nested
    return res


# ───────────────────────── exportación ─────────────────────────
def quant(W):
    s = float(np.abs(W).max()) / 127 or 1.0
    q = np.clip(np.round(W / s), -127, 127).astype(np.int8)
    return {"s": s, "q": base64.b64encode(q.tobytes(order="C")).decode("ascii")}, q.astype(np.float64) * s


def quantized_predict(Q, X, T):
    a = np.maximum(X @ Q["W1"] + Q["b1"], 0)
    return softmax((a @ Q["W2"] + Q["b2"]) / T), sigmoid(a @ Q["Wh"] + Q["bh"][0])


def write_config(prm):
    """Escribe threshold, margin, clarify, keyWeight y weakBonus en DATA.elia (content.js, CRLF)."""
    s = CONTENT.read_bytes().decode("utf-8")
    a = s.index('  "elia": {')
    head, body = s[:a], s[a:]
    for k in ("threshold", "margin", "clarify", "keyWeight", "weakBonus"):
        v = prm[k]
        pat = re.compile(r'(\n    "' + k + r'": )([^,\r\n]+)(,)')
        if pat.search(body):
            body = pat.sub(lambda m: m.group(1) + str(v) + m.group(3), body, count=1)
        else:   # campo nuevo: va después de clarify
            i = body.index('\n', body.index('\n    "clarify": ') + 1)
            body = body[:i + 1] + f'    "{k}": {v},\r\n' + body[i + 1:]
    CONTENT.write_bytes((head + body).encode("utf-8"))


def rule_indices(texts, ids, K, social):
    """→ (sk, wk, so): índices de key fuerte, key débil y regla social por texto (−1 si no hay)."""
    sk, wk, so = [], [], []
    for t in texts:
        k, kind = key_intent(t, K)
        s = social_intent(t, social)
        sk.append(ids.index(k) if kind == "strong" else -1)
        wk.append(ids.index(k) if kind == "weak" else -1)
        so.append(ids.index(s) if s else -1)
    return np.array(sk), np.array(wk), np.array(so)


# ───────────────────────── principal ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folds", type=int, default=5)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--hidden", type=int, default=64)
    ap.add_argument("--dropout", type=float, default=0.3)
    ap.add_argument("--how-weight", type=float, default=0.5)
    ap.add_argument("--aug", type=int, default=8, help="variantes por pregunta original")
    ap.add_argument("--tpl", type=int, default=30, help="filas de plantillas por intención (0 = sin plantillas)")
    ap.add_argument("--tpl-aug", type=int, default=1, help="variantes por fila de plantilla")
    ap.add_argument("--class-weight", choices=["inverse", "sqrt", "none"], default="inverse")
    ap.add_argument("--lr", type=float, default=3e-3)
    ap.add_argument("--l2", type=float, default=1e-4)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--max-epochs", type=int, default=300)
    ap.add_argument("--patience", type=int, default=25)
    ap.add_argument("--no-export", action="store_true")
    ap.add_argument("--no-report", action="store_true", help="solo imprime métricas (para experimentos)")
    ap.add_argument("--dump", type=Path, help="guarda las probabilidades fuera de pliegue (.npz) para análisis")
    cfg = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    elia = load_elia()
    cfg.how_threshold = elia.get("howThreshold", 0.5)
    intents = elia["intents"]
    ids = [i["id"] for i in intents]
    oos = ids.index(OOS)
    KC = compile_keys(elia)
    social = elia.get("social", {})
    rows = load_questions()
    texts = [r["text"] for r in rows]
    L = np.array([r["lang"] for r in rows])
    y = np.array([ids.index(r["intent"]) for r in rows])
    h = np.array([r["how"] for r in rows])
    K = len(ids)
    feats = Feats()
    Xo = feats(texts)
    sk, wk, so = rule_indices(texts, ids, KC, social)
    none = np.full(len(y), -1)
    n_s, n_w = sum(len(k) for _, k in KC["strong"]), sum(len(k) for _, k in KC["weak"])
    print(f"{len(rows)} preguntas · {K} intenciones · keys {n_s} fuertes + {n_w} débiles · "
          f"key fuerte {(sk >= 0).mean():.0%} · débil {(wk >= 0).mean():.0%} · social {(so >= 0).mean():.0%}")

    # plantillas (solo entrenamiento): se generan una vez a partir de content.js, no de las preguntas
    extra = None
    if cfg.tpl:
        trng = random.Random(cfg.seed + 11)
        T = templates.generate(intents, trng, cfg.tpl)
        tx, ty, th = [], [], []
        for r in T:
            for t in [r["text"]] + variants(r["text"], cfg.tpl_aug, trng):
                tx.append(t); ty.append(ids.index(r["intent"])); th.append(r["how"])
        extra = (feats(tx), np.array(ty), np.array(th, dtype=float))
        print(f"plantillas: {len(T)} filas + variantes = {len(tx)} filas de entrenamiento")

    def run_cv(ex, tag):
        rng = random.Random(cfg.seed)
        fold = stratified_folds(y, cfg.folds, rng)
        P, HP, eps, Ts = np.zeros((len(y), K)), np.zeros(len(y)), [], []
        for f in range(cfg.folds):
            tr_all = [i for i in range(len(y)) if fold[i] != f]
            vi = [i for i in range(len(y)) if fold[i] == f]
            tr, iv = inner_split(tr_all, y, rng)
            X, ys, hs, sw = build_train(rows, tr, y, h, feats, cfg, random.Random(cfg.seed * 100 + f), K, ex)
            Pm, ep = train(X, ys, hs, sw, Xo[iv], y[iv], h[iv].astype(float), K, cfg, cfg.seed + f)
            _, _, _, lv, _ = forward(Pm, Xo[iv])
            T = fit_temperature(lv, y[iv])
            _, _, _, lo, hz = forward(Pm, Xo[vi])
            P[vi], HP[vi] = softmax(lo / T), sigmoid(hz)
            eps.append(ep); Ts.append(T)
            print(f"  [{tag}] pliegue {f + 1}: {len(ys)} filas · época {ep} · T={T:.2f} · "
                  f"acc_in={np.mean([P[i].argmax() == y[i] for i in vi if y[i] != oos]):.3f}")
        return fold, P, HP, eps, Ts

    hybrids = [(w, b) for w in W_GRID for b in B_GRID]
    ev = lambda P, s_, w_, o_, hy: evaluate_stage(P, y, s_, w_, o_, fold, cfg.folds, L, oos, hy)
    fold, PA, HA, epsA, TsA = run_cv(None, "base")
    stages = [("Base (solo red)", ev(PA, none, none, none, [(1.0, 0.0)]), PA, HA, epsA, TsA, False),
              ("+ keys fuertes/débiles + guardia OOS", ev(PA, sk, wk, none, hybrids), PA, HA, epsA, TsA, False)]
    if extra is not None:
        _, PB, HB, epsB, TsB = run_cv(extra, "plantillas")
        stages.append(("+ plantillas", ev(PB, sk, wk, none, hybrids), PB, HB, epsB, TsB, True))
    else:
        PB, HB, epsB, TsB = PA, HA, epsA, TsA
    stages.append(("+ reglas sociales (final)", ev(PB, sk, wk, so, hybrids), PB, HB, epsB, TsB, extra is not None))
    if cfg.dump:
        np.savez(cfg.dump, PA=PA, PB=PB, fold=fold, y=y, sk=sk, wk=wk, so=so, L=L, HB=HB, h=h)
    for name, st, *_ in stages:
        p = st["params"]
        if p:
            a = ms([r["answered_correct"] for r in st["folds"]["all"]])
            print(f"{name}: {p} → responde bien {a[0]:.3f}")
        else:
            print(f"{name}: ninguna combinación cumple las restricciones")

    # se exporta la última etapa (la más completa) si tiene una regla válida
    name, st, Pf, Hf, eps, Ts, use_tpl = stages[-1]
    prm = st["params"]
    how_cm = np.zeros((2, 2), dtype=int)
    for i in range(len(y)):
        how_cm[h[i], int(Hf[i] >= cfg.how_threshold)] += 1
    how_acc = ms([float(((Hf >= cfg.how_threshold) == (h == 1))[fold == f].mean()) for f in range(cfg.folds)])

    final_ep, final_T = int(np.median(eps)), float(np.median(Ts))
    size_kb = quant_agree = None
    if not cfg.no_export and prm:
        X, ys, hs, sw = build_train(rows, list(range(len(y))), y, h, feats, cfg,
                                    random.Random(cfg.seed * 100 + 99), K, extra if use_tpl else None)
        P, _ = train(X, ys, hs, sw, None, None, None, K, cfg, cfg.seed + 99, epochs=final_ep)
        Q, out = {}, {}
        for k in ("W1", "W2", "Wh"):
            out[k], Q[k] = quant(P[k])
        _, _, _, lf, _ = forward(P, Xo)
        model = {
            "v": 1, "generated": date.today().isoformat(),
            "dataset": hashlib.sha256(QUESTIONS.read_bytes()).hexdigest()[:12],
            "dim": DIM, "charN": list(CHAR_N), "hash": "fnv1a32", "hidden": cfg.hidden,
            "intents": ids, "T": round(final_T, 6),
            "W1": out["W1"], "b1": [round(float(x), 6) for x in P["b1"]],
            "W2": out["W2"], "b2": [round(float(x), 6) for x in P["b2"]],
            "Wh": out["Wh"], "bh": round(float(P["bh"][0]), 6),
        }
        # los sesgos se redondean al exportar: el modelo cuantizado de referencia usa los mismos valores
        Q["b1"], Q["b2"], Q["bh"] = np.array(model["b1"]), np.array(model["b2"]), np.array([model["bh"]])
        pq, _ = quantized_predict(Q, Xo, final_T)
        quant_agree = float((softmax(lf / final_T).argmax(1) == pq.argmax(1)).mean())
        OUT_JS.write_text("/* Generated by tools/elia/train.py. Do not edit: run python tools/elia/train.py */\n"
                          "window.ELIA_MODEL = " + json.dumps(model, separators=(",", ":")) + ";\n", encoding="utf-8")
        size_kb = OUT_JS.stat().st_size / 1024
        write_config(prm)
        # paridad: 50 preguntas con la red sola, ~60 con keys/guardia/reglas sociales (híbrido completo)
        prng = random.Random(cfg.seed + 5)
        sample = prng.sample(texts, 30)
        for t in prng.sample(texts, 40):
            sample += variants(t, 1, prng)
        sample = sample[:50]
        with_rule = [t for i, t in enumerate(texts) if sk[i] >= 0 or wk[i] >= 0 or so[i] >= 0]
        hsample = prng.sample(with_rule, 25)
        for t in prng.sample(with_rule, 30):
            hsample += variants(t, 1, prng)
        hsample = hsample[:40] + [
            "hola, qué es pulso", "phone ban paper", "el paper de parsimonya", "codigo de ceteris en github",
            "sa-ccr y calypso", "qué opinas de pulso", "cuál es el mejor celular", "budget", "celulares en colegios",
            "hola", "Hola EL·IA!", "mil gracias", "ok bye", "gracias, chao", "buenos días esteban",
            "thank you so much", "hi what is pulso", "Thanks!!", "adiós", "hola qué tal"]
        pp, ph = quantized_predict(Q, feats(sample), final_T)
        hq, _ = quantized_predict(Q, feats(hsample), final_T)
        hs_, hw_, ho_ = rule_indices(hsample, ids, KC, social)
        hp = apply_keys(hq, hs_, hw_, ho_, prm["keyWeight"], prm["weakBonus"])
        name_of = lambda a: [ids[k] if k >= 0 else None for k in a]
        PARITY.write_text(json.dumps({
            "questions": sample, "probs": pp.round(10).tolist(), "how": ph.round(10).tolist(),
            "hybrid": {"keyWeight": prm["keyWeight"], "weakBonus": prm["weakBonus"], "questions": hsample,
                       "strong": name_of(hs_), "weak": name_of(hw_), "social": name_of(ho_),
                       "probs": hp.round(10).tolist()}},
            ensure_ascii=False), encoding="utf-8")
        print(f"modelo final ({name}): {final_ep} épocas · T={final_T:.2f} · {OUT_JS.relative_to(ROOT)} = {size_kb:.1f} KB")
        print(f"content.js ← {prm}")

    if cfg.no_report:
        return
    write_report(cfg, rows, ids, sk, wk, so, y, L, stages, how_cm, how_acc, final_ep, final_T, size_kb, quant_agree, oos)
    print(f"reporte: {REPORT.relative_to(ROOT)}")


def write_report(cfg, rows, ids, sk, wk, so, y, Lg, stages, how_cm, how_acc, final_ep, final_T, size_kb, quant_agree, oos):
    pct = lambda m: f"{100 * m[0]:.1f} ± {100 * m[1]:.1f} %"
    lang_n = Counter(r["lang"] for r in rows)
    ins = y != oos
    L = []
    L.append("# EL·IA — reporte del modelo\n")
    L.append(f"Generado por `python tools/elia/train.py` el {date.today().isoformat()}. "
             f"{len(rows)} preguntas originales ({lang_n['es']} ES · {lang_n['en']} EN), {len(ids)} intenciones.\n")
    L.append("## Configuración\n")
    L.append(f"- Red: {DIM} → {cfg.hidden} (ReLU, dropout {cfg.dropout}) → {len(ids)} (softmax) + asks_how (sigmoide). "
             f"Pérdida: CE con pesos de clase `{cfg.class_weight}` + {cfg.how_weight} × BCE(asks_how) + L2 {cfg.l2}. "
             f"Adam lr {cfg.lr}, lote {cfg.batch}, {cfg.aug} variantes por pregunta.")
    L.append("- Keys (content.js, regla en `common.py` y `js/elia-net.js`): coincidencia exacta, o a distancia de "
             "Levenshtein ≤ 1 si las dos palabras tienen ≥ 5 letras. **Fuertes** (`keys`) de una sola intención: "
             "p = w·p_red + (1 − w)·[intención], basta para responder. **Débiles** (`weak`), solo si no hay fuertes: "
             "p ∝ p_red·e^β en esa intención, nunca basta sin la red. Keys de dos intenciones, o una frase de "
             "`oosCues`: decide la red. asks_how siempre sale de la red.")
    L.append("- Reglas sociales (`social`): ≤ 4 palabras formadas solo por frases de una lista (greeting, goodbye o "
             "thanks) y relleno → respuesta directa, sin red.")
    L.append(f"- Plantillas: {len(templates.TEMPLATES)} plantillas × keys fuertes y títulos, {cfg.tpl} filas por intención "
             f"(+{cfg.tpl_aug} variante cada una), solo en entrenamiento.")
    L.append(f"- Validación cruzada estratificada de {cfg.folds} pliegues solo con preguntas originales (los mismos "
             f"pliegues en todas las etapas). Early stopping y temperatura con una pregunta por clase separada del "
             f"entrenamiento. Las variantes y las plantillas nunca están en el pliegue evaluado.")
    L.append(f"- Regla: responder si la 1.ª no es `out_of_scope`, p1 ≥ threshold y p1 − p2 ≥ margin; "
             f"\"¿Te refieres a…?\" (3 opciones) si p1 ≥ clarify; si no, correo. Grilla: threshold "
             f"{T_GRID[0]}–{T_GRID[-1]}, margin {M_GRID[0]}–{M_GRID[-1]}, clarify {C_GRID[0]}–{C_GRID[-1]} (paso 0.05), "
             f"w ∈ {list(W_GRID)}, β ∈ {list(B_GRID)}. Se elige lo que maximiza \"responde bien\" con responde mal "
             f"≤ {MAX_WRONG:.0%} en todas **y en ES**, y rechazo de `out_of_scope` ≥ {MIN_REJECT:.0%}; luego el clarify "
             f"que maximiza aciertos − fallos dentro de \"¿Te refieres a…?\".\n")

    L.append("## Reglas solas (sin red)\n")
    L.append("| Regla | Preguntas dentro del alcance que la activan | Con la intención correcta | Fuera de alcance que la activan |")
    L.append("|---|---|---|---|")
    for lbl, a in (("Key fuerte", sk), ("Key débil (sin fuerte)", np.where(sk >= 0, -1, wk)), ("Social", so)):
        L.append(f"| {lbl} | {int((a >= 0)[ins].sum())} de {int(ins.sum())} | {int(((a >= 0) & (a == y))[ins].sum())} | "
                 f"{int((a >= 0)[~ins].sum())} |")
    L.append("\nLos keys los escribí mirando content.js **y** el dataset, así que esta capa sale algo favorecida en la "
             "validación. La prueba sin ese sesgo es `tools/elia/eval_holdout.py` con las preguntas de Esteban.\n")

    L.append("## Aporte de cada paso (media ± desviación entre pliegues)\n")
    L.append("Cada etapa con su propia regla óptima de la grilla. \"Anidada\": la regla se elige con 4 pliegues y se mide "
             "en el 5.º (estimación sin optimismo).\n")
    L.append("| Etapa | Regla elegida | Responde bien | Bien (anidada) | Responde mal | Mal (anidada) | Mal ES (anidada) | \"¿Te refieres a…?\" | Correo | Rechazo OOS |")
    L.append("|---|---|---|---|---|---|---|---|---|---|")
    for name, st, *_ in stages:
        p, nest = st["params"], st["nested"]
        nc = ms([r["answered_correct"] for r in nest["all"]])
        nw = ms([r["answered_wrong"] for r in nest["all"]])
        nwe = ms([r["answered_wrong"] for r in nest["es"]])
        if not p:
            L.append(f"| {name} | ninguna cumple | | {pct(nc)} | | {pct(nw)} | {pct(nwe)} | | | |")
            continue
        F = st["folds"]["all"]
        g = lambda k: pct(ms([r[k] for r in F]))
        rule = (f"t {p['threshold']:.2f} · m {p['margin']:.2f} · c {p['clarify']:.2f}"
                + ("" if p["keyWeight"] == 1.0 else f" · w {p['keyWeight']} · β {p['weakBonus']}"))
        L.append(f"| {name} | {rule} | {g('answered_correct')} | {pct(nc)} | {g('answered_wrong')} | {pct(nw)} | "
                 f"{pct(nwe)} | {g('clarify')} | {g('miss')} | {g('oos_reject')} |")
    L.append("")

    name, st, *_ = stages[-1]
    p = st["params"]
    if p:
        L.append(f"## Etapa final por idioma\n")
        L.append(f"Regla: threshold {p['threshold']}, margin {p['margin']}, clarify {p['clarify']}, keyWeight "
                 f"{p['keyWeight']}, weakBonus {p['weakBonus']} (ya escritos en content.js). Columnas \"anidada\": "
                 f"la estimación honesta.\n")
        L.append("| Métrica | Todas | Todas (anidada) | ES | ES (anidada) | EN | EN (anidada) | Meta |")
        L.append("|---|---|---|---|---|---|---|---|")
        for lbl, k, goal in [("Responde bien", "answered_correct", "≥ 80 %"), ("Responde mal", "answered_wrong", "≤ 5 %"),
                             ("\"¿Te refieres a…?\"", "clarify", ""), ("  … con la correcta entre las 3 opciones", "clarify_hit", ""),
                             ("Va a correo", "miss", ""), ("Accuracy (argmax, tras reglas)", "acc_in", ""),
                             ("Rechazo de out_of_scope", "oos_reject", "≥ 85 %"),
                             ("out_of_scope que cae en \"¿Te refieres a…?\"", "oos_clarify", "")]:
            cells = []
            for lg in ("all", "es", "en"):
                cells += [pct(ms([r[k] for r in st["folds"][lg]])), pct(ms([r[k] for r in st["nested"][lg]]))]
            L.append(f"| {lbl} | " + " | ".join(cells) + f" | {goal} |")
        L.append("")
        G = lambda part, lg, k: ms([r[k] for r in st[part][lg]])[0]
        checks = [("responde bien", G("nested", "all", "answered_correct") >= 0.80),
                  ("responde mal", G("nested", "all", "answered_wrong") <= MAX_WRONG),
                  ("responde mal en ES", G("nested", "es", "answered_wrong") <= MAX_WRONG),
                  ("rechazo OOS", G("nested", "all", "oos_reject") >= MIN_REJECT)]
        L.append("**Resultado (anidada):** " + " · ".join(f"{n} {'✓' if ok else '✗'}" for n, ok in checks) + " → "
                 + ("**se cumplen las metas.**\n" if all(ok for _, ok in checks) else "**no se cumplen todas las metas.**\n"))

        O = st["outs"][(p["keyWeight"], p["weakBonus"])]
        ans = O.answered(p["threshold"], p["margin"])
        L.append("## Respuestas equivocadas en validación (etapa final)\n")
        wr = [(rows[i]["text"], ids[y[i]], ids[O.top[i]], O.p1[i],
               "fuerte" if sk[i] >= 0 else "débil" if wk[i] >= 0 else "social" if so[i] >= 0 else "red")
              for i in range(len(y)) if ans[i] and not O.ok[i]]
        if wr:
            L.append("| Pregunta | Real | Respondió | p1 | Origen |")
            L.append("|---|---|---|---|---|")
            for t, a, b, q, src in sorted(wr, key=lambda d: -d[3]):
                L.append(f"| {t} | `{a}` | `{b}` | {q:.2f} | {src} |")
        else:
            L.append("Ninguna.")
        L.append("")
        miss = Counter(ids[y[i]] for i in range(len(y)) if ins[i] and not ans[i])
        L.append("## Intenciones que más se quedan sin responder (\"¿Te refieres a…?\" o correo)\n")
        L.append(", ".join(f"`{k}` ({n})" for k, n in miss.most_common(15)) + "\n")

    L.append("## asks_how (red de la etapa final, suma de los pliegues)\n")
    L.append(f"Accuracy {pct(how_acc)}.\n")
    L.append("| | predice how=0 | predice how=1 |")
    L.append("|---|---|---|")
    L.append(f"| **real how=0** | {how_cm[0, 0]} | {how_cm[0, 1]} |")
    L.append(f"| **real how=1** | {how_cm[1, 0]} | {how_cm[1, 1]} |\n")

    L.append("## Exportación\n")
    if size_kb is not None:
        L.append(f"- Modelo final: 100 % de las preguntas{' y las plantillas' if cfg.tpl else ''}, {final_ep} épocas "
                 f"(mediana de la validación cruzada), T = {final_T:.3f} (mediana).")
        L.append(f"- `assets/data/elia-model.js`: **{size_kb:.1f} KB** (meta ≤ 400 KB). Pesos int8 con escala por capa; "
                 f"coincide con el modelo en float en el {100 * quant_agree:.1f} % de las predicciones.")
        L.append("- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas solo red + 60 con keys, guardia "
                 "y reglas sociales; tolerancia 1e-3).")
        L.append("- Holdout de Esteban: `python tools/elia/eval_holdout.py` (lee `tools/elia/data/holdout.csv`).")
    else:
        L.append("- No se exportó.")
    REPORT.write_text("\n".join(L) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
