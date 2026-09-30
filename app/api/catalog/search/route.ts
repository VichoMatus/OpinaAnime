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
    const results = await prisma.animeCatalog.findMany({
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
