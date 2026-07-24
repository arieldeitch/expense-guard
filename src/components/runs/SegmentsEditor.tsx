/**
 * SegmentsEditor — עורך מקטעים אופציונלי לריצה.
 * לא ברירת מחדל; המשתמש בוחר להוסיף. סכומים לא דורסים את סיכום הריצה.
 */
import { Fragment } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tile, TileFootnote } from "@/components/tile/Tile";
import {
  SEGMENT_TYPE_LABELS,
  SEGMENT_TYPE_ORDERED,
  sumSegments,
  formatDurationHMS,
  formatDistanceKm,
  formatPace,
  parseDurationInput,
  parseDecimal,
  runsRepo,
} from "@/lib/runs";
import type { RunSegment } from "@/lib/runs";

interface Props {
  segments: RunSegment[];
  onChange: (segments: RunSegment[]) => void;
  totals?: { duration_seconds: number | null; distance_meters: number | null };
}

export function SegmentsEditor({ segments, onChange, totals }: Props) {
  const sum = sumSegments(segments);
  const mismatch =
    totals && sum.duration_seconds != null && totals.duration_seconds != null
      ? Math.abs(sum.duration_seconds - totals.duration_seconds) > 2
      : totals && sum.distance_meters != null && totals.distance_meters != null
        ? Math.abs(sum.distance_meters - totals.distance_meters) > 50
        : false;

  function patch(id: string, p: Partial<RunSegment>) {
    onChange(segments.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }
  function remove(id: string) {
    onChange(segments.filter((s) => s.id !== id).map((s, i) => ({ ...s, sequence: i })));
  }
  function move(id: string, dir: -1 | 1) {
    const idx = segments.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= segments.length) return;
    const next = segments.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next.map((s, i) => ({ ...s, sequence: i })));
  }
  function add() {
    onChange([...segments, runsRepo.newSegment(segments.length)]);
  }
  function duplicate(id: string) {
    const src = segments.find((s) => s.id === id);
    if (!src) return;
    const copy = { ...src, id: runsRepo.newSegment(0).id, sequence: segments.length };
    onChange([...segments, copy]);
  }

  return (
    <div className="space-y-3">
      {segments.length === 0 ? (
        <TileFootnote>אין מקטעים. אפשר להוסיף חימום, עבודה, התאוששות וקירור.</TileFootnote>
      ) : (
        <div className="space-y-2">
          {segments.map((s, i) => (
            <Fragment key={s.id}>
              <Tile size="sm" className="gap-2">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <div className="text-xs font-bold text-muted-foreground">#{i + 1}</div>
                  <Select
                    value={s.segment_type}
                    onValueChange={(v) =>
                      patch(s.id, { segment_type: v as RunSegment["segment_type"] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENT_TYPE_ORDERED.map((t) => (
                        <SelectItem key={t} value={t}>
                          {SEGMENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => move(s.id, -1)}
                      disabled={i === 0}
                      aria-label="הזז למעלה"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => move(s.id, 1)}
                      disabled={i === segments.length - 1}
                      aria-label="הזז למטה"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicate(s.id)}
                      aria-label="שכפל"
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(s.id)}
                      aria-label="מחק"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <Label className="text-xs">משך (mm:ss)</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="0:00"
                      defaultValue={
                        s.duration_seconds != null ? formatDurationHMS(s.duration_seconds) : ""
                      }
                      onBlur={(e) =>
                        patch(s.id, { duration_seconds: parseDurationInput(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">מרחק (ק"מ)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="0.0"
                      defaultValue={
                        s.distance_meters != null ? (s.distance_meters / 1000).toString() : ""
                      }
                      onBlur={(e) => {
                        const v = parseDecimal(e.target.value);
                        patch(s.id, { distance_meters: v == null ? null : v * 1000 });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">מהירות (קמ"ש)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="—"
                      defaultValue={s.average_speed_kmh?.toString() ?? ""}
                      onBlur={(e) =>
                        patch(s.id, { average_speed_kmh: parseDecimal(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">שיפוע %</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="—"
                      defaultValue={s.incline_pct?.toString() ?? ""}
                      onBlur={(e) => patch(s.id, { incline_pct: parseDecimal(e.target.value) })}
                    />
                  </div>
                </div>
              </Tile>
            </Fragment>
          ))}
          <Tile size="sm" variant="info" tone="soft">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="font-bold">סיכום מקטעים</div>
              <div className="ltr-nums">
                {formatDurationHMS(sum.duration_seconds)} · {formatDistanceKm(sum.distance_meters)}{" "}
                ק"מ · {formatPace(sum.average_pace_s_per_km)} /ק"מ
              </div>
            </div>
            {mismatch ? (
              <TileFootnote className="text-warning">
                שים לב: סכום המקטעים אינו תואם את סיכום הריצה. הערכים נשמרים במקביל.
              </TileFootnote>
            ) : null}
          </Tile>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="me-1 size-4" /> הוספת מקטע
      </Button>
    </div>
  );
}
