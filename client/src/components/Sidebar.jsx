import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  FileText,
  Bell,
  Sparkles,
  Settings,
  Grid2X2,
} from "lucide-react";

const MAIN_NAV = [
  { to: "/",          label: "Dashboard", icon: LayoutDashboard },
  { to: "/deals",     label: "Deals",     icon: Briefcase },
  { to: "/income",    label: "Income",    icon: DollarSign },
  { to: "/invoices",  label: "Invoices",  icon: FileText },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/ai",        label: "AI Tools",  icon: Sparkles },
];

const SYSTEM_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ to, label, Icon, collapsed }) {
  const location = useLocation();
  // exact match for "/" only, prefix match for others
  const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[var(--accent-light)] text-[var(--accent)]"
          : "text-[var(--ink2)] hover:bg-[#F3F0F8] hover:text-[var(--ink)]"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed = false }) {
  return (
    <aside
      className={`sidebar-transition flex h-screen flex-col border-r border-[var(--border)] bg-[var(--card)] ${
        collapsed ? "w-[60px]" : "w-[220px]"
      } shrink-0`}
      style={{ position: "sticky", top: 0 }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? "justify-center px-2" : ""}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)]">
          <Grid2X2 size={16} color="white" />
        </div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }} className="text-[var(--ink)]">
            Creator OS
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 px-2">
        {!collapsed && (
          <p
            className="mb-1 px-2 pt-2 text-[10px] uppercase tracking-[0.15em] text-[var(--ink3)]"
            style={{ fontFamily: "var(--font-mono, monospace)" }}
          >
            Main Menu
          </p>
        )}
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} />
        ))}
      </nav>

      {/* System nav */}
      <nav className="mt-4 flex flex-col gap-1 border-t border-[var(--border)] px-2 pt-4">
        {!collapsed && (
          <p
            className="mb-1 px-2 text-[10px] uppercase tracking-[0.15em] text-[var(--ink3)]"
            style={{ fontFamily: "var(--font-mono, monospace)" }}
          >
            System
          </p>
        )}
        {SYSTEM_NAV.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} />
        ))}
      </nav>

      {/* Upgrade button */}
      <div className="mt-auto p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-[var(--accent)]" title="Upgrade to Pro" />
          </div>
        ) : (
          <button
            className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Upgrade to Pro
          </button>
        )}
      </div>
    </aside>
  );
}
