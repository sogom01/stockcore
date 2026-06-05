"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { useSidebar } from "@/components/SidebarContext";
import styles from "./Topbar.module.css";

const NAV = [
  { label: "Dashboard",   href: "/dashboard" },
  { label: "Productos",   href: "/dashboard/productos" },
  { label: "Movimientos", href: "/dashboard/movimientos" },
  { label: "Categorías",  href: "/dashboard/categorias" },
  { label: "Proveedores", href: "/dashboard/proveedores" },
  { label: "Usuarios",    href: "/dashboard/usuarios", adminOnly: true },
];

type Props = {
  user: { name?: string | null; email?: string | null; role: string };
};

export default function Topbar({ user }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { open, toggle } = useSidebar();

  const [searchVal, setSearchVal] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync searchVal with URL when on productos page
  useEffect(() => {
    if (pathname === "/dashboard/productos") {
      const q = new URLSearchParams(window.location.search).get("q") ?? "";
      setSearchVal(q);
    } else {
      setSearchVal("");
    }
  }, [pathname]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchVal.trim();
    router.push(q ? `/dashboard/productos?q=${encodeURIComponent(q)}` : "/dashboard/productos");
    setSearchOpen(false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setSearchOpen(false); setSearchVal(""); }
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  const initials = (user.name ?? "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const tabs = NAV.filter(n => !n.adminOnly || user.role === "ADMIN");

  return (
    <header className={styles.topbar}>
      {/* Hamburger – solo mobile */}
      <button
        className={`${styles.hamburger}${open ? ` ${styles.hamburgerOpen}` : ""}`}
        onClick={toggle}
        aria-label="Menú"
      >
        <span /><span /><span />
      </button>

      {/* Brand */}
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

      {/* Nav – escritorio */}
      <nav className={styles.nav}>
        {tabs.map(t => (
          <button
            key={t.href}
            className={`${styles.tnav}${pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href)) ? ` ${styles.active}` : ""}`}
            onClick={() => router.push(t.href)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Right */}
      <div className={styles.right}>
        {/* Búsqueda global */}
        {searchOpen ? (
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              className={styles.searchInput}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={() => { if (!searchVal.trim()) setSearchOpen(false); }}
              placeholder="Buscar productos…"
            />
          </form>
        ) : (
          <button className={styles.searchBtn} onClick={openSearch} title="Buscar productos (/)">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        )}

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
