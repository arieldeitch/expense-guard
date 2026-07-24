/**
 * מסך פרטי יעד — progress, פרטים, פעולות מחזור חיים.
 */
import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import {
  useGoal,
  useGoalProgress,
  useGoalSnapshots,
  useGoalVersions,
  markAchieved,
  markNotAchieved,
  pauseGoal,
  resumeGoal,
  archiveGoal,
  trashGoal,
  setPrimary,
  unsetPrimary,
  setManualCurrent,
  recordSnapshot,
  getGoalTypeSpec,
} from "@/lib/goals";
import { useState } from "react";

export const Route = createFileRoute("/goals/$id")({
  head: () => ({
    meta: [
      { title: "יעד · Fit Log" },
      { name: "description", content: "פרטי יעד, התקדמות, גרסאות." },
      { property: "og:title", content: "יעד · Fit Log" },
      { property: "og:description", content: "פרטי יעד, התקדמות, גרסאות." },
    ],
  }),
  loader: ({ params }) => {
    // הטעינה מתבצעת מ־localStorage בלקוח; loader בעיקר לבדיקת קיום דרך UI.
    return { id: params.id };
  },
  component: GoalDetailPage,
});

function GoalDetailPage() {
  const { id } = Route.useParams();
  const goal = useGoal(id);
  const progress = useGoalProgress(goal);
  const snapshots = useGoalSnapshots(id);
  const versions = useGoalVersions(id);
  const navigate = useNavigate();
  const [manual, setManual] = useState<string>("");

  if (!goal) {
    return (
      <AppShell topBar={{ title: "יעד לא נמצא", back: { to: "/goals", label: "לרשימת יעדים" } }}>
        <PageHeader title="יעד לא נמצא" description="ייתכן שנמחק או שהמזהה שגוי." />
      </AppShell>
    );
  }

  const spec = getGoalTypeSpec(goal.goal_type);

  return (
    <AppShell topBar={{ title: goal.name, back: { to: "/goals", label: "יעדים" } }}>
      <PageHeader
        eyebrow={spec.label_he}
        title={goal.name}
        description={goal.description ?? spec.description_he}
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>אחוז השלמה</TileLabel>
          <TileMetric
            value={progress?.progress_percentage == null ? "—" : `${progress.progress_percentage}%`}
          />
          <TileFootnote>{progress?.calculation_details ?? "אין נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>ערך נוכחי</TileLabel>
          <TileMetric
            value={
              progress?.current_value != null
                ? `${progress.current_value} ${goal.target_unit}`
                : "—"
            }
          />
        </Tile>
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>ערך יעד</TileLabel>
          <TileMetric
            value={goal.target_value != null ? `${goal.target_value} ${goal.target_unit}` : "—"}
          />
        </Tile>
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>מועד יעד</TileLabel>
          <TileMetric value={goal.target_date ?? "—"} />
          <TileFootnote>
            {progress?.days_remaining != null
              ? progress.days_remaining >= 0
                ? `נותרו ${progress.days_remaining} ימים`
                : `עבר לפני ${Math.abs(progress.days_remaining)} ימים`
              : ""}
          </TileFootnote>
        </Tile>
      </div>

      {progress?.projected_value != null ? (
        <div className="px-4 sm:px-6">
          <Tile variant="goal" tone="soft">
            <TileLabel>תחזית לתאריך היעד</TileLabel>
            <TileMetric value={`${progress.projected_value} ${goal.target_unit}`} />
            <TileFootnote>
              {progress.projection_method} · רמת אמון: {progress.confidence_label}
            </TileFootnote>
          </Tile>
        </div>
      ) : null}

      {spec.manual_current ? (
        <div className="px-4 sm:px-6">
          <SectionHeader title="עדכון ידני של ערך נוכחי" />
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="flex-1 rounded-lg border border-border-strong bg-background p-2 ltr-nums"
              placeholder={goal.current_value?.toString() ?? "ערך"}
            />
            <button
              onClick={() => {
                if (manual === "") return;
                setManualCurrent(goal.id, Number(manual));
                setManual("");
              }}
              className="rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              שמור
            </button>
          </div>
        </div>
      ) : null}

      <SectionHeader title="פעולות" />
      <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4 sm:px-6">
        <ActionButton
          onClick={() => {
            if (progress) recordSnapshot(goal.id, progress);
          }}
          label="שמור snapshot"
        />
        {goal.status === "active" ? (
          <>
            <ActionButton onClick={() => markAchieved(goal.id)} label="סמן כהושג" />
            <ActionButton onClick={() => markNotAchieved(goal.id)} label="סמן כלא הושג" />
            <ActionButton onClick={() => pauseGoal(goal.id)} label="השהה" />
          </>
        ) : goal.status === "paused" ? (
          <ActionButton onClick={() => resumeGoal(goal.id)} label="חזור לפעיל" />
        ) : null}
        {goal.is_primary ? (
          <ActionButton onClick={() => unsetPrimary(goal.id)} label="הסר סימון ראשי" />
        ) : (
          <ActionButton onClick={() => setPrimary(goal.id)} label="סמן כראשי" />
        )}
        <ActionButton onClick={() => archiveGoal(goal.id)} label="ארכיון" />
        <ActionButton
          onClick={() => {
            trashGoal(goal.id);
            navigate({ to: "/goals" });
          }}
          label="מחק"
          tone="danger"
        />
      </div>

      <SectionHeader title={`snapshots (${snapshots.length})`} />
      <div className="space-y-2 px-4 sm:px-6">
        {snapshots.length === 0 ? (
          <div className="text-sm text-muted-foreground">אין snapshots שמורים.</div>
        ) : (
          snapshots
            .slice()
            .reverse()
            .slice(0, 10)
            .map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border-strong bg-surface p-3 text-xs"
              >
                <div className="ltr-nums font-bold">
                  {s.snapshot_at} · {s.current_value ?? "—"} · {s.progress_percentage ?? "—"}%
                </div>
                <div className="text-muted-foreground">{s.calculation_details}</div>
              </div>
            ))
        )}
      </div>

      <SectionHeader title={`גרסאות (${versions.length})`} />
      <div className="space-y-2 px-4 sm:px-6 pb-8">
        {versions.length === 0 ? (
          <div className="text-sm text-muted-foreground">אין שינויים מהותיים.</div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-border-strong bg-surface p-3 text-xs"
            >
              <div className="font-bold">
                גרסה {v.version} · {v.created_at}
              </div>
              <div className="text-muted-foreground">
                שדות שהשתנו: {v.changed_fields.join(", ") || "—"}
              </div>
              {v.reason ? <div className="text-muted-foreground">סיבה: {v.reason}</div> : null}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

function ActionButton({
  onClick,
  label,
  tone,
}: {
  onClick: () => void;
  label: string;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 rounded-xl px-3 text-sm font-bold ${
        tone === "danger"
          ? "bg-destructive text-destructive-foreground"
          : "bg-muted text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
