import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Dashboard, { ForumRecommendation, UserSession } from "@/components/dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const rawRecommendations = await prisma.recommendation.findMany({
    orderBy: [
      { votes: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: { comments: true, votes: true },
      },
      votes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  const recommendations: ForumRecommendation[] = rawRecommendations.map((item) => ({
    id: item.id,
    mal_id: item.mal_id,
    title: item.title,
    imageUrl: item.imageUrl,
    rationale: item.rationale,
    adminReview: item.adminReview,
    tier: item.tier as "S" | "A" | "B" | "C" | "D" | "E" | null,
    tierOrder: item.tierOrder ?? 0,
    status: item.status,
    createdAt: item.createdAt,
    authorId: item.authorId,
    author: {
      id: item.author.id,
      name: item.author.name,
      email: item.author.email,
    },
    commentsCount: item._count.comments,
    votesCount: item._count.votes,
    hasVoted: item.votes.length > 0,
  }));

  const currentUser: UserSession = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: (session.user.role as "ADMIN" | "USER") || "USER",
  };

  return <Dashboard user={currentUser} initialRecommendations={recommendations} />;
}
