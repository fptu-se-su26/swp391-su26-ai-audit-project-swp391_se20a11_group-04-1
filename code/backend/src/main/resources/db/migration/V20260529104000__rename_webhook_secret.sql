-- Rename webhook_secret to webhook_secret_encrypted
ALTER TABLE github_integrations RENAME COLUMN webhook_secret TO webhook_secret_encrypted;
