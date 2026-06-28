-- SQL Migration: Add lock_reason column to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS lock_reason TEXT;
