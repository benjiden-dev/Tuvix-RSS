# Comment Links Implementation Plan

## Overview
Add support for displaying comment links from RSS feeds that provide them (e.g., Reddit, Hacker News). Show a comment button in the article UI only when a comment link is detected.

## Current State Analysis

### Feed Structure Examples

#### Hacker News RSS
```xml
<item>
  <title>DeepSeek-v3.2: Pushing the frontier...</title>
  <link>https://huggingface.co/deepseek-ai/...</link>
  <comments>https://news.ycombinator.com/item?id=46108780</comments>
  <description><![CDATA[<a href="https://news.ycombinator.com/item?id=46108780">Comments</a>]]></description>
</item>
```

#### Reddit Atom Feed
```xml
<entry>
  <title>Luigi Mangione fights to exclude...</title>
  <link href="https://www.reddit.com/r/news/comments/1pbgb2z/..." />
  <content type="html">
    ... &lt;span&gt;&lt;a href="https://www.reddit.com/r/news/comments/1pbgb2z/..."&gt;[comments]&lt;/a&gt;&lt;/span&gt;
  </content>
</entry>
```

**Key Observations:**
- **Hacker News**: Provides explicit `<comments>` element + duplicate in description HTML
- **Reddit**: Comment link is embedded in content HTML, typically matches the entry's main `<link>` element
- **Other feeds**: May have different patterns or no comment links at all

### Current Codebase Flow

1. **RSS Parsing**: `packages/api/src/services/rss-fetcher.ts`
   - Uses `feedsmith` library to parse multiple feed formats
   - `extractArticleData()` function (lines 650-848) extracts article fields
   - Currently preserves HTML links in `description` field via `sanitizeHtml()`

2. **Database Schema**: `packages/api/src/db/schema.ts`
   - `articles` table (lines 212-239)
   - Currently stores: id, sourceId, guid, title, link, description, content, author, imageUrl, audioUrl, publishedAt, createdAt

3. **API Response**: `packages/api/src/routers/articles.ts`
   - Returns article with all fields including description (HTML with preserved links)

4. **UI Display**: `packages/app/src/components/app/article-item.tsx`
   - Renders article card with description using `dangerouslySetInnerHTML`
   - Has action buttons row (open link, save, mark as read, audio, etc.)
   - Currently comment links are embedded in description HTML (not ideal)

## Implementation Strategy

### Option 1: Database Field + Multi-Source Extraction (RECOMMENDED)

**Pros:**
- Clean separation of concerns
- Explicit and searchable in database
- Easy to filter/query articles with comments
- Supports multiple feed formats and future sources
- Fallback pattern matching for feeds without explicit elements

**Cons:**
- Requires database migration
- Slightly more complex extraction logic

### Option 2: Client-Side HTML Parsing

**Pros:**
- No database changes required
- Simpler backend implementation

**Cons:**
- Must parse HTML on every render
- Unreliable pattern matching
- Can't filter/search for articles with comments
- Poor performance
- Coupling of presentation and data

**Decision: Proceed with Option 1**

## Implementation Plan

### Phase 1: Database Schema Changes

**File**: `packages/api/src/db/schema.ts`

Add new field to `articles` table:
```typescript
commentLink: text("comment_link") // URL to discussion/comments page
```

**Migration Steps:**
1. Add field to schema
2. Generate migration: `pnpm --filter @tuvix/api db:generate`
3. Apply migration locally: `pnpm --filter @tuvix/api db:migrate:local`
4. Apply migration to production D1: Deploy via Wrangler

### Phase 2: Comment Link Extraction Logic

Create an extensible comment link extraction system following the feed-discovery pattern.

#### 2.1: Create Comment Link Extraction Types

**File**: `packages/api/src/services/comment-link-extraction/types.ts` (NEW)

```typescript
/**
 * Comment Link Extraction Types
 *
 * Types and interfaces for the extensible comment link extraction system.
 */

import type { FeedItem } from "feedsmith";

/**
 * Extracted comment link result
 */
export interface ExtractedCommentLink {
  /** URL to comments/discussion page */
  url: string;
  /** Source of the extraction (for debugging/analytics) */
  source: "rss-element" | "atom-link" | "html-pattern" | "url-pattern";
}

/**
 * Comment link extractor interface for extensible extraction.
 *
 * Each extractor implements this interface to handle extraction for specific
 * feed formats or patterns (e.g., RSS comments element, Atom links, HTML parsing).
 */
export interface CommentLinkExtractor {
  /**
   * Check if this extractor can handle the given feed item.
   *
   * @param item - The feed item to check
   * @returns True if this extractor can handle the item
   */
  canHandle(item: FeedItem): boolean;

  /**
   * Extract comment link from the given feed item.
   *
   * @param item - The feed item to extract from
   * @returns Extracted comment link, or null if none found
   */
  extract(item: FeedItem): ExtractedCommentLink | null;

  /**
   * Execution priority (lower = higher priority).
   * Extractors with lower priority run first.
   */
  priority: number;
}
```

#### 2.2: Create Registry for Comment Link Extractors

**File**: `packages/api/src/services/comment-link-extraction/registry.ts` (NEW)

```typescript
/**
 * Comment Link Extraction Registry
 *
 * Manages comment link extractors and orchestrates extraction.
 * Extractors are executed in priority order (lower priority = higher priority).
 */

import type { FeedItem } from "feedsmith";
import type { CommentLinkExtractor, ExtractedCommentLink } from "./types";

/**
 * Comment Link Extraction Registry
 *
 * Manages extractors and executes them in priority order.
 */
export class CommentLinkRegistry {
  private extractors: CommentLinkExtractor[] = [];

  /**
   * Register a comment link extractor
   */
  register(extractor: CommentLinkExtractor): void {
    this.extractors.push(extractor);
    // Sort by priority (lower = higher priority)
    this.extractors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Extract comment link from a feed item
   *
   * Executes extractors in priority order:
   * 1. Extractors with lower priority run first
   * 2. If an extractor finds a link, return immediately (stop early)
   * 3. If an extractor returns null, continue to next extractor
   * 4. If no extractors find a link, return null
   *
   * @param item - Feed item to extract from
   * @returns Extracted comment link URL, or null if none found
   */
  extract(item: FeedItem): string | null {
    // Try each extractor in priority order
    for (const extractor of this.extractors) {
      if (!extractor.canHandle(item)) {
        continue;
      }

      try {
        const result = extractor.extract(item);
        if (result?.url) {
          // Found a comment link, return immediately
          return result.url;
        }
      } catch (error) {
        // Log error but continue to next extractor
        console.error(
          `Comment link extractor ${extractor.constructor.name} failed:`,
          error
        );
      }
    }

    // No extractors found a link
    return null;
  }
}
```

#### 2.3: Create Specific Extractors

**File**: `packages/api/src/services/comment-link-extraction/rss-element-extractor.ts` (NEW)

```typescript
/**
 * RSS Comments Element Extractor
 *
 * Extracts comment links from explicit RSS <comments> elements.
 * Used by Hacker News, WordPress, and some other RSS feeds.
 */

import type { FeedItem } from "feedsmith";
import type { CommentLinkExtractor, ExtractedCommentLink } from "./types";

/**
 * RSS Element Extractor
 *
 * Handles extraction from RSS <comments> element (highest priority).
 */
export class RssElementExtractor implements CommentLinkExtractor {
  readonly priority = 10; // Highest priority - explicit element

  canHandle(item: FeedItem): boolean {
    return "comments" in item && typeof item.comments === "string";
  }

  extract(item: FeedItem): ExtractedCommentLink | null {
    if ("comments" in item && item.comments) {
      return {
        url: item.comments,
        source: "rss-element",
      };
    }
    return null;
  }
}
```

**File**: `packages/api/src/services/comment-link-extraction/atom-link-extractor.ts` (NEW)

```typescript
/**
 * Atom Link Extractor
 *
 * Extracts comment links from Atom <link rel="replies"> elements.
 * Standard Atom format for comment links.
 */

import type { FeedItem } from "feedsmith";
import type { CommentLinkExtractor, ExtractedCommentLink } from "./types";

/**
 * Atom Link Extractor
 *
 * Handles extraction from Atom <link rel="replies"> or <link rel="comments">.
 */
export class AtomLinkExtractor implements CommentLinkExtractor {
  readonly priority = 20; // Second priority - standard format

  canHandle(item: FeedItem): boolean {
    return "links" in item && Array.isArray(item.links);
  }

  extract(item: FeedItem): ExtractedCommentLink | null {
    if ("links" in item && Array.isArray(item.links)) {
      const commentLink = item.links.find(
        (link) =>
          link.rel === "replies" ||
          link.rel === "comments" ||
          link.rel === "discussion"
      );

      if (commentLink?.href) {
        return {
          url: commentLink.href,
          source: "atom-link",
        };
      }
    }
    return null;
  }
}
```

**File**: `packages/api/src/services/comment-link-extraction/html-pattern-extractor.ts` (NEW)

```typescript
/**
 * HTML Pattern Extractor
 *
 * Extracts comment links by parsing HTML content for links with
 * comment-related text (e.g., "[comments]", "Comments").
 * Used by Reddit and feeds that embed comment links in description.
 */

import type { FeedItem } from "feedsmith";
import type { CommentLinkExtractor, ExtractedCommentLink } from "./types";

/**
 * HTML Pattern Extractor
 *
 * Handles extraction by parsing HTML content for comment link patterns.
 */
export class HtmlPatternExtractor implements CommentLinkExtractor {
  readonly priority = 30; // Third priority - pattern matching

  canHandle(item: FeedItem): boolean {
    const hasDescription = "description" in item && item.description;
    const hasContent = "content" in item && item.content;
    const hasSummary = "summary" in item && item.summary;
    return !!(hasDescription || hasContent || hasSummary);
  }

  extract(item: FeedItem): ExtractedCommentLink | null {
    // Get HTML content from various possible fields
    const htmlContent =
      ("description" in item ? item.description : "") ||
      ("content" in item ? item.content : "") ||
      ("summary" in item ? item.summary : "");

    if (!htmlContent) {
      return null;
    }

    // Pattern to match links with comment-related text
    // Matches: <a href="URL">[comments]</a>, <a href="URL">Comments</a>, etc.
    const patterns = [
      // [comments] format (Reddit)
      /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*?>\s*\[?\s*comments?\s*\]?\s*<\/a>/i,
      // Plain "Comments" or "Discussion" text
      /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*?>\s*(?:comments?|discussion|discuss)\s*<\/a>/i,
      // Icon + text patterns (some feeds use this)
      /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*?>[^<]*(?:💬|🗨️|comment|discussion)/i,
    ];

    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match?.[1]) {
        return {
          url: match[1],
          source: "html-pattern",
        };
      }
    }

    return null;
  }
}
```

#### 2.4: Create Main Export

**File**: `packages/api/src/services/comment-link-extraction/index.ts` (NEW)

```typescript
/**
 * Comment Link Extraction Service
 *
 * Public API for extensible comment link extraction system.
 */

import { CommentLinkRegistry } from "./registry";
import { RssElementExtractor } from "./rss-element-extractor";
import { AtomLinkExtractor } from "./atom-link-extractor";
import { HtmlPatternExtractor } from "./html-pattern-extractor";
import type { FeedItem } from "feedsmith";

// Create singleton registry with default extractors
const registry = new CommentLinkRegistry();

// Register default extractors (in priority order)
registry.register(new RssElementExtractor());
registry.register(new AtomLinkExtractor());
registry.register(new HtmlPatternExtractor());

/**
 * Extract comment link from a feed item
 *
 * Uses multiple extraction strategies (RSS element, Atom links, HTML patterns)
 * in priority order, returning the first match found.
 *
 * @param item - Feed item to extract comment link from
 * @returns Comment link URL or null if none found
 */
export function extractCommentLink(item: FeedItem): string | null {
  return registry.extract(item);
}

// Export types and classes for extensibility
export type {
  CommentLinkExtractor,
  ExtractedCommentLink,
} from "./types";
export { CommentLinkRegistry } from "./registry";
export { RssElementExtractor } from "./rss-element-extractor";
export { AtomLinkExtractor } from "./atom-link-extractor";
export { HtmlPatternExtractor } from "./html-pattern-extractor";
```

#### 2.5: Integrate into RSS Fetcher

**File**: `packages/api/src/services/rss-fetcher.ts`

```typescript
// Add import at top
import { extractCommentLink } from "./comment-link-extraction";

// In extractArticleData() function, around line 840, add:
const commentLink = extractCommentLink(item);

// Include in return object:
return {
  // ... existing fields
  commentLink,
};
```

**Update `storeArticles()` to save comment link:**
```typescript
// Around line 520-530, in the insert/update operations
// Add commentLink to the insert values
```

### Phase 3: API Response Updates

**File**: `packages/api/src/routers/articles.ts`

Ensure `commentLink` is included in the article response:

```typescript
// Around lines 31-82, add to the select object:
commentLink: articles.commentLink,
```

### Phase 4: TypeScript Type Updates

**File**: `packages/api/src/db/schema.ts` (already updated in Phase 1)
**File**: `packages/app/src/types/article.ts` (or wherever article types are defined)

Ensure TypeScript types include the new field:
```typescript
interface Article {
  // ... existing fields
  commentLink: string | null;
}
```

### Phase 5: UI Component Updates

**File**: `packages/app/src/components/app/article-item.tsx`

Add comment button to the actions row:

```tsx
// Add after the "Open Link" button (around line 150-180)
{article.commentLink && (
  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.stopPropagation();
      window.open(article.commentLink, '_blank', 'noopener,noreferrer');
    }}
    title="View Comments"
  >
    <MessageSquare className="h-4 w-4" />
  </Button>
)}
```

**Icon Import:**
```tsx
import { MessageSquare } from "lucide-react";
```

### Phase 6: Optional Enhancements

1. **Comment Count Display**: Some feeds might provide comment counts (e.g., Reddit API)
   - Could add `commentCount: integer` field in future
   - Display count badge on comment button

2. **Comment Link Validation**: Ensure extracted URLs are valid
   - Add URL validation in extraction logic
   - Sanitize against XSS

3. **Feed-Specific Extraction**: Add specialized extractors for common platforms
   - Reddit-specific logic
   - Hacker News-specific logic
   - Discourse forums
   - GitHub discussions

4. **Analytics**: Track comment link clicks
   - Add analytics event on click
   - Measure engagement with comment links

## Testing Strategy

### Unit Tests

**File**: `packages/api/src/services/comment-link-extraction/rss-element-extractor.test.ts` (NEW)

```typescript
import { describe, it, expect } from "vitest";
import { RssElementExtractor } from "./rss-element-extractor";

describe("RssElementExtractor", () => {
  const extractor = new RssElementExtractor();

  it("should handle items with comments element", () => {
    expect(extractor.canHandle({ comments: "https://example.com" })).toBe(true);
  });

  it("should not handle items without comments element", () => {
    expect(extractor.canHandle({ title: "Test" })).toBe(false);
  });

  it("should extract from RSS comments element", () => {
    const result = extractor.extract({
      comments: "https://news.ycombinator.com/item?id=12345",
    });
    expect(result).toEqual({
      url: "https://news.ycombinator.com/item?id=12345",
      source: "rss-element",
    });
  });

  it("should return null when no comments element", () => {
    expect(extractor.extract({ title: "Test" })).toBeNull();
  });
});
```

**File**: `packages/api/src/services/comment-link-extraction/atom-link-extractor.test.ts` (NEW)

```typescript
import { describe, it, expect } from "vitest";
import { AtomLinkExtractor } from "./atom-link-extractor";

describe("AtomLinkExtractor", () => {
  const extractor = new AtomLinkExtractor();

  it("should handle items with links array", () => {
    expect(extractor.canHandle({ links: [] })).toBe(true);
  });

  it("should not handle items without links", () => {
    expect(extractor.canHandle({ title: "Test" })).toBe(false);
  });

  it("should extract from Atom link rel=replies", () => {
    const result = extractor.extract({
      links: [
        { rel: "alternate", href: "https://example.com/post" },
        { rel: "replies", href: "https://example.com/post#comments" },
      ],
    });
    expect(result).toEqual({
      url: "https://example.com/post#comments",
      source: "atom-link",
    });
  });

  it("should extract from Atom link rel=comments", () => {
    const result = extractor.extract({
      links: [{ rel: "comments", href: "https://example.com/comments" }],
    });
    expect(result).toEqual({
      url: "https://example.com/comments",
      source: "atom-link",
    });
  });

  it("should return null when no comment links found", () => {
    const result = extractor.extract({
      links: [{ rel: "alternate", href: "https://example.com/post" }],
    });
    expect(result).toBeNull();
  });
});
```

**File**: `packages/api/src/services/comment-link-extraction/html-pattern-extractor.test.ts` (NEW)

```typescript
import { describe, it, expect } from "vitest";
import { HtmlPatternExtractor } from "./html-pattern-extractor";

describe("HtmlPatternExtractor", () => {
  const extractor = new HtmlPatternExtractor();

  it("should handle items with description", () => {
    expect(extractor.canHandle({ description: "<p>test</p>" })).toBe(true);
  });

  it("should not handle items without HTML content", () => {
    expect(extractor.canHandle({ title: "Test" })).toBe(false);
  });

  it("should extract Reddit-style [comments] links", () => {
    const result = extractor.extract({
      description: '<a href="https://reddit.com/comments/abc123">[comments]</a>',
    });
    expect(result).toEqual({
      url: "https://reddit.com/comments/abc123",
      source: "html-pattern",
    });
  });

  it("should extract plain Comments links", () => {
    const result = extractor.extract({
      description: '<a href="https://example.com/discuss">Comments</a>',
    });
    expect(result).toEqual({
      url: "https://example.com/discuss",
      source: "html-pattern",
    });
  });

  it("should extract Discussion links", () => {
    const result = extractor.extract({
      content: '<a href="https://example.com/thread">Discussion</a>',
    });
    expect(result).toEqual({
      url: "https://example.com/thread",
      source: "html-pattern",
    });
  });

  it("should return null when no comment patterns found", () => {
    const result = extractor.extract({
      description: '<a href="https://example.com">Read more</a>',
    });
    expect(result).toBeNull();
  });
});
```

**File**: `packages/api/src/services/comment-link-extraction/registry.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { CommentLinkRegistry } from "./registry";
import type { CommentLinkExtractor } from "./types";

describe("CommentLinkRegistry", () => {
  let registry: CommentLinkRegistry;

  beforeEach(() => {
    registry = new CommentLinkRegistry();
  });

  it("should execute extractors in priority order", () => {
    const lowPriorityExtractor: CommentLinkExtractor = {
      priority: 100,
      canHandle: () => true,
      extract: () => ({ url: "low-priority", source: "rss-element" }),
    };

    const highPriorityExtractor: CommentLinkExtractor = {
      priority: 10,
      canHandle: () => true,
      extract: () => ({ url: "high-priority", source: "rss-element" }),
    };

    // Register in reverse order
    registry.register(lowPriorityExtractor);
    registry.register(highPriorityExtractor);

    // Should use high priority first
    const result = registry.extract({ title: "Test" });
    expect(result).toBe("high-priority");
  });

  it("should skip extractors that cannot handle item", () => {
    const skipExtractor: CommentLinkExtractor = {
      priority: 10,
      canHandle: () => false,
      extract: () => ({ url: "should-not-use", source: "rss-element" }),
    };

    const useExtractor: CommentLinkExtractor = {
      priority: 20,
      canHandle: () => true,
      extract: () => ({ url: "correct", source: "html-pattern" }),
    };

    registry.register(skipExtractor);
    registry.register(useExtractor);

    const result = registry.extract({ title: "Test" });
    expect(result).toBe("correct");
  });

  it("should return null when no extractors find a link", () => {
    const extractor: CommentLinkExtractor = {
      priority: 10,
      canHandle: () => true,
      extract: () => null,
    };

    registry.register(extractor);

    const result = registry.extract({ title: "Test" });
    expect(result).toBeNull();
  });

  it("should stop at first successful extraction", () => {
    let secondCalled = false;

    const firstExtractor: CommentLinkExtractor = {
      priority: 10,
      canHandle: () => true,
      extract: () => ({ url: "first", source: "rss-element" }),
    };

    const secondExtractor: CommentLinkExtractor = {
      priority: 20,
      canHandle: () => true,
      extract: () => {
        secondCalled = true;
        return { url: "second", source: "html-pattern" };
      },
    };

    registry.register(firstExtractor);
    registry.register(secondExtractor);

    const result = registry.extract({ title: "Test" });
    expect(result).toBe("first");
    expect(secondCalled).toBe(false);
  });
});
```

### Integration Tests

**File**: `packages/api/src/services/comment-link-extraction/integration.test.ts` (NEW)

Test with fake data based on real feed schemas:

```typescript
import { describe, it, expect } from "vitest";
import { extractCommentLink } from "./index";

describe("Comment Link Extraction - Integration", () => {
  describe("Hacker News feed schema", () => {
    it("should extract from HN-style RSS item", () => {
      // Based on actual HN RSS schema
      const hnItem = {
        title: "DeepSeek-v3.2: Pushing the frontier of open large language models",
        link: "https://huggingface.co/deepseek-ai/DeepSeek-V3.2/resolve/main/assets/paper.pdf",
        pubDate: "Mon, 01 Dec 2025 15:48:03 +0000",
        comments: "https://news.ycombinator.com/item?id=46108780",
        description: '<a href="https://news.ycombinator.com/item?id=46108780">Comments</a>',
      };

      const result = extractCommentLink(hnItem);
      expect(result).toBe("https://news.ycombinator.com/item?id=46108780");
    });

    it("should extract from HN item with only description", () => {
      // HN item without explicit comments element (rare but possible)
      const hnItem = {
        title: "Show HN: My Project",
        link: "https://example.com/project",
        description: '<a href="https://news.ycombinator.com/item?id=12345">Comments</a>',
      };

      const result = extractCommentLink(hnItem);
      expect(result).toBe("https://news.ycombinator.com/item?id=12345");
    });
  });

  describe("Reddit feed schema (Atom)", () => {
    it("should extract from Reddit Atom entry with HTML content", () => {
      // Based on actual Reddit Atom feed schema
      const redditItem = {
        title: "Luigi Mangione fights to exclude gun notes",
        id: "t3_1pbgb2z",
        links: [
          {
            href: "https://www.reddit.com/r/news/comments/1pbgb2z/luigi_mangione_fights_to_exclude_gun_notes_as/",
            rel: "alternate",
          },
        ],
        content:
          '&amp;#32; submitted by &amp;#32; <a href="https://www.reddit.com/user/AudibleNod"> /u/AudibleNod </a> <br/> <span><a href="https://www.ctvnews.ca/world/article/luigi-mangione-fights-to-exclude-gun-notes-as-anniversary-of-unitedhealthcare-ceos-killing-nears/">[link]</a></span> &amp;#32; <span><a href="https://www.reddit.com/r/news/comments/1pbgb2z/luigi_mangione_fights_to_exclude_gun_notes_as/">[comments]</a></span>',
        updated: "2025-12-01T15:52:05+00:00",
        published: "2025-12-01T15:52:05+00:00",
      };

      const result = extractCommentLink(redditItem);
      expect(result).toBe(
        "https://www.reddit.com/r/news/comments/1pbgb2z/luigi_mangione_fights_to_exclude_gun_notes_as/"
      );
    });

    it("should extract from Reddit with description field", () => {
      // Some Reddit feed formats use description instead of content
      const redditItem = {
        title: "Starbucks to pay about $35M to NYC workers",
        description:
          '<span><a href="https://apnews.com/article/abc123">[link]</a></span> <span><a href="https://www.reddit.com/r/news/comments/1pbk6he/starbucks_to_pay/">[comments]</a></span>',
      };

      const result = extractCommentLink(redditItem);
      expect(result).toBe(
        "https://www.reddit.com/r/news/comments/1pbk6he/starbucks_to_pay/"
      );
    });

    it("should handle Reddit items with complex HTML", () => {
      // Reddit HTML can have lots of HTML entities and nested tags
      const redditItem = {
        title: "Test Article",
        content:
          '&lt;div&gt;submitted by &lt;a href="/u/test"&gt;/u/test&lt;/a&gt;&lt;br/&gt;&lt;span&gt;&lt;a href="https://example.com"&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href="https://www.reddit.com/r/test/comments/abc123/test/"&gt;[comments]&lt;/a&gt;&lt;/span&gt;&lt;/div&gt;',
      };

      const result = extractCommentLink(redditItem);
      expect(result).toBe("https://www.reddit.com/r/test/comments/abc123/test/");
    });
  });

  describe("WordPress/Standard RSS", () => {
    it("should extract from WordPress RSS with comments element", () => {
      const wpItem = {
        title: "New Blog Post",
        link: "https://example.com/blog/new-post",
        description: "<p>This is a great article about something interesting.</p>",
        comments: "https://example.com/blog/new-post#comments",
        pubDate: "Mon, 01 Dec 2025 12:00:00 +0000",
      };

      const result = extractCommentLink(wpItem);
      expect(result).toBe("https://example.com/blog/new-post#comments");
    });
  });

  describe("Atom feeds with standard link elements", () => {
    it("should extract from Atom with link rel=replies", () => {
      const atomItem = {
        title: "Standard Atom Entry",
        id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
        links: [
          { href: "https://example.com/entry", rel: "alternate" },
          { href: "https://example.com/entry/comments", rel: "replies" },
        ],
        summary: "This is an Atom feed entry",
        updated: "2025-12-01T12:00:00Z",
      };

      const result = extractCommentLink(atomItem);
      expect(result).toBe("https://example.com/entry/comments");
    });

    it("should extract from Atom with link rel=comments", () => {
      const atomItem = {
        title: "Another Atom Entry",
        links: [
          { href: "https://example.com/post", rel: "alternate" },
          { href: "https://example.com/post/discuss", rel: "comments" },
        ],
        summary: "Entry with comments link",
      };

      const result = extractCommentLink(atomItem);
      expect(result).toBe("https://example.com/post/discuss");
    });
  });

  describe("Feeds without comment links", () => {
    it("should return null for regular RSS without comments", () => {
      const regularItem = {
        title: "Regular Blog Post",
        link: "https://example.com/post",
        description: "<p>Just a regular post with no comments.</p>",
        pubDate: "Mon, 01 Dec 2025 12:00:00 +0000",
      };

      const result = extractCommentLink(regularItem);
      expect(result).toBeNull();
    });

    it("should return null for Atom without comment links", () => {
      const atomItem = {
        title: "Atom Entry",
        links: [{ href: "https://example.com/entry", rel: "alternate" }],
        summary: "No comments here",
      };

      const result = extractCommentLink(atomItem);
      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle items with multiple comment-like links (use first)", () => {
      const multiItem = {
        comments: "https://news.ycombinator.com/item?id=12345",
        description:
          '<a href="https://reddit.com/comments/abc">Comments on Reddit</a>',
      };

      // Should use RSS comments element (higher priority)
      const result = extractCommentLink(multiItem);
      expect(result).toBe("https://news.ycombinator.com/item?id=12345");
    });

    it("should handle malformed HTML gracefully", () => {
      const malformedItem = {
        description: '<a href="https://example.com/comments">Comments<a>',
      };

      // Should still extract despite unclosed tag
      const result = extractCommentLink(malformedItem);
      expect(result).toBe("https://example.com/comments");
    });

    it("should ignore non-comment links in HTML", () => {
      const nonCommentItem = {
        description:
          '<a href="https://example.com/article">Read More</a> <a href="https://example.com/share">Share</a>',
      };

      const result = extractCommentLink(nonCommentItem);
      expect(result).toBeNull();
    });

    it("should handle empty or minimal feed items", () => {
      expect(extractCommentLink({})).toBeNull();
      expect(extractCommentLink({ title: "Test" })).toBeNull();
      expect(extractCommentLink({ description: "" })).toBeNull();
    });
  });

  describe("Priority order verification", () => {
    it("should prefer RSS comments element over HTML pattern", () => {
      const item = {
        comments: "https://priority-winner.com/rss-element",
        description:
          '<a href="https://priority-loser.com/html">Comments</a>',
      };

      const result = extractCommentLink(item);
      expect(result).toBe("https://priority-winner.com/rss-element");
    });

    it("should prefer Atom link over HTML pattern", () => {
      const item = {
        links: [
          { href: "https://priority-winner.com/atom", rel: "replies" },
        ],
        description: '<a href="https://priority-loser.com/html">Comments</a>',
      };

      const result = extractCommentLink(item);
      expect(result).toBe("https://priority-winner.com/atom");
    });
  });
});
```

**File**: `packages/api/src/services/rss-fetcher.test.ts` (extend existing or create)

Add integration tests that verify comment links are extracted during feed processing:

```typescript
import { describe, it, expect } from "vitest";
import { extractArticleData } from "./rss-fetcher";

describe("RSS Fetcher - Comment Link Integration", () => {
  it("should extract comment link during article data extraction (HN)", () => {
    const hnItem = {
      title: "Test Article",
      link: "https://example.com/article",
      comments: "https://news.ycombinator.com/item?id=12345",
      description: "Test description",
      pubDate: "Mon, 01 Dec 2025 12:00:00 +0000",
    };

    const articleData = extractArticleData(hnItem, "test-source-guid");

    expect(articleData.commentLink).toBe(
      "https://news.ycombinator.com/item?id=12345"
    );
  });

  it("should extract comment link during article data extraction (Reddit)", () => {
    const redditItem = {
      title: "Test Post",
      links: [
        {
          href: "https://www.reddit.com/r/test/comments/abc123/test_post/",
          rel: "alternate",
        },
      ],
      content:
        '<span><a href="https://example.com">[link]</a></span> <span><a href="https://www.reddit.com/r/test/comments/abc123/test_post/">[comments]</a></span>',
      updated: "2025-12-01T12:00:00Z",
    };

    const articleData = extractArticleData(redditItem, "test-source-guid");

    expect(articleData.commentLink).toBe(
      "https://www.reddit.com/r/test/comments/abc123/test_post/"
    );
  });

  it("should handle articles without comment links", () => {
    const regularItem = {
      title: "Regular Article",
      link: "https://example.com/article",
      description: "No comments",
      pubDate: "Mon, 01 Dec 2025 12:00:00 +0000",
    };

    const articleData = extractArticleData(regularItem, "test-source-guid");

    expect(articleData.commentLink).toBeNull();
  });
});
```

### Manual Testing

1. **Add Feeds**:
   - Subscribe to https://news.ycombinator.com/rss
   - Subscribe to https://www.reddit.com/r/news/.rss
   - Subscribe to a blog without comment links (control group)

2. **Verify Extraction**:
   - Fetch feeds and check database for `commentLink` values
   - Confirm HN articles have comment links
   - Confirm Reddit articles have comment links
   - Confirm non-comment feeds have NULL comment links

3. **Verify UI**:
   - Navigate to articles view
   - Verify comment button appears for articles with comment links
   - Verify comment button does NOT appear for articles without
   - Click comment button and verify it opens correct URL
   - Verify link opens in new tab with proper security attributes

## Implementation Checklist

### Phase 1: Database
- [ ] Add `commentLink` field to database schema
- [ ] Generate database migration
- [ ] Apply migration locally
- [ ] Test migration rollback

### Phase 2: Comment Link Extraction
- [ ] Create `comment-link-extraction/types.ts`
- [ ] Create `comment-link-extraction/registry.ts`
- [ ] Create `comment-link-extraction/rss-element-extractor.ts`
- [ ] Create `comment-link-extraction/atom-link-extractor.ts`
- [ ] Create `comment-link-extraction/html-pattern-extractor.ts`
- [ ] Create `comment-link-extraction/index.ts`
- [ ] Import and use in `rss-fetcher.ts::extractArticleData()`
- [ ] Update `storeArticles()` to save comment link

### Phase 3: API
- [ ] Include `commentLink` in articles router response
- [ ] Update TypeScript types

### Phase 4: UI
- [ ] Add comment button to article-item component
- [ ] Import MessageSquare icon
- [ ] Handle click events properly
- [ ] Test button visibility (shows only when link exists)

### Phase 5: Testing
- [ ] Write unit tests for each extractor
- [ ] Write unit tests for registry
- [ ] Write integration tests with real feed samples
- [ ] Test with Hacker News feed
- [ ] Test with Reddit feed
- [ ] Test with feed without comments
- [ ] Manual UI testing

### Phase 6: Deployment
- [ ] Deploy backend with migration
- [ ] Monitor for errors
- [ ] Deploy frontend
- [ ] Verify in production

## Estimated Timeline

- **Phase 1** (Database): 30 minutes
- **Phase 2** (Extraction System): 2-3 hours
  - Types and interfaces: 30 min
  - Registry: 30 min
  - Three extractors: 1-1.5 hours
  - Integration: 30 min
- **Phase 3** (API Updates): 15 minutes
- **Phase 4** (UI Component): 30 minutes
- **Phase 5** (Testing): 2-3 hours
  - Unit tests: 1-1.5 hours
  - Integration tests: 30 min
  - Manual testing: 30 min-1 hour
- **Phase 6** (Deployment): 30 minutes

**Total**: 6-8 hours

## Architecture Benefits

Following the feed-discovery pattern provides several advantages:

1. **Extensibility**: Easy to add new extractors for other platforms (GitHub, Discourse, etc.)
2. **Testability**: Each extractor is independently testable
3. **Maintainability**: Clear separation of concerns, each extractor handles one strategy
4. **Priority System**: Explicit control over extraction order
5. **Fault Tolerance**: If one extractor fails, others can still succeed
6. **Future-Proof**: Registry pattern allows runtime registration of custom extractors

## Summary

This implementation creates a robust, extensible system for extracting comment links from RSS feeds:

### Key Features
- **Registry-based architecture** following feed-discovery pattern
- **Multiple extraction strategies** in priority order:
  1. RSS `<comments>` element (Hacker News, WordPress)
  2. Atom `<link rel="replies">` (Standard Atom)
  3. HTML pattern matching (Reddit, fallback)
- **Conditional UI rendering** - button only shows when link exists
- **Type-safe** with full TypeScript support
- **Well-tested** with unit and integration tests
- **Secure** with proper link handling (target="_blank", noopener)

### Supported Feeds
- ✅ Hacker News (RSS comments element)
- ✅ Reddit (HTML embedded links)
- ✅ WordPress blogs (RSS comments element)
- ✅ Atom feeds with standard reply links
- ✅ Any feed with comment patterns in description

### Future Extensions
The registry pattern makes it easy to add:
- GitHub discussion extractors
- Discourse forum extractors
- Platform-specific extractors (Mastodon, etc.)
- Smart URL pattern detection
- Comment count extraction (when available)

## Rollout Plan

1. **Development**: Implement all phases locally with testing
2. **Staging**: Deploy to staging environment, test with real feeds
3. **Production**:
   - Deploy backend changes (includes migration)
   - Monitor for errors
   - Deploy frontend changes
   - Monitor comment button functionality

## Rollback Plan

If issues arise:
1. **Frontend**: Remove comment button rendering (feature flag or quick deploy)
2. **Backend**: `commentLink` field is nullable, so no data issues
3. **Database**: Can drop column if needed (though not recommended unless critical)

## Future Enhancements

1. **Comment Indicators**: Show visual indicator on articles with high comment activity
2. **Inline Comment Preview**: Fetch and display comment count or preview
3. **Comment Threading**: For platforms with APIs, show comment threads inline
4. **Smart Detection**: Use ML to detect comment links even without explicit markup
5. **User Preferences**: Allow users to hide/show comment buttons
6. **Analytics Dashboard**: Track which articles generate most comment engagement

## Security Considerations

1. **URL Validation**: Ensure extracted URLs are valid HTTP/HTTPS
2. **XSS Prevention**: Sanitize comment link URLs before storage
3. **Target Attributes**: Always use `target="_blank"` with `rel="noopener noreferrer"`
4. **Rate Limiting**: If fetching comment counts, implement rate limiting
5. **Content Security Policy**: Ensure CSP allows opening external links

## Performance Considerations

1. **Regex Performance**: Comment link regex should be efficient
2. **Database Indexing**: Consider indexing `commentLink` if filtering by it
3. **API Response Size**: Adding one field has minimal impact
4. **UI Rendering**: Conditional rendering of button is fast

## Accessibility

1. **Button Label**: Use `title` attribute for tooltip
2. **Icon Alt Text**: Ensure MessageSquare icon has proper aria-label
3. **Keyboard Navigation**: Button should be keyboard accessible
4. **Screen Readers**: Announce "View Comments" action

## Documentation Updates

After implementation:
1. Update API documentation with new field
2. Add comment link extraction to feed fetcher docs
3. Update UI component documentation
4. Add to changelog
