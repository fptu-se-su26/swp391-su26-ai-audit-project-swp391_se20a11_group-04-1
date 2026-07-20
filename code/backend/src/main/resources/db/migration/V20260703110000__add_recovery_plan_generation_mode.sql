ALTER TABLE recovery_plans
    ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(40) NOT NULL DEFAULT 'RULE_FALLBACK';

UPDATE recovery_plans
SET generation_mode = CASE
    WHEN generated_source = 'AI' THEN 'AI_FAILED_FALLBACK'
    ELSE 'RULE_FALLBACK'
END
WHERE generation_mode = 'RULE_FALLBACK';
