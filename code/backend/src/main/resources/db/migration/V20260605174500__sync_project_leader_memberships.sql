-- Keep project role data as the single source of truth for backend authorization and frontend display.

INSERT INTO project_members (project_id, user_id, project_role_id, joined_at, invited_by)
SELECT
    p.id,
    p.created_by,
    leader_role.id,
    COALESCE(p.created_at, CURRENT_TIMESTAMP),
    p.created_by
FROM projects p
JOIN project_roles leader_role ON leader_role.name = 'PROJECT_LEADER'
WHERE NOT EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = p.id
      AND pm.user_id = p.created_by
);

UPDATE project_members creator_member
SET project_role_id = leader_role.id
FROM projects p
JOIN project_roles leader_role ON leader_role.name = 'PROJECT_LEADER'
WHERE creator_member.project_id = p.id
  AND creator_member.user_id = p.created_by
  AND NOT EXISTS (
      SELECT 1
      FROM project_members pm
      JOIN project_roles pr ON pr.id = pm.project_role_id
      WHERE pm.project_id = p.id
        AND UPPER(pr.name) IN ('PROJECT_LEADER', 'LEADER')
  );
