"use server";

import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema } from "@/schemas/auth";

export async function loginAction(_prev: { error: string }, formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email o contraseña inválidos." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.active) {
    return { error: "Credenciales incorrectas." };
  }

  const valid = await compare(parsed.data.password, user.password);
  if (!valid) {
    return { error: "Credenciales incorrectas." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
