/**
 * GoalTile — אריח יעד מבוסס נתונים אמיתיים ממודול goals.
 * מציג progress bar דטרמיניסטי, פרטים עובדתיים, ללא שפת עידוד.
 */
import { Target } from "lucide-react";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import { useGoalProgress, usePrimaryGoal, useActiveGoalsCount } from "@/lib/goals";
import type { GoalDomain } from "@/lib/goals";
import { GoalDetailLink, GoalListLink, GoalNewLink } from "./goalLinks";

interface Props {
  domain: GoalDomain;
}

export function DomainPrimaryGoalTile({ domain }: Props) {
  const goal = usePrimaryGoal(domain);
  const progress = useGoalProgress(goal);
  const activeCount = useActiveGoalsCount(domain);

  if (!goal) {
    return (
      <EmptyState
        icon={<Target aria-hidden />}
        title="אין יעדים פעילים"
        description="יעדים מוגדרים על ידך בלבד — לחיצה להוספה."
        action={
          <GoalNewLink
            domain={domain}
            className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            הוספת יעד
          </GoalNewLink>
        }
      />
    );
  }

  const pct = progress?.progress_percentage;
  const pctLabel = pct == null ? "—" : `${pct}%`;
  const currentLabel =
    progress?.current_value != null
      ? `${round(progress.current_value)} ${goal.target_unit}`
      : "אין נתונים";
  const targetLabel =
    goal.target_value != null ? `יעד: ${round(goal.target_value)} ${goal.target_unit}` : "";
  const daysLabel =
    progress?.days_remaining != null
      ? progress.days_remaining >= 0
        ? `נותרו ${progress.days_remaining} ימים`
        : `עבר מועד היעד ב־${Math.abs(progress.days_remaining)} ימים`
      : null;

  return (
    <div className="space-y-2">
      <GoalDetailLink domain={domain} id={goal.id}>
        <Tile variant="goal" tone="soft" interactive>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <TileLabel>יעד פעיל</TileLabel>
              <div className="truncate text-base font-bold">{goal.name}</div>
            </div>
            <TileMetric value={pctLabel} className="ltr-nums" />
          </div>
          <ProgressBar value={pct} />
          <TileFootnote>
            {currentLabel}
            {targetLabel ? ` · ${targetLabel}` : ""}
            {daysLabel ? ` · ${daysLabel}` : ""}
          </TileFootnote>
        </Tile>
      </GoalDetailLink>
      {activeCount > 1 ? (
        <GoalListLink
          domain={domain}
          className="block text-xs font-bold text-primary underline-offset-2 hover:underline"
        >
          עוד {activeCount - 1} יעדים פעילים ←
        </GoalListLink>
      ) : null}
    </div>
  );
}

function ProgressBar({ value }: { value: number | null | undefined }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function round(n: number): string {
  if (Math.abs(n) >= 100) return String(Math.round(n));
  return (Math.round(n * 10) / 10).toString();
}
