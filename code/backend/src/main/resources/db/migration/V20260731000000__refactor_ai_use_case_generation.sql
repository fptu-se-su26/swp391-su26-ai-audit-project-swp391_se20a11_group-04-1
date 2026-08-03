-- 1. Add module_id to requirements
ALTER TABLE requirements ADD COLUMN module_id BIGINT;
ALTER TABLE requirements ADD CONSTRAINT fk_req_module FOREIGN KEY (module_id) REFERENCES business_modules(id) ON DELETE SET NULL;
CREATE INDEX idx_requirements_module_id ON requirements(module_id);

-- 2. Add project_actor_id and actor_role to use_case_actors
ALTER TABLE use_case_actors ADD COLUMN project_actor_id BIGINT;
ALTER TABLE use_case_actors ADD CONSTRAINT fk_uca_project_actor FOREIGN KEY (project_actor_id) REFERENCES project_actors(id) ON DELETE SET NULL;
CREATE INDEX idx_use_case_actors_project_actor_id ON use_case_actors(project_actor_id);

ALTER TABLE use_case_actors ADD COLUMN actor_role VARCHAR(50) DEFAULT 'PRIMARY';

-- 3. Data Backfill: Requirements -> Business Modules
-- Only update if all non-deleted Use Cases for a requirement point to exactly ONE module
UPDATE requirements r
SET module_id = (
    SELECT u.module_id
    FROM use_cases u
    JOIN requirement_use_cases ruc ON u.id = ruc.use_case_id
    WHERE ruc.requirement_id = r.id AND u.is_deleted = false AND u.module_id IS NOT NULL
    GROUP BY u.module_id
    HAVING COUNT(DISTINCT u.module_id) = 1
    LIMIT 1
)
WHERE r.module_id IS NULL;

-- 4. Data Backfill: Use Case Actors -> Project Actors
-- Match exact case-insensitive actor_name to project_actors within the same project.
UPDATE use_case_actors uca
SET project_actor_id = (
    SELECT pa.id 
    FROM project_actors pa 
    JOIN use_cases u ON uca.use_case_id = u.id
    WHERE LOWER(pa.name) = LOWER(uca.actor_name)
      AND pa.project_id = u.project_id
      AND pa.is_deleted = false
    LIMIT 1
)
WHERE uca.project_actor_id IS NULL 
  AND 1 = ( -- Ensure unambiguous mapping
      SELECT COUNT(*)
      FROM project_actors pa2 
      JOIN use_cases u2 ON uca.use_case_id = u2.id
      WHERE LOWER(pa2.name) = LOWER(uca.actor_name)
        AND pa2.project_id = u2.project_id
        AND pa2.is_deleted = false
  );
