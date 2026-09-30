import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  "vicentematus.games@gmail.com",
  "vmatus2024@alu.uct.cl",
].filter(Boolean) as string[];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await compare(credentials.password, user.passwordHash))) return null;
        
        const role = user.role === "ADMIN" || ADMIN_EMAILS.includes(email) ? "ADMIN" : "USER";
        return { id: user.id, name: user.name, email: user.email, role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        const email = session.user.email?.toLowerCase();
        const isAdmin = token.role === "ADMIN" || (email && ADMIN_EMAILS.includes(email));
        session.user.role = isAdmin ? "ADMIN" : "USER";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url;
      }
      if (url.includes("localhost") && process.env.NODE_ENV === "production") {
        return "/login";
      }
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl || parsedUrl.hostname.endsWith(".vercel.app")) {
          return url;
        }
      } catch {
        // En caso de url inválida
      }
      return "/login";
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
};
