import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, password } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
  }

  const updateData: Record<string, string> = { name: name.trim() };

  if (password?.trim()) {
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(password.trim(), 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  // Refrescar el JWT con el nuevo nombre
  await createSession({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });

  return NextResponse.json({ ok: true, name: updated.name });
}
