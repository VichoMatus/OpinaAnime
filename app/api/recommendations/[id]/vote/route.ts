import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const { id: recommendationId } = await params;
  const userId = session.user.id;

  // Verificar que la recomendación exista
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { id: true },
  });

  if (!recommendation) {
    return NextResponse.json(
      { error: "Recomendación no encontrada." },
      { status: 404 }
    );
  }

  // Buscar si el usuario ya votó (usando la clave única compuesta userId_recommendationId)
  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_recommendationId: {
        userId,
        recommendationId,
      },
    },
  });

  let hasVoted = false;

  if (existingVote) {
    // Si ya votó -> eliminar voto (quitar like)
    await prisma.vote.delete({
      where: { id: existingVote.id },
    });
    hasVoted = false;
  } else {
    // Si no ha votado -> crear voto (dar like)
    await prisma.vote.create({
      data: {
        userId,
        recommendationId,
      },
    });
    hasVoted = true;
  }

  // Obtener el conteo total actualizado
  const votesCount = await prisma.vote.count({
    where: { recommendationId },
  });

  return NextResponse.json({
    hasVoted,
    votesCount,
  });
}
