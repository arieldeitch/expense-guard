import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — כותרת עמוד עם title, description ו־action אופציונלי.
 * מובנה ל־RTL: grid עם minmax כדי לא ליצור overflow במובייל.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 pb-4 pt-1 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="truncate text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 pb-2 pt-4 sm:px-6",
        className,
      )}
    >
      <h2 className="truncate text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
