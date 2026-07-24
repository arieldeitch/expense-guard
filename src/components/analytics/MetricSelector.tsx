/**
 * MetricSelector — פילטר בורר מדד יחיד.
 * מוצג כ־grid קומפקטי (לא chips נגררים אופקית).
 */
import { cn } from "@/lib/utils";

export interface MetricOption<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

export interface MetricSelectorProps<T extends string> {
  value: T;
  options: MetricOption<T>[];
  onChange: (id: T) => void;
  ariaLabel?: string;
}

export function MetricSelector<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: MetricSelectorProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? "בחירת מדד"}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-right text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 font-bold text-foreground"
                : "border-border-strong bg-surface text-muted-foreground hover:border-primary/60",
            )}
          >
            <div className="truncate">{opt.label}</div>
            {opt.hint ? (
              <div className="text-[11px] font-normal text-muted-foreground">{opt.hint}</div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
