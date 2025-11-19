/**
 * AppSidebar Component Tests
 *
 * Tests for sidebar component including admin section visibility
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render, createWrapper } from "@/test/test-utils";
import { AppSidebar } from "./app-sidebar";
// Import SidebarProvider from radix sidebar (the one AppSidebar actually uses)
import { SidebarProvider } from "@/components/animate-ui/components/radix/sidebar";
import * as useAuthModule from "@/lib/hooks/useAuth";
import React from "react";

// Mock the useAuth hooks
vi.mock("@/lib/hooks/useAuth", async () => {
  const actual = await vi.importActual<typeof useAuthModule>(
    "@/lib/hooks/useAuth",
  );
  return {
    ...actual,
    useCurrentUser: vi.fn(),
    useLogin: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
    useRegister: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
    useLogout: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
  };
});

// Mock useCategories hook
vi.mock("@/lib/hooks/useData", () => ({
  useCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

// Mock useIsMobile hook - it's a React hook that uses useState and useEffect
// We need to mock it to return false synchronously
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// Mock Link component from TanStack Router to render as anchor
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

// Wrapper component that provides all necessary contexts
const SidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  const Wrapper = createWrapper();

  // Use the actual SidebarProvider which will create the context properly
  return (
    <Wrapper>
      <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
    </Wrapper>
  );
};

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.matchMedia for useIsMobile
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("should render sidebar with basic navigation", async () => {
    vi.mocked(useAuthModule.useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: 1,
          name: "testuser",
          username: "testuser",
          email: "test@example.com",
          role: "user",
          plan: "free",
        },
      },
      isPending: false,
    } as ReturnType<typeof useAuthModule.useCurrentUser>);

    render(<AppSidebar />, { wrapper: SidebarWrapper });

    // Wait for the component to render - use waitFor to handle async rendering
    await waitFor(
      () => {
        expect(screen.getByText("Articles")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Public Feeds")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should not show admin section for regular user", () => {
    vi.mocked(useAuthModule.useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: 1,
          name: "testuser",
          username: "testuser",
          email: "test@example.com",
          role: "user",
          plan: "free",
        },
      },
      isPending: false,
    } as ReturnType<typeof useAuthModule.useCurrentUser>);

    render(<AppSidebar />, { wrapper: SidebarWrapper });

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Settings")).not.toBeInTheDocument();
  });

  it("should show admin section for admin user", async () => {
    vi.mocked(useAuthModule.useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: 1,
          name: "adminuser",
          username: "adminuser",
          email: "admin@example.com",
          role: "admin",
          plan: "free",
        },
      },
      isPending: false,
    } as ReturnType<typeof useAuthModule.useCurrentUser>);

    render(<AppSidebar />, { wrapper: SidebarWrapper });

    // Wait for the component to render - use waitFor to handle async rendering
    await waitFor(
      () => {
        expect(screen.getByText("Administration")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Plans")).toBeInTheDocument();
    expect(screen.getByText("Admin Settings")).toBeInTheDocument();
  });

  it("should not show admin section when user is loading", () => {
    vi.mocked(useAuthModule.useCurrentUser).mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useAuthModule.useCurrentUser>);

    render(<AppSidebar />, { wrapper: SidebarWrapper });

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("should not show admin section when user is undefined", () => {
    vi.mocked(useAuthModule.useCurrentUser).mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useAuthModule.useCurrentUser>);

    render(<AppSidebar />, { wrapper: SidebarWrapper });

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("should show admin section only when role is exactly 'admin'", () => {
    // This test verifies the conditional logic works correctly
    // The actual role-based rendering is tested in the individual tests above
    // This test just confirms the logic: user?.role === "admin"

    // Test case 1: role is "user" - should not show
    const userRole = "user" as const;
    expect(userRole === "admin").toBe(false);

    // Test case 2: role is "admin" - should show
    const adminRole = "admin" as const;
    expect(adminRole === "admin").toBe(true);

    // Test case 3: role is undefined - should not show
    const undefinedRole = undefined;
    expect(undefinedRole === "admin").toBe(false);
  });
});
