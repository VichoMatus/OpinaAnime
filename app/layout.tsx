import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const headingFont = localFont({
  src: "./fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2",
  weight: "400 800",
  style: "normal",
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = localFont({
  src: "./fonts/dm-sans/DMSans-VariableFont_wght.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpinaAnime — Comunidad y Recomendaciones de Anime entre Amigos",
  description: "Comparte tus series favoritas, descubre joyas ocultas y debate cada episodio sin spoilers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg antialiased selection:bg-primary/20 selection:text-fg">
        {children}
      </body>
    </html>
  );
}
