# Platform-Specific Icon Handling Plan

## Overview

Implement platform-specific icon extraction to improve feed icon quality and reliability. This requires the tricorder package (feed discovery/detection system) to be merged first.

## Current Issue

Reddit RSS feeds provide invalid icon URLs (e.g., `https://www.redditstatic.com/icon.png/` with trailing slash) that fail to load in browsers. Reddit provides much better icon data via their `/about.json` API endpoint.

## Proposed Solution

### 1. Reddit Service (Tricorder Package)

Create a Reddit-specific service that:
- Detects Reddit feed URLs (pattern: `reddit.com/r/{subreddit}/.rss`)
- Extracts subreddit name from feed URL
- Fetches icon from Reddit API: `https://www.reddit.com/r/{subreddit}/about.json`
- Returns `icon_img` field as the preferred icon URL

**API Response Example:**
```json
{
  "data": {
    "icon_img": "https://styles.redditmedia.com/...",
    "community_icon": "https://...",
    ...
  }
}
```

### 2. Integration Points

**In RSS Fetcher (rss-fetcher.ts:398-430):**
- Before falling back to generic icon extraction
- Call platform-specific detectors (Reddit, YouTube, etc.)
- Use platform-specific icon if available
- Fall back to current logic (iTunes image → feed image → DuckDuckGo)

**Priority Order:**
1. Platform-specific icon (Reddit, YouTube, etc.)
2. iTunes image (podcasts)
3. Feed `image.url`
4. Feed `icon`
5. DuckDuckGo favicon API
6. Root domain `/favicon.ico`

### 3. Other Platforms to Support

- **YouTube**: Extract channel avatar from channel API
- **Twitter/X**: User profile image
- **Medium**: Publication logo
- **Substack**: Publication icon
- **GitHub**: Repository/org avatar

## Implementation Steps

1. **Prerequisites:**
   - Merge tricorder PR/package
   - Set up platform detector registry

2. **Reddit Service:**
   - Create `services/reddit-discovery.ts` in tricorder
   - Implement `isRedditFeed()` detector
   - Implement `getRedditIcon()` fetcher
   - Add tests for various Reddit URL formats

3. **Integration:**
   - Update `rss-fetcher.ts` to call platform detectors
   - Add platform-specific icon priority before generic extraction
   - Add error handling and fallbacks

4. **Testing:**
   - Test with `/r/news` subscription
   - Verify icon loads correctly
   - Test fallback when Reddit API fails

## Technical Notes

- Reddit API doesn't require authentication for `/about.json`
- Should handle rate limiting gracefully
- Cache platform detection results
- Log when platform-specific icon is used (for metrics)

## Future Enhancements

- Detect other Reddit URL formats (old.reddit.com, i.reddit.com, etc.)
- Support Reddit user feeds (`/u/{username}`)
- Add configuration to disable platform-specific detection
- Implement icon quality scoring (prefer high-res icons)

## Dependencies

- **Blocked by**: Tricorder package PR merge
- **Related**: Icon caching/storage improvements
- **Related**: Favicon fetcher service

## References

- Reddit API: `https://www.reddit.com/r/{subreddit}/about.json`
- Current icon extraction: `packages/api/src/services/rss-fetcher.ts:398`
- Favicon fetcher: `packages/api/src/services/favicon-fetcher.ts`
- Feed utils: `packages/api/src/utils/feed-utils.ts`
