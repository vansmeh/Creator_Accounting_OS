import { getBrandColor, getInitials } from "../lib/format";

export function BrandAvatar({ name = "", size = 36 }) {
  const bg = getBrandColor(name);
  const initials = getInitials(name);

  return (
    <div
      className="inline-flex shrink-0 items-center justify-center font-semibold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        fontSize: size * 0.38,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials}
    </div>
  );
}
