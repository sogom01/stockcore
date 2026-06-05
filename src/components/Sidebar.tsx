"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";

type Props = { role: string };

export default function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = (href: string, label: string, icon: React.ReactNode, badge?: { value: number; type: "norm" | "amber" | "red" }) => {
    const active = pathname === href;
    return (
      <div
        key={href}
        className={`${styles.navItem}${active ? ` ${styles.active}` : ""}`}
        onClick={() => router.push(href)}
      >
        {icon}
        <span>{label}</span>
        {badge && <span className={`${styles.navCount} ${styles[badge.type]}`}>{badge.value}</span>}
      </div>
    );
  };

  return (
    <aside className={styles.sidebar}>
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
        <span className={styles.sectionLabel}>// Operaciones</span>
        {nav("/dashboard/movimientos", "Movimientos",
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        )}
        {role === "ADMIN" && nav("/dashboard/usuarios", "Usuarios",
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        )}
      </div>
    </aside>
  );
}
