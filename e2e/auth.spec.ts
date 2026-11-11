import { expect, test } from "@playwright/test";

const password = "opina-auth-test-123";
const uniqueEmail = () => `auth-${Date.now()}-${Math.random().toString(36).slice(2)}@opinaanime.test`;

test("registro crea sesión, logout y login permiten ver contraseña", async ({ page }) => {
  const email = uniqueEmail();
  const name = `Auth ${Date.now()}`;
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  await expect(page.getByText(name)).toBeAttached();
  await expect(page.getByRole("button", { name: /cerrar sesión/i })).toBeVisible();

  await page.getByRole("button", { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.waitForLoadState("networkidle");
  const loginPassword = page.locator('input[name="password"]');
  await expect(loginPassword).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(loginPassword).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(loginPassword).toHaveAttribute("type", "password");
  await page.getByLabel("Correo electrónico").fill(email);
  await loginPassword.fill(password);
  await loginPassword.press("Enter");
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: /cerrar sesión/i })).toBeVisible();
});

test("registro duplicado muestra error y no crea sesión", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/registro");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/registro");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/registro$/);
  await expect(page.getByText("Ese correo ya está registrado.", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
