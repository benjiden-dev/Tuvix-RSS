/**
 * Feed Validator Utility
 *
 * Shared feed validation logic for discovery services.
 * Handles fetching, parsing, deduplication, and metadata extraction.
 */

import { parseFeed } from "feedsmith";
import { normalizeFeedUrl } from "../utils/url-normalize";
import { stripHtml } from "../utils/text-sanitizer";
import type { DiscoveredFeed } from "../core/types";

/**
 * Create a feed validator function bound to deduplication sets.
 *
 * @param seenUrls - Set of normalized URLs already discovered
 * @param seenFeedIds - Set of Atom feed IDs already discovered
 * @returns Feed validation function
 */
export function createFeedValidator(
  seenUrls: Set<string>,
  seenFeedIds: Set<string>
): (feedUrl: string) => Promise<DiscoveredFeed | null> {
  // Track in-flight requests to prevent concurrent validation of the same URL
  const inFlightRequests = new Map<
    string,
    Promise<DiscoveredFeed | null>
  >();

  return async (feedUrl: string): Promise<DiscoveredFeed | null> => {
    try {
      // Normalize input URL for deduplication check
      const normalizedInputUrl = normalizeFeedUrl(feedUrl);

      // Check if we've already seen this URL
      if (seenUrls.has(normalizedInputUrl)) return null;

      // Check if this URL is currently being validated
      const inFlightRequest = inFlightRequests.get(normalizedInputUrl);
      if (inFlightRequest) {
        // Wait for the in-flight request to complete
        return await inFlightRequest;
      }

      // Mark URL as seen immediately to prevent other concurrent calls from starting
      seenUrls.add(normalizedInputUrl);

      // Create validation promise
      const validationPromise = (async () => {
        try {
          const response = await fetch(feedUrl, {
            headers: {
              "User-Agent": "TuvixRSS/1.0",
              Accept:
                "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) return null;

          // Get final URL after redirects and normalize it for deduplication
          const finalUrl = response.url;
          const normalizedFinalUrl = normalizeFeedUrl(finalUrl);

          // Handle redirects: check if final URL was already discovered via a different path
          // Example: /feed redirects to /feed.xml, later /rss also redirects to /feed.xml
          // We want to keep the first one (/feed) and reject the second (/rss)
          if (normalizedFinalUrl !== normalizedInputUrl) {
            // There was a redirect to a different URL
            if (seenUrls.has(normalizedFinalUrl)) {
              return null; // Final URL already discovered via another path
            }
            seenUrls.add(normalizedFinalUrl); // Mark final URL as seen to catch future redirects to it
          }
          // If no redirect (normalizedFinalUrl == normalizedInputUrl), normalizedInputUrl
          // is already in seenUrls from line 46, so future attempts to fetch this exact
          // URL will be caught at line 36

          const feedContent = await response.text();
          const result = parseFeed(feedContent);
          const feed = result.feed;

          // Extract feed identifier for content-based deduplication
          // Only Atom feeds have a reliable unique 'id' field
          // RSS feeds don't have a unique identifier, so we only deduplicate by URL
          let feedId: string | null = null;
          if (result.format === "atom" && "id" in feed && feed.id) {
            feedId = String(feed.id);
          }

          // Check if we've already seen a feed with the same content identifier
          // (Only applies to Atom feeds with id field)
          if (feedId && seenFeedIds.has(feedId)) {
            return null;
          }

          // Mark feed ID as seen
          if (feedId) {
            seenFeedIds.add(feedId);
          }

          // Determine feed type
          const type: DiscoveredFeed["type"] =
            result.format === "atom"
              ? "atom"
              : result.format === "rdf"
                ? "rdf"
                : result.format === "json"
                  ? "json"
                  : "rss";

          const title =
            "title" in feed && feed.title
              ? String(feed.title)
              : "Untitled Feed";
          const description =
            "description" in feed && feed.description
              ? stripHtml(String(feed.description))
              : "subtitle" in feed && feed.subtitle
                ? stripHtml(String(feed.subtitle))
                : undefined;

          // Return discovered feed (preserve original URL for better UX)
          // We use the original feedUrl instead of finalUrl so users see clean URLs
          // The deduplication still works via normalizedFinalUrl tracking above
          return {
            url: feedUrl,
            title,
            type,
            description,
          };
        } catch {
          return null;
        }
      })();

      // Store the in-flight request
      inFlightRequests.set(normalizedInputUrl, validationPromise);

      try {
        // Wait for validation to complete
        return await validationPromise;
      } finally {
        // Clean up the in-flight request
        inFlightRequests.delete(normalizedInputUrl);
      }
    } catch {
      return null;
    }
  };
}
