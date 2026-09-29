import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const recommendations = await prisma.recommendation.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } }, comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } } } });
  return <Dashboard user={session.user} initialRecommendations={recommendations} />;
}
