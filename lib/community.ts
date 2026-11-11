// Configuración compartida de la comunidad (cliente y servidor).

/** Nombre del dueño del foro, al que la comunidad le recomienda animes. */
export const OWNER_NAME = "Vicente Matus";

/** Largo mínimo y máximo del fundamento de una recomendación. */
export const RATIONALE_MIN = 60;
export const RATIONALE_MAX = 1500;

/** Largo máximo de un comentario o respuesta. */
export const COMMENT_MAX = 2000;

export const STATUSES = ["RECOMMENDED", "PENDING", "WATCHING", "COMPLETED", "DROPPED"] as const;
export type AnimeStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  RECOMMENDED: "Recomendación",
  PENDING: "Lo veré",
  WATCHING: "Viendo actualmente",
  COMPLETED: "Terminado",
  DROPPED: "Descartado",
};

export function isAnimeStatus(value: unknown): value is AnimeStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "RECOMMENDED":
      return "bg-primary-soft text-primary border-primary/40";
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

/** Valida el fundamento; devuelve un mensaje de error o null. */
export function validateRationale(text: string): string | null {
  const length = text.trim().length;
  if (length < RATIONALE_MIN) {
    return `Cuéntanos un poco más: el motivo debe tener al menos ${RATIONALE_MIN} caracteres (llevas ${length}).`;
  }
  if (length > RATIONALE_MAX) {
    return `El motivo es demasiado largo (máximo ${RATIONALE_MAX} caracteres).`;
  }
  return null;
}
