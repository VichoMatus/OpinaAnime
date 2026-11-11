import { expect, test, type Page } from "@playwright/test";

const password = "opina-community-123";

async function registerAndLogin(page: Page) {
  const email = `community-${Date.now()}-${Math.random().toString(36).slice(2)}@opinaanime.test`;
  const name = `Fan ${Date.now()}`;
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  return name;
}

test("un usuario normal ve el título para recomendar y la categoría Recomendaciones por defecto", async ({ page }) => {
  await registerAndLogin(page);
  await expect(
    page.getByRole("heading", { level: 1, name: "Recomiéndale algo a Vicente Matus y únete al debate" }),
  ).toBeVisible();
  await expect(page.getByText("Ordenadas por más me gusta")).toBeVisible();
  // No quedan emojis decorativos en la home.
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("las recomendaciones exigen un mínimo de caracteres", async ({ page }) => {
  await registerAndLogin(page);
  const res = await page.request.post("/api/recommendations", {
    data: { title: "Prueba corta", imageUrl: "https://example.com/x.jpg", rationale: "Muy bueno" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/al menos 60 caracteres/);
});

test("se puede responder a un comentario dentro del debate", async ({ page }) => {
  await registerAndLogin(page);
  await page.getByRole("link", { name: /entrar al debate/i }).first().click();
  await expect(page).toHaveURL(/\/anime\//);

  // Si el hilo no tiene comentarios, crea uno primero.
  if ((await page.getByRole("button", { name: "Responder", exact: true }).count()) === 0) {
    await page.getByLabel("Suma tu opinión a la conversación").fill("Comentario base para probar respuestas.");
    await page.getByRole("button", { name: "Publicar opinión" }).click();
  }

  await page.getByRole("button", { name: "Responder", exact: true }).first().click();
  const reply = `Respuesta de prueba ${Date.now()}`;
  await page.getByPlaceholder("Escribe tu respuesta...").fill(reply);
  const saved = page.waitForResponse(
    (r) => r.url().includes("/comments") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  expect((await saved).status()).toBe(201);
  await expect(page.getByPlaceholder("Escribe tu respuesta...")).toBeHidden();
  const publishedReply = page.locator("div.border-l-2 article p", { hasText: reply });
  await expect(publishedReply).toBeVisible();

  // La respuesta persiste al recargar y queda anidada (dentro del bloque de respuestas).
  await page.reload();
  await expect(publishedReply).toBeVisible();
});
