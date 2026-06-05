"use client";

type ToastMsg = { id: number; text: string; type: "success" | "error" | "warning" };

export default function Toast({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {t.type === "success"
              ? <polyline points="20 6 9 17 4 12"/>
              : t.type === "error"
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
            }
          </svg>
          {t.text}
        </div>
      ))}
    </div>
  );
}
