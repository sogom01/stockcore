"use client";

import Link from "next/link";
import styles from "./Products.module.css";

type Product = {
  id: string; name: string; sku: string; price: number;
  stock: number; minStock: number; unit: string;
  category: { name: string; color: string } | null;
  supplier: { name: string } | null;
};

type Props = {
  products: Product[];
  role: string;
  onEdit: (p: Product) => void;
  onDelete: (id: string, name: string) => void;
  onStock: (p: Product) => void;
};

function getStatus(stock: number, min: number) {
  if (stock === 0) return "out";
  if (stock <= min) return "low";
  return "ok";
}

function getStatusLabel(s: string) {
  return s === "ok" ? "En stock" : s === "low" ? "Stock bajo" : "Agotado";
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function ProductTable({ products, role, onEdit, onDelete, onStock }: Props) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
        </svg>
        <p>No hay productos que coincidan con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Proveedor</th>
              {role !== "VISOR" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const status = getStatus(p.stock, p.minStock);
              const pct = Math.min(100, Math.round((p.stock / Math.max(p.stock, p.minStock * 4, 10)) * 100));
              return (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productInitial}
                        style={{ background: p.category?.color ?? "var(--ink2)" }}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/dashboard/productos/${p.id}`} className={styles.productName}>{p.name}</Link>
                        <div className={styles.productSku}>{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.category
                      ? <span className={styles.catBadge} style={{ borderColor: p.category.color + "44", color: p.category.color }}>{p.category.name}</span>
                      : <span className={styles.catBadge}>Sin categoría</span>
                    }
                  </td>
                  <td>
                    <div className={styles.stockCell}>
                      <span className={`${styles.stockNum} ${styles[status]}`}>{p.stock} {p.unit}</span>
                      <div className={styles.stockBar}>
                        <div className={`${styles.stockFill} ${styles[status]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={styles.mono}>{p.minStock} {p.unit}</td>
                  <td><span className={`status-badge ${status}`}>{getStatusLabel(status)}</span></td>
                  <td className={styles.mono}>{fmtPrice(p.price)}</td>
                  <td className={styles.supplier}>{p.supplier?.name ?? "—"}</td>
                  {role !== "VISOR" && (
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} title="Ajustar stock" onClick={() => onStock(p)}>
                          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <button className={styles.actionBtn} title="Editar" onClick={() => onEdit(p as never)}>
                          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {role === "ADMIN" && (
                          <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Eliminar" onClick={() => onDelete(p.id, p.name)}>
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.tableFooter}>
        <span className={styles.tfInfo}>{products.length} producto(s)</span>
      </div>
    </div>
  );
}
