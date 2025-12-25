-- Migration: Add Token Reset System
-- Description: Add token auto-reset functionality with admin settings
-- Author: System
-- Date: 2025-12-16

-- ============================================
-- 1. CREATE SYSTEM_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'string', 'integer', 'boolean', 'json'
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default token reset cycle setting (7 days)
INSERT INTO system_settings (setting_key, setting_value, description, value_type)
VALUES
    ('token_reset_cycle_days', '7', 'Số ngày để tự động reset tokens về limit ban đầu', 'integer'),
    ('token_reset_enabled', 'true', 'Bật/tắt tính năng auto-reset tokens', 'boolean')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 2. ADD TOKEN RESET FIELDS TO SUBSCRIPTIONS
-- ============================================

-- Add last_token_reset_at field
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS last_token_reset_at TIMESTAMP;

-- Set initial value = start_date for existing subscriptions
UPDATE subscriptions
SET last_token_reset_at = start_date
WHERE last_token_reset_at IS NULL;

-- Add next_token_reset_at computed field (optional, for easier queries)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS next_token_reset_at TIMESTAMP;

-- ============================================
-- 3. CREATE FUNCTION TO CALCULATE NEXT RESET
-- ============================================

CREATE OR REPLACE FUNCTION calculate_next_token_reset(
    last_reset TIMESTAMP,
    cycle_days INTEGER
) RETURNS TIMESTAMP AS $$
BEGIN
    RETURN last_reset + (cycle_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. CREATE FUNCTION TO RESET USER TOKENS
-- ============================================

CREATE OR REPLACE FUNCTION reset_user_tokens(sub_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_tokens INTEGER;
BEGIN
    -- Get total_tokens for this subscription
    SELECT total_tokens INTO v_total_tokens
    FROM subscriptions
    WHERE id = sub_id;

    -- Reset remaining_tokens to total_tokens
    UPDATE subscriptions
    SET
        remaining_tokens = v_total_tokens,
        last_token_reset_at = NOW(),
        next_token_reset_at = calculate_next_token_reset(NOW(), (
            SELECT setting_value::INTEGER
            FROM system_settings
            WHERE setting_key = 'token_reset_cycle_days'
        )),
        monthly_usage_count = 0, -- Reset monthly usage counter
        updated_at = NOW()
    WHERE id = sub_id;

    -- Log the reset
    RAISE NOTICE 'Token reset completed for subscription: %', sub_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE VIEW FOR SUBSCRIPTIONS DUE FOR RESET
-- ============================================

CREATE OR REPLACE VIEW subscriptions_due_for_reset AS
SELECT
    s.id,
    s.user_id,
    s.package_id,
    s.remaining_tokens,
    s.total_tokens,
    s.last_token_reset_at,
    s.next_token_reset_at,
    s.end_date,
    EXTRACT(EPOCH FROM (s.next_token_reset_at - NOW()))/86400 AS days_until_reset
FROM subscriptions s
WHERE
    s.status = 'active'
    AND s.end_date > NOW()  -- Subscription still valid
    AND s.next_token_reset_at <= NOW()  -- Reset time has come
    AND EXISTS (
        SELECT 1 FROM system_settings
        WHERE setting_key = 'token_reset_enabled'
        AND setting_value = 'true'
    );

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_reset
ON subscriptions(next_token_reset_at)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_token_reset_lookup
ON subscriptions(user_id, status, next_token_reset_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_key
ON system_settings(setting_key);

-- ============================================
-- 7. UPDATE EXISTING SUBSCRIPTIONS
-- ============================================

-- Calculate next_token_reset_at for existing active subscriptions
UPDATE subscriptions
SET next_token_reset_at = calculate_next_token_reset(
    COALESCE(last_token_reset_at, start_date),
    (SELECT setting_value::INTEGER FROM system_settings WHERE setting_key = 'token_reset_cycle_days')
)
WHERE status = 'active' AND next_token_reset_at IS NULL;

-- ============================================
-- 8. ADD COMMENTS
-- ============================================

COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN subscriptions.last_token_reset_at IS 'Timestamp of last token reset';
COMMENT ON COLUMN subscriptions.next_token_reset_at IS 'Timestamp when tokens will be reset next';
COMMENT ON FUNCTION reset_user_tokens IS 'Reset tokens for a subscription to package limit';
COMMENT ON VIEW subscriptions_due_for_reset IS 'Subscriptions that need token reset now';
