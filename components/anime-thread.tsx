"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon, TrashIcon, StarIcon, ThumbsUpIcon } from "@/components/icons";

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

  const [adminTier, setAdminTier] = useState<string>(initialData.tier ?? "");
  const [adminStatus, setAdminStatus] = useState<string>(initialData.status);
  const [adminReviewText, setAdminReviewText] = useState<string>(initialData.adminReview ?? "");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const isAdmin = currentUser.role === "ADMIN";
  const isAuthor = item.authorId === currentUser.id;
  const canDeleteRecommendation = isAdmin || (isAuthor && comments.length === 0);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  // Actualización rápida directa de Tier o Estado
  async function handleQuickUpdate(updates: { tier?: "S" | "A" | "B" | "C" | "D" | "E" | null; status?: string }) {
    const prevTier = item.tier;
    const prevStatus = item.status;

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
        alert(errorData.error || "No se pudo actualizar.");
        setItem((prev) => ({ ...prev, tier: prevTier, status: prevStatus }));
      }
    } catch {
      alert("Error de red al actualizar.");
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
    setAdminMessage("");

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
        throw new Error(errorData.error || "Error al actualizar.");
      }

      const updated = await res.json();
      setItem((prev) => ({
        ...prev,
        tier: updated.tier,
        status: updated.status,
        adminReview: updated.adminReview,
      }));
      setAdminMessage("Veredicto, tier y categoría guardados correctamente.");
      setTimeout(() => setAdminMessage(""), 4000);
    } catch (err: unknown) {
      setAdminMessage(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setAdminSaving(false);
    }
  }

  async function handleDeleteRecommendation() {
    const confirmText = isAdmin
      ? "¿Estás seguro de eliminar este hilo como Administrador? Se borrará todo el hilo y sus comentarios."
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
    <div className="min-h-screen bg-[#0a0b0e] text-zinc-100 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-[#1f2128] bg-[#0e0f14] sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Volver al Foro</span>
          </Link>

          <Link href="/" className="cursor-pointer">
            <span className="text-lg font-bold tracking-wider text-white uppercase">
              OPINANIME
            </span>
          </Link>

          <div className="flex items-center gap-3 font-sans text-xs">
            <span className="text-zinc-400">{currentUser.name || currentUser.email}</span>
            {isAdmin && (
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                ADMIN
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {notice === "already_exists" && (
          <div className="mb-6 rounded-lg bg-blue-950/30 border border-blue-500/40 p-4 text-blue-200 text-sm font-sans flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">
                Este anime ya está registrado en el foro.
              </p>
              <p className="text-xs text-blue-300 mt-0.5">
                Te hemos redirigido a su hilo para debatir y votar.
              </p>
            </div>
          </div>
        )}

        {/* Ficha Principal del Anime */}
        <article className="rounded-xl border border-[#22242a] bg-[#121318] overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 grid gap-8 md:grid-cols-[220px_1fr]">
            {/* Poster */}
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
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
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#181920] border border-zinc-700 text-xs font-sans text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  <span>Ver en MyAnimeList</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Información y Fundamento */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Cabecera */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1f2128] pb-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{item.title}</h1>
                    <p className="mt-1 font-sans text-xs text-zinc-400">
                      Recomendado por{" "}
                      <span className="text-zinc-200">
                        {item.author.name || item.author.email}
                      </span>{" "}
                      el {new Date(item.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
                    {/* Botón de Like / Upvote interactivo */}
                    <button
                      type="button"
                      onClick={handleToggleVote}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold border transition-colors cursor-pointer ${
                        item.hasVoted
                          ? "bg-rose-600 text-white border-rose-500"
                          : "bg-[#181920] border-[#2a2c35] text-zinc-300 hover:text-white hover:border-zinc-500"
                      }`}
                      title={item.hasVoted ? "Quitar me gusta" : "Apoyar esta recomendación"}
                    >
                      <ThumbsUpIcon className="w-4 h-4" filled={item.hasVoted} />
                      <span>{item.votesCount}</span>
                    </button>

                    {/* Controles interactivos para Admin */}
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={item.tier ?? ""}
                          onChange={(e) =>
                            handleQuickUpdate({
                              tier: (e.target.value as "S" | "A" | "B" | "C" | "D" | "E") || null,
                            })
                          }
                          className={`px-2 py-1 rounded-md font-semibold text-xs border cursor-pointer ${getTierBadgeClass(
                            item.tier
                          )} bg-[#121318] focus:outline-none`}
                          title="Cambiar Tier (Admin)"
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

                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleQuickUpdate({
                              status: e.target.value,
                            })
                          }
                          className={`px-2 py-1 rounded-md font-medium text-xs border cursor-pointer ${getStatusBadgeClass(
                            item.status
                          )} bg-[#121318] focus:outline-none`}
                          title="Mover categoría / estado (Admin)"
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

                    {/* Botón de Moderación para borrar */}
                    {canDeleteRecommendation && (
                      <button
                        onClick={handleDeleteRecommendation}
                        title="Eliminar recomendación"
                        className="ml-1 p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-600 transition-colors cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Fundamento original del usuario */}
                <div className="mt-6">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">
                    Fundamento de la Recomendación
                  </h3>
                  <div className="rounded-lg bg-[#0a0b0e] border border-[#22242a] p-4">
                    <p className="text-zinc-200 text-base leading-relaxed whitespace-pre-wrap">
                      {item.rationale}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reseña Final del Administrador */}
          {item.adminReview && (
            <div className="border-t border-[#1f2128] bg-[#0e0f14] p-6 sm:p-8">
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
              <p className="text-zinc-200 text-base leading-relaxed italic bg-[#121318] p-5 rounded-lg border border-[#22242a]">
                "{item.adminReview}"
              </p>
            </div>
          )}

          {/* Panel de Moderación y Veredicto exclusivo de Admin */}
          {isAdmin && (
            <div className="border-t border-[#1f2128] bg-[#101116] p-6 sm:p-8 font-sans">
              <h3 className="text-sm uppercase tracking-wider font-bold text-zinc-300 mb-4">
                Panel de Veredicto (Admin)
              </h3>

              <form onSubmit={handleAdminSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">
                      Asignar Tier:
                    </label>
                    <select
                      value={adminTier}
                      onChange={(e) => setAdminTier(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Sin tier asignado</option>
                      <option value="S">Tier S (Obra Maestra)</option>
                      <option value="A">Tier A (Excelente)</option>
                      <option value="B">Tier B (Bueno / Recomendable)</option>
                      <option value="C">Tier C (Regular / Pasable)</option>
                      <option value="D">Tier D (Mediocre)</option>
                      <option value="E">Tier E (Malo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">
                      Estado de Visualización:
                    </label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="PENDING">Lo veré (Pendiente)</option>
                      <option value="WATCHING">Viendo actualmente</option>
                      <option value="COMPLETED">Terminado</option>
                      <option value="DROPPED">Descartado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase">
                    Reseña Final del Administrador:
                  </label>
                  <textarea
                    rows={3}
                    required={adminStatus === "COMPLETED"}
                    value={adminReviewText}
                    onChange={(e) => setAdminReviewText(e.target.value)}
                    placeholder={
                      adminStatus === "COMPLETED"
                        ? "Debes escribir tu opinión final antes de marcar el anime como Terminado (Obligatorio)..."
                        : "Escribe tu análisis final, opinión y conclusión al terminar el anime..."
                    }
                    className="w-full bg-[#0a0b0e] border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {adminMessage && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-lg">
                    {adminMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={adminSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {adminSaving ? "Guardando veredicto..." : "Guardar Cambios de Admin"}
                </button>
              </form>
            </div>
          )}
        </article>

        {/* Sección de Debate / Comentarios */}
        <section className="mt-10 font-sans">
          <div className="flex items-center justify-between border-b border-[#1f2128] pb-3 mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Hilos de Debate ({comments.length})
            </h2>
          </div>

          {/* Formulario de nuevo comentario */}
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="bg-[#121318] border border-[#22242a] rounded-xl p-4 shadow-sm">
              <textarea
                required
                rows={3}
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Comparte tu opinión sin spoilers..."
                className="w-full bg-[#0a0b0e] border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting || !newCommentBody.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {commentSubmitting ? "Comentando..." : "Publicar Comentario"}
                </button>
              </div>
            </div>
          </form>

          {/* Lista de comentarios */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-xl border border-[#22242a] bg-[#121318] p-8 text-center text-zinc-400 text-sm">
                Aún no hay comentarios en este debate. ¡Sé el primero en opinar!
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = comment.authorId === currentUser.id;
                const canDelete = isAdmin || isCommentAuthor;

                return (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-[#22242a] bg-[#121318] p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 pb-2 border-b border-[#1f2128]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">
                          {comment.author.name || comment.author.email}
                        </span>
                        {comment.author.role === "ADMIN" && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                            ADMIN
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Eliminar comentario"
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
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
