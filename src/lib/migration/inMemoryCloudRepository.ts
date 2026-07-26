/**
 * InMemoryCloudRepository — דמה של שכבת הענן העתידית.
 *
 * **אין Supabase, אין SDK, אין SQL, אין רשת, אין localStorage, אין dependency.**
 * זהו מבנה נתונים דטרמיניסטי בזיכרון שמתנהג כמו טבלאות עם primary key יציב,
 * כדי שנוכל להוכיח שהנתונים המקומיים עומדים בחוזה ההגירה **לפני** שקיים ענן.
 *
 * מה הוא כן אוכף:
 * - כל טבלה היא מפה לפי **מפתח יציב**. אף פעם לא index של מערך.
 * - `upsert` של אותו id עם אותו תוכן = `unchanged` (no-op).
 * - `upsert` של אותו id עם תוכן שונה = `conflict`, **והרשומה הקיימת אינה משתנה**.
 * - הורה חסר = `missing_parent`, והרשומה **אינה נכתבת**.
 *
 * מה הוא לא: אינו מדמה RLS, Auth, FK constraints של מנוע אמיתי, טרנזקציות או רשת.
 * ראה ADR-0034.
 */
import { stableStringify } from "@/lib/storage/checksum";

export type CloudRow = Record<string, unknown>;

export type UpsertOutcome = "inserted" | "unchanged" | "conflict" | "missing_parent";

export interface ParentRequirement {
  /** השדה בילד שממנו נלקח המזהה. */
  field: string;
  table: string;
  id: string;
}

export interface MissingParent extends ParentRequirement {
  reason: "parent_row_not_found";
}

export interface UpsertResult {
  outcome: UpsertOutcome;
  table: string;
  id: string;
  /** שמות השדות שנבדלו — רק ב-`conflict`. */
  conflictFields: string[];
  /** הורים שלא נמצאו — רק ב-`missing_parent`. */
  missingParents: MissingParent[];
}

export interface RecordedOperation {
  /** מספר סידורי של הפעולה בריצה — לצורכי inspection בלבד, לא מזהה רשומה. */
  index: number;
  table: string;
  id: string;
  outcome: UpsertOutcome;
}

function fieldsThatDiffer(a: CloudRow, b: CloudRow): string[] {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  return keys.filter((k) => stableStringify(a[k]) !== stableStringify(b[k]));
}

export class InMemoryCloudRepository {
  /** table → (primary key → row). Map שומר סדר הכנסה, ולכן `list` דטרמיניסטי. */
  private readonly tablesByName = new Map<string, Map<string, CloudRow>>();
  private readonly ops: RecordedOperation[] = [];

  private tableOf(table: string): Map<string, CloudRow> {
    let rows = this.tablesByName.get(table);
    if (!rows) {
      rows = new Map<string, CloudRow>();
      this.tablesByName.set(table, rows);
    }
    return rows;
  }

  /**
   * כותב רשומה לפי מפתח יציב.
   *
   * מדיניות מחייבת: אין דריסה שקטה, אין יצירת מזהה חדש, אין כפילות.
   */
  upsert(table: string, id: string, row: CloudRow, parents: ParentRequirement[] = []): UpsertResult {
    const base: UpsertResult = {
      outcome: "inserted",
      table,
      id,
      conflictFields: [],
      missingParents: [],
    };

    const missing = parents
      .filter((p) => !this.has(p.table, p.id))
      .map<MissingParent>((p) => ({ ...p, reason: "parent_row_not_found" }));

    if (missing.length > 0) {
      // הרשומה **אינה נכתבת**: ילד ללא הורה אינו נתון תקין.
      this.ops.push({ index: this.ops.length, table, id, outcome: "missing_parent" });
      return { ...base, outcome: "missing_parent", missingParents: missing };
    }

    const rows = this.tableOf(table);
    const existing = rows.get(id);

    if (existing === undefined) {
      rows.set(id, row);
      this.ops.push({ index: this.ops.length, table, id, outcome: "inserted" });
      return base;
    }

    if (stableStringify(existing) === stableStringify(row)) {
      this.ops.push({ index: this.ops.length, table, id, outcome: "unchanged" });
      return { ...base, outcome: "unchanged" };
    }

    // קונפליקט — הרשומה הקיימת נשארת בדיוק כפי שהיא.
    this.ops.push({ index: this.ops.length, table, id, outcome: "conflict" });
    return { ...base, outcome: "conflict", conflictFields: fieldsThatDiffer(existing, row) };
  }

  has(table: string, id: string): boolean {
    return this.tablesByName.get(table)?.has(id) ?? false;
  }

  get(table: string, id: string): CloudRow | null {
    return this.tablesByName.get(table)?.get(id) ?? null;
  }

  list(table: string): CloudRow[] {
    return [...(this.tablesByName.get(table)?.values() ?? [])];
  }

  ids(table: string): string[] {
    return [...(this.tablesByName.get(table)?.keys() ?? [])];
  }

  count(table: string): number {
    return this.tablesByName.get(table)?.size ?? 0;
  }

  /** שמות הטבלאות שיש בהן לפחות רשומה אחת, ממוינים — דטרמיניסטי. */
  tables(): string[] {
    return [...this.tablesByName.keys()].filter((t) => this.count(t) > 0).sort();
  }

  totalRows(): number {
    let total = 0;
    for (const rows of this.tablesByName.values()) total += rows.size;
    return total;
  }

  /** inspection של כל הפעולות שבוצעו, לפי סדר ביצוען. */
  operations(): readonly RecordedOperation[] {
    return this.ops;
  }

  /** איפוס — **לצורכי בדיקה בלבד**. */
  reset(): void {
    this.tablesByName.clear();
    this.ops.length = 0;
  }
}
