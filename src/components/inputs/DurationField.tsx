import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Human time is not decimal minutes. Store seconds; show two labelled integers. */
export function DurationField({
  value,
  onChange,
  label = "משך",
  className,
  placeholder,
}: {
  value: number | null;
  onChange: (seconds: number | null) => void;
  label?: string;
  className?: string;
  /** Hints only — e.g. the derived pace; never treated as a value. */
  placeholder?: { minutes?: string; seconds?: string };
}) {
  const id = useId();
  const minutes = value == null ? "" : Math.floor(value / 60);
  const seconds = value == null ? "" : Math.round(value % 60);
  return (
    <fieldset className={cn("min-w-0 space-y-1", className)}>
      <legend className="text-xs font-bold text-muted-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <label htmlFor={`${id}-m`} className="min-w-0 text-xs">
          דקות
          <Input
            id={`${id}-m`}
            aria-label={`${label} בדקות`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder={placeholder?.minutes ?? "0"}
            value={minutes}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n) && (n < 0 || !Number.isInteger(n))) {
                e.target.setCustomValidity("דקות: מספר שלם ואפס או יותר");
                return;
              }
              e.target.setCustomValidity("");

              onChange(
                e.target.value === "" && !seconds
                  ? null
                  : (Number.isFinite(n) ? n : 0) * 60 + (Number(seconds) || 0),
              );
            }}
          />
        </label>
        <label htmlFor={`${id}-s`} className="min-w-0 text-xs">
          שניות
          <Input
            id={`${id}-s`}
            aria-label={`${label} בשניות`}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step={1}
            placeholder={placeholder?.seconds ?? "00"}
            value={seconds}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n) && (n < 0 || n > 59 || !Number.isInteger(n))) {
                e.target.setCustomValidity("שניות: מספר שלם בין 0 ל-59");
                return;
              }
              e.target.setCustomValidity("");

              onChange(
                e.target.value === "" && !minutes
                  ? null
                  : (Number(minutes) || 0) * 60 + (Number.isFinite(n) ? n : 0),
              );
            }}
          />
        </label>
      </div>
    </fieldset>
  );
}
