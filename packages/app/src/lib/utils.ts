import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the public base URL for generating absolute URLs (public feeds, etc.)
 *
 * Priority:
 * 1. VITE_PUBLIC_URL environment variable (if set at build time)
 * 2. window.location.origin (fallback for development)
 *
 * This ensures consistency with server-side BASE_URL configuration
 * and allows override for custom domains, CDNs, or different environments.
 *
 * @returns Base URL string (e.g., "https://app.example.com")
 */
export function getPublicBaseUrl(): string {
  // Use VITE_PUBLIC_URL if set (build-time environment variable)
  if (import.meta.env.VITE_PUBLIC_URL) {
    return import.meta.env.VITE_PUBLIC_URL;
  }

  // Fallback to window.location.origin (works in browser, not SSR)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // SSR fallback (shouldn't happen in this SPA, but good to have)
  return "http://localhost:5173";
}
