import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";

function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // If already logged in, redirect to the correct dashboard
  if (!isLoading && isAuthenticated && user) {
    const roleRoutes: Record<string, string> = {
      ADMIN: "/admin",
      STUDENT: "/student",
      EMPLOYER: "/employer",
    };
    return <Navigate to={roleRoutes[user.role] || "/"} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Altrium</h1>
        <p className="text-center text-indigo-600 font-medium mb-6">Degree Verification Platform</p>

        <nav className="flex flex-col gap-3">
          <Link
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-medium transition"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-center font-medium border border-gray-300 transition"
            to="/register"
          >
            Create Account
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected dashboard routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer"
          element={
            <ProtectedRoute requiredRole="EMPLOYER">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
