import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "VISOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const exists = await prisma.category.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (exists) return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });

  const category = await prisma.category.create({
    data: { name: name.trim(), color: color ?? "#1A1916" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return NextResponse.json(category, { status: 201 });
}
