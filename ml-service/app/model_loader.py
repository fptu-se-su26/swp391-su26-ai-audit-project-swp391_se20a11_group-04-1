"""
Load all ML models at startup. Singleton pattern — loaded once, reused forever.
"""
import os
import json
import joblib
import torch
import logging
from datetime import datetime
from pathlib import Path

from app.models.sla_multitask import MultiTaskSLAModel
from app.models.lstm_autoencoder import LSTMAutoencoder

log = logging.getLogger(__name__)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../saved_models"))
FEEDBACK_BUFFER_PATH = os.getenv(
    "FEEDBACK_BUFFER_PATH",
    os.path.join(MODELS_DIR, "feedback_buffer.jsonl"),
)
FEEDBACK_ARCHIVE_DIR = os.getenv(
    "FEEDBACK_ARCHIVE_DIR",
    os.path.join(MODELS_DIR, "feedback_archive"),
)


class ModelRegistry:
    sla_model:     MultiTaskSLAModel | None = None
    sla_scaler:    object | None = None
    sprint_bundle: dict | None = None
    anomaly_model: LSTMAutoencoder | None = None
    anomaly_meta:  dict | None = None

    # Sprint 4: RAG
    faiss_index:   object | None = None   # faiss.Index
    plan_metadata: list = []              # list of plan dicts

    # RLHF feedback buffer. Loaded from JSONL at startup and mirrored on write.
    feedback_buffer: list = []


def _ensure_feedback_dirs() -> None:
    Path(FEEDBACK_BUFFER_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(FEEDBACK_ARCHIVE_DIR).mkdir(parents=True, exist_ok=True)


def load_feedback_buffer() -> list:
    _ensure_feedback_dirs()
    if not os.path.exists(FEEDBACK_BUFFER_PATH):
        return []

    entries: list = []
    with open(FEEDBACK_BUFFER_PATH, "r", encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, 1):
            raw = line.strip()
            if not raw:
                continue
            try:
                entries.append(json.loads(raw))
            except json.JSONDecodeError:
                log.warning("Skipping invalid feedback JSONL line %d in %s", line_no, FEEDBACK_BUFFER_PATH)
    return entries


def persist_feedback_buffer(entries: list) -> None:
    _ensure_feedback_dirs()
    tmp_path = f"{FEEDBACK_BUFFER_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        for entry in entries:
            fh.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")
    os.replace(tmp_path, FEEDBACK_BUFFER_PATH)


def append_feedback_entry(reg: ModelRegistry, entry: dict) -> None:
    _ensure_feedback_dirs()
    reg.feedback_buffer.append(entry)
    with open(FEEDBACK_BUFFER_PATH, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")


def _numeric_improvement(entry: dict) -> float:
    try:
        return float(entry.get("improvement") or 0)
    except (TypeError, ValueError):
        return 0


def strong_positive_count(entries: list) -> int:
    return sum(
        1
        for entry in entries
        if entry.get("strength") == "STRONG_POSITIVE"
        and _numeric_improvement(entry) >= 15
    )


def archive_and_clear_feedback_buffer(reg: ModelRegistry, reason: str = "faiss_rebuild") -> str | None:
    if not reg.feedback_buffer:
        persist_feedback_buffer([])
        return None

    _ensure_feedback_dirs()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = os.path.join(FEEDBACK_ARCHIVE_DIR, f"{reason}_{timestamp}.jsonl")
    with open(archive_path, "w", encoding="utf-8") as fh:
        for entry in reg.feedback_buffer:
            fh.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")

    reg.feedback_buffer.clear()
    persist_feedback_buffer([])
    return archive_path


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

    # --- Persistent RLHF Feedback Buffer ---
    try:
        reg.feedback_buffer = load_feedback_buffer()
        log.info(
            "RLHF feedback buffer loaded: %d entries (%d strong positive)",
            len(reg.feedback_buffer),
            strong_positive_count(reg.feedback_buffer),
        )
    except Exception as e:
        reg.feedback_buffer = []
        log.warning("Failed to load RLHF feedback buffer: %s", e)

    return reg


# Global singleton
_registry: ModelRegistry | None = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = load_all()
    return _registry
