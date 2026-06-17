-- Migration: V20260617115800__add_message_to_mentor_verification_requests.sql
-- Description: Add message column and remove redundant rejection_reason column in mentor_verification_requests table
ALTER TABLE mentor_verification_requests ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE mentor_verification_requests DROP COLUMN IF EXISTS rejection_reason;
