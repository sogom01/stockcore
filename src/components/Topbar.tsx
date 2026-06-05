"use client";

import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import styles from "./Topbar.module.css";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Productos", href: "/dashboard/productos" },
  { label: "Movimientos", href: "/dashboard/movimientos" },
  { label: "Usuarios", href: "/dashboard/usuarios", adminOnly: true },
];

type Props = {
  user: { name?: string | null; email?: string | null; role: string };
};

export default function Topbar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = (user.name ?? "U")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tabs = NAV.filter(n => !n.adminOnly || user.role === "ADMIN");

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 3v18M3.27 6.96L12 12l8.73-5.04M3.27 17.04L12 12l8.73 5.04" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className={styles.brandName}>StockCore</span>
        <div className={styles.brandSep} />
        <span className={styles.brandScope}>Inventario</span>
      </div>

      <nav className={styles.nav}>
        {tabs.map(t => (
          <button
            key={t.href}
            className={`${styles.tnav}${pathname === t.href ? ` ${styles.active}` : ""}`}
            onClick={() => router.push(t.href)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.right}>
        <div className={styles.syncBadge}>
          <span className={styles.syncDot} />
          <span>En línea</span>
        </div>

        <div className={styles.userPill}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.role}</span>
        </div>

        <form action={logoutAction}>
          <button type="submit" className="btn btn-outline btn-sm">Salir</button>
        </form>
      </div>
    </header>
  );
}
