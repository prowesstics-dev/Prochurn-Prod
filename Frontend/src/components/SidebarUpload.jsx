import { useAuth } from "./AuthContext"; // adjust path if needed

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  FaRocket, FaUpload, FaRobot, FaUsers, FaCog, FaMagic,FaChartLine,FaSatelliteDish,FaServer,FaStream,
  FaProjectDiagram, FaRegChartBar, FaLayerGroup,FaReplyAll,FaUserEdit,FaHeartbeat,FaEnvelopeOpenText,FaPenFancy,FaPaperPlane,FaInbox,FaAddressBook,
  FaCaretDown, FaCaretRight, FaBars, FaMap, FaDownload,FaTachometerAlt,FaUserMinus, FaCogs,FaFilter,FaChartPie,FaUserClock, FaQuestionCircle 
} from "react-icons/fa";
import styles from "./SidebarUpload.module.css";
import { Tooltip } from "antd";

const API_URL = import.meta.env.VITE_API_URL;

const SidebarUpload = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pagesFetchedOnce, setPagesFetchedOnce] = useState(false);
  const { user, axiosInstance, isInitialized } = useAuth(); // ✅ Add isInitialized

  const [userPages, setUserPages] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false); // ✅ Add loading state
  const isActive = (path) => location.pathname === path;
  const isAnyActive = (paths) => paths.some((path) => location.pathname.startsWith(path));

  const [openSections, setOpenSections] = useState({
    assistants: false,
    dashboards: false,
    dashboard: false,
    monitoring : false,
  });

  // ✅ Fetch allowed pages for the logged-in user
  if (!isInitialized) {
  return null; // still initializing
}

useEffect(() => {
  if (!user || pagesFetchedOnce) return;

  console.log("🔍 Fetching pages for user:", user);

  setIsLoadingPages(true);
  axiosInstance.get(`/users/me/`)
    .then((res) => {
      console.log("✅ /users/me/ response:", res.data);
      setUserPages(res.data.pageaccess || []);
    })
    .catch((err) => {
      console.error("❌ Error fetching user pages:", err.response || err.message);
      setUserPages([]);
    })
    .finally(() => {
      setIsLoadingPages(false);
      setPagesFetchedOnce(true);
    });
}, [user, pagesFetchedOnce, axiosInstance]);


 // ✅ Add isInitialized as dependency

  const hasAccessPath = (targetPath) =>
    userPages.some((p) => p.path === targetPath);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderWithTooltip = (label, icon, content) =>
    collapsed ? (
      <Tooltip title={label} placement="right" overlayClassName="customTooltip">
        {content}
      </Tooltip>
    ) : content;

  // ✅ Show loading state while pages are being fetched
  // if (!isInitialized || !user || isLoadingPages || userPages.length === 0) {
  //   return (
  //     <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
  //       <div className={styles.sidebarBrand}>
  //         <div className={styles.logoContainer}>
  //           <h2 className={styles.logoBrand}>
  //             {!collapsed && <span className={styles.fullText}>ProChurn AI</span>}
  //           </h2>
  //         </div>
  //       </div>
  //       <hr className={styles.dividerTitle} />
  //       <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
  //         {!collapsed && "Loading menu..."}
  //       </div>
  //     </div> 
  //   );
  // }
   const isSidebarLoading = isLoadingPages || userPages.length === 0;

  return (
    <>
      <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.logoContainer}>
            <h2 className={styles.logoBrand}>
              {!collapsed && <span className={styles.fullText}>ProChurn AI</span>}
            </h2>
          </div>
        </div>
        <hr className={styles.dividerTitle} />
         {isSidebarLoading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          {!collapsed && "Loading menu..."}
        </div>
      ) : (

        <ul className={styles.sidebarMenu}>
          {hasAccessPath("/retentionpathway") && (
            <>
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Retention Pathway", <FaMap />, (
                <Link to="/retentionpathway" className={`${styles.sidebarLink} ${isActive("/retentionpathway") ? styles.active : ""}`}>
                  <FaMap className={styles.icon} />
                  {!collapsed && <span>Retention Pathway</span>}
                </Link>
              ))}
            </li>
          
          
              <hr className={styles.divider} />
            </>
          )}

          {( hasAccessPath("/rolebasedaccess") || hasAccessPath("/configuration-page")) && (
  <>
    {/* <hr className={styles.divider} /> */}
    {/* {!collapsed && <div className={styles.sectionHeader}>Insights</div>} */}
    <li className={styles.sidebarItem}>
      {renderWithTooltip("Controls", <FaChartPie />, (
        <div
          className={`${styles.sidebarLink} ${
            isAnyActive(["/rolebasedaccess", "/configuration-page"]) ? styles.active : ""
          }`}
          onClick={() => {
            if (collapsed) {
              // match PowerBI behavior: expand by navigating to first item
              onToggle();
              navigate("/rolebasedaccess");
            } else {
              toggleSection("controls");
            }
          }}
        >
          <FaCog className={styles.icon} />
          {!collapsed && <span>Controls & Settings</span>}
          {!collapsed && (openSections.controls ? <FaCaretDown /> : <FaCaretRight />)}
        </div>
      ))}

      {!collapsed && openSections.controls && (
        <div className={styles.sidebarSubmenu}>
          {hasAccessPath("/rolebasedaccess") && (
            <Link
              to="/rolebasedaccess"
              className={`${styles.sidebarSubLink} ${
                isActive("/rolebasedaccess") ? styles.activeSub : ""
              }`}
            >
              User Control Panel
            </Link>
          )}
          {hasAccessPath("/configuration-page") && (
            <Link
              to="/configuration-page"
              className={`${styles.sidebarSubLink} ${
                isActive("/configuration-page") ? styles.activeSub : ""
              }`}
            >
              Configurations
            </Link>
          )}
        </div>
      )}
    </li>
    
  </>
)}

          

          {hasAccessPath("/dataorchestration") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Data Ingestion Interface", <FaDownload />, (
                <Link to="/dataorchestration" className={`${styles.sidebarLink} ${isActive("/dataorchestration") ? styles.active : ""}`}>
                  <FaDownload className={styles.icon} />
                  {!collapsed && <span>Data Ingestion Interface</span>}
                </Link>
              ))}
            </li>
          )} 

          {/* OVERVIEW section — ONE divider for both items */}
          {(hasAccessPath("/healthmonitor") || hasAccessPath("/overview") || hasAccessPath("/churnpatternanalysis")) && (
            <>
              <hr className={styles.divider} />
              {/* {!collapsed && <div className={styles.sectionHeader}>Customer AI</div>} */}
            </>
          )}
            
{( hasAccessPath("/overview") || hasAccessPath("/churnpatternanalysis")) && (
  <>
    {/* <hr className={styles.divider} /> */}
    {/* {!collapsed && <div className={styles.sectionHeader}>Insights</div>} */}
    <li className={styles.sidebarItem}>
      {renderWithTooltip("Dashboard", <FaChartPie />, (
        <div
          className={`${styles.sidebarLink} ${
            isAnyActive(["/overview", "/churnpatternanalysis"]) ? styles.active : ""
          }`}
          onClick={() => {
            if (collapsed) {
              // match PowerBI behavior: expand by navigating to first item
              onToggle();
              navigate("/overview");
            } else {
              toggleSection("dashboard");
            }
          }}
        >
          <FaChartPie className={styles.icon} />
          {!collapsed && <span>Dashboard</span>}
          {!collapsed && (openSections.dashboard ? <FaCaretDown /> : <FaCaretRight />)}
        </div>
      ))}

      {!collapsed && openSections.dashboard && (
        <div className={styles.sidebarSubmenu}>
          {hasAccessPath("/overview") && (
            <Link
              to="/overview"
              className={`${styles.sidebarSubLink} ${
                isActive("/overview") ? styles.activeSub : ""
              }`}
            >
              Historical Data Analysis
            </Link>
          )}
          {hasAccessPath("/churnpatternanalysis") && (
            <Link
              to="/churnpatternanalysis"
              className={`${styles.sidebarSubLink} ${
                isActive("/churnpatternanalysis") ? styles.activeSub : ""
              }`}
            >
              Churn Patterns & Analysis
            </Link>
          )}
        </div>
      )}
    </li>
    
  </>
)}

{(hasAccessPath("/healthmonitor") ) && (
  <>
    {/* <hr className={styles.divider} /> */}
    {/* {!collapsed && <div className={styles.sectionHeader}>Insights</div>} */}
    
    <li className={styles.sidebarItem}>
      {renderWithTooltip("Monitoring", <FaChartPie />, (
        <div
          className={`${styles.sidebarLink} ${
            isAnyActive([ "/healthmonitor"]) ? styles.active : ""
          }`}
          onClick={() => {
            if (collapsed) {
              // match PowerBI behavior: expand by navigating to first item
              onToggle();
              navigate("/healthmonitor");
            } else {
              toggleSection("monitoring");
            }
          }}
        >
          <FaHeartbeat className={styles.icon} />
          {!collapsed && <span>Monitoring</span>}
          {!collapsed && (openSections.monitoring ? <FaCaretDown /> : <FaCaretRight />)}
        </div>
      ))}

      {!collapsed && openSections.monitoring && (
        <div className={styles.sidebarSubmenu}>
          {hasAccessPath("/healthmonitor") && (  
            <Link
              to="/healthmonitor"
              className={`${styles.sidebarSubLink} ${
                isActive("/healthmonitor") ? styles.activeSub : ""
              }`}
            >
              Health Monitoring
            </Link>
          )}
          {/* {hasAccessPath("/datapipeline") && (  
            <Link
              to="/datapipeline"
              className={`${styles.sidebarSubLink} ${
                isActive("/datapipeline") ? styles.activeSub : ""
              }`}
            >
              Data Pipeline Monitoring
            </Link>
          )}
          {hasAccessPath("/modelhealth") && (
            <Link
              to="/modelhealth"
              className={`${styles.sidebarSubLink} ${
                isActive("/modelhealth") ? styles.activeSub : ""
              }`}
            >
              Model Health Monitoring
            </Link>
          )}
          {hasAccessPath("/webusage") && (
            <Link
              to="/webusage"
              className={`${styles.sidebarSubLink} ${
                isActive("/webusage") ? styles.activeSub : ""
              }`}
            >
              Web Usage Monitoring
            </Link>
          )} */}
        </div>
      )}
    </li>
  </>
)}


          {(hasAccessPath("/descriptivenew") || (hasAccessPath("/predictivescores"))) && (
            <>
              <hr className={styles.divider} />
              {!collapsed && <div className={styles.sectionHeader}>Insights</div>}
              <li className={styles.sidebarItem}>
                {renderWithTooltip("Dashboards", <FaLayerGroup />, (
                  <div
                    className={`${styles.sidebarLink} ${isAnyActive(["/descriptivenew"]) ? styles.active : ""}`}
                    onClick={() => {
                    if (collapsed) {
                      onToggle();
                      navigate("/descriptivenew");
                      // navigate("/churnpatternanalysis");
                    } else {
                      toggleSection("dashboards");
                    }
                  }}
                  >
                    <FaLayerGroup className={styles.icon} />
                    {!collapsed && <span>PowerBI Dashboards</span>}
                    {!collapsed && (openSections.dashboards ? <FaCaretDown /> : <FaCaretRight />)}
                  </div>
                ))}
                {!collapsed && openSections.dashboards && (
                  <div className={styles.sidebarSubmenu}>
                    
                    {hasAccessPath("/descriptivenew") && (
                      <Link to="/descriptivenew" className={`${styles.sidebarSubLink} ${isActive("/descriptivenew") ? styles.activeSub : ""}`}>
                        Churn Patterns and Analysis
                      </Link>
                    )}

                    

                    {/* {hasAccessPath("/whonew") && (
                      <Link to="/whonew" className={`${styles.sidebarSubLink} ${isActive("/whonew") ? styles.activeSub : ""}`}>
                        Churn Risk Forecast
                      </Link>
                    )}
                    {hasAccessPath("/whynew") && (
                      <Link to="/whynew" className={`${styles.sidebarSubLink} ${isActive("/whynew") ? styles.activeSub : ""}`}>
                        Churn Root Cause Analysis
                      </Link>
                    )} */}
                  </div>
                )}
              </li>
            </>
          )}

          {hasAccessPath("/predictivescores") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("At-Risk Policy Alerts", <FaRegChartBar />, (
                <Link to="/predictivescores" className={`${styles.sidebarLink} ${isActive("/predictivescores") ? styles.active : ""}`}>
                  <FaRegChartBar className={styles.icon} />
                  {!collapsed && <span>At-Risk Policy Alerts</span>}
                </Link>
              ))}
            </li>
          )}

          {(hasAccessPath("/segmentation") || hasAccessPath("/recommendation") || hasAccessPath("/churnsimulator") || hasAccessPath("/bulkemail") || hasAccessPath("/sara")) && (
            <>
              <hr className={styles.divider} />
              {!collapsed && <div className={styles.sectionHeader}>Customer AI</div>}
            </>
          )}

          {hasAccessPath("/segmentation") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Segmentation", <FaUsers />, (
                <Link to="/segmentation" className={`${styles.sidebarLink} ${isActive("/segmentation") ? styles.active : ""}`}>
                  <FaUsers className={styles.icon} />
                  {!collapsed && <span>Segmentation</span>}
                </Link>
              ))}
            </li>
          )}

          {hasAccessPath("/recommendation") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Recommendations", <FaMagic />, (
                <Link to="/recommendation" className={`${styles.sidebarLink} ${isActive("/recommendation") ? styles.active : ""}`}>
                  <FaMagic className={styles.icon} />
                  {!collapsed && <span>Recommendations</span>}
                </Link>
              ))}
            </li>
          )}

          {hasAccessPath("/churnsimulator") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Churn Simulator", <FaTachometerAlt />, (
                <Link to="/churnsimulator" className={`${styles.sidebarLink} ${isActive("/churnsimulator") ? styles.active : ""}`}>
                  <FaTachometerAlt className={styles.icon} />
                  {!collapsed && <span>Churn Simulator</span>}
                </Link>
              ))}
            </li>
          )}

            {hasAccessPath("/bulkemail") && (
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Email Agent", <FaTachometerAlt />, (
                <Link to="/bulkemail" className={`${styles.sidebarLink} ${isActive("/bulkemail") ? styles.active : ""}`}>
                  <FaPaperPlane className={styles.icon} />
                  {!collapsed && <span>Email Agent</span>}
                </Link> 
              ))}
            </li>
          )}

          

          {hasAccessPath("/sara") && (
            <>
            <li className={styles.sidebarItem}>
              {renderWithTooltip("Assistants", <FaRobot />, (
                <div
                  className={`${styles.sidebarLink} ${isAnyActive(["/sara"]) ? styles.active : ""}`}
                  onClick={() => {
                    if (collapsed) {
                      onToggle();
                      navigate("/sara");
                    } else {
                      toggleSection("assistants");
                    }
                  }}
                >
                  <FaRobot className={styles.icon} />
                  {!collapsed && <span>Assistants</span>}
                  {!collapsed && (openSections.assistants ? <FaCaretDown /> : <FaCaretRight />)}
                </div>
              ))}
              {!collapsed && openSections.assistants && (
                <div className={styles.sidebarSubmenu}>
                  {hasAccessPath("/sara") && (
                  <Link to="/sara" className={`${styles.sidebarSubLink} ${isActive("/sara") ? styles.activeSub : ""}`}>Retention Assitant</Link>)}
                </div>
              )}
            </li>
            </>
          )}

          {hasAccessPath("/ssbi") && (
            <>
              <hr className={styles.divider} />
              <li className={styles.sidebarItem}>
                {renderWithTooltip("SSBI", <FaChartLine />, (
                  <Link to="/ssbi" className={`${styles.sidebarLink} ${isActive("/ssbi") ? styles.active : ""}`}>
                    <FaChartLine className={styles.icon} />
                    {!collapsed && <span>SSBI</span>}
                  </Link>
                ))}
              </li>
            </>
          )}
          {hasAccessPath("/faq-page") && (
            <>
              <hr className={styles.divider} />
              <li className={styles.sidebarItem}>
                {renderWithTooltip("FAQ", <FaQuestionCircle  />, (
                  <Link to="/faq-page" className={`${styles.sidebarLink} ${isActive("/faq-pagw") ? styles.active : ""}`}>
                    <FaQuestionCircle  className={styles.icon} />
                    {!collapsed && <span>FAQ</span>}
                  </Link>
                ))}
              </li>
            </>
          )}
        </ul>
      )}
      </div>

      <button
        id="main-toggle"
        onClick={onToggle}
        className={`${styles.toggleButton} ${collapsed ? styles.collapsedToggle : ""}`}
      >
        <FaBars />
      </button>
    </>
  );
};

export default SidebarUpload;