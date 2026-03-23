import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import Sidebar from "./Sidebar.jsx";
import styles from "./RawData.module.css";
import Swal from "sweetalert2";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { FiCheckCircle, FiSettings, FiDatabase, FiBarChart2 } from "react-icons/fi";

const RawData = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const processingSteps = [
        {
            stage: "Data Cleansing",
            icon: <FiDatabase className={styles.stepIcon} />,
            details: [
                "Removed duplicates",
                "Handled missing values",
                "Feature engineering applied",
                "Normalized numerical data",
                "Encoded categorical variables",
            ],
        },
        {
            stage: "Model Training",
            icon: <FiSettings className={styles.stepIcon} />,
            details: [
                "Pre-trained models loaded",
                "Hyperparameter tuning performed",
                "Predictions generated",
            ],
        },
        {
            stage: "Finalization",
            icon: <FiBarChart2 className={styles.stepIcon} />,
            details: [
                "Confidence scores calculated",
                "Customers segmented based on risk",
                "Retention strategies derived",
            ],
        },
    ];

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
    }, [navigate]);

    const handleLogout = () => {
        Swal.fire({
            title: "Logout?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3498db",
            cancelButtonColor: "#e74c3c",
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                navigate("/login");
            }
        });
    };

    return (
        <div className={styles.rawDataLayout}>
            {/* <Sidebar /> */}
            
            <div className={styles.profileContainer}>
                <div className={styles.profileIcon} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                    <FaUserCircle size={30} title={username} />
                    <span className={styles.usernameBadge}>{username}</span>
                </div>
                {showProfileMenu && (
                    <div className={styles.profileMenu}>
                        <p className={styles.profileName}>
                            <FaUserCircle size={18} style={{ marginRight: "8px" }} />
                            {username}
                        </p>
                        <hr className={styles.menuDivider} />
                        <button onClick={handleLogout} className={styles.logoutOption}>
                            <FaSignOutAlt style={{ marginRight: "8px" }} /> 
                            Logout
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.rawDataContent}>
                <div className={styles.headerSection}>
                    <h1 className={styles.title}>Data Processed Summary</h1>
                    {/* <p className={styles.subtitle}>Detailed overview of the data transformation journey</p> */}
                </div>

                <div className={styles.stepsContainer}>
                    {processingSteps.map((step, index) => (
                        <div key={index} className={styles.stepBox}>
                            <div className={styles.stepHeader}>
                                {step.icon}
                                <h2 className={styles.stepTitle}>{step.stage}</h2>
                            </div>
                            <ul className={styles.stepDetails}>
                                {step.details.map((detail, idx) => (
                                    <li key={idx} className={styles.detailItem}>
                                        <FiCheckCircle className={styles.checkIcon} />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RawData;