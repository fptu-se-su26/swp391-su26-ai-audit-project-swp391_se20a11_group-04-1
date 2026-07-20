from typing import Dict

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="DevTrack ML Service", version="0.1.0")


class SlaRiskRequest(BaseModel):
    deadline_penalty: float = 0
    burn_rate_penalty: float = 0
    blocker_penalty: float = 0
    workload_penalty: float = 0
    burn_gap: float = 0
    spi: float = 1
    days_until_deadline: float = 999
    overdue_days: float = 0
    estimated_hours: float = 0
    weight: float = 1
    priority_encoded: int = 0
    task_type_encoded: int = 0


class SlaRiskResponse(BaseModel):
    risk_level: str
    risk_probabilities: Dict[str, float] = Field(default_factory=dict)
    penalty_probability: float = 0
    recovery_priority: str = "LOW"
    confidence: float = 0.5
    model_version: str = "rule-fallback-v0"


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": False, "mode": "rule-fallback"}


@app.post("/predict/sla-risk", response_model=SlaRiskResponse)
def predict_sla_risk(request: SlaRiskRequest) -> SlaRiskResponse:
    penalty = (
        request.deadline_penalty
        + request.burn_rate_penalty
        + request.blocker_penalty
        + request.workload_penalty
    )
    score = max(0, min(100, 100 - penalty))

    if score <= 20:
        risk = "CRITICAL"
        priority = "CRITICAL"
        confidence = 0.82
    elif score <= 45:
        risk = "HIGH"
        priority = "HIGH"
        confidence = 0.74
    elif score <= 75:
        risk = "MEDIUM"
        priority = "MEDIUM"
        confidence = 0.64
    elif score < 100:
        risk = "LOW"
        priority = "LOW"
        confidence = 0.58
    else:
        risk = "NORMAL"
        priority = "LOW"
        confidence = 0.9

    return SlaRiskResponse(
        risk_level=risk,
        risk_probabilities={risk: confidence},
        penalty_probability=max(0, min(1, penalty / 100)),
        recovery_priority=priority,
        confidence=confidence,
    )
