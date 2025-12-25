-- ============================================
-- Rollback: Restore NOT NULL constraint on package_id
-- ============================================
-- WARNING: This will fail if there are any FREE subscriptions with NULL package_id
-- ============================================

-- First delete any FREE subscriptions (package_id = NULL)
DELETE FROM subscriptions WHERE package_id IS NULL;

-- Restore NOT NULL constraint
ALTER TABLE subscriptions ALTER COLUMN package_id SET NOT NULL;

-- Restore original comment
COMMENT ON COLUMN subscriptions.package_id IS 'Package ID';
