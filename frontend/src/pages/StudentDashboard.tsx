import React, { useState, useEffect } from "react";
import axios from "../api/axios";

const StudentDashboard: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">My Credentials</h1>

      {loading ? (
        <p className="text-gray-500 text-lg">Loading credentials...</p>
      ) : credentials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">You don't have any credentials yet</p>
          <p className="text-gray-400 mt-2">Once an admin issues credentials, they will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <div key={credential.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{credential.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">{credential.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ml-2 ${
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
              <div className="mt-4 text-sm text-gray-500">
                <p>Issued on: {new Date(credential.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
