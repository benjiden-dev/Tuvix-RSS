-- Migration: Update plan rate limits to match plan-specific bindings
-- Date: 2024-11-21
-- Purpose: Update existing plan rate limits from old values (30/120/600) to new values (60/180/600)
--          to match the plan-specific Cloudflare Workers bindings

-- Update free plan: 30 -> 60 requests per minute
UPDATE `plans` 
SET 
  `api_rate_limit_per_minute` = 60,
  `updated_at` = strftime('%s', 'now') * 1000
WHERE `id` = 'free' AND `api_rate_limit_per_minute` = 30;

-- Update pro plan: 120 -> 180 requests per minute
UPDATE `plans` 
SET 
  `api_rate_limit_per_minute` = 180,
  `updated_at` = strftime('%s', 'now') * 1000
WHERE `id` = 'pro' AND `api_rate_limit_per_minute` = 120;

-- Enterprise plan should already be 600, but update if it's different
UPDATE `plans` 
SET 
  `api_rate_limit_per_minute` = 600,
  `updated_at` = strftime('%s', 'now') * 1000
WHERE `id` = 'enterprise' AND `api_rate_limit_per_minute` != 600;

