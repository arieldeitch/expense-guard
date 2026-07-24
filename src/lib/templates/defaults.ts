/**
 * ברירות מחדל למערכת התבניות.
 * שינוי בברירות מחדל אלו נחשב שינוי מוצרי — לתעד ב־decisions.md.
 */
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 12;
/** מנוחה בין סטים ברירת מחדל (שניות). */
export const DEFAULT_REST_SECONDS = 90;
/** מנוחה בין סבבים בסופרסט (שניות). */
export const DEFAULT_SUPERSET_ROUND_REST_SECONDS = 120;
/** מנוחה בין תרגילים בתוך סבב סופרסט. */
export const DEFAULT_INTRA_SUPERSET_REST_SECONDS = 15;

/** זמן ממוצע לביצוע סט (לא כולל מנוחה) — בשניות. משמש להערכת משך. */
export const AVERAGE_SET_EXECUTION_SECONDS = 40;
/** זמן מעבר בין תרגילים (כשלא בסופרסט). */
export const AVERAGE_TRANSITION_BETWEEN_EXERCISES_SECONDS = 30;
