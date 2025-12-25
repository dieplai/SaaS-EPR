-- Align packages table schema with dev environment
-- This migration is idempotent and can run multiple times

-- Add missing columns (if not exists)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS token_limit BIGINT NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_days BIGINT NOT NULL DEFAULT 30;

-- Remove columns that don't exist in dev (if exists)
ALTER TABLE packages DROP COLUMN IF EXISTS display_name;
ALTER TABLE packages DROP COLUMN IF EXISTS currency;
ALTER TABLE packages DROP COLUMN IF EXISTS billing_period;
ALTER TABLE packages DROP COLUMN IF EXISTS query_limit_monthly;
ALTER TABLE packages DROP COLUMN IF EXISTS allowed_models;
ALTER TABLE packages DROP COLUMN IF EXISTS api_access;
ALTER TABLE packages DROP COLUMN IF EXISTS priority_support;
ALTER TABLE packages DROP COLUMN IF EXISTS max_conversation_history;
ALTER TABLE packages DROP COLUMN IF EXISTS is_featured;
ALTER TABLE packages DROP COLUMN IF EXISTS sort_order;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_packages_deleted_at ON packages(deleted_at);
