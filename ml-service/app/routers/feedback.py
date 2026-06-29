"""RLHF Recovery Plan signal endpoint — POST /feedback/signal"""
import logging
import threading
from fastapi import APIRouter, BackgroundTasks

from app.schemas import RecoverySignalRequest, RecoverySignalResponse
from app.model_loader import get_registry

log = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["RLHF"])

MIN_SIGNALS_TO_AUTO_RETRAIN = 50


def _classify_signal(req: RecoverySignalRequest) -> str:
    """Map approve/reject/gate events to signal strength."""
    if req.signal == "REJECT":
        return "STRONG_NEGATIVE"

    if req.signal == "GATE_RESULT":
        improvement = (req.score_after or 0) - (req.score_before or 0)
        if req.gate_result == "PASSED" and improvement >= 15:
            return "STRONG_POSITIVE"
        if req.gate_result == "PASSED":
            return "WEAK_POSITIVE"
        return "WEAK_NEGATIVE"   # gate FAILED

    if req.signal == "APPROVE":
        return "WEAK_POSITIVE"   # chưa biết effectiveness, chờ gate result

    return "WEAK_POSITIVE"


@router.post("/signal", response_model=RecoverySignalResponse)
def receive_recovery_signal(req: RecoverySignalRequest,
                             background_tasks: BackgroundTasks):
    reg = get_registry()
    strength = _classify_signal(req)

    entry = {
        "plan_id":       req.plan_id,
        "signal":        req.signal,
        "strength":      strength,
        "gate_result":   req.gate_result,
        "improvement":   (req.score_after or 0) - (req.score_before or 0),
        "reject_reason": req.reject_reason,
        "risk_level":    req.risk_level,
        "categories":    req.categories,
        "summary":       req.summary,
    }
    reg.feedback_buffer.append(entry)

    log.info("RLHF signal: plan=%s signal=%s strength=%s improvement=%s",
             req.plan_id, req.signal, strength, entry["improvement"])

    # Auto-trigger FAISS rebuild khi buffer đủ lớn
    if len(reg.feedback_buffer) >= MIN_SIGNALS_TO_AUTO_RETRAIN:
        from app.routers.training import _rebuild_faiss_index, _training_status
        if not _training_status["running"]:
            background_tasks.add_task(_rebuild_faiss_index, reg)
            log.info("Auto-triggered FAISS retraining (buffer=%d)", len(reg.feedback_buffer))

    return RecoverySignalResponse(
        accepted=True,
        signal_strength=strength,
        buffer_size=len(reg.feedback_buffer),
    )
