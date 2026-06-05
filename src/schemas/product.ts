import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().min(2).max(40).regex(/^[A-Za-z0-9\-_]+$/, "SKU: solo letras, números, - y _"),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  unit: z.string().max(10).default("u."),
  categoryId: z.string().cuid().optional().nullable(),
  supplierId: z.string().cuid().optional().nullable(),
});

export const movementSchema = z.object({
  productId: z.string().cuid(),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  quantity: z.coerce.number().int().min(1),
  note: z.string().max(200).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
