"""Pydantic schemas for all ML endpoints."""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from pydantic.alias_generators import to_camel
from typing import Dict, List


# ---------------------------------------------------------------------------
# SLA Risk Prediction
# ---------------------------------------------------------------------------

class SlaRiskRequest(BaseModel):
    # Group 1: Task State
    deadline_penalty: float = Field(0.0, ge=0)
    burn_rate_penalty: float = Field(0.0, ge=0)
    blocker_penalty: float = Field(0.0, ge=0)
    workload_penalty: float = Field(0.0, ge=0)
    burn_gap: float = 0.0
    spi: float = Field(1.0, ge=0)
    days_until_deadline: float = 7.0
    overdue_days: float = Field(0.0, ge=0)
    estimated_hours: float = Field(8.0, gt=0)
    weight: float = Field(1.0, gt=0)
    priority_encoded: int = Field(1, ge=0, le=3)
    task_type_encoded: int = Field(0, ge=0, le=3)

    # Group 2: Personal + Skill
    lifetime_ontime_rate: float = Field(0.7, ge=0, le=1)
    lifetime_penalty_rate: float = Field(0.1, ge=0, le=1)
    total_sprints_participated: int = Field(0, ge=0)
    ontime_rate_by_task_type: float = Field(0.7, ge=0, le=1)
    avg_complexity_completed: float = Field(8.0, gt=0)
    complexity_gap: float = 0.0
    blocker_rate: float = Field(0.1, ge=0, le=1)
    stale_explanation_rate: float = Field(0.1, ge=0, le=1)
    recovery_success_rate: float = Field(0.5, ge=0, le=1)
    is_new_member: int = Field(0, ge=0, le=1)

    # Group 3: Sprint Context
    sprint_progress_ratio: float = Field(0.5, ge=0, le=1)
    days_to_sprint_end: float = Field(7.0, ge=0)
    sprint_team_size: int = Field(4, ge=1)
    assignee_active_tasks: int = Field(3, ge=0)
    sprint_overdue_count: int = Field(0, ge=0)
    sprint_high_risk_count: int = Field(0, ge=0)
    sprint_avg_spi: float = Field(0.9, ge=0)
    team_blocker_count: int = Field(0, ge=0)

    # Group 4: Activity Signal
    days_since_last_update: float = Field(0.0, ge=0)
    checklist_done_pct: float = Field(0.5, ge=0, le=1)
    has_blocker: int = Field(0, ge=0, le=1)
    commits_last_7d: int = Field(0, ge=0)

    # Group 5: Risk History
    risk_escalation_count: int = Field(0, ge=0)
    previous_plan_count: int = Field(0, ge=0)
    times_entered_critical: int = Field(0, ge=0)


class SlaRiskResponse(BaseModel):
    task_id: int | None = None
    risk_level: str
    risk_probabilities: Dict[str, float]
    penalty_probability: float
    recovery_priority: str
    confidence: float
    model_version: str = "v2"


# ---------------------------------------------------------------------------
# Sprint Health Prediction
# ---------------------------------------------------------------------------

class SprintHealthRequest(BaseModel):
    sprint_id: int | None = None
    tasks_done_pct: float = Field(0.5, ge=0, le=1)
    on_time_rate_so_far: float = Field(0.7, ge=0, le=1)
    overdue_count: int = Field(0, ge=0)
    avg_spi: float = Field(0.9, ge=0)
    blocker_count: int = Field(0, ge=0)
    penalty_count: int = Field(0, ge=0)
    team_size: int = Field(4, ge=1)
    capacity_used_pct: float = Field(0.7, ge=0)
    high_risk_tasks: int = Field(0, ge=0)
    avg_assignee_load: float = Field(3.0, ge=0)


class SprintHealthResponse(BaseModel):
    sprint_id: int | None = None
    will_succeed: bool
    success_probability: float
    predicted_completion_rate: float
    health_label: str
    model_version: str = "v1"


# ---------------------------------------------------------------------------
# Anomaly Detection
# ---------------------------------------------------------------------------

class AnomalyRequest(BaseModel):
    user_id: int | None = None
    action_sequence: List[str]


class AnomalyResponse(BaseModel):
    user_id: int | None = None
    is_anomaly: bool
    reconstruction_error: float
    threshold: float
    anomaly_score: float
    model_version: str = "v1"


# ---------------------------------------------------------------------------
# ML Feedback (RLHF)
# ---------------------------------------------------------------------------

class MlFeedbackRequest(BaseModel):
    task_id: int
    prediction_type: str   # SLA_RISK / SPRINT_HEALTH / ANOMALY
    predicted_value: str
    actual_value: str | None = None
    is_correct: bool
    user_id: int | None = None


class MlFeedbackResponse(BaseModel):
    accepted: bool
    message: str


# ---------------------------------------------------------------------------
# RLHF Recovery Plan Signal  (Sprint 4)
# ---------------------------------------------------------------------------

class RecoverySignalRequest(BaseModel):
    plan_id: int
    signal: str                         # APPROVE / REJECT / GATE_RESULT
    gate_result: str | None = None      # PASSED / FAILED (khi signal=GATE_RESULT)
    score_before: int | None = None
    score_after: int | None = None
    reject_reason: str | None = None
    risk_level: str | None = None
    categories: List[str] = []
    summary: str | None = None


class RecoverySignalResponse(BaseModel):
    accepted: bool
    signal_strength: str                # STRONG_POSITIVE / WEAK_POSITIVE / WEAK_NEGATIVE / STRONG_NEGATIVE
    buffer_size: int


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    version: str = "2.0.0"

# ---------------------------------------------------------------------------
# AI Recovery Plan Generation
# ---------------------------------------------------------------------------

class GeneratePlanRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    task_title: str | None = None
    task_description: str | None = None
    task_type: str | None = None
    task_priority: str | None = None
    task_status: str | None = None
    start_date: str | None = None
    deadline: str | None = None
    blocked_reason: str | None = None
    estimated_hours: str | None = None
    actual_hours: str | None = None
    github_issue_url: str | None = None
    current_checklist_items: List[str] = []
    open_checklist_items: List[str] = []
    sub_task_titles: List[str] = []
    risk_level: str | None = None
    categories: List[str] = []
    reasons: List[str] = []
    sla_score: int | None = None
    overdue_days: int = 0
    assignee_active_task_count: int = 0
    previous_plan_count: int = 0
    previous_actions: List[str] = []
    previous_effectiveness: str | None = None
    last_score_before: int | None = None
    last_score_after: int | None = None
    follow_up: bool = False
    member_candidates: List[dict] = []
    ai_provider: str = "ollama"
    ai_model: str = "qwen2.5:14b"
    remaining_hours: float | None = None
    working_hours_until_deadline: float | None = None
    checklist_completion: dict | None = None
    dependencies: List[dict] = []
    assignee_capacity: dict | None = None
    previous_plan_outcomes: List[dict] = []
    evidence_gaps: List[str] = []
    task_facts: List[str] = []

class AiRecoveryAction(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    action_type: str
    action_details: str
    rationale: str
    priority: str
    checklist_items: List[str] = []
    recommended_assignee_id: int | None = None
    recommended_assignee_name: str | None = None

    @field_validator("checklist_items", mode="before")
    @classmethod
    def normalize_checklist_items(cls, value):
        return [] if value is None else value

class RootCauseResponse(BaseModel):
    type: str
    evidence_refs: List[str] = Field(alias="evidenceRefs", default=[])

class CandidatePlan(BaseModel):
    strategy: str
    summary: str
    actions: List[AiRecoveryAction]
    success_condition: str = Field(alias="successCondition")
    fallback_condition: str = Field(alias="fallbackCondition")
    confidence: float

class VerifierResult(BaseModel):
    valid: bool
    violations: List[str] = []

class GeneratePlanResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    root_cause: RootCauseResponse = Field(alias="rootCause")
    selected_plan: CandidatePlan = Field(alias="selectedPlan")
    data_needed: List[str] = Field(alias="dataNeeded", default=[])
    verifier: VerifierResult = Field(alias="verifier")
