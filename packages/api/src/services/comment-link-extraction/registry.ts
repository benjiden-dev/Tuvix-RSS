/**
 * Comment Link Extraction Registry
 *
 * Manages comment link extractors and orchestrates extraction.
 * Extractors are executed in priority order (lower priority = higher priority).
 */

import type { CommentLinkExtractor, FeedItem } from "./types";

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
