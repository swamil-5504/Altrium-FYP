import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 drop-shadow-2xl">
          Welcome to <span className="block text-5xl md:text-6xl">Altrium</span>
        </h1>
        <p className="text-2xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
          The most secure Degree Verification Platform. Log in or register to access your personalized dashboards.
        </p>
        
        <div className="max-w-md mx-auto mb-16">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <Button size="lg" className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to="/login">Login</Link>
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <Button variant="outline" size="lg" className="w-full text-lg h-14 font-semibold border-2 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300">
                <Link to="/register">Create Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-left p-8 rounded-2xl bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure</h3>
            <p className="text-gray-600">Military-grade encryption and blockchain verification.</p>
          </div>
          <div className="text-left p-8 rounded-2xl bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant</h3>
            <p className="text-gray-600">Verify degrees in seconds, not days.</p>
          </div>
          <div className="text-left p-8 rounded-2xl bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted</h3>
            <p className="text-gray-600">Used by top universities worldwide.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
        <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute requiredRole="ADMIN"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRole="STUDENT"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRole="EMPLOYER"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/employer" element={<EmployerDashboard />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

