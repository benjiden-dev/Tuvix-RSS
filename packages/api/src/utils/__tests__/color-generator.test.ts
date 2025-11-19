/**
 * Color Generator Tests
 */

import { describe, it, expect } from "vitest";
import { generateColorFromString } from "../color-generator";

describe("Color Generator", () => {
  describe("generateColorFromString", () => {
    it("should generate a valid hex color", () => {
      const color = generateColorFromString("Technology");

      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should be deterministic (same input = same output)", () => {
      const color1 = generateColorFromString("Technology");
      const color2 = generateColorFromString("Technology");

      expect(color1).toBe(color2);
    });

    it("should generate different colors for different inputs", () => {
      const color1 = generateColorFromString("Technology");
      const color2 = generateColorFromString("Sports");

      expect(color1).not.toBe(color2);
    });

    it("should handle empty string", () => {
      const color = generateColorFromString("");

      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should handle special characters", () => {
      const color = generateColorFromString("Tech & Science!");

      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should handle unicode characters", () => {
      const color = generateColorFromString("科技");

      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should handle very long strings", () => {
      const longString = "A".repeat(1000);
      const color = generateColorFromString(longString);

      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("should generate different colors for similar strings", () => {
      const color1 = generateColorFromString("Technology");
      const color2 = generateColorFromString("Technologyy");

      expect(color1).not.toBe(color2);
    });

    it("should be case sensitive", () => {
      const color1 = generateColorFromString("technology");
      const color2 = generateColorFromString("Technology");

      expect(color1).not.toBe(color2);
    });

    it("should generate pastel colors (not too dark or light)", () => {
      const colors = [
        generateColorFromString("Tech"),
        generateColorFromString("Sports"),
        generateColorFromString("News"),
        generateColorFromString("Music"),
        generateColorFromString("Gaming"),
      ];

      colors.forEach((color) => {
        // Parse hex color to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Pastel colors should not be too dark (all components < 50)
        // or too light (all components > 240)
        const avg = (r + g + b) / 3;
        expect(avg).toBeGreaterThan(50);
        expect(avg).toBeLessThan(240);
      });
    });

    it("should generate consistent distribution of hues", () => {
      // Generate colors for many different strings
      const colors = [];
      for (let i = 0; i < 100; i++) {
        colors.push(generateColorFromString(`Test${i}`));
      }

      // All colors should be unique (with high probability)
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBeGreaterThan(90); // At least 90% unique
    });
  });
});
