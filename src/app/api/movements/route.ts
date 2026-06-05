import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { movementSchema } from "@/schemas/product";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, type, quantity, note } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  if (type === "SALIDA" && product.stock < quantity) {
    return NextResponse.json({ error: "Stock insuficiente" }, { status: 409 });
  }

  const delta = type === "ENTRADA" ? quantity : type === "SALIDA" ? -quantity : quantity - product.stock;

  const [movement] = await prisma.$transaction([
    prisma.movement.create({ data: { productId, type, quantity, note, userId: session.id } }),
    prisma.product.update({ where: { id: productId }, data: { stock: { increment: delta } } }),
  ]);

  return NextResponse.json(movement, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId");

  const movements = await prisma.movement.findMany({
    where: { ...(productId && { productId }) },
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(movements);
}
