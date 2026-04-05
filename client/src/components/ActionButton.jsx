export function ActionButton({ children, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-ink text-white hover:bg-stone-800",
    secondary: "bg-white text-ink border border-border hover:border-accent hover:text-accent",
    accent: "bg-accent text-white hover:opacity-90",
  };

  return (
    <button
      className={`rounded-full px-4 py-2 text-sm transition ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
