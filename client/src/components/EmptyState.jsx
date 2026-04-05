export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaAction }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--card)] px-8 py-14 text-center"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F0F8]">
          <Icon size={22} style={{ color: "var(--ink3)" }} />
        </div>
      )}
      <h3
        className="text-base font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm text-[var(--ink3)]">{description}</p>
      )}
      {ctaLabel && ctaAction && (
        <button
          onClick={ctaAction}
          className="mt-5 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
