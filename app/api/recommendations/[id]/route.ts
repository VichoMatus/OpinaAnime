import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  "vicentematus.games@gmail.com",
  "vmatus2024@alu.uct.cl",
].filter(Boolean) as string[];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email?.toLowerCase();
  const isAdmin =
    session?.user?.role === "ADMIN" ||
    (userEmail && ADMIN_EMAILS.includes(userEmail));

  if (!session?.user?.id || !isAdmin) {
    return NextResponse.json(
      { error: "Solo el administrador puede actualizar la categoría, tier o reseña." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  const validTiers = ["S", "A", "B", "C", "D", "E", null];
  const validStatuses = ["PENDING", "WATCHING", "COMPLETED", "DROPPED"];

  // Si envían string vacío para tier, convertirlo a null
  const rawTier =
    body.tier === "" || body.tier === "null" || body.tier === undefined
      ? null
      : body.tier;

  if (body.tier !== undefined && !validTiers.includes(rawTier)) {
    return NextResponse.json({ error: "Tier no válido." }, { status: 400 });
  }

  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  }

  // Validación estricta: Si se envía status: "COMPLETED", el campo adminReview no puede estar vacío ni ser nulo
  if (body.status === "COMPLETED") {
    const incomingReview =
      body.adminReview !== undefined
        ? (body.adminReview ? String(body.adminReview).trim() : "")
        : null;

    let reviewToCheck = incomingReview;
    if (reviewToCheck === null) {
      const existing = await prisma.recommendation.findUnique({
        where: { id },
        select: { adminReview: true },
      });
      reviewToCheck = existing?.adminReview ? existing.adminReview.trim() : "";
    }

    if (!reviewToCheck) {
      return NextResponse.json(
        { error: "Debes escribir tu opinión final antes de marcar el anime como Terminado" },
        { status: 400 }
      );
    }
  }

  const updateData: {
    tier?: "S" | "A" | "B" | "C" | "D" | "E" | null;
    status?: "PENDING" | "WATCHING" | "COMPLETED" | "DROPPED";
    adminReview?: string | null;
  } = {};

  if (body.tier !== undefined) {
    updateData.tier = rawTier;
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

  const userEmail = session.user.email?.toLowerCase();
  const isAdmin =
    session.user.role === "ADMIN" ||
    (userEmail && ADMIN_EMAILS.includes(userEmail));
  const isAuthor = recommendation.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar esta recomendación." },
      { status: 403 }
    );
  }

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
