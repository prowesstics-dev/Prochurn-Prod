import React, { useState, useEffect } from "react";
// import SidebarReport from "./SidebarUpload";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./ReportPage.module.css";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { Spin } from "antd";

const DescriptiveNew = () => {
  const navigate = useNavigate();
  const [embedUrl, setEmbedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("No token found! Redirecting to login...");
      navigate("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetchEmbedDetails();
  }, [navigate]);

  const fetchEmbedDetails = async () => {
    try {
      const response = await fetch(
        `${API_URL}/powerbitokenview/`.replace(/([^:]\/)\/+/g, "$1")
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setEmbedUrl(data.embedUrl);
    } catch (error) {
      console.error("Error fetching Power BI report:", error);
      setError("Failed to load Power BI report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
      }
    });
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* <SidebarReport /> */}

      <div className={styles.mainContent}>
        <div className={styles.reportHeader}>
          <h1 className={styles.reportTitleGradient}>
  Churn Patterns and Analysis
</h1>
          
          
        </div>

        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spin tip="Loading Power BI Report..." size="large">
            <div className={styles.powerbiPlaceholder}></div>
          </Spin>
          </div>
        )}
        
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>⚠ {error}</p>
          </div>
        )}

        {embedUrl && (
          <div className={styles.powerbiContainer}>
            <iframe
              src={embedUrl}
              className={styles.fullWidthReport}
              title="Power BI Report"
            ></iframe>
          </div>
        )}
      </div>
        <div style={{ height: '100px', backgroundColor: '#F3F3F3' }} />
    </div>
  );
};

export default DescriptiveNew;