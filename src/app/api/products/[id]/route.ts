import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/schemas/product";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
    include: { category: true, supplier: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ ok: true });
}
