/**
 * HoldTimer — טיימר החזקה מבוסס timestamps.
 * שומר start/pause בזיכרון בלבד. commit מפעיל onCommit(seconds).
 * אין הסתמכות על setInterval אחורי — משתמש ב־Date.now() ב־requestAnimationFrame.
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberField } from "@/components/session/NumberField";

interface Props {
  value: number | null; // seconds
  onChange: (v: number | null) => void;
  previous?: number | null;
  ariaLabel: string;
  className?: string;
}

export function HoldTimer({ value, onChange, previous, ariaLabel, className }: Props) {
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef<number>(value ?? 0);
  const [display, setDisplay] = useState<number>(value ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      baseRef.current = value ?? 0;
      setDisplay(value ?? 0);
    }
  }, [value, running]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startRef.current != null) {
        const elapsed = (Date.now() - startRef.current) / 1000;
        setDisplay(baseRef.current + elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const start = () => {
    startRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    if (startRef.current != null) {
      const elapsed = (Date.now() - startRef.current) / 1000;
      baseRef.current += elapsed;
      onChange(Math.round(baseRef.current));
    }
    startRef.current = null;
    setRunning(false);
  };
  const reset = () => {
    baseRef.current = 0;
    startRef.current = null;
    setRunning(false);
    setDisplay(0);
    onChange(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div
          role="timer"
          aria-live="polite"
          aria-label={ariaLabel}
          className="ltr-nums min-w-[5rem] rounded-xl border border-border-strong bg-surface px-3 py-2 text-center text-2xl font-black tabular-nums"
        >
          {formatMmSs(display)}
        </div>
        {running ? (
          <button
            type="button"
            onClick={pause}
            aria-label="עצור"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-warning px-3 text-warning-foreground"
          >
            <Pause className="size-5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label="התחל"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl bg-home px-3 text-white"
          >
            <Play className="size-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            pause();
          }}
          aria-label="סיים והזן"
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface px-3 text-xs font-bold"
        >
          <Square className="size-4" aria-hidden />
          סיים
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="אפס"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border-strong bg-tint text-muted-foreground"
        >
          <TimerReset className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <NumberField
          value={value}
          onChange={onChange}
          ariaLabel={`${ariaLabel} — הזנה ידנית`}
          step={5}
          min={0}
          max={3600}
          suffix="שנ׳"
          className="flex-1"
        />
        {previous != null ? (
          <button
            type="button"
            onClick={() => onChange(previous)}
            className="min-h-11 rounded-xl border border-border-strong bg-tint px-3 text-xs font-bold text-muted-foreground"
          >
            קודם: {previous}שנ׳
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatMmSs(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}
