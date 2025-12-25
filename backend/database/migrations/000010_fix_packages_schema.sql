-- Fix packages table schema to match dev environment
-- Drop columns that don't exist in dev
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
