"""
Multi-Task SLA Neural Network (PyTorch) -- v2, 37 features
Shared encoder -> 3 output heads:
  Head 1: Risk Level      (SAFE / MEDIUM / HIGH / CRITICAL)
  Head 2: Penalty Prob    (binary sigmoid)
  Head 3: Recovery Priority (LOW / MEDIUM / HIGH / CRITICAL)
"""
import torch
import torch.nn as nn


class MultiTaskSLAModel(nn.Module):

    INPUT_DIM        = 37
    RISK_CLASSES     = 4
    RECOVERY_CLASSES = 4

    # --- 37 features, 5 groups ---
    FEATURE_COLS = [
        # Group 1: Task State (12)
        "deadline_penalty", "burn_rate_penalty", "blocker_penalty", "workload_penalty",
        "burn_gap", "spi", "days_until_deadline", "overdue_days",
        "estimated_hours", "weight", "priority_encoded", "task_type_encoded",
        # Group 2: Personal + Skill (10)
        "lifetime_ontime_rate", "lifetime_penalty_rate", "total_sprints_participated",
        "ontime_rate_by_task_type", "avg_complexity_completed", "complexity_gap",
        "blocker_rate", "stale_explanation_rate", "recovery_success_rate", "is_new_member",
        # Group 3: Sprint Context (8)
        "sprint_progress_ratio", "days_to_sprint_end", "sprint_team_size",
        "assignee_active_tasks", "sprint_overdue_count", "sprint_high_risk_count",
        "sprint_avg_spi", "team_blocker_count",
        # Group 4: Activity Signal (4)
        "days_since_last_update", "checklist_done_pct", "has_blocker", "commits_last_7d",
        # Group 5: Risk History (3)
        "risk_escalation_count", "previous_plan_count", "times_entered_critical",
    ]

    RISK_LABELS     = ["ON_TRACK", "AT_RISK", "WARNING", "BREACH"]
    RECOVERY_LABELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def __init__(self, dropout: float = 0.3):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(self.INPUT_DIM, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Linear(128, 64),
            nn.ReLU(),
        )
        self.head_risk = nn.Sequential(
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, self.RISK_CLASSES),
        )
        self.head_penalty = nn.Sequential(
            nn.Linear(64, 16), nn.ReLU(),
            nn.Linear(16, 1), nn.Sigmoid(),
        )
        self.head_recovery = nn.Sequential(
            nn.Linear(64, 16), nn.ReLU(),
            nn.Linear(16, self.RECOVERY_CLASSES),
        )

    def forward(self, x):
        shared = self.encoder(x)
        return (
            self.head_risk(shared),
            self.head_penalty(shared).squeeze(-1),
            self.head_recovery(shared),
        )
