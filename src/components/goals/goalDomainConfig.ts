/**
 * Domain adapter for goals UI — non-component config (labels וכו').
 * מופרד מ-goalLinks.tsx כדי שקבצי הרכיבים יְיַצאו רכיבים בלבד (react-refresh).
 */
import type { GoalDomain } from "@/lib/goals";

export const GOAL_DOMAIN_LABEL: Record<GoalDomain, string> = {
  running: "ריצה",
  gym: "חדר כושר",
  home: "בית",
};

/** variant של Tile לפי domain (run/gym/home). */
export const GOAL_DOMAIN_TILE_VARIANT: Record<GoalDomain, "run" | "gym" | "home"> = {
  running: "run",
  gym: "gym",
  home: "home",
};
