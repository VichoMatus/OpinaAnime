"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { ExternalLinkIcon, TrashIcon, StarIcon, ThumbsUpIcon } from "@/components/icons";

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
  tier: "S" | "A" | "B" | "C" | "D" | "E" | null;
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
  votesCount: number;
  hasVoted: boolean;
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
    case "A":
      return "bg-danger-soft text-danger border-danger-border";
    case "B":
    case "C":
      return "bg-warning-soft text-warning border-warning-border";
    case "D":
    case "E":
      return "bg-success-soft text-success border-success-border";
    default:
      return "bg-surface-subtle text-fg-muted border-border-strong";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-warning-soft text-warning border-warning-border";
    case "WATCHING":
      return "bg-info-soft text-info border-info-border";
    case "COMPLETED":
      return "bg-success-soft text-success border-success-border";
    case "DROPPED":
    default:
      return "bg-surface-subtle text-fg-muted border-border-strong";
  }
}

export default function AnimeThread({
  recommendation: initialData,
  currentUser,
  notice,
}: AnimeThreadProps) {
  const router = useRouter();
  const commentTextareaId = useId();
  const adminTierId = useId();
  const adminStatusId = useId();
  const adminReviewId = useId();

  const [item, setItem] = useState<RecommendationDetail>(initialData);
  const [comments, setComments] = useState<CommentItem[]>(initialData.comments);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [adminTier, setAdminTier] = useState<string>(initialData.tier ?? "");
  const [adminStatus, setAdminStatus] = useState<string>(initialData.status);
  const [adminReviewText, setAdminReviewText] = useState<string>(initialData.adminReview ?? "");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [threadError, setThreadError] = useState("");

  const isAdmin = currentUser.role === "ADMIN";
  const isAuthor = item.authorId === currentUser.id;
  const canDeleteRecommendation = isAdmin || (isAuthor && comments.length === 0);

  // Actualización rápida directa de Tier o Estado
  async function handleQuickUpdate(updates: { tier?: "S" | "A" | "B" | "C" | "D" | "E" | null; status?: string }) {
    const prevTier = item.tier;
    const prevStatus = item.status;
    setThreadError("");

    setItem((prev) => ({ ...prev, ...updates }));
    if (updates.tier !== undefined) setAdminTier(updates.tier ?? "");
    if (updates.status !== undefined) setAdminStatus(updates.status);

    try {
      const res = await fetch(`/api/recommendations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setThreadError(errorData.error || "No se pudo actualizar el estado del anime.");
        setItem((prev) => ({ ...prev, tier: prevTier, status: prevStatus }));
      }
    } catch {
      setThreadError("Error de conexión al actualizar el anime.");
      setItem((prev) => ({ ...prev, tier: prevTier, status: prevStatus }));
    }
  }

  async function handleToggleVote() {
    const prevHasVoted = item.hasVoted;
    const prevVotesCount = item.votesCount;

    const newHasVoted = !prevHasVoted;
    const newVotesCount = newHasVoted ? prevVotesCount + 1 : Math.max(0, prevVotesCount - 1);

    setItem((prev) => ({
      ...prev,
      hasVoted: newHasVoted,
      votesCount: newVotesCount,
    }));

    try {
      const res = await fetch(`/api/recommendations/${item.id}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setItem((prev) => ({
          ...prev,
          hasVoted: data.hasVoted,
          votesCount: data.votesCount,
        }));
      } else {
        setItem((prev) => ({
          ...prev,
          hasVoted: prevHasVoted,
          votesCount: prevVotesCount,
        }));
      }
    } catch {
      setItem((prev) => ({
        ...prev,
        hasVoted: prevHasVoted,
        votesCount: prevVotesCount,
      }));
    }
  }

  async function handleAdminSave(e: React.FormEvent) {
    e.preventDefault();
    setAdminSaving(true);
    setAdminMessage(null);

    try {
      const res = await fetch(`/api/recommendations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: adminTier || null,
          status: adminStatus,
          adminReview: adminReviewText.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo guardar el veredicto.");
      }

      const updated = await res.json();
      setItem((prev) => ({
        ...prev,
        tier: updated.tier,
        status: updated.status,
        adminReview: updated.adminReview,
      }));
      setAdminMessage({
        text: "Veredicto, tier y estado guardados correctamente.",
        type: "success",
      });
      setTimeout(() => setAdminMessage(null), 4000);
    } catch (err: unknown) {
      setAdminMessage({
        text: err instanceof Error ? err.message : "Error al guardar los cambios.",
        type: "error",
      });
    } finally {
      setAdminSaving(false);
    }
  }

  async function handleDeleteRecommendation() {
    const confirmText = isAdmin
      ? "¿Estás seguro de eliminar este hilo como Administrador? Se borrará todo el hilo y sus comentarios."
      : "¿Estás seguro de que deseas eliminar tu recomendación?";

    if (!window.confirm(confirmText)) return;
    setThreadError("");

    try {
      const res = await fetch(`/api/recommendations/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setThreadError(data.error || "No se pudo eliminar la recomendación.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setThreadError("Error de conexión al intentar eliminar la recomendación.");
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentBody.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    setCommentError("");
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
        setCommentError(err.error || "No pudimos publicar tu comentario.");
      }
    } catch {
      setCommentError("Error de conexión al publicar tu comentario.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;
    setCommentError("");

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const err = await res.json();
        setCommentError(err.error || "No se pudo eliminar el comentario.");
      }
    } catch {
      setCommentError("Error de conexión al eliminar el comentario.");
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* Header compartido con botón Volver al foro */}
      <SiteHeader user={currentUser} showBackToForum />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {notice === "already_exists" && (
          <div role="status" className="form-notice mb-6 flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-fg">
                ¡Este anime ya estaba en la comunidad!
              </p>
              <p className="text-xs sm:text-sm text-fg-muted mt-0.5">
                Te trajimos directamente a su hilo para que puedas votar o dejar tu opinión.
              </p>
            </div>
          </div>
        )}

        {threadError && (
          <div role="alert" className="form-error mb-6 justify-between">
            <span>{threadError}</span>
            <button
              type="button"
              onClick={() => setThreadError("")}
              className="text-xs font-semibold underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Ficha Principal del Anime */}
        <article className="rounded-2xl border border-border bg-surface overflow-hidden shadow-elevated">
          <div className="p-5 sm:p-8 grid gap-6 sm:gap-8 md:grid-cols-[230px_1fr]">
            {/* Portada y Link externo */}
            <div className="space-y-3 max-w-[240px] mx-auto w-full md:max-w-none">
              <div className="overflow-hidden rounded-xl border border-border bg-surface-subtle shadow-card aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {item.mal_id && (
                <a
                  href={`https://myanimelist.net/anime/${item.mal_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full text-xs sm:text-sm"
                >
                  <span>Ver en MyAnimeList</span>
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Información y Fundamento */}
            <div className="flex flex-col justify-between min-w-0">
              <div>
                {/* Cabecera del Anime */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                      {item.title}
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-fg-muted">
                      Recomendado por{" "}
                      <span className="font-semibold text-fg">
                        {item.author.name || item.author.email}
                      </span>{" "}
                      el {new Date(item.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón de Voto / Me gusta */}
                    <button
                      type="button"
                      onClick={handleToggleVote}
                      className={`btn min-h-9 px-3.5 py-1.5 text-xs sm:text-sm ${
                        item.hasVoted
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                      title={item.hasVoted ? "Quitar mi voto" : "Apoyar esta recomendación"}
                    >
                      <ThumbsUpIcon className="w-4 h-4" filled={item.hasVoted} />
                      <span>
                        {item.votesCount} {item.votesCount === 1 ? "voto" : "votos"}
                      </span>
                    </button>

                    {/* Controles rápidos para Admin o Badges para usuarios */}
                    {isAdmin ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          aria-label="Cambiar Tier (Admin)"
                          value={item.tier ?? ""}
                          onChange={(e) =>
                            handleQuickUpdate({
                              tier: (e.target.value as "S" | "A" | "B" | "C" | "D" | "E") || null,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border cursor-pointer focus-visible:outline-2 focus-visible:outline-ring ${getTierBadgeClass(
                            item.tier
                          )}`}
                          title="Cambiar Tier (Admin)"
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
                          aria-label="Cambiar estado (Admin)"
                          value={item.status}
                          onChange={(e) =>
                            handleQuickUpdate({
                              status: e.target.value,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border cursor-pointer focus-visible:outline-2 focus-visible:outline-ring ${getStatusBadgeClass(
                            item.status
                          )}`}
                          title="Cambiar estado (Admin)"
                        >
                          <option value="PENDING">Lo veré</option>
                          <option value="WATCHING">Viendo</option>
                          <option value="COMPLETED">Terminado</option>
                          <option value="DROPPED">Descartado</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getTierBadgeClass(
                            item.tier
                          )}`}
                        >
                          {item.tier ? `Tier ${item.tier}` : "Sin tier"}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </span>
                      </>
                    )}

                    {/* Botón para borrar recomendación */}
                    {canDeleteRecommendation && (
                      <button
                        type="button"
                        onClick={handleDeleteRecommendation}
                        title="Eliminar recomendación"
                        aria-label="Eliminar recomendación"
                        className="btn btn-danger min-h-9 px-2.5 py-1.5 text-xs"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fundamento original del usuario */}
                <div className="mt-6">
                  <h2 className="text-xs uppercase tracking-wider text-fg-muted font-bold mb-2.5">
                    ¿Por qué lo recomienda {item.author.name || "este miembro"}?
                  </h2>
                  <div className="rounded-xl bg-surface-subtle border border-border p-4 sm:p-5">
                    <p className="text-fg text-base leading-relaxed whitespace-pre-wrap">
                      {item.rationale}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reseña Final del Administrador */}
          {item.adminReview && (
            <div className="border-t border-border bg-warning-soft/50 p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-warning" />
                  <h2 className="text-sm sm:text-base font-extrabold text-fg">
                    Reseña Final del Administrador
                  </h2>
                </div>
                {item.tier && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full border font-bold ${getTierBadgeClass(
                      item.tier
                    )}`}
                  >
                    Veredicto: Tier {item.tier}
                  </span>
                )}
              </div>
              <blockquote className="text-fg text-base leading-relaxed italic bg-surface p-4 sm:p-5 rounded-xl border border-warning-border shadow-card">
                &quot;{item.adminReview}&quot;
              </blockquote>
            </div>
          )}

          {/* Panel de Moderación y Veredicto exclusivo de Admin */}
          {isAdmin && (
            <div className="border-t border-border bg-surface-subtle/60 p-5 sm:p-8">
              <h2 className="text-base font-extrabold text-fg mb-4">
                Panel de Veredicto y Moderación (Admin)
              </h2>

              <form onSubmit={handleAdminSave} className="form-stack">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-field">
                    <label htmlFor={adminTierId} className="form-label">
                      Asignar Tier
                    </label>
                    <select
                      id={adminTierId}
                      value={adminTier}
                      onChange={(e) => setAdminTier(e.target.value)}
                      className="field"
                    >
                      <option value="">Sin tier asignado</option>
                      <option value="S">Tier S (Obra maestra)</option>
                      <option value="A">Tier A (Excelente)</option>
                      <option value="B">Tier B (Muy bueno / Recomendable)</option>
                      <option value="C">Tier C (Entretenido / Cumple)</option>
                      <option value="D">Tier D (Regular)</option>
                      <option value="E">Tier E (Flojo)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor={adminStatusId} className="form-label">
                      Estado de visualización
                    </label>
                    <select
                      id={adminStatusId}
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="field"
                    >
                      <option value="PENDING">Lo veré (Pendiente)</option>
                      <option value="WATCHING">Viendo actualmente</option>
                      <option value="COMPLETED">Terminado</option>
                      <option value="DROPPED">Descartado</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor={adminReviewId} className="form-label">
                    Reseña final del Administrador
                  </label>
                  <textarea
                    id={adminReviewId}
                    rows={3}
                    required={adminStatus === "COMPLETED"}
                    value={adminReviewText}
                    onChange={(e) => setAdminReviewText(e.target.value)}
                    placeholder={
                      adminStatus === "COMPLETED"
                        ? "Escribe tu conclusión antes de marcar el anime como Terminado (obligatorio)..."
                        : "Comparte tu análisis final y conclusión sobre la serie..."
                    }
                    className="field resize-none"
                  />
                </div>

                {adminMessage && (
                  <div
                    role={adminMessage.type === "error" ? "alert" : "status"}
                    className={adminMessage.type === "error" ? "form-error" : "form-notice"}
                  >
                    <span>{adminMessage.text}</span>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={adminSaving}
                    className="btn btn-primary"
                  >
                    {adminSaving ? "Guardando veredicto..." : "Guardar cambios de Admin"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </article>

        {/* Sección de Debate / Opiniones */}
        <section className="mt-10">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-fg tracking-tight">
              Hilos de Debate ({comments.length})
            </h2>
          </div>

          {/* Formulario de nuevo comentario */}
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-card space-y-3">
              <div className="form-field">
                <label htmlFor={commentTextareaId} className="form-label">
                  Suma tu opinión a la conversación
                </label>
                <textarea
                  id={commentTextareaId}
                  required
                  rows={3}
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  placeholder="Comparte qué te pareció este anime, tu escena favorita o por qué vale la pena verlo (¡sin spoilers!)..."
                  className="field resize-none"
                />
              </div>

              {commentError && (
                <div role="alert" className="form-error">
                  <span>{commentError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting || !newCommentBody.trim()}
                  className="btn btn-primary"
                >
                  {commentSubmitting ? "Publicando..." : "Publicar Comentario"}
                </button>
              </div>
            </div>
          </form>

          {/* Lista de comentarios */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10 text-center shadow-card">
                <p className="text-base font-bold text-fg">
                  Aún no hay opiniones, ¡sé el primero!
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  Aún no hay comentarios en este debate. ¡Comparte qué te pareció arriba!
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = comment.authorId === currentUser.id;
                const canDelete = isAdmin || isCommentAuthor;

                return (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-fg-muted mb-3 pb-2.5 border-b border-border">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-fg">
                          {comment.author.name || comment.author.email}
                        </span>
                        {comment.author.role === "ADMIN" && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/25">
                            ADMIN
                          </span>
                        )}
                        <span aria-hidden="true">•</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Eliminar comentario"
                          aria-label="Eliminar comentario"
                          className="p-1.5 rounded-lg text-fg-subtle hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-fg text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Footer compartido */}
      <SiteFooter />
    </div>
  );
}
