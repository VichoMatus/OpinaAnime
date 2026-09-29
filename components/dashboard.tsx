"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "USER";
};

type Comment = {
  id: string;
  body: string;
  author: {
    name: string | null;
    email: string;
  };
};

type Recommendation = {
  id: string;
  title: string;
  imageUrl: string;
  rationale: string;
  tier: "S" | "A" | "B" | "C" | null;
  status: string;
  author: {
    name: string | null;
    email: string;
  };
  comments: Comment[];
};

interface DashboardProps {
  user: User;
  initialRecommendations: Recommendation[];
  session?: {
    user: User;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "Lo veré",
  WATCHING: "Viendo",
  COMPLETED: "Terminados",
  DROPPED: "Descartados",
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
      return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
    case "B":
      return "bg-blue-500/10 text-blue-300 border-blue-500/30";
    case "C":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    default:
      return "bg-zinc-800/80 text-zinc-400 border-zinc-700/80";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "WATCHING":
      return "bg-sky-500/10 text-sky-300 border-sky-500/30";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "DROPPED":
      return "bg-rose-500/10 text-rose-300 border-rose-500/30";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

export default function Dashboard({
  user,
  initialRecommendations,
  session: propSession,
}: DashboardProps) {
  // Obtenemos la sesión actual
  const session = propSession ?? { user };
  const isAdmin = session?.user?.role === "ADMIN";

  const [items, setItems] = useState<Recommendation[]>(initialRecommendations);
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function addRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await result.json();
    if (!result.ok) return setNotice(data.error);
    setItems([
      { ...data, author: { name: user.name, email: user.email ?? "" }, comments: [] },
      ...items,
    ]);
    form.reset();
    setNotice("Recomendación publicada.");
  }

  async function updateItem(id: string, field: "tier" | "status", value: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const tier = (value || null) as Recommendation["tier"];
    const data = {
      tier: field === "tier" ? tier : item.tier,
      status: field === "status" ? value : item.status,
    };
    const result = await fetch(`/api/recommendations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (result.ok) {
      setItems(items.map((entry) => (entry.id === id ? { ...entry, ...data } : entry)));
    }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await fetch(`/api/recommendations/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const comment = await result.json();
    if (result.ok) {
      setItems(
        items.map((entry) =>
          entry.id === id ? { ...entry, comments: [...entry.comments, comment] } : entry
        )
      );
      form.reset();
    }
  }

  // Filtrado de recomendaciones según el estado seleccionado (exclusivo Admin o global)
  const filteredItems = items.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header / Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-sans text-indigo-400 font-bold tracking-widest text-sm uppercase">
              OPINAANIME
            </p>
            <h1 className="mt-0.5 text-lg sm:text-xl font-serif text-zinc-100">
              La lista que estamos construyendo.
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

      {/* Main Content Layout */}
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[300px_1fr]">
        {/* Columna Lateral: Tarjeta Nueva Recomendación */}
        <aside>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 sticky top-24">
            <p className="font-sans text-xs uppercase tracking-[.2em] text-zinc-400 font-semibold">
              Nueva recomendación
            </p>
            <form onSubmit={addRecommendation} className="mt-4 space-y-3 font-sans">
              <div>
                <input
                  required
                  name="title"
                  placeholder="Título del anime"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <input
                  required
                  name="imageUrl"
                  type="url"
                  placeholder="URL de imagen"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <textarea
                  required
                  name="rationale"
                  rows={5}
                  placeholder="¿Por qué debería verlo?"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors rounded-md py-2.5 px-4 font-medium text-sm cursor-pointer shadow-sm"
              >
                Publicar
              </button>
            </form>
            {notice && (
              <p className="mt-3 font-sans text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 rounded p-2.5">
                {notice}
              </p>
            )}
          </div>
        </aside>

        {/* Feed de Recomendaciones */}
        <section>
          {/* Header del Feed */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-[.2em] text-zinc-500">
                Recomendaciones
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-serif text-zinc-100">
                Argumentos para ver algo nuevo.
              </p>
            </div>
            <span className="font-sans text-sm text-zinc-400">
              {filteredItems.length} {filteredItems.length === 1 ? "título" : "títulos"}
            </span>
          </div>

          {/* Fila de Filtros (Exclusivo Administrador) */}
          {session?.user?.role === "ADMIN" && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-medium text-zinc-400 mr-1">
                Filtrar estado:
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

          {/* Feed Cards */}
          <div className="space-y-6">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400 font-sans text-sm">
                No hay recomendaciones disponibles para el filtro seleccionado.
              </div>
            ) : (
              filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="reveal bg-zinc-900 border border-zinc-800 rounded-lg p-6 grid gap-6 md:grid-cols-[160px_1fr]"
                >
                  {/* Imagen del anime */}
                  <div className="overflow-hidden rounded-md bg-zinc-950 flex items-center justify-center h-48 md:h-full">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover rounded-md transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="flex flex-col justify-between">
                    <div>
                      {/* Cabecera de la tarjeta: Título e Insignias */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-serif text-zinc-100">
                            {item.title}
                          </h2>
                          <p className="mt-1 font-sans text-xs text-zinc-400">
                            Por {item.author.name || item.author.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 font-sans text-xs">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium border ${getTierBadgeClass(
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
                        </div>
                      </div>

                      {/* Argumento de la recomendación */}
                      <p className="mt-4 leading-7 text-zinc-300 font-serif text-base">
                        {item.rationale}
                      </p>
                    </div>

                    {/* Controles Condicionales: Admin (selects) vs User (insignias informativas) */}
                    <div className="mt-5 pt-4 border-t border-zinc-800/80">
                      {session?.user?.role === "ADMIN" ? (
                        <div className="flex flex-wrap items-center gap-3 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 font-sans text-xs">
                          <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px]">
                            Gestión Admin:
                          </span>
                          <div className="flex items-center gap-2">
                            <label htmlFor={`tier-${item.id}`} className="text-zinc-400">
                              Tier:
                            </label>
                            <select
                              id={`tier-${item.id}`}
                              value={item.tier ?? ""}
                              onChange={(event) => updateItem(item.id, "tier", event.target.value)}
                              className="bg-zinc-950 border border-zinc-700 text-zinc-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded px-2.5 py-1 text-xs outline-none"
                            >
                              <option value="">Sin tier</option>
                              {["S", "A", "B", "C"].map((tier) => (
                                <option key={tier} value={tier}>
                                  Tier {tier}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label htmlFor={`status-${item.id}`} className="text-zinc-400">
                              Estado:
                            </label>
                            <select
                              id={`status-${item.id}`}
                              value={item.status}
                              onChange={(event) => updateItem(item.id, "status", event.target.value)}
                              className="bg-zinc-950 border border-zinc-700 text-zinc-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded px-2.5 py-1 text-xs outline-none"
                            >
                              <option value="PENDING">Lo veré</option>
                              <option value="WATCHING">Viendo</option>
                              <option value="COMPLETED">Terminados</option>
                              <option value="DROPPED">Descartados</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 font-sans text-xs text-zinc-400">
                          <span className="text-zinc-500">Clasificación:</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium border ${getTierBadgeClass(
                              item.tier
                            )}`}
                          >
                            {item.tier ? `Tier ${item.tier}` : "Sin clasificar"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium border ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {statusLabels[item.status] ?? item.status}
                          </span>
                        </div>
                      )}

                      {/* Hilo de debate / comentarios */}
                      <div className="mt-4">
                        {item.comments.length > 0 && (
                          <div className="space-y-2 font-sans text-sm mb-3">
                            {item.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-zinc-950/40 rounded px-3 py-2 border border-zinc-800/60"
                              >
                                <span className="font-semibold text-zinc-300">
                                  {comment.author.name || comment.author.email}:
                                </span>{" "}
                                <span className="text-zinc-400">{comment.body}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <form
                          onSubmit={(event) => addComment(event, item.id)}
                          className="flex gap-2 font-sans"
                        >
                          <input
                            required
                            name="body"
                            placeholder="Apoya o debate esta recomendación..."
                            className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                          <button
                            type="submit"
                            className="border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white px-4 py-2 text-sm rounded-md transition-colors cursor-pointer"
                          >
                            Comentar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
