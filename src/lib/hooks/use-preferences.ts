/**
 * usePreferences — קורא/כותב preferences עם reactive updates.
 */
import { useSyncExternalStore, useCallback } from "react";
import {
  readPreferences,
  readPreferencesServerSnapshot,
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
    readPreferencesServerSnapshot,
  );
  const setPreferences = useCallback((patch: Partial<Preferences>) => {
    writePreferences(patch);
  }, []);
  return { preferences, setPreferences };
}
