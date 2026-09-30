import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const malIdParam = searchParams.get("mal_id");

  if (!malIdParam) {
    return NextResponse.json({ error: "Parámetro mal_id requerido." }, { status: 400 });
  }

  const mal_id = parseInt(malIdParam, 10);
  if (isNaN(mal_id)) {
    return NextResponse.json({ error: "mal_id debe ser un número entero válido." }, { status: 400 });
  }

  const existing = await prisma.recommendation.findUnique({
    where: { mal_id },
    select: { id: true, title: true },
  });

  if (existing) {
    return NextResponse.json({
      exists: true,
      recommendationId: existing.id,
      title: existing.title,
    });
  }

  return NextResponse.json({ exists: false });
}
