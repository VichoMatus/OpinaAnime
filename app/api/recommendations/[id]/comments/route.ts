import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Escribe una opinión." }, { status: 400 });
  const comment = await prisma.comment.create({ data: { body: text, authorId: session.user.id, recommendationId: id }, include: { author: { select: { name: true, email: true } } } });
  return NextResponse.json(comment, { status: 201 });
}
