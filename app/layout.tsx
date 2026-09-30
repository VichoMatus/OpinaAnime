import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPINANIME - Foro & Recomendaciones de Anime",
  description: "Debates, veredictos y recomendaciones sinceras de anime entre la comunidad",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-violet-500/30 selection:text-violet-200">
        {children}
      </body>
    </html>
  );
}
