# Rate Limiting

Comprehensive guide to TuvixRSS's rate limiting system for API protection and resource management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Deployment-Specific Setup](#deployment-specific-setup)
- [Rate Limit Types](#rate-limit-types)
- [Admin Management](#admin-management)
- [User Settings](#user-settings)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

TuvixRSS implements a rate limiting system with two distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│ 1. API Rate Limiting (Per-User, Authenticated)          │
│    - Based on user's subscription plan                  │
│    - Per-minute window                                  │
│    - Customizable per-user overrides                    │
│    - Cloudflare Workers rate limit bindings (Cloudflare)│
│    - No rate limiting (Docker Compose)                  │
│    - Protects tRPC endpoints                            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Public Feed Rate Limiting (Per-Feed Owner)           │
│    - Protects RSS feed endpoints                        │
│    - Per-minute window                                  │
│    - Anonymous access allowed                           │
│    - Rate limited by feed owner's plan                  │
│    - Access logging for analytics                       │
│    - Cloudflare Workers rate limit bindings (Cloudflare)│
│    - No rate limiting (Docker Compose)                  │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- **Cloudflare Workers Native**: Uses Cloudflare Workers rate limit bindings for production deployments
- **Per-Minute Windows**: All rate limits are enforced on a per-minute basis
- **Plan-Based Limits**: Rate limits are configured per subscription plan
- **Custom Overrides**: Admins can set custom limits for individual users
- **Docker Compose**: No rate limiting for Docker Compose deployments (always allows requests)
- **Access Logging**: Track public feed usage for analytics

---

## Architecture

### Rate Limiter Service

**Location**: `packages/api/src/services/rate-limiter.ts`

The rate limiter uses Cloudflare Workers rate limit bindings for Cloudflare deployments and has no rate limiting for Docker Compose.

```typescript
interface RateLimitResult {
  allowed: boolean;      // Whether request is allowed
  limit: number;        // Maximum requests in window (user's plan limit)
  remaining: number;    // Requests remaining (approximate)
  resetAt: Date;        // When the limit resets
}

type RateLimitType = "api" | "publicFeed";
```

---

## How It Works

### Cloudflare Workers Deployment

1. **Request arrives** → Check user's rate limit from database/plan
2. **Get rate limit binding** → Select `API_RATE_LIMIT` or `FEED_RATE_LIMIT` based on request type
3. **Create unique key** → Format: `"type:userId"` (e.g., `"api:123"` or `"publicFeed:456"`)
4. **Call binding** → `binding.limit({ key })` - this consumes a request and returns status
5. **Enforce user limit** → Check if user has exceeded their plan-specific limit
6. **Allow or deny** → Return result based on user's plan limit

**Key Points**:
- Each user gets their own independent counter tracked by the binding
- The binding has a high limit (10,000 requests/minute) to prevent abuse
- User-specific limits (from their plan) are enforced in application code
- The binding's `remaining` value is used to approximate user's usage

### Docker Compose Deployment

- **No rate limiting**: All requests are automatically allowed
- **No configuration needed**: Rate limiting is disabled by default
- **Useful for**: Development, testing, and single-user deployments

---

## Configuration

### Cloudflare Workers Setup

#### Step 1: Update wrangler.toml

**Note**: Rate limit `namespace_id` values are user-defined positive integers that you choose yourself (e.g., `"1001"`, `"1002"`). They don't need to be created via CLI or dashboard - you simply assign unique integer IDs in your `wrangler.toml` configuration.

```toml
# Rate Limit Bindings for API and Public Feed rate limiting
# Uses Cloudflare Workers rate limit bindings
# namespace_id: A positive integer you define, unique to your Cloudflare account
# You choose these IDs yourself - they don't need to be created elsewhere
[[ratelimits]]
name = "API_RATE_LIMIT"
namespace_id = "1001"  # User-defined identifier - choose any unique positive integer
simple = { limit = 10000, period = 60 }  # High limit - actual limits enforced per user via getUserLimits()

[[ratelimits]]
name = "FEED_RATE_LIMIT"
namespace_id = "1002"  # User-defined identifier - choose any unique positive integer
simple = { limit = 10000, period = 60 }  # High limit - actual limits enforced per user via getUserLimits()
```

#### Step 2: Deploy

```bash
# Deploy to Cloudflare
wrangler deploy
```

### Docker Compose Setup

**No configuration required** - rate limiting is automatically disabled.

---

## Rate Limit Types

### 1. API Rate Limiting

**Purpose**: Prevent API abuse and ensure fair resource allocation

**Configuration**: Based on user's subscription plan

**Default Limits by Plan**:
| Plan | Requests per Minute |
|------|---------------------|
| Free | 60 |
| Pro | 180 |
| Enterprise | 600 |
| Custom | Admin-defined |

**Endpoints Protected**: All authenticated tRPC procedures

**How It Works**:
- Each authenticated API request checks the user's rate limit
- Uses `API_RATE_LIMIT` binding with key `"api:userId"`
- User's plan limit is enforced in application code
- Returns `TOO_MANY_REQUESTS` error if limit exceeded

### 2. Public Feed Rate Limiting

**Purpose**: Prevent abuse of public RSS feeds while allowing anonymous access

**Configuration**: Based on feed owner's plan

**Default Limits by Plan**:
| Plan | Requests per Minute |
|------|---------------------|
| Free | ~17 |
| Pro | ~167 |
| Enterprise | ~1,667 |
| Custom | Admin-defined |

**Key Features**:
- Anonymous access allowed (RSS readers don't authenticate)
- Rate limited by feed owner, not requester
- Protects feed owner's resources
- Access logging for analytics

**Endpoints Protected**:
- `GET /public/:username/:slug` (Express/Docker)
- `GET /public/:username/:slug` (Cloudflare Workers)

**How It Works**:
- Each public feed request checks the feed owner's rate limit
- Uses `FEED_RATE_LIMIT` binding with key `"publicFeed:ownerUserId"`
- Feed owner's plan limit is enforced in application code
- Returns `429 Too Many Requests` if limit exceeded

---

## Admin Management

### Managing Plans

**Location**: Admin Dashboard → Plans

Admins can create and edit subscription plans with rate limits:

1. **API Rate Limit (per minute)**: Maximum API requests per minute for users on this plan
2. **Public Feed Rate Limit (per minute)**: Maximum public feed requests per minute

**Note**: All rate limits are configured per-minute. The system uses Cloudflare Workers rate limit bindings for enforcement.

### Setting Custom Limits

**Location**: Admin Dashboard → Users → [User] → Set Custom Limits

Admins can override plan limits for specific users:

- **API Rate Limit**: Override the user's plan API rate limit
- **Public Feed Rate Limit**: Override the user's plan public feed rate limit

**Use Cases**:
- Beta testers who need higher limits
- Users with special requirements
- Temporary limit increases

### Monitoring Rate Limits

**Location**: Admin Dashboard → Rate Limits

The rate limits monitor shows:
- **Public Feed Access (24h)**: Total RSS feed requests in the last 24 hours
- **Rate Limiting Status**: Whether rate limiting is enabled (Cloudflare) or disabled (Docker)
- **Recent Public Feed Access**: Last 50 RSS feed requests with IP addresses and user agents

---

## User Settings

**Location**: Settings → Usage & Limits

Users can view their rate limits:

- **Rate Limiting Status**: Shows if rate limiting is enabled or disabled
- **API Requests (per minute)**: Shows the user's API rate limit from their plan
- **Public Feed Access (per minute)**: Shows the user's public feed rate limit from their plan
- **Custom Limits Indicator**: Shows if custom limits are applied

**Note**: Detailed usage statistics (used/remaining) are not available because Cloudflare Workers rate limit bindings don't expose per-user usage data. Users see their plan limits, not real-time usage.

---

## Troubleshooting

### Rate Limiting Not Working

**Symptoms**: Requests are not being rate limited

**Solutions**:
1. **Check deployment type**: Rate limiting only works on Cloudflare Workers, not Docker Compose
2. **Verify bindings**: Ensure `API_RATE_LIMIT` and `FEED_RATE_LIMIT` are configured in `wrangler.toml` with correct format:
   - Uses `name` (not `binding`)
   - Uses `namespace_id` as a string integer (e.g., `"1001"`)
   - Uses `simple` object with `limit` and `period`
3. **Check namespace IDs**: Ensure `namespace_id` values are unique positive integers (you choose these yourself)
4. **Check logs**: Look for warnings about missing bindings in worker logs

### Rate Limits Too Strict

**Symptoms**: Users hitting rate limits too frequently

**Solutions**:
1. **Increase plan limits**: Edit the user's plan in Admin Dashboard → Plans
2. **Set custom limits**: Override limits for specific users in Admin Dashboard → Users
3. **Check for abuse**: Review rate limit monitor for unusual patterns

### Rate Limits Too Lenient

**Symptoms**: Users making excessive requests

**Solutions**:
1. **Decrease plan limits**: Edit the user's plan in Admin Dashboard → Plans
2. **Remove custom limits**: Remove custom overrides for users
3. **Review plan tiers**: Consider adjusting default limits for all plans

---

## Best Practices

### Plan Configuration

- **Free Plan**: Set conservative limits (e.g., 60 API requests/min, ~17 feed requests/min)
- **Pro Plan**: Set moderate limits (e.g., 180 API requests/min, ~167 feed requests/min)
- **Enterprise Plan**: Set high limits (e.g., 600 API requests/min, ~1667 feed requests/min)

### Custom Limits

- **Use sparingly**: Only set custom limits when necessary
- **Document reasons**: Add notes when setting custom limits
- **Review regularly**: Periodically review custom limits and remove unnecessary ones

### Monitoring

- **Check rate limit monitor**: Regularly review public feed access logs
- **Watch for patterns**: Look for unusual access patterns that might indicate abuse
- **Adjust as needed**: Update plan limits based on actual usage patterns

### Docker Compose Deployments

- **No rate limiting**: Docker Compose deployments have no rate limiting
- **Suitable for**: Development, testing, single-user deployments
- **Not suitable for**: Production multi-user deployments (use Cloudflare Workers)

---

## Technical Details

### Rate Limit Binding API

Cloudflare Workers rate limit bindings provide:

```typescript
interface RateLimit {
  limit(options: { key: string }): Promise<{
    success: boolean;    // Whether the request was allowed
    limit: number;      // Binding's limit (10000)
    remaining: number;  // Requests remaining in binding's limit
    reset: number;      // Unix timestamp when limit resets
  }>;
}
```

### Key Format

Keys are formatted as `"type:userId"`:
- API requests: `"api:123"`
- Public feed requests: `"publicFeed:456"`

### Limit Enforcement

1. Binding tracks requests per key (up to 10,000/minute)
2. Application code enforces user's plan limit
3. If user exceeds plan limit, request is denied even if binding allows it

### Docker Compose Behavior

- `checkRateLimit()` always returns `allowed: true` for Docker Compose
- No rate limit checking is performed
- All requests are automatically allowed

