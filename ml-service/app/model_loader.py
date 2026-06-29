"""
Load all ML models at startup. Singleton pattern — loaded once, reused forever.
"""
import os
import joblib
import torch
import logging

from app.models.sla_multitask import MultiTaskSLAModel
from app.models.lstm_autoencoder import LSTMAutoencoder

log = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../saved_models")


class ModelRegistry:
    sla_model:     MultiTaskSLAModel | None = None
    sla_scaler:    object | None = None
    sprint_bundle: dict | None = None
    anomaly_model: LSTMAutoencoder | None = None
    anomaly_meta:  dict | None = None

    # Sprint 4: RAG
    faiss_index:   object | None = None   # faiss.Index
    plan_metadata: list = []              # list of plan dicts

    # RLHF feedback buffer (in-memory)
    feedback_buffer: list = []


def load_all() -> ModelRegistry:
    reg = ModelRegistry()

    # --- SLA Multi-Task Model v2 ---
    sla_path    = os.path.join(MODELS_DIR, "sla_multitask_v2.pt")
    scaler_path = os.path.join(MODELS_DIR, "sla_scaler_v2.pkl")
    if os.path.exists(sla_path) and os.path.exists(scaler_path):
        reg.sla_model = MultiTaskSLAModel()
        reg.sla_model.load_state_dict(
            torch.load(sla_path, map_location="cpu", weights_only=True))
        reg.sla_model.eval()
        reg.sla_scaler = joblib.load(scaler_path)
        log.info("SLA model v2 loaded.")
    else:
        log.warning("SLA model v2 not found at %s", sla_path)

    # --- Sprint Health XGBoost ---
    sprint_path = os.path.join(MODELS_DIR, "sprint_predictor_v1.pkl")
    if os.path.exists(sprint_path):
        reg.sprint_bundle = joblib.load(sprint_path)
        log.info("Sprint predictor v1 loaded.")
    else:
        log.warning("Sprint predictor not found at %s", sprint_path)

    # --- LSTM Autoencoder (Anomaly) ---
    anomaly_pt   = os.path.join(MODELS_DIR, "lstm_autoencoder_v1.pt")
    anomaly_meta = os.path.join(MODELS_DIR, "anomaly_meta.pkl")
    if os.path.exists(anomaly_pt) and os.path.exists(anomaly_meta):
        reg.anomaly_meta  = joblib.load(anomaly_meta)
        reg.anomaly_model = LSTMAutoencoder(vocab_size=reg.anomaly_meta["vocab_size"])
        reg.anomaly_model.load_state_dict(
            torch.load(anomaly_pt, map_location="cpu", weights_only=True))
        reg.anomaly_model.eval()
        log.info("Anomaly model v1 loaded. Threshold=%.4f", reg.anomaly_meta["threshold"])
    else:
        log.warning("Anomaly model not found at %s", anomaly_pt)

    # --- FAISS Recovery Index (Sprint 4) ---
    bundle_path = os.path.join(MODELS_DIR, "faiss_bundle.pkl")
    if os.path.exists(bundle_path):
        try:
            import faiss
            import numpy as np
            bundle = joblib.load(bundle_path)
            reg.faiss_index   = faiss.deserialize_index(
                np.frombuffer(bundle["index_bytes"], dtype=np.uint8))
            reg.plan_metadata = bundle["plans"]
            log.info("FAISS recovery index loaded: %d plans", reg.faiss_index.ntotal)
        except Exception as e:
            log.warning("Failed to load FAISS index: %s", e)
    else:
        log.warning("FAISS index not found — run: python -m app.rag.build_index")

    return reg


# Global singleton
_registry: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = load_all()
    return _registry
