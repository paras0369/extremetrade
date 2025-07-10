import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:3001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            }
          );

          if (response.data.status === "success") {
            const { accessToken } = response.data.data.tokens;
            localStorage.setItem("accessToken", accessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          console.error("Token refresh failed:", refreshError);
        }
      }

      // Clear tokens and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
    }

    // Check for network errors
    if (!error.response) {
      console.error(
        "Network error - could not connect to backend at",
        API_BASE_URL
      );
      if (error.message === "Network Error") {
        toast.error(
          "Cannot connect to server. Please check if the backend is running."
        );
      }
    }

    // Handle other errors (but don't show toast for dashboard profile calls to prevent spam)
    if (error.config?.url?.includes("/auth/profile")) {
      // Don't show toast for profile calls to prevent spam during dashboard loading
      console.error(
        "Profile API error:",
        error.response?.data?.message || error.message
      );
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error("Something went wrong. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default api;
