import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/api/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Search,
  UserX,
  UserCheck,
  Trash2,
  RefreshCw,
  CreditCard,
  Settings,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [banUserId, setBanUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [changePlanUserId, setChangePlanUserId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [customLimitsUserId, setCustomLimitsUserId] = useState<number | null>(
    null,
  );
  const [customLimits, setCustomLimits] = useState({
    maxSources: "",
    maxPublicFeeds: "",
    maxCategories: "",
  });

  const {
    data: users,
    isLoading,
    refetch,
  } = trpc.admin.listUsers.useQuery({
    limit: 50,
    offset: 0,
    search: search || undefined,
  });

  type UserItem = NonNullable<typeof users>["items"][number];

  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      refetch();
      setBanUserId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      refetch();
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const changePlanMutation = trpc.admin.changePlan.useMutation({
    onSuccess: () => {
      toast.success("User plan updated");
      refetch();
      setChangePlanUserId(null);
      setSelectedPlan("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  const customLimitsMutation = trpc.admin.setCustomLimits.useMutation({
    onSuccess: () => {
      toast.success("Custom limits set");
      refetch();
      setCustomLimitsUserId(null);
      setCustomLimits({
        maxSources: "",
        maxPublicFeeds: "",
        maxCategories: "",
        apiRateLimitPerMinute: "",
        publicFeedRateLimitPerMinute: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set custom limits");
    },
  });

  const recalculateUsageMutation = trpc.admin.recalculateUsage.useMutation({
    onSuccess: () => {
      toast.success("Usage recalculated");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to recalculate usage");
    },
  });

  const handleBan = (userId: number, banned: boolean) => {
    banMutation.mutate({ userId, banned });
  };

  const handleDelete = (userId: number) => {
    deleteMutation.mutate({ userId });
  };

  const handleChangePlan = () => {
    if (changePlanUserId && selectedPlan) {
      changePlanMutation.mutate({
        userId: changePlanUserId,
        plan: selectedPlan as "free" | "pro" | "enterprise" | "custom",
      });
    }
  };

  const handleSetCustomLimits = () => {
    if (customLimitsUserId) {
      customLimitsMutation.mutate({
        userId: customLimitsUserId,
        maxSources: customLimits.maxSources
          ? parseInt(customLimits.maxSources)
          : null,
        maxPublicFeeds: customLimits.maxPublicFeeds
          ? parseInt(customLimits.maxPublicFeeds)
          : null,
        maxCategories: customLimits.maxCategories
          ? parseInt(customLimits.maxCategories)
          : null,
        // Rate limits are not customizable - they come from plan-specific bindings
      });
    }
  };

  const handleRecalculateUsage = (userId: number) => {
    recalculateUsageMutation.mutate({ userId });
  };

  const openCustomLimitsDialog = (userId: number) => {
    const user = users?.items.find((u: UserItem) => u.id === userId);
    if (user?.customLimits) {
      setCustomLimits({
        maxSources: user.customLimits.maxSources?.toString() || "",
        maxPublicFeeds: user.customLimits.maxPublicFeeds?.toString() || "",
        maxCategories: user.customLimits.maxCategories?.toString() || "",
      });
    } else {
      setCustomLimits({
        maxSources: "",
        maxPublicFeeds: "",
        maxCategories: "",
      });
    }
    setCustomLimitsUserId(userId);
  };

  const userToBan = users?.items.find((u: UserItem) => u.id === banUserId);
  const userToDelete = users?.items.find(
    (u: UserItem) => u.id === deleteUserId,
  );

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage user accounts</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users?.total || 0} total users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.items.map((user: UserItem) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {user.usage.sourceCount} / {user.limits.maxSources}{" "}
                          sources
                        </div>
                        <div className="text-muted-foreground">
                          {user.usage.publicFeedCount} /{" "}
                          {user.limits.maxPublicFeeds} feeds
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setChangePlanUserId(user.id);
                              setSelectedPlan(user.plan);
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCustomLimitsDialog(user.id)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Custom Limits
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRecalculateUsage(user.id)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Recalculate Usage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setBanUserId(user.id)}
                          >
                            {user.banned ? (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban
                              </>
                            ) : (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Ban
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteUserId(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ban/Unban Dialog */}
      <AlertDialog
        open={banUserId !== null}
        onOpenChange={() => setBanUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToBan?.banned ? "Unban" : "Ban"} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToBan?.banned ? "unban" : "ban"}{" "}
              <strong>{userToBan?.username}</strong>?
              {!userToBan?.banned && (
                <span className="block mt-2">
                  This will prevent the user from accessing their account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                banUserId && handleBan(banUserId, !userToBan?.banned)
              }
              disabled={banMutation.isPending}
            >
              {banMutation.isPending
                ? "Processing..."
                : userToBan?.banned
                  ? "Unban"
                  : "Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteUserId !== null}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{userToDelete?.username}</strong>? This action cannot be
              undone. All user data including subscriptions, feeds, and articles
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDelete(deleteUserId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Plan Dialog */}
      <Dialog
        open={changePlanUserId !== null}
        onOpenChange={() => setChangePlanUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Plan</DialogTitle>
            <DialogDescription>
              Update the plan for{" "}
              <strong>
                {
                  users?.items.find((u: UserItem) => u.id === changePlanUserId)
                    ?.username
                }
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanUserId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={changePlanMutation.isPending || !selectedPlan}
            >
              {changePlanMutation.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Limits Dialog */}
      <Dialog
        open={customLimitsUserId !== null}
        onOpenChange={() => setCustomLimitsUserId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Custom Limits</DialogTitle>
            <DialogDescription>
              Override plan limits for{" "}
              <strong>
                {
                  users?.items.find(
                    (u: UserItem) => u.id === customLimitsUserId,
                  )?.username
                }
              </strong>
              . Leave empty to use plan defaults.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxSources">Max Sources</Label>
              <Input
                id="maxSources"
                type="number"
                placeholder="Leave empty for default"
                value={customLimits.maxSources}
                onChange={(e) =>
                  setCustomLimits({
                    ...customLimits,
                    maxSources: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPublicFeeds">Max Public Feeds</Label>
              <Input
                id="maxPublicFeeds"
                type="number"
                placeholder="Leave empty for default"
                value={customLimits.maxPublicFeeds}
                onChange={(e) =>
                  setCustomLimits({
                    ...customLimits,
                    maxPublicFeeds: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCategories">
                Max Categories (0 = unlimited)
              </Label>
              <Input
                id="maxCategories"
                type="number"
                placeholder="Leave empty for default"
                value={customLimits.maxCategories}
                onChange={(e) =>
                  setCustomLimits({
                    ...customLimits,
                    maxCategories: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomLimitsUserId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetCustomLimits}
              disabled={customLimitsMutation.isPending}
            >
              {customLimitsMutation.isPending ? "Saving..." : "Save Limits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
