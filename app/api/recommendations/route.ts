import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const rationale = String(body.rationale ?? "").trim();
  const rawMalId = body.mal_id;
  const mal_id = rawMalId ? parseInt(String(rawMalId), 10) : null;

  if (!title || !imageUrl || !rationale) {
    return NextResponse.json(
      { error: "Completa el título, la imagen y el fundamento." },
      { status: 400 }
    );
  }

  // Verificar si ya existe este mal_id para evitar duplicados
  if (mal_id && !isNaN(mal_id)) {
    const existing = await prisma.recommendation.findUnique({
      where: { mal_id },
      select: { id: true, title: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Este anime ya ha sido recomendado en la plataforma.",
          recommendationId: existing.id,
          title: existing.title,
        },
        { status: 409 }
      );
    }
  }

  const recommendation = await prisma.recommendation.create({
    data: {
      title,
      imageUrl,
      rationale,
      mal_id: mal_id && !isNaN(mal_id) ? mal_id : null,
      authorId: session.user.id,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}
