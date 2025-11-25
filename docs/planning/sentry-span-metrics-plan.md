# Sentry Metrics Implementation Plan

## Implementation Status

**Progress**: ~95% Complete (All Core Metrics Implemented)

### ✅ Completed
- **Phase 1: Foundation** - All utilities (metrics.ts, db-metrics.ts) and Sentry config complete
- **Priority 1: RSS Feed Fetching** - Full metrics for feed fetching, parsing, and article discovery
- **Priority 2: Database Queries** - Complete metrics for articles, subscriptions, and admin routers
- **Priority 3: External API Integrations** - Resend email, favicon discovery, and OG image extraction
- **Priority 4: Public Feed Generation** - RSS 2.0 XML generation with multi-step query tracking
- **Priority 5: User Signup Flow** - Complete funnel tracking with error capture
- **Priority 6: Cron Job Monitoring** - RSS fetch and article prune metrics with timing
- **Priority 7: Global Application Metrics** - Runtime, version, and environment on all spans

### ⏳ Remaining (~5%)
- Dashboard creation in Sentry UI
- Alert configuration for critical metrics
- Documentation of metrics catalog

## Implemented Metrics Summary

### Sentry Metrics (Counters & Distributions)
**RSS Feed Operations**:
- `rss.sources_total` - Total feed sources being fetched
- `rss.batch_completed` - Batch completion with success/error counts
- `rss.feed_fetched` - Individual feed fetch success/failure by domain
- `rss.articles_discovered` - New articles found per feed
- `rss.articles_skipped` - Duplicate articles skipped
- `rss.fetch_all_duration` - Total batch fetch time

**Email Operations**:
- `email.sent` - Email delivery status (success/error/exception) by type
- `email.not_configured` - Dev mode email attempts
- `email.send_duration` - Time to send emails

**Favicon Discovery**:
- `favicon.discovered` - Discovery success/failure by strategy
- `favicon.fetched` - Icon fetch success/failure with size tracking
- `favicon.discovery_duration` - Time to discover favicon
- `favicon.fetch_duration` - Time to fetch icon data

**OG Image Extraction**:
- `og_image.extracted` - Extraction success/failure by domain
- `og_image.extraction_duration` - HTML parsing time

**Public Feed Generation**:
- `public_feed.generated` - Feed generation success/failure/errors
- `public_feed.generation_duration` - End-to-end generation time

**Cron Jobs**:
- `cron.rss_fetch_triggered` - Execution vs skip tracking
- `cron.prune_triggered` - Execution vs skip tracking
- `cron.articles_pruned` - Articles deleted with prune_days tag
- `cron.prune_completed` - Success/error status
- `cron.article_prune_duration` - Prune operation timing

### Database Query Metrics (via withQueryMetrics)
**Articles Router**: 15+ queries tracked
**Subscriptions Router**: 10+ queries tracked
**Admin Router**: 20+ queries tracked
**Public Feed Router**: 5+ queries tracked

Each query tracks:
- Duration (distribution)
- Success/failure (counter)
- Slow queries > 1s (counter)
- Runtime environment (nodejs/cloudflare)
- Operation metadata (filters, limits, etc.)

### Global Context (All Spans)
- `runtime` - nodejs or cloudflare
- `app.version` - Release version
- `app.environment` - Environment (dev/staging/prod)

---

## Overview

This plan outlines the implementation of comprehensive metrics throughout TuvixRSS using **two complementary approaches**:

1. **Span Metrics**: Custom attributes on traces/spans for detailed performance analysis
2. **Sentry Metrics**: Standalone counters, gauges, and distributions for aggregate monitoring

Both approaches work together to provide holistic observability, performance monitoring, and debugging capabilities.

## Current SDK Support

✅ **Sentry SDK Versions**:
- `@sentry/cloudflare`: 10.26.0
- `@sentry/node`: 10.26.0

Both are >= 10.25.0, so **Sentry Metrics are fully supported**.

---

## Span Metrics vs Sentry Metrics

### Span Metrics (Tracing-Based)

**What**: Attributes added to existing trace spans
**When to use**: Detailed performance analysis within specific operations
**Best for**: Understanding "why" something is slow, correlating with traces

**Example**:
```typescript
Sentry.startSpan({ name: 'fetchFeed', op: 'http.client' }, (span) => {
  // ... fetch logic ...
  span?.setAttributes({
    'rss.feed_url': feedUrl,
    'rss.fetch_duration_ms': 150,
    'rss.items_count': 25,
  });
});
```

**Pros**:
- Rich context (attached to full trace)
- Correlate with errors and other spans
- See exact execution flow
- Sample-based (respects `tracesSampleRate`)

**Cons**:
- Only captured when span exists
- Subject to sampling (may miss some data)
- Tied to transaction context

---

### Sentry Metrics (Standalone)

**What**: Independent metrics emitted anywhere in code
**When to use**: High-level counters, gauges, business metrics
**Best for**: Dashboards, alerts, trend analysis, SLIs/SLOs

**Example**:
```typescript
// Counter: Track occurrences
Sentry.metrics.count('rss.feed_fetched', 1, {
  attributes: { status: 'success', format: 'atom' }
});

// Gauge: Current state
Sentry.metrics.gauge('subscriptions.active', activeCount);

// Distribution: Value spread
Sentry.metrics.distribution('rss.fetch_time', 150, {
  unit: 'millisecond',
  attributes: { feed_type: 'rss' }
});
```

**Pros**:
- Always emitted (not sampled)
- Lightweight and fast
- Great for aggregation/trends
- Can be used without tracing enabled
- Perfect for business metrics

**Cons**:
- No trace context
- Less detail per event
- Can't correlate with specific errors easily

---

### Our Strategy: Use Both!

| Use Case | Approach | Example |
|----------|----------|---------|
| "How many feeds did we fetch?" | **Sentry Metrics** (counter) | `Sentry.metrics.count('rss.feed_fetched')` |
| "Why is this feed slow?" | **Span Metrics** (attributes) | `span.setAttribute('rss.parse_duration_ms', 2500)` |
| "Current queue depth" | **Sentry Metrics** (gauge) | `Sentry.metrics.gauge('queue.depth', 42)` |
| "Distribution of fetch times" | **Sentry Metrics** (distribution) | `Sentry.metrics.distribution('rss.fetch_time', 150)` |
| "Detailed feed fetch trace" | **Span Metrics** (attributes) | `span.setAttributes({ url, items, duration })` |
| "Success rate over time" | **Sentry Metrics** (counter) | `Sentry.metrics.count('rss.fetch_success')` |

---

## Metric Naming Convention

Follow the pattern: `category.metric_name` or `category.action_status`

### Span Metrics (Attributes)
- `rss.feed_fetch_duration_ms`
- `db.query_rows_affected`
- `email.send_latency_ms`
- `favicon.fallback_strategy`

### Sentry Metrics (Standalone)
- **Counters**: `rss.feed_fetched`, `email.sent`, `db.query_slow`
- **Gauges**: `subscriptions.active`, `queue.depth`, `articles.total`
- **Distributions**: `rss.fetch_time`, `db.query_time`, `email.send_time`

## Priority 1: RSS Feed Fetching (Critical Path)

### Current State
- Location: `packages/api/src/services/rss-fetcher.ts`
- Already has Sentry spans with `Sentry.startSpan()`
- Cron job uses `withMonitor("rss-fetch")` in Cloudflare

---

### A. Span Metrics (Detailed Tracing)

#### Per-Feed Metrics
```typescript
// In fetchFeed() function within existing Sentry.startSpan
span?.setAttributes({
  'rss.feed_url': feedUrl,
  'rss.feed_format': feedResult.type, // 'rss' | 'atom' | 'rdf' | 'json'
  'rss.fetch_duration_ms': fetchEndTime - fetchStartTime,
  'rss.parse_duration_ms': parseEndTime - parseStartTime,
  'rss.total_duration_ms': totalEndTime - totalStartTime,
  'rss.items_count': feedResult.items.length,
  'rss.new_items_count': newItemsCount,
  'rss.fetch_success': true,
  'rss.timeout_occurred': false,
  'rss.domain': new URL(feedUrl).hostname,
});
```

#### Error Cases
```typescript
span?.setAttributes({
  'rss.feed_url': feedUrl,
  'rss.fetch_success': false,
  'rss.error_type': 'timeout' | 'parse_error' | 'network_error' | 'blocked_domain',
  'rss.error_message': error.message,
  'rss.status_code': response?.status,
});
```

#### Batch Processing (in _handleRSSFetch)
```typescript
span?.setAttributes({
  'rss.batch_total_feeds': subscriptions.length,
  'rss.batch_success_count': successCount,
  'rss.batch_failure_count': failureCount,
  'rss.batch_duration_ms': batchEndTime - batchStartTime,
  'rss.batch_avg_feed_duration_ms': avgDuration,
  'rss.batch_total_new_articles': totalNewArticles,
});
```

---

### B. Sentry Metrics (Aggregate Monitoring)

#### Counters (Track occurrences)
```typescript
// Per-feed success/failure
Sentry.metrics.count('rss.feed_fetched', 1, {
  attributes: {
    status: 'success' | 'failure',
    format: feedResult.type,
    error_type: errorType, // only on failure
  }
});

// New articles discovered
Sentry.metrics.count('rss.articles_discovered', newItemsCount);

// Error types
Sentry.metrics.count('rss.fetch_error', 1, {
  attributes: {
    error_type: 'timeout' | 'parse_error' | 'network_error',
    domain: domain,
  }
});

// Timeouts specifically
Sentry.metrics.count('rss.fetch_timeout', 1, {
  attributes: { domain: domain }
});
```

#### Distributions (Value spread analysis)
```typescript
// Fetch time distribution
Sentry.metrics.distribution('rss.fetch_time', fetchDuration, {
  unit: 'millisecond',
  attributes: {
    format: feedResult.type,
    domain: domain,
  }
});

// Parse time distribution
Sentry.metrics.distribution('rss.parse_time', parseDuration, {
  unit: 'millisecond',
  attributes: { format: feedResult.type }
});

// Items per feed distribution
Sentry.metrics.distribution('rss.items_per_feed', feedResult.items.length, {
  attributes: { format: feedResult.type }
});

// New articles per feed
Sentry.metrics.distribution('rss.new_items_per_feed', newItemsCount);
```

#### Gauges (Current state - in batch handler)
```typescript
// Total active subscriptions across all users
Sentry.metrics.gauge('rss.subscriptions_active', subscriptions.length);

// Success rate (calculated)
const successRate = (successCount / subscriptions.length) * 100;
Sentry.metrics.gauge('rss.batch_success_rate', successRate, {
  unit: 'percent'
});
```

---

### Implementation Files
- `packages/api/src/services/rss-fetcher.ts:25-120` - Main fetch function
- `packages/api/src/cron/handlers.ts:15-80` - Batch processing

### Key Questions Answered
- **Span Metrics**: "Why is feed X slow?" → See detailed trace with parse/fetch times
- **Sentry Metrics**: "What's our overall success rate?" → Dashboard with `rss.fetch_fetched` counter
- **Sentry Metrics**: "What's the p95 fetch time?" → Distribution of `rss.fetch_time`

---

## Priority 2: Database Query Performance (SQLite & D1)

### Current State

**Database Abstraction**: Drizzle ORM
**Local (Node.js)**: SQLite via `better-sqlite3`
**Production (Cloudflare)**: D1 (SQLite-compatible serverless database)
**Location**: `packages/api/src/db/client.ts` (factory pattern)

✅ **Good News**: D1 is already instrumented in Cloudflare!
- `packages/api/src/entries/cloudflare.ts:17-25` uses `Sentry.instrumentD1WithSentry(env.DB)`
- Automatic query tracking for D1
- ⚠️ **Issue**: Cron jobs bypass instrumentation (line 54 creates new DB instance)

❌ **Gap**: SQLite (local) has no instrumentation
- No automatic query tracking in Node.js runtime
- Need manual span instrumentation

**Strategy**: Use Drizzle ORM-level instrumentation that works for BOTH runtimes

---

### Understanding the Difference

| Aspect | **SQLite (Local)** | **D1 (Cloudflare)** |
|--------|-------------------|---------------------|
| Runtime | Node.js (Docker) | Cloudflare Workers |
| Driver | `better-sqlite3` | Cloudflare D1 binding |
| Sentry Auto-Instrument | ❌ No | ✅ Yes (`instrumentD1WithSentry`) |
| Query Tracking | Manual spans needed | Automatic spans created |
| Error Tracking | Manual capture needed | Automatic capture |
| Complexity | Requires wrapper | Already working (mostly) |

**Will this make things complicated?**
**No!** Because we use **Drizzle ORM** as an abstraction layer, we can instrument at the ORM level and it works for both SQLite and D1 automatically. The same wrapper function works everywhere.

---

### A. Native D1 Instrumentation (Already Implemented)

**Location**: `packages/api/src/entries/cloudflare.ts:17-25`

```typescript
// Instrument D1 database with Sentry if available
if (env.DB && env.SENTRY_DSN) {
  try {
    const instrumentedD1 = Sentry.instrumentD1WithSentry(env.DB);
    workerEnv = { ...workerEnv, DB: instrumentedD1 };
  } catch {
    // Sentry instrumentation failed, continue with regular D1
  }
}
```

**What this provides (D1 only)**:
- ✅ Automatic spans for every D1 query
- ✅ Query text in span names
- ✅ Query duration tracking
- ✅ Error tracking for failed queries
- ✅ Performance waterfall in traces

**Known Gap**: Cron jobs create DB instance without instrumentation
- Fix: Pass instrumented `env.DB` through to cron handlers

---

### B. Drizzle ORM-Level Instrumentation (Works Everywhere)

Instead of instrumenting at the driver level (different for SQLite vs D1), instrument at the **Drizzle ORM level** which works for both.

#### Query Timing Wrapper

Create a new utility: `packages/api/src/utils/db-metrics.ts`

```typescript
import * as Sentry from './sentry.js';

/**
 * Wraps a Drizzle query with Sentry span and metrics
 * Works for both SQLite (Node.js) and D1 (Cloudflare)
 */
export async function withQueryMetrics<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  additionalAttrs?: Record<string, unknown>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `db.query.${queryName}`,
      op: 'db.query',
    },
    async (span) => {
      const startTime = Date.now();
      let runtime: string | undefined;

      try {
        // Detect runtime from process.env or lack thereof
        runtime = typeof process !== 'undefined' && process.env ? 'nodejs' : 'cloudflare';

        const result = await queryFn();
        const duration = Date.now() - startTime;

        // SPAN METRICS (10% sampled, rich context)
        span?.setAttributes({
          'db.query_name': queryName,
          'db.duration_ms': duration,
          'db.success': true,
          'db.slow_query': duration > 1000, // Flag queries over 1s
          'db.runtime': runtime,
          ...additionalAttrs,
        });

        // SENTRY METRICS (100% emitted, lightweight)
        Sentry.metrics.distribution('db.query_time', duration, {
          unit: 'millisecond',
          attributes: {
            query_name: queryName,
            slow: duration > 1000 ? 'true' : 'false',
            runtime,
          }
        });

        // Count slow queries
        if (duration > 1000) {
          Sentry.metrics.count('db.query_slow', 1, {
            attributes: {
              query_name: queryName,
              runtime,
            }
          });
        }

        // Count all queries
        Sentry.metrics.count('db.query_executed', 1, {
          attributes: {
            query_name: queryName,
            runtime,
          }
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // SPAN METRICS (error case)
        span?.setAttributes({
          'db.query_name': queryName,
          'db.duration_ms': duration,
          'db.success': false,
          'db.error': error.message,
          'db.runtime': runtime || 'unknown',
        });

        // SENTRY METRICS (error counting)
        Sentry.metrics.count('db.query_error', 1, {
          attributes: {
            query_name: queryName,
            runtime: runtime || 'unknown',
          }
        });

        // Capture error with context
        Sentry.captureException(error, {
          tags: {
            query_name: queryName,
            runtime: runtime || 'unknown',
          },
          contexts: {
            database: {
              query_name: queryName,
              duration_ms: duration,
              ...additionalAttrs,
            }
          }
        });

        throw error;
      }
    }
  );
}

/**
 * Helper to extract row count from Drizzle results
 */
export function getRowCount(result: unknown): number | undefined {
  if (Array.isArray(result)) {
    return result.length;
  }
  if (typeof result === 'object' && result !== null) {
    // Drizzle returns { rows: [...] } for some operations
    if ('rows' in result && Array.isArray((result as any).rows)) {
      return (result as any).rows.length;
    }
    // Check for affected rows in mutation results
    if ('rowsAffected' in result && typeof (result as any).rowsAffected === 'number') {
      return (result as any).rowsAffected;
    }
  }
  return undefined;
}
```

---

### C. Specific Query Span Attributes

#### Example: Article Queries

**Location**: `packages/api/src/routers/articles.ts`

```typescript
// Before (no instrumentation)
const articles = await db.select()
  .from(schema.articles)
  .where(eq(schema.articles.userId, userId))
  .limit(input.limit)
  .offset(input.offset);

// After (with instrumentation)
const articles = await withQueryMetrics(
  'articles.getArticles',
  async () => {
    return db.select()
      .from(schema.articles)
      .where(eq(schema.articles.userId, userId))
      .limit(input.limit)
      .offset(input.offset);
  },
  {
    'db.table': 'articles',
    'db.operation': 'select',
    'db.user_id': userId,
    'db.limit': input.limit,
    'db.offset': input.offset,
    'db.has_filters': !!input.filter,
  }
).then(result => {
  // Log row count as additional metric
  Sentry.metrics.distribution('db.rows_returned', result.length, {
    attributes: {
      query_name: 'articles.getArticles',
      table: 'articles',
    }
  });
  return result;
});
```

#### Example: Subscription Queries

**Location**: `packages/api/src/routers/subscriptions.ts`

```typescript
const subscriptions = await withQueryMetrics(
  'subscriptions.getUserSubscriptions',
  async () => {
    return db.query.subscriptions.findMany({
      where: eq(schema.subscriptions.userId, userId),
      with: {
        source: true,
        categories: true,
        filters: true,
      },
    });
  },
  {
    'db.table': 'subscriptions',
    'db.operation': 'select',
    'db.with_relations': true,
    'db.user_id': userId,
  }
);
```

#### Example: Bulk Operations (RSS Insert)

**Location**: `packages/api/src/services/rss-fetcher.ts`

```typescript
// Bulk insert articles
const insertedArticles = await withQueryMetrics(
  'articles.bulkInsert',
  async () => {
    return db.insert(schema.articles)
      .values(articlesToInsert)
      .onConflictDoNothing()
      .returning();
  },
  {
    'db.table': 'articles',
    'db.operation': 'bulk_insert',
    'db.batch_size': articlesToInsert.length,
    'db.source_id': sourceId,
  }
).then(result => {
  // Track insertion success rate
  Sentry.metrics.distribution('db.bulk_insert_size', result.length, {
    attributes: {
      table: 'articles',
      requested: articlesToInsert.length,
      inserted: result.length,
    }
  });
  return result;
});
```

#### Example: Article Prune (Bulk Delete)

**Location**: `packages/api/src/cron/handlers.ts`

```typescript
const deletedCount = await withQueryMetrics(
  'articles.bulkDelete',
  async () => {
    const result = await db.delete(schema.articles)
      .where(
        and(
          lt(schema.articles.publishedAt, cutoffDate),
          // Additional conditions...
        )
      )
      .returning({ id: schema.articles.id });

    return result.length;
  },
  {
    'db.table': 'articles',
    'db.operation': 'bulk_delete',
    'db.cutoff_date': cutoffDate.toISOString(),
    'db.prune_after_days': pruneAfterDays,
  }
);

Sentry.metrics.count('db.articles_pruned', deletedCount);
```

---

### D. Fix Cron Job D1 Instrumentation

**Issue**: Cron jobs create a new DB instance that bypasses D1 instrumentation

**Location**: `packages/api/src/entries/cloudflare.ts:54`

#### Before (bypasses instrumentation)

```typescript
const db = createDatabase(env); // Creates new D1 instance without Sentry
```

#### After (uses instrumented D1)

```typescript
// Ensure env.DB is instrumented before passing to createDatabase
let workerEnv: Env = { ...env, RUNTIME: "cloudflare" };

if (env.DB && env.SENTRY_DSN) {
  try {
    const instrumentedD1 = Sentry.instrumentD1WithSentry(env.DB);
    workerEnv = { ...workerEnv, DB: instrumentedD1 };
  } catch {
    // Fallback to regular D1
  }
}

const db = createDatabase(workerEnv); // Now uses instrumented D1
```

---

### E. Sentry Metrics for Database Performance

#### Distributions (Query timing)

```typescript
// Query duration distribution (added in wrapper above)
Sentry.metrics.distribution('db.query_time', duration, {
  unit: 'millisecond',
  attributes: {
    query_name: queryName,
    table: 'articles' | 'subscriptions' | 'sources',
    runtime: 'nodejs' | 'cloudflare',
  }
});

// Rows returned distribution
Sentry.metrics.distribution('db.rows_returned', rowCount, {
  attributes: {
    table: tableName,
    operation: 'select',
    runtime,
  }
});

// Bulk operation sizes
Sentry.metrics.distribution('db.bulk_operation_size', batchSize, {
  attributes: {
    operation: 'bulk_insert' | 'bulk_delete',
    table: tableName,
  }
});
```

#### Counters (Query patterns)

```typescript
// Total queries executed (added in wrapper)
Sentry.metrics.count('db.query_executed', 1, {
  attributes: {
    query_name: queryName,
    table: tableName,
    operation: 'select' | 'insert' | 'update' | 'delete',
    runtime: 'nodejs' | 'cloudflare',
  }
});

// Slow queries (> 1s) - added in wrapper
Sentry.metrics.count('db.query_slow', 1, {
  attributes: {
    query_name: queryName,
    runtime,
  }
});

// Query errors - added in wrapper
Sentry.metrics.count('db.query_error', 1, {
  attributes: {
    query_name: queryName,
    runtime,
  }
});

// Track runtime distribution
Sentry.metrics.count('db.query_by_runtime', 1, {
  attributes: {
    runtime: 'nodejs' | 'cloudflare',
  }
});
```

#### Gauges (Database state)

```typescript
// Total articles in database (periodic - e.g., in cron job)
const articleCount = await db.select({ count: count() })
  .from(schema.articles)
  .then(r => r[0]?.count ?? 0);

Sentry.metrics.gauge('db.articles_total', articleCount, {
  attributes: { runtime }
});

// Total subscriptions
const subscriptionCount = await db.select({ count: count() })
  .from(schema.subscriptions)
  .then(r => r[0]?.count ?? 0);

Sentry.metrics.gauge('db.subscriptions_total', subscriptionCount, {
  attributes: { runtime }
});

// Database file size (SQLite only)
if (runtime === 'nodejs' && dbFilePath) {
  const stats = fs.statSync(dbFilePath);
  Sentry.metrics.gauge('db.file_size_bytes', stats.size, {
    unit: 'byte',
    attributes: { runtime: 'nodejs' }
  });
}
```

---

### F. Implementation Checklist

#### 1. Create Database Metrics Utility

- **File**: `packages/api/src/utils/db-metrics.ts`
- **Functions**:
  - `withQueryMetrics()` - Main wrapper
  - `getRowCount()` - Helper for row counting

#### 2. Fix D1 Instrumentation in Cron Jobs

- **File**: `packages/api/src/entries/cloudflare.ts:42-54`
- **Change**: Instrument D1 before passing to `createDatabase()`

#### 3. Wrap High-Impact Queries

**Priority queries to instrument**:

| Router | Query | Location | Impact |
|--------|-------|----------|--------|
| `articles.ts` | `getArticles` | Lines ~50-100 | High (main feed) |
| `subscriptions.ts` | `getUserSubscriptions` | Lines ~30-80 | High (sidebar) |
| `rss-fetcher.ts` | `bulkInsert` | Lines ~80-120 | High (cron) |
| `handlers.ts` | `bulkDelete` (prune) | Lines ~85-150 | Medium (cron) |
| `auth.ts` | `getUserByEmail` | Lines ~100-150 | Medium (login) |

#### 4. Add Periodic Gauge Emissions

- **Location**: `packages/api/src/cron/handlers.ts`
- **When**: At end of RSS fetch cron job
- **Metrics**:
  - `db.articles_total`
  - `db.subscriptions_total`
  - `db.sources_total`

---

### G. Benefits of This Approach

✅ **Works for Both Runtimes**
- Same code works for SQLite (local) and D1 (Cloudflare)
- No runtime-specific branching needed
- Drizzle ORM abstraction makes it simple

✅ **Complements D1 Auto-Instrumentation**
- D1: Automatic low-level query spans
- Drizzle wrapper: Business-context-rich spans
- Both approaches work together

✅ **No Complexity Added**
- Single wrapper function (`withQueryMetrics`)
- Runtime detection is automatic
- Optional attributes for flexibility

✅ **Full Observability**
- Span metrics: Detailed per-query tracing
- Sentry metrics: Aggregate performance trends
- Runtime comparison: See SQLite vs D1 performance

---

### H. Differences You'll See

#### In Cloudflare (D1)

**Trace view will show**:
1. **Parent span**: `db.query.articles.getArticles` (from our wrapper)
2. **Child spans**: Individual D1 SQL queries (from `instrumentD1WithSentry`)

**Example**:
```
└─ db.query.articles.getArticles (50ms) [our wrapper]
   ├─ d1.query: SELECT * FROM articles... (30ms) [auto D1]
   └─ d1.query: SELECT * FROM sources... (15ms) [auto D1]
```

#### In Node.js (SQLite)

**Trace view will show**:
1. **Parent span**: `db.query.articles.getArticles` (from our wrapper)
2. **No child spans**: SQLite queries are synchronous and not auto-instrumented

**Example**:
```
└─ db.query.articles.getArticles (50ms) [our wrapper]
```

**Is this a problem?**
**No!** The wrapper captures total query time, which is what matters. D1's child spans are a bonus for deeper debugging.

---

### I. Implementation Files Summary

- **Create**: `packages/api/src/utils/db-metrics.ts` - Query wrapper utility
- **Update**: `packages/api/src/entries/cloudflare.ts:42-54` - Fix cron D1 instrumentation
- **Update**: `packages/api/src/routers/articles.ts` - Wrap article queries
- **Update**: `packages/api/src/routers/subscriptions.ts` - Wrap subscription queries
- **Update**: `packages/api/src/services/rss-fetcher.ts` - Wrap bulk inserts
- **Update**: `packages/api/src/cron/handlers.ts` - Wrap bulk deletes, add gauges

### Estimated Implementation Time

- **Create db-metrics utility**: 2-3 hours
- **Fix D1 cron instrumentation**: 30 minutes
- **Wrap high-impact queries (5-8 queries)**: 3-4 hours
- **Add periodic gauges**: 1 hour
- **Testing both runtimes**: 2-3 hours

**Total**: 1-1.5 days for complete database instrumentation

---

### J. Key Metrics to Track

| Metric | Type | Purpose | Works On |
|--------|------|---------|----------|
| `db.query_time` | Distribution | Query performance (p50, p95, p99) | Both |
| `db.query_executed` | Counter | Total queries by type | Both |
| `db.query_slow` | Counter | Slow queries (> 1s) | Both |
| `db.query_error` | Counter | Failed queries | Both |
| `db.rows_returned` | Distribution | Result set sizes | Both |
| `db.articles_total` | Gauge | Total articles in DB | Both |
| `db.subscriptions_total` | Gauge | Total subscriptions | Both |
| `db.query_by_runtime` | Counter | SQLite vs D1 usage | Both |

### Answer to Your Question

**"Will SQLite vs D1 make this complicated?"**

**No!** Because:
1. ✅ We use Drizzle ORM as an abstraction - same API for both
2. ✅ Our wrapper works at the ORM level, not driver level
3. ✅ Runtime detection is automatic
4. ✅ D1 gets auto-instrumentation as a bonus
5. ✅ Same metrics emitted from both runtimes

The only difference you'll notice:
- **D1**: More detailed spans (child SQL queries visible)
- **SQLite**: Single spans (still captures total time)

Both give you the observability you need!

---

### A. Span Metrics (Detailed Query Tracing)

#### Query Timing Wrapper
Create a new utility: `packages/api/src/utils/db-metrics.ts`

```typescript
export async function withQueryMetrics<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  additionalAttrs?: Record<string, unknown>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `db.query.${queryName}`,
      op: 'db.query',
    },
    async (span) => {
      const startTime = Date.now();
      try {
        const result = await queryFn();
        const duration = Date.now() - startTime;

        span?.setAttributes({
          'db.query_name': queryName,
          'db.duration_ms': duration,
          'db.success': true,
          'db.slow_query': duration > 1000, // Flag queries over 1s
          ...additionalAttrs,
        });

        // Also emit Sentry Metric for query timing
        Sentry.metrics.distribution('db.query_time', duration, {
          unit: 'millisecond',
          attributes: {
            query_name: queryName,
            slow: duration > 1000 ? 'true' : 'false',
          }
        });

        // Count slow queries
        if (duration > 1000) {
          Sentry.metrics.count('db.query_slow', 1, {
            attributes: { query_name: queryName }
          });
        }

        return result;
      } catch (error) {
        span?.setAttributes({
          'db.query_name': queryName,
          'db.success': false,
          'db.error': error.message,
        });

        // Count query errors
        Sentry.metrics.count('db.query_error', 1, {
          attributes: { query_name: queryName }
        });

        throw error;
      }
    }
  );
}
```

#### Specific Query Span Attributes

**Article Queries** (`packages/api/src/routers/articles.ts`):
```typescript
span?.setAttributes({
  'db.query_type': 'select',
  'db.table': 'articles',
  'db.rows_returned': articles.length,
  'db.has_filters': hasFilters,
  'db.pagination_limit': input.limit,
  'db.pagination_offset': input.offset,
  'db.user_subscriptions_count': userSubscriptionsCount,
});
```

**Subscription Queries** (`packages/api/src/routers/subscriptions.ts`):
```typescript
span?.setAttributes({
  'db.query_type': 'select',
  'db.table': 'subscriptions',
  'db.with_categories': true,
  'db.with_filters': hasFilters,
  'db.rows_returned': subscriptions.length,
});
```

**Bulk Operations** (Article prune, RSS insert):
```typescript
span?.setAttributes({
  'db.operation': 'bulk_delete',
  'db.table': 'articles',
  'db.rows_affected': deletedCount,
  'db.batch_size': batchSize,
  'db.batch_count': totalBatches,
  'db.duration_ms': duration,
});
```

---

### B. Sentry Metrics (Query Performance Monitoring)

#### Distributions (Query timing)
```typescript
// Query duration distribution (added in wrapper above)
Sentry.metrics.distribution('db.query_time', duration, {
  unit: 'millisecond',
  attributes: {
    query_name: queryName,
    table: 'articles' | 'subscriptions' | 'sources',
  }
});

// Rows returned distribution
Sentry.metrics.distribution('db.rows_returned', rowCount, {
  attributes: { table: tableName, operation: 'select' }
});
```

#### Counters (Query patterns)
```typescript
// Total queries executed
Sentry.metrics.count('db.query_executed', 1, {
  attributes: {
    table: tableName,
    operation: 'select' | 'insert' | 'update' | 'delete',
  }
});

// Slow queries (> 1s) - already in wrapper
Sentry.metrics.count('db.query_slow', 1, {
  attributes: { query_name: queryName }
});

// Query errors - already in wrapper
Sentry.metrics.count('db.query_error', 1, {
  attributes: { query_name: queryName }
});

// Bulk operation tracking
Sentry.metrics.count('db.bulk_operation', 1, {
  attributes: {
    operation: 'bulk_insert' | 'bulk_delete',
    table: tableName,
    batch_size: batchSize,
  }
});
```

#### Gauges (Database state)
```typescript
// Total articles in database (periodic)
Sentry.metrics.gauge('db.articles_total', articleCount);

// Total subscriptions
Sentry.metrics.gauge('db.subscriptions_total', subscriptionCount);

// Database size (if available)
Sentry.metrics.gauge('db.size_bytes', dbSizeBytes, {
  unit: 'byte'
});
```

---

### Implementation Files
- Create: `packages/api/src/utils/db-metrics.ts` - Metrics wrapper utility
- Update: `packages/api/src/routers/articles.ts` - Article queries
- Update: `packages/api/src/routers/subscriptions.ts` - Subscription queries
- Update: `packages/api/src/cron/handlers.ts:85-150` - Article prune bulk operations

### Key Questions Answered
- **Span Metrics**: "Why is this specific query slow?" → See full trace with joins, filters
- **Sentry Metrics**: "What's our p95 query time?" → Distribution of `db.query_time`
- **Sentry Metrics**: "How many slow queries per hour?" → Counter `db.query_slow`

---

## Priority 3: External API Integrations

### Email Service (Resend API)

**Location**: `packages/api/src/services/email.ts`

#### A. Span Metrics
```typescript
// For sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail
span?.setAttributes({
  'email.provider': 'resend',
  'email.type': 'verification' | 'password_reset' | 'welcome',
  'email.to': to,
  'email.duration_ms': duration,
  'email.success': true,
  'email.message_id': result.id,
});

// Error case
span?.setAttributes({
  'email.provider': 'resend',
  'email.type': emailType,
  'email.success': false,
  'email.error': error.message,
  'email.error_code': error.code,
});
```

#### B. Sentry Metrics
```typescript
// Counter: Track emails sent
Sentry.metrics.count('email.sent', 1, {
  attributes: {
    type: emailType,
    status: 'success' | 'failure',
    provider: 'resend',
  }
});

// Distribution: Send latency
Sentry.metrics.distribution('email.send_time', duration, {
  unit: 'millisecond',
  attributes: {
    type: emailType,
    provider: 'resend',
  }
});

// Counter: Track failures
Sentry.metrics.count('email.send_error', 1, {
  attributes: {
    type: emailType,
    error_code: errorCode,
  }
});
```

---

### Favicon Discovery

**Location**: `packages/api/src/services/favicon-fetcher.ts`

#### A. Span Metrics
```typescript
span?.setAttributes({
  'favicon.domain': domain,
  'favicon.strategy_used': 'feed_icon' | 'duckduckgo' | 'root_favicon',
  'favicon.total_duration_ms': duration,
  'favicon.attempts_made': attemptCount,
  'favicon.success': true,
  'favicon.icon_url': iconUrl,
  'favicon.validation_passed': validationResult,
});
```

#### B. Sentry Metrics
```typescript
// Counter: Track favicon fetches
Sentry.metrics.count('favicon.fetched', 1, {
  attributes: {
    status: 'success' | 'failure',
    strategy: 'feed_icon' | 'duckduckgo' | 'root_favicon',
  }
});

// Distribution: Fetch time
Sentry.metrics.distribution('favicon.fetch_time', duration, {
  unit: 'millisecond',
  attributes: { strategy: strategy }
});

// Counter: Track strategy effectiveness
Sentry.metrics.count('favicon.strategy_used', 1, {
  attributes: { strategy: strategy }
});

// Counter: DuckDuckGo API availability
Sentry.metrics.count('favicon.duckduckgo_available', duckDuckGoWorked ? 1 : 0);
```

---

### OpenGraph Image Extraction

**Location**: `packages/api/src/utils/og-image-fetcher.ts`

#### A. Span Metrics
```typescript
span?.setAttributes({
  'og.url': articleUrl,
  'og.duration_ms': duration,
  'og.image_found': !!imageUrl,
  'og.timeout_occurred': timedOut,
  'og.fetch_success': success,
});
```

#### B. Sentry Metrics
```typescript
// Counter: Track OG image extractions
Sentry.metrics.count('og.image_extracted', 1, {
  attributes: {
    found: imageFound ? 'true' : 'false',
    timeout: timedOut ? 'true' : 'false',
  }
});

// Distribution: Extraction time
Sentry.metrics.distribution('og.extraction_time', duration, {
  unit: 'millisecond'
});

// Gauge: Success rate (periodic calculation)
Sentry.metrics.gauge('og.success_rate', successRate, {
  unit: 'percent'
});
```

---

### Implementation Files
- Update: `packages/api/src/services/email.ts:25-90` - All email functions
- Update: `packages/api/src/services/favicon-fetcher.ts:15-120` - Favicon strategy
- Update: `packages/api/src/utils/og-image-fetcher.ts` - OG image extraction

### Key Questions Answered
- **Span Metrics**: "Why did this email fail to send?" → See full trace with error details
- **Sentry Metrics**: "What's our email delivery success rate?" → Counter `email.sent` by status
- **Sentry Metrics**: "Which favicon strategy works best?" → Counter `favicon.strategy_used`

---

## Priority 4: Public Feed Generation

**Location**: `packages/api/src/routers/feeds.ts` and feed generation logic

### Metrics
```typescript
span.setAttributes({
  'feed.generation_duration_ms': duration,
  'feed.username': username,
  'feed.slug': slug,
  'feed.total_items': feedItems.length,
  'feed.filters_applied': hasFilters,
  'feed.categories_count': categoriesCount,
  'feed.subscriptions_count': subscriptionsCount,
  'feed.format': 'rss2' | 'atom',
  'feed.cache_hit': cacheHit,
});
```

### Rate Limiting Metrics
```typescript
span.setAttributes({
  'rate_limit.endpoint': 'public_feed',
  'rate_limit.ip': clientIp,
  'rate_limit.limit': limit,
  'rate_limit.remaining': remaining,
  'rate_limit.hit_limit': hitLimit,
  'rate_limit.plan': userPlan,
});
```

### Implementation Files
- Update: Public feed endpoint handlers
- Update: Rate limiting middleware

---

## Priority 5: User Signup Flow (Complete Funnel Tracking)

### Overview

The signup flow is a **critical user journey** that requires comprehensive tracking to identify:
- Drop-off points in the funnel
- Errors preventing successful registration
- Email delivery issues
- Verification completion rates
- Time-to-activation metrics

**Current Implementation**: `packages/api/src/routers/auth.ts` (lines 41-195)

### Signup Flow Steps

Based on code analysis, the signup flow has **9 distinct steps**:

1. **User Registration** - Create user account via Better Auth
2. **Legacy User Creation** - Backward compatibility (non-blocking)
3. **Role Assignment** - First user → admin, others → user
4. **User Settings Init** - Create default preferences
5. **Usage Stats Init** - Initialize counters
6. **Email Verification Send** - Optional, based on settings
7. **Welcome Email** - Sent if verification not required
8. **Session Creation** - Better Auth cookie
9. **Security Audit Log** - Logged on first login

---

## A. Comprehensive Span Instrumentation

### Parent Span: Complete Signup Flow

**Location**: `packages/api/src/routers/auth.ts:41-195`

```typescript
// Wrap entire signup mutation
export const register = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input, ctx }) => {
    return Sentry.startSpan(
      {
        name: 'auth.signup',
        op: 'auth.register',
        attributes: {
          'auth.method': 'email_password',
          'auth.has_username': !!input.username,
        }
      },
      async (parentSpan) => {
        const startTime = Date.now();
        let userId: string | undefined;
        let isFirstUser = false;
        let emailSent = false;

        try {
          // Set user context early (before user is created)
          Sentry.setUser({
            email: input.email,
            username: input.username,
          });

          // Check if registration is allowed
          const settings = await getGlobalSettings(ctx.env);
          if (!settings.allowRegistration) {
            parentSpan?.setAttribute('auth.registration_disabled', true);
            Sentry.metrics.count('auth.signup_blocked', 1, {
              attributes: { reason: 'registration_disabled' }
            });
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Registration is currently disabled',
            });
          }

          // STEP 1: Better Auth User Creation
          const userResult = await Sentry.startSpan(
            {
              name: 'auth.signup.create_user',
              op: 'auth.api_call',
            },
            async (span) => {
              try {
                const result = await auth.api.signUpEmail({
                  body: {
                    email: input.email,
                    password: input.password,
                    username: input.username,
                  },
                });

                span?.setAttributes({
                  'auth.user_created': !!result.user,
                  'auth.session_created': !!result.session,
                });

                return result;
              } catch (error) {
                span?.setAttribute('auth.error', error.message);
                Sentry.captureException(error, {
                  tags: {
                    flow: 'signup',
                    step: 'create_user',
                  },
                  contexts: {
                    signup: {
                      email: input.email,
                      username: input.username,
                    }
                  }
                });
                throw error;
              }
            }
          );

          if (!userResult.user) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create user',
            });
          }

          userId = userResult.user.id;

          // Update Sentry user context with ID
          Sentry.setUser({
            id: userId,
            email: input.email,
            username: input.username,
          });

          // STEP 3: Role Assignment (wrapped in span)
          const roleData = await Sentry.startSpan(
            {
              name: 'auth.signup.assign_role',
              op: 'db.query',
            },
            async (span) => {
              const userCount = await db.select({ count: count() })
                .from(schema.user)
                .then(r => r[0]?.count ?? 0);

              const isFirst = userCount === 1;
              const shouldBeAdmin = isFirst &&
                ctx.env.ALLOW_FIRST_USER_ADMIN !== 'false';

              if (shouldBeAdmin) {
                await db.update(schema.user)
                  .set({ role: 'admin' })
                  .where(eq(schema.user.id, userId));
              }

              span?.setAttributes({
                'auth.is_first_user': isFirst,
                'auth.role_assigned': shouldBeAdmin ? 'admin' : 'user',
                'auth.plan': 'free',
              });

              return { isFirst, role: shouldBeAdmin ? 'admin' : 'user' };
            }
          );

          isFirstUser = roleData.isFirst;

          // STEP 4 & 5: Initialize User Data (parallel)
          await Sentry.startSpan(
            {
              name: 'auth.signup.init_user_data',
              op: 'db.transaction',
            },
            async (span) => {
              // Settings
              await db.insert(schema.userSettings)
                .values({ userId });

              // Usage stats
              await db.insert(schema.usageStats)
                .values({
                  userId,
                  sourceCount: 0,
                  publicFeedCount: 0,
                  categoryCount: 0,
                  articleCount: 0,
                });

              span?.setAttribute('auth.user_data_initialized', true);
            }
          );

          // STEP 6: Email Verification (if required)
          if (settings.requireEmailVerification) {
            emailSent = await Sentry.startSpan(
              {
                name: 'auth.signup.send_verification_email',
                op: 'email.send',
              },
              async (span) => {
                try {
                  // Generate token and send email
                  const result = await sendVerificationEmail(ctx.env, {
                    to: input.email,
                    username: input.username,
                    verificationToken: token,
                    verificationUrl: url,
                  });

                  span?.setAttributes({
                    'email.type': 'verification',
                    'email.sent': true,
                    'email.provider': 'resend',
                  });

                  Sentry.metrics.count('email.sent', 1, {
                    attributes: {
                      type: 'verification',
                      flow: 'signup',
                      status: 'success',
                    }
                  });

                  return true;
                } catch (error) {
                  span?.setAttributes({
                    'email.sent': false,
                    'email.error': error.message,
                  });

                  Sentry.captureException(error, {
                    tags: {
                      flow: 'signup',
                      step: 'send_verification_email',
                      email_type: 'verification',
                    }
                  });

                  Sentry.metrics.count('email.sent', 1, {
                    attributes: {
                      type: 'verification',
                      flow: 'signup',
                      status: 'failure',
                    }
                  });

                  return false;
                }
              }
            );
          }

          // STEP 7: Welcome Email (if verification not required)
          if (!settings.requireEmailVerification) {
            await Sentry.startSpan(
              {
                name: 'auth.signup.send_welcome_email',
                op: 'email.send',
              },
              async (span) => {
                try {
                  await sendWelcomeEmail(ctx.env, {
                    to: input.email,
                    username: input.username,
                  });

                  span?.setAttribute('email.type', 'welcome');
                  span?.setAttribute('email.sent', true);

                  Sentry.metrics.count('email.sent', 1, {
                    attributes: {
                      type: 'welcome',
                      flow: 'signup',
                      status: 'success',
                    }
                  });
                } catch (error) {
                  span?.setAttribute('email.error', error.message);
                  Sentry.captureException(error, {
                    tags: {
                      flow: 'signup',
                      email_type: 'welcome',
                    }
                  });
                }
              }
            );
          }

          const totalDuration = Date.now() - startTime;

          // Set attributes on parent span
          parentSpan?.setAttributes({
            'auth.signup_success': true,
            'auth.user_id': userId,
            'auth.is_first_user': isFirstUser,
            'auth.role': roleData.role,
            'auth.verification_required': settings.requireEmailVerification,
            'auth.verification_email_sent': emailSent,
            'auth.welcome_email_sent': !settings.requireEmailVerification,
            'auth.total_duration_ms': totalDuration,
          });

          // Emit comprehensive metrics
          Sentry.metrics.count('auth.signup_completed', 1, {
            attributes: {
              is_first_user: isFirstUser ? 'true' : 'false',
              verification_required: settings.requireEmailVerification ? 'true' : 'false',
              role: roleData.role,
            }
          });

          Sentry.metrics.distribution('auth.signup_duration', totalDuration, {
            unit: 'millisecond',
            attributes: {
              verification_required: settings.requireEmailVerification ? 'true' : 'false',
            }
          });

          return {
            success: true,
            userId,
            requiresVerification: settings.requireEmailVerification,
          };

        } catch (error) {
          const totalDuration = Date.now() - startTime;

          // Set error attributes
          parentSpan?.setAttributes({
            'auth.signup_success': false,
            'auth.error': error.message,
            'auth.error_code': error.code,
            'auth.total_duration_ms': totalDuration,
          });

          // Emit failure metrics
          Sentry.metrics.count('auth.signup_failed', 1, {
            attributes: {
              error_code: error.code || 'unknown',
              error_type: error.constructor.name,
            }
          });

          // Capture error with rich context
          Sentry.captureException(error, {
            tags: {
              flow: 'signup',
              step: 'overall',
            },
            contexts: {
              signup: {
                email: input.email,
                username: input.username,
                user_id: userId,
                duration_ms: totalDuration,
              }
            },
            user: userId ? { id: userId } : undefined,
          });

          throw error;
        }
      }
    );
  });
```

---

## B. Email Verification Flow Tracking

### Check Verification Status

**Location**: `packages/api/src/routers/auth.ts:321-347`

```typescript
export const checkVerificationStatus = protectedProcedureWithoutVerification
  .query(async ({ ctx }) => {
    return Sentry.startSpan(
      {
        name: 'auth.check_verification_status',
        op: 'auth.query',
      },
      async (span) => {
        const settings = await getGlobalSettings(ctx.env);
        const requiresVerification = settings.requireEmailVerification;
        const emailVerified = ctx.session.user.emailVerified;

        span?.setAttributes({
          'auth.user_id': ctx.session.user.id,
          'auth.requires_verification': requiresVerification,
          'auth.email_verified': emailVerified,
          'auth.verification_pending': requiresVerification && !emailVerified,
        });

        Sentry.metrics.count('auth.verification_status_checked', 1, {
          attributes: {
            verified: emailVerified ? 'true' : 'false',
            required: requiresVerification ? 'true' : 'false',
          }
        });

        return {
          requiresVerification,
          emailVerified,
        };
      }
    );
  });
```

### Resend Verification Email

**Location**: `packages/api/src/routers/auth.ts:355-478`

```typescript
export const resendVerificationEmail = protectedProcedureWithoutVerification
  .mutation(async ({ ctx }) => {
    return Sentry.startSpan(
      {
        name: 'auth.resend_verification_email',
        op: 'auth.email_resend',
      },
      async (span) => {
        const userId = ctx.session.user.id;
        const email = ctx.session.user.email;

        try {
          // Check if already verified
          if (ctx.session.user.emailVerified) {
            span?.setAttribute('auth.already_verified', true);
            Sentry.metrics.count('auth.verification_resend_blocked', 1, {
              attributes: { reason: 'already_verified' }
            });
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Email already verified',
            });
          }

          // Rate limit check
          const rateLimitResult = await checkRateLimit(
            ctx.env,
            userId,
            5, // 5 minute window
            1  // 1 request
          );

          if (!rateLimitResult.allowed) {
            span?.setAttributes({
              'auth.rate_limited': true,
              'auth.rate_limit_reset_at': rateLimitResult.resetAt.toISOString(),
            });

            Sentry.metrics.count('auth.verification_resend_blocked', 1, {
              attributes: { reason: 'rate_limited' }
            });

            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Please wait before requesting another verification email',
            });
          }

          // Send verification email
          await sendVerificationEmail(ctx.env, {
            to: email,
            username: ctx.session.user.username,
            verificationToken: token,
            verificationUrl: url,
          });

          span?.setAttributes({
            'auth.user_id': userId,
            'auth.email_sent': true,
            'auth.rate_limit_remaining': rateLimitResult.remaining,
          });

          Sentry.metrics.count('auth.verification_email_resent', 1, {
            attributes: { success: 'true' }
          });

          return { success: true };

        } catch (error) {
          span?.setAttribute('auth.error', error.message);

          Sentry.metrics.count('auth.verification_email_resent', 1, {
            attributes: { success: 'false' }
          });

          Sentry.captureException(error, {
            tags: {
              flow: 'verification_resend',
              user_id: userId,
            }
          });

          throw error;
        }
      }
    );
  });
```

---

## C. Session Management & Validation

### Session Middleware Tracking

**Location**: `packages/api/src/trpc/init.ts:45-120`

```typescript
// In protectedProcedure middleware
const session = await Sentry.startSpan(
  {
    name: 'auth.validate_session',
    op: 'auth.session_check',
  },
  async (span) => {
    const startTime = Date.now();

    try {
      const session = await auth.api.getSession({
        headers: opts.ctx.req.headers,
      });

      const duration = Date.now() - startTime;

      span?.setAttributes({
        'auth.session_valid': !!session,
        'auth.session_cache_hit': duration < 5, // Fast = cache hit
        'auth.validation_duration_ms': duration,
      });

      if (session?.user) {
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
        });

        span?.setAttributes({
          'auth.user_id': session.user.id,
          'auth.user_verified': session.user.emailVerified,
          'auth.user_role': session.user.role,
          'auth.user_plan': session.user.plan,
        });
      }

      Sentry.metrics.distribution('auth.session_validation_time', duration, {
        unit: 'millisecond',
        attributes: {
          cache_hit: duration < 5 ? 'true' : 'false',
        }
      });

      return session;

    } catch (error) {
      span?.setAttribute('auth.validation_error', error.message);

      Sentry.captureException(error, {
        tags: {
          flow: 'session_validation',
        }
      });

      throw error;
    }
  }
);
```

### Verification Check (Blocks Unverified Users)

**Location**: `packages/api/src/trpc/init.ts:99-120`

```typescript
// Check if email verification is required
if (requiresVerification && !session.user.emailVerified) {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'Blocked unverified user from protected endpoint',
    level: 'warning',
    data: {
      user_id: session.user.id,
      endpoint: opts.path,
    }
  });

  Sentry.metrics.count('auth.unverified_blocked', 1, {
    attributes: {
      endpoint: opts.path,
    }
  });

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Email verification required',
  });
}
```

---

## D. Sentry Metrics for Funnel Analysis

### Signup Funnel Metrics

```typescript
// Stage 1: Signup attempt started
Sentry.metrics.count('auth.signup_started', 1);

// Stage 2: User created successfully
Sentry.metrics.count('auth.signup_user_created', 1, {
  attributes: { is_first_user: 'true' | 'false' }
});

// Stage 3: User data initialized
Sentry.metrics.count('auth.signup_data_initialized', 1);

// Stage 4: Verification email sent (if required)
Sentry.metrics.count('auth.signup_verification_sent', 1, {
  attributes: { success: 'true' | 'false' }
});

// Stage 5: Signup completed
Sentry.metrics.count('auth.signup_completed', 1, {
  attributes: {
    verification_required: 'true' | 'false',
    role: 'admin' | 'user',
  }
});

// Stage 6: Email verified (tracked separately)
Sentry.metrics.count('auth.email_verified', 1, {
  attributes: {
    time_to_verify_bucket: '<1h' | '1-24h' | '24h+',
  }
});
```

### Signup Duration Distributions

```typescript
// Overall signup time
Sentry.metrics.distribution('auth.signup_duration', totalDurationMs, {
  unit: 'millisecond',
  attributes: {
    verification_required: 'true' | 'false',
    is_first_user: 'true' | 'false',
  }
});

// Time to verify email (from signup to verification)
Sentry.metrics.distribution('auth.time_to_verify', secondsSinceSignup, {
  unit: 'second',
  attributes: {
    resend_count: '0' | '1' | '2+',
  }
});

// Email send time
Sentry.metrics.distribution('email.send_time', emailDuration, {
  unit: 'millisecond',
  attributes: {
    type: 'verification' | 'welcome',
    provider: 'resend',
  }
});
```

### Signup Failure Tracking

```typescript
// Count failures by type
Sentry.metrics.count('auth.signup_failed', 1, {
  attributes: {
    error_code: 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR' | 'BAD_REQUEST',
    step: 'create_user' | 'init_data' | 'send_email',
  }
});

// Count blocked signups
Sentry.metrics.count('auth.signup_blocked', 1, {
  attributes: {
    reason: 'registration_disabled' | 'rate_limited' | 'validation_failed',
  }
});
```

### Email Metrics

```typescript
// Email delivery success/failure
Sentry.metrics.count('email.sent', 1, {
  attributes: {
    type: 'verification' | 'welcome',
    flow: 'signup',
    status: 'success' | 'failure',
    provider: 'resend',
  }
});

// Verification email resends
Sentry.metrics.count('auth.verification_email_resent', 1, {
  attributes: {
    success: 'true' | 'false',
    reason: 'user_requested' | 'automatic_retry',
  }
});

// Rate limit hits
Sentry.metrics.count('auth.verification_resend_blocked', 1, {
  attributes: {
    reason: 'rate_limited' | 'already_verified',
  }
});
```

### Gauges for Current State

```typescript
// Daily active signups
Sentry.metrics.gauge('auth.daily_signups', signupCountToday);

// Pending verifications (users waiting to verify)
Sentry.metrics.gauge('auth.pending_verifications', pendingCount);

// Conversion rate (signups to verified users)
Sentry.metrics.gauge('auth.verification_completion_rate', percentageVerified, {
  unit: 'percent'
});
```

---

## E. Error Tracking & Context

### Registration Errors

```typescript
// Example: User creation failed
Sentry.captureException(error, {
  tags: {
    flow: 'signup',
    step: 'create_user',
    error_code: 'INTERNAL_SERVER_ERROR',
  },
  contexts: {
    signup: {
      email: input.email,
      username: input.username,
      has_password: !!input.password,
    },
    'better_auth': {
      api_method: 'signUpEmail',
      result_has_user: false,
      result_has_session: false,
    }
  },
  level: 'error',
});
```

### Email Sending Errors

```typescript
// Example: Resend API failure
Sentry.captureException(error, {
  tags: {
    flow: 'signup',
    step: 'send_verification_email',
    email_type: 'verification',
    provider: 'resend',
  },
  contexts: {
    email: {
      recipient: email,
      template: 'verification',
      has_api_key: !!env.RESEND_API_KEY,
    },
    resend: {
      status_code: error.statusCode,
      error_code: error.code,
      rate_limited: error.statusCode === 429,
    }
  },
  user: {
    id: userId,
    email: email,
  },
  level: 'error',
});
```

### Verification Errors

```typescript
// Example: Rate limit exceeded
Sentry.captureException(error, {
  tags: {
    flow: 'verification_resend',
    user_id: userId,
    error_code: 'TOO_MANY_REQUESTS',
  },
  contexts: {
    rate_limit: {
      limit: 1,
      window_seconds: 300,
      remaining: 0,
      reset_at: rateLimitResult.resetAt.toISOString(),
    }
  },
  user: {
    id: userId,
    email: email,
  },
  level: 'warning',
});
```

---

## F. Implementation Checklist

### Files to Update

1. **`packages/api/src/routers/auth.ts`**
   - Lines 41-195: `register` mutation
   - Lines 321-347: `checkVerificationStatus` query
   - Lines 355-478: `resendVerificationEmail` mutation

2. **`packages/api/src/services/email.ts`**
   - Lines 226-243: `sendVerificationEmail` function
   - Lines 110-145: `sendWelcomeEmail` function
   - Wrap all Resend API calls in Sentry spans

3. **`packages/api/src/trpc/init.ts`**
   - Lines 45-90: Session validation middleware
   - Lines 99-120: Verification check logic

4. **`packages/api/src/auth/better-auth.ts`**
   - Lines 239-324: Email verification hook
   - Lines 440-479: Welcome email hook

### Key Metrics to Track

| Metric | Type | Purpose |
|--------|------|---------|
| `auth.signup_completed` | Counter | Total successful signups |
| `auth.signup_failed` | Counter | Total failed signups by error |
| `auth.signup_duration` | Distribution | Time to complete signup |
| `email.sent` | Counter | Email delivery success/failure |
| `auth.email_verified` | Counter | Email verification completions |
| `auth.time_to_verify` | Distribution | Time from signup to verification |
| `auth.verification_resend_blocked` | Counter | Rate limit hits |
| `auth.daily_signups` | Gauge | Signups today |
| `auth.pending_verifications` | Gauge | Users waiting to verify |
| `auth.verification_completion_rate` | Gauge | % of users who verify |

### Expected Outcomes

After implementing this tracking:

✅ **Funnel Visibility**
- See drop-off at each signup step
- Identify which errors are most common
- Track conversion from signup → verified user

✅ **Email Reliability**
- Monitor Resend API success rate
- Alert on email delivery failures
- Track time-to-delivery

✅ **Performance Optimization**
- Identify slow signup steps
- Optimize database initialization
- Monitor session cache effectiveness

✅ **User Experience**
- Track time-to-activation
- Monitor verification completion rates
- Identify friction points

### Dashboards to Create

**Dashboard: Signup Funnel**
- Total signups started vs completed (funnel chart)
- Drop-off by step
- Signup duration distribution (p50, p95, p99)
- Failure reasons breakdown

**Dashboard: Email Verification**
- Verification emails sent vs delivered
- Time to verify distribution
- Resend rate (users requesting multiple emails)
- Pending verifications gauge

**Dashboard: Signup Errors**
- Error rate by type
- Top error messages
- Blocked signups (registration disabled)
- Rate limit hits

---

## G. Alert Recommendations for Signup

### Critical Alerts

1. **Signup Failure Rate > 10%**
   - Metric: `auth.signup_failed` / `auth.signup_started`
   - Window: 15 minutes
   - Action: Immediate investigation

2. **Email Delivery Failure > 20%**
   - Metric: `email.sent` where `status='failure'` and `type='verification'`
   - Window: 15 minutes
   - Action: Check Resend API status

3. **Verification Completion < 50%**
   - Metric: `auth.verification_completion_rate`
   - Window: 24 hours
   - Action: Review email delivery and UX

### Warning Alerts

1. **Slow Signup Duration (p95 > 5s)**
   - Metric: `auth.signup_duration` p95
   - Window: 1 hour
   - Action: Investigate slow database or API calls

2. **High Resend Rate (> 30%)**
   - Metric: Users requesting resend / Total signups
   - Window: 24 hours
   - Action: Check email delivery or UX clarity

---

## Implementation Files Summary

- **Primary**: `packages/api/src/routers/auth.ts:41-478`
- **Email Service**: `packages/api/src/services/email.ts:110-243`
- **Middleware**: `packages/api/src/trpc/init.ts:45-120`
- **Better Auth Hooks**: `packages/api/src/auth/better-auth.ts:239-479`

### Estimated Implementation Time

- **Span instrumentation**: 4-6 hours
- **Metrics emission**: 2-3 hours
- **Error tracking**: 2-3 hours
- **Testing & validation**: 2-3 hours
- **Dashboard creation**: 1-2 hours

**Total**: 1-2 days for complete signup flow tracking

---

## Priority 6: Cron Job Monitoring Enhancement

### Current State
- Already uses `withMonitor()` in Cloudflare
- Location: `packages/api/src/cron/handlers.ts`

### Additional Metrics

#### RSS Fetch Job
```typescript
span.setAttributes({
  'cron.job_name': 'rss-fetch',
  'cron.execution_duration_ms': duration,
  'cron.feeds_processed': feedsProcessed,
  'cron.feeds_success': successCount,
  'cron.feeds_failed': failureCount,
  'cron.new_articles_total': totalNewArticles,
  'cron.average_feed_duration_ms': avgDuration,
  'cron.memory_usage_mb': memoryUsageMB, // if available
});
```

#### Article Prune Job
```typescript
span.setAttributes({
  'cron.job_name': 'article-prune',
  'cron.execution_duration_ms': duration,
  'cron.articles_deleted': deletedCount,
  'cron.articles_checked': checkedCount,
  'cron.cutoff_days': pruneAfterDays,
  'cron.batch_size': batchSize,
  'cron.batch_count': batchCount,
});
```

### Implementation Files
- Update: `packages/api/src/cron/handlers.ts` - Both handlers

---

## Priority 7: Global Application Metrics (Cross-Cutting)

### Use `beforeSendSpan` Callback

Add to Sentry initialization in `packages/api/src/entries/node.ts` and Cloudflare entry:

```typescript
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT,
  release: env.SENTRY_RELEASE,
  tracesSampleRate: 0.1,

  beforeSendSpan: (span) => {
    // Add global context to all spans
    span.setAttribute('runtime', 'node' | 'cloudflare');
    span.setAttribute('app.version', env.SENTRY_RELEASE);
    span.setAttribute('app.environment', env.SENTRY_ENVIRONMENT);

    // Add user context if available (from Sentry context)
    const user = Sentry.getCurrentScope().getUser();
    if (user?.id) {
      span.setAttribute('user.plan', user.plan);
      span.setAttribute('user.role', user.role);
    }

    return span;
  },
});
```

### Implementation Files
- Update: `packages/api/src/entries/node.ts:50-75` - Node.js Sentry init
- Update: `packages/api/src/entries/cloudflare.ts` - Cloudflare Sentry init

---

## Sentry Metrics Configuration

### Initialization Setup

Add Sentry Metrics support to initialization in both Node.js and Cloudflare entry points.

**Location**: `packages/api/src/entries/node.ts` and `packages/api/src/entries/cloudflare.ts`

```typescript
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT || 'development',
  release: env.SENTRY_RELEASE,
  tracesSampleRate: 0.1, // 10% trace sampling

  // Enable metrics (available since SDK 10.25.0)
  enableMetrics: true, // Default is true, but explicit is better

  // Optional: Filter sensitive metrics before sending
  beforeSendMetric: (metric) => {
    // Remove any PII from metric attributes
    if (metric.attributes?.email) {
      delete metric.attributes.email;
    }

    // Don't send test metrics in production
    if (metric.name.startsWith('test.') && env.SENTRY_ENVIRONMENT === 'production') {
      return null;
    }

    return metric;
  },

  // Span metrics configuration
  beforeSendSpan: (span) => {
    // Add global context to all spans
    span.setAttribute('runtime', process.env.NODE_ENV ? 'node' : 'cloudflare');
    span.setAttribute('app.version', env.SENTRY_RELEASE);
    span.setAttribute('app.environment', env.SENTRY_ENVIRONMENT);

    return span;
  },
});
```

### Manual Flushing

For Cloudflare Workers (especially after cron jobs), ensure metrics are sent before the request ends:

```typescript
// In cron job handlers
export async function handleScheduled(event: ScheduledEvent, env: Env) {
  await _handleRSSFetch(env);

  // Flush metrics before Workers execution ends
  await Sentry.flush(2000); // 2 second timeout
}
```

### Wrapper for Sentry Metrics

Create a utility to make metrics emission easier and runtime-agnostic:

**Location**: `packages/api/src/utils/metrics.ts`

```typescript
import * as Sentry from './sentry.js';

/**
 * Emit a counter metric
 */
export function emitCounter(
  name: string,
  value: number = 1,
  attributes?: Record<string, string | number | boolean>
): void {
  try {
    Sentry.metrics.count(name, value, { attributes });
  } catch (error) {
    // Gracefully handle if metrics aren't available
    console.warn(`Failed to emit counter metric ${name}:`, error);
  }
}

/**
 * Emit a gauge metric
 */
export function emitGauge(
  name: string,
  value: number,
  attributes?: Record<string, string | number | boolean>
): void {
  try {
    Sentry.metrics.gauge(name, value, { attributes });
  } catch (error) {
    console.warn(`Failed to emit gauge metric ${name}:`, error);
  }
}

/**
 * Emit a distribution metric
 */
export function emitDistribution(
  name: string,
  value: number,
  unit?: 'millisecond' | 'second' | 'byte' | 'percent',
  attributes?: Record<string, string | number | boolean>
): void {
  try {
    Sentry.metrics.distribution(name, value, {
      unit,
      attributes
    });
  } catch (error) {
    console.warn(`Failed to emit distribution metric ${name}:`, error);
  }
}

/**
 * Time a function and emit duration as distribution
 */
export async function withTiming<T>(
  metricName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    emitDistribution(metricName, duration, 'millisecond', {
      ...attributes,
      success: 'true',
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    emitDistribution(metricName, duration, 'millisecond', {
      ...attributes,
      success: 'false',
    });

    throw error;
  }
}
```

---

## Business Metrics & SLIs/SLOs

Beyond performance metrics, track business and reliability metrics using Sentry Metrics.

### Application Health (SLIs - Service Level Indicators)

```typescript
// API Endpoint Success Rate
Sentry.metrics.count('api.request', 1, {
  attributes: {
    endpoint: 'articles.getArticles',
    status: 'success' | 'error',
    user_plan: 'free' | 'pro',
  }
});

// User Actions
Sentry.metrics.count('user.action', 1, {
  attributes: {
    action: 'subscribe' | 'unsubscribe' | 'read_article' | 'save_article',
    plan: userPlan,
  }
});

// Feature Usage
Sentry.metrics.count('feature.used', 1, {
  attributes: {
    feature: 'opml_import' | 'public_feed' | 'filters' | 'categories',
    plan: userPlan,
  }
});
```

### Growth Metrics

```typescript
// Daily active users (emit once per user per day)
Sentry.metrics.gauge('users.active_daily', uniqueUserCount);

// New subscriptions today
Sentry.metrics.count('subscriptions.new', 1, {
  attributes: { plan: userPlan }
});

// Total users by plan
Sentry.metrics.gauge('users.total', totalUsers, {
  attributes: { plan: 'free' | 'pro' }
});
```

### Capacity Metrics

```typescript
// Approaching limits
Sentry.metrics.count('limit.approached', 1, {
  attributes: {
    limit_type: 'sources' | 'public_feeds' | 'rate_limit',
    plan: userPlan,
    percentage: '75-90' | '90-100',
  }
});

// Limit exceeded
Sentry.metrics.count('limit.exceeded', 1, {
  attributes: {
    limit_type: 'sources' | 'public_feeds' | 'rate_limit',
    plan: userPlan,
  }
});

// Current resource usage
Sentry.metrics.gauge('resources.articles_total', articlesCount);
Sentry.metrics.gauge('resources.sources_total', sourcesCount);
Sentry.metrics.gauge('resources.users_total', usersCount);
```

### Reliability Metrics

```typescript
// Cron job success/failure
Sentry.metrics.count('cron.execution', 1, {
  attributes: {
    job: 'rss-fetch' | 'article-prune',
    status: 'success' | 'failure',
    duration_bucket: '<1m' | '1-5m' | '5-10m' | '>10m',
  }
});

// External service availability
Sentry.metrics.count('external.request', 1, {
  attributes: {
    service: 'resend' | 'duckduckgo',
    status: 'success' | 'failure' | 'timeout',
  }
});
```

### SLO Targets (Service Level Objectives)

Define targets based on collected metrics:

1. **RSS Fetch Reliability**: 95% of feeds fetch successfully
   - Metric: `rss.feed_fetched` where `status='success'`
   - Alert if < 95% over 1 hour

2. **Email Delivery**: 99% of emails sent successfully
   - Metric: `email.sent` where `status='success'`
   - Alert if < 99% over 1 hour

3. **API Response Time**: p95 < 500ms
   - Metric: `db.query_time` distribution
   - Alert if p95 > 500ms over 15 minutes

4. **Cron Job Reliability**: 100% of cron jobs complete
   - Metric: `cron.execution` where `status='success'`
   - Alert immediately on failure

---

## Implementation Strategy

### Phase 1: Foundation (Week 1)
1. ✅ Review Sentry documentation and current setup
2. ✅ Create metrics naming convention guide
3. ✅ Implement `db-metrics.ts` utility wrapper
4. ✅ Update Sentry initialization with `beforeSendSpan`
5. ✅ Test metrics collection in local Node.js environment

### Phase 2: Critical Path (Week 1-2)
1. ✅ Instrument RSS feed fetcher (Priority 1)
2. ✅ Add metrics to cron job handlers (Priority 6)
3. ⏳ Deploy to staging and verify metrics appear in Sentry
4. ⏳ Create Sentry dashboard for RSS feed performance

### Phase 3: Database & External APIs (Week 2-3)
1. ✅ Instrument database queries (Priority 2) - Complete (articles, subscriptions, admin routers)
2. ✅ Add email service metrics (Priority 3)
3. ✅ Add favicon discovery metrics (Priority 3)
4. ✅ Add OG image extraction metrics (Priority 3)
5. ⏳ Create Sentry dashboard for external API performance

### Phase 4: User-Facing Features (Week 3-4)
1. ✅ Instrument public feed generation (Priority 4)
2. ✅ Add authentication flow metrics (Priority 5)
3. ⏳ Create Sentry dashboard for user experience metrics
4. ⏳ Review and optimize slow queries identified

### Phase 5: Monitoring & Optimization (Ongoing)
1. ⏳ Create Sentry dashboards for all metric categories
2. ⏳ Configure alerts for critical thresholds
3. ⏳ Document metrics catalog and usage
4. ⏳ Review and optimize based on production metrics
5. ⏳ Identify performance bottlenecks from collected data
3. Set up alerts for critical metrics:
   - RSS fetch failure rate > 10%
   - Database query > 2s
   - Email send failure rate > 5%
   - Cron job failure
4. Document findings and optimization opportunities

---

## Sentry Dashboard Recommendations

### Dashboard 1: RSS Feed Health
- **Metrics**:
  - Average feed fetch duration
  - Feed fetch success rate (%)
  - Feeds timing out (count)
  - New articles per batch
  - Feed format distribution (RSS vs Atom vs JSON)
  - Top 10 slowest feeds

### Dashboard 2: Database Performance
- **Metrics**:
  - Slow queries (> 1s) count
  - Average query duration by operation
  - Queries by table
  - Bulk operation efficiency
  - Cache hit rate (session cache)

### Dashboard 3: External API Reliability
- **Metrics**:
  - Email send success rate
  - Email send latency (p50, p95, p99)
  - Favicon discovery success rate by strategy
  - DuckDuckGo API availability
  - OG image extraction success rate

### Dashboard 4: Cron Job Monitoring
- **Metrics**:
  - Job execution duration trends
  - Job failure rate
  - Articles processed per job
  - Articles pruned per job
  - Memory usage trends

### Dashboard 5: User Experience
- **Metrics**:
  - Public feed generation time
  - Authentication flow completion time
  - Rate limit hits by endpoint
  - API endpoint latency (p50, p95, p99)

---

## Alert Recommendations

### Critical Alerts (Page/Slack)
1. **RSS Fetch Cron Failure**: Job fails to complete
2. **Database Query > 5s**: Queries taking longer than 5 seconds
3. **Email Service Failure Rate > 20%**: Email delivery issues
4. **Cron Job Failure Rate > 50%**: Systemic issues

### Warning Alerts (Slack)
1. **RSS Feed Failure Rate > 10%**: Multiple feeds failing
2. **Slow Query Count > 50/hour**: Performance degradation
3. **Email Send Latency > 5s**: Resend API slowdown
4. **Public Feed Generation > 3s**: User-facing slowness

---

## Testing Strategy

### Local Testing (Node.js)
1. Verify metrics appear in console output (if debug mode)
2. Use Sentry test DSN for development
3. Trigger each instrumented code path
4. Verify span attributes are set correctly

### Staging Testing (Cloudflare Workers)
1. Deploy to staging with full Sentry integration
2. Trigger cron jobs manually
3. Verify metrics in Sentry dashboard
4. Test error cases (timeouts, failures)

### Production Rollout
1. Deploy with low sample rate (0.1 = 10%)
2. Monitor for performance impact
3. Gradually increase sample rate if needed
4. Create dashboards and alerts

---

## Performance Considerations

### Overhead
- Each `span.setAttribute()` call has minimal overhead (~microseconds)
- Use `span.setAttributes()` for bulk setting (more efficient)
- Avoid setting large string values (> 1KB)
- Current trace sample rate: 10% (adjustable)

### Best Practices
1. Set attributes inside existing spans when possible
2. Use consistent naming conventions
3. Include both success and failure metrics
4. Tag spans with searchable identifiers (user_id, feed_url, etc.)
5. Use boolean flags for filtering (e.g., `slow_query: true`)

---

## Success Metrics

After implementation, we should be able to answer:

1. **Performance Questions**:
   - What's the average RSS feed fetch time?
   - Which feeds are consistently slow or failing?
   - What's the slowest database query?
   - Are email notifications being delivered promptly?

2. **Reliability Questions**:
   - What's the success rate of our cron jobs?
   - How often do external API calls fail?
   - What's the error rate by endpoint?

3. **User Experience Questions**:
   - How long does it take to generate a public feed?
   - Are users hitting rate limits?
   - What's the authentication flow completion time?

4. **Capacity Planning Questions**:
   - How many articles are we processing per hour?
   - What's the growth trend of RSS feeds?
   - Are we approaching any system limits?

---

## References

- **Sentry Span Metrics**: https://docs.sentry.io/platforms/javascript/guides/cloudflare/tracing/span-metrics/
- **Sentry Metrics (Standalone)**: https://docs.sentry.io/platforms/javascript/guides/cloudflare/metrics/
- **GitHub Discussion**: https://github.com/getsentry/sentry-javascript/discussions/18055
- **Current Sentry Setup**: `/packages/api/src/config/sentry.ts`
- **Sentry Architecture Doc**: `/docs/architecture/sentry-integration.md`

---

## Summary & Quick Reference

### Two Complementary Approaches

| Aspect | **Span Metrics** | **Sentry Metrics** |
|--------|-----------------|-------------------|
| **Type** | Attributes on traces/spans | Standalone counters/gauges/distributions |
| **Use For** | Detailed tracing, debugging | Aggregation, trends, dashboards |
| **Sampling** | Respects `tracesSampleRate` (10%) | Always emitted (100%) |
| **Context** | Full trace context | Independent, no trace required |
| **Best For** | "Why is this slow?" | "What's our success rate?" |
| **Example** | `span.setAttribute('duration_ms', 150)` | `Sentry.metrics.distribution('time', 150)` |
| **Correlation** | Can see related spans/errors | Standalone metric only |
| **Cost** | Lower (sampled) | Higher (every event) |

### Recommended Combination

For every critical operation, emit **both**:

```typescript
// Example: RSS Feed Fetch
return Sentry.startSpan({ name: 'fetchFeed' }, async (span) => {
  const start = Date.now();

  try {
    const result = await fetchFeed(url);
    const duration = Date.now() - start;

    // 1. SPAN METRICS (10% sampled, rich context)
    span?.setAttributes({
      'rss.feed_url': url,
      'rss.duration_ms': duration,
      'rss.items_count': result.items.length,
      'rss.format': result.type,
    });

    // 2. SENTRY METRICS (100% emitted, lightweight)
    Sentry.metrics.count('rss.feed_fetched', 1, {
      attributes: { status: 'success', format: result.type }
    });
    Sentry.metrics.distribution('rss.fetch_time', duration, {
      unit: 'millisecond',
      attributes: { format: result.type }
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Span Metrics - error case
    span?.setAttribute('rss.error', error.message);

    // Sentry Metrics - error case
    Sentry.metrics.count('rss.feed_fetched', 1, {
      attributes: { status: 'failure' }
    });

    throw error;
  }
});
```

### Metric Types Decision Tree

**Use Counter when:**
- Tracking occurrences (emails sent, errors occurred)
- Calculating rates (success rate, error rate)
- Counting events (API calls, user actions)
- Example: `Sentry.metrics.count('rss.feed_fetched', 1)`

**Use Gauge when:**
- Tracking current state (queue depth, active users)
- Monitoring capacity (articles in DB, subscriptions)
- Showing snapshot values (memory usage, connection count)
- Example: `Sentry.metrics.gauge('queue.depth', 42)`

**Use Distribution when:**
- Analyzing value spread (response times, query durations)
- Need percentiles (p50, p95, p99)
- Tracking ranges (file sizes, batch sizes)
- Example: `Sentry.metrics.distribution('query_time', 150, { unit: 'millisecond' })`

**Use Span Metrics when:**
- Need to debug specific slow traces
- Want to correlate with errors
- Need full context of execution
- Already have a span/trace
- Example: `span.setAttribute('parse_duration_ms', 2500)`

### Priority Implementation Order

1. **Week 1**: RSS Feed Fetching (Priority 1) - Highest impact
   - Both Span Metrics and Sentry Metrics
   - Cron job monitoring enhancement

2. **Week 2**: Database Queries (Priority 2) - Performance critical
   - Create `db-metrics.ts` wrapper utility
   - Instrument slow queries

3. **Week 2-3**: External APIs (Priority 3) - Reliability monitoring
   - Email service (Resend)
   - Favicon discovery
   - OpenGraph extraction

4. **Week 3-4**: Business Metrics - Growth & capacity
   - User actions and feature usage
   - Capacity limits tracking
   - SLI/SLO monitoring

### Key Utilities to Create

1. **`packages/api/src/utils/metrics.ts`**
   - `emitCounter()`, `emitGauge()`, `emitDistribution()`
   - `withTiming()` - Automatic timing wrapper

2. **`packages/api/src/utils/db-metrics.ts`**
   - `withQueryMetrics()` - Database query wrapper

3. **Update Sentry Init** (both Node.js and Cloudflare)
   - Enable `enableMetrics: true`
   - Add `beforeSendMetric` callback
   - Add `beforeSendSpan` callback

### Expected Outcomes

After full implementation:

✅ **Operational Visibility**
- Real-time RSS fetch success rates
- Database query performance trends
- External API reliability monitoring

✅ **Performance Optimization**
- Identify slow queries (p95 > 1s)
- Find problematic RSS feeds
- Optimize email send times

✅ **Capacity Planning**
- Track user growth by plan
- Monitor resource limits
- Predict scaling needs

✅ **Reliability**
- Alert on cron job failures
- Track SLO compliance (RSS: 95%, Email: 99%)
- Monitor external dependencies

✅ **Business Intelligence**
- Feature usage by plan
- User engagement metrics
- Conversion funnel analysis

---

## Next Steps

1. **Review this plan** and confirm priorities align with business goals
2. **Start with Phase 1** (Foundation) - minimal risk, high value
3. **Create Sentry dashboards** as metrics come online
4. **Set up alerts** for critical metrics
5. **Iterate** based on insights discovered

**Estimated Total Implementation**: 3-4 weeks for full rollout
**Expected Performance Impact**: Negligible (< 1ms per metric emission)
**Required SDK Version**: ✅ Already at 10.26.0 (Metrics supported)
