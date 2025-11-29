import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * ResponsiveDialog - A responsive dialog component that uses Dialog on desktop and Drawer on mobile
 *
 * Usage:
 * ```tsx
 * <ResponsiveDialog open={open} onOpenChange={setOpen}>
 *   <ResponsiveDialogContent>
 *     <ResponsiveDialogHeader>
 *       <ResponsiveDialogTitle>Title</ResponsiveDialogTitle>
 *       <ResponsiveDialogDescription>Description</ResponsiveDialogDescription>
 *     </ResponsiveDialogHeader>
 *     <div>Content here</div>
 *     <ResponsiveDialogFooter>
 *       <Button>Action</Button>
 *     </ResponsiveDialogFooter>
 *   </ResponsiveDialogContent>
 * </ResponsiveDialog>
 * ```
 */

interface ResponsiveDialogContextValue {
  isDesktop: boolean;
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue>({
    isDesktop: true,
  });

function useResponsiveDialog() {
  const context = React.useContext(ResponsiveDialogContext);
  if (!context) {
    throw new Error("useResponsiveDialog must be used within ResponsiveDialog");
  }
  return context;
}

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const Component = isDesktop ? Dialog : Drawer;

  return (
    <ResponsiveDialogContext.Provider value={{ isDesktop }}>
      <Component open={open} onOpenChange={onOpenChange}>
        {children}
      </Component>
    </ResponsiveDialogContext.Provider>
  );
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

function ResponsiveDialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: ResponsiveDialogContentProps) {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogContent
        className={className}
        showCloseButton={showCloseButton}
        {...props}
      >
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={className} {...props}>
      {children}
    </DrawerContent>
  );
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveDialogHeader({
  children,
  className,
  ...props
}: ResponsiveDialogHeaderProps) {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogHeader className={className} {...props}>
        {children}
      </DialogHeader>
    );
  }

  return (
    <DrawerHeader className={className} {...props}>
      {children}
    </DrawerHeader>
  );
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveDialogTitle({
  children,
  className,
  ...props
}: ResponsiveDialogTitleProps) {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogTitle className={className} {...props}>
        {children}
      </DialogTitle>
    );
  }

  return (
    <DrawerTitle className={className} {...props}>
      {children}
    </DrawerTitle>
  );
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveDialogDescription({
  children,
  className,
  ...props
}: ResponsiveDialogDescriptionProps) {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogDescription className={className} {...props}>
        {children}
      </DialogDescription>
    );
  }

  return (
    <DrawerDescription className={className} {...props}>
      {children}
    </DrawerDescription>
  );
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveDialogFooter({
  children,
  className,
  ...props
}: ResponsiveDialogFooterProps) {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogFooter className={className} {...props}>
        {children}
      </DialogFooter>
    );
  }

  return (
    <DrawerFooter className={className} {...props}>
      {children}
    </DrawerFooter>
  );
}

interface ResponsiveDialogCloseProps {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

function ResponsiveDialogClose({
  children,
  className,
  asChild,
  ...props
}: ResponsiveDialogCloseProps) {
  const { isDesktop } = useResponsiveDialog();

  // For drawer, we use DrawerClose
  if (!isDesktop) {
    return (
      <DrawerClose className={className} asChild={asChild} {...props}>
        {children}
      </DrawerClose>
    );
  }

  // For dialog, if there are children, render them (they're likely a button)
  // Otherwise, the DialogContent will show the default close button
  if (children) {
    return (
      <button type="button" className={className} {...props}>
        {children}
      </button>
    );
  }

  return null;
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
};
