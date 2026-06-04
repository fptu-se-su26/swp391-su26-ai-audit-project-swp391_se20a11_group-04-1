CREATE TABLE IF NOT EXISTS code_insight_ai_reviews (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    provider VARCHAR(80) NOT NULL DEFAULT 'LOCAL_RULE_ASSISTANT',
    recommendation VARCHAR(40) NOT NULL,
    confidence INTEGER NOT NULL DEFAULT 0,
    summary TEXT,
    risks_json TEXT,
    review_questions_json TEXT,
    score_adjustment INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_code_insight_ai_reviews_confidence CHECK (confidence >= 0 AND confidence <= 100),
    CONSTRAINT chk_code_insight_ai_reviews_adjustment CHECK (score_adjustment >= -15 AND score_adjustment <= 15)
);

CREATE INDEX IF NOT EXISTS idx_code_insight_ai_reviews_task_created
    ON code_insight_ai_reviews(task_id, created_at DESC);
