# URL-Based Subscription Feature

## Overview

Tuvix now supports quick subscription via URL parameters, allowing users to subscribe to RSS feeds with a single click from anywhere.

## Usage

### Basic URL Format

```
https://feedsmith.dev/app/subscriptions?subscribe=<encoded_feed_url>
```

### Examples

```
# Subscribe to a blog feed
https://feedsmith.dev/app/subscriptions?subscribe=https%3A%2F%2Fblog.example.com%2Ffeed.xml

# Subscribe from a website URL (auto-discovery)
https://feedsmith.dev/app/subscriptions?subscribe=https%3A%2F%2Fblog.example.com
```

## How It Works

1. User clicks a subscribe link with the `subscribe` parameter
2. Tuvix opens the subscriptions page
3. The add form automatically opens with the URL pre-populated
4. Feed discovery/preview runs automatically
5. User reviews the feed details and confirms subscription
6. URL parameter is cleared from browser history

## Implementation Details

### Frontend (React/TanStack Router)

**File**: `packages/app/src/routes/app/subscriptions.tsx`

- Route accepts optional `subscribe` search parameter
- On mount, checks for the parameter and validates the URL
- Pre-populates the subscription form
- Clears parameter from URL after processing

### Security

- URL validation ensures proper HTTP/HTTPS format
- Leverages existing feed discovery rate limits
- Uses existing blocked domains list
- Properly encodes/decodes URL parameters

## Integration Ideas

### Bookmarklet

Create a browser bookmarklet for one-click subscriptions:

```javascript
javascript:(function(){
  const tuvixUrl = 'https://feedsmith.dev/app/subscriptions';
  const currentUrl = encodeURIComponent(window.location.href);
  window.open(`${tuvixUrl}?subscribe=${currentUrl}`, '_blank');
})();
```

### Website Integration

Add "Subscribe in Tuvix" buttons to your blog:

```html
<a href="https://feedsmith.dev/app/subscriptions?subscribe=https%3A%2F%2Fyourblog.com%2Ffeed.xml">
  Subscribe in Tuvix
</a>
```

### Browser Extension

Use the URL format in browser extensions to detect feeds on pages and provide quick subscribe actions.

### Marketing Examples

```html
<!-- Blog homepage -->
<a href="https://feedsmith.dev/app/subscriptions?subscribe=https://blog.example.com/feed">
  📰 Follow our blog in Tuvix
</a>

<!-- Documentation site -->
<a href="https://feedsmith.dev/app/subscriptions?subscribe=https://docs.example.com/changelog.xml">
  🔔 Get changelog updates
</a>
```

## Future Enhancements

- Support for feed:// and rss:// URL schemes
- "Subscribe" overlay button when viewing public feeds
- Share functionality to generate subscription links
- Deep linking support for mobile PWA
- Multiple feed subscription (comma-separated URLs)
