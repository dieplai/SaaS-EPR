-- Seed packages for EPR Legal SaaS
INSERT INTO packages (id, name, description, price, duration_days, query_limit, is_active, features, created_at, updated_at) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Free',
    'Trial package for testing the service',
    0,
    30,
    10,
    true,
    '["Basic legal Q&A", "10 queries per day", "Community support"]',
    NOW(),
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Basic',
    'Perfect for individuals and small businesses',
    9.99,
    30,
    100,
    true,
    '["All Free features", "100 queries per day", "Email support", "Document analysis"]',
    NOW(),
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Pro',
    'Best for growing businesses with advanced needs',
    29.99,
    30,
    1000,
    true,
    '["All Basic features", "1000 queries per day", "Priority support", "Advanced analytics", "Custom templates"]',
    NOW(),
    NOW()
),
(
    'a0000000-0000-0000-0000-000000000004',
    'Business',
    'Unlimited access for enterprises',
    99.99,
    30,
    999999,
    true,
    '["All Pro features", "Unlimited queries", "24/7 phone support", "Dedicated account manager", "API access", "Custom integrations"]',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
