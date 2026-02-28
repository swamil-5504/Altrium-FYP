import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { IUser } from "../context/AuthContext";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issued_to_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchCredentials();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const response = await axios.get("/credentials");
      setCredentials(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch credentials");
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post("/credentials", formData);
      setSuccess("Credential created successfully!");
      setFormData({ title: "", description: "", issued_to_id: "" });
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create credential");
    }
  };

  const handleApproveCredential = async (credentialId: string) => {
    try {
      await axios.patch(`/credentials/${credentialId}/status`, { status: "APPROVED" });
      setSuccess("Credential approved!");
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to approve credential");
    }
  };

  const handleRejectCredential = async (credentialId: string) => {
    try {
      await axios.patch(`/credentials/${credentialId}/status`, { status: "REJECTED" });
      setSuccess("Credential rejected!");
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject credential");
    }
  };

  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Credential Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Credential</h2>
          <form onSubmit={handleCreateCredential} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Student</label>
              <select
                value={formData.issued_to_id}
                onChange={(e) => setFormData({ ...formData, issued_to_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              Create Credential
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Users ({users.length})</h2>
          {loadingUsers ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="font-medium text-gray-800">{user.full_name || user.email}</p>
                  <p className="text-sm text-gray-500">{user.role} • {user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Credentials List */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">All Credentials</h2>
        {loadingCredentials ? (
          <p className="text-gray-500">Loading...</p>
        ) : credentials.length === 0 ? (
          <p className="text-gray-500">No credentials created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr key={cred.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{cred.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          cred.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : cred.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {cred.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {cred.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveCredential(cred.id)}
                            className="mr-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectCredential(cred.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
