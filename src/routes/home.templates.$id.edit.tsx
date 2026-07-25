/**
 * /home/templates/$id/edit — עורך תבנית בית.
 * ניהול שם, סבבים, הוספה/הסרה של תרגילים, סטים/חזרות/זמן/מנוחה, שכפול, ארכיון.
 */
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileLabel } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/session/NumberField";
import {
  addHomeTemplateEntry,
  duplicateHomeTemplate,
  removeHomeTemplateEntry,
  reorderHomeTemplateEntries,
  saveHomeTemplateVersion,
  startSessionFromTemplate,
  updateHomeTemplate,
  updateHomeTemplateEntry,
  useHomeTemplate,
  useHomeTemplateEntries,
  useRecentHomeExerciseIds,
} from "@/lib/home";
import { useExercise } from "@/lib/exercises";
import { HomeExercisePicker } from "@/components/home/HomeExercisePicker";

export const Route = createFileRoute("/home/templates/$id/edit")({
  head: () => ({
    meta: [
      { title: "עריכת תבנית · Fit Log" },
      { name: "description", content: "עורך תבנית אימון בית." },
      { property: "og:title", content: "עריכת תבנית · Fit Log" },
      { property: "og:description", content: "עורך תבנית אימון בית." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditTemplatePage,
});

function EditTemplatePage() {
  const { id } = Route.useParams();
  const template = useHomeTemplate(id);
  const entries = useHomeTemplateEntries(id);
  const navigate = useNavigate();
  if (!template) {
    return (
      <AppShell topBar={{ title: "לא נמצא", back: { to: "/home/templates" } }}>
        <EmptyState title="התבנית לא נמצאה" />
      </AppShell>
    );
  }

  const move = (idx: number, delta: number) => {
    const arr = entries.map((e) => e.id);
    const next = idx + delta;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    reorderHomeTemplateEntries(id, arr);
  };

  return (
    <AppShell
      topBar={{
        title: "עריכה",
        back: { to: "/home/templates/$id", params: { id } } as never,
        action: (
          <Link
            to="/home/templates/$id"
            params={{ id }}
            className="tile-interactive inline-flex min-h-9 items-center gap-1 rounded-xl bg-home px-3 text-xs font-black text-white"
          >
            <Save className="size-4" aria-hidden />
            סיום
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תבנית"
        title="עריכה"
        description="שינויים נשמרים אוטומטית."
      />

      <div className="mb-3 grid gap-2 px-4 sm:px-6">
        <label className="text-xs font-bold text-muted-foreground">שם התבנית</label>
        <Input
          value={template.name}
          onChange={(e) => updateHomeTemplate(id, { name: e.target.value })}
          aria-label="שם תבנית"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground">סבבים</label>
            <NumberField
              value={template.rounds}
              onChange={(v) => updateHomeTemplate(id, { rounds: Math.max(1, v ?? 1) })}
              ariaLabel="מספר סבבים"
              step={1}
              min={1}
              max={20}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">הערות</label>
            <Input
              value={template.notes ?? ""}
              onChange={(e) => updateHomeTemplate(id, { notes: e.target.value || null })}
              aria-label="הערות תבנית"
            />
          </div>
        </div>
      </div>

      <SectionHeader
        title={`תרגילים (${entries.length})`}
        action={<AddExerciseButton templateId={id} />}
      />
      <div className="space-y-2 px-4 sm:px-6">
        {entries.length ? (
          entries.map((e, idx) => (
            <TemplateEntryRow
              key={e.id}
              entryId={e.id}
              exerciseId={e.exercise_id}
              plannedSets={e.planned_sets}
              plannedReps={e.planned_reps}
              plannedDuration={e.planned_duration_seconds}
              restSeconds={e.rest_seconds}
              plannedAddedWeight={e.planned_added_weight}
              onUp={idx > 0 ? () => move(idx, -1) : null}
              onDown={idx < entries.length - 1 ? () => move(idx, +1) : null}
            />
          ))
        ) : (
          <EmptyState
            title="עדיין אין תרגילים"
            description="הוסף תרגיל ראשון מהספרייה."
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            saveHomeTemplateVersion(id);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-strong bg-tint px-4 text-sm font-bold text-muted-foreground"
        >
          שמור גרסה
        </button>
        <button
          type="button"
          onClick={() => {
            const s = startSessionFromTemplate(id);
            if (s) navigate({ to: "/home/sessions/$id", params: { id: s.id } });
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-home px-4 text-sm font-black text-white"
        >
          התחל אימון
        </button>
      </div>
    </AppShell>
  );
}

function TemplateEntryRow({
  entryId,
  exerciseId,
  plannedSets,
  plannedReps,
  plannedDuration,
  restSeconds,
  plannedAddedWeight,
  onUp,
  onDown,
}: {
  entryId: string;
  exerciseId: string;
  plannedSets: number;
  plannedReps: number | null;
  plannedDuration: number | null;
  restSeconds: number | null;
  plannedAddedWeight: number | null;
  onUp: (() => void) | null;
  onDown: (() => void) | null;
}) {
  const exercise = useExercise(exerciseId);
  return (
    <Tile variant="home" tone="soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <TileLabel>תרגיל</TileLabel>
          <div className="text-base font-black">{exercise?.name_he ?? "תרגיל"}</div>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onUp} label="הזז למעלה">
            <ArrowUp className="size-4" aria-hidden />
          </IconBtn>
          <IconBtn onClick={onDown} label="הזז למטה">
            <ArrowDown className="size-4" aria-hidden />
          </IconBtn>
          <IconBtn
            onClick={() => removeHomeTemplateEntry(entryId)}
            label="הסר"
            destructive
          >
            <Trash2 className="size-4" aria-hidden />
          </IconBtn>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="סטים">
          <NumberField
            value={plannedSets}
            onChange={(v) => updateHomeTemplateEntry(entryId, { planned_sets: Math.max(1, v ?? 1) })}
            ariaLabel="סטים"
            step={1}
            min={1}
            max={20}
            compact
          />
        </Field>
        <Field label="חזרות">
          <NumberField
            value={plannedReps}
            onChange={(v) => updateHomeTemplateEntry(entryId, { planned_reps: v })}
            ariaLabel="חזרות"
            step={1}
            min={0}
            max={200}
            compact
          />
        </Field>
        <Field label="זמן (שנ׳)">
          <NumberField
            value={plannedDuration}
            onChange={(v) => updateHomeTemplateEntry(entryId, { planned_duration_seconds: v })}
            ariaLabel="זמן"
            step={5}
            min={0}
            max={3600}
            compact
          />
        </Field>
        <Field label="מנוחה (שנ׳)">
          <NumberField
            value={restSeconds}
            onChange={(v) => updateHomeTemplateEntry(entryId, { rest_seconds: v })}
            ariaLabel="מנוחה"
            step={15}
            min={0}
            max={600}
            compact
          />
        </Field>
        <Field label="משקל נוסף">
          <NumberField
            value={plannedAddedWeight}
            onChange={(v) => updateHomeTemplateEntry(entryId, { planned_added_weight: v })}
            ariaLabel="משקל נוסף"
            step={2.5}
            min={0}
            max={200}
            compact
            suffix="ק״ג"
          />
        </Field>
      </div>
    </Tile>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
  destructive,
}: {
  onClick: (() => void) | null;
  label: string;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick ?? undefined}
      aria-label={label}
      className={
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border " +
        (destructive
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border-strong bg-tint text-muted-foreground") +
        (onClick ? "" : " opacity-40")
      }
    >
      {children}
    </button>
  );
}

function AddExerciseButton({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);
  const entries = useHomeTemplateEntries(templateId);
  const alreadyInPlan = entries.map((e) => e.exercise_id);
  const recentIds = useRecentHomeExerciseIds();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-home px-3 text-xs font-black text-white"
      >
        <Plus className="size-3.5" aria-hidden />
        תרגיל
      </button>
      <HomeExercisePicker
        open={open}
        onOpenChange={setOpen}
        alreadyInPlan={alreadyInPlan}
        recentIds={recentIds}
        onAdd={(ids) => {
          for (const exerciseId of ids) addHomeTemplateEntry(templateId, exerciseId);
        }}
      />
    </>
  );
}
