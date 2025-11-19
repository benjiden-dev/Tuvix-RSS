import { useEffect, useState, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface UseAutoSaveSettingsOptions<T> {
  settings: T | undefined;
  onSave: (settings: Partial<T>) => void;
  debounceMs?: number;
}

export function useAutoSaveSettings<T extends Record<string, unknown>>({
  settings,
  onSave,
  debounceMs = 500,
}: UseAutoSaveSettingsOptions<T>) {
  const [formData, setFormData] = useState<T | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSavedSnapshotRef = useRef<string | null>(null);

  // Load settings into form when they're fetched
  useEffect(() => {
    if (settings) {
      const settingsSnapshot = JSON.stringify(settings);

      // Only update formData if settings actually changed
      // This prevents updating formData when settings updates from our own save
      if (lastSavedSnapshotRef.current !== settingsSnapshot) {
        setFormData(settings);
        // Update the snapshot to match what we just loaded
        lastSavedSnapshotRef.current = settingsSnapshot;
      }

      // Mark initial load as complete after a short delay
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  // Debounce form data changes
  const debouncedFormData = useDebounce(formData, debounceMs);

  // Auto-save when debounced form data changes
  // Only depend on debouncedFormData to avoid multiple saves
  useEffect(() => {
    if (!settings || !debouncedFormData || isInitialLoad) return;

    // Check if any value actually changed from the loaded settings
    const hasChanges = Object.keys(debouncedFormData).some(
      (key) => debouncedFormData[key] !== settings[key],
    );

    if (hasChanges) {
      // Create a partial update object with only changed values
      const updates: Partial<T> = {};
      Object.keys(debouncedFormData).forEach((key) => {
        if (debouncedFormData[key] !== settings[key]) {
          updates[key as keyof T] = debouncedFormData[key];
        }
      });

      // Only save if there are actual updates
      if (Object.keys(updates).length > 0) {
        // Create snapshot of the full formData we're about to save
        // This prevents saving the same data twice if the effect runs multiple times
        const formDataSnapshot = JSON.stringify(debouncedFormData);

        // Only save if this is different from what we last saved
        if (lastSavedSnapshotRef.current !== formDataSnapshot) {
          lastSavedSnapshotRef.current = formDataSnapshot;
          onSave(updates);
        }
      }
    }
  }, [debouncedFormData, settings, isInitialLoad, onSave]);

  return {
    formData,
    setFormData,
    isInitialLoad,
  };
}
