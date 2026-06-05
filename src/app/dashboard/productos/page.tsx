import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ProductsClient from "@/components/products/ProductsClient";

export default async function ProductosPage() {
  const session = await getSession();

  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true, supplier: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ProductsClient
      initialProducts={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
      suppliers={JSON.parse(JSON.stringify(suppliers))}
      role={session?.role ?? "VISOR"}
    />
  );
}
