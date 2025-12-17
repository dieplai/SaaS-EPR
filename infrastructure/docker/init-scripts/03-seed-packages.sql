-- Seed data for packages with token-based pricing
-- Description: 4 tiers - Free, Basic, Professional, Enterprise
-- All token limits are for OUTPUT tokens only
-- Date: 2025-01-XX

-- ========================================
-- CLEANUP: Remove old packages if exist
-- ========================================

-- Soft delete existing packages (keep for history)
UPDATE packages SET deleted_at = NOW() WHERE deleted_at IS NULL;

-- ========================================
-- PACKAGE 1: FREE TIER
-- ========================================

INSERT INTO packages (
    id,
    name,
    description,
    price,
    token_limit,
    duration_days,
    features,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Free',
    'Gói miễn phí cho người dùng mới. Dùng thử các tính năng cơ bản của hệ thống tư vấn pháp lý EPR.',
    0,
    10000,  -- 10K tokens ~ 5-10 queries
    30,
    '["Truy vấn cơ sở tri thức EPR", "Tìm kiếm văn bản pháp luật", "Hỗ trợ tiếng Việt", "10,000 tokens output", "Không giới hạn tin nhắn"]'::jsonb,
    true,
    NOW(),
    NOW()
);

-- ========================================
-- PACKAGE 2: BASIC TIER
-- ========================================

INSERT INTO packages (
    id,
    name,
    description,
    price,
    token_limit,
    duration_days,
    features,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Basic',
    'Gói cơ bản dành cho doanh nghiệp vừa và nhỏ. Đủ cho nhu cầu tư vấn pháp lý hàng tháng.',
    199000,  -- 199,000 VND/month
    500000,  -- 500K tokens ~ 250-500 queries
    30,
    '["Tất cả tính năng Free", "500,000 tokens output/tháng", "Truy vấn nâng cao với RAG", "Lịch sử hội thoại", "Hỗ trợ email", "Xuất báo cáo PDF"]'::jsonb,
    true,
    NOW(),
    NOW()
);

-- ========================================
-- PACKAGE 3: PROFESSIONAL TIER
-- ========================================

INSERT INTO packages (
    id,
    name,
    description,
    price,
    token_limit,
    duration_days,
    features,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Professional',
    'Gói chuyên nghiệp cho doanh nghiệp có nhu cầu tư vấn thường xuyên. Ưu tiên hỗ trợ 24/7.',
    499000,  -- 499,000 VND/month
    1500000, -- 1.5M tokens ~ 750-1500 queries
    30,
    '["Tất cả tính năng Basic", "1,500,000 tokens output/tháng", "Tìm kiếm web thời gian thực", "Phát hiện ảo giác AI", "Hỗ trợ 24/7", "API access", "Webhook integration", "Tùy chỉnh prompt"]'::jsonb,
    true,
    NOW(),
    NOW()
);

-- ========================================
-- PACKAGE 4: ENTERPRISE TIER
-- ========================================

INSERT INTO packages (
    id,
    name,
    description,
    price,
    token_limit,
    duration_days,
    features,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Enterprise',
    'Gói doanh nghiệp cho tổ chức lớn. Không giới hạn người dùng, hỗ trợ tùy chỉnh theo yêu cầu.',
    999000,  -- 999,000 VND/month
    5000000, -- 5M tokens ~ 2500-5000 queries
    30,
    '["Tất cả tính năng Professional", "5,000,000 tokens output/tháng", "Không giới hạn người dùng", "Dedicated support", "SLA 99.9%", "Custom model training", "On-premise deployment option", "Advanced analytics", "SSO integration"]'::jsonb,
    true,
    NOW(),
    NOW()
);

-- ========================================
-- VERIFICATION
-- ========================================

-- Show all active packages
SELECT
    name,
    price || ' VND' as price,
    (token_limit / 1000) || 'K tokens' as quota,
    duration_days || ' days' as duration,
    is_active
FROM packages
WHERE deleted_at IS NULL
ORDER BY price ASC;

-- ========================================
-- NOTES
-- ========================================

-- Token calculation estimates:
-- - Average response: 1000-2000 tokens
-- - Short answer: 200-500 tokens
-- - Detailed answer: 2000-4000 tokens
-- - Maximum context: ~8000 tokens per conversation
--
-- Pricing rationale:
-- - Free: Trial users, ~10 queries
-- - Basic: ¥199k/mo = ~$8/mo, cost-effective for SMB
-- - Professional: ¥499k/mo = ~$20/mo, includes premium features
-- - Enterprise: ¥999k/mo = ~$40/mo, unlimited users + dedicated support
--
-- All prices in Vietnamese Dong (VND)
-- Token limits are for OUTPUT tokens only (not input)
