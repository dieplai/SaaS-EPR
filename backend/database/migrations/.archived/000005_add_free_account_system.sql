-- Migration: Add Free Account System
-- Description: Add settings and tracking for free account token management

-- ============================================================================
-- 1. Add Free Account Settings
-- ============================================================================

-- Add free account token limit setting
INSERT INTO system_settings (setting_key, setting_value, description, value_type)
VALUES
    ('free_account_token_limit', '5000', 'Số lượng tokens cho tài khoản miễn phí', 'integer')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 2. Add Token Tracking Fields to Users Table
-- ============================================================================

-- Add columns for tracking free account tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS free_remaining_tokens INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS free_last_token_reset_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS free_next_token_reset_at TIMESTAMP;

-- ============================================================================
-- 3. Initialize Existing Users with Free Account Tokens
-- ============================================================================

-- Set initial free tokens for all existing users
UPDATE users
SET
    free_remaining_tokens = 5000,
    free_next_token_reset_at = NOW() + INTERVAL '7 days'
WHERE free_remaining_tokens IS NULL;

-- ============================================================================
-- 4. Create Helper Function: Reset Free Account Tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_free_account_tokens(
    p_user_id UUID,
    p_reset_cycle_days INTEGER
) RETURNS VOID AS $$
DECLARE
    v_token_limit INTEGER;
BEGIN
    -- Get free account token limit from settings
    SELECT setting_value::INTEGER INTO v_token_limit
    FROM system_settings
    WHERE setting_key = 'free_account_token_limit';

    IF v_token_limit IS NULL THEN
        v_token_limit := 5000; -- Default fallback
    END IF;

    -- Reset tokens
    UPDATE users
    SET
        free_remaining_tokens = v_token_limit,
        free_last_token_reset_at = NOW(),
        free_next_token_reset_at = NOW() + (p_reset_cycle_days || ' days')::INTERVAL,
        updated_at = NOW()
    WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Create Helper Function: Consume Free Account Tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_free_account_tokens(
    p_user_id UUID,
    p_tokens_to_consume INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_tokens INTEGER;
    v_success BOOLEAN := FALSE;
BEGIN
    -- Get current free tokens
    SELECT free_remaining_tokens INTO v_current_tokens
    FROM users
    WHERE id = p_user_id;

    -- Check if user has enough tokens
    IF v_current_tokens >= p_tokens_to_consume THEN
        -- Consume tokens
        UPDATE users
        SET
            free_remaining_tokens = free_remaining_tokens - p_tokens_to_consume,
            updated_at = NOW()
        WHERE id = p_user_id;

        v_success := TRUE;
    END IF;

    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Create View: Free Accounts Due for Token Reset
-- ============================================================================

CREATE OR REPLACE VIEW free_accounts_due_for_reset AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.free_remaining_tokens,
    u.free_last_token_reset_at,
    u.free_next_token_reset_at
FROM users u
WHERE
    u.deleted_at IS NULL
    AND u.free_next_token_reset_at IS NOT NULL
    AND u.free_next_token_reset_at <= NOW()
ORDER BY u.free_next_token_reset_at ASC;

-- ============================================================================
-- 7. Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_free_next_token_reset
ON users(free_next_token_reset_at)
WHERE deleted_at IS NULL AND free_next_token_reset_at IS NOT NULL;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN users.free_remaining_tokens IS 'Số tokens còn lại cho tài khoản miễn phí';
COMMENT ON COLUMN users.free_last_token_reset_at IS 'Thời điểm reset tokens miễn phí gần nhất';
COMMENT ON COLUMN users.free_next_token_reset_at IS 'Thời điểm reset tokens miễn phí tiếp theo';

COMMENT ON FUNCTION reset_free_account_tokens(UUID, INTEGER) IS 'Reset tokens cho tài khoản miễn phí';
COMMENT ON FUNCTION consume_free_account_tokens(UUID, INTEGER) IS 'Tiêu thụ tokens từ tài khoản miễn phí';
