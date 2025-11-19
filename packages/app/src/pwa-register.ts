import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

// Register service worker with auto-update
export function registerPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show a toast notification to reload the page when new content is available
      toast.info("New version available!", {
        description: "Click to reload and get the latest version.",
        action: {
          label: "Reload",
          onClick: () => updateSW(true),
        },
        duration: 10000, // Show for 10 seconds
      });
    },
    onOfflineReady() {
      console.log("App is ready to work offline");
    },
    onRegisteredSW(swUrl, registration) {
      console.log("Service Worker registered:", swUrl);

      // Check for updates every hour
      if (registration) {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error("Service Worker registration error:", error);
    },
  });
}
