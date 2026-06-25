-- SQL Migration: Create user_appeals table and migrate old columns from user_accounts

CREATE TABLE IF NOT EXISTS user_appeals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    evidence_url VARCHAR(500),
    evidence_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    admin_comment TEXT,
    resolved_at TIMESTAMP,
    resolved_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_appeals_user FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_appeals_resolver FOREIGN KEY (resolved_by) REFERENCES user_accounts(id)
);

-- Drop old columns from user_accounts as they are now stored in user_appeals
ALTER TABLE user_accounts 
DROP COLUMN IF EXISTS appeal_reason,
DROP COLUMN IF EXISTS appeal_evidence_url,
DROP COLUMN IF EXISTS appeal_evidence_name,
DROP COLUMN IF EXISTS appeal_status,
DROP COLUMN IF EXISTS appeal_comment,
DROP COLUMN IF EXISTS appeal_resolved_at,
DROP COLUMN IF EXISTS appeal_resolved_by;
