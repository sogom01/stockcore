"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import styles from "./login.module.css";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className={styles.shell}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 3v18M3.27 6.96L12 12l8.73-5.04M3.27 17.04L12 12l8.73 5.04" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className={styles.brandName}>StockCore</span>
        </div>

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Gestión de inventario en tiempo real</h1>
          <p className={styles.heroSub}>
            Control total de productos, movimientos y alertas desde un solo panel.
          </p>
        </div>

        <div className={styles.features}>
          {[
            ["📦", "CRUD de productos con historial de movimientos"],
            ["🔔", "Alertas automáticas de stock bajo y agotado"],
            ["👥", "Roles: Admin, Gestor y Visor"],
            ["📊", "Dashboard con KPIs en tiempo real"],
          ].map(([icon, text]) => (
            <div key={text as string} className={styles.featureRow}>
              <span className={styles.featureIcon}>{icon}</span>
              <span className={styles.featureText}>{text}</span>
            </div>
          ))}
        </div>

        <div className={styles.leftFooter}>
          <span className={styles.version}>StockCore v1.0</span>
          <span className={styles.sep}>·</span>
          <span>Portafolio demo</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardLabel}>// Acceso al sistema</p>
            <h2 className={styles.cardTitle}>Iniciar sesión</h2>
          </div>

          <form action={formAction} className={styles.form}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input${state?.error ? " error" : ""}`}
                placeholder="admin@stockcore.com"
                defaultValue="admin@stockcore.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                className={`input${state?.error ? " error" : ""}`}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {state?.error && (
              <div className={styles.errorBox}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-ink"
              disabled={pending}
              style={{ width: "100%", justifyContent: "center", padding: ".65rem" }}
            >
              {pending ? "Verificando…" : "Ingresar al sistema"}
            </button>
          </form>

          <div className={styles.demoHint}>
            <span className={styles.demoLabel}>Demo</span>
            <span>admin@stockcore.com · admin1234</span>
          </div>
        </div>
      </div>
    </div>
  );
}
