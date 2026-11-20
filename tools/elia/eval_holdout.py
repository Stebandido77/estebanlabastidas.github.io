"""Evalúa EL·IA tal como corre en el navegador sobre tools/elia/data/holdout.csv.

  python tools/elia/eval_holdout.py          holdout definitivo (data/holdout.csv): la puerta
  python tools/elia/eval_holdout.py --dev    set de desarrollo (data/dev_holdout.csv): solo referencia
  python tools/elia/eval_holdout.py --dev2   segundo set de desarrollo (data/dev_holdout2.csv): solo referencia
  python tools/elia/eval_holdout.py --file otra.csv
  python tools/elia/eval_holdout.py --dev --model otro-modelo.js --set weakBonus=0 --set threshold=0.7
      (para comparar variantes sin tocar content.js ni el modelo publicado)

holdout.csv (columnas text,intent,lang y alt y how opcionales) lo escribe Esteban. NUNCA entra al
entrenamiento ni se usa para ajustar keys, plantillas o umbrales. dev_holdout.csv es el holdout
anterior: ya se usó para decidir cambios, así que solo sirve de referencia. dev_holdout2.csv es el
holdout del 2026-11-19 (100 preguntas, no pasó la puerta): ya se vio, así que también es solo desarrollo.

  alt: otras intenciones también válidas, separadas por "|" (puede incluir out_of_scope).
  how: 1 si la pregunta pide el "¿cómo lo hizo?", 0 si no. Solo informativo: se reporta la
       accuracy de asks_how (≥ howThreshold) en las filas que EL·IA respondió bien; no entra a la puerta.

Usa el modelo exportado (assets/data/elia-model.js, pesos int8) y la configuración de content.js
(keys, oosCues, social, keyWeight, weakBonus, threshold, margin, clarify), con la misma regla de
decisión que train.py y js/elia-net.js.

Cada pregunta cae en uno de cuatro resultados:
  correcta   EL·IA responde una intención válida (intent o alt), o manda al correo cuando
             out_of_scope es válida (intent o alt).
  equivocada EL·IA responde una intención que no es válida.
  "¿Te refieres a…?"  no responde y muestra 3 opciones (se reporta si alguna era válida).
  correo     no responde y ofrece escribirle a Esteban, cuando out_of_scope no era válida.

Puerta de publicación, sobre TODAS las preguntas del holdout; las tres deben cumplirse:
  correctas ≥ 65 %
  correctas + "¿Te refieres a…?" con una opción válida ≥ 85 %
  equivocadas ≤ 5 %
Además, un aviso que NO bloquea si las equivocadas en ES pasan de 6 %.
Sale con código 1 si no se cumple (con --dev, siempre 0: es solo referencia).
(2026-11-19: la primera meta bajó de 70 % a 65 % antes de escribir el holdout definitivo; ver REPORT.md.)
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import ROOT, compile_keys, featurize, load_elia  # noqa: E402
from train import OOS, Outcomes, apply_keys, cos_dist, ood_arrays, rule_indices, sigmoid, softmax  # noqa: E402

MODEL = ROOT / "assets" / "data" / "elia-model.js"
HOLDOUT = HERE / "data" / "holdout.csv"
DEV = HERE / "data" / "dev_holdout.csv"
DEV2 = HERE / "data" / "dev_holdout2.csv"
GOAL_CORRECT, GOAL_USEFUL, GOAL_WRONG = 0.65, 0.85, 0.05   # puerta: correctas, correctas + opción válida, equivocadas
WARN_WRONG_ES = 0.06   # aviso (no bloquea) si las equivocadas en español pasan de esto
OUTCOMES = ("correcta", "equivocada", "¿Te refieres a…?", "correo")


def load_model(path=MODEL):
    s = Path(path).read_text(encoding="utf-8")
    M = json.loads(s[s.index("{"):s.rindex("}") + 1])
    q = lambda k: np.frombuffer(base64.b64decode(M[k]["q"]), dtype=np.int8).astype(np.float64) * M[k]["s"]
    H, K = M["hidden"], len(M["intents"])
    return M, {"W1": q("W1").reshape(M["dim"], H), "W2": q("W2").reshape(H, K), "Wh": q("Wh"),
               "b1": np.array(M["b1"]), "b2": np.array(M["b2"]), "bh": M["bh"]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", type=Path)
    ap.add_argument("--dev", action="store_true", help="evalúa data/dev_holdout.csv (solo referencia)")
    ap.add_argument("--dev2", action="store_true", help="evalúa data/dev_holdout2.csv (solo referencia)")
    ap.add_argument("--model", type=Path, default=MODEL, help="otro elia-model.js (para comparar variantes)")
    ap.add_argument("--no-ood", action="store_true", help="ignora el detector de novedad del modelo")
    ap.add_argument("--set", action="append", default=[], metavar="CLAVE=VALOR",
                    help="cambia un valor de DATA.elia solo para esta evaluación (p. ej. weakBonus=0)")
    args = ap.parse_args()
    args.file = args.file or (DEV if args.dev else DEV2 if args.dev2 else HOLDOUT)
    args.dev = args.dev or args.dev2 or (args.file is not None and args.file.resolve() != HOLDOUT.resolve())
    sys.stdout.reconfigure(encoding="utf-8")

    with open(args.file, encoding="utf-8", newline="") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("text") or "").strip()]
    if not rows:
        print(f"{args.file} está vacío: agrega filas text,intent,lang[,alt] y vuelve a correr.")
        return

    elia = load_elia()
    for kv in args.set:
        k, v = kv.split("=", 1)
        elia[k] = float(v)
    M, W = load_model(args.model)
    ids = M["intents"]
    for r in rows:
        r["intent"] = (r.get("intent") or "").strip() or OOS   # oos_calib.csv no trae intent: todo es out_of_scope
        r["valid"] = [r["intent"].strip()] + [a.strip() for a in (r.get("alt") or "").split("|") if a.strip()]
    unknown = sorted({v for r in rows for v in r["valid"]} - set(ids))
    if unknown:
        sys.exit(f"intenciones que no existen en el modelo: {', '.join(unknown)}")
    texts = [r["text"] for r in rows]
    L = [r.get("lang", "").strip() for r in rows]

    # la misma cadena que el navegador: red → keys / reglas → regla de decisión
    X = np.stack([featurize(t) for t in texts])
    a = np.maximum(X @ W["W1"] + W["b1"], 0)
    P = softmax((a @ W["W2"] + W["b2"]) / M["T"])
    HP = sigmoid(a @ W["Wh"] + float(np.ravel(W["bh"])[0]))   # asks_how: siempre sale de la red
    sk, wk, so = rule_indices(texts, ids, compile_keys(elia, M.get("promoted")), elia.get("social", {}))
    P = apply_keys(P, sk, wk, so, elia["keyWeight"], elia["weakBonus"])
    t, m, c = elia["threshold"], elia["margin"], elia["clarify"]
    oos = ids.index(OOS)

    ood = None if args.no_ood else M.get("ood")
    if ood:
        pr, ra = ood_arrays(ood, M["hidden"])
        inside = cos_dist(a, pr) <= ra
    else:
        inside = None
    Oc = Outcomes(P, np.zeros(len(rows), int), oos, (sk >= 0) | (so >= 0), inside)
    res = []
    for i, r in enumerate(rows):
        dec, opt_idx, blocked = Oc.row(i, t, m, c)
        top, p1 = int(Oc.top[i]), float(Oc.p1[i])
        options = [ids[k] for k in opt_idx]
        answered, clarify = dec == "answer", dec == "clarify"
        valid = set(r["valid"])
        if answered:
            out = "correcta" if ids[top] in valid else "equivocada"
        elif clarify:
            out = "¿Te refieres a…?"
        else:
            out = "correcta" if OOS in valid else "correo"
        src = ("social / guardia dura" if so[i] >= 0 else "key fuerte" if sk[i] >= 0
               else "key débil" if wk[i] >= 0 else "red")
        if blocked:
            src += ", bloqueada por el detector"
        res.append({"i": i, "out": out, "top": ids[top], "p1": p1, "src": src, "options": options, "blocked": blocked,
                    "hit": clarify and bool(valid & set(options)), "decision": "responde" if answered
                    else "¿Te refieres a…?" if clarify else "correo"})

    print(f"{len(rows)} preguntas de {args.file.name} · modelo {M['generated']} (dataset {M['dataset']}) · threshold {t} · "
          f"margin {m} · clarify {c} · keyWeight {elia['keyWeight']} · weakBonus {elia['weakBonus']} · detector "
          f"{'p' + str(ood['pct']) if ood else 'no'}\n")

    def table(sel, label):
        n = len(sel)
        if not n:
            return
        cnt = Counter(res[i]["out"] for i in sel)
        hits = sum(res[i]["hit"] for i in sel)
        cells = "  ".join(f"{k} {cnt[k]:>2} ({100 * cnt[k] / n:5.1f} %)" for k in OUTCOMES)
        print(f"{label:<34} n={n:>2}  {cells}   [opciones con una válida: {hits}]")

    allr = list(range(len(rows)))
    table(allr, "Todas")
    for lg in ("es", "en"):
        table([i for i in allr if L[i] == lg], f"  {lg.upper()}")
    table([i for i in allr if rows[i]["intent"] != OOS], "  intent dentro del alcance")
    table([i for i in allr if rows[i]["intent"] == OOS], "  intent = out_of_scope")

    def show(title, sel):
        print(f"\n{title} ({len(sel)}):")
        for i in sel:
            r, x = rows[i], res[i]
            valid = r["intent"] + (" | alt: " + ", ".join(r["valid"][1:]) if len(r["valid"]) > 1 else "")
            pick = (f"respondió {x['top']} (p1 {x['p1']:.2f}, {x['src']})" if x["decision"] == "responde"
                    else f"{x['decision']} — 1.ª {x['top']} (p1 {x['p1']:.2f}, {x['src']}); opciones: {', '.join(x['options'])}")
            print(f"  {r['text']}\n      válidas: {valid}\n      → {pick}")
        if not sel:
            print("  ninguna")

    show("Respuestas equivocadas", [i for i in allr if res[i]["out"] == "equivocada"])
    show("No respondidas (\"¿Te refieres a…?\" o correo, sin ser correctas)",
         [i for i in allr if res[i]["out"] in ("¿Te refieres a…?", "correo")])

    n = len(rows)
    good = sum(x["out"] == "correcta" for x in res) / n
    useful = good + sum(x["hit"] for x in res) / n
    bad = sum(x["out"] == "equivocada" for x in res) / n
    checks = [(f"correctas {100 * good:.1f} % (≥ {GOAL_CORRECT:.0%})", good >= GOAL_CORRECT),
              (f"correctas + \"¿Te refieres a…?\" con opción válida {100 * useful:.1f} % (≥ {GOAL_USEFUL:.0%})", useful >= GOAL_USEFUL),
              (f"equivocadas {100 * bad:.1f} % (≤ {GOAL_WRONG:.0%})", bad <= GOAL_WRONG)]
    ok = all(c for _, c in checks)
    name = f"Referencia ({args.file.name}, no decide)" if args.dev else "Puerta de publicación"
    print(f"\n{name}, sobre todas las preguntas:")
    for label, c in checks:
        print(f"  {'✓' if c else '✗'} {label}")
    print("  → " + ("cumple las tres" if ok else "no cumple las tres") + ("" if args.dev else (" · SE PUEDE PUBLICAR" if ok else " · NO SE PUBLICA")))
    es = [x for x, lg in zip(res, L) if lg == "es"]
    if es:
        bad_es = sum(x["out"] == "equivocada" for x in es) / len(es)
        if bad_es > WARN_WRONG_ES:
            print(f"  ⚠ aviso (no bloquea): equivocadas en ES {100 * bad_es:.1f} % (> {WARN_WRONG_ES:.0%}, {len(es)} preguntas en ES)")
        else:
            print(f"  equivocadas en ES {100 * bad_es:.1f} % (aviso si > {WARN_WRONG_ES:.0%})")
    print(f"  con {n} preguntas, cada una mueve {100 / n:.1f} puntos.")
    fails = [x for x in res if x["out"] == "equivocada" or (x["out"] in ("¿Te refieres a…?", "correo") and not x["hit"])]
    top1 = Counter(x["top"] for x in fails)
    print(f"  1.ª intención en los fallos (equivocadas o sin opción válida, {len(fails)}): "
          + ", ".join(f"{k} {v}" for k, v in top1.most_common(8))
          + f" · bloqueadas por el detector: {sum(x['blocked'] for x in res)}")
    # asks_how, informativo: solo filas respondidas y correctas, con la columna how presente
    ht = elia.get("howThreshold", 0.5)
    hs = [i for i in allr if res[i]["out"] == "correcta" and res[i]["decision"] == "responde"
          and (rows[i].get("how") or "").strip() in ("0", "1")]
    if hs:
        print(f"\nasks_how (informativo, no entra a la puerta) · howThreshold {ht} · filas respondidas bien con how:")
        for lab, sel in (("Todas", hs), ("  ES", [i for i in hs if L[i] == "es"]), ("  EN", [i for i in hs if L[i] == "en"])):
            if not sel:
                continue
            y = [rows[i]["how"].strip() == "1" for i in sel]
            yhat = [bool(HP[i] >= ht) for i in sel]
            acc = sum(a == b for a, b in zip(y, yhat)) / len(sel)
            tp = sum(a and b for a, b in zip(y, yhat))
            print(f"  {lab:<6} n={len(sel):>2}  accuracy {100 * acc:5.1f} %  · how=1: {sum(y)} (detectadas {tp}) · "
                  f"falsos positivos {sum(b and not a for a, b in zip(y, yhat))}")
        miss = [i for i in hs if (rows[i]["how"].strip() == "1") != (HP[i] >= ht)]
        for i in miss:
            print(f"    ✗ {rows[i]['text']}  (how {rows[i]['how'].strip()}, asks_how {HP[i]:.2f})")
    sys.exit(0 if ok or args.dev else 1)


if __name__ == "__main__":
    main()
