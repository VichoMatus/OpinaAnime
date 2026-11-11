import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getTierBadgeClass, getTierBadgeStyle, TIER_CONFIGS } from "@/lib/tier-styles";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

afterEach(cleanup);

describe("SiteHeader y SiteFooter", () => {
  it("renderiza el usuario, badge ADMIN, botón de actualizar catálogo y volver al foro", () => {
    render(
      <SiteHeader
        user={{ id: "u1", name: "Admin Test", email: "admin@test.com", role: "ADMIN" }}
        showBackToForum
      />
    );

    expect(screen.getByText("OpinaAnime")).toBeDefined();
    expect(screen.getByText("Admin Test")).toBeDefined();
    expect(screen.getByText("ADMIN")).toBeDefined();
    expect(screen.getByText("Volver al foro")).toBeDefined();
    expect(screen.getByTitle("Actualizar catálogo de animes")).toBeDefined();
    expect(screen.getByText("Cerrar sesión")).toBeDefined();
  });

  it("oculta controles de admin para usuario normal y renderiza el footer", () => {
    render(
      <>
        <SiteHeader
          user={{ id: "u2", name: "Mika", email: "mika@test.com", role: "USER" }}
        />
        <SiteFooter />
      </>
    );

    expect(screen.getByText("Mika")).toBeDefined();
    expect(screen.queryByText("ADMIN")).toBeNull();
    expect(screen.queryByTitle("Actualizar catálogo de animes")).toBeNull();
    expect(screen.getByText(/Recomendaciones sinceras de anime entre amigos/i)).toBeDefined();
  });

  it("devuelve clases y estilos distintos para cada tier S–E usando tokens --tier-*", () => {
    expect(TIER_CONFIGS).toHaveLength(6);
    for (const cfg of TIER_CONFIGS) {
      const lower = cfg.name.toLowerCase();
      expect(getTierBadgeClass(cfg.name)).toContain(`bg-tier-${lower}`);
      expect(getTierBadgeClass(cfg.name)).toContain("text-tier-fg");
      expect(getTierBadgeStyle(cfg.name)).toEqual({
        backgroundColor: `var(--tier-${lower})`,
        color: "var(--tier-fg)",
        borderColor: `var(--tier-${lower})`,
      });
    }
    expect(getTierBadgeClass(null)).toContain("bg-surface-subtle");
    expect(getTierBadgeStyle(null)).toBeUndefined();
  });
});
