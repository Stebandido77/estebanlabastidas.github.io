"""Embeddings del profesor para la destilación (SOLO entrenamiento; el navegador nunca lo usa).

  py -3.12 tools/elia/embed.py textos.json salida.npy

Lee una lista JSON de textos y escribe una matriz float32 [n, d] con los embeddings normalizados de
intfloat/multilingual-e5-base (prefijo "query: ", como recomienda el modelo). Corre sin conexión, con
el modelo ya descargado en la caché de Hugging Face (HF_HUB_OFFLINE=1). Necesita sentence-transformers
y torch; por eso train.py lo llama con otro intérprete (por defecto `py -3.12`).

Guarda una caché en tools/elia/.cache/ (ignorada por git) para no recalcular textos ya vistos.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import numpy as np  # noqa: E402

MODEL = "intfloat/multilingual-e5-base"
CACHE = Path(__file__).resolve().parent / ".cache" / "e5-base.npz"


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    texts = json.loads(src.read_text(encoding="utf-8"))
    keys = [hashlib.sha1(t.encode("utf-8")).hexdigest() for t in texts]
    cache = {}
    if CACHE.exists():
        z = np.load(CACHE)
        cache = dict(zip(z["keys"].tolist(), z["emb"]))
    todo = sorted({(k, t) for k, t in zip(keys, texts) if k not in cache})
    if todo:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL, device="cpu")
        emb = model.encode(["query: " + t for _, t in todo], batch_size=64, normalize_embeddings=True,
                           show_progress_bar=False, convert_to_numpy=True).astype(np.float32)
        for (k, _), e in zip(todo, emb):
            cache[k] = e
        CACHE.parent.mkdir(exist_ok=True)
        ks = list(cache)
        np.savez(CACHE, keys=np.array(ks), emb=np.stack([cache[k] for k in ks]))
    np.save(dst, np.stack([cache[k] for k in keys]).astype(np.float32))
    print(f"{len(texts)} textos · {len(todo)} nuevos · {MODEL}", file=sys.stderr)


if __name__ == "__main__":
    main()
