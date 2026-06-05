"use client";

import { useState } from "react";
import Toast, { ToastMsg } from "@/components/Toast";
import styles from "./Categories.module.css";

type Category = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  _count: { products: number };
};

type Props = { initialCategories: Category[]; role: string };

const PRESET_COLORS = [
  "#1A1916","#C0392B","#E67E22","#C47900","#1A8A4A",
  "#1A5FA8","#8E44AD","#16A085","#2C3E50","#6B6860",
];

export default function CategoriesClient({ initialCategories, role }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [toasts, setToasts]         = useState<ToastMsg[]>([]);
  const [modal, setModal]           = useState<Category | "new" | null>(null);
  const [saving, setSaving]         = useState(false);

  // form state
  const [name, setName]   = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  function openNew() {
    setName(""); setColor(PRESET_COLORS[0]);
    setModal("new");
  }

  function openEdit(c: Category) {
    setName(c.name); setColor(c.color);
    setModal(c);
  }

  function toast(text: string, type: ToastMsg["type"] = "success") {
    const id = Date.now();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const isEdit = modal !== "new";
    const url    = isEdit ? `/api/categories/${(modal as Category).id}` : "/api/categories";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al guardar", "error");
      return;
    }

    const saved: Category = await res.json();
    if (isEdit) {
      setCategories(cs => cs.map(c => c.id === saved.id ? saved : c));
      toast(`"${saved.name}" actualizada`);
    } else {
      setCategories(cs => [...cs, saved].sort((a, b) => a.name.localeCompare(b.name)));
      toast(`"${saved.name}" creada`);
    }
    setModal(null);
  }

  async function handleDelete(cat: Category) {
    if (cat._count.products > 0) {
      toast(`No se puede eliminar: ${cat._count.products} producto(s) activos`, "error");
      return;
    }
    if (!confirm(`¿Eliminar categoría "${cat.name}"?`)) return;

    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al eliminar", "error");
      return;
    }
    setCategories(cs => cs.filter(c => c.id !== cat.id));
    toast(`"${cat.name}" eliminada`);
  }

  const canEdit = role !== "VISOR";

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categorías</h1>
          <p className={styles.subtitle}>{categories.length} categorías registradas</p>
        </div>
        {canEdit && (
          <button className="btn btn-ink" onClick={openNew}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva categoría
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="panel">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Productos activos</th>
              <th>Creada</th>
              {canEdit && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={canEdit ? 4 : 3} className={styles.empty}>Sin categorías</td></tr>
            )}
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>
                  <div className={styles.catCell}>
                    <span className={styles.colorSwatch} style={{ background: cat.color }} />
                    <span className={styles.catName}>{cat.name}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.count}>{cat._count.products}</span>
                </td>
                <td className={styles.mono}>
                  {new Date(cat.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                {canEdit && (
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Editar" onClick={() => openEdit(cat)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {role === "ADMIN" && (
                        <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Eliminar" onClick={() => handleDelete(cat)}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">{modal === "new" ? "Nueva categoría" : "Editar categoría"}</span>
              <button className="modal-close" onClick={() => setModal(null)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder="Ej. Electrónica"
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="label">Color</label>
                <div className={styles.colorGrid}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorDot}${color === c ? ` ${styles.colorDotActive}` : ""}`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    className={styles.colorPicker}
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    title="Color personalizado"
                  />
                </div>
                <div className={styles.colorPreview}>
                  <span className={styles.catBadgePreview} style={{ borderColor: color, color }}>
                    {name || "Vista previa"}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-ink" onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? "Guardando…" : modal === "new" ? "Crear categoría" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
