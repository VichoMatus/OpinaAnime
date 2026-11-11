"use client";

import { useState, useId } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import AnimeSearch, { CatalogAnime } from "@/components/anime-search";
import TierList, { Tier } from "@/components/tier-list";
import { getTierBadgeClass, getTierBadgeStyle } from "@/lib/tier-styles";
import { MessageSquareIcon, TrashIcon, StarIcon, ThumbsUpIcon, SearchIcon } from "@/components/icons";
import {
  OWNER_NAME,
  RATIONALE_MAX,
  RATIONALE_MIN,
  STATUS_LABELS,
  getStatusBadgeClass,
  validateRationale,
} from "@/lib/community";

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

const statusLabels: Record<string, string> = STATUS_LABELS;

const RECOMMENDED_FILTER = "RECOMMENDED";

const filterTabs = [
  { label: "Recomendaciones", value: RECOMMENDED_FILTER },
  { label: "Lo veré", value: "PENDING" },
  { label: "Viendo", value: "WATCHING" },
  { label: "Terminados", value: "COMPLETED" },
  { label: "Descartados", value: "DROPPED" },
  { label: "Todos", value: "ALL" },
];

export default function Dashboard({
  user,
  initialRecommendations,
  session: propSession,
}: DashboardProps) {
  const session = propSession ?? { user };
  const isAdmin = session?.user?.role === "ADMIN";
  const rationaleId = useId();
  const sortSelectId = useId();

  const [items, setItems] = useState<ForumRecommendation[]>(initialRecommendations);
  const [activeTab, setActiveTab] = useState<"foro" | "viendo" | "tierlist">("foro");
  const [statusFilter, setStatusFilter] = useState(RECOMMENDED_FILTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recientes" | "vistos" | "viendo" | "votados" | "comentados" | "tier">("votados");

  const [selectedAnime, setSelectedAnime] = useState<CatalogAnime | null>(null);
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionAlert, setActionAlert] = useState<{ text: string; type: "error" | "success" } | null>(null);

  function handleSelectAnime(anime: CatalogAnime) {
    setSelectedAnime(anime);
    setFormError("");
  }

  function handleResetSelection() {
    setSelectedAnime(null);
    setRationale("");
    setFormError("");
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
    setActionAlert(null);

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
        setActionAlert({
          text: errorData.error || "No se pudo actualizar el estado del anime.",
          type: "error",
        });
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, tier: prevTier, status: prevStatus } : it
          )
        );
      }
    } catch {
      setActionAlert({
        text: "Error de conexión al actualizar el anime.",
        type: "error",
      });
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
    if (!selectedAnime || submitting) return;

    const rationaleError = validateRationale(rationale);
    if (rationaleError) {
      setFormError(rationaleError);
      return;
    }

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
        throw new Error(data.error || "No pudimos publicar tu recomendación.");
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
      setStatusFilter(RECOMMENDED_FILTER);
      handleResetSelection();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Ocurrió un error al publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRecommendation(id: string) {
    const confirmMessage = isAdmin
      ? "¿Estás seguro de eliminar este hilo como Administrador? Se borrarán todos los comentarios asociados."
      : "¿Seguro que deseas eliminar tu recomendación?";

    if (!window.confirm(confirmMessage)) return;
    setActionAlert(null);

    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        setActionAlert({
          text: data.error || "No se pudo eliminar la recomendación.",
          type: "error",
        });
      }
    } catch {
      setActionAlert({
        text: "Error de conexión al intentar eliminar la recomendación.",
        type: "error",
      });
    }
  }

  // Filtrado y ordenamiento en tiempo real para el Foro
  let processedItems = items.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    processedItems = processedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.author.name?.toLowerCase().includes(query) ||
        item.author.email.toLowerCase().includes(query)
    );
  }

  // En "Recomendaciones" siempre se ordena por me gusta.
  const effectiveSort = statusFilter === RECOMMENDED_FILTER ? "votados" : sortBy;

  processedItems.sort((a, b) => {
    if (effectiveSort === "vistos") {
      const aComp = a.status === "COMPLETED" ? 1 : 0;
      const bComp = b.status === "COMPLETED" ? 1 : 0;
      if (bComp !== aComp) return bComp - aComp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (effectiveSort === "viendo") {
      const aWatch = a.status === "WATCHING" ? 1 : 0;
      const bWatch = b.status === "WATCHING" ? 1 : 0;
      if (bWatch !== aWatch) return bWatch - aWatch;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (effectiveSort === "votados") {
      if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (effectiveSort === "comentados") {
      return b.commentsCount - a.commentsCount;
    }
    if (effectiveSort === "tier") {
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
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* Header compartido */}
      <SiteHeader user={user} />

      {/* Contenido Principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* Banner de bienvenida y resumen de comunidad */}
        <section className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                {isAdmin
                  ? "¿Qué anime vas a ver después?"
                  : `Recomiéndale algo a ${OWNER_NAME} y únete al debate`}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-fg-muted max-w-2xl">
                {isAdmin
                  ? "Revisa lo que te recomienda la comunidad, ordenado por los que tienen más me gusta."
                  : "Busca un anime, cuéntale por qué vale la pena verlo y dale me gusta a las recomendaciones que más te convenzan."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <div className="rounded-xl border border-border bg-surface-subtle px-3.5 py-2 text-center">
                <span className="block font-display text-lg font-extrabold text-fg">
                  {items.filter((i) => i.status === RECOMMENDED_FILTER).length}
                </span>
                <span className="text-xs font-medium text-fg-muted">Recomendaciones</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-subtle px-3.5 py-2 text-center">
                <span className="block font-display text-lg font-extrabold text-info">
                  {watchingItems.length}
                </span>
                <span className="text-xs font-medium text-fg-muted">Viendo ahora</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-subtle px-3.5 py-2 text-center">
                <span className="block font-display text-lg font-extrabold text-success">
                  {items.filter((i) => i.status === "COMPLETED").length}
                </span>
                <span className="text-xs font-medium text-fg-muted">Terminados</span>
              </div>
            </div>
          </div>
        </section>

        {/* Layout de 2 columnas en desktop: Feed principal + Panel de recomendar */}
        <div className="grid gap-8 lg:grid-cols-[340px_1fr] items-start">
          {/* Columna Lateral: Recomendar un anime */}
          <aside className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-elevated">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-fg tracking-tight">
                  {isAdmin ? "Agregar un anime" : `Recomiéndale un anime a ${OWNER_NAME}`}
                </h2>
                <p className="mt-1 text-sm text-fg-muted leading-relaxed">
                  Busca cualquier serie en el catálogo. Revisaremos que no esté repetida antes de publicarla.
                </p>
              </div>

              {!selectedAnime ? (
                <AnimeSearch onSelectAnime={handleSelectAnime} />
              ) : (
                <form onSubmit={handleCreateRecommendation} className="form-stack">
                  <div className="rounded-xl border border-border-strong bg-surface-subtle p-3.5 flex gap-3.5 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedAnime.imageUrl}
                      alt={selectedAnime.title}
                      className="w-16 h-22 object-cover rounded-lg bg-surface border border-border shrink-0 shadow-card"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-fg truncate">
                        {selectedAnime.title}
                      </h3>
                      <p className="text-xs text-fg-subtle mt-0.5">
                        {[selectedAnime.type ?? "Anime", selectedAnime.year].filter(Boolean).join(" • ")}
                      </p>
                      <button
                        type="button"
                        onClick={handleResetSelection}
                        className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Elegir otro anime
                      </button>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor={rationaleId} className="form-label">
                      ¿Por qué deberíamos verlo?
                    </label>
                    <textarea
                      id={rationaleId}
                      required
                      rows={5}
                      minLength={RATIONALE_MIN}
                      maxLength={RATIONALE_MAX}
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      aria-describedby={`${rationaleId}-count`}
                      placeholder="Cuéntanos qué lo hace especial, su ambiente o por qué engancha, sin spoilers."
                      className="field resize-none"
                    />
                    <p
                      id={`${rationaleId}-count`}
                      className={`text-xs ${
                        rationale.trim().length >= RATIONALE_MIN ? "text-success" : "text-fg-subtle"
                      }`}
                    >
                      {rationale.trim().length >= RATIONALE_MIN
                        ? `${rationale.trim().length} caracteres. ¡Listo para publicar!`
                        : `Mínimo ${RATIONALE_MIN} caracteres (llevas ${rationale.trim().length}).`}
                    </p>
                  </div>

                  {formError && (
                    <div role="alert" className="form-error">
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                  >
                    {submitting ? "Publicando recomendación..." : "Publicar recomendación"}
                  </button>
                </form>
              )}
            </div>
          </aside>

          {/* Columna Derecha: Pestañas y Listado */}
          <section className="min-w-0">
            {/* Barra de Pestañas (Foro / Viendo / Tier List) */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div
                role="tablist"
                aria-label="Secciones de la comunidad"
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "foro"}
                  onClick={() => setActiveTab("foro")}
                  className={`btn min-h-10 px-4 py-2 text-sm ${
                    activeTab === "foro"
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  <span>Foro de Debate</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeTab === "foro"
                        ? "bg-primary-fg/20 text-primary-fg"
                        : "bg-surface-subtle text-fg-muted"
                    }`}
                  >
                    {items.length}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "viendo"}
                  onClick={() => setActiveTab("viendo")}
                  className={`btn min-h-10 px-4 py-2 text-sm ${
                    activeTab === "viendo"
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  <span>Viendo Actualmente</span>
                  {watchingItems.length > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        activeTab === "viendo"
                          ? "bg-primary-fg/20 text-primary-fg"
                          : "bg-info-soft text-info border border-info-border"
                      }`}
                    >
                      {watchingItems.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "tierlist"}
                  onClick={() => setActiveTab("tierlist")}
                  className={`btn min-h-10 px-4 py-2 text-sm ${
                    activeTab === "tierlist"
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  <span>Mi Tier List</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-fg-muted bg-surface-subtle border border-border px-3 py-1.5 rounded-full">
                {activeTab === "foro" &&
                  `${processedItems.length} ${processedItems.length === 1 ? "anime mostrado" : "animes mostrados"}`}
                {activeTab === "viendo" &&
                  `${watchingItems.length} ${watchingItems.length === 1 ? "serie en curso" : "series en curso"}`}
                {activeTab === "tierlist" &&
                  `${items.filter((i) => i.tier !== null).length} animes clasificados`}
              </span>
            </div>

            {/* Alerta en contexto para errores de acciones rápidas o borrado */}
            {actionAlert && (
              <div
                role="alert"
                className={`mb-5 justify-between ${
                  actionAlert.type === "error" ? "form-error" : "form-notice"
                }`}
              >
                <span>{actionAlert.text}</span>
                <button
                  type="button"
                  onClick={() => setActionAlert(null)}
                  className="text-xs font-semibold underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* PESTAÑA 1: Foro de Debate */}
            {activeTab === "foro" && (
              <div>
                {/* Controles de Búsqueda, Orden y Filtros */}
                <div className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card space-y-4">
                  {/* Fila 1: Búsqueda por texto y Selector de Orden */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título o quién lo recomendó..."
                        aria-label="Buscar anime en el debate"
                        className="field pl-10 pr-9 py-2 text-sm"
                      />
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
                        <SearchIcon className="h-4 w-4" />
                      </span>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs font-semibold text-fg-muted hover:text-fg hover:bg-surface-subtle"
                          title="Limpiar búsqueda"
                          aria-label="Limpiar búsqueda"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    {statusFilter === RECOMMENDED_FILTER ? (
                      <p className="text-xs sm:text-sm font-semibold text-fg-muted sm:shrink-0">
                        Ordenadas por más me gusta
                      </p>
                    ) : (
                    <div className="flex items-center gap-2 min-w-0 sm:shrink-0">
                      <label
                        htmlFor={sortSelectId}
                        className="text-xs sm:text-sm font-semibold text-fg-muted whitespace-nowrap"
                      >
                        Ordenar por:
                      </label>
                      <select
                        id={sortSelectId}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="select w-full min-w-0 flex-1 sm:w-auto sm:flex-initial"
                      >
                        <option value="votados">Más votados / apoyados</option>
                        <option value="recientes">Más recientes</option>
                        <option value="vistos">Terminados primero</option>
                        <option value="viendo">Viendo actualmente primero</option>
                        <option value="comentados">Más comentados</option>
                        <option value="tier">Mejor Tier (S → E)</option>
                      </select>
                    </div>
                    )}
                  </div>

                  {/* Fila 2: Chips de Estado */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                    <span className="text-xs font-semibold text-fg-muted mr-1">
                      Categoría:
                    </span>
                    {filterTabs.map((tab) => {
                      const count =
                        tab.value === "ALL"
                          ? items.length
                          : items.filter((i) => i.status === tab.value).length;
                      const isSelected = statusFilter === tab.value;

                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setStatusFilter(tab.value)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                            isSelected
                              ? "bg-primary border-primary text-primary-fg shadow-card"
                              : "bg-surface-subtle border-border text-fg-muted hover:text-fg hover:border-border-strong"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[11px] font-mono ${
                              isSelected
                                ? "bg-primary-fg/25 text-primary-fg"
                                : "bg-surface text-fg-subtle"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Tarjetas de Anime */}
                <div className="space-y-4">
                  {processedItems.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-card">
                      <p className="text-base font-bold text-fg">
                        {searchQuery
                          ? `No encontramos ningún anime que coincida con "${searchQuery}".`
                          : statusFilter === RECOMMENDED_FILTER
                            ? "Aún no hay recomendaciones nuevas."
                            : "Aún no hay animes en esta categoría."}
                      </p>
                      <p className="mt-1.5 text-sm text-fg-muted">
                        {searchQuery
                          ? "Prueba buscando con otras palabras o limpia el filtro para ver todas las recomendaciones."
                          : statusFilter === RECOMMENDED_FILTER && !isAdmin
                            ? `¡Sé el primero en recomendarle algo a ${OWNER_NAME} con el buscador!`
                            : "Cuando haya animes aquí, los verás en esta lista."}
                      </p>
                      {(searchQuery || statusFilter !== "ALL") && items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("ALL");
                          }}
                          className="btn btn-secondary mt-4 text-xs"
                        >
                          Ver todos los animes
                        </button>
                      )}
                    </div>
                  ) : (
                    processedItems.map((item) => {
                      const isAuthor = item.authorId === user.id;
                      const canDelete = isAdmin || (isAuthor && item.commentsCount === 0);

                      return (
                        <article
                          key={item.id}
                          className="group rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-card hover:shadow-elevated hover:border-border-strong transition-all"
                        >
                          <div className="grid grid-cols-[100px_1fr] gap-3.5 sm:gap-5 sm:grid-cols-[148px_1fr]">
                            {/* Portada Protagonista */}
                            <Link
                              href={`/anime/${item.id}`}
                              className="relative overflow-hidden rounded-xl bg-surface-subtle h-36 sm:h-52 border border-border block shadow-card shrink-0 focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </Link>

                            {/* Contenido de la Tarjeta */}
                            <div className="flex flex-col justify-between min-w-0">
                              <div>
                                {/* Encabezado: Título, Autor y Badges */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                                  <div className="min-w-0 flex-1">
                                    <Link
                                      href={`/anime/${item.id}`}
                                      className="font-display text-lg sm:text-xl font-extrabold text-fg hover:text-primary transition-colors line-clamp-2 focus-visible:outline-2 focus-visible:outline-ring rounded"
                                    >
                                      {item.title}
                                    </Link>
                                    <p className="text-xs sm:text-sm text-fg-muted mt-1">
                                      Recomendado por{" "}
                                      <span className="font-semibold text-fg">
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

                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {isAdmin ? (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <select
                                          aria-label={`Asignar Tier a ${item.title}`}
                                          value={item.tier ?? ""}
                                          onChange={(e) =>
                                            handleQuickUpdate(item.id, {
                                              tier: (e.target.value as Tier) || null,
                                            })
                                          }
                                          style={getTierBadgeStyle(item.tier)}
                                          className={`px-2.5 py-1 rounded-lg font-bold text-xs border cursor-pointer focus-visible:outline-2 focus-visible:outline-ring ${getTierBadgeClass(
                                            item.tier
                                          )}`}
                                          title="Asignar Tier"
                                        >
                                          <option value="">Sin tier</option>
                                          <option value="S">Tier S</option>
                                          <option value="A">Tier A</option>
                                          <option value="B">Tier B</option>
                                          <option value="C">Tier C</option>
                                          <option value="D">Tier D</option>
                                          <option value="E">Tier E</option>
                                        </select>

                                        <select
                                          aria-label={`Cambiar estado de ${item.title}`}
                                          value={item.status}
                                          onChange={(e) =>
                                            handleQuickUpdate(item.id, {
                                              status: e.target.value,
                                            })
                                          }
                                          className={`px-2.5 py-1 rounded-lg font-semibold text-xs border cursor-pointer focus-visible:outline-2 focus-visible:outline-ring ${getStatusBadgeClass(
                                            item.status
                                          )}`}
                                          title="Cambiar estado"
                                        >
                                          <option value="RECOMMENDED">Recomendación</option>
                                          <option value="PENDING">Lo veré</option>
                                          <option value="WATCHING">Viendo</option>
                                          <option value="COMPLETED">Terminado</option>
                                          <option value="DROPPED">Descartado</option>
                                        </select>
                                      </div>
                                    ) : (
                                      <>
                                        <span
                                          style={getTierBadgeStyle(item.tier)}
                                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getTierBadgeClass(
                                            item.tier
                                          )}`}
                                        >
                                          {item.tier ? `Tier ${item.tier}` : "Sin tier"}
                                        </span>
                                        <span
                                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(
                                            item.status
                                          )}`}
                                        >
                                          {statusLabels[item.status] ?? item.status}
                                        </span>
                                      </>
                                    )}

                                    {item.adminReview && (
                                      <span className="inline-flex items-center gap-1 rounded-lg bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning border border-warning-border">
                                        <StarIcon className="w-3.5 h-3.5" />
                                        <span>Reseña final</span>
                                      </span>
                                    )}

                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRecommendation(item.id)}
                                        title="Eliminar recomendación"
                                        aria-label={`Eliminar recomendación de ${item.title}`}
                                        className="p-1.5 rounded-lg text-fg-subtle hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Fundamento / Reseña del autor */}
                                <p className="mt-3.5 text-fg text-sm sm:text-base leading-relaxed line-clamp-3">
                                  {item.rationale}
                                </p>
                              </div>

                              {/* Pie de la tarjeta: Votos, Comentarios y CTA al debate */}
                              <div className="mt-5 pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-3 sm:gap-5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVote(item.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-ring ${
                                      item.hasVoted
                                        ? "bg-primary-soft text-primary border border-primary/30"
                                        : "text-fg-muted hover:text-fg hover:bg-surface-subtle"
                                    }`}
                                    title={item.hasVoted ? "Quitar mi voto" : "Apoyar esta recomendación"}
                                  >
                                    <ThumbsUpIcon className="w-4 h-4" filled={item.hasVoted} />
                                    <span>
                                      {item.votesCount} {item.votesCount === 1 ? "voto" : "votos"}
                                    </span>
                                  </button>

                                  <Link
                                    href={`/anime/${item.id}`}
                                    className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg font-medium transition-colors rounded-lg px-2 py-1 focus-visible:outline-2 focus-visible:outline-ring"
                                  >
                                    <MessageSquareIcon className="w-4 h-4 text-primary" />
                                    <span>
                                      {item.commentsCount}{" "}
                                      {item.commentsCount === 1 ? "comentario" : "comentarios"}
                                    </span>
                                  </Link>
                                </div>

                                <Link
                                  href={`/anime/${item.id}`}
                                  className="text-primary hover:text-primary-hover font-bold inline-flex items-center gap-1 transition-colors rounded-lg px-2 py-1 focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                  <span>Entrar al debate</span>
                                  <span aria-hidden="true">→</span>
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

            {/* PESTAÑA 2: Viendo Actualmente */}
            {activeTab === "viendo" && (
              <div>
                {watchingItems.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-card">
                    <p className="text-base font-bold text-fg">
                      Aún no hay ningún anime en estado &quot;Viendo actualmente&quot;.
                    </p>
                    <p className="mt-1.5 text-sm text-fg-muted">
                      Cuando el grupo empiece una serie del foro, aparecerá destacada aquí para comentar cada episodio.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                    {watchingItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/anime/${item.id}`}
                        className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary hover:shadow-elevated transition-all flex flex-col shadow-card focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-surface-subtle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 right-2.5">
                            <span className="rounded-full bg-info-soft/95 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-info border border-info-border shadow-sm">
                              Viendo
                            </span>
                          </div>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <h3 className="text-sm sm:text-base font-bold text-fg group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-fg-muted">
                            <span>
                              {item.commentsCount}{" "}
                              {item.commentsCount === 1 ? "opinión" : "opiniones"}
                            </span>
                            <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform">
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

            {/* PESTAÑA 3: Mi Tier List */}
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

      {/* Footer compartido */}
      <SiteFooter />
    </div>
  );
}
