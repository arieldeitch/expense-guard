// @vitest-environment jsdom
/**
 * Readiness audit מקצה לקצה — מריץ את היכולות **בפועל** מול אחסון אמיתי (מבודד),
 * מייצא, מייבא לענן מדומה פעמיים, וגוזר את ה-gate מהתוצאות.
 *
 * זהו ה-rehearsal המלא של מסלול A. ראה ADR-0034/0035/0036.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { runReadinessAudit } from "@/lib/readiness";
import {
  STORAGE_KEY_BY_MODULE,
  STORAGE_MODULES,
  _resetMigrationRunCacheForTests,
  _resetStorageStatusesForTests,
  readRawStorageKeys,
} from "@/lib/storage";
import { checksumOf } from "@/lib/storage/checksum";
import { buildRehearsalEntities } from "@/lib/migration/__tests__/rehearsalFixture";

import { _resetCatalogStateForTests } from "@/lib/catalog/storage";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";
import { _resetGoalsStateForTests } from "@/lib/goals/storage";
import { _resetHomeStateForTests } from "@/lib/home/storage";
import { __resetRunsStateForTests } from "@/lib/runs/storage";
import { _resetSessionsStateForTests } from "@/lib/sessions/storage";
import { __resetSuuntoStateForTests } from "@/lib/suunto/storage";
import { _resetTemplatesStateForTests } from "@/lib/templates/storage";
import { _resetPreferencesCache } from "@/lib/preferences";

const USER = "auth-user-audit-0001";

/** זורע ל-localStorage את ה-dataset המלא, ישירות למפתחות האמיתיים. */
function seedRealStorage(entities: Record<string, unknown> = buildRehearsalEntities()) {
  for (const mod of STORAGE_MODULES) {
    window.localStorage.setItem(
      STORAGE_KEY_BY_MODULE[mod],
      JSON.stringify(entities[mod] ?? null),
    );
  }
}

function resetAllCaches() {
  _resetCatalogStateForTests();
  _resetExercisesStateForTests();
  _resetGoalsStateForTests();
  _resetHomeStateForTests();
  __resetRunsStateForTests();
  _resetSessionsStateForTests();
  __resetSuuntoStateForTests();
  _resetTemplatesStateForTests();
  _resetPreferencesCache();
  _resetStorageStatusesForTests();
  _resetMigrationRunCacheForTests();
}

beforeEach(() => {
  window.localStorage.clear();
  // הסדר קריטי: ה-reset helpers **מוחקים** את המפתחות, ולכן הזריעה באה אחריהם.
  resetAllCaches();
  seedRealStorage();
});

describe("Readiness audit — הרצה אמיתית", () => {
  it("שני ה-gates נפתחים, וכל 16 הבדיקות עוברות", () => {
    const { report } = runReadinessAudit({ authenticatedUserId: USER });

    const failing = Object.entries(report.checks).filter(([, v]) => !v);
    expect(failing).toEqual([]);
    expect(report.ready_for_single_device_use).toBe(true);
    expect(report.ready_for_future_supabase_migration_contract).toBe(true);
  });

  it("הראיות נאספו מהרצה ואינן ריקות", () => {
    const { evidence } = runReadinessAudit({ authenticatedUserId: USER });

    expect(evidence.local).not.toBeNull();
    expect(evidence.rehearsal).not.toBeNull();
    expect(evidence.local!.modulesReportingWrites.sort()).toEqual([...STORAGE_MODULES].sort());
    expect(evidence.rehearsal!.first.inserted).toBeGreaterThan(0);
    expect(evidence.stableIds!.checked).toBeGreaterThan(0);
    expect(evidence.stableIds!.changed).toBe(0);
    expect(evidence.conflicts!.detected).toBeGreaterThan(0);
    expect(evidence.conflicts!.overwritten).toBe(0);
  });

  it("ה-audit מחזיר את האחסון המקומי למצבו — הנתונים נשארים קריאים", () => {
    const before = readRawStorageKeys();
    runReadinessAudit({ authenticatedUserId: USER });
    const after = readRawStorageKeys();

    // התוכן זהה סמנטית (סריאליזציה קנונית לאחר המיגרציה).
    for (const mod of STORAGE_MODULES) {
      const b = before[mod] === null ? null : JSON.parse(before[mod] as string);
      const a = after[mod] === null ? null : JSON.parse(after[mod] as string);
      expect(a).toEqual(b);
    }
  });

  it("ה-rehearsal שיחזר את כל ההיררכיה בענן המדומה", () => {
    const { repo } = runReadinessAudit({ authenticatedUserId: USER });

    expect(repo.count("muscle_groups")).toBe(1);
    expect(repo.count("exercises")).toBe(2);
    expect(repo.count("locations")).toBe(1);
    expect(repo.count("home_templates")).toBe(1);
    expect(repo.count("home_template_entries")).toBe(3);
    expect(repo.count("home_sessions")).toBe(1);
    expect(repo.count("home_session_entries")).toBe(2);
    expect(repo.count("home_session_sets")).toBe(3);
    expect(repo.count("goals")).toBe(1);
  });

  it("ownership נקבע מה-user המאומת בלבד", () => {
    const { repo, evidence } = runReadinessAudit({ authenticatedUserId: USER });

    expect(repo.get("home_sessions", "hs_2026_07_20")?.user_id).toBe(USER);
    expect(repo.get("goals", "goal_pushups")?.user_id).toBe(USER);
    expect(repo.get("muscle_groups", "mg_chest")?.user_id).toBeNull();
    expect(evidence.rehearsal!.first.ownership.rows_with_foreign_owner).toBe(0);
    expect(evidence.rehearsal!.first.ownership.ignored_source_owners).toContain("single-user");
  });

  it("חותמות זמן, סטטוסים וערכים שרדו את ההגירה", () => {
    const { repo } = runReadinessAudit({ authenticatedUserId: USER });

    const session = repo.get("home_sessions", "hs_2026_07_20");
    expect(session?.started_at).toBe("2026-07-20T06:30:00.000Z");
    expect(session?.ended_at).toBe("2026-07-20T07:15:00.000Z");
    expect(session?.status).toBe("completed");
    expect(session?.duration_seconds).toBe(2700);

    const set = repo.get("home_session_sets", "hset_2");
    expect(set?.reps).toBe(10);
    expect(set?.rpe).toBe(8);
    expect(set?.set_number).toBe(2);
    expect(set?.completed_at).toBe("2026-07-20T07:15:00.000Z");
  });

  it("ההרצה דטרמיניסטית — אותו קלט מייצר אותו דוח", () => {
    const now = new Date("2026-07-26T08:00:00.000Z");
    const a = runReadinessAudit({ authenticatedUserId: USER, now });

    window.localStorage.clear();
    resetAllCaches();
    seedRealStorage();

    const b = runReadinessAudit({ authenticatedUserId: USER, now });

    expect(a.report).toEqual(b.report);
    expect(a.evidence.rehearsal!.first.operations.map((o) => o.operation_id)).toEqual(
      b.evidence.rehearsal!.first.operations.map((o) => o.operation_id),
    );
    expect(checksumOf(a.repo.tables().map((t) => a.repo.list(t)))).toBe(
      checksumOf(b.repo.tables().map((t) => b.repo.list(t))),
    );
  });

  it("ייבוא שני אינו יוצר רשומות ואינו משנה ספירות", () => {
    const { evidence } = runReadinessAudit({ authenticatedUserId: USER });
    const { first, second, cloudRowsAfterFirst, cloudRowsAfterSecond } = evidence.rehearsal!;

    expect(second.inserted).toBe(0);
    expect(second.unchanged).toBe(first.inserted);
    expect(second.conflicts).toBe(0);
    expect(cloudRowsAfterSecond).toBe(cloudRowsAfterFirst);
  });
});

describe("Readiness audit — כשל אמיתי מפיל את ה-gate", () => {
  it("נתונים שבורים (הורה חסר) → האימות תופס, ו-cloud gate false", () => {
    // מוחקים את ה-session אך משאירים את ה-entries — ילדים יתומים.
    const entities = buildRehearsalEntities();
    (entities.home as Record<string, unknown>).sessions = [];
    resetAllCaches();
    seedRealStorage(entities);

    const { report, evidence } = runReadinessAudit({ authenticatedUserId: USER });

    // אחרי תיקון R-24 האימות עצמו תופס את ההפניה השבורה, ולכן הקובץ נדחה
    // לפני שמבוצעת פעולה כלשהי — ראיה חזקה יותר, לא חלשה יותר.
    const first = evidence.rehearsal!.first;
    expect(first.validation.ok).toBe(false);
    expect(first.validation.issues.some((i) => i.code === "dangling_reference")).toBe(true);
    expect(first.total_operations).toBe(0);

    // ראיה ריקה אינה ראיה: אף check אינו מדווח הצלחה על סמך אפס פעולות.
    expect(report.checks.dependency_order).toBe(false);
    expect(report.checks.fake_supabase_rehearsal).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("הורה חסר שהאימות אינו מכסה → dependency_failures אמיתיים ו-gate false", () => {
    // `exercise_id` אינו מכוסה ב-`REFERENCE_RULES`, ולכן הקובץ עובר אימות
    // וה-pipeline הוא שחוסם — כך נשמרת הראיה לשכבת ההגנה השנייה.
    const entities = buildRehearsalEntities();
    for (const entry of (entities.home as Record<string, unknown>).entries as Array<
      Record<string, unknown>
    >) {
      entry.exercise_id = "ex_does_not_exist";
    }
    resetAllCaches();
    seedRealStorage(entities);

    const { report, evidence } = runReadinessAudit({ authenticatedUserId: USER });
    const first = evidence.rehearsal!.first;

    expect(first.validation.ok).toBe(true);
    expect(first.dependency_failures.length).toBeGreaterThan(0);
    expect(report.checks.dependency_order).toBe(false);
    expect(report.checks.fake_supabase_rehearsal).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });
});
