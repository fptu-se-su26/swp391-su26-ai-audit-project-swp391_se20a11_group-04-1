CREATE TABLE project_diagrams (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL UNIQUE,
    layout_data JSONB,
    image_base64 TEXT,
    updated_at TIMESTAMP
);
