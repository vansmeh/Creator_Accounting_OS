export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Alias used in new components
export const formatINR = formatCurrency;

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function daysUntil(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export function monthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function shortId(mongoId = "") {
  return String(mongoId).slice(0, 8).toUpperCase();
}

const BRAND_COLORS = [
  "#7C3AED", // purple
  "#1D4ED8", // blue
  "#16A34A", // green
  "#B45309", // amber
  "#DC2626", // red
  "#0891B2", // cyan
  "#9333EA", // violet
  "#D97706", // orange
];

export function getBrandColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length];
}
