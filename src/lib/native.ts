/**
 * Native (Capacitor Android) integration — loaded only inside the app shell (ADR-0043).
 *
 * - Android Back: goes back in the in-app history when there is somewhere to go back to,
 *   otherwise minimises the app (never exits abruptly, never leaves a blank WebView).
 * - Nothing else: no permissions, no background work, no network. The web build never calls this.
 */
import { isNativeApp } from "./build-info";

let installed = false;

export async function installNativeBridges(): Promise<void> {
  if (installed || !isNativeApp()) return;
  installed = true;
  const { App } = await import("@capacitor/app");
  // `canGoBack` comes from the native WebView history — the same history the router pushes to.
  await App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });
  document.documentElement.dataset.platform = "android";
}

/**
 * Save a backup file. On the web this is a plain download; inside the Android shell the WebView
 * has no download manager, so the JSON is written to the app's private cache and handed to the
 * Android share sheet (Drive / Files / WhatsApp…). No storage permission is needed for either.
 */
export async function saveBackupFile(name: string, json: string): Promise<"download" | "share"> {
  if (!isNativeApp()) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return "download";
  }
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const written = await Filesystem.writeFile({
    path: name,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({ title: name, files: [written.uri], dialogTitle: "שמירת קובץ הגיבוי" });
  return "share";
}
