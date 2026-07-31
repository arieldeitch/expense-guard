/**
 * /templates/$id/history — היסטוריית גרסאות של תבנית.
 * מציג רשימה של snapshots שנשמרו + סיכום בסיסי לכל אחד.
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useHydrated } from "@/lib/storage/useHydrated";
import { History } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { useTemplate, useTemplateVersions } from "@/lib/templates";

export const Route = createFileRoute("/templates/$id/history")({
  head: () => ({
    meta: [
      { title: "היסטוריית גרסאות · Fit Log" },
      { name: "description", content: "גרסאות שמורות של תבנית אימון." },
      { property: "og:title", content: "היסטוריית גרסאות · Fit Log" },
      { property: "og:description", content: "השוואה בין גרסאות של תבנית." },
    ],
  }),
  component: TemplateHistoryPage,
});

function TemplateHistoryPage() {
  const { id } = Route.useParams();
  const template = useTemplate(id);
  const versions = useTemplateVersions(id);

  const hydrated = useHydrated();
  // ראה ADR-0039 — אין לזרוק notFound() ב-render של השרת (אין שם localStorage).
  if (!hydrated) return null;
  if (!template) throw notFound();

  return (
    <AppShell topBar={{ title: "גרסאות", back: { to: `/templates/${template.id}` } }}>
      <PageHeader
        eyebrow={template.name}
        title="היסטוריית גרסאות"
        description="כל גרסה שומרת snapshot מלא של התבנית באותה נקודת זמן. אימונים היסטוריים אינם מושפעים מעריכות עתידיות."
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:px-6">
        {versions.length === 0 ? (
          <EmptyState
            icon={<History aria-hidden />}
            title="אין גרסאות שמורות"
            description="לחיצה על 'שמור גרסה' בעריכה תיצור snapshot של המצב הנוכחי."
          />
        ) : (
          versions.map((v) => (
            <Tile key={v.id} size="sm">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-tint font-black">
                  v{v.version}
                </span>
                <div className="min-w-0">
                  <TileLabel>{new Date(v.created_at).toLocaleString("he-IL")}</TileLabel>
                  <div className="text-sm font-bold">
                    {v.snapshot.blocks.length} בלוקים ·{" "}
                    {v.snapshot.blocks.reduce((n, b) => n + b.exercises.length, 0)} תרגילים
                  </div>
                  {v.reason ? <TileFootnote>{v.reason}</TileFootnote> : null}
                </div>
                <Chip tone="info">snapshot</Chip>
              </div>
            </Tile>
          ))
        )}
      </div>
    </AppShell>
  );
}
