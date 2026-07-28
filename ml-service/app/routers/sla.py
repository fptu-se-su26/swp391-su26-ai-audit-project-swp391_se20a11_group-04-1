"""SLA Risk Prediction endpoint."""
import numpy as np
import torch
from fastapi import APIRouter, HTTPException

from app.schemas import SlaRiskRequest, SlaRiskResponse
from app.model_loader import get_registry
from app.models.sla_multitask import MultiTaskSLAModel

router = APIRouter(prefix="/predict", tags=["SLA"])

RISK_LABELS     = MultiTaskSLAModel.RISK_LABELS
RECOVERY_LABELS = MultiTaskSLAModel.RECOVERY_LABELS
FEATURE_COLS    = MultiTaskSLAModel.FEATURE_COLS


@router.post("/sla-risk", response_model=SlaRiskResponse)
def predict_sla_risk(req: SlaRiskRequest):
    reg = get_registry()

    if reg.sla_model is None or reg.sla_scaler is None:
        raise HTTPException(503, "SLA model not loaded")

    # Build feature vector in correct order
    features = np.array([[getattr(req, col) for col in FEATURE_COLS]], dtype=np.float32)

    # Scale
    features_scaled = reg.sla_scaler.transform(features).astype(np.float32)

    # Inference
    with torch.no_grad():
        x = torch.tensor(features_scaled)
        risk_logits, penalty_prob, recovery_logits = reg.sla_model(x)

        risk_probs    = torch.softmax(risk_logits, dim=1).squeeze().tolist()
        penalty_val   = float(penalty_prob.item())
        recovery_idx  = int(recovery_logits.argmax(dim=1).item())
        risk_idx      = int(risk_logits.argmax(dim=1).item())
        confidence    = float(max(risk_probs))

    return SlaRiskResponse(
        task_id=None,
        risk_level=RISK_LABELS[risk_idx],
        risk_probabilities={label: round(prob, 4) for label, prob in zip(RISK_LABELS, risk_probs)},
        penalty_probability=round(penalty_val, 4),
        recovery_priority=RECOVERY_LABELS[recovery_idx],
        confidence=round(confidence, 4),
    )
