CREATE UNIQUE INDEX IF NOT EXISTS uk_active_sla_analysis_job_per_sprint
ON sla_analysis_jobs(project_id, sprint_id)
WHERE status IN ('PENDING', 'RUNNING');
