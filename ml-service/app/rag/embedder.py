"""Singleton sentence-transformers embedder — all-MiniLM-L6-v2 (80MB, CPU-friendly)."""
from sentence_transformers import SentenceTransformer
import numpy as np

_model: SentenceTransformer | None = None


def get_embedder() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def embed(text: str) -> np.ndarray:
    return get_embedder().encode(text, convert_to_numpy=True)


def embed_batch(texts: list[str]) -> np.ndarray:
    return get_embedder().encode(texts, convert_to_numpy=True, batch_size=32)
