/**
 * React hooks — reactive access ל־exercises state.
 */
import { useSyncExternalStore } from "react";
import { readExercisesState, readExercisesServerSnapshot, subscribeExercises } from "./storage";
import * as repo from "./repo";
import type { Exercise, ExerciseMedia, MuscleGroup } from "./types";

function useExercisesState() {
  return useSyncExternalStore(subscribeExercises, readExercisesState, readExercisesServerSnapshot);
}

export function useAllExercises(): Exercise[] {
  useExercisesState();
  return repo.listExercises();
}

export function useExercise(id: string | undefined): Exercise | null {
  useExercisesState();
  if (!id) return null;
  return repo.getExercise(id);
}

export function useMuscleGroups(): MuscleGroup[] {
  useExercisesState();
  return repo.listMuscleGroups();
}

export function useMuscleGroup(id: string | undefined): MuscleGroup | null {
  useExercisesState();
  if (!id) return null;
  return repo.getMuscleGroup(id);
}

export function useExerciseMedia(exerciseId: string): ExerciseMedia[] {
  useExercisesState();
  return repo.listMediaForExercise(exerciseId);
}

export function useVariationsOf(parentId: string | undefined): Exercise[] {
  useExercisesState();
  if (!parentId) return [];
  return repo.listVariationsOf(parentId);
}

export function useTrashedExercises(): Exercise[] {
  useExercisesState();
  return repo.listExercises().filter((e) => e.deleted_at !== null);
}
