import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import UsersClient from "@/components/UsersClient";

export default async function UsuariosPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  const count = await prisma.user.count();
  const max = Number(process.env.MAX_USERS ?? 10);

  return (
    <UsersClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      currentUserId={session!.id}
      userCount={count}
      maxUsers={max}
    />
  );
}
