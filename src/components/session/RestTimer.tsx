/**
 * RestTimer — טיימר מנוחה sticky בתחתית המסך.
 * מבוסס timestamp כדי לשרוד רענון, פאוזה, background.
 */
import { Pause, Plus, SkipForward, X } from "lucide-react";
import { useRestTimer, adjustRestTimer, stopRestTimer } from "@/lib/sessions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
}

export function RestTimer({ sessionId }: Props) {
  const t = useRestTimer(sessionId);
  if (!t.active) return null;
  const total = Math.max(1, t.plannedSeconds);
  const pct = Math.min(100, (t.remainingSeconds / total) * 100);
  const done = t.remainingSeconds <= 0;
  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "safe-bottom pointer-events-auto fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md px-3 sm:bottom-4",
      )}
    >
      <div className="rounded-2xl border border-border-strong bg-surface-elevated/95 p-3 shadow-elevated backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground">מנוחה</span>
          {t.nextExerciseName ? (
            <span className="truncate text-muted-foreground">הבא: {t.nextExerciseName}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="ltr-nums grid min-w-16 place-items-center text-3xl font-black tabular-nums">
            {formatMMSS(t.remainingSeconds)}
          </div>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-tint">
              <div
                className={cn("h-full transition-[width]", done ? "bg-success" : "bg-primary")}
                style={{ width: `${done ? 100 : 100 - pct}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {done ? "המנוחה הסתיימה" : `מתוך ${formatMMSS(total)}`}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <RestBtn onClick={() => adjustRestTimer(-15)} label="−15 ש׳" />
          <RestBtn onClick={() => adjustRestTimer(15)} icon={<Plus className="size-3.5" />}>
            15 ש׳
          </RestBtn>
          <RestBtn onClick={() => adjustRestTimer(-15)} icon={<Pause className="size-3.5" />} hidden />
          <div className="ms-auto flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stopRestTimer}
              className="min-h-9 rounded-lg border border-border-strong px-2"
            >
              <SkipForward className="size-4" aria-hidden />
              דלג
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stopRestTimer}
              className="min-h-9 rounded-lg text-destructive"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestBtn({
  onClick,
  children,
  label,
  icon,
  hidden,
}: {
  onClick: () => void;
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border-strong bg-tint px-2 text-xs font-bold"
    >
      {icon}
      {children ?? label}
    </button>
  );
}

function formatMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
