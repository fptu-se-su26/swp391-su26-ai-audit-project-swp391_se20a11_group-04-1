CREATE TABLE IF NOT EXISTS github_repositories (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL UNIQUE,
    repo_url VARCHAR(500) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    repo_name VARCHAR(150) NOT NULL,
    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
    webhook_secret_hash VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_github_repositories_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_github_repositories_owner_repo_project
        UNIQUE (project_id, owner, repo_name)
);

-- Project-level switches for how strict Code Insight review/scoring should be.
CREATE TABLE IF NOT EXISTS project_code_insight_settings (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL UNIQUE,
    review_gate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    require_pr_for_done BOOLEAN NOT NULL DEFAULT FALSE,
    require_ci_pass BOOLEAN NOT NULL DEFAULT FALSE,
    ai_review_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- Later rule-based scoring uses this threshold to show leader warnings.
    min_score_warning_threshold INTEGER NOT NULL DEFAULT 70,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_code_insight_settings_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_project_code_insight_settings_threshold
        CHECK (min_score_warning_threshold BETWEEN 0 AND 100)
);
