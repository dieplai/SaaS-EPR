-- ============================================
-- Add role column to users table
-- ============================================

-- Add role column with default value 'user'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Add check constraint to ensure only valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin', 'manager'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing demo user to admin role
UPDATE users SET role = 'admin' WHERE email = 'demo@epr-legal.com';

COMMENT ON COLUMN users.role IS 'User role: user (default), admin, manager';

-- ============================================
-- Rollback (down migration)
-- ============================================
-- To rollback this migration, run:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- DROP INDEX IF EXISTS idx_users_role;
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
