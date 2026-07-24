/**
 * Public API of the exercises module.
 * ה־UI מייבא רק מ־@/lib/exercises ולא ישירות מ־sub-modules.
 */
export * from "./types";
export * from "./labels";
export * from "./repo";
export * from "./hooks";
export * from "./selectors";
export * from "./availability";
export * from "./alternatives";
export { exerciseFormSchema, normalizeExerciseName, type ExerciseFormValues } from "./schemas";
export { _resetExercisesStateForTests, CURRENT_OWNER_ID as EXERCISES_OWNER_ID } from "./storage";
