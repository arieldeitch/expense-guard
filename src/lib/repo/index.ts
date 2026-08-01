/**
 * Repository entrypoint — מחזיר את ה־active repository.
 *
 * `activeRepo` / `activeRepoKind` נשארים בדיוק כפי שהיו, כך שכל קורא קיים
 * והמסלול המקומי מתנהגים ללא שינוי. בחירת הענן היא opt-in דרך
 * `resolveRepository()`, שנופל חזרה ל-repo המקומי בכל מקרה של Supabase לא
 * מוגדר, משתמש לא מחובר, או תקלה.
 */
import { mockRepository } from "./mock";
import { createSupabaseRepository } from "./supabase";
import { getAuthState, isSupabaseConfigured } from "@/lib/supabase/session";
import type { Repository, RepoKind } from "./types";

/** ה-repo המקומי. ללא שינוי, ועדיין ברירת המחדל. */
export const activeRepo: Repository = mockRepository;
export const activeRepoKind: RepoKind = "mock";

export interface ResolvedRepository {
  repo: Repository;
  kind: RepoKind;
  /** למה נבחר ה-repo הזה — נחשף ב-UI, שימושי בבדיקות. */
  reason: "not_configured" | "signed_out" | "signed_in" | "error";
}

/**
 * בוחר את repo הענן **רק** כאשר Supabase מוגדר **וגם** יש משתמש מחובר.
 * כל מצב אחר — כולל חריגה — מחזיר את ה-repo המקומי.
 */
export async function resolveRepository(): Promise<ResolvedRepository> {
  if (!isSupabaseConfigured()) {
    return { repo: mockRepository, kind: "mock", reason: "not_configured" };
  }
  try {
    const state = await getAuthState();
    if (state.kind !== "signed_in") {
      return { repo: mockRepository, kind: "mock", reason: "signed_out" };
    }
    return { repo: createSupabaseRepository(), kind: "supabase", reason: "signed_in" };
  } catch {
    return { repo: mockRepository, kind: "mock", reason: "error" };
  }
}

export * from "./types";
export { createInMemoryRepo } from "./mock";
export { createSupabaseRepository } from "./supabase";
