# Public Feed System

## Overview

TuvixRSS allows users to create **public RSS feeds** that aggregate articles from their subscriptions based on category selections. This enables users to share curated content with others via standard RSS 2.0 feeds.

**Status**: ⚠️ **Backend is complete, frontend UI is incomplete** (see [Missing Functionality](#missing-functionality))

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [How It Works](#how-it-works)
- [Categories vs Public Feeds](#categories-vs-public-feeds)
- [Creating and Managing Feeds](#creating-and-managing-feeds)
- [Accessing Public Feeds](#accessing-public-feeds)
- [RSS Generation](#rss-generation)
- [Rate Limiting](#rate-limiting)
- [Access Logging](#access-logging)
- [Plan Limits](#plan-limits)
- [API Reference](#api-reference)
- [Missing Functionality](#missing-functionality)
- [Future Considerations](#future-considerations)

## Architecture Overview

### Core Concept

Public feeds work through **indirect association**:

```
User
 ├─ Creates Categories (e.g., "Tech", "News", "Science")
 ├─ Tags Subscriptions with Categories
 │   └─ subscription_categories (many-to-many)
 └─ Creates Public Feeds
     └─ Selects which Categories to include
         └─ feed_categories (many-to-many)
```

**Key Point**: You don't add sources directly to feeds. Instead, you select categories, and the system aggregates articles from all subscriptions tagged with those categories.

### Data Flow

```
Public Feed Request
    ↓
Get Feed + Selected Categories
    ↓
Find Subscriptions with those Categories
    ↓
Get Sources from Subscriptions
    ↓
Get Latest Articles from Sources
    ↓
Generate RSS 2.0 XML
    ↓
Return to Client
```

## Database Schema

### feeds Table

**File**: `packages/api/src/db/schema.ts:263-286`

```typescript
export const feeds = sqliteTable(
  "feeds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(), // URL-friendly identifier
    title: text("title").notNull(),
    description: text("description"),
    public: integer("public", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    // Same user can't have duplicate slugs
    uniqueUserSlug: unique().on(table.userId, table.slug),
  })
);
```

**Key Fields**:
- `slug`: Used in public URL (`/public/{username}/{slug}`)
- `public`: Controls visibility (false = private, returns 404)
- Unique constraint on `(userId, slug)`: Different users can have same slug

### feed_categories Table

**File**: `packages/api/src/db/schema.ts:292-307`

```typescript
export const feedCategories = sqliteTable(
  "feed_categories",
  {
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey(table.feedId, table.categoryId),
  })
);
```

**Relationship**: Many-to-many between feeds and categories
- One feed can include multiple categories
- One category can be in multiple feeds

### public_feed_access_log Table

**File**: `packages/api/src/db/schema.ts:522-539`

```typescript
export const publicFeedAccessLog = sqliteTable("public_feed_access_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feedId: integer("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  accessedAt: integer("accessed_at", { mode: "timestamp" }).notNull(),
});
```

**Purpose**: Analytics and abuse detection
- Logs every public feed access
- Survives feed deletion (for historical data)
- Non-blocking (errors don't fail requests)

### Plan Limits

**File**: `packages/api/src/db/schema.ts:459-477`

```typescript
export const plans = sqliteTable("plans", {
  // ...
  maxPublicFeeds: integer("max_public_feeds").notNull(),
  publicFeedRateLimitPerMinute: integer("public_feed_rate_limit_per_minute").notNull(),
});
```

| Plan | Max Feeds | Rate Limit (requests/minute) |
|------|-----------|----------------------------|
| Free | 2 | ~17 |
| Pro | 25 | ~167 |
| Enterprise | 200 | ~1,667 |

## How It Works

### Article Aggregation Logic

**File**: `packages/api/src/routers/feeds.ts:395-484`

When a public feed is accessed:

1. **Fetch Feed Record**: Get feed by `(username, slug)`
2. **Check Public Status**: If `public: false`, return 404
3. **Get Selected Categories**: Query `feed_categories` table
4. **Find Subscriptions**: Get all user subscriptions tagged with those categories
   - If no categories selected → use ALL user subscriptions
5. **Get Source IDs**: Extract source IDs from subscriptions
6. **Fetch Articles**: Get latest 50 articles from those sources
   - Ordered by `publishedAt DESC`
   - Includes: title, link, description, content, author, image, publishedAt, guid
7. **Generate RSS XML**: Convert to RSS 2.0 format
8. **Log Access**: Record in `public_feed_access_log` (non-blocking)
9. **Return XML**: With cache headers (`max-age=300`, 5 minutes)

### Empty Category Selection

**Important Behavior**: If a feed has **no categories selected**, it includes articles from **ALL user subscriptions**.

This is intentional and allows users to create a "master feed" of all their content.

## Categories vs Public Feeds

This is a critical distinction that often causes confusion:

### Categories

**Purpose**: Personal organization tool (internal use)

- **Scope**: Private to user
- **Function**: Tag subscriptions for filtering in the app
- **Table**: `subscription_categories` (many-to-many with subscriptions)
- **Access**: Requires authentication
- **Output**: Filtered article list in app UI (JSON via tRPC)
- **Example**: "Show me all articles from my 'Technology' subscriptions"

### Public Feeds

**Purpose**: Content distribution tool (external use)

- **Scope**: Public (if `public: true`)
- **Function**: Aggregate and share articles based on category selections
- **Table**: `feed_categories` (many-to-many with categories)
- **Access**: No authentication required
- **Output**: RSS 2.0 XML at public URL
- **Example**: "Share a curated RSS feed of articles from my 'Technology' and 'Programming' categories"

### Shared Infrastructure

**Both systems use the same `categories` table**:
- You create categories to organize your subscriptions
- Those same categories can be selected when creating public feeds
- This provides consistency: "I organize by Tech, so I can share a Tech feed"

### Key Differences

| Aspect | Categories | Public Feeds |
|--------|-----------|--------------|
| **Visibility** | Private | Public (optional) |
| **Purpose** | Organization | Distribution |
| **Associates With** | Subscriptions (direct) | Categories (indirect) |
| **Access Method** | App UI | RSS URL (`/public/{user}/{slug}`) |
| **Authentication** | Required | Not required (for public) |
| **Output Format** | JSON (tRPC) | RSS 2.0 XML |
| **Rate Limiting** | Per-user API limit | Per-feed-owner limit |
| **Plan Limits** | Max categories (10/100/500) | Max feeds (2/25/200) |

### Visual Comparison

```
Categories (Internal):
User → Subscriptions ← subscription_categories → Categories
                                                      ↓
                                                  Article Filter

Public Feeds (External):
User → Feeds ← feed_categories → Categories → subscription_categories → Subscriptions → Articles
                                                                                           ↓
                                                                                     RSS 2.0 XML
```

## Creating and Managing Feeds

### Creating a Feed

**API**: `feeds.create` procedure
**File**: `packages/api/src/routers/feeds.ts:110-185`

```typescript
const feed = await trpc.feeds.create.mutate({
  title: "My Tech Feed",
  slug: "tech", // URL will be /public/{username}/tech
  description: "Latest articles from my tech subscriptions",
  public: true,
  categoryIds: [1, 5, 12], // Optional: select specific categories
});
```

**Validations**:
- **Slug format**: Must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
  - Lowercase letters, numbers, hyphens only
  - No spaces, underscores, or special characters
  - Examples: `tech`, `my-feed`, `news-2025`
- **Slug uniqueness**: Per-user (other users can have same slug)
- **Plan limit**: Cannot exceed `maxPublicFeeds` for your plan
- **Category ownership**: All category IDs must belong to you

**Process**:
1. Validate slug format and uniqueness
2. Check plan limit (Free: 2, Pro: 25, Enterprise: 200)
3. Create feed record
4. Link categories in `feed_categories` table (if provided)
5. Update `usage_stats.publicFeedCount` (if public)

### Updating a Feed

**API**: `feeds.update` procedure
**File**: `packages/api/src/routers/feeds.ts:190-304`

```typescript
await trpc.feeds.update.mutate({
  id: feedId,
  title: "Updated Title",
  slug: "new-slug",
  description: "Updated description",
  public: false, // Make private
  categoryIds: [1, 5], // Update category selection
});
```

**All fields are optional** (partial update)

**Special Behaviors**:
- **Slug change**: Validates new slug is unique
- **Public status change**:
  - `false → true`: Checks plan limit, increments count
  - `true → false`: Decrements count
- **Category update**: Uses `updateManyToMany` helper to sync
  - Removes old associations
  - Adds new associations

### Toggling Public/Private

**API**: `feeds.update` procedure (same as above)

```typescript
// Make private (returns 404 to external requests)
await trpc.feeds.update.mutate({
  id: feedId,
  public: false,
});

// Make public
await trpc.feeds.update.mutate({
  id: feedId,
  public: true,
});
```

**Private feeds**:
- Return 404 (not 403) to avoid revealing existence
- Still count toward `publicFeedCount` limit
- Can be made public again without losing settings

### Deleting a Feed

**API**: `feeds.delete` procedure
**File**: `packages/api/src/routers/feeds.ts:309-335`

```typescript
await trpc.feeds.delete.mutate({ id: feedId });
```

**Cascades**:
- Deletes `feed_categories` associations
- Keeps `public_feed_access_log` records (historical data)

**Side Effects**:
- Decrements `usage_stats.publicFeedCount` (if was public)
- Frees up slot for creating new feed

### Listing Feeds

**API**: `feeds.list` procedure
**File**: `packages/api/src/routers/feeds.ts:32-66`

```typescript
const feeds = await trpc.feeds.list.query();
```

**Returns**: Array of feeds with category associations
```typescript
[
  {
    id: 1,
    slug: "tech",
    title: "My Tech Feed",
    description: "Latest tech articles",
    public: true,
    createdAt: Date,
    updatedAt: Date,
    categories: [
      { id: 1, name: "Technology" },
      { id: 5, name: "Programming" }
    ]
  }
]
```

## Accessing Public Feeds

### Public URL Format

```
https://yourdomain.com/public/{username}/{slug}
```

**Examples**:
- `https://tuvix.app/public/john/tech`
- `https://tuvix.app/public/sarah/news`
- `https://tuvix.app/public/team/weekly-digest`

### HTTP Endpoints

Two implementations (same behavior):

#### Express (Docker)

**File**: `packages/api/src/adapters/express.ts:103-200`

```typescript
app.get("/public/:username/:slug", async (req, res) => {
  const { username, slug } = req.params;

  // Fetch feed (returns 404 if not found or private)
  const xml = await caller.feeds.getPublicXml({ username, slug });

  // Non-blocking access logging
  void logAccess(feedId, req.ip, req.headers["user-agent"]);

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes
  res.send(xml);
});
```

#### Cloudflare Workers

**File**: `packages/api/src/adapters/cloudflare.ts:129-254`

Similar implementation using Workers API.

### Authentication

**Not required** for public feeds (if `public: true`)

**Private feeds**: Return 404 (not 403) to avoid revealing existence

### Response Headers

```http
Content-Type: application/rss+xml; charset=utf-8
Cache-Control: public, max-age=300
```

### Rate Limiting (see [Rate Limiting](#rate-limiting))

## RSS Generation

### XML Generator Service

**File**: `packages/api/src/services/xml-generator.ts`

Uses `feedsmith` library for standards-compliant RSS 2.0 generation.

### RSS Structure

#### Channel Metadata

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Tech Feed</title>
    <link>https://tuvix.app/public/john/tech</link>
    <description>Latest articles from my tech subscriptions</description>
    <language>en-us</language>
    <generator>TuvixRSS</generator>
    <pubDate>Tue, 14 Jan 2025 10:30:00 GMT</pubDate>

    <!-- Articles (max 50) -->
    <item>...</item>
  </channel>
</rss>
```

**Fields**:
- `title`: From feed record
- `link`: Public feed URL
- `description`: From feed record (or title if null)
- `language`: Fixed to `en-us`
- `generator`: Fixed to `TuvixRSS`
- `pubDate`: Most recent article's `publishedAt`

#### Item Metadata (per article)

```xml
<item>
  <title>Article Title</title>
  <link>https://example.com/article</link>
  <description>Article description or content...</description>
  <pubDate>Tue, 14 Jan 2025 08:00:00 GMT</pubDate>
  <guid isPermaLink="false">unique-article-guid</guid>
  <author>Author Name</author>
</item>
```

**Fields**:
- `title`: Article title (required)
- `link`: Original article URL (or feed URL if null)
- `description`: Article description or content (HTML stripped)
- `pubDate`: Article publish date
- `guid`: Unique identifier from original RSS source
  - `isPermaLink="false"`: GUID is not a URL
- `author`: Article author (optional, omitted if null)

### Article Limits

- **Maximum**: 50 articles per feed
- **Ordering**: Most recent first (`publishedAt DESC`)
- **Filtering**: Only articles from selected categories (or all if none selected)

### Content Processing

**Security**: HTML is stripped from content in article storage, so RSS output is safe.

**Truncation**: Applied during article ingestion:
- Content: 500 KB max
- Description: 5 KB max

## Rate Limiting

### Strategy

**Per-feed-owner rate limiting** (not per-requester)

**Why**: RSS readers don't authenticate, so we limit based on the feed owner's plan. This prevents abuse of any single user's feed.

### Implementation

**File**: `packages/api/src/services/rate-limiter.ts:223-235`

**Algorithm**: Cloudflare Workers rate limit bindings
- Per-minute windows
- Distributed edge-based tracking
- Automatic reset every minute

**Storage**:
- **Cloudflare Workers**: Rate limit bindings (`API_RATE_LIMIT`, `FEED_RATE_LIMIT`)
- **Node.js/Docker**: Rate limiting disabled

### Limits by Plan

| Plan | Requests per Minute |
|------|---------------------|
| Free | ~17 |
| Pro | ~167 |
| Enterprise | ~1,667 |

### Rate Limit Response

**Under limit** (200 OK):
```http
HTTP/1.1 200 OK
Content-Type: application/rss+xml; charset=utf-8
Cache-Control: public, max-age=300
```

**Over limit** (429 Too Many Requests):
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "This feed has been accessed too many times. Limit: 17 requests per minute.",
  "limit": 17
}
```

### Rate Limiter Code

```typescript
export async function checkPublicFeedRateLimit(
  env: Env,
  userId: number,
  limitPerMinute: number
): Promise<RateLimitResult> {
  return checkRateLimit(env, userId, limitPerMinute, 60 * 1000, "publicFeed");
}
```

## Access Logging

### Purpose

- **Analytics**: Track feed popularity
- **Abuse Detection**: Identify unusual access patterns
- **Debugging**: Diagnose feed issues

### Implementation

**Non-blocking logging** to prevent performance impact:

```typescript
// Express adapter (lines 159-186)
void db.insert(schema.publicFeedAccessLog)
  .values({
    feedId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    accessedAt: new Date(),
  })
  .catch((err) => {
    console.error("Failed to log public feed access:", err);
    // Don't fail the request
  });
```

**Characteristics**:
- Fire-and-forget (void promise)
- Errors logged but don't fail request
- Captures: feedId, IP address, User-Agent, timestamp

### Data Retention

- Logs survive feed deletion (historical data)
- No automatic cleanup (grows indefinitely)
- Can be pruned via admin interface or SQL

### Privacy Considerations

- IP addresses stored for abuse prevention
- User-Agent reveals RSS reader type
- Consider GDPR implications (PII storage)

## Plan Limits

### Enforcement

**File**: `packages/api/src/services/limits.ts:173-186`

```typescript
export async function checkPublicFeedLimit(
  db: Database,
  userId: number,
  userPlan: Plan
): Promise<void> {
  const stats = await getUserStats(db, userId);

  if (stats.publicFeedCount >= userPlan.maxPublicFeeds) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You have reached your plan's limit of ${userPlan.maxPublicFeeds} public feeds`,
    });
  }
}
```

**Checked On**:
- Feed creation
- Toggling feed from private to public

**Not Checked On**:
- Feed updates (if already public)
- Feed deletion

### Usage Stats Tracking

**File**: `packages/api/src/db/schema.ts:505-516`

```typescript
export const usageStats = sqliteTable("usage_stats", {
  userId: integer("user_id").primaryKey(),
  publicFeedCount: integer("public_feed_count").notNull().default(0),
  // ... other stats
});
```

**Updated On**:
- Feed creation (if public)
- Feed update (if public status changes)
- Feed deletion (if was public)

**Reconciliation**: Can be recalculated if out of sync:
```sql
UPDATE usage_stats
SET public_feed_count = (
  SELECT COUNT(*) FROM feeds
  WHERE user_id = ? AND public = 1
)
WHERE user_id = ?;
```

## API Reference

### feeds.create

Create a new public feed.

```typescript
feeds.create.mutate({
  title: string,          // Required: Feed name
  slug: string,           // Required: URL-friendly identifier (lowercase, hyphens)
  description?: string,   // Optional: Feed description
  public?: boolean,       // Optional: Default true
  categoryIds?: number[], // Optional: Category IDs to include
})
```

**Returns**: Created feed with category associations

**Throws**:
- `BAD_REQUEST`: Invalid slug format
- `CONFLICT`: Slug already exists for this user
- `FORBIDDEN`: Exceeded plan limit

### feeds.update

Update an existing feed.

```typescript
feeds.update.mutate({
  id: number,             // Required: Feed ID
  title?: string,         // Optional: New title
  slug?: string,          // Optional: New slug
  description?: string,   // Optional: New description
  public?: boolean,       // Optional: Toggle public/private
  categoryIds?: number[], // Optional: Update category selection
})
```

**Returns**: Updated feed with category associations

**Throws**:
- `NOT_FOUND`: Feed doesn't exist
- `FORBIDDEN`: Not your feed, or exceeded plan limit
- `CONFLICT`: New slug already exists
- `BAD_REQUEST`: Invalid slug format

### feeds.delete

Delete a feed.

```typescript
feeds.delete.mutate({
  id: number, // Required: Feed ID
})
```

**Returns**: Success boolean

**Throws**:
- `NOT_FOUND`: Feed doesn't exist
- `FORBIDDEN`: Not your feed

### feeds.list

List all your feeds.

```typescript
feeds.list.query()
```

**Returns**: Array of feeds with categories
```typescript
Array<{
  id: number;
  slug: string;
  title: string;
  description: string | null;
  public: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{ id: number; name: string }>;
}>
```

### feeds.getById

Get a single feed by ID.

```typescript
feeds.getById.query({ id: number })
```

**Returns**: Feed with category associations

**Throws**:
- `NOT_FOUND`: Feed doesn't exist
- `FORBIDDEN`: Not your feed

### feeds.getPublicXml

Get RSS XML for a public feed (no auth required).

```typescript
feeds.getPublicXml.query({
  username: string, // Feed owner's username
  slug: string,     // Feed slug
})
```

**Returns**: RSS 2.0 XML string

**Throws**:
- `NOT_FOUND`: Feed doesn't exist, user doesn't exist, or feed is private
- `TOO_MANY_REQUESTS`: Rate limit exceeded

## Missing Functionality

### Backend (Complete)

✅ All backend functionality is fully implemented:
- Feed CRUD operations
- Category selection (many-to-many)
- RSS generation
- Rate limiting
- Access logging
- Plan limits
- Public/private toggle
- Ownership verification

### Frontend (Incomplete)

⚠️ The frontend UI is missing several key features:

**File**: `packages/app/src/routes/app/feeds.tsx`

#### 1. Category Selection UI (Missing)

**Current**: Create form only has title, slug, description, public toggle
**Missing**: Category selector (checkboxes or multi-select)

**Lines 105-187**: Create feed dialog
```typescript
// ❌ No category selection UI
<DialogContent>
  <Input name="title" />
  <Input name="slug" />
  <Textarea name="description" />
  <Switch name="public" />
  {/* Missing: Category selector */}
</DialogContent>
```

**Needed**: Multi-select component for categories
```typescript
<FormField
  control={form.control}
  name="categoryIds"
  render={({ field }) => (
    <MultiSelect
      options={categories}
      value={field.value}
      onChange={field.onChange}
      placeholder="Select categories (optional)"
    />
  )}
/>
```

#### 2. Feed Edit UI (Missing)

**Current**: Only toggle public/private and delete (lines 274-294)
**Missing**: Edit dialog to update title, slug, description, categories

**Needed**: Similar to create dialog but pre-populated with existing values

#### 3. Feed Preview (Missing)

**Current**: No way to preview RSS XML or article list before publishing
**Missing**: Preview modal showing RSS output or article list

**Needed**:
```typescript
<Button onClick={() => openPreview(feed.id)}>
  Preview RSS
</Button>

<Dialog>
  <pre>{rssXml}</pre>
  {/* Or render article list */}
</Dialog>
```

#### 4. User Analytics (Missing)

**Current**: No user-facing analytics (access logs exist in DB)
**Missing**: Dashboard showing feed access stats

**Needed**:
- Total access count per feed
- Access trend graph
- Popular times/days
- Top User-Agents (RSS readers)

#### 5. Copy Public URL Button (Present but could be better)

**Current**: Shows URL in feed list
**Enhancement**: One-click copy button with toast notification

### Why Frontend is Incomplete

Looking at the code, it appears development focused on:
1. Building complete backend API
2. Creating basic feed list UI
3. Enabling create/delete operations

The edit functionality and category selection were **planned** (backend supports it) but **not yet implemented** in the UI.

## Future Considerations

### Proposed Simplification: Category → Public Feed

**Your Question**: "I'm considering maybe a simpler system where you turn a category into a public feed?"

#### Current System

**Flexibility**: One feed can aggregate multiple categories
```
Feed: "Tech News"
└─ Categories: [Technology, Programming, Web Development]
```

**Pros**:
- More flexible (one feed = many categories)
- Allows curated combinations
- Explicit feed management

**Cons**:
- More complex (two levels: categories + feeds)
- Requires category selection UI
- Potentially confusing ("What's the difference?")

#### Proposed Simplification

**One-to-One**: Each category has a public feed toggle
```
Category: "Technology"
├─ Public: true
├─ Slug: "technology"
└─ Generates: /public/{username}/technology
```

**Pros**:
- Simpler mental model (category = feed)
- No category selection needed
- Fewer database tables
- Existing category UI could add "Public" toggle

**Cons**:
- Less flexible (can't combine categories)
- More feeds created (one per public category)
- May hit plan limits faster (Free: 2 feeds)
- Can't have custom feed titles/descriptions separate from category names

#### Recommendation

**For simplicity and usability**: The proposed simplification makes sense **IF**:

1. **Plan limits adjusted**: Increase free tier to 5-10 public feeds (since you'll have more)
2. **Combination feeds**: Add ability to create "composite" feeds that merge multiple categories
3. **Aliases**: Allow multiple slugs for same category (e.g., "tech" and "technology")

**Implementation path**:
1. Add `public`, `slug`, `description` fields to `categories` table
2. Deprecate `feeds` table (or repurpose for "composite feeds")
3. Update public feed endpoint to accept category slugs
4. Simplify UI: Just toggle "Make Public" on category

**Hybrid approach** (best of both worlds):
```
Categories
├─ Can be made public directly (simple case)
│  └─ /public/{username}/{category-slug}
└─ Can be combined into feeds (advanced case)
   └─ /public/{username}/{feed-slug}
```

This gives power users flexibility while keeping simple cases simple.

### Other Improvements

#### 1. Server-Side Caching

**Current**: Every request regenerates RSS XML (database query + XML generation)
**Improvement**: Cache RSS XML for 5 minutes (matches Cache-Control header)

```typescript
const cacheKey = `rss:${userId}:${slug}`;
let xml = await cache.get(cacheKey);

if (!xml) {
  xml = await generateRSS(feedId);
  await cache.set(cacheKey, xml, { ttl: 300 }); // 5 minutes
}
```

#### 2. Custom Article Limits

**Current**: Hardcoded to 50 articles
**Improvement**: Allow users to choose (e.g., 10, 25, 50, 100)

```typescript
feeds.create.mutate({
  // ...
  maxArticles: 25, // Optional, default 50
});
```

#### 3. Article Filtering

**Current**: Only category-based filtering
**Improvements**:
- Date range (e.g., last 7 days only)
- Keyword inclusion/exclusion
- Source inclusion/exclusion (within selected categories)
- Read/unread status

#### 4. Feed Templates

**Current**: Users build feeds from scratch
**Improvement**: Pre-defined templates for common use cases

```typescript
templates = [
  { name: "Today's Highlights", maxArticles: 10, dateRange: "today" },
  { name: "Weekly Digest", maxArticles: 50, dateRange: "7days" },
  { name: "Full Archive", maxArticles: 100, dateRange: "all" },
];
```

#### 5. Webhooks/Notifications

**Current**: Passive (users poll public URL)
**Improvement**: Notify subscribers when new articles added

- PubSubHubbub/WebSub support
- Discord/Slack webhooks
- Email notifications

#### 6. Analytics Dashboard

**Current**: Access logs stored but not displayed
**Improvement**: User-facing analytics page

- Access count per feed
- Trend graphs (daily/weekly)
- Geographic distribution
- Popular RSS readers (User-Agent parsing)
- Referrer tracking

## Complete Data Model

```sql
-- Users
users (id, username, email, ...)

-- Subscriptions (RSS sources user follows)
subscriptions (id, user_id, source_id, ...)

-- Categories (user-created tags)
categories (id, user_id, name, ...)

-- Link subscriptions to categories (internal organization)
subscription_categories (subscription_id, category_id)

-- Public Feeds (external RSS feeds)
feeds (id, user_id, slug, title, description, public, ...)

-- Link feeds to categories (select which categories to include)
feed_categories (feed_id, category_id)

-- Access logging
public_feed_access_log (id, feed_id, ip_address, user_agent, accessed_at)

-- Query Flow:
-- feeds → feed_categories → categories → subscription_categories → subscriptions → sources → articles
```

## Testing

**File**: `packages/api/src/routers/__tests__/feeds.test.ts`

Comprehensive test suite covering:
- ✅ Feed creation
- ✅ Slug validation
- ✅ Category association
- ✅ Public/private toggle
- ✅ Plan limits
- ✅ Ownership verification
- ✅ Feed updates
- ✅ Feed deletion
- ✅ Public XML generation
- ✅ Rate limiting

Run tests:
```bash
pnpm --filter @tuvix/api test feeds
```

## Related Documentation

- **Existing Guide**: `docs/guides/features/public-feeds.md` (comprehensive 1300+ line guide)
- **RSS Fetcher**: `docs/architecture/polling-and-article-updates.md` (article ingestion)
- **Rate Limiting**: `packages/api/src/services/rate-limiter.ts`
- **XML Generation**: `packages/api/src/services/xml-generator.ts`

## Summary

### What Works

✅ **Backend is production-ready**:
- Complete API for all operations
- Standards-compliant RSS 2.0 generation
- Robust rate limiting and access logging
- Plan-based limits enforced
- Security (ownership verification, private feeds)

### What's Missing

⚠️ **Frontend needs completion**:
- Category selection UI in create/edit forms
- Feed edit dialog (currently only delete)
- Feed preview functionality
- User-facing analytics dashboard

### What to Consider

💡 **Simplification opportunity**:
- Current: Categories + Feeds (two-level system)
- Proposed: Categories = Feeds (one-level system)
- Hybrid: Both simple (category.public) and advanced (custom feeds)

---

**For implementation help**, refer to:
- Backend: `packages/api/src/routers/feeds.ts`
- Frontend: `packages/app/src/routes/app/feeds.tsx`
- Tests: `packages/api/src/routers/__tests__/feeds.test.ts`
