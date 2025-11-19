import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TRPCProvider } from "./components/provider/trpc-provider";
import * as Sentry from "@sentry/react";

// Import styles
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import { registerPWA } from "./pwa-register";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
  // Enable view transitions by default for all navigation
  defaultViewTransition: true,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Initialize Sentry AFTER router is created (so we can include router integration)
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  const environment =
    import.meta.env.VITE_SENTRY_ENVIRONMENT ||
    import.meta.env.MODE ||
    "development";
  const release = import.meta.env.VITE_SENTRY_RELEASE;

  Sentry.init({
    dsn,
    environment,
    release,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.tanstackRouterBrowserTracingIntegration(router), // Router integration
      Sentry.replayIntegration({
        // Session replay configuration
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        // User feedback widget (optional)
        autoInject: false, // We'll control when to show it
      }),
    ],

    // Performance tracing
    tracesSampleRate: 0.1, // 10% sampling

    // Session replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Trace propagation for distributed tracing
    // This enables tracing from frontend → backend tRPC calls
    tracePropagationTargets: [
      /^https:\/\/api\.tuvix\.dev/,
      /^http:\/\/localhost:3001/,
      /^https:\/\/.*\.workers\.dev/,
    ],

    // Filter out noise
    beforeSend(event) {
      // Filter out health check and test routes
      if (
        event.request?.url?.includes("/health") ||
        event.request?.url?.includes("/debug-sentry")
      ) {
        return null;
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized for frontend");
}

// Register PWA service worker
registerPWA();

// Configure React 19 error hooks for Sentry (if Sentry is initialized)
if (dsn && typeof window !== "undefined") {
  // React 19 error handling hooks
  // onUncaughtError - for uncaught errors
  window.addEventListener("error", (event) => {
    Sentry.captureException(event.error || new Error(event.message), {
      contexts: {
        react: {
          componentStack: event.error?.stack,
        },
      },
    });
  });

  // onUnhandledRejection - for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason, {
      contexts: {
        react: {
          type: "unhandledrejection",
        },
      },
    });
  });
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TRPCProvider>
        <RouterProvider router={router} />
      </TRPCProvider>
    </StrictMode>,
  );
}
