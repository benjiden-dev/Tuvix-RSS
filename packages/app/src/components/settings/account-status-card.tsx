import { AlertCircle, CheckCircle, Shield, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UserInfo {
  banned: boolean;
  createdAt: Date;
  role: "user" | "admin";
}

interface AccountStatusCardProps {
  user: UserInfo;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAccountAge(createdAt: Date) {
  const now = new Date();
  const diffInMs = now.getTime() - createdAt.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""}`;
}

export function AccountStatusCard({ user }: AccountStatusCardProps) {
  const accountAge = getAccountAge(user.createdAt);
  const appVersion = import.meta.env.VITE_APP_VERSION;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={user.banned ? "destructive" : "default"}>
            {user.banned ? (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Banned
              </>
            ) : (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
              </>
            )}
          </Badge>
        </div>

        {/* Suspension Alert */}
        {user.banned && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Banned</AlertTitle>
            <AlertDescription>
              Your account has been banned by an administrator. Please contact
              support for assistance.
            </AlertDescription>
          </Alert>
        )}

        {/* Account Age */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Member since</span>
          <span className="font-medium">
            {formatDate(user.createdAt)}
            <span className="text-muted-foreground ml-2">({accountAge})</span>
          </span>
        </div>

        {/* App Version */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">App Version</span>
          <span className="font-medium">{appVersion || ""}</span>
        </div>

        {/* Role Badge */}
        {user.role === "admin" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">
              <Shield className="mr-1 h-3 w-3" />
              Administrator
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
