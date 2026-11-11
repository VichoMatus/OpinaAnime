import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn(), hash: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique, create: mocks.create } } }));
vi.mock("bcrypt", () => ({ hash: mocks.hash }));

import { POST } from "@/app/api/register/route";

describe("POST /api/register validation", () => {
  beforeEach(() => vi.clearAllMocks());

  async function post(body: Record<string, unknown>) {
    return POST(new Request("http://localhost/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
  }

  it.each(["@", "a@", "x y@z", `${"a".repeat(243)}@example.com`])("rechaza el correo %s", async (email) => {
    const response = await post({ email, password: "password" });
    expect(response.status).toBe(400);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    { email: "valid@example.com", password: "short" },
    { email: "valid@example.com", password: "a".repeat(73) },
    { email: "valid@example.com", password: "password", name: "n".repeat(61) },
  ])("rechaza campos que exceden o no alcanzan sus límites", async (body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
