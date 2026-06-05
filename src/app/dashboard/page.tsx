import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "./page.module.css";

async function getDashboardData() {
  const [products, movements, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { stock: true, minStock: true },
    }),
    prisma.movement.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      include: {
        products: { where: { status: "ACTIVE" }, select: { stock: true } },
      },
    }),
  ]);

  const inStock = products.filter(p => p.stock > p.minStock).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return { total: products.length, inStock, lowStock, outOfStock, movements, categories };
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Justo ahora";
  if (m < 60) return `Hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData();

  const kpis = [
    { label: "SKUs en stock", value: data.inStock, sub: `de ${data.total} productos activos`, color: "green", delta: "Actualizado", deltaClass: "up" },
    { label: "Stock bajo", value: data.lowStock, sub: "por debajo del mínimo", color: "amber", delta: data.lowStock > 0 ? "⚠ Requiere atención" : "Sin alertas", deltaClass: data.lowStock > 0 ? "warn" : "up" },
    { label: "Agotados", value: data.outOfStock, sub: "requieren reposición urgente", color: "red", delta: data.outOfStock > 0 ? "↑ Urgente" : "Todo en orden", deltaClass: data.outOfStock > 0 ? "down" : "up" },
    { label: "Total productos", value: data.total, sub: "productos activos registrados", color: "blue", delta: "En inventario", deltaClass: "norm" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Bienvenido, {session?.name} · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className={styles.kpiRow}>
        {kpis.map(k => (
          <div key={k.label} className={`${styles.kpi} ${styles[`k_${k.color}`]}`}>
            <div className={styles.kpiLabel}>// {k.label}</div>
            <div className={styles.kpiValue}>{k.value}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
            <div className={`${styles.kpiDelta} ${styles[k.deltaClass]}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className={styles.midGrid}>
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Alertas de stock
            </div>
            <span style={{ fontFamily: "var(--font-m)", fontSize: ".6rem", color: "var(--ink4)" }}>
              {data.lowStock + data.outOfStock} activas
            </span>
          </div>
          <div className={styles.alertsList}>
            {data.outOfStock === 0 && data.lowStock === 0 ? (
              <div className={styles.emptyState}>✓ Todo el inventario está en orden</div>
            ) : (
              <>
                {data.outOfStock > 0 && (
                  <div className={`${styles.alertItem} ${styles.alertCritical}`}>
                    <div className={styles.alertTitle}>Productos agotados</div>
                    <div className={styles.alertMsg}>{data.outOfStock} producto(s) con stock 0. Requieren reposición urgente.</div>
                    <a href="/dashboard/productos?filter=out" className={styles.alertLink}>Ver agotados →</a>
                  </div>
                )}
                {data.lowStock > 0 && (
                  <div className={`${styles.alertItem} ${styles.alertLow}`}>
                    <div className={styles.alertTitle}>Stock bajo</div>
                    <div className={styles.alertMsg}>{data.lowStock} producto(s) por debajo del mínimo establecido.</div>
                    <a href="/dashboard/productos?filter=low" className={styles.alertLink}>Ver stock bajo →</a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Stock por categoría
            </div>
          </div>
          <div className={styles.catList}>
            {data.categories.map(cat => {
              const total = cat.products.reduce((s, p) => s + p.stock, 0);
              const max = Math.max(...data.categories.map(c => c.products.reduce((s, p) => s + p.stock, 0)), 1);
              const pct = Math.round((total / max) * 100);
              return (
                <div key={cat.id} className={styles.catRow}>
                  <span className={styles.catLabel}>{cat.name}</span>
                  <div className={styles.catTrack}>
                    <div className={styles.catFill} style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                  <span className={styles.catVal}>{total.toLocaleString()} u.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-title">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Actividad reciente
          </div>
          <span style={{ fontFamily: "var(--font-m)", fontSize: ".6rem", color: "var(--ink4)" }}>Últimas 24 horas</span>
        </div>
        <div className={styles.activityList}>
          {data.movements.length === 0 ? (
            <div className={styles.emptyState}>Sin movimientos en las últimas 24 horas</div>
          ) : (
            data.movements.map(m => (
              <div key={m.id} className={styles.actRow}>
                <div className={`${styles.actIcon} ${styles[`act_${m.type.toLowerCase()}`]}`}>
                  {m.type === "ENTRADA" ? "↑" : m.type === "SALIDA" ? "↓" : "⟳"}
                </div>
                <div className={styles.actBody}>
                  <span className={styles.actText}>
                    <strong>{m.type === "ENTRADA" ? "+" : m.type === "SALIDA" ? "−" : "±"}{m.quantity} u.</strong>{" "}
                    {m.product.name}{m.note ? ` — ${m.note}` : ""}
                  </span>
                  <span className={styles.actMeta}>{m.user.name} · {m.product.sku}</span>
                </div>
                <div className={styles.actTime}>{timeAgo(m.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
