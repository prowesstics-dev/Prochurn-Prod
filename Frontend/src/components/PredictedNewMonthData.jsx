import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { monthdataview, monthdatadownloadview } from "../api.js";
// import Sidebar from "./SidebarUpload.jsx";
import styles from "./PredictedNewMonthData.module.css";
import Swal from "sweetalert2";
import { FaSignOutAlt, FaUserCircle, FaFileDownload } from "react-icons/fa";

const PredictedNewMonthData = () => {
  const navigate = useNavigate();
  const { month } = useParams();
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
    const monthIndex = parseInt(month);
    if (!month || isNaN(monthIndex)) {
      navigate("/monthdataview/1");
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    monthdataview(monthIndex)
      .then((response) => {
        if (response.data?.length > 0) {
          setColumns(response.columns || Object.keys(response.data[0]));
          setData(response.data);
        } else {
          setError("No data available for this month.");
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [month, navigate]);

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

  const handleDownload = () => {
    Swal.fire({
      title: "Downloading Data",
      text: "Preparing your download...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    monthdatadownloadview(month)
      .then(() => {
        Swal.fire("Success", "Download started successfully!", "success");
      })
      .catch((err) => {
        console.error("Download error:", err);
        Swal.fire("Error", "Failed to download data", "error");
      });
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* <Sidebar /> */}
      
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            Predicted Data for {monthNames[parseInt(month) - 1]}
          </h1>
          
          <div className={styles.actions}>
            <button
              className={styles.downloadButton}
              onClick={handleDownload}
              disabled={loading || error || data.length === 0}
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
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading data for {monthNames[parseInt(month) - 1]}...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
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
                        <td key={colIndex}>
                          {typeof row[col] === 'number' ? 
                            row[col].toLocaleString() : 
                            (row[col] || "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No data available for {monthNames[parseInt(month) - 1]}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PredictedNewMonthData;