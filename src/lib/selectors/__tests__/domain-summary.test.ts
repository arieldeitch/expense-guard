import { describe, it, expect } from "vitest";
import { computeDomainSummary, formatDaysSince } from "../domain-summary";
import type { Activity, Goal } from "@/lib/repo";

const NOW = new Date("2026-07-15T12:00:00Z");
const monthStartIso = new Date(NOW.getFullYear(), NOW.getMonth(), 1).toISOString();

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? "a1",
    domain: overrides.domain ?? "running",
    occurredAt: overrides.occurredAt ?? new Date(NOW.getTime() - 86_400_000).toISOString(),
    distanceM: overrides.distanceM ?? null,
    durationS: overrides.durationS ?? null,
    totalReps: overrides.totalReps ?? null,
    paceSPerKm: overrides.paceSPerKm ?? null,
  };
}

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: overrides.id ?? "g1",
    domain: overrides.domain ?? "running",
    title: overrides.title ?? "יעד",
    targetValue: overrides.targetValue ?? 100,
    targetUnit: overrides.targetUnit ?? "ק״מ",
    currentValue: overrides.currentValue ?? 0,
    priority: overrides.priority ?? 1,
    status: overrides.status ?? "active",
  };
}

describe("computeDomainSummary — running", () => {
  it("מחזיר empty summary כשאין activities וגם אין goals", () => {
    const s = computeDomainSummary("running", [], [], NOW);
    expect(s.hasAnyActivity).toBe(false);
    expect(s.primary.value).toBeNull();
    expect(s.primary.unit).toBe("ק״מ");
    expect(s.activeGoal).toBeNull();
    expect(s.lastActivityAt).toBeNull();
    expect(s.daysSinceLast).toBeNull();
  });

  it("מסכם מרחק החודש בק״מ עם עיגול תקין", () => {
    const s = computeDomainSummary(
      "running",
      [
        activity({ id: "r1", distanceM: 5000, occurredAt: monthStartIso }),
        activity({ id: "r2", distanceM: 7234, occurredAt: NOW.toISOString() }),
      ],
      [],
      NOW,
    );
    expect(s.hasAnyActivity).toBe(true);
    expect(s.primary.value).toBeCloseTo(12.2, 1);
    expect(s.secondary?.value).toBe(2);
  });

  it("לא מונה activities מחודש קודם", () => {
    const previousMonth = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 15).toISOString();
    const s = computeDomainSummary(
      "running",
      [activity({ distanceM: 9000, occurredAt: previousMonth })],
      [],
      NOW,
    );
    expect(s.hasAnyActivity).toBe(true);
    expect(s.primary.value).toBe(0);
    expect(s.secondary?.value).toBe(0);
  });

  it("מציג רק את היעד עם priority הכי נמוך, סופר יעדים נוספים", () => {
    const s = computeDomainSummary(
      "running",
      [],
      [
        goal({ id: "g1", title: "ראשי", priority: 1, currentValue: 12, targetValue: 20 }),
        goal({ id: "g2", title: "שני", priority: 2 }),
        goal({ id: "g3", title: "מושהה", priority: 0, status: "paused" }),
      ],
      NOW,
    );
    expect(s.activeGoal?.id).toBe("g1");
    expect(s.activeGoal?.percent).toBe(60);
    expect(s.otherActiveGoalsCount).toBe(1);
  });

  it("מכסה percent על 100 כשמעל היעד", () => {
    const s = computeDomainSummary(
      "running",
      [],
      [goal({ currentValue: 250, targetValue: 100 })],
      NOW,
    );
    expect(s.activeGoal?.percent).toBe(100);
  });
});

describe("computeDomainSummary — gym / home", () => {
  it("gym: מדד ראשי = ספירת אימונים החודש, אין secondary", () => {
    const s = computeDomainSummary(
      "gym",
      [
        activity({ domain: "gym", occurredAt: NOW.toISOString() }),
        activity({ domain: "gym", id: "g2", occurredAt: monthStartIso }),
        activity({ domain: "running", id: "r1" }), // מסנן
      ],
      [],
      NOW,
    );
    expect(s.primary.value).toBe(2);
    expect(s.primary.unit).toBe("אימונים");
    expect(s.secondary).toBeNull();
  });

  it("home: פועל בדומה ל־gym", () => {
    const s = computeDomainSummary(
      "home",
      [activity({ domain: "home", occurredAt: NOW.toISOString() })],
      [],
      NOW,
    );
    expect(s.primary.value).toBe(1);
    expect(s.primary.unit).toBe("אימונים");
  });
});

describe("daysSinceLast", () => {
  it("מחשב לפי הפעילות האחרונה בין הפעילויות של הדומיין בלבד", () => {
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();
    const s = computeDomainSummary(
      "running",
      [
        activity({ id: "r1", occurredAt: twoDaysAgo }),
        activity({ id: "g1", domain: "gym", occurredAt: NOW.toISOString() }),
      ],
      [],
      NOW,
    );
    expect(s.daysSinceLast).toBe(2);
  });
});

describe("formatDaysSince", () => {
  it.each([
    [null, null],
    [0, "היום"],
    [1, "אתמול"],
    [5, "לפני 5 ימים"],
  ])("(%s) => %s", (input, expected) => {
    expect(formatDaysSince(input as number | null)).toBe(expected);
  });
});
