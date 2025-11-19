/**
 * Theme System Type Definitions
 *
 * Defines the structure for theme configurations including colors, fonts, and other CSS variables.
 */

/**
 * Color palette mapping to CSS variable names
 */
export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  logoPrimary: string;
  logoSecondary: string;
}

/**
 * Font configuration
 */
export interface FontConfig {
  sans: string; // Primary sans-serif font family
  mono: string; // Monospace font family
}

/**
 * Border radius configuration
 */
export interface BorderRadiusConfig {
  value: string; // Base border radius value (e.g., "0.625rem")
  button?: string; // Optional button-specific radius (e.g., "9999px" for pill-shaped)
}

/**
 * Grain overlay configuration
 */
export interface GrainConfig {
  opacity: number; // Grain overlay opacity (0-1, e.g., 0.06)
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string; // Client-side metadata only, not stored in database
  colors: ColorPalette;
  fonts: FontConfig;
  radius: BorderRadiusConfig;
  grain: GrainConfig;
}

/**
 * Theme ID type - union of all available theme IDs
 */
export type ThemeId =
  | "light"
  | "dark"
  | "nord"
  | "material"
  | "minimal"
  | "hackernews"
  | "win95"
  | "system";

/**
 * Theme metadata for UI display (client-side only)
 */
export interface ThemeMetadata {
  id: ThemeId;
  name: string;
  description?: string;
  previewColors?: {
    primary: string;
    background: string;
    accent: string;
  };
}
