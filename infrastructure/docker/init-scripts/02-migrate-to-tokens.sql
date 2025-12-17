-- Migration: Rename query columns to token columns
-- Description: Change from query-based quota to token-based quota system
-- Date: 2025-01-XX

-- ========================================
-- STEP 1: Rename columns in subscriptions table
-- ========================================

-- Rename remaining_queries to remaining_tokens
ALTER TABLE IF EXISTS subscriptions
    RENAME COLUMN remaining_queries TO remaining_tokens;

-- ========================================
-- STEP 2: Rename columns in packages table
-- ========================================

-- Rename query_limit to token_limit
ALTER TABLE IF EXISTS packages
    RENAME COLUMN query_limit TO token_limit;

-- ========================================
-- STEP 3: Update existing data
-- ========================================

-- For existing subscriptions, convert queries to tokens
-- Assumption: 1 query ≈ 500 tokens (average response)
-- This is a safe multiplier to give existing users fair token allocation
UPDATE subscriptions
SET remaining_tokens = remaining_tokens * 500
WHERE remaining_tokens > 0;

-- For existing packages, convert query limits to token limits
-- Using same 500x multiplier for consistency
UPDATE packages
SET token_limit = token_limit * 500
WHERE token_limit > 0;

-- ========================================
-- STEP 4: Add comments for documentation
-- ========================================

COMMENT ON COLUMN subscriptions.remaining_tokens IS 'Number of AI output tokens remaining in subscription';
COMMENT ON COLUMN packages.token_limit IS 'Maximum number of AI output tokens allowed per subscription period';

-- ========================================
-- VERIFICATION QUERIES (for manual checking)
-- ========================================

-- Uncomment to verify the migration:
-- SELECT id, name, token_limit FROM packages ORDER BY token_limit;
-- SELECT id, user_id, remaining_tokens, status FROM subscriptions WHERE status = 'active';
