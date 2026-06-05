"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { useSidebar } from "@/components/SidebarContext";
import { useTheme } from "@/components/ThemeContext";
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
  const { open, toggle: toggleSidebar } = useSidebar();
  const { theme, toggle: toggleTheme }  = useTheme();

  const [searchVal, setSearchVal]   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Alert badge
  const [alertCount, setAlertCount]     = useState(0);
  const [alertOpen, setAlertOpen]       = useState(false);
  const [alertDetails, setAlertDetails] = useState<{ outOfStock: number; lowStock: number }>({ outOfStock: 0, lowStock: 0 });
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        setAlertDetails({ outOfStock: d.outOfStock ?? 0, lowStock: d.lowStock ?? 0 });
        setAlertCount((d.outOfStock ?? 0) + (d.lowStock ?? 0));
      })
      .catch(() => {});
  }, [pathname]); // recarga al navegar

  // Cerrar dropdown de alertas al hacer click fuera
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Sync search con URL
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

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  const initials = (user.name ?? "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const tabs = NAV.filter(n => !n.adminOnly || user.role === "ADMIN");

  return (
    <header className={styles.topbar}>
      {/* Hamburger */}
      <button
        className={`${styles.hamburger}${open ? ` ${styles.hamburgerOpen}` : ""}`}
        onClick={toggleSidebar}
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
              onKeyDown={e => { if (e.key === "Escape") { setSearchOpen(false); setSearchVal(""); } }}
              onBlur={() => { if (!searchVal.trim()) setSearchOpen(false); }}
              placeholder="Buscar productos…"
            />
          </form>
        ) : (
          <button className={styles.iconBtn} onClick={openSearch} title="Buscar productos">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        )}

        {/* Alertas de stock */}
        <div className={styles.alertWrap} ref={alertRef}>
          <button
            className={`${styles.iconBtn}${alertCount > 0 ? ` ${styles.iconBtnAlert}` : ""}`}
            onClick={() => setAlertOpen(v => !v)}
            title={alertCount > 0 ? `${alertCount} alertas de stock` : "Sin alertas"}
          >
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {alertCount > 0 && <span className={styles.alertBadge}>{alertCount > 9 ? "9+" : alertCount}</span>}
          </button>

          {alertOpen && (
            <div className={styles.alertDropdown}>
              <div className={styles.alertDdHdr}>Alertas de inventario</div>
              {alertCount === 0 ? (
                <div className={styles.alertDdItem}>
                  <span className={styles.alertDdOk}>✓ Todo el inventario está en orden</span>
                </div>
              ) : (
                <>
                  {alertDetails.outOfStock > 0 && (
                    <button
                      className={`${styles.alertDdItem} ${styles.alertDdRed}`}
                      onClick={() => { router.push("/dashboard/productos?filter=out"); setAlertOpen(false); }}
                    >
                      <span className={styles.alertDdIcon}>⬤</span>
                      <span><strong>{alertDetails.outOfStock}</strong> producto{alertDetails.outOfStock > 1 ? "s" : ""} agotado{alertDetails.outOfStock > 1 ? "s" : ""}</span>
                    </button>
                  )}
                  {alertDetails.lowStock > 0 && (
                    <button
                      className={`${styles.alertDdItem} ${styles.alertDdAmber}`}
                      onClick={() => { router.push("/dashboard/productos?filter=low"); setAlertOpen(false); }}
                    >
                      <span className={styles.alertDdIcon}>⬤</span>
                      <span><strong>{alertDetails.lowStock}</strong> con stock bajo mínimo</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>

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
