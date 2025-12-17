-- ============================================
-- Create Default Admin User
-- ============================================
-- Email: dieptrungnam123@gmail.com
-- Username: dieplai
-- Password: Lai712004!
-- Role: admin
-- ============================================

-- Insert admin user if not exists
INSERT INTO users (
    email,
    password_hash,
    full_name,
    is_active,
    is_verified,
    email_verified_at,
    role,
    created_at,
    updated_at
)
SELECT
    'dieptrungnam123@gmail.com',
    crypt('Lai712004!', gen_salt('bf')),  -- bcrypt hash
    'dieplai',
    TRUE,
    TRUE,
    NOW(),
    'admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'dieptrungnam123@gmail.com'
);

COMMENT ON TABLE users IS 'Default admin user created for system administration';

-- ============================================
-- Rollback (down migration)
-- ============================================
-- To rollback this migration, run:
-- DELETE FROM users WHERE email = 'dieptrungnam123@gmail.com';
