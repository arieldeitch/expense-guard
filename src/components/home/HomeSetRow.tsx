/**
 * HomeSetRow — שורת סט בודד באימון ביתי.
 * מציגה שדות רלוונטיים ל־tracking_type. פעולות: השלמה, דילוג, שכפול, מחיקה.
 */
import { Check, Copy, MoreHorizontal, Trash2, ArrowLeftRight } from "lucide-react";
import { RepStepper } from "./RepStepper";
import { HoldTimer } from "./HoldTimer";
import { NumberField } from "@/components/session/NumberField";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow } from "@/components/catalog/shared";
import type { HomeExerciseSet } from "@/lib/home";
import type { TrackingType } from "@/lib/exercises";
import { cn } from "@/lib/utils";

interface Props {
  set: HomeExerciseSet;
  tracking: TrackingType;
  unilateral: boolean;
  previousReps?: number | null;
  previousDuration?: number | null;
  onChange: (patch: Partial<HomeExerciseSet>) => void;
  onComplete: () => void;
  onSkip: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function HomeSetRow({
  set,
  tracking,
  unilateral,
  previousReps,
  previousDuration,
  onChange,
  onComplete,
  onSkip,
  onDuplicate,
  onDelete,
}: Props) {
  const showTime =
    tracking === "time" ||
    tracking === "static_hold" ||
    tracking === "weight_time";
  const showReps =
    tracking !== "time" &&
    tracking !== "static_hold" &&
    tracking !== "distance";
  const showAddedWeight = tracking === "bodyweight_plus_weight";
  const showAssistance = tracking === "assisted_reps";
  const showSide = unilateral || tracking === "left_right_reps";

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        set.completed
          ? "border-success/60 bg-success-soft/30"
          : set.skipped
            ? "border-muted bg-muted/20 opacity-70"
            : "border-border-strong bg-surface",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-black text-muted-foreground">סט {set.set_number}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onComplete}
            aria-label={set.completed ? "בטל השלמה" : "סמן כהושלם"}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border",
              set.completed
                ? "border-success bg-success text-success-foreground"
                : "border-border-strong bg-tint text-muted-foreground",
            )}
          >
            <Check className="size-5" aria-hidden />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="פעולות סט"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border-strong bg-tint text-muted-foreground"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <ActionRow icon={<Copy aria-hidden />} onClick={onDuplicate}>
                שכפול
              </ActionRow>
              <ActionRow icon={<ArrowLeftRight aria-hidden />} onClick={onSkip}>
                {set.skipped ? "בטל דילוג" : "דלג"}
              </ActionRow>
              <ActionRow icon={<Trash2 aria-hidden />} onClick={onDelete} tone="destructive">
                מחק
              </ActionRow>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid gap-2">
        {showReps ? (
          <RepStepper
            value={set.reps}
            onChange={(v) => onChange({ reps: v })}
            previous={previousReps ?? null}
            ariaLabel={`סט ${set.set_number} חזרות`}
          />
        ) : null}
        {showTime ? (
          <HoldTimer
            value={set.duration_seconds}
            onChange={(v) => onChange({ duration_seconds: v })}
            previous={previousDuration ?? null}
            ariaLabel={`סט ${set.set_number} זמן`}
          />
        ) : null}
        {showSide ? (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-muted-foreground">צד:</div>
            <SideChip
              label="ימין"
              active={set.side === "right"}
              onClick={() => onChange({ side: set.side === "right" ? null : "right" })}
            />
            <SideChip
              label="שמאל"
              active={set.side === "left"}
              onClick={() => onChange({ side: set.side === "left" ? null : "left" })}
            />
          </div>
        ) : null}
        {showAddedWeight ? (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-muted-foreground">משקל נוסף:</div>
            <NumberField
              value={set.added_weight}
              onChange={(v) => onChange({ added_weight: v })}
              step={2.5}
              min={0}
              max={500}
              ariaLabel="משקל נוסף"
              suffix={set.weight_unit}
              className="flex-1"
              compact
            />
          </div>
        ) : null}
        {showAssistance ? (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-muted-foreground">סיוע:</div>
            <NumberField
              value={set.assistance_value}
              onChange={(v) => onChange({ assistance_value: v })}
              step={1}
              min={0}
              max={200}
              ariaLabel="סיוע"
              suffix="ק״ג"
              className="flex-1"
              compact
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SideChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 min-w-16 rounded-xl border px-3 text-sm font-bold",
        active
          ? "border-home bg-home text-white"
          : "border-border-strong bg-tint text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
