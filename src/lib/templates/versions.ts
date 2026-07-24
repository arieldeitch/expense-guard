/**
 * Version / snapshot services.
 * buildTemplateSnapshot: מייצר snapshot מלא של תבנית (מבנה + תרגילים) לפי state הנוכחי.
 * משמש הן לגרסאות (workout_template_versions) והן ל־session start (immutable snapshot).
 */
import { listBlocks, listBlockExercises, getTemplate } from "./repo";
import type { WorkoutTemplateSnapshot } from "./types";

export function buildTemplateSnapshot(templateId: string): WorkoutTemplateSnapshot | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const blocks = listBlocks(templateId).map((b) => {
    const exercises = listBlockExercises(b.id).map(
      ({ created_at: _c, updated_at: _u, deleted_at: _d, ...rest }) => rest,
    );
    const { created_at: _c, updated_at: _u, deleted_at: _d, ...rest } = b;
    return { ...rest, exercises };
  });
  const { created_at: _c, updated_at: _u, deleted_at: _d, ...templateRest } = template;
  return { template: templateRest, blocks };
}
