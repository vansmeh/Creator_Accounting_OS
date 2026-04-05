import { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: {
    bg: "var(--green-bg)",
    border: "var(--green)",
    text: "var(--green)",
    Icon: CheckCircle2,
  },
  error: {
    bg: "var(--red-bg)",
    border: "var(--red)",
    text: "var(--red)",
    Icon: XCircle,
  },
  info: {
    bg: "var(--blue-bg)",
    border: "var(--blue)",
    text: "var(--blue)",
    Icon: Info,
  },
  warning: {
    bg: "var(--amber-bg)",
    border: "var(--amber)",
    text: "var(--amber)",
    Icon: AlertTriangle,
  },
};

let nextId = 0;

// ── Provider ───────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = "info") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => show(msg, "success"),
    error:   (msg) => show(msg, "error"),
    info:    (msg) => show(msg, "info"),
    warning: (msg) => show(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast stack */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2" style={{ minWidth: 300 }}>
        {toasts.map((t) => {
          const s = TYPE_STYLES[t.type] || TYPE_STYLES.info;
          const { Icon } = s;
          return (
            <div
              key={t.id}
              className="toast-enter flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-md)]"
              style={{
                background: s.bg,
                borderColor: s.border,
                color: s.text,
              }}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
