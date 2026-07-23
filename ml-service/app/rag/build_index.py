"""
Build FAISS index từ synthetic recovery plans.
Chạy: python -m app.rag.build_index

Khi có DB thực: thay synthetic_plans() bằng SQLAlchemy query trực tiếp.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

import random
import numpy as np
from app.rag.faiss_store import build_index

RISK_LEVELS  = ["AT_RISK", "WARNING", "BREACH"]
CATEGORIES   = [
    "DEADLINE_PRESSURE", "BLOCKER_ISSUE", "BURNRATE_HIGH",
    "WORKLOAD_OVERLOAD", "INACTIVITY", "SPRINT_PRESSURE",
    "SKILL_GAP", "SCOPE_CREEP",
]
ACTION_TYPES = [
    "NOTIFY_ASSIGNEE", "ESCALATE_LEADER", "ASK_BLOCKER_UPDATE",
    "CREATE_RECOVERY_CHECKLIST", "SCHEDULE_FOLLOW_UP",
    "SUGGEST_SPLIT_TASK", "SUGGEST_REASSIGN",
]

rng = np.random.default_rng(42)
random.seed(42)


def synthetic_plans(n: int = 500) -> list[dict]:
    plans = []
    for _ in range(n):
        risk       = random.choice(RISK_LEVELS)
        cats       = random.sample(CATEGORIES, k=random.randint(1, 3))
        acts       = random.sample(ACTION_TYPES, k=random.randint(1, 3))
        s_before   = int(rng.integers(20, 60))
        improvement = int(rng.integers(10, 45))
        s_after    = min(100, s_before + improvement)
        summary    = (
            f"Recovery plan for {risk} task with issues: {', '.join(cats)}. "
            f"Actions taken: {', '.join(acts)}. "
            f"Score improved from {s_before} to {s_after}."
        )
        plans.append({
            "risk_level":   risk,
            "categories":   cats,
            "actions":      acts,
            "summary":      summary,
            "score_before": s_before,
            "score_after":  s_after,
            "improvement":  improvement,
            "gate_result":  "PASSED",
        })
    return plans


if __name__ == "__main__":
    print("Building FAISS index from 500 synthetic recovery plans...")
    plans = synthetic_plans(500)
    build_index(plans)
    print("Done. Bundle saved to saved_models/faiss_bundle.pkl (index bytes + plan metadata)")
