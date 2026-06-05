import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import SuppliersClient from "@/components/suppliers/SuppliersClient";

export default async function ProveedoresPage() {
  const session = await getSession();

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });

  return (
    <SuppliersClient
      initialSuppliers={JSON.parse(JSON.stringify(suppliers))}
      role={session?.role ?? "VISOR"}
    />
  );
}
