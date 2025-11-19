/**
 * Hacker News Theme Configuration
 *
 * Inspired by the classic Hacker News design with orange accents and light beige background.
 * Simple, utilitarian design optimized for readability.
 */

import type { ThemeConfig } from "./types";

// Hacker News color palette
const hnOrange = "oklch(0.6958 0.204259 43.491)"; // #ff6600
const hnBackground = "oklch(0.9712 0.0092 106.57)";
const hnText = "oklch(20% 0.01 85)";
const hnMuted = "oklch(60% 0.01 85)";
const hnMutedBg = "oklch(90% 0.01 85)";
const hnBorder = "oklch(85% 0.01 85)";
const hnWhite = "oklch(98% 0 0)";

export const hackernewsTheme: ThemeConfig = {
  id: "hackernews",
  name: "Hacker News",
  description: "Classic Hacker News orange and beige",
  colors: {
    // Background uses HN's classic beige
    background: hnBackground,
    foreground: hnText,
    // Cards match background for simple look
    card: hnBackground,
    cardForeground: hnText,
    // Popovers match background
    popover: hnBackground,
    popoverForeground: hnText,
    primary: hnOrange,
    primaryForeground: hnWhite,
    secondary: "oklch(94% 0.01 85)",
    secondaryForeground: hnText,
    muted: hnMutedBg,
    mutedForeground: hnMuted,
    accent: hnOrange,
    accentForeground: hnWhite,
    destructive: "oklch(50% 0.20 25)",
    border: hnBorder,
    input: hnMutedBg,
    ring: hnOrange,
    chart1: hnOrange,
    chart2: "oklch(60% 0.15 200)",
    chart3: "oklch(55% 0.18 120)",
    chart4: "oklch(50% 0.20 25)",
    chart5: "oklch(65% 0.15 280)",
    sidebar: hnBackground,
    sidebarForeground: hnText,
    sidebarPrimary: hnOrange,
    sidebarPrimaryForeground: hnWhite,
    sidebarAccent: hnOrange,
    sidebarAccentForeground: hnWhite,
    sidebarBorder: hnBorder,
    sidebarRing: hnOrange,
    logoPrimary: hnText,
    logoSecondary: hnBackground,
  },
  fonts: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  radius: {
    value: "0.25rem", // Small radius for subtle rounded corners
  },
  grain: {
    opacity: 0.02, // Very subtle grain for texture
  },
};
