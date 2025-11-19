/**
 * Plan System Configuration
 *
 * This file centralizes plan-related constants and defaults.
 * Plans themselves are stored in the database and can be added/modified
 * without code changes.
 */

/**
 * Default plan assigned to new users
 */
export const DEFAULT_USER_PLAN = "free";

/**
 * Plan assigned to admin users
 */
export const ADMIN_PLAN = "enterprise";

/**
 * Plan ID used when user has custom limits
 */
export const CUSTOM_PLAN = "custom";

/**
 * Well-known plan IDs (for reference/documentation)
 * These are seeded by migrations but can be changed in the database
 */
export const KNOWN_PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
  CUSTOM: "custom",
} as const;
