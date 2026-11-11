import { describe, expect, it } from "vitest";
import { safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  const baseUrl = "https://opinaanime.example";
  it.each([
    ["//evil.com", baseUrl],
    ["/\\evil.com", baseUrl],
    ["https://x.vercel.app", baseUrl],
    ["https://opinaanime.example/account", "https://opinaanime.example/account"],
    ["/anime/123", "/anime/123"],
  ])("valida %s", (url, expected) => expect(safeRedirect(url, baseUrl)).toBe(expected));
});
