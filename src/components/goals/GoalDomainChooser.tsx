/**
 * GoalDomainChooser — בחירת תחום קומפקטית (3 אריחים) עבור compatibility routes בלבד.
 * אין כאן רשימת יעדים גלובלית ואין ניהול חוצה-תחומים — רק ניתוב אל אזור התחום.
 */
import { Footprints, Dumbbell, House } from "lucide-react";
import { Tile, TileLabel, TileFootnote } from "@/components/tile/Tile";
import { GoalListLink, GoalNewLink } from "./goalLinks";
import type { GoalDomain } from "@/lib/goals";

const DOMAINS: { domain: GoalDomain; label: string; icon: React.ReactNode; variant: "run" | "gym" | "home" }[] = [
  { domain: "running", label: "ריצה", icon: <Footprints aria-hidden />, variant: "run" },
  { domain: "gym", label: "חדר כושר", icon: <Dumbbell aria-hidden />, variant: "gym" },
  { domain: "home", label: "בית", icon: <House aria-hidden />, variant: "home" },
];

export function GoalDomainChooser({ mode }: { mode: "list" | "new" }) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
      {DOMAINS.map(({ domain, label, icon, variant }) => {
        const inner = (
          <Tile variant={variant} tone="soft" interactive>
            <div className="flex items-center gap-2 [&_svg]:size-5">
              {icon}
              <TileLabel>{label}</TileLabel>
            </div>
            <TileFootnote>{mode === "new" ? "יעד חדש בתחום" : "יעדי התחום"}</TileFootnote>
          </Tile>
        );
        return mode === "new" ? (
          <GoalNewLink key={domain} domain={domain} aria-label={`יעד חדש — ${label}`}>
            {inner}
          </GoalNewLink>
        ) : (
          <GoalListLink key={domain} domain={domain} aria-label={`יעדי ${label}`}>
            {inner}
          </GoalListLink>
        );
      })}
    </div>
  );
}
