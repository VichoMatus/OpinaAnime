import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import AnimeThread, { RecommendationDetail } from "@/components/anime-thread";

interface AnimePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}

export default async function AnimePage({ params, searchParams }: AnimePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const { notice } = await searchParams;

  const rec = await prisma.recommendation.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!rec) {
    notFound();
  }

  // Cast para garantizar correspondencia de tipos
  const recommendationData: RecommendationDetail = {
    ...rec,
    tier: rec.tier as "S" | "A" | "B" | "C" | null,
    status: rec.status,
    author: {
      id: rec.author.id,
      name: rec.author.name,
      email: rec.author.email,
      role: rec.author.role as "ADMIN" | "USER",
    },
    comments: rec.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      authorId: c.authorId,
      author: {
        id: c.author.id,
        name: c.author.name,
        email: c.author.email,
        role: c.author.role as "ADMIN" | "USER",
      },
    })),
  };

  return (
    <AnimeThread
      recommendation={recommendationData}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user.role as "ADMIN" | "USER") || "USER",
      }}
      notice={notice}
    />
  );
}
