import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SettingsPageLayoutProps {
  title: string;
  description: string;
  lastUpdated?: Date;
  isLoading?: boolean;
  children: ReactNode;
}

export function SettingsPageLayout({
  title,
  description,
  lastUpdated,
  isLoading,
  children,
}: SettingsPageLayoutProps) {
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 w-full max-w-full min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      <div className="space-y-4">{children}</div>
    </div>
  );
}
