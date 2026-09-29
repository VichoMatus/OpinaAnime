import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const rationale = String(body.rationale ?? "").trim();
  if (!title || !imageUrl || !rationale) return NextResponse.json({ error: "Completa todos los campos." }, { status: 400 });
  const recommendation = await prisma.recommendation.create({ data: { title, imageUrl, rationale, authorId: session.user.id } });
  return NextResponse.json(recommendation, { status: 201 });
}
