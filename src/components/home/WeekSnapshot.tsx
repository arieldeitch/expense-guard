import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { formatDayLabel, groupByWeek, type HistoryItem } from "@/lib/history/items";
import { dayKey, weekStart } from "@/lib/race-project/model";

/**
 * WeekSnapshot — שורת "השבוע" במסך הראשי (ADR-0042): כמה אימונים, כמה זמן, כמה ק״מ,
 * והאימון האחרון. קישור אחד להיסטוריה; ללא גרפים, ללא cheerleading.
 */
export function WeekSnapshot({ items }: { items: HistoryItem[] }) {
  const today = dayKey();
  const thisWeek = groupByWeek(items, today).find((g) => g.weekStart === weekStart(today));
  const last = items.find((i) => i.status !== "draft");
  const drafts = items.filter((i) => i.status === "draft").length;
  return (
    <div className="px-4 sm:px-6">
      <Link
        to="/history"
        className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:bg-surface-elevated"
        aria-label="השבוע — פתיחת ההיסטוריה"
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold">
            השבוע · {thisWeek ? thisWeek.summary : "עדיין אין אימונים"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {last
              ? `אחרון: ${last.title} · ${formatDayLabel(last.day)} · ${last.metric}`
              : "הדיווח הראשון יופיע כאן"}
            {drafts ? ` · ${drafts} טיוטות` : ""}
          </span>
        </span>
        <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
