-- Add soft delete support to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_packages_deleted_at ON packages(deleted_at);
