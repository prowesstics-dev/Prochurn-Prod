import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { 
  FaDatabase, FaChartBar, FaCaretDown, FaCaretRight, FaClipboardList, FaUser,
  FaQuestionCircle, FaCalendarAlt, FaThList, FaRocket, FaRobot
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
    if (location.pathname === "/ssbi") {
      return null;  // Don't render the sidebar on the '/ssbi' page
     }

  const [openSections, setOpenSections] = useState({
    rawData: location.pathname.includes("/rawdata") || 
             location.pathname.includes("/fulldata") || 
             location.pathname.includes("/monthdataview"),
    predictedData: location.pathname.includes("/fulldata") || 
                  location.pathname.includes("/monthdataview"),
    reports: location.pathname.includes("/whoreport") || 
             location.pathname.includes("/descriptivereport") || 
             location.pathname.includes("/whyreport")
  });

  const [tooltip, setTooltip] = useState({ 
    visible: false, 
    text: "", 
    x: 0, 
    y: 0,
    position: "top" 
  });

  const handleMouseEnter = (text, event) => {
    const rect = event.target.getBoundingClientRect();
    const sidebar = document.querySelector(`.${styles.sidebar}`);
    const sidebarRect = sidebar.getBoundingClientRect();
    
    let x = rect.left - sidebarRect.left + 20;
    let y = rect.top - sidebarRect.top;
    let position = "right";

    if (text.includes("What - Churn Patterns")) {
      position = "top";
      y -= 45;
    } else if (text.includes("Who - Churn Risk")) {
      position = "right";
      x = rect.right - sidebarRect.left + 10;
      y = rect.top - sidebarRect.top + rect.height / 2;
    } else if (text.includes("Why - Churn Root")) {
      position = "bottom";
      y = rect.bottom - sidebarRect.top + 12;
    }

    setTooltip({ 
      visible: true, 
      text, 
      x, 
      y, 
      position 
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: "", x: 0, y: 0, position: "top" });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleMonthClick = (monthIndex) => {
    navigate(`/monthdataview/${monthIndex + 1}`);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.brandLogo}>
        <FaRocket className={styles.brandIcon} />
        <h1 className={styles.sidebarTitle}>ProChurn AI</h1>
      </div>

      {/* <h2 className={styles.sidebarSubtitle}>Processed Data</h2> */}

      <div className={styles.sidebarContent}>
        {/* Raw Data Section */}
        <div className={styles.sidebarItem}>
          <div 
            className={styles.sidebarLink} 
            onClick={() => toggleSection("rawData")}
          >
            <FaDatabase className={styles.icon} />
            <span>Raw Data</span>
            {openSections.rawData ? 
              <FaCaretDown className={styles.arrow} /> : 
              <FaCaretRight className={styles.arrow} />
            }
          </div>

          {openSections.rawData && (
            <div className={styles.sidebarSubmenu}>
              <div
                className={styles.sidebarSubLink}
                onClick={() => toggleSection("predictedData")}
              >
                <FaChartBar className={styles.icon} /> 
                <span>Predicted Data</span>
                {openSections.predictedData ? 
                  <FaCaretDown className={styles.arrow} /> : 
                  <FaCaretRight className={styles.arrow} />
                }
              </div>

              {openSections.predictedData && (
                <div className={styles.sidebarSubmenu}>
                  <Link 
                    to="/fulldata" 
                    className={`${styles.sidebarSubLink} ${
                      location.pathname === "/fulldata" ? styles.active : ""
                    }`}
                  >
                    <FaThList className={styles.icon} /> 
                    <span>Full Data</span>
                  </Link>

                  {["January", "February", "March", "April"].map((month, index) => (
                    <div 
                      key={index} 
                      className={`${styles.sidebarSubLink} ${
                        location.pathname === `/monthdataview/${index + 1}` ? styles.active : ""
                      }`}
                      onClick={() => handleMonthClick(index)}
                    >
                      <FaCalendarAlt className={styles.icon} /> 
                      <span>{month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className={styles.sidebarItem}>
          <div 
            className={styles.sidebarLink} 
            onClick={() => toggleSection("reports")}
          >
            <FaChartBar className={styles.icon} />
            <span>Reports</span>
            {openSections.reports ? 
              <FaCaretDown className={styles.arrow} /> : 
              <FaCaretRight className={styles.arrow} />
            }
          </div>
          
          {openSections.reports && (
            <div className={styles.sidebarSubmenu}>
              <Link 
                to="/descriptivereport" 
                className={`${styles.sidebarSubLink} ${
                  location.pathname === "/descriptivereport" ? styles.active : ""
                }`}
                onMouseEnter={(e) => handleMouseEnter("Provides an overview of churn trends and patterns.", e)}
                onMouseLeave={handleMouseLeave}
              >
                <FaQuestionCircle className={styles.icon} /> 
                <span>What - Cause the Patterns</span>
              </Link>
              <Link 
                to="/whoreport" 
                className={`${styles.sidebarSubLink} ${
                  location.pathname === "/whoreport" ? styles.active : ""
                }`}
                onMouseEnter={(e) => handleMouseEnter("Showcasing the factors that affect churn.", e)}
                onMouseLeave={handleMouseLeave}
              >
                <FaUser className={styles.icon} /> 
                <span>Who - at Risk</span>
              </Link>
              <Link 
                to="/whyreport" 
                className={`${styles.sidebarSubLink} ${
                  location.pathname === "/whyreport" ? styles.active : ""
                }`}
                onMouseEnter={(e) => handleMouseEnter("Analyzes reasons behind churn.", e)}
                onMouseLeave={handleMouseLeave}
              >
                <FaClipboardList className={styles.icon} /> 
                <span>Why - Root Cause Analysis</span>
              </Link>
            </div>
          )}
        </div>

        {/* SSBI Dashboard Link */}
        <div className={styles.sidebarItem}>
          <Link 
            to="/ssbi" 
            className={`${styles.sidebarLink} ${
              location.pathname === "/ssbi" ? styles.active : ""
            }`}
          >
            <FaRobot className={styles.icon} /> 
            <span>SSBI Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className={`${styles.tooltipBox} ${styles[tooltip.position]}`}
          style={{
            top: `${tooltip.y}px`,
            left: `${tooltip.x}px`
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default Sidebar;