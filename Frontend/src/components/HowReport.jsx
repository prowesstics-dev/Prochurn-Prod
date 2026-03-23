import React, { useState, useEffect } from "react";
// import SidebarReport from "./Sidebar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./ReportPage.module.css"; // ✅ Ensure correct path
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

const HowReport = () => {
    const navigate = useNavigate();
    const [embedUrl, setEmbedUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [username, setUsername] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("token");
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
            const response = await fetch(`${API_URL}/how-view/`.replace(/([^:]\/)\/+/g, "$1")); // ✅ Fix double slashes
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("✅ Power BI Public Report Loaded:", data);

            setEmbedUrl(data.embedUrl);
        } catch (error) {
            console.error("❌ Error fetching Power BI report:", error);
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
            
            {/* ✅ Profile Icon with Menu */}
            <div className={styles.profileContainer}>
                <div className={styles.profileIcon} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                    <FaUserCircle size={30} title={username} />
                </div>
                {showProfileMenu && (
                    <div className={styles.profileMenu}>
                        <p className={styles.profileName}>{username}</p>
                        <hr />
                        <button onClick={handleLogout} className={styles.logoutOption}>
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.mainContent}>
                <h1 className={styles.reportTitle}>How To Retain Them</h1>
                {/* <p className={styles.report-description">Interactive Power BI How Report Dashboard.</p> */}

                {isLoading && <p className={styles.loadingText}>🔄 Loading Power BI Report...</p>}
                {error && <p className={styles.errorText}>⚠ {error}</p>}

                {/* ✅ Show Power BI Report using an iframe */}
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
        </div>
    );
};

export default HowReport;
