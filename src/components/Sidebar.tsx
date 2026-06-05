"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";
import styles from "./Sidebar.module.css";

type Props = { role: string };

export default function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { open, close } = useSidebar();

  function go(href: string) {
    router.push(href);
    close(); // cierra el menú en mobile al navegar
  }

  const nav = (
    href: string,
    label: string,
    icon: React.ReactNode,
    badge?: { value: number; type: "norm" | "amber" | "red" }
  ) => {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <div
        key={href}
        className={`${styles.navItem}${active ? ` ${styles.active}` : ""}`}
        onClick={() => go(href)}
      >
        {icon}
        <span>{label}</span>
        {badge && <span className={`${styles.navCount} ${styles[badge.type]}`}>{badge.value}</span>}
      </div>
    );
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && <div className={styles.overlay} onClick={close} />}

      <aside className={`${styles.sidebar}${open ? ` ${styles.mobileOpen}` : ""}`}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>// Inventario</span>
          {nav("/dashboard", "Dashboard",
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          )}
          {nav("/dashboard/productos", "Todos los productos",
            <svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/></svg>
          )}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>// Catálogos</span>
          {nav("/dashboard/categorias", "Categorías",
            <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          )}
          {nav("/dashboard/proveedores", "Proveedores",
            <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          )}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>// Operaciones</span>
          {nav("/dashboard/movimientos", "Movimientos",
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          )}
          {role === "ADMIN" && nav("/dashboard/usuarios", "Usuarios",
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          )}
        </div>
      </aside>
    </>
  );
}
