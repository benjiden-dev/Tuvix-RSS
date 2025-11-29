# Podcast Metadata Enhancement Plan

**Status:** Planning
**Created:** 2025-11-28
**Priority:** Medium
**Complexity:** Medium

## Executive Summary

Enhance TuvixRSS podcast support by implementing comprehensive podcast metadata extraction from RSS feeds using Feedsmith namespaces (iTunes, Podcast Index, Media RSS, RawVoice). This will provide users with episode numbers, seasons, chapters, transcripts, duration display, and video podcast support.

## Current State

### What We Have ✅

1. **Basic Audio Playback**
   - Audio player component with play/pause controls
   - Scrub bar with time display
   - Audio progress tracking (position, duration, completion)
   - Location: `packages/app/src/components/app/audio-player.tsx`

2. **Audio URL Extraction**
   - Extracts audio URLs from RSS `<enclosure>` tags
   - Filters for `audio/*` MIME types
   - Location: `packages/api/src/services/rss-fetcher.ts:768-776`

3. **Apple Podcasts Integration**
   - iTunes Search API for podcast discovery
   - Automatic RSS feed detection
   - Enhanced metadata from iTunes
   - Location: `packages/api/src/services/feed-discovery/apple-discovery.ts`

4. **Database Support**
   - `audioUrl` field in articles table
   - Audio progress fields in user_article_states
   - Dedicated audio article rendering

### What's Missing ❌

1. **Podcast Metadata**
   - Episode numbers, season numbers
   - Episode type (full/trailer/bonus)
   - Duration (pre-playback)
   - Explicit content flags

2. **Advanced Features**
   - Chapter markers and navigation
   - Transcript support
   - Multiple contributor/person metadata
   - Soundbite highlights

3. **Video Podcasts**
   - No video URL extraction
   - No video player component
   - No video-specific metadata

4. **Enhanced Discovery**
   - Not using full iTunes API metadata
   - Missing podcast-specific fields

## Goals

### Primary Goals

1. Store comprehensive podcast metadata without bloating the articles table
2. Display episode/season numbers in article list
3. Show episode duration before playback starts
4. Support video podcasts with basic playback
5. Extract and display chapter information

### Secondary Goals

1. Transcript viewing with playback sync
2. Enhanced contributor/person display
3. Soundbite highlights in UI
4. Multiple audio/video format support (via alternate enclosures)

### Non-Goals

- Custom podcast player UI overhaul (use existing player)
- Podcast directory/search (focus on subscribed feeds)
- Podcast recommendations
- Download management for offline listening

## Architecture

### Database Schema Changes

#### New Table: `podcast_episodes`

**Rationale:** Separate table avoids NULL pollution in articles table. Most articles (80-90%) are not podcasts.

```typescript
export const podcastEpisodes = sqliteTable(
  "podcast_episodes",
  {
    // Primary key and foreign key
    articleId: integer("article_id")
      .primaryKey()
      .references(() => articles.id, { onDelete: "cascade" }),

    // iTunes namespace - structured data
    duration: integer("duration"), // seconds
    episode: integer("episode"), // episode number
    season: integer("season"), // season number
    episodeType: text("episode_type", {
      enum: ["full", "trailer", "bonus"],
    }),
    explicit: integer("explicit", { mode: "boolean" }),

    // Video support
    videoUrl: text("video_url"),

    // Complex metadata stored as JSON
    chapters: text("chapters", { mode: "json" }),
    // Schema: Array<{ startTime: number, title: string, url?: string, img?: string }>

    transcripts: text("transcripts", { mode: "json" }),
    // Schema: Array<{ url: string, type: string, language?: string }>

    persons: text("persons", { mode: "json" }),
    // Schema: Array<{ name: string, role: string, group?: string, img?: string, href?: string }>

    soundbites: text("soundbites", { mode: "json" }),
    // Schema: Array<{ startTime: number, duration: number, title?: string }>

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_podcast_episodes_duration").on(table.duration),
    index("idx_podcast_episodes_season_episode").on(table.season, table.episode),
    index("idx_podcast_episodes_episode_type").on(table.episodeType),
  ]
);
```

#### Modified Table: `articles`

Add video support (not podcast-specific - blogs can have video too):

```typescript
export const articles = sqliteTable("articles", {
  // ... existing fields ...
  audioUrl: text("audio_url"), // KEEP - used for filtering
  videoUrl: text("video_url"), // NEW - for video content
  // ... rest of fields ...
});
```

### Data Flow

```
RSS Feed
    ↓
parseFeed() [feedsmith]
    ↓
extractArticleData()
    ├─→ articleData (always)
    └─→ podcastData (conditional)
    ↓
storeArticles()
    ├─→ INSERT articles
    └─→ INSERT podcast_episodes (if podcast)
    ↓
articles.list tRPC endpoint
    ↓
LEFT JOIN podcast_episodes
    ↓
ArticleItem component
    ↓
Display episode metadata
```

## Implementation Plan

### Phase 1: Database & Parsing Foundation

**Effort:** 3-4 hours
**Priority:** High

#### Tasks

1. **Create Migration**
   - Add `podcast_episodes` table
   - Add `videoUrl` to articles table
   - Create indexes
   - File: `packages/api/migrations/XXXX_add_podcast_metadata.sql`

2. **Update Schema**
   - Add `podcast_episodes` table definition
   - Add `videoUrl` field to articles
   - Update schema exports
   - File: `packages/api/src/db/schema.ts`

3. **Create Podcast Parser**
   - Extract iTunes namespace fields (duration, episode, season, episodeType, explicit)
   - Extract Podcast namespace fields (chapters, transcripts, persons, soundbites)
   - Extract Media namespace fields (thumbnails)
   - Extract RawVoice namespace fields (isHd, poster, video formats)
   - Create helper function `extractPodcastData(item: AnyItem): PodcastData | null`
   - File: `packages/api/src/services/podcast-parser.ts` (NEW)

4. **Update RSS Fetcher**
   - Call `extractPodcastData()` in `extractArticleData()`
   - Return both `articleData` and `podcastData`
   - Store podcast data when present
   - Extract video URLs from enclosures
   - File: `packages/api/src/services/rss-fetcher.ts`

5. **Update Type Definitions**
   - Add podcast types to feedsmith type definitions
   - Create PodcastEpisode type
   - File: `packages/api/src/types/feed.ts`

#### Acceptance Criteria

- [ ] Migration runs successfully on local and D1
- [ ] Schema compiles without errors
- [ ] RSS fetcher extracts podcast data from test feed
- [ ] podcast_episodes table populated for podcast articles
- [ ] Video URLs extracted from enclosures
- [ ] Non-podcast articles unaffected

#### Testing Strategy

- Unit tests for `extractPodcastData()` with various feed formats
- Integration test with real podcast RSS feed
- Test non-podcast feed to ensure no regressions
- Test feeds:
  - Podcast: `https://feeds.simplecast.com/54nAGcIl` (Syntax.fm)
  - Blog: `https://overreacted.io/rss.xml` (Dan Abramov)

### Phase 2: Query Layer & API

**Effort:** 2-3 hours
**Priority:** High

#### Tasks

1. **Update Article Queries**
   - Add LEFT JOIN to podcast_episodes in `articles.list`
   - Add LEFT JOIN to podcast_episodes in `articles.get`
   - Include podcastEpisode in return type
   - File: `packages/api/src/routers/articles.ts`

2. **Update tRPC Types**
   - Extend article output type with optional podcastEpisode
   - Create PodcastEpisodeOutput type
   - File: `packages/api/src/routers/articles.ts`

3. **Add Podcast Filters**
   - Add `isPodcast` filter to articles.list
   - Add `hasChapters` filter
   - Add `hasTranscript` filter
   - File: `packages/api/src/routers/articles.ts`

#### Acceptance Criteria

- [ ] Articles API returns podcast metadata when present
- [ ] Frontend receives typed podcast data
- [ ] Filters work correctly
- [ ] Performance acceptable (JOIN overhead minimal)

#### Testing Strategy

- Test API responses with/without podcast data
- Test filter functionality
- Benchmark query performance
- Check tRPC type inference in frontend

### Phase 3: UI - Basic Display

**Effort:** 3-4 hours
**Priority:** High

#### Tasks

1. **Create Utility Functions**
   - `formatDuration(seconds: number): string` (e.g., "1:23:45")
   - `formatEpisodeNumber(season?, episode?): string` (e.g., "S2E15")
   - `isPodcastArticle(article): boolean`
   - File: `packages/app/src/lib/utils/podcast.ts` (NEW)

2. **Update ArticleItem Component**
   - Show episode/season badge when present
   - Show duration badge for podcast episodes
   - Show explicit badge when flagged
   - Show episode type badge (trailer/bonus)
   - Location: `packages/app/src/components/app/article-item.tsx`

3. **Update ArticleItemAudio Component**
   - Display episode metadata in header
   - Show duration before playback
   - Show video thumbnail if video podcast
   - Location: `packages/app/src/components/app/article-item-audio.tsx` (CHECK IF EXISTS)

4. **Create PodcastBadges Component**
   - Reusable badge component for episode info
   - Handle different badge types (episode, duration, explicit, type)
   - File: `packages/app/src/components/app/podcast-badges.tsx` (NEW)

#### Acceptance Criteria

- [ ] Episode numbers display correctly (S1E12 format)
- [ ] Duration displays before playback (1:23:45 format)
- [ ] Explicit badge shows when flagged
- [ ] Episode type (trailer/bonus) displays
- [ ] UI responsive on mobile and desktop
- [ ] No UI shown for non-podcast articles

#### Testing Strategy

- Visual testing with various podcast episodes
- Test edge cases (no season, only episode, etc.)
- Test with explicit and non-explicit content
- Mobile responsiveness check

### Phase 4: Video Support

**Effort:** 4-5 hours
**Priority:** Medium

#### Tasks

1. **Create VideoPlayer Component**
   - Basic HTML5 video player with controls
   - Scrub bar integration (reuse audio scrub bar)
   - Play/pause, seek, volume controls
   - Fullscreen support
   - File: `packages/app/src/components/app/video-player.tsx` (NEW)

2. **Create ArticleItemVideo Component**
   - Similar to ArticleItemAudio but for video
   - Show video player inline or modal
   - Display video metadata
   - File: `packages/app/src/components/app/article-item-video.tsx` (NEW)

3. **Update ArticleItem Routing**
   - Check for videoUrl first, then audioUrl
   - Route to appropriate component
   - Location: `packages/app/src/components/app/article-item.tsx:57`

4. **Add Video Progress Tracking**
   - Reuse audio progress tracking system
   - Track video position, duration, completion
   - Location: `packages/app/src/lib/hooks/useVideoProgress.ts` (NEW)

#### Acceptance Criteria

- [ ] Video podcasts play correctly
- [ ] Video player has standard controls
- [ ] Progress saved and restored
- [ ] Mobile-friendly video player
- [ ] Fallback to audio if video fails

#### Testing Strategy

- Test with video podcast feeds
- Test on mobile devices
- Test various video formats (MP4, WebM)
- Test progress tracking across sessions

### Phase 5: Chapters UI

**Effort:** 4-5 hours
**Priority:** Medium

#### Tasks

1. **Create ChapterList Component**
   - Display chapter list with timestamps
   - Click to jump to chapter
   - Highlight current chapter during playback
   - Collapsible on mobile
   - File: `packages/app/src/components/app/chapter-list.tsx` (NEW)

2. **Update AudioPlayer Component**
   - Add chapter markers to scrub bar
   - Show current chapter title
   - Jump to chapter on marker click
   - Location: `packages/app/src/components/app/audio-player.tsx`

3. **Create useChapters Hook**
   - Track current chapter based on playback position
   - Handle chapter navigation
   - File: `packages/app/src/lib/hooks/useChapters.ts` (NEW)

4. **Add Chapter Metadata Display**
   - Show chapter count badge
   - Display chapter URLs/images if present
   - Location: `packages/app/src/components/app/article-item-audio.tsx`

#### Acceptance Criteria

- [ ] Chapters display in order with timestamps
- [ ] Clicking chapter jumps to correct position
- [ ] Current chapter highlighted during playback
- [ ] Chapter markers visible on scrub bar
- [ ] Works for both audio and video

#### Testing Strategy

- Test with podcast with many chapters (10+)
- Test with podcast with few chapters (2-3)
- Test chapter navigation accuracy
- Test on mobile (touch targets)

### Phase 6: Transcript Support

**Effort:** 5-6 hours
**Priority:** Low

#### Tasks

1. **Create Transcript Parser**
   - Fetch transcript from URL
   - Support VTT, SRT, plain text formats
   - Parse into timestamped segments
   - File: `packages/app/src/lib/utils/transcript-parser.ts` (NEW)

2. **Create TranscriptViewer Component**
   - Display transcript with timestamps
   - Highlight current segment during playback
   - Click segment to jump to position
   - Search within transcript
   - Auto-scroll to current position
   - File: `packages/app/src/components/app/transcript-viewer.tsx` (NEW)

3. **Integrate with Audio Player**
   - Show transcript toggle button
   - Sync transcript with audio position
   - Two-way sync (click transcript OR scrub audio)
   - Location: `packages/app/src/components/app/audio-player.tsx`

4. **Add Transcript Indicator**
   - Show "Transcript Available" badge
   - Location: `packages/app/src/components/app/article-item-audio.tsx`

#### Acceptance Criteria

- [ ] Transcripts load from URL
- [ ] Current segment highlights during playback
- [ ] Clicking segment jumps to correct time
- [ ] Search works within transcript
- [ ] Auto-scroll follows playback
- [ ] Works on mobile (scrollable)

#### Testing Strategy

- Test with VTT format transcripts
- Test with SRT format transcripts
- Test with plain text transcripts
- Test search functionality
- Test sync accuracy

### Phase 7: Enhanced Apple Discovery

**Effort:** 1-2 hours
**Priority:** Low

#### Tasks

1. **Extract Additional iTunes Metadata**
   - Episode count
   - Genres
   - Primary genre
   - Publisher information
   - Location: `packages/api/src/services/feed-discovery/apple-discovery.ts:236`

2. **Store Podcast-Level Metadata**
   - Consider adding `podcast_metadata` to sources table
   - Store iTunes-specific feed metadata
   - Location: `packages/api/src/db/schema.ts`

3. **Display Podcast Feed Metadata**
   - Show episode count on feed page
   - Display genres
   - Show primary genre badge
   - Location: Feed detail component (TBD)

#### Acceptance Criteria

- [ ] iTunes API metadata extracted
- [ ] Podcast feed metadata displayed
- [ ] Genre information shown
- [ ] Episode count accurate

#### Testing Strategy

- Test with various Apple Podcasts URLs
- Verify metadata accuracy
- Check UI display

## Technical Considerations

### Performance

1. **Query Performance**
   - LEFT JOIN adds minimal overhead (~5-10ms)
   - Indexes on season/episode for sorting
   - JSON columns for flexible metadata (SQLite JSON functions)

2. **Storage**
   - Podcast metadata: ~1-2KB per episode
   - Chapters: ~500B-1KB per episode
   - Transcripts: Stored externally (URLs only)

3. **Parsing Performance**
   - Podcast parsing adds ~10-20ms per article
   - Acceptable for background cron job
   - No impact on user-facing requests

### Security

1. **URL Validation**
   - Validate video/audio URLs before rendering
   - Sanitize chapter URLs (XSS prevention)
   - Validate transcript URLs

2. **Content Safety**
   - Respect explicit content flags
   - Option to hide explicit content (future)
   - No direct transcript rendering (iframe/embed)

### Compatibility

1. **Feedsmith Namespace Support**
   - iTunes: ✅ Well supported
   - Podcast Index: ⚠️ Partial (check feedsmith docs)
   - Media RSS: ✅ Supported
   - RawVoice: ⚠️ May need custom parsing

2. **Browser Compatibility**
   - HTML5 audio: All modern browsers
   - HTML5 video: All modern browsers
   - VTT/SRT: Native browser support
   - WebVTT API: Good support

### Fallbacks

1. **Missing Metadata**
   - If no duration: Show "Unknown length"
   - If no episode number: Don't show badge
   - If no chapters: Hide chapter UI

2. **Parsing Failures**
   - Log errors but continue processing
   - Graceful degradation (show basic info)
   - Don't block article storage

3. **Playback Failures**
   - Show error message
   - Provide link to external source
   - Allow retry

## Migration Strategy

### Database Migration

```sql
-- Add podcast_episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
  article_id INTEGER PRIMARY KEY,
  duration INTEGER,
  episode INTEGER,
  season INTEGER,
  episode_type TEXT CHECK(episode_type IN ('full', 'trailer', 'bonus')),
  explicit INTEGER DEFAULT 0,
  video_url TEXT,
  chapters TEXT, -- JSON
  transcripts TEXT, -- JSON
  persons TEXT, -- JSON
  soundbites TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX idx_podcast_episodes_duration ON podcast_episodes(duration);
CREATE INDEX idx_podcast_episodes_season_episode ON podcast_episodes(season, episode);
CREATE INDEX idx_podcast_episodes_episode_type ON podcast_episodes(episode_type);

-- Add video support to articles
ALTER TABLE articles ADD COLUMN video_url TEXT;
CREATE INDEX idx_articles_video_url ON articles(video_url);
```

### Backfill Strategy

**Option 1: Lazy Backfill (Recommended)**
- New articles get podcast metadata automatically
- Old articles get metadata on next feed fetch
- No immediate backfill needed
- Gradual, low-impact approach

**Option 2: Active Backfill**
- Run one-time script to re-parse recent podcast articles
- Fetch feed and re-extract metadata
- Only for last 30 days of podcast articles
- Higher initial cost but immediate benefits

**Recommendation:** Use Option 1 (Lazy Backfill) unless users specifically request older episode metadata.

## Testing Plan

### Unit Tests

1. **Podcast Parser Tests**
   - Test iTunes namespace extraction
   - Test Podcast namespace extraction
   - Test Media namespace extraction
   - Test RawVoice namespace extraction
   - Test missing/malformed data
   - File: `packages/api/src/services/__tests__/podcast-parser.test.ts`

2. **Utility Function Tests**
   - Test duration formatting
   - Test episode number formatting
   - Test podcast detection
   - File: `packages/app/src/lib/utils/__tests__/podcast.test.ts`

### Integration Tests

1. **RSS Fetcher Tests**
   - Test podcast feed parsing end-to-end
   - Test non-podcast feed (no regression)
   - Test mixed feed (some audio, some not)
   - File: `packages/api/src/services/__tests__/rss-fetcher.test.ts`

2. **API Tests**
   - Test articles.list with podcast data
   - Test filtering by podcast
   - Test JOIN performance
   - File: `packages/api/src/routers/__tests__/articles.test.ts`

### E2E Tests

1. **UI Tests**
   - Subscribe to podcast feed
   - Verify episode metadata displays
   - Test audio playback with chapters
   - Test video playback
   - Test transcript viewing

### Test Feeds

Use these real-world feeds for testing:

1. **Syntax.fm** (JavaScript podcast)
   - URL: `https://feeds.simplecast.com/54nAGcIl`
   - Has: Duration, episodes, seasons, chapters
   - Good for: Comprehensive testing

2. **The Changelog** (Tech podcast)
   - URL: `https://changelog.com/podcast/feed`
   - Has: Episodes, transcripts
   - Good for: Transcript testing

3. **ATP** (Tech podcast)
   - URL: `https://atp.fm/rss`
   - Has: Chapters, episode numbers
   - Good for: Chapter testing

4. **Overreacted** (Blog with audio)
   - URL: `https://overreacted.io/rss.xml`
   - Has: No podcast metadata
   - Good for: Regression testing

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Test with development team
- Subscribe to various podcast feeds
- Gather feedback on metadata accuracy
- Fix critical bugs

### Phase 2: Beta Testing (Week 2)
- Enable for beta users
- Monitor error rates
- Collect user feedback
- Iterate on UI/UX

### Phase 3: Gradual Rollout (Week 3)
- Enable for 25% of users
- Monitor performance metrics
- Watch for regressions
- Increase to 50%, then 100%

### Phase 4: Feature Announcement (Week 4)
- Announce enhanced podcast support
- Create documentation
- Share example podcast feeds
- Gather user feedback

## Success Metrics

### Technical Metrics

1. **Parsing Success Rate**
   - Target: >95% of podcast feeds parsed correctly
   - Measure: Percentage of feeds with podcast_episodes entries

2. **Performance**
   - Target: <50ms overhead for podcast parsing
   - Target: <10ms JOIN overhead on queries
   - Measure: Sentry performance monitoring

3. **Storage**
   - Target: <2KB average per podcast episode
   - Measure: Database size growth rate

### User Metrics

1. **Engagement**
   - Measure: Increase in audio article plays
   - Target: 20% increase in podcast listening

2. **Feature Adoption**
   - Measure: Chapter navigation usage
   - Measure: Transcript viewing rate

3. **User Satisfaction**
   - Gather feedback on podcast experience
   - Monitor support tickets for issues

## Risks & Mitigation

### Risk 1: Feedsmith Namespace Support

**Risk:** Feedsmith may not support all podcast namespaces
**Likelihood:** Medium
**Impact:** High

**Mitigation:**
- Verify namespace support early (Phase 1)
- Implement custom parsers if needed
- Fallback to manual XML parsing
- Test with real podcast feeds immediately

### Risk 2: Performance Degradation

**Risk:** JOIN overhead slows down article queries
**Likelihood:** Low
**Impact:** Medium

**Mitigation:**
- Benchmark queries early
- Add proper indexes
- Use EXPLAIN QUERY PLAN
- Consider materialized view if needed
- Monitor query performance in production

### Risk 3: Storage Growth

**Risk:** Podcast metadata increases database size significantly
**Likelihood:** Low
**Impact:** Low

**Mitigation:**
- Monitor database size
- JSON columns compress well
- Implement data retention policies
- Set limits on chapter/person counts

### Risk 4: Video Playback Issues

**Risk:** Video formats not compatible across browsers
**Likelihood:** Medium
**Impact:** Medium

**Mitigation:**
- Use HTML5 video with fallbacks
- Support multiple formats (MP4, WebM)
- Provide external link fallback
- Test on major browsers/devices

### Risk 5: Transcript Parsing Complexity

**Risk:** Multiple transcript formats hard to parse correctly
**Likelihood:** High
**Impact:** Low

**Mitigation:**
- Start with VTT only (most common)
- Add SRT support if needed
- Graceful failures
- Link to external transcript if parsing fails

## Future Enhancements

### Phase 8: Advanced Features (Future)

1. **Playback Speed Control**
   - 0.5x - 2.0x speed
   - Per-podcast speed preference

2. **Sleep Timer**
   - Stop playback after X minutes
   - Fade out audio

3. **Smart Chapters**
   - Auto-generate chapters using AI
   - For podcasts without chapter metadata

4. **Enhanced Search**
   - Search within transcripts
   - Search by speaker (from persons)

5. **Playlist Support**
   - Queue multiple episodes
   - Auto-play next episode

6. **Podcast Analytics**
   - Listen time per podcast
   - Completion rates
   - Popular episodes

7. **Alternate Enclosures**
   - Multiple audio quality options
   - User preference for quality

8. **Live Podcasts**
   - Support podcast:liveItem
   - Real-time streaming
   - Live chat integration

## Documentation

### Required Documentation

1. **Developer Guide**
   - How to add new podcast namespaces
   - Podcast parser architecture
   - Location: `docs/developer/podcast-system.md`

2. **User Guide**
   - How to subscribe to podcasts
   - How to use chapters
   - How to view transcripts
   - Location: `docs/guides/features/podcasts.md`

3. **API Documentation**
   - Podcast metadata structure
   - Filter options
   - Location: Update `docs/trpc-api-architecture.md`

4. **Migration Guide**
   - Database migration steps
   - Backfill instructions
   - Location: `docs/migrations/podcast-metadata.md`

## Open Questions

1. **Should we display podcast metadata on feed pages?**
   - Show total episodes, average duration, etc.
   - Requires aggregation queries

2. **Should we support podcast:value for monetization?**
   - Complex feature for value-for-value payments
   - Probably out of scope for now

3. **Should we implement podcast:locked?**
   - Prevents feed hijacking
   - Useful for podcast creators

4. **How to handle podcast trailers?**
   - Display differently from full episodes?
   - Auto-skip trailers option?

5. **Should we support podcast:medium?**
   - Distinguish podcast/audiobook/music/video/etc.
   - Might affect UI display

6. **Storage limits for podcast metadata?**
   - Max chapters per episode?
   - Max persons per episode?
   - Truncate or reject?

## References

### Documentation

- [Feedsmith Namespaces - RawVoice](https://feedsmith.dev/reference/namespaces/rawvoice)
- [Feedsmith Namespaces - iTunes](https://feedsmith.dev/reference/namespaces/itunes)
- [Feedsmith Namespaces - Podcast Index](https://feedsmith.dev/reference/namespaces/podcast)
- [Feedsmith Namespaces - Media RSS](https://feedsmith.dev/reference/namespaces/media)
- [Podcast Index Namespace Spec](https://github.com/Podcastindex-org/podcast-namespace)
- [iTunes Podcast RSS Spec](https://help.apple.com/itc/podcasts_connect/)

### Codebase References

- Audio Player: `packages/app/src/components/app/audio-player.tsx`
- Article Item: `packages/app/src/components/app/article-item.tsx`
- RSS Fetcher: `packages/api/src/services/rss-fetcher.ts:607`
- Apple Discovery: `packages/api/src/services/feed-discovery/apple-discovery.ts`
- Database Schema: `packages/api/src/db/schema.ts:212-239`

---

**Next Steps:**
1. Review and approve plan
2. Create implementation tickets
3. Begin Phase 1 implementation
4. Set up test podcast feeds
