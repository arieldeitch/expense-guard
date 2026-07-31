// @vitest-environment jsdom
/**
 * Backup — export / validate / import / round-trip.
 * סביבת jsdom נדרשת: snapshot נשמר ב-localStorage אמיתי.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  BACKUP_SCHEMA_VERSION,
  buildBackup,
  backupFileName,
  importBackup,
  previewImport,
  readSnapshot,
  validateBackup,
  type BackupEnvelope,
} from "@/lib/backup";
import { _resetHomeStateForTests } from "@/lib/home/storage";
import { _resetSessionsStateForTests } from "@/lib/sessions/storage";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";
import {
  addEntry,
  addHomeTemplateEntry,
  addSet,
  createHomeSession,
  createHomeTemplate,
  listEntrySets,
  listHomeTemplateEntries,
  listHomeTemplates,
  listSessionEntries,
} from "@/lib/home";
import {
  addExerciseToSession,
  completeSet,
  listExerciseSets,
  listSessionExercises,
  listSessions,
  startEmptySession,
  updateSet,
} from "@/lib/sessions";
import { listExercises } from "@/lib/exercises";

function resetAll() {
  window.localStorage.clear();
  _resetHomeStateForTests();
  _resetSessionsStateForTests();
  _resetExercisesStateForTests();
}

beforeEach(resetAll);

/** תוכנית בית עם 3 תרגילים + אימון עם 2 סטים שבוצעו. */
function seedRealisticData() {
  const exercises = listExercises().filter((e) => e.tracking_type === "weight_reps").slice(0, 3);
  const tpl = createHomeTemplate({ name: "תוכנית בוקר" });
  for (const ex of exercises) addHomeTemplateEntry(tpl.id, ex.id);

  const session = startEmptySession("אימון בוקר");
  const se = addExerciseToSession(session.id, exercises[0].id, { asNewBlock: true });
  if (!se) throw new Error("addExerciseToSession failed");
  const sets = listExerciseSets(se.id);
  updateSet(sets[0].id, { actual_weight: 40, actual_reps: 10 });
  completeSet(sets[0].id);
  updateSet(sets[1].id, { actual_weight: 45, actual_reps: 8 });
  completeSet(sets[1].id);

  return { tpl, session, sessionExerciseId: se.id };
}

/**
 * אימון **בית** מלא: session → entries → sets.
 * נדרש כדי שכללי `home.entries → home.sessions` ו-`home.sets → home.entries`
 * ייבחנו על נתונים אמיתיים ולא על אוספים ריקים.
 */
function seedHomeSession() {
  const exercises = listExercises().slice(0, 2);
  const session = createHomeSession({ name: "אימון בית" });
  const entry = addEntry(session.id, exercises[0].id);
  const secondEntry = addEntry(session.id, exercises[1].id);
  addSet(entry.id, { reps: 12, completed: true });
  addSet(entry.id, { reps: 10, completed: true });
  addSet(secondEntry.id, { reps: 8, completed: true });
  return { session, entry, secondEntry };
}

/** גישה מוקלדת לאוספי מודול הבית שבתוך המעטפת. */
function homeOf(env: BackupEnvelope) {
  return env.entities.home as {
    sessions: Array<Record<string, unknown>>;
    entries: Array<Record<string, unknown>>;
    sets: Array<Record<string, unknown>>;
    templates: Array<Record<string, unknown>>;
    templateEntries: Array<Record<string, unknown>>;
  };
}

describe("Export — מעטפת קנונית", () => {
  it("בונה מעטפת versioned עם counts ו-checksum", () => {
    seedRealisticData();
    const env = buildBackup("test");

    expect(env.format).toBe("workout-data-system");
    expect(env.schema_version).toBe(BACKUP_SCHEMA_VERSION);
    expect(Date.parse(env.exported_at)).not.toBeNaN();
    expect(env.metadata.integrity.total_records).toBeGreaterThan(0);
    expect(env.metadata.integrity.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(env.metadata.entity_counts.home).toBeGreaterThan(0);
    expect(env.metadata.entity_counts.sessions).toBeGreaterThan(0);
  });

  it("המעטפת JSON-serializable בלבד (אין Date/undefined/מעגליות)", () => {
    seedRealisticData();
    const env = buildBackup("test");
    const round = JSON.parse(JSON.stringify(env)) as BackupEnvelope;
    expect(round).toEqual(env);
    expect(JSON.stringify(env)).not.toContain("undefined");
  });

  it("שם הקובץ כולל תאריך ושעה", () => {
    expect(backupFileName(new Date("2026-07-26T05:07:00Z"))).toMatch(
      /^fitlog-backup-\d{8}-\d{4}\.json$/,
    );
  });
});

describe("Validation", () => {
  it("גיבוי תקין עובר", () => {
    seedRealisticData();
    const report = validateBackup(buildBackup("test"));
    expect(report.issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("קובץ שאינו גיבוי נדחה", () => {
    const report = validateBackup({ hello: "world" });
    expect(report.ok).toBe(false);
    expect(report.issues[0].code).toBe("unsupported_format");
  });

  it("גרסת schema לא נתמכת נדחית", () => {
    const env = buildBackup("test");
    const report = validateBackup({ ...env, schema_version: "99.0.0" });
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "unsupported_schema_version")).toBe(true);
  });

  it("מזהים כפולים נדחים", () => {
    seedRealisticData();
    const env = buildBackup("test");
    const home = env.entities.home as { templates: unknown[] };
    home.templates = [...home.templates, home.templates[0]];
    const report = validateBackup(env);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "duplicate_id")).toBe(true);
  });

  it("הפניה שבורה נדחית", () => {
    seedRealisticData();
    const env = buildBackup("test");
    const home = env.entities.home as { templateEntries: Array<Record<string, unknown>> };
    home.templateEntries[0].template_id = "tpl_does_not_exist";
    const report = validateBackup(env);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "dangling_reference")).toBe(true);
  });

  it("חותמת זמן לא תקינה נדחית", () => {
    seedRealisticData();
    const env = buildBackup("test");
    const home = env.entities.home as { templates: Array<Record<string, unknown>> };
    home.templates[0].created_at = "not-a-date";
    const report = validateBackup(env);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === "invalid_timestamp")).toBe(true);
  });
});

/**
 * R-24 — `REFERENCE_RULES` בדק את השדה `session_id` עבור `home.entries`, אך השדה
 * בפועל הוא `home_session_id`, ולכן הכלל לא ירה מעולם. בנוסף, כל כלל דילג בשקט
 * כשאוסף ההורים היה ריק. ראה ADR-0037.
 */
describe("R-24 — הפניות תלויות במודול הבית", () => {
  it("רגרסיה: גיבוי בית תקין (session → entries → sets) ממשיך לעבור", () => {
    const { session, entry } = seedHomeSession();
    expect(listSessionEntries(session.id).length).toBe(2);
    expect(listEntrySets(entry.id).length).toBe(2);

    const report = validateBackup(buildBackup("test"));
    expect(report.issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("entry שמצביע ל-session שאינו קיים נפסל (השדה הנכון הוא home_session_id)", () => {
    seedHomeSession();
    const env = buildBackup("test");
    homeOf(env).entries[0].home_session_id = "hs_does_not_exist";

    const report = validateBackup(env);
    const issue = report.issues.find((i) => i.code === "dangling_reference");
    expect(report.ok).toBe(false);
    expect(issue?.scope).toBe("home.entries → home.sessions");
    expect(issue?.severity).toBe("error");
  });

  it("set שמצביע ל-entry שאינו קיים נפסל", () => {
    seedHomeSession();
    const env = buildBackup("test");
    homeOf(env).sets[0].entry_id = "he_does_not_exist";

    const report = validateBackup(env);
    const issue = report.issues.find((i) => i.code === "dangling_reference");
    expect(report.ok).toBe(false);
    expect(issue?.scope).toBe("home.sets → home.entries");
  });

  it("מחיקת כל ההורים אינה נבלעת בשקט (parents ריק — לא מדלגים)", () => {
    const { session } = seedHomeSession();
    const env = buildBackup("test");
    const home = homeOf(env);
    home.sessions = [];

    const report = validateBackup(env);
    const issue = report.issues.find((i) => i.scope === "home.entries → home.sessions");
    expect(report.ok).toBe(false);
    expect(issue?.code).toBe("dangling_reference");
    expect(issue?.ids?.length).toBe(2);
    expect(session.id).toBeTruthy();
  });

  it("תאימות לאחור: מעטפת שאין בה כלל את אוסף ההורים אינה מייצרת שגיאה מומצאת", () => {
    seedHomeSession();
    const env = buildBackup("test");
    const home = env.entities.home as Record<string, unknown>;
    // מעטפת חלקית/ישנה: המפתח `sessions` נעדר לחלוטין (בשונה ממערך ריק).
    delete home.sessions;

    const report = validateBackup(env);
    expect(report.issues.some((i) => i.scope === "home.entries → home.sessions")).toBe(false);
  });

  it("גיבוי בית תקין עדיין מייבא במלואו אחרי התיקון", () => {
    const { session, entry } = seedHomeSession();
    const before = buildBackup("test");
    const beforeEntryIds = listSessionEntries(session.id).map((e) => e.id);
    const beforeSetIds = listEntrySets(entry.id).map((s) => s.id);

    resetAll();
    expect(listSessionEntries(session.id).length).toBe(0);

    const result = importBackup(before, "replace");
    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(listSessionEntries(session.id).map((e) => e.id)).toEqual(beforeEntryIds);
    expect(listEntrySets(entry.id).map((s) => s.id)).toEqual(beforeSetIds);
  });

  it("גיבוי עם הפניה שבורה אינו נכתב כלל", () => {
    seedHomeSession();
    const env = buildBackup("test");
    homeOf(env).entries[0].home_session_id = "hs_does_not_exist";
    const checksumBefore = buildBackup("test").metadata.integrity.checksum;

    const result = importBackup(env, "merge_keep_local");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("לא בוצע שינוי");
    expect(buildBackup("test").metadata.integrity.checksum).toBe(checksumBefore);
  });
});

describe("Round-trip — ייצוא, ניקוי, ייבוא", () => {
  it("משחזר את אותם IDs, קשרים, ערכים וסדר", () => {
    const { tpl, session, sessionExerciseId } = seedRealisticData();

    const before = buildBackup("test");
    const beforeTemplates = listHomeTemplates().map((t) => t.id);
    const beforeEntries = listHomeTemplateEntries(tpl.id).map((e) => e.exercise_id);
    const beforeSets = listExerciseSets(sessionExerciseId).map((s) => ({
      id: s.id,
      w: s.actual_weight,
      r: s.actual_reps,
      done: s.completed,
    }));

    // ניקוי repository הבדיקה בלבד
    resetAll();
    expect(listHomeTemplates().length).toBe(0);
    expect(listSessions().length).toBe(0);

    const result = importBackup(before, "replace");
    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();

    // אותם IDs
    expect(listHomeTemplates().map((t) => t.id)).toEqual(beforeTemplates);
    expect(listSessions().map((s) => s.id)).toContain(session.id);

    // אותם קשרים וסדר
    expect(listHomeTemplateEntries(tpl.id).map((e) => e.exercise_id)).toEqual(beforeEntries);
    expect(listSessionExercises(session.id).map((e) => e.id)).toContain(sessionExerciseId);

    // אותם ערכים וסטטוסים, באותו סדר
    expect(
      listExerciseSets(sessionExerciseId).map((s) => ({
        id: s.id,
        w: s.actual_weight,
        r: s.actual_reps,
        done: s.completed,
      })),
    ).toEqual(beforeSets);

    // השוואה סמנטית: אותו checksum על התוכן
    const after = buildBackup("test");
    expect(after.metadata.integrity.checksum).toBe(before.metadata.integrity.checksum);
    expect(after.metadata.entity_counts).toEqual(before.metadata.entity_counts);
  });
});

describe("Idempotency ו-conflicts", () => {
  it("ייבוא חוזר של אותו קובץ אינו יוצר כפילויות", () => {
    seedRealisticData();
    const env = buildBackup("test");
    const countsBefore = env.metadata.entity_counts;

    importBackup(env, "merge_keep_local");
    importBackup(env, "merge_keep_local");
    importBackup(env, "merge_keep_local");

    expect(buildBackup("test").metadata.entity_counts).toEqual(countsBefore);
  });

  it("אותו id עם תוכן שונה מסומן כקונפליקט ואינו נדרס בשקט", () => {
    const { tpl } = seedRealisticData();
    const env = buildBackup("test");

    // משנים את הגיבוי כך שהשם שונה מהמכשיר
    const home = env.entities.home as { templates: Array<Record<string, unknown>> };
    const row = home.templates.find((t) => t.id === tpl.id)!;
    row.name = "שם אחר לגמרי";

    const preview = previewImport(env);
    const scope = "home.templates";
    expect(preview.conflicts[scope]).toBe(1);
    expect(preview.conflictIds[scope]).toContain(tpl.id);

    // merge_keep_local — לא נדרס
    importBackup(env, "merge_keep_local");
    expect(listHomeTemplates().find((t) => t.id === tpl.id)?.name).toBe("תוכנית בוקר");

    // merge_prefer_backup — נדרס רק בבחירה מפורשת
    importBackup(env, "merge_prefer_backup");
    expect(listHomeTemplates().find((t) => t.id === tpl.id)?.name).toBe("שם אחר לגמרי");
  });
});

describe("Snapshot", () => {
  it("נוצר snapshot קריא לפני ייבוא", () => {
    seedRealisticData();
    const env = buildBackup("test");

    const result = importBackup(env, "merge_keep_local");
    expect(result.snapshotKey).not.toBeNull();

    const snap = readSnapshot(result.snapshotKey!);
    expect(snap).not.toBeNull();
    expect(snap!.format).toBe("workout-data-system");
    expect(snap!.metadata.entity_counts.home).toBeGreaterThan(0);
  });

  it("ייבוא שנכשל באימות אינו משנה נתונים ואינו כותב", () => {
    const { tpl } = seedRealisticData();
    const before = buildBackup("test").metadata.integrity.checksum;

    const result = importBackup({ not: "a backup" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("לא בוצע שינוי");
    expect(listHomeTemplates().find((t) => t.id === tpl.id)?.name).toBe("תוכנית בוקר");
    expect(buildBackup("test").metadata.integrity.checksum).toBe(before);
  });
});
