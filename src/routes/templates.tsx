/**
 * /templates — רשימת תבניות אימון (אריחים).
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Archive, Layers, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { TemplateTile } from "@/components/templates/TemplateTile";
import {
  createTemplate,
  useAllTemplates,
  useArchivedTemplates,
  useTrashedTemplates,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "תבניות אימון · Fit Log" },
      {
        name: "description",
        content: "תבניות אימון כוח לחדר כושר ולבית — עם סופרסטים, חלופות וגרסאות.",
      },
      { property: "og:title", content: "תבניות אימון · Fit Log" },
      {
        property: "og:description",
        content: "בונה תבניות אימון גמיש: סופרסטים, סטים, מנוחות, חלופות ציוד.",
      },
    ],
  }),
  component: TemplatesPage,
});

type TabKey = "active" | "archived" | "trashed";

function TemplatesPage() {
  const active = useAllTemplates();
  const archived = useArchivedTemplates();
  const trashed = useTrashedTemplates();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("active");

  const list = useMemo(() => {
    if (tab === "archived") return archived;
    if (tab === "trashed") return trashed;
    return active.filter((t) => t.status !== "archived");
  }, [tab, active, archived, trashed]);

  async function handleNew() {
    const t = createTemplate({ name: "תבנית חדשה" });
    await navigate({ to: "/templates/$id/edit", params: { id: t.id } });
  }

  return (
    <AppShell topBar={{ title: "תבניות", back: { to: "/gym" } }}>
      <PageHeader
        eyebrow="חדר כושר · בית"
        title="תבניות אימון"
        description="תבנית = מבנה קבוע לאימון. אפשר להתחיל אימון פעיל מכל תבנית."
        action={
          <Button
            type="button"
            onClick={handleNew}
            className="min-h-11 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus aria-hidden className="me-1 size-4" />
            תבנית חדשה
          </Button>
        }
      />

      <div className="px-4 sm:px-6">
        <div className="inline-flex rounded-xl border border-border-strong bg-surface p-1">
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            פעילות ({active.filter((t) => t.status !== "archived").length})
          </TabButton>
          <TabButton active={tab === "archived"} onClick={() => setTab("archived")}>
            ארכיון ({archived.length})
          </TabButton>
          <TabButton active={tab === "trashed"} onClick={() => setTab("trashed")}>
            סל ({trashed.length})
          </TabButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {list.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={
                tab === "trashed" ? (
                  <Trash2 aria-hidden />
                ) : tab === "archived" ? (
                  <Archive aria-hidden />
                ) : (
                  <Layers aria-hidden />
                )
              }
              title={
                tab === "trashed"
                  ? "סל התבניות ריק"
                  : tab === "archived"
                    ? "אין תבניות בארכיון"
                    : "אין עדיין תבניות פעילות"
              }
              description={
                tab === "active"
                  ? "יוצרים תבנית חדשה, בוחרים מקום ומוסיפים תרגילים. ברירת מחדל 3×12 — אפשר לשנות הכל."
                  : "פריטים שהעברת למצב זה יופיעו כאן."
              }
              action={
                tab === "active" ? (
                  <Button
                    type="button"
                    onClick={handleNew}
                    className="min-h-11 rounded-xl bg-primary text-primary-foreground"
                  >
                    יצירת תבנית ראשונה
                  </Button>
                ) : (
                  <Link
                    to="/gym"
                    className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
                  >
                    חזרה
                  </Link>
                )
              }
            />
          </div>
        ) : (
          list.map((t) => <TemplateTile key={t.id} template={t} />)
        )}
      </div>
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-lg px-3 text-xs font-bold",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
