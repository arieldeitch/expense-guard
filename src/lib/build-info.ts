/**
 * Build identity for the UI (version, commit, target). Values are injected at build time
 * from build-info.ts; in dev/tests they fall back to safe defaults.
 */
export interface BuildInfo {
  version: string;
  versionCode: string;
  commit: string;
  builtAt: string;
  target: "web" | "android";
}

export function getBuildInfo(): BuildInfo {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    version: env.VITE_APP_VERSION ?? "dev",
    versionCode: env.VITE_APP_VERSION_CODE ?? "0",
    commit: env.VITE_GIT_SHA ?? "local",
    builtAt: env.VITE_BUILD_TIME ?? "",
    target: env.VITE_APP_TARGET === "android" ? "android" : "web",
  };
}

/** True inside the Capacitor Android shell (Capacitor injects window.Capacitor). */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
