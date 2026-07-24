/**
 * Alternatives service — מדרג תרגילים חלופיים לתרגיל נתון.
 *
 * הדירוג משקלל:
 *  - קבוצת שריר ראשית זהה (משקל 5)
 *  - חפיפה בקבוצות משניות (משקל 1 לכל חפיפה)
 *  - דפוס תנועה זהה (משקל 3)
 *  - סוג מעקב זהה (משקל 2)
 *  - זמינות ציוד במקום נבחר (משקל 4; unavailable → -3)
 *  - רמת קושי דומה (משקל 1)
 *  - מועדף (משקל 1)
 *  - קטגוריה זהה (משקל 1)
 *
 * ה־service דטרמיניסטי — לא מבצע החלפה, רק מציג הצעות.
 */
import type { EquipmentItem } from "@/lib/catalog";
import type { AlternativeScore, Exercise } from "./types";
import { getExerciseAvailability, type LocationEquipmentSnapshot } from "./availability";

export interface FindAlternativesOptions {
  candidatePool: Exercise[];
  snapshot: LocationEquipmentSnapshot | null;
  /** תרגילים ש־המשתמש הפעיל עליהם archive/trash — לא יופיעו. */
  excludeIds?: string[];
  /** תרגילים מועדפים — קבל bonus. */
  favoriteIds?: string[];
  /** מקסימום הצעות. */
  limit?: number;
}

export function findAlternatives(
  target: Exercise,
  options: FindAlternativesOptions,
): AlternativeScore[] {
  const { candidatePool, snapshot, excludeIds = [], favoriteIds = [], limit = 6 } = options;
  const excludeSet = new Set([target.id, ...excludeIds]);
  const favoriteSet = new Set(favoriteIds);

  const scored: AlternativeScore[] = [];

  for (const candidate of candidatePool) {
    if (excludeSet.has(candidate.id)) continue;
    if (candidate.deleted_at !== null) continue;
    if (!candidate.is_active) continue;

    const availability = getExerciseAvailability(candidate, snapshot);
    const reasons: string[] = [];
    let score = 0;

    if (candidate.primary_muscle_group_id === target.primary_muscle_group_id) {
      score += 5;
      reasons.push("קבוצת שריר ראשית זהה");
    } else if (target.secondary_muscle_group_ids.includes(candidate.primary_muscle_group_id)) {
      score += 2;
      reasons.push("קבוצת שריר משנית זהה");
    } else {
      // No primary overlap — skip unless secondary overlap exists.
      const overlap = candidate.secondary_muscle_group_ids.filter((id) =>
        target.secondary_muscle_group_ids.includes(id) || id === target.primary_muscle_group_id,
      );
      if (overlap.length === 0) continue;
    }

    const secondaryOverlap = candidate.secondary_muscle_group_ids.filter((id) =>
      target.secondary_muscle_group_ids.includes(id),
    ).length;
    if (secondaryOverlap > 0) {
      score += secondaryOverlap;
      reasons.push(`${secondaryOverlap} קבוצות משניות משותפות`);
    }

    if (candidate.movement_pattern === target.movement_pattern) {
      score += 3;
      reasons.push("דפוס תנועה זהה");
    }

    if (candidate.tracking_type === target.tracking_type) {
      score += 2;
    }

    if (availability.status === "available") {
      score += 4;
      reasons.push("כל הציוד זמין");
    } else if (availability.status === "partial") {
      score += 2;
      reasons.push("ציוד עיקרי זמין");
    } else if (availability.status === "unavailable") {
      score -= 3;
      reasons.push("ציוד נדרש חסר");
    }

    if (candidate.difficulty === target.difficulty) {
      score += 1;
    }
    if (candidate.category === target.category) {
      score += 1;
    }
    if (favoriteSet.has(candidate.id)) {
      score += 1;
      reasons.push("מועדף");
    }

    scored.push({ exercise: candidate, score, reasons, availability });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** נוחות: מרשם מלא במקום נבחר. */
export function equipmentSnapshotFromItems(
  locationId: string,
  items: EquipmentItem[],
): LocationEquipmentSnapshot {
  return { locationId, items };
}
