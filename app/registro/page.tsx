import Link from "next/link";
import RegisterForm from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-6 py-12 text-zinc-100">
      <div className="w-full max-w-md bg-[#121318] border border-[#22242a] rounded-xl p-8 shadow-xl">
        <p className="mb-6 font-sans text-xs uppercase tracking-widest text-zinc-400 font-bold">
          OPINANIME
        </p>

        <h1 className="mb-2 text-2xl font-bold text-white tracking-tight">
          Crear una cuenta
        </h1>
        <p className="mb-6 font-sans text-sm text-zinc-400">
          Únete para opinar, votar y debatir animes en el foro.
        </p>

        <RegisterForm />

        <p className="mt-6 text-center font-sans text-sm text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            className="text-white hover:underline underline-offset-4 font-medium transition-colors"
            href="/login"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
