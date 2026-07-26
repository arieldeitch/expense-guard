// @vitest-environment jsdom
/**
 * Local schema · migration registry · snapshot & rollback (ADR-0033).
 *
 * הבדיקות עובדות על **מפתחות גולמיים** ולא דרך ה-repositories, כי זה בדיוק
 * החוזה שנבדק: המיגרציה חייבת לשמר גם שדות שהאפליקציה אינה מכירה.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  LEGACY_VERSION,
  LOCAL_SCHEMA_VERSION,
  LOCAL_STORAGE_FORMAT,
  STORAGE_KEY_BY_MODULE,
  STORAGE_META_KEY,
  STORAGE_MODULES,
  buildStorageMeta,
  compareSchemaVersions,
  readLocalSchemaStatus,
  readStorageMeta,
} from "@/lib/storage/schema";
import {
  LOCAL_MIGRATIONS,
  _resetMigrationRunCacheForTests,
  runLocalMigrations,
  runLocalMigrationsOnce,
} from "@/lib/storage/migrations";
import {
  MIGRATION_SNAPSHOT_KEY,
  createMigrationSnapshot,
  readMigrationSnapshot,
  readRawStorageKeys,
  rollbackFromSnapshot,
  verifyMigrationSnapshot,
} from "@/lib/storage/snapshot";

const NOW = new Date("2026-07-25T09:00:00.000Z");

/** נתוני legacy: JSON תקין אך **לא** בסריאליזציה קנונית (רווחים, סדר מפתחות). */
const LEGACY_GOALS = `{\n  "goals": [\n    { "id": "g1", "title": "יעד", "unknownField": "must-survive" }\n  ],\n  "unknownTop": 42\n}`;
const LEGACY_CATALOG = `{\n  "locations": [],\n  "treadmills": [],\n  "equipment": []\n}`;

function seedLegacyDevice() {
  window.localStorage.setItem(STORAGE_KEY_BY_MODULE.goals, LEGACY_GOALS);
  window.localStorage.setItem(STORAGE_KEY_BY_MODULE.catalog, LEGACY_CATALOG);
}

beforeEach(() => {
  window.localStorage.clear();
  _resetMigrationRunCacheForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------- schema metadata ----------

describe("metadata של ה-schema המקומי", () => {
  it("מכשיר ללא metadata נחשב legacy", () => {
    seedLegacyDevice();
    const status = readLocalSchemaStatus();
    expect(status.state).toBe("legacy");
    expect(status.version).toBe(LEGACY_VERSION);
    expect(status.meta).toBeNull();
  });

  it("metadata פגום נחשב legacy ולא מפיל את האפליקציה", () => {
    window.localStorage.setItem(STORAGE_META_KEY, "{not json");
    expect(readLocalSchemaStatus().state).toBe("legacy");
    expect(readStorageMeta()).toBeNull();
  });

  it("המבנה שנכתב תואם לחוזה — format, גרסה, updated_at ותשעת המפתחות", () => {
    const meta = buildStorageMeta(NOW);
    expect(meta).toEqual({
      format: LOCAL_STORAGE_FORMAT,
      schema_version: "1.0.0",
      updated_at: "2026-07-25T09:00:00.000Z",
      storage_keys: [
        "catalog",
        "exercises",
        "goals",
        "home",
        "preferences",
        "runs",
        "sessions",
        "suunto",
        "templates",
      ],
    });
    expect(LOCAL_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("השוואת גרסאות מזהה ישן / זהה / חדש", () => {
    expect(compareSchemaVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareSchemaVersions("0.9.0", "1.0.0")).toBeLessThan(0);
    expect(compareSchemaVersions("1.1.0", "1.0.0")).toBeGreaterThan(0);
    expect(compareSchemaVersions("banana", "1.0.0")).toBeNull();
  });
});

// ---------- registry ----------

describe("registry של המיגרציות", () => {
  it("קיימת מיגרציה מפורשת legacy → 1.0.0", () => {
    const legacy = LOCAL_MIGRATIONS.find((m) => m.from === LEGACY_VERSION);
    expect(legacy).toBeDefined();
    expect(legacy?.to).toBe("1.0.0");
    expect(legacy?.id).toBe("legacy->1.0.0");
  });

  it("המיגרציה קוראת את כל תשעת המפתחות ומחזירה ערך לכל אחד", () => {
    seedLegacyDevice();
    const out = LOCAL_MIGRATIONS[0].run(readRawStorageKeys());
    for (const mod of STORAGE_MODULES) {
      expect(Object.prototype.hasOwnProperty.call(out, mod)).toBe(true);
    }
  });

  it("payload שאינו ניתן ל-parse גורם לזריקה (ולא לנתונים שקטים ושבורים)", () => {
    window.localStorage.setItem(STORAGE_KEY_BY_MODULE.runs, "{broken");
    expect(() => LOCAL_MIGRATIONS[0].run(readRawStorageKeys())).toThrow();
  });

  it("המיגרציה idempotent — הרצה שנייה על הפלט מחזירה אותו פלט", () => {
    seedLegacyDevice();
    const first = LOCAL_MIGRATIONS[0].run(readRawStorageKeys());
    const second = LOCAL_MIGRATIONS[0].run(first);
    expect(second).toEqual(first);
  });
});

// ---------- הרצה מלאה ----------

describe("legacy → 1.0.0", () => {
  it("מיגרציה מוצלחת כותבת metadata ומסמנת migrated", () => {
    seedLegacyDevice();
    const result = runLocalMigrations(NOW);

    expect(result.status).toBe("migrated");
    expect(result.from_version).toBe(LEGACY_VERSION);
    expect(result.target_version).toBe("1.0.0");
    expect(result.applied).toEqual(["legacy->1.0.0"]);
    expect(result.message).toBeNull();

    const meta = readStorageMeta();
    expect(meta?.schema_version).toBe("1.0.0");
    expect(meta?.format).toBe(LOCAL_STORAGE_FORMAT);
    expect(meta?.updated_at).toBe("2026-07-25T09:00:00.000Z");
    expect(readLocalSchemaStatus().state).toBe("current");
  });

  it("שדות לא מוכרים נשמרים במלואם", () => {
    seedLegacyDevice();
    runLocalMigrations(NOW);

    const raw = window.localStorage.getItem(STORAGE_KEY_BY_MODULE.goals) as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.unknownTop).toBe(42);
    expect((parsed.goals as Array<Record<string, unknown>>)[0].unknownField).toBe("must-survive");
    expect((parsed.goals as Array<Record<string, unknown>>)[0].id).toBe("g1");
  });

  it("אין מחיקת נתונים — מפתח שהיה קיים נשאר קיים, מפתח שלא היה נשאר חסר", () => {
    seedLegacyDevice();
    runLocalMigrations(NOW);

    expect(window.localStorage.getItem(STORAGE_KEY_BY_MODULE.goals)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY_BY_MODULE.catalog)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY_BY_MODULE.runs)).toBeNull();
  });

  it("מכשיר ריק לגמרי מגיע ל-1.0.0 ללא כתיבת מפתחות נתונים", () => {
    const result = runLocalMigrations(NOW);
    expect(result.status).toBe("migrated");
    for (const mod of STORAGE_MODULES) {
      expect(window.localStorage.getItem(STORAGE_KEY_BY_MODULE[mod])).toBeNull();
    }
    expect(readStorageMeta()?.schema_version).toBe("1.0.0");
  });

  it("הרצה חוזרת על 1.0.0 היא no-op — אין snapshot חדש ואין כתיבה", () => {
    seedLegacyDevice();
    runLocalMigrations(NOW);
    const afterFirst = readRawStorageKeys();
    const firstSnapshot = readMigrationSnapshot();
    const firstMeta = readStorageMeta();

    const later = new Date("2026-08-01T00:00:00.000Z");
    const second = runLocalMigrations(later);

    expect(second.status).toBe("up_to_date");
    expect(second.applied).toEqual([]);
    expect(second.snapshot_id).toBeNull();
    expect(readRawStorageKeys()).toEqual(afterFirst);
    // metadata לא נכתב מחדש — updated_at נשאר של המיגרציה שבוצעה בפועל.
    expect(readStorageMeta()?.updated_at).toBe(firstMeta?.updated_at);
    expect(readMigrationSnapshot()?.snapshot_id).toBe(firstSnapshot?.snapshot_id);
  });

  it("runLocalMigrationsOnce מריץ פעם אחת בלבד", () => {
    seedLegacyDevice();
    const a = runLocalMigrationsOnce();
    const b = runLocalMigrationsOnce();
    expect(a).toBe(b);
  });
});

// ---------- snapshot ----------

describe("snapshot לפני מיגרציה", () => {
  it("נוצר עם כל השדות הנדרשים ועם checksum תקין", () => {
    seedLegacyDevice();
    runLocalMigrations(NOW);

    const snapshot = readMigrationSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.snapshot_id).toBeTruthy();
    expect(snapshot?.created_at).toBe("2026-07-25T09:00:00.000Z");
    expect(snapshot?.from_version).toBe(LEGACY_VERSION);
    expect(snapshot?.target_version).toBe("1.0.0");
    expect(snapshot?.keys.goals).toBe(LEGACY_GOALS);
    expect(verifyMigrationSnapshot(snapshot!)).toBe(true);
  });

  it("checksum מזהה snapshot שהשתנה", () => {
    seedLegacyDevice();
    const snapshot = createMigrationSnapshot(LEGACY_VERSION, "1.0.0", NOW);
    expect(snapshot).not.toBeNull();
    const tampered = { ...snapshot!, keys: { ...snapshot!.keys, goals: "{}" } };
    expect(verifyMigrationSnapshot(tampered)).toBe(false);
  });

  it("אינו דורס את snapshot ה-Restore של הגיבוי", () => {
    const restoreKey = "fitlog:backup-snapshot:pre-import-x";
    window.localStorage.setItem(restoreKey, '{"format":"workout-data-system"}');
    seedLegacyDevice();
    runLocalMigrations(NOW);

    expect(window.localStorage.getItem(restoreKey)).toBe('{"format":"workout-data-system"}');
    expect(MIGRATION_SNAPSHOT_KEY).not.toContain("backup-snapshot");
  });

  it("כשל ביצירת snapshot עוצר את המיגרציה לפני כל שינוי במקור", () => {
    seedLegacyDevice();
    const before = readRawStorageKeys();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string) => {
      if (key === MIGRATION_SNAPSHOT_KEY) throw new Error("no room");
    });

    const result = runLocalMigrations(NOW);

    expect(result.status).toBe("migration_failed");
    expect(result.snapshot_id).toBeNull();
    expect(readRawStorageKeys()).toEqual(before);
    expect(readStorageMeta()).toBeNull();
  });
});

// ---------- rollback ----------

describe("rollback", () => {
  it("מחזיר את הנתונים בדיוק כפי שהיו", () => {
    seedLegacyDevice();
    const snapshot = createMigrationSnapshot(LEGACY_VERSION, "1.0.0", NOW);
    const before = readRawStorageKeys();

    window.localStorage.setItem(STORAGE_KEY_BY_MODULE.goals, '{"goals":[]}');
    window.localStorage.setItem(STORAGE_KEY_BY_MODULE.runs, '{"runs":[]}');
    expect(readRawStorageKeys()).not.toEqual(before);

    const rollback = rollbackFromSnapshot(snapshot!);

    expect(rollback.ok).toBe(true);
    expect(readRawStorageKeys()).toEqual(before);
    // מפתח שלא היה קיים לפני ה-snapshot נמחק ולא נשאר כשארית.
    expect(window.localStorage.getItem(STORAGE_KEY_BY_MODULE.runs)).toBeNull();
  });

  it("כשל כתיבה באמצע המיגרציה אינו משאיר מצב ביניים ואינו כותב metadata", () => {
    seedLegacyDevice();
    const before = readRawStorageKeys();
    const failingKey = STORAGE_KEY_BY_MODULE.goals;

    const original = Storage.prototype.setItem;
    let alreadyFailed = false;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      // כשל חד-פעמי באמצע הכתיבה (מכסה שהתמלאה זמנית). ה-snapshot נכתב לפניו,
      // וה-rollback שאחריו חייב להצליח — אחרת אין משמעות ל-snapshot.
      if (key === failingKey && !alreadyFailed) {
        alreadyFailed = true;
        throw new Error("quota");
      }
      original.call(this, key, value);
    });

    const result = runLocalMigrations(NOW);

    expect(result.status).toBe("migration_failed");
    expect(result.snapshot_id).not.toBeNull();
    expect(result.rolled_back).toBe(true);
    expect(readStorageMeta()).toBeNull();
    expect(readRawStorageKeys()).toEqual(before);
    expect(readLocalSchemaStatus().state).toBe("legacy");
  });
});

// ---------- חסימות ----------

describe("חסימות ומצבי קצה", () => {
  it("גרסה עתידית נחסמת ואינה משנה נתונים", () => {
    seedLegacyDevice();
    const before = readRawStorageKeys();
    window.localStorage.setItem(
      STORAGE_META_KEY,
      JSON.stringify({
        format: LOCAL_STORAGE_FORMAT,
        schema_version: "2.0.0",
        updated_at: "2026-09-01T00:00:00.000Z",
        storage_keys: [...STORAGE_MODULES],
      }),
    );

    const result = runLocalMigrations(NOW);

    expect(result.status).toBe("future_version_blocked");
    expect(result.from_version).toBe("2.0.0");
    expect(result.applied).toEqual([]);
    expect(result.snapshot_id).toBeNull();
    expect(result.message).toContain("2.0.0");
    expect(readRawStorageKeys()).toEqual(before);
    expect(readStorageMeta()?.schema_version).toBe("2.0.0");
  });

  it("אחסון שאינו זמין מדווח במפורש ואינו נחשב הצלחה", () => {
    vi.stubGlobal("localStorage", undefined);
    const result = runLocalMigrations(NOW);
    expect(result.status).toBe("storage_unavailable");
    expect(result.message).toContain("אינו זמין");
    expect(result.applied).toEqual([]);
    expect(result.snapshot_id).toBeNull();
  });

  it("payload שבור במפתח קיים נכשל בלי לגעת במקור", () => {
    seedLegacyDevice();
    window.localStorage.setItem(STORAGE_KEY_BY_MODULE.home, "{broken");
    const before = readRawStorageKeys();

    const result = runLocalMigrations(NOW);

    expect(result.status).toBe("migration_failed");
    expect(result.message).toContain("legacy->1.0.0");
    expect(readRawStorageKeys()).toEqual(before);
    expect(readStorageMeta()).toBeNull();
  });
});
