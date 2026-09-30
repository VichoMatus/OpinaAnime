import { NextResponse } from "next/server";

interface FormattedAnime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url?: string;
    };
  };
  score?: number | null;
  year?: number | null;
  type?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  // 1. Intentar primero con Jikan API (MyAnimeList)
  try {
    const jikanController = new AbortController();
    const timeoutId = setTimeout(() => jikanController.abort(), 2500);

    const jikanRes = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=5`,
      { signal: jikanController.signal }
    );
    clearTimeout(timeoutId);

    if (jikanRes.ok) {
      const jikanData = await jikanRes.json();
      if (Array.isArray(jikanData.data) && jikanData.data.length > 0) {
        return NextResponse.json(
          { data: jikanData.data, source: "jikan" },
          {
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
          }
        );
      }
    }
  } catch {
    // Si Jikan da timeout (504), error o rate limit, usamos el respaldo de AniList
  }

  // 2. Respaldo de alta disponibilidad: AniList API (devuelve el idMal exacto)
  try {
    const anilistQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 5) {
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
            id
            idMal
            title {
              romaji
              english
            }
            coverImage {
              large
              extraLarge
            }
            averageScore
            seasonYear
            format
          }
        }
      }
    `;

    const anilistRes = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: anilistQuery,
        variables: { search: q },
      }),
    });

    if (anilistRes.ok) {
      const anilistData = await anilistRes.json();
      const mediaList = anilistData?.data?.Page?.media || [];

      const formatted: FormattedAnime[] = mediaList
        .filter((m: { idMal?: number | null; id: number }) => m.idMal || m.id)
        .map((m: {
          id: number;
          idMal?: number | null;
          title: { romaji?: string; english?: string };
          coverImage: { large: string; extraLarge?: string };
          averageScore?: number | null;
          seasonYear?: number | null;
          format?: string | null;
        }) => ({
          mal_id: m.idMal ?? m.id,
          title: m.title.english || m.title.romaji || "Sin título",
          title_english: m.title.english || null,
          images: {
            jpg: {
              image_url: m.coverImage.large,
              large_image_url: m.coverImage.extraLarge || m.coverImage.large,
            },
          },
          score: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : null,
          year: m.seasonYear ?? null,
          type: m.format ?? "TV",
        }));

      return NextResponse.json(
        { data: formatted, source: "anilist_fallback" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo conectar a los servicios de anime.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: [] });
}
