# Responsive Dialog Components

Quick reference guide for ResponsiveDialog and ResponsiveAlertDialog components.

## When to Use

### ResponsiveDialog

Use for forms, data entry, and general content:

- ✅ Create/Edit forms
- ✅ Settings panels
- ✅ Multi-step wizards
- ✅ Preview/Review screens
- ✅ Complex content display

### ResponsiveAlertDialog

Use for confirmations and destructive actions:

- ✅ Delete confirmations
- ✅ Logout prompts
- ✅ Discard changes warnings
- ✅ Critical actions requiring confirmation
- ✅ Yes/No decisions

## Quick Start

### Installation

Components are already installed. Import from:

```tsx
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";

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

### Basic Examples

#### Form Dialog

```tsx
const [open, setOpen] = useState(false);

<ResponsiveDialog open={open} onOpenChange={setOpen}>
  <ResponsiveDialogContent>
    <ResponsiveDialogHeader>
      <ResponsiveDialogTitle>Edit Profile</ResponsiveDialogTitle>
      <ResponsiveDialogDescription>
        Update your profile information
      </ResponsiveDialogDescription>
    </ResponsiveDialogHeader>

    <div className="space-y-4">
      <Input label="Name" value={name} onChange={setName} />
      <Input label="Email" value={email} onChange={setEmail} />
    </div>

    <ResponsiveDialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialogContent>
</ResponsiveDialog>;
```

#### Confirmation Dialog

```tsx
const [open, setOpen] = useState(false);

<ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
  <ResponsiveAlertDialogContent>
    <ResponsiveAlertDialogHeader>
      <ResponsiveAlertDialogTitle>Delete Item?</ResponsiveAlertDialogTitle>
      <ResponsiveAlertDialogDescription>
        This action cannot be undone.
      </ResponsiveAlertDialogDescription>
    </ResponsiveAlertDialogHeader>
    <ResponsiveAlertDialogFooter>
      <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
      <ResponsiveAlertDialogAction onClick={handleDelete}>
        Delete
      </ResponsiveAlertDialogAction>
    </ResponsiveAlertDialogFooter>
  </ResponsiveAlertDialogContent>
</ResponsiveAlertDialog>;
```

## Behavior

### Desktop (≥768px)

- Modal centered on screen
- Backdrop overlay
- Closes with X button or Escape key
- Animates from top

### Mobile (<768px)

- Drawer slides from bottom
- Swipe down to close
- Full width, max 80vh height
- Pull handle indicator

## Props

### ResponsiveDialog / ResponsiveAlertDialog

| Prop           | Type                      | Description           |
| -------------- | ------------------------- | --------------------- |
| `open`         | `boolean`                 | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | State change callback |
| `children`     | `ReactNode`               | Dialog contents       |

### ResponsiveDialogContent

| Prop              | Type      | Default | Description                        |
| ----------------- | --------- | ------- | ---------------------------------- |
| `className`       | `string`  | -       | Additional CSS classes             |
| `showCloseButton` | `boolean` | `true`  | Show X close button (desktop only) |

### Action Buttons (Alert Dialog)

| Prop        | Type         | Description    |
| ----------- | ------------ | -------------- |
| `onClick`   | `() => void` | Action handler |
| `disabled`  | `boolean`    | Disable button |
| `className` | `string`     | Custom styling |

## Common Patterns

### With Loading State

```tsx
<ResponsiveAlertDialogAction onClick={handleAction} disabled={isLoading}>
  {isLoading ? "Processing..." : "Confirm"}
</ResponsiveAlertDialogAction>
```

### Destructive Action

```tsx
<ResponsiveAlertDialogAction
  onClick={handleDelete}
  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
  Delete
</ResponsiveAlertDialogAction>
```

### Large Content

```tsx
<ResponsiveDialogContent className="max-w-3xl max-h-[85vh]">
  <ResponsiveDialogHeader>...</ResponsiveDialogHeader>
  <ScrollArea className="flex-1">{/* Scrollable content */}</ScrollArea>
  <ResponsiveDialogFooter>...</ResponsiveDialogFooter>
</ResponsiveDialogContent>
```

## Migration from Old Components

### Find and Replace

1. Update imports:

```tsx
// Old
import { Dialog, DialogContent, ... } from "@/components/animate-ui/components/radix/dialog"
import { AlertDialog, AlertDialogContent, ... } from "@/components/animate-ui/components/radix/alert-dialog"

// New
import { ResponsiveDialog, ResponsiveDialogContent, ... } from "@/components/ui/responsive-dialog"
import { ResponsiveAlertDialog, ResponsiveAlertDialogContent, ... } from "@/components/ui/responsive-alert-dialog"
```

2. Add "Responsive" prefix to all component names:

```tsx
Dialog → ResponsiveDialog
DialogContent → ResponsiveDialogContent
DialogHeader → ResponsiveDialogHeader
// ... etc
```

3. Props remain the same - no API changes needed!

## Best Practices

### ✅ DO

- Always include a title (required for accessibility)
- Use controlled state (`open` + `onOpenChange`)
- Provide clear descriptions for alert dialogs
- Test on both desktop and mobile viewports
- Use appropriate button labels ("Delete" not "Yes")
- Close dialog after successful actions

### ❌ DON'T

- Don't nest dialogs inside dialogs
- Don't use alert dialogs for forms
- Don't use regular dialogs for confirmations
- Don't skip the description in alert dialogs
- Don't forget to handle loading states
- Don't leave dialogs open after navigation

## Full Documentation

- **ResponsiveDialog**: See `responsive-dialog.md`
- **ResponsiveAlertDialog**: See `responsive-alert-dialog.md`
- **Implementation Summary**: See `/docs/implementation/responsive-dialogs-summary.md`

## Examples in Codebase

### ResponsiveDialog Examples

- `components/app/import-preview-dialog.tsx` - Complex preview dialog
- `routes/app/categories.tsx` - Edit category form
- `routes/app/admin/users.tsx` - Change plan dialog

### ResponsiveAlertDialog Examples

- `components/app/nav-user.tsx` - Logout confirmation
- `routes/app/articles.tsx` - Mark read confirmations
- `routes/app/admin/users.tsx` - Delete user confirmation

## Troubleshooting

### Dialog doesn't close

- Ensure `onOpenChange` updates state
- Check if async operations are blocking
- Verify no errors in action handlers

### Wrong breakpoint behavior

- Breakpoint is 768px (md)
- Test with browser DevTools responsive mode
- Check `useMediaQuery` hook is working

### Content overflow

- Use `ScrollArea` for long content
- Set `max-h-[85vh]` on ResponsiveDialogContent
- Test with various content heights

### Buttons not working on mobile

- Ensure buttons are wrapped in DialogFooter
- Check touch target sizes (min 44x44px)
- Verify no z-index conflicts

## Support

For questions or issues:

1. Check full documentation in `.md` files
2. Review examples in codebase
3. Test in browser DevTools
4. Verify breakpoint detection
