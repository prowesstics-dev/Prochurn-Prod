import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh_token");

      try {
        const res = await axios.post(`${API_URL}/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
