import { defineConfig } from "@playwright/test";

// Puerto configurable: por defecto 3000 (README). Si el 3000 está ocupado por otra app,
// usa E2E_PORT (p. ej. E2E_PORT=3100), porque reuseExistingServer reutilizaría lo que haya en ese puerto.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    // NextAuth necesita que NEXTAUTH_URL coincida con el puerto real (las variables del proceso tienen prioridad sobre .env*).
    env: { NEXTAUTH_URL: baseURL },
  },
});
