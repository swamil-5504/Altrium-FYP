import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

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
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  const role = user?.role;
  const navLinks: NavItem[] = [
    ...(!isAuthenticated ? [{ key: "home", to: "/", label: "Home", enabled: true }] : []),
    ...(isAuthenticated ? [
      {
        key: "primary",
        to: role === "ADMIN" ? "/university" : "/student",
        label: role === "ADMIN" ? "Submissions" : "My Degree",
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
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to={isAuthenticated ? (role === "ADMIN" ? "/university" : "/student") : "/"} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
            {/* Light mode logo */}
            <img src="/altrium_light.png" alt="Altrium" className="w-full h-full object-cover block dark:hidden" />
            {/* Dark mode logo */}
            <img src="/altrium_dark.png" alt="Altrium" className="w-full h-full object-cover hidden dark:block" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Altrium</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1">
            {navLinks.map(renderNavItem)}
          </div>

          <div className="ml-2 pl-2 border-l flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 hidden dark:block" />
              <Moon className="h-5 w-5 block dark:hidden" />
            </button>

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
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 hidden dark:block" />
            <Moon className="h-5 w-5 block dark:hidden" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
