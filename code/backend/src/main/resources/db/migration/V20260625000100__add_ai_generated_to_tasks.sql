ALTER TABLE tasks 
ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN source_generation_id UUID;
