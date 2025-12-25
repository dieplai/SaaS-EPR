-- ========================================
-- EPR SaaS - PRICING PACKAGES
-- ========================================
-- 3 tiers: Starter, Professional, Enterprise
-- Free tier is default account tier (not a purchasable package)
-- All token limits are for OUTPUT tokens only
-- ========================================

-- ========================================
-- SEED PURCHASABLE PACKAGES (IDEMPOTENT)
-- ========================================
-- NOTE: Free tier is NOT a package - it's the default account state
-- Only 3 purchasable packages: Starter, Professional, Enterprise

INSERT INTO packages (id, name, description, price, token_limit, duration_days, features, is_active, query_limit_daily, created_at, updated_at)
VALUES
    -- Starter package ($5/month)
    (gen_random_uuid(), 'Starter', 'Perfect for individuals and small teams', 5.00, 2000, 30, '["2,000 tokens/month", "Basic EPR compliance queries", "Email support", "Chat history", "Export to PDF"]'::jsonb, true, 67, NOW(), NOW()),

    -- Professional package ($10/month)
    (gen_random_uuid(), 'Professional', 'For growing businesses', 10.00, 5000, 30, '["5,000 tokens/month", "Advanced RAG queries", "Priority support", "API access", "Webhook integration", "Custom templates", "24/7 support"]'::jsonb, true, 167, NOW(), NOW()),

    -- Enterprise package ($20/month)
    (gen_random_uuid(), 'Enterprise', 'For large organizations with custom needs', 20.00, 20000, 30, '["20,000 tokens/month", "Unlimited users", "Dedicated support", "SLA 99.9%", "Custom model training", "On-premise option", "SSO integration", "Advanced analytics"]'::jsonb, true, 667, NOW(), NOW())

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
--   - 100 tokens/month (managed in application logic)
--   - NO database record - not a purchasable package
--   - Users start with free tier automatically
--
-- Purchasable packages (3 tiers):
--   - Starter: $5/month - 2,000 tokens
--   - Professional: $10/month - 5,000 tokens
--   - Enterprise: $20/month - 20,000 tokens
--
-- All prices stored in USD (database)
-- Frontend converts to VND for display
-- Token limits are for OUTPUT tokens only
--
-- query_limit_daily = token_limit / 30 days (approximate)
