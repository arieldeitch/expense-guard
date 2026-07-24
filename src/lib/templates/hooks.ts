/**
 * Reactive hooks לקוד UI. subscribes ל־storage listeners.
 */
import { useSyncExternalStore } from "react";
import { readTemplatesState, readTemplatesServerSnapshot, subscribeTemplates } from "./storage";
import * as repo from "./repo";
import type {
  WorkoutTemplate,
  WorkoutTemplateBlock,
  WorkoutTemplateExercise,
  WorkoutTemplateVersion,
} from "./types";

function useTemplatesState() {
  return useSyncExternalStore(subscribeTemplates, readTemplatesState, readTemplatesServerSnapshot);
}

export function useAllTemplates(): WorkoutTemplate[] {
  useTemplatesState();
  return repo.listTemplates();
}

export function useArchivedTemplates(): WorkoutTemplate[] {
  useTemplatesState();
  return repo.listTemplates({ includeArchived: true }).filter((t) => t.status === "archived");
}

export function useTrashedTemplates(): WorkoutTemplate[] {
  useTemplatesState();
  return repo.listTrashedTemplates();
}

export function useTemplate(id: string | undefined): WorkoutTemplate | null {
  useTemplatesState();
  if (!id) return null;
  return repo.getTemplate(id);
}

export function useTemplateBlocks(templateId: string | undefined): WorkoutTemplateBlock[] {
  useTemplatesState();
  if (!templateId) return [];
  return repo.listBlocks(templateId);
}

export function useBlockExercises(blockId: string | undefined): WorkoutTemplateExercise[] {
  useTemplatesState();
  if (!blockId) return [];
  return repo.listBlockExercises(blockId);
}

export function useTemplateExercises(templateId: string | undefined): WorkoutTemplateExercise[] {
  useTemplatesState();
  if (!templateId) return [];
  return repo.listTemplateExercises(templateId);
}

export function useTemplateVersions(templateId: string | undefined): WorkoutTemplateVersion[] {
  useTemplatesState();
  if (!templateId) return [];
  return repo.listVersions(templateId);
}
