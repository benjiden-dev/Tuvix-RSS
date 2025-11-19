import { useEffect, useState } from "react";

/**
 * Hook to detect media query matches
 * @param query - The media query to match (e.g., "(min-width: 768px)")
 * @returns true if the media query matches, false otherwise
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);

    // Sync state on mount
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
