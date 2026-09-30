import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo el administrador puede actualizar el estado, tier o reseña." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const validTiers = ["S", "A", "B", "C", null];
  const validStatuses = ["PENDING", "WATCHING", "COMPLETED", "DROPPED"];

  if (body.tier !== undefined && !validTiers.includes(body.tier)) {
    return NextResponse.json({ error: "Tier no válido." }, { status: 400 });
  }

  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  }

  const updateData: {
    tier?: "S" | "A" | "B" | "C" | null;
    status?: "PENDING" | "WATCHING" | "COMPLETED" | "DROPPED";
    adminReview?: string | null;
  } = {};

  if (body.tier !== undefined) {
    updateData.tier = body.tier;
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
  }
  if (body.adminReview !== undefined) {
    updateData.adminReview = body.adminReview ? String(body.adminReview).trim() : null;
  }

  const updated = await prisma.recommendation.update({
    where: { id },
    data: updateData,
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

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!recommendation) {
    return NextResponse.json({ error: "Recomendación no encontrada." }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = recommendation.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar esta recomendación." },
      { status: 403 }
    );
  }

  // Si no es ADMIN pero es el autor, solo puede borrar si nadie ha comentado aún
  if (!isAdmin && isAuthor && recommendation._count.comments > 0) {
    return NextResponse.json(
      {
        error:
          "No puedes eliminar una recomendación que ya cuenta con comentarios en el debate.",
      },
      { status: 403 }
    );
  }

  await prisma.recommendation.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Recomendación eliminada exitosamente.",
  });
}
