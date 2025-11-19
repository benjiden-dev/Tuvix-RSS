import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const offlineToastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (!isOnline) {
      // Show offline toast that stays until dismissed
      offlineToastId.current = toast.error("You're offline", {
        description: "Some features may be unavailable",
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity, // Keep visible until we dismiss it
      });
    } else {
      // User came back online
      if (offlineToastId.current !== null) {
        // Dismiss the offline toast
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;

        // Show success toast briefly
        toast.success("Back online!", {
          description: "Syncing your data...",
          icon: <Wifi className="h-4 w-4" />,
          duration: 3000,
        });
      }
    }
  }, [isOnline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (offlineToastId.current !== null) {
        toast.dismiss(offlineToastId.current);
      }
    };
  }, []);

  return null;
}
