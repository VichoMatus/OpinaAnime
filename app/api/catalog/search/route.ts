import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    // 1. Buscar primero en la base de datos local (PostgreSQL Neon con casi 2.000 animes)
    let results = await prisma.animeCatalog.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { titleEn: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: {
        title: "asc",
      },
    });

    // 2. Auto-Descubrimiento & Auto-Enriquecimiento en caliente:
    // Si hay menos de 2 resultados, consultar la API para encontrarlo y guardarlo automáticamente en la BD
    if (results.length < 2) {
      try {
        const anilistQuery = `
          query ($search: String) {
            Page(page: 1, perPage: 6) {
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
            variables: { search: query },
          }),
        });

        if (anilistRes.ok) {
          const anilistJson = await anilistRes.json();
          const media = anilistJson?.data?.Page?.media || [];

          const newEntries: {
            externalId: string;
            title: string;
            titleEn: string | null;
            imageUrl: string;
            type: string | null;
            year: number | null;
          }[] = media
            .filter((m: any) => m && (m.title?.english || m.title?.romaji) && (m.coverImage?.large || m.coverImage?.extraLarge))
            .map((m: any) => {
              const title = m.title?.english || m.title?.romaji;
              const titleEn = m.title?.english || null;
              const imageUrl = m.coverImage?.large || m.coverImage?.extraLarge;
              const externalId = String(m.idMal || `al-${m.id}`);

              return {
                externalId,
                title: title.trim(),
                titleEn: titleEn ? titleEn.trim() : null,
                imageUrl: imageUrl.trim(),
                type: m.format ? String(m.format).toUpperCase() : "TV",
                year: m.seasonYear || null,
              };
            });

          if (newEntries.length > 0) {
            // Guardar permanentemente en PostgreSQL para que ya nunca falte
            await prisma.animeCatalog.createMany({
              data: newEntries,
              skipDuplicates: true,
            });

            // Re-consultar la base de datos para retornar los datos con sus IDs de PostgreSQL
            results = await prisma.animeCatalog.findMany({
              where: {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { titleEn: { contains: query, mode: "insensitive" } },
                ],
              },
              take: 10,
              orderBy: {
                title: "asc",
              },
            });
          }
        }
      } catch (err) {
        console.warn("Auto-descubrimiento en búsqueda:", err);
      }
    }

    return NextResponse.json({ data: results });
  } catch (error: unknown) {
    console.error("Error en /api/catalog/search:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al buscar animes en el catálogo.",
      },
      { status: 500 }
    );
  }
}
