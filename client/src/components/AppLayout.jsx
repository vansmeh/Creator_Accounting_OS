import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ title, cta, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-5"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--ink2)] hover:bg-[var(--accent-light)] md:hidden"
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <Menu size={18} />
            </button>
            {/* Desktop collapse toggle */}
            <button
              className="hidden h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--ink2)] hover:bg-[var(--accent-light)] md:flex"
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <Menu size={18} />
            </button>
            {title && (
              <h1
                className="text-[17px] font-semibold text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink2)] hover:bg-[var(--accent-light)]">
              <Bell size={18} />
            </button>
            {cta}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
