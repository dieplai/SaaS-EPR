-- ============================================
-- EPR Legal SaaS - Rollback Migration
-- ============================================
-- Clean rollback: DROP ALL tables, functions, views, triggers, extensions
-- ============================================

-- ============================================
-- DROP VIEWS
-- ============================================
DROP VIEW IF EXISTS free_accounts_due_for_reset CASCADE;
DROP VIEW IF EXISTS subscriptions_due_for_reset CASCADE;

-- ============================================
-- DROP TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_daily_quota ON subscriptions;
DROP TRIGGER IF EXISTS trigger_update_conversation_session_metadata ON conversations;
DROP TRIGGER IF EXISTS set_conversation_sessions_updated_at ON conversation_sessions;
DROP TRIGGER IF EXISTS trigger_update_monthly_quotas_updated_at ON monthly_usage_quotas;
DROP TRIGGER IF EXISTS set_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS set_packages_updated_at ON packages;
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS set_users_updated_at ON users;

-- ============================================
-- DROP FUNCTIONS
-- ============================================

-- Conversation session functions
DROP FUNCTION IF EXISTS update_conversation_session_metadata CASCADE;

-- Free account functions
DROP FUNCTION IF EXISTS consume_free_account_tokens(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS reset_free_account_tokens(UUID, INTEGER) CASCADE;

-- Token reset functions
DROP FUNCTION IF EXISTS reset_user_tokens(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_next_token_reset(TIMESTAMP, INTEGER) CASCADE;

-- Monthly subscription functions
DROP FUNCTION IF EXISTS renew_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS should_renew_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_monthly_quotas_updated_at CASCADE;

-- Helper functions
DROP FUNCTION IF EXISTS search_similar_documents(vector, FLOAT, INT) CASCADE;
DROP FUNCTION IF EXISTS get_user_quota(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_query_count(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS can_user_query(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_daily_quota CASCADE;
DROP FUNCTION IF EXISTS trigger_set_updated_at CASCADE;

-- ============================================
-- DROP TABLES (in reverse dependency order)
-- ============================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS conversation_sessions CASCADE;
DROP TABLE IF EXISTS monthly_usage_quotas CASCADE;
DROP TABLE IF EXISTS usage_quotas CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- DROP EXTENSIONS
-- ============================================
DROP EXTENSION IF EXISTS vector CASCADE;
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Database schema rolled back successfully!';
    RAISE NOTICE '❌ All tables, functions, views, triggers, and extensions dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now in clean state.';
    RAISE NOTICE 'Run migration UP to recreate schema.';
END $$;
