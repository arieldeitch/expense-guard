/**
 * Account tile — email + password sign-in, and the one-time goal upload.
 *
 * Deliberately the whole Phase 1 auth surface: no dedicated route, no guard, no
 * admin screen. The app is fully usable without ever touching this tile; it is
 * additive, never a gate.
 *
 * Nothing here deletes or rewrites local data. Signing out returns the app to
 * local-only mode and leaves every `fitlog:*` key exactly as it was.
 */
import { useCallback, useEffect, useState } from "react";
import { CloudOff, CloudUpload, LogOut, UserRound } from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { useHydrated } from "@/lib/storage/useHydrated";
import {
  getAuthState,
  isSupabaseConfigured,
  signIn,
  signOut,
  signUp,
  type AuthState,
} from "@/lib/supabase/session";
import { GOALS_SYNC_MODULE, readSyncStateFor, runOneTimeGoalUpload, type SyncStatus } from "@/lib/sync";

const STATUS_LABEL: Record<SyncStatus, string> = {
  local_only: "מקומי בלבד",
  not_synced: "טרם הועלה",
  synced: "הועלה בהצלחה",
  partial: "הועלה חלקית",
  failed: "ההעלאה נכשלה",
};

export function AccountTile() {
  const hydrated = useHydrated();
  const [auth, setAuth] = useState<AuthState>({ kind: "signed_out" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local_only");

  const refresh = useCallback(async () => {
    const state = await getAuthState();
    setAuth(state);
    if (state.kind === "signed_in") {
      const sync = readSyncStateFor(state.userId);
      setSyncStatus(sync.status);
    } else {
      setSyncStatus("local_only");
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  if (!hydrated) return null;

  if (!isSupabaseConfigured() || auth.kind === "unconfigured") {
    return (
      <Tile>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
            <CloudOff aria-hidden />
          </span>
          <div className="min-w-0">
            <TileLabel>חשבון</TileLabel>
            <div className="truncate text-sm font-bold">מקומי בלבד</div>
            <TileFootnote>הנתונים נשמרים במכשיר הזה. אין חיבור ענן מוגדר.</TileFootnote>
          </div>
        </div>
      </Tile>
    );
  }

  const submit = async (mode: "in" | "up") => {
    setBusy(true);
    setMessage(null);
    const result = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPassword("");
    setMessage(mode === "up" ? "נרשמת. ייתכן שנדרש אימות אימייל." : null);
    await refresh();
  };

  const upload = async () => {
    setBusy(true);
    setMessage(null);
    const outcome = await runOneTimeGoalUpload();
    setBusy(false);
    if (outcome.reason === "nothing_to_upload") setMessage("אין יעדים חדשים להעלאה.");
    else if (outcome.reason === "uploaded") setMessage(`הועלו ${outcome.result?.written ?? 0} יעדים.`);
    else if (outcome.reason === "failed") setMessage("ההעלאה נכשלה. הנתונים המקומיים לא נפגעו.");
    await refresh();
  };

  return (
    <Tile>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
          <UserRound aria-hidden />
        </span>
        <div className="min-w-0 space-y-3">
          <div>
            <TileLabel>חשבון</TileLabel>
            <div className="truncate text-sm font-bold">
              {auth.kind === "signed_in" ? (auth.email ?? "מחובר") : "לא מחובר"}
            </div>
            <TileFootnote>
              {auth.kind === "signed_in"
                ? `סטטוס סנכרון: ${STATUS_LABEL[syncStatus]}. הנתונים המקומיים נשמרים כמו שהם.`
                : "התחברות היא רשות. בלעדיה האפליקציה עובדת מקומית במלואה."}
            </TileFootnote>
          </div>

          {auth.kind === "signed_in" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void upload()}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-tint px-3 text-sm font-bold disabled:opacity-60"
              >
                <CloudUpload aria-hidden className="size-4" />
                העלה יעדים לענן
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await signOut();
                  await refresh();
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong px-3 text-sm font-bold disabled:opacity-60"
              >
                <LogOut aria-hidden className="size-4" />
                התנתק
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block">
                <span className="sr-only">אימייל</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="אימייל"
                  className="min-h-11 w-full rounded-xl border border-border-strong bg-background px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="sr-only">סיסמה</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמה"
                  className="min-h-11 w-full rounded-xl border border-border-strong bg-background px-3 text-sm"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !email || !password}
                  onClick={() => void submit("in")}
                  className="inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-tint px-3 text-sm font-bold disabled:opacity-60"
                >
                  התחבר
                </button>
                <button
                  type="button"
                  disabled={busy || !email || !password}
                  onClick={() => void submit("up")}
                  className="inline-flex min-h-11 items-center rounded-xl border border-border-strong px-3 text-sm font-bold disabled:opacity-60"
                >
                  הרשמה
                </button>
              </div>
            </div>
          )}

          {message ? <p className="text-xs font-bold text-muted-foreground">{message}</p> : null}
        </div>
      </div>
    </Tile>
  );
}
