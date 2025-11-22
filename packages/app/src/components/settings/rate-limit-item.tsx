import { type ReactNode, useEffect, useState } from "react";
import { Progress } from "@/components/animate-ui/components/radix/progress";

interface RateLimitItemProps {
  label: string;
  used: number;
  limit: number;
  resetAt: Date;
  window: string; // "per minute", "per hour"
  icon: ReactNode;
}

export function RateLimitItem({
  label,
  used,
  limit,
  resetAt,
  window,
  icon,
}: RateLimitItemProps) {
  const percentUsed = (used / limit) * 100;
  const remaining = limit - used;

  // Calculate seconds until reset with real-time updates
  const [secondsUntilReset, setSecondsUntilReset] = useState(0);

  useEffect(() => {
    // Initialize immediately
    const updateSeconds = () => {
      const seconds = Math.max(
        0,
        Math.floor((resetAt.getTime() - Date.now()) / 1000),
      );
      setSecondsUntilReset(seconds);
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);

    return () => clearInterval(interval);
  }, [resetAt]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm">{label}</span>
          <span className="text-xs text-muted-foreground">({window})</span>
        </div>
        <span className="text-sm tabular-nums">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="space-y-1">
        <Progress value={percentUsed} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{remaining.toLocaleString()} remaining</span>
          <span>Resets in {formatTime(secondsUntilReset)}</span>
        </div>
      </div>
    </div>
  );
}
