import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// ✅ Named export only
export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  // baseURL: "http://127.0.0.1:8000/api",
  // baseURL: "https://prowesstics.space/api",
  baseURL: API_URL,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Initialize user data from localStorage on mount
  useEffect(() => {
  const savedAccessToken = localStorage.getItem("accessToken");
  const savedRefreshToken = localStorage.getItem("refreshToken");
  const savedUser = localStorage.getItem("user");

  if (savedAccessToken) setAccessToken(savedAccessToken);
  if (savedRefreshToken) setRefreshToken(savedRefreshToken);

  if (savedUser) {
    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("Error parsing saved user:", error);
      localStorage.removeItem("user");
    }
  }

  // Delay just one tick to ensure state is set
  setTimeout(() => {
    setIsInitialized(true);
  }, 0);
}, []);


  // ✅ Request interceptor to add auth token
  useEffect(() => {
    const reqInterceptor = axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken") || accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => axiosInstance.interceptors.request.eject(reqInterceptor);
  }, [accessToken]); // ✅ Add accessToken as dependency

  // ✅ Response interceptor for token refresh
  useEffect(() => {
    const resInterceptor = axiosInstance.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/token/refresh/")
        ) {
          originalRequest._retry = true;

          const newAccess = await refreshTokenHandler();
          if (newAccess) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return axiosInstance(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axiosInstance.interceptors.response.eject(resInterceptor);
  }, []);

  const login = async (email, password, role) => {
    try {
      console.log("🔍 FRONTEND: Sending login request");
      console.log("🔍 FRONTEND: Data being sent:", { 
        username: email, 
        password: "***", 
        role: role 
      });
      
      const response = await axiosInstance.post("/token/", {
        username: email,
        password,
        role,
      });
      
      console.log("🔍 FRONTEND: Login response received:", response.data);
      console.log("🔍 FRONTEND: Response status:", response.status);
      
      const { access, refresh, user } = response.data;
      
      // ✅ Update localStorage first
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      // localStorage.setItem("user", JSON.stringify(user));
      const userRes = await axiosInstance.get("/users/me/");
      const fetchedUsername = userRes.data;
      
      
      // ✅ Update state after localStorage (ensures consistency)
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(fetchedUsername);
      localStorage.setItem("username", JSON.stringify(fetchedUsername));
      localStorage.setItem("justLoggedIn", "true");
      

      
      console.log("✅ Login successful, user set:", fetchedUsername);
      
      return response.data;
    } catch (error) {
      console.error("🔍 FRONTEND: Login error details:");
      console.error("🔍 FRONTEND: Error response:", error.response?.data);
      console.error("🔍 FRONTEND: Error status:", error.response?.status);
      console.error("🔍 FRONTEND: Full error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    navigate("/login");
  };

  let refreshPromise = null;  // 🧠 Shared across calls

  const refreshTokenHandler = async () => {
    if (refreshPromise) {
      // ⏳ Already refreshing — just wait for it
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh) throw new Error("No refresh token available");

        const res = await axiosInstance.post("/token/refresh/", { refresh });

        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;

        localStorage.setItem("accessToken", newAccess);
        setAccessToken(newAccess);

        if (newRefresh) {
          localStorage.setItem("refreshToken", newRefresh);
          setRefreshToken(newRefresh);
        }

        return newAccess;
      } catch (err) {
        console.error("❌ Token refresh failed:", err);
        logout();
        return null;
      } finally {
        refreshPromise = null; // 🧹 Reset for next time
      }
    })();

    return refreshPromise;
  };

  return (
  <AuthContext.Provider
    value={{
      login,
      logout,
      refreshTokenHandler,
      axiosInstance,
      user,
      accessToken,
      refreshToken,
      isInitialized,
    }}
  >
    {isInitialized ? (
      children
    ) : (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="spinner" />
      </div>
    )}
  </AuthContext.Provider>
);

};