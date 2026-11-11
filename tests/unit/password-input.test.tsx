import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import PasswordInput from "@/components/password-input";

afterEach(cleanup);

describe("PasswordInput", () => {
  it("alterna tipo y atributos accesibles con clic y teclado", async () => {
    render(<PasswordInput id="password" name="password" />);
    const input = document.querySelector('input[name="password"]')!;
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(input.getAttribute("type")).toBe("password");
    expect(toggle.getAttribute("aria-controls")).toBe("password");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Ocultar contraseña").hasAttribute("aria-pressed")).toBe(false);
    expect(input.getAttribute("type")).toBe("text");
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Ocultar contraseña" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Mostrar contraseña" }).hasAttribute("aria-pressed")).toBe(false);
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" }).hasAttribute("aria-pressed")).toBe(false);
  });

  it("el botón no envía el formulario", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}><PasswordInput name="password" /><button type="submit">Enviar</button></form>);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
