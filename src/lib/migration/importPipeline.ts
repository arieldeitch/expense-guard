/**
 * Import pipeline — parse → validate → normalize → map → graph → sort → ops → execute.
 *
 * ה-pipeline **נפרד מה-repository**: הוא מייצר רשימת פעולות דטרמיניסטית, וה-repository
 * רק מבצע אותן. כך אפשר לבדוק את הסדר, את ה-payload ואת ההחלטות בלי להריץ כתיבה.
 *
 * החוזה שנאכף כאן:
 * - **record identity** מגיעה מהקובץ ואינה משתנה לעולם.
 * - **cloud ownership** מגיעה **אך ורק** מ-`authenticatedUserId`.
 * - **source metadata** (ה-`owner_id`/`user_id` שבקובץ) נשמר לתיעוד ואינו סמכות הרשאה.
 *
 * ראה `docs/ai/LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` ו-ADR-0034/0035.
 */
import { BACKUP_FORMAT, validateBackup, type BackupEnvelope, type ValidationReport } from "@/lib/backup";
import { checksumOf } from "@/lib/storage/checksum";
import {
  CLOUD_ENTITIES,
  LOCAL_ONLY_COLLECTIONS,
  topologicalImportOrder,
  type CloudEntityDef,
} from "./cloudSchema";
import {
  InMemoryCloudRepository,
  type CloudRow,
  type ParentRequirement,
  type UpsertOutcome,
} from "./inMemoryCloudRepository";

export type OperationResult = UpsertOutcome | "rejected";

export interface ImportOperation {
  /** דטרמיניסטי — נגזר מהטבלה ומהמפתח היציב, לא ממונה רץ. */
  operation_id: string;
  entity_type: string;
  entity_id: string;
  action: "upsert";
  parent_dependencies: ParentRequirement[];
  /** ה-payload שנשלח לענן — מנוקה מסודות ומ-ownership סמכותי מהקובץ. */
  payload: CloudRow;
  result: OperationResult;
  rejection_reason: string | null;
}

export interface DependencyFailure {
  table: string;
  id: string;
  field: string;
  missing_table: string;
  missing_id: string;
}

export interface ConflictDetail {
  entity_type: string;
  entity_id: string;
  fields: string[];
}

export interface EntityCounts {
  total: number;
  inserted: number;
  unchanged: number;
  conflicts: number;
  rejected: number;
}

export interface OwnershipSummary {
  authenticated_user_id: string;
  /** רשומות בבעלות משתמש שנכתבו/נבחנו. */
  user_owned_rows: number;
  /** מתוכן — כמה קיבלו בפועל את ה-user המאומת. */
  rows_with_authenticated_owner: number;
  /** רשומות שבהן נשאר owner זר כסמכות. חייב להיות 0. */
  rows_with_foreign_owner: number;
  /** רשומות taxonomy מערכתיות שלא קיבלו בעלות משתמש. */
  system_rows: number;
  /** ערכי ה-owner שהופיעו בקובץ ונדחו כסמכות. */
  ignored_source_owners: string[];
}

export interface ImportReport {
  ok: boolean;
  authenticated_user_id: string;
  validation: ValidationReport;
  /** האם ה-checksum שבמעטפת תואם לתוכן בפועל. */
  integrity_checksum_matches: boolean;
  integrity_total_records_matches: boolean;
  /** סדר הטבלאות שחושב טופולוגית. */
  dependency_order: string[];
  /** האם כל הורה אכן נכתב לפני הילד שלו ברשימת הפעולות. */
  dependency_order_respected: boolean;
  total_operations: number;
  inserted: number;
  unchanged: number;
  conflicts: number;
  rejected: number;
  per_entity: Record<string, EntityCounts>;
  dependency_failures: DependencyFailure[];
  conflict_details: ConflictDetail[];
  /** אוספים שנמצאו בקובץ ואין להם ייצוג בענן — מדווחים, לא נבלעים. */
  unsupported_entities: string[];
  ownership: OwnershipSummary;
  operations: ImportOperation[];
}

/** שדות שלעולם אינם עוברים לענן — סודות, אסימונים ומפתחות שירות. */
const FORBIDDEN_FIELD_PATTERN =
  /(^|_)(token|secret|password|passwd|api_?key|access_?key|service_?role|session_?token|bearer|credential)s?($|_)/i;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function collectionRows(entities: Record<string, unknown>, def: CloudEntityDef): CloudRow[] {
  const state = entities[def.module];
  if (!isRecord(state)) return [];
  const value = state[def.collection];
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

/** מזהה כל אוסף-מערך בקובץ, כדי לדעת מה אין לו mapping. */
function allCollectionKeys(entities: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const [module, state] of Object.entries(entities)) {
    if (!isRecord(state)) continue;
    for (const [key, value] of Object.entries(state)) {
      if (Array.isArray(value)) out.push(`${module}.${key}`);
    }
  }
  return out.sort();
}

/**
 * מסיר שדות אסורים ואת שדה הבעלות המקומי מגוף הרשומה.
 * ה-ownership נקבע בנפרד — לעולם לא מועתק מהקובץ.
 */
function sanitizePayload(row: CloudRow, def: CloudEntityDef): CloudRow {
  const out: CloudRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) continue;
    if (def.sourceOwnerField && key === def.sourceOwnerField) continue;
    out[key] = value;
  }
  return out;
}

/** האם הרשומה היא taxonomy מערכתי (ולכן אינה מקבלת בעלות משתמש). */
function isSystemRow(row: CloudRow, def: CloudEntityDef): boolean {
  if (def.ownership !== "system_taxonomy") return false;
  if (!def.systemFlagField) return false;
  return row[def.systemFlagField] === true;
}

/**
 * ממיין רשומות בתוך טבלה באופן דטרמיניסטי: לפי שדה הסדר (אם קיים) ואז לפי
 * המפתח היציב. כך אותו קובץ מייצר תמיד את אותה רשימת פעולות.
 */
function sortRows(rows: CloudRow[], def: CloudEntityDef): CloudRow[] {
  return [...rows].sort((a, b) => {
    if (def.orderField) {
      const av = a[def.orderField];
      const bv = b[def.orderField];
      if (typeof av === "number" && typeof bv === "number" && av !== bv) return av - bv;
    }
    return String(a[def.primaryKey] ?? "").localeCompare(String(b[def.primaryKey] ?? ""));
  });
}

export interface RunImportOptions {
  repo: InMemoryCloudRepository;
  /** הבעלים בענן. **מקור הסמכות היחיד לבעלות.** */
  authenticatedUserId: string;
}

/**
 * מריץ את ה-pipeline המלא. אינו נוגע ב-localStorage ואינו מבצע רשת.
 */
export function runCloudImport(input: unknown, options: RunImportOptions): ImportReport {
  const { repo, authenticatedUserId } = options;

  // (1) parse — מקבל אובייקט או מחרוזת JSON.
  let parsed: unknown = input;
  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = null;
    }
  }

  // (2) validate — פורמט, גרסה, מזהים כפולים, הפניות שבורות.
  const validation = validateBackup(parsed);
  const envelope = parsed as BackupEnvelope | null;

  const entities: Record<string, unknown> =
    envelope && isRecord(envelope.entities) ? envelope.entities : {};

  // (2b) integrity — ה-checksum המוצהר מול התוכן בפועל.
  const declaredChecksum = envelope?.metadata?.integrity?.checksum ?? null;
  const integrity_checksum_matches =
    typeof declaredChecksum === "string" && declaredChecksum === checksumOf(entities);
  const declaredTotal = envelope?.metadata?.integrity?.total_records ?? null;

  const dependency_order = topologicalImportOrder();
  const emptyOwnership: OwnershipSummary = {
    authenticated_user_id: authenticatedUserId,
    user_owned_rows: 0,
    rows_with_authenticated_owner: 0,
    rows_with_foreign_owner: 0,
    system_rows: 0,
    ignored_source_owners: [],
  };

  /** קובץ שלא עבר אימות **אינו נכתב כלל** — אף פעולה אינה מבוצעת. */
  const rejectWholeFile = (): ImportReport => ({
    ok: false,
    authenticated_user_id: authenticatedUserId,
    validation,
    integrity_checksum_matches,
    integrity_total_records_matches: false,
    dependency_order,
    dependency_order_respected: true,
    total_operations: 0,
    inserted: 0,
    unchanged: 0,
    conflicts: 0,
    rejected: 0,
    per_entity: {},
    dependency_failures: [],
    conflict_details: [],
    unsupported_entities: [],
    ownership: emptyOwnership,
    operations: [],
  });

  if (!envelope || envelope.format !== BACKUP_FORMAT || !validation.ok) return rejectWholeFile();
  if (!integrity_checksum_matches) return rejectWholeFile();

  // (3) normalize — מעבר JSON מבטיח שמה שממופה הוא בדיוק מה שניתן להעביר.
  const normalized: Record<string, unknown> = JSON.parse(JSON.stringify(entities)) as Record<
    string,
    unknown
  >;

  // סה"כ הרשומות כפי שהאימות סופר אותן — להשוואה מול ה-total המוצהר במעטפת.
  const countedTotalRecords = Object.values(validation.entity_counts).reduce((a, b) => a + b, 0);

  // (4)+(5)+(6) map + graph + topological sort.
  const defByTable = new Map(CLOUD_ENTITIES.map((d) => [d.table, d]));
  const mappedCollections = new Set(CLOUD_ENTITIES.map((d) => `${d.module}.${d.collection}`));
  const unsupported_entities = allCollectionKeys(normalized).filter(
    (key) => !mappedCollections.has(key) && !LOCAL_ONLY_COLLECTIONS.includes(key),
  );

  // (7) generate deterministic operations, בסדר הטופולוגי.
  const operations: ImportOperation[] = [];
  const ownership: OwnershipSummary = { ...emptyOwnership, ignored_source_owners: [] };
  const ignoredOwners = new Set<string>();

  for (const table of dependency_order) {
    const def = defByTable.get(table);
    if (!def) continue;

    for (const row of sortRows(collectionRows(normalized, def), def)) {
      const rawId = row[def.primaryKey];
      if (typeof rawId !== "string" || rawId.length === 0) {
        operations.push({
          operation_id: `${table}#<missing-id>#${operations.length}`,
          entity_type: table,
          entity_id: "",
          action: "upsert",
          parent_dependencies: [],
          payload: {},
          result: "rejected",
          rejection_reason: `רשומה ללא ${def.primaryKey} יציב`,
        });
        continue;
      }

      const parent_dependencies: ParentRequirement[] = [];
      for (const parent of def.parents) {
        const value = row[parent.field];
        if (typeof value !== "string" || value.length === 0) continue; // FK ריק
        if (parent.table === table && value === rawId) continue; // self-reference
        parent_dependencies.push({ field: parent.field, table: parent.table, id: value });
      }

      // (4) ownership — אך ורק מהפרמטר המאומת.
      const payload = sanitizePayload(row, def);
      const system = isSystemRow(row, def);
      const sourceOwner = def.sourceOwnerField ? row[def.sourceOwnerField] : undefined;
      if (typeof sourceOwner === "string" && sourceOwner.length > 0) {
        ignoredOwners.add(sourceOwner);
        payload.source_metadata = { source_owner_id: sourceOwner };
      }

      if (system) {
        payload.user_id = null;
        payload.is_system = true;
        ownership.system_rows++;
      } else {
        payload.user_id = authenticatedUserId;
        ownership.user_owned_rows++;
        if (payload.user_id === authenticatedUserId) ownership.rows_with_authenticated_owner++;
        else ownership.rows_with_foreign_owner++;
      }

      operations.push({
        operation_id: `${table}#${rawId}`,
        entity_type: table,
        entity_id: rawId,
        action: "upsert",
        parent_dependencies,
        payload,
        result: "rejected",
        rejection_reason: null,
      });
    }
  }

  // (8) execute — הפעולות מבוצעות בדיוק בסדר שנוצר.
  const dependency_failures: DependencyFailure[] = [];
  const conflict_details: ConflictDetail[] = [];
  const per_entity: Record<string, EntityCounts> = {};
  const bump = (table: string, key: keyof EntityCounts) => {
    per_entity[table] ??= { total: 0, inserted: 0, unchanged: 0, conflicts: 0, rejected: 0 };
    per_entity[table][key]++;
  };

  for (const op of operations) {
    bump(op.entity_type, "total");

    if (op.rejection_reason !== null) {
      bump(op.entity_type, "rejected");
      continue;
    }

    const result = repo.upsert(op.entity_type, op.entity_id, op.payload, op.parent_dependencies);
    switch (result.outcome) {
      case "inserted":
        op.result = "inserted";
        bump(op.entity_type, "inserted");
        break;
      case "unchanged":
        op.result = "unchanged";
        bump(op.entity_type, "unchanged");
        break;
      case "conflict":
        op.result = "conflict";
        op.rejection_reason = "מזהה קיים עם תוכן שונה — לא נדרס";
        bump(op.entity_type, "conflicts");
        conflict_details.push({
          entity_type: op.entity_type,
          entity_id: op.entity_id,
          fields: result.conflictFields,
        });
        break;
      case "missing_parent":
        op.result = "rejected";
        op.rejection_reason = "הורה חסר";
        bump(op.entity_type, "rejected");
        for (const missing of result.missingParents) {
          dependency_failures.push({
            table: op.entity_type,
            id: op.entity_id,
            field: missing.field,
            missing_table: missing.table,
            missing_id: missing.id,
          });
        }
        break;
    }
  }

  // אימות מפורש: כל הורה מופיע ברשימת הפעולות **לפני** הילד שלו.
  const allOperationIds = new Set(operations.map((o) => o.operation_id));
  const seen = new Set<string>();
  let dependency_order_respected = true;
  for (const op of operations) {
    for (const parent of op.parent_dependencies) {
      const key = `${parent.table}#${parent.id}`;
      // הורה שאינו בקובץ כלל אינו מפר סדר — הוא מדווח כ-dependency failure.
      if (allOperationIds.has(key) && !seen.has(key)) dependency_order_respected = false;
    }
    seen.add(op.operation_id);
  }

  const inserted = operations.filter((o) => o.result === "inserted").length;
  const unchanged = operations.filter((o) => o.result === "unchanged").length;
  const conflicts = operations.filter((o) => o.result === "conflict").length;
  const rejected = operations.filter((o) => o.result === "rejected").length;

  return {
    ok: rejected === 0 && dependency_order_respected,
    authenticated_user_id: authenticatedUserId,
    validation,
    integrity_checksum_matches,
    integrity_total_records_matches:
      typeof declaredTotal === "number" && declaredTotal === countedTotalRecords,
    dependency_order,
    dependency_order_respected,
    total_operations: operations.length,
    inserted,
    unchanged,
    conflicts,
    rejected,
    per_entity,
    dependency_failures,
    conflict_details,
    unsupported_entities,
    ownership: { ...ownership, ignored_source_owners: [...ignoredOwners].sort() },
    operations,
  };
}
