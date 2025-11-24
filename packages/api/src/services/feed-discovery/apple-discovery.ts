/**
 * Apple Podcast Discovery Service
 *
 * Discovers RSS feeds from Apple Podcasts URLs by using the iTunes Search API
 * to look up podcast metadata and extract the RSS feed URL.
 */

import { isSubdomainOf } from "@/utils/domain-matcher";
import type {
  DiscoveryContext,
  DiscoveryService,
  DiscoveredFeed,
} from "./types";

/**
 * iTunes Search API response types
 */
interface iTunesSearchResponse {
  resultCount: number;
  results: iTunesPodcastResult[];
}

interface iTunesPodcastResult {
  wrapperType: string; // e.g., "track"
  kind: string; // e.g., "podcast"
  collectionId: number; // Podcast ID
  trackId: number;
  artistName: string; // Author/Podcaster name
  collectionName: string; // Podcast name
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  collectionViewUrl: string; // Apple Podcasts page URL
  feedUrl: string; // RSS feed URL (REQUIRED - may be on different domain like rss.art19.com)
  trackViewUrl: string;
  artworkUrl30: string; // 30x30 artwork
  artworkUrl60: string; // 60x60 artwork
  artworkUrl100: string; // 100x100 artwork
  artworkUrl600: string; // 600x600 artwork
  collectionPrice: number;
  trackPrice: number;
  collectionHdPrice: number;
  releaseDate: string; // ISO 8601 date string
  collectionExplicitness: string; // e.g., "explicit", "cleaned", "notExplicit"
  trackExplicitness: string;
  trackCount: number; // Number of episodes
  country: string; // ISO country code
  currency: string; // ISO currency code
  primaryGenreName: string; // e.g., "Podcasts"
  genreIds: string[];
  genres: string[];
  artistId?: number;
  artistViewUrl?: string;
  trackTimeMillis?: number;
  contentAdvisoryRating?: string;
  shortDescription?: string;
  longDescription?: string;
}

/**
 * Apple Podcast Discovery Service
 *
 * Handles discovery for Apple Podcasts URLs by:
 * 1. Extracting podcast ID from URL
 * 2. Using iTunes Search API to get RSS feed URL
 * 3. Validating the RSS feed
 */
export class AppleDiscoveryService implements DiscoveryService {
  readonly priority = 10; // Run before standard discovery

  /**
   * Check if URL is an Apple domain (apple.com or subdomain)
   */
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return hostname === "apple.com" || isSubdomainOf(hostname, "apple.com");
    } catch {
      return false;
    }
  }

  /**
   * Discover RSS feed from Apple Podcasts URL
   */
  async discover(
    url: string,
    context: DiscoveryContext
  ): Promise<DiscoveredFeed[]> {
    try {
      // Extract podcast ID from URL
      const podcastId = this.extractPodcastId(url);
      if (!podcastId) {
        // No podcast ID found, let standard discovery handle it
        return [];
      }

      // Call iTunes Search API
      const apiUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "TuvixRSS/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return [];
      }

      const data: iTunesSearchResponse = await response.json();

      // Check if we got results
      if (
        data.resultCount === 0 ||
        !data.results ||
        data.results.length === 0
      ) {
        return [];
      }

      const podcast = data.results[0];

      // Check if feedUrl exists
      if (!podcast.feedUrl) {
        return [];
      }

      // Validate the RSS feed using shared validator
      const discoveredFeed = await context.validateFeed(podcast.feedUrl);

      if (!discoveredFeed) {
        // Feed validation failed
        return [];
      }

      // Use podcast metadata from API if available (better than RSS metadata)
      return [
        {
          ...discoveredFeed,
          title: podcast.collectionName || discoveredFeed.title,
          description:
            podcast.longDescription ||
            podcast.shortDescription ||
            discoveredFeed.description,
        },
      ];
    } catch (error) {
      // Log error but don't fail discovery (fallback to standard discovery)
      console.error("Apple Podcast discovery error:", error);
      return [];
    }
  }

  /**
   * Extract podcast ID from Apple Podcasts URL
   *
   * Supports URLs like:
   * - https://podcasts.apple.com/us/podcast/name/id1234567890
   * - https://itunes.apple.com/us/podcast/name/id1234567890
   *
   * @param url - Apple Podcasts URL
   * @returns Podcast ID or null if not found
   */
  private extractPodcastId(url: string): string | null {
    // Match /id followed by digits, optionally followed by query string or end of string
    const match = url.match(/\/id(\d+)(?:\?|$)/);
    return match ? match[1] : null;
  }
}
