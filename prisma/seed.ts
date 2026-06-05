import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin por defecto
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@stockcore.com" } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@stockcore.com",
        password: await hash("admin1234", 12),
        role: "ADMIN",
      },
    });
    console.log("✓ Admin creado: admin@stockcore.com / admin1234");
  }

  // Categorías
  const cats = ["Electrónica", "Ferretería", "Oficina", "Limpieza", "Textiles"];
  const colors = ["#1A5FA8", "#C47900", "#1A8A4A", "#6B6860", "#C0392B"];
  const categoryMap: Record<string, string> = {};

  for (let i = 0; i < cats.length; i++) {
    const cat = await prisma.category.upsert({
      where: { name: cats[i] },
      update: {},
      create: { name: cats[i], color: colors[i] },
    });
    categoryMap[cats[i]] = cat.id;
  }

  // Proveedores
  const suppliers = [
    { name: "TechDist SAS", email: "ventas@techdist.co" },
    { name: "PCPartes CO", email: "info@pcpartes.co" },
    { name: "FerrePro", email: "pedidos@ferrepro.co" },
    { name: "OfficeMax", email: "compras@officemax.co" },
    { name: "LimpiaTotal", email: "ventas@limpiatotal.co" },
    { name: "TextilCO", email: "info@textilco.co" },
    { name: "PaperCO", email: "ventas@paperco.co" },
  ];

  const supplierMap: Record<string, string> = {};
  for (const s of suppliers) {
    const sup = await prisma.supplier.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    supplierMap[s.name] = sup.id;
  }

  // Productos demo
  const products = [
    { name: "Laptop Dell Inspiron 15", sku: "SKU-0014", price: 2890000, stock: 84, minStock: 20, categoryId: categoryMap["Electrónica"], supplierId: supplierMap["TechDist SAS"] },
    { name: 'Monitor LG 27" 4K', sku: "SKU-0021", price: 1450000, stock: 12, minStock: 15, categoryId: categoryMap["Electrónica"], supplierId: supplierMap["TechDist SAS"] },
    { name: "Teclado Mecánico RGB", sku: "SKU-0033", price: 320000, stock: 56, minStock: 10, categoryId: categoryMap["Electrónica"], supplierId: supplierMap["PCPartes CO"] },
    { name: "Impresora HP LaserJet", sku: "SKU-0041", price: 890000, stock: 0, minStock: 5, categoryId: categoryMap["Electrónica"], supplierId: supplierMap["OfficeMax"] },
    { name: "Tornillos Hex M8 (bolsa)", sku: "SKU-0052", price: 12500, stock: 340, minStock: 100, categoryId: categoryMap["Ferretería"], supplierId: supplierMap["FerrePro"] },
    { name: "Llave Torx T25", sku: "SKU-0063", price: 28000, stock: 8, minStock: 20, categoryId: categoryMap["Ferretería"], supplierId: supplierMap["FerrePro"] },
    { name: "Resma Papel A4 x500", sku: "SKU-0074", price: 18000, stock: 145, minStock: 30, categoryId: categoryMap["Oficina"], supplierId: supplierMap["PaperCO"] },
    { name: "Bolígrafos BIC x24", sku: "SKU-0085", price: 9800, stock: 6, minStock: 15, categoryId: categoryMap["Oficina"], supplierId: supplierMap["OfficeMax"] },
    { name: "Jabón líquido 1L", sku: "SKU-0096", price: 14200, stock: 210, minStock: 50, categoryId: categoryMap["Limpieza"], supplierId: supplierMap["LimpiaTotal"] },
    { name: "Escoba industrial 120cm", sku: "SKU-0107", price: 32000, stock: 0, minStock: 8, categoryId: categoryMap["Limpieza"], supplierId: supplierMap["LimpiaTotal"] },
    { name: "Camiseta staff talla M", sku: "SKU-0118", price: 65000, stock: 4, minStock: 10, categoryId: categoryMap["Textiles"], supplierId: supplierMap["TextilCO"] },
    { name: "Cable USB-C 2m trenzado", sku: "SKU-0129", price: 38000, stock: 78, minStock: 20, categoryId: categoryMap["Electrónica"], supplierId: supplierMap["PCPartes CO"] },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log("✓ Seed completado: categorías, proveedores y 12 productos demo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
