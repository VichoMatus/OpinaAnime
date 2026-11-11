import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

afterEach(cleanup);

describe("SiteHeader y SiteFooter", () => {
  it("renderiza el usuario, badge ADMIN, botón de sincronizar catálogo y volver al foro", () => {
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
    expect(screen.getByTitle("Sincronizar catálogo con Kitsu API")).toBeDefined();
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
    expect(screen.queryByTitle("Sincronizar catálogo con Kitsu API")).toBeNull();
    expect(screen.getByText(/Recomendaciones sinceras de anime entre amigos/i)).toBeDefined();
  });
});
