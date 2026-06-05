import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./detail.module.css";

type Props = { params: Promise<{ id: string }> };

function fmtPrice(n: number | { toNumber: () => number }) {
  const v = typeof n === "object" ? n.toNumber() : n;
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}
function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Justo ahora";
  if (m < 60) return `Hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return new Date(date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const product = await prisma.product.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      category: true,
      supplier: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) notFound();

  // Calcular stock histórico retrocediendo desde el stock actual
  let running = product.stock;
  const movementsWithStock = product.movements.map(m => {
    const stockAfter = running;
    if (m.type === "ENTRADA")       running -= m.quantity;
    else if (m.type === "SALIDA")   running += m.quantity;
    else /* AJUSTE */               running = NaN; // punto de corte
    return { ...m, stockAfter };
  });

  // Sparkline SVG: últimos 15 movimientos con cantidad
  const sparkData = [...product.movements].reverse().slice(-15);
  const maxQty = Math.max(...sparkData.map(m => m.quantity), 1);
  const W = 200, H = 40;
  const pts = sparkData.map((m, i) => {
    const x = sparkData.length === 1 ? W / 2 : (i / (sparkData.length - 1)) * W;
    const y = H - (m.quantity / maxQty) * (H - 4) - 2;
    return `${x},${y}`;
  });
  const sparkPath = pts.length > 1 ? `M ${pts.join(" L ")}` : "";
  const sparkFill = pts.length > 1
    ? `M ${pts[0]} L ${pts.join(" L ")} L ${W},${H} L 0,${H} Z`
    : "";

  const status = product.stock === 0 ? "out" : product.stock <= product.minStock ? "low" : "ok";
  const statusLabel = status === "ok" ? "En stock" : status === "low" ? "Stock bajo" : "Agotado";

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard/productos" className={styles.backLink}>
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          Productos
        </Link>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{product.name}</span>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div
            className={styles.heroInitial}
            style={{ background: product.category?.color ?? "var(--ink2)" }}
          >
            {product.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className={styles.heroName}>{product.name}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.heroSku}>{product.sku}</span>
              {product.category && (
                <span
                  className={styles.heroCat}
                  style={{ borderColor: product.category.color + "55", color: product.category.color }}
                >
                  {product.category.name}
                </span>
              )}
              <span className={`status-badge ${status}`}>{statusLabel}</span>
            </div>
          </div>
        </div>
        {session?.role !== "VISOR" && (
          <div className={styles.heroActions}>
            <Link href={`/dashboard/productos`} className="btn btn-outline">
              ← Volver
            </Link>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Stock actual</span>
          <span className={`${styles.statVal} ${styles[status]}`}>{product.stock} {product.unit}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Stock mínimo</span>
          <span className={styles.statVal}>{product.minStock} {product.unit}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Precio unitario</span>
          <span className={styles.statVal}>{fmtPrice(product.price as never)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Proveedor</span>
          <span className={styles.statVal}>{product.supplier?.name ?? "—"}</span>
        </div>
      </div>

      {product.description && (
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">Descripción</div>
          </div>
          <p className={styles.description}>{product.description}</p>
        </div>
      )}

      {/* Sparkline + resumen */}
      <div className={styles.chartPanel}>
        <div className="panel-hdr">
          <div className="panel-title">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Actividad de movimientos
          </div>
          <span style={{ fontFamily: "var(--font-m)", fontSize: ".6rem", color: "var(--ink4)" }}>
            {product.movements.length} movimiento{product.movements.length !== 1 ? "s" : ""}
          </span>
        </div>
        {sparkPath && (
          <div className={styles.sparklineWrap}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.sparkline}>
              <defs>
                <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ink)" stopOpacity=".15"/>
                  <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={sparkFill} fill="url(#spark-grad)"/>
              <path d={sparkPath} fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.sparkLabels}>
              <span>Últimas {sparkData.length} operaciones</span>
              <span>Máx: {maxQty} u.</span>
            </div>
          </div>
        )}
      </div>

      {/* Historial de movimientos */}
      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-title">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Historial completo
          </div>
          <span style={{ fontFamily: "var(--font-m)", fontSize: ".6rem", color: "var(--ink4)" }}>
            Últimos {movementsWithStock.length}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Stock resultante</th>
                <th>Nota</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movementsWithStock.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Sin movimientos registrados</td>
                </tr>
              )}
              {movementsWithStock.map(m => (
                <tr key={m.id}>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[m.type.toLowerCase()]}`}>
                      {m.type === "ENTRADA" ? "↑" : m.type === "SALIDA" ? "↓" : "⟳"} {m.type}
                    </span>
                  </td>
                  <td>
                    <span className={styles.qty} style={{
                      color: m.type === "ENTRADA" ? "var(--green)"
                           : m.type === "SALIDA"  ? "var(--red)"
                           : "var(--blue)"
                    }}>
                      {m.type === "ENTRADA" ? "+" : m.type === "SALIDA" ? "−" : "→"}{m.quantity} {product.unit}
                    </span>
                  </td>
                  <td>
                    {isNaN(m.stockAfter)
                      ? <span className={styles.muted}>—</span>
                      : <span className={`${styles.stockAfter} ${m.stockAfter === 0 ? styles.out : m.stockAfter <= product.minStock ? styles.low : styles.ok}`}>
                          {m.stockAfter} {product.unit}
                        </span>
                    }
                  </td>
                  <td className={styles.note}>{m.note ?? <span className={styles.muted}>—</span>}</td>
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
