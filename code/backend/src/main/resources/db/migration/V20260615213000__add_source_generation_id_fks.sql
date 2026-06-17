-- Add UNIQUE constraint to generation_id to allow foreign keys
ALTER TABLE ai_generation_staging ADD CONSTRAINT uk_ai_generation_staging_generation_id UNIQUE (generation_id);

-- Add foreign key constraints for source_generation_id

ALTER TABLE requirements 
ADD CONSTRAINT fk_req_source_gen 
FOREIGN KEY (source_generation_id) 
REFERENCES ai_generation_staging(generation_id) 
ON DELETE SET NULL;

ALTER TABLE use_cases 
ADD CONSTRAINT fk_uc_source_gen 
FOREIGN KEY (source_generation_id) 
REFERENCES ai_generation_staging(generation_id) 
ON DELETE SET NULL;
