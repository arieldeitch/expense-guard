import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ActionRow — פעולה משנית באריח (עריכה, ארכוב, מחיקה).
 * Icon + טקסט, גובה נגיש (44px min-height).
 */
export const ActionRow = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ReactNode;
    tone?: "default" | "warning" | "destructive";
  }
>(function ActionRow({ icon, children, className, tone = "default", ...rest }, ref) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive hover:bg-destructive/10"
      : tone === "warning"
        ? "text-warning hover:bg-warning/10"
        : "text-foreground hover:bg-tint";
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2 text-start text-sm font-semibold transition-colors",
        toneClass,
        className,
      )}
      {...rest}
    >
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-tint text-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="truncate">{children}</span>
      <span aria-hidden />
    </button>
  );
});

/** Badge קטן לתוך אריח. */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info" | "destructive";
  className?: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success-soft/50 text-success border-success/40"
      : tone === "warning"
        ? "bg-warning-soft/50 text-warning border-warning/40"
        : tone === "info"
          ? "bg-info-soft/50 text-info border-info/40"
          : tone === "destructive"
            ? "bg-destructive/10 text-destructive border-destructive/40"
            : "bg-tint text-muted-foreground border-border-strong";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
