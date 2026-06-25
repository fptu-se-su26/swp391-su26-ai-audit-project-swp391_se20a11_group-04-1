DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='agent_token_hash') AND
       NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='agent_token') THEN
        ALTER TABLE projects RENAME COLUMN agent_token_hash TO agent_token;
    END IF;
END $$;
