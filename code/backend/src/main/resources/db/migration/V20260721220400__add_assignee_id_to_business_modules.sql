ALTER TABLE business_modules ADD COLUMN assignee_id BIGINT;
ALTER TABLE business_modules ADD CONSTRAINT fk_business_modules_assignee FOREIGN KEY (assignee_id) REFERENCES user_accounts(id);
