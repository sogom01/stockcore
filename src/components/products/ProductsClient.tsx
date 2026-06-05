"use client";

import { useState, useMemo } from "react";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import StockModal from "./StockModal";
import Toast from "@/components/Toast";
import styles from "./Products.module.css";

type Category = { id: string; name: string; color: string };
type Supplier  = { id: string; name: string };
type Product   = {
  id: string; name: string; sku: string; description: string | null;
  price: number; stock: number; minStock: number; unit: string;
  categoryId: string | null; supplierId: string | null;
  category: Category | null; supplier: Supplier | null;
  createdAt: string; updatedAt: string;
};

type Props = {
  initialProducts: Product[];
  categories: Category[];
  suppliers: Supplier[];
  role: string;
};

export type ToastMsg = { id: number; text: string; type: "success" | "error" | "warning" };

export default function ProductsClient({ initialProducts, categories, suppliers, role }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "ok" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  function toast(text: string, type: ToastMsg["type"] = "success") {
    const id = Date.now();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "ok")  list = list.filter(p => p.stock > p.minStock);
    if (filter === "low") list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
    if (filter === "out") list = list.filter(p => p.stock === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, filter, search]);

  async function handleSave(data: Partial<Product> & { id?: string }) {
    const isEdit = Boolean(data.id);
    const url = isEdit ? `/api/products/${data.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al guardar", "error");
      return;
    }

    const saved: Product = await res.json();

    if (isEdit) {
      setProducts(ps => ps.map(p => p.id === saved.id ? saved : p));
      toast(`"${saved.name}" actualizado correctamente`);
    } else {
      setProducts(ps => [saved, ...ps]);
      toast(`"${saved.name}" creado correctamente`);
    }
    setEditProduct(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) { toast("Error al eliminar", "error"); return; }

    setProducts(ps => ps.filter(p => p.id !== id));
    toast(`"${name}" eliminado`);
  }

  async function handleStock(productId: string, type: string, quantity: number, note: string) {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, type, quantity, note }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al registrar movimiento", "error");
      return;
    }

    const delta = type === "ENTRADA" ? quantity : type === "SALIDA" ? -quantity : 0;
    setProducts(ps => ps.map(p =>
      p.id === productId
        ? { ...p, stock: type === "AJUSTE" ? quantity : p.stock + delta }
        : p
    ));

    toast(`Movimiento registrado correctamente`);
    setStockProduct(null);
  }

  const counts = {
    all: products.length,
    ok:  products.filter(p => p.stock > p.minStock).length,
    low: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    out: products.filter(p => p.stock === 0).length,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>{products.length} productos activos en inventario</p>
        </div>
        {role !== "VISOR" && (
          <button className="btn btn-ink" onClick={() => setEditProduct("new")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo producto
          </button>
        )}
      </div>

      {/* Controles */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          {(["all","ok","low","out"] as const).map(f => (
            <button
              key={f}
              className={`${styles.fpill} ${styles[f]}${filter === f ? ` ${styles.fpillActive}` : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : f === "ok" ? "En stock" : f === "low" ? "Stock bajo" : "Agotados"}
              <span className={styles.fpillCount}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <ProductTable
        products={filtered}
        role={role}
        onEdit={p => setEditProduct(p as Product)}
        onDelete={handleDelete}
        onStock={p => setStockProduct(p as Product)}
      />

      {/* Modal crear/editar */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct === "new" ? null : editProduct}
          categories={categories}
          suppliers={suppliers}
          onSave={handleSave}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Modal stock */}
      {stockProduct && (
        <StockModal
          product={stockProduct}
          onSave={handleStock}
          onClose={() => setStockProduct(null)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
