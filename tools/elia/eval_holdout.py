"""Evalúa EL·IA tal como corre en el navegador sobre tools/elia/data/holdout.csv.

  python tools/elia/eval_holdout.py
  python tools/elia/eval_holdout.py --file otra.csv

holdout.csv (columnas text,intent,lang) lo escribe Esteban. NUNCA entra al entrenamiento ni se usa
para ajustar keys, plantillas o umbrales: si una pregunta del holdout te hace cambiar algo, pásala
después a questions.csv y escribe preguntas nuevas para el holdout.

Usa el modelo exportado (assets/data/elia-model.js, pesos int8) y la configuración de content.js
(keys, oosCues, social, keyWeight, weakBonus, threshold, margin, clarify), con la misma regla de
decisión que train.py y js/elia-net.js. Imprime las métricas del reporte y las respuestas equivocadas.
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import ROOT, compile_keys, featurize, load_elia  # noqa: E402
from train import OOS, Outcomes, apply_keys, rule_indices, sigmoid, softmax  # noqa: E402

MODEL = ROOT / "assets" / "data" / "elia-model.js"
HOLDOUT = HERE / "data" / "holdout.csv"


def load_model():
    s = MODEL.read_text(encoding="utf-8")
    M = json.loads(s[s.index("{"):s.rindex("}") + 1])
    q = lambda k: np.frombuffer(base64.b64decode(M[k]["q"]), dtype=np.int8).astype(np.float64) * M[k]["s"]
    H, K = M["hidden"], len(M["intents"])
    return M, {"W1": q("W1").reshape(M["dim"], H), "W2": q("W2").reshape(H, K), "Wh": q("Wh"),
               "b1": np.array(M["b1"]), "b2": np.array(M["b2"]), "bh": M["bh"]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", type=Path, default=HOLDOUT)
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    with open(args.file, encoding="utf-8", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r.get("text", "").strip()]
    if not rows:
        print(f"{args.file.relative_to(ROOT)} está vacío: agrega filas text,intent,lang y vuelve a correr.")
        return

    elia = load_elia()
    M, W = load_model()
    ids = M["intents"]
    unknown = sorted({r["intent"] for r in rows} - set(ids))
    if unknown:
        sys.exit(f"intenciones que no existen en el modelo: {', '.join(unknown)}")
    texts = [r["text"] for r in rows]
    y = np.array([ids.index(r["intent"]) for r in rows])
    L = np.array([r.get("lang", "").strip() for r in rows])

    X = np.stack([featurize(t) for t in texts])
    a = np.maximum(X @ W["W1"] + W["b1"], 0)
    P, how = softmax((a @ W["W2"] + W["b2"]) / M["T"]), sigmoid(a @ W["Wh"] + W["bh"])
    sk, wk, so = rule_indices(texts, ids, compile_keys(elia), elia.get("social", {}))
    P = apply_keys(P, sk, wk, so, elia["keyWeight"], elia["weakBonus"])
    O = Outcomes(P, y, ids.index(OOS))
    t, m, c = elia["threshold"], elia["margin"], elia["clarify"]

    print(f"{len(rows)} preguntas del holdout · modelo {M['generated']} (dataset {M['dataset']}) · "
          f"threshold {t} · margin {m} · clarify {c} · keyWeight {elia['keyWeight']} · weakBonus {elia['weakBonus']}\n")
    pct = lambda v: "   —   " if np.isnan(v) else f"{100 * v:5.1f} %"
    langs = [lg for lg in ("es", "en") if (L == lg).any()]
    print(f"{'':44}{'Todas':>9}" + "".join(f"{lg.upper():>9}" for lg in langs) + "   Meta")
    for lbl, k, goal in [("Responde bien", "answered_correct", "≥ 80 %"), ("Responde mal", "answered_wrong", "≤ 5 %"),
                         ("\"¿Te refieres a…?\"", "clarify", ""), ("  … con la correcta entre las 3", "clarify_hit", ""),
                         ("Va a correo", "miss", ""), ("Accuracy (argmax, tras reglas)", "acc_in", ""),
                         ("Rechazo de out_of_scope", "oos_reject", "≥ 85 %")]:
        cells = [O.rates(np.ones(len(y), bool), t, m, c)[k]] + [O.rates(L == lg, t, m, c)[k] for lg in langs]
        print(f"{lbl:<44}" + "".join(f"{pct(v):>9}" for v in cells) + f"   {goal}")
    n_in, n_oos = int((~O.isoos).sum()), int(O.isoos.sum())
    print(f"\n({n_in} dentro del alcance · {n_oos} fuera de alcance)")

    ans = O.answered(t, m)
    src = lambda i: "social" if so[i] >= 0 else "key fuerte" if sk[i] >= 0 else "key débil" if wk[i] >= 0 else "red"
    wrong = [i for i in range(len(y)) if ans[i] and not O.ok[i]]
    print(f"\nRespuestas equivocadas ({len(wrong)}):")
    for i in sorted(wrong, key=lambda i: -O.p1[i]):
        print(f"  {texts[i]!r}  real {ids[y[i]]} → respondió {ids[O.top[i]]} (p1 {O.p1[i]:.2f}, {src(i)})")
    if not wrong:
        print("  ninguna")
    unanswered = [i for i in range(len(y)) if not O.isoos[i] and not ans[i]]
    print(f"\nSin responder dentro del alcance ({len(unanswered)}):")
    for i in unanswered:
        top3 = ", ".join(ids[k] for k in np.argsort(-P[i])[:3])
        kind = "¿Te refieres a…?" if O.p1[i] >= c and not O.topoos[i] else "correo"
        print(f"  {texts[i]!r}  real {ids[y[i]]} → {kind} (top 3: {top3})")


if __name__ == "__main__":
    main()
