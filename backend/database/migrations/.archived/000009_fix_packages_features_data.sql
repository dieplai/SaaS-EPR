-- Fix existing packages data: convert features from object to array
-- This is idempotent and safe to run multiple times

-- Convert features from object {} to array []
UPDATE packages
SET features = '[]'::jsonb
WHERE features IS NOT NULL
  AND jsonb_typeof(features) = 'object';

-- Set NULL features to empty array
UPDATE packages
SET features = '[]'::jsonb
WHERE features IS NULL;
