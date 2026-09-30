"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AnimeSearch, { CatalogAnime } from "@/components/anime-search";
import { MessageSquareIcon, TrashIcon, StarIcon, ThumbsUpIcon } from "@/components/icons";

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
  votesCount: number;
  hasVoted: boolean;
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
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "A":
      return "bg-blue-500/10 text-blue-300 border-blue-500/30";
    case "B":
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    case "C":
      return "bg-zinc-500/10 text-zinc-300 border-zinc-600";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "WATCHING":
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "DROPPED":
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
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

  const [selectedAnime, setSelectedAnime] = useState<CatalogAnime | null>(null);
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  function handleSelectAnime(anime: CatalogAnime) {
    setSelectedAnime(anime);
    setFormError("");
  }

  function handleResetSelection() {
    setSelectedAnime(null);
    setRationale("");
    setFormError("");
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  async function handleSyncCatalog() {
    if (syncingCatalog) return;
    setSyncingCatalog(true);

    try {
      const res = await fetch("/api/admin/sync-catalog");
      const data = await res.json();

      if (res.ok) {
        alert(data.message || `Catálogo sincronizado (${data.totalInCatalog} animes).`);
      } else {
        alert(data.error || "No se pudo sincronizar el catálogo.");
      }
    } catch {
      alert("Error de red al sincronizar el catálogo.");
    } finally {
      setSyncingCatalog(false);
    }
  }

  // Actualización rápida de categoría (status) y tier desde la tarjeta para el Admin
  async function handleQuickUpdate(
    id: string,
    updates: { tier?: "S" | "A" | "B" | "C" | null; status?: string }
  ) {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const prevTier = target.tier;
    const prevStatus = target.status;

    // Actualización optimista local
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );

    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "No se pudo actualizar.");
        // Revertir estado si falla
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, tier: prevTier, status: prevStatus } : it
          )
        );
      }
    } catch {
      alert("Error de red al actualizar.");
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, tier: prevTier, status: prevStatus } : it
        )
      );
    }
  }

  async function handleToggleVote(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const prevHasVoted = target.hasVoted;
    const prevVotesCount = target.votesCount;

    const newHasVoted = !prevHasVoted;
    const newVotesCount = newHasVoted ? prevVotesCount + 1 : Math.max(0, prevVotesCount - 1);

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, hasVoted: newHasVoted, votesCount: newVotesCount } : it
      )
    );

    try {
      const res = await fetch(`/api/recommendations/${id}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, hasVoted: data.hasVoted, votesCount: data.votesCount } : it
          )
        );
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, hasVoted: prevHasVoted, votesCount: prevVotesCount } : it
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, hasVoted: prevHasVoted, votesCount: prevVotesCount } : it
        )
      );
    }
  }

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
          imageUrl: selectedAnime.imageUrl,
          rationale: rationale.trim(),
          mal_id: selectedAnime.mal_id || (parseInt(selectedAnime.externalId, 10) || null),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la recomendación.");
      }

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
        votesCount: 0,
        hasVoted: false,
      };

      setItems([newItem, ...items]);
      handleResetSelection();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setSubmitting(false);
    }
  }

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

  const filteredItems = items.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  return (
    <main className="min-h-screen bg-[#0a0b0e] text-zinc-100 pb-20">
      {/* Header / Navbar */}
      <header className="border-b border-[#1f2128] bg-[#0e0f14] sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="cursor-pointer">
            <span className="text-xl font-bold tracking-wider text-white uppercase">
              OPINANIME
            </span>
          </Link>

          <div className="flex items-center gap-4 font-sans text-sm">
            <span className="hidden text-zinc-400 sm:inline-flex items-center gap-2">
              <span className="text-zinc-300">{user.name || user.email}</span>
              {isAdmin && (
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                  ADMIN
                </span>
              )}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[340px_1fr]">
        {/* Columna Izquierda: Formulario Nueva Recomendación */}
        <aside>
          <div className="bg-[#121318] border border-[#22242a] rounded-xl p-5 sticky top-24 shadow-md">
            <h2 className="font-sans text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4">
              Nueva Recomendación
            </h2>

            {/* Paso 1: Buscador */}
            {!selectedAnime ? (
              <div className="space-y-4">
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Busca cualquier título en nuestro catálogo. Verificaremos que no esté repetido antes de recomendarlo.
                </p>
                <AnimeSearch onSelectAnime={handleSelectAnime} />
              </div>
            ) : (
              /* Paso 2: Anime Seleccionado */
              <form onSubmit={handleCreateRecommendation} className="space-y-4 font-sans">
                <div className="rounded-lg border border-zinc-700 bg-[#181920] p-3 flex gap-3 items-center">
                  <img
                    src={selectedAnime.imageUrl}
                    alt={selectedAnime.title}
                    className="w-14 h-20 object-cover rounded bg-zinc-950 border border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {selectedAnime.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Catálogo #{selectedAnime.externalId}
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
                    className="w-full bg-[#0a0b0e] border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Publicando hilo..." : "Publicar en el Foro"}
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* Columna Derecha: Tarjetas del Foro */}
        <section>
          {/* Header del Foro */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#1f2128] pb-4 gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Temas del Foro
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">
                Hilos de Debate & Veredictos
              </h2>
            </div>
            <span className="font-sans text-xs text-zinc-400 bg-[#121318] border border-[#22242a] px-3 py-1.5 rounded-lg">
              {filteredItems.length} {filteredItems.length === 1 ? "anime" : "animes en debate"}
            </span>
          </div>

          {/* Fila de Filtros Exclusivos para Admin + Botón de Sincronización */}
          {session?.user?.role === "ADMIN" && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-semibold text-zinc-400 mr-1">
                Filtrar estado (Admin):
              </span>
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`font-sans text-xs px-3 py-1.5 rounded-md transition-colors border cursor-pointer ${
                    statusFilter === tab.value
                      ? "bg-blue-600 border-blue-500 text-white font-medium"
                      : "bg-[#121318] border-[#22242a] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleSyncCatalog}
                disabled={syncingCatalog}
                className="font-sans text-xs px-3 py-1.5 rounded-md border border-zinc-700 bg-[#181920] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer disabled:opacity-50 sm:ml-auto"
                title="Sincronizar catálogo con Kitsu API"
              >
                {syncingCatalog ? "Sincronizando..." : "🔄 Sincronizar Catálogo"}
              </button>
            </div>
          )}

          {/* Feed de Tarjetas */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-[#22242a] bg-[#121318] p-10 text-center text-zinc-400 font-sans text-sm">
                No hay animes registrados para este filtro.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAuthor = item.authorId === user.id;
                const canDelete = isAdmin || (isAuthor && item.commentsCount === 0);

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#22242a] bg-[#121318] p-5 shadow-sm"
                  >
                    <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                      {/* Portada */}
                      <Link
                        href={`/anime/${item.id}`}
                        className="overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center h-48 sm:h-full border border-zinc-800 block"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
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
                                className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
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
                              {/* Botón de Like / Upvote interactivo */}
                              <button
                                type="button"
                                onClick={() => handleToggleVote(item.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold border transition-colors cursor-pointer ${
                                  item.hasVoted
                                    ? "bg-rose-600 text-white border-rose-500"
                                    : "bg-[#181920] border-[#2a2c35] text-zinc-300 hover:text-white hover:border-zinc-500"
                                }`}
                                title={item.hasVoted ? "Quitar me gusta" : "Apoyar esta recomendación"}
                              >
                                <ThumbsUpIcon className="w-3.5 h-3.5" filled={item.hasVoted} />
                                <span>{item.votesCount}</span>
                              </button>

                              {/* Controles para mover de categoría y agregar Tier: Interactivos para Admin */}
                              {isAdmin ? (
                                <div className="flex items-center gap-1.5">
                                  {/* Selector de Tier directo */}
                                  <select
                                    value={item.tier ?? ""}
                                    onChange={(e) =>
                                      handleQuickUpdate(item.id, {
                                        tier: (e.target.value as "S" | "A" | "B" | "C") || null,
                                      })
                                    }
                                    className={`px-2 py-1 rounded-md font-semibold text-xs border cursor-pointer ${getTierBadgeClass(
                                      item.tier
                                    )} bg-[#121318] focus:outline-none`}
                                    title="Asignar Tier (Admin)"
                                  >
                                    <option value="" className="bg-[#121318] text-zinc-400">
                                      Sin tier
                                    </option>
                                    <option value="S" className="bg-[#121318] text-amber-300">
                                      Tier S
                                    </option>
                                    <option value="A" className="bg-[#121318] text-blue-300">
                                      Tier A
                                    </option>
                                    <option value="B" className="bg-[#121318] text-cyan-300">
                                      Tier B
                                    </option>
                                    <option value="C" className="bg-[#121318] text-zinc-300">
                                      Tier C
                                    </option>
                                  </select>

                                  {/* Selector de Estado / Categoría directo */}
                                  <select
                                    value={item.status}
                                    onChange={(e) =>
                                      handleQuickUpdate(item.id, {
                                        status: e.target.value,
                                      })
                                    }
                                    className={`px-2 py-1 rounded-md font-medium text-xs border cursor-pointer ${getStatusBadgeClass(
                                      item.status
                                    )} bg-[#121318] focus:outline-none`}
                                    title="Mover de categoría (Admin)"
                                  >
                                    <option value="PENDING" className="bg-[#121318] text-amber-300">
                                      Lo veré
                                    </option>
                                    <option value="WATCHING" className="bg-[#121318] text-cyan-300">
                                      Viendo
                                    </option>
                                    <option value="COMPLETED" className="bg-[#121318] text-emerald-300">
                                      Terminado
                                    </option>
                                    <option value="DROPPED" className="bg-[#121318] text-zinc-400">
                                      Descartado
                                    </option>
                                  </select>
                                </div>
                              ) : (
                                /* Badges de solo lectura para usuarios estándar */
                                <>
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
                                </>
                              )}

                              {/* Indicador de Reseña de Admin */}
                              {item.adminReview && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                                  <StarIcon className="w-3 h-3 text-amber-400" />
                                  <span>Reseña Admin</span>
                                </span>
                              )}

                              {/* Botón de Moderación para borrar */}
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
                          <p className="mt-3 text-zinc-300 text-sm leading-relaxed line-clamp-3">
                            {item.rationale}
                          </p>
                        </div>

                        {/* Pie de la tarjeta */}
                        <div className="mt-4 pt-3 border-t border-[#1f2128] flex items-center justify-between font-sans text-xs text-zinc-400">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleToggleVote(item.id)}
                              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                item.hasVoted ? "text-rose-400 font-semibold" : "hover:text-zinc-200"
                              }`}
                              title={item.hasVoted ? "Quitar me gusta" : "Apoyar esta recomendación"}
                            >
                              <ThumbsUpIcon className="w-4 h-4" filled={item.hasVoted} />
                              <span>
                                {item.votesCount} {item.votesCount === 1 ? "voto" : "votos"}
                              </span>
                            </button>

                            <Link
                              href={`/anime/${item.id}`}
                              className="inline-flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                            >
                              <MessageSquareIcon className="w-4 h-4 text-blue-400" />
                              <span>
                                {item.commentsCount}{" "}
                                {item.commentsCount === 1 ? "comentario" : "comentarios"}
                              </span>
                            </Link>
                          </div>

                          <Link
                            href={`/anime/${item.id}`}
                            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 transition-colors"
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
