/**
 * Readiness Gate — הגזירה עצמה.
 *
 * הכלל הנבדק כאן: `true` רק אם היכולת הורצה והצליחה. ראיה חסרה או כושלת = `false`.
 * ראה ADR-0036.
 */
import { describe, it, expect } from "vitest";
import {
  NO_EVIDENCE,
  buildReadinessReport,
  type ReadinessEvidence,
  type LocalCapabilityEvidence,
  type RehearsalEvidence,
} from "@/lib/readiness";
import { LOCAL_SCHEMA_VERSION, STORAGE_MODULES } from "@/lib/storage";
import { InMemoryCloudRepository, runCloudImport, type ImportReport } from "@/lib/migration";
import { AUTHENTICATED_USER, buildRehearsalEnvelope } from "@/lib/migration/__tests__/rehearsalFixture";

/** ראיות מקומיות "עוברות" — כולן ערכים שנצפו במצב תקין. */
function passingLocal(): LocalCapabilityEvidence {
  return {
    modulesReportingWrites: [...STORAGE_MODULES],
    worstStatusEscalates: true,
    noticeRoleForSaved: null,
    noticeRoleForMemoryOnly: "status",
    noticeRoleForFailed: "alert",
    schemaState: "current",
    schemaVersion: LOCAL_SCHEMA_VERSION,
    snapshotVerified: true,
    rollbackRestoredExactly: true,
    futureVersionBlocked: true,
    exportValidated: true,
    restoreApplied: true,
    roundTripIdentical: true,
  };
}

/** rehearsal אמיתי — מריץ את ה-pipeline בפועל, לא ממציא מספרים. */
function realRehearsal(): { evidence: RehearsalEvidence; repo: InMemoryCloudRepository } {
  const repo = new InMemoryCloudRepository();
  const envelope = buildRehearsalEnvelope();
  const first = runCloudImport(envelope, { repo, authenticatedUserId: AUTHENTICATED_USER });
  const cloudRowsAfterFirst = repo.totalRows();
  const second = runCloudImport(envelope, { repo, authenticatedUserId: AUTHENTICATED_USER });
  const cloudRowsAfterSecond = repo.totalRows();
  return {
    repo,
    evidence: { first, second, cloudRowsAfterFirst, cloudRowsAfterSecond },
  };
}

function passingEvidence(): ReadinessEvidence {
  const { evidence } = realRehearsal();
  return {
    local: passingLocal(),
    rehearsal: evidence,
    stableIds: { checked: evidence.first.inserted, changed: 0 },
    conflicts: { detected: 1, overwritten: 0 },
  };
}

describe("אין true שאינו נגזר", () => {
  it("ללא ראיות כלל — כל בדיקה false ושני ה-gates false", () => {
    const report = buildReadinessReport(NO_EVIDENCE);
    expect(Object.values(report.checks).every((v) => v === false)).toBe(true);
    expect(report.ready_for_single_device_use).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("כל היכולות עוברות — שני ה-gates true", () => {
    const report = buildReadinessReport(passingEvidence());
    expect(Object.entries(report.checks).filter(([, v]) => !v)).toEqual([]);
    expect(report.ready_for_single_device_use).toBe(true);
    expect(report.ready_for_future_supabase_migration_contract).toBe(true);
  });
});

describe("יכולת חסרה מפילה את ה-gate", () => {
  it("מודול אחד שאינו מדווח כתיבה → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.modulesReportingWrites = STORAGE_MODULES.filter((m) => m !== "runs");
    const report = buildReadinessReport(evidence);

    expect(report.checks.all_writes_report_status).toBe(false);
    expect(report.ready_for_single_device_use).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("כשל שאינו גלוי → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.noticeRoleForFailed = null;
    expect(buildReadinessReport(evidence).checks.all_write_failures_visible).toBe(false);
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });

  it('הצגת "נשמר" כבאנר גם במצב saved → הבדיקה נכשלת', () => {
    const evidence = passingEvidence();
    evidence.local!.noticeRoleForSaved = "status";
    expect(buildReadinessReport(evidence).checks.all_write_failures_visible).toBe(false);
  });

  it("schema legacy → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.schemaState = "legacy";
    expect(buildReadinessReport(evidence).checks.local_schema_version).toBe(false);
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });

  it("snapshot שלא אומת → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.snapshotVerified = false;
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });

  it("rollback שלא הוכח → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.rollbackRestoredExactly = false;
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });

  it("גרסה עתידית שאינה נחסמת → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.futureVersionBlocked = false;
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });

  it("round-trip שאינו זהה → single-device false", () => {
    const evidence = passingEvidence();
    evidence.local!.roundTripIdentical = false;
    expect(buildReadinessReport(evidence).ready_for_single_device_use).toBe(false);
  });
});

describe("ה-gate של הענן", () => {
  it("rehearsal חסר → cloud false, single-device עדיין תלוי בשלו", () => {
    const evidence = passingEvidence();
    evidence.rehearsal = null;
    const report = buildReadinessReport(evidence);

    expect(report.checks.fake_supabase_rehearsal).toBe(false);
    expect(report.checks.idempotent_import).toBe(false);
    expect(report.checks.ownership_mapping).toBe(false);
    expect(report.checks.dependency_order).toBe(false);
    // integrity_validation נשען גם על ה-rehearsal — ולכן גם single-device נופל.
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("rehearsal שנכשל → cloud false", () => {
    const evidence = passingEvidence();
    evidence.rehearsal = {
      ...evidence.rehearsal!,
      first: { ...evidence.rehearsal!.first, ok: false } as ImportReport,
    };
    const report = buildReadinessReport(evidence);
    expect(report.checks.fake_supabase_rehearsal).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("ownership שגוי → cloud false", () => {
    const evidence = passingEvidence();
    evidence.rehearsal!.first = {
      ...evidence.rehearsal!.first,
      ownership: {
        ...evidence.rehearsal!.first.ownership,
        rows_with_foreign_owner: 1,
      },
    };
    const report = buildReadinessReport(evidence);
    expect(report.checks.ownership_mapping).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
    // single-device אינו תלוי ב-ownership.
    expect(report.ready_for_single_device_use).toBe(true);
  });

  it("כשל תלויות → cloud false", () => {
    const evidence = passingEvidence();
    evidence.rehearsal!.first = {
      ...evidence.rehearsal!.first,
      dependency_failures: [
        {
          table: "home_session_sets",
          id: "x",
          field: "entry_id",
          missing_table: "home_session_entries",
          missing_id: "he_missing",
        },
      ],
    };
    const report = buildReadinessReport(evidence);
    expect(report.checks.dependency_order).toBe(false);
    expect(report.ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("ייבוא שני שיוצר רשומות → idempotent false", () => {
    const evidence = passingEvidence();
    evidence.rehearsal!.second = { ...evidence.rehearsal!.second, inserted: 3 };
    expect(buildReadinessReport(evidence).checks.idempotent_import).toBe(false);
    expect(buildReadinessReport(evidence).ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("מזהה שהשתנה → stable_ids false", () => {
    const evidence = passingEvidence();
    evidence.stableIds = { checked: 10, changed: 1 };
    expect(buildReadinessReport(evidence).checks.stable_ids).toBe(false);
  });

  it("stable_ids ללא רשומות שנבדקו אינו נחשב הצלחה", () => {
    const evidence = passingEvidence();
    evidence.stableIds = { checked: 0, changed: 0 };
    expect(buildReadinessReport(evidence).checks.stable_ids).toBe(false);
  });

  it("קונפליקט שלא נבדק כלל → conflict_detection false", () => {
    const evidence = passingEvidence();
    evidence.conflicts = null;
    expect(buildReadinessReport(evidence).checks.conflict_detection).toBe(false);
    expect(buildReadinessReport(evidence).ready_for_future_supabase_migration_contract).toBe(false);
  });

  it("קונפליקט שנדרס → conflict_detection false", () => {
    const evidence = passingEvidence();
    evidence.conflicts = { detected: 1, overwritten: 1 };
    expect(buildReadinessReport(evidence).checks.conflict_detection).toBe(false);
  });
});

describe("מבנה הדוח", () => {
  it("כולל בדיוק את 16 הבדיקות שבחוזה", () => {
    const report = buildReadinessReport(NO_EVIDENCE);
    expect(Object.keys(report.checks).sort()).toEqual(
      [
        "all_write_failures_visible",
        "all_writes_report_status",
        "conflict_detection",
        "dependency_order",
        "export",
        "fake_supabase_rehearsal",
        "future_version_blocked",
        "idempotent_import",
        "integrity_validation",
        "local_schema_version",
        "migration_rollback",
        "migration_snapshot",
        "ownership_mapping",
        "restore",
        "round_trip",
        "stable_ids",
      ].sort(),
    );
  });
});
