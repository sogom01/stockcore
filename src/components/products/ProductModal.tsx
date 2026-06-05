"use client";

import { useState } from "react";

type Category = { id: string; name: string };
type Supplier  = { id: string; name: string };
type Product   = {
  id: string; name: string; sku: string; description: string | null;
  price: number; stock: number; minStock: number; unit: string;
  categoryId: string | null; supplierId: string | null;
};

type Props = {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onSave: (data: Partial<Product> & { id?: string }) => Promise<void>;
  onClose: () => void;
};

export default function ProductModal({ product, categories, suppliers, onSave, onClose }: Props) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name:        product?.name ?? "",
    sku:         product?.sku ?? "",
    description: product?.description ?? "",
    price:       String(product?.price ?? ""),
    stock:       String(product?.stock ?? "0"),
    minStock:    String(product?.minStock ?? "0"),
    unit:        product?.unit ?? "u.",
    categoryId:  product?.categoryId ?? "",
    supplierId:  product?.supplierId ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave({
        ...(isEdit && { id: product!.id }),
        name: form.name,
        sku: form.sku,
        description: form.description || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        minStock: parseInt(form.minStock),
        unit: form.unit,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
      });
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <span className="modal-title">{isEdit ? "Editar producto" : "Nuevo producto"}</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="field">
                <label className="label">Nombre *</label>
                <input className="input" value={form.name} onChange={set("name")} required maxLength={120} placeholder="Ej: Laptop Dell Inspiron"/>
              </div>
              <div className="field">
                <label className="label">SKU *</label>
                <input className="input" value={form.sku} onChange={set("sku")} required maxLength={40} placeholder="Ej: SKU-0001" disabled={isEdit}/>
              </div>
            </div>

            <div className="field">
              <label className="label">Descripción</label>
              <textarea className="input" value={form.description} onChange={set("description")} maxLength={500} placeholder="Descripción opcional del producto"/>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Precio (COP) *</label>
                <input className="input" type="number" value={form.price} onChange={set("price")} required min="0" step="0.01" placeholder="0"/>
              </div>
              <div className="field">
                <label className="label">Unidad</label>
                <input className="input" value={form.unit} onChange={set("unit")} maxLength={10} placeholder="u."/>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Stock actual *</label>
                <input className="input" type="number" value={form.stock} onChange={set("stock")} required min="0"/>
              </div>
              <div className="field">
                <label className="label">Stock mínimo *</label>
                <input className="input" type="number" value={form.minStock} onChange={set("minStock")} required min="0"/>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Categoría</label>
                <select className="input" value={form.categoryId} onChange={set("categoryId")}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Proveedor</label>
                <select className="input" value={form.supplierId} onChange={set("supplierId")}>
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="field-error" style={{padding:".5rem .75rem", background:"var(--red-bg)", border:"1px solid var(--red-bd)"}}>{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-ink" disabled={loading}>
              {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
