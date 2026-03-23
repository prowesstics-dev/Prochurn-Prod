import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Table, Spin, Tabs } from "antd";
import { Database, FileText, Archive } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Fluent UI
import { FluentProvider, webLightTheme, makeStyles } from "@fluentui/react-components";
// import { fontFamily } from "html2canvas/dist/types/css/property-descriptors/font-family";

// ✅ Chart colors
const chartColors = ["#075988", "#06b6d4", "#0a77b6ff"];

// Glossy color palette
const colors = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryDark: "#1e3a8a",
  success: "#10b981",
  successLight: "#34d399",
  warning: "#f59e0b",
  warningLight: "#fbbf24",
  danger: "#ef4444",
  dangerLight: "#f87171",
  white: "#313131ff",
  glass: "rgba(61, 61, 61, 0.1)",
  glassDark: "rgba(0, 0, 0, 0.1)",
};

const pipelineTheme = {
  cardBg: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(247,251,255,0.88) 100%)",
  border: "1px solid rgba(255,255,255,0.6)",
  shadow: "0 6px 20px rgba(2,6,23,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
  iconBg: "linear-gradient(145deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
  iconBorder: "1px solid rgba(6,182,212,0.25)",
  title: "#075988",
  value: "#16a34a",
  text: "#0f172a",
};

// ✅ Fluent UI styles
const useFluentStyles = makeStyles({
  control: {
    maxWidth: "260px",
  },
});

/**
 * ✅ IMPORTANT FIX FOR “RIGHT SIDE CLIPPED”
 * 1) DO NOT use width: 100vw (it includes scrollbar width → causes overflow & clipping).
 * 2) Use width: 100% + border-box everywhere + global overflow-x hidden.
 * 3) Use CSS clamp for right column width (no JS calculations needed).
 */
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%", // ✅ was 100vw (causes overflow on many browsers)
    maxWidth: "100%",
    boxSizing: "border-box",
    background: "#f0f9ff",
    padding: "clamp(56px, 6vw, 80px) clamp(12px, 3vw, 24px) clamp(60px, 6vw, 90px)",
    position: "relative",
    overflowX: "hidden", // ok after we remove 100vw overflow
    fontFamily : "var(--app-font-family)",
  },

  backgroundShapes: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    zIndex: 0,
  },

  backButtonStyle: {
    background: "#075988",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    animation: "blink 1.2s linear infinite",
  },

  contentWrapper: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
    minWidth: 0,
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    marginBottom: "8px",
    minWidth: 0,
  },

  title: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    fontWeight: 700,
    background: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  // ✅ Right column uses clamp so it never exceeds screen width
  topRowContainer: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) clamp(320px, 34vw, 460px)",
    gap: "20px",
    marginBottom: "20px",
    boxSizing: "border-box",
    minWidth: 0,
  },

  // ✅ Switch to single column on smaller screens (also prevents clipping)
  topRowContainerMobile: {
    gridTemplateColumns: "1fr",
  },

  mainContainer: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    minWidth: 0,
  },

  mergedRightContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    minWidth: 0,
  },

  glassCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },

  chartCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },

  chartCard2: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    marginTop: "10px",
    marginBottom: "0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },

  narrowStageContainers: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    width: "100%",
    minWidth: 0,
  },

  narrowStageContainersMobile: {
    gridTemplateColumns: "1fr",
  },

  narrowStageCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    boxSizing: "border-box",
  },

  sectionTitle: {
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
    fontWeight: 700,
    lineHeight: 1.5,
    background: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textAlign: "center",
    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginTop: "-10px",
  },

  barsectionTitle: {
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
    fontWeight: 700,
    lineHeight: 1.5,
    background: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textAlign: "center",
    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginTop: "-10px",
  },

  tableWrapper: {
    width: "100%",
    boxSizing: "border-box",
    overflowX: "auto",
    borderRadius: "clamp(8px, 1.5vw, 12px)",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    margin: 0,
  },

  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(102, 126, 234, 0.6)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
};

// ✅ Donut label renderer
const renderPipelineDonutLabels = (props) => {
  const { cx, cy, midAngle, outerRadius, percent, index, payload } = props;
  const RAD = Math.PI / 180;

  const rArc = outerRadius * 0.95;
  const rElbow = outerRadius + 10;
  const rLabel = outerRadius + 20;

  const sx = cx + rArc * Math.cos(-midAngle * RAD);
  const sy = cy + rArc * Math.sin(-midAngle * RAD);
  const mx = cx + rElbow * Math.cos(-midAngle * RAD);
  const my = cy + rElbow * Math.sin(-midAngle * RAD);
  const lx = cx + rLabel * Math.cos(-midAngle * RAD);
  const ly = cy + rLabel * Math.sin(-midAngle * RAD);

  const isLeft = Math.cos(-midAngle * RAD) < 0;
  const textAnchor = isLeft ? "end" : "start";

  const sliceColor = chartColors[index] || "#075988";

  return (
    <g>
      <polyline points={`${sx},${sy} ${mx},${my} ${lx},${ly}`} fill="none" stroke={sliceColor} strokeWidth={1.6} />
      <circle cx={mx} cy={my} r={4} fill={sliceColor} stroke="#fff" strokeWidth={1} />
      <text x={lx + (isLeft ? -6 : 6)} y={ly + 4} textAnchor={textAnchor} fontSize={14} fontWeight={900} fill={sliceColor}>
        {Number(payload?.value || 0).toLocaleString()}
      </text>
    </g>
  );
};

// ✅ UPDATED Pipeline layer row (prevents value from being cut)
const PipelineLayerRow = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "12px 18px 12px 12px", // ✅ extra right padding
      borderRadius: 12,
      background: pipelineTheme.cardBg,
      boxShadow: pipelineTheme.shadow,
      border: pipelineTheme.border,
      position: "relative",
      overflow: "visible", // ✅ do NOT clip
      width: "100%",
      boxSizing: "border-box",
    }}
  >
    {/* glossy overlay (kept inside with a child that has overflow hidden) */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>

    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        background: pipelineTheme.iconBg,
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.6), 0 4px 12px rgba(6,182,212,0.15)",
        border: pipelineTheme.iconBorder,
        flexShrink: 0,
        zIndex: 1,
      }}
    >
      {icon}
    </div>

    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: pipelineTheme.title,
          flex: 1,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={label}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: pipelineTheme.value,
          textAlign: "right",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {Number(value || 0).toLocaleString()}
      </div>
    </div>
  </div>
);

// StageDetailCard
const StageDetailCard = ({ title, stats, bgColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: bgColor || "linear-gradient(135deg, #0a77b6 0%, #06b6d4 100%)",
        padding: "20px 16px",
        borderRadius: "16px",
        boxShadow: isHovered
          ? "0 16px 32px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset"
          : "0 8px 24px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
        position: "relative",
        overflow: "hidden",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        textAlign: "center",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, rgba(255,255,255,0.12) 0%, transparent 60%)",
          opacity: isHovered ? 1 : 0.5,
          transition: "opacity 0.3s ease",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "16px",
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "12px 8px",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <div style={{ fontSize: "17px", color: "rgba(255,255,255,0.8)", marginBottom: "4px", fontWeight: 700 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "20px", color: "white", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const initialPipelineData = {
  overallStatus: "Loading...",
  lastUpdated: "",
  rawRecordCount: 0,
  silverRecordCount: 0,
  goldenRecordCount: 0,
  rawStage: { base: 0, pr: 0, log: 0 },
  silverStage: { base: 0, pr: 0, log: 0 },
  goldStage: { base: 0, pr: 0, log: 0 },
  rawStageDetails: {
    columnsCleared: 41,
    duplicatesRemoved: 256,
    unnecessaryColumnsDropped: 3,
  },
  silverStageDetails: {
    dataTypesChanged: 12,
    columnsCleaned: 256,
    duplicatesFound: 0,
  },
  goldStageDetails: {
    baseDataAppended: "1M",
    customerIdGenerated: "0.8M/0.2M",
    renColumnAdded: "0.9M",
  },
};

const DataPipelineMonitoring = () => {
  const API_URL = import.meta.env.VITE_HEALTH_MONITOR;

  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState(initialPipelineData);

  const [activeView, setActiveView] = useState("raw");
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [silverRemovedPolicies, setSilverRemovedPolicies] = useState(0);
  const [silverRemovedDuplicates, setSilverRemovedDuplicates] = useState(0);

  // ✅ Pure CSS breakpoints (also prevents clipping)
  const isMobile = useMemo(() => window.matchMedia && window.matchMedia("(max-width: 1200px)").matches, []);
  const [isSmall, setIsSmall] = useState(isMobile);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1200px)");
    const handler = () => setIsSmall(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    fetchSilverRemovedStats();
    fetchStageSummary();
    fetchPipelineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchTableData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  useEffect(() => {
    fetchTableData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchStageSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/PipelineStageSummaryView`);
      if (res.data.status === "success") {
        setPipelineData((prev) => ({
          ...prev,
          rawStageDetails: res.data.rawStageDetails,
          silverStageDetails: res.data.silverStageDetails,
          goldStageDetails: res.data.goldStageDetails,
        }));
      }
    } catch (err) {
      console.error("Stage summary fetch failed", err);
    }
  };

  const fetchSilverRemovedStats = async () => {
    try {
      const rp = await axios.get(`${API_URL}/SilverRemovedView`, { params: { page: 1 } });
      if (rp.data.status === "success") setSilverRemovedPolicies(rp.data.total_rows || 0);

      const dup = await axios.get(`${API_URL}/RemovedDuplicatePoliciesCountView`);
      if (dup.data.status === "success") setSilverRemovedDuplicates(dup.data.duplicate_policy_count || 0);
    } catch (err) {
      console.error("Silver removed stats fetch failed", err);
      setSilverRemovedPolicies(0);
      setSilverRemovedDuplicates(0);
    }
  };

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/pipeline-status`);
      if (response.data.status === "success") {
        const data = response.data.data;
        setPipelineData((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (page = 1) => {
    try {
      setTableLoading(true);

      let endpoint = "";
      if (activeView === "raw") endpoint = "/logs/base";
      else if (activeView === "silver") endpoint = "/logs/pr";
      else if (activeView === "gold") endpoint = "/logs/claim";

      const res = await axios.get(`${API_URL}${endpoint}`, { params: { page } });

      if (res.data.status === "success") {
        setTableData(res.data.rows || []);
        setTotalRows(res.data.total_rows || 0);
      }
    } catch (err) {
      console.error("Table fetch failed", err);
      setTableData([]);
      setTotalRows(0);
    } finally {
      setTableLoading(false);
    }
  };

  const dataVolumeData = [
    {
      name: "Raw Data",
      value: (pipelineData?.rawStage?.base || 0) + (pipelineData?.rawStage?.pr || 0) + (pipelineData?.rawStage?.log || 0),
    },
    {
      name: "Silver Layer",
      value:
        (pipelineData?.silverStage?.base || 0) + (pipelineData?.silverStage?.pr || 0) + (pipelineData?.silverStage?.log || 0),
    },
    {
      name: "Golden Layer",
      value: (pipelineData?.goldStage?.base || 0) + (pipelineData?.goldStage?.pr || 0) + (pipelineData?.goldStage?.log || 0),
    },
  ];

  const rawTotal = (pipelineData?.rawStage?.base || 0) + (pipelineData?.rawStage?.pr || 0) + (pipelineData?.rawStage?.log || 0);
  const silverTotal =
    (pipelineData?.silverStage?.base || 0) + (pipelineData?.silverStage?.pr || 0) + (pipelineData?.silverStage?.log || 0);
  const goldTotal = (pipelineData?.goldStage?.base || 0) + (pipelineData?.goldStage?.pr || 0) + (pipelineData?.goldStage?.log || 0);

  const cleansingImpactData = [
    { stage: "Silver", actualSize: rawTotal, afterCleansing: silverTotal },
    { stage: "Gold", actualSize: rawTotal, afterCleansing: goldTotal },
  ];

  const logColumns =
    activeView === "gold"
      ? [
          { title: "Claim No", dataIndex: "claim_no", key: "claim_no" },
          { title: "Policy No", dataIndex: "policy_no", key: "policy_no" },
          { title: "Nature of Loss", dataIndex: "nature_of_loss", key: "nature_of_loss" },
          { title: "Status", dataIndex: "status_of_claim", key: "status_of_claim" },
          { title: "Vehicle Reg", dataIndex: "vehicle_registration_no", key: "vehicle_registration_no" },
          { title: "No. of Claims", dataIndex: "number_of_claims", key: "number_of_claims" },
          { title: "Removal Reason", dataIndex: "removal_reason", key: "removal_reason" },
        ]
      : [
          { title: "Policy No", dataIndex: "policy_no", key: "policy_no" },
          { title: "Business Type", dataIndex: "business_type", key: "business_type" },
          { title: "Vehicle Reg No", dataIndex: "veh_reg_no", key: "veh_reg_no" },
          { title: "Total Premium", dataIndex: "total_premium_payable", key: "total_premium_payable" },
          { title: "Removal Reason", dataIndex: "removal_reason", key: "removal_reason" },
        ];

  const getTableTitle = () => {
    if (activeView === "raw") return "Base Removed Log Table";
    if (activeView === "silver") return "PR Removed Log Table";
    if (activeView === "gold") return "Claim Removed Log Table";
    return "Log Table";
  };

  const rawDetails = pipelineData.rawStageDetails || {};
  const silverRaw = pipelineData.silverStageDetails || {};
  const silverDetails = {
    dataTypesChanged: silverRemovedPolicies,
    columnsCleaned: silverRemovedDuplicates,
    duplicatesFound: silverRaw.duplicatesFound || 0,
  };
  const goldDetails = pipelineData.goldStageDetails || {};

  const stageDetails = [
    {
      title: "Raw Data Stage",
      stats: [
        { label: "Initial Available Columns", value: rawDetails.columnsCleared || 0 },
        { label: "Total Policies", value: rawDetails.duplicatesRemoved || 0 },
        { label: "Total Rows Count", value: rawDetails.unnecessaryColumnsDropped || 0 },
      ],
    },
    {
      title: "Silver Data Stage",
      stats: [
        { label: "Removed polices", value: silverDetails.dataTypesChanged || 0 },
        { label: "Removed duplicates", value: silverDetails.columnsCleaned || 0 },
        { label: "Droped columns", value: silverDetails.duplicatesFound || 0 },
      ],
    },
    {
      title: "Gold Data Stage",
      stats: [
        { label: "Total Policies", value: goldDetails.baseDataAppended || 0 },
        { label: "Number of Columns", value: goldDetails.customerIdGenerated || 0 },
        { label: "Total Rows Count", value: goldDetails.renColumnAdded || 0 },
      ],
    },
  ];

  return (
    <FluentProvider theme={webLightTheme}>
      <div style={styles.container}>
        {/* ✅ Global box-sizing + remove right clipping */}
        <style>{`
          html, body, #root { width: 100%; max-width: 100%; overflow-x: hidden; }
          * { box-sizing: border-box; }

          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-30px) translateX(20px); }
          }

          .glass-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45),
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
          }

          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}</style>

        {/* Animated background shapes */}
        <div style={styles.backgroundShapes}>
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "5%",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
              borderRadius: "50%",
              animation: "float 20s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "5%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
              borderRadius: "50%",
              animation: "float 25s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={{ marginBottom: "20px", padding: "0 10px" }}>
            <div style={styles.headerRow}>
              <div>
                <button style={styles.backButtonStyle} onClick={() => window.history.back()}>
                  ← Back
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" }}>
                <h1 style={styles.title}>Data Pipeline Dashboard</h1>
              </div>

              <div />
            </div>
          </div>

          {/* Top Row */}
          <div style={{ ...styles.topRowContainer, ...(isSmall ? styles.topRowContainerMobile : {}) }}>
            {/* Left */}
            <div style={{ minWidth: 0 }}>
              <div style={{ ...styles.narrowStageContainers, ...(isSmall ? styles.narrowStageContainersMobile : {}) }}>
                {stageDetails.map((stage, index) => (
                  <div key={index} style={styles.narrowStageCard}>
                    <StageDetailCard title={stage.title} stats={stage.stats} />
                  </div>
                ))}
              </div>

              <div style={styles.mainContainer}>
                {/* Data Cleansing Impact */}
                <div style={styles.chartCard2} className="glass-hover">
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px", marginBottom: "46px" }}>
                    <h3 style={styles.barsectionTitle}>Data Cleansing Impact</h3>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cleansingImpactData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#075988" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#075988" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "#0f172a", fontSize: 14, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />

                      <Tooltip
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(148,163,184,0.4)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="actualSize" name="Actual Data Size" fill="url(#colorTotal)" radius={[8, 8, 0, 0]} barSize={40} />
                      <Bar dataKey="afterCleansing" name="After Cleansing" fill="url(#colorErrors)" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Log Table */}
                <div style={styles.chartCard2}>
                  <div style={styles.glassCard}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "10px" }}>
                      <h2 style={styles.sectionTitle}>{getTableTitle()}</h2>
                    </div>

                    <div style={{ marginTop: "5px" }}>
                      <Tabs
                        activeKey={activeView}
                        onChange={(key) => {
                          setActiveView(key);
                          setCurrentPage(1);
                        }}
                      >
                        <Tabs.TabPane tab="Base Data" key="raw" />
                        <Tabs.TabPane tab="PR Data" key="silver" />
                        <Tabs.TabPane tab="Claim Data" key="gold" />
                      </Tabs>
                    </div>

                    <div style={styles.tableWrapper}>
                      <Table
                        loading={tableLoading}
                        columns={logColumns}
                        dataSource={tableData}
                        rowKey={(r, i) => i}
                        pagination={{
                          pageSize: 30,
                          total: totalRows,
                          current: currentPage,
                          showSizeChanger: false,
                          onChange: (page) => setCurrentPage(page),
                          showTotal: (total) => `Total ${total} records`,
                        }}
                        bordered
                        scroll={{ x: "max-content" }}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={styles.mergedRightContainer}>
              <div style={styles.chartCard} className="glass-hover">
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <h3 style={{ ...styles.barsectionTitle, fontSize: "1.6rem" }}>Data Volume By Stage</h3>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <defs>
                      <linearGradient id="gradRaw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#075988" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#075988" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradSilver" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a77b6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#0a77b6" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>

                    {/* ✅ cx shifted left + slightly smaller radius → prevents right label clipping */}
                    <Pie
                      data={dataVolumeData}
                      dataKey="value"
                      nameKey="name"
                      startAngle={90}
                      endAngle={-270}
                      cx="46%"
                      cy="42%"
                      innerRadius="55%"
                      outerRadius="76%"
                      labelLine={false}
                      label={renderPipelineDonutLabels}
                    >
                      {dataVolumeData.map((_, index) => {
                        const gradientIds = ["gradRaw", "gradSilver", "gradGold"];
                        return <Cell key={`cell-${index}`} fill={`url(#${gradientIds[index]})`} />;
                      })}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  {dataVolumeData.map((entry, index) => (
                    <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1f2937", fontSize: "0.8rem" }}>
                      <div style={{ width: "10px", height: "10px", backgroundColor: chartColors[index], borderRadius: "3px" }} />
                      <span style={{ fontWeight: 600 }}>{entry.name}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "38px" }}>
                  <div style={{ display: "flex", marginTop: "10px", justifyContent: "center", alignItems: "center" }}>
                    <h3 style={{ ...styles.sectionTitle, fontSize: "1.6rem" }}>Data Pipeline Layers</h3>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {/* RAW */}
                    <div>
                      <h4 style={{ textAlign: "center", fontSize: 21, fontWeight: 800, marginTop: -15, color: pipelineTheme.title }}>
                        Raw Layer
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <PipelineLayerRow icon={<Database size={22} color="#075988" />} label="Base" value={pipelineData?.rawStage?.base} />
                        <PipelineLayerRow icon={<FileText size={22} color="#075988" />} label="PR" value={pipelineData?.rawStage?.pr} />
                        <PipelineLayerRow icon={<Archive size={22} color="#075988" />} label="Claim" value={pipelineData?.rawStage?.log} />
                      </div>
                    </div>

                    {/* SILVER */}
                    <div>
                      <h4 style={{ textAlign: "center", fontSize: 21, fontWeight: 800, color: pipelineTheme.title, marginTop: "15px", marginBottom: "13px" }}>
                        Silver Layer
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <PipelineLayerRow icon={<Database size={22} color="#075988" />} label="Base" value={pipelineData?.silverStage?.base} />
                        <PipelineLayerRow icon={<FileText size={22} color="#075988" />} label="PR" value={pipelineData?.silverStage?.pr} />
                        <PipelineLayerRow icon={<Archive size={22} color="#075988" />} label="Claim" value={pipelineData?.silverStage?.log} />
                      </div>
                    </div>

                    {/* GOLD */}
                    <div>
                      <h4 style={{ textAlign: "center", fontSize: 21, fontWeight: 800, color: pipelineTheme.title, marginTop: "15px", marginBottom: "13px" }}>
                        Gold Layer
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <PipelineLayerRow
                          icon={<Database size={22} color="#075988" />}
                          label="Base + PR + Claim"
                          value={pipelineData?.goldStage?.base}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingOverlay}>
            <Spin size="large" />
          </div>
        )}
      </div>
    </FluentProvider>
  );
};

export default DataPipelineMonitoring;
