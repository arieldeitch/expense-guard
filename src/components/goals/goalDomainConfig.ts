/**
 * Domain adapter for goals UI — non-component config (labels וכו').
 * מופרד מ-goalLinks.tsx כדי שקבצי הרכיבים יְיַצאו רכיבים בלבד (react-refresh).
 */
import type { Goal, GoalDomain } from "@/lib/goals";

/**
 * אכיפת domain isolation ברמת view/form: יעד מוצג/נערך רק במסלול של התחום שלו.
 * pure — ניתן לבדיקה בלי render. מקור האמת ל-domain הוא הישות עצמה, לא ה-route/param.
 */
export function goalMatchesDomain(
  goal: Pick<Goal, "domain"> | null | undefined,
  domain: GoalDomain,
): boolean {
  return goal != null && goal.domain === domain;
}

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
