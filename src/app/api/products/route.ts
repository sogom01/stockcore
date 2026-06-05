import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/schemas/product";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter");
  const q = searchParams.get("q");

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(filter === "low" && { stock: { gt: 0 } }),
      ...(filter === "out" && { stock: 0 }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: { category: true, supplier: true },
    orderBy: { updatedAt: "desc" },
  });

  const data = filter === "low"
    ? products.filter(p => p.stock <= p.minStock)
    : products;

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (skuExists) {
    return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: parsed.data,
    include: { category: true, supplier: true },
  });

  return NextResponse.json(product, { status: 201 });
}
