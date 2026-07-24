import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Tile — רכיב הבסיס להצגת מידע במוצר.
 * ברירת מחדל = surface tinted, גבול ברור, פינות מעוגלות.
 * Variants: default | run | gym | home | goal | warning | success | info
 * Tones: solid (רקע דומיין רווי) | soft (רקע דומיין עדין) | outline (ברירת מחדל)
 */
const tileVariants = cva(
  "relative flex flex-col rounded-2xl border transition-colors focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-surface border-border-strong text-foreground",
        run: "border-run/60 text-foreground",
        gym: "border-gym/60 text-foreground",
        home: "border-home/60 text-foreground",
        goal: "border-goal/60 text-foreground",
        warning: "border-warning/60 text-foreground",
        success: "border-success/60 text-foreground",
        info: "border-info/60 text-foreground",
      },
      tone: {
        outline: "bg-surface",
        soft: "",
        solid: "",
      },
      size: {
        sm: "p-3 gap-2",
        md: "p-4 gap-3",
        lg: "p-5 gap-4",
      },
      interactive: {
        true: "cursor-pointer hover:bg-surface-elevated active:scale-[0.985] hover:border-primary/60 shadow-[var(--shadow-tile)]",
        false: "shadow-[var(--shadow-tile)]",
      },
    },
    compoundVariants: [
      { variant: "run", tone: "soft", class: "bg-run-soft/40" },
      { variant: "gym", tone: "soft", class: "bg-gym-soft/40" },
      { variant: "home", tone: "soft", class: "bg-home-soft/40" },
      { variant: "goal", tone: "soft", class: "bg-goal-soft/40" },
      { variant: "warning", tone: "soft", class: "bg-warning-soft/40" },
      { variant: "success", tone: "soft", class: "bg-success-soft/40" },
      { variant: "info", tone: "soft", class: "bg-info-soft/40" },
      { variant: "run", tone: "solid", class: "bg-run text-run-foreground border-run" },
      { variant: "gym", tone: "solid", class: "bg-gym text-gym-foreground border-gym" },
      { variant: "home", tone: "solid", class: "bg-home text-home-foreground border-home" },
      { variant: "goal", tone: "solid", class: "bg-goal text-goal-foreground border-goal" },
    ],
    defaultVariants: {
      variant: "default",
      tone: "outline",
      size: "md",
      interactive: false,
    },
  },
);

export interface TileProps
  extends Omit<ButtonHTMLAttributes<HTMLDivElement>, "onClick">,
    VariantProps<typeof tileVariants> {
  as?: "div" | "button" | "a";
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function Tile({
  className,
  variant,
  tone,
  size,
  interactive,
  as = "div",
  selected,
  disabled,
  children,
  onClick,
  ...rest
}: TileProps) {
  const Component = as as "div";
  const isInteractive = interactive || Boolean(onClick);
  return (
    <Component
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        isInteractive && !disabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-pressed={selected ? true : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        tileVariants({ variant, tone, size, interactive: isInteractive }),
        selected && "ring-2 ring-primary/70 border-primary",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </Component>
  );
}

/** Label קטן, קריא, סמנטי — כותרת עליונה של אריח מטריקה */
export function TileLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** נתון מרכזי גדול — משקל, מרחק, זמן */
export function TileMetric({
  value,
  unit,
  className,
}: {
  value: ReactNode;
  unit?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className="ltr-nums text-3xl font-black leading-none tracking-tight">{value}</span>
      {unit ? (
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      ) : null}
    </div>
  );
}

/** מידע משני מוגבל בשורה */
export function TileFootnote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("text-sm text-muted-foreground", className)}>{children}</div>;
}

/** אינדיקטור השוואה מול הערך הקודם */
export function TileTrend({
  delta,
  unit,
  direction,
}: {
  delta: number | string;
  unit?: string;
  direction: "up" | "down" | "flat";
}) {
  const color =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "◆";
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-semibold", color)}
      aria-label={`שינוי ${direction === "up" ? "עלייה" : direction === "down" ? "ירידה" : "ללא שינוי"}`}
    >
      <span aria-hidden>{arrow}</span>
      <span className="ltr-nums">{delta}</span>
      {unit ? <span className="text-muted-foreground">{unit}</span> : null}
    </span>
  );
}
