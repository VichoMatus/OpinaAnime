"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon, TrashIcon, StarIcon } from "@/components/icons";

export type Role = "ADMIN" | "USER";

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string | Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
}

export interface RecommendationDetail {
  id: string;
  mal_id: number | null;
  title: string;
  imageUrl: string;
  rationale: string;
  adminReview: string | null;
  tier: "S" | "A" | "B" | "C" | null;
  status: "PENDING" | "WATCHING" | "COMPLETED" | "DROPPED" | string;
  createdAt: string | Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
  comments: CommentItem[];
}

interface AnimeThreadProps {
  recommendation: RecommendationDetail;
  currentUser: UserSession;
  notice?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "Lo veré",
  WATCHING: "Viendo actualmente",
  COMPLETED: "Terminado",
  DROPPED: "Descartado",
};

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

export default function AnimeThread({
  recommendation: initialData,
  currentUser,
  notice,
}: AnimeThreadProps) {
  const router = useRouter();
  const [item, setItem] = useState<RecommendationDetail>(initialData);
  const [comments, setComments] = useState<CommentItem[]>(initialData.comments);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Estados del panel de Admin
  const [adminTier, setAdminTier] = useState<string>(initialData.tier ?? "");
  const [adminStatus, setAdminStatus] = useState<string>(initialData.status);
  const [adminReviewText, setAdminReviewText] = useState<string>(initialData.adminReview ?? "");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const isAdmin = currentUser.role === "ADMIN";
  const isAuthor = item.authorId === currentUser.id;

  // Regla de moderación para borrar la recomendación:
  // Admin puede siempre. Autor puede solo si nadie ha comentado todavía.
  const canDeleteRecommendation = isAdmin || (isAuthor && comments.length === 0);

  // Guardar cambios de Administración (Tier, Estado, AdminReview)
  async function handleAdminSave(e: React.FormEvent) {
    e.preventDefault();
    setAdminSaving(true);
    setAdminMessage("");

    try {
      const res = await fetch(`/api/recommendations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: adminTier || null,
          status: adminStatus,
          adminReview: adminStatus === "COMPLETED" ? adminReviewText : adminReviewText || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar.");
      }

      const updated = await res.json();
      setItem((prev) => ({
        ...prev,
        tier: updated.tier,
        status: updated.status,
        adminReview: updated.adminReview,
      }));
      setAdminMessage("Veredicto y estado actualizados correctamente.");
      setTimeout(() => setAdminMessage(""), 4000);
    } catch (err: unknown) {
      setAdminMessage(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setAdminSaving(false);
    }
  }

  // Eliminar recomendación (Moderación)
  async function handleDeleteRecommendation() {
    const confirmText = isAdmin
      ? "¿Estás seguro de eliminar esta recomendación como Administrador? Se borrará todo el hilo y sus comentarios."
      : "¿Estás seguro de que deseas eliminar tu recomendación?";

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/recommendations/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo eliminar la recomendación.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      alert("Error al procesar la eliminación.");
    }
  }

  // Enviar comentario
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentBody.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/recommendations/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newCommentBody }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setNewCommentBody("");
      } else {
        const err = await res.json();
        alert(err.error || "Error al publicar comentario.");
      }
    } catch {
      alert("Error de red al comentar.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  // Eliminar comentario (Moderación)
  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const err = await res.json();
        alert(err.error || "No se pudo eliminar el comentario.");
      }
    } catch {
      alert("Error de red al eliminar el comentario.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors font-sans"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Volver al Foro</span>
          </Link>

          <div className="flex items-center gap-3 font-sans text-xs">
            <span className="text-zinc-400">{currentUser.name || currentUser.email}</span>
            {isAdmin && (
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-400 border border-indigo-500/30">
                ADMIN
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Aviso de anime existente (si fue redirigido por búsqueda duplicada) */}
        {notice === "already_exists" && (
          <div className="mb-6 rounded-lg bg-indigo-950/60 border border-indigo-500/60 p-4 text-indigo-200 text-sm font-sans flex items-center justify-between">
            <div>
              <p className="font-semibold text-indigo-100">
                ⚡ ¡Este anime ya fue recomendado anteriormente!
              </p>
              <p className="text-xs text-indigo-300 mt-0.5">
                Te hemos redirigido a su hilo oficial para que puedas leer las opiniones y participar en el debate.
              </p>
            </div>
          </div>
        )}

        {/* Ficha Principal del Anime */}
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 grid gap-8 md:grid-cols-[220px_1fr]">
            {/* Poster del anime */}
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-md">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-72 md:h-80 object-cover"
                />
              </div>

              {item.mal_id && (
                <a
                  href={`https://myanimelist.net/anime/${item.mal_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-950 border border-zinc-700 text-xs font-sans text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  <span>Ver en MyAnimeList</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Información y Fundamento */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Cabecera: Título, Autor y Badges */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-serif text-zinc-100">{item.title}</h1>
                    <p className="mt-1 font-sans text-xs text-zinc-400">
                      Recomendado por{" "}
                      <span className="text-zinc-200 font-medium">
                        {item.author.name || item.author.email}
                      </span>{" "}
                      el {new Date(item.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md font-semibold border ${getTierBadgeClass(
                        item.tier
                      )}`}
                    >
                      {item.tier ? `Tier ${item.tier}` : "Sin tier"}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md font-semibold border ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {statusLabels[item.status] ?? item.status}
                    </span>

                    {/* Botón de Moderación para borrar el anime */}
                    {canDeleteRecommendation && (
                      <button
                        onClick={handleDeleteRecommendation}
                        title="Eliminar recomendación"
                        className="ml-2 p-1.5 rounded-md border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-rose-400 hover:border-rose-600 transition-colors cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fundamento original del usuario */}
                <div className="mt-6">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">
                    Fundamento de la Recomendación
                  </h3>
                  <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-4">
                    <p className="text-zinc-200 font-serif text-base leading-relaxed whitespace-pre-wrap">
                      {item.rationale}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reseña Final del Administrador (si ya fue escrita) */}
          {item.adminReview && (
            <div className="border-t border-zinc-800 bg-gradient-to-br from-indigo-950/30 to-zinc-900 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <StarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-sans text-sm uppercase tracking-wider font-bold text-amber-300">
                  Reseña Final del Administrador
                </h3>
                {item.tier && (
                  <span
                    className={`ml-auto font-sans text-xs px-2.5 py-0.5 rounded border font-semibold ${getTierBadgeClass(
                      item.tier
                    )}`}
                  >
                    Veredicto: Tier {item.tier}
                  </span>
                )}
              </div>
              <p className="text-zinc-200 font-serif text-base leading-relaxed italic bg-zinc-950/50 p-5 rounded-lg border border-indigo-900/40">
                "{item.adminReview}"
              </p>
            </div>
          )}

          {/* Panel de Gestión Exclusivo para ADMIN */}
          {isAdmin && (
            <div className="border-t border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 font-sans">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                  Panel de Moderación & Veredicto (Admin)
                </h3>
                <span className="text-xs text-zinc-500">Solo visible para administradores</span>
              </div>

              <form onSubmit={handleAdminSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Estado de visualización:</label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="PENDING">Lo veré</option>
                      <option value="WATCHING">Viendo actualmente</option>
                      <option value="COMPLETED">Terminado (Habilita Reseña)</option>
                      <option value="DROPPED">Descartado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Clasificación Tier:</label>
                    <select
                      value={adminTier}
                      onChange={(e) => setAdminTier(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Sin tier</option>
                      <option value="S">Tier S (Obra Maestra)</option>
                      <option value="A">Tier A (Excelente)</option>
                      <option value="B">Tier B (Bueno)</option>
                      <option value="C">Tier C (Regular / Pasable)</option>
                    </select>
                  </div>
                </div>

                {/* Textarea exclusivo de Reseña Final cuando el estado es COMPLETED */}
                {adminStatus === "COMPLETED" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-semibold text-amber-400">
                      Reseña y Veredicto Final del Administrador:
                    </label>
                    <textarea
                      rows={4}
                      value={adminReviewText}
                      onChange={(e) => setAdminReviewText(e.target.value)}
                      placeholder="Escribe tu análisis final, opinión y justificación del tier para que toda la comunidad lo vea..."
                      className="w-full bg-zinc-900 border border-amber-500/40 text-zinc-100 placeholder-zinc-500 rounded-md p-3 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={adminSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-5 py-2.5 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {adminSaving ? "Guardando..." : "Guardar Veredicto del Admin"}
                  </button>
                  {adminMessage && (
                    <span className="text-xs text-indigo-300 font-sans">{adminMessage}</span>
                  )}
                </div>
              </form>
            </div>
          )}
        </article>

        {/* Sección de Debate / Comentarios */}
        <section className="mt-10 font-sans">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-6">
            <h2 className="text-xl font-serif text-zinc-100">
              Debate de la Comunidad ({comments.length})
            </h2>
            <span className="text-xs text-zinc-400">Opina con respeto y sin spoilers graves</span>
          </div>

          {/* Formulario para publicar nuevo comentario */}
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Añadir tu opinión al debate:
              </label>
              <textarea
                required
                rows={3}
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="¿Estás de acuerdo con esta recomendación? ¿Vale la pena verla? Comparte tu punto de vista..."
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {commentSubmitting ? "Publicando..." : "Publicar Comentario"}
                </button>
              </div>
            </div>
          </form>

          {/* Lista de comentarios */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400 text-sm">
                Aún no hay comentarios en este debate. ¡Sé el primero en opinar!
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = comment.authorId === currentUser.id;
                const canDeleteComment = isAdmin || isCommentAuthor;

                return (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200 text-sm">
                          {comment.author.name || comment.author.email}
                        </span>

                        {comment.author.role === "ADMIN" && (
                          <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/30">
                            ADMIN
                          </span>
                        )}

                        {comment.authorId === item.authorId && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-700">
                            Autor del hilo
                          </span>
                        )}

                        <span className="text-xs text-zinc-500">
                          {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Botón de Moderación para borrar comentario */}
                      {canDeleteComment && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          title={
                            isAdmin && !isCommentAuthor
                              ? "Eliminar comentario como Moderador/Admin"
                              : "Eliminar tu comentario"
                          }
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
