"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AnimeSearch, { JikanAnime } from "@/components/anime-search";
import { MessageSquareIcon, TrashIcon, StarIcon } from "@/components/icons";

export type Role = "ADMIN" | "USER";

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

export interface ForumRecommendation {
  id: string;
  mal_id: number | null;
  title: string;
  imageUrl: string;
  rationale: string;
  adminReview: string | null;
  tier: "S" | "A" | "B" | "C" | null;
  status: string;
  createdAt: string | Date;
  authorId: string;
  author: {
    id?: string;
    name: string | null;
    email: string;
  };
  commentsCount: number;
}

interface DashboardProps {
  user: UserSession;
  initialRecommendations: ForumRecommendation[];
  session?: {
    user: UserSession;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "Lo veré",
  WATCHING: "Viendo actualmente",
  COMPLETED: "Terminado",
  DROPPED: "Descartado",
};

const filterTabs = [
  { label: "Todos", value: "ALL" },
  { label: "Lo veré", value: "PENDING" },
  { label: "Viendo", value: "WATCHING" },
  { label: "Terminados", value: "COMPLETED" },
  { label: "Descartados", value: "DROPPED" },
];

function getTierBadgeClass(tier: string | null) {
  switch (tier) {
    case "S":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "A":
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
    case "B":
      return "bg-blue-500/15 text-blue-300 border-blue-500/40";
    case "C":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "WATCHING":
      return "bg-sky-500/15 text-sky-300 border-sky-500/40";
    case "COMPLETED":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    case "DROPPED":
      return "bg-rose-500/15 text-rose-300 border-rose-500/40";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

export default function Dashboard({
  user,
  initialRecommendations,
  session: propSession,
}: DashboardProps) {
  const session = propSession ?? { user };
  const isAdmin = session?.user?.role === "ADMIN";

  const [items, setItems] = useState<ForumRecommendation[]>(initialRecommendations);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Estado del formulario de nueva recomendación con Jikan API
  const [selectedAnime, setSelectedAnime] = useState<JikanAnime | null>(null);
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Manejar selección desde Jikan API
  function handleSelectAnime(anime: JikanAnime) {
    setSelectedAnime(anime);
    setFormError("");
  }

  function handleResetSelection() {
    setSelectedAnime(null);
    setRationale("");
    setFormError("");
  }

  // Publicar nueva recomendación en el foro
  async function handleCreateRecommendation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAnime || !rationale.trim() || submitting) return;

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedAnime.title,
          imageUrl:
            selectedAnime.images.jpg.large_image_url ||
            selectedAnime.images.jpg.image_url,
          rationale: rationale.trim(),
          mal_id: selectedAnime.mal_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la recomendación.");
      }

      // Añadir la nueva recomendación al estado local
      const newItem: ForumRecommendation = {
        id: data.id,
        mal_id: data.mal_id,
        title: data.title,
        imageUrl: data.imageUrl,
        rationale: data.rationale,
        adminReview: null,
        tier: data.tier,
        status: data.status,
        createdAt: data.createdAt,
        authorId: user.id,
        author: {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? "",
        },
        commentsCount: 0,
      };

      setItems([newItem, ...items]);
      handleResetSelection();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  // Eliminar recomendación (Moderación)
  async function handleDeleteRecommendation(id: string) {
    const confirmMessage = isAdmin
      ? "¿Estás seguro de eliminar este hilo como Administrador? Se borrarán todos los comentarios asociados."
      : "¿Seguro que deseas eliminar tu recomendación?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "No se pudo eliminar la recomendación.");
      }
    } catch {
      alert("Error de red al eliminar la recomendación.");
    }
  }

  // Filtrado de recomendaciones
  const filteredItems = items.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Header / Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-sans text-indigo-400 font-bold tracking-widest text-sm uppercase">
              OPINAANIME
            </p>
            <h1 className="mt-0.5 text-lg sm:text-xl font-serif text-zinc-100">
              Foro de Debate & Recomendaciones
            </h1>
          </div>
          <div className="flex items-center gap-4 font-sans text-sm">
            <span className="hidden text-zinc-400 sm:inline-flex items-center gap-2">
              {user.name || user.email}
              {isAdmin && (
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
                  ADMIN
                </span>
              )}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Layout Principal: Formulario Buscador + Feed de Foro */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[340px_1fr]">
        {/* Columna Izquierda: Formulario Nueva Recomendación con Jikan API */}
        <aside>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-24 shadow-xl">
            <h2 className="font-sans text-xs uppercase tracking-[.2em] text-indigo-400 font-bold mb-4">
              Nueva Recomendación
            </h2>

            {/* Paso 1: Buscador de Jikan API */}
            {!selectedAnime ? (
              <div className="space-y-4">
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Busca cualquier título directamente en <b>MyAnimeList</b>. Verificaremos que no esté repetido en el foro antes de recomendarlo.
                </p>
                <AnimeSearch onSelectAnime={handleSelectAnime} />
              </div>
            ) : (
              /* Paso 2: Anime Seleccionado y Campo de Fundamento */
              <form onSubmit={handleCreateRecommendation} className="space-y-4 font-sans">
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3 flex gap-3 items-center">
                  <img
                    src={selectedAnime.images.jpg.image_url}
                    alt={selectedAnime.title}
                    className="w-14 h-20 object-cover rounded bg-zinc-950 border border-zinc-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100 truncate">
                      {selectedAnime.title}
                    </h3>
                    <p className="text-xs text-indigo-300 font-mono mt-0.5">
                      MAL #{selectedAnime.mal_id}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSelection}
                      className="mt-2 text-xs text-zinc-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                    >
                      Cambiar anime
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    ¿Por qué debería verlo? (Fundamento)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explica qué lo hace especial, sin spoilers innecesarios..."
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2.5 px-4 rounded-md transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? "Publicando hilo..." : "Publicar en el Foro"}
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* Columna Derecha: Tarjetas del Foro de Debate */}
        <section>
          {/* Header del Foro */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-[.2em] text-zinc-500">
                Temas del Foro
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-serif text-zinc-100">
                Hilos de Debate & Veredictos
              </h2>
            </div>
            <span className="font-sans text-sm text-zinc-400">
              {filteredItems.length} {filteredItems.length === 1 ? "anime" : "animes"}
            </span>
          </div>

          {/* Fila de Filtros Exclusivos para Admin */}
          {session?.user?.role === "ADMIN" && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-medium text-zinc-400 mr-1">
                Filtrar estado (Admin):
              </span>
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`font-sans text-xs px-3 py-1.5 rounded-md transition-colors border cursor-pointer ${
                    statusFilter === tab.value
                      ? "bg-indigo-600 border-indigo-500 text-white font-medium"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Feed de Tarjetas con Formato de Foro */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400 font-sans text-sm">
                No hay animes disponibles para este filtro.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAuthor = item.authorId === user.id;
                const canDelete = isAdmin || (isAuthor && item.commentsCount === 0);

                return (
                  <article
                    key={item.id}
                    className="reveal group rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/90 shadow-lg"
                  >
                    <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                      {/* Portada del Anime */}
                      <Link
                        href={`/anime/${item.id}`}
                        className="overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center h-48 sm:h-full border border-zinc-800 block"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>

                      {/* Detalles del Hilo */}
                      <div className="flex flex-col justify-between">
                        <div>
                          {/* Encabezado: Título y Badges */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/anime/${item.id}`}
                                className="text-xl sm:text-2xl font-serif text-zinc-100 hover:text-indigo-400 transition-colors"
                              >
                                {item.title}
                              </Link>
                              <p className="mt-1 font-sans text-xs text-zinc-400">
                                Recomendado por{" "}
                                <span className="text-zinc-200">
                                  {item.author.name || item.author.email}
                                </span>{" "}
                                • {new Date(item.createdAt).toLocaleDateString("es-ES")}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md font-semibold border ${getTierBadgeClass(
                                  item.tier
                                )}`}
                              >
                                {item.tier ? `Tier ${item.tier}` : "Sin tier"}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {statusLabels[item.status] ?? item.status}
                              </span>

                              {/* Indicador de Reseña de Admin disponible */}
                              {item.adminReview && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                                  <StarIcon className="w-3 h-3 text-amber-400" />
                                  <span>Reseña Admin</span>
                                </span>
                              )}

                              {/* Botón de Moderación para borrar en el feed */}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteRecommendation(item.id)}
                                  title="Eliminar recomendación"
                                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Fundamento resumen */}
                          <p className="mt-3 font-serif text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
                            {item.rationale}
                          </p>
                        </div>

                        {/* Pie de la tarjeta de Foro: Comentarios & Enlace al Hilo */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between font-sans text-xs text-zinc-400">
                          <Link
                            href={`/anime/${item.id}`}
                            className="inline-flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                          >
                            <MessageSquareIcon className="w-4 h-4 text-indigo-400" />
                            <span>
                              {item.commentsCount}{" "}
                              {item.commentsCount === 1 ? "comentario" : "comentarios en debate"}
                            </span>
                          </Link>

                          <Link
                            href={`/anime/${item.id}`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Entrar al debate</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
