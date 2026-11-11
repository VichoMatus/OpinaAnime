"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/password-input";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "No se pudo crear la cuenta.");
        (form.elements.namedItem("password") as HTMLInputElement).value = "";
        setBusy(false);
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        router.push("/login?registered=1");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      (form.elements.namedItem("password") as HTMLInputElement).value = "";
      setBusy(false);
    }
  }

  return (
    <form method="POST" onSubmit={submit} className="form-stack">
      <div className="form-field">
        <label className="form-label" htmlFor="register-name">Nombre</label>
        <input id="register-name" name="name" autoComplete="name" placeholder="Tu nombre (opcional)" className="field" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="register-email">Correo electrónico</label>
        <input required id="register-email" name="email" type="email" autoComplete="email" placeholder="correo@ejemplo.com" className="field" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="register-password">Contraseña</label>
        <PasswordInput required minLength={8} id="register-password" name="password" autoComplete="new-password" placeholder="Contraseña (mínimo 8 caracteres)" />
      </div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Creando cuenta..." : "Crear cuenta"}</button>
    </form>
  );
}
