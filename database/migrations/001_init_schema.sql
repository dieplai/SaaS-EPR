-- ============================================
-- EPR Legal SaaS - Initial Database Schema
-- PostgreSQL 15+
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- 2. PACKAGES (SUBSCRIPTION PLANS)
-- ============================================

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    query_limit_daily INT NOT NULL,
    allowed_models JSONB DEFAULT '["gpt-3.5-turbo"]'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial packages
INSERT INTO packages (name, display_name, description, price, query_limit_daily, allowed_models) VALUES
('free', 'Free', 'Gói miễn phí để dùng thử', 0.00, 10, '["gpt-3.5-turbo"]'::jsonb),
('basic', 'Basic', 'Gói cơ bản cho cá nhân', 9.00, 100, '["gpt-3.5-turbo"]'::jsonb),
('pro', 'Professional', 'Gói chuyên nghiệp cho doanh nghiệp', 29.00, 1000, '["gpt-3.5-turbo", "gpt-4o-mini"]'::jsonb),
('business', 'Business', 'Gói doanh nghiệp cao cấp', 99.00, 999999, '["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- 4. USAGE QUOTAS
-- ============================================

CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    queries_used INT DEFAULT 0,
    queries_limit INT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_quotas_user_date ON usage_quotas(user_id, date);

-- ============================================
-- 5. CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    model VARCHAR(50),
    tokens_used INT DEFAULT 0,
    response_time_ms INT,
    sources JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- ============================================
-- 6. ANALYTICS EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function: Check if user can make query
CREATE OR REPLACE FUNCTION can_user_query(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_queries_used INT;
    v_queries_limit INT;
    v_subscription_id UUID;
    v_package_id UUID;
    v_daily_limit INT;
BEGIN
    -- Get active subscription
    SELECT s.id, s.package_id INTO v_subscription_id, v_package_id
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND s.current_period_end > NOW();

    IF v_subscription_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get package daily limit
    SELECT query_limit_daily INTO v_daily_limit
    FROM packages
    WHERE id = v_package_id;

    -- Get or create today's quota
    INSERT INTO usage_quotas (user_id, subscription_id, date, queries_used, queries_limit)
    VALUES (p_user_id, v_subscription_id, CURRENT_DATE, 0, v_daily_limit)
    ON CONFLICT (user_id, date) DO NOTHING;

    -- Check quota
    SELECT queries_used, queries_limit INTO v_queries_used, v_queries_limit
    FROM usage_quotas
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN v_queries_used < v_queries_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment query count
CREATE OR REPLACE FUNCTION increment_query_count(
    p_user_id UUID,
    p_tokens INT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE usage_quotas
    SET queries_used = queries_used + 1,
        tokens_used = tokens_used + p_tokens,
        updated_at = NOW()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's current quota
CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS TABLE (
    queries_used INT,
    queries_limit INT,
    tokens_used INT,
    package_name VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        uq.queries_used,
        uq.queries_limit,
        uq.tokens_used,
        p.name as package_name,
        s.status
    FROM usage_quotas uq
    JOIN subscriptions s ON uq.subscription_id = s.id
    JOIN packages p ON s.package_id = p.id
    WHERE uq.user_id = p_user_id
      AND uq.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger: Auto-create daily quota on subscription creation
CREATE OR REPLACE FUNCTION create_daily_quota()
RETURNS TRIGGER AS $$
DECLARE
    pkg packages%ROWTYPE;
BEGIN
    SELECT * INTO pkg FROM packages WHERE id = NEW.package_id;

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
        pkg.query_limit_daily
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
-- 9. VIEWS
-- ============================================

-- View: User with subscription info
CREATE OR REPLACE VIEW v_users_with_subscriptions AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.company_name,
    u.is_active,
    u.created_at,
    p.name as package_name,
    p.display_name as package_display_name,
    s.status as subscription_status,
    s.current_period_end,
    uq.queries_used,
    uq.queries_limit,
    uq.tokens_used
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN packages p ON s.package_id = p.id
LEFT JOIN usage_quotas uq ON u.id = uq.user_id AND uq.date = CURRENT_DATE;

-- ============================================
-- 10. INITIAL DATA
-- ============================================

-- Create demo user (password: demo123)
-- Password hash generated with: bcrypt.hashpw(b"demo123", bcrypt.gensalt())
DO $$
DECLARE
    demo_user_id UUID;
    free_package_id UUID;
BEGIN
    -- Insert demo user
    INSERT INTO users (email, password_hash, full_name, is_verified)
    VALUES (
        'demo@epr-legal.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKJ3VkZ.XS',
        'Demo User',
        TRUE
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO demo_user_id;

    -- Get free package ID
    SELECT id INTO free_package_id FROM packages WHERE name = 'free';

    -- Create free subscription for demo user
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO subscriptions (
            user_id,
            package_id,
            current_period_start,
            current_period_end,
            status
        )
        VALUES (
            demo_user_id,
            free_package_id,
            NOW(),
            NOW() + INTERVAL '365 days',
            'active'
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema initialized successfully!';
    RAISE NOTICE '📊 Tables created: users, packages, subscriptions, usage_quotas, conversations, analytics_events';
    RAISE NOTICE '🔧 Functions created: can_user_query, increment_query_count, get_user_quota';
    RAISE NOTICE '👤 Demo user: demo@epr-legal.com / demo123';
    RAISE NOTICE '📦 Packages: free, basic, pro, business';
END $$;
