"""Entrena la red de EL·IA, escribe REPORT.md y exporta assets/data/elia-model.js.

  python tools/elia/train.py                    validación cruzada + modelo final + exportación
  python tools/elia/train.py --no-export        solo validación cruzada y reporte
  python tools/elia/train.py --how-weight 0.8   cambia el peso de la pérdida de asks_how

Método
  - Features: tools/elia/common.py (hashing FNV-1a a 4096 dimensiones).
  - Red: 4096 → 64 (ReLU, dropout 0.3) → N intenciones (softmax), y de la capa oculta una
    salida sigmoide asks_how. Pérdida = CE ponderada por clase + how_weight × BCE + L2.
    Adam escrito a mano en NumPy.
  - Evaluación: validación cruzada estratificada de 5 pliegues SOLO con preguntas originales.
    En cada pliegue, las variantes de augment.py se generan a partir de las preguntas de
    entrenamiento de ese pliegue, así que ninguna variante cae en validación. Dentro del
    entrenamiento se separa una pregunta original por clase (validación interna) para el early
    stopping y para el temperature scaling; el pliegue externo nunca se usa para decidir nada.
  - Modelo final: 100 % de las preguntas. Como ya no queda validación, entrena el número de
    épocas mediano de la validación cruzada y usa la temperatura mediana.
  - Exportación: pesos int8 con una escala por capa (peso = q × escala), en base64.
    Las probabilidades de parity.json se calculan con esos pesos cuantizados, que son los que
    usa el navegador.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import random
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from augment import variants  # noqa: E402
from common import CHAR_N, DIM, QUESTIONS, ROOT, featurize, load_elia, load_questions  # noqa: E402

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


def build_train(rows, idx, y, h, feats, cfg, rng_aug, K):
    texts, ys, hs = [], [], []
    for i in idx:
        texts.append(rows[i]["text"]); ys.append(y[i]); hs.append(h[i])
        for v in variants(rows[i]["text"], cfg.aug, rng_aug):
            texts.append(v); ys.append(y[i]); hs.append(h[i])
    ys, hs = np.array(ys), np.array(hs, dtype=float)
    cw = class_weights(np.array([y[i] for i in idx]), K, cfg.class_weight)
    return feats(texts), ys, hs, cw[ys]


# ───────────────────────── métricas ─────────────────────────
def decide(p, ids, cfg):
    o = np.argsort(-p)
    p1, p2, top = p[o[0]], p[o[1]], ids[o[0]]
    if top != OOS and p1 >= cfg.threshold and p1 - p2 >= cfg.margin:
        return "answer"
    if top != OOS and p1 >= cfg.clarify:
        return "clarify"
    return "miss"


def macro_f1(yt, yp):
    labels = sorted(set(yt) | set(yp))
    f = []
    for c in labels:
        tp = sum(1 for a, b in zip(yt, yp) if a == c and b == c)
        fp = sum(1 for a, b in zip(yt, yp) if a != c and b == c)
        fn = sum(1 for a, b in zip(yt, yp) if a == c and b != c)
        f.append(0.0 if tp == 0 else 2 * tp / (2 * tp + fp + fn))
    return float(np.mean(f)) if f else float("nan")


def fold_metrics(rows, vi, y, h, probs, hp, ids, cfg):
    oos = ids.index(OOS)
    pred = probs.argmax(1)
    M = {}
    for lang in ("all", "es", "en"):
        sel = [k for k, i in enumerate(vi) if lang == "all" or rows[i]["lang"] == lang]
        ins = [k for k in sel if y[vi[k]] != oos]
        out = [k for k in sel if y[vi[k]] == oos]
        dec = {k: decide(probs[k], ids, cfg) for k in sel}
        M[lang] = {
            "acc_in": np.mean([pred[k] == y[vi[k]] for k in ins]) if ins else np.nan,
            "f1_macro": macro_f1([y[vi[k]] for k in sel], [pred[k] for k in sel]),
            "oos_reject": np.mean([dec[k] != "answer" for k in out]) if out else np.nan,
            "answered_correct": np.mean([dec[k] == "answer" and pred[k] == y[vi[k]] for k in ins]) if ins else np.nan,
            "answered_wrong": np.mean([dec[k] == "answer" and pred[k] != y[vi[k]] for k in ins]) if ins else np.nan,
            "clarify": np.mean([dec[k] == "clarify" for k in ins]) if ins else np.nan,
            "clarify_hit": np.mean([dec[k] == "clarify" and y[vi[k]] in np.argsort(-probs[k])[:3] for k in ins]) if ins else np.nan,
            "miss": np.mean([dec[k] == "miss" for k in ins]) if ins else np.nan,
            "how_acc": np.mean([(hp[k] >= cfg.how_threshold) == bool(h[vi[k]]) for k in sel]) if sel else np.nan,
        }
    return M


# ───────────────────────── exportación ─────────────────────────
def quant(W):
    s = float(np.abs(W).max()) / 127 or 1.0
    q = np.clip(np.round(W / s), -127, 127).astype(np.int8)
    return {"s": s, "q": base64.b64encode(q.tobytes(order="C")).decode("ascii")}, q.astype(np.float64) * s


def quantized_predict(Q, X, T):
    a = np.maximum(X @ Q["W1"] + Q["b1"], 0)
    return softmax((a @ Q["W2"] + Q["b2"]) / T), sigmoid(a @ Q["Wh"] + Q["bh"][0])


# ───────────────────────── principal ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folds", type=int, default=5)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--hidden", type=int, default=64)
    ap.add_argument("--dropout", type=float, default=0.3)
    ap.add_argument("--how-weight", type=float, default=0.5)
    ap.add_argument("--aug", type=int, default=8, help="variantes por pregunta original")
    ap.add_argument("--class-weight", choices=["inverse", "sqrt", "none"], default="inverse")
    ap.add_argument("--lr", type=float, default=3e-3)
    ap.add_argument("--l2", type=float, default=1e-4)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--max-epochs", type=int, default=300)
    ap.add_argument("--patience", type=int, default=25)
    ap.add_argument("--no-export", action="store_true")
    ap.add_argument("--curve", action="store_true", help="agrega la curva de aprendizaje (3, 5 y 10 pliegues)")
    ap.add_argument("--no-report", action="store_true", help="solo imprime métricas (para experimentos)")
    cfg = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    elia = load_elia()
    cfg.threshold, cfg.margin = elia["threshold"], elia["margin"]
    cfg.clarify, cfg.how_threshold = elia.get("clarify", 0.25), elia.get("howThreshold", 0.5)
    ids = [i["id"] for i in elia["intents"]]
    rows = load_questions()
    y = np.array([ids.index(r["intent"]) for r in rows])
    h = np.array([r["how"] for r in rows])
    K = len(ids)
    feats = Feats()
    Xo = feats([r["text"] for r in rows])
    print(f"{len(rows)} preguntas · {K} intenciones · features {DIM}")

    # ── validación cruzada ──
    def cross_validate(nf, verbose=True):
        rng = random.Random(cfg.seed)
        fold = stratified_folds(y, nf, rng)
        per_fold, eps, Ts = [], [], []
        conf = Counter()
        how_cm = np.zeros((2, 2), dtype=int)
        oos_detail = []
        for f in range(nf):
            tr_all = [i for i in range(len(y)) if fold[i] != f]
            vi = [i for i in range(len(y)) if fold[i] == f]
            tr, iv = inner_split(tr_all, y, rng)
            X, ys, hs, sw = build_train(rows, tr, y, h, feats, cfg, random.Random(cfg.seed * 100 + f), K)
            P, ep = train(X, ys, hs, sw, Xo[iv], y[iv], h[iv].astype(float), K, cfg, cfg.seed + f)
            _, _, _, lv, _ = forward(P, Xo[iv])
            T = fit_temperature(lv, y[iv])
            _, _, _, lo, hz = forward(P, Xo[vi])
            probs, hp = softmax(lo / T), sigmoid(hz)
            M = fold_metrics(rows, vi, y, h, probs, hp, ids, cfg)
            per_fold.append(M); eps.append(ep); Ts.append(T)
            for k, i in enumerate(vi):
                pk = int(probs[k].argmax())
                if pk != y[i]:
                    conf[(ids[y[i]], ids[pk])] += 1
                how_cm[h[i], int(hp[k] >= cfg.how_threshold)] += 1
                if ids[y[i]] == OOS:
                    o = np.argsort(-probs[k])
                    oos_detail.append((rows[i]["text"], ids[o[0]], float(probs[k][o[0]]), decide(probs[k], ids, cfg)))
            if verbose:
                print(f"  pliegue {f + 1}: {len(tr)} orig. + variantes = {len(ys)} filas · época {ep} · T={T:.2f} · "
                      f"acc_in={M['all']['acc_in']:.3f} · rechazo OOS={M['all']['oos_reject']:.3f}")

        def agg(lang, key):
            v = np.array([m[lang][key] for m in per_fold], dtype=float)
            v = v[~np.isnan(v)]
            return (v.mean(), v.std()) if len(v) else (np.nan, np.nan)

        return per_fold, agg, eps, Ts, conf, how_cm, oos_detail

    per_fold, agg, eps, Ts, conf, how_cm, oos_detail = cross_validate(cfg.folds)
    curve = []
    if cfg.curve:   # curva de aprendizaje: misma red, más o menos datos por pliegue
        for nf in (3, cfg.folds, 10):
            pf, ag, *_ = cross_validate(nf, verbose=False) if nf != cfg.folds else (per_fold, agg)
            curve.append((nf, len(y) * (nf - 1) / nf / K, ag('all', 'acc_in'), ag('all', 'oos_reject')))
            print(f'  curva: {nf} pliegues → acc_in={curve[-1][2][0]:.3f}')

    # ── modelo final ──
    final_ep, final_T = int(np.median(eps)), float(np.median(Ts))
    size_kb = None
    quant_agree = None
    if not cfg.no_export:
        all_idx = list(range(len(y)))
        X, ys, hs, sw = build_train(rows, all_idx, y, h, feats, cfg, random.Random(cfg.seed * 100 + 99), K)
        P, _ = train(X, ys, hs, sw, None, None, None, K, cfg, cfg.seed + 99, epochs=final_ep)
        Q, out = {}, {}
        for k in ("W1", "W2", "Wh"):
            out[k], Q[k] = quant(P[k])
        Q["b1"], Q["b2"], Q["bh"] = P["b1"], P["b2"], P["bh"]
        _, _, _, lf, _ = forward(P, Xo)
        pq, _ = quantized_predict(Q, Xo, final_T)
        quant_agree = float((softmax(lf / final_T).argmax(1) == pq.argmax(1)).mean())
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
        Q["b1"], Q["b2"] = np.array(model["b1"]), np.array(model["b2"])
        Q["bh"] = np.array([model["bh"]])
        OUT_JS.write_text("/* Generated by tools/elia/train.py. Do not edit: run python tools/elia/train.py */\n"
                          "window.ELIA_MODEL = " + json.dumps(model, separators=(",", ":")) + ";\n", encoding="utf-8")
        size_kb = OUT_JS.stat().st_size / 1024
        # paridad: 30 originales + 20 variantes con typos y sin tildes
        prng = random.Random(cfg.seed + 5)
        sample = prng.sample([r["text"] for r in rows], 30)
        for t in prng.sample([r["text"] for r in rows], 40):
            sample += variants(t, 1, prng)
        sample = sample[:50]
        pp, ph = quantized_predict(Q, feats(sample), final_T)
        PARITY.write_text(json.dumps({"questions": sample, "probs": pp.round(10).tolist(), "how": ph.round(10).tolist()},
                                     ensure_ascii=False), encoding="utf-8")
        print(f"modelo final: {final_ep} épocas · T={final_T:.2f} · {OUT_JS.relative_to(ROOT)} = {size_kb:.1f} KB")

    print(f"acc_in={agg('all', 'acc_in')[0]:.3f} · rechazo={agg('all', 'oos_reject')[0]:.3f} · "
          f"how_acc={agg('all', 'how_acc')[0]:.3f} · responde mal={agg('all', 'answered_wrong')[0]:.3f}")
    if cfg.no_report:
        return
    write_report(cfg, rows, ids, per_fold, agg, conf, how_cm, oos_detail, eps, Ts, final_ep, final_T, size_kb, quant_agree, curve)
    print(f"reporte: {REPORT.relative_to(ROOT)}")


def write_report(cfg, rows, ids, per_fold, agg, conf, how_cm, oos_detail, eps, Ts, final_ep, final_T, size_kb, quant_agree, curve):
    pct = lambda m: f"{100 * m[0]:.1f} ± {100 * m[1]:.1f} %"
    lang_n = Counter(r["lang"] for r in rows)
    L = []
    L.append("# EL·IA — reporte del modelo\n")
    L.append(f"Generado por `python tools/elia/train.py` el {date.today().isoformat()}. "
             f"{len(rows)} preguntas originales ({lang_n['es']} ES · {lang_n['en']} EN), {len(ids)} intenciones.\n")
    L.append("## Configuración\n")
    L.append(f"- Red: {DIM} → {cfg.hidden} (ReLU, dropout {cfg.dropout}) → {len(ids)} (softmax) + asks_how (sigmoide).")
    L.append(f"- Pérdida: CE con pesos de clase `{cfg.class_weight}` + {cfg.how_weight} × BCE(asks_how) + L2 {cfg.l2}. "
             f"Adam lr {cfg.lr}, lote {cfg.batch}, {cfg.aug} variantes por pregunta.")
    L.append(f"- Regla: responder si p1 ≥ {cfg.threshold} y p1 − p2 ≥ {cfg.margin}; \"¿Te refieres a…?\" si p1 ≥ {cfg.clarify}; "
             f"si no, ofrecer el correo. `out_of_scope` como 1.ª opción nunca responde. asks_how ≥ {cfg.how_threshold}.")
    L.append(f"- Validación cruzada estratificada de {cfg.folds} pliegues solo con preguntas originales; las variantes se "
             f"generan dentro de cada pliegue a partir de su parte de entrenamiento. Early stopping y temperatura con una "
             f"pregunta por clase separada del entrenamiento (nunca con el pliegue evaluado).")
    L.append(f"- Épocas por pliegue: {eps} · temperatura por pliegue: {[round(t, 2) for t in Ts]}.\n")

    L.append("## Métricas (media ± desviación entre pliegues)\n")
    L.append("| Métrica | Todas | ES | EN | Meta |")
    L.append("|---|---|---|---|---|")
    rowsM = [("Accuracy dentro del alcance (argmax)", "acc_in", "≥ 90 %"),
             ("F1 macro (todas las clases)", "f1_macro", ""),
             ("Rechazo fuera de alcance (no responde)", "oos_reject", "≥ 85 %"),
             ("Dentro del alcance: responde bien", "answered_correct", ""),
             ("Dentro del alcance: responde mal", "answered_wrong", ""),
             ("Dentro del alcance: \"¿Te refieres a…?\"", "clarify", ""),
             ("  … con la correcta entre las 3 opciones", "clarify_hit", ""),
             ("Dentro del alcance: ofrece correo", "miss", ""),
             ("Accuracy de asks_how", "how_acc", "")]
    for name, key, goal in rowsM:
        L.append(f"| {name} | {pct(agg('all', key))} | {pct(agg('es', key))} | {pct(agg('en', key))} | {goal} |")
    L.append("")
    acc, rej = agg("all", "acc_in")[0], agg("all", "oos_reject")[0]
    ok = acc >= 0.90 and rej >= 0.85
    L.append(f"**Resultado:** accuracy {100 * acc:.1f} % (meta 90 %) · rechazo {100 * rej:.1f} % (meta 85 %) → "
             + ("**se cumplen las dos metas.**\n" if ok else "**no se cumplen todas las metas** (ver propuestas abajo).\n"))

    L.append("## asks_how — matriz de confusión (suma de los pliegues)\n")
    L.append("| | predice how=0 | predice how=1 |")
    L.append("|---|---|---|")
    L.append(f"| **real how=0** | {how_cm[0, 0]} | {how_cm[0, 1]} |")
    L.append(f"| **real how=1** | {how_cm[1, 0]} | {how_cm[1, 1]} |\n")

    L.append("## Intenciones que más se confunden (argmax, suma de los pliegues)\n")
    if conf:
        L.append("| Real | Predicha | Veces |")
        L.append("|---|---|---|")
        for (a, b), n in conf.most_common(12):
            L.append(f"| `{a}` | `{b}` | {n} |")
    else:
        L.append("Ninguna confusión en validación.")
    L.append("")

    L.append("## Preguntas fuera de alcance que se responderían\n")
    bad = [d for d in oos_detail if d[3] == "answer"]
    if bad:
        L.append("| Pregunta | Intención elegida | p1 |")
        L.append("|---|---|---|")
        for t, i, p, _ in sorted(bad, key=lambda d: -d[2]):
            L.append(f"| {t} | `{i}` | {p:.2f} |")
    else:
        L.append("Ninguna: todas quedan en \"¿Te refieres a…?\" o en el correo.")
    L.append("")

    L.append("## Exportación\n")
    if size_kb is not None:
        L.append(f"- Modelo final: 100 % de las preguntas, {final_ep} épocas (mediana de la validación cruzada), "
                 f"T = {final_T:.3f} (mediana).")
        L.append(f"- `assets/data/elia-model.js`: **{size_kb:.1f} KB** (meta ≤ 400 KB). Pesos int8 con escala por capa.")
        L.append(f"- Cuantización: el int8 coincide con el modelo en float en el {100 * quant_agree:.1f} % de las "
                 f"predicciones (argmax) sobre las preguntas originales.")
        L.append("- Paridad Python ↔ JS: `node tools/elia/test_parity.mjs` (50 preguntas, tolerancia 1e-3).")
    else:
        L.append("- No se exportó (`--no-export`).")
    L.append("")

    if curve:
        L.append("## Curva de aprendizaje\n")
        L.append("Misma red y misma configuración; solo cambia cuántas preguntas originales hay en el entrenamiento de cada pliegue.\n")
        L.append("| Pliegues | Preguntas originales por clase en entrenamiento | Accuracy dentro del alcance | Rechazo fuera de alcance |")
        L.append("|---|---|---|---|")
        for nf, per, acc, rej in curve:
            L.append(f"| {nf} | {per:.1f} | {pct(acc)} | {pct(rej)} |")
        L.append("")

    weak = defaultdict(int)
    for (a, _), n in conf.items():
        weak[a] += n
    L.append("## Propuestas\n")
    if curve and len(curve) >= 2:
        n = np.log2([c[1] for c in curve]); a = np.array([100 * c[2][0] for c in curve])
        b, c0 = np.polyfit(n, a, 1)
        if b > 0:
            need = {t: 2 ** ((t - c0) / b) for t in (70, 80, 90)}
            L.append(f"- La curva sube unos {b:.0f} puntos cada vez que se duplican las preguntas por clase. Extrapolando "
                     f"(con solo {len(curve)} puntos, es una estimación gruesa): ~{need[70]:.0f} preguntas originales por clase "
                     f"para 70 %, ~{need[80]:.0f} para 80 % y ~{need[90]:.0f} para 90 %. Con unas 6 por clase hoy, la meta "
                     f"del 90 % pide escribir del orden de {max(0, need[90] - 6) * (len(ids) - 1):.0f} preguntas más.")
    if weak:
        top = ", ".join(f"`{k}` ({n})" for k, n in sorted(weak.items(), key=lambda kv: -kv[1])[:8])
        L.append(f"- Clases con más errores en validación: {top}. Antes de tocar la arquitectura, agregar 3–4 preguntas "
                 f"por clase con su palabra distintiva y con las formulaciones que fallaron.")
    if bad:
        L.append("- Para el rechazo: agregar a `out_of_scope` preguntas parecidas a las de la tabla de arriba "
                 "(mismo vocabulario que el sitio, pero sin relación con Esteban).")
    if not weak and not bad:
        L.append("- Nada urgente.")
    REPORT.write_text("\n".join(L) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
