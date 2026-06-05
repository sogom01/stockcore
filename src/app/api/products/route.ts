import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/schemas/product";
import { getSession } from "@/lib/session";

export const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const filter   = searchParams.get("filter");
  const q        = searchParams.get("q");
  const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? String(PAGE_SIZE))));

  const categoryId = searchParams.get("categoryId");
  const supplierId = searchParams.get("supplierId");

  const baseWhere = {
    status: "ACTIVE" as const,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { sku:  { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(supplierId && { supplierId }),
  };

  // stock filter applied post-query for "low" (needs per-row comparison),
  // but "out" can be pushed to DB
  const dbWhere = {
    ...baseWhere,
    ...(filter === "out" && { stock: 0 }),
  };

  const [allMatching, total] = await Promise.all([
    prisma.product.findMany({
      where: dbWhere,
      include: { category: true, supplier: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.count({ where: dbWhere }),
  ]);

  // apply in-memory "low" / "ok" filter (requires comparing stock vs minStock per row)
  let filtered = allMatching;
  if (filter === "low") filtered = allMatching.filter(p => p.stock > 0 && p.stock <= p.minStock);
  if (filter === "ok")  filtered = allMatching.filter(p => p.stock > p.minStock);

  const realTotal = filtered.length;
  const data = filtered.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ data, total: realTotal, page, pageSize });
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
