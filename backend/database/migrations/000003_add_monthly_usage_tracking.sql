-- ============================================
-- Add Monthly Usage Tracking with Rolling Window
-- ============================================

-- Update subscriptions table to track billing periods
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS total_tokens INT NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT TRUE;

-- Create monthly usage quotas table for tracking usage per billing period
CREATE TABLE IF NOT EXISTS monthly_usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Billing period tracking
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Token usage tracking
    tokens_used INT NOT NULL DEFAULT 0,
    tokens_limit INT NOT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure one quota per subscription per period
    UNIQUE(subscription_id, period_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_quotas_subscription ON monthly_usage_quotas(subscription_id);
CREATE INDEX IF NOT EXISTS idx_monthly_quotas_user ON monthly_usage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_quotas_period ON monthly_usage_quotas(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_monthly_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_quotas_updated_at
    BEFORE UPDATE ON monthly_usage_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_quotas_updated_at();

-- Function to check if subscription needs renewal
CREATE OR REPLACE FUNCTION should_renew_subscription(sub_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_record RECORD;
BEGIN
    SELECT current_period_end, auto_renew, status
    INTO sub_record
    FROM subscriptions
    WHERE id = sub_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    RETURN sub_record.auto_renew = TRUE
        AND sub_record.status = 'active'
        AND NOW() >= sub_record.current_period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to renew subscription (refill tokens)
CREATE OR REPLACE FUNCTION renew_subscription(sub_id UUID)
RETURNS VOID AS $$
DECLARE
    sub_record RECORD;
    new_period_start TIMESTAMP;
    new_period_end TIMESTAMP;
BEGIN
    -- Get subscription details
    SELECT
        s.id,
        s.user_id,
        s.total_tokens,
        s.current_period_end,
        p.duration_days
    INTO sub_record
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.id = sub_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found: %', sub_id;
    END IF;

    -- Calculate new period
    new_period_start := sub_record.current_period_end;
    new_period_end := new_period_start + (sub_record.duration_days || ' days')::INTERVAL;

    -- Update subscription with new period and refilled tokens
    UPDATE subscriptions
    SET
        current_period_start = new_period_start,
        current_period_end = new_period_end,
        remaining_tokens = total_tokens,
        updated_at = NOW()
    WHERE id = sub_id;

    -- Create new monthly quota for new period
    INSERT INTO monthly_usage_quotas (
        subscription_id,
        user_id,
        period_start,
        period_end,
        tokens_used,
        tokens_limit
    ) VALUES (
        sub_id,
        sub_record.user_id,
        new_period_start,
        new_period_end,
        0,
        sub_record.total_tokens
    );

    RAISE NOTICE 'Subscription % renewed. New period: % to %', sub_id, new_period_start, new_period_end;
END;
$$ LANGUAGE plpgsql;

-- Update existing subscriptions with current period info
UPDATE subscriptions
SET
    current_period_start = start_date,
    current_period_end = end_date,
    total_tokens = remaining_tokens,
    auto_renew = TRUE
WHERE current_period_start IS NULL;

-- Create initial monthly quota for existing subscriptions
INSERT INTO monthly_usage_quotas (
    subscription_id,
    user_id,
    period_start,
    period_end,
    tokens_used,
    tokens_limit
)
SELECT
    s.id,
    s.user_id,
    s.start_date,
    s.end_date,
    GREATEST(0, s.total_tokens - s.remaining_tokens),
    s.total_tokens
FROM subscriptions s
WHERE s.status = 'active'
ON CONFLICT (subscription_id, period_start) DO NOTHING;

COMMENT ON TABLE monthly_usage_quotas IS 'Tracks token usage per billing period (rolling monthly window)';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current billing period (auto-renew triggers here)';
COMMENT ON COLUMN subscriptions.total_tokens IS 'Total tokens allocated per period (for refill)';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription auto-renews and refills tokens';

-- ============================================
-- Rollback (down migration)
-- ============================================
-- To rollback:
-- DROP FUNCTION IF EXISTS renew_subscription(UUID);
-- DROP FUNCTION IF EXISTS should_renew_subscription(UUID);
-- DROP TRIGGER IF EXISTS trigger_update_monthly_quotas_updated_at ON monthly_usage_quotas;
-- DROP FUNCTION IF EXISTS update_monthly_quotas_updated_at();
-- DROP TABLE IF EXISTS monthly_usage_quotas;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS current_period_start;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS current_period_end;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS total_tokens;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS auto_renew;
