/**
 * Rate Limiter Service
 *
 * Implements rate limiting for API requests and public feed access.
 * Uses Cloudflare Workers rate limit bindings for Cloudflare deployments.
 * Rate limiting is disabled for Docker Compose deployments.
 */

import type { Env } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export type RateLimitType = "api" | "publicFeed";

// ============================================================================
// RATE LIMITING LOGIC
// ============================================================================

/**
 * Check if user can make a request
 *
 * @param env Environment configuration
 * @param userId User ID
 * @param limit Maximum requests allowed in the window (user's plan limit)
 * @param windowMs Window size in milliseconds
 * @param type Rate limit type (api or publicFeed)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  env: Env,
  userId: number,
  limit: number,
  windowMs: number,
  type: RateLimitType,
): Promise<RateLimitResult> {
  // Docker Compose: Always allow (no rate limiting)
  if (env.RUNTIME === "nodejs") {
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + windowMs),
    };
  }

  // Cloudflare Workers: Use rate limit bindings
  if (env.RUNTIME === "cloudflare") {
    // Select the appropriate binding based on type
    const binding = type === "api" ? env.API_RATE_LIMIT : env.FEED_RATE_LIMIT;

    if (!binding) {
      console.error(
        `❌ Rate limit binding missing for type: ${type}. ` +
          `Rate limiting disabled for this request.`,
      );
      // Fallback: allow request but log warning
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetAt: new Date(Date.now() + windowMs),
      };
    }

    // Create a unique key for this user and rate limit type
    // Format: "type:userId" e.g., "api:123" or "publicFeed:456"
    // Each user gets their own counter tracked by the binding
    const key = `${type}:${userId}`;

    try {
      // Call the rate limit binding - this consumes a request and returns status
      // The binding tracks requests per key independently
      const result = await binding.limit({ key });

      // Check if binding's hard cap was exceeded (shouldn't happen normally)
      if (!result.success) {
        // User exceeded even the high binding limit (10000)
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: new Date(result.reset * 1000),
        };
      }

      // The binding has a high limit (10000) to prevent abuse
      // Calculate how many requests user has made (including this one)
      // result.remaining is how many requests are left in the binding's limit
      const bindingLimit = result.limit; // Should be 10000
      const bindingUsed = bindingLimit - result.remaining; // Total requests made (including this one)

      // Enforce user's plan-specific limit
      // If user has exceeded their plan limit, deny (even though binding allowed it)
      const allowed = bindingUsed <= limit;

      // Calculate remaining requests for user based on their plan limit
      const userRemaining = Math.max(0, limit - bindingUsed);

      return {
        allowed,
        limit,
        remaining: userRemaining,
        resetAt: new Date(result.reset * 1000), // Convert to milliseconds
      };
    } catch (error) {
      console.error(`Error checking rate limit for ${key}:`, error);
      // On error, allow the request but log it
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetAt: new Date(Date.now() + windowMs),
      };
    }
  }

  // Fallback: allow request
  return {
    allowed: true,
    limit,
    remaining: limit,
    resetAt: new Date(Date.now() + windowMs),
  };
}

/**
 * Check API rate limit for a user
 *
 * @param env Environment configuration
 * @param userId User ID
 * @param limitPerMinute Max API requests per minute
 * @returns Rate limit result
 */
export async function checkApiRateLimit(
  env: Env,
  userId: number,
  limitPerMinute: number,
): Promise<RateLimitResult> {
  return checkRateLimit(env, userId, limitPerMinute, 60 * 1000, "api");
}

/**
 * Check public feed rate limit for a user
 *
 * @param env Environment configuration
 * @param userId User ID
 * @param limitPerMinute Max public feed requests per minute
 * @returns Rate limit result
 */
export async function checkPublicFeedRateLimit(
  env: Env,
  userId: number,
  limitPerMinute: number,
): Promise<RateLimitResult> {
  return checkRateLimit(env, userId, limitPerMinute, 60 * 1000, "publicFeed");
}
