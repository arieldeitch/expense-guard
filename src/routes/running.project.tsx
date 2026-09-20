import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveRuns, formatDurationHMS, formatDistanceKm } from "@/lib/runs";
import { useHydrated } from "@/lib/storage/useHydrated";
import {
  DEFAULT_SETTINGS,
  DAYS,
  KIND_LABELS,
  INITIAL_RACES,
  weekStart,
  shiftDay,
  dayKey,
  type CoachSettings,
  type Race,
  type TrainingKind,
  type PlanDay,
} from "@/lib/race-project/model";
import {
  ensureWeek,
  regenerateWeek,
  saveRaces,
  saveSettings,
  updateWeek,
  useRaceProject,
} from "@/lib/race-project/repo";

export const Route = createFileRoute("/running/project")({
  component: RaceProject,
  head: () => ({ meta: [{ title: "פרויקט חצאי המרתון · Fit Log" }] }),
});
const selectClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-border-strong bg-surface px-2 text-sm";

function RaceProject() {
  const hydrated = useHydrated();
  const [start, setStart] = useState(() => weekStart());
  const { settings, races, weeks } = useRaceProject();
  const runs = useActiveRuns();
  const week = weeks.find((w) => w.id === start);
  useEffect(() => {
    if (hydrated) ensureWeek(start);
  }, [hydrated, start]);
  // New weeks appear on the first visit, without replacing an edited/accepted week.
  useEffect(() => {
    const refresh = () =>
      setStart((previous) =>
        previous === weekStart(shiftDay(dayKey(), -1)) ? weekStart() : previous,
      );
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const actual = runs.filter(
    (r) => dayKey(r.started_at) >= start && dayKey(r.started_at) <= shiftDay(start, 6),
  );
  const completedRaces = races.filter(
    (r) => !r.deleted_at && (r.status === "completed" || runs.some((run) => run.race_id === r.id)),
  ).length;
  const changeDay = (id: string, patch: Partial<PlanDay>) => {
    if (week)
      updateWeek({ ...week, days: week.days.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };
  return (
    <AppShell
      topBar={{ title: "פרויקט חצאי המרתון", back: { to: "/running", label: "חזרה לריצה" } }}
    >
      <PageHeader
        title={`חצאי המרתון שלי · ${settings.year}`}
        description="המלצה → ההתאמות שלך → ביצוע ביומן → השבוע הבא"
      />
      <div className="space-y-4 px-4 sm:px-6">
        <Tile variant="run" tone="soft">
          <div className="text-2xl font-black">
            {completedRaces} הושלמו · יעד {settings.target_min}–{settings.target_max}
          </div>
          <p className="text-sm text-muted-foreground">
            באר שבע נרשם כהושלם לפי הדיווח שלך. זמן ותוצאה לא הומצאו.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/running/history">יומן הריצות</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/running/new/$type" params={{ type: "treadmill" }}>
                דיווח ריצה
              </Link>
            </Button>
          </div>
        </Tile>
        <details className="rounded-2xl border-2 border-border-strong p-4">
          <summary className="cursor-pointer font-bold">
            המרוצים שלי · עריכת תאריכים והוספת מרוץ
          </summary>
          <p className="my-3 text-sm text-muted-foreground">
            המועדים המשוערים הם מהדיווח שלך. הזן תאריך מדויק כדי להתאים את שבוע המרוץ וההתאוששות.
          </p>
          {races
            .filter((r) => !r.deleted_at)
            .map((r) => (
              <RaceEditor
                key={r.id}
                race={r}
                onSave={(next) => saveRaces(races.map((x) => (x.id === next.id ? next : x)))}
              />
            ))}
          <Button
            variant="outline"
            onClick={() =>
              saveRaces([
                ...races,
                {
                  ...INITIAL_RACES[1],
                  id: crypto.randomUUID(),
                  name: "מרוץ נוסף",
                  date_note: "יש להשלים שם ותאריך",
                },
              ])
            }
          >
            הוסף מרוץ
          </Button>
        </details>
        <details
          className="rounded-2xl border-2 border-border-strong p-4"
          open={!settings.weekly_minutes}
        >
          <summary className="cursor-pointer font-bold">העדפות ונתוני בסיס להמלצה</summary>
          <SettingsForm key={JSON.stringify(settings)} settings={settings} onSave={saveSettings} />
        </details>
        <Tile>
          <h2 className="text-lg font-bold">התוכנית השבועית</h2>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Button
              variant="outline"
              aria-label="שבוע קודם"
              onClick={() => setStart(shiftDay(start, -7))}
            >
              קודם
            </Button>
            <span className="text-center text-sm" dir="ltr">
              {start} — {shiftDay(start, 6)}
            </span>
            <Button
              variant="outline"
              aria-label="שבוע הבא"
              onClick={() => setStart(shiftDay(start, 7))}
            >
              הבא
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setStart(weekStart())}>
            השבוע הנוכחי · ראשון עד שבת
          </Button>
          <p className="text-sm text-muted-foreground">
            מלווה אימונים מבוסס כללים, לא שירות AI חיצוני. מציע תוכנית בפתיחה הראשונה של השבוע; אינו
            פועל כשהאפליקציה סגורה. ההמלצה היא בסיס לשינוי שלך.
          </p>
          <a
            className="text-sm underline"
            href="https://www.baa.org/races/boston-half/info-for-athletes/boston-half-training/"
            target="_blank"
            rel="noreferrer"
          >
            מקור לעקרונות אימון כלליים: B.A.A.
          </a>
          {week && (
            <>
              <p role="status" className="text-sm">
                {week.rationale}
              </p>
              <p className="text-sm font-bold">
                {week.status === "accepted"
                  ? "תוכנית שבחרת"
                  : week.status === "rejected"
                    ? "ההמלצה נדחתה"
                    : "טיוטת המלצה — ניתנת לעריכה"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => updateWeek({ ...week, status: "accepted" })}>
                  אשר את הבחירות שלי
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("ליצור המלצה חדשה? הגרסה הקודמת תישמר בהיסטוריית השינויים."))
                      regenerateWeek(start);
                  }}
                >
                  עדכן המלצה מהנתונים
                </Button>
                <Button variant="ghost" onClick={() => updateWeek({ ...week, status: "rejected" })}>
                  דחה המלצה
                </Button>
              </div>
              <p className="text-sm">
                בפועל השבוע: {actual.length} ריצות ·{" "}
                {formatDistanceKm(actual.reduce((n, r) => n + (r.distance_meters ?? 0), 0))} ק״מ ·{" "}
                {formatDurationHMS(actual.reduce((n, r) => n + (r.duration_seconds ?? 0), 0))}
              </p>
            </>
          )}
        </Tile>
        {week?.days.map((d, i) => {
          const linked = runs.filter((r) => r.training_plan_item_id === d.id);
          return (
            <Tile key={d.id} variant="run" tone={linked.length ? "soft" : "outline"}>
              <div className="flex justify-between gap-2">
                <h3 className="font-bold">
                  {DAYS[i]} · {d.date.slice(5)}
                </h3>
                <span className="text-sm">
                  {linked.length ? "דווח ביומן" : d.skipped ? "דילגת" : "טרם בוצע"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                המלצה מקורית: {KIND_LABELS[d.recommended.kind]}
                {d.recommended.minutes != null ? ` · ${d.recommended.minutes} דקות` : ""}
              </p>
              <p className="text-sm">{d.recommended.note}</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">
                  הבחירה שלי
                  <select
                    className={selectClass}
                    value={d.chosen.kind}
                    onChange={(e) =>
                      changeDay(d.id, {
                        chosen: { ...d.chosen, kind: e.target.value as TrainingKind },
                      })
                    }
                  >
                    {Object.entries(KIND_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  משך בדקות
                  <Input
                    type="number"
                    min={0}
                    max={600}
                    value={d.chosen.minutes ?? ""}
                    onChange={(e) =>
                      changeDay(d.id, {
                        chosen: {
                          ...d.chosen,
                          minutes:
                            e.target.value === ""
                              ? null
                              : Math.max(0, Math.min(600, Number(e.target.value))),
                        },
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  איפה
                  <select
                    className={selectClass}
                    value={d.chosen.surface}
                    onChange={(e) =>
                      changeDay(d.id, {
                        chosen: { ...d.chosen, surface: e.target.value as "treadmill" | "outdoor" },
                      })
                    }
                  >
                    <option value="treadmill">הליכון בקיבוץ</option>
                    <option value="outdoor">בחוץ</option>
                  </select>
                </label>
                <label className="text-sm">
                  התאמה אישית
                  <Input
                    key={d.chosen.note}
                    defaultValue={d.chosen.note}
                    onBlur={(e) =>
                      changeDay(d.id, { chosen: { ...d.chosen, note: e.target.value } })
                    }
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link
                    to="/running/new/$type"
                    params={{ type: d.chosen.surface }}
                    search={{ plan: d.id }}
                  >
                    דווח ביצוע
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => changeDay(d.id, { skipped: !d.skipped })}>
                  {d.skipped ? "בטל דילוג" : "דלג על היום"}
                </Button>
              </div>
              {linked.map((r) => (
                <Link
                  key={r.id}
                  to="/running/$id"
                  params={{ id: r.id }}
                  className="text-sm underline"
                >
                  פתח ריצה · {formatDistanceKm(r.distance_meters)} ק״מ ·{" "}
                  {formatDurationHMS(r.duration_seconds)}
                </Link>
              ))}
            </Tile>
          );
        })}
        {week && week.revisions.length > 0 && (
          <details className="rounded-2xl border p-4">
            <summary className="cursor-pointer font-bold">
              היסטוריית שינויים · {week.revisions.length}
            </summary>
            {[...week.revisions].reverse().map((revision, i) => (
              <details key={`${revision.at}-${i}`} className="my-2">
                <summary className="cursor-pointer text-sm">
                  {new Date(revision.at).toLocaleString("he-IL")} · גרסה קודמת
                </summary>
                {revision.days.map((d) => (
                  <p key={d.id} className="text-sm">
                    {d.date}: {KIND_LABELS[d.chosen.kind]} · {d.chosen.minutes ?? "—"} דקות ·{" "}
                    {d.chosen.note}
                  </p>
                ))}
              </details>
            ))}
          </details>
        )}
        <p className="text-sm text-muted-foreground">
          הנתונים נשמרים במכשיר זה ונכללים בגיבוי.{" "}
          <Link to="/backup" className="underline">
            ייצוא ושחזור
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

function RaceEditor({ race, onSave }: { race: Race; onSave: (race: Race) => void }) {
  const [draft, setDraft] = useState(race);
  return (
    <form
      className="my-3 space-y-2 rounded-xl border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <label className="block text-sm">
        שם המרוץ
        <Input
          required
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <p className="text-sm text-muted-foreground">{draft.date_note}</p>
      <label className="block text-sm">
        תאריך מאומת על ידך
        <Input
          type="date"
          min="2026-01-01"
          max="2026-12-31"
          value={draft.date ?? ""}
          onChange={(e) => setDraft({ ...draft, date: e.target.value || null })}
        />
      </label>
      <label className="block text-sm">
        מצב
        <select
          className={selectClass}
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as Race["status"] })}
        >
          <option value="planned">מתוכנן</option>
          <option value="completed">הושלם לפי הדיווח שלי</option>
        </select>
      </label>
      <Button type="submit" variant="outline">
        שמור מרוץ
      </Button>
    </form>
  );
}
function SettingsForm({
  settings,
  onSave,
}: {
  settings: CoachSettings;
  onSave: (s: CoachSettings) => void;
}) {
  const [draft, setDraft] = useState(settings ?? DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
        setSaved(true);
      }}
    >
      <p className="text-sm">
        הזן מה שאתה כבר עושה בנוחות, לא יעד חדש. אם יש לפחות שש ריצות בארבעת השבועות הקודמים, ההמלצה
        תשתמש ביומן.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          דקות ריצה בשבוע רגיל
          <Input
            required
            type="number"
            min={1}
            max={1500}
            value={draft.weekly_minutes ?? ""}
            onChange={(e) => setDraft({ ...draft, weekly_minutes: Number(e.target.value) || null })}
          />
        </label>
        <label className="text-sm">
          ריצה ארוכה רגילה — דקות
          <Input
            required
            type="number"
            min={1}
            max={300}
            value={draft.longest_minutes ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, longest_minutes: Number(e.target.value) || null })
            }
          />
        </label>
        <label className="text-sm">
          יום לריצת נפח
          <select
            className={selectClass}
            value={draft.long_day}
            onChange={(e) => setDraft({ ...draft, long_day: Number(e.target.value) })}
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          אימון איכות מועדף
          <select
            className={selectClass}
            value={draft.quality}
            onChange={(e) => setDraft({ ...draft, quality: e.target.value as TrainingKind })}
          >
            {["easy", "intervals", "hills", "tempo", "strides"].map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k as TrainingKind]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          תחושה השבוע
          <select
            className={selectClass}
            value={draft.recovery}
            onChange={(e) =>
              setDraft({ ...draft, recovery: e.target.value as CoachSettings["recovery"] })
            }
          >
            <option value="normal">רגילה</option>
            <option value="tired">עייפות</option>
            <option value="pain">כאב</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="text-sm">ימים שנוחים לך לריצה</legend>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((d, i) => (
            <label key={d} className="flex min-h-11 items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={draft.running_days.includes(i)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    running_days: e.target.checked
                      ? [...draft.running_days, i]
                      : draft.running_days.filter((x) => x !== i),
                  })
                }
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit">שמור העדפות</Button>
      {saved && (
        <p role="status" className="text-sm">
          ההעדפות עודכנו. לחץ “עדכן המלצה מהנתונים” כדי לעדכן שבוע קיים בלי לדרוס התאמות בשקט.
        </p>
      )}
    </form>
  );
}
