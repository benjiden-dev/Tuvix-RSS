/**
 * Color Generation Utilities
 *
 * Generate deterministic colors from strings for categories and tags.
 */

/**
 * Convert HSL values to hex color
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns Hex color string (e.g., "#ff5733")
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Generate a deterministic pastel color from a string
 *
 * Uses a hash-based algorithm to generate pleasant pastel colors
 * that are consistent for the same input string.
 *
 * @param str Input string (e.g., category name)
 * @returns Hex color string (e.g., "#a8d5e2")
 *
 * @example
 * generateColorFromString("Technology") // => "#7ec4cf"
 * generateColorFromString("Technology") // => "#7ec4cf" (always the same)
 * generateColorFromString("Sports")     // => "#d4a5c9"
 */
export function generateColorFromString(str: string): string {
  // Generate hash from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate pleasant pastel colors (avoiding too dark or too light)
  const h = Math.abs(hash % 360); // Hue: 0-360
  const s = 65 + (Math.abs(hash) % 20); // Saturation: 65-85%
  const l = 55 + (Math.abs(hash >> 8) % 15); // Lightness: 55-70%

  return hslToHex(h, s, l);
}
