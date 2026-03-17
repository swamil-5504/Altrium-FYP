import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  title: string;
};

const roleLabel = (role?: string) => {
  if (role === "ADMIN") return "University Admin";
  if (role === "STUDENT") return "Student";
  if (role === "EMPLOYER") return "Employer";
  return "";
};

const TopNav: React.FC<Props> = ({ title }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
            {isAuthenticated && (
              <p className="text-xs text-gray-500">
                {roleLabel(user?.role)} • {user?.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;

