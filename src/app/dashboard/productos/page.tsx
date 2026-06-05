import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ProductsClient from "@/components/products/ProductsClient";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ProductosPage({ searchParams }: Props) {
  const session = await getSession();
  const { q }   = await searchParams;

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ProductsClient
      categories={JSON.parse(JSON.stringify(categories))}
      suppliers={JSON.parse(JSON.stringify(suppliers))}
      role={session?.role ?? "VISOR"}
      initialSearch={q ?? ""}
    />
  );
}
