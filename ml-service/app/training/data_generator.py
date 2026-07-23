"""
Synthetic data generator -- mimics DevTrack PostgreSQL schema.
Strategy: generate user profiles + sprint contexts first,
then derive task features with realistic correlations.

SLA model: 37 features, 5 groups
  Group 1 - Task State        (12)
  Group 2 - Personal + Skill  (10)
  Group 3 - Sprint Context    ( 8)
  Group 4 - Activity Signal   ( 4)
  Group 5 - Risk History      ( 3)
"""
import numpy as np
import pandas as pd
import random

np.random.seed(42)
random.seed(42)

TASK_TYPES   = ["FEATURE", "BUG", "REVIEW", "OTHER"]
PRIORITIES   = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
PRIORITY_ENC = {p: i for i, p in enumerate(PRIORITIES)}
TYPE_ENC     = {t: i for i, t in enumerate(TASK_TYPES)}

# ---------------------------------------------------------------------------
# 1. USER PROFILES
# ---------------------------------------------------------------------------

def generate_user_profiles(n=5000):
    """
    Generate n user profiles with consistent personal attributes.
    20% new members (< 2 sprints), rest have history.
    """
    rng = np.random.default_rng(42)
    profiles = []

    skill_choices = rng.choice(["weak", "average", "strong"], size=n, p=[0.20, 0.50, 0.30])

    for skill in skill_choices:
        if skill == "weak":
            ontime      = float(rng.beta(2, 6))          # 0.15 - 0.45
            penalty_r   = float(rng.beta(4, 4))          # 0.3 - 0.6
            blocker_r   = float(rng.beta(3, 5))
            avg_complex = float(rng.uniform(2, 12))
            recovery_sr = float(rng.beta(2, 5))
            stale_r     = float(rng.beta(4, 4))
            n_sprints   = int(rng.integers(0, 12))
        elif skill == "average":
            ontime      = float(rng.beta(5, 3))          # 0.45 - 0.75
            penalty_r   = float(rng.beta(2, 6))
            blocker_r   = float(rng.beta(2, 6))
            avg_complex = float(rng.uniform(6, 24))
            recovery_sr = float(rng.beta(4, 4))
            stale_r     = float(rng.beta(2, 6))
            n_sprints   = int(rng.integers(1, 20))
        else:  # strong
            ontime      = float(rng.beta(8, 2))          # 0.70 - 0.95
            penalty_r   = float(rng.beta(1, 9))
            blocker_r   = float(rng.beta(1, 8))
            avg_complex = float(rng.uniform(10, 40))
            recovery_sr = float(rng.beta(7, 2))
            stale_r     = float(rng.beta(1, 8))
            n_sprints   = int(rng.integers(3, 30))

        # ontime rate per task type (slight variation around lifetime rate)
        ontime_by_type = {
            i: float(np.clip(ontime + rng.normal(0, 0.08), 0.02, 0.98))
            for i in range(4)
        }

        # new member flag
        is_new = 1 if n_sprints < 2 else 0

        profiles.append({
            "skill":                    skill,
            "lifetime_ontime_rate":     float(np.clip(ontime, 0.02, 0.98)),
            "lifetime_penalty_rate":    float(np.clip(penalty_r, 0.01, 0.95)),
            "total_sprints_participated": n_sprints,
            "is_new_member":            is_new,
            "avg_complexity_completed": avg_complex,
            "blocker_rate":             float(np.clip(blocker_r, 0.01, 0.90)),
            "stale_explanation_rate":   float(np.clip(stale_r, 0.01, 0.90)),
            "recovery_success_rate":    float(np.clip(recovery_sr, 0.02, 0.98)),
            "ontime_by_type":           ontime_by_type,
        })

    return profiles


# ---------------------------------------------------------------------------
# 2. SPRINT CONTEXTS
# ---------------------------------------------------------------------------

def generate_sprint_contexts(n=500):
    """
    Generate n sprint-level contexts with correlated stress signals.
    """
    rng = np.random.default_rng(123)
    sprints = []

    stress_choices = rng.choice(["calm", "normal", "stressed"], size=n, p=[0.20, 0.50, 0.30])

    for stress in stress_choices:
        if stress == "calm":
            avg_spi       = float(rng.uniform(0.90, 1.30))
            overdue_cnt   = int(rng.integers(0, 3))
            high_risk_cnt = int(rng.integers(0, 2))
            blocker_cnt   = int(rng.integers(0, 2))
        elif stress == "normal":
            avg_spi       = float(rng.uniform(0.70, 1.10))
            overdue_cnt   = int(rng.integers(1, 7))
            high_risk_cnt = int(rng.integers(1, 5))
            blocker_cnt   = int(rng.integers(0, 4))
        else:  # stressed
            avg_spi       = float(rng.uniform(0.40, 0.82))
            overdue_cnt   = int(rng.integers(4, 15))
            high_risk_cnt = int(rng.integers(4, 12))
            blocker_cnt   = int(rng.integers(2, 8))

        progress      = float(rng.uniform(0.0, 1.0))
        days_to_end   = float(np.clip(rng.uniform(0, 14) * (1.1 - progress), 0, 14))

        sprints.append({
            "stress":               stress,
            "sprint_progress_ratio": progress,
            "days_to_sprint_end":   days_to_end,
            "sprint_team_size":     int(rng.integers(3, 9)),
            "sprint_overdue_count": overdue_cnt,
            "sprint_high_risk_count": high_risk_cnt,
            "sprint_avg_spi":       avg_spi,
            "team_blocker_count":   blocker_cnt,
        })

    return sprints


# ---------------------------------------------------------------------------
# 3. RISK LABEL (correlated to all 5 groups)
# ---------------------------------------------------------------------------

def _compute_risk_label(row):
    """
    Compute raw_risk [0,1] from 5 feature groups then bucket to 4 classes.
    """
    # --- Group 1: Task State ---
    deadline_pressure = np.clip(row["overdue_days"] / 7.0, 0, 1)
    days_left         = row["days_until_deadline"]
    urgency           = np.clip(1.0 - days_left / 21.0, 0, 1) if days_left >= 0 else 1.0
    penalty_load      = np.clip(
        (row["deadline_penalty"] + row["burn_rate_penalty"] + row["blocker_penalty"]) / 30.0, 0, 1)
    spi_stress        = np.clip(1.0 - row["spi"], 0, 1)
    task_score = (0.35 * deadline_pressure + 0.25 * urgency
                  + 0.25 * penalty_load + 0.15 * spi_stress)

    # --- Group 2: Personal + Skill ---
    reliability_gap = 1.0 - row["lifetime_ontime_rate"]
    type_fit_gap    = 1.0 - row["ontime_rate_by_task_type"]
    skill_gap_norm  = np.clip(row["complexity_gap"] / 20.0, -0.5, 0.5) + 0.5
    new_penalty     = 0.15 * row["is_new_member"]
    personal_score  = (0.35 * reliability_gap + 0.28 * type_fit_gap
                       + 0.22 * skill_gap_norm + 0.10 * row["blocker_rate"]
                       + 0.05 * row["stale_explanation_rate"] + new_penalty)
    personal_score  = np.clip(personal_score, 0, 1)

    # --- Group 3: Sprint Context ---
    spi_sprint   = np.clip(1.0 - row["sprint_avg_spi"], 0, 1)
    risk_density = np.clip(row["sprint_high_risk_count"] / 12.0, 0, 1)
    overdue_load = np.clip(row["sprint_overdue_count"] / 15.0, 0, 1)
    end_pressure = np.clip(1.0 - row["days_to_sprint_end"] / 14.0, 0, 1)
    assignee_load = np.clip(row["assignee_active_tasks"] / 10.0, 0, 1)
    sprint_score = (0.25 * spi_sprint + 0.25 * risk_density + 0.20 * overdue_load
                    + 0.20 * end_pressure + 0.10 * assignee_load)

    # --- Group 4: Activity Signal ---
    inactivity    = np.clip(row["days_since_last_update"] / 7.0, 0, 1)
    checklist_gap = 1.0 - row["checklist_done_pct"]
    activity_score = (0.45 * inactivity + 0.30 * checklist_gap
                      + 0.25 * row["has_blocker"])

    # --- Group 5: Risk History ---
    escalation = np.clip(row["risk_escalation_count"] / 5.0, 0, 1)
    plan_hist  = np.clip(row["previous_plan_count"] / 4.0, 0, 1)
    crit_hist  = np.clip(row["times_entered_critical"] / 3.0, 0, 1)
    history_score = 0.40 * escalation + 0.30 * plan_hist + 0.30 * crit_hist

    # --- Weighted combination ---
    raw = (0.30 * task_score + 0.25 * personal_score + 0.20 * sprint_score
           + 0.15 * activity_score + 0.10 * history_score)

    noise = np.random.normal(0, 0.04)
    raw   = float(np.clip(raw + noise, 0.0, 1.0))

    if raw < 0.25:
        return raw, "ON_TRACK", 0
    elif raw < 0.50:
        return raw, "AT_RISK", 1
    elif raw < 0.75:
        return raw, "WARNING", 2
    else:
        return raw, "BREACH", 3


# ---------------------------------------------------------------------------
# 4. MAIN SLA DATA GENERATOR  (37 features)
# ---------------------------------------------------------------------------

def generate_sla_decision_logs(n=50000, n_users=5000, n_sprints=500):
    """
    Generate n SLA training samples from user profiles + sprint contexts.
    Returns DataFrame with 37 feature columns + label columns.
    """
    rng = np.random.default_rng(99)

    print(f"  Generating {n_users} user profiles...")
    user_profiles = generate_user_profiles(n_users)

    print(f"  Generating {n_sprints} sprint contexts...")
    sprint_contexts = generate_sprint_contexts(n_sprints)

    # Team average ontime (for new member fallback)
    team_avg_ontime = float(np.mean([u["lifetime_ontime_rate"] for u in user_profiles]))
    team_avg_penalty = float(np.mean([u["lifetime_penalty_rate"] for u in user_profiles]))
    team_avg_blocker = float(np.mean([u["blocker_rate"] for u in user_profiles]))
    team_avg_complex = float(np.mean([u["avg_complexity_completed"] for u in user_profiles]))

    # Target class distribution: ON_TRACK=20%, AT_RISK=35%, WARNING=30%, BREACH=15%
    TARGET_DIST = [("ON_TRACK", 0.20), ("AT_RISK", 0.35), ("WARNING", 0.30), ("BREACH", 0.15)]

    # Feature biases per target class
    CLASS_BIAS = {
        "ON_TRACK": {
            "days_until": (10, 28), "overdue_days_max": 0.5,
            "spi": (0.95, 1.40), "burn_gap": (0.0, 0.40),
            "penalty_scale": 0.3, "user_skill": "strong",
            "days_stale_max": 1.5, "checklist_min": 0.7,
            "risk_esc_lambda": 0.2,
        },
        "AT_RISK": {
            "days_until": (2, 14), "overdue_days_max": 2.0,
            "spi": (0.75, 1.05), "burn_gap": (-0.20, 0.15),
            "penalty_scale": 0.7, "user_skill": "average",
            "days_stale_max": 3.0, "checklist_min": 0.4,
            "risk_esc_lambda": 0.8,
        },
        "WARNING": {
            "days_until": (-3, 6), "overdue_days_max": 5.0,
            "spi": (0.55, 0.85), "burn_gap": (-0.45, -0.05),
            "penalty_scale": 1.4, "user_skill": "weak",
            "days_stale_max": 6.0, "checklist_min": 0.1,
            "risk_esc_lambda": 2.0,
        },
        "BREACH": {
            "days_until": (-14, -4), "overdue_days_max": 14.0,
            "spi": (0.25, 0.45), "burn_gap": (-0.65, -0.40),
            "penalty_scale": 3.2, "user_skill": "weak",
            "days_stale_max": 12.0, "checklist_min": 0.0,
            "risk_esc_lambda": 4.5,
        },
    }

    print(f"  Building {n} training samples (stratified by class)...")
    rows = []

    for target_class, ratio in TARGET_DIST:
        n_class = int(n * ratio)
        bias    = CLASS_BIAS[target_class]

        # Pick matching user pool
        if bias["user_skill"] == "strong":
            pool = [u for u in user_profiles if u["skill"] == "strong"] or user_profiles
        elif bias["user_skill"] == "weak":
            pool = [u for u in user_profiles if u["skill"] == "weak"] or user_profiles
        else:
            pool = user_profiles

        # Pick matching sprint pool
        sprint_stress_map = {"ON_TRACK": "calm", "AT_RISK": "normal",
                             "WARNING": "stressed", "BREACH": "stressed"}
        target_stress = sprint_stress_map[target_class]
        sprint_pool = [s for s in sprint_contexts if s["stress"] == target_stress] or sprint_contexts

        for _ in range(n_class):
            user   = random.choice(pool)
            sprint = random.choice(sprint_pool)

            # --- Task type + priority ---
            task_type_idx = int(rng.integers(0, 4))
            priority_idx  = int(rng.choice([0, 1, 2, 3], p=[0.15, 0.35, 0.35, 0.15]))

            # --- Group 1: Task State (biased by target class) ---
            d_lo, d_hi  = bias["days_until"]
            days_until  = float(rng.uniform(d_lo, d_hi))
            overdue_days = float(max(0.0, -days_until) + rng.uniform(0, bias["overdue_days_max"]))
            spi_lo, spi_hi = bias["spi"]
            spi         = float(rng.uniform(spi_lo, spi_hi))
            bg_lo, bg_hi = bias["burn_gap"]
            burn_gap    = float(rng.uniform(bg_lo, bg_hi))
            estimated_hours = float(rng.uniform(1, 42))
            weight      = float(rng.uniform(0.5, 3.0))
            ps          = bias["penalty_scale"]

            deadline_penalty  = float(max(0, rng.normal(6 * ps, 2.5) if overdue_days > 0 else rng.uniform(0, 1.5)))
            burn_rate_penalty = float(max(0, rng.normal(5 * ps, 2.0) if burn_gap < -0.1 else rng.uniform(0, 1.0)))
            blocker_penalty   = float(max(0, rng.normal(7 * ps, 2.5)) if rng.random() < user["blocker_rate"] else 0.0)
            workload_penalty  = float(max(0, rng.normal(4 * ps, 1.5)) if rng.random() < 0.30 else 0.0)

            # --- Group 2: Personal + Skill ---
            is_new = user["is_new_member"]
            if is_new:
                lifetime_ontime  = team_avg_ontime
                lifetime_penalty = team_avg_penalty
                total_sprints    = user["total_sprints_participated"]
                ontime_by_type   = team_avg_ontime
                avg_complex      = team_avg_complex
                blocker_r        = team_avg_blocker
                stale_r          = 0.20
                recovery_sr      = 0.50
            else:
                lifetime_ontime  = user["lifetime_ontime_rate"]
                lifetime_penalty = user["lifetime_penalty_rate"]
                total_sprints    = user["total_sprints_participated"]
                ontime_by_type   = user["ontime_by_type"][task_type_idx]
                avg_complex      = user["avg_complexity_completed"]
                blocker_r        = user["blocker_rate"]
                stale_r          = user["stale_explanation_rate"]
                recovery_sr      = user["recovery_success_rate"]

            complexity_gap = float(estimated_hours - avg_complex)

            # --- Group 3: Sprint Context ---
            assignee_active = int(rng.integers(1, 12))

            # --- Group 4: Activity Signal ---
            days_stale    = float(np.clip(rng.exponential(1.0 + bias["days_stale_max"] * 0.5), 0, 14))
            checklist_pct = float(np.clip(bias["checklist_min"] + rng.uniform(0, 1 - bias["checklist_min"]), 0, 1))
            has_blocker   = int(rng.random() < (blocker_r + (0.5 if target_class == "BREACH" else 0)))
            commits_7d    = int(max(0, rng.poisson(0.3 if has_blocker or days_stale > 4 else 2.5)))

            # --- Group 5: Risk History ---
            risk_esc   = int(np.clip(rng.poisson(bias["risk_esc_lambda"]), 0, 8))
            prev_plans = int(np.clip(rng.poisson(0.5 + risk_esc * 0.4), 0, 6))
            times_crit = int(np.clip(rng.poisson(risk_esc * 0.35), 0, 5))

            row = {
                "deadline_penalty":     deadline_penalty,
                "burn_rate_penalty":    burn_rate_penalty,
                "blocker_penalty":      blocker_penalty,
                "workload_penalty":     workload_penalty,
                "burn_gap":             burn_gap,
                "spi":                  spi,
                "days_until_deadline":  days_until,
                "overdue_days":         overdue_days,
                "estimated_hours":      estimated_hours,
                "weight":               weight,
                "priority_encoded":     priority_idx,
                "task_type_encoded":    task_type_idx,
                "lifetime_ontime_rate":       lifetime_ontime,
                "lifetime_penalty_rate":      lifetime_penalty,
                "total_sprints_participated": total_sprints,
                "ontime_rate_by_task_type":   ontime_by_type,
                "avg_complexity_completed":   avg_complex,
                "complexity_gap":             complexity_gap,
                "blocker_rate":               blocker_r,
                "stale_explanation_rate":     stale_r,
                "recovery_success_rate":      recovery_sr,
                "is_new_member":              is_new,
                "sprint_progress_ratio":   sprint["sprint_progress_ratio"],
                "days_to_sprint_end":      sprint["days_to_sprint_end"],
                "sprint_team_size":        sprint["sprint_team_size"],
                "assignee_active_tasks":   assignee_active,
                "sprint_overdue_count":    sprint["sprint_overdue_count"],
                "sprint_high_risk_count":  sprint["sprint_high_risk_count"],
                "sprint_avg_spi":          sprint["sprint_avg_spi"],
                "team_blocker_count":      sprint["team_blocker_count"],
                "days_since_last_update": days_stale,
                "checklist_done_pct":     checklist_pct,
                "has_blocker":            has_blocker,
                "commits_last_7d":        commits_7d,
                "risk_escalation_count":  risk_esc,
                "previous_plan_count":    prev_plans,
                "times_entered_critical": times_crit,
            }

            _, final_label, final_idx = _compute_risk_label(row)

            penalty_logit = (deadline_penalty + burn_rate_penalty) / 10.0 - 1.0
            penalty_prob  = 1.0 / (1.0 + np.exp(-penalty_logit * 2))
            penalty_label = int(rng.random() < penalty_prob)

            recovery_priority = int(np.clip(final_idx, 0, 3))

            row["risk_level"]        = final_label
            row["risk_level_idx"]    = final_idx
            row["penalty_label"]     = penalty_label
            row["recovery_priority"] = recovery_priority
            rows.append(row)

    # Shuffle
    random.shuffle(rows)
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 5. SPRINT HEALTH DATA (unchanged structure, scale up slightly)
# ---------------------------------------------------------------------------

def generate_sprint_completion_data(n=1000):
    """Simulate SprintCompletionSummary for Sprint Health Predictor."""
    rng = np.random.default_rng(77)
    rows = []

    for _ in range(n):
        team_size    = int(rng.integers(2, 9))
        total_tasks  = int(rng.integers(8, 42))
        completed    = int(rng.integers(0, total_tasks + 1))
        on_time      = int(rng.integers(0, completed + 1))
        overdue_cnt  = int(rng.integers(0, total_tasks - completed + 3))
        blocker_cnt  = int(rng.integers(0, 6))
        penalized    = int(rng.integers(0, max(1, overdue_cnt + 1)))
        capacity_h   = float(rng.uniform(40, 200))
        hours_used   = float(rng.uniform(20, capacity_h * 1.2))
        avg_spi      = float(np.clip(rng.normal(0.85, 0.20), 0.30, 1.40))
        high_risk    = int(rng.integers(0, 9))
        avg_load     = float(rng.uniform(2, 11))

        completion_rate = completed / total_tasks
        on_time_rate    = on_time / max(1, completed)
        will_succeed    = 1 if completion_rate > 0.80 else 0

        rows.append({
            "tasks_done_pct":    completion_rate,
            "on_time_rate_so_far": on_time_rate,
            "overdue_count":     overdue_cnt,
            "avg_spi":           avg_spi,
            "blocker_count":     blocker_cnt,
            "penalty_count":     penalized,
            "team_size":         team_size,
            "capacity_used_pct": hours_used / capacity_h,
            "high_risk_tasks":   high_risk,
            "avg_assignee_load": avg_load,
            "completion_rate":   completion_rate,
            "on_time_rate":      on_time_rate,
            "will_succeed":      will_succeed,
        })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 6. AUDIT SEQUENCES (unchanged)
# ---------------------------------------------------------------------------

def generate_audit_sequences(n_users=300, seq_len=20):
    """Simulate AuditLog sequences for LSTM Autoencoder."""
    actions = [
        "LOGIN", "LOGOUT", "TASK_VIEW", "TASK_CREATE", "TASK_UPDATE",
        "TASK_STATUS_UPDATED", "BUG_VIEW", "BUG_CREATE", "SPRINT_VIEW",
        "REQUIREMENT_VIEW", "REQUIREMENT_UPDATE", "PROJECT_VIEW",
        "COMMENT_CREATE", "FILE_UPLOAD", "REPORT_VIEW",
        "TASK_DELETE", "BULK_STATUS_UPDATE", "MEMBER_INVITE",
        "SPRINT_COMPLETE", "EVIDENCE_UPLOAD",
    ]
    action_to_idx = {a: i for i, a in enumerate(actions)}
    n_actions = len(actions)

    normal_patterns = [
        ["LOGIN", "PROJECT_VIEW", "TASK_VIEW", "TASK_UPDATE", "TASK_STATUS_UPDATED", "LOGOUT"],
        ["LOGIN", "SPRINT_VIEW", "TASK_VIEW", "TASK_VIEW", "COMMENT_CREATE", "LOGOUT"],
        ["LOGIN", "REQUIREMENT_VIEW", "REQUIREMENT_UPDATE", "BUG_VIEW", "LOGOUT"],
        ["LOGIN", "TASK_CREATE", "TASK_UPDATE", "FILE_UPLOAD", "LOGOUT"],
    ]
    anomaly_patterns = [
        ["LOGIN"] + ["TASK_STATUS_UPDATED"] * 15 + ["LOGOUT"] * 4,
        ["LOGIN", "TASK_DELETE", "TASK_DELETE", "TASK_DELETE",
         "BULK_STATUS_UPDATE", "BULK_STATUS_UPDATE"] + ["LOGOUT"] * 14,
        ["LOGIN"] + ["MEMBER_INVITE"] * 10 + ["PROJECT_VIEW"] * 9 + ["LOGOUT"],
    ]

    normal_seqs, anomaly_seqs = [], []

    for _ in range(n_users):
        base = random.choice(normal_patterns)
        seq  = (base * 4)[:seq_len]
        normal_seqs.append([action_to_idx[a] for a in seq])

    for _ in range(n_users // 5):
        base = random.choice(anomaly_patterns)
        seq  = (base * 2)[:seq_len]
        anomaly_seqs.append([action_to_idx[a] for a in seq])

    return (np.array(normal_seqs), np.array(anomaly_seqs), action_to_idx, n_actions)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== Generating SLA training data (37 features, 50k samples) ===")
    sla_df = generate_sla_decision_logs(50000, n_users=5000, n_sprints=500)
    print(f"  {len(sla_df)} rows | Risk distribution:")
    print(sla_df["risk_level"].value_counts().to_string())
    sla_df.to_csv("data_sla_v2.csv", index=False)

    print("\n=== Generating Sprint data ===")
    sprint_df = generate_sprint_completion_data(1000)
    print(f"  {len(sprint_df)} rows | Success rate: {sprint_df['will_succeed'].mean():.1%}")

    print("\n=== Generating Audit sequences ===")
    normal_seqs, anomaly_seqs, _, n_act = generate_audit_sequences(300)
    print(f"  {len(normal_seqs)} normal, {len(anomaly_seqs)} anomaly | vocab={n_act}")

    print("\nDone.")
