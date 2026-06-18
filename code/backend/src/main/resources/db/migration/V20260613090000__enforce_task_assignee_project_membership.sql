-- Enforce that task assignees always belong to the same project as the task.
-- This protects manual SQL/seed data as well as API writes.

DELETE FROM task_assignees ta
USING tasks t
WHERE ta.task_id = t.id
  AND NOT EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = t.project_id
        AND pm.user_id = ta.user_id
  );

UPDATE tasks t
SET primary_assignee_id = NULL
WHERE t.primary_assignee_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = t.project_id
        AND pm.user_id = t.primary_assignee_id
  );

CREATE OR REPLACE FUNCTION enforce_task_primary_assignee_project_member()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.primary_assignee_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = NEW.project_id
          AND pm.user_id = NEW.primary_assignee_id
    ) THEN
        RAISE EXCEPTION
            'Task primary assignee % must be a member of project %',
            NEW.primary_assignee_id,
            NEW.project_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_task_primary_assignee_project_member ON tasks;
CREATE TRIGGER trg_enforce_task_primary_assignee_project_member
BEFORE INSERT OR UPDATE OF project_id, primary_assignee_id ON tasks
FOR EACH ROW
EXECUTE FUNCTION enforce_task_primary_assignee_project_member();

CREATE OR REPLACE FUNCTION enforce_task_assignee_project_member()
RETURNS TRIGGER AS $$
DECLARE
    task_project_id BIGINT;
BEGIN
    SELECT t.project_id
    INTO task_project_id
    FROM tasks t
    WHERE t.id = NEW.task_id;

    IF task_project_id IS NULL THEN
        RAISE EXCEPTION 'Task % does not exist', NEW.task_id
            USING ERRCODE = '23503';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = task_project_id
          AND pm.user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION
            'Task assignee % must be a member of project %',
            NEW.user_id,
            task_project_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_task_assignee_project_member ON task_assignees;
CREATE TRIGGER trg_enforce_task_assignee_project_member
BEFORE INSERT OR UPDATE OF task_id, user_id ON task_assignees
FOR EACH ROW
EXECUTE FUNCTION enforce_task_assignee_project_member();

CREATE OR REPLACE FUNCTION cleanup_task_assignments_for_removed_project_member()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tasks
    SET primary_assignee_id = NULL
    WHERE project_id = OLD.project_id
      AND primary_assignee_id = OLD.user_id;

    DELETE FROM task_assignees ta
    USING tasks t
    WHERE ta.task_id = t.id
      AND t.project_id = OLD.project_id
      AND ta.user_id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_task_assignments_for_removed_project_member ON project_members;
CREATE TRIGGER trg_cleanup_task_assignments_for_removed_project_member
BEFORE DELETE ON project_members
FOR EACH ROW
EXECUTE FUNCTION cleanup_task_assignments_for_removed_project_member();
