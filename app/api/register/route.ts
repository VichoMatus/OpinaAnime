import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid request body");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Escribe un correo válido (máximo 254 caracteres)." }, { status: 400 });
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 8 || passwordBytes > 72) {
    return NextResponse.json({ error: "La contraseña debe tener entre 8 y 72 bytes." }, { status: 400 });
  }
  if (name.length > 60) return NextResponse.json({ error: "El nombre puede tener hasta 60 caracteres." }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  try {
    const user = await prisma.user.create({ data: { name: name || null, email, passwordHash: await hash(password, 12), role: email === adminEmail ? "ADMIN" : "USER" } });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
    }
    throw error;
  }
}
