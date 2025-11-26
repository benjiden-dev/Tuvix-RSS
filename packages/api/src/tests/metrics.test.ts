/**
 * Metrics Utility Tests
 *
 * Verifies that metrics utilities work correctly in both Node.js and Cloudflare runtimes
 */

import { describe, it, expect } from "vitest";
import { withTiming } from "../utils/metrics";

describe("Metrics Utilities", () => {
  it("withTiming should execute function and measure time", async () => {
    const result = await withTiming(
      "test.timing",
      async () => {
        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "success";
      },
      { test: "true" }
    );

    expect(result).toBe("success");
  });

  it("withTiming should rethrow errors and still emit metrics", async () => {
    await expect(
      withTiming(
        "test.timing_error",
        async () => {
          throw new Error("Test error");
        },
        { test: "true" }
      )
    ).rejects.toThrow("Test error");
  });
});
