/**
 * פק״לים — the two fixed home routines, "פק״לים בוקר" and "פק״לים ערב" (ADR-0045).
 *
 * They are ordinary home TEMPLATES with stable ids, so Ariel opens the same routine every day
 * instead of building a workout from scratch. Everything else in the home module is unchanged:
 * a pakal report is a normal `HomeSession` with entries and sets, so history, metrics, backup
 * and the exercise catalogue keep working.
 *
 * Two rules that come straight from the feedback:
 *  - **Quantity first.** A pakal measures how many, not how long: one set per exercise holding
 *    `reps`. No timer is started and no duration is summed for the routine.
 *  - **The session is the routine, not an exercise.** Its name comes from the template snapshot
 *    ("פק״לים בוקר"), never from the first or last exercise that was reported.
 *
 * Seeding is idempotent: the templates carry deterministic ids, so a second call finds them and
 * returns them untouched — user renames, added or removed exercises are never overwritten.
 */
import {
  addHomeTemplateEntry,
  addEntry,
  addSet,
  createHomeSession,
  createHomeTemplate,
  getHomeTemplate,
  listEntrySets,
  listHomeTemplateEntries,
  listHomeSessions,
  listSessionEntries,
  updateHomeTemplate,
  updateSet,
  buildHomeTemplateSnapshot,
} from "./repo";
import { readHomeState, writeHomeState } from "./storage";
import type { HomeSession, HomeTemplate, HomeTemplateEntry } from "./types";
import { listExercises } from "@/lib/exercises";
import type { Exercise } from "@/lib/exercises";

export type PakalSlot = "morning" | "evening";

export interface PakalDefinition {
  slot: PakalSlot;
  /** Deterministic template id — the seed is idempotent because of this. */
  templateId: string;
  defaultName: string;
  /** Exercise slugs used only when the template is created for the first time. */
  seedSlugs: string[];
}

export const PAKAL_DEFINITIONS: Record<PakalSlot, PakalDefinition> = {
  morning: {
    slot: "morning",
    templateId: "tpl_pakal_morning",
    defaultName: "פק״לים בוקר",
    seedSlugs: ["push-ups", "crunches", "jump-rope"],
  },
  evening: {
    slot: "evening",
    templateId: "tpl_pakal_evening",
    defaultName: "פק״לים ערב",
    seedSlugs: ["push-ups", "sit-ups", "dumbbell-curl"],
  },
};

export const PAKAL_SLOTS: PakalSlot[] = ["morning", "evening"];

/** True for a session that belongs to one of the two fixed routines. */
export function isPakalSession(session: HomeSession): boolean {
  return PAKAL_SLOTS.some((s) => PAKAL_DEFINITIONS[s].templateId === session.template_id);
}

export function pakalSlotOf(session: HomeSession): PakalSlot | null {
  return PAKAL_SLOTS.find((s) => PAKAL_DEFINITIONS[s].templateId === session.template_id) ?? null;
}

function exerciseBySlug(slug: string): Exercise | null {
  return listExercises().find((e) => e.slug === slug && !e.deleted_at) ?? null;
}

/**
 * Exercises the person already reports at home, most used first. Used to seed a template the
 * first time so the routine starts from real habits rather than a generic list.
 */
export function frequentHomeExerciseIds(limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const session of listHomeSessions()) {
    if (session.deleted_at) continue;
    for (const entry of listSessionEntries(session.id))
      counts.set(entry.exercise_id, (counts.get(entry.exercise_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/**
 * Creates the template if it does not exist yet and returns it. Never touches an existing
 * template: the person's own name, order and exercise list win over the seed.
 */
export function ensurePakalTemplate(slot: PakalSlot): HomeTemplate {
  const def = PAKAL_DEFINITIONS[slot];
  const existing = getHomeTemplate(def.templateId);
  if (existing) return existing;

  const created = createHomeTemplate({ name: def.defaultName, rounds: 1 });
  // Re-key to the deterministic id so the next call finds it (createHomeTemplate mints a uuid).
  const state = readHomeState();
  writeHomeState({
    ...state,
    templates: state.templates.map((t) =>
      t.id === created.id ? { ...t, id: def.templateId, is_favorite: true } : t,
    ),
    templateEntries: state.templateEntries.map((e) =>
      e.template_id === created.id ? { ...e, template_id: def.templateId } : e,
    ),
  });

  const seedIds = def.seedSlugs
    .map((slug) => exerciseBySlug(slug)?.id)
    .filter((id): id is string => Boolean(id));
  const frequent = frequentHomeExerciseIds(3);
  const ids = [...new Set([...frequent, ...seedIds])].slice(0, 4);
  // Sequence follows insertion order inside addHomeTemplateEntry.
  for (const exerciseId of ids) addHomeTemplateEntry(def.templateId, exerciseId);
  return getHomeTemplate(def.templateId)!;
}

/** Both fixed routines, created on first use. Safe to call on every render of the home screen. */
export function ensurePakalTemplates(): Record<PakalSlot, HomeTemplate> {
  return {
    morning: ensurePakalTemplate("morning"),
    evening: ensurePakalTemplate("evening"),
  };
}

export function pakalTemplateEntries(slot: PakalSlot): HomeTemplateEntry[] {
  return listHomeTemplateEntries(PAKAL_DEFINITIONS[slot].templateId);
}

function dayKeyOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Today's open report for this routine, if one was already started (no duplicate per tap). */
export function findOpenPakalSession(slot: PakalSlot, now = new Date()): HomeSession | null {
  const today = dayKeyOf(now.toISOString());
  const templateId = PAKAL_DEFINITIONS[slot].templateId;
  return (
    listHomeSessions()
      .filter(
        (s) =>
          s.template_id === templateId &&
          !s.deleted_at &&
          s.status !== "trashed" &&
          s.status !== "archived" &&
          dayKeyOf(s.started_at) === today,
      )
      .sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null
  );
}

/**
 * Opens the routine for reporting: resumes today's report if it exists, otherwise starts one
 * from the template with exactly one quantity set per exercise. The session name is the
 * template's name at this moment (snapshot), so renaming the template later does not rewrite
 * a report that was already filed.
 */
export function openPakalSession(slot: PakalSlot, now = new Date()): HomeSession {
  const existing = findOpenPakalSession(slot, now);
  if (existing) return existing;
  const template = ensurePakalTemplate(slot);
  const snapshot = buildHomeTemplateSnapshot(template.id);
  const session = createHomeSession({
    template_id: template.id,
    template_version: template.version,
    template_snapshot: snapshot,
    // Title snapshot — never derived from an exercise name (the reported bug).
    name: template.name,
    is_quick_entry: false,
  });
  for (const templateEntry of listHomeTemplateEntries(template.id)) {
    const entry = addEntry(session.id, templateEntry.exercise_id);
    addSet(entry.id, { reps: null, duration_seconds: null });
  }
  updateHomeTemplate(template.id, {
    usage_count: template.usage_count + 1,
    last_used_at: new Date().toISOString(),
  });
  return session;
}

export interface PakalLine {
  entryId: string;
  exerciseId: string;
  name: string;
  /** The set holding the quantity; null until the first number is entered. */
  setId: string | null;
  /** The single quantity for this exercise in this report. */
  quantity: number | null;
}

/**
 * The quantity-first view of a report: one line per exercise, one number each.
 * Pure — it is read during render, so it never writes to the store.
 */
export function pakalLines(sessionId: string): PakalLine[] {
  return listSessionEntries(sessionId).map((entry) => {
    const set = listEntrySets(entry.id)[0] ?? null;
    return {
      entryId: entry.id,
      exerciseId: entry.exercise_id,
      name: entry.snapshot.exercise_name,
      setId: set?.id ?? null,
      quantity: set?.reps ?? null,
    };
  });
}

/**
 * Writes one exercise's quantity. Editing an existing report updates the same set — it never
 * appends a second record and never rewrites the session's timestamps. A line that has no set
 * yet (an exercise added by hand) gets one on the first number.
 */
export function setPakalQuantity(
  line: Pick<PakalLine, "entryId" | "setId">,
  quantity: number | null,
): void {
  const completed = quantity != null && quantity > 0;
  const patch = {
    reps: quantity,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  };
  if (line.setId) updateSet(line.setId, patch);
  else addSet(line.entryId, { duration_seconds: null, ...patch });
}

/** Total repetitions reported in a pakal session — the headline number for the routine. */
export function pakalTotal(sessionId: string): number {
  return pakalLines(sessionId).reduce((sum, line) => sum + (line.quantity ?? 0), 0);
}
