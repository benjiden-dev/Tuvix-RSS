/**
 * Date Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDistanceToNow, getRelativeTime } from "../date";

describe("Date Utilities", () => {
  describe("getRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 'Unknown' for null input", () => {
      expect(getRelativeTime(null)).toBe("Unknown");
    });

    it("should return 'Unknown' for undefined input", () => {
      expect(getRelativeTime(undefined)).toBe("Unknown");
    });

    it("should return 'Just now' for times less than a minute ago", () => {
      const date = new Date("2024-01-15T11:59:30Z");
      expect(getRelativeTime(date)).toBe("Just now");
    });

    it("should return singular minute for 1 minute ago", () => {
      const date = new Date("2024-01-15T11:59:00Z");
      expect(getRelativeTime(date)).toBe("1 minute ago");
    });

    it("should return plural minutes for multiple minutes ago", () => {
      const date = new Date("2024-01-15T11:45:00Z");
      expect(getRelativeTime(date)).toBe("15 minutes ago");
    });

    it("should return singular hour for 1 hour ago", () => {
      const date = new Date("2024-01-15T11:00:00Z");
      expect(getRelativeTime(date)).toBe("1 hour ago");
    });

    it("should return plural hours for multiple hours ago", () => {
      const date = new Date("2024-01-15T06:00:00Z");
      expect(getRelativeTime(date)).toBe("6 hours ago");
    });

    it("should return singular day for 1 day ago", () => {
      const date = new Date("2024-01-14T12:00:00Z");
      expect(getRelativeTime(date)).toBe("1 day ago");
    });

    it("should return plural days for multiple days ago", () => {
      const date = new Date("2024-01-12T12:00:00Z");
      expect(getRelativeTime(date)).toBe("3 days ago");
    });

    it("should return formatted date for times more than a week ago", () => {
      const date = new Date("2024-01-01T12:00:00Z");
      const result = getRelativeTime(date);
      // toLocaleDateString returns locale-specific format
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
    });

    it("should handle string date input", () => {
      const result = getRelativeTime("2024-01-15T11:45:00Z");
      expect(result).toBe("15 minutes ago");
    });
  });

  describe("formatDistanceToNow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should format very recent time without suffix", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: false });
      expect(typeof result).toBe("string");
    });

    it("should format with suffix when addSuffix is true", () => {
      const date = new Date("2024-01-15T11:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: true });
      expect(result).toContain("ago");
    });

    it("should format future dates", () => {
      const date = new Date("2024-01-16T12:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: true });
      // Intl.RelativeTimeFormat returns "tomorrow" for +1 day
      expect(result).toMatch(/in|tomorrow/);
    });

    it("should handle dates years in the past", () => {
      const date = new Date("2023-01-15T12:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: true });
      expect(result).toContain("year");
    });

    it("should handle dates months in the past", () => {
      const date = new Date("2023-11-15T12:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: true });
      expect(result).toContain("month");
    });

    it("should handle dates weeks in the past", () => {
      const date = new Date("2024-01-01T12:00:00Z");
      const result = formatDistanceToNow(date, { addSuffix: true });
      expect(result).toContain("week");
    });
  });
});
