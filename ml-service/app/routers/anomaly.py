"""Anomaly Detection endpoint."""
import torch
from fastapi import APIRouter, HTTPException

from app.schemas import AnomalyRequest, AnomalyResponse
from app.model_loader import get_registry

router = APIRouter(prefix="/detect", tags=["Anomaly"])


@router.post("/anomaly", response_model=AnomalyResponse)
def detect_anomaly(req: AnomalyRequest):
    reg = get_registry()

    if reg.anomaly_model is None or reg.anomaly_meta is None:
        raise HTTPException(503, "Anomaly model not loaded")

    meta          = reg.anomaly_meta
    action_to_idx = meta["action_to_idx"]
    seq_len       = meta["seq_len"]
    threshold     = meta["threshold"]
    mean_err      = meta.get("mean_error", 0.0)
    std_err       = meta.get("std_error", 1.0)

    # Encode action sequence
    encoded = []
    for action in req.action_sequence:
        idx = action_to_idx.get(action.upper())
        if idx is None:
            # Unknown action is itself suspicious — map to last known index + 1 (OOV)
            idx = len(action_to_idx) - 1
        encoded.append(idx)

    # Pad or truncate to seq_len
    if len(encoded) < seq_len:
        encoded = encoded + [0] * (seq_len - len(encoded))
    else:
        encoded = encoded[:seq_len]

    x = torch.tensor([encoded], dtype=torch.long)

    with torch.no_grad():
        error = float(reg.anomaly_model.reconstruction_error(x).item())

    # Normalize to 0-1 anomaly score
    anomaly_score = float(min(1.0, max(0.0, (error - mean_err) / (std_err * 3 + 1e-8))))
    is_anomaly    = error > threshold

    return AnomalyResponse(
        user_id=req.user_id,
        is_anomaly=is_anomaly,
        reconstruction_error=round(error, 6),
        threshold=round(threshold, 6),
        anomaly_score=round(anomaly_score, 4),
    )
