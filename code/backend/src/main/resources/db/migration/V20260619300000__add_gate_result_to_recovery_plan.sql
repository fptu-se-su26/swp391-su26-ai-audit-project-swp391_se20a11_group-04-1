ALTER TABLE recovery_plans
    ADD COLUMN IF NOT EXISTS gate_result VARCHAR(30),
    ADD COLUMN IF NOT EXISTS gate_reason TEXT;
