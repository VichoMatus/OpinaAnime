import Link from "next/link";
import RegisterForm from "@/components/register-form";

export default function RegisterPage() { return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-zinc-100"><div className="w-full max-w-md"><p className="mb-10 font-sans text-xs uppercase tracking-[.3em] text-zinc-500">OpinaAnime / nueva voz</p><h1 className="mb-3 text-5xl leading-none">Únete al grupo.</h1><p className="mb-8 font-sans text-sm text-zinc-400">Tu correo define tu acceso. La cuenta administradora se asigna automáticamente.</p><RegisterForm /><p className="mt-6 text-center font-sans text-sm text-zinc-400">¿Ya tienes cuenta? <Link className="text-zinc-100 underline underline-offset-4" href="/login">Inicia sesión</Link></p></div></main>; }
