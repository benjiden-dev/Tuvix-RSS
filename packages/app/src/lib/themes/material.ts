/**
 * Material 3 Theme Configuration
 *
 * Material Design 3 color palette based on Material Theme Builder export.
 * Uses the dark scheme from the Material 3 specification.
 *
 * Color mapping follows Material 3 design tokens:
 * - Primary: Main brand color
 * - Secondary: Supporting color
 * - Tertiary: Accent color
 * - Surface: Container backgrounds
 * - Error: Destructive actions
 */

import type { ThemeConfig } from "./types";

// Material 3 Color Palette - Dark scheme colors converted to oklch
// Only colors that are actually used in the theme configuration are defined here.
// Material Design 3 has additional tokens (containers, outlines) that aren't mapped
// to our ColorPalette interface, so they're omitted.

// Primary colors
const primary = "oklch(75% 0.12 250)"; // #AAC7FF - Primary brand color
const onPrimary = "oklch(35% 0.05 250)"; // #0A305F - Text on primary

// Secondary colors
const secondary = "oklch(78% 0.04 260)"; // #BEC6DC - Secondary color (used in chart4)
const secondaryContainer = "oklch(45% 0.03 260)"; // #3E4759 - Secondary container
const onSecondaryContainer = "oklch(88% 0.04 260)"; // #DAE2F9 - Text on secondary container

// Tertiary colors
const tertiary = "oklch(80% 0.06 320)"; // #DDBCE0 - Tertiary/accent color
const onTertiary = "oklch(45% 0.05 320)"; // #3F2844 - Text on tertiary
const tertiaryContainer = "oklch(50% 0.05 320)"; // #573E5C - Tertiary container (used in chart5)

// Surface colors - Using Material 3 dark scheme
const background = "oklch(18% 0.015 260)"; // Slightly brighter than pure dark
const onBackground = "oklch(90% 0.015 260)"; // #E2E2E9 - Text on background
const onSurface = "oklch(90% 0.015 260)"; // Text on surface
const surfaceVariant = "oklch(45% 0.025 260)"; // #44474E - Variant surface
const onSurfaceVariant = "oklch(80% 0.02 260)"; // #C4C6D0 - Text on variant surface

// Container surfaces - More distinct elevation levels
// Cards need to be brighter than background for Material Design elevation
const surfaceContainer = "oklch(25% 0.018 260)"; // Brighter than background for card elevation
const surfaceContainerHigh = "oklch(30% 0.018 260)"; // #282A2F - High container
const surfaceContainerHighest = "oklch(38% 0.018 260)"; // #33353A - Highest container

// Error/destructive
const error = "oklch(75% 0.15 25)"; // #FFB4AB - Error color

export const materialTheme: ThemeConfig = {
  id: "material",
  name: "Material",
  description: "Material Design 3 color system",
  colors: {
    // Background uses Material surface
    background: background,
    // Foreground uses Material onBackground
    foreground: onBackground,
    // Card uses Material surfaceContainer
    card: surfaceContainer,
    cardForeground: onSurface,
    // Popover uses Material surfaceContainerHigh
    popover: surfaceContainerHigh,
    popoverForeground: onSurface,
    // Primary uses Material primary
    primary: primary,
    primaryForeground: onPrimary,
    // Secondary uses Material secondaryContainer
    secondary: secondaryContainer,
    secondaryForeground: onSecondaryContainer,
    // Muted uses Material surfaceVariant
    muted: surfaceVariant,
    mutedForeground: onSurfaceVariant,
    // Accent uses Material tertiary
    accent: tertiary,
    accentForeground: onTertiary,
    // Destructive uses Material error
    destructive: error,
    // Material Design uses flat design - borders are transparent/matched to background
    border: "transparent", // No visible borders for flat Material look
    input: surfaceVariant,
    // Ring uses Material primary
    ring: primary,
    // Chart colors - using Material tertiary, error, and primary variations
    chart1: error, // Red/error
    chart2: tertiary, // Purple/tertiary
    chart3: primary, // Blue/primary
    chart4: secondary, // Gray/secondary
    chart5: tertiaryContainer, // Purple variant
    // Sidebar uses Material surfaceContainerHighest
    sidebar: surfaceContainerHighest,
    sidebarForeground: onSurface,
    // Sidebar primary uses Material primary
    sidebarPrimary: primary,
    sidebarPrimaryForeground: onPrimary,
    // Sidebar accent uses Material surfaceContainerHigh
    sidebarAccent: surfaceContainerHigh,
    sidebarAccentForeground: onSurface,
    sidebarBorder: "transparent", // No visible borders for flat Material look
    sidebarRing: primary,
    // Logo colors - using Material primary and onBackground
    logoPrimary: primary,
    logoSecondary: onBackground,
  },
  fonts: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  radius: {
    value: "1rem", // Normal radius for cards and other components
    button: "9999px", // Pill-shaped buttons for Material Design
  },
  grain: {
    opacity: 0.06,
  },
};
