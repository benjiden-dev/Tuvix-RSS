/**
 * Sentry Configuration
 *
 * Runtime-aware Sentry initialization for both Node.js and Cloudflare Workers.
 * Each adapter should call the appropriate init function based on runtime.
 */

import type { Env } from "@/types";

/**
 * Common Sentry configuration options
 */
export function getSentryConfig(env: Env) {
  const dsn = env.SENTRY_DSN as string | undefined;
  if (!dsn) {
    return null; // Sentry is optional
  }

  const environment = (env.SENTRY_ENVIRONMENT ||
    env.NODE_ENV ||
    "development") as string;
  const release = env.SENTRY_RELEASE as string | undefined;

  return {
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1, // 10% sampling for performance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeSend(event: any) {
      // Filter out health check noise
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const url = event.request?.url;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (url?.includes("/health") || url?.includes("/debug-sentry")) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return event;
    },
  };
}

/**
 * Initialize Sentry for Node.js/Express
 * Call this from Express adapter
 */
export function initSentryNode(env: Env): void {
  const config = getSentryConfig(env);
  if (!config) {
    console.log("⚠️  SENTRY_DSN not provided, skipping Sentry initialization");
    return;
  }

  // Dynamic import to avoid loading Cloudflare SDK in Node.js
  import("@sentry/node")
    .then((Sentry) => {
      // TypeScript doesn't fully resolve dynamic import types, so we need to assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      (Sentry as any).init(config);
      console.log("✅ Sentry initialized for Node.js");
    })
    .catch((error) => {
      console.error("Failed to initialize Sentry for Node.js:", error);
    });
}

/**
 * Initialize Sentry for Cloudflare Workers
 * Call this from Cloudflare adapter
 */
export function initSentryCloudflare(env: Env): void {
  const config = getSentryConfig(env);
  if (!config) {
    console.log("⚠️  SENTRY_DSN not provided, skipping Sentry initialization");
    return;
  }

  // Dynamic import to avoid loading Node SDK in Cloudflare
  import("@sentry/cloudflare")
    .then((Sentry) => {
      // TypeScript doesn't fully resolve dynamic import types, so we need to assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      (Sentry as any).init(config);
      console.log("✅ Sentry initialized for Cloudflare Workers");
    })
    .catch((error) => {
      console.error(
        "Failed to initialize Sentry for Cloudflare Workers:",
        error,
      );
    });
}
