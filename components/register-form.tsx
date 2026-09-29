"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); setBusy(false); return; }
    router.push("/login?registered=1");
  }
  return <form onSubmit={submit} className="space-y-4 font-sans"><input name="name" placeholder="Tu nombre (opcional)" className="field" /><input required name="email" type="email" placeholder="correo@ejemplo.com" className="field" /><input required minLength={8} name="password" type="password" placeholder="Contraseña (mínimo 8 caracteres)" className="field" />{error && <p className="text-sm text-red-400">{error}</p>}<button disabled={busy} className="w-full bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-50">{busy ? "Creando cuenta..." : "Crear cuenta"}</button></form>;
}
