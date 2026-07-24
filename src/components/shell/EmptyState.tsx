import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — קומפקטי, ללא illustration גדול, ללא טקסט שיווקי.
 * מציג אייקון קטן + כותרת + תיאור קצר + action אופציונלי.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tile-base flex flex-col items-start gap-3 p-5 text-start",
        className,
      )}
      role="status"
    >
      {icon ? (
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <div className="text-base font-bold text-foreground">{title}</div>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
