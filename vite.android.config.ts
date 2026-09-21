// Android (Capacitor) build — the same app, built as a static SPA shell instead of the SSR/nitro
// bundle used by the web. Source of truth stays `src/`; only the packaging differs (ADR-0043).
//   bun run build:android:web  →  dist-android/client (index.html + assets)
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { buildInfoDefine } from "./build-info";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Client-only shell: no server rendering inside the WebView, no server functions.
    spa: {
      enabled: true,
      maskPath: "/",
      prerender: {
        enabled: true,
        outputPath: "/index",
        autoSubfolderIndex: false,
        crawlLinks: false,
        retryCount: 0,
      },
    },
  },
  // No nitro server bundle: TanStack Start builds the client + a build-time server used only to
  // prerender the SPA shell (dist-android/client/index.html).
  nitro: false,
  vite: {
    build: { outDir: "dist-android" },
    define: buildInfoDefine("android"),
  },
});
