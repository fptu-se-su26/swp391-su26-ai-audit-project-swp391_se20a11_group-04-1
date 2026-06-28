-- SQL Migration: Add appeal columns to user_accounts table

ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS appeal_reason TEXT,
ADD COLUMN IF NOT EXISTS appeal_evidence_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS appeal_evidence_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS appeal_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS appeal_comment TEXT,
ADD COLUMN IF NOT EXISTS appeal_resolved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS appeal_resolved_by BIGINT,
ADD CONSTRAINT fk_user_accounts_appeal_resolver 
    FOREIGN KEY (appeal_resolved_by) 
        REFERENCES user_accounts(id);
