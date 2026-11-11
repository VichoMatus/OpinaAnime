"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeftIcon } from "@/components/icons";

export type HeaderRole = "ADMIN" | "USER";

export interface HeaderUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: HeaderRole;
}

interface SiteHeaderProps {
  user: HeaderUser;
  showBackToForum?: boolean;
}

export default function SiteHeader({ user, showBackToForum = false }: SiteHeaderProps) {
  const isAdmin = user.role === "ADMIN";
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  async function handleSyncCatalog() {
    if (syncingCatalog) return;
    setSyncingCatalog(true);
    setSyncMessage(null);

    try {
      const res = await fetch("/api/admin/sync-catalog");
      const data = await res.json();

      if (res.ok) {
        setSyncMessage({
          text: data.message || `Catálogo actualizado (${data.totalInCatalog} animes).`,
          type: "success",
        });
      } else {
        setSyncMessage({
          text: data.error || "No se pudo actualizar el catálogo.",
          type: "error",
        });
      }
    } catch {
      setSyncMessage({
        text: "Error de conexión al actualizar el catálogo.",
        type: "error",
      });
    } finally {
      setSyncingCatalog(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        {/* Izquierda: Logo + Volver al foro opcional */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {showBackToForum && (
            <Link
              href="/"
              className="btn btn-secondary min-h-9 px-3 py-1.5 text-xs sm:text-sm shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Volver al foro</span>
            </Link>
          )}

          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-w-0"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg font-extrabold text-base shadow-card transition-transform group-hover:scale-105"
            >
              OA
            </span>
            <div className="min-w-0">
              <span className="block font-display text-lg font-extrabold tracking-tight text-fg truncate">
                OpinaAnime
              </span>
              <span className="hidden text-xs text-fg-muted sm:block">
                Comunidad entre amigos
              </span>
            </div>
          </Link>
        </div>

        {/* Derecha: Usuario, badge ADMIN, actualizar catálogo y salir */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={handleSyncCatalog}
              disabled={syncingCatalog}
              className="btn btn-secondary min-h-9 px-3 py-1.5 text-xs sm:text-sm"
              title="Actualizar catálogo de animes"
              aria-label="Actualizar catálogo de animes"
            >
              <span className="hidden md:inline">
                {syncingCatalog ? "Actualizando..." : "Actualizar catálogo"}
              </span>
              <span className="md:hidden">
                {syncingCatalog ? "..." : "Catálogo"}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs sm:text-sm">
            <span className="max-w-[130px] sm:max-w-[200px] truncate font-medium text-fg">
              {user.name || user.email}
            </span>
            {isAdmin && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-primary border border-primary/25">
                ADMIN
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-ghost min-h-9 px-3 py-1.5 text-xs sm:text-sm border border-border"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Mensaje en contexto de sincronización de catálogo */}
      {syncMessage && (
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div
            role={syncMessage.type === "error" ? "alert" : "status"}
            className={`flex items-center justify-between gap-3 ${
              syncMessage.type === "error" ? "form-error" : "form-notice"
            }`}
          >
            <span>{syncMessage.text}</span>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
