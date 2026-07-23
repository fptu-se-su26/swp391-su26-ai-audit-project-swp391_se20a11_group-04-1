"""Sprint Health Prediction endpoint."""
import numpy as np
from fastapi import APIRouter, HTTPException

from app.schemas import SprintHealthRequest, SprintHealthResponse
from app.model_loader import get_registry

router = APIRouter(prefix="/predict", tags=["Sprint"])

FEATURE_COLS = [
    "tasks_done_pct", "on_time_rate_so_far", "overdue_count",
    "avg_spi", "blocker_count", "penalty_count", "team_size",
    "capacity_used_pct", "high_risk_tasks", "avg_assignee_load",
]


def _health_label(success_prob: float, completion_rate: float) -> str:
    if success_prob >= 0.80:
        return "HEALTHY"
    elif success_prob >= 0.55:
        return "AT_RISK"
    elif success_prob >= 0.30:
        return "STRUGGLING"
    return "BREACH"


@router.post("/sprint-health", response_model=SprintHealthResponse)
def predict_sprint_health(req: SprintHealthRequest):
    reg = get_registry()

    if reg.sprint_bundle is None:
        raise HTTPException(503, "Sprint model not loaded")

    clf = reg.sprint_bundle["classifier"]
    reg_model = reg.sprint_bundle["regressor"]

    features = np.array([[getattr(req, col) for col in FEATURE_COLS]])

    success_prob      = float(clf.predict_proba(features)[0][1])
    completion_rate   = float(np.clip(reg_model.predict(features)[0], 0.0, 1.0))
    will_succeed      = success_prob >= 0.50

    return SprintHealthResponse(
        sprint_id=req.sprint_id,
        will_succeed=will_succeed,
        success_probability=round(success_prob, 4),
        predicted_completion_rate=round(completion_rate, 4),
        health_label=_health_label(success_prob, completion_rate),
    )
