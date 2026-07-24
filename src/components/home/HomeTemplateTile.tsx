/**
 * HomeTemplateTile — אריח לתבנית ביתית.
 */
import { Link } from "@tanstack/react-router";
import { Star, Play, MoreHorizontal, Copy, Archive, Trash2, Edit2 } from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow } from "@/components/catalog/shared";
import type { HomeTemplate } from "@/lib/home";
import {
  archiveHomeTemplate,
  duplicateHomeTemplate,
  toggleFavoriteTemplate,
  trashHomeTemplate,
} from "@/lib/home";
import { cn } from "@/lib/utils";

interface Props {
  template: HomeTemplate;
  entriesCount: number;
  onStart: () => void;
}

export function HomeTemplateTile({ template, entriesCount, onStart }: Props) {
  return (
    <Tile variant="home" tone="soft">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/home/templates/$id"
          params={{ id: template.id }}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-1.5">
            {template.is_favorite ? (
              <Star aria-hidden className="size-3.5 fill-goal text-goal" />
            ) : null}
            <TileLabel>{template.rounds > 1 ? `${template.rounds} סבבים` : "אימון"}</TileLabel>
          </div>
          <div className="truncate text-base font-black">{template.name}</div>
        </Link>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="פעולות תבנית"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-tint text-muted-foreground"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <ActionRow
              icon={<Star aria-hidden />}
              onClick={() => toggleFavoriteTemplate(template.id)}
            >
              {template.is_favorite ? "בטל מועדף" : "סמן כמועדף"}
            </ActionRow>
            <ActionRow
              icon={<Edit2 aria-hidden />}
              onClick={() => {
                window.location.href = `/home/templates/${template.id}/edit`;
              }}
            >
              עריכה
            </ActionRow>
            <ActionRow
              icon={<Copy aria-hidden />}
              onClick={() => {
                duplicateHomeTemplate(template.id);
              }}
            >
              שכפול
            </ActionRow>
            <ActionRow
              icon={<Archive aria-hidden />}
              onClick={() => archiveHomeTemplate(template.id)}
            >
              ארכיון
            </ActionRow>
            <ActionRow
              icon={<Trash2 aria-hidden />}
              onClick={() => trashHomeTemplate(template.id)}
              tone="destructive"
            >
              לסל מחזור
            </ActionRow>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <TileFootnote className={cn(entriesCount === 0 && "text-warning")}>
          {entriesCount} תרגיל{entriesCount === 1 ? "" : "ים"}
          {template.usage_count > 0 ? ` · ${template.usage_count} הפעלות` : ""}
        </TileFootnote>
        <button
          type="button"
          onClick={onStart}
          disabled={entriesCount === 0}
          className={cn(
            "inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-black",
            entriesCount === 0
              ? "bg-muted text-muted-foreground opacity-60"
              : "bg-home text-white active:scale-95",
          )}
        >
          <Play className="size-4" aria-hidden />
          התחל
        </button>
      </div>
    </Tile>
  );
}
