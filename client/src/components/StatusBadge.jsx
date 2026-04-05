const STATUS_MAP = {
  paid:             { bg: "var(--green-bg)",  color: "var(--green)" },
  pending:          { bg: "var(--amber-bg)",  color: "var(--amber)" },
  overdue:          { bg: "var(--red-bg)",    color: "var(--red)" },
  "partially-paid": { bg: "var(--amber-bg)",  color: "var(--amber)" },
  "follow-up":      { bg: "var(--blue-bg)",   color: "var(--blue)" },
  draft:            { bg: "#F9FAFB",           color: "var(--ink3)" },
  sent:             { bg: "var(--amber-bg)",  color: "var(--amber)" },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span
      className="inline-flex items-center capitalize"
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "var(--radius-pill)",
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        letterSpacing: "0.02em",
      }}
    >
      {status?.replace("-", " ") || "—"}
    </span>
  );
}
