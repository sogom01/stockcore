import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { name, email, phone } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const exists = await prisma.supplier.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" }, NOT: { id } },
  });
  if (exists) return NextResponse.json({ error: "Ya existe un proveedor con ese nombre" }, { status: 409 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const count = await prisma.product.count({ where: { supplierId: id, status: "ACTIVE" } });
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${count} producto(s) usan este proveedor` },
      { status: 409 }
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
