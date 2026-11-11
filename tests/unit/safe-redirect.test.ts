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
    ["/.//evil.com", "https://opinaanime.example//evil.com"],
    ["/foo/../..//evil.com", "https://opinaanime.example//evil.com"],
    ["/./\\evil.com", "https://opinaanime.example//evil.com"],
    ["/a/..//evil.com", "https://opinaanime.example//evil.com"],
    ["/%2e/%2e//evil.com", "https://opinaanime.example//evil.com"],
    ["/.\\/evil.com", "https://opinaanime.example//evil.com"],
    ["/%2F/evil.com", "https://opinaanime.example/%2F/evil.com"],
    ["https://opinaanime.example/account", "https://opinaanime.example/account"],
    ["https://opinaanime.example/account?tab=reviews#recent", "https://opinaanime.example/account?tab=reviews#recent"],
    ["/anime/123", "https://opinaanime.example/anime/123"],
  ])("valida %s", (url, expected) => expect(safeRedirect(url, baseUrl)).toBe(expected));

  it.each(["/", "//evil.com", "/.//evil.com", "/foo/../..//evil.com", "/./\\evil.com", "/a/..//evil.com", "/%2e/%2e//evil.com", "/.\\/evil.com", "https://evil.com", "javascript:alert(1)", "anime/123", "?q=anime", "#top", "https://opinaanime.example/path?x=1#hash"])("siempre conserva el origen para %s", (url) => {
    expect(new URL(safeRedirect(url, baseUrl), baseUrl).origin).toBe(new URL(baseUrl).origin);
  });
});
