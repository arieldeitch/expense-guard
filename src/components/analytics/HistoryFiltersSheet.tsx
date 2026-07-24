/**
 * HistoryFiltersSheet — sheet אנכי לפילטרים.
 * ללא chips נגררים אופקית.
 */
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { SessionHistoryFilters, SessionHistorySort } from "@/lib/analytics";
import { TIME_RANGE_OPTIONS, resolveRange } from "@/lib/analytics";
import type { TimeRangeId } from "@/lib/analytics";
import { useAllTemplates } from "@/lib/templates";
import { useAllLocations } from "@/lib/catalog";

const SORT_LABELS: Record<SessionHistorySort, string> = {
  date_desc: "חדש לישן",
  date_asc: "ישן לחדש",
  duration_desc: "משך",
  volume_desc: "נפח",
  completion_desc: "שיעור השלמה",
  pr_desc: "מספר שיאים",
  quality_desc: "מדד איכות",
};

const TIME_LABEL: Record<TimeRangeId, string> = {
  "7d": "7 ימים",
  "30d": "30 ימים",
  month_current: "חודש נוכחי",
  month_prev: "חודש קודם",
  "3m": "3 חודשים",
  "6m": "6 חודשים",
  "1y": "שנה",
  all: "כל הזמנים",
  custom: "מותאם",
};

export interface HistoryFiltersSheetProps {
  filters: SessionHistoryFilters;
  sort: SessionHistorySort;
  range: TimeRangeId;
  onChange: (next: {
    filters: SessionHistoryFilters;
    sort: SessionHistorySort;
    range: TimeRangeId;
  }) => void;
}

export function HistoryFiltersSheet({ filters, sort, range, onChange }: HistoryFiltersSheetProps) {
  const templates = useAllTemplates();
  const locations = useAllLocations();
  const [draft, setDraft] = useState({ filters, sort, range });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) setDraft({ filters, sort, range });
  }, [open, filters, sort, range]);
  const activeCount =
    (filters.templateId ? 1 : 0) +
    (filters.locationId ? 1 : 0) +
    (filters.onlyComplete ? 1 : 0) +
    (filters.onlyPartial ? 1 : 0) +
    (filters.onlyWithPRs ? 1 : 0) +
    (filters.onlyWithNotes ? 1 : 0) +
    (filters.onlyWithQuality ? 1 : 0) +
    (filters.onlyWithSupersets ? 1 : 0);

  function apply() {
    const rangeResolved = resolveRange(draft.range);
    onChange({
      ...draft,
      filters: { ...draft.filters, from: rangeResolved.from, to: rangeResolved.to },
    });
    setOpen(false);
  }
  function reset() {
    setDraft({ filters: {}, sort: "date_desc", range: "all" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="size-4" aria-hidden />
          פילטרים ומיון{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>סינון ומיון</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <section>
            <div className="mb-2 font-bold">טווח זמן</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIME_RANGE_OPTIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, range: id }))}
                  className={cnPill(draft.range === id)}
                >
                  {TIME_LABEL[id]}
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-2 font-bold">מיון</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(SORT_LABELS) as SessionHistorySort[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, sort: id }))}
                  className={cnPill(draft.sort === id)}
                >
                  {SORT_LABELS[id]}
                </button>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-2 font-bold">תבנית</div>
            <select
              value={draft.filters.templateId ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  filters: { ...d.filters, templateId: e.target.value || null },
                }))
              }
              className="w-full rounded-lg border border-border-strong bg-surface p-2"
            >
              <option value="">כל התבניות</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </section>
          <section>
            <div className="mb-2 font-bold">מיקום</div>
            <select
              value={draft.filters.locationId ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  filters: { ...d.filters, locationId: e.target.value || null },
                }))
              }
              className="w-full rounded-lg border border-border-strong bg-surface p-2"
            >
              <option value="">כל המיקומים</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </section>
          <section className="grid grid-cols-2 gap-2">
            <Toggle
              label="רק אימונים מלאים"
              value={!!draft.filters.onlyComplete}
              onChange={(v) => setDraft((d) => ({ ...d, filters: { ...d.filters, onlyComplete: v } }))}
            />
            <Toggle
              label="רק חלקיים"
              value={!!draft.filters.onlyPartial}
              onChange={(v) => setDraft((d) => ({ ...d, filters: { ...d.filters, onlyPartial: v } }))}
            />
            <Toggle
              label="שיאים בלבד"
              value={!!draft.filters.onlyWithPRs}
              onChange={(v) => setDraft((d) => ({ ...d, filters: { ...d.filters, onlyWithPRs: v } }))}
            />
            <Toggle
              label="עם הערות"
              value={!!draft.filters.onlyWithNotes}
              onChange={(v) => setDraft((d) => ({ ...d, filters: { ...d.filters, onlyWithNotes: v } }))}
            />
            <Toggle
              label="עם מדד איכות"
              value={!!draft.filters.onlyWithQuality}
              onChange={(v) =>
                setDraft((d) => ({ ...d, filters: { ...d.filters, onlyWithQuality: v } }))
              }
            />
            <Toggle
              label="עם סופרסטים"
              value={!!draft.filters.onlyWithSupersets}
              onChange={(v) =>
                setDraft((d) => ({ ...d, filters: { ...d.filters, onlyWithSupersets: v } }))
              }
            />
          </section>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Button className="flex-1" onClick={apply}>
            החל
          </Button>
          <Button variant="ghost" onClick={reset}>
            איפוס
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function cnPill(active: boolean): string {
  return [
    "rounded-full border px-3 py-1.5 text-xs transition-colors",
    active
      ? "border-primary bg-primary/10 font-bold"
      : "border-border-strong bg-surface text-muted-foreground",
  ].join(" ");
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface p-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
