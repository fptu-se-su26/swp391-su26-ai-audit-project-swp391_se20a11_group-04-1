CREATE TABLE IF NOT EXISTS github_pull_request_files (
    id BIGSERIAL PRIMARY KEY,
    pull_request_id BIGINT NOT NULL REFERENCES github_pull_requests(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(40),
    additions INTEGER NOT NULL DEFAULT 0,
    deletions INTEGER NOT NULL DEFAULT 0,
    changes INTEGER NOT NULL DEFAULT 0,
    patch_hash VARCHAR(64),
    patch_summary TEXT,
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_github_pull_request_files_pr_path UNIQUE (pull_request_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_github_pull_request_files_pr_id
    ON github_pull_request_files(pull_request_id);
