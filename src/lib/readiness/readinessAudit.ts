/**
 * Readiness audit — **מריץ** את היכולות בפועל ומחזיר ראיות, לא הצהרות.
 *
 * ⚠️ **הרצה זו כותבת ל-localStorage** (snapshot, מיגרציה, ייבוא חוזר). היא מיועדת
 * לסביבת אימות מבודדת — חבילת הבדיקות — ולא לדפדפן של המשתמש. אף רכיב UI אינו
 * קורא לה. בסיום היא מחזירה את תשעת מפתחות האחסון למצבם המדויק שלפני ההרצה.
 *
 * כל שדה ב-`ReadinessEvidence` נובע מפעולה שבוצעה. יכולת שלא הורצה נשארת חסרה,
 * ולכן ה-gate שנגזר ממנה הוא `false`. ראה ADR-0036.
 */
import {
  BACKUP_SCHEMA_VERSION,
  buildBackup,
  importBackup,
  validateBackup,
  type BackupEnvelope,
} from "@/lib/backup";
import { checksumOf } from "@/lib/storage/checksum";
import {
  LOCAL_SCHEMA_VERSION,
  LOCAL_STORAGE_FORMAT,
  STORAGE_KEY_BY_MODULE,
  STORAGE_META_KEY,
  STORAGE_MODULES,
  createMigrationSnapshot,
  getStorageStatuses,
  getWorstStorageStatus,
  readLocalSchemaStatus,
  readMigrationSnapshot,
  readRawStorageKeys,
  reportWrite,
  rollbackFromSnapshot,
  runLocalMigrations,
  safeReadStorage,
  safeRemoveStorage,
  safeWriteRawStorage,
  verifyMigrationSnapshot,
  type RawStorageKeys,
} from "@/lib/storage";
import { pickStorageNotice } from "@/components/storage/storageNotice";
import { InMemoryCloudRepository, runCloudImport, CLOUD_ENTITIES } from "@/lib/migration";

import { readCatalogState, writeCatalogState, _resetCatalogStateForTests } from "@/lib/catalog/storage";
import {
  readExercisesState,
  writeExercisesState,
  _resetExercisesStateForTests,
} from "@/lib/exercises/storage";
import { readGoalsState, writeGoalsState, _resetGoalsStateForTests } from "@/lib/goals/storage";
import { readHomeState, writeHomeState, _resetHomeStateForTests } from "@/lib/home/storage";
import { readRunsState, writeRunsState, __resetRunsStateForTests } from "@/lib/runs/storage";
import {
  readSessionsState,
  writeSessionsState,
  _resetSessionsStateForTests,
} from "@/lib/sessions/storage";
import { readSuuntoState, writeSuuntoState, __resetSuuntoStateForTests } from "@/lib/suunto/storage";
import {
  readTemplatesState,
  writeTemplatesState,
  _resetTemplatesStateForTests,
} from "@/lib/templates/storage";
import { writePreferences, _resetPreferencesCache } from "@/lib/preferences";

import {
  buildReadinessReport,
  type ConflictEvidence,
  type LocalCapabilityEvidence,
  type ReadinessEvidence,
  type ReadinessReport,
  type RehearsalEvidence,
  type StableIdEvidence,
} from "./readinessReport";

/** מודול probe ייעודי — אינו אחד מתשעת המודולים העסקיים. */
const PROBE_MODULE = "__readiness_probe";

function writeEveryModuleThroughItsWriter(): void {
  // כתיבת המצב הנוכחי בחזרה — no-op נתונית — כדי להוכיח שכל writer עובר ב-registry.
  writeCatalogState({ ...readCatalogState() });
  writeExercisesState({ ...readExercisesState() });
  writeGoalsState({ ...readGoalsState() });
  writeHomeState({ ...readHomeState() });
  writeRunsState({ ...readRunsState() });
  writeSessionsState({ ...readSessionsState() });
  writeSuuntoState({ ...readSuuntoState() });
  writeTemplatesState({ ...readTemplatesState() });
  writePreferences({});
}

/**
 * מנקה את ה-cache של כל מודול **ומוחק את המפתח**.
 *
 * ה-helpers האלה הם destructive by design (`_resetXStateForTests` מוחק את המפתח
 * כשלא מועבר state). לכן כל שחזור חייב לקרוא להם **לפני** הכתיבה, לא אחריה.
 */
function wipeModulesAndCaches(): void {
  _resetCatalogStateForTests();
  _resetExercisesStateForTests();
  _resetGoalsStateForTests();
  _resetHomeStateForTests();
  __resetRunsStateForTests();
  _resetSessionsStateForTests();
  __resetSuuntoStateForTests();
  _resetTemplatesStateForTests();
  _resetPreferencesCache();
}

/** מנקה caches ואז מחזיר את התוכן הגולמי המקורי. הסדר קריטי — ראה למעלה. */
function restoreRawKeys(keys: RawStorageKeys): void {
  wipeModulesAndCaches();
  for (const mod of STORAGE_MODULES) {
    const key = STORAGE_KEY_BY_MODULE[mod];
    const value = keys[mod];
    if (value === null) safeRemoveStorage(key);
    else safeWriteRawStorage(key, value);
  }
}

/** מוכיח שהסלמת המצב הגרוע ביותר עובדת, ומחזיר את ה-registry למצב תקין. */
function probeWorstStatusEscalation(): boolean {
  const before = getWorstStorageStatus().status;
  reportWrite(PROBE_MODULE, {
    status: "memory_only",
    reason: "quota_exceeded",
    message: "probe",
  });
  const escalated = getWorstStorageStatus().status === "memory_only";
  reportWrite(PROBE_MODULE, { status: "saved", reason: null, message: null });
  const recovered = getWorstStorageStatus().status === before;
  return escalated && recovered;
}

/** מוכיח ש-rollback מחזיר את הנתונים בדיוק, על ידי שינוי אמיתי והחזרה. */
function probeRollback(now: Date): boolean {
  const before = readRawStorageKeys();
  const snapshot = createMigrationSnapshot(LOCAL_SCHEMA_VERSION, LOCAL_SCHEMA_VERSION, now);
  if (!snapshot) return false;

  safeWriteRawStorage(STORAGE_KEY_BY_MODULE.goals, '{"__readiness_probe":true}');
  if (safeReadStorage(STORAGE_KEY_BY_MODULE.goals) === before.goals) return false; // לא באמת השתנה

  const rollback = rollbackFromSnapshot(snapshot);
  // אין צורך לנקות caches: ה-probe כתב גולמית בלבד, ה-cache מעולם לא בוטל,
  // וה-rollback החזיר את המפתחות לתוכן זהה — כך שה-cache נשאר נכון.
  const after = readRawStorageKeys();
  return rollback.ok && checksumOf(after) === checksumOf(before);
}

/** מוכיח שגרסה עתידית נחסמת ואינה נוגעת בנתונים. */
function probeFutureVersionBlocked(now: Date): boolean {
  const originalMeta = safeReadStorage(STORAGE_META_KEY);
  const before = readRawStorageKeys();

  safeWriteRawStorage(
    STORAGE_META_KEY,
    JSON.stringify({
      format: LOCAL_STORAGE_FORMAT,
      schema_version: "99.0.0",
      updated_at: now.toISOString(),
      storage_keys: [...STORAGE_MODULES],
    }),
  );

  const result = runLocalMigrations(now);
  const untouched = checksumOf(readRawStorageKeys()) === checksumOf(before);

  if (originalMeta === null) safeRemoveStorage(STORAGE_META_KEY);
  else safeWriteRawStorage(STORAGE_META_KEY, originalMeta);

  return result.status === "future_version_blocked" && result.applied.length === 0 && untouched;
}

/**
 * מוכיח Export → Restore → Export עם תוצאה זהה.
 * מוחק את תשעת המפתחות בפועל ומשחזר מהקובץ — ואז מחזיר את המצב המקורי.
 */
function probeRoundTrip(): {
  exportValidated: boolean;
  restoreApplied: boolean;
  roundTripIdentical: boolean;
  envelope: BackupEnvelope;
} {
  const envelope = buildBackup(BACKUP_SCHEMA_VERSION);
  const exportValidated = validateBackup(envelope).ok;
  const original = readRawStorageKeys();

  // ניקוי מלא — כדי שהשחזור יהיה שחזור אמיתי ולא מיזוג.
  wipeModulesAndCaches();

  const result = importBackup(envelope, "replace");
  const rebuilt = buildBackup(BACKUP_SCHEMA_VERSION);
  const roundTripIdentical =
    checksumOf(rebuilt.entities) === checksumOf(envelope.entities) &&
    rebuilt.metadata.integrity.checksum === envelope.metadata.integrity.checksum;

  restoreRawKeys(original);

  return {
    exportValidated,
    restoreApplied: result.ok && Object.values(result.applied).reduce((a, b) => a + b, 0) > 0,
    roundTripIdentical,
    envelope,
  };
}

function collectLocalEvidence(now: Date): { local: LocalCapabilityEvidence; envelope: BackupEnvelope } {
  // המיגרציה חייבת לרוץ לפני שנשאלת שאלת גרסת ה-schema.
  runLocalMigrations(now);

  writeEveryModuleThroughItsWriter();
  const modulesReportingWrites = Object.keys(getStorageStatuses()).filter(
    (m) => m !== PROBE_MODULE,
  );

  const worstStatusEscalates = probeWorstStatusEscalation();

  const schema = readLocalSchemaStatus();
  const snapshot = readMigrationSnapshot();
  const snapshotVerified = snapshot !== null && verifyMigrationSnapshot(snapshot);

  const rollbackRestoredExactly = probeRollback(now);
  const futureVersionBlocked = probeFutureVersionBlocked(now);
  const roundTrip = probeRoundTrip();

  return {
    envelope: roundTrip.envelope,
    local: {
      modulesReportingWrites,
      worstStatusEscalates,
      noticeRoleForSaved: pickStorageNotice("saved", null)?.role ?? null,
      noticeRoleForMemoryOnly: pickStorageNotice("memory_only", null)?.role ?? null,
      noticeRoleForFailed: pickStorageNotice("failed", null)?.role ?? null,
      schemaState: schema.state,
      schemaVersion: schema.version,
      snapshotVerified,
      rollbackRestoredExactly,
      futureVersionBlocked,
      exportValidated: roundTrip.exportValidated,
      restoreApplied: roundTrip.restoreApplied,
      roundTripIdentical: roundTrip.roundTripIdentical,
    },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** משווה את המזהים המקומיים לאלה שבענן — חייבים להיות זהים, ללא מיפוי מחדש. */
export function collectStableIdEvidence(
  envelope: BackupEnvelope,
  repo: InMemoryCloudRepository,
): StableIdEvidence {
  let checked = 0;
  let changed = 0;

  for (const def of CLOUD_ENTITIES) {
    const state = envelope.entities[def.module];
    if (!isRecord(state)) continue;
    const rows = state[def.collection];
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      if (!isRecord(row)) continue;
      const id = row[def.primaryKey];
      if (typeof id !== "string" || id.length === 0) continue;
      checked++;
      const cloudRow = repo.get(def.table, id);
      if (cloudRow === null || cloudRow[def.primaryKey] !== id) changed++;
    }
  }

  return { checked, changed };
}

export interface ReadinessAuditOptions {
  /** הבעלים בענן ב-rehearsal. חייב להיות ערך אמיתי ולא ריק. */
  authenticatedUserId: string;
  now?: Date;
}

export interface ReadinessAuditResult {
  evidence: ReadinessEvidence;
  report: ReadinessReport;
  /** ה-repository שאליו בוצע ה-rehearsal — לצורכי inspection. */
  repo: InMemoryCloudRepository;
}

/**
 * מריץ את כל היכולות ומחזיר ראיות + דוח נגזר.
 *
 * ⚠️ דורש סביבת אחסון מבודדת (ראה כותרת הקובץ).
 */
export function runReadinessAudit(options: ReadinessAuditOptions): ReadinessAuditResult {
  const now = options.now ?? new Date();
  const { authenticatedUserId } = options;

  const { local, envelope } = collectLocalEvidence(now);

  // --- rehearsal: אותו קובץ, פעמיים, לאותו repository ---
  const repo = new InMemoryCloudRepository();
  const first = runCloudImport(envelope, { repo, authenticatedUserId });
  const cloudRowsAfterFirst = repo.totalRows();
  const second = runCloudImport(envelope, { repo, authenticatedUserId });
  const cloudRowsAfterSecond = repo.totalRows();

  const rehearsal: RehearsalEvidence = {
    first,
    second,
    cloudRowsAfterFirst,
    cloudRowsAfterSecond,
  };

  const stableIds = collectStableIdEvidence(envelope, repo);
  const conflicts = probeConflictDetection(envelope, repo, authenticatedUserId);

  const evidence: ReadinessEvidence = { local, rehearsal, stableIds, conflicts };
  return { evidence, report: buildReadinessReport(evidence), repo };
}

/**
 * מוכיח שקונפליקט מזוהה ושהרשומה הקיימת **אינה נדרסת**: משנה שדה תוכן ברשומה
 * אחת ומייבא שוב לאותו repository.
 */
function probeConflictDetection(
  envelope: BackupEnvelope,
  repo: InMemoryCloudRepository,
  authenticatedUserId: string,
): ConflictEvidence {
  const mutated = JSON.parse(JSON.stringify(envelope)) as BackupEnvelope;

  // מוצאים את הישות הראשונה שיש בה רשומה, ומשנים בה שדה תוכן.
  let target: { table: string; id: string; before: unknown } | null = null;
  for (const def of CLOUD_ENTITIES) {
    const state = mutated.entities[def.module];
    if (!isRecord(state)) continue;
    const rows = state[def.collection];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const row = rows[0];
    if (!isRecord(row)) continue;
    const id = row[def.primaryKey];
    if (typeof id !== "string") continue;

    row.__conflict_probe = "changed";
    target = { table: def.table, id, before: repo.get(def.table, id) };
    break;
  }
  if (!target) return { detected: 0, overwritten: 0 };

  // ה-checksum במעטפת חייב להתעדכן, אחרת הקובץ ייפסל על אי-שלמות ולא על קונפליקט.
  mutated.metadata.integrity.checksum = checksumOf(mutated.entities);

  const report = runCloudImport(mutated, { repo, authenticatedUserId });
  const after = repo.get(target.table, target.id);
  const overwritten = checksumOf(after) === checksumOf(target.before) ? 0 : 1;

  return { detected: report.conflicts, overwritten };
}
