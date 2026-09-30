import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        return { id: user.id, name: user.name, email: user.email, role: user.role };
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
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 1. Si es una ruta relativa (ej. /login), retornar directamente la ruta relativa.
      // Así el navegador jamás saldrá del dominio en el que se encuentra.
      if (url.startsWith("/")) {
        return url;
      }

      // 2. Si la URL apunta a localhost pero estamos en producción (Vercel), bloquearla y enviar a /login relativo
      if (url.includes("localhost") && process.env.NODE_ENV === "production") {
        return "/login";
      }

      try {
        const parsedUrl = new URL(url);
        // Permitir si pertenece al mismo origen o a cualquier subdominio de vercel.app
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
