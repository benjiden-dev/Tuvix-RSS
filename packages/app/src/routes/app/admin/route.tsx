import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: async () => {
    // Check if user is admin using Better Auth session
    try {
      const session = await authClient.getSession();

      // Check if session exists and user is authenticated
      // Better Auth's getSession() returns {data: {user, session}, error: null}
      if (!session?.data?.user) {
        throw redirect({ to: "/" });
      }

      // Check if user has admin role
      // Better Auth admin plugin includes role in session.data.user
      const userRole = (session.data.user as { role?: string }).role;
      if (userRole !== "admin") {
        throw redirect({ to: "/app" });
      }
    } catch (error: unknown) {
      // Re-throw redirect errors (from our own code above)
      if (error && typeof error === "object" && "isRedirect" in error) {
        throw error;
      }

      // Better Auth getSession() errors are typically network errors
      // If offline or network error, redirect to /app (can't verify admin status offline)
      if (
        !navigator.onLine ||
        (error instanceof Error &&
          (error.message.toLowerCase().includes("failed to fetch") ||
            error.message.toLowerCase().includes("networkerror") ||
            error.message.toLowerCase().includes("network")))
      ) {
        throw redirect({ to: "/app" });
      }

      // For other errors (like auth errors), redirect to login
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
