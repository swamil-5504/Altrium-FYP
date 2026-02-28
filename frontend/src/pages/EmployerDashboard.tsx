import React, { useState, useEffect } from "react";
import axios from "../api/axios";

const EmployerDashboard: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Credentials Directory (Read-Only)</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Credentials</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-green-600 text-sm font-medium">Approved</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.approved}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-yellow-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-red-600 text-sm font-medium">Rejected</p>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          {["ALL", "APPROVED", "PENDING", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Credentials List */}
      {loading ? (
        <p className="text-gray-500 text-lg">Loading credentials...</p>
      ) : filteredCredentials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No credentials found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 font-medium text-gray-700">Title</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Description</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Issued</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredentials.map((credential) => (
                <tr key={credential.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 px-6 text-gray-800 font-medium">{credential.title}</td>
                  <td className="py-4 px-6 text-gray-600">{credential.description || "-"}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
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
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {new Date(credential.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
