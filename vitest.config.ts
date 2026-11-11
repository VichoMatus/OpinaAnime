import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  // tsconfig usa "jsx": "preserve" (lo exige Next); para los tests transformamos JSX con el runtime automático de React.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**", "playwright-report/**", "test-results/**"],
  },
});
