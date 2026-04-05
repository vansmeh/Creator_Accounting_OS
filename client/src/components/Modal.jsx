import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        style={{ backdropFilter: "blur(2px)" }}
      />

      {/* Panel — right drawer on desktop */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[var(--card)] shadow-[var(--shadow-lg)] md:w-[480px]"
        style={{
          borderTopLeftRadius: "var(--radius-xl)",
          borderBottomLeftRadius: "var(--radius-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2
            className="text-lg font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink3)] hover:bg-[var(--border)] hover:text-[var(--ink)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  );
}
