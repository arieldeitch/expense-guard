/**
 * QualityBreakdown — פירוט Workout Quality Score עם רכיבים, נרמול והסבר.
 */
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import type { WorkoutQuality } from "@/lib/analytics";

export function QualityBreakdown({ quality }: { quality: WorkoutQuality }) {
  return (
    <Tile>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <TileLabel>מדד איכות אימון</TileLabel>
          <div className="mt-1 text-2xl font-black ltr-nums">
            {quality.totalScore != null ? `${quality.totalScore}/100` : "—"}
          </div>
        </div>
        <div className="max-w-[60%] text-right text-xs text-muted-foreground">{quality.label}</div>
      </div>
      <ul className="mt-3 space-y-2">
        {quality.components.map((c) => (
          <li key={c.id} className="rounded-xl border border-border-strong bg-surface p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{c.label}</span>
              <span className="ltr-nums text-sm">{c.score}/100</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-tint">
              <div
                className="h-full bg-primary"
                style={{ width: `${c.score}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              משקל בפועל: {(c.weight * 100).toFixed(0)}% (ברירת מחדל {(c.defaultWeight * 100).toFixed(0)}%)
            </div>
          </li>
        ))}
      </ul>
      {quality.excludedComponents.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {quality.excludedComponents.map((id) => (
            <Chip key={id} tone="default">
              {id} — לא נכלל
            </Chip>
          ))}
        </div>
      ) : null}
      {quality.narrative.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {quality.narrative.map((n, i) => (
            <li key={i} className="text-xs text-foreground">
              · {n}
            </li>
          ))}
        </ul>
      ) : null}
      <TileFootnote className="mt-3 text-[11px]">
        מדד אישי בלבד. אינו ציון בריאות, טכניקה, או השוואה למשתמשים אחרים. רכיב שאין לו נתונים
        מוחרג ומנורמל מחדש — אין עונש על שדות אופציונליים חסרים.
      </TileFootnote>
    </Tile>
  );
}
