"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import PasswordInput from "@/components/password-input";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    let result;
    try {
      result = await signIn("credentials", { email, password, redirect: false });
    } catch {
      setError("No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.");
      setBusy(false);
      return;
    }
    if (result?.error) {
      setError("Correo o contraseña incorrectos.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form method="POST" onSubmit={submit} className="form-stack">
      {params.get("registered") && <p role="status" className="form-notice">Cuenta creada, inicia sesión.</p>}
      <div className="form-field">
        <label className="form-label" htmlFor="login-email">Correo electrónico</label>
        <input required id="login-email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(error)} aria-describedby={error ? "login-form-error" : undefined} placeholder="correo@ejemplo.com" className="field" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="login-password">Contraseña</label>
        <PasswordInput required id="login-password" name="password" autoComplete="current-password" aria-invalid={Boolean(error)} aria-describedby={error ? "login-form-error" : undefined} placeholder="Contraseña" />
      </div>
      {error && <p id="login-form-error" role="alert" className="form-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Entrando..." : "Iniciar sesión"}</button>
    </form>
  );
}
