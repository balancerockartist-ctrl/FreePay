import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Send, History, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/send", icon: Send, label: "Send Money" },
  { to: "/transactions", icon: History, label: "Transactions" },
  { to: "/contacts", icon: Users, label: "Contacts" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-blue-600">
          <span className="text-2xl font-bold text-white tracking-tight">
            Free<span className="text-green-300">Pay</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">© 2025 FreePay</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">FreePay</h1>
          <span className="ml-3 text-sm text-gray-400">Peer-to-peer payments made simple</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
