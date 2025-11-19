# User Settings Page Enhancement Plan

## Executive Summary

The current user settings page (`packages/app/src/routes/app/settings.tsx`) is missing critical information about the user's subscription plan, account status, and usage statistics. This enhancement plan outlines adding:

1. **Subscription & Plan Information** - Display current plan, status, and plan features
2. **Enhanced Usage Dashboard** - Visual progress indicators with percentage display and contextual warnings
3. **Account Status Section** - Show account health, suspension status, and important dates
4. **Rate Limit Status** - Real-time view of API and feed access rate limit usage

---

## Current State Analysis

### What's Currently Shown

**packages/app/src/routes/app/settings.tsx** (lines 1-500)

1. **Profile Section**
   - Username (read-only)
   - Email (read-only)
   - Member since date

2. **Usage & Limits Section**
   - Public Feeds count (e.g., "2 / 3")
   - Categories count (e.g., "5 / 10")
   - Sources count (e.g., "32 / 50")
   - Last updated timestamp
   - Progress bars for each quota

3. **Appearance**
   - Theme selector (system/light/dark)

4. **Reading Preferences**
   - Auto-age threshold (0-90 days)
   - Default filter (all/unread/read/saved)

5. **Share Options**
   - Social media toggles

6. **Danger Zone**
   - Log out button

### What's Missing (Critical Gaps)

1. **Plan Information**
   - Current plan name and tier (Free/Pro/Enterprise)
   - Plan features list
   - Plan pricing (if applicable)
   - Upgrade/downgrade options

2. **Account Status**
   - Account status (active/suspended/inactive)
   - Reason for suspension (if applicable)
   - Custom limits status (if admin has overridden defaults)

3. **Rate Limit Status**
   - API rate limit usage (requests per minute)
   - Public feed rate limit usage (accesses per minute)
   - Reset times for rate limits

4. **Usage Statistics**
   - Percentage of quota used (currently only shows count)
   - Warning indicators when approaching limits (e.g., >80%)
   - Historical usage trends (optional for v2)

5. **Billing Information** (future)
   - Next billing date
   - Current billing period
   - Payment method
   - Invoice history

---

## Enhancement Design

### Phase 1: Core Information Display (Immediate)

Add the missing critical information without requiring backend changes.

#### 1.1 Subscription & Plan Section (NEW)

**Location**: Top of settings page (before Profile section)

**API Endpoint**: Enhanced `userSettings.get()` response

**Data Structure**:
```typescript
interface UserSettingsResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: 'user' | 'admin';
    plan: string;  // 'free', 'pro', 'enterprise', 'custom'
    suspended: boolean;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    priceCents: number;
    features: string[] | null;
  };
  customLimits: {
    maxSources?: number;
    maxPublicFeeds?: number;
    maxCategories?: number;
    apiRateLimitPerMinute?: number;
    publicFeedRateLimitPerHour?: number;
    notes?: string;
  } | null;
  // ... existing settings, usage, limits
}
```

**UI Components**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Subscription & Plan</CardTitle>
    <CardDescription>Your current plan and features</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Plan Badge */}
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">
          {plan.priceCents > 0
            ? `$${(plan.priceCents / 100).toFixed(2)}/month`
            : 'Free forever'}
        </p>
      </div>
      <Badge variant={getPlanBadgeVariant(plan.id)}>
        {plan.name}
      </Badge>
    </div>

    {/* Custom Limits Alert (if applicable) */}
    {customLimits && (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Custom Limits Applied</AlertTitle>
        <AlertDescription>
          An administrator has set custom limits for your account.
          {customLimits.notes && ` Note: ${customLimits.notes}`}
        </AlertDescription>
      </Alert>
    )}

    {/* Plan Features */}
    {plan.features && plan.features.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2">Plan Features</h4>
        <ul className="space-y-1 text-sm">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Upgrade CTA (if on free plan) */}
    {plan.id === 'free' && (
      <Button className="w-full" asChild>
        <Link to="/app/plans">
          <Zap className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Link>
      </Button>
    )}
  </CardContent>
</Card>
```

**Badge Variants**:
- `free` → `secondary` (gray)
- `pro` → `default` (blue)
- `enterprise` → `default` (purple via className override)
- `custom` → `outline` (with custom color)

#### 1.2 Enhanced Usage & Limits Section (UPGRADE EXISTING)

**Current Location**: `packages/app/src/routes/app/settings.tsx` (already exists)

**Enhancements**:

1. **Add percentage display**
2. **Add warning indicators**
3. **Add rate limit status**
4. **Improve visual hierarchy**

**New Data Structure**:
```typescript
interface EnhancedUsageResponse {
  usage: {
    sourceCount: number;
    publicFeedCount: number;
    categoryCount: number;
    articleCount: number;  // Informational only
    lastUpdated: string;
  };
  limits: {
    maxSources: number;
    maxPublicFeeds: number;
    maxCategories: number | null;  // null = unlimited
  };
  rateLimits: {
    api: {
      used: number;  // Requests in current window
      limit: number;
      resetAt: string;  // ISO timestamp
      percentUsed: number;
    };
    publicFeed: {
      used: number;  // Accesses in current window
      limit: number;
      resetAt: string;
      percentUsed: number;
    };
  };
}
```

**UI Components**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Usage & Limits</CardTitle>
    <CardDescription>
      Your resource usage and plan limits
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Resource Quotas */}
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Resource Quotas</h4>

      {/* Sources */}
      <UsageQuotaItem
        label="RSS Feed Sources"
        used={usage.sourceCount}
        limit={limits.maxSources}
        icon={<Rss className="h-4 w-4" />}
        helpText="Number of RSS feeds you're subscribed to"
      />

      {/* Public Feeds */}
      <UsageQuotaItem
        label="Public Feeds"
        used={usage.publicFeedCount}
        limit={limits.maxPublicFeeds}
        icon={<Globe className="h-4 w-4" />}
        helpText="Number of public feed collections you've created"
      />

      {/* Categories */}
      <UsageQuotaItem
        label="Categories"
        used={usage.categoryCount}
        limit={limits.maxCategories}
        icon={<FolderOpen className="h-4 w-4" />}
        helpText="Number of custom categories you've organized"
      />

      {/* Article Count (Informational) */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Total Articles</span>
        </div>
        <span className="font-medium">{usage.articleCount.toLocaleString()}</span>
      </div>
    </div>

    <Separator />

    {/* Rate Limits */}
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Rate Limits</h4>
      <p className="text-xs text-muted-foreground">
        Temporary limits that reset automatically on a rolling basis
      </p>

      {/* API Rate Limit */}
      <RateLimitItem
        label="API Requests"
        used={rateLimits.api.used}
        limit={rateLimits.api.limit}
        resetAt={rateLimits.api.resetAt}
        window="per minute"
        icon={<Zap className="h-4 w-4" />}
      />

      {/* Public Feed Rate Limit */}
      <RateLimitItem
        label="Public Feed Access"
        used={rateLimits.publicFeed.used}
        limit={rateLimits.publicFeed.limit}
        resetAt={rateLimits.publicFeed.resetAt}
        window="per minute"
        icon={<Eye className="h-4 w-4" />}
      />
    </div>

    <p className="text-xs text-muted-foreground">
      Last updated {formatDistanceToNow(new Date(usage.lastUpdated))} ago
    </p>
  </CardContent>
</Card>
```

**Helper Component**: `UsageQuotaItem`
```tsx
interface UsageQuotaItemProps {
  label: string;
  used: number;
  limit: number | null;  // null = unlimited
  icon: React.ReactNode;
  helpText?: string;
}

function UsageQuotaItem({ label, used, limit, icon, helpText }: UsageQuotaItemProps) {
  const isUnlimited = limit === null;
  const percentUsed = isUnlimited ? 0 : (used / limit) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>{helpText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">
            {used.toLocaleString()}
            {!isUnlimited && ` / ${limit.toLocaleString()}`}
            {isUnlimited && <span className="text-muted-foreground ml-1">(unlimited)</span>}
          </span>
          {!isUnlimited && (
            <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "warning" : "secondary"} className="text-xs">
              {percentUsed.toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>
      {!isUnlimited && (
        <>
          <Progress
            value={percentUsed}
            className={cn(
              isAtLimit && "bg-red-100 dark:bg-red-950",
              isNearLimit && !isAtLimit && "bg-yellow-100 dark:bg-yellow-950"
            )}
            indicatorClassName={cn(
              isAtLimit && "bg-red-500",
              isNearLimit && !isAtLimit && "bg-yellow-500"
            )}
          />
          {isAtLimit && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Quota limit reached. Upgrade your plan to add more {label.toLowerCase()}.
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Approaching quota limit ({limit - used} remaining).
            </p>
          )}
        </>
      )}
    </div>
  );
}
```

**Helper Component**: `RateLimitItem`
```tsx
interface RateLimitItemProps {
  label: string;
  used: number;
  limit: number;
  resetAt: string;
  window: string;  // "per minute", "per hour"
  icon: React.ReactNode;
}

function RateLimitItem({ label, used, limit, resetAt, window, icon }: RateLimitItemProps) {
  const percentUsed = (used / limit) * 100;
  const remaining = limit - used;
  const resetDate = new Date(resetAt);
  const secondsUntilReset = Math.max(0, Math.floor((resetDate.getTime() - Date.now()) / 1000));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
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
          <span>
            Resets in {secondsUntilReset < 60
              ? `${secondsUntilReset}s`
              : `${Math.floor(secondsUntilReset / 60)}m ${secondsUntilReset % 60}s`}
          </span>
        </div>
      </div>
    </div>
  );
}
```

#### 1.3 Account Status Section (NEW)

**Location**: After Profile section

**Purpose**: Show account health and any issues requiring attention

**Data Requirements**:
```typescript
interface AccountStatus {
  status: 'active' | 'suspended' | 'inactive';
  suspended: boolean;
  suspensionReason?: string;
  memberSince: string;
  hasCustomLimits: boolean;
  accountAge: {
    days: number;
    formatted: string;  // "3 months", "1 year"
  };
}
```

**UI Components**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Account Status</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Status Indicator */}
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Status</span>
      <Badge variant={user.suspended ? "destructive" : "success"}>
        {user.suspended ? (
          <>
            <XCircle className="mr-1 h-3 w-3" />
            Suspended
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
    {user.suspended && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account Suspended</AlertTitle>
        <AlertDescription>
          Your account has been suspended by an administrator.
          {suspensionReason && ` Reason: ${suspensionReason}`}
          Please contact support for assistance.
        </AlertDescription>
      </Alert>
    )}

    {/* Account Age */}
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Member since</span>
      <span className="font-medium">
        {format(new Date(user.createdAt), 'MMM d, yyyy')}
        <span className="text-muted-foreground ml-2">
          ({accountAge.formatted})
        </span>
      </span>
    </div>

    {/* Role Badge */}
    {user.role === 'admin' && (
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
```

---

### Phase 2: Backend API Enhancements

#### 2.1 Enhanced `userSettings.get()` Endpoint

**File**: `packages/api/src/routers/userSettings.ts`

**Current Response**:
```typescript
{
  user: { id, username, email, createdAt },
  settings: { theme, autoAgeDays, defaultFilter, share* },
  usage: { sourceCount, publicFeedCount, categoryCount, articleCount, lastUpdated },
  limits: { maxSources, maxPublicFeeds, maxCategories }
}
```

**Enhanced Response** (add):
```typescript
{
  // ... existing fields
  user: {
    // ... existing fields
    role: 'user' | 'admin',
    plan: string,
    suspended: boolean,
  },
  plan: {
    id: string,
    name: string,
    priceCents: number,
    features: string[] | null,
    apiRateLimitPerMinute: number,
    publicFeedRateLimitPerMinute: number,
  },
  customLimits: {
    maxSources?: number,
    maxPublicFeeds?: number,
    maxCategories?: number,
    apiRateLimitPerMinute?: number,
    publicFeedRateLimitPerMinute?: number,
    notes?: string,
  } | null,
  rateLimits: {
    api: {
      used: number,
      limit: number,
      resetAt: string,
      percentUsed: number,
    },
    publicFeed: {
      used: number,
      limit: number,
      resetAt: string,
      percentUsed: number,
    },
  },
}
```

**Implementation**:
```typescript
// packages/api/src/routers/userSettings.ts

export const userSettings = {
  async get(userId: number) {
    // ... existing queries for user, settings, usage

    // NEW: Get plan details
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { plan: true, suspended: true, role: true },
    });

    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, userRecord.plan),
    });

    // NEW: Get custom limits if they exist
    const customLimits = await db.query.userLimits.findFirst({
      where: eq(userLimits.userId, userId),
    });

    // NEW: Get current rate limit status
    const apiRateLimit = await rateLimiter.getStatus('api', userId);
    const feedRateLimit = await rateLimiter.getStatus('publicFeed', userId);

    return {
      // ... existing fields
      user: {
        ...existingUser,
        role: userRecord.role,
        plan: userRecord.plan,
        suspended: userRecord.suspended,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        features: plan.features ? JSON.parse(plan.features) : null,
        apiRateLimitPerMinute: plan.apiRateLimitPerMinute,
        publicFeedRateLimitPerMinute: plan.publicFeedRateLimitPerMinute,
      },
      customLimits: customLimits ? {
        maxSources: customLimits.maxSources,
        maxPublicFeeds: customLimits.maxPublicFeeds,
        maxCategories: customLimits.maxCategories,
        apiRateLimitPerMinute: customLimits.apiRateLimitPerMinute,
        publicFeedRateLimitPerMinute: customLimits.publicFeedRateLimitPerMinute,
        notes: customLimits.notes,
      } : null,
      rateLimits: {
        api: {
          used: apiRateLimit.used,
          limit: apiRateLimit.limit,
          resetAt: apiRateLimit.resetAt.toISOString(),
          percentUsed: (apiRateLimit.used / apiRateLimit.limit) * 100,
        },
        publicFeed: {
          used: feedRateLimit.used,
          limit: feedRateLimit.limit,
          resetAt: feedRateLimit.resetAt.toISOString(),
          percentUsed: (feedRateLimit.used / feedRateLimit.limit) * 100,
        },
      },
    };
  },
};
```

#### 2.2 New Rate Limiter Method: `getStatus()`

**File**: `packages/api/src/services/rate-limiter.ts`

**Note**: This method is not currently implemented. Rate limit status is not exposed via the API because Cloudflare Workers rate limit bindings don't provide per-user usage data. Users see their plan limits, not real-time usage.

**Future Implementation** (if needed):
```typescript
// This would require querying the rate limit binding
// Note: Cloudflare Workers bindings don't expose per-user usage
// This is a conceptual example only
async function getRateLimitStatus(
  env: Env,
  userId: number,
  type: 'api' | 'publicFeed'
): Promise<{
  limit: number;
  // Note: 'used' and 'remaining' are not available from bindings
  resetAt: Date;
}> {
  const limits = await getUserLimits(db, userId);
  const limit = type === 'api' 
    ? limits.apiRateLimitPerMinute 
    : limits.publicFeedRateLimitPerMinute;
  
  // Reset happens every minute automatically
  const resetAt = new Date(Date.now() + 60 * 1000);
  
  return { limit, resetAt };
}
```

---

### Phase 3: UI/UX Polish

#### 3.1 Real-Time Updates

**Problem**: Rate limits change rapidly; static data gets stale quickly.

**Solution**: Use polling or WebSocket for live updates.

**Implementation** (Polling):
```tsx
// packages/app/src/routes/app/settings.tsx

function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => api.userSettings.get(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // ... render components
}
```

**Alternative** (WebSocket - future):
```typescript
// Subscribe to rate limit updates
ws.subscribe('rateLimits', (update) => {
  queryClient.setQueryData(['userSettings'], (old) => ({
    ...old,
    rateLimits: update,
  }));
});
```

#### 3.2 Visual Hierarchy Improvements

**Current Issue**: Settings page is flat; all sections have equal weight.

**Proposed Layout**:

```
┌─────────────────────────────────────┐
│ Subscription & Plan (NEW)           │  ← Most important
│ [Badge] [Upgrade Button]            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Account Status (NEW)                 │  ← Critical alerts
│ [Status Badge]                       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Usage & Limits (ENHANCED)            │  ← Frequently checked
│ [Progress Bars] [Rate Limits]       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Profile                              │  ← Reference info
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Appearance                           │  ← Preferences
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Reading Preferences                  │  ← Preferences
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Share Options                        │  ← Preferences
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Danger Zone                          │  ← Destructive actions
└─────────────────────────────────────┘
```

#### 3.3 Responsive Design

**Mobile Considerations**:
- Stack cards vertically (already handled by grid system)
- Use collapsible sections for less critical info
- Show abbreviated rate limit info on mobile (just percentage, not full details)

**Desktop Enhancements**:
- Two-column layout for top sections (Plan | Status)
- More detailed tooltips on hover
- Sidebar navigation to jump to sections (future)

#### 3.4 Loading States

**Skeleton Loaders** for initial page load:
```tsx
{isLoading ? (
  <>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  </>
) : (
  // ... actual content
)}
```

#### 3.5 Error States

**Graceful Degradation**:
- If rate limit status fails to load, show "Unavailable" instead of error
- If plan info fails, show fallback message
- Never block the entire page due to partial data failure

```tsx
{data?.rateLimits ? (
  <RateLimitItem {...} />
) : (
  <div className="text-sm text-muted-foreground">
    Rate limit status unavailable
  </div>
)}
```

---

### Phase 4: Future Enhancements (Billing Integration)

When payment processing is added, extend the Subscription & Plan section:

#### 4.1 Billing Section (NEW)

**Location**: Inside Subscription & Plan card

**Components**:

1. **Current Period**
   ```tsx
   <div className="text-sm">
     <span className="text-muted-foreground">Current billing period:</span>
     <span className="font-medium">
       {format(currentPeriodStart, 'MMM d')} - {format(currentPeriodEnd, 'MMM d, yyyy')}
     </span>
   </div>
   ```

2. **Next Billing Date**
   ```tsx
   <div className="text-sm">
     <span className="text-muted-foreground">Next billing date:</span>
     <span className="font-medium">{format(nextBillingDate, 'MMM d, yyyy')}</span>
   </div>
   ```

3. **Payment Method**
   ```tsx
   <Button variant="outline" size="sm">
     <CreditCard className="mr-2 h-4 w-4" />
     Update Payment Method
   </Button>
   ```

4. **Invoice History**
   ```tsx
   <Button variant="ghost" size="sm" asChild>
     <Link to="/app/settings/invoices">
       View Invoice History
     </Link>
   </Button>
   ```

5. **Cancel Subscription**
   ```tsx
   <AlertDialog>
     <AlertDialogTrigger asChild>
       <Button variant="destructive" size="sm">
         Cancel Subscription
       </Button>
     </AlertDialogTrigger>
     <AlertDialogContent>
       {/* Confirmation flow */}
     </AlertDialogContent>
   </AlertDialog>
   ```

---

## Implementation Checklist

### Backend Changes

- [ ] **Enhance `userSettings.get()` endpoint**
  - [ ] Add plan details to response
  - [ ] Add custom limits to response
  - [ ] Add rate limit status to response
  - [ ] Add user role and suspension status
  - [ ] Update TypeScript types
  - [ ] Update API documentation

- [ ] **Add `rateLimiter.getStatus()` method**
  - [ ] Implement for 'api' type
  - [ ] Implement for 'publicFeed' type
  - [ ] Implement for 'login' type
  - [ ] Add tests

- [ ] **Add helper functions**
  - [ ] `getEffectiveLimits(userId)` - returns plan limits or custom overrides
  - [ ] `getAccountAge(createdAt)` - formats account age string

### Frontend Changes

- [ ] **Create new components**
  - [ ] `SubscriptionPlanCard` - displays plan info and features
  - [ ] `AccountStatusCard` - displays account health
  - [ ] `UsageQuotaItem` - reusable quota display with progress
  - [ ] `RateLimitItem` - rate limit display with countdown
  - [ ] Update TypeScript types for enhanced API response

- [ ] **Update existing components**
  - [ ] Enhance `packages/app/src/routes/app/settings.tsx`
  - [ ] Reorganize card order (Subscription first)
  - [ ] Add percentage badges to usage stats
  - [ ] Add warning alerts for near-limit usage
  - [ ] Add custom limits alert

- [ ] **Add utility functions**
  - [ ] `getPlanBadgeVariant(planId)` - returns badge color
  - [ ] `formatAccountAge(createdAt)` - calculates "3 months ago"
  - [ ] `formatSecondsUntilReset(seconds)` - formats countdown timer

- [ ] **Implement polling**
  - [ ] Set `refetchInterval: 10000` for rate limits
  - [ ] Add visual indicator when data refreshes
  - [ ] Handle stale data gracefully

### Testing

- [ ] **Unit tests**
  - [ ] `rateLimiter.getStatus()` returns correct values
  - [ ] `UsageQuotaItem` shows warnings at 80% and 100%
  - [ ] `RateLimitItem` countdown updates correctly

- [ ] **Integration tests**
  - [ ] Enhanced `/api/user-settings/get` returns all new fields
  - [ ] Custom limits override plan limits correctly
  - [ ] Suspended users see suspension alert

- [ ] **E2E tests**
  - [ ] User navigates to settings page, sees plan info
  - [ ] User on free plan sees upgrade CTA
  - [ ] User with custom limits sees alert
  - [ ] Suspended user sees suspension warning

### Documentation

- [ ] Update API documentation with new response fields
- [ ] Update user guide with screenshots of new settings page
- [ ] Update admin guide explaining custom limits impact on user UI
- [ ] Add migration guide if database changes required (unlikely for Phase 1)

---

## API Response Examples

### Example 1: Free Plan User

```json
{
  "user": {
    "id": 42,
    "username": "johnsmith",
    "email": "john@example.com",
    "role": "user",
    "plan": "free",
    "suspended": false,
    "createdAt": "2025-01-15T08:30:00Z"
  },
  "plan": {
    "id": "free",
    "name": "Free",
    "priceCents": 0,
    "features": [
      "Up to 50 RSS sources",
      "3 public feeds",
      "10 categories",
      "Community support"
    ],
    "apiRateLimitPerMinute": 60,
    "publicFeedRateLimitPerMinute": 17
  },
  "customLimits": null,
  "settings": {
    "theme": "dark",
    "autoAgeDays": 7,
    "defaultFilter": "unread",
    "shareEmail": true,
    "shareHackernews": false,
    "shareReddit": false,
    "shareTwitter": false,
    "shareBluesky": false,
    "shareMastodon": false
  },
  "usage": {
    "sourceCount": 32,
    "publicFeedCount": 2,
    "categoryCount": 5,
    "articleCount": 1843,
    "lastUpdated": "2025-01-20T14:22:00Z"
  },
  "limits": {
    "maxSources": 50,
    "maxPublicFeeds": 3,
    "maxCategories": 10
  },
  "rateLimits": {
    "api": {
      "used": 12,
      "limit": 60,
      "resetAt": "2025-01-20T14:25:00Z",
      "percentUsed": 20
    },
    "publicFeed": {
      "used": 5,
      "limit": 100,
      "resetAt": "2025-01-20T15:22:00Z",
      "percentUsed": 5
    }
  }
}
```

### Example 2: Pro Plan User with Custom Limits

```json
{
  "user": {
    "id": 108,
    "username": "janedev",
    "email": "jane@techcorp.com",
    "role": "user",
    "plan": "pro",
    "suspended": false,
    "createdAt": "2024-06-10T12:00:00Z"
  },
  "plan": {
    "id": "pro",
    "name": "Pro",
    "priceCents": 999,
    "features": [
      "Up to 500 RSS sources",
      "25 public feeds",
      "Unlimited categories",
      "Priority support",
      "API access",
      "Advanced analytics"
    ],
    "apiRateLimitPerMinute": 300,
    "publicFeedRateLimitPerMinute": 167
  },
  "customLimits": {
    "maxSources": 1000,
    "maxPublicFeeds": null,
    "maxCategories": null,
    "apiRateLimitPerMinute": 500,
    "publicFeedRateLimitPerMinute": null,
    "notes": "Beta tester - increased limits for Q1 2025"
  },
  "settings": { /* ... */ },
  "usage": {
    "sourceCount": 287,
    "publicFeedCount": 12,
    "categoryCount": 45,
    "articleCount": 18932,
    "lastUpdated": "2025-01-20T14:22:00Z"
  },
  "limits": {
    "maxSources": 1000,  // From customLimits
    "maxPublicFeeds": 25,  // From plan (no override)
    "maxCategories": null  // Unlimited
  },
  "rateLimits": {
    "api": {
      "used": 145,
      "limit": 500,  // From customLimits
      "resetAt": "2025-01-20T14:25:00Z",
      "percentUsed": 29
    },
    "publicFeed": {
      "used": 82,
      "limit": 500,  // From plan
      "resetAt": "2025-01-20T15:22:00Z",
      "percentUsed": 16.4
    }
  }
}
```

### Example 3: Suspended User

```json
{
  "user": {
    "id": 201,
    "username": "spammer",
    "email": "spam@example.com",
    "role": "user",
    "plan": "free",
    "suspended": true,
    "createdAt": "2025-01-18T09:00:00Z"
  },
  "plan": { /* ... */ },
  "customLimits": null,
  "settings": { /* ... */ },
  "usage": { /* ... */ },
  "limits": { /* ... */ },
  "rateLimits": { /* ... */ }
}
```

---

## Success Metrics

### User Experience Metrics

1. **Information Visibility**
   - 100% of users can see their current plan
   - 100% of users can see their usage percentages
   - 100% of suspended users see suspension alert

2. **Actionability**
   - Users on free plan see upgrade CTA
   - Users near quota limits see warning + upgrade path
   - Users with rate limit issues see countdown timer

3. **Transparency**
   - Users understand why they have different limits (custom limits alert)
   - Users can distinguish between persistent quotas vs. temporary rate limits
   - Users know when rate limits will reset

### Technical Metrics

1. **Performance**
   - Settings page loads in < 1 second
   - Rate limit polling doesn't impact performance
   - No unnecessary re-renders

2. **Reliability**
   - Graceful degradation if rate limit API fails
   - No crashes if plan data missing
   - Proper error boundaries

---

## Related Files

### Backend
- `packages/api/src/routers/userSettings.ts` - Main endpoint to enhance
- `packages/api/src/services/rate-limiter.ts` - Add getStatus() method
- `packages/api/src/services/limits.ts` - Helper for effective limits
- `packages/api/src/db/schema.ts` - Database schema reference

### Frontend
- `packages/app/src/routes/app/settings.tsx` - Main settings page
- `packages/app/src/lib/hooks/useUserSettings.ts` - Settings query hook
- `packages/app/src/components/ui/*` - Reusable UI components

### Documentation
- `docs/architecture/usage-quotas-and-time-periods.md` - Time period implementation details
- `docs/guides/admin/admin-guide.md` - Admin capabilities reference

---

## Timeline Estimate

### Phase 1: Core Information Display
- Backend API enhancements: **2-3 days**
- Frontend component development: **3-4 days**
- Testing and polish: **1-2 days**
- **Total: 6-9 days**

### Phase 2: UI/UX Polish
- Real-time updates implementation: **1 day**
- Responsive design improvements: **1 day**
- Loading and error states: **1 day**
- **Total: 3 days**

### Phase 3: Future Billing Integration
- Billing section UI: **2 days**
- Payment method management: **3 days**
- Invoice history page: **2 days**
- Cancellation flow: **2 days**
- **Total: 9 days** (when billing is implemented)

**Overall Phase 1-2 Estimate: 9-12 days**

---

## Next Steps

1. **Review and approval** - Get stakeholder sign-off on design
2. **Backend implementation** - Start with API enhancements
3. **Frontend implementation** - Build components in isolation (Storybook?)
4. **Integration testing** - Ensure all pieces work together
5. **User testing** - Get feedback from beta users
6. **Documentation** - Update user guides with new features
7. **Deployment** - Roll out incrementally with feature flag

---

## Questions for Stakeholders

1. **Plan Features Display** - Should we pull features from database or hardcode them?
2. **Rate Limit Polling** - Is 10-second interval acceptable, or do we need WebSocket?
3. **Custom Limits Visibility** - Should users see admin notes, or just that they have custom limits?
4. **Upgrade Flow** - Where should "Upgrade Plan" button link to? Pricing page? Checkout?
5. **Historical Usage** - Do we want to show usage trends graphs, or just current stats?
6. **Mobile UX** - Any specific requirements for mobile settings page?
7. **Accessibility** - Do we need screen reader testing for progress bars?

---

## Appendix: Wireframes

### Desktop Layout

```
┌─────────────────────────────────────────────────┐
│ Settings                                         │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌───────────────────┐ ┌────────────────────┐  │
│ │ Subscription &    │ │ Account Status     │  │
│ │ Plan              │ │                    │  │
│ │                   │ │ Status: Active ✓   │  │
│ │ Pro Plan          │ │ Member since:      │  │
│ │ $9.99/month       │ │ Jan 15, 2025       │  │
│ │                   │ │                    │  │
│ │ ✓ 500 sources     │ └────────────────────┘  │
│ │ ✓ 25 public feeds │                          │
│ │ ✓ Unlimited cats  │                          │
│ │                   │                          │
│ └───────────────────┘                          │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Usage & Limits                              ││
│ │                                             ││
│ │ RSS Feed Sources      32 / 50     [64%]    ││
│ │ [████████████░░░░░░░░]                      ││
│ │                                             ││
│ │ Public Feeds          2 / 3       [67%]    ││
│ │ [█████████████░░░░░░░]                      ││
│ │                                             ││
│ │ Rate Limits                                 ││
│ │ API Requests (per min)  12 / 60   [20%]    ││
│ │ Resets in 2m 38s                            ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ [Profile] [Appearance] [Preferences]...         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────┐
│ Settings        │
├─────────────────┤
│                 │
│ Subscription    │
│ ┌─────────────┐ │
│ │ Pro Plan    │ │
│ │ $9.99/mo    │ │
│ │ [Upgrade]   │ │
│ └─────────────┘ │
│                 │
│ Account Status  │
│ ┌─────────────┐ │
│ │ ✓ Active    │ │
│ │ Since Jan   │ │
│ └─────────────┘ │
│                 │
│ Usage           │
│ ┌─────────────┐ │
│ │ Sources     │ │
│ │ 32/50 [64%] │ │
│ │ [████░░]    │ │
│ └─────────────┘ │
│                 │
│ [▼ More...]     │
│                 │
└─────────────────┘
```
