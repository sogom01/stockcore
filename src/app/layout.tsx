import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockCore · Gestión de Inventario",
  description: "Sistema de gestión de inventario multiusuario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
