ALTER TABLE use_cases ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE use_cases ADD COLUMN source_generation_id UUID;
