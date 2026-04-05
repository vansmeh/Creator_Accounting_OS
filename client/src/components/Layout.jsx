import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/deals", label: "Deals" },
];

export function Layout({ actions, children }) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[32px] border border-border bg-white/90 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-stone-500">Creator Accounting OS</p>
            <h1 className="font-display text-4xl text-ink">Track pending cash. Move faster.</h1>
          </div>
          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>
        <nav className="mt-5 flex gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-ink text-white" : "bg-sand text-stone-700 hover:bg-clay"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
