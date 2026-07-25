/**
 * /home/sessions/$id — מסך ביצוע אימון בית פעיל.
 * דיווח סטים גמיש, autosave, החלפת תרגיל, הוספת סטים.
 * מציג ביצוע קודם לשם השוואה.
 */
import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Check,
  ChevronsUpDown,
  Copy,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import { HomeSetRow } from "@/components/home/HomeSetRow";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow } from "@/components/catalog/shared";
import {
  addEntry,
  addSet,
  completeHomeSession,
  duplicateSet,
  markSetCompleted,
  markSetSkipped,
  previousPerformance,
  substituteEntryExercise,
  summarizeSets,
  trashSet,
  updateEntry,
  updateHomeSession,
  updateSet,
  useEntrySets,
  useHomeSession,
  useHomeSessionEntries,
} from "@/lib/home";
import { useAllExercises, useExercise } from "@/lib/exercises";

export const Route = createFileRoute("/home/sessions/$id/")({
  head: ({ params }) => ({
    meta: [
      { title: "אימון בית · Fit Log" },
      { name: "description", content: "מסך דיווח אימון בית פעיל." },
      { property: "og:title", content: "אימון בית · Fit Log" },
      { property: "og:description", content: "מסך דיווח אימון בית פעיל." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const session = useHomeSession(id);
  const entries = useHomeSessionEntries(id);
  const navigate = useNavigate();

  if (!session) {
    return (
      <AppShell topBar={{ title: "לא נמצא", back: { to: "/home" } }}>
        <EmptyState
          title="האימון לא נמצא"
          description="ייתכן שנמחק או שהמזהה שגוי."
        />
      </AppShell>
    );
  }

  const finish = (status: "completed" | "partial" | "abandoned") => {
    completeHomeSession(id, { status });
    navigate({ to: "/home/sessions/$id/summary", params: { id }, replace: true });
  };

  return (
    <AppShell
      topBar={{
        title: session.name,
        back: { to: "/home", label: "לתחום בית" },
        action: (
          <button
            type="button"
            onClick={() => finish("completed")}
            aria-label="סיום אימון"
            className="tile-interactive inline-flex min-h-9 items-center gap-1 rounded-xl bg-home px-3 text-xs font-black text-white"
          >
            <Check aria-hidden className="size-4" />
            סיום
          </button>
        ),
      }}
    >
      <PageHeader
        eyebrow={session.is_quick_entry ? "דיווח מהיר" : "אימון בית"}
        title={session.name}
        description="שמירה אוטומטית. סטים גמישים לכל תרגיל."
      />

      <div className="mb-3 px-4 sm:px-6">
        <label className="text-xs font-bold text-muted-foreground">שם/הערה לאימון</label>
        <Input
          value={session.name}
          onChange={(e) => updateHomeSession(id, { name: e.target.value })}
          aria-label="שם האימון"
        />
      </div>

      {entries.map((entry) => (
        <EntryBlock key={entry.id} entryId={entry.id} sessionId={id} />
      ))}

      <div className="mt-4 px-4 sm:px-6">
        <AddExerciseControl sessionId={id} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => finish("partial")}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border-strong bg-tint px-4 text-sm font-bold text-muted-foreground"
        >
          <Save aria-hidden className="size-4" />
          סגור חלקי
        </button>
        <button
          type="button"
          onClick={() => finish("completed")}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-home px-4 text-sm font-black text-white"
        >
          <Check aria-hidden className="size-4" />
          סיום אימון
        </button>
      </div>
    </AppShell>
  );
}

function EntryBlock({ entryId, sessionId }: { entryId: string; sessionId: string }) {
  const entries = useHomeSessionEntries(sessionId);
  const entry = entries.find((e) => e.id === entryId);
  const sets = useEntrySets(entryId);
  const exercise = useExercise(entry?.exercise_id);
  const [showSubstitute, setShowSubstitute] = useState(false);
  const prev = useMemo(
    () => (entry ? previousPerformance(entry.exercise_id, sessionId) : null),
    [entry, sessionId],
  );
  if (!entry) return null;
  const tracking = entry.snapshot.tracking_type;
  const unilateral = entry.snapshot.unilateral;
  const summary = summarizeSets(sets);
  const prevBySetNumber = new Map<number, { reps: number | null; duration: number | null }>();
  (prev?.sets ?? []).forEach((s) =>
    prevBySetNumber.set(s.set_number, {
      reps: s.reps,
      duration: s.duration_seconds,
    }),
  );

  return (
    <section className="mb-4 px-4 sm:px-6">
      <Tile variant="home" tone="soft">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <TileLabel>תרגיל</TileLabel>
            <div className="truncate text-lg font-black">{entry.snapshot.exercise_name}</div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="פעולות תרגיל"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-tint text-muted-foreground"
              >
                <ChevronsUpDown className="size-4" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <ActionRow
                icon={<ArrowLeftRight aria-hidden />}
                onClick={() => setShowSubstitute((v) => !v)}
              >
                החלף תרגיל
              </ActionRow>
              <ActionRow
                icon={<Trash2 aria-hidden />}
                onClick={() => updateEntry(entryId, { deleted_at: new Date().toISOString() })}
                tone="destructive"
              >
                הסר מהאימון
              </ActionRow>
            </PopoverContent>
          </Popover>
        </div>
        {prev ? (
          <div className="mt-2 rounded-xl border border-border bg-surface p-2 text-xs">
            <div className="font-bold text-muted-foreground">
              קודם ({new Date(prev.sessionDate).toLocaleDateString("he-IL")}):{" "}
              <span className="ltr-nums font-black text-foreground">
                {prev.totalReps != null ? `${prev.totalReps} חז׳` : ""}
                {prev.totalReps != null && prev.longestHoldSeconds ? " · " : ""}
                {prev.longestHoldSeconds ? `${prev.longestHoldSeconds}שנ׳` : ""}
              </span>
            </div>
          </div>
        ) : null}
        {showSubstitute ? (
          <SubstitutePanel
            currentId={entry.exercise_id}
            onSelect={(newId) => {
              substituteEntryExercise(entryId, newId);
              setShowSubstitute(false);
            }}
            onClose={() => setShowSubstitute(false)}
          />
        ) : null}
      </Tile>

      <div className="mt-3 space-y-2">
        {sets.map((s) => {
          const p = prevBySetNumber.get(s.set_number);
          return (
            <HomeSetRow
              key={s.id}
              set={s}
              tracking={tracking}
              unilateral={unilateral}
              previousReps={p?.reps ?? prev?.maxRepsInSet ?? null}
              previousDuration={p?.duration ?? prev?.longestHoldSeconds ?? null}
              onChange={(patch) => updateSet(s.id, patch)}
              onComplete={() => markSetCompleted(s.id, !s.completed)}
              onSkip={() => markSetSkipped(s.id, !s.skipped)}
              onDuplicate={() => duplicateSet(s.id)}
              onDelete={() => trashSet(s.id)}
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => addSet(entryId)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-strong bg-tint px-3 text-sm font-bold text-muted-foreground"
        >
          <Plus aria-hidden className="size-4" />
          הוסף סט
        </button>
        {sets.length ? (
          <button
            type="button"
            onClick={() => duplicateSet(sets[sets.length - 1].id)}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-strong bg-tint px-3 text-sm font-bold text-muted-foreground"
          >
            <Copy aria-hidden className="size-4" />
            שכפל אחרון
          </button>
        ) : null}
      </div>

      <div className="mt-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
        <div className="ltr-nums flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
          <span>
            סטים: <b className="text-foreground">{summary.completedSets}</b>/{summary.totalSets}
          </span>
          <span>
            חזרות: <b className="text-foreground">{summary.totalReps}</b>
          </span>
          {summary.averageReps != null ? (
            <span>
              ממוצע: <b className="text-foreground">{summary.averageReps.toFixed(1)}</b>
            </span>
          ) : null}
          {summary.totalDurationSeconds ? (
            <span>
              זמן: <b className="text-foreground">{summary.totalDurationSeconds}שנ׳</b>
            </span>
          ) : null}
          {summary.stability != null ? (
            <span>
              יציבות: <b className="text-foreground">{Math.round(summary.stability * 100)}%</b>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SubstitutePanel({
  currentId,
  onSelect,
  onClose,
}: {
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const exercises = useAllExercises();
  const [q, setQ] = useState("");
  const results = exercises
    .filter((e) => !e.deleted_at && e.is_active && e.id !== currentId)
    .filter((e) => e.bodyweight_based || e.category === "bodyweight")
    .filter((e) => (q ? e.name_he.toLowerCase().includes(q.toLowerCase()) : true))
    .slice(0, 20);
  return (
    <div className="mt-2 rounded-xl border border-border-strong bg-surface p-2">
      <div className="mb-2 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפש תרגיל…"
          aria-label="חיפוש תרגיל להחלפה"
        />
        <button
          type="button"
          aria-label="סגור"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-xl bg-tint p-2"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid max-h-64 grid-cols-1 gap-1 overflow-auto">
        {results.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelect(e.id)}
            className="rounded-xl px-3 py-2 text-start text-sm font-bold text-foreground hover:bg-tint"
          >
            {e.name_he}
          </button>
        ))}
        {results.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">אין תוצאות</div>
        ) : null}
      </div>
    </div>
  );
}

function AddExerciseControl({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const exercises = useAllExercises();
  const [q, setQ] = useState("");
  const results = exercises
    .filter((e) => !e.deleted_at && e.is_active)
    .filter((e) => e.bodyweight_based || e.category === "bodyweight")
    .filter((e) => (q ? e.name_he.toLowerCase().includes(q.toLowerCase()) : true))
    .slice(0, 20);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-strong bg-tint px-4 text-sm font-bold text-muted-foreground"
      >
        <Plus aria-hidden className="size-4" />
        הוסף תרגיל
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl border border-border-strong bg-surface p-2">
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חפש תרגיל…"
              aria-label="חיפוש להוספה"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="min-h-11 min-w-11 rounded-xl bg-tint p-2"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid max-h-72 grid-cols-1 gap-1 overflow-auto">
            {results.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  const entry = addEntry(sessionId, e.id);
                  addSet(entry.id);
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-2 text-start text-sm font-bold text-foreground hover:bg-tint"
              >
                {e.name_he}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
