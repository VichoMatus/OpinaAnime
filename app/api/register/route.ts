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
  if (email.length > 254) return NextResponse.json({ error: "Ese correo es demasiado largo." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Revisa tu correo, parece que no es válido." }, { status: 400 });
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 8) return NextResponse.json({ error: "Tu contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  if (passwordBytes > 72) return NextResponse.json({ error: "Tu contraseña es demasiado larga (máximo 72 caracteres; los emojis y las tildes cuentan más)." }, { status: 400 });
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
