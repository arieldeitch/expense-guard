/**
 * Supabase session — email + password only.
 *
 * Phase 1 deliberately has no social providers, no magic links, no admin
 * surface. Everything here is optional: if Supabase is not configured, or the
 * user never signs in, the app keeps running entirely on localStorage exactly
 * as before. Nothing in this module reads or writes any `fitlog:*` key.
 *
 * The Supabase client is imported lazily so that merely importing this module
 * never constructs a client and never touches the network — that matters for
 * SSR and for the local-only fallback path.
 */
import type { Session, User } from "@supabase/supabase-js";

export type AuthState =
  /** Supabase env vars are absent — the app is local-only by configuration. */
  | { kind: "unconfigured" }
  /** Configured, but nobody is signed in. */
  | { kind: "signed_out" }
  | { kind: "signed_in"; userId: string; email: string | null };

export interface AuthResult {
  ok: boolean;
  /** Hebrew, user-facing. Null when ok. */
  error: string | null;
  userId: string | null;
}

/**
 * True when both public Supabase variables are present at build time.
 * Reading `import.meta.env` is safe on the server and in tests.
 */
export function isSupabaseConfigured(): boolean {
  const env = import.meta.env as Record<string, string | undefined>;
  return Boolean(env["VITE_SUPABASE_URL"] && env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
}

async function client() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

/** Maps Supabase auth errors to short Hebrew copy. Never leaks a token. */
function toHebrewError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "אימייל או סיסמה שגויים.";
  if (m.includes("email not confirmed")) return "האימייל טרם אומת. בדוק את תיבת הדואר.";
  if (m.includes("user already registered")) return "האימייל הזה כבר רשום. נסה להתחבר.";
  if (m.includes("password")) return "הסיסמה אינה עומדת בדרישות (לפחות 6 תווים).";
  if (m.includes("network") || m.includes("fetch")) return "אין חיבור לשרת. האפליקציה ממשיכה לעבוד מקומית.";
  return "ההתחברות נכשלה. האפליקציה ממשיכה לעבוד מקומית.";
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await client();
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch {
    // Offline / misconfigured — treated as signed out, never as an app failure.
    return null;
  }
}

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { kind: "unconfigured" };
  const session = await getSession();
  if (!session?.user) return { kind: "signed_out" };
  return { kind: "signed_in", userId: session.user.id, email: session.user.email ?? null };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase אינו מוגדר. האפליקציה עובדת מקומית בלבד.", userId: null };
  }
  try {
    const supabase = await client();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: toHebrewError(error.message), userId: null };
    const userId = data.user?.id ?? null;
    if (userId) await ensureProfile();
    return { ok: true, error: null, userId };
  } catch {
    return { ok: false, error: "אין חיבור לשרת. האפליקציה ממשיכה לעבוד מקומית.", userId: null };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase אינו מוגדר. האפליקציה עובדת מקומית בלבד.", userId: null };
  }
  try {
    const supabase = await client();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: toHebrewError(error.message), userId: null };
    const userId = data.user?.id ?? null;
    if (userId) await ensureProfile();
    return { ok: true, error: null, userId };
  } catch {
    return { ok: false, error: "אין חיבור לשרת. האפליקציה ממשיכה לעבוד מקומית.", userId: null };
  }
}

/**
 * Signs out of Supabase. Local `fitlog:*` data is untouched — signing out
 * returns the app to local-only mode, it does not discard anything.
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await client();
    await supabase.auth.signOut();
  } catch {
    // Already effectively signed out from the app's point of view.
  }
}

/**
 * Idempotent. Replaces the usual `after insert on auth.users` trigger, which
 * this project does not use because modifying auth.users is forbidden.
 */
export async function ensureProfile(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { phase1Client, upsertProfile } = await import("./tables");
    const supabase = await phase1Client();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return false;
    const { error } = await upsertProfile(supabase, { id: userId });
    return error === null;
  } catch {
    return false;
  }
}
