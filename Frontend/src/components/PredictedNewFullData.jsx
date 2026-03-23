import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fulldata, fulldatadownload } from "../api";
// import Sidebar from "./SidebarUpload.jsx";
import styles from "./PredictedNewFullData.module.css";
import Swal from "sweetalert2";
import { FaSignOutAlt, FaUserCircle, FaFileDownload } from "react-icons/fa";

const PredictedNewFullData = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [navigate]);

  useEffect(() => {
    fulldata()
      .then((response) => {
        if (response.data && response.data.length > 0) {
          setColumns(response.columns || Object.keys(response.data[0] || {}));
          setData(response.data);
        } else {
          setError("No data available.");
        }
      })
      .catch((err) => {
        console.error("Error fetching full data:", err);
        setError("Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");
      }
    });
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* <Sidebar /> */}
      
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Predicted Full Data</h1>
          
          <div className={styles.actions}>
            <button
              className={styles.downloadButton}
              onClick={() => fulldatadownload()}
            >
              <FaFileDownload className={styles.downloadIcon} />
              Download CSV
            </button>
            
            <div className={styles.profileContainer}>
              <button 
                className={styles.profileButton}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="User profile"
              >
                <FaUserCircle className={styles.profileIcon} />
                <span className={styles.username}>{username}</span>
              </button>
              
              {showProfileMenu && (
                <div className={styles.profileMenu}>
                  <div className={styles.userInfo}>
                    <p className={styles.greeting}>Hello, {username}</p>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className={styles.logoutButton}
                  >
                    <FaSignOutAlt className={styles.logoutIcon} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : data.length > 0 ? (
          <div className={styles.tableWrapper}>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <td key={colIndex}>{row[col] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No data available</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PredictedNewFullData;