import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [total, movements, categories] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { stock: true, minStock: true } }),
    prisma.movement.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { product: { select: { name: true, sku: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
  ]);

  const inStock = total.filter(p => p.stock > p.minStock).length;
  const lowStock = total.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = total.filter(p => p.stock === 0).length;

  return NextResponse.json({ totalProducts: total.length, inStock, lowStock, outOfStock, movements, categories });
}
