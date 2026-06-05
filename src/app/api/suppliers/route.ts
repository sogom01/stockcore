import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, email, phone } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const exists = await prisma.supplier.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (exists) return NextResponse.json({ error: "Ya existe un proveedor con ese nombre" }, { status: 409 });

  const supplier = await prisma.supplier.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return NextResponse.json(supplier, { status: 201 });
}
