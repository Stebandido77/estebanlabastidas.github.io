"""Corpus externo de out_of_scope para EL·IA (SOLO entrenamiento; nunca entra a la validación).

  py -3.12 tools/elia/build_oos.py            escribe tools/elia/data/oos_external.csv

Fuente: el split "oos" de CLINC150 (Larson et al., 2019, "An Evaluation Dataset for Intent Classification and
Out-of-Scope Prediction", EMNLP), https://github.com/clinc/oos-eval, licencia CC BY 3.0. Son preguntas en inglés
que no pertenecen a ninguna de sus 150 intenciones (banca, viajes, hogar, charla…): justo el tipo de pregunta que
EL·IA debe mandar al correo.

Escribe dos archivos disjuntos (ninguna frase de CLINC150 está en los dos):
  data/oos_external.csv   300 frases (150 EN + 150 ES) para ENTRENAR.
  data/oos_calib.csv      100 frases (50 EN + 50 ES) de CALIBRACIÓN: nunca entran al entrenamiento, al profesor
                          de la destilación ni a los prototipos; train.py mide qué % rechaza cada regla.

Pasos (deterministas, semilla fija):
  1. Descarga data/data_full.json y junta oos_train + oos_val + oos_test (1200 frases).
  2. Quita las que activan un key fuerte o débil de EL·IA o una regla social (así el corpus no contradice los
     keys), las de menos de 3 palabras y las repetidas.
  3. Baraja y toma N_EN frases que quedan en inglés y otras N_ES distintas que se traducen al español con
     Helsinki-NLP/opus-mt-en-es (MarianMT, Apache-2.0), un traductor que corre local. Se descartan las
     traducciones que activan un key y las que perdieron la forma de pregunta (empiezan por "lo que", "lo
     poco", "lo cual", "lo mucho" o "lo bien", o dejaron sueltas what/how/is/are); se reponen con las
     siguientes frases del pool. Lo mismo para la calibración, con frases que vienen después.
Necesita transformers, torch y sentencepiece (el mismo intérprete de embed.py). La primera vez descarga el
traductor a la caché de Hugging Face; después corre sin conexión.
"""
from __future__ import annotations

import csv
import json
import random
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import compile_keys, key_hits, load_elia, normalize, social_intent  # noqa: E402

URL = "https://raw.githubusercontent.com/clinc/oos-eval/master/data/data_full.json"
CACHE = HERE / ".cache" / "clinc150_data_full.json"
OUT = HERE / "data" / "oos_external.csv"
CALIB = HERE / "data" / "oos_calib.csv"
MT = "Helsinki-NLP/opus-mt-en-es"
N_EN, N_ES, SEED = 150, 150, 2026
N_CAL = 50   # por idioma, en oos_calib.csv


def load_clinc():
    if not CACHE.exists():
        CACHE.parent.mkdir(exist_ok=True)
        with urllib.request.urlopen(URL, timeout=60) as r:
            CACHE.write_bytes(r.read())
    d = json.loads(CACHE.read_text(encoding="utf-8"))
    return [(t, f"{split}:{i}") for split in ("oos_train", "oos_val", "oos_test") for i, (t, _) in enumerate(d[split])]


def clean(texts, K, social):
    """Sin keys ni reglas sociales, ≥ 3 palabras y sin duplicados (tras normalizar)."""
    seen, out = set(), []
    for t, src in texts:
        n = normalize(t)
        if len(n.split()) < 3 or n in seen:
            continue
        if key_hits(t, K["strong"]) or key_hits(t, K["weak"]) or social_intent(t, social):
            continue
        seen.add(n)
        out.append((t, src))
    return out


def translate(texts):
    from transformers import MarianMTModel, MarianTokenizer
    tok = MarianTokenizer.from_pretrained(MT)
    model = MarianMTModel.from_pretrained(MT)
    out = []
    for s in range(0, len(texts), 32):
        batch = tok(texts[s:s + 32], return_tensors="pt", padding=True, truncation=True)
        gen = model.generate(**batch, num_beams=4, max_new_tokens=64)
        out += tok.batch_decode(gen, skip_special_tokens=True)
    return out


def write(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["text", "lang", "source"])
        w.writerows(rows)


# traducciones que perdieron la forma de pregunta: "what is…" → "lo que es…", o palabras sueltas en inglés
LOST_PREFIX = ("lo que", "lo poco", "lo cual", "lo mucho", "lo bien")
LOST_WORDS = {"what", "how", "is", "are"}


def lost_question(t: str) -> bool:
    n = normalize(t)
    return n.startswith(LOST_PREFIX) or bool(set(n.split()) & LOST_WORDS)


def take_es(pool, start, n, K, social, chunk=40):
    """Recorre pool desde start, traduce por tandas y se queda con las n primeras traducciones que pasan el
    filtro de keys y no perdieron la forma de pregunta. → (filas, índice siguiente, descartes por motivo)"""
    rows, i, drop = [], start, {"key o regla social": 0, "perdió la forma de pregunta": 0}
    while len(rows) < n:
        src = pool[i:i + chunk]
        if not src:
            sys.exit("se acabó el pool de CLINC150")
        for es, (_, sid) in zip(translate([t for t, _ in src]), src):
            i += 1
            if not clean([(es, sid)], K, social):
                drop["key o regla social"] += 1
            elif lost_question(es):
                drop["perdió la forma de pregunta"] += 1
            else:
                rows.append((es, "es", sid))
                if len(rows) == n:
                    break
    return rows, i, drop


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    elia = load_elia()
    K = compile_keys(elia)
    social = elia.get("social", {})
    raw = load_clinc()
    pool = clean(raw, K, social)
    random.Random(SEED).shuffle(pool)
    # el pool barajado se consume en orden y una sola vez: entrenamiento EN, entrenamiento ES, calibración EN,
    # calibración ES → los dos archivos nunca comparten una frase de CLINC150
    en = [(t, "en", sid) for t, sid in pool[:N_EN]]
    es, i, drop_tr = take_es(pool, N_EN, N_ES, K, social)
    rows = en + es
    cal_en = [(t, "en", sid) for t, sid in pool[i:i + N_CAL]]
    cal_es, i, drop_cal = take_es(pool, i + N_CAL, N_CAL, K, social)
    cal = cal_en + cal_es
    shared = {r[2] for r in rows} & {r[2] for r in cal}
    assert not shared, shared
    write(OUT, rows)
    write(CALIB, cal)
    print(f"CLINC150 oos: {len(raw)} frases · {len(pool)} tras el filtro · usadas las {i} primeras del pool barajado")
    for name, rr, path, drop in (("entrenamiento", rows, OUT, drop_tr), ("calibración", cal, CALIB, drop_cal)):
        n_es = sum(r[1] == "es" for r in rr)
        print(f"  {name}: {len(rr) - n_es} EN + {n_es} ES → {path.name} · traducciones descartadas: "
              + ", ".join(f"{k} {v}" for k, v in drop.items()))
    print(f"  fuentes compartidas entre los dos archivos: {len(shared)}")


if __name__ == "__main__":
    main()
