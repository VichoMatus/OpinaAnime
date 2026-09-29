import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password || password.length < 8) return NextResponse.json({ error: "Usa un correo válido y una contraseña de al menos 8 caracteres." }, { status: 400 });
  if (!email.includes("@")) return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const user = await prisma.user.create({ data: { name: name || null, email, passwordHash: await hash(password, 12), role: email === adminEmail ? "ADMIN" : "USER" } });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
