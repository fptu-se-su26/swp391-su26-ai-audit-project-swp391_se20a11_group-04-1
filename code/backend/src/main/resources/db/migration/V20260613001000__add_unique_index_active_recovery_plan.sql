CREATE UNIQUE INDEX IF NOT EXISTS uk_active_recovery_plan_per_task
ON recovery_plans(project_id, task_id)
WHERE status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTING');
