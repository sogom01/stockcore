import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockCore · Gestión de Inventario",
  description: "Sistema de gestión de inventario multiusuario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Anti-FOUC: aplica dark mode antes de que React hidrate */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('sc-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'')}catch(e){}` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
