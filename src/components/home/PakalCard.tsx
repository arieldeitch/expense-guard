/**
 * PakalCard — the home-screen entry to one of the two fixed routines (ADR-0045).
 * Shows today's state at a glance ("דווח היום · 120 חזרות" / "טרם דווח"), so one tap either
 * starts the report or resumes it for a correction.
 */
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sun, Moon, ChevronLeft } from "lucide-react";
import { Tile, TileFootnote } from "@/components/tile/Tile";
import { useHydrated } from "@/lib/storage/useHydrated";
import {
  PAKAL_DEFINITIONS,
  ensurePakalTemplate,
  findOpenPakalSession,
  getHomeTemplate,
  pakalTemplateEntries,
  pakalTotal,
  type PakalSlot,
} from "@/lib/home";
import { useHomeSessions, useHomeTemplates } from "@/lib/home";

export function PakalCard({ slot }: { slot: PakalSlot }) {
  const hydrated = useHydrated();
  // Subscribing keeps the card fresh after a report is saved or the routine is renamed.
  useHomeSessions();
  useHomeTemplates();
  const def = PAKAL_DEFINITIONS[slot];
  // Seeding writes to the store, so it belongs in an effect — never during render.
  useEffect(() => {
    if (hydrated) ensurePakalTemplate(slot);
  }, [hydrated, slot]);
  const template = hydrated ? getHomeTemplate(PAKAL_DEFINITIONS[slot].templateId) : null;
  const todays = hydrated ? findOpenPakalSession(slot) : null;
  const exerciseCount = hydrated ? pakalTemplateEntries(slot).length : 0;
  const total = hydrated && todays ? pakalTotal(todays.id) : 0;
  const Icon = slot === "morning" ? Sun : Moon;

  return (
    <Link to="/home/pakal/$slot" params={{ slot }} className="block">
      <Tile variant="home" tone={todays ? "soft" : "solid"} size="md" interactive>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Icon aria-hidden className="size-4 shrink-0" />
            <div className="truncate text-sm font-black">{template?.name ?? def.defaultName}</div>
          </div>
          <ChevronLeft aria-hidden className="size-4 shrink-0 opacity-70" />
        </div>
        <TileFootnote className={todays ? undefined : "text-home-foreground/80"}>
          {!hydrated
            ? " "
            : todays
              ? `דווח היום · ${total} חזרות`
              : `${exerciseCount} תרגילים · טרם דווח היום`}
        </TileFootnote>
      </Tile>
    </Link>
  );
}
