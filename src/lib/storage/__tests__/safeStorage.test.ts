// @vitest-environment jsdom
/**
 * safeStorage — הבטחה שאין כשל כתיבה שקט.
 * נבדק ה-primitive המשותף; כל `writeXState` עובר דרכו (ADR-0032).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  _resetStorageStatusesForTests,
  getStorageStatuses,
  getWorstStorageStatus,
  reportWrite,
  safeReadStorage,
  safeWriteStorage,
} from "@/lib/storage/safeStorage";
import { _resetHomeStateForTests, readHomeState, writeHomeState } from "@/lib/home/storage";

const KEY = "fitlog:test:safe-storage";

beforeEach(() => {
  window.localStorage.clear();
  _resetStorageStatusesForTests();
  _resetHomeStateForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("כתיבה תקינה", () => {
  it("מחזירה saved וניתן לקרוא בחזרה", () => {
    const result = safeWriteStorage(KEY, { a: 1 });
    expect(result.status).toBe("saved");
    expect(result.reason).toBeNull();
    expect(result.message).toBeNull();
    expect(JSON.parse(safeReadStorage(KEY) as string)).toEqual({ a: 1 });
  });
});

describe("כשלים אינם נבלעים", () => {
  it("QuotaExceededError → memory_only עם סיבה quota_exceeded והודעה למשתמש", () => {
    const err = new Error("full");
    err.name = "QuotaExceededError";
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw err;
    });

    const result = safeWriteStorage(KEY, { a: 1 });
    expect(result.status).toBe("memory_only");
    expect(result.reason).toBe("quota_exceeded");
    expect(result.message).toBe("לא נשמר בדפדפן. הנתון עלול להיעלם לאחר רענון.");
  });

  it("ערך שאינו ניתן לסריאליזציה → failed", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const result = safeWriteStorage(KEY, circular);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("serialization_failed");
    expect(result.message).toBe("השמירה נכשלה. נסה לייצא גיבוי לפני רענון.");
  });

  it("שגיאת כתיבה לא מזוהה → memory_only עם unknown", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("boom");
    });
    const result = safeWriteStorage(KEY, { a: 1 });
    expect(result.status).toBe("memory_only");
    expect(result.reason).toBe("unknown");
  });
});

describe("registry ומצב מצטבר", () => {
  it("getWorstStorageStatus מחזיר saved כשהכול תקין", () => {
    reportWrite("home", safeWriteStorage(KEY, { a: 1 }));
    expect(getWorstStorageStatus().status).toBe("saved");
  });

  it("memory_only של מודול אחד גובר על saved של אחרים", () => {
    reportWrite("home", { status: "saved", reason: null, message: null });
    reportWrite("goals", { status: "memory_only", reason: "quota_exceeded", message: "x" });
    expect(getWorstStorageStatus().status).toBe("memory_only");
  });

  it("failed גובר על memory_only", () => {
    reportWrite("home", { status: "memory_only", reason: "quota_exceeded", message: "x" });
    reportWrite("runs", { status: "failed", reason: "serialization_failed", message: "y" });
    expect(getWorstStorageStatus().status).toBe("failed");
  });

  it("snapshot יציב בין קריאות ללא שינוי (בטוח ל-useSyncExternalStore)", () => {
    reportWrite("home", { status: "saved", reason: null, message: null });
    const a = getStorageStatuses();
    const b = getStorageStatuses();
    expect(a).toBe(b);
  });

  it("מתאושש ל-saved אחרי שהאחסון חוזר לתפקד", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const e = new Error("full");
      e.name = "QuotaExceededError";
      throw e;
    });
    reportWrite("home", safeWriteStorage(KEY, { a: 1 }));
    expect(getWorstStorageStatus().status).toBe("memory_only");

    spy.mockRestore();
    reportWrite("home", safeWriteStorage(KEY, { a: 2 }));
    expect(getWorstStorageStatus().status).toBe("saved");
  });
});

describe("מודולי האחסון עוברים דרך ה-adapter", () => {
  it("writeHomeState מדווח saved ב-registry", () => {
    writeHomeState({ ...readHomeState() });
    expect(getStorageStatuses().home?.status).toBe("saved");
  });

  it("writeHomeState בזמן מכסה מלאה מדווח memory_only ושומר fallback בזיכרון", () => {
    const err = new Error("full");
    err.name = "QuotaExceededError";
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw err;
    });

    const next = { ...readHomeState() };
    writeHomeState(next);

    expect(getStorageStatuses().home?.status).toBe("memory_only");
    // הנתון עדיין קריא בזיכרון — פשוט לא ישרוד refresh
    expect(readHomeState()).toBeTruthy();
  });
});
