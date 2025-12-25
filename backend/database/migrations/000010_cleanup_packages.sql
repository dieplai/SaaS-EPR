-- Clean up packages table - keep only 3 purchasable tiers
-- Remove: Free (not a package), basic, pro, business (old data)

DELETE FROM packages WHERE name IN ('Free', 'free', 'basic', 'pro', 'business', 'Basic', 'Pro', 'Business');

-- Ensure we only have the 3 correct packages
-- The seed script (03-seed-packages.sql) will insert them if missing
