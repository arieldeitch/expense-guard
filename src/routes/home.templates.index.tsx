/**
 * /home/templates — רשימת תבניות ביתיות.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LayoutTemplate, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { HomeTemplateTile } from "@/components/home/HomeTemplateTile";
import {
  createHomeTemplate,
  listHomeTemplateEntries,
  startSessionFromTemplate,
  useHomeTemplates,
} from "@/lib/home";

export const Route = createFileRoute("/home/templates/")({
  head: () => ({
    meta: [
      { title: "תבניות בית · Fit Log" },
      { name: "description", content: "ניהול תבניות אימוני בית." },
      { property: "og:title", content: "תבניות בית · Fit Log" },
      { property: "og:description", content: "ניהול תבניות אימוני בית." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const templates = useHomeTemplates();
  const navigate = useNavigate();
  const active = templates.filter((t) => t.status === "active");
  const archived = templates.filter((t) => t.status === "archived");

  const createNew = () => {
    const tpl = createHomeTemplate({ name: "תבנית חדשה" });
    navigate({ to: "/home/templates/$id/edit", params: { id: tpl.id } });
  };

  return (
    <AppShell
      topBar={{
        title: "תבניות בית",
        back: { to: "/home" },
        action: (
          <button
            type="button"
            onClick={createNew}
            aria-label="תבנית חדשה"
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-home text-white"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        ),
      }}
    >
      <PageHeader
        eyebrow="בית"
        title="תבניות"
        description="שילוב תרגילים לשימוש חוזר. שמירה אוטומטית."
      />

      <div className="space-y-2 px-4 sm:px-6">
        {active.length ? (
          active.map((t) => (
            <HomeTemplateTile
              key={t.id}
              template={t}
              entriesCount={listHomeTemplateEntries(t.id).length}
              onStart={() => {
                const session = startSessionFromTemplate(t.id);
                if (session) {
                  navigate({ to: "/home/sessions/$id", params: { id: session.id } });
                }
              }}
            />
          ))
        ) : (
          <EmptyState
            icon={<LayoutTemplate aria-hidden />}
            title="אין תבניות פעילות"
            description="בנה תבנית של תרגילי בית לשימוש חוזר."
            action={
              <button
                type="button"
                onClick={createNew}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
              >
                <Plus className="size-4" aria-hidden />
                תבנית חדשה
              </button>
            }
          />
        )}
      </div>

      {archived.length > 0 ? (
        <>
          <SectionHeader title="בארכיון" />
          <div className="space-y-2 px-4 sm:px-6">
            {archived.map((t) => (
              <HomeTemplateTile
                key={t.id}
                template={t}
                entriesCount={listHomeTemplateEntries(t.id).length}
                onStart={() => {
                  const session = startSessionFromTemplate(t.id);
                  if (session) {
                    navigate({ to: "/home/sessions/$id", params: { id: session.id } });
                  }
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
