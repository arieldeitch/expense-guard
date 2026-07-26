/**
 * הטקסט והחומרה של ההתראה הגלובלית על אחסון מקומי.
 *
 * מופרד מהרכיב במכוון: הבחירה "מה מציגים ובאיזו חומרה" היא לוגיקה טהורה
 * שניתן לבדוק בלי render, והרכיב נשאר קובץ שמייצא רק component.
 */
import type { StorageWriteStatus } from "@/lib/storage/safeStorage";

export const MEMORY_ONLY_MESSAGE = "חלק מהשינויים לא נשמרו בדפדפן ועלולים להיעלם לאחר רענון.";
export const FAILED_MESSAGE = "השמירה נכשלה. הורד גיבוי לפני רענון או סגירת הדפדפן.";

export interface StorageNotice {
  /** `alert` = הפסד נתונים ודאי · `status` = סיכון לאובדן לאחר רענון. */
  role: "alert" | "status";
  /** כותרת מילולית — כדי שהחומרה לא תסומן בצבע בלבד. */
  title: string;
  message: string;
}

/**
 * בוחר התראה אחת בלבד, לפי חומרה יורדת. שתי התראות במקביל היו מטשטשות את
 * הפעולה הנדרשת; המצב החמור ביותר הוא זה שקובע מה המשתמש צריך לעשות עכשיו.
 */
export function pickStorageNotice(worstStatus: StorageWriteStatus): StorageNotice | null {
  if (worstStatus === "failed") {
    return { role: "alert", title: "שגיאת שמירה", message: FAILED_MESSAGE };
  }
  if (worstStatus === "memory_only") {
    return { role: "status", title: "אזהרת שמירה", message: MEMORY_ONLY_MESSAGE };
  }
  return null;
}
