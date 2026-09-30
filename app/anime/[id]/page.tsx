import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import AnimeThread, { RecommendationDetail } from "@/components/anime-thread";

interface AnimePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnimePage(props: AnimePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const id = params.id;
  const notice = searchParams.notice as string | undefined;

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

  const recommendationData: RecommendationDetail = {
    id: rec.id,
    mal_id: rec.mal_id,
    title: rec.title,
    imageUrl: rec.imageUrl,
    rationale: rec.rationale,
    adminReview: rec.adminReview,
    tier: rec.tier as "S" | "A" | "B" | "C" | null,
    status: rec.status,
    createdAt: rec.createdAt,
    authorId: rec.authorId,
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
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: (session.user.role as "ADMIN" | "USER") || "USER",
      }}
      notice={notice}
    />
  );
}
