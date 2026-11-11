import { describe, expect, it } from "vitest";
import { RATIONALE_MAX, RATIONALE_MIN, isAnimeStatus, validateRationale } from "@/lib/community";

describe("validateRationale", () => {
  it("rechaza motivos cortos e indica cuántos caracteres lleva", () => {
    expect(validateRationale("Muy bueno")).toMatch(/al menos 60 caracteres \(llevas 9\)/);
  });
  it("ignora espacios al contar", () => {
    expect(validateRationale(`   ${"a".repeat(RATIONALE_MIN - 1)}   `)).not.toBeNull();
  });
  it("acepta motivos en el rango", () => {
    expect(validateRationale("a".repeat(RATIONALE_MIN))).toBeNull();
    expect(validateRationale("a".repeat(RATIONALE_MAX))).toBeNull();
  });
  it("rechaza motivos demasiado largos", () => {
    expect(validateRationale("a".repeat(RATIONALE_MAX + 1))).toMatch(/demasiado largo/);
  });
});

describe("isAnimeStatus", () => {
  it("acepta la nueva categoría RECOMMENDED y rechaza valores desconocidos", () => {
    expect(isAnimeStatus("RECOMMENDED")).toBe(true);
    expect(isAnimeStatus("PENDING")).toBe(true);
    expect(isAnimeStatus("OTRA")).toBe(false);
  });
});
