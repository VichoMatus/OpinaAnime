import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() { return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-zinc-100"><div className="w-full max-w-md"><p className="mb-10 font-sans text-xs uppercase tracking-[.3em] text-zinc-500">OpinaAnime / círculo privado</p><h1 className="mb-3 text-5xl leading-none">Entra a la conversación.</h1><p className="mb-8 font-sans text-sm text-zinc-400">Recomendaciones sinceras, opiniones sin spoilers innecesarios.</p><Suspense><LoginForm /></Suspense><p className="mt-6 text-center font-sans text-sm text-zinc-400">¿Aún no tienes cuenta? <Link className="text-zinc-100 underline underline-offset-4" href="/registro">Regístrate</Link></p></div></main>; }
