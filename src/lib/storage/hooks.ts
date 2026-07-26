/**
 * Hooks של שכבת האחסון — הגישה **היחידה** של ה-UI למצב ההתמדה.
 * אין קריאה ישירה ל-`localStorage` מרכיבי UI.
 */
import { useSyncExternalStore } from "react";
import {
  getWorstStorageStatus,
  subscribeStorageStatus,
  type StorageWriteResult,
} from "./safeStorage";

/** snapshot קבוע ל-SSR: בשרת לא בוצעה כתיבה, ולכן אין מה להזהיר עליו. */
const SERVER_SNAPSHOT: StorageWriteResult = Object.freeze({
  status: "saved",
  reason: null,
  message: null,
});

/**
 * המצב הגרוע ביותר מבין כל מודולי האחסון.
 * `saved` → הכול נשמר · `memory_only` → לא ישרוד רענון · `failed` → לא נשמר כלל.
 */
export function useWorstStorageStatus(): StorageWriteResult {
  return useSyncExternalStore(
    subscribeStorageStatus,
    getWorstStorageStatus,
    () => SERVER_SNAPSHOT,
  );
}
