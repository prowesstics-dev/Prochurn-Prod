import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN, API_BASE_URL } from "./constants";

// ✅ Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach Authorization Token Automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Token Refresh on Expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/refresh/`, { refresh: refreshToken });

          // ✅ Update Tokens & Retry Request
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("🔴 Refresh Token Expired:", refreshError);
          logoutUser(); // ✅ Ensures Safe Logout
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/* ✅ Authentication APIs */
export const loginUser = async (credentials, navigate) => {
  try {
    const response = await api.post("/login/", credentials);

    // ✅ Store JWT Tokens
    localStorage.setItem(ACCESS_TOKEN, response.data.access_token);
    localStorage.setItem(REFRESH_TOKEN, response.data.refresh_token);

    // ✅ Navigate After Login
    navigate("/uploadpage");

    return response.data;
  } catch (error) {
    console.error("🔴 Login Error:", error.response?.data || error.message);
    return { error: "Login failed. Please check your credentials." };
  }
};

export const createAccount = async (userData) => {
  try {
    const response = await api.post("/create-account/", userData);
    return response.data;
  } catch (error) {
    console.error("🔴 Account Creation Error:", error.response?.data || error.message);
    return { error: "Account creation failed. Try again." };
  }
};

/* ✅ File Upload API */
export const uploadFile = async (fileData) => {
  try {
    const response = await api.post("/upload-file/", fileData, {
      headers: { "Content-Type": "multipart/form-data" }, // ✅ Set Automatically
    });
    return response.data;
  } catch (error) {
    console.error("🔴 File Upload Error:", error.response?.data || error.message);
    return { error: "File upload failed. Ensure it's a valid format." };
  }
};

/* ✅ Fetch Cleaned Data */
export const fetchCleanedData = async () => {
  try {
    const response = await api.get("/cleaned-data/");
    return response.data;
  } catch (error) {
    console.error("🔴 Error Fetching Cleaned Data:", error);
    return { columns: [], data: [] };
  }
};

/* ✅ Download Cleaned Data as CSV */
export const downloadCleanedDataCSV = () => {
  const downloadUrl = `${API_BASE_URL}/download-cleaned-data`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix double slashes
  console.log("Downloading CSV from:", downloadUrl);
  window.open(downloadUrl, "_blank");
};

export const fulldata = (page = 1, pageSize = 30) => {
  return axios.get(`/api/fulldata?page=${page}&page_size=${pageSize}`);
};


export const fulldatadownload = () => {
  const downloadUrl = `${API_BASE_URL}/fulldatadownload`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix double slashes
  console.log("Downloading CSV from:", downloadUrl);
  window.open(downloadUrl, "_blank");
};
/* ✅ Fetch Predicted Data (Month-wise) */
export const fetchPredictedData = async (month) => {
  try {
    const response = await api.get(`/predicted-data/?month=${month}`);
    return response.data;
  } catch (error) {
    console.error(`🔴 Error Fetching Predicted Data for ${month}:`, error);
    return { columns: [], data: [] };
  }
};

/* ✅ Logout API - Clears Storage & Redirects */
export const logoutUser = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem("username");
  window.location.href = "/login"; // ✅ Ensures Full Logout
};

export const monthdataview = async (month) => {
  if (!month || isNaN(month)) {
    console.error("❌ Invalid month number:", month);
    return { columns: [], data: [] };
  }

  const requestUrl = `${API_BASE_URL}/monthdataview/${month}/`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix URL slashes
  console.log(`📌 Fetching data for Month ${month} from:`, requestUrl);

  try {
    const response = await axios.get(requestUrl);
    console.log(`✅ API Response for Month ${month}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`🔴 Error Fetching Predicted Data for month ${month}:`, error);
    return { columns: [], data: [] };
  }
};

// ✅ Download Predicted Data by Month
export const monthdatadownloadview = (month) => {
  if (!month || isNaN(month)) {
    console.error("❌ Invalid month number for download:", month);
    return;
  }

  const downloadUrl = `${API_BASE_URL}/monthdatadownloadview/${month}/`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix double slashes
  console.log(`📥 Downloading CSV for Month ${month} from:`, downloadUrl);

  window.open(downloadUrl, "_blank");
};


export const powerbitokenview = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-powerbi-report/`.replace(/([^:]\/)\/+/g, "$1")); // ✅ Fix URL slashes
    return response.data;
  } catch (error) {
    console.error("🔴 Error Fetching Power BI Report:", error);
    return { embedUrl: "" }; // ✅ Return empty embed URL in case of failure
  }
};

export const whoview = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/who-view/`.replace(/([^:]\/)\/+/g, "$1")); // ✅ Fix URL slashes
    return response.data;
  } catch (error) {
    console.error("🔴 Error Fetching Power BI Report:", error);
    return { embedUrl: "" }; // ✅ Return empty embed URL in case of failure
  }
};

export const whyview = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/why-view/`.replace(/([^:]\/)\/+/g, "$1")); // ✅ Fix URL slashes
    return response.data;
  } catch (error) {
    console.error("🔴 Error Fetching Power BI Report:", error);
    return { embedUrl: "" }; // ✅ Return empty embed URL in case of failure
  }
};

export const howview = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/how-view/`.replace(/([^:]\/)\/+/g, "$1")); // ✅ Fix URL slashes
    return response.data;
  } catch (error) {
    console.error("🔴 Error Fetching Power BI Report:", error);
    return { embedUrl: "" }; // ✅ Return empty embed URL in case of failure
  }
};

export const gettablesview = async () => {
  try {
    const response = await API.get("gettablesview/");
    setTables(response.data.tables);  
    if (response.data.tables.length > 0) setSelectedTable(response.data.tables[0]);
  } catch (err) {
    console.error("Error fetching tables:", err);
  }
};

export const gettabledataview = async () => {
  if (!selectedTable) return;
  try {
    const response = await API.get(`gettabledataview/?table=${selectedTable}`);
    setColumns(response.data.columns);
    setRows(response.data.rows.map((row) => 
      Object.fromEntries(response.data.columns.map((col, index) => [col, row[index]]))
    ));
  } catch (err) {
    console.error("Error fetching table data:", err);
  }
};

export const fetchAiResponse = async () => {
  if (!question.trim()) {
    alert("Please enter a question!");
    return;
  }
  setLoadingAiResponse(true);
  setAiResponse("");

  try {
    const response = await API.post("ai-response/", { prompt: question });
    setAiResponse(response.data.response || "No response received from AI.");
  } catch (error) {
    console.error("Error fetching AI response:", error);
    setAiResponse("An error occurred while fetching the AI response.");
  }
  
  setLoadingAiResponse(false);
};

export const handleFileUpload = async (file) => {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await API.post("upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert(`File uploaded successfully: ${response.data.fileName}`);
    fetchTables();  // ✅ Refresh table list after upload
    setSelectedTable(response.data.tableName);  // ✅ Auto-select the new table
  } catch (err) {
    console.error("Error uploading file:", err);
    alert("Error uploading file. Please try again.");
  }
};

export const exportTableToCSV = async () => {
  if (!selectedTable) return;

  try {
    const response = await API.get(`download-csv/?table=${selectedTable}`, { responseType: "blob" });

    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}.csv`;
    link.click();
  } catch (err) {
    console.error("Error exporting CSV:", err);
  }
};

export const exportTableToPDF = async () => {
  if (!selectedTable) return;

  try {
    const response = await API.get(`download-pdf/?table=${selectedTable}`, { responseType: "blob" });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTable}.pdf`;
    link.click();
  } catch (err) {
    console.error("Error exporting PDF:", err);
  }
};


export const pastmonthdataview = async (month) => {
  if (!month || isNaN(month)) {
    console.error("❌ Invalid month number:", month);
    return { columns: [], data: [] };
  }

  const requestUrl = `${API_BASE_URL}/pastmonthdataview/${month}/`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix URL slashes
  console.log(`📌 Fetching data for Month ${month} from:`, requestUrl);

  try {
    const response = await axios.get(requestUrl);
    console.log(`✅ API Response for Month ${month}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`🔴 Error Fetching Predicted Data for month ${month}:`, error);
    return { columns: [], data: [] };
  }
};

// ✅ Download Predicted Data by Month
export const pastmonthdatadownloadview = (month) => {
  if (!month || isNaN(month)) {
    console.error("❌ Invalid month number for download:", month);
    return;
  }

  const downloadUrl = `${API_BASE_URL}/pastmonthdatadownloadview/${month}/`.replace(/([^:]\/)\/+/g, "$1"); // ✅ Fix double slashes
  console.log(`📥 Downloading CSV for Month ${month} from:`, downloadUrl);

  window.open(downloadUrl, "_blank");
};