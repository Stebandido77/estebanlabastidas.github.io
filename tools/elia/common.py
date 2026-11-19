"""Piezas compartidas de EL·IA: normalización, features con hashing y carga de datos.

La extracción de features DEBE ser idéntica a la de js/apps/elia.js. Si cambias algo aquí,
cambia también el JS y corre tools/elia/test_parity.mjs.

Especificación (la misma en Python y en JS):
  1. normalize(text): minúsculas → "m&a" / "m & a" pasan a "mna" → NFD → quitar marcas diacríticas (U+0300–U+036F) →
     todo lo que no sea [a-z0-9] pasa a espacio → colapsar espacios y recortar.
     Así "¿Qué es EL·IA?" → "que es el ia" y "ñ" → "n".
  2. tokens(norm):
       palabras:   "w:" + palabra                        (1-gramas)
                   "b:" + palabra + " " + siguiente      (2-gramas)
       caracteres: "c:" + s[i:i+n] para n = 3, 4, 5 sobre s = " " + norm + " "
                   (los espacios marcan los bordes de palabra; incluye n-gramas entre palabras)
  3. Hash: FNV-1a de 32 bits sobre los bytes UTF-8 del token
       h = 0x811C9DC5; por cada byte b: h ^= b; h = (h * 0x01000193) mod 2^32
     índice = h mod DIM (DIM = 4096). Tras normalizar, todo es ASCII: bytes = caracteres.
  4. Valor: conteo por índice → log(1 + conteo) → normalización L2 (vector cero si no hay tokens).
"""
from __future__ import annotations

import csv
import re
import json
import subprocess
import unicodedata
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).resolve().parent / "data"
QUESTIONS = DATA / "questions.csv"
CONTENT = ROOT / "assets" / "data" / "content.js"

DIM = 4096
CHAR_N = (3, 4, 5)
FNV_OFFSET, FNV_PRIME = 0x811C9DC5, 0x01000193


MNA = re.compile(r"(?<![a-z0-9])m[ \t]*&[ \t]*a(?![a-z0-9])")   # "m&a", "M & A" → token mna


def normalize(text: str) -> str:
    t = MNA.sub(" mna ", text.lower())   # antes de quitar la puntuación, para que "&" no lo parta
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if not ("̀" <= c <= "ͯ"))
    out = [c if ("a" <= c <= "z" or "0" <= c <= "9") else " " for c in t]
    return " ".join("".join(out).split())


def tokens(norm: str) -> list[str]:
    words = norm.split()
    toks = ["w:" + w for w in words]
    toks += ["b:" + a + " " + b for a, b in zip(words, words[1:])]
    if norm:
        s = " " + norm + " "
        for n in CHAR_N:
            toks += ["c:" + s[i:i + n] for i in range(len(s) - n + 1)]
    return toks


def fnv1a(s: str) -> int:
    h = FNV_OFFSET
    for b in s.encode("utf-8"):
        h ^= b
        h = (h * FNV_PRIME) & 0xFFFFFFFF
    return h


def featurize(text: str) -> np.ndarray:
    v = np.zeros(DIM, dtype=np.float64)
    for t in tokens(normalize(text)):
        v[fnv1a(t) % DIM] += 1.0
    v = np.log1p(v)
    n = np.linalg.norm(v)
    return v / n if n > 0 else v


"""Capa de palabras clave y reglas (la misma especificación en js/elia-net.js)
  Coincidencia de una frase: sus palabras normalizadas aparecen seguidas en la pregunta. Cada palabra
  debe ser igual, empezar por la del key si esta tiene ≥ 6 letras (contactar → contactarte), o, si
  las dos tienen ≥ 5 letras, estar a distancia de Levenshtein ≤ 1.

  forced_intent(text, K, social) → intención o None (se responde/rechaza sin red):
    1. regla social (abajo) → greeting | goodbye | thanks;
    2. si no, una frase de oosCues.hard → out_of_scope (EL·IA nunca responde: ofrece el correo).

  key_intent(text, K) → (intención, "strong" | "weak") o (None, None):
    1. Si aparece alguna frase de oosCues (soft o hard) → (None, None): decide solo la red.
    2. Si hay keys fuertes ("keys") de exactamente una intención → (esa, "strong").
       Si son de dos o más → (None, None).
    3. Si no hay fuertes y hay débiles ("weak") de exactamente una intención → (esa, "weak").
       Si son de dos o más → (None, None).

  social_intent(text, social) → greeting | goodbye | thanks | None:
    el mensaje normalizado tiene ≤ 4 palabras y se puede cubrir de izquierda a derecha solo con frases
    de las listas (en cada posición, la frase más larga primero; coincidencia exacta) y palabras de
    relleno ("filler"), usando frases de exactamente una de las tres listas.
"""
KEY_FUZZY_MIN = 5
KEY_PREFIX_MIN = 6
SOCIAL_MAX_TOKENS = 4
SOCIAL_INTENTS = ("greeting", "goodbye", "thanks")
OOS_ID = "out_of_scope"


def near(a: str, b: str) -> bool:
    """a = palabra del key, b = palabra de la pregunta. Coinciden si son iguales; si b empieza por a y a
    tiene ≥ 6 letras (conjugaciones y pronombres pegados: contactar → contactarte, contratar →
    contratarlo); o si las dos tienen ≥ 5 letras y están a distancia de Levenshtein ≤ 1."""
    if a == b:
        return True
    if len(a) >= KEY_PREFIX_MIN and b.startswith(a):
        return True
    if len(a) < KEY_FUZZY_MIN or len(b) < KEY_FUZZY_MIN or abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    s, l = (a, b) if len(a) < len(b) else (b, a)
    i = 0
    while i < len(s) and s[i] == l[i]:
        i += 1
    return s[i:] == l[i + 1:]


def phrases(lst) -> list[list[str]]:
    return [k for k in (normalize(x).split() for x in lst) if k]


def key_phrases(lst) -> list[tuple[list[str], bool]]:
    """Keys de una intención → [(palabras, exacto)]. Un key que empieza con "=" ("=resume") es exacto:
    cada palabra debe ser idéntica, sin distancia de una letra ni prefijo."""
    out = []
    for x in lst:
        exact = x.startswith("=")
        w = normalize(x[1:] if exact else x).split()
        if w:
            out.append((w, exact))
    return out


def contains(q: list[str], kt: list[str], exact: bool = False) -> bool:
    n = len(kt)
    eq = (lambda a, b: a == b) if exact else near
    return any(all(eq(kt[j], q[s + j]) for j in range(n)) for s in range(len(q) - n + 1))


PROMOTE_PRECISION, PROMOTE_MIN = 0.95, 3


def compile_keys(elia: dict, promoted: dict | None = None) -> dict:
    """elia = DATA.elia → {"strong": [(id, [(palabras, exacto)])], "weak": […], "hard": frases, "soft": frases}.
    promoted = {intención: [keys de "weak" que actúan como fuertes]} (ver promote_keys)."""
    cues = elia.get("oosCues", {})
    out = {"strong": [], "weak": [], "hard": phrases(cues.get("hard", [])), "soft": phrases(cues.get("soft", []))}
    promoted = promoted or {}
    for it in elia["intents"]:
        up = set(promoted.get(it["id"], []))
        strong = list(it.get("keys", [])) + [k for k in it.get("weak", []) if k in up]
        weak = [k for k in it.get("weak", []) if k not in up]
        for kind, lst in (("strong", strong), ("weak", weak)):
            ks = key_phrases(lst)
            if ks:
                out[kind].append((it["id"], ks))
    return out


def promote_keys(elia: dict, texts: list[str], labels: list[str]) -> dict:
    """Keys débiles que los datos de entrenamiento muestran exclusivos de su intención: se activan en
    ≥ PROMOTE_MIN preguntas y, de esas, una fracción ≥ PROMOTE_PRECISION es de la propia intención.
    Solo con las preguntas escritas a mano que se le pasen (en la validación cruzada, las del pliegue
    de entrenamiento), nunca con variantes ni plantillas. → {intención: [keys]}"""
    qs = [normalize(t).split() for t in texts]
    out = {}
    for it in elia["intents"]:
        for k in it.get("weak", []):
            (w, ex), = key_phrases([k]) or [(None, None)]
            if not w:
                continue
            hits = [lab for q, lab in zip(qs, labels) if contains(q, w, ex)]
            if len(hits) >= PROMOTE_MIN and hits.count(it["id"]) / len(hits) >= PROMOTE_PRECISION:
                out.setdefault(it["id"], []).append(k)
    return out


def key_hits(text: str, compiled_list) -> list[str]:
    q = normalize(text).split()
    return [iid for iid, keys in compiled_list if any(contains(q, kt, ex) for kt, ex in keys)]


def key_intent(text: str, K: dict):
    q = normalize(text).split()
    if any(contains(q, c) for c in K["hard"] + K["soft"]):
        return None, None
    for kind in ("strong", "weak"):
        hits = key_hits(text, K[kind])
        if len(hits) == 1:
            return hits[0], kind
        if hits:
            return None, None
    return None, None


def social_intent(text: str, social: dict):
    q = normalize(text).split()
    if not q or len(q) > SOCIAL_MAX_TOKENS:
        return None
    lists = [(iid, sorted(phrases(social.get(iid, [])), key=len, reverse=True)) for iid in SOCIAL_INTENTS]
    filler = {w for p in phrases(social.get("filler", [])) for w in p}
    found, i = set(), 0
    while i < len(q):
        best = None
        for iid, ps in lists:
            m = next((p for p in ps if q[i:i + len(p)] == p), None)
            if m and (best is None or len(m) > len(best[1])):
                best = (iid, m)
        if best:
            found.add(best[0])
            i += len(best[1])
        elif q[i] in filler:
            i += 1
        else:
            return None
    return found.pop() if len(found) == 1 else None


def forced_intent(text: str, K: dict, social: dict):
    s = social_intent(text, social)
    if s:
        return s
    q = normalize(text).split()
    return OOS_ID if any(contains(q, c) for c in K["hard"]) else None


def featurize_many(texts) -> np.ndarray:
    return np.stack([featurize(t) for t in texts]) if len(texts) else np.zeros((0, DIM))


def load_questions(path: Path = QUESTIONS) -> list[dict]:
    with open(path, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r["how"] = int(r["how"])
    return rows


def load_elia() -> dict:
    """Lee DATA.elia de content.js con Node (el archivo es JS con comentarios, no JSON)."""
    js = ("global.window={};require(process.argv[1]);"
          "process.stdout.write(JSON.stringify(window.DATA.elia))")
    out = subprocess.run(["node", "-e", js, str(CONTENT)], capture_output=True, check=True)
    return json.loads(out.stdout.decode("utf-8"))
