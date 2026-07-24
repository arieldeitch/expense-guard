/**
 * /sessions/$id — מסך מעבר לאימון פעיל.
 * מסך הביצוע המלא ייבנה בשלב הבא; כרגע מציג snapshot של התבנית + פעולות.
 */
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PlayCircle, RotateCcw, XCircle } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { Button } from "@/components/ui/button";
import { cancelSession, useSession } from "@/lib/sessions";

export const Route = createFileRoute("/sessions/$id")({
  head: () => ({
    meta: [
      { title: "אימון פעיל · Fit Log" },
      { name: "description", content: "אימון פעיל שנפתח מתבנית." },
      { property: "og:title", content: "אימון פעיל · Fit Log" },
      { property: "og:description", content: "אימון פעיל." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const session = useSession(id);
  const navigate = useNavigate();

  if (!session) throw notFound();

  const snapshot = session.snapshot;
  const totalExercises = snapshot?.blocks.reduce((n, b) => n + b.exercises.length, 0) ?? 0;

  return (
    <AppShell topBar={{ title: "אימון פעיל", back: { to: "/templates" } }}>
      <PageHeader
        eyebrow="אימון פעיל"
        title={snapshot?.template.name ?? "אימון"}
        description="מסך הביצוע המלא בבנייה. ה־session נשמר כטיוטה — snapshot של המבנה נשמר בעת ההתחלה ולא ייפגע מעריכות עתידיות של התבנית."
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <Tile size="sm">
          <TileLabel>סטטוס</TileLabel>
          <Chip tone={session.status === "in_progress" ? "success" : "default"}>
            {session.status === "in_progress"
              ? "בהתקדמות"
              : session.status === "completed"
                ? "הסתיים"
                : session.status === "cancelled"
                  ? "בוטל"
                  : "מושהה"}
          </Chip>
          <TileFootnote>נפתח: {new Date(session.started_at).toLocaleString("he-IL")}</TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>מבנה ה־snapshot</TileLabel>
          <div className="text-base font-bold">
            {snapshot?.blocks.length ?? 0} בלוקים · {totalExercises} תרגילים
          </div>
          <TileFootnote>נשמר immutable — עריכה של התבנית לא תשפיע על אימון זה.</TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>גרסת התבנית</TileLabel>
          <div className="text-base font-bold">v{session.template_version ?? "—"}</div>
        </Tile>
      </div>

      <div className="mt-6 px-4 sm:px-6">
        <Tile variant="info" tone="soft">
          <TileLabel>
            <PlayCircle aria-hidden className="me-1 inline size-4" />
            מסך ביצוע — בקרוב
          </TileLabel>
          <p className="text-sm">
            מסך הביצוע הפעיל (סטים, טיימר מנוחה, בחירת חלופה, שינוי משקל בזמן אמת) ייבנה בשלב הבא.
            כאן ניתן כרגע לצפות ב־snapshot ולבטל את האימון.
          </p>
        </Tile>
      </div>

      {snapshot ? (
        <section className="mt-4 flex flex-col gap-2 px-4 sm:px-6">
          {snapshot.blocks.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-border-strong bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-tint text-xs font-black">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-bold">
                  {b.display_label ?? b.block_type} · {b.exercises.length} תרגילים
                </span>
                {b.rounds > 1 ? <Chip>{b.rounds}×</Chip> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            cancelSession(session.id);
            navigate({ to: "/templates" });
          }}
          className="min-h-11 rounded-xl border border-border-strong text-destructive"
        >
          <XCircle aria-hidden className="me-1 size-4" />
          ביטול אימון
        </Button>
        <Link
          to="/templates/$id"
          params={{ id: session.template_id ?? "" }}
          className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
        >
          <RotateCcw aria-hidden className="me-1 size-4" />
          חזרה לתבנית
        </Link>
      </div>
    </AppShell>
  );
}
