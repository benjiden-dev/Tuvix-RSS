/**
 * Minimal Theme Configuration
 *
 * Minimal, flat, print-friendly theme with high contrast and clean design.
 * Optimized for readability and printing with grayscale colors and no borders.
 */

import type { ThemeConfig } from "./types";

export const minimalTheme: ThemeConfig = {
  id: "minimal",
  name: "Minimal",
  description: "Minimal, flat, print-friendly theme",
  colors: {
    // High contrast black and white for print-friendly design
    background: "oklch(1 0 0)", // Pure white
    foreground: "oklch(0.1 0 0)", // Near black for high contrast
    // Cards match background for flat design
    card: "oklch(1 0 0)", // White
    cardForeground: "oklch(0.1 0 0)", // Near black
    // Popovers match background
    popover: "oklch(1 0 0)", // White
    popoverForeground: "oklch(0.1 0 0)", // Near black
    // Primary is black for minimal design
    primary: "oklch(0.1 0 0)", // Near black
    primaryForeground: "oklch(1 0 0)", // White
    // Secondary is light gray
    secondary: "oklch(0.95 0 0)", // Very light gray
    secondaryForeground: "oklch(0.1 0 0)", // Near black
    // Muted is light gray
    muted: "oklch(0.96 0 0)", // Light gray
    mutedForeground: "oklch(0.4 0 0)", // Medium gray
    // Accent is slightly darker gray
    accent: "oklch(0.92 0 0)", // Light gray
    accentForeground: "oklch(0.1 0 0)", // Near black
    // Destructive is dark red (minimal but still recognizable)
    destructive: "oklch(0.45 0.15 25)", // Dark red
    // No borders for flat design
    border: "transparent", // No visible borders
    // Input matches muted
    input: "oklch(0.96 0 0)", // Light gray
    // Ring is subtle gray
    ring: "oklch(0.5 0 0)", // Medium gray
    // Chart colors - grayscale with slight variations for print-friendly
    chart1: "oklch(0.3 0 0)", // Dark gray
    chart2: "oklch(0.5 0 0)", // Medium gray
    chart3: "oklch(0.7 0 0)", // Light gray
    chart4: "oklch(0.4 0 0)", // Medium-dark gray
    chart5: "oklch(0.6 0 0)", // Medium-light gray
    // Sidebar matches background
    sidebar: "oklch(1 0 0)", // White
    sidebarForeground: "oklch(0.1 0 0)", // Near black
    // Sidebar primary is black
    sidebarPrimary: "oklch(0.1 0 0)", // Near black
    sidebarPrimaryForeground: "oklch(1 0 0)", // White
    // Sidebar accent is light gray
    sidebarAccent: "oklch(0.95 0 0)", // Very light gray
    sidebarAccentForeground: "oklch(0.1 0 0)", // Near black
    sidebarBorder: "transparent", // No borders
    sidebarRing: "oklch(0.5 0 0)", // Medium gray
    // Logo colors - black and white
    logoPrimary: "oklch(0.1 0 0)", // Near black
    logoSecondary: "oklch(0.5 0 0)", // Medium gray
  },
  fonts: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  radius: {
    value: "0", // No border radius for flat design
  },
  grain: {
    opacity: 0, // No grain overlay for clean, print-friendly look
  },
};
