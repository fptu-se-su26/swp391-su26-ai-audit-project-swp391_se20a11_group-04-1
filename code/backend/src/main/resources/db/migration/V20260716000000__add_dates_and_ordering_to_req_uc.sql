-- Requirements: Add start_date and deadline
ALTER TABLE requirements
ADD COLUMN start_date DATE,
ADD COLUMN deadline DATE;

-- Use Cases: Add start_date, deadline, and uc_order
ALTER TABLE use_cases
ADD COLUMN start_date DATE,
ADD COLUMN deadline DATE,
ADD COLUMN uc_order INTEGER;

-- Create join table for Requirement Co-Owners
CREATE TABLE requirement_co_owners (
    requirement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (requirement_id, user_id),
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

-- Add new enum values to requirement_status_enum
ALTER TYPE requirement_status_enum ADD VALUE IF NOT EXISTS 'READY_FOR_REVIEW';
ALTER TYPE requirement_status_enum ADD VALUE IF NOT EXISTS 'CLOSED';
