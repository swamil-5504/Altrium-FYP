import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props { children: React.ReactElement; requiredRole?: string }

export const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children;
};
