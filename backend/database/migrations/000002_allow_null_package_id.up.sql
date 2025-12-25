-- ============================================
-- Migration: Allow NULL package_id for FREE subscriptions
-- ============================================
-- FREE tier users don't have a package, so package_id should be nullable
-- Token limit for FREE accounts comes from system_settings.free_account_token_limit
-- ============================================

-- Remove NOT NULL constraint from package_id (if it exists)
ALTER TABLE subscriptions ALTER COLUMN package_id DROP NOT NULL;

-- Add comment explaining NULL package_id
COMMENT ON COLUMN subscriptions.package_id IS 'Package ID. NULL = FREE tier (uses free_account_token_limit from system_settings)';

-- ============================================
-- Update trigger to handle FREE accounts
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_daily_quota ON subscriptions;
DROP FUNCTION IF EXISTS create_daily_quota();

CREATE OR REPLACE FUNCTION create_daily_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_queries_limit INT;
    v_free_limit_setting TEXT;
BEGIN
    -- Handle FREE account (package_id = NULL) vs PAID package
    IF NEW.package_id IS NULL THEN
        -- FREE ACCOUNT - Get limit from system_settings
        SELECT setting_value INTO v_free_limit_setting
        FROM system_settings
        WHERE setting_key = 'free_account_query_limit_daily';

        -- Default to 10 queries/day if setting not found
        IF v_free_limit_setting IS NULL THEN
            v_queries_limit := 10;
        ELSE
            v_queries_limit := v_free_limit_setting::INT;
        END IF;
    ELSE
        -- PAID PACKAGE - Get limit from packages table
        SELECT query_limit_daily INTO v_queries_limit
        FROM packages
        WHERE id = NEW.package_id;

        -- If package not found, skip creating quota
        IF v_queries_limit IS NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Create daily quota with calculated limit
    INSERT INTO usage_quotas (
        user_id,
        subscription_id,
        date,
        queries_used,
        queries_limit
    )
    VALUES (
        NEW.user_id,
        NEW.id,
        CURRENT_DATE,
        0,
        v_queries_limit
    )
    ON CONFLICT (user_id, date) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_daily_quota
AFTER INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION create_daily_quota();

-- ============================================
-- Add FREE account settings
-- ============================================
-- Get admin user ID for updated_by (use first admin user)
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@epr.vn' LIMIT 1;

    -- If no admin exists, use a placeholder (will be updated later)
    IF v_admin_id IS NULL THEN
        v_admin_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Insert free account query limit setting
    INSERT INTO system_settings (
        setting_key,
        setting_value,
        description,
        value_type,
        updated_by
    )
    VALUES (
        'free_account_query_limit_daily',
        '50',
        'Daily query limit for free accounts (queries per day)',
        'integer',
        v_admin_id
    )
    ON CONFLICT (setting_key) DO NOTHING;
END $$;
