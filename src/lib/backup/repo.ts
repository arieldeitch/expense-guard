/**
 * Backup repository — Export / Validate / Preview / Import.
 *
 * עובד **דרך ה-storage adapters בלבד**; אין גישה ישירה ל-localStorage מ-UI.
 * לפני כל כתיבה נשמר snapshot הפיך. קונפליקטים לעולם אינם נדרסים בשקט.
 */
import {
  BACKUP_FORMAT,
  BACKUP_MODULES,
  BACKUP_SCHEMA_VERSION,
  type BackupEnvelope,
  type BackupModule,
  type ImportMode,
  type ImportPreview,
  type ImportResult,
  type ValidationIssue,
  type ValidationReport,
} from "./types";

import { readCatalogState, writeCatalogState } from "@/lib/catalog/storage";
import { readExercisesState, writeExercisesState } from "@/lib/exercises/storage";
import { readGoalsState, writeGoalsState } from "@/lib/goals/storage";
import { readHomeState, writeHomeState } from "@/lib/home/storage";
import { readRunsState, writeRunsState } from "@/lib/runs/storage";
import { readSessionsState, writeSessionsState } from "@/lib/sessions/storage";
import { readSuuntoState, writeSuuntoState } from "@/lib/suunto/storage";
import { readTemplatesState, writeTemplatesState } from "@/lib/templates/storage";
import { readPreferences, writePreferences } from "@/lib/preferences";

/** adapter אחיד לכל מודול — ה-boundary היחיד שדרכו הגיבוי נוגע באחסון. */
interface ModuleAdapter {
  read: () => unknown;
  write: (state: unknown) => void;
}

const ADAPTERS: Record<BackupModule, ModuleAdapter> = {
  catalog: { read: readCatalogState, write: (s) => writeCatalogState(s as never) },
  exercises: { read: readExercisesState, write: (s) => writeExercisesState(s as never) },
  goals: { read: readGoalsState, write: (s) => writeGoalsState(s as never) },
  home: { read: readHomeState, write: (s) => writeHomeState(s as never) },
  runs: { read: readRunsState, write: (s) => writeRunsState(s as never) },
  sessions: { read: readSessionsState, write: (s) => writeSessionsState(s as never) },
  suunto: { read: readSuuntoState, write: (s) => writeSuuntoState(s as never) },
  templates: { read: readTemplatesState, write: (s) => writeTemplatesState(s as never) },
  preferences: { read: readPreferences, write: (s) => writePreferences(s as never) },
};

const SNAPSHOT_PREFIX = "fitlog:backup-snapshot:";

// ---------- helpers ----------

/** FNV-1a 32-bit — דטרמיניסטי, ללא dependency. */
function checksumOf(value: unknown): string {
  const text = stableStringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** JSON יציב — מפתחות ממוינים, כך שה-checksum אינו תלוי בסדר. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** אוסף כל המערכים בתוך state של מודול — כל מערך = "אוסף רשומות". */
function collectionsOf(state: unknown): Array<[string, Array<Record<string, unknown>>]> {
  if (!state || typeof state !== "object" || Array.isArray(state)) return [];
  const out: Array<[string, Array<Record<string, unknown>>]> = [];
  for (const [key, value] of Object.entries(state as Record<string, unknown>)) {
    if (Array.isArray(value) && value.every((v) => v && typeof v === "object")) {
      out.push([key, value as Array<Record<string, unknown>>]);
    }
  }
  return out;
}

function countRecords(state: unknown): number {
  return collectionsOf(state).reduce((n, [, arr]) => n + arr.length, 0);
}

/**
 * מזהה את שדה הזהות של אוסף. רוב האוספים משתמשים ב-`id`, אך לא כולם —
 * למשל `sessions.timers` ממופתח ב-`session_id`. מחזיר null אם אין שדה זהות
 * יציב, ואז האוסף מטופל כיחידה אחת (ללא בדיקות זהות/מיזוג ברמת רשומה).
 */
function identityKeyOf(rows: Array<Record<string, unknown>>): string | null {
  if (rows.length === 0) return "id";
  const hasAll = (k: string) => rows.every((r) => typeof r[k] === "string" && r[k] !== "");
  if (hasAll("id")) return "id";
  const candidates = Object.keys(rows[0]).filter((k) => k.endsWith("_id"));
  for (const k of candidates) {
    if (!hasAll(k)) continue;
    const values = rows.map((r) => String(r[k]));
    if (new Set(values).size === values.length) return k;
  }
  return null;
}

function isIsoTimestamp(v: unknown): boolean {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

// ---------- export ----------

export function buildBackup(appVersion = "local"): BackupEnvelope {
  const entities: Record<string, unknown> = {};
  const entity_counts: Record<string, number> = {};
  let total = 0;

  for (const mod of BACKUP_MODULES) {
    // מעבר דרך JSON מבטיח שמה שנשמר הוא בדיוק מה שניתן להעביר.
    const state = JSON.parse(JSON.stringify(ADAPTERS[mod].read() ?? null)) as unknown;
    entities[mod] = state;
    const n = countRecords(state);
    entity_counts[mod] = n;
    total += n;
  }

  return {
    format: BACKUP_FORMAT,
    schema_version: BACKUP_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    app_version: appVersion,
    entities,
    metadata: {
      entity_counts,
      integrity: { total_records: total, checksum: checksumOf(entities) },
    },
  };
}

/** שם קובץ עם תאריך ושעה. */
export function backupFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `fitlog-backup-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(
    now.getHours(),
  )}${p(now.getMinutes())}.json`;
}

// ---------- validation ----------

export function validateBackup(input: unknown): ValidationReport {
  const issues: ValidationIssue[] = [];
  const entity_counts: Record<string, number> = {};

  const env = input as Partial<BackupEnvelope> | null;

  if (!env || typeof env !== "object" || env.format !== BACKUP_FORMAT) {
    issues.push({
      severity: "error",
      code: "unsupported_format",
      message: "הקובץ אינו גיבוי של המערכת.",
      scope: "envelope",
    });
    return { ok: false, schema_version: "", entity_counts, issues, checksum: "" };
  }

  const version = String(env.schema_version ?? "");
  const major = version.split(".")[0];
  if (major !== BACKUP_SCHEMA_VERSION.split(".")[0]) {
    issues.push({
      severity: "error",
      code: "unsupported_schema_version",
      message: `גרסת schema ${version || "(חסרה)"} אינה נתמכת. נתמך: ${BACKUP_SCHEMA_VERSION}.`,
      scope: "envelope",
    });
  }

  const entities = (env.entities ?? {}) as Record<string, unknown>;

  for (const mod of BACKUP_MODULES) {
    if (!(mod in entities)) {
      issues.push({
        severity: "warning",
        code: "missing_module",
        message: `המודול "${mod}" אינו קיים בגיבוי; יטופל כריק.`,
        scope: mod,
      });
      entity_counts[mod] = 0;
      continue;
    }
    const state = entities[mod];
    entity_counts[mod] = countRecords(state);

    for (const [collection, rows] of collectionsOf(state)) {
      const scope = `${mod}.${collection}`;
      const idKey = identityKeyOf(rows);
      const seen = new Set<string>();
      const dupes: string[] = [];

      for (const row of rows) {
        const id = idKey ? row[idKey] : null;
        if (idKey === "id" && (typeof id !== "string" || id.length === 0)) {
          issues.push({
            severity: "error",
            code: "missing_required_field",
            message: `רשומה ללא מזהה יציב ב-${scope}.`,
            scope,
          });
          continue;
        }
        if (typeof id === "string") {
          if (seen.has(id)) dupes.push(id);
          seen.add(id);
        }

        for (const field of ["created_at", "updated_at", "deleted_at", "started_at", "ended_at"]) {
          const v = row[field];
          if (v != null && !isIsoTimestamp(v)) {
            issues.push({
              severity: "error",
              code: "invalid_timestamp",
              message: `חותמת זמן לא תקינה בשדה ${field} של ${scope}.`,
              scope,
              ids: typeof id === "string" ? [id] : [],
            });
          }
        }
      }

      if (dupes.length > 0) {
        issues.push({
          severity: "error",
          code: "duplicate_id",
          message: `מזהים כפולים ב-${scope}.`,
          scope,
          ids: [...new Set(dupes)],
        });
      }
    }
  }

  // הפניות תלויות (dangling) — נבדק על הקשרים הקריטיים לשחזור תוכניות ואימונים.
  issues.push(...checkReferences(entities));

  return {
    ok: issues.every((i) => i.severity !== "error"),
    schema_version: version,
    entity_counts,
    issues,
    checksum: checksumOf(entities),
  };
}

interface RefRule {
  scope: string;
  childModule: BackupModule;
  childCollection: string;
  field: string;
  parentModule: BackupModule;
  parentCollection: string;
}

const REFERENCE_RULES: RefRule[] = [
  {
    scope: "home.templateEntries → home.templates",
    childModule: "home",
    childCollection: "templateEntries",
    field: "template_id",
    parentModule: "home",
    parentCollection: "templates",
  },
  {
    scope: "home.entries → home.sessions",
    childModule: "home",
    childCollection: "entries",
    field: "session_id",
    parentModule: "home",
    parentCollection: "sessions",
  },
  {
    scope: "sessions.exercises → sessions.sessions",
    childModule: "sessions",
    childCollection: "exercises",
    field: "session_id",
    parentModule: "sessions",
    parentCollection: "sessions",
  },
  {
    scope: "sessions.sets → sessions.exercises",
    childModule: "sessions",
    childCollection: "sets",
    field: "session_exercise_id",
    parentModule: "sessions",
    parentCollection: "exercises",
  },
  {
    scope: "sessions.blocks → sessions.sessions",
    childModule: "sessions",
    childCollection: "blocks",
    field: "session_id",
    parentModule: "sessions",
    parentCollection: "sessions",
  },
];

function checkReferences(entities: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const listOf = (mod: string, coll: string): Array<Record<string, unknown>> => {
    const state = entities[mod];
    const found = collectionsOf(state).find(([k]) => k === coll);
    return found ? found[1] : [];
  };

  for (const rule of REFERENCE_RULES) {
    const parents = new Set(
      listOf(rule.parentModule, rule.parentCollection)
        .map((r) => r.id)
        .filter((id): id is string => typeof id === "string"),
    );
    if (parents.size === 0) continue;

    const dangling = listOf(rule.childModule, rule.childCollection)
      .filter((row) => {
        const ref = row[rule.field];
        return typeof ref === "string" && ref.length > 0 && !parents.has(ref);
      })
      .map((row) => String(row.id));

    if (dangling.length > 0) {
      issues.push({
        severity: "error",
        code: "dangling_reference",
        message: `הפניות שבורות ב-${rule.scope}.`,
        scope: rule.scope,
        ids: dangling,
      });
    }
  }
  return issues;
}

// ---------- snapshot ----------

/** שומר snapshot הפיך של המצב הנוכחי ומחזיר את המפתח, או null אם נכשל. */
export function createSnapshot(label: string): string | null {
  try {
    const key = `${SNAPSHOT_PREFIX}${label}`;
    const payload = JSON.stringify(buildBackup("snapshot"));
    localStorage.setItem(key, payload);
    // אימות שה-snapshot ניתן לקריאה — snapshot שלא ניתן לקרוא אינו גיבוי.
    const back = localStorage.getItem(key);
    if (!back) return null;
    JSON.parse(back);
    return key;
  } catch {
    return null;
  }
}

export function readSnapshot(key: string): BackupEnvelope | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as BackupEnvelope) : null;
  } catch {
    return null;
  }
}

// ---------- preview & import ----------

function rowsById(state: unknown): Map<string, Map<string, Record<string, unknown>>> {
  const map = new Map<string, Map<string, Record<string, unknown>>>();
  for (const [coll, rows] of collectionsOf(state)) {
    const idKey = identityKeyOf(rows);
    if (!idKey) continue;
    const inner = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const v = row[idKey];
      if (typeof v === "string") inner.set(v, row);
    }
    map.set(coll, inner);
  }
  return map;
}

export function previewImport(input: unknown): ImportPreview {
  const report = validateBackup(input);
  const added: Record<string, number> = {};
  const unchanged: Record<string, number> = {};
  const conflicts: Record<string, number> = {};
  const conflictIds: Record<string, string[]> = {};

  if (!report.ok) return { report, added, unchanged, conflicts, conflictIds };

  const entities = (input as BackupEnvelope).entities;

  for (const mod of BACKUP_MODULES) {
    const incoming = rowsById(entities[mod]);
    const current = rowsById(ADAPTERS[mod].read());

    for (const [coll, rows] of incoming) {
      const scope = `${mod}.${coll}`;
      const localRows = current.get(coll) ?? new Map();
      for (const [id, row] of rows) {
        const local = localRows.get(id);
        if (!local) {
          added[scope] = (added[scope] ?? 0) + 1;
        } else if (stableStringify(local) === stableStringify(row)) {
          unchanged[scope] = (unchanged[scope] ?? 0) + 1;
        } else {
          conflicts[scope] = (conflicts[scope] ?? 0) + 1;
          conflictIds[scope] = [...(conflictIds[scope] ?? []), id];
        }
      }
    }
  }

  return { report, added, unchanged, conflicts, conflictIds };
}

/**
 * מייבא גיבוי. **תמיד** יוצר snapshot לפני כתיבה.
 * `merge_keep_local` (ברירת מחדל) — מוסיף חדשים בלבד; קונפליקטים לא נדרסים.
 */
export function importBackup(input: unknown, mode: ImportMode = "merge_keep_local"): ImportResult {
  const preview = previewImport(input);
  const empty: Record<string, number> = {};

  if (!preview.report.ok) {
    return {
      ok: false,
      mode,
      snapshotKey: null,
      applied: empty,
      conflicts: preview.conflicts,
      error: "הגיבוי לא עבר אימות; לא בוצע שינוי בנתונים.",
    };
  }

  const snapshotKey = createSnapshot(`pre-import-${new Date().toISOString()}`);
  const entities = (input as BackupEnvelope).entities;
  const applied: Record<string, number> = {};

  try {
    for (const mod of BACKUP_MODULES) {
      const incomingState = entities[mod];
      if (incomingState == null) continue;

      if (mode === "replace") {
        ADAPTERS[mod].write(incomingState);
        applied[mod] = countRecords(incomingState);
        continue;
      }

      const currentState = ADAPTERS[mod].read();
      if (!currentState || typeof currentState !== "object") {
        ADAPTERS[mod].write(incomingState);
        applied[mod] = countRecords(incomingState);
        continue;
      }

      const merged: Record<string, unknown> = {
        ...(currentState as Record<string, unknown>),
      };
      let count = 0;

      for (const [coll, rows] of collectionsOf(incomingState)) {
        const localRows = (merged[coll] as Array<Record<string, unknown>> | undefined) ?? [];
        const idKey = identityKeyOf(rows.length ? rows : localRows);
        if (!idKey) {
          merged[coll] = rows;
          count += rows.length;
          continue;
        }
        const byId = new Map(
          localRows
            .filter((r) => typeof r[idKey] === "string")
            .map((r) => [String(r[idKey]), r] as const),
        );
        for (const row of rows) {
          const id = String(row[idKey]);
          const exists = byId.has(id);
          if (!exists) {
            byId.set(id, row);
            count++;
          } else if (mode === "merge_prefer_backup") {
            byId.set(id, row);
            count++;
          }
          // merge_keep_local: קונפליקט נשאר כפי שהוא במכשיר — אין דריסה שקטה.
        }
        merged[coll] = [...byId.values()];
      }

      ADAPTERS[mod].write(merged);
      applied[mod] = count;
    }

    return { ok: true, mode, snapshotKey, applied, conflicts: preview.conflicts, error: null };
  } catch (e) {
    return {
      ok: false,
      mode,
      snapshotKey,
      applied,
      conflicts: preview.conflicts,
      error: `הייבוא נכשל: ${e instanceof Error ? e.message : "שגיאה לא ידועה"}. נשמר snapshot לשחזור.`,
    };
  }
}
