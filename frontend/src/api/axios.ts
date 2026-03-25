import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

type AxiosRequestConfigWithRetry = AxiosRequestConfig & {
  _retry?: boolean;
};

// Vite reads VITE_* at build-time (see Dockerfile + docker-compose build args).
const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE_URL = `${API_HOST}/api/v1`;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT to requests.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh token on 401.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          // backend expects refresh_token as a query param (scalar param without Body annotation)
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            params: { refresh_token: refreshToken },
          });

          localStorage.setItem("access_token", refreshResponse.data.access_token);
          localStorage.setItem("refresh_token", refreshResponse.data.refresh_token);

          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

