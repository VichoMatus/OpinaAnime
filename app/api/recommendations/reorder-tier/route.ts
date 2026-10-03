import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  "vicentematus.games@gmail.com",
  "vmatus2024@alu.uct.cl",
].filter(Boolean) as string[];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email?.toLowerCase();
  const isAdmin =
    session?.user?.role === "ADMIN" ||
    (userEmail && ADMIN_EMAILS.includes(userEmail));

  if (!session?.user?.id || !isAdmin) {
    return NextResponse.json(
      { error: "Solo el administrador puede reordenar la Tier List." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Se requiere un array de items con id, tier y tierOrder." },
        { status: 400 }
      );
    }

    const validTiers = ["S", "A", "B", "C", "D", "E", null];

    await prisma.$transaction(
      items.map((item: { id: string; tier: string | null; tierOrder: number }) => {
        const rawTier =
          item.tier === "" || item.tier === "null" || item.tier === undefined
            ? null
            : item.tier;

        if (!validTiers.includes(rawTier)) {
          throw new Error("Tier no válido.");
        }

        return prisma.recommendation.update({
          where: { id: item.id },
          data: {
            tier: rawTier as "S" | "A" | "B" | "C" | "D" | "E" | null,
            tierOrder: typeof item.tierOrder === "number" ? item.tierOrder : 0,
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: items.length });
  } catch (error: unknown) {
    console.error("Error al reordenar tiers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al guardar el nuevo orden." },
      { status: 500 }
    );
  }
}
