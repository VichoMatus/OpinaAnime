import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comentario no encontrado." }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = comment.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este comentario." },
      { status: 403 }
    );
  }

  await prisma.comment.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Comentario eliminado exitosamente.",
  });
}
