/**
 * Curated home catalog — תקינות הנתונים.
 * הבדיקה הקריטית: כל slug ב-`HOME_GROUPS` חייב להתקיים במאגר בפועל, אחרת
 * הקבוצה תוצג ריקה למשתמש.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { listExercises } from "@/lib/exercises";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";
import {
  HOME_GROUPS,
  curatedGroups,
  curatedSlugs,
  homeEquipmentOf,
  matchesQuery,
} from "@/lib/exercises/homeCatalog";

beforeEach(() => {
  _resetExercisesStateForTests();
});

describe("curated home catalog — תקינות", () => {
  it("כל slug ב-curated קיים במאגר בפועל", () => {
    const bySlug = new Map(listExercises().map((e) => [e.slug, e]));
    const missing = curatedSlugs().filter((slug) => !bySlug.has(slug));
    expect(missing).toEqual([]);
  });

  it("אין כפילויות של slug בין הקבוצות", () => {
    const slugs = curatedSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("הקטלוג המוצג אינו עולה על 36 תרגילים", () => {
    expect(curatedSlugs().length).toBeLessThanOrEqual(36);
    expect(curatedSlugs().length).toBeGreaterThanOrEqual(30);
  });

  it("6 קבוצות, כל אחת עם לפחות 4 תרגילים שנפתרים בפועל", () => {
    const groups = curatedGroups(listExercises());
    expect(groups.length).toBe(6);
    for (const g of groups) {
      expect(g.exercises.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("כל תרגיל curated נושא name_he ו-tracking type", () => {
    for (const { exercises } of curatedGroups(listExercises())) {
      for (const e of exercises) {
        expect(e.name_he.length).toBeGreaterThan(0);
        expect(e.tracking_type).toBeTruthy();
      }
    }
  });
});

describe("פילטר ציוד פשוט", () => {
  it("תרגיל ללא ציוד נדרש מסווג כ'ללא ציוד'", () => {
    const pushUps = listExercises().find((e) => e.slug === "push-ups");
    expect(pushUps).toBeDefined();
    expect(homeEquipmentOf(pushUps!)).toBe("none");
  });

  it("תרגיל גומייה מסווג כ-band", () => {
    const bandRow = listExercises().find((e) => e.slug === "band-row");
    expect(bandRow).toBeDefined();
    expect(homeEquipmentOf(bandRow!)).toBe("band");
  });

  it("תרגיל מתח מסווג כ-pullup_bar", () => {
    const pullUps = listExercises().find((e) => e.slug === "pull-ups");
    expect(pullUps).toBeDefined();
    expect(homeEquipmentOf(pullUps!)).toBe("pullup_bar");
  });
});

describe("חיפוש בעברית ובאנגלית", () => {
  it("מוצא לפי שם עברי", () => {
    const pushUps = listExercises().find((e) => e.slug === "push-ups")!;
    expect(matchesQuery(pushUps, "שכיבות")).toBe(true);
  });

  it("מוצא לפי שם אנגלי, ללא תלות ברישיות", () => {
    const pushUps = listExercises().find((e) => e.slug === "push-ups")!;
    expect(matchesQuery(pushUps, "push")).toBe(true);
    expect(matchesQuery(pushUps, "PUSH-UPS")).toBe(true);
  });

  it("אינו מוצא מחרוזת שאינה קיימת", () => {
    const pushUps = listExercises().find((e) => e.slug === "push-ups")!;
    expect(matchesQuery(pushUps, "דדליפט")).toBe(false);
  });

  it("שאילתה ריקה מחזירה הכול", () => {
    const pushUps = listExercises().find((e) => e.slug === "push-ups")!;
    expect(matchesQuery(pushUps, "   ")).toBe(true);
  });
});

describe("שמירת תאימות IDs", () => {
  it("ה-id נגזר מה-slug ולכן יציב בין הרצות", () => {
    const first = listExercises().find((e) => e.slug === "push-ups");
    _resetExercisesStateForTests();
    const second = listExercises().find((e) => e.slug === "push-ups");
    expect(first?.id).toBe(second?.id);
    expect(first?.id).toBe("ex_push-ups");
  });

  it("HOME_GROUPS משתמש בתוויות בשפת משתמש, לא בקודים טכניים", () => {
    const labels = HOME_GROUPS.map((g) => g.label);
    expect(labels).toEqual([
      "חזה ודחיפה",
      "גב ומשיכה",
      "רגליים וישבן",
      "ליבה",
      "כתפיים וידיים",
      "גוף מלא ותנועה",
    ]);
  });
});
