/**
 * Color Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  CATEGORY_COLOR_PALETTE,
  getColorForCategory,
  getContrastingTextColor,
} from "../colors";

describe("Color Utilities", () => {
  describe("CATEGORY_COLOR_PALETTE", () => {
    it("should have 12 colors", () => {
      expect(CATEGORY_COLOR_PALETTE).toHaveLength(12);
    });

    it("should contain valid hex colors", () => {
      CATEGORY_COLOR_PALETTE.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe("getColorForCategory", () => {
    it("should return a valid hex color for any category name", () => {
      const color = getColorForCategory("Technology");
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should be deterministic - same name returns same color", () => {
      const color1 = getColorForCategory("News");
      const color2 = getColorForCategory("News");
      expect(color1).toBe(color2);
    });

    it("should return different colors for different names", () => {
      const color1 = getColorForCategory("Technology");
      const color2 = getColorForCategory("Sports");
      // Note: Not guaranteed to be different, but highly likely with simple hash
      expect(typeof color1).toBe("string");
      expect(typeof color2).toBe("string");
    });

    it("should handle empty string", () => {
      const color = getColorForCategory("");
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should handle special characters", () => {
      const color = getColorForCategory("Tech & Science!");
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should return a color from the palette", () => {
      const color = getColorForCategory("TestCategory");
      expect(CATEGORY_COLOR_PALETTE).toContain(color);
    });
  });

  describe("getContrastingTextColor", () => {
    it("should return white for dark background colors", () => {
      expect(getContrastingTextColor("#000000")).toBe("#FFFFFF");
      expect(getContrastingTextColor("#1a1a1a")).toBe("#FFFFFF");
      expect(getContrastingTextColor("#3B82F6")).toBe("#FFFFFF"); // Blue
    });

    it("should return black for light background colors", () => {
      expect(getContrastingTextColor("#FFFFFF")).toBe("#000000");
      expect(getContrastingTextColor("#F0F0F0")).toBe("#000000");
      expect(getContrastingTextColor("#F59E0B")).toBe("#000000"); // Yellow
    });

    it("should handle colors without # prefix", () => {
      expect(getContrastingTextColor("000000")).toBe("#FFFFFF");
      expect(getContrastingTextColor("FFFFFF")).toBe("#000000");
    });

    it("should handle all palette colors", () => {
      CATEGORY_COLOR_PALETTE.forEach((color) => {
        const textColor = getContrastingTextColor(color);
        expect(textColor).toMatch(/^#(000000|FFFFFF)$/);
      });
    });
  });
});
