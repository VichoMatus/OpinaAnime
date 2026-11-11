import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "@/components/login-form";
import RegisterForm from "@/components/register-form";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), signIn: vi.fn(), registered: "" }));
vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(mocks.registered ? "registered=1" : ""),
}));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.registered = ""; });

describe("register-form", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });

  it("crea la sesión con las mismas credenciales y va a inicio", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: "1" }) } as Response);
    mocks.signIn.mockResolvedValue({ ok: true });
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nami" } });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "nami@example.com" } });
    fireEvent.change(document.querySelector('input[name="password"]')!, { target: { value: "password-123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form")!);
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith("credentials", { email: "nami@example.com", password: "password-123", redirect: false }));
    expect(mocks.push).toHaveBeenCalledWith("/");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("muestra error, conserva nombre/email y vacía solo contraseña", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: "Ese correo ya está registrado." }) } as Response);
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nami" } });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "nami@example.com" } });
    fireEvent.change(document.querySelector('input[name="password"]')!, { target: { value: "password-123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toContain("Ese correo");
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Nami");
    expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("nami@example.com");
    expect((document.querySelector('input[name="password"]') as HTMLInputElement).value).toBe("");
  });

  it("redirige a login si falla el inicio de sesión automático", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: "1" }) } as Response);
    mocks.signIn.mockResolvedValue({ error: "CredentialsSignin" });
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "nami@example.com" } });
    fireEvent.change(document.querySelector('input[name="password"]')!, { target: { value: "password-123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form")!);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/login?registered=1"));
  });
});

it("login muestra el aviso registered=1", () => {
  mocks.registered = "1";
  render(<LoginForm />);
  expect(screen.getByRole("status").textContent).toBe("Cuenta creada, inicia sesión.");
});
