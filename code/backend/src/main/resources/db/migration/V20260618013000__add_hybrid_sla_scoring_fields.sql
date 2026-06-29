ALTER TABLE task_sla_states
    ADD COLUMN IF NOT EXISTS burn_gap DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS burn_rate_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS spi DECIMAL(5,3),
    ADD COLUMN IF NOT EXISTS predicted_risk_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS prediction_reasons_json TEXT,
    ADD COLUMN IF NOT EXISTS score_breakdown_json TEXT;
