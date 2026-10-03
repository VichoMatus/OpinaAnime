"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AnimeSearch, { CatalogAnime } from "@/components/anime-search";
import TierList, { Tier, TierRecommendation } from "@/components/tier-list";
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
  tier: Tier | null;
  tierOrder?: number;
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
  { label: "Terminados", value: "COMPLETED" },
  { label: "Viendo", value: "WATCHING" },
  { label: "Lo veré", value: "PENDING" },
  { label: "Descartados", value: "DROPPED" },
];

function getTierBadgeClass(tier: string | null) {
  switch (tier) {
    case "S":
      return "bg-red-500/10 text-red-300 border-red-500/30";
    case "A":
      return "bg-orange-500/10 text-orange-300 border-orange-500/30";
    case "B":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "C":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
    case "D":
      return "bg-green-500/10 text-green-300 border-green-500/30";
    case "E":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
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
  const [activeTab, setActiveTab] = useState<"foro" | "viendo" | "tierlist">("foro");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recientes" | "vistos" | "viendo" | "votados" | "comentados" | "tier">("recientes");

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
    updates: { tier?: Tier | null; status?: string }
  ) {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const prevTier = target.tier;
    const prevStatus = target.status;

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
        tierOrder: 0,
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

  // Filtrado y ordenamiento en tiempo real para el Foro
  let processedItems = items.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    processedItems = processedItems.filter((item) =>
      item.title.toLowerCase().includes(query) ||
      item.author.name?.toLowerCase().includes(query) ||
      item.author.email.toLowerCase().includes(query)
    );
  }

  processedItems.sort((a, b) => {
    if (sortBy === "vistos") {
      const aComp = a.status === "COMPLETED" ? 1 : 0;
      const bComp = b.status === "COMPLETED" ? 1 : 0;
      if (bComp !== aComp) return bComp - aComp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "viendo") {
      const aWatch = a.status === "WATCHING" ? 1 : 0;
      const bWatch = b.status === "WATCHING" ? 1 : 0;
      if (bWatch !== aWatch) return bWatch - aWatch;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "votados") {
      return b.votesCount - a.votesCount;
    }
    if (sortBy === "comentados") {
      return b.commentsCount - a.commentsCount;
    }
    if (sortBy === "tier") {
      const tierRank: Record<string, number> = { S: 1, A: 2, B: 3, C: 4, D: 5, E: 6 };
      const aRank = a.tier ? tierRank[a.tier] ?? 99 : 99;
      const bRank = b.tier ? tierRank[b.tier] ?? 99 : 99;
      if (aRank !== bRank) return aRank - bRank;
      return (a.tierOrder ?? 0) - (b.tierOrder ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const watchingItems = items.filter((item) => item.status === "WATCHING");

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

            {/* Paso 1: Buscador en Catálogo */}
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

        {/* Columna Derecha: Contenido Principal con Pestañas */}
        <section>
          {/* Header del Foro */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#1f2128] pb-4 gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Comunidad & Veredictos
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">
                Foro de Debate & Recomendaciones
              </h2>
            </div>
            <span className="font-sans text-xs text-zinc-400 bg-[#121318] border border-[#22242a] px-3 py-1.5 rounded-lg">
              {activeTab === "foro" && (
                `${processedItems.length} ${processedItems.length === 1 ? "anime" : "animes mostrados"}`
              )}
              {activeTab === "viendo" && (
                `${watchingItems.length} ${watchingItems.length === 1 ? "serie en seguimiento" : "series en seguimiento"}`
              )}
              {activeTab === "tierlist" && (
                `${items.filter((i) => i.tier !== null).length} animes clasificados`
              )}
            </span>
          </div>

          {/* Sistema de Navegación con 3 Pestañas */}
          <div className="flex items-center gap-2 border-b border-[#1f2128] pb-3 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("foro")}
              className={`font-sans text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === "foro"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121318]"
              }`}
            >
              Foro de Debate
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("viendo")}
              className={`font-sans text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 ${
                activeTab === "viendo"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121318]"
              }`}
            >
              <span>Viendo Actualmente</span>
              {watchingItems.length > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    activeTab === "viendo"
                      ? "bg-white/20 text-white"
                      : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  {watchingItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tierlist")}
              className={`font-sans text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === "tierlist"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121318]"
              }`}
            >
              Mi Tier List
            </button>
          </div>

          {/* PESTAÑA 1: Foro de Debate con Búsqueda, Filtros y Ordenamiento */}
          {activeTab === "foro" && (
            <div>
              {/* Barra de Búsqueda, Ordenamiento y Filtros disponible para todos */}
              <div className="mb-6 space-y-3 font-sans">
                {/* Fila 1: Buscador y Ordenar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Buscador de animes en tiempo real */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar anime en el debate..."
                      className="w-full bg-[#121318] border border-[#22242a] focus:border-blue-500 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none text-xs">
                      🔍
                    </span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2 text-zinc-400 hover:text-white text-xs px-1 cursor-pointer"
                        title="Borrar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Selector de Ordenamiento (por vistos, recientes, votados, etc.) */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                      Ordenar por:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#121318] border border-[#22242a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="recientes">Más recientes</option>
                      <option value="vistos">Vistos / Terminados primero</option>
                      <option value="viendo">Viendo actualmente primero</option>
                      <option value="votados">Más votos / apoyados</option>
                      <option value="comentados">Más comentarios</option>
                      <option value="tier">Por Tier (Mejor clasificados)</option>
                    </select>
                  </div>
                </div>

                {/* Fila 2: Filtros de Estado para todos (amigos y admin) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-zinc-400 mr-1">
                    Filtrar estado:
                  </span>
                  {filterTabs.map((tab) => {
                    const count =
                      tab.value === "ALL"
                        ? items.length
                        : items.filter((i) => i.status === tab.value).length;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors border cursor-pointer inline-flex items-center gap-1.5 ${
                          statusFilter === tab.value
                            ? "bg-blue-600 border-blue-500 text-white font-medium"
                            : "bg-[#121318] border-[#22242a] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            statusFilter === tab.value
                              ? "bg-white/20 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Botón exclusivo de Admin para sincronización */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleSyncCatalog}
                      disabled={syncingCatalog}
                      className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 bg-[#181920] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer disabled:opacity-50 sm:ml-auto"
                      title="Sincronizar catálogo con Kitsu API"
                    >
                      {syncingCatalog ? "Sincronizando..." : "🔄 Sincronizar Catálogo"}
                    </button>
                  )}
                </div>
              </div>

              {/* Feed de Tarjetas */}
              <div className="space-y-4">
                {processedItems.length === 0 ? (
                  <div className="rounded-xl border border-[#22242a] bg-[#121318] p-10 text-center text-zinc-400 font-sans text-sm">
                    {searchQuery
                      ? `No se encontraron animes que coincidan con "${searchQuery}".`
                      : "No hay animes registrados para este filtro."}
                  </div>
                ) : (
                  processedItems.map((item) => {
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
                                  <p className="font-sans text-xs text-zinc-400 mt-1">
                                    Recomendado por{" "}
                                    <span className="text-zinc-300 font-medium">
                                      {item.author.name || item.author.email}
                                    </span>
                                    {item.author.id && (
                                      <>
                                        {" "}•{" "}
                                        <span>
                                          {new Date(item.createdAt).toLocaleDateString("es-ES")}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {isAdmin ? (
                                    /* Controles de Moderación y Asignación Rápida para el Admin */
                                    <div className="flex items-center gap-1.5 font-sans">
                                      {/* Selector de Tier directo */}
                                      <select
                                        value={item.tier ?? ""}
                                        onChange={(e) =>
                                          handleQuickUpdate(item.id, {
                                            tier: (e.target.value as Tier) || null,
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
                                        <option value="S" className="bg-[#121318] text-red-300">
                                          Tier S
                                        </option>
                                        <option value="A" className="bg-[#121318] text-orange-300">
                                          Tier A
                                        </option>
                                        <option value="B" className="bg-[#121318] text-amber-300">
                                          Tier B
                                        </option>
                                        <option value="C" className="bg-[#121318] text-yellow-300">
                                          Tier C
                                        </option>
                                        <option value="D" className="bg-[#121318] text-green-300">
                                          Tier D
                                        </option>
                                        <option value="E" className="bg-[#121318] text-emerald-300">
                                          Tier E
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
                                    /* Badges de solo lectura para usuarios estándar / amigos */
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
            </div>
          )}

          {/* PESTAÑA 2: Viendo Actualmente (Cuadrícula limpia de series WATCHING) */}
          {activeTab === "viendo" && (
            <div>
              {watchingItems.length === 0 ? (
                <div className="rounded-xl border border-[#22242a] bg-[#121318] p-12 text-center text-zinc-400 font-sans text-sm">
                  No hay animes en estado <strong className="text-cyan-300">Viendo actualmente</strong> en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 font-sans">
                  {watchingItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/anime/${item.id}`}
                      className="group bg-[#121318] border border-[#22242a] rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col shadow-sm"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="rounded bg-cyan-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                            Viendo
                          </span>
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="mt-3 pt-2 border-t border-[#1f2128] flex items-center justify-between text-xs text-zinc-400">
                          <span>{item.commentsCount} comentarios</span>
                          <span className="text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                            Debate →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: Mi Tier List con Reordenamiento de Tarjetas */}
          {activeTab === "tierlist" && (
            <TierList
              recommendations={items}
              currentUser={user}
              onReorder={(updatedList) => {
                setItems((prev) =>
                  prev.map((item) => {
                    const found = updatedList.find((u) => u.id === item.id);
                    return found
                      ? { ...item, tier: found.tier, tierOrder: found.tierOrder }
                      : item;
                  })
                );
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
