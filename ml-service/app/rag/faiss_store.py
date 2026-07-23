"""Build and search FAISS index over past PASSED recovery plans.

Note: faiss.write_index/read_index cannot handle non-ASCII paths on Windows.
We use faiss.serialize_index / deserialize_index (bytes) + joblib instead.
"""
import os
import joblib
import logging
import numpy as np

log = logging.getLogger(__name__)

MODELS_DIR  = os.path.join(os.path.dirname(__file__), "../../saved_models")
BUNDLE_PATH = os.path.join(MODELS_DIR, "faiss_bundle.pkl")   # single file: index bytes + plans


def build_index(plans: list[dict]) -> None:
    """
    Embed all plans and store FAISS IndexFlatL2 as serialized bytes alongside plan metadata.
    Uses a single joblib bundle to avoid FAISS C++ Unicode path issues on Windows.
    """
    import faiss
    from app.rag.embedder import embed_batch

    os.makedirs(MODELS_DIR, exist_ok=True)
    texts   = [_plan_to_text(p) for p in plans]
    vectors = embed_batch(texts).astype(np.float32)

    dim   = vectors.shape[1]    # 384 for all-MiniLM-L6-v2
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)

    # Serialize index to bytes — avoids faiss C++ file I/O with Unicode paths
    index_bytes = faiss.serialize_index(index).tobytes()
    bundle = {"index_bytes": index_bytes, "plans": plans, "dim": dim}
    joblib.dump(bundle, BUNDLE_PATH)
    log.info("FAISS index built: %d plans, dim=%d → %s", len(plans), dim, BUNDLE_PATH)


def search_similar(query_text: str, k: int = 3) -> list[dict]:
    """Return top-k most similar plans. Returns [] if index not built yet."""
    import faiss
    from app.rag.embedder import embed_batch

    if not os.path.exists(BUNDLE_PATH):
        log.warning("FAISS bundle not found — run: python -m app.rag.build_index")
        return []

    bundle = joblib.load(BUNDLE_PATH)
    index  = faiss.deserialize_index(np.frombuffer(bundle["index_bytes"], dtype=np.uint8))
    plans  = bundle["plans"]

    q_vec    = embed_batch([query_text]).astype(np.float32)
    k_actual = min(k, index.ntotal)
    distances, indices = index.search(q_vec, k_actual)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(plans):
            continue
        plan = dict(plans[idx])
        plan["similarity"] = round(float(1.0 / (1.0 + dist)), 4)
        results.append(plan)
    return results


def _plan_to_text(p: dict) -> str:
    cats = ", ".join(p.get("categories", []))
    acts = ", ".join(p.get("actions", []))
    return (
        f"{p.get('risk_level', '')} {cats} {acts} "
        f"score_before={p.get('score_before', 0)} "
        f"score_after={p.get('score_after', 0)}"
    )
