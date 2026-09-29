import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Solo el administrador puede editar esto." }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const validTiers = ["S", "A", "B", "C", null];
  const validStatuses = ["PENDING", "WATCHING", "COMPLETED", "DROPPED"];
  if (!validTiers.includes(body.tier) || !validStatuses.includes(body.status)) return NextResponse.json({ error: "Valores no válidos." }, { status: 400 });
  const recommendation = await prisma.recommendation.update({ where: { id }, data: { tier: body.tier, status: body.status } });
  return NextResponse.json(recommendation);
}
