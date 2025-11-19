import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { X, Download } from "lucide-react";

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed =
        (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show prompt after a short delay if installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    await promptInstall();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    dismissPrompt();
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 md:left-auto md:right-4">
      <div className="rounded-lg border border-border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-sm">Install TuvixRSS</h3>
            <p className="text-muted-foreground text-sm">
              Install our app for a better experience with offline support and
              faster access.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleInstall}
                className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md border border-border bg-background px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
