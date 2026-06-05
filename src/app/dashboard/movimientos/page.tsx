import { prisma } from "@/lib/prisma";
import styles from "./movimientos.module.css";

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Justo ahora";
  if (m < 60) return `Hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return new Date(date).toLocaleDateString("es-CO", { day:"numeric", month:"short" });
}

export default async function MovimientosPage() {
  const movements = await prisma.movement.findMany({
    include: {
      product: { select: { name: true, sku: true, unit: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const entradas = movements.filter(m => m.type === "ENTRADA").reduce((s, m) => s + m.quantity, 0);
  const salidas  = movements.filter(m => m.type === "SALIDA").reduce((s, m) => s + m.quantity, 0);
  const ajustes  = movements.filter(m => m.type === "AJUSTE").length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Movimientos</h1>
          <p className={styles.subtitle}>Historial completo de entradas, salidas y ajustes</p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Total entradas</div>
          <div className={styles.kpiVal} style={{ color:"var(--green)" }}>+{entradas} u.</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Total salidas</div>
          <div className={styles.kpiVal} style={{ color:"var(--ink2)" }}>−{salidas} u.</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Neto</div>
          <div className={styles.kpiVal} style={{ color: entradas - salidas >= 0 ? "var(--green)" : "var(--red)" }}>
            {entradas - salidas >= 0 ? "+" : ""}{entradas - salidas} u.
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Ajustes manuales</div>
          <div className={styles.kpiVal} style={{ color:"var(--blue)" }}>{ajustes}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-title">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Historial de movimientos
          </div>
          <span style={{ fontFamily:"var(--font-m)", fontSize:".6rem", color:"var(--ink4)" }}>
            Últimos {movements.length} registros
          </span>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Nota</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:"center", padding:"2rem", color:"var(--ink4)", fontFamily:"var(--font-m)", fontSize:".72rem"}}>Sin movimientos registrados</td></tr>
              )}
              {movements.map(m => (
                <tr key={m.id}>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[m.type.toLowerCase()]}`}>
                      {m.type === "ENTRADA" ? "↑" : m.type === "SALIDA" ? "↓" : "⟳"} {m.type}
                    </span>
                  </td>
                  <td>
                    <div className={styles.productName}>{m.product.name}</div>
                    <div className={styles.productSku}>{m.product.sku}</div>
                  </td>
                  <td>
                    <span className={styles.qty} style={{ color: m.type === "ENTRADA" ? "var(--green)" : m.type === "SALIDA" ? "var(--red)" : "var(--blue)" }}>
                      {m.type === "ENTRADA" ? "+" : m.type === "SALIDA" ? "−" : "±"}{m.quantity} {m.product.unit}
                    </span>
                  </td>
                  <td className={styles.note}>{m.note ?? <span style={{color:"var(--ink4)"}}>—</span>}</td>
                  <td className={styles.user}>{m.user.name}</td>
                  <td className={styles.time}>{timeAgo(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
