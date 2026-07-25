/**
 * Workout Execution — רגרסיות ברמת ה-repository.
 *
 * מוקד: **אין אובדן נתונים**. דילוג על תרגיל וסיום חלקי חייבים לשמר סטים
 * שכבר בוצעו, כולל הערכים שהוזנו. בנוסף: סטטוס ההתמדה משקף כתיבה בפועל.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetSessionsStateForTests,
  addExerciseToSession,
  addSet,
  completeSet,
  finishSessionPartial,
  getPersistenceStatus,
  getSession,
  listExerciseSets,
  listSessionExercises,
  skipExercise,
  startEmptySession,
  substituteExercise,
  unskipExercise,
  updateSet,
} from "@/lib/sessions";
import { listExercises } from "@/lib/exercises";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";

beforeEach(() => {
  _resetSessionsStateForTests();
  _resetExercisesStateForTests();
});

/**
 * אימון עם תרגיל אחד; הסט הראשון בוצע עם ערכים אמיתיים, השאר פתוחים.
 * מספר הסטים ההתחלתי נקבע ע"י ה-snapshot של התרגיל — לכן נמדד ולא מונח.
 */
function sessionWithOnePerformedSet() {
  const exercises = listExercises();
  const session = startEmptySession("אימון בדיקה");
  const se = addExerciseToSession(session.id, exercises[0].id, { asNewBlock: true });
  if (!se) throw new Error("addExerciseToSession returned null");
  let sets = listExerciseSets(se.id);
  if (sets.length < 2) {
    addSet(se.id);
    sets = listExerciseSets(se.id);
  }
  updateSet(sets[0].id, { actual_weight: 60, actual_reps: 8, rpe: 8 });
  completeSet(sets[0].id);
  sets = listExerciseSets(se.id);
  return { session, se, sets, initialCount: sets.length };
}

describe("skipExercise — דילוג לא מוחק סטים שבוצעו", () => {
  it("שומר את הסט שבוצע ואת ערכיו, ומסמן רק את הנותרים כדולגו", () => {
    const { se, initialCount } = sessionWithOnePerformedSet();

    skipExercise(se.id);

    const after = listExerciseSets(se.id);
    expect(after.length).toBe(initialCount); // שום סט לא נמחק

    const performed = after[0];
    expect(performed.completed).toBe(true);
    expect(performed.skipped).toBe(false);
    expect(performed.actual_weight).toBe(60);
    expect(performed.actual_reps).toBe(8);
    expect(performed.rpe).toBe(8);

    // כל היתר — דולגו, אף אחד לא הושלם בטעות
    for (const s of after.slice(1)) {
      expect(s.skipped).toBe(true);
      expect(s.completed).toBe(false);
    }
  });

  it("התרגיל מסומן כהושלם כשכל סטיו completed או skipped", () => {
    const { se } = sessionWithOnePerformedSet();
    skipExercise(se.id);
    const ex = listSessionExercises(getSession(se.session_id)!.id).find((e) => e.id === se.id);
    expect(ex?.completed).toBe(true);
  });

  it("unskipExercise מחזיר את הדולגים בלבד ולא נוגע בסט שבוצע", () => {
    const { se } = sessionWithOnePerformedSet();
    skipExercise(se.id);
    unskipExercise(se.id);

    const after = listExerciseSets(se.id);
    expect(after[0].completed).toBe(true); // שבוצע — לא הושפע
    expect(after[0].actual_weight).toBe(60);
    expect(after[1].skipped).toBe(false);
    expect(after[1].completed).toBe(false);
  });
});

describe("finishSessionPartial — סיום חלקי הוא מצב תקף", () => {
  it("מסיים את האימון, שומר את מה שבוצע ומסמן את הנותר כדולג", () => {
    const { session, se } = sessionWithOnePerformedSet();

    const finished = finishSessionPartial(session.id);

    expect(finished?.status).toBe("completed");
    expect(finished?.ended_at).not.toBeNull();

    const after = listExerciseSets(se.id);
    expect(after[0].completed).toBe(true);
    expect(after[0].actual_weight).toBe(60);
    expect(after[0].actual_reps).toBe(8);
    expect(after[1].skipped).toBe(true);
  });

  it("אינו משנה סטים שכבר דולגו ואינו מוחק דבר", () => {
    const { session, se, sets, initialCount } = sessionWithOnePerformedSet();
    updateSet(sets[1].id, { skipped: true, actual_reps: 3 });

    finishSessionPartial(session.id);

    const after = listExerciseSets(se.id);
    expect(after.length).toBe(initialCount);
    expect(after[1].skipped).toBe(true);
    expect(after[1].actual_reps).toBe(3); // ערך שהוזן נשמר
  });
});

describe("substituteExercise — החלפה לא מוחקת סטים", () => {
  it("שומרת את הסטים ואת הערכים שהוזנו", () => {
    const exercises = listExercises();
    const { se, initialCount } = sessionWithOnePerformedSet();
    const replacement = exercises.find((e) => e.id !== se.exercise_id);
    if (!replacement) throw new Error("no replacement exercise in catalog");

    substituteExercise(se.id, replacement.id);

    const after = listExerciseSets(se.id);
    expect(after.length).toBe(initialCount);
    expect(after[0].completed).toBe(true);
    expect(after[0].actual_weight).toBe(60);
    expect(after[0].actual_reps).toBe(8);
  });
});

describe("persistence status — ה-UI לא מכריז 'נשמר' ללא כתיבה מאומתת", () => {
  it("idle לפני כל כתיבה", () => {
    expect(getPersistenceStatus()).toBe("idle");
  });

  it("ללא localStorage (סביבת node) הסטטוס הוא memory ולא saved", () => {
    // זו בדיוק ההגנה: נפילה ל-in-memory לא תוצג למשתמש כ"נשמר".
    // ההתנהגות עם localStorage אמיתי נבדקת ב-workoutExecution.test.tsx (jsdom).
    expect(typeof localStorage).toBe("undefined");
    startEmptySession("אימון");
    expect(getPersistenceStatus()).toBe("memory");
  });
});
