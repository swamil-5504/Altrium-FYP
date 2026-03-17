import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect to role-based dashboard once user is set after login
  useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        STUDENT: "/student",
        EMPLOYER: "/employer",
      };
      navigate(roleRoutes[user.role] || "/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // redirect handled by the useEffect above once user state updates
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Altrium - Degree Verification</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-center text-gray-500 mb-4">Demo Quick Login</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setEmail("admin@altrium.com"); setPassword("admin123"); }}
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 rounded-lg transition text-sm"
            >
              Fill Admin Credentials
            </button>
            <button
              type="button"
              onClick={() => { setEmail("student@altrium.com"); setPassword("student123"); }}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 rounded-lg transition text-sm"
            >
              Fill Student Credentials
            </button>
            <button
              type="button"
              onClick={() => { setEmail("employer@altrium.com"); setPassword("employer123"); }}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-2 rounded-lg transition text-sm"
            >
              Fill Employer Credentials
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
