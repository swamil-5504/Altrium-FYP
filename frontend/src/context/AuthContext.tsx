import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "@/api/axios";

export interface IUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "ADMIN" | "STUDENT";
  is_active: boolean;
  created_at: string;
}

interface IAuthContext {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: "ADMIN" | "STUDENT") => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("access_token");
      if (token) {
        try {
          const response = await axios.get("/users/me");
          setUser(response.data);
        } catch {
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
        }
      }
      setIsLoading(false);
    };

    void checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post("/auth/login", { email, password });

    sessionStorage.setItem("access_token", response.data.access_token);
    sessionStorage.setItem("refresh_token", response.data.refresh_token);

    const userResponse = await axios.get("/users/me");
    setUser(userResponse.data);
  };

  const register = async (email: string, password: string, fullName: string, role: "ADMIN" | "STUDENT") => {
    await axios.post("/auth/register", { email, password, full_name: fullName, role });
    await login(email, password);
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch {
      // Best-effort: backend logout is optional for stateless JWT.
    } finally {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const refresh = async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (!refreshToken) return;

    const response = await axios.post("/auth/refresh", { refresh_token: refreshToken });
    sessionStorage.setItem("access_token", response.data.access_token);
    sessionStorage.setItem("refresh_token", response.data.refresh_token);
  };

    return (
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          isAuthenticated: !!user,
          login,
          register,
          logout,
          refresh,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

