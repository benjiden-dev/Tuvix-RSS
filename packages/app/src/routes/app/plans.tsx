import { createFileRoute } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Check, Rocket } from "lucide-react";
import { SettingsPageLayout } from "@/components/settings/settings-page-layout";

export const Route = createFileRoute("/app/plans")({
  component: PlansPage,
});

function PlansPage() {
  // Track that a user accessed the plans/upgrade page
  useEffect(() => {
    Sentry.captureMessage("User accessed upgrade plans page", {
      level: "info",
      tags: {
        feature: "plans",
        action: "upgrade_interest",
      },
      contexts: {
        page: {
          name: "Plans",
          path: "/app/plans",
        },
      },
    });
  }, []);

  return (
    <SettingsPageLayout
      title="Plans &amp; Pricing"
      description="Learn about TuvixRSS plans"
    >
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Paid Plans Coming Soon</AlertTitle>
        <AlertDescription>
          We're currently working on paid plan options. Your interest has been
          noted and we'll notify you when paid plans become available.
        </AlertDescription>
      </Alert>

      {/* Current Free Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Free Plan
                <Badge variant="secondary">Current</Badge>
              </CardTitle>
              <CardDescription>Perfect for personal use</CardDescription>
            </div>
            <div className="text-3xl font-bold">$0</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>100 RSS feed sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>2 public feeds</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>50 categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>60 API requests per minute</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Pro Plan */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Pro Plan
                <Badge variant="outline">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                For power users and professionals
              </CardDescription>
            </div>
            <div className="text-3xl font-bold">TBD</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>500 RSS feed sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>25 public feeds</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>100 categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>180 API requests per minute</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Priority support</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Enterprise Plan */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Enterprise Plan
                <Badge variant="outline">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>For teams and organizations</CardDescription>
            </div>
            <div className="text-3xl font-bold">TBD</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>10,000 RSS feed sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>200 public feeds</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Unlimited categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>600 API requests per minute</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Dedicated support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>SLA guarantee</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Need More? Card */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Need Higher Limits?
          </CardTitle>
          <CardDescription>
            If you need higher limits on the free plan before paid plans are
            available, please reach out to us. We're happy to discuss custom
            limits for active users.
          </CardDescription>
        </CardHeader>
      </Card>
    </SettingsPageLayout>
  );
}
