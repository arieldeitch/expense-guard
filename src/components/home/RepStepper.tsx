/**
 * RepStepper — כפתורי +1/−1/+5 גדולים + הזנה ידנית + "כמו קודם".
 * שדה חזרות שנועד לדיווח מהיר בבית.
 */
import { Minus, Plus, RotateCcw } from "lucide-react";
import { NumberField } from "@/components/session/NumberField";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  previous?: number | null;
  ariaLabel: string;
  className?: string;
}

export function RepStepper({ value, onChange, previous, ariaLabel, className }: Props) {
  const bump = (delta: number) => {
    const next = Math.max(0, (value ?? 0) + delta);
    onChange(next);
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <StepButton onClick={() => bump(-1)} label="הפחת 1">
          <Minus className="size-4" aria-hidden />
          <span className="ltr-nums text-sm font-black">1</span>
        </StepButton>
        <StepButton onClick={() => bump(+1)} label="הוסף 1">
          <Plus className="size-4" aria-hidden />
          <span className="ltr-nums text-sm font-black">1</span>
        </StepButton>
        <StepButton onClick={() => bump(+5)} label="הוסף 5">
          <Plus className="size-4" aria-hidden />
          <span className="ltr-nums text-sm font-black">5</span>
        </StepButton>
      </div>
      <NumberField
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        step={1}
        min={0}
        max={999}
        placeholder="0"
        suffix="חז'"
        className="min-w-[8rem] flex-1"
      />
      {previous != null ? (
        <button
          type="button"
          onClick={() => onChange(previous)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border-strong bg-tint px-3 text-xs font-bold text-muted-foreground hover:bg-tint/70"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          כמו קודם ({previous})
        </button>
      ) : null}
    </div>
  );
}

function StepButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface px-2 text-muted-foreground active:scale-95 active:bg-tint"
    >
      {children}
    </button>
  );
}
