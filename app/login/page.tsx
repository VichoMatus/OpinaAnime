import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-6 py-12 text-zinc-100">
      <div className="w-full max-w-md bg-[#121318] border border-[#22242a] rounded-xl p-8 shadow-xl">
        <p className="mb-6 font-sans text-xs uppercase tracking-widest text-zinc-400 font-bold">
          OPINANIME
        </p>

        <h1 className="mb-2 text-2xl font-bold text-white tracking-tight">
          Entrar a la conversación
        </h1>
        <p className="mb-6 font-sans text-sm text-zinc-400">
          Recomendaciones y debate de anime entre la comunidad.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center font-sans text-sm text-zinc-400">
          ¿Aún no tienes cuenta?{" "}
          <Link
            className="text-white hover:underline underline-offset-4 font-medium transition-colors"
            href="/registro"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
