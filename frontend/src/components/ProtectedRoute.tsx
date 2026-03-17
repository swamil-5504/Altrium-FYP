import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactElement;
  requiredRole?: string;
}

const roleRoutes: Record<string, string> = {
  ADMIN: "/admin",
  STUDENT: "/student",
  EMPLOYER: "/employer",
};

export const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to correct dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={roleRoutes[user?.role || ""] || "/"} replace />;
  }

  return children;
};
