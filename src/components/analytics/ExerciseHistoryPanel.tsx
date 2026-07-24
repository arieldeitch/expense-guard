/**
 * ExerciseHistoryPanel — מציג סיכום היסטוריית תרגיל + גרף בורר.
 */
import { useMemo, useState } from "react";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { MiniLineChart } from "./MiniLineChart";
import { MetricSelector } from "./MetricSelector";
import {
  analyzeExerciseProgress,
  buildExerciseMetricSeries,
  EXERCISE_METRIC_LABELS,
  getExerciseHistorySummary,
} from "@/lib/analytics";
import type { ExerciseMetricId } from "@/lib/analytics";
import { useAllSessions } from "@/lib/sessions";

export function ExerciseHistoryPanel({ exerciseId }: { exerciseId: string }) {
  useAllSessions(); // subscribe
  const summary = getExerciseHistorySummary(exerciseId);
  const progress = analyzeExerciseProgress(exerciseId);
  const [metric, setMetric] = useState<ExerciseMetricId>("estimated_1rm");
  const series = useMemo(() => buildExerciseMetricSeries(exerciseId, metric), [exerciseId, metric]);

  if (summary.timesPerformed === 0) {
    return (
      <Tile>
        <TileLabel>היסטוריית ביצוע</TileLabel>
        <TileFootnote className="mt-2">אין עדיין נתוני ביצוע לתרגיל זה.</TileFootnote>
      </Tile>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SmallStat label="בוצע" value={String(summary.timesPerformed)} hint="פעמים" />
        <SmallStat
          label="ביצוע אחרון"
          value={summary.daysSinceLast != null ? `${summary.daysSinceLast}` : "—"}
          hint={summary.daysSinceLast != null ? "ימים" : ""}
        />
        <SmallStat
          label="משקל שיא"
          value={summary.topWeightKg != null ? `${summary.topWeightKg}` : "—"}
          hint={summary.topWeightKg != null ? "kg" : ""}
        />
        <SmallStat
          label="חזרות שיא"
          value={summary.topReps != null ? `${summary.topReps}` : "—"}
        />
        <SmallStat
          label="נפח סט שיא"
          value={summary.topSetVolumeKg != null ? `${summary.topSetVolumeKg}` : "—"}
          hint={summary.topSetVolumeKg != null ? "kg·reps" : ""}
        />
        <SmallStat
          label="נפח אימון שיא"
          value={summary.topSessionVolumeKg != null ? `${summary.topSessionVolumeKg}` : "—"}
          hint={summary.topSessionVolumeKg != null ? "kg" : ""}
        />
        <SmallStat
          label="הערכת 1RM"
          value={summary.topEstimated1RM ? `${summary.topEstimated1RM.value}` : "—"}
          hint={summary.topEstimated1RM ? "kg (הערכה)" : ""}
        />
        <SmallStat
          label="ביצוע אחרון"
          value={
            summary.lastWeightKg != null && summary.lastReps != null
              ? `${summary.lastWeightKg}×${summary.lastReps}`
              : "—"
          }
        />
      </div>

      <Tile>
        <div className="flex items-center justify-between gap-2">
          <div>
            <TileLabel>מדד התקדמות</TileLabel>
            <div className="mt-1 text-xl font-black">{progress.labelHe}</div>
          </div>
          <Chip tone={progress.confidence === "high" ? "info" : "default"}>
            {progress.sampleSize} אימונים · {progress.confidence}
          </Chip>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{progress.explanation}</p>
        <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {progress.components.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border border-border-strong bg-surface px-2 py-1 text-xs">
              <span>{c.label}</span>
              <span className="ltr-nums font-bold">
                {c.changePercent == null
                  ? "—"
                  : `${c.changePercent > 0 ? "+" : ""}${c.changePercent}%`}
              </span>
            </li>
          ))}
        </ul>
        {progress.missingData.length > 0 ? (
          <TileFootnote className="mt-2 text-[11px]">
            נתונים חסרים: {progress.missingData.join(", ")}
          </TileFootnote>
        ) : null}
      </Tile>

      <Tile>
        <TileLabel>גרף מדד לאורך זמן</TileLabel>
        <div className="mt-2">
          <MetricSelector
            value={metric}
            onChange={setMetric}
            options={(Object.keys(EXERCISE_METRIC_LABELS) as ExerciseMetricId[]).map((id) => ({
              id,
              label: EXERCISE_METRIC_LABELS[id].label,
              hint: EXERCISE_METRIC_LABELS[id].unit,
            }))}
          />
        </div>
        <div className="mt-3">
          <MiniLineChart points={series.points} unit={series.unit} />
        </div>
        <TileFootnote className="mt-2 text-[11px]">
          הערכת 1RM היא חישוב סטטיסטי בלבד ואינה מהווה עידוד לביצוע 1RM אמיתי.
        </TileFootnote>
      </Tile>
    </div>
  );
}

function SmallStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border-strong bg-surface p-2">
      <TileLabel className="text-[10px]">{label}</TileLabel>
      <TileMetric
        className="!text-xl"
        value={<span className="text-xl">{value}</span>}
        unit={hint}
      />
    </div>
  );
}
