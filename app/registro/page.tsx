import Link from "next/link";
import RegisterForm from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-bg text-fg flex flex-col justify-between px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {/* Cabecera de marca cálida */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-elevated font-display text-2xl font-extrabold"
          >
            OA
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Únete a nuestra comunidad
          </span>
        </div>

        {/* Tarjeta principal */}
        <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-elevated">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
              Crea tu cuenta en OpinaAnime
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-fg-muted leading-relaxed">
              Comparte qué animes vale la pena ver, apoya las mejores propuestas y guarda tus opiniones.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-sm text-fg-muted">
              ¿Ya tienes una cuenta?{" "}
              <Link
                className="font-semibold text-primary hover:text-primary-hover underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
                href="/login"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-fg-subtle">
        OpinaAnime • El rincón privado para hablar de anime sin spoilers
      </footer>
    </main>
  );
}
