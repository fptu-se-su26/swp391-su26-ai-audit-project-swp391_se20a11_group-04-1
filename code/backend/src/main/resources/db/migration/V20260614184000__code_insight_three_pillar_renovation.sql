ALTER TABLE code_insight_reviews
    ADD COLUMN IF NOT EXISTS gate_result VARCHAR(30),
    ADD COLUMN IF NOT EXISTS evidence_confidence VARCHAR(20),
    ADD COLUMN IF NOT EXISTS code_risk_level VARCHAR(20);

ALTER TABLE code_insight_ai_reviews
    ADD COLUMN IF NOT EXISTS alignment_result_json TEXT,
    ADD COLUMN IF NOT EXISTS alignment_coverage_ratio DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS alignment_covered_count INTEGER,
    ADD COLUMN IF NOT EXISTS alignment_total_count INTEGER,
    ADD COLUMN IF NOT EXISTS code_risk_level VARCHAR(20);
