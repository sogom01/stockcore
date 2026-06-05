"use client";

import { useState } from "react";
import Toast from "./Toast";
import styles from "./UsersClient.module.css";

type User = { id: string; name: string; email: string; role: string; active: boolean; createdAt: string };
type ToastMsg = { id: number; text: string; type: "success" | "error" | "warning" };

type Props = { initialUsers: User[]; currentUserId: string; userCount: number; maxUsers: number };

const ROLES = ["ADMIN", "GESTOR", "VISOR"] as const;

export default function UsersClient({ initialUsers, currentUserId, userCount, maxUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"VISOR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toast(text: string, type: ToastMsg["type"] = "success") {
    const id = Date.now();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Error al crear usuario");
      return;
    }

    const user = await res.json();
    setUsers(u => [user, ...u]);
    toast(`Usuario "${user.name}" creado correctamente`);
    setShowModal(false);
    setForm({ name:"", email:"", password:"", role:"VISOR" });
  }

  const roleColor = (r: string) => r === "ADMIN" ? "var(--red)" : r === "GESTOR" ? "var(--amber)" : "var(--ink4)";
  const roleBg    = (r: string) => r === "ADMIN" ? "var(--red-bg)" : r === "GESTOR" ? "var(--amber-bg)" : "var(--bg)";
  const roleBd    = (r: string) => r === "ADMIN" ? "var(--red-bd)" : r === "GESTOR" ? "var(--amber-bd)" : "var(--border)";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuarios</h1>
          <p className={styles.subtitle}>{users.length} de {maxUsers} usuarios registrados</p>
        </div>
        <button
          className="btn btn-ink"
          onClick={() => setShowModal(true)}
          disabled={userCount >= maxUsers}
          title={userCount >= maxUsers ? `Límite de ${maxUsers} usuarios alcanzado` : ""}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Límite visual */}
      <div className={styles.limitBar}>
        <div className={styles.limitInfo}>
          <span className={styles.limitLabel}>Capacidad de usuarios</span>
          <span className={styles.limitCount}>{users.length} / {maxUsers}</span>
        </div>
        <div className={styles.limitTrack}>
          <div className={styles.limitFill} style={{ width:`${(users.length/maxUsers)*100}%` }}/>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel">
        <div className="panel-hdr">
          <div className="panel-title">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Lista de usuarios
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar} style={{ background: roleColor(u.role) }}>
                      {u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <div className={styles.userName}>{u.name}</div>
                      {u.id === currentUserId && <div className={styles.youBadge}>Tú</div>}
                    </div>
                  </div>
                </td>
                <td className={styles.email}>{u.email}</td>
                <td>
                  <span className={styles.roleBadge} style={{ color:roleColor(u.role), background:roleBg(u.role), borderColor:roleBd(u.role) }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${u.active ? "ok" : "out"}`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className={styles.date}>
                  {new Date(u.createdAt).toLocaleDateString("es-CO", { day:"numeric", month:"short", year:"numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo usuario */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-hdr">
              <span className="modal-title">Nuevo usuario</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="field">
                  <label className="label">Nombre completo *</label>
                  <input className="input" value={form.name} onChange={set("name")} required maxLength={60} placeholder="Ej: Juan García"/>
                </div>
                <div className="field">
                  <label className="label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={set("email")} required placeholder="correo@empresa.com"/>
                </div>
                <div className="field">
                  <label className="label">Contraseña *</label>
                  <input className="input" type="password" value={form.password} onChange={set("password")} required minLength={6} placeholder="Mínimo 6 caracteres"/>
                </div>
                <div className="field">
                  <label className="label">Rol *</label>
                  <select className="input" value={form.role} onChange={set("role")}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="field-error" style={{color:"var(--ink4)", fontSize:".65rem"}}>
                    ADMIN: acceso total · GESTOR: productos y movimientos · VISOR: solo lectura
                  </span>
                </div>
                {error && <div style={{padding:".5rem .75rem", background:"var(--red-bg)", border:"1px solid var(--red-bd)", color:"var(--red)", fontSize:".75rem"}}>{error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-ink" disabled={loading}>
                  {loading ? "Creando…" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
