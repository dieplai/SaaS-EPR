-- ============================================================================
-- EPR Legal SaaS - Database Initialization (Idempotent)
-- ============================================================================
-- This script runs ONCE when postgres container is first created
-- Safe to run multiple times
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Verify extensions loaded
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'uuid-ossp extension not loaded';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'vector extension not loaded';
  END IF;

  RAISE NOTICE 'All required extensions loaded successfully';
END $$;
