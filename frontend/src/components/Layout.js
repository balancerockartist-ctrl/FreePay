import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/payment-intents", label: "Payment Intents" },
  { to: "/transfers", label: "Transfers" },
  { to: "/agents", label: "Agents" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="font-bold text-xl text-blue-700">
          FreePay
        </Link>
        <div className="flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium ${
                pathname === to
                  ? "text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-blue-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </nav>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
