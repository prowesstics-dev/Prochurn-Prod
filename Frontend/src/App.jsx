// App.jsx
import React, { useState, useEffect, useRef } from "react";
import { setUser, track, trackPageView, enableClickTracking } from "./analytics";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { applyFontFamily, ensureGoogleFontLoaded } from "./utils/fonts";
import { onCLS, onINP, onLCP } from "web-vitals";
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import useTopbarColorTracker from "./hooks/useTopbarColorTracker";
import useTopbarHighlight from "./hooks/useTopbarHighlight";
import LoginPage from "./components/LoginPage";
import { useAuth } from "./components/AuthContext";
import SignUp from "./components/SignUp";
import UploadPage from "./components/UploadPage";
import ChatbotCircle from "./components/ChatbotCircle.jsx";
import RetentionPathway from "./components/RetentionPathway.jsx";
import SidebarUpload from "./components/SidebarUpload";
import DescriptiveReport from "./components/DescriptiveReport";
import RawData from "./components/RawData";
import FullData from "./components/FullData.jsx";
import MonthDataView from "./components/MonthDataView.jsx";
import WhyReport from "./components/WhyReport.jsx";
import WhoReport from "./components/WhoReport.jsx";
import HowReport from "./components/HowReport.jsx";
import SSBI from "./components/SSBI.jsx";
import SSBILandingPage from "./components/SSBIHomePage.jsx";
import FileUploadPage from "./components/FileUploadPage.jsx";
import CreateDashboardLanding from "./components/CreateDashboardLanding.jsx";
import DataPreprocessing from "./components/DataPreprocessing.jsx";
import PastFullData from "./components/PastFullData.jsx";
import PastMonthWiseData from "./components/PastMonthWiseData.jsx";
import PredictedNewFullData from "./components/PredictedNewFullData.jsx";
import PredictedNewMonthData from "./components/PredictedNewMonthData.jsx";
import DescriptiveNew from "./components/DescriptiveNew.jsx";
import WhoNew from "./components/WhoNew.jsx";
import WhyNew from "./components/WhyNew.jsx";
import HistoricalData from "./components/HistoricalData.jsx";
import TopBar from "./components/TopBar.jsx";
import AIAgents from "./components/AIAgents.jsx";
import Chatbots from "./components/ChatBots.jsx";
import Segmentation from "./components/Segmentation.jsx";
import Recommendation from "./components/Recommendation.jsx";
import ReportHub from "./components/ReportHub.jsx";
import Overview from "./components/Overview.jsx";
import PredictiveScores from "./components/PredictiveScores.jsx";
import Next7Days from "./components/Next7Days.jsx";
import Next30Days from "./components/Next30Days.jsx";
import DataOrchestration from "./components/DataOrchestration.jsx";
import Sara from "./components/Sara.jsx";
import WhatReactDashboard from "./components/WhatReactDashboard";
import RolebasedAccess from "./components/RolebasedAccess.jsx";
import ScrollToTop from "./components/ScrollToTop";
import ChurnPatternAnalysis from "./components/ChurnPatternAnalysisDashboard.jsx";
import DataPipelineMonitoring from "./components/DataPipelineMonitoring.jsx";
import ModelHealthMonitoring from "./components/ModelHealthMonitoring.jsx";
import { Spin, ConfigProvider } from "antd";

import ChurnSimulator from "./components/ChurnSimulator.jsx";
import BulkEmail from "./components/BulkEmail.jsx";
import WebUsageMetrics from "./components/WebUsageMetrics.jsx";
import HealthMonitor from "./components/HealthMonitor.jsx";
import Configurations from "./components/Configurations.jsx";
import ConnectorsPage from "./components/ConnectorsPage";
import FaqPage from "./components/FaqPage.jsx";

/* ---------------------------- Protected Route ---------------------------- */
const ProtectedRoute = () => {
  const { refreshTokenHandler } = useAuth();
  const { resetTheme } = useTheme(); // ✅ reset theme on logout/session fail
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);
  const [hasRetriedRefresh, setHasRetriedRefresh] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const access = localStorage.getItem("accessToken");

      if (access) {
        setValid(true);
        try {
          track("session_start", { method: "token" });
        } catch {}
        setChecked(true);
        return;
      }

      // try refresh once
      if (!hasRetriedRefresh) {
        const refreshed = await refreshTokenHandler();

        if (refreshed) {
          setValid(true);
          try {
            track("session_start", { method: "refresh" });
          } catch {}
        } else {
          setValid(false);
          localStorage.clear();
          try {
            resetTheme(); // ✅ back to default theme
          } catch {}
          navigate("/login");
        }

        setChecked(true);
        setHasRetriedRefresh(true);
        return;
      }

      // refresh already tried -> force logout
      setValid(false);
      setChecked(true);
      localStorage.clear();
      try {
        resetTheme(); // ✅ back to default theme
      } catch {}
      navigate("/login");
    };

    checkAuth();
  }, [hasRetriedRefresh, navigate, refreshTokenHandler, resetTheme]);

  if (!checked) return <div>Loading...</div>;
  return valid ? <Outlet /> : null;
};

/* ------------------------------- Layout --------------------------------- */
const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const scrollRef = useRef(null);
  const highlight = useTopbarHighlight();
  const [topbarColor, setTopbarColor] = useState("rgba(150, 164, 206, 0.5)");

  useTopbarColorTracker(setTopbarColor);

  // One-time: enable global click tracking
  useEffect(() => {
    try {
      enableClickTracking();
    } catch {}
  }, []);

  // IntersectionObserver for topbar color
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let active = null;
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const mid = rect.top + rect.height / 2;
          if (
            entry.isIntersecting &&
            mid > 0 &&
            mid < 60 &&
            entry.target.dataset.color
          ) {
            active = entry.target.dataset.color;
          }
        });
        if (active) setTopbarColor(active);
      },
      { root: null, threshold: [0.1, 0.5, 0.9] }
    );

    const nodes = document.querySelectorAll("[data-color]");
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll to top + track page view on route change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    try {
      trackPageView();
    } catch {}
  }, [location.pathname]);

  // Auto-collapse sidebar for selected routes
  useEffect(() => {
    const collapseRoutes = new Set([
      "/dataorchestration",
      "/retentionpathway",
      "/uploadpage",
      "/predictivescores",
      "/segmentation",
      "/recommendation",
      "/whatreactdashboard",
      "/whonew",
      "/whynew",
      "/ssbi",
      "/churnsimulator",
      "/webusage",
      "/bulkemail",
      "/healthmonitor",
      "/datapipeline",
      "/modelhealth",
      "/configurations",
      "/churnpatternanalysis",
      "/configuration-page",
      "/connectors",
      "/faq-page",
    ]);
    setIsCollapsed(collapseRoutes.has(location.pathname));
  }, [location.pathname]);

  const handleToggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <div
      className="dashboard"
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--app-font-family)",
      }}
    >
      <SidebarUpload collapsed={isCollapsed} onToggle={handleToggleSidebar} />

      {/* Main Right Area */}
      <div
        style={{
          flex: 1,
          marginLeft: isCollapsed ? 70 : 250,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar
          isSidebarCollapsed={isCollapsed}
          scrollContainerRef={scrollRef}
          activeColor={topbarColor}
          highlight={highlight}
        />

        {/* Content Wrapper */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            <Outlet context={{ isCollapsed }} />
          </div>
        </div>
      </div>

      {/* Floating Chatbots */}
      {location.pathname !== "/sara" && (
        <div
          style={{
            position: "fixed",
            bottom: 40,
            left: "52%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "100%",
            maxWidth: "800px",
          }}
        >
          <Chatbots />
        </div>
      )}

      {/* Right Corner Chatbot (Circle) */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1001,
        }}
      >
        <ChatbotCircle />
      </div>
    </div>
  );
};

/* ----------------------- AppShell (Theme -> AntD) ------------------------ */
function AppShell() {
  const { antdConfig } = useTheme(); // ✅ dynamic theme (primary color + dark/light + font)

  return (
    <ConfigProvider theme={antdConfig}>
      <ScrollToTop />
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="ssbihome" element={<SSBI />} />
          <Route path="data-upload" element={<FileUploadPage />} />
          <Route path="create-dashboard" element={<CreateDashboardLanding />} />

          <Route element={<Layout />}>
            <Route path="ssbi" element={<SSBILandingPage />} />
            <Route path="rolebasedaccess" element={<RolebasedAccess />} />
            <Route path="whatreactdashboard" element={<WhatReactDashboard />} />
            <Route path="sara" element={<Sara />} />
            <Route path="retentionpathway" element={<RetentionPathway />} />
            <Route path="uploadpage" element={<UploadPage />} />
            <Route path="descriptivereport" element={<DescriptiveReport />} />
            <Route path="whoreport" element={<WhoReport />} />
            <Route path="whyreport" element={<WhyReport />} />
            <Route path="howreport" element={<HowReport />} />
            <Route path="predictivereport" element={<HowReport />} />
            <Route path="rawdata" element={<RawData />} />
            <Route path="fulldata" element={<FullData />} />
            <Route path="monthdataview/:month" element={<MonthDataView />} />
            <Route path="datapreprocessing" element={<DataPreprocessing />} />
            <Route path="pastfulldata" element={<PastFullData />} />
            <Route
              path="pastmonthwisedata/:month"
              element={<PastMonthWiseData />}
            />
            <Route path="predictednewfulldata" element={<PredictedNewFullData />} />
            <Route
              path="predictednewmonthdata/:month"
              element={<PredictedNewMonthData />}
            />
            <Route path="descriptivenew" element={<DescriptiveNew />} />
            <Route path="whonew" element={<WhoNew />} />
            <Route path="whynew" element={<WhyNew />} />
            <Route path="historicaldata" element={<HistoricalData />} />
            <Route path="aiagents" element={<AIAgents />} />
            <Route path="segmentation" element={<Segmentation />} />
            <Route path="recommendation" element={<Recommendation />} />
            <Route path="reporthub" element={<ReportHub />} />
            <Route path="overview" element={<Overview />} />
            <Route path="predictivescores" element={<PredictiveScores />} />
            <Route path="next7days" element={<Next7Days />} />
            <Route path="next30days" element={<Next30Days />} />
            <Route path="dataorchestration" element={<DataOrchestration />} />
            <Route path="churnsimulator" element={<ChurnSimulator />} />
            <Route path="churnpatternanalysis" element={<ChurnPatternAnalysis />} />
            <Route path="datapipeline" element={<DataPipelineMonitoring />} />
            <Route path="modelhealth" element={<ModelHealthMonitoring />} />
            <Route path="webusage" element={<WebUsageMetrics />} />
            <Route path="bulkemail" element={<BulkEmail />} />
            <Route path="healthmonitor" element={<HealthMonitor />} />
            <Route path="configuration-page" element={<Configurations />} />
             <Route path="connectors" element={<ConnectorsPage />} />
             <Route path="faq-page" element={<FaqPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ConfigProvider>
  );
}

/* --------------------------------- App ---------------------------------- */
function App() {
  const { isInitialized, user } = useAuth();

  // Restore font on startup
  useEffect(() => {
    const saved = localStorage.getItem("app_font_family");
    if (saved) {
      ensureGoogleFontLoaded(saved);
      applyFontFamily(saved);
    }
  }, []);

  // Bind user id/email to analytics context
  useEffect(() => {
    try {
      setUser(user?.id || user?.email || undefined);
    } catch {}
  }, [user]);

  // One-time: capture Web Vitals
  useEffect(() => {
    try {
      onLCP((v) => track("web_vital", { name: "LCP", value: v.value }));
      onINP((v) => track("web_vital", { name: "INP", value: v.value }));
      onCLS((v) => track("web_vital", { name: "CLS", value: v.value }));
    } catch {}
  }, []);

  if (!isInitialized) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 100 }}>
        <Spin size="large" tip="Restoring session..." />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AppShell />
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
