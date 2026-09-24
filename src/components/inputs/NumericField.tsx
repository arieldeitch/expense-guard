/**
 * Numeric text inputs that do not fight the person typing (ADR-0044).
 *
 * `DecimalField`  — accepts 7, 7.1, 7.15, 0.5, 10.00 and a comma as the decimal separator.
 *                   The raw text is kept while editing, so "7." survives long enough to
 *                   become "7.15"; the model is updated with the parsed number.
 * `DurationField` — one text field for a duration under the app-wide contract:
 *                   "40" = 40 שניות, "0:40" = 40 שניות, "42:15" = 42 דקות ו-15 שניות.
 *                   Shows a live human echo so a misread is visible before saving.
 */
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNumericText } from "@/lib/forms/useNumericText";
import {
  describeDuration,
  formatDurationInput,
  parseDecimal,
  parseDurationInput,
} from "@/lib/runs";

const formatDecimal = (value: number | null) => (value == null ? "" : String(value));

export function DecimalField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  className,
  id,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const field = useNumericText<number>({
    initial: value,
    parse: parseDecimal,
    format: formatDecimal,
    onValue: onChange,
  });
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      aria-invalid={field.invalid || undefined}
      inputMode="decimal"
      // `text`, not `number`: a number input silently drops "7." in several mobile browsers.
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      className={cn(field.invalid && "border-destructive", className)}
      value={field.text}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
    />
  );
}

export function DurationTextField({
  value,
  onChange,
  ariaLabel,
  placeholder = "מ:שנ",
  className,
  id,
  showEcho = true,
}: {
  value: number | null;
  onChange: (seconds: number | null) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  showEcho?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const field = useNumericText<number>({
    initial: value,
    parse: parseDurationInput,
    format: formatDurationInput,
    onValue: onChange,
  });
  return (
    <div className="space-y-1">
      <Input
        id={inputId}
        aria-label={ariaLabel}
        aria-invalid={field.invalid || undefined}
        aria-describedby={showEcho ? `${inputId}-echo` : undefined}
        inputMode="numeric"
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        className={cn(field.invalid && "border-destructive", className)}
        value={field.text}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
      />
      {showEcho ? (
        <div
          id={`${inputId}-echo`}
          role="status"
          className={cn(
            "text-[11px]",
            field.invalid ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {field.invalid
            ? "פורמט לא תקין. דוגמאות: 40 (שניות) · 5:30 · 1:02:03"
            : field.value != null
              ? describeDuration(field.value)
              : "דקות:שניות — למשל 42:15. מספר בודד נחשב שניות."}
        </div>
      ) : null}
    </div>
  );
}
