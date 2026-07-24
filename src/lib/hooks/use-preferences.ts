/**
 * usePreferences — קורא/כותב preferences עם reactive updates.
 */
import { useSyncExternalStore, useCallback } from "react";
import {
  readPreferences,
  subscribePreferences,
  writePreferences,
  type Preferences,
} from "@/lib/preferences";

export function usePreferences(): {
  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;
} {
  const preferences = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    readPreferences,
  );
  const setPreferences = useCallback((patch: Partial<Preferences>) => {
    writePreferences(patch);
  }, []);
  return { preferences, setPreferences };
}
