"""Async FAISS retraining endpoints - POST /train/trigger, GET /train/status"""
import logging
import os
import threading
from datetime import datetime

import joblib
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

log = logging.getLogger(__name__)
router = APIRouter(prefix="/train", tags=["Training"])

MIN_SIGNALS = 50

_training_status: dict = {
    "running":       False,
    "last_run":      None,
    "signals_used":  0,
    "plans_added":   0,
}
_lock = threading.Lock()


class TrainStatusResponse(BaseModel):
    running: bool
    last_run: str | None
    signals_used: int
    plans_added: int
    buffer_size: int
    strong_positive_signals: int
    ready_to_retrain: bool


class TrainTriggerResponse(BaseModel):
    triggered: bool
    reason: str | None = None
    signals_in_buffer: int | None = None
    strong_positive_signals: int | None = None


@router.get("/status", response_model=TrainStatusResponse)
def get_training_status():
    from app.model_loader import get_registry, strong_positive_count
    reg = get_registry()
    strong_count = strong_positive_count(reg.feedback_buffer)
    return TrainStatusResponse(
        running=_training_status["running"],
        last_run=_training_status["last_run"],
        signals_used=_training_status["signals_used"],
        plans_added=_training_status["plans_added"],
        buffer_size=len(reg.feedback_buffer),
        strong_positive_signals=strong_count,
        ready_to_retrain=strong_count >= MIN_SIGNALS,
    )


@router.post("/trigger", response_model=TrainTriggerResponse)
def trigger_retrain(background_tasks: BackgroundTasks):
    from app.model_loader import get_registry, strong_positive_count
    reg = get_registry()
    strong_count = strong_positive_count(reg.feedback_buffer)

    if _training_status["running"]:
        return TrainTriggerResponse(triggered=False, reason="Training already running")

    if strong_count < MIN_SIGNALS:
        return TrainTriggerResponse(
            triggered=False,
            reason=f"Need {MIN_SIGNALS} STRONG_POSITIVE signals, have {strong_count}",
            signals_in_buffer=len(reg.feedback_buffer),
            strong_positive_signals=strong_count,
        )

    background_tasks.add_task(_rebuild_faiss_index, reg)
    return TrainTriggerResponse(
        triggered=True,
        signals_in_buffer=len(reg.feedback_buffer),
        strong_positive_signals=strong_count,
    )


def _rebuild_faiss_index(reg) -> None:
    """
    Rebuild FAISS index by adding STRONG_POSITIVE signals to the current index.
    Runs in a background thread and does not block the API.
    """
    from app.model_loader import archive_and_clear_feedback_buffer
    from app.rag.faiss_store import build_index

    with _lock:
        _training_status["running"] = True
        try:
            positive = [
                s for s in reg.feedback_buffer
                if s.get("strength") == "STRONG_POSITIVE"
                and s.get("improvement", 0) >= 15
            ]

            if not positive:
                log.info("No STRONG_POSITIVE signals to add - skipping rebuild.")
                return

            new_plans = [
                {
                    "risk_level":   s.get("risk_level", "WARNING"),
                    "categories":   s.get("categories", []),
                    "actions":      [],
                    "summary":      s.get("summary", ""),
                    "score_before": max(0, s.get("improvement", 0)),
                    "score_after":  max(0, s.get("improvement", 0) + 15),
                    "improvement":  s.get("improvement", 0),
                    "gate_result":  "PASSED",
                }
                for s in positive
            ]

            from app.rag.faiss_store import BUNDLE_PATH
            existing = joblib.load(BUNDLE_PATH)["plans"] if os.path.exists(BUNDLE_PATH) else []
            all_plans = existing + new_plans
            build_index(all_plans)

            archive_path = archive_and_clear_feedback_buffer(reg)
            _training_status["signals_used"] += len(positive)
            _training_status["plans_added"]  += len(new_plans)
            _training_status["last_run"]      = datetime.now().isoformat()

            log.info(
                "FAISS rebuilt: +%d new plans -> total=%d; archived feedback to %s",
                len(new_plans),
                len(all_plans),
                archive_path,
            )

        except Exception as e:
            log.error("FAISS retraining failed: %s", e)
        finally:
            _training_status["running"] = False
