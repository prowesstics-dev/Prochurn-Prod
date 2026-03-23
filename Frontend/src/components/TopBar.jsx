import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  FaBars,
  FaUserCircle,
  FaExchangeAlt,
  FaSignOutAlt,
  FaTimes,
  FaCog,
  FaSync,
  FaMoon,
  FaSun,
  FaUsers,
  FaAngleRight
} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { Dropdown, Menu, Space, notification, Typography } from 'antd';

const { Text } = Typography;

const DEFAULT_CURRENCIES = {
  // 'INR': { symbol: '₹', rate: 1, name: 'Indian Rupee' },
  // 'USD': { symbol: '$', rate: 0.012, name: 'US Dollar' },
  // 'EUR': { symbol: '€', rate: 0.011, name: 'Euro' },
  // 'GBP': { symbol: '£', rate: 0.0095, name: 'British Pound' },
  // 'JPY': { symbol: '¥', rate: 1.8, name: 'Japanese Yen' },
  // 'AUD': { symbol: 'A$', rate: 0.018, name: 'Australian Dollar' },
  // 'CAD': { symbol: 'C$', rate: 0.016, name: 'Canadian Dollar' },
  // 'CHF': { symbol: 'CHF', rate: 0.0105, name: 'Swiss Franc' },
  // 'CNY': { symbol: 'CN¥', rate: 0.086, name: 'Chinese Yuan' }
};

const TopBar = ({ isSidebarCollapsed }) => {
  const { resetTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loadingRates, setLoadingRates] = useState(false);
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [theme, setTheme] = useState('light');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const dropdownRef = useRef(null);
  const configurationRef = useRef(null);

  const location = useLocation();
  const currentPath = location.pathname;

  const currencyPages = [
    '/overview', '/next7days', '/next30days', '/segmentation',
    '/recommendation', '/churnsimulator', '/bulkemail','/churnpatternanalysis',
  ];

  const showCurrency = currencyPages.some(path => currentPath.includes(path));
  const showTheme = currentPath !== "/retentionpathway";
  const showCustomerSegment = currentPath.includes("/segmentation");

 const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
 const configURL = import.meta.env.VITE_CONFIGURATIONS || "http://127.0.0.1:8000/configurations";


  const toggleDropdown = () => setIsDropdownOpen(s => !s);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
    // fetchExchangeRatesFromDB();
  }, []);
const handleViewProfile = async () => {
    setIsDropdownOpen(false);
    setLoading(true);
    setIsProfileModalOpen(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (currentUser) {
        // Format the profile image URL if it exists
        const profileData = { ...currentUser };
        console.log("Original profile_image:", profileData.profile_image);

        if (profileData.profile_image) {
          // Clean up the image path - remove leading slashes and handle different formats
          let cleanImagePath = profileData.profile_image;

          // If it's already a full URL, use it as is
          if (cleanImagePath.startsWith("http")) {
            profileData.profile_image = cleanImagePath;
          } else {
            // Remove leading slashes and construct proper URL
            cleanImagePath = cleanImagePath.replace(/^\/+/, "");
            profileData.profile_image = `https://prowesstics.space/media/${cleanImagePath}`;
          }

          console.log("Constructed image URL:", profileData.profile_image);
        }

        setUserProfile(profileData);
      } else {
        console.warn("No current user data available");
        setUserProfile({
          username: username,
          email: email,
          role: "User"
        });
      }
    } catch (error) {
      console.error("Error preparing user profile:", error);
      // Use current user data as fallback
      setUserProfile(
        currentUser || {
          username: username,
          email: email,
          role: "User"
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Simulate logout confirmation
    if (window.confirm("Are you sure you want to log out?")) {
      console.log("Logging out...");
      localStorage.clear();
      
      // Note: navigate function needs to be imported from react-router-dom
      // navigate("/login");
      window.location.href = "/login"; // Alternative if navigate is not available
      // Replace with actual logout logic
    }
  };

  

  // 🔥 Fetch Saved Rates From Backend Table
  // const fetchExchangeRatesFromDB = async () => {
  //   try {
  //     setLoadingRates(true);

  //     const res = await fetch(`${configURL}/currency/refresh/`);
  //     const data = await res.json();

  //     if (!data.status || !data.data) throw new Error("No data returned");

  //     const updated = { ...DEFAULT_CURRENCIES };
  //     data.data.forEach(item => {
  //       if (updated[item.currency_code]) {
  //         updated[item.currency_code].rate = Number(item.rate);
  //       }
  //     });

  //     setCurrencies(updated);
  //     setLastUpdated(new Date());

  //   } catch (err) {
  //     console.error(err);
  //     notification.error({
  //       message: "Currency Load Failed",
  //       description: "Could not load stored exchange rates"
  //     });
  //   } finally {
  //     setLoadingRates(false);
  //   }
  // };

  // 🔁 Refresh Button → Hits Django API + Updates DB + UI
  // const refreshCurrencyRates = async () => {
  //   try {
  //     setLoadingRates(true);

  //     const res = await fetch(`${configURL}/currency/refresh/`);
  //     const data = await res.json();

  //     if (!data.status) throw new Error(data.message);

  //     const updated = { ...DEFAULT_CURRENCIES };
  //     data.data.forEach(item => {
  //       if (updated[item.currency_code]) {
  //         updated[item.currency_code].rate = Number(item.rate);
  //       }
  //     });

  //     setCurrencies(updated);
  //     setLastUpdated(new Date());

  //     notification.success({
  //       message: "Currency Rates Updated",
  //       description: "Live exchange rates successfully refreshed."
  //     });

  //   } catch (err) {
  //     console.error(err);
  //     notification.error({
  //       message: "Refresh Failed",
  //       description: "Unable to pull live exchange rates"
  //     });
  //   } finally {
  //     setLoadingRates(false);
  //   }
  // };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/`);
      const allUsers = await response.json();
      setUsers(allUsers);

      const localUser = JSON.parse(localStorage.getItem("user")) || {};
      const foundUser = allUsers.find(
        u => u.id === localUser.id || u.email === localUser.email
      );
      setCurrentUser(foundUser || localUser);
    } catch {
      setCurrentUser(JSON.parse(localStorage.getItem("user")) || {});
    }
  };

  const username = currentUser?.username || "Guest";
  const email = currentUser?.email || "unknown@example.com";

  const configurationMenu = (
  <Menu className="configurationMenu">
      {showTheme && (
        <Menu.SubMenu
          key="theme"
          title={
            <Space className="submenuTitle">
              <div className="themeIconContainer">
                {theme === 'dark' ? <FaMoon /> : <FaSun />}
              </div>
              <Text strong>Theme</Text>
              <FaAngleRight className="submenuArrow" />
            </Space>
          }
        >
          <Menu.Item key="light" onClick={() => setTheme('light')}>
            Light
          </Menu.Item>
          <Menu.Item key="dark" onClick={() => setTheme('dark')}>
            Dark
          </Menu.Item>
        </Menu.SubMenu>
      )}

      {showCurrency && (
        <Menu.SubMenu
          key="currency"
          title={
            <Space className="submenuTitle">
              <div className="currencyIconContainer">
                <FaExchangeAlt />
              </div>
              <Text strong>Currency</Text>
              <FaAngleRight className="submenuArrow" />
            </Space>
          }
        >
          <div className="subMenuHeader">
            <Text type="secondary">Select your preferred currency</Text>

            {/* <button
              onClick={refreshCurrencyRates}
              disabled={loadingRates}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                marginLeft: 10
              }}
            >
              <FaSync
                className={loadingRates ? "spin" : ""}
                style={{ fontSize: 18 }}
              />
            </button> */}
          </div>

          {Object.entries(currencies).map(([code, data]) => (
            <Menu.Item
              key={code}
              onClick={() => setSelectedCurrency(code)}
            >
              {code} — {data.rate}
            </Menu.Item>
          ))}
        </Menu.SubMenu>
      )}

      {/* ⭐ Segmentation submenu — ONLY visible on segmentation page */}
      {showCustomerSegment && (
        <Menu.SubMenu
          key="segment"
          title={
            <Space className="submenuTitle">
              <div className="segmentIconContainer">
                <FaUsers />
              </div>
              <Text strong>Segmentation</Text>
              <FaAngleRight className="submenuArrow" />
            </Space>
          }
        >
          {/* <Menu.Item key="all" onClick={() => setSelectedSegment("all")}>
            All Customers
          </Menu.Item>

          <Menu.Item key="high" onClick={() => setSelectedSegment("high")}>
            High Risk
          </Menu.Item>

          <Menu.Item key="medium" onClick={() => setSelectedSegment("medium")}>
            Medium Risk
          </Menu.Item>

          <Menu.Item key="low" onClick={() => setSelectedSegment("low")}>
            Low Risk
          </Menu.Item> */}
        </Menu.SubMenu>
      )}
  </Menu>

  );

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <>
      <div className={`topbar ${isSidebarCollapsed ? "topbarCollapsed" : "topbarExpanded"}`}>
        <div className="left"></div>
        <div className="right">
          {/* Configuration Dropdown - shown only when there's at least one option */}
          {(showTheme || showCurrency || showCustomerSegment) && (
            <div className="configurationSection" ref={configurationRef}>
              {/* <Dropdown 
                overlay={configurationMenu} 
                placement="bottomRight"
                trigger={['click']}
                overlayClassName="configurationDropdown"
                getPopupContainer={() => configurationRef.current}
              >
                <button className="iconBtn configurationBtn" aria-haspopup="true">
                  <FaCog className="configurationIcon" />
                 
                  {(showTheme || showCurrency || showCustomerSegment) && (
                    <div className="selectionBadges">
                      
                    </div>
                  )}
                </button>
              </Dropdown> */}
            </div>
          )}

          <div className="userSection" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="userBtn" aria-haspopup="true" aria-expanded={isDropdownOpen}>
              <FaBars />
              <div className="userInfo">
                <span className="userName">{username}</span>
                <span className="userEmail">{email}</span>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="dropdown">
                <div className="dropdownItem" onClick={handleViewProfile}>
                  <FaUserCircle />
                  <span>View Profile</span>
                </div>
                <hr className="divider" />
                <div className="dropdownItem" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal - keep existing modal code */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button
                className="close-btn"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading profile...</p>
              </div>
            ) : (
              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-image-container">
                    {userProfile?.profile_image ? (
                      <>
                        <img
                          src={userProfile.profile_image}
                          alt="Profile"
                          className="profile-image"
                          onLoad={() => console.log("Image loaded successfully:", userProfile.profile_image)}
                          onError={(e) => {
                            console.error("Image failed to load:", userProfile.profile_image);
                            console.error("Error event:", e);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          className="profile-placeholder"
                          style={{ display: "none" }}
                        >
                          <FaUserCircle />
                        </div>
                      </>
                    ) : (
                      <div
                        className="profile-placeholder"
                        style={{ display: "flex" }}
                      >
                        <FaUserCircle />
                      </div>
                    )}
                  </div>
                  <div className="profile-basic-info">
                    <h3>{userProfile?.username || username}</h3>
                    <p className="role">{userProfile?.role || "User"}</p>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{userProfile?.email || email}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Date of Birth:</span>
                    <span className="detail-value">{formatDate(userProfile?.date_of_birth)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Organization:</span>
                    <span className="detail-value">{userProfile?.organization || "Not specified"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* Main Topbar with Glassmorphism Effect */
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          height: 60px;
          width: 100%;
          z-index: 999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          background-color: transparent;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.3s ease;
        }

        @supports (backdrop-filter: blur(20px)) {
          .topbar {
            background-color: rgba(255, 255, 255, 0.2);
          }
          .topbar.dark {
            background-color: rgba(20, 20, 20, 0.25);
          }
        }

        .topbarExpanded {
          left: 250px;
          width: calc(100% - 250px);
        }

        .topbarCollapsed {
          left: 70px;
          width: calc(100% - 70px);
        }

        .scrolled {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .left {
          flex: 1;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Configuration Section */
        .configurationSection {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: 10px;
        }

        .configurationBtn {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #374151;
          transition: all 0.3s ease;
          position: relative;
        }

        .configurationBtn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(24, 144, 255, 0.5);
          transform: rotate(30deg);
        }

        .configurationIcon {
          font-size: 16px;
          color: #374151;
        }

        .selectionBadges {
          position: absolute;
          top: -5px;
          right: -5px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .themeBadge,
        .segmentBadge,
        .currencyBadge {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          border: 2px solid white;
          background: #06b6d4;
        }

        .themeBadge svg {
          font-size: 8px;
        }

        .currencyBadge {
          font-size: 10px;
          font-weight: bold;
        }

        /* User Section */
        .userSection {
          position: relative;
          padding: 0 30px 0 0;
        }

        .userBtn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 0.5rem;
          padding: 8px 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #656a71ff;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .userBtn:hover {
          border-color: rgba(24, 144, 255, 0.5);
          background: rgba(240, 247, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .userInfo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .userName {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .userEmail {
          font-size: 12px;
          color: #23272eff;
        }

        .dropdown {
          position: absolute;
          right: 30px;
          top: 48px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          width: 190px;
          z-index: 1000;
        }

        .dropdownItem {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 12px 16px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 6px;
          color: #374151;
          transition: all 0.2s ease;
        }

        .dropdownItem:hover {
          background: rgba(243, 244, 246, 0.8);
          backdrop-filter: blur(10px);
        }

        .dropdownItem:first-child {
          border-radius: 8px 8px 0 0;
        }

        .dropdownItem:last-child {
          border-radius: 0 0 8px 8px;
        }

        .divider {
          border: none;
          border-top: 1px solid rgba(229, 231, 235, 0.5);
          margin: 0.5rem 0;
        }

        /* Configuration Dropdown Styles */
        .configurationDropdown {
          min-width: 300px;
        }

        .configurationMenu {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .configurationMenu .ant-dropdown-menu-submenu-title,
        .configurationMenu .ant-dropdown-menu-item {
          padding: 12px 16px !important;
          margin: 0 !important;
          border-radius: 0 !important;
          transition: all 0.3s ease;
        }

        .configurationMenu .ant-dropdown-menu-submenu-title:hover,
        .configurationMenu .ant-dropdown-menu-item:hover {
          background: rgba(243, 244, 246, 0.8) !important;
        }

        .submenuTitle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .themeIconContainer,
        .segmentIconContainer,
        .currencyIconContainer {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
          margin-right: 12px;
        }

        .segmentIconContainer {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .currencyIconContainer {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .submenuArrow {
          font-size: 12px;
          color: #9ca3af;
          transition: transform 0.3s ease;
        }

        .ant-dropdown-menu-submenu-open .submenuArrow {
          transform: rotate(90deg);
        }

        /* Submenu Styles */
        .themeSubMenu,
        .segmentSubMenu,
        .currencySubMenu {
          min-width: 300px !important;
          max-height: 400px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          margin-left: 4px !important;
        }

        .subMenuHeader {
          padding: 12px 16px;
          background: #f9f9f9;
          border-bottom: 1px solid #f0f0f0;
        }

        /* Theme Items */
        .themeItem,
        .segmentItem,
        .currencyItem {
          width: 100%;
          padding: 8px 0;
        }

        .themeOptionIcon {
          font-size: 20px;
          width: 40px;
          text-align: center;
          color: #f59e0b;
        }

        .themeItem .themeOptionIcon:last-child {
          color: #374151;
        }

        .themeDetails,
        .segmentDetails,
        .currencyDetails {
          flex: 1;
          min-width: 0;
        }

        .themeDescription,
        .segmentDescription,
        .currencyName {
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .currencyRate {
          font-size: 11px;
        }

        .rateText {
          color: #666 !important;
        }

        /* Segment Items */
        .segmentDot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 12px;
        }

        .segmentNameRow {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 2px;
        }

        /* Selected Option Styles */
        .selectedOption {
          background: rgba(6, 182, 212, 0.08) !important;
          border-left: 3px solid #06b6d4 !important;
        }

        .selectedOption:hover {
          background: rgba(6, 182, 212, 0.12) !important;
        }

        .selectedIndicator {
          color: #06b6d4;
          font-weight: bold;
          font-size: 14px;
          margin-left: 8px;
        }

        /* Currency Items */
        .currencySymbol {
          font-size: 20px;
          width: 40px;
          text-align: center;
          font-weight: bold;
        }

        .currencyCodeName {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 2px;
        }

        /* Theme styles for body */
        body.light-theme {
          background-color: #ffffff;
          color: #111827;
        }

        body.dark-theme {
          background-color: #1a1a1a;
          color: #f3f4f6;
        }

        body.dark-theme .topbar {
          background-color: rgba(20, 20, 20, 0.25);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        body.dark-theme .configurationMenu,
        body.dark-theme .themeSubMenu,
        body.dark-theme .segmentSubMenu,
        body.dark-theme .currencySubMenu {
          background: rgba(30, 30, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f3f4f6;
        }

        body.dark-theme .configurationMenu .ant-dropdown-menu-submenu-title,
        body.dark-theme .configurationMenu .ant-dropdown-menu-item {
          color: #f3f4f6;
        }

        body.dark-theme .configurationMenu .ant-dropdown-menu-submenu-title:hover,
        body.dark-theme .configurationMenu .ant-dropdown-menu-item:hover {
          background: rgba(55, 65, 81, 0.8) !important;
        }

        body.dark-theme .subMenuHeader {
          background: #2d2d2d;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        body.dark-theme .subMenuHeader .ant-typography-secondary {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Modal Styles (keep existing modal styles) */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .profile-modal {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          max-width: 90vw;
          max-height: 600px;
          width: 40%;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .profile-modal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          opacity: 0.1;
          border-radius: 24px 24px 0 0;
          z-index: -1;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 40px 0px;
          background: transparent;
          position: relative;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.8);
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
          padding: 12px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(102, 126, 234, 0.1);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          margin-bottom: 24px;
          position: relative;
        }

        .spinner::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 2px solid transparent;
          border-top: 2px solid #764ba2;
          border-radius: 50%;
          animation: spin 1.5s linear infinite reverse;
        }

        .loading-container p {
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .profile-content {
          padding: 1vh 1vw;
        }

        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: -30px;
          margin-bottom: 34px;
        }

        .profile-image-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 24px;
        }

        .profile-image-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 1;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          border-radius: 50%;
          z-index: -1;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset;
        }

        .profile-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 0 0 6px rgba(255, 255, 255, 0.9);
        }

        .profile-basic-info h3 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .role {
          margin: 0;
          font-size: 14px;
          color: white;
          font-weight: 600;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow:
            0 8px 25px rgba(59, 130, 246, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          margin-bottom: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }

        .detail-row::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .detail-row:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 120px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-label::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: inline-block;
        }

        .detail-value {
          font-size: 16px;
          color: #1f2937;
          font-weight: 500;
          text-align: right;
          flex: 1;
          margin-left: 16px;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media screen and (max-height: 700px), (max-width: 500px) {
          .profile-modal {
            max-height: 95vh;
            max-width: 95vw;
            padding: 0;
          }

          .profile-content {
            padding: 20px;
          }

          .modal-header {
            padding: 16px;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .topbarCollapsed,
          .topbarExpanded {
            left: 0;
            width: 100%;
          }

          .topbar {
            padding: 0 16px;
          }

          .configurationSection {
            margin-right: 5px;
          }

          .selectionBadges {
            display: none; /* Hide badges on mobile for space */
          }

          .userBtn {
            padding: 6px 12px;
          }

          .userName {
            font-size: 13px;
          }

          .userEmail {
            font-size: 11px;
          }

          .profile-modal {
            width: 95%;
            margin: 20px;
            max-width: none;
          }

          .profile-content {
            padding: 24px 20px;
          }

          .modal-header {
            padding: 20px 24px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .profile-image-container {
            width: 100px;
            height: 100px;
          }

          .profile-placeholder {
            font-size: 40px;
          }

          .profile-basic-info h3 {
            font-size: 24px;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 14px 16px;
          }

          .detail-value {
            text-align: left;
            width: 100%;
          }

          .detail-label {
            min-width: auto;
            width: 100%;
          }

          .detail-row:hover {
            transform: translateX(4px) scale(1.01);
          }

          .configurationDropdown {
            min-width: 280px;
          }

          .themeSubMenu,
          .segmentSubMenu,
          .currencySubMenu {
            min-width: 260px !important;
          }
        }

        @media (max-width: 480px) {
          .configurationDropdown {
            min-width: 250px;
          }
          
          .themeSubMenu,
          .segmentSubMenu,
          .currencySubMenu {
            min-width: 240px !important;
          }
          
          .themeOptionIcon,
          .currencySymbol {
            font-size: 18px;
            width: 30px;
          }
          
          .currencyCodeName,
          .segmentNameRow {
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
          }
          
          .themeDescription,
          .segmentDescription,
          .currencyName {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
};

export default TopBar;