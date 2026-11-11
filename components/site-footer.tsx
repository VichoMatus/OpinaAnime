import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-subtle/60 py-8 text-sm text-fg-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-fg font-extrabold text-xs"
          >
            OA
          </span>
          <span className="font-display font-bold text-fg">OpinaAnime</span>
          <span>•</span>
          <span>Recomendaciones sinceras de anime entre amigos</span>
        </div>

        <p className="text-xs text-fg-subtle text-center sm:text-right">
          Comunidad privada sin spoilers •{" "}
          <Link href="/" className="font-medium text-fg-muted hover:text-primary underline underline-offset-4">
            Ir al foro
          </Link>
        </p>
      </div>
    </footer>
  );
}
