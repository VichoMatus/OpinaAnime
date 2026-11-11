import { describe, expect, it } from "vitest";
import { safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  const baseUrl = "https://opinaanime.example";
  it.each([
    ["//evil.com", baseUrl],
    ["/\\evil.com", baseUrl],
    ["/\t/evil.com", baseUrl],
    ["/\n/evil.com", baseUrl],
    ["/\r/evil.com", baseUrl],
    ["/\t\\evil.com", baseUrl],
    ["https://x.vercel.app", baseUrl],
    ["javascript:alert(1)", baseUrl],
    ["https://evil.com@host", baseUrl],
    ["/%2F/evil.com", "/%2F/evil.com"],
    ["https://opinaanime.example/account", "https://opinaanime.example/account"],
    ["https://opinaanime.example/account?tab=reviews#recent", "https://opinaanime.example/account?tab=reviews#recent"],
    ["/anime/123", "/anime/123"],
  ])("valida %s", (url, expected) => expect(safeRedirect(url, baseUrl)).toBe(expected));
});
