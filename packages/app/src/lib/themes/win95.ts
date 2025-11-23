/**
 * Windows 95 Theme Configuration
 *
 * Classic Windows 95 theme with authentic 3D beveled UI effects, colors, and fonts.
 * Recreates the nostalgic Windows 95 aesthetic with desktop blue background, gray cards,
 * blue accents, and square corners.
 *
 * Color mapping:
 * - Background: Windows desktop blue (#018080)
 * - Cards: Classic Win95 gray (#c0c0c0)
 * - Primary: Win95 blue (#000080)
 * - Borders: Dark gray (#808080) and light gray (#dfdfdf) for 3D effects
 */

import type { ThemeConfig } from "./types";

// Windows 95 Color Palette - Official hex values converted to OKLCH
const win95DesktopBlue = "#018080"; // #018080 - Windows 95 desktop blue/teal
// Background gray: #c0c0c0 (for cards)
const win95Gray = "oklch(0.75 0 0)"; // #c0c0c0 - Classic Win95 gray for cards
// Dark gray: #808080
const win95DarkGray = "oklch(0.5 0 0)"; // #808080 - Borders, shadows
// Light gray: #dfdfdf
const win95LightGray = "oklch(0.87 0 0)"; // #dfdfdf - Highlights
// Win95 blue: #000080
const win95Blue = "oklch(0.25 0.15 250)"; // #000080 - Classic Win95 blue
// White: #ffffff
const win95White = "oklch(1 0 0)"; // #ffffff - White
// Black: #000000
const win95Black = "oklch(0 0 0)"; // #000000 - Black
// Slightly lighter gray for cards (raised effect)
const win95CardGray = "oklch(0.78 0 0)"; // Slightly lighter than gray for raised windows
// Medium gray for secondary elements
const win95MediumGray = "oklch(0.65 0 0)"; // Medium gray

export const win95Theme: ThemeConfig = {
  id: "win95",
  name: "Windows 95",
  description: "Classic Windows 95 with 3D beveled UI",
  colors: {
    // Background uses Windows desktop blue
    background: win95DesktopBlue,
    // Foreground uses white for contrast on blue background
    foreground: win95White,
    // Card uses slightly lighter gray for raised window effect
    card: win95CardGray,
    cardForeground: win95Black,
    // Popover matches card
    popover: win95CardGray,
    popoverForeground: win95Black,
    // Primary uses Win95 blue
    primary: win95Blue,
    primaryForeground: win95White,
    // Secondary uses medium gray
    secondary: win95MediumGray,
    secondaryForeground: win95Black,
    // Muted uses light gray
    muted: win95LightGray,
    mutedForeground: win95DarkGray,
    // Accent uses Win95 blue
    accent: win95Blue,
    accentForeground: win95White,
    // Destructive uses dark red
    destructive: "oklch(0.45 0.20 25)", // Dark red
    // Border uses dark gray for 3D effects
    border: win95DarkGray,
    // Input uses gray (inset effect via CSS)
    input: win95Gray,
    // Ring uses Win95 blue
    ring: win95Blue,
    // Chart colors - using Win95 palette variations
    chart1: win95Blue, // Blue
    chart2: "oklch(0.50 0.15 200)", // Medium blue
    chart3: "oklch(0.45 0.20 25)", // Red
    chart4: "oklch(0.55 0.15 150)", // Green
    chart5: "oklch(0.60 0.15 280)", // Purple
    // Sidebar uses gray (not blue)
    sidebar: win95Gray,
    sidebarForeground: win95Black,
    // Sidebar primary uses Win95 blue
    sidebarPrimary: win95Blue,
    sidebarPrimaryForeground: win95White,
    // Sidebar accent uses medium gray
    sidebarAccent: win95MediumGray,
    sidebarAccentForeground: win95Black,
    sidebarBorder: win95DarkGray,
    sidebarRing: win95Blue,
    // Logo colors - dark gray (not pure black) and medium gray
    logoPrimary: "oklch(30% 0 0)", // Dark gray, not pure black
    logoSecondary: "oklch(0.7 0 0)", // Medium-light gray for contrast
  },
  fonts: {
    sans: '"MS Sans Serif", "MS Sans Serif", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Courier New", Courier, "Lucida Console", monospace',
  },
  radius: {
    value: "0", // Square corners for authentic Win95 look
  },
  grain: {
    opacity: 0, // No grain overlay for clean Win95 aesthetic
  },
};
