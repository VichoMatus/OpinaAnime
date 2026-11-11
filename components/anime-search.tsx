"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";

export interface CatalogAnime {
  id: string;
  externalId: string;
  title: string;
  titleEn?: string | null;
  imageUrl: string;
  type?: string | null;
  year?: number | null;
  mal_id?: number | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
}

export type JikanAnime = CatalogAnime;

interface AnimeSearchProps {
  onSelectAnime: (anime: CatalogAnime) => void;
  disabled?: boolean;
}

export default function AnimeSearch({ onSelectAnime, disabled = false }: AnimeSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [checkingItem, setCheckingItem] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [redirectNotice, setRedirectNotice] = useState("");

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      setSearchError("");
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setSearchError("");

      try {
        const res = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(trimmed)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "No pudimos consultar el catálogo en este momento.");
        }

        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : data.data || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload mixto de /api/catalog/search y /api/anime/search sin tipar
        const formatted: CatalogAnime[] = rawItems.map((item: any) => ({
          id: item.id,
          externalId: item.externalId,
          title: item.title,
          titleEn: item.titleEn || null,
          imageUrl: item.imageUrl,
          type: item.type || "TV",
          year: item.year || null,
          mal_id: parseInt(item.externalId, 10) || null,
          images: {
            jpg: {
              image_url: item.imageUrl,
              large_image_url: item.imageUrl,
            },
          },
        }));

        setResults(formatted);
        setHasSearched(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setSearchError(
          err instanceof Error ? err.message : "No se pudo conectar con el catálogo."
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query]);

  async function handleSelect(anime: CatalogAnime) {
    setCheckingItem(anime.id);
    setSearchError("");
    setRedirectNotice("");

    try {
      const checkParams = new URLSearchParams();
      if (anime.mal_id) checkParams.set("mal_id", String(anime.mal_id));
      checkParams.set("title", anime.title);

      const res = await fetch(`/api/recommendations/check?${checkParams.toString()}`);
      const data = await res.json();

      if (data.exists && data.recommendationId) {
        setRedirectNotice(`¡"${anime.title}" ya está en el foro! Llevándote a su debate...`);
        setTimeout(() => {
          router.push(`/anime/${data.recommendationId}?notice=already_exists`);
        }, 600);
        return;
      }

      onSelectAnime(anime);
      setQuery("");
      setResults([]);
      setHasSearched(false);
    } catch {
      setSearchError("No pudimos verificar si el anime ya está en el foro. Inténtalo de nuevo.");
    } finally {
      setCheckingItem(null);
    }
  }

  return (
    <div className="relative w-full font-sans">
      <div className="form-field">
        <label htmlFor={inputId} className="form-label">
          Buscar anime en el catálogo
        </label>

        <div className="relative">
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            placeholder="Ej. Frieren, Naruto, Attack on Titan..."
            className="field pl-10 pr-20"
            autoComplete="off"
          />
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
            <SearchIcon className="h-4 w-4" />
          </div>

          {loading && (
            <div className=" absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">
              Buscando...
            </div>
          )}
        </div>
      </div>

      {redirectNotice && (
        <div role="status" className="form-notice mt-3">
          <span>{redirectNotice}</span>
        </div>
      )}

      {searchError && (
        <div role="alert" className="form-error mt-3">
          <span>{searchError}</span>
        </div>
      )}

      {/* Estado vacío cuando no hay coincidencias */}
      {!loading && hasSearched && results.length === 0 && !searchError && query.trim().length >= 2 && (
        <div className="mt-2 rounded-xl border border-border bg-surface-subtle p-3.5 text-center text-xs text-fg-muted">
          No encontramos animes para <strong className="text-fg">&quot;{query.trim()}&quot;</strong>. Prueba con su título en japonés o inglés.
        </div>
      )}

      {/* Resultados desplegables */}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border-strong bg-surface shadow-modal">
          <div className="p-1.5 space-y-1">
            {results.map((anime) => (
              <button
                key={anime.id}
                type="button"
                onClick={() => handleSelect(anime)}
                disabled={checkingItem !== null}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-ring text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-12 h-16 object-cover rounded-md bg-surface-subtle shrink-0 border border-border"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-fg truncate">
                    {anime.title}
                  </h4>
                  {anime.titleEn && anime.titleEn !== anime.title && (
                    <p className="text-xs text-fg-muted truncate">{anime.titleEn}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-fg-subtle">
                    <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 font-medium text-fg-muted border border-border">
                      {anime.type ?? "TV"}
                    </span>
                    {anime.year && <span>{anime.year}</span>}
                    <span className="font-mono text-[11px]">
                      #{anime.externalId}
                    </span>
                  </div>
                </div>

                {checkingItem === anime.id && (
                  <span className="text-xs font-semibold text-primary shrink-0">
                    Verificando...
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
