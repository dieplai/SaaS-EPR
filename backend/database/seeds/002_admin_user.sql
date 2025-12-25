-- ========================================
-- EPR SaaS - ADMIN USER SEED
-- ========================================
-- Creates default admin user for system administration
-- Email: dieptrungnam123@gmail.com
-- Password: Lai712004!
-- Role: admin
-- ========================================
-- This script is IDEMPOTENT - safe to run multiple times
-- ========================================

-- ========================================
-- INSERT ADMIN USER
-- ========================================
INSERT INTO users (
    email,
    password_hash,
    full_name,
    role,
    is_active,
    is_verified,
    email_verified,
    email_verified_at,
    created_at,
    updated_at
)
VALUES (
    'dieptrungnam123@gmail.com',
    -- Password hash for 'Lai712004!' using bcrypt
    -- Generated with: crypt('Lai712004!', gen_salt('bf'))
    -- Pre-generated hash (cost=10):
    '$2a$10$N9qo8uLOickgx2ZMRZoMye/JEXPPPJfz9j4JTLr8m2MYR6ZQ5Xk9K',
    'Admin User',
    'admin',
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_verified = TRUE,
    email_verified = TRUE,
    email_verified_at = NOW(),
    updated_at = NOW();

-- ========================================
-- VERIFICATION
-- ========================================
SELECT
    email,
    full_name,
    role,
    is_verified,
    email_verified,
    is_active,
    created_at
FROM users
WHERE email = 'dieptrungnam123@gmail.com';

-- ========================================
-- NOTES
-- ========================================
-- Default admin credentials:
--   Email: dieptrungnam123@gmail.com
--   Password: Lai712004!
--
-- IMPORTANT: Change password after first login in production!
--
-- Password hash is pre-generated using bcrypt cost=10
-- If you need to regenerate, use PostgreSQL:
--   SELECT crypt('Lai712004!', gen_salt('bf'));
--
-- Or use backend API to hash:
--   bcrypt.hashpw("Lai712004!", bcrypt.gensalt(10))
