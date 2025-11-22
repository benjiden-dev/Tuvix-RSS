/**
 * Admin Route Offline Navigation Tests
 *
 * Tests for admin route protection behavior when offline
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authClientModule from "@/lib/auth-client";

// Mock dependencies
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");

  // Create a special redirect error class that can be identified
  class RedirectError extends Error {
    constructor(public to: string) {
      super(`redirect:${to}`);
      this.name = "RedirectError";
    }
  }

  return {
    ...actual,
    redirect: vi.fn((options) => {
      const error = new RedirectError(options.to);
      // Mark it as a redirect so the route can identify it
      (error as any).isRedirect = true;
      return error;
    }),
  };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
  },
}));

// Import the route module to test beforeLoad
const routeModule = await import("../../routes/app/admin/route");

describe("Admin Route - Offline Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("network error handling", () => {
    it("should redirect to /app when network error occurs", async () => {
      // Mock network error
      vi.mocked(authClientModule.authClient.getSession).mockRejectedValue(
        new Error("Failed to fetch"),
      );

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/app",
      );

      expect(authClientModule.authClient.getSession).toHaveBeenCalled();
    });

    it("should redirect to /app when offline (navigator.onLine = false)", async () => {
      // Mock offline state
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
        configurable: true,
      });

      vi.mocked(authClientModule.authClient.getSession).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/app",
      );

      // Reset navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
        configurable: true,
      });
    });
  });

  describe("authentication and authorization", () => {
    it("should redirect to / when no session exists", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockResolvedValue(null);

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/",
      );
    });

    it("should redirect to / when session has no user", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockResolvedValue({
        data: { user: null },
      } as any);

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/",
      );
    });

    it("should allow navigation when session has admin user", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockResolvedValue({
        data: {
          user: {
            id: "1",
            email: "admin@example.com",
            role: "admin",
          },
        },
      } as any);

      const result = await routeModule.Route.options.beforeLoad?.({});

      expect(result).toBeUndefined();
    });

    it("should redirect to /app when session has non-admin user", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockResolvedValue({
        data: {
          user: {
            id: "1",
            email: "user@example.com",
            role: "user",
          },
        },
      } as any);

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/app",
      );
    });

    it("should redirect to /app when user has no role", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockResolvedValue({
        data: {
          user: {
            id: "1",
            email: "user@example.com",
            // No role field
          },
        },
      } as any);

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/app",
      );
    });
  });

  describe("error handling", () => {
    it("should redirect to /app on network errors", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockRejectedValue(
        new Error("Failed to fetch"),
      );

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/app",
      );
    });

    it("should redirect to / on other errors", async () => {
      vi.mocked(authClientModule.authClient.getSession).mockRejectedValue(
        new Error("Unknown error"),
      );

      await expect(routeModule.Route.options.beforeLoad?.({})).rejects.toThrow(
        "redirect:/",
      );
    });
  });
});
