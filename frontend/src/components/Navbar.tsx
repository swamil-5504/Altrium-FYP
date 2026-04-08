import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  key: string;
  to: string;
  label: string;
  enabled: boolean;
}

export const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const role = user?.role;
  const navLinks: NavItem[] = [
    { key: "home", to: "/", label: "Home", enabled: true },
    ...(isAuthenticated ? [
      {
        key: "primary",
        to: role === "ADMIN" ? "/university" : "/student",
        label: role === "ADMIN" ? "Dashboard" : "My Degree",
        enabled: true,
      },
      {
        key: "secondary",
        to: role === "ADMIN" ? "/university" : "/student",
        label: role === "ADMIN" ? "Upload Degree" : "Submissions",
        enabled: true,
      }
    ] : []),
  ];

  const renderNavItem = (link: NavItem) => {
    const isActive = location.pathname === link.to;
    if (!link.enabled) {
      return (
        <span
          key={link.key}
          className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
          aria-disabled="true"
        >
          {link.label}
        </span>
      );
    }
    return (
      <Link
        key={link.key}
        to={link.to}
        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-accent hover:bg-accent/10"
          }`}
      >
        {link.label}
      </Link>
    );
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
            <img src="/altrium.jpg" alt="Altrium" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Altrium</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1">
            {navLinks.map(renderNavItem)}
          </div>

          <div className="ml-2 pl-2 border-l flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/login"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                    }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/register"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                    }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            link.enabled ? (
              <Link
                key={link.key}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {link.label}
              </Link>
            ) : (
              <span
                key={link.key}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                {link.label}
              </span>
            )
          ))}

          <div className="pt-2 mt-2 border-t">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/login"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                    }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/register"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                    }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
