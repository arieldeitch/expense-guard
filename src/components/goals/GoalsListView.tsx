/**
 * GoalsListView — רשימת היעדים של תחום יחיד + כניסה ליצירה.
 * מוצג בתוך אזור התחום בלבד (אין רשימה גלובלית חוצת-תחומים).
 */
import { Plus, Target } from "lucide-react";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { useGoalsByDomain, type GoalDomain, type GoalStatus } from "@/lib/goals";
import { GoalDetailLink, GoalNewLink } from "./goalLinks";

const STATUS_LABEL: Record<GoalStatus, string> = {
  draft: "טיוטה",
  active: "פעיל",
  paused: "מושהה",
  achieved: "הושג",
  not_achieved: "לא הושג",
  cancelled: "בוטל",
  archived: "ארכיון",
  trashed: "בסל",
};

export function GoalsListView({ domain }: { domain: GoalDomain }) {
  const goals = useGoalsByDomain(domain).filter((g) => g.status !== "trashed");
  const active = goals.filter((g) => g.status === "active");
  const other = goals.filter((g) => g.status !== "active");

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-6">
        <GoalNewLink
          domain={domain}
          className="tile-interactive inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          <Plus aria-hidden className="size-4" />
          יצירת יעד חדש
        </GoalNewLink>
      </div>

      {goals.length === 0 ? (
        <div className="px-4 sm:px-6">
          <EmptyState
            icon={<Target aria-hidden />}
            title="אין יעדים בתחום זה"
            description="יעדים מוגדרים על ידך בלבד. הוסף יעד למעלה."
          />
        </div>
      ) : (
        <>
          {active.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
              {active.map((g) => (
                <GoalDetailLink key={g.id} domain={domain} id={g.id}>
                  <Tile variant="goal" tone="soft" interactive>
                    <TileLabel>{STATUS_LABEL[g.status]}</TileLabel>
                    <TileMetric
                      value={
                        g.target_value != null ? `${g.target_value} ${g.target_unit}` : "—"
                      }
                    />
                    <TileFootnote>{g.name}</TileFootnote>
                  </Tile>
                </GoalDetailLink>
              ))}
            </div>
          ) : null}

          {other.length > 0 ? (
            <div>
              <h2 className="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:px-6">
                יעדים לא פעילים
              </h2>
              <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
                {other.map((g) => (
                  <GoalDetailLink key={g.id} domain={domain} id={g.id}>
                    <Tile tone="outline" interactive>
                      <TileLabel>{STATUS_LABEL[g.status]}</TileLabel>
                      <TileMetric
                        value={
                          g.target_value != null ? `${g.target_value} ${g.target_unit}` : "—"
                        }
                      />
                      <TileFootnote>{g.name}</TileFootnote>
                    </Tile>
                  </GoalDetailLink>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
