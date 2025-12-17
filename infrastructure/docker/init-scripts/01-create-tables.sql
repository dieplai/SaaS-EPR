-- ============================================
-- EPR SaaS Database Schema - DDD Structure
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- IDENTITY CONTEXT - Users
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ============================================
-- SUBSCRIPTION CONTEXT - Packages
-- ============================================

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    query_limit INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_packages_deleted_at ON packages(deleted_at);

-- ============================================
-- SUBSCRIPTION CONTEXT - Subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    package_id UUID NOT NULL REFERENCES packages(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    remaining_queries INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_deleted_at ON subscriptions(deleted_at);

-- ============================================
-- SUBSCRIPTION CONTEXT - Usage Quotas
-- ============================================

CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    date DATE NOT NULL,
    query_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscription_id, date)
);

CREATE INDEX idx_usage_quotas_subscription_id ON usage_quotas(subscription_id);
CREATE INDEX idx_usage_quotas_date ON usage_quotas(date);

-- ============================================
-- Seed Data - Default Packages
-- ============================================

INSERT INTO packages (id, name, description, price, query_limit, duration_days, features, is_active)
VALUES
    (
        uuid_generate_v4(),
        'Free Trial',
        'Gói dùng thử miễn phí 7 ngày',
        0,
        50,
        7,
        '["Basic legal Q&A", "Document search", "50 queries/month"]'::jsonb,
        true
    ),
    (
        uuid_generate_v4(),
        'Basic',
        'Gói cơ bản cho cá nhân',
        99000,
        200,
        30,
        '["Legal consultation", "Document search", "200 queries/month", "Email support"]'::jsonb,
        true
    ),
    (
        uuid_generate_v4(),
        'Professional',
        'Gói chuyên nghiệp cho doanh nghiệp nhỏ',
        299000,
        1000,
        30,
        '["Priority support", "Advanced search", "1000 queries/month", "Export documents", "API access"]'::jsonb,
        true
    ),
    (
        uuid_generate_v4(),
        'Enterprise',
        'Gói doanh nghiệp với tính năng đầy đủ',
        999000,
        5000,
        30,
        '["24/7 support", "Unlimited search", "5000 queries/month", "Custom integration", "Dedicated account manager", "Training sessions"]'::jsonb,
        true
    )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON usage_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
