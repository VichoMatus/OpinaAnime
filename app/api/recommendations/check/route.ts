import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const malIdParam = searchParams.get("mal_id");
  const titleParam = searchParams.get("title")?.trim();

  if (!malIdParam && !titleParam) {
    return NextResponse.json(
      { error: "Se requiere parámetro mal_id o title." },
      { status: 400 }
    );
  }

  let existing = null;

  if (malIdParam) {
    const mal_id = parseInt(malIdParam, 10);
    if (!isNaN(mal_id)) {
      existing = await prisma.recommendation.findUnique({
        where: { mal_id },
        select: { id: true, title: true },
      });
    }
  }

  if (!existing && titleParam) {
    existing = await prisma.recommendation.findFirst({
      where: {
        title: { equals: titleParam, mode: "insensitive" },
      },
      select: { id: true, title: true },
    });
  }

  if (existing) {
    return NextResponse.json({
      exists: true,
      recommendationId: existing.id,
      title: existing.title,
    });
  }

  return NextResponse.json({ exists: false });
}
