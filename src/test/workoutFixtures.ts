/**
 * Fixtures לבדיקות Workout Execution.
 * בונה אימון פעיל אמיתי דרך ה-repository (לא כתיבה ישירה ל-localStorage).
 */
import {
  addExerciseToSession,
  addSet,
  completeSet,
  listExerciseSets,
  startEmptySession,
  updateSet,
  type StrengthSessionExercise,
} from "@/lib/sessions";
import { listExercises } from "@/lib/exercises";

/** מפתח ה-persistence של מודול ה-sessions — מקור האמת לשרידות refresh. */
export const SESSIONS_STORAGE_KEY = "fitlog:sessions:v2";

export interface SeededSession {
  session: ReturnType<typeof startEmptySession>;
  sessionExercise: StrengthSessionExercise;
  exerciseName: string;
  sets: ReturnType<typeof listExerciseSets>;
}

/**
 * אימון פעיל עם תרגיל אחד. הסט הראשון בוצע (60 ק״ג × 8), השאר פתוחים.
 * מספר הסטים נקבע ע"י ה-snapshot של התרגיל — נמדד, לא מונח.
 */
export function seedActiveSession(name = "אימון בדיקה"): SeededSession {
  // בוחר תרגיל משקל+חזרות במפורש — כך שדות המשקל והחזרות תמיד מרונדרים
  // (`SetRow` מציג שדות לפי `tracking_type`), והבדיקה דטרמיניסטית.
  const exercises = listExercises();
  const exercise = exercises.find((e) => e.tracking_type === "weight_reps");
  if (!exercise) throw new Error("no weight_reps exercise in catalog");

  const session = startEmptySession(name);
  const sessionExercise = addExerciseToSession(session.id, exercise.id, { asNewBlock: true });
  if (!sessionExercise) throw new Error("addExerciseToSession returned null");

  let sets = listExerciseSets(sessionExercise.id);
  if (sets.length < 2) {
    addSet(sessionExercise.id);
    sets = listExerciseSets(sessionExercise.id);
  }
  updateSet(sets[0].id, { actual_weight: 60, actual_reps: 8 });
  completeSet(sets[0].id);

  return {
    session,
    sessionExercise,
    exerciseName: sessionExercise.snapshot.exercise_name,
    sets: listExerciseSets(sessionExercise.id),
  };
}
