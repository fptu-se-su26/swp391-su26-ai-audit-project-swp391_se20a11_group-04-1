-- Migration: V20260530130000__create_ai_generation_staging.sql
-- Date: 2026-05-30
-- Author: AI Assistant
-- Description: Create staging table for AI generation results

CREATE TABLE ai_generation_staging (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    stage VARCHAR(20) NOT NULL,
    generation_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ai_staging_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_staging_project_id ON ai_generation_staging(project_id);
CREATE INDEX idx_ai_staging_generation_id ON ai_generation_staging(generation_id);
