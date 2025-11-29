# Responsive Dialog Implementation Plan

## Objective
Replace all dialog boxes in the frontend app with a responsive version that uses Dialog on desktop and Drawer on mobile, following the Credenza pattern.

## Overview
We currently have **21 dialog/modal components** throughout the app:
- **10 Dialog** instances (forms and data entry)
- **10 AlertDialog** instances (confirmations)
- **1 Sheet** instance (bulk import side drawer)

## Implementation Strategy

### Phase 1: Create Base Components (Foundation)

#### 1.1 Create `useMediaQuery` Hook
**File**: `packages/app/src/hooks/use-media-query.ts`

Create a hook that detects screen size at the 768px breakpoint:
```typescript
export function useMediaQuery(query: string): boolean {
  // Implementation to detect media query match
  // Returns true/false based on viewport size
}
```

#### 1.2 Create `ResponsiveDialog` Component
**File**: `packages/app/src/components/ui/responsive-dialog.tsx`

Create the main responsive dialog component that:
- Uses `useMediaQuery` to detect desktop (≥768px) vs mobile (<768px)
- Conditionally renders AnimateUI Dialog or shadcn Drawer
- Provides unified API for both modes

**Subcomponents to create:**
- `ResponsiveDialog` (root)
- `ResponsiveDialogTrigger`
- `ResponsiveDialogContent`
- `ResponsiveDialogHeader`
- `ResponsiveDialogTitle`
- `ResponsiveDialogDescription`
- `ResponsiveDialogFooter`
- `ResponsiveDialogClose`

#### 1.3 Create `ResponsiveAlertDialog` Component
**File**: `packages/app/src/components/ui/responsive-alert-dialog.tsx`

Create a specialized version for confirmation dialogs that:
- Extends `ResponsiveDialog` with alert-specific styling
- Provides `AlertDialogAction` and `AlertDialogCancel` components
- Maintains consistent confirm/cancel button patterns

**Subcomponents to create:**
- `ResponsiveAlertDialog` (root)
- `ResponsiveAlertDialogContent`
- `ResponsiveAlertDialogHeader`
- `ResponsiveAlertDialogTitle`
- `ResponsiveAlertDialogDescription`
- `ResponsiveAlertDialogFooter`
- `ResponsiveAlertDialogAction`
- `ResponsiveAlertDialogCancel`

### Phase 2: Install shadcn Drawer Component

#### 2.1 Add Drawer Dependency
**Command**: `npx shadcn@latest add drawer`

This will:
- Install the `vaul` package (drawer primitive)
- Create `packages/app/src/components/ui/drawer.tsx`
- Add necessary dependencies to package.json

#### 2.2 Verify Drawer Installation
- Check that drawer component is created
- Test basic drawer functionality
- Ensure it follows the same styling patterns as other UI components

### Phase 3: Migration - Form Dialogs (10 instances)

Migrate each Dialog instance to ResponsiveDialog:

#### 3.1 Import Preview Dialog
**File**: `packages/app/src/components/app/import-preview-dialog.tsx:225-507`
- Replace Dialog imports with ResponsiveDialog
- Update component usage
- Test import flow on mobile and desktop

#### 3.2 Category Edit Dialog
**File**: `packages/app/src/routes/app/categories.tsx:341-403`
- Replace Dialog with ResponsiveDialog
- Verify color picker works in drawer mode
- Test on mobile devices

#### 3.3 Create Feed Dialog (from Categories)
**File**: `packages/app/src/routes/app/categories.tsx:436-512`
- Replace Dialog with ResponsiveDialog
- Ensure form validation works in both modes

#### 3.4 Admin Users - Change Plan Dialog
**File**: `packages/app/src/routes/app/admin/users.tsx:479-524`
- Replace Dialog with ResponsiveDialog
- Test dropdown/select behavior in drawer

#### 3.5 Admin Users - Custom Limits Dialog
**File**: `packages/app/src/routes/app/admin/users.tsx:527-610`
- Replace Dialog with ResponsiveDialog
- Test number inputs in drawer mode

#### 3.6 Admin Plans - Create Plan Dialog
**File**: `packages/app/src/routes/app/admin/plans.tsx:322-501`
- Replace Dialog with ResponsiveDialog
- Handle large form in drawer mode
- Ensure scrolling works properly

#### 3.7 Admin Plans - Edit Plan Dialog
**File**: `packages/app/src/routes/app/admin/plans.tsx:504-654`
- Replace Dialog with ResponsiveDialog
- Test form editing in drawer mode

#### 3.8 Admin Blocked Domains - Add Domain Dialog
**File**: `packages/app/src/routes/app/admin/blocked-domains.tsx:630-694`
- Replace Dialog with ResponsiveDialog
- Test textarea behavior in drawer

#### 3.9 Admin Blocked Domains - Edit Domain Dialog
**File**: `packages/app/src/routes/app/admin/blocked-domains.tsx:697-766`
- Replace Dialog with ResponsiveDialog

#### 3.10 Admin Blocked Domains - Bulk Import Sheet
**File**: `packages/app/src/routes/app/admin/blocked-domains.tsx:769-848`
- **Special case**: Already uses Sheet component
- Evaluate if we should:
  - Keep as Sheet (side drawer makes sense for bulk import)
  - OR replace with ResponsiveDialog for consistency
- Decision needed from user

### Phase 4: Migration - Alert Dialogs (10 instances)

Migrate each AlertDialog instance to ResponsiveAlertDialog:

#### 4.1 Subscription Delete Confirmation
**File**: `packages/app/src/routes/app/subscriptions.tsx:1211-1227`
- Replace AlertDialog with ResponsiveAlertDialog
- Test confirmation flow on mobile

#### 4.2 Article Mark All Read Confirmation
**File**: `packages/app/src/routes/app/articles.tsx:578-593`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.3 Article Mark Old Read Confirmation
**File**: `packages/app/src/routes/app/articles.tsx:596-612`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.4 Category Delete Confirmation
**File**: `packages/app/src/routes/app/categories.tsx:406-433`
- Replace AlertDialog with ResponsiveAlertDialog
- Test with warning message for associated feeds

#### 4.5 Feed Delete Confirmation
**File**: `packages/app/src/routes/app/feeds.tsx:328-344`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.6 Settings Logout Confirmation
**File**: `packages/app/src/routes/app/settings.tsx:460-476`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.7 Admin Users - Ban/Unban Confirmation
**File**: `packages/app/src/routes/app/admin/users.tsx:413-448`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.8 Admin Users - Delete User Confirmation
**File**: `packages/app/src/routes/app/admin/users.tsx:451-476`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.9 Admin Plans - Delete Plan Confirmation
**File**: `packages/app/src/routes/app/admin/plans.tsx:657-681`
- Replace AlertDialog with ResponsiveAlertDialog

#### 4.10 Admin Blocked Domains - Delete Confirmation
**File**: `packages/app/src/routes/app/admin/blocked-domains.tsx:851-895`
- Replace AlertDialog with ResponsiveAlertDialog
- Test bulk delete confirmation

#### 4.11 Nav User - Logout Confirmation
**File**: `packages/app/src/components/app/nav-user.tsx:164-179`
- Replace AlertDialog with ResponsiveAlertDialog

### Phase 5: Testing & Refinement

#### 5.1 Visual Testing
- Test all dialogs on desktop (≥768px)
- Test all dialogs on mobile (<768px)
- Verify animations are smooth
- Check drawer slide-up behavior on mobile

#### 5.2 Accessibility Testing
- Verify keyboard navigation works
- Test screen reader compatibility
- Ensure focus trapping works in both modes
- Test escape key to close

#### 5.3 Edge Case Testing
- Test with very long content (scrolling)
- Test with forms and validation
- Test nested dialogs (if any exist)
- Test rapid open/close cycles

#### 5.4 Performance Testing
- Check for unnecessary re-renders
- Verify media query changes are performant
- Test on lower-end devices

### Phase 6: Cleanup & Documentation

#### 6.1 Remove Old Imports
- Search for any remaining direct imports of Dialog/AlertDialog
- Ensure all instances use ResponsiveDialog variants

#### 6.2 Update Component Documentation
- Document ResponsiveDialog API
- Provide usage examples
- Document differences between desktop and mobile behavior

#### 6.3 Update Storybook (if applicable)
- Add stories for ResponsiveDialog
- Show desktop and mobile variants
- Demonstrate different content types

## Technical Considerations

### Dialog vs Drawer Differences

**Animation Direction:**
- Dialog: Animates from top (default) with `from` prop support
- Drawer: Animates from bottom (drawer pattern)

**Close Button:**
- Dialog: X button in top-right by default
- Drawer: Pull-to-close handle at top, optional close button

**Width/Height:**
- Dialog: Centered with max-width constraints
- Drawer: Full width, height based on content

**Overlay:**
- Dialog: Full-screen backdrop
- Drawer: Full-screen backdrop with blur

### Component Mapping

| AnimateUI Dialog | shadcn Drawer | Responsive Component |
|------------------|---------------|----------------------|
| Dialog | Drawer | ResponsiveDialog |
| DialogTrigger | DrawerTrigger | ResponsiveDialogTrigger |
| DialogContent | DrawerContent | ResponsiveDialogContent |
| DialogHeader | DrawerHeader | ResponsiveDialogHeader |
| DialogTitle | DrawerTitle | ResponsiveDialogTitle |
| DialogDescription | DrawerDescription | ResponsiveDialogDescription |
| DialogFooter | DrawerFooter | ResponsiveDialogFooter |
| DialogClose | DrawerClose | ResponsiveDialogClose |

### Props Normalization

Both components support:
- `open`: boolean (controlled state)
- `onOpenChange`: (open: boolean) => void
- Standard React props for subcomponents

Need to handle:
- Dialog-specific props (e.g., `showCloseButton`, `from`, `transition`)
- Drawer-specific props (e.g., snap points, drag behavior)

## Risk Assessment

**Low Risk:**
- Creating base components
- Installing dependencies
- Migrating confirmation dialogs (simple structure)

**Medium Risk:**
- Complex form dialogs with multiple inputs
- Dialogs with custom styling
- Ensuring consistent behavior across breakpoints

**High Risk:**
- Bulk import sheet (complex UI with progress indicators)
- Import preview dialog (large, complex with category selection)
- Ensuring accessibility is maintained

## Success Criteria

1. ✅ All dialogs work on desktop (≥768px) as Dialog
2. ✅ All dialogs work on mobile (<768px) as Drawer
3. ✅ Smooth animations in both modes
4. ✅ No visual regressions
5. ✅ Accessibility maintained (keyboard, screen reader)
6. ✅ No TypeScript errors
7. ✅ Tests pass (if applicable)
8. ✅ User experience feels native on both desktop and mobile

## Timeline Estimate

- **Phase 1**: 4-6 hours (base component creation)
- **Phase 2**: 1 hour (dependency installation)
- **Phase 3**: 8-10 hours (10 dialog migrations)
- **Phase 4**: 6-8 hours (10 alert dialog migrations)
- **Phase 5**: 4-6 hours (testing)
- **Phase 6**: 2-3 hours (cleanup)

**Total**: ~25-34 hours

## Next Steps

1. Review this plan with user
2. Get approval on approach
3. Decide on bulk import sheet handling
4. Begin Phase 1 implementation
