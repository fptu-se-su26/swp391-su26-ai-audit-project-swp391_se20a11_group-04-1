-- 1. Create the new user_github_tokens table
CREATE TABLE IF NOT EXISTS user_github_tokens (
    user_id BIGINT PRIMARY KEY,
    access_token_encrypted TEXT NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_github_tokens_user FOREIGN KEY (user_id) REFERENCES user_accounts (id) ON DELETE CASCADE
);

-- 2. Migrate existing tokens from github_integrations to user_github_tokens
-- We use DISTINCT ON to get the most recently used token for each user
INSERT INTO user_github_tokens (user_id, access_token_encrypted, updated_at)
SELECT DISTINCT ON (connected_by) 
    connected_by, 
    access_token_encrypted, 
    connected_at
FROM github_integrations
WHERE access_token_encrypted IS NOT NULL
ORDER BY connected_by, connected_at DESC;

-- 3. Drop the column from github_integrations to complete the refactoring
ALTER TABLE github_integrations
DROP COLUMN access_token_encrypted;

