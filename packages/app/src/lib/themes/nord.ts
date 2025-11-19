/**
 * Nord Theme Configuration
 *
 * Arctic, north-bluish color palette based on the official Nord theme.
 * https://www.nordtheme.com/docs/colors-and-palettes
 *
 * Color mapping:
 * - Polar Night (nord0-nord3): Dark backgrounds
 * - Snow Storm (nord4-nord6): Light backgrounds
 * - Frost (nord7-nord10): Blue accents
 * - Aurora (nord11-nord15): Accent colors
 */

import type { ThemeConfig } from "./types";

// Nord Color Palette - Official hex values converted to oklch
// Polar Night - Dark backgrounds
const nord0 = "oklch(32.44% 0.023 264)"; // #2e3440 - Background
const nord1 = "oklch(37.92% 0.03 266.5)"; // #3b4252 - Elevated UI elements
const nord2 = "oklch(42.35% 0.033 268)"; // #434c5e - Active line, selection
const nord3 = "oklch(48.25% 0.04 268)"; // #4c566a - Comments, guides

// Snow Storm - Light backgrounds
const nord4 = "oklch(87.5% 0.015 262)"; // #d8dee9 - UI elements, variables
const nord6 = "oklch(93.3% 0.01 262)"; // #eceff4 - Foreground text
// Note: nord5 (#e5e9f0) available for future use - subtle UI text

// Frost - Blue accents
const nord8 = "oklch(75% 0.09 205)"; // #88c0d0 - Primary accent, functions
const nord9 = "oklch(60% 0.12 240)"; // #81a1c1 - Secondary UI, keywords
// Note: nord7 (#8fbcbb) and nord10 (#5e81ac) available for future use

// Aurora - Accent colors
const nord11 = "oklch(60% 0.20 25)"; // #bf616a - Errors, destructive
const nord12 = "oklch(65% 0.18 45)"; // #d08770 - Orange accent
const nord13 = "oklch(80% 0.15 85)"; // #ebcb8b - Warnings, yellow
const nord14 = "oklch(70% 0.15 150)"; // #a3be8c - Success, green
const nord15 = "oklch(65% 0.12 320)"; // #b48ead - Purple accent

export const nordTheme: ThemeConfig = {
  id: "nord",
  name: "Nord",
  description: "Arctic, north-bluish color palette",
  colors: {
    // Background uses nord0 (darkest polar night)
    background: nord0,
    // Foreground uses nord6 (brightest snow storm)
    foreground: nord6,
    // Card uses nord1 (lighter polar night)
    card: nord1,
    cardForeground: nord6,
    // Popover uses nord2
    popover: nord2,
    popoverForeground: nord6,
    // Primary uses nord8 (frost blue - primary accent)
    primary: nord8,
    primaryForeground: nord6,
    // Secondary uses nord3
    secondary: nord3,
    secondaryForeground: nord6,
    // Muted uses nord2
    muted: nord2,
    mutedForeground: nord4,
    // Accent uses nord9 (frost blue - secondary)
    accent: nord9,
    accentForeground: nord6,
    // Destructive uses nord11 (aurora red)
    destructive: nord11,
    border: nord3,
    input: nord3,
    // Ring uses nord8 (primary accent)
    ring: nord8,
    // Chart colors use aurora palette
    chart1: nord11, // Red
    chart2: nord12, // Orange
    chart3: nord13, // Yellow
    chart4: nord14, // Green
    chart5: nord15, // Purple
    // Sidebar uses nord1
    sidebar: nord1,
    sidebarForeground: nord6,
    // Sidebar primary uses nord8
    sidebarPrimary: nord8,
    sidebarPrimaryForeground: nord6,
    // Sidebar accent uses nord2
    sidebarAccent: nord2,
    sidebarAccentForeground: nord6,
    sidebarBorder: nord3,
    sidebarRing: nord8,
    // Logo colors - using nord8 and nord6
    logoPrimary: nord3,
    logoSecondary: nord6,
  },
  fonts: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  radius: {
    value: "0.625rem",
  },
  grain: {
    opacity: 0.06,
  },
};
