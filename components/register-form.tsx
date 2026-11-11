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
    if (new TextEncoder().encode(password).length > 72) {
      setError("Tu contraseña es demasiado larga (máximo 72 caracteres; los emojis y las tildes cuentan más).");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error ?? "No se pudo crear la cuenta.");
        (form.elements.namedItem("password") as HTMLInputElement).value = "";
        setBusy(false);
        return;
      }

      try {
        const signInResult = await signIn("credentials", { email, password, redirect: false });
        if (signInResult?.error) {
          router.push("/login?registered=1");
          return;
        }
        router.push("/");
        router.refresh();
      } catch {
        router.push("/login?registered=1");
      }
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
        <input id="register-name" name="name" autoComplete="name" maxLength={60} placeholder="Tu nombre (opcional)" className="field" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="register-email">Correo electrónico</label>
        <input required id="register-email" name="email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(error)} aria-describedby={error ? "register-form-error" : undefined} placeholder="correo@ejemplo.com" className="field" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="register-password">Contraseña</label>
        <PasswordInput required minLength={8} maxLength={72} id="register-password" name="password" autoComplete="new-password" aria-invalid={Boolean(error)} aria-describedby={error ? "register-form-error" : undefined} placeholder="Mínimo 8 caracteres" />
      </div>
      {error && <p id="register-form-error" role="alert" className="form-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Creando cuenta..." : "Crear cuenta"}</button>
    </form>
  );
}
