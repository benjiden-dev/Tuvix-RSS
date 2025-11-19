import { createRootRoute, Outlet, useRouter } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useMediaQuery } from "@/hooks/use-media-query";

const RootLayout = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="grain-overlay" />
      <OfflineIndicator />
      <Outlet />
      <Toaster position={isDesktop ? "bottom-right" : "top-center"} />
      <PWAInstallPrompt />
    </ThemeProvider>
  );
};

function RootErrorComponent({ error }: { error: Error }) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="grain-overlay" />
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              An unexpected error occurred while rendering this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
            {import.meta.env.DEV && error.stack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View stack trace
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-muted p-2 text-xs">
                  {error.stack}
                </pre>
              </details>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={() => router.invalidate()}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => router.navigate({ to: "/" })}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Toaster position={isDesktop ? "bottom-right" : "top-center"} />
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorComponent,
});
