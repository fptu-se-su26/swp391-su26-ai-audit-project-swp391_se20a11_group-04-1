-- audit_logs: add project_id for tenant-scoped audit queries
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS project_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);

-- v_member_ai_features: flat view joining member performance + SLA data for AI training
CREATE OR REPLACE VIEW v_member_ai_features AS
SELECT
    wrm.id                                              AS member_report_id,
    wr.project_id,
    wr.sprint_id,
    wrm.user_id,
    wr.report_week_start,
    wr.report_week_end,
    wrm.total_assigned_count,
    wrm.completed_on_time_count,
    CASE
        WHEN wrm.total_assigned_count = 0 THEN NULL
        ELSE ROUND(wrm.completed_on_time_count::NUMERIC / wrm.total_assigned_count * 100, 2)
    END                                                 AS completion_rate_pct,
    wrm.overdue_task_count,
    wrm.penalized_task_count,
    wrm.stale_explanation_count,
    wrm.risk_level,
    wrm.ai_score,
    wrm.ai_comment,
    (SELECT AVG(s.current_score)
     FROM task_sla_states s
     WHERE s.assignee_id = wrm.user_id
       AND s.sprint_id   = wr.sprint_id)                AS avg_sla_score,
    (SELECT COUNT(*)
     FROM task_sla_states s
     WHERE s.assignee_id           = wrm.user_id
       AND s.sprint_id             = wr.sprint_id
       AND s.predicted_risk_level IN ('HIGH', 'CRITICAL')) AS predicted_at_risk_count,
    (SELECT COUNT(*)
     FROM task_sla_states s
     WHERE s.assignee_id        = wrm.user_id
       AND s.sprint_id          = wr.sprint_id
       AND s.prediction_accurate = true)                AS predictions_accurate_count
FROM weekly_report_members wrm
JOIN weekly_reports wr ON wrm.weekly_report_id = wr.id;
