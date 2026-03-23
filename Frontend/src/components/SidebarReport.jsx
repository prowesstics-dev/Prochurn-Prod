import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaChartBar } from "react-icons/fa";
import styles from "./Sidebar.module.css"; // ✅ Sidebar Styles

const SidebarReport = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarheader}>
                <h2>Reports</h2>
            </div>
            <ul className={styles.sidebarmenu}>
                <li 
                    onClick={() => navigate("/descriptivereport")} 
                    className={`sidebar-item ${location.pathname === "/descriptivereport" ? "active" : ""}`}
                >
                    <FaChartBar className={styles.icon} /> Descriptive Report
                </li>
                <li 
                    onClick={() => navigate("/predictivereport")} 
                    className={`sidebaritem ${location.pathname === "/predictivereport" ? "active" : ""}`}
                >
                    <FaChartBar className={styles.icon} /> Predictive Report
                </li>
            </ul>
        </div>
    );
};

export default SidebarReport;
