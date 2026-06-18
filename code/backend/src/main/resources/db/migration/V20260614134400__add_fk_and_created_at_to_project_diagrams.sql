-- Add Foreign Key with CASCADE DELETE
ALTER TABLE project_diagrams 
ADD CONSTRAINT fk_project_diagrams_projects 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add the missing created_at column
ALTER TABLE project_diagrams 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
