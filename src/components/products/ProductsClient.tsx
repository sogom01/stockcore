"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import StockModal from "./StockModal";
import Toast, { ToastMsg } from "@/components/Toast";
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
  categories: Category[];
  suppliers:  Supplier[];
  role:       string;
  initialSearch?: string;
};

const PAGE_SIZE = 20;

/** Genera la lista de números/ellipsis para la paginación. Máx 7 items visibles. */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "…", total);
  } else if (current >= total - 3) {
    pages.push(1, "…", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "…", current - 1, current, current + 1, "…", total);
  }
  return pages;
}

export default function ProductsClient({ categories, suppliers, role, initialSearch = "" }: Props) {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState<"all" | "ok" | "low" | "out">("all");
  const [search, setSearch]         = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [editProduct, setEditProduct]   = useState<Product | null | "new">(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [toasts, setToasts]             = useState<ToastMsg[]>([]);

  // Debounce search
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page on new search
    }, 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (filter !== "all") params.set("filter", filter);
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (supplierId) params.set("supplierId", supplierId);

    const res = await fetch(`/api/products?${params}`);
    if (res.ok) {
      const json = await res.json();
      setProducts(json.data);
      setTotal(json.total);
    }
    setLoading(false);
  }, [page, filter, debouncedSearch, categoryId, supplierId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Resetear página al cambiar filtros avanzados
  useEffect(() => { setPage(1); }, [categoryId, supplierId]);

  function toast(text: string, type: ToastMsg["type"] = "success") {
    const id = Date.now();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  // ── CSV Export ──────────────────────────────────────────────────────────
  function exportCSV() {
    if (products.length === 0) { toast("No hay productos para exportar", "warning"); return; }

    const headers = ["Nombre", "SKU", "Categoría", "Stock", "Stock Mínimo", "Unidad", "Precio (COP)", "Proveedor"];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category?.name ?? "",
      p.stock,
      p.minStock,
      p.unit,
      p.price,
      p.supplier?.name ?? "",
    ]);

    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\r\n");

    const bom  = "﻿"; // BOM para Excel en español
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `stockcore-productos-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
    toast(`${products.length} productos exportados`);
  }

  // ── CRUD handlers ────────────────────────────────────────────────────────
  async function handleSave(data: Partial<Product> & { id?: string }) {
    const isEdit = Boolean(data.id);
    const url    = isEdit ? `/api/products/${data.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast((await res.json()).error ?? "Error al guardar", "error");
      return;
    }

    const saved: Product = await res.json();
    toast(`"${saved.name}" ${isEdit ? "actualizado" : "creado"} correctamente`);
    setEditProduct(null);
    setPage(1);
    fetchProducts();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) { toast("Error al eliminar", "error"); return; }

    toast(`"${name}" eliminado`);
    fetchProducts();
  }

  async function handleStock(productId: string, type: string, quantity: number, note: string) {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, type, quantity, note }),
    });

    if (!res.ok) {
      toast((await res.json()).error ?? "Error al registrar movimiento", "error");
      return;
    }

    toast("Movimiento registrado correctamente");
    setStockProduct(null);
    fetchProducts();
  }

  // ── Pagination helpers ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from       = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, total);

  function handleFilter(f: typeof filter) {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>
            {loading ? "Cargando…" : `${total} producto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-outline" onClick={exportCSV} title="Exportar lista actual como CSV">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
          {role !== "VISOR" && (
            <button className="btn btn-ink" onClick={() => setEditProduct("new")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo producto
            </button>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className={styles.controls} style={{ alignItems: "flex-start", flexDirection: "column", gap: ".5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap", width: "100%" }}>
        <div className={styles.filters}>
          {(["all", "ok", "low", "out"] as const).map(f => (
            <button
              key={f}
              className={`${styles.fpill} ${styles[f]}${filter === f ? ` ${styles.fpillActive}` : ""}`}
              onClick={() => handleFilter(f)}
            >
              {f === "all" ? "Todos" : f === "ok" ? "En stock" : f === "low" ? "Stock bajo" : "Agotados"}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")} title="Limpiar">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Botón toggle filtros avanzados */}
        <button
          className={`${styles.filtersToggle}${filtersOpen ? ` ${styles.filtersToggleOpen}` : ""}${categoryId || supplierId ? ` ${styles.filtersToggleActive}` : ""}`}
          onClick={() => setFiltersOpen(v => !v)}
        >
          <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filtros avanzados
          {(categoryId || supplierId) && <span className={styles.filterActiveDot}/>}
        </button>
        </div>

        {/* Panel de filtros avanzados */}
        {filtersOpen && (
          <div className={styles.advFilters}>
            <div className={styles.advFilterField}>
              <label className={styles.advFilterLabel}>Categoría</label>
              <select
                className="input"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.advFilterField}>
              <label className={styles.advFilterLabel}>Proveedor</label>
              <select
                className="input"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {(categoryId || supplierId) && (
              <button
                className={`${styles.filtersToggle} btn btn-outline`}
                onClick={() => { setCategoryId(""); setSupplierId(""); }}
                style={{ alignSelf: "flex-end" }}
              >
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando productos…</span>
        </div>
      ) : (
        <ProductTable
          products={products}
          role={role}
          onEdit={p => setEditProduct(p as Product)}
          onDelete={handleDelete}
          onStock={p => setStockProduct(p as Product)}
        />
      )}

      {/* Paginación */}
      {!loading && total > PAGE_SIZE && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {from}–{to} de {total}
          </span>
          <div className={styles.paginControls}>
            <button
              className={styles.paginBtn}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              title="Página anterior"
            >
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className={styles.paginPages}>
              {buildPageList(page, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`ellipsis-${i}`} className={styles.paginEllipsis}>…</span>
                ) : (
                  <button
                    key={n}
                    className={`${styles.paginNum}${n === page ? ` ${styles.paginNumActive}` : ""}`}
                    onClick={() => setPage(n as number)}
                  >
                    {n}
                  </button>
                )
              )}
            </span>
            <button
              className={styles.paginBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              title="Página siguiente"
            >
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      )}

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

      <Toast toasts={toasts} />
    </div>
  );
}
