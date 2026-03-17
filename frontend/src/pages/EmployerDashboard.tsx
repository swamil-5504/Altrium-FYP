import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EmployerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

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

  const filteredCredentials =
    filter === "ALL"
      ? credentials
      : credentials.filter((c) => c.status === filter);

  const stats = {
    total: credentials.length,
    approved: credentials.filter((c) => c.status === "APPROVED").length,
    pending: credentials.filter((c) => c.status === "PENDING").length,
    rejected: credentials.filter((c) => c.status === "REJECTED").length,
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employer Dashboard</h1>
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
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome, {user?.full_name || "Employer"}!</h2>
          <p className="text-orange-100">Verify and browse academic credentials in read-only mode.</p>
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

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {["ALL", "APPROVED", "PENDING", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Credentials Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              Credentials Directory {filter !== "ALL" && `(${filter})`}
            </h3>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-lg text-center py-4">Loading credentials...</p>
            ) : filteredCredentials.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">No credentials found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter !== "ALL" ? "Try changing the filter." : "No credentials have been issued yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCredentials.map((credential) => (
                      <tr key={credential.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-800 font-medium">{credential.title}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{credential.description || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              credential.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : credential.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {credential.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(credential.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
