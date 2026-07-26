/**
 * GlobalStorageBanner — ההתראה הגלובלית על מצב האחסון המקומי.
 *
 * מוצג ברמת ה-root ולכן חל על **כל** המסכים, לא רק על מסך האימון. מקור הנתונים
 * הוא `getWorstStorageStatus()` — המצב הגרוע ביותר מבין תשעת מודולי האחסון — ולכן
 * כשל כתיבה בכל מודול (catalog, home, templates, goals, runs, preferences ...)
 * גלוי למשתמש. כתיבה מוצלחת אחרי כשל מסירה את ההתראה אוטומטית.
 *
 * החלטות מכוונות:
 * - **לא Toast.** אין הודעה בכל שינוי; זהו banner מתמשך שנעלם רק כשהמצב תקין.
 * - **צבע אינו הסמן היחיד** — אייקון + כותרת מילולית + טקסט עובדתי.
 * - `memory_only` → `role="status"` · `failed` → `role="alert"`.
 * - **אין קריאה ישירה ל-localStorage מכאן** — הכול דרך `@/lib/storage`.
 *
 * ראה ADR-0032.
 */
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import { useWorstStorageStatus } from "@/lib/storage/hooks";
import { pickStorageNotice } from "./storageNotice";

export function GlobalStorageBanner() {
  const worst = useWorstStorageStatus();

  const notice = pickStorageNotice(worst.status);
  if (!notice) return null;

  const isAlert = notice.role === "alert";
  const Icon = isAlert ? AlertTriangle : Info;

  return (
    <div
      dir="rtl"
      role={notice.role}
      aria-live={isAlert ? "assertive" : "polite"}
      className={
        isAlert
          ? "border-b-2 border-destructive bg-destructive/15 px-4 py-2 text-destructive"
          : "border-b-2 border-warning bg-warning/15 px-4 py-2 text-warning"
      }
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-start gap-x-2 gap-y-1 text-xs font-bold">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span className="shrink-0">{notice.title}:</span>
        <span className="min-w-0 flex-1 font-medium">{notice.message}</span>
        <Link to="/backup" className="shrink-0 underline underline-offset-4 hover:no-underline">
          גיבוי ושחזור
        </Link>
      </div>
    </div>
  );
}
