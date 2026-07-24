/**
 * Strength Sessions (skeleton) — נוצר כאשר משתמש מפעיל "התחל אימון" מתבנית.
 * שומר snapshot מלא ובלתי משתנה של התבנית ברגע ההתחלה, כדי שלא יושפע מעריכות עתידיות.
 * מסך הביצוע עצמו לא נבנה עדיין; כרגע session נוצר במצב "in_progress" ומופיע מסך מעבר.
 */
import type { WorkoutTemplateSnapshot } from "@/lib/templates";

export type SessionStatus = "in_progress" | "paused" | "completed" | "cancelled";

export interface StrengthSession {
  id: string;
  owner_id: string;
  template_id: string | null;
  template_version: number | null;
  snapshot: WorkoutTemplateSnapshot | null;
  location_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
