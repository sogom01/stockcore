import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";
import { getSession } from "@/lib/session";

const MAX_USERS = Number(process.env.MAX_USERS ?? 10);

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.user.count();
  if (count >= MAX_USERS) {
    return NextResponse.json({ error: `Límite de ${MAX_USERS} usuarios alcanzado` }, { status: 409 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { ...parsed.data, password: await hash(parsed.data.password, 12) },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
