export function StatCard({
  label,
  value,
  detail,
  delta,
  deltaDirection,
  icon: Icon,
  accentColor,
  // legacy props
  tone,
}) {
  const deltaPositive = deltaDirection === "up" || (delta && delta > 0);
  const deltaNegative = deltaDirection === "down" || (delta && delta < 0);

  return (
    <div
      className="relative rounded-[var(--radius-lg)] bg-[var(--card)] p-5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      {/* Delta pill */}
      {delta !== undefined && delta !== null && (
        <span
          className="absolute right-4 top-4 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-semibold"
          style={{
            background: deltaPositive ? "var(--green-bg)" : deltaNegative ? "var(--red-bg)" : "#F3F4F6",
            color: deltaPositive ? "var(--green)" : deltaNegative ? "var(--red)" : "var(--ink3)",
          }}
        >
          {deltaPositive ? "+" : ""}{delta}%
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: accentColor ? `${accentColor}22` : "var(--accent-light)" }}
        >
          <Icon size={20} style={{ color: accentColor || "var(--accent)" }} />
        </div>
      )}

      {/* Label */}
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink3)]">{label}</p>

      {/* Value */}
      <p
        className="mt-1 text-[28px] font-bold leading-tight text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>

      {/* Detail / sub-label */}
      {detail && <p className="mt-1.5 text-xs text-[var(--ink3)]">{detail}</p>}
    </div>
  );
}
