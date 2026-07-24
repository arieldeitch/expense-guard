/**
 * /gym/new — בחירת מקור להתחלת אימון כוח: תבנית, ריק, שכפול אימון קודם.
 * לחיצה יוצרת session פעיל ומעבירה מיד למסך הביצוע.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, FilePlus, LayoutTemplate } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import { Chip } from "@/components/catalog/shared";
import { useAllTemplates, useTemplateExercises } from "@/lib/templates";
import {
  duplicateSessionAsNew,
  startEmptySession,
  startSessionFromTemplate,
  useAllSessions,
} from "@/lib/sessions";


export const Route = createFileRoute("/gym/new")({
  head: () => ({
    meta: [
      { title: "התחלת אימון · Fit Log" },
      { name: "description", content: "בחירת תבנית, אימון ריק או שכפול אימון קודם." },
      { property: "og:title", content: "התחלת אימון · Fit Log" },
      { property: "og:description", content: "בחירת תבנית, אימון ריק או שכפול אימון קודם." },
    ],
  }),
  component: NewGymPage,
});

function NewGymPage() {
  const templates = useAllTemplates();
  const sessions = useAllSessions();
  const navigate = useNavigate();

  const recent = sessions
    .filter((s) => s.status === "completed")
    .sort(
      (a, b) => new Date(b.ended_at ?? b.started_at).getTime() - new Date(a.ended_at ?? a.started_at).getTime(),
    )
    .slice(0, 5);

  function go(sessionId: string) {
    navigate({ to: "/sessions/$id", params: { id: sessionId } });
  }

  return (
    <AppShell topBar={{ title: "אימון חדש", back: { to: "/gym" } }}>
      <PageHeader eyebrow="חדר כושר" title="התחלת אימון" description="בחר מקור להתחלה. אפשר לערוך הכל אחר כך." />

      <SectionHeader title="התחלה מהירה" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <button
          type="button"
          onClick={() => {
            const s = startEmptySession("אימון חדש");
            go(s.id);
          }}
          className="tile-interactive rounded-2xl border border-border-strong bg-surface p-3 text-start shadow-tile"
        >
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-gym/25 text-gym [&_svg]:size-6">
              <FilePlus aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">אימון ריק</div>
              <div className="text-sm text-muted-foreground">הוספת תרגילים תוך כדי.</div>
            </div>
          </div>
        </button>
        <Link
          to="/templates"
          className="tile-interactive rounded-2xl border border-border-strong bg-surface p-3 text-start shadow-tile"
        >
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-gym/25 text-gym [&_svg]:size-6">
              <LayoutTemplate aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">מתבנית</div>
              <div className="text-sm text-muted-foreground">כל התבניות הפעילות.</div>
            </div>
          </div>
        </Link>
      </div>

      <SectionHeader title="תבניות מוצעות" />
      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-6">
        {templates.length === 0 ? (
          <EmptyState title="אין תבניות" description="נהל תבניות במסך התבניות." />
        ) : (
          templates.slice(0, 6).map((t) => <TemplateStartTile key={t.id} template={t} onStart={go} />)
        )}
      </div>


      {recent.length > 0 ? (
        <>
          <SectionHeader title="שכפול אימון אחרון" />
          <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-6">
            {recent.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const copy = duplicateSessionAsNew(s.id);
                  if (copy) go(copy.id);
                }}
                className="tile-interactive rounded-xl border border-border-strong bg-surface p-3 text-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{s.name}</div>
                    <TileFootnote>
                      {new Date(s.ended_at ?? s.started_at).toLocaleDateString("he-IL")}
                    </TileFootnote>
                  </div>
                  <Chip tone="info">
                    <Copy aria-hidden className="size-3" /> שכפל
                  </Chip>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-6 px-4 pb-6 sm:px-6">
        <Tile>
          <TileLabel>שים לב</TileLabel>
          <TileFootnote>
            כל הנתונים נשמרים אוטומטית באחסון המקומי. סנכרון לשרת יתווסף בהמשך.
          </TileFootnote>
        </Tile>
      </div>
    </AppShell>
  );
}

function TemplateStartTile({
  template,
  onStart,
}: {
  template: ReturnType<typeof useAllTemplates>[number];
  onStart: (id: string) => void;
}) {
  const exercises = useTemplateExercises(template.id);
  return (
    <button
      type="button"
      onClick={() => {
        const s = startSessionFromTemplate(template.id);
        if (s) onStart(s.id);
      }}
      className="tile-interactive rounded-xl border border-border-strong bg-surface p-3 text-start"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-black">{template.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {exercises.length} תרגילים · v{template.version}
          </div>
        </div>
        <Chip>התחל</Chip>
      </div>
    </button>
  );
}

