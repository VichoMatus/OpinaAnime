"use client";

import { useState, useEffect, useRef } from "react";
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
  // Compatibilidad hacia atrás con el formulario de recomendaciones
  mal_id?: number | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
}

// Alias para preservar compatibilidad con imports anteriores
export type JikanAnime = CatalogAnime;

interface AnimeSearchProps {
  onSelectAnime: (anime: CatalogAnime) => void;
  disabled?: boolean;
}

export default function AnimeSearch({ onSelectAnime, disabled = false }: AnimeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogAnime[]>([]);
  const [loading, setLoading] = useState(false);
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
        // Consulta directa al catálogo propio en PostgreSQL
        const res = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(trimmed)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al consultar el catálogo interno.");
        }

        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : data.data || [];

        // Mapear elementos a la estructura de CatalogAnime
        const formatted: CatalogAnime[] = rawItems.map((item: {
          id: string;
          externalId: string;
          title: string;
          titleEn?: string | null;
          imageUrl: string;
          type?: string | null;
          year?: number | null;
        }) => ({
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
      // 1. Consultar a la API interna si el anime ya fue registrado en el foro
      const checkParams = new URLSearchParams();
      if (anime.mal_id) checkParams.set("mal_id", String(anime.mal_id));
      checkParams.set("title", anime.title);

      const res = await fetch(`/api/recommendations/check?${checkParams.toString()}`);
      const data = await res.json();

      if (data.exists && data.recommendationId) {
        // 2. Si ya existe, avisar y redirigir al hilo del anime
        setRedirectNotice(`¡"${anime.title}" ya existe en el foro! Redirigiendo al hilo...`);
        setTimeout(() => {
          router.push(`/anime/${data.recommendationId}?notice=already_exists`);
        }, 600);
        return;
      }

      // 3. Si no existe, permitir completar el fundamento
      onSelectAnime(anime);
      setQuery("");
      setResults([]);
    } catch {
      setSearchError("Error al verificar disponibilidad del anime en la base de datos.");
    } finally {
      setCheckingItem(null);
    }
  }

  return (
    <div className="relative w-full font-sans">
      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
        Buscar en el Catálogo:
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Escribe el nombre del anime (ej. Titan, Hero, Naruto...)"
          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <div className="absolute left-3 top-3 text-zinc-400 pointer-events-none">
          <SearchIcon className="w-4 h-4" />
        </div>

        {loading && (
          <div className="absolute right-3 top-3 text-xs text-indigo-400 animate-pulse font-sans">
            Buscando...
          </div>
        )}
      </div>

      {redirectNotice && (
        <div className="mt-2 p-2.5 rounded bg-indigo-950/60 border border-indigo-500/50 text-indigo-200 text-xs animate-pulse">
          {redirectNotice}
        </div>
      )}

      {searchError && (
        <p className="mt-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2 rounded">
          {searchError}
        </p>
      )}

      {/* Resultados desplegables desde el catálogo propio */}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl backdrop-blur">
          <div className="p-1.5 space-y-1">
            {results.map((anime) => (
              <button
                key={anime.id}
                type="button"
                onClick={() => handleSelect(anime)}
                disabled={checkingItem !== null}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 text-left transition-colors cursor-pointer disabled:opacity-50"
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-12 h-16 object-cover rounded bg-zinc-950 shrink-0 border border-zinc-800"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-zinc-100 truncate">
                    {anime.title}
                  </h4>
                  {anime.titleEn && anime.titleEn !== anime.title && (
                    <p className="text-xs text-zinc-400 truncate">{anime.titleEn}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 border border-zinc-700">
                      {anime.type ?? "TV"}
                    </span>
                    {anime.year && <span>{anime.year}</span>}
                    <span className="text-indigo-400 font-mono text-[10px]">
                      ID #{anime.externalId}
                    </span>
                  </div>
                </div>

                {checkingItem === anime.id && (
                  <span className="text-xs text-indigo-400 animate-pulse shrink-0">
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
