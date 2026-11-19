"""Aumentación de datos para EL·IA y validación del dataset.

Las variantes SOLO se usan para entrenar: train.py las genera dentro de cada pliegue a partir de
las preguntas de entrenamiento de ese pliegue, así que una variante nunca cae en validación.

Transformaciones (cada variante aplica 1 o 2 al azar):
  - sin tildes            "qué es pulso"   → "que es pulso"
  - minúsculas            "Qué es ABI"     → "qué es abi"
  - typo de teclado       una letra por una vecina en QWERTY ("pulso" → "pilso")
  - borrar una letra      "calypso"        → "calpso"
  - duplicar una letra    "andina"         → "anddina"
  - sinónimo              de la lista SYN (por palabra completa)

Uso:
  python tools/elia/augment.py            valida questions.csv contra content.js y muestra conteos
  python tools/elia/augment.py --demo     además imprime variantes de ejemplo
"""
from __future__ import annotations

import random
import re
import sys
import unicodedata
from collections import Counter, defaultdict

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from common import load_elia, load_questions  # noqa: E402

ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"]
NEIGH: dict[str, str] = {}
for r, row in enumerate(ROWS):
    for c, ch in enumerate(row):
        near = []
        for dr in (-1, 0, 1):
            rr = r + dr
            if 0 <= rr < len(ROWS):
                for dc in (-1, 0, 1):
                    cc = c + dc
                    if (dr or dc) and 0 <= cc < len(ROWS[rr]):
                        near.append(ROWS[rr][cc])
        NEIGH[ch] = "".join(near)

# Sinónimos pequeños, por palabra completa, en los dos sentidos dentro de cada grupo.
SYN_GROUPS = [
    ["qué es", "que es", "q es", "qué significa"],
    ["cómo", "como", "de qué forma"],
    ["hiciste", "construiste", "armaste", "desarrollaste"],
    ["usaste", "utilizaste"],
    ["proyecto", "proyecto personal"],
    ["paper", "artículo", "articulo", "investigación"],
    ["háblame de", "cuéntame de", "cuéntame sobre", "explícame"],
    ["tienes", "tiene"],
    ["what is", "what's", "whats"],
    ["how did you build", "how did you make", "how did you create"],
    ["tell me about", "explain", "what about"],
    ["paper", "article", "study"],
    ["project", "side project"],
    ["you", "u"],
]


def strip_accents(s: str) -> str:
    """Quita tildes y diéresis; la ñ también pasa a n, como cuando se escribe sin teclado español."""
    return "".join(c for c in unicodedata.normalize("NFD", s) if not ("̀" <= c <= "ͯ"))


def _letters(s: str) -> list[int]:
    return [i for i, c in enumerate(s) if c.isalpha()]


def typo(s: str, rng: random.Random) -> str:
    idx = [i for i in _letters(s) if s[i].lower() in NEIGH]
    if not idx:
        return s
    i = rng.choice(idx)
    return s[:i] + rng.choice(NEIGH[s[i].lower()]) + s[i + 1:]


def drop(s: str, rng: random.Random) -> str:
    idx = _letters(s)
    if len(idx) < 4:
        return s
    i = rng.choice(idx)
    return s[:i] + s[i + 1:]


def double(s: str, rng: random.Random) -> str:
    idx = _letters(s)
    if not idx:
        return s
    i = rng.choice(idx)
    return s[:i] + s[i] + s[i:]


def synonym(s: str, rng: random.Random) -> str:
    low = s.lower()
    cands = [(g, w) for g in SYN_GROUPS for w in g
             if re.search(r"(?<!\w)" + re.escape(w) + r"(?!\w)", low)]
    if not cands:
        return s
    g, w = rng.choice(cands)
    alt = rng.choice([x for x in g if x != w])
    return re.sub(r"(?<!\w)" + re.escape(w) + r"(?!\w)", alt, low, count=1)


OPS = [strip_accents, str.lower, typo, drop, double, synonym]


def variants(text: str, n: int, rng: random.Random) -> list[str]:
    """n variantes distintas del texto original (pueden salir menos si es muy corto)."""
    out, seen = [], {text}
    for _ in range(n * 6):
        if len(out) >= n:
            break
        v = text
        for op in rng.sample(OPS, rng.choice((1, 2))):
            v = op(v, rng) if op in (typo, drop, double, synonym) else op(v)
        if v not in seen and v.strip():
            seen.add(v)
            out.append(v)
    return out


def check() -> int:
    elia = load_elia()
    rows = load_questions()
    ids = [i["id"] for i in elia["intents"]]
    has_how = {i["id"] for i in elia["intents"] if i.get("how")}
    errors = []
    unknown = sorted({r["intent"] for r in rows} - set(ids))
    if unknown:
        errors.append(f"intenciones en el CSV que no están en content.js: {unknown}")
    by = defaultdict(list)
    for r in rows:
        by[r["intent"]].append(r)
        if r["lang"] not in ("es", "en"):
            errors.append(f"lang inválido: {r}")
        if r["how"] not in (0, 1):
            errors.append(f"how inválido: {r}")
        if r["intent"] == "out_of_scope" and r["how"]:
            errors.append(f"out_of_scope con how=1: {r['text']}")
    for i in ids:
        if len(by[i]) < 5:
            errors.append(f"{i}: solo {len(by[i])} preguntas (mínimo 5)")
    dup = [t for t, c in Counter(r["text"].lower() for r in rows).items() if c > 1]
    if dup:
        errors.append(f"preguntas duplicadas: {dup}")
    lang = Counter(r["lang"] for r in rows)
    how = sum(r["how"] for r in rows)
    how_no_field = sorted({r["intent"] for r in rows if r["how"] and r["intent"] not in has_how})
    print(f"{len(rows)} preguntas · {len(ids)} intenciones · es={lang['es']} en={lang['en']} · how=1: {how}")
    print(f"min/max por intención: {min(len(by[i]) for i in ids)}/{max(len(by[i]) for i in ids)}")
    if how_no_field:
        print(f"aviso: how=1 en intenciones sin campo 'how' (se mostrará 'a'): {how_no_field}")
    for e in errors:
        print("ERROR:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    code = check()
    if "--demo" in sys.argv:
        rng = random.Random(7)
        for t in ["qué stack usaste en andina", "How did you build pulso", "cómo construiste el motor de SA-CCR"]:
            print(t, "→", variants(t, 5, rng))
    sys.exit(code)
