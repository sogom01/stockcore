"use client";

import { useState } from "react";

type Product = { id: string; name: string; sku: string; stock: number; unit: string };

type Props = {
  product: Product;
  onSave: (productId: string, type: string, quantity: number, note: string) => Promise<void>;
  onClose: () => void;
};

export default function StockModal({ product, onSave, onClose }: Props) {
  const [type, setType] = useState<"ENTRADA" | "SALIDA" | "AJUSTE">("ENTRADA");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty < 1) return;
    setLoading(true);
    await onSave(product.id, type, qty, note);
    setLoading(false);
  }

  const previewStock = () => {
    const qty = parseInt(quantity) || 0;
    if (type === "ENTRADA") return product.stock + qty;
    if (type === "SALIDA")  return Math.max(0, product.stock - qty);
    return qty;
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-hdr">
          <span className="modal-title">Ajustar stock</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Info producto */}
            <div style={{ padding:".65rem .875rem", background:"var(--bg)", border:"1px solid var(--border)", marginBottom:".25rem" }}>
              <div style={{ fontFamily:"var(--font-d)", fontWeight:700, fontSize:".85rem", color:"var(--ink)" }}>{product.name}</div>
              <div style={{ fontFamily:"var(--font-m)", fontSize:".6rem", color:"var(--ink4)", marginTop:".15rem" }}>
                {product.sku} · Stock actual: <strong style={{color:"var(--ink2)"}}>{product.stock} {product.unit}</strong>
              </div>
            </div>

            {/* Tipo de movimiento */}
            <div className="field">
              <label className="label">Tipo de movimiento</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".4rem" }}>
                {(["ENTRADA","SALIDA","AJUSTE"] as const).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding:".5rem", border:"1px solid",
                      cursor:"pointer", transition:"all .14s",
                      fontFamily:"var(--font-d)", fontSize:".65rem",
                      fontWeight:700, letterSpacing:".05em",
                      background: type === t ? "var(--ink)" : "var(--bg)",
                      color: type === t ? "var(--bg)" : "var(--ink3)",
                      borderColor: type === t ? "var(--ink)" : "var(--border2)",
                    }}
                  >
                    {t === "ENTRADA" ? "↑ Entrada" : t === "SALIDA" ? "↓ Salida" : "⟳ Ajuste"}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label">{type === "AJUSTE" ? "Nuevo stock total" : "Cantidad"}</label>
              <input
                className="input" type="number"
                value={quantity} onChange={e => setQuantity(e.target.value)}
                required min="1"
              />
            </div>

            <div className="field">
              <label className="label">Nota (opcional)</label>
              <input className="input" value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="Ej: Recepción de proveedor, Pedido #1234…"/>
            </div>

            {/* Preview */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:".5rem .75rem", background:"var(--blue-bg)", border:"1px solid var(--blue-bd)" }}>
              <span style={{ fontFamily:"var(--font-m)", fontSize:".62rem", color:"var(--blue)", letterSpacing:".06em" }}>STOCK RESULTANTE</span>
              <span style={{ fontFamily:"var(--font-d)", fontWeight:800, fontSize:"1.1rem", color:"var(--blue)" }}>
                {previewStock()} {product.unit}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-ink" disabled={loading}>
              {loading ? "Registrando…" : "Registrar movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
