"""Piezas compartidas de EL·IA: normalización, features con hashing y carga de datos.

La extracción de features DEBE ser idéntica a la de js/apps/elia.js. Si cambias algo aquí,
cambia también el JS y corre tools/elia/test_parity.mjs.

Especificación (la misma en Python y en JS):
  1. normalize(text): minúsculas → NFD → quitar marcas diacríticas (U+0300–U+036F) →
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


def normalize(text: str) -> str:
    t = unicodedata.normalize("NFD", text.lower())
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
