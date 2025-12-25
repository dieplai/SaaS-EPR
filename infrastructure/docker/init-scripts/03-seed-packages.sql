-- ========================================
-- EPR SaaS - PRICING PACKAGES
-- ========================================
-- 3 tiers: Starter, Professional, Enterprise
-- Free tier is default account tier (not a purchasable package)
-- All token limits are for OUTPUT tokens only
-- ========================================

-- ========================================
-- SEED DEFAULT PACKAGES (IDEMPOTENT)
-- ========================================

INSERT INTO packages (id, name, description, price, token_limit, duration_days, features, is_active, query_limit_daily, created_at, updated_at)
VALUES
    -- Free tier (hidden, for auto-assignment)
    (gen_random_uuid(), 'Free', 'Free tier for new users', 0, 100, 30, '["Basic AI Chat", "Limited tokens"]'::jsonb, false, 10, NOW(), NOW()),

    -- Starter package
    (gen_random_uuid(), 'Starter', 'Perfect for individuals and small teams', 5.00, 2000, 30, '["2,000 tokens/month", "Basic EPR compliance queries", "Email support", "Chat history", "Export to PDF"]'::jsonb, true, 50, NOW(), NOW()),

    -- Professional package
    (gen_random_uuid(), 'Professional', 'For growing businesses', 10.00, 5000, 30, '["5,000 tokens/month", "Advanced RAG queries", "Priority support", "API access", "Webhook integration", "Custom templates", "24/7 support"]'::jsonb, true, 200, NOW(), NOW()),

    -- Enterprise package
    (gen_random_uuid(), 'Enterprise', 'For large organizations with custom needs', 20.00, 20000, 30, '["20,000 tokens/month", "Unlimited users", "Dedicated support", "SLA 99.9%", "Custom model training", "On-premise option", "SSO integration", "Advanced analytics"]'::jsonb, true, 1000, NOW(), NOW())

ON CONFLICT (name) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT
    name,
    '$' || price || ' USD' as price,
    token_limit || ' tokens' as quota,
    duration_days || ' days' as duration,
    CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status
FROM packages
WHERE deleted_at IS NULL
ORDER BY price ASC;

-- ========================================
-- NOTES
-- ========================================
-- Free tier (default for all new accounts):
--   - 100 tokens/month
--   - No purchase required
--   - Managed at application level, not in packages table
--
-- Pricing (USD - frontend converts to VND):
--   - Starter: $5/month
--   - Professional: $10/month
--   - Enterprise: $20/month
--
-- All prices stored in USD (database)
-- Frontend converts to VND for display
-- Token limits are for OUTPUT tokens only
