import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Altrium — Demo</h1>
        <p className="text-center text-gray-600 mb-6">Use the links below to explore the UI pages.</p>

        <nav className="flex flex-col gap-3">
          <Link className="px-4 py-2 bg-blue-600 text-white rounded text-center" to="/login">Login</Link>
          <Link className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-center" to="/register">Register</Link>
          <Link className="px-4 py-2 bg-green-600 text-white rounded text-center" to="/admin">Admin Dashboard</Link>
          <Link className="px-4 py-2 bg-indigo-600 text-white rounded text-center" to="/student">Student Dashboard</Link>
          <Link className="px-4 py-2 bg-yellow-600 text-white rounded text-center" to="/employer">Employer Dashboard</Link>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
