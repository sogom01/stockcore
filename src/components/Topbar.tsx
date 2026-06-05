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

  // ── Búsqueda global ───────────────────────────────────────────
  const [searchVal, setSearchVal]   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pathname === "/dashboard/productos") {
      setSearchVal(new URLSearchParams(window.location.search).get("q") ?? "");
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

  // ── Alertas de stock ──────────────────────────────────────────
  const [alertCount, setAlertCount]     = useState(0);
  const [alertOpen, setAlertOpen]       = useState(false);
  const [alertDetails, setAlertDetails] = useState({ outOfStock: 0, lowStock: 0 });
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        setAlertDetails({ outOfStock: d.outOfStock ?? 0, lowStock: d.lowStock ?? 0 });
        setAlertCount((d.outOfStock ?? 0) + (d.lowStock ?? 0));
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (alertRef.current && !alertRef.current.contains(e.target as Node)) setAlertOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Menú de usuario ───────────────────────────────────────────
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [profileName, setProfileName]       = useState(user.name ?? "");
  const [profilePwd, setProfilePwd]         = useState("");
  const [profilePwdConf, setProfilePwdConf] = useState("");
  const [profileErr, setProfileErr]         = useState("");
  const [profileSaving, setProfileSaving]   = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function openProfile() {
    setProfileName(user.name ?? "");
    setProfilePwd(""); setProfilePwdConf(""); setProfileErr("");
    setUserMenuOpen(false);
    setProfileOpen(true);
  }

  async function handleProfileSave() {
    setProfileErr("");
    if (!profileName.trim()) { setProfileErr("El nombre no puede estar vacío"); return; }
    if (profilePwd && profilePwd !== profilePwdConf) { setProfileErr("Las contraseñas no coinciden"); return; }
    if (profilePwd && profilePwd.length < 6) { setProfileErr("Mínimo 6 caracteres"); return; }

    setProfileSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileName.trim(), password: profilePwd || undefined }),
    });
    setProfileSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setProfileErr(data.error ?? "Error al guardar");
      return;
    }
    setProfileOpen(false);
    router.refresh(); // refresca el layout server-side → nuevo nombre en el topbar
  }

  // ── Helpers ───────────────────────────────────────────────────
  const initials = (user.name ?? "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const tabs = NAV.filter(n => !n.adminOnly || user.role === "ADMIN");

  return (
    <>
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
            <button className={styles.iconBtn} onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }} title="Buscar productos">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          )}

          {/* Alertas */}
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
                <div className={styles.ddHdr}>Alertas de inventario</div>
                {alertCount === 0 ? (
                  <div className={styles.ddItem}><span style={{ color: "var(--green)", fontSize: ".74rem" }}>✓ Todo en orden</span></div>
                ) : (
                  <>
                    {alertDetails.outOfStock > 0 && (
                      <button className={`${styles.ddItem} ${styles.ddItemRed}`}
                        onClick={() => { router.push("/dashboard/productos?filter=out"); setAlertOpen(false); }}>
                        <span className={styles.ddDot} style={{ background: "var(--red2)" }} />
                        <strong>{alertDetails.outOfStock}</strong>&nbsp;agotado{alertDetails.outOfStock > 1 ? "s" : ""}
                      </button>
                    )}
                    {alertDetails.lowStock > 0 && (
                      <button className={`${styles.ddItem} ${styles.ddItemAmber}`}
                        onClick={() => { router.push("/dashboard/productos?filter=low"); setAlertOpen(false); }}>
                        <span className={styles.ddDot} style={{ background: "var(--amber2)" }} />
                        <strong>{alertDetails.lowStock}</strong>&nbsp;bajo mínimo
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button className={styles.iconBtn} onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {/* Sync badge */}
          <div className={styles.syncBadge}>
            <span className={styles.syncDot} />
            <span>En línea</span>
          </div>

          {/* Avatar → menú de usuario */}
          <div className={styles.userMenuWrap} ref={userMenuRef}>
            <button
              className={`${styles.avatarBtn}${userMenuOpen ? ` ${styles.avatarBtnOpen}` : ""}`}
              onClick={() => setUserMenuOpen(v => !v)}
              title="Opciones de cuenta"
            >
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.role}</span>
              <svg className={styles.avatarChevron} viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {userMenuOpen && (
              <div className={styles.userDropdown}>
                {/* Header */}
                <div className={styles.userDdHeader}>
                  <div className={styles.userDdAvatar}>{initials}</div>
                  <div>
                    <div className={styles.userDdName}>{user.name}</div>
                    <div className={styles.userDdEmail}>{user.email}</div>
                    <span className={`status-badge ok`} style={{ marginTop: ".25rem", display: "inline-flex" }}>{user.role}</span>
                  </div>
                </div>
                <div className={styles.userDdDivider} />
                {/* Opciones */}
                <button className={styles.userDdItem} onClick={openProfile}>
                  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Actualizar perfil
                </button>
                <form action={logoutAction} className={styles.userDdLogoutForm}>
                  <button type="submit" className={`${styles.userDdItem} ${styles.userDdLogout}`}>
                    <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Modal de perfil */}
      {profileOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setProfileOpen(false); }}>
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Actualizar perfil</span>
              <button className="modal-close" onClick={() => setProfileOpen(false)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="label">Email</label>
                <input className="input" value={user.email ?? ""} disabled />
              </div>
              <div className="field">
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Tu nombre completo"
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="label">Nueva contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={profilePwd}
                  onChange={e => setProfilePwd(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>
              {profilePwd && (
                <div className="field">
                  <label className="label">Confirmar contraseña</label>
                  <input
                    className="input"
                    type="password"
                    value={profilePwdConf}
                    onChange={e => setProfilePwdConf(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
              )}
              {profileErr && <p className="field-error">{profileErr}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setProfileOpen(false)}>Cancelar</button>
              <button
                className="btn btn-ink"
                onClick={handleProfileSave}
                disabled={profileSaving || !profileName.trim()}
              >
                {profileSaving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
