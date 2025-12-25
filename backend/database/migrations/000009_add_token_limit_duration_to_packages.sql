-- Add GORM compatibility columns to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS token_limit BIGINT NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_days BIGINT NOT NULL DEFAULT 30;
