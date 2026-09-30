"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = Object.fromEntries(new FormData(event.currentTarget)); const result = await signIn("credentials", { ...data, redirect: false }); if (result?.error) { setError("Correo o contraseña incorrectos."); setBusy(false); return; } router.push("/"); router.refresh(); }
  return <form method="POST" onSubmit={submit} className="space-y-4 font-sans">{params.get("registered") && <p className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">Cuenta creada. Ya puedes entrar.</p>}<input required name="email" type="email" placeholder="correo@ejemplo.com" className="field-dark" /><input required name="password" type="password" placeholder="Contraseña" className="field-dark" />{error && <p className="text-sm text-red-400">{error}</p>}<button disabled={busy} className="w-full bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-50">{busy ? "Entrando..." : "Iniciar sesión"}</button></form>;
}
