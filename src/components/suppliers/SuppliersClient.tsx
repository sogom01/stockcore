"use client";

import { useState } from "react";
import Toast, { ToastMsg } from "@/components/Toast";
import styles from "./Suppliers.module.css";

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  _count: { products: number };
};

type Props = { initialSuppliers: Supplier[]; role: string };

export default function SuppliersClient({ initialSuppliers, role }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [toasts, setToasts]       = useState<ToastMsg[]>([]);
  const [modal, setModal]         = useState<Supplier | "new" | null>(null);
  const [saving, setSaving]       = useState(false);

  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function openNew() {
    setName(""); setEmail(""); setPhone("");
    setModal("new");
  }

  function openEdit(s: Supplier) {
    setName(s.name); setEmail(s.email ?? ""); setPhone(s.phone ?? "");
    setModal(s);
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
    const url    = isEdit ? `/api/suppliers/${(modal as Supplier).id}` : "/api/suppliers";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al guardar", "error");
      return;
    }

    const saved: Supplier = await res.json();
    if (isEdit) {
      setSuppliers(ss => ss.map(s => s.id === saved.id ? saved : s));
      toast(`"${saved.name}" actualizado`);
    } else {
      setSuppliers(ss => [...ss, saved].sort((a, b) => a.name.localeCompare(b.name)));
      toast(`"${saved.name}" creado`);
    }
    setModal(null);
  }

  async function handleDelete(sup: Supplier) {
    if (sup._count.products > 0) {
      toast(`No se puede eliminar: ${sup._count.products} producto(s) activos`, "error");
      return;
    }
    if (!confirm(`¿Eliminar proveedor "${sup.name}"?`)) return;

    const res = await fetch(`/api/suppliers/${sup.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast(err.error ?? "Error al eliminar", "error");
      return;
    }
    setSuppliers(ss => ss.filter(s => s.id !== sup.id));
    toast(`"${sup.name}" eliminado`);
  }

  const canEdit = role !== "VISOR";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Proveedores</h1>
          <p className={styles.subtitle}>{suppliers.length} proveedores registrados</p>
        </div>
        {canEdit && (
          <button className="btn btn-ink" onClick={openNew}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo proveedor
          </button>
        )}
      </div>

      <div className="panel">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Productos</th>
              {canEdit && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={canEdit ? 5 : 4} className={styles.empty}>Sin proveedores</td></tr>
            )}
            {suppliers.map(sup => (
              <tr key={sup.id}>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.avatar}>{sup.name[0].toUpperCase()}</div>
                    <span className={styles.supName}>{sup.name}</span>
                  </div>
                </td>
                <td className={styles.contact}>{sup.email ?? <span className={styles.empty2}>—</span>}</td>
                <td className={styles.contact}>{sup.phone ?? <span className={styles.empty2}>—</span>}</td>
                <td><span className={styles.count}>{sup._count.products}</span></td>
                {canEdit && (
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Editar" onClick={() => openEdit(sup)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {role === "ADMIN" && (
                        <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Eliminar" onClick={() => handleDelete(sup)}>
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
              <span className="modal-title">{modal === "new" ? "Nuevo proveedor" : "Editar proveedor"}</span>
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
                  placeholder="Ej. Distribuidora ABC"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contacto@proveedor.com"
                  />
                </div>
                <div className="field">
                  <label className="label">Teléfono</label>
                  <input
                    className="input"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-ink" onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? "Guardando…" : modal === "new" ? "Crear proveedor" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
