/**
 * /home/pakal/$slot — the fast report for the two fixed routines (ADR-0045).
 *
 * Home → פק״לים בוקר/ערב → type the quantities → שמירה. One screen, one number per exercise,
 * no timer and no wizard. Opening it twice on the same day resumes the same report instead of
 * creating a second one, so re-opening to fix a number is the same flow as reporting.
 */
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Plus, Trash2, GripVertical, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/lib/storage/useHydrated";
import { MuscleBadge } from "@/components/exercises/MuscleBadge";
import { HomeExerciseAdder } from "@/components/home/HomeExerciseAdder";
import {
  PAKAL_DEFINITIONS,
  PAKAL_SLOTS,
  addEntry,
  addSet,
  openPakalSession,
  reorderEntries,
  setPakalQuantity,
  trashEntry,
  updateHomeSession,
  updateHomeTemplate,
  useHomeSession,
  useHomeSessionLines,
  useHomeTemplates,
  type PakalSlot,
} from "@/lib/home";
import { useAllExercises, useMuscleGroups } from "@/lib/exercises";
import { bodyRegionOfExercise } from "@/lib/exercises/homeBank";
import { completeHomeSession } from "@/lib/home";

export const Route = createFileRoute("/home/pakal/$slot")({
  loader: ({ params }) => {
    if (!PAKAL_SLOTS.includes(params.slot as PakalSlot)) throw notFound();
    return { slot: params.slot as PakalSlot };
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.slot === "morning" ? "פק״לים בוקר" : "פק״לים ערב"} · Fit Log`,
      },
    ],
  }),
  component: PakalPage,
});

function PakalPage() {
  const { slot } = Route.useLoaderData();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const exercises = useAllExercises();
  const muscleGroups = useMuscleGroups();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // The report is created on the client (localStorage), never during server rendering.
  useEffect(() => {
    if (!hydrated) return;
    setSessionId(openPakalSession(slot).id);
  }, [hydrated, slot]);

  const session = useHomeSession(sessionId);
  // Subscribes to entries AND sets, so a typed quantity refreshes the line immediately.
  const lines = useHomeSessionLines(sessionId);
  const total = lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  const def = PAKAL_DEFINITIONS[slot];

  if (!hydrated || !sessionId || !session) {
    return (
      <AppShell topBar={{ title: def.defaultName, back: { to: "/home", label: "חזרה" } }}>
        <PageHeader title={def.defaultName} description="נפתח…" />
      </AppShell>
    );
  }

  const exerciseOf = (id: string) => exercises.find((e) => e.id === id);

  return (
    <AppShell topBar={{ title: session.name, back: { to: "/home", label: "חזרה" } }}>
      <PageHeader
        title={session.name}
        description="כמה עשית מכל תרגיל. נשמר תוך כדי הקלדה — אפשר לחזור ולתקן."
      />

      <div className="space-y-2 px-4 sm:px-6">
        {lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-muted-foreground">
            אין עדיין תרגילים בפק״ל הזה. הוסף תרגיל למטה — הוא יישמר לפעם הבאה.
          </p>
        ) : null}

        <ul className="space-y-2">
          {lines.map((line, index) => {
            const exercise = exerciseOf(line.exerciseId);
            return (
              <li
                key={line.entryId}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border bg-surface p-2"
              >
                <MuscleBadge
                  primary={exercise ? bodyRegionOfExercise(exercise, muscleGroups) : null}
                  height={38}
                  className="opacity-90"
                  decorative
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{line.name}</div>
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      type="button"
                      aria-label={`הזז למעלה ${line.name}`}
                      disabled={index === 0}
                      onClick={() =>
                        reorderEntries(
                          sessionId,
                          swap(
                            lines.map((l) => l.entryId),
                            index,
                            index - 1,
                          ),
                        )
                      }
                      className="-my-1.5 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowUp aria-hidden className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`הזז למטה ${line.name}`}
                      disabled={index === lines.length - 1}
                      onClick={() =>
                        reorderEntries(
                          sessionId,
                          swap(
                            lines.map((l) => l.entryId),
                            index,
                            index + 1,
                          ),
                        )
                      }
                      className="-my-1.5 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowDown aria-hidden className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`הסר ${line.name}`}
                      onClick={() => {
                        trashEntry(line.entryId);
                        toast.info(`${line.name} הוסר מהדיווח`);
                      }}
                      className="-my-1.5 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground"
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                    </button>
                  </div>
                </div>
                <QuantityInput
                  label={line.name}
                  value={line.quantity}
                  onChange={(v) => setPakalQuantity(line, v)}
                />
              </li>
            );
          })}
        </ul>

        <HomeExerciseAdder
          onPick={(exerciseId) => {
            const entry = addEntry(sessionId, exerciseId);
            addSet(entry.id, { reps: null, duration_seconds: null });
          }}
        />
      </div>

      <SectionHeader title="סיכום" />
      <div className="space-y-2 px-4 pb-4 sm:px-6">
        <p className="text-sm">
          סה״כ <span className="ltr-nums font-black">{total}</span> חזרות ·{" "}
          {lines.filter((l) => (l.quantity ?? 0) > 0).length} מתוך {lines.length} תרגילים
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11"
            onClick={() => {
              completeHomeSession(sessionId);
              toast.success("הפק״ל נשמר");
              navigate({ to: "/home" });
            }}
          >
            <Check aria-hidden className="me-1 size-4" />
            סיום ושמירה
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/history" search={{ type: "home" }}>
              היסטוריית פק״לים
            </Link>
          </Button>
        </div>
        <TemplateTools slot={slot} sessionId={sessionId} />
      </div>
    </AppShell>
  );
}

function swap(ids: string[], from: number, to: number): string[] {
  if (to < 0 || to >= ids.length) return ids;
  const next = ids.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Big, thumb-friendly quantity field: type a number, or tap ± for the common nudges. */
function QuantityInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => {
    setText(value == null ? "" : String(value));
    // Only when the model changes from elsewhere (reorder, reload).
  }, [value]);
  const push = (next: string) => {
    setText(next);
    const trimmed = next.trim();
    if (trimmed === "") return onChange(null);
    if (!/^\d{1,4}$/.test(trimmed)) return;
    onChange(Number(trimmed));
  };
  const step = (delta: number) => push(String(Math.max(0, (value ?? 0) + delta)));
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`הפחת ${label}`}
        onClick={() => step(-1)}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-border-strong text-lg font-bold"
      >
        −
      </button>
      <Input
        aria-label={`כמות ${label}`}
        inputMode="numeric"
        type="text"
        value={text}
        onChange={(e) => push(e.target.value)}
        placeholder="0"
        className="w-16 text-center text-base font-black"
      />
      <button
        type="button"
        aria-label={`הוסף ${label}`}
        onClick={() => step(1)}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-border-strong text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}

/** Rename the routine, and save the current exercise list back onto the template. */
function TemplateTools({ slot, sessionId }: { slot: PakalSlot; sessionId: string }) {
  const [open, setOpen] = useState(false);
  // The template already exists by now (the screen opened a report from it); read, don't write.
  const template = useHomeTemplates().find((t) => t.id === PAKAL_DEFINITIONS[slot].templateId);
  const [name, setName] = useState(template?.name ?? PAKAL_DEFINITIONS[slot].defaultName);
  if (!template) return null;
  return (
    <details
      className="rounded-xl border border-border p-3"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">
        שם הפק״ל והתרגילים הקבועים
      </summary>
      <div className="mt-2 space-y-2">
        <label className="block text-sm">
          שם הפק״ל
          <Input
            aria-label="שם הפק״ל"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed) return;
              updateHomeTemplate(template.id, { name: trimmed });
              // The open report keeps its own title snapshot unless we update it too.
              updateHomeSession(sessionId, { name: trimmed });
              toast.success("השם עודכן");
            }}
          >
            שמור שם
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          התרגילים ברשימה למעלה נשמרים לדיווח הזה. כדי שיחזרו גם מחר, ערוך את התבנית במסך התבניות.
        </p>
        <Button asChild variant="ghost" className="min-h-11">
          <Link to="/home/templates/$id" params={{ id: template.id }}>
            עריכת התבנית הקבועה
          </Link>
        </Button>
      </div>
    </details>
  );
}

export { QuantityInput };
