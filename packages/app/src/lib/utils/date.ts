/**
 * Format a date as relative time (e.g., "2 hours ago", "in 5 minutes")
 * Uses the built-in Intl.RelativeTimeFormat API instead of date-fns
 */
export function formatDistanceToNow(
  date: Date,
  options?: { addSuffix?: boolean },
): string {
  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "long",
  });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  const intervals: Array<{
    unit: Intl.RelativeTimeFormatUnit;
    seconds: number;
  }> = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of intervals) {
    const interval = Math.floor(Math.abs(diffInSeconds) / seconds);
    if (interval >= 1) {
      const value = diffInSeconds < 0 ? -interval : interval;
      const formatted = rtf.format(value, unit);
      // Intl.RelativeTimeFormat always includes "ago" or "in", so we handle addSuffix accordingly
      if (options?.addSuffix) {
        return formatted;
      }
      // Remove the suffix when addSuffix is false
      return formatted.replace(/^(in |ago )/, "").trim();
    }
  }

  // For very recent times (< 1 second)
  const formatted = rtf.format(0, "second");
  return options?.addSuffix
    ? formatted
    : formatted.replace(/^(in |ago )/, "").trim();
}
