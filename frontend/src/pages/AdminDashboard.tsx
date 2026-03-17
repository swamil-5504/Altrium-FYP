import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth, IUser } from "../context/AuthContext";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const students = users.filter((u) => u.role === "STUDENT");

  const stats = {
    totalUsers: users.length,
    students: users.filter((u) => u.role === "STUDENT").length,
    employers: users.filter((u) => u.role === "EMPLOYER").length,
    totalCredentials: credentials.length,
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
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
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
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome, {user?.full_name || "Admin"}!</h2>
          <p className="text-green-100">Manage users, issue credentials, and approve verification requests.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-700 font-bold">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-700 font-bold">&times;</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-medium">Students</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.students}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-medium">Total Credentials</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCredentials}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <p className="text-yellow-600 text-sm font-medium">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create Credential Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Issue New Credential</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateCredential} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Bachelor of Technology in Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details about the credential..."
                    rows={3}
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
                        {student.full_name || student.email} ({student.email})
                      </option>
                    ))}
                  </select>
                  {students.length === 0 && !loadingUsers && (
                    <p className="text-sm text-gray-400 mt-1">No students registered yet.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={students.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition"
                >
                  Issue Credential
                </button>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Registered Users ({users.length})</h3>
            </div>
            <div className="p-6">
              {loadingUsers ? (
                <p className="text-gray-500">Loading...</p>
              ) : users.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No users registered yet</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {users.map((u) => (
                    <div key={u.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{u.full_name || u.email}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "STUDENT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Credentials */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">All Credentials</h3>
          </div>
          <div className="p-6">
            {loadingCredentials ? (
              <p className="text-gray-500">Loading...</p>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-gray-500">No credentials issued yet</p>
                <p className="text-gray-400 text-sm mt-1">Use the form above to issue credentials to students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Issued</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map((cred) => (
                      <tr key={cred.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800 font-medium">{cred.title}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(cred.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {cred.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveCredential(cred.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectCredential(cred.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                              >
                                Reject
                              </button>
                            </div>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
