import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // ברירת מחדל node לכל בדיקות הלוגיקה/repo; בדיקות render מצהירות
    // `// @vitest-environment jsdom` ברמת הקובץ (לא משנה את בדיקות ה-node).
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
  },
});
