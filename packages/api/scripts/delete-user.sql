-- Delete User and All Associated Data
-- 
-- USAGE:
--   1. Replace <USER_ID> with the numeric user ID to delete
--   2. Replace <USER_EMAIL> with the user's email address (for verification cleanup)
--   3. Execute: wrangler d1 execute tuvix --remote --file=scripts/delete-user.sql
--
-- EXAMPLE:
--   To delete user ID 3 with email "user@example.com":
--   - Replace <USER_ID> with 3
--   - Replace <USER_EMAIL> with 'user@example.com'
--
-- Most tables have CASCADE DELETE configured, so deleting the user will automatically
-- delete related data. However, we need to manually clean up:
-- 1. verification table (no FK, uses identifier which might be email)
-- 2. Optional: security_audit_log and api_usage_log (set to null, but we can delete them)

-- Step 1: Delete verification tokens for this user's email
DELETE FROM verification WHERE identifier = '<USER_EMAIL>';

-- Step 2: Delete audit logs for this user (optional - they're set to null on cascade)
DELETE FROM security_audit_log WHERE user_id = <USER_ID>;

-- Step 3: Delete API usage logs for this user (optional - they're set to null on cascade)
DELETE FROM api_usage_log WHERE user_id = <USER_ID>;

-- Step 4: Delete the user (this will CASCADE delete):
--   - sessions
--   - accounts
--   - subscriptions (and subscription_filters via subscription cascade)
--   - categories (and subscription_categories, feed_categories via category cascade)
--   - feeds (and feed_categories, public_feed_access_log via feed cascade)
--   - user_article_states
--   - user_settings
--   - password_reset_tokens
--   - user_limits
--   - usage_stats
DELETE FROM user WHERE id = <USER_ID>;

