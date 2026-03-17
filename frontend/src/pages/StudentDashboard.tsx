import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get("/credentials");
      setCredentials(response.data);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const stats = {
    total: credentials.length,
    approved: credentials.filter((c) => c.status === "APPROVED").length,
    pending: credentials.filter((c) => c.status === "PENDING").length,
    rejected: credentials.filter((c) => c.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-sm text-gray-500">Altrium Degree Verification</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.full_name || "Student"}!</h2>
          <p className="text-indigo-100">
            View and manage your academic credentials below.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-medium">Total Credentials</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <p className="text-green-600 text-sm font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <p className="text-yellow-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <p className="text-red-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">My Credentials</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-lg text-center py-4">Loading credentials...</p>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">No credentials issued yet</p>
                <p className="text-gray-400 mt-1 text-sm">
                  Once an administrator issues credentials to you, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {credentials.map((credential) => (
                  <div key={credential.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">{credential.title}</h4>
                        <p className="text-gray-500 text-sm">{credential.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                          credential.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : credential.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {credential.status}
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      Issued on: {new Date(credential.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
