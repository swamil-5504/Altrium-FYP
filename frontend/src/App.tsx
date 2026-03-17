import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  const roleLabel =
    user?.role === "ADMIN"
      ? "University Admin (Verifier)"
      : user?.role === "EMPLOYER"
      ? "Employer"
      : user?.role === "STUDENT"
      ? "Student"
      : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Altrium — Degree Verification</h1>
        <p className="text-center text-gray-600 mb-6">
          {isAuthenticated ? (
            <>
              Signed in as <span className="font-medium">{user?.email}</span> ({roleLabel})
            </>
          ) : (
            "Login or create an account to continue."
          )}
        </p>

        <nav className="flex flex-col gap-3">
          {!isAuthenticated ? (
            <>
              <Link className="px-4 py-2 bg-blue-600 text-white rounded text-center" to="/login">
                Login
              </Link>
              <Link className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-center" to="/register">
                Register
              </Link>
            </>
          ) : (
            <>
              <Link className="px-4 py-2 bg-indigo-600 text-white rounded text-center" to="/dashboard">
                Go to dashboard
              </Link>
              <button
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded text-center border border-gray-300 hover:bg-gray-50"
                onClick={logout}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

function DashboardRedirect() {
  const { isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user?.role === "STUDENT") return <Navigate to="/student" replace />;
  if (user?.role === "EMPLOYER") return <Navigate to="/employer" replace />;

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
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
      </Routes>
    </BrowserRouter>
  );
}
