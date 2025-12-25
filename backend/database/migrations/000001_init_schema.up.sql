-- ============================================
-- EPR Legal SaaS - Consolidated Database Schema
-- PostgreSQL 16 + pgvector extension
-- ============================================
-- Consolidated from migrations 000001-000010
-- This is the canonical schema for golang-migrate
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
-- NOTE: Extensions are created in db/setup.sh (run as postgres superuser)
-- This migration assumes the following extensions are already installed:
--   - uuid-ossp (UUID generation)
--   - pgcrypto (password hashing)
--   - vector (pgvector for embeddings)
--
-- Separating extension creation from migrations is a best practice because:
--   1. Extensions require SUPERUSER privileges
--   2. Migrations run as application user (epr_staging/epr_production)
--   3. Extensions are infrastructure setup, not application schema

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
    avatar_url TEXT,

    -- Role (from 000002)
    role VARCHAR(20) NOT NULL DEFAULT 'user',

    -- Free Account Tokens (from 000005)
    free_remaining_tokens INTEGER DEFAULT 5000,
    free_last_token_reset_at TIMESTAMP,
    free_next_token_reset_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft delete

    -- Constraints
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'manager'))
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_free_next_token_reset ON users(free_next_token_reset_at) WHERE deleted_at IS NULL AND free_next_token_reset_at IS NOT NULL;

COMMENT ON TABLE users IS 'User accounts for the platform';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN users.role IS 'User role: user (default), admin, manager';
COMMENT ON COLUMN users.free_remaining_tokens IS 'Remaining tokens for free account';
COMMENT ON COLUMN users.free_last_token_reset_at IS 'Last free account token reset timestamp';
COMMENT ON COLUMN users.free_next_token_reset_at IS 'Next free account token reset timestamp';

-- ============================================
-- 2. REFRESH TOKENS (for JWT refresh)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';

-- ============================================
-- 3. PACKAGES (SUBSCRIPTION PLANS)
-- ============================================
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    token_limit BIGINT NOT NULL,           -- from 000008
    duration_days BIGINT NOT NULL,         -- from 000008
    features JSONB DEFAULT '[]'::jsonb,    -- MUST be array, not object
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,                  -- from 000008
    query_limit_daily INTEGER NOT NULL DEFAULT 100
);

CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_packages_deleted_at ON packages(deleted_at);

COMMENT ON TABLE packages IS 'Subscription plans (Starter, Professional, Enterprise)';
COMMENT ON COLUMN packages.features IS 'JSON array with package features';
COMMENT ON COLUMN packages.token_limit IS 'Total tokens allocated per package duration';
COMMENT ON COLUMN packages.duration_days IS 'Package validity duration in days';

-- ============================================
-- 4. SYSTEM SETTINGS (from 000004)
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

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Insert default settings (from 000004 and 000005)
INSERT INTO system_settings (setting_key, setting_value, description, value_type)
VALUES
    ('token_reset_cycle_days', '7', 'Number of days for automatic token reset', 'integer'),
    ('token_reset_enabled', 'true', 'Enable/disable automatic token reset', 'boolean'),
    ('free_account_token_limit', '5000', 'Token limit for free accounts', 'integer')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE system_settings IS 'Global system configuration settings';

-- ============================================
-- 5. SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended, trial

    -- Billing period (from 000003)
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP NOT NULL,
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days',

    -- Token management
    remaining_tokens INT NOT NULL,
    total_tokens INT NOT NULL DEFAULT 0,          -- from 000003

    -- Renewal (from 000003)
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,

    -- Token reset system (from 000004)
    last_token_reset_at TIMESTAMP,
    next_token_reset_at TIMESTAMP,

    -- Usage tracking
    monthly_usage_count INT DEFAULT 0,

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,

    -- Trial
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,                         -- Soft delete

    UNIQUE(user_id) -- One active subscription per user
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_next_reset ON subscriptions(next_token_reset_at) WHERE status = 'active';
CREATE INDEX idx_subscriptions_token_reset_lookup ON subscriptions(user_id, status, next_token_reset_at);

COMMENT ON TABLE subscriptions IS 'User subscriptions to packages';
COMMENT ON COLUMN subscriptions.status IS 'active, cancelled, expired, suspended, trial';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current billing period (auto-renew triggers here)';
COMMENT ON COLUMN subscriptions.total_tokens IS 'Total tokens allocated per period (for refill)';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription auto-renews and refills tokens';
COMMENT ON COLUMN subscriptions.last_token_reset_at IS 'Timestamp of last token reset';
COMMENT ON COLUMN subscriptions.next_token_reset_at IS 'Timestamp when tokens will be reset next';

-- ============================================
-- 6. USAGE QUOTAS (Daily)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,

    -- Date tracking
    date DATE NOT NULL,

    -- Query counts
    queries_used INT DEFAULT 0,
    queries_limit INT NOT NULL,

    -- Token usage (for cost tracking)
    tokens_used INT DEFAULT 0,
    tokens_limit INT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_quotas_user_date ON usage_quotas(user_id, date);
CREATE INDEX idx_usage_quotas_date ON usage_quotas(date);

COMMENT ON TABLE usage_quotas IS 'Daily usage tracking per user';

-- ============================================
-- 7. MONTHLY USAGE QUOTAS (from 000003)
-- ============================================
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

CREATE INDEX idx_monthly_quotas_subscription ON monthly_usage_quotas(subscription_id);
CREATE INDEX idx_monthly_quotas_user ON monthly_usage_quotas(user_id);
CREATE INDEX idx_monthly_quotas_period ON monthly_usage_quotas(period_start, period_end);

COMMENT ON TABLE monthly_usage_quotas IS 'Tracks token usage per billing period (rolling monthly window)';

-- ============================================
-- 8. CONVERSATION SESSIONS (from 000007)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Session info
    title VARCHAR(500) NOT NULL DEFAULT 'New Chat',

    -- Auto-generated from first user message
    auto_title BOOLEAN DEFAULT TRUE,

    -- Metadata
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMP
);

CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_updated_at ON conversation_sessions(last_message_at DESC);
CREATE INDEX idx_conversation_sessions_user_recent ON conversation_sessions(user_id, last_message_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE conversation_sessions IS 'ChatGPT-style conversation sessions';
COMMENT ON COLUMN conversation_sessions.auto_title IS 'If true, title was auto-generated from first message';

-- ============================================
-- 9. CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    conversation_session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,  -- from 000007

    -- Message
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,

    -- AI metadata
    model VARCHAR(50),
    tokens_used INT DEFAULT 0,
    response_time_ms INT,

    -- Sources (array of document IDs)
    sources JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_user_session ON conversations(user_id, session_id);
CREATE INDEX idx_conversations_session_id_v2 ON conversations(conversation_session_id);

COMMENT ON TABLE conversations IS 'Chat conversation history';
COMMENT ON COLUMN conversations.sources IS 'Array of document IDs used for RAG';

-- ============================================
-- 10. DOCUMENTS (with vector embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Document metadata
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),

    -- Legal metadata
    document_type VARCHAR(50), -- law, decree, circular, appendix
    document_number VARCHAR(50),
    chapter VARCHAR(100),
    article VARCHAR(50),
    section VARCHAR(100),

    -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding vector(1536),

    -- File reference
    file_path TEXT,
    page_number INT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create HNSW index for fast vector similarity search
CREATE INDEX idx_documents_embedding ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_article ON documents(article);

COMMENT ON TABLE documents IS 'Legal documents with vector embeddings for RAG';
COMMENT ON COLUMN documents.embedding IS 'Vector embedding (1536 dims) for semantic search';
COMMENT ON INDEX idx_documents_embedding IS 'HNSW index for fast cosine similarity search';

-- ============================================
-- 11. FAQ (Frequently Asked Questions)
-- ============================================
CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),

    -- Vector embedding for semantic matching
    embedding vector(1536),

    -- Metadata
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faq_embedding ON faq
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_faq_category ON faq(category);
CREATE INDEX idx_faq_active ON faq(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE faq IS 'FAQ with semantic search capability';

-- ============================================
-- 12. ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,

    -- Session info
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

COMMENT ON TABLE analytics_events IS 'User activity tracking and analytics';

-- ============================================
-- 13. PAYMENTS (for future)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- pending, success, failed, refunded

    -- Payment method
    payment_method VARCHAR(50), -- stripe, vnpay, momo
    transaction_id VARCHAR(255),

    -- External references (Stripe)
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Function: Vector similarity search
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    content TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.content,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_similar_documents IS 'Vector similarity search using cosine distance';

-- ============================================
-- FUNCTIONS FROM 000003: Monthly Usage Tracking
-- ============================================

-- Trigger function for monthly quotas updated_at
CREATE OR REPLACE FUNCTION update_monthly_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if subscription needs renewal
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

-- Function: Renew subscription (refill tokens)
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

-- ============================================
-- FUNCTIONS FROM 000004: Token Reset System
-- ============================================

-- Function: Calculate next token reset
CREATE OR REPLACE FUNCTION calculate_next_token_reset(
    last_reset TIMESTAMP,
    cycle_days INTEGER
) RETURNS TIMESTAMP AS $$
BEGIN
    RETURN last_reset + (cycle_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Reset user tokens
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

COMMENT ON FUNCTION reset_user_tokens IS 'Reset tokens for a subscription to package limit';

-- ============================================
-- FUNCTIONS FROM 000005: Free Account System
-- ============================================

-- Function: Reset free account tokens
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

COMMENT ON FUNCTION reset_free_account_tokens(UUID, INTEGER) IS 'Reset tokens for free account';

-- Function: Consume free account tokens
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

COMMENT ON FUNCTION consume_free_account_tokens(UUID, INTEGER) IS 'Consume tokens from free account';

-- ============================================
-- FUNCTIONS FROM 000007: Conversation Sessions
-- ============================================

-- Function: Auto-update session metadata when message is added
CREATE OR REPLACE FUNCTION update_conversation_session_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversation_sessions
    SET
        message_count = (
            SELECT COUNT(*)
            FROM conversations
            WHERE conversation_session_id = NEW.conversation_session_id
        ),
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_conversation_session_metadata IS 'Auto-update conversation session metadata when messages are added';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger for monthly quotas (from 000003)
CREATE TRIGGER trigger_update_monthly_quotas_updated_at
BEFORE UPDATE ON monthly_usage_quotas
FOR EACH ROW
EXECUTE FUNCTION update_monthly_quotas_updated_at();

-- Trigger for conversation sessions (from 000007)
CREATE TRIGGER set_conversation_sessions_updated_at
BEFORE UPDATE ON conversation_sessions
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trigger_update_conversation_session_metadata
AFTER INSERT ON conversations
FOR EACH ROW
WHEN (NEW.conversation_session_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_session_metadata();

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
-- VIEWS
-- ============================================

-- View: Subscriptions due for reset (from 000004)
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

COMMENT ON VIEW subscriptions_due_for_reset IS 'Subscriptions that need token reset now';

-- View: Free accounts due for token reset (from 000005)
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

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Consolidated database schema initialized successfully!';
    RAISE NOTICE '📊 Tables: 13 tables created';
    RAISE NOTICE '🔧 Functions: 15+ helper functions';
    RAISE NOTICE '📈 Indexes: HNSW vector indexes + performance indexes';
    RAISE NOTICE '⚡ Triggers: Auto-update timestamps and quotas';
    RAISE NOTICE '📝 Views: 2 views for subscription/token management';
    RAISE NOTICE '';
    RAISE NOTICE 'Consolidated from migrations:';
    RAISE NOTICE '  - 000001: Base schema';
    RAISE NOTICE '  - 000002: User roles';
    RAISE NOTICE '  - 000003: Monthly usage tracking';
    RAISE NOTICE '  - 000004: Token reset system';
    RAISE NOTICE '  - 000005: Free account system';
    RAISE NOTICE '  - 000006: Admin user (moved to seeds)';
    RAISE NOTICE '  - 000007: Conversation sessions';
    RAISE NOTICE '  - 000008: Packages table alignment';
    RAISE NOTICE '  - 000009: Features JSONB fix (applied in schema)';
    RAISE NOTICE '  - 000010: Package cleanup (moved to seeds)';
END $$;
