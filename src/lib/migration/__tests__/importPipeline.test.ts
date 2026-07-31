/**
 * Import pipeline — מיפוי, סדר תלויות, ownership, idempotency וקונפליקטים.
 *
 * זהו ה-Fake Supabase rehearsal: הנתונים עוברים את כל המסלול לענן מדומה,
 * **בלי Supabase, בלי SDK, בלי רשת**. ראה ADR-0034/0035.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  CLOUD_ENTITIES,
  InMemoryCloudRepository,
  runCloudImport,
  topologicalImportOrder,
} from "@/lib/migration";
import {
  AUTHENTICATED_USER,
  OTHER_USER,
  SOURCE_OWNER,
  buildRehearsalEnvelope,
  buildRehearsalEntities,
  reseal,
} from "./rehearsalFixture";

let repo: InMemoryCloudRepository;

beforeEach(() => {
  repo = new InMemoryCloudRepository();
});

function run(envelope: unknown, user = AUTHENTICATED_USER) {
  return runCloudImport(envelope, { repo, authenticatedUserId: user });
}

// ---------- validation ----------

describe("validation — קובץ פסול אינו נכתב", () => {
  it("פורמט זר נדחה ואף פעולה אינה מבוצעת", () => {
    const report = run({ format: "something-else", entities: {} });
    expect(report.ok).toBe(false);
    expect(report.total_operations).toBe(0);
    expect(repo.totalRows()).toBe(0);
  });

  it("checksum שאינו תואם לתוכן נדחה", () => {
    const envelope = buildRehearsalEnvelope();
    envelope.metadata.integrity.checksum = "deadbeef";
    const report = run(envelope);

    expect(report.integrity_checksum_matches).toBe(false);
    expect(report.ok).toBe(false);
    expect(repo.totalRows()).toBe(0);
  });

  it("מזהים כפולים נתפסים באימות ולא נכתבים", () => {
    const entities = buildRehearsalEntities();
    const home = entities.home as Record<string, unknown>;
    const sets = home.sets as Array<Record<string, unknown>>;
    sets.push({ ...sets[0] });
    const report = run(reseal(buildRehearsalEnvelope(entities)));

    expect(report.validation.ok).toBe(false);
    expect(report.validation.issues.some((i) => i.code === "duplicate_id")).toBe(true);
    expect(repo.totalRows()).toBe(0);
  });

  it("קובץ תקין עובר אימות ושלמות", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.validation.ok).toBe(true);
    expect(report.integrity_checksum_matches).toBe(true);
    expect(report.integrity_total_records_matches).toBe(true);
    expect(report.ok).toBe(true);
  });

  it("מקבל גם מחרוזת JSON", () => {
    const report = run(JSON.stringify(buildRehearsalEnvelope()));
    expect(report.ok).toBe(true);
    expect(report.inserted).toBeGreaterThan(0);
  });
});

// ---------- dependency order ----------

describe("סדר תלויות", () => {
  it("הסדר נגזר טופולוגית — הורה תמיד לפני ילד", () => {
    const order = topologicalImportOrder();
    const position = new Map(order.map((t, i) => [t, i]));

    for (const def of CLOUD_ENTITIES) {
      for (const parent of def.parents) {
        if (parent.table === def.table) continue; // self-reference
        expect(position.get(parent.table)).toBeLessThan(position.get(def.table) as number);
      }
    }
  });

  it("הסדר דטרמיניסטי בין הרצות", () => {
    expect(topologicalImportOrder()).toEqual(topologicalImportOrder());
  });

  it("taxonomy קודם לתרגילים, תרגילים קודמים לתבניות, סטים אחרונים", () => {
    const order = topologicalImportOrder();
    const at = (t: string) => order.indexOf(t);
    expect(at("muscle_groups")).toBeLessThan(at("exercises"));
    expect(at("exercises")).toBeLessThan(at("home_template_entries"));
    expect(at("home_templates")).toBeLessThan(at("home_template_entries"));
    expect(at("home_sessions")).toBeLessThan(at("home_session_entries"));
    expect(at("home_session_entries")).toBeLessThan(at("home_session_sets"));
  });

  it("בפועל: כל הורה נכתב לפני הילד ברשימת הפעולות", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.dependency_order_respected).toBe(true);
    expect(report.dependency_failures).toEqual([]);

    const seen = new Set<string>();
    for (const op of report.operations) {
      for (const parent of op.parent_dependencies) {
        expect(seen.has(`${parent.table}#${parent.id}`)).toBe(true);
      }
      seen.add(op.operation_id);
    }
  });

  it("ילד עם הורה חסר נדחה, מדווח, ואינו נכתב", () => {
    const entities = buildRehearsalEntities();
    const home = entities.home as Record<string, unknown>;
    // ההורה החסר הוא `exercise_id` — קשר ש-`REFERENCE_RULES` של הגיבוי **אינו**
    // מכסה, ולכן האימות הקנוני עובר וה-pipeline הוא זה שנבחן כאן. זו בדיוק
    // ההגנה השנייה: גרף התלויות עומד בפני עצמו ואינו נשען על האימות.
    for (const entry of home.entries as Array<Record<string, unknown>>) {
      entry.exercise_id = "ex_does_not_exist";
    }
    const report = run(reseal(buildRehearsalEnvelope(entities)));

    expect(report.validation.ok).toBe(true);
    expect(report.ok).toBe(false);
    expect(report.rejected).toBeGreaterThan(0);
    expect(report.dependency_failures.some((f) => f.table === "home_session_entries")).toBe(true);
    expect(repo.count("home_session_entries")).toBe(0);
    // ה-sets של אותם entries נופלים גם הם — ולא נכתבים "יתומים".
    expect(repo.count("home_session_sets")).toBe(0);
  });

  it("template entry נשמר בסדר ה-sequence שלו", () => {
    run(buildRehearsalEnvelope());
    const entries = repo
      .list("home_template_entries")
      .map((r) => ({ id: r.id, sequence: r.sequence }));

    expect(entries).toEqual([
      { id: "htpe_1", sequence: 0 },
      { id: "htpe_2", sequence: 1 },
      { id: "htpe_3", sequence: 2 },
    ]);
  });

  it("set נשמר תחת ה-entry הנכון ובסדר set_number", () => {
    run(buildRehearsalEnvelope());
    const sets = repo.list("home_session_sets");
    expect(sets.map((s) => [s.id, s.entry_id, s.set_number])).toEqual([
      ["hset_1", "he_1", 1],
      ["hset_3", "he_2", 1],
      ["hset_2", "he_1", 2],
    ]);
    // כל סט מצביע ל-entry שקיים בענן.
    for (const set of sets) {
      expect(repo.has("home_session_entries", set.entry_id as string)).toBe(true);
    }
  });

  it("entry נשמר תחת ה-session הנכון", () => {
    run(buildRehearsalEnvelope());
    for (const entry of repo.list("home_session_entries")) {
      expect(entry.home_session_id).toBe("hs_2026_07_20");
      expect(repo.has("home_sessions", "hs_2026_07_20")).toBe(true);
    }
  });
});

// ---------- הגנה כפולה: validateBackup + pipeline ----------

describe("הפניה שבורה ב-home.entries נתפסת בשתי השכבות", () => {
  /**
   * היה כאן **פער מוכח (R-24)**: `REFERENCE_RULES` ב-`src/lib/backup/repo.ts` בדק
   * את השדה `session_id` עבור `home.entries`, בעוד השדה בפועל הוא
   * **`home_session_id`** (`HomeExerciseEntry`), ולכן הכלל לא ירה מעולם.
   * הפער **תוקן** (ADR-0037): האימות הקנוני מדווח כעת `dangling_reference`,
   * וה-pipeline ממשיך לחסום באופן עצמאי — הגנה כפולה, לא תלות בשכבה אחת.
   */
  it("האימות תופס את ההפניה, והקובץ נדחה כולו לפני שנכתבת שורה אחת", () => {
    const entities = buildRehearsalEntities();
    const home = entities.home as Record<string, unknown>;
    const entries = home.entries as Array<Record<string, unknown>>;
    entries[0].home_session_id = "hs_does_not_exist";

    const report = run(reseal(buildRehearsalEnvelope(entities)));

    // שכבה 1 — האימות הקנוני תופס כעת את ההפניה השבורה (R-24 תוקן).
    expect(report.validation.ok).toBe(false);
    const issue = report.validation.issues.find((i) => i.code === "dangling_reference");
    expect(issue?.scope).toBe("home.entries → home.sessions");
    expect(issue?.ids).toContain("he_1");

    // הקובץ נדחה כולו — שום שורה אינה נכתבת, גם לא רשומות תקינות.
    expect(report.ok).toBe(false);
    expect(repo.totalRows()).toBe(0);
    expect(repo.has("home_session_entries", "he_1")).toBe(false);
    expect(repo.has("home_session_sets", "hset_1")).toBe(false);
  });
});

// ---------- ownership ----------

describe("ownership — רק מה-session המאומת", () => {
  it("כל רשומה בבעלות משתמש מקבלת את authenticatedUserId", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.ownership.user_owned_rows).toBeGreaterThan(0);
    expect(report.ownership.rows_with_authenticated_owner).toBe(report.ownership.user_owned_rows);
    expect(report.ownership.rows_with_foreign_owner).toBe(0);

    expect(repo.get("home_templates", "htpl_morning")?.user_id).toBe(AUTHENTICATED_USER);
    expect(repo.get("home_sessions", "hs_2026_07_20")?.user_id).toBe(AUTHENTICATED_USER);
    expect(repo.get("goals", "goal_pushups")?.user_id).toBe(AUTHENTICATED_USER);
  });

  it("user_id זדוני בקובץ אינו משפיע על הבעלות בענן", () => {
    const entities = buildRehearsalEntities();
    const goals = entities.goals as Record<string, unknown>;
    (goals.goals as Array<Record<string, unknown>>)[0].user_id = "attacker-9999";

    run(reseal(buildRehearsalEnvelope(entities)));

    const stored = repo.get("goals", "goal_pushups");
    expect(stored?.user_id).toBe(AUTHENTICATED_USER);
    // הערך מהקובץ נשמר כמטא-דאטה של מקור בלבד, ולא כשדה הרשאה.
    expect(stored?.source_metadata).toEqual({ source_owner_id: "attacker-9999" });
  });

  it("owner_id מהקובץ אינו מופיע כשדה הרשאה", () => {
    run(buildRehearsalEnvelope());
    const template = repo.get("home_templates", "htpl_morning");
    expect(template).not.toHaveProperty("owner_id");
    expect(template?.source_metadata).toEqual({ source_owner_id: SOURCE_OWNER });
  });

  it("שתי הרצות עם משתמשים שונים אינן חולקות ownership", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope, AUTHENTICATED_USER);

    const otherRepo = new InMemoryCloudRepository();
    runCloudImport(envelope, { repo: otherRepo, authenticatedUserId: OTHER_USER });

    expect(repo.get("goals", "goal_pushups")?.user_id).toBe(AUTHENTICATED_USER);
    expect(otherRepo.get("goals", "goal_pushups")?.user_id).toBe(OTHER_USER);
    // אותו מזהה עסקי — בעלות שונה. זהות הרשומה אינה בעלות.
    expect(repo.get("goals", "goal_pushups")?.id).toBe(
      otherRepo.get("goals", "goal_pushups")?.id,
    );
  });

  it("taxonomy מערכתי אינו מקבל בעלות משתמש", () => {
    run(buildRehearsalEnvelope());
    expect(repo.get("muscle_groups", "mg_chest")?.user_id).toBeNull();
    expect(repo.get("exercises", "ex_push-up")?.user_id).toBeNull();
    expect(repo.get("exercises", "ex_push-up")?.is_system).toBe(true);
  });

  it("תרגיל מותאם של המשתמש כן מקבל בעלות", () => {
    const report = run(buildRehearsalEnvelope());
    expect(repo.get("exercises", "ex_custom-wall-press")?.user_id).toBe(AUTHENTICATED_USER);
    expect(report.ownership.system_rows).toBeGreaterThan(0);
  });

  it("שדות סוד לעולם אינם עוברים ל-payload", () => {
    const entities = buildRehearsalEntities();
    const goals = entities.goals as Record<string, unknown>;
    const goal = (goals.goals as Array<Record<string, unknown>>)[0];
    goal.access_token = "should-never-travel";
    goal.service_role_key = "nope";

    run(reseal(buildRehearsalEnvelope(entities)));

    const stored = repo.get("goals", "goal_pushups") as Record<string, unknown>;
    expect(stored).not.toHaveProperty("access_token");
    expect(stored).not.toHaveProperty("service_role_key");
  });
});

// ---------- idempotency & conflicts ----------

describe("idempotency", () => {
  it("ייבוא שני של אותו קובץ אינו יוצר דבר", () => {
    const envelope = buildRehearsalEnvelope();
    const first = run(envelope);
    const rowsAfterFirst = repo.totalRows();

    const second = run(envelope);

    expect(first.inserted).toBeGreaterThan(0);
    expect(second.inserted).toBe(0);
    expect(second.conflicts).toBe(0);
    expect(second.rejected).toBe(0);
    expect(second.unchanged).toBe(first.inserted);
    expect(repo.totalRows()).toBe(rowsAfterFirst);
  });

  it("מזהים, קשרים, סדר וחותמות זמן זהים אחרי הייבוא השני", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope);
    const snapshot = JSON.stringify(
      repo.tables().map((t) => [t, repo.list(t)]),
    );

    run(envelope);
    expect(JSON.stringify(repo.tables().map((t) => [t, repo.list(t)]))).toBe(snapshot);
  });

  it("ייבוא שלישי גם הוא no-op", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope);
    run(envelope);
    const third = run(envelope);
    expect(third.inserted).toBe(0);
    expect(third.conflicts).toBe(0);
  });
});

describe("conflicts", () => {
  it("אותו id + תוכן שונה → conflict מדווח עם entity type ו-ID", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope);

    const mutated = buildRehearsalEntities();
    const goals = mutated.goals as Record<string, unknown>;
    (goals.goals as Array<Record<string, unknown>>)[0].target_value = 25;
    const report = run(reseal(buildRehearsalEnvelope(mutated)));

    expect(report.conflicts).toBe(1);
    expect(report.conflict_details).toEqual([
      { entity_type: "goals", entity_id: "goal_pushups", fields: ["target_value"] },
    ]);
  });

  it("קונפליקט אינו משנה את הרשומה הקיימת", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope);
    const before = repo.get("goals", "goal_pushups");

    const mutated = buildRehearsalEntities();
    const goals = mutated.goals as Record<string, unknown>;
    (goals.goals as Array<Record<string, unknown>>)[0].target_value = 25;
    run(reseal(buildRehearsalEnvelope(mutated)));

    expect(repo.get("goals", "goal_pushups")).toEqual(before);
    expect(repo.get("goals", "goal_pushups")?.target_value).toBe(20);
    expect(repo.count("goals")).toBe(1);
  });

  it("קונפליקט אינו יוצר מזהה חדש ואינו מכפיל רשומות", () => {
    const envelope = buildRehearsalEnvelope();
    run(envelope);
    const rows = repo.totalRows();

    const mutated = buildRehearsalEntities();
    const goals = mutated.goals as Record<string, unknown>;
    (goals.goals as Array<Record<string, unknown>>)[0].name = "שם אחר";
    run(reseal(buildRehearsalEnvelope(mutated)));

    expect(repo.totalRows()).toBe(rows);
    expect(repo.ids("goals")).toEqual(["goal_pushups"]);
  });
});

// ---------- operations & report ----------

describe("פעולות ודוח", () => {
  it("operation_id דטרמיניסטי ונגזר מהמזהה היציב", () => {
    const envelope = buildRehearsalEnvelope();
    const a = runCloudImport(envelope, {
      repo: new InMemoryCloudRepository(),
      authenticatedUserId: AUTHENTICATED_USER,
    });
    const b = runCloudImport(envelope, {
      repo: new InMemoryCloudRepository(),
      authenticatedUserId: AUTHENTICATED_USER,
    });

    expect(a.operations.map((o) => o.operation_id)).toEqual(
      b.operations.map((o) => o.operation_id),
    );
    expect(a.operations.find((o) => o.entity_id === "goal_pushups")?.operation_id).toBe(
      "goals#goal_pushups",
    );
  });

  it("כל פעולה כוללת את שדות החוזה", () => {
    const report = run(buildRehearsalEnvelope());
    for (const op of report.operations) {
      expect(typeof op.operation_id).toBe("string");
      expect(typeof op.entity_type).toBe("string");
      expect(typeof op.entity_id).toBe("string");
      expect(op.action).toBe("upsert");
      expect(Array.isArray(op.parent_dependencies)).toBe(true);
      expect(typeof op.payload).toBe("object");
      expect(op.result).not.toBe("rejected");
    }
  });

  it("per_entity מסכם נכון", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.per_entity.home_template_entries).toEqual({
      total: 3,
      inserted: 3,
      unchanged: 0,
      conflicts: 0,
      rejected: 0,
    });
    expect(report.per_entity.home_session_sets.inserted).toBe(3);
  });

  it("אוסף ללא mapping מדווח כ-unsupported ולא נבלע", () => {
    const entities = buildRehearsalEntities();
    (entities.home as Record<string, unknown>).mysteryCollection = [{ id: "x" }];
    const report = run(reseal(buildRehearsalEnvelope(entities)));

    expect(report.unsupported_entities).toContain("home.mysteryCollection");
  });

  it("אוספים מקומיים בלבד אינם מדווחים כ-unsupported", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.unsupported_entities).toEqual([]);
  });

  it("preferences מדווח כ-deferred — לא הועבר, ולא נבלע בשקט", () => {
    const report = run(buildRehearsalEnvelope());
    expect(report.deferred_entities).toEqual(["preferences"]);
    // ובאמת אין לו טבלה בענן.
    expect(repo.count("profiles")).toBe(0);
  });
});
