/**
 * Discovery Registry
 *
 * Manages discovery services and orchestrates feed discovery.
 * Services are executed in priority order (lower priority = higher priority).
 */

import { TRPCError } from "@trpc/server";
import { createFeedValidator } from "./feed-validator";
import type {
  DiscoveryContext,
  DiscoveryService,
  DiscoveredFeed,
} from "./types";

/**
 * Discovery Registry
 *
 * Manages discovery services and executes them in priority order.
 */
export class DiscoveryRegistry {
  private services: DiscoveryService[] = [];

  /**
   * Register a discovery service
   */
  register(service: DiscoveryService): void {
    this.services.push(service);
    // Sort by priority (lower = higher priority)
    this.services.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Discover feeds from a URL
   *
   * Executes discovery services in priority order:
   * 1. Services with lower priority run first
   * 2. If a service finds feeds, return immediately (stop early)
   * 3. If a service returns empty or errors, continue to next service
   * 4. If no services find feeds, throw NOT_FOUND error
   *
   * @param url - URL to discover feeds from
   * @returns Array of discovered feeds
   * @throws TRPCError with code NOT_FOUND if no feeds found
   */
  async discover(url: string): Promise<DiscoveredFeed[]> {
    // Create shared discovery context for deduplication
    const seenUrls = new Set<string>();
    const seenFeedIds = new Set<string>();

    // Create feed validator function
    const validateFeed = createFeedValidator(seenUrls, seenFeedIds);

    const context: DiscoveryContext = {
      seenUrls,
      seenFeedIds,
      validateFeed,
    };

    // Try each service in priority order
    for (const service of this.services) {
      if (!service.canHandle(url)) {
        continue;
      }

      try {
        const feeds = await service.discover(url, context);

        // If service found feeds, return immediately (stop early)
        if (feeds.length > 0) {
          return feeds;
        }
      } catch (error) {
        // Log error but continue to next service
        console.error(
          `Discovery service ${service.constructor.name} failed:`,
          error
        );
      }
    }

    // No services found feeds
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No RSS or Atom feeds found on this website",
    });
  }
}
