-- ============================================
-- EPR Legal SaaS - Complete Database Schema
-- PostgreSQL 16 + pgvector extension
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings

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

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,

    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE users IS 'User accounts for the platform';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';

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

    -- Basic info
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly

    -- Quotas
    query_limit_daily INT NOT NULL,
    query_limit_monthly INT,

    -- Features (JSON for flexibility)
    allowed_models JSONB DEFAULT '["gpt-3.5-turbo"]'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,

    -- Access control
    api_access BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    max_conversation_history INT DEFAULT 20,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_packages_active ON packages(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE packages IS 'Subscription plans (Free, Basic, Pro, Business)';
COMMENT ON COLUMN packages.features IS 'JSON object with package features';

-- Seed initial packages
INSERT INTO packages (name, display_name, description, price, billing_period, query_limit_daily, query_limit_monthly, allowed_models, features) VALUES
('free', 'Free Trial', 'Dùng thử miễn phí với tính năng cơ bản', 0.00, 'monthly', 10, 300,
    '["gpt-3.5-turbo"]'::jsonb,
    '{"document_search": true, "conversation_history": 5, "support": "community"}'::jsonb),

('basic', 'Basic', 'Gói cơ bản cho cá nhân và freelancer', 9.00, 'monthly', 100, 3000,
    '["gpt-3.5-turbo"]'::jsonb,
    '{"document_search": true, "conversation_history": 20, "support": "email", "response_time": "48h"}'::jsonb),

('pro', 'Professional', 'Gói chuyên nghiệp cho doanh nghiệp nhỏ', 29.00, 'monthly', 1000, 30000,
    '["gpt-3.5-turbo", "gpt-4o-mini"]'::jsonb,
    '{"document_search": true, "conversation_history": 50, "support": "priority", "response_time": "24h", "api_access": true}'::jsonb),

('business', 'Business', 'Gói doanh nghiệp cao cấp', 99.00, 'monthly', 999999, 999999,
    '["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4"]'::jsonb,
    '{"document_search": true, "conversation_history": 100, "support": "dedicated", "response_time": "2h", "api_access": true, "custom_training": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended, trial

    -- Billing period
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP NOT NULL,

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

    UNIQUE(user_id) -- One active subscription per user
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

COMMENT ON TABLE subscriptions IS 'User subscription to packages';
COMMENT ON COLUMN subscriptions.status IS 'active, cancelled, expired, suspended, trial';

-- ============================================
-- 5. USAGE QUOTAS
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
-- 6. DOCUMENTS (with vector embeddings)
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
-- 7. CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,

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

-- Partitioning by month for performance (optional, for large scale)
-- CREATE TABLE conversations_2024_11 PARTITION OF conversations
-- FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

COMMENT ON TABLE conversations IS 'Chat conversation history';
COMMENT ON COLUMN conversations.sources IS 'Array of document IDs used for RAG';

-- ============================================
-- 8. FAQ (Frequently Asked Questions)
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
-- 9. ANALYTICS EVENTS
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

-- Partition by month for performance
-- ALTER TABLE analytics_events PARTITION BY RANGE (created_at);

COMMENT ON TABLE analytics_events IS 'User activity tracking and analytics';

-- ============================================
-- 10. PAYMENTS (for future)
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
-- TRIGGERS
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

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON documents
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
-- VIEWS
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
    p.price as package_price,
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
-- SEED DATA
-- ============================================

-- Create demo user (password: demo123)
DO $$
DECLARE
    demo_user_id UUID;
    free_package_id UUID;
BEGIN
    -- Insert demo user
    INSERT INTO users (email, password_hash, full_name, is_verified)
    VALUES (
        'demo@epr-legal.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKJ3VkZ.XS', -- demo123
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
    RAISE NOTICE '📊 Tables: users, packages, subscriptions, usage_quotas, documents, conversations, faq, analytics_events, payments';
    RAISE NOTICE '🔧 Functions: can_user_query, increment_query_count, get_user_quota, search_similar_documents';
    RAISE NOTICE '📈 Indexes: HNSW vector indexes for fast similarity search';
    RAISE NOTICE '👤 Demo user: demo@epr-legal.com / demo123';
    RAISE NOTICE '📦 Packages: free, basic, pro, business';
END $$;
