import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COMMENT_MAX } from "@/lib/community";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  const text = String(body.body ?? "").trim();
  const rawParentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;

  if (!text) {
    return NextResponse.json({ error: "Escribe una opinión o comentario." }, { status: 400 });
  }
  if (text.length > COMMENT_MAX) {
    return NextResponse.json(
      { error: `Tu mensaje es demasiado largo (máximo ${COMMENT_MAX} caracteres).` },
      { status: 400 }
    );
  }

  // Verificar que la recomendación existe
  const exists = await prisma.recommendation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json(
      { error: "La recomendación a comentar no existe." },
      { status: 404 }
    );
  }

  // Las respuestas se agrupan bajo el comentario principal (un solo nivel).
  let parentId: string | null = null;
  if (rawParentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: rawParentId },
      select: { id: true, parentId: true, recommendationId: true },
    });
    if (!parent || parent.recommendationId !== id) {
      return NextResponse.json(
        { error: "El comentario al que respondes ya no existe." },
        { status: 404 }
      );
    }
    parentId = parent.parentId ?? parent.id;
  }

  const comment = await prisma.comment.create({
    data: {
      body: text,
      authorId: session.user.id,
      recommendationId: id,
      parentId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
