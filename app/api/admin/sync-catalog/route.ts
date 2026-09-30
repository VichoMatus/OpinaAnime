import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado. Solo los administradores pueden sincronizar el catálogo." },
      { status: 403 }
    );
  }

  try {
    const catalogEntries: {
      externalId: string;
      title: string;
      titleEn: string | null;
      imageUrl: string;
      type: string | null;
      year: number | null;
    }[] = [];

    // 1. Obtener páginas de AniList (GraphQL)
    const anilistQuery = `
      query ($page: Int) {
        Page(page: $page, perPage: 50) {
          media(type: ANIME, sort: [POPULARITY_DESC]) {
            id
            idMal
            title { romaji english }
            coverImage { large extraLarge }
            seasonYear
            format
          }
        }
      }
    `;

    for (let page = 1; page <= 10; page++) {
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: anilistQuery, variables: { page } }),
        });
        if (res.ok) {
          const json = await res.json();
          const media = json?.data?.Page?.media || [];
          for (const m of media) {
            if (m && (m.title?.english || m.title?.romaji) && (m.coverImage?.large || m.coverImage?.extraLarge)) {
              catalogEntries.push({
                externalId: String(m.idMal || `al-${m.id}`),
                title: (m.title?.english || m.title?.romaji).trim(),
                titleEn: m.title?.english ? m.title.english.trim() : null,
                imageUrl: (m.coverImage?.large || m.coverImage?.extraLarge).trim(),
                type: m.format ? String(m.format).toUpperCase() : "TV",
                year: m.seasonYear || null,
              });
            }
          }
        }
      } catch (e) {
        break;
      }
    }

    // Inserción masiva omitiendo duplicados
    const insertResult = await prisma.animeCatalog.createMany({
      data: catalogEntries,
      skipDuplicates: true,
    });

    const totalInCatalog = await prisma.animeCatalog.count();

    return NextResponse.json({
      success: true,
      synced: catalogEntries.length,
      newlyInserted: insertResult.count,
      totalInCatalog,
      message: `Catálogo sincronizado exitosamente (${insertResult.count} nuevos agregados, ${totalInCatalog} animes en total).`,
    });
  } catch (error: unknown) {
    console.error("Error en sync-catalog:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al sincronizar catálogo.",
      },
      { status: 500 }
    );
  }
}
