import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import CategoriesClient from "@/components/categories/CategoriesClient";

export default async function CategoriasPage() {
  const session = await getSession();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return (
    <CategoriesClient
      initialCategories={JSON.parse(JSON.stringify(categories))}
      role={session?.role ?? "VISOR"}
    />
  );
}
