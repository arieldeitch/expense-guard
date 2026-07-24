/**
 * NumberField — שדה מספר מוגדל למובייל עם +/− ו־inputMode="decimal".
 * מיועד לשימוש בזמן אימון: לחיצה על השדה בוחרת את הערך.
 */
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  compact?: boolean;
  suffix?: string;
  disabled?: boolean;
}

export function NumberField({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  placeholder,
  ariaLabel,
  className,
  compact,
  suffix,
  disabled,
}: Props) {
  const [text, setText] = useState<string>(value == null ? "" : String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  function commit(t: string) {
    if (t.trim() === "") {
      onChange(null);
      return;
    }
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) return;
    let clamped = n;
    if (min != null) clamped = Math.max(min, clamped);
    if (max != null) clamped = Math.min(max, clamped);
    onChange(Math.round(clamped * 100) / 100);
  }

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-xl border border-border-strong bg-surface",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`הפחת ${ariaLabel}`}
        disabled={disabled}
        onClick={() => {
          const cur = value ?? 0;
          const next = Math.max(min ?? -Infinity, cur - step);
          onChange(Math.round(next * 100) / 100);
        }}
        className={cn(
          "grid place-items-center bg-tint text-lg font-black text-muted-foreground active:bg-tint/70",
          compact ? "w-9" : "w-11",
        )}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        disabled={disabled}
        className={cn(
          "ltr-nums w-full min-w-0 border-0 bg-transparent px-1 text-center text-lg font-black outline-none",
          compact ? "min-h-10" : "min-h-11",
        )}
      />
      {suffix ? (
        <span className="grid place-items-center pe-2 text-xs text-muted-foreground">{suffix}</span>
      ) : null}
      <button
        type="button"
        aria-label={`הוסף ${ariaLabel}`}
        disabled={disabled}
        onClick={() => {
          const cur = value ?? 0;
          let next = cur + step;
          if (max != null) next = Math.min(max, next);
          onChange(Math.round(next * 100) / 100);
        }}
        className={cn(
          "grid place-items-center bg-tint text-lg font-black text-muted-foreground active:bg-tint/70",
          compact ? "w-9" : "w-11",
        )}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
