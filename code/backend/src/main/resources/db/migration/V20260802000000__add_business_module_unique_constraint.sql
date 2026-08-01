-- Plan Section 4: Add unique constraint on business_modules(project_id, name)
-- to prevent concurrent duplicate module creation during AI approval.

-- Step 1: Sanitize duplicate module names within the same project.
-- For each group of duplicates, keep the one with the smallest id and delete the rest
-- (first update any FK references, then delete).

-- Reassign use_cases.module_id from duplicate modules to the canonical (min id) module
UPDATE use_cases uc
SET module_id = canonical.min_id
FROM (
    SELECT project_id, LOWER(TRIM(name)) AS norm_name, MIN(id) AS min_id
    FROM business_modules
    GROUP BY project_id, LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) canonical
JOIN business_modules dup ON dup.project_id = canonical.project_id
    AND LOWER(TRIM(dup.name)) = canonical.norm_name
    AND dup.id != canonical.min_id
WHERE uc.module_id = dup.id;

-- Reassign requirements.module_id from duplicate modules to the canonical module
UPDATE requirements req
SET module_id = canonical.min_id
FROM (
    SELECT project_id, LOWER(TRIM(name)) AS norm_name, MIN(id) AS min_id
    FROM business_modules
    GROUP BY project_id, LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) canonical
JOIN business_modules dup ON dup.project_id = canonical.project_id
    AND LOWER(TRIM(dup.name)) = canonical.norm_name
    AND dup.id != canonical.min_id
WHERE req.module_id = dup.id;

-- Reassign tasks.module_id from duplicate modules to the canonical module
UPDATE tasks t
SET module_id = canonical.min_id
FROM (
    SELECT project_id, LOWER(TRIM(name)) AS norm_name, MIN(id) AS min_id
    FROM business_modules
    GROUP BY project_id, LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) canonical
JOIN business_modules dup ON dup.project_id = canonical.project_id
    AND LOWER(TRIM(dup.name)) = canonical.norm_name
    AND dup.id != canonical.min_id
WHERE t.module_id = dup.id;

-- Step 2: Delete the duplicate (non-canonical) modules
DELETE FROM business_modules
WHERE id IN (
    SELECT dup.id
    FROM (
        SELECT project_id, LOWER(TRIM(name)) AS norm_name, MIN(id) AS min_id
        FROM business_modules
        GROUP BY project_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) canonical
    JOIN business_modules dup ON dup.project_id = canonical.project_id
        AND LOWER(TRIM(dup.name)) = canonical.norm_name
        AND dup.id != canonical.min_id
);

-- Step 3: Add the unique constraint
ALTER TABLE business_modules
    ADD CONSTRAINT uq_business_modules_project_name UNIQUE (project_id, name);
