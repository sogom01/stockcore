import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  role: z.enum(["ADMIN", "GESTOR", "VISOR"]).default("VISOR"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
