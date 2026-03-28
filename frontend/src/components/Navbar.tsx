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
    {
      key: "primary",
      to: role === "ADMIN" ? "/university" : "/student",
      label: role === "ADMIN" ? "Dashboard" : "My Degree",
      enabled: isAuthenticated,
    },
    {
      key: "secondary",
      to: role === "ADMIN" ? "/university" : "/student",
      label: role === "ADMIN" ? "Upload Degree" : "Submissions",
      enabled: isAuthenticated,
    },
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
        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">DegreeVault</span>
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
                  to="/login?role=STUDENT"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/login" && !location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Student Login
                </Link>
                <Link
                  to="/login?role=ADMIN"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/login" && location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Admin Login
                </Link>
                <Link
                  to="/register?role=ADMIN"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/register" && location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Admin Register
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
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
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
                  to="/login?role=STUDENT"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/login" && !location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Student Login
                </Link>
                <Link
                  to="/login?role=ADMIN"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/login" && location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Admin Login
                </Link>
                <Link
                  to="/register?role=ADMIN"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/register" && location.search.includes("role=ADMIN")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Admin Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
