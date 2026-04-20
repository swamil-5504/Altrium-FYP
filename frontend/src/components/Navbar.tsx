import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
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
          className="px-3 py-1.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
          className="px-3 py-1.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
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
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
          ? "text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
          ? "text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground"
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
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-primary">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <div className="container mx-auto flex items-center justify-between h-14 px-4">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-primary">
                    <img src="/altrium_light.png" alt="Altrium" className="w-full h-full object-cover block dark:hidden" />
                    <img src="/altrium_dark.png" alt="Altrium" className="w-full h-full object-cover hidden dark:block" />
                  </div>
                  <span className="font-semibold text-sm tracking-tight text-foreground">Altrium</span>
                  <span className="font-semibold text-sm tracking-tight text-foreground">Altrium</span>
                </Link>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-5">
                  {navLinks.map(renderNavItem)}
                  <div className="hidden md:flex items-center gap-5">
                    {navLinks.map(renderNavItem)}

                    <button
                      onClick={toggleTheme}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle theme"
                    >
                      <Sun className="h-4 w-4 hidden dark:block" />
                      <Moon className="h-4 w-4 block dark:hidden" />
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle theme"
                    >
                      <Sun className="h-4 w-4 hidden dark:block" />
                      <Moon className="h-4 w-4 block dark:hidden" />
                    </button>

                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Logout
                      </button>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Link
                          to="/login"
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Logout
                      </button>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Link
                          to="/login"
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Mobile toggle */}
                  <div className="flex items-center gap-3 md:hidden">
                    <div className="flex items-center gap-3 md:hidden">
                      <button
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Toggle theme"
                      >
                        <Sun className="h-4 w-4 hidden dark:block" />
                        <Moon className="h-4 w-4 block dark:hidden" />
                        <Sun className="h-4 w-4 hidden dark:block" />
                        <Moon className="h-4 w-4 block dark:hidden" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                      >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>


                    </div>
                  </div>

                  {/* Mobile menu */}
                  {mobileOpen && (
                    <div className="md:hidden border-t border-border/50 bg-background px-4 py-3 space-y-1">
                      <div className="md:hidden border-t border-border/50 bg-background px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                          link.enabled ? (
                            <Link
                              key={link.key}
                              to={link.to}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.to
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {link.label}
                            </Link>
                          ) : (
                            <span
                              key={link.key}
                              className="block px-3 py-2 text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
                              className="block px-3 py-2 text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
                            >
                              {link.label}
                            </span>
                          )
                        ))}

                        <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-2">
                          <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-2">
                            {isAuthenticated ? (
                              <button
                                type="button"
                                onClick={() => void handleLogout()}
                                className="text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                className="text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Logout
                              </button>
                            ) : (
                              <>
                                <Link
                                  to="/login"
                                  to="/login"
                                  onClick={() => setMobileOpen(false)}
                                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Login
                                  Login
                                </Link>
                                <Link
                                  to="/register"
                                  to="/register"
                                  onClick={() => setMobileOpen(false)}
                                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Register
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