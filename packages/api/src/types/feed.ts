/**
 * Feed Type Definitions for TuvixRSS
 *
 * Re-exports feedsmith types for working with RSS, Atom, RDF, JSON Feed, and OPML.
 * Use the modern namespace types for full type safety and access to all feed components.
 */

export type { Rss, Atom, Rdf, Json, Opml } from "feedsmith/types";

/**
 * Feed discovered from a website URL during autodiscovery
 */
export interface DiscoveredFeed {
  url: string;
  title: string;
  description?: string;
  type: "rss" | "atom" | "rdf" | "json";
  /** Platform-specific high-quality icon URL (e.g., iTunes artwork, Reddit community icon) */
  iconUrl?: string;
}
