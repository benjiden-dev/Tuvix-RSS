import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/responsive-alert-dialog";
import { useLogout } from "@/lib/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { authClient } from "@/lib/auth-client";

// User type from Better Auth session (includes banned via customSession plugin)
type User = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>
>["user"];

export function NavUser({
  user,
  isLoading,
}: {
  user?: User;
  isLoading?: boolean;
}) {
  const { isMobile } = useSidebar();
  const logout = useLogout();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (username?: string) => {
    if (!username) return "?";
    return username.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout.mutate();
    setLogoutDialogOpen(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                {user.email && (
                  <span className="truncate text-xs">{user.email}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-medium">
                      {user.username}
                    </span>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                  {user.email && (
                    <span className="truncate text-xs">{user.email}</span>
                  )}
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {user.plan} Plan
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to="/app/settings" className="no-underline">
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut />
              {logout.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Logout Confirmation Dialog */}
      <ResponsiveAlertDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Log out</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Are you sure you want to log out?
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction onClick={confirmLogout}>
              Log out
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </SidebarMenu>
  );
}
