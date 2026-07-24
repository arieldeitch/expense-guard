/**
 * TemplateBlockCard — כרטיס בלוק (יחיד/סופרסט/וכו').
 * מציג את התרגילים שבתוכו, פעולות (הזזה/מחיקה/הוספה), הגדרות בלוק (מנוחה, סבבים).
 */
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Settings2,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/catalog/shared";
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import {
  BLOCK_TYPE_LABELS,
  moveBlock,
  removeBlock,
  updateBlock,
  useBlockExercises,
  SUPERSET_LETTERS,
  type WorkoutTemplateBlock,
} from "@/lib/templates";
import { TemplateExerciseRow } from "./TemplateExerciseRow";
import { cn } from "@/lib/utils";

interface Props {
  block: WorkoutTemplateBlock;
  positionIndex: number;
  siblingsCount: number;
  onAddExercise: (blockId: string) => void;
}

export function TemplateBlockCard({ block, positionIndex, siblingsCount, onAddExercise }: Props) {
  const exercises = useBlockExercises(block.id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSuperset =
    block.block_type === "superset" ||
    block.block_type === "triset" ||
    block.block_type === "circuit";
  const letter = SUPERSET_LETTERS[positionIndex] ?? String(positionIndex + 1);
  const label = block.display_label ?? BLOCK_TYPE_LABELS[block.block_type];

  const colorClass =
    block.color_token === "gym"
      ? "border-gym/60"
      : block.color_token === "primary"
        ? "border-primary/60"
        : block.color_token === "warning"
          ? "border-warning/60"
          : block.color_token === "success"
            ? "border-success/60"
            : block.color_token === "info"
              ? "border-info/60"
              : "border-border-strong";

  return (
    <>
      <section
        className={cn(
          "flex flex-col gap-3 rounded-2xl border-2 bg-surface/80 p-3 shadow-[var(--shadow-tile)]",
          colorClass,
        )}
        aria-label={`בלוק ${letter}`}
      >
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gym/20 text-sm font-black text-foreground">
            {letter}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Chip tone={isSuperset ? "info" : "default"}>
                {isSuperset ? <Layers aria-hidden className="me-0.5 size-3" /> : null}
                {label}
              </Chip>
              {block.rounds > 1 ? <Chip>{block.rounds} סבבים</Chip> : null}
            </div>
            <div className="mt-1 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              {exercises.length} תרגילים
            </div>
          </div>
          <div className="flex gap-1">
            <IconButton
              label="הזזת בלוק למעלה"
              disabled={positionIndex === 0}
              onClick={() => moveBlock(block.id, "up")}
            >
              <ChevronUp aria-hidden className="size-4" />
            </IconButton>
            <IconButton
              label="הזזת בלוק למטה"
              disabled={positionIndex >= siblingsCount - 1}
              onClick={() => moveBlock(block.id, "down")}
            >
              <ChevronDown aria-hidden className="size-4" />
            </IconButton>
            <IconButton label="הגדרות בלוק" onClick={() => setSettingsOpen((v) => !v)}>
              <Settings2 aria-hidden className="size-4" />
            </IconButton>
            <IconButton label="מחיקת בלוק" onClick={() => setConfirmDelete(true)} tone="destructive">
              <XIcon aria-hidden className="size-4" />
            </IconButton>
          </div>
        </header>

        {settingsOpen ? (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-strong bg-tint/40 p-3 sm:grid-cols-3">
            <Field label="שם מוצג">
              <Input
                value={block.display_label ?? ""}
                onChange={(e) =>
                  updateBlock(block.id, { display_label: e.target.value || null })
                }
                placeholder={BLOCK_TYPE_LABELS[block.block_type]}
                className="min-h-11 rounded-xl border-border-strong"
              />
            </Field>
            <Field label="סבבים">
              <Input
                type="number"
                min={1}
                value={block.rounds}
                onChange={(e) =>
                  updateBlock(block.id, { rounds: Math.max(1, Number(e.target.value) || 1) })
                }
                className="min-h-11 rounded-xl border-border-strong"
              />
            </Field>
            <Field label="מנוחה בין תרגילים (שניות)">
              <Input
                type="number"
                min={0}
                value={block.rest_between_exercises_seconds ?? ""}
                placeholder="—"
                onChange={(e) =>
                  updateBlock(block.id, {
                    rest_between_exercises_seconds:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="min-h-11 rounded-xl border-border-strong"
              />
            </Field>
            <Field label="מנוחה בין סבבים (שניות)">
              <Input
                type="number"
                min={0}
                value={block.rest_between_rounds_seconds ?? ""}
                placeholder="—"
                onChange={(e) =>
                  updateBlock(block.id, {
                    rest_between_rounds_seconds:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="min-h-11 rounded-xl border-border-strong"
              />
            </Field>
            <div className="col-span-2 sm:col-span-3">
              <Field label="הערות בלוק">
                <Input
                  value={block.notes ?? ""}
                  onChange={(e) => updateBlock(block.id, { notes: e.target.value || null })}
                  placeholder="למשל: קצב איטי בסבב אחרון"
                  className="min-h-11 rounded-xl border-border-strong"
                />
              </Field>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {exercises.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-muted-foreground">
              אין עדיין תרגילים בבלוק זה
            </p>
          ) : (
            exercises.map((ex, i) => (
              <TemplateExerciseRow
                key={ex.id}
                exercise={ex}
                positionIndex={i}
                blockLetter={letter}
                isSuperset={isSuperset}
                siblingsCount={exercises.length}
              />
            ))
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => onAddExercise(block.id)}
          className="min-h-11 justify-center rounded-xl border border-dashed border-border-strong"
        >
          <Plus aria-hidden className="me-1 size-4" />
          הוספת תרגיל {isSuperset ? "לסופרסט" : "לבלוק"}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="מחיקת בלוק"
        description="הבלוק וכל התרגילים שבתוכו יוסרו מהתבנית. אימונים שכבר בוצעו לא ייפגעו."
        confirmLabel="מחיקה"
        destructive
        onConfirm={() => {
          removeBlock(block.id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: "destructive";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-border-strong bg-surface text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        tone === "destructive" ? "text-destructive hover:bg-destructive/10" : "hover:bg-tint",
      )}
    >
      {children}
    </button>
  );
}

export { Trash2 };
