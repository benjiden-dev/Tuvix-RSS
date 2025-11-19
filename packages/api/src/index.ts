/**
 * API Package Entry Point
 *
 * Exports types and utilities for use by other packages in the monorepo.
 * This allows proper package imports instead of relative paths.
 */

// Export the AppRouter type for frontend type safety
export type { AppRouter } from "./trpc/router";

// Export createAuth type for Better Auth client type inference
export type { createAuth } from "./auth/better-auth";
