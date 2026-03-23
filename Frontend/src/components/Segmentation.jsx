import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Table, Row, Tag, Tooltip, Button, Select, Card, Typography, Modal, Checkbox } from "antd";
import { DownloadOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import CustomButton from "./CustomButton";
import { track } from "../analytics";
import { Spin } from "antd";
import { useSegmentationConfig } from "../context/SegmentationConfigContext";

const ROWS_PER_PAGE = 30;
const { Title } = Typography;
const { Option } = Select;

/* =========================================================
   Currency helpers (reads applied currency from localStorage)
   ========================================================= */
const LS_CURRENCY_CODE_KEY = "app_currency_code";
const LS_INR_PER_1_KEY = "app_currency_rates_inrPer1";

const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF ",
  CNY: "CN¥",
  SGD: "S$",
  AED: "د.إ",
};

const safeJsonParse = (value, fallback) => {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readCurrencyFromStorage = () => {
  const code = localStorage.getItem(LS_CURRENCY_CODE_KEY) || "INR";
  const inrPer1 = safeJsonParse(localStorage.getItem(LS_INR_PER_1_KEY), {});
  return { code, inrPer1 };
};

// Convert INR -> selected currency using inrPer1 map (INR per 1 unit of currency)
const convertINR = (inrValue, currencyCode, inrPer1) => {
  const v = Number(inrValue || 0);
  if (!Number.isFinite(v)) return 0;
  if (!currencyCode || currencyCode === "INR") return v;

  const rate = Number(inrPer1?.[currencyCode]);
  if (!Number.isFinite(rate) || rate <= 0) return v; // fallback if missing rate
  return v / rate;
};

const formatMoney = (inrValue, currencyCode, inrPer1) => {
  const symbol = CURRENCY_SYMBOL[currencyCode] || "";
  const x = convertINR(inrValue, currencyCode, inrPer1);
  return `${symbol}${x.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

/* ========================================================= */

const mandatoryKeys = [
  "policy_no",
  "product_name",
  "biztype",
  "cleaned_state2",
  "cleaned_branch_name_2",
  "total_premium_payable",
  "churn_probability",
  "main_reason",
  "policy_end_date",
];

const monthNames = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

// Internal styles
const styles = {
  wrapper: {
    padding: "10px",
    width: "100%",
    maxWidth: "100vw",
    minWidth: 0,
    marginLeft: "calc(-50vw + 55%)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflowX: "hidden",
    position: "relative",
  },

  container: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    padding: "30px",
  },

  sidebarExpanded: {
    width: "100%",
  },

  sidebarCollapsed: {
    width: "100%",
  },

  rightPanel: {
    flex: 1,
    padding: 0,
    overflowY: "visible",
    height: "auto",
    width: "100%",
  },

  fadingGradientTitle: {
    textAlign: "center",
    background: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: "0.5px rgba(0,0,0,0.1)",
    backgroundClip: "text",
    marginBottom: "50px",
    fontSize: "40px",
    fontWeight: "700",
    letterSpacing: "-1px",
    lineHeight: "1.5",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
  },

  cardRow: {
    display: "flex",
    gap: 20,
    marginBottom: 32,
    justifyContent: "center",
    flexWrap: "wrap",
    padding: "0 20px",
  },

  cardBase: {
    borderRadius: 20,
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    flex: 1,
    height: 150,
    width: 250,
    cursor: "pointer",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#fff",
    background: "linear-gradient(135deg, #1e3a8a 50%, #0f172a 97%)",
    position: "relative",
    overflow: "hidden",
  },

  cardActive: {
    transform: "translateY(-5px) scale(1.02)",
    boxShadow:
      "0 0 12px rgba(56, 189, 248, 0.6), 0 0 20px rgba(56, 189, 248, 0.4), 0 0 30px rgba(56, 189, 248, 0.3)",
  },

  cardTitle: {
    color: "#aefeff",
    marginBottom: 8,
    fontWeight: 600,
    fontSize: "1.1rem",
  },

  cardValue: {
    color: "#dbeafe",
    fontSize: "0.95rem",
  },

  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
    padding: "0 20px",
    flexWrap: "wrap",
  },

  filterControls: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    flexWrap: "wrap",
  },

  buttonContainer: {
    marginTop: 5,
    marginLeft: "auto",
  },

  tableContainer: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "auto",
    position: "relative",
  },

  tableCardWrapper: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
  },

  antTableWrapper: {
    width: "100%",
    maxWidth: "100%",
    overflow: "auto",
  },

  compactHeader: {
    "& .ant-table-thead > tr > th": {
      padding: "8px 12px",
      fontSize: "13px",
      fontWeight: "600",
      backgroundColor: "#fafafa",
      borderBottom: "2px solid #e8e8e8",
      textAlign: "center",
    },
  },

  compactCell: {
    "& .ant-table-tbody > tr > td": {
      padding: "6px 12px",
      fontSize: "12px",
      lineHeight: "1.4",
      textAlign: "center",
    },
  },

  blinking: {
    animation: "blink 1.5s infinite",
    fontSize: "16px",
    fontWeight: "bold",
  },

  columnTitleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    textAlign: "center",
  },

  trashIcon: {
    color: "#ff4d4f",
    cursor: "pointer",
    fontSize: "14px",
    marginLeft: "8px",
    transition: "all 0.3s ease",
    "&:hover": {
      color: "#ff7875",
      transform: "scale(1.2)",
    },
  },

  modalCheckboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  customizeButtonRow: {
    marginBottom: 16,
    padding: "0 20px",
  },

  footerSpacer: {
    height: "100px",
    backgroundColor: "#FFFF",
  },
};

// Add keyframes for blinking animation and table scroll fix using a style tag
const BlinkingAnimation = () => (
  <style>
    {`
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
      
      .ant-table-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        overflow: auto !important;
      }
      
      .ant-table {
        min-width: max-content !important;
      }
      
      .ant-table-container {
        overflow: auto !important;
      }
      
      .ant-table-body {
        overflow: auto !important;
      }
      
      .card-shimmer::before {
        content: "";
        position: absolute;
        top: 0;
        left: -75%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          120deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        animation: shimmer 3s infinite;
        pointer-events: none;
        z-index: 1;
      }
      
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        50% {
          opacity: 0.4;
        }
        100% {
          transform: translateX(200%);
          opacity: 0;
        }
      }
      
      .even-row {
        background-color: #fafafa;
      }
      .odd-row {
        background-color: #ffffff;
      }
      .even-row:hover, .odd-row:hover {
        background-color: #e6f7ff !important;
      }
      .ant-table-thead > tr > th {
        background: linear-gradient(45deg, #667eea, #3498db);
        color: white;
        font-weight: 600;
        text-align: center;
      }
      .ant-table-tbody > tr > td {
        text-align: center;
      }
      .ant-pagination-item-active {
        background: linear-gradient(45deg, #667eea, #3498db);
        border-color: #667eea;
      }
      .ant-pagination-item-active a {
        color: white;
      }
    `}
  </style>
);

const columnDisplayNames = {
  policy_no: "Policy No",
  corrected_name: "Customer Name",
  product_name: "Product",
  primary_recommendation: "Recommendation",
  number_of_claims: "Claim Count",
  make_clean: "Manufacturer",
  additional_offers: "Additional Offer",
  policy_end_date: "Policy End Date",
  cleaned_zone_2: "Zone",
  biztype: "Business Type",
  age: "Vehicle Age",
  new_customers: "New Customer",
  predicted_status: "Predicted Status",
  customer_tenure: "Customer Tenure",
  rto_location: "RTO Location",
  cleaned_reg_no: "Registration No",
  total_premium_payable: "Premium", // updated dynamically below too
  cleaned_branch_name_2: "Branch",
  cleaned_state2: "State",
  tie_up: "Tie Ups",
  model_clean: "Model",
  vehicle_idv: "Vehicle Idv",
  ncb_amount: "Ncb Amount",
  policy_tenure: "Policy Tenure",
  clv: "Clv",
  customer_segment: "Customer Segment",
  top_3_reasons: "Top 3 Reasons",
};

const restrictedKeys = [
  "renewal_type",
  "product_name_2",
  "not_renewed_reasons",
  "modal",
  "variant",
  "vehicle_segment",
  "fuel_type",
  "before_gst_add-on_gwp",
  "total_od_premium",
  "total_tp_premium",
  "gst",
  "ncb_%_previous_year",
  "applicable_discount_with_ncb",
  "approved",
  "denied",
  "customerid",
  "policy_status",
  "claim_happaned/not",
  "renewal_rate_status",
  "withdrawn",
  "chassis_engine_key",
  "policy_wise_purchase",
  "policy_start_date_day",
  "policy_start_date_month",
  "policy_start_date_year",
  "policy_end_date_day",
  "policy_end_date_month",
  "policy_end_date_year",
  "reason_buckets",
  "clv_category",
  "discount_category",
  "churn_category",
  "recommendation",
  "Additional Offer",
  "retention_channel",
];

const Segmentation = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const PAGE_ID = "page:segmentation";
  const { isCollapsed } = useOutletContext();

  // ===== Applied currency state (from localStorage) =====
  const [{ code: currencyCode, inrPer1 }, setCurrencyState] = useState(() =>
    readCurrencyFromStorage()
  );

  // keep page in sync when user changes currency in Configurations
  useEffect(() => {
    const sync = () => setCurrencyState(readCurrencyFromStorage());

    const onStorage = (e) => {
      if (e.key === LS_CURRENCY_CODE_KEY || e.key === LS_INR_PER_1_KEY || e.key === null) {
        sync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("app_currency_changed", sync);
    sync();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("app_currency_changed", sync);
    };
  }, []);

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]); // optional keys selected by user
  const [activeSegment, setActiveSegment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [fullSegmentData, setFullSegmentData] = useState([]);
  const [segmentCounts, setSegmentCounts] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [tempCustomKeys, setTempCustomKeys] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tableKey, setTableKey] = useState(0);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const { segments: segConfig, segmentDisplayMap, renaming } = useSegmentationConfig();

  const renderBullets = (text) => {
    if (!text) return "-";
    const items = String(text)
      .split("•")
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <ul style={{ margin: 0, paddingLeft: "1.2em", textAlign: "left" }}>
        {items.map((it, i) => (
          <li key={i} style={{ whiteSpace: "normal" }}>
            {it}
          </li>
        ))}
      </ul>
    );
  };

  // Refs for components
  const tableRef = useRef(null);

  const getVisibleKeys = () => {
    return [...mandatoryKeys, ...columns.filter((k) => !mandatoryKeys.includes(k))];
  };

  const segmentCards = useMemo(
    () => segConfig.map((s) => ({ code: s.code, label: s.name || s.code })),
    [segConfig]
  );

  const handleDownload = async (fileType = "csv") => {
    const visibleKeys = getVisibleKeys();
    const params = new URLSearchParams({
      type: fileType,
      segment: activeSegment || "",
      month: selectedMonth || "",
      year: selectedYear || "",
      columns: visibleKeys.join(","),
      display_names: "true",
      // IMPORTANT: backend should interpret premium based on currency if you want server-side conversion
      // otherwise CSV will contain formatted values from backend or raw INR depending on your API.
      // currency: currencyCode,
    });
    const url = `${API_URL}/download-full-data?${params.toString()}`;

    track("file_download", {
      page: PAGE_ID,
      file: `segmentation.${fileType}`,
      phase: "start",
      segment: activeSegment || "",
      year: selectedYear || "",
      month: selectedMonth || "",
      currency: currencyCode,
    });

    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = `segmentation.${fileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      track("file_download", {
        page: PAGE_ID,
        file: `segmentation.${fileType}`,
        phase: "success",
        status: 200,
      });
    } catch (err) {
      track("file_download", {
        page: PAGE_ID,
        file: `segmentation.${fileType}`,
        phase: "fail",
        error: String(err),
      });
    }
  };

  const allColumnsMap = useMemo(() => {
    const premiumTitle = `Premium (${CURRENCY_SYMBOL[currencyCode] || ""} ${currencyCode})`;

    return {
      policy_no: { title: "Policy No", dataIndex: "policy_no", fixed: "left", width: 189 },
      product_name: { title: "Product", dataIndex: "product_name", width: 116 },
      biztype: { title: "Biz Type", dataIndex: "biztype", width: 90, align: "center" },
      customer_segment: {
        title: "Customer Segment",
        dataIndex: "customer_segment",
        width: 130,
        render: (v) => segmentDisplayMap?.[v] || v || "-",
      },
      cleaned_state2: { title: "State", dataIndex: "cleaned_state2", width: 140 },
      cleaned_branch_name_2: { title: "Branch", dataIndex: "cleaned_branch_name_2", width: 140 },
      total_premium_payable: {
        title: premiumTitle,
        dataIndex: "total_premium_payable",
        width: 120,
        render: (value) => formatMoney(value, currencyCode, inrPer1),
      },
      churn_probability: {
        title: "Churn Probability",
        dataIndex: "churn_probability",
        width: 50,
        render: (value) => `${Math.round(value * 100)}%`,
        align: "center",
        sorter: (a, b) => a.churn_probability - b.churn_probability,
        sortDirections: ["descend", "ascend"],
      },
      main_reason: {
        title: "Churn Reason",
        dataIndex: "main_reason",
        width: 140,
        render: (value) => (
          <Tooltip title={value}>
            <Tag
              color="geekblue"
              style={{ maxWidth: 169, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {value}
            </Tag>
          </Tooltip>
        ),
      },
      top_3_reasons: {
        title: "Top 3 Reasons",
        dataIndex: "top_3_reasons",
        key: "Top 3 Reasons",
        width: 180,
        ellipsis: { showTitle: false },
        render: (text) => (
          <Tooltip title={text}>
            <Tag
              color="blue"
              style={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: "160px",
                display: "inline-block",
                textAlign: "center",
              }}
            >
              {text}
            </Tag>
          </Tooltip>
        ),
      },
      primary_recommendation: {
        title: "Recommendation",
        dataIndex: "primary_recommendation",
        key: "Recommendation",
        allign: "left",
        width: 240,
        ellipsis: { showTitle: false },
        render: (text) => (
          <Tooltip title={text}>
            <Tag
              color="blue"
              style={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: "160px",
                display: "inline-block",
                textAlign: "center",
              }}
            >
              {renderBullets(text)}
            </Tag>
          </Tooltip>
        ),
      },
      additional_offers: {
        title: "Additional Offer",
        dataIndex: "additional_offers",
        key: "Additional Offer",
        width: 240,
        ellipsis: true,
        render: (text) => (
          <Tooltip title={text}>
            <Tag
              color="blue"
              style={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: "160px",
                display: "inline-block",
                textAlign: "center",
              }}
            >
              {renderBullets(text)}
            </Tag>
          </Tooltip>
        ),
      },
      policy_end_date: {
        title: "Policy End Date",
        dataIndex: "policy_end_date",
        width: 90,
        render: (_, r) => {
          if (r.policy_end_date) return String(r.policy_end_date);
          const d = r.policy_end_date_day;
          const m = r.policy_end_date_month;
          const y = r.policy_end_date_year;
          return d && m && y ? `${d}/${m}/${y}` : "-";
        },
      },
    };
  }, [currencyCode, inrPer1, segmentDisplayMap]);

  // Debounced resize handler
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const resetComponentStates = useCallback(() => {
    setTableKey((prev) => prev + 1);

    if (tableRef.current) {
      const tableBody = tableRef.current.querySelector(".ant-table-body");
      if (tableBody) {
        tableBody.scrollTo(0, 0);
      }
    }
  }, []);

  useEffect(() => {
    track("page_view", { page: PAGE_ID });
  }, []);

  useEffect(() => {
    const debouncedResize = debounce(() => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      setTimeout(() => {
        resetComponentStates();
      }, 100);

      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 200);
    }, 150);

    const handleResize = () => debouncedResize();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      setTimeout(handleResize, 500);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [debounce, resetComponentStates]);

  const normalize = (str) => str?.toLowerCase().replace(/\s+/g, "").trim();

  useEffect(() => {
    setLoading(true);
    const t0 = performance.now();

    axios
      .get(`${API_URL}/fulldata`, {
        params: {
          page: currentPage,
          page_size: ROWS_PER_PAGE,
          segment: activeSegment,
          month: selectedMonth,
          year: selectedYear,
        },
      })
      .then((response) => {
        if (Array.isArray(response.data.data)) {
          setData(response.data.data.map((item, index) => ({ ...item, key: index })));
          setTotalCount(response.data.total);
          setSegmentCounts(response.data.segment_counts);
          setFullSegmentData(response.data.data);
        } else {
          setError("Unexpected response format.");
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      })
      .finally(() => {
        setLoading(false);
        const ms = Math.round(performance.now() - t0);
        track("api_timing", {
          page: PAGE_ID,
          url: "/fulldata",
          ms,
          segment: activeSegment || "",
          year: selectedYear || "",
          month: selectedMonth || "",
        });
      });
  }, [currentPage, activeSegment, selectedMonth, selectedYear]);

  const openColumnSelector = () => {
    setTempCustomKeys(columns);
    setShowColumnSelector(true);
    track("column_selector_open", { page: PAGE_ID, currentCount: columns.length });
  };

  const filteredData = data.filter((row) => {
    if (activeSegment && normalize(row["customer_segment"]) !== normalize(activeSegment)) return false;
    if (selectedMonth && String(row["policy_end_date_month"]) !== selectedMonth) return false;
    if (selectedYear && String(row["policy_end_date_year"]) !== selectedYear) return false;
    return true;
  });

  const optionalKeys =
    fullSegmentData.length > 0
      ? Object.keys(fullSegmentData[0]).filter(
          (k) => !mandatoryKeys.includes(k) && !restrictedKeys.includes(k)
        )
      : [];

  const getColumns = () => {
    const visibleKeys = [...mandatoryKeys, ...columns.filter((k) => !mandatoryKeys.includes(k))];

    return visibleKeys.map((key) => {
      const isOptional = !mandatoryKeys.includes(key);
      const base = allColumnsMap[key] || { title: key, dataIndex: key };

      const displayTitle =
        key === "total_premium_payable"
          ? `Premium (${CURRENCY_SYMBOL[currencyCode] || ""} ${currencyCode})`
          : columnDisplayNames[key] || base.title || key;

      return {
        ...base,
        key,
        align: "center",
        width: base?.width || 110,
        title: isOptional ? (
          <div style={styles.columnTitleContainer}>
            <span>{displayTitle}</span>
            <Tooltip title="Remove column">
              <DeleteOutlined
                style={styles.trashIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  setColumns((prev) => {
                    const next = prev.filter((col) => col !== key);
                    track("column_remove", { page: PAGE_ID, columnKey: key });
                    return next;
                  });
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>{displayTitle}</div>
        ),
        onCell: () => ({
          style: { whiteSpace: "normal", wordBreak: "break-word" },
        }),
      };
    });
  };

  const monthOptions = useMemo(() => Object.keys(monthNames).map((n) => String(n)), []);
  const uniqueYears = [...new Set(data.map((d) => d["policy_end_date_year"]).filter(Boolean))].sort();

  return (
    <>
      <BlinkingAnimation />
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.rightPanel}>
            <h2 style={styles.fadingGradientTitle}>Customer Segmentation</h2>

            <div style={styles.cardRow}>
              {segmentCards.map(({ code, label }) => (
                <Card
                  key={code}
                  className="card-shimmer"
                  style={{
                    ...styles.cardBase,
                    ...(activeSegment === code ? styles.cardActive : {}),
                  }}
                  onClick={() => {
                    const newSeg = activeSegment === code ? "" : code;
                    setActiveSegment(newSeg);
                    setCurrentPage(1);
                  }}
                >
                  <h4 style={styles.cardTitle}>{label}</h4>
                  <p style={styles.cardValue}>Total Policies: {segmentCounts?.[code] ?? 0}</p>
                </Card>
              ))}
            </div>

            <div style={styles.filterBar}>
              <div style={styles.buttonContainer}>
                <CustomButton data-uxid="btn:segmentation:download-csv" onClick={() => handleDownload("csv")}>
                  Download CSV
                </CustomButton>
              </div>

              <div style={styles.filterControls}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Select
                    value={selectedYear || undefined}
                    onChange={(value) => {
                      setSelectedYear(value);
                      track("filter_change", { page: PAGE_ID, filter: "year", value });
                    }}
                    allowClear
                    placeholder="Year"
                    style={{ width: 100 }}
                  >
                    {uniqueYears.map((year) => (
                      <Option key={year} value={String(year)}>
                        {year}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    value={selectedMonth || undefined}
                    onChange={(value) => {
                      setSelectedMonth(value);
                      track("filter_change", { page: PAGE_ID, filter: "month", value });
                    }}
                    allowClear
                    placeholder="Month"
                    style={{ width: 120 }}
                  >
                    {monthOptions.map((m) => (
                      <Option key={m} value={m}>
                        {monthNames[parseInt(m, 10)]}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Modal
              title="Select Columns"
              open={showColumnSelector}
              onOk={() => {
                const filtered = tempCustomKeys.filter((k) => !restrictedKeys.includes(k));
                setColumns(filtered);
                setShowColumnSelector(false);
                track("column_selector_apply", { page: PAGE_ID, selectedCount: filtered.length });
              }}
              onCancel={() => setShowColumnSelector(false)}
              okText="Apply"
              style={{ top: 100, maxWidth: "100vh", minWidth: 300 }}
              bodyStyle={{ maxHeight: "100vh", overflowY: "auto" }}
              width="90%"
            >
              <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "8px", ...styles.modalCheckboxGroup }}>
                <Checkbox
                  checked={selectAllChecked}
                  indeterminate={tempCustomKeys.length > 0 && tempCustomKeys.length < optionalKeys.length}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAllChecked(checked);
                    setTempCustomKeys(() => (checked ? [...optionalKeys] : []));
                  }}
                >
                  Select All
                </Checkbox>

                {optionalKeys.map((key) => (
                  <Checkbox
                    key={key}
                    checked={tempCustomKeys.includes(key)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const updated = checked ? [...tempCustomKeys, key] : tempCustomKeys.filter((col) => col !== key);

                      setTempCustomKeys(updated);
                      setSelectAllChecked(updated.length === optionalKeys.length);
                    }}
                  >
                    {columnDisplayNames[key] ||
                      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Checkbox>
                ))}
              </div>
            </Modal>

            <Row justify="end" style={styles.customizeButtonRow}>
              <Button
                data-uxid="btn:segmentation:customize-columns"
                type="dashed"
                icon={<SettingOutlined />}
                onClick={openColumnSelector}
              >
                Customize Columns
              </Button>
            </Row>

            <div style={{ padding: "0 20px" }}>
              <Card style={styles.tableCardWrapper}>
                <div style={styles.tableContainer} ref={tableRef}>
                  <div style={styles.antTableWrapper}>
                    <Spin spinning={renaming} tip="Applying segment rename...">
                      <Table
                        key={tableKey}
                        style={{
                          ...styles.compactHeader,
                          ...styles.compactCell,
                          minWidth: "max-content",
                        }}
                        dataSource={filteredData}
                        columns={getColumns()}
                        loading={loading}
                        pagination={{
                          pageSize: ROWS_PER_PAGE,
                          total: totalCount,
                          current: currentPage,
                          onChange: (page, pageSize) => {
                            setCurrentPage(page);
                            try {
                              track("table_page_change", {
                                page: PAGE_ID,
                                current: page,
                                pageSize,
                              });
                            } catch {}
                          },
                          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                          showQuickJumper: true,
                          responsive: true,
                        }}
                        bordered
                        scroll={{
                          x: "max-content",
                          scrollToFirstRowOnChange: true,
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
                        size="middle"
                        tableLayout="fixed"
                        rowKey={(record) => record.policy_no || record.key}
                        onRow={(record) => ({
                          onClick: () => {
                            try {
                              track("table_row_click", {
                                page: PAGE_ID,
                                rowKey: record.policy_no || record.key,
                                segment: record.customer_segment,
                              });
                            } catch {}
                          },
                        })}
                        onChange={(pagination, filters, sorter, extra) => {
                          try {
                            if (extra?.action === "sort") {
                              const s = Array.isArray(sorter) ? sorter[0] : sorter;
                              track("table_sort_change", {
                                page: PAGE_ID,
                                field: s?.field || s?.columnKey || null,
                                order: s?.order || null,
                              });
                            } else if (extra?.action === "filter") {
                              track("table_filter_change", {
                                page: PAGE_ID,
                                filters: filters || {},
                              });
                            }
                          } catch {}
                        }}
                      />
                    </Spin>
                  </div>
                </div>
              </Card>
            </div>

            <div style={styles.footerSpacer} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Segmentation;
