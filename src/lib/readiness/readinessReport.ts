/**
 * Readiness Gate — **נגזר מתוצאות ריצה אמיתיות**, לא מקבועים.
 *
 * הכלל היחיד שחשוב כאן: `true` פירושו "היכולת הזו הורצה והצליחה". כל דבר אחר —
 * ראיה חסרה, ריצה שלא בוצעה, יכולת שנכשלה — הוא `false`. אין ברירת מחדל אופטימית.
 *
 * לכן הפונקציה `buildReadinessReport` היא **טהורה**: היא רק גוזרת. את הראיות
 * מייצרת `runReadinessAudit` שמריצה את היכולות בפועל.
 *
 * ראה ADR-0036.
 */
import { LOCAL_SCHEMA_VERSION, STORAGE_MODULES, type LocalSchemaState } from "@/lib/storage";
import type { ImportReport } from "@/lib/migration";

export interface ReadinessChecks {
  all_writes_report_status: boolean;
  all_write_failures_visible: boolean;
  local_schema_version: boolean;
  migration_snapshot: boolean;
  migration_rollback: boolean;
  future_version_blocked: boolean;
  export: boolean;
  restore: boolean;
  round_trip: boolean;
  idempotent_import: boolean;
  stable_ids: boolean;
  integrity_validation: boolean;
  fake_supabase_rehearsal: boolean;
  ownership_mapping: boolean;
  dependency_order: boolean;
  conflict_detection: boolean;
}

export interface ReadinessReport {
  ready_for_single_device_use: boolean;
  ready_for_future_supabase_migration_contract: boolean;
  checks: ReadinessChecks;
}

/** ראיות שנאספו מהרצה אמיתית של שכבת האחסון המקומית. */
export interface LocalCapabilityEvidence {
  /** שמות המודולים שנצפו בפועל ב-registry לאחר כתיבה. */
  modulesReportingWrites: string[];
  /** האם `getWorstStorageStatus` הסלים כשמודול אחד נכשל. */
  worstStatusEscalates: boolean;
  /** ה-role שהתקבל בפועל מלוגיקת ההתראה, לכל מצב. */
  noticeRoleForSaved: "alert" | "status" | null;
  noticeRoleForMemoryOnly: "alert" | "status" | null;
  noticeRoleForFailed: "alert" | "status" | null;
  schemaState: LocalSchemaState;
  schemaVersion: string;
  snapshotVerified: boolean;
  rollbackRestoredExactly: boolean;
  futureVersionBlocked: boolean;
  exportValidated: boolean;
  restoreApplied: boolean;
  roundTripIdentical: boolean;
}

/** ראיות מהרצת ה-rehearsal — שני ייבואים רצופים של אותו קובץ. */
export interface RehearsalEvidence {
  first: ImportReport;
  second: ImportReport;
  /** ספירת רשומות בענן אחרי כל ייבוא — חייבת להיות זהה. */
  cloudRowsAfterFirst: number;
  cloudRowsAfterSecond: number;
}

/** ראיה שהמזהים העסקיים שרדו את ההגירה. */
export interface StableIdEvidence {
  checked: number;
  /** מזהים שהשתנו בין המקומי לענן. חייב להיות 0. */
  changed: number;
}

/** ראיה שקונפליקט זוהה ולא נדרס. */
export interface ConflictEvidence {
  detected: number;
  /** רשומות שנדרסו בפועל למרות קונפליקט. חייב להיות 0. */
  overwritten: number;
}

export interface ReadinessEvidence {
  local: LocalCapabilityEvidence | null;
  rehearsal: RehearsalEvidence | null;
  stableIds: StableIdEvidence | null;
  conflicts: ConflictEvidence | null;
}

/** ראיות ריקות — כל הבדיקות `false`. משמש כברירת מחדל בטוחה. */
export const NO_EVIDENCE: ReadinessEvidence = {
  local: null,
  rehearsal: null,
  stableIds: null,
  conflicts: null,
};

function deriveIdempotent(rehearsal: RehearsalEvidence | null): boolean {
  if (!rehearsal) return false;
  const { first, second, cloudRowsAfterFirst, cloudRowsAfterSecond } = rehearsal;
  if (!first.ok || !second.ok) return false;
  // הייבוא השני אינו יוצר דבר, אינו מתנגש ואינו נדחה.
  if (second.inserted !== 0 || second.conflicts !== 0 || second.rejected !== 0) return false;
  // וכל מה שנכתב בראשון מדווח כ"ללא שינוי" בשני.
  if (second.unchanged !== first.inserted) return false;
  return cloudRowsAfterFirst === cloudRowsAfterSecond && cloudRowsAfterFirst > 0;
}

function deriveOwnership(rehearsal: RehearsalEvidence | null): boolean {
  if (!rehearsal) return false;
  const o = rehearsal.first.ownership;
  if (o.authenticated_user_id.length === 0) return false;
  if (o.user_owned_rows === 0) return false;
  if (o.rows_with_foreign_owner !== 0) return false;
  return o.rows_with_authenticated_owner === o.user_owned_rows;
}

function deriveDependencyOrder(rehearsal: RehearsalEvidence | null): boolean {
  if (!rehearsal) return false;
  const { first } = rehearsal;
  if (first.dependency_order.length === 0) return false;
  return first.dependency_order_respected && first.dependency_failures.length === 0;
}

function deriveRehearsal(rehearsal: RehearsalEvidence | null): boolean {
  if (!rehearsal) return false;
  const { first, second } = rehearsal;
  return (
    first.ok &&
    second.ok &&
    first.rejected === 0 &&
    first.inserted > 0 &&
    first.validation.ok &&
    first.integrity_checksum_matches &&
    first.unsupported_entities.length === 0
  );
}

/**
 * גוזר את דוח המוכנות מהראיות. **פונקציה טהורה — אינה מריצה דבר.**
 * ראיה חסרה = `false`, תמיד.
 */
export function buildReadinessReport(evidence: ReadinessEvidence): ReadinessReport {
  const local = evidence.local;

  const checks: ReadinessChecks = {
    all_writes_report_status:
      local !== null &&
      STORAGE_MODULES.every((m) => local.modulesReportingWrites.includes(m)) &&
      local.modulesReportingWrites.length >= STORAGE_MODULES.length,

    all_write_failures_visible:
      local !== null &&
      local.worstStatusEscalates &&
      local.noticeRoleForSaved === null &&
      local.noticeRoleForMemoryOnly === "status" &&
      local.noticeRoleForFailed === "alert",

    local_schema_version:
      local !== null && local.schemaState === "current" && local.schemaVersion === LOCAL_SCHEMA_VERSION,

    migration_snapshot: local?.snapshotVerified === true,
    migration_rollback: local?.rollbackRestoredExactly === true,
    future_version_blocked: local?.futureVersionBlocked === true,

    export: local?.exportValidated === true,
    restore: local?.restoreApplied === true,
    round_trip: local?.roundTripIdentical === true,

    integrity_validation:
      local?.exportValidated === true &&
      evidence.rehearsal !== null &&
      evidence.rehearsal.first.integrity_checksum_matches &&
      evidence.rehearsal.first.integrity_total_records_matches &&
      evidence.rehearsal.first.validation.ok,

    idempotent_import: deriveIdempotent(evidence.rehearsal),

    stable_ids:
      evidence.stableIds !== null &&
      evidence.stableIds.checked > 0 &&
      evidence.stableIds.changed === 0,

    fake_supabase_rehearsal: deriveRehearsal(evidence.rehearsal),
    ownership_mapping: deriveOwnership(evidence.rehearsal),
    dependency_order: deriveDependencyOrder(evidence.rehearsal),

    conflict_detection:
      evidence.conflicts !== null &&
      evidence.conflicts.detected > 0 &&
      evidence.conflicts.overwritten === 0,
  };

  const ready_for_single_device_use =
    checks.all_writes_report_status &&
    checks.all_write_failures_visible &&
    checks.local_schema_version &&
    checks.migration_snapshot &&
    checks.migration_rollback &&
    checks.future_version_blocked &&
    checks.export &&
    checks.restore &&
    checks.round_trip &&
    checks.integrity_validation;

  const ready_for_future_supabase_migration_contract =
    ready_for_single_device_use &&
    checks.stable_ids &&
    checks.idempotent_import &&
    checks.dependency_order &&
    checks.ownership_mapping &&
    checks.conflict_detection &&
    checks.fake_supabase_rehearsal;

  return {
    ready_for_single_device_use,
    ready_for_future_supabase_migration_contract,
    checks,
  };
}
