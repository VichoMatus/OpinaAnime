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
    const limitPerPage = 20;
    const targetCount = 200; // Traer los top 200 animes iniciales
    const totalPages = Math.ceil(targetCount / limitPerPage);
    const catalogEntries: {
      externalId: string;
      title: string;
      titleEn: string | null;
      imageUrl: string;
      type: string | null;
      year: number | null;
    }[] = [];

    for (let page = 0; page < totalPages; page++) {
      const offset = page * limitPerPage;
      const url = `https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=${limitPerPage}&page[offset]=${offset}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      });

      if (!res.ok) {
        console.error(`Error al consultar Kitsu en offset ${offset}: ${res.statusText}`);
        break;
      }

      const json = await res.json();
      const data = json.data || [];
      if (data.length === 0) break;

      for (const item of data) {
        const attrs = item.attributes || {};
        const title =
          attrs.canonicalTitle ||
          attrs.titles?.en_jp ||
          attrs.titles?.en ||
          "Sin título";
        const titleEn = attrs.titles?.en || attrs.titles?.en_us || null;
        const imageUrl =
          attrs.posterImage?.large ||
          attrs.posterImage?.original ||
          attrs.posterImage?.medium ||
          "";
        const year = attrs.startDate ? new Date(attrs.startDate).getFullYear() : null;
        const type = attrs.subtype || attrs.showType || "TV";

        if (title && imageUrl) {
          catalogEntries.push({
            externalId: String(item.id),
            title: String(title).trim(),
            titleEn: titleEn ? String(titleEn).trim() : null,
            imageUrl: String(imageUrl).trim(),
            type: type ? String(type).toUpperCase() : "TV",
            year: year && !isNaN(year) ? year : null,
          });
        }
      }
    }

    if (catalogEntries.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron obtener animes de Kitsu en este momento." },
        { status: 502 }
      );
    }

    // Inserción masiva en AnimeCatalog omitiendo duplicados
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
      message: `Catálogo sincronizado exitosamente con Kitsu (${insertResult.count} agregados, ${totalInCatalog} totales en base de datos).`,
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
