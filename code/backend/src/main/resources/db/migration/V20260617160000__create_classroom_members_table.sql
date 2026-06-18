CREATE TABLE IF NOT EXISTS classroom_members (
    classroom_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (classroom_id, user_id),
    CONSTRAINT fk_classroom_members_classroom FOREIGN KEY (classroom_id) REFERENCES academic_contexts(id) ON DELETE CASCADE,
    CONSTRAINT fk_classroom_members_user FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);
