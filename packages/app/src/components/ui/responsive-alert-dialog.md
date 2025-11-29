# ResponsiveAlertDialog Component

A responsive alert dialog component for confirmations and destructive actions that automatically adapts based on viewport size:

- **Desktop (≥768px)**: Displays as an AlertDialog modal
- **Mobile (<768px)**: Displays as a bottom Drawer

## Installation

The ResponsiveAlertDialog component requires:

- `@/hooks/use-media-query` - Media query detection hook
- `@/components/animate-ui/components/radix/alert-dialog` - AnimateUI AlertDialog
- `@/components/ui/drawer` - shadcn Drawer (vaul-based)
- `@/components/ui/button` - Button component

## Basic Usage

```tsx
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

function MyComponent() {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    // Perform destructive action
    console.log("Confirmed!");
    setOpen(false);
  };

  return (
    <ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>Are you sure?</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            data.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction onClick={handleConfirm}>
            Delete
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
```

## Components

### ResponsiveAlertDialog

The root component that manages the open state and desktop/mobile detection.

**Props:**

- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Callback when open state changes
- `children: React.ReactNode` - Child components

### ResponsiveAlertDialogContent

The main content container.

**Props:**

- `children: React.ReactNode` - Content to display
- `className?: string` - Additional CSS classes

### ResponsiveAlertDialogHeader

Header section containing title and description.

**Props:**

- `children: React.ReactNode` - Header content
- `className?: string` - Additional CSS classes

### ResponsiveAlertDialogTitle

The alert dialog title. Required for accessibility.

**Props:**

- `children: React.ReactNode` - Title text
- `className?: string` - Additional CSS classes

### ResponsiveAlertDialogDescription

Description text explaining the action. Strongly recommended for clarity.

**Props:**

- `children: React.ReactNode` - Description text
- `className?: string` - Additional CSS classes

### ResponsiveAlertDialogFooter

Footer section containing action buttons. Typically includes Cancel and Action buttons.

**Props:**

- `children: React.ReactNode` - Footer content (buttons)
- `className?: string` - Additional CSS classes

### ResponsiveAlertDialogCancel

Cancel button that closes the dialog without taking action.

**Props:**

- `children: React.ReactNode` - Button text (typically "Cancel")
- `className?: string` - Additional CSS classes
- Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`

### ResponsiveAlertDialogAction

Primary action button for confirming the action.

**Props:**

- `children: React.ReactNode` - Button text (e.g., "Delete", "Confirm")
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Action to perform
- Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`

## Examples

### Delete Confirmation

```tsx
<ResponsiveAlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>Delete Item</ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription>
        Are you sure you want to delete "{itemName}"? This action cannot be
        undone.
      </ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>
```

### Logout Confirmation

```tsx
<ResponsiveAlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>Log out</ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription>
        Are you sure you want to log out?
      </ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction onClick={handleLogout}>
        Log out
      </ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>
```

### Warning with Additional Info

```tsx
<ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>Delete Category</ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription className="space-y-2">
        <p>Are you sure you want to delete "{categoryName}"?</p>
        {hasAssociatedFeed && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="font-semibold text-destructive">Warning:</p>
            <p className="text-sm mt-1">
              This category has an associated public feed that will also be
              deleted.
            </p>
          </div>
        )}
      </ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction onClick={handleDelete}>
        Delete
      </ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>
```

### With Loading State

```tsx
<ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>
        {isBanned ? "Unban" : "Ban"} User
      </ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription>
        Are you sure you want to {isBanned ? "unban" : "ban"}{" "}
        <strong>{username}</strong>?
        {!isBanned && (
          <span className="block mt-2">
            This will prevent the user from accessing their account.
          </span>
        )}
      </ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel disabled={isPending}>
        Cancel
      </ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction onClick={handleBan} disabled={isPending}>
        {isPending ? "Processing..." : isBanned ? "Unban" : "Ban"}
      </ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>
```

## Behavior Differences

### Desktop (AlertDialog)

- Modal centered on screen
- Prevents closing on backdrop click (requires explicit Cancel/Action)
- Standard alert dialog styling
- X close button hidden

### Mobile (Drawer)

- Slides up from bottom
- Can swipe down to close (same as Cancel)
- Drawer-style UI with handle
- Action buttons stack vertically for better touch targets

## Button Styling

Both Cancel and Action buttons automatically receive appropriate styling:

**Cancel Button:**

- Desktop: `AlertDialogCancel` styling
- Mobile: Outline button variant via `DrawerClose`

**Action Button:**

- Desktop: `AlertDialogAction` styling (primary button)
- Mobile: Default button variant via `DrawerClose`

For destructive actions, add custom styling:

```tsx
<ResponsiveAlertDialogAction
  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
  onClick={handleDelete}
>
  Delete
</ResponsiveAlertDialogAction>
```

## Accessibility

- Automatically manages focus trapping
- Title is required for screen reader support
- Description provides context for assistive technologies
- Prevents accidental dismissal (no backdrop click close)
- Keyboard navigation (Tab, Escape)
- Escape key closes dialog (same as Cancel)

## Use Cases

Use ResponsiveAlertDialog for:

- ✅ Destructive actions (delete, ban, remove)
- ✅ Confirmation prompts (logout, leave page, discard changes)
- ✅ Critical warnings (data loss, irreversible operations)
- ✅ Two-choice decisions (yes/no, continue/cancel)

Do NOT use for:

- ❌ Forms or data entry (use ResponsiveDialog)
- ❌ Complex multi-step flows (use ResponsiveDialog)
- ❌ Informational messages (use Toast or Alert)
- ❌ Multiple action options (use ResponsiveDialog with buttons)

## Related Components

- `ResponsiveDialog` - For forms and general content
- `AlertDialog` - AnimateUI AlertDialog (desktop only)
- `Drawer` - shadcn Drawer (mobile UI pattern)
- `Toast` - For non-blocking notifications

## Migration Guide

### From AlertDialog

Replace AlertDialog imports with ResponsiveAlertDialog:

```tsx
// Before
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

// After
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
```

Update component names (add "Responsive" prefix):

```tsx
// Before
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Title</AlertDialogTitle>
      <AlertDialogDescription>Description</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// After
<ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>Title</ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription>Description</ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction>Confirm</ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>
```

## Implementation Details

The component uses a context-based approach similar to ResponsiveDialog:

1. `useMediaQuery("(min-width: 768px)")` detects viewport size
2. Context provides `isDesktop` boolean to all sub-components
3. On desktop: Uses AlertDialog primitives
4. On mobile: Uses Drawer primitives with Button components
5. Action/Cancel buttons automatically wrap with DrawerClose on mobile

## Best Practices

1. **Clear title** - Use action-oriented titles ("Delete Item" not "Are you sure?")
2. **Descriptive text** - Explain what will happen and any consequences
3. **Appropriate buttons** - "Cancel" should always be available
4. **Action button text** - Be specific ("Delete" not "Yes", "Log out" not "OK")
5. **Loading states** - Disable buttons during async operations
6. **Error handling** - Keep dialog open if action fails, show error
7. **Destructive styling** - Use red/destructive colors for dangerous actions

## Testing

Test both desktop and mobile behaviors:

```tsx
// Test mobile viewport
window.innerWidth = 375;
// Verify drawer slides up from bottom

// Test desktop viewport
window.innerWidth = 1024;
// Verify centered modal dialog

// Test keyboard navigation
// Press Tab to move between Cancel and Action
// Press Escape to close (same as Cancel)

// Test loading state
// Verify buttons disable during async operations
```
