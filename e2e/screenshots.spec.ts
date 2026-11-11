import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Capturas de página completa para comparar el antes/después del rediseño.
// Requiere: Postgres local + `npm run db:push` + `npm run db:seed:e2e`.
// Salida: SHOT_DIR (por defecto docs/opinaanime-redesign/screenshots/after), archivo <proyecto>-<página>.png
const SHOT_DIR = process.env.SHOT_DIR ?? "docs/opinaanime-redesign/screenshots/after";
const E2E_EMAIL = "e2e@opinaanime.test";
const E2E_PASSWORD = "e2e-password-123";
const DETAIL_MAL_ID = 52991; // "Sousou no Frieren", sembrado por scripts/seed-e2e.mjs

let detailId: string;

test.beforeAll(async () => {
  mkdirSync(SHOT_DIR, { recursive: true });
  // @prisma/client carga .env (remoto) al importarse: primero cargamos .env.local y validamos que la BD sea local.
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const host = new URL(process.env.POSTGRES_PRISMA_URL ?? "postgresql://missing").hostname;
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    throw new Error(`POSTGRES_PRISMA_URL apunta a ${host}; las capturas E2E solo usan la BD local.`);
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const rec = await prisma.recommendation.findUnique({ where: { mal_id: DETAIL_MAL_ID }, select: { id: true } });
    if (!rec) throw new Error("No hay datos sembrados: ejecuta `npm run db:seed:e2e`.");
    detailId = rec.id;
  } finally {
    await prisma.$disconnect();
  }
});

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Recorre la página para disparar imágenes lazy y espera a que todas terminen de cargar.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
  });
  await page.waitForLoadState("networkidle");
}

async function shot(page: Page, name: string) {
  await settle(page);
  const file = path.join(SHOT_DIR, `${test.info().project.name}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(E2E_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.locator('input[name="password"]').press("Enter");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 60_000 });
}

test.describe("capturas sin sesión", () => {
  test("login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await shot(page, "login");
  });

  test("registro", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await shot(page, "registro");
  });
});

test.describe("capturas con sesión", () => {
  test("home y detalle", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Sousou no Frieren").first()).toBeVisible();
    await shot(page, "home");

    await page.goto(`/anime/${detailId}`);
    await expect(page.getByText("Sousou no Frieren").first()).toBeVisible();
    await shot(page, "detalle");
  });
});
