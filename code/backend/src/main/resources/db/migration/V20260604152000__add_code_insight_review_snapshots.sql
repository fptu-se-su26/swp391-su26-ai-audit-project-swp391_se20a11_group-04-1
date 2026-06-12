CREATE TABLE IF NOT EXISTS code_insight_reviews (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES user_accounts(id),
    rule_score INTEGER NOT NULL,
    ai_adjustment INTEGER NOT NULL DEFAULT 0,
    final_score INTEGER NOT NULL,
    risk_level VARCHAR(40),
    score_reasons_json TEXT,
    evidence_snapshot_json TEXT,
    evidence_hash VARCHAR(64) NOT NULL,
    ai_review_id BIGINT REFERENCES code_insight_ai_reviews(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_code_insight_reviews_rule_score CHECK (rule_score >= 0 AND rule_score <= 100),
    CONSTRAINT chk_code_insight_reviews_final_score CHECK (final_score >= 0 AND final_score <= 100),
    CONSTRAINT chk_code_insight_reviews_ai_adjustment CHECK (ai_adjustment >= -15 AND ai_adjustment <= 15)
);

CREATE INDEX IF NOT EXISTS idx_code_insight_reviews_task_created
    ON code_insight_reviews(task_id, created_at DESC);
