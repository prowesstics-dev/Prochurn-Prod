const API_URL = import.meta.env.VITE_API_URL;

export const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    const data = await res.json();

    if (res.ok && data.access) {
      localStorage.setItem("access_token", data.access);
      return data.access;
    } else {
      console.error("Failed to refresh token", data);
      return null;
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    return null;
  }
};
