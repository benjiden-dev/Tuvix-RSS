# ResponsiveDialog Component

A responsive dialog component that automatically adapts based on viewport size:

- **Desktop (≥768px)**: Displays as a modal Dialog with AnimateUI animations
- **Mobile (<768px)**: Displays as a bottom Drawer for better mobile UX

## Installation

The ResponsiveDialog component requires:

- `@/hooks/use-media-query` - Media query detection hook
- `@/components/animate-ui/components/radix/dialog` - AnimateUI Dialog
- `@/components/ui/drawer` - shadcn Drawer (vaul-based)

## Basic Usage

```tsx
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Dialog Title</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            This dialog adapts to screen size automatically.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div>Your content here</div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
```

## Components

### ResponsiveDialog

The root component that manages the open state and desktop/mobile detection.

**Props:**

- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Callback when open state changes
- `children: React.ReactNode` - Child components

### ResponsiveDialogContent

The main content container. On desktop, renders as `DialogContent` with animations. On mobile, renders as `DrawerContent` sliding from bottom.

**Props:**

- `children: React.ReactNode` - Content to display
- `className?: string` - Additional CSS classes
- `showCloseButton?: boolean` - Show close button (desktop only, default: true)

### ResponsiveDialogHeader

Header section containing title and description.

**Props:**

- `children: React.ReactNode` - Header content
- `className?: string` - Additional CSS classes

### ResponsiveDialogTitle

The dialog title. Required for accessibility.

**Props:**

- `children: React.ReactNode` - Title text
- `className?: string` - Additional CSS classes

### ResponsiveDialogDescription

Optional description text below the title.

**Props:**

- `children: React.ReactNode` - Description text
- `className?: string` - Additional CSS classes

### ResponsiveDialogFooter

Footer section typically containing action buttons.

**Props:**

- `children: React.ReactNode` - Footer content
- `className?: string` - Additional CSS classes

### ResponsiveDialogClose

Optional close trigger. On mobile (drawer), wraps content with `DrawerClose`. On desktop, renders button if children provided.

**Props:**

- `children?: React.ReactNode` - Close button content
- `className?: string` - Additional CSS classes
- `asChild?: boolean` - Compose with child element

## Examples

### Form Dialog

```tsx
<ResponsiveDialog open={open} onOpenChange={setOpen}>
  <ResponsiveDialogContent>
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>Edit Profile</ResponsiveDialogTitle>
      <ResponsiveDialogDescription>
        Make changes to your profile information.
      </ResponsiveDialogDescription>
    </ResponsiveDialogHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </div>

    <ResponsiveDialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save Changes</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

### Large Content Dialog

```tsx
<ResponsiveDialog open={open} onOpenChange={setOpen}>
  <ResponsiveDialogContent className="max-w-3xl max-h-[85vh]">
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>Preview Import</ResponsiveDialogTitle>
      <ResponsiveDialogDescription>
        Select items to import from the list below.
      </ResponsiveDialogDescription>
    </ResponsiveDialogHeader>

    <ScrollArea className="flex-1">{/* Large scrollable content */}</ScrollArea>

    <ResponsiveDialogFooter>
      <Button onClick={handleImport}>Import Selected</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

## Behavior Differences

### Desktop (Dialog)

- Centers on screen with backdrop
- Animates from top by default
- Shows X close button in top-right
- Closes on backdrop click or Escape key
- Fixed max-width (default: 32rem)

### Mobile (Drawer)

- Slides up from bottom
- Shows drag handle at top
- Swipe down to close
- Full width, height based on content (max 80vh)
- Closes on backdrop tap or swipe down

## Styling

The component uses CSS classes and can be customized:

```tsx
<ResponsiveDialogContent className="max-w-4xl">
  {/* Wide dialog on desktop, full-width drawer on mobile */}
</ResponsiveDialogContent>
```

## Accessibility

- Automatically manages focus trapping
- Supports keyboard navigation (Tab, Escape)
- Includes proper ARIA attributes
- Title is required for screen reader support
- Description is optional but recommended

## Related Components

- `ResponsiveAlertDialog` - For confirmation dialogs
- `Dialog` - AnimateUI Dialog (desktop only)
- `Drawer` - shadcn Drawer (mobile UI pattern)

## Migration Guide

### From Dialog

Replace Dialog imports with ResponsiveDialog:

```tsx
// Before
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";

// After
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
```

Update component usage (names change, props stay the same):

```tsx
// Before
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// After
<ResponsiveDialog open={open} onOpenChange={setOpen}>
  <ResponsiveDialogContent>
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>Title</ResponsiveDialogTitle>
      <ResponsiveDialogDescription>Description</ResponsiveDialogDescription>
    </ResponsiveDialogHeader>
    <ResponsiveDialogFooter>
      <Button>Action</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialogContent>
</ResponsiveDialog>
```

## Implementation Details

The component uses a context-based approach:

1. `useMediaQuery("(min-width: 768px)")` detects viewport size
2. Context provides `isDesktop` boolean to all sub-components
3. Each sub-component conditionally renders Dialog or Drawer primitives
4. Props are passed through unchanged for consistent API

## Best Practices

1. **Always include a title** - Required for accessibility
2. **Use controlled state** - Pass `open` and `onOpenChange` props
3. **Keep mobile in mind** - Test drawer behavior on mobile viewports
4. **Limit content height** - Use ScrollArea for long content
5. **Close on action** - Call `onOpenChange(false)` after actions complete
6. **Form validation** - Validate before closing to prevent data loss
