-- Scope generated reports to a sprint instead of only project + week.

ALTER TABLE weekly_reports
    ADD COLUMN IF NOT EXISTS sprint_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_weekly_reports_sprint'
    ) THEN
        ALTER TABLE weekly_reports
            ADD CONSTRAINT fk_weekly_reports_sprint
                FOREIGN KEY (sprint_id)
                    REFERENCES sprints(id)
                    ON DELETE SET NULL;
    END IF;
END $$;

DROP INDEX IF EXISTS uq_weekly_reports_project_week;

CREATE UNIQUE INDEX IF NOT EXISTS uq_weekly_reports_project_sprint
    ON weekly_reports(project_id, sprint_id)
    WHERE sprint_id IS NOT NULL;
