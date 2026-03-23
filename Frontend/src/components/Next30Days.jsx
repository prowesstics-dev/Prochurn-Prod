import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Table,
  Select,
  Button,
  Typography,
  Tag,
  Tooltip,
  Space,
  Card,
  Spin,
  Modal,
  Checkbox,
  Row,
} from "antd";
import { DownloadOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import CustomButton from "./CustomButton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, ChartTooltip, Legend, ChartDataLabels);

const { Option } = Select;
const { Title } = Typography;

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

// Internal styles
const styles = {
  fadingGradientTitle: {
    background: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "2.5rem",
    fontWeight: "bold",
    textAlign: "center",
    margin: "20px 0",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
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

  blinking: {
    animation: "blink 1.5s infinite",
    fontSize: "16px",
    fontWeight: "bold",
  },

  compactHeader: {
    "& .ant-table-thead > tr > th": {
      padding: "8px 12px",
      fontSize: "13px",
      fontWeight: "600",
      backgroundColor: "#fafafa",
      borderBottom: "2px solid #e8e8e8",
    },
  },

  compactCell: {
    "& .ant-table-tbody > tr > td": {
      padding: "6px 12px",
      fontSize: "12px",
      lineHeight: "1.4",
    },
  },

  mainContainer: {
    padding: "30px",
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

  tableContainer: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "auto",
    position: "relative",
  },

  shimmerButton: {
    position: "relative",
    overflow: "hidden",
    border: "none",
    background: "linear-gradient(to right, #60a5fa, #3b82f6)",
    color: "white",
    fontSize: "16px",
    height: "35px",
    fontWeight: "600",
    borderRadius: "8px",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  shimmerBefore: {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "200%",
    background:
      "linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%)",
    animation: "shimmer 2s infinite",
    backgroundSize: "200% 100%",
    zIndex: 1,
    pointerEvents: "none",
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

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },

  errorCard: {
    textAlign: "center",
    margin: "50px",
  },

  chartCard: {
    marginBottom: 14,
    overflow: "hidden",
  },

  chartContainer: {
    height: 300,
    width: "100%",
    position: "relative",
  },

  filtersContainer: {
    marginBottom: 16,
    flexWrap: "wrap",
    padding: "30px",
    gap: "8px",
    alignItems: "center",
  },

  customizeButtonRow: {
    marginBottom: 16,
  },

  footerSpacer: {
    height: "100px",
    backgroundColor: "#F3F3F3",
  },

  modalCheckboxGroup: {
    display: "flex",
    flexDirection: "column",
  },

  selectMinWidth: {
    minWidth: 160,
    maxWidth: "100%",
    width: "auto",
  },

  columnTitleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tagStyle: {
    maxWidth: 169,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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

      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        padding: 8px 12px !important;
      }

      @keyframes shimmer {
        0% { background-position: -200%; }
        100% { background-position: -200%; }
      }

      .shimmer-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 200%;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.4) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 2s infinite;
        background-size: 200% 100%;
        z-index: 1;
        pointer-events: none;
      }

      .shimmer-button span {
        position: relative;
        z-index: 2;
      }

      .shimmer-button:hover::before {
        background: none;
      }
      
      .ant-table-container {
        overflow: auto !important;
      }
      
      .ant-table-body {
        overflow: auto !important;
      }
    `}
  </style>
);

const Next30Days = () => {
  const API_URL = import.meta.env.VITE_API_URL;

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

  // ===== Applied currency state (from localStorage) =====
  const [{ code: currencyCode, inrPer1 }, setCurrencyState] = useState(() =>
    readCurrencyFromStorage()
  );

  // keep page in sync when user changes currency in Configurations
  useEffect(() => {
    const sync = () => setCurrencyState(readCurrencyFromStorage());

    const onStorage = (e) => {
      if (
        e.key === LS_CURRENCY_CODE_KEY ||
        e.key === LS_INR_PER_1_KEY ||
        e.key === null
      ) {
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

  const [customKeys, setCustomKeys] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [trendData, setTrendData] = useState({ labels: [], counts: [] });
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [showNext30View, setShowNext30View] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [tempCustomKeys, setTempCustomKeys] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tableKey, setTableKey] = useState(0);
  const [chartKey, setChartKey] = useState(0);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const navigate = useNavigate();
  const hasData = filteredPolicies.length > 0;

  // Refs for components
  const chartRef = useRef(null);
  const tableRef = useRef(null);

  const aprilDates = Array.from({ length: 30 }, (_, i) => {
    return `2025-04-${String(i + 1).padStart(2, "0")}`;
  });

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

  const policiesForChart = useMemo(() => {
    return policies.filter((p) => {
      const byState = !selectedState || p.cleaned_state2 === selectedState;
      const byBranch =
        !selectedBranch || p.cleaned_branch_name_2 === selectedBranch;
      return byState && byBranch;
    });
  }, [policies, selectedState, selectedBranch]);

  const trendForChart = useMemo(() => {
    const labels = aprilDates;
    const counts = labels.map((dateISO) => {
      return policiesForChart.reduce((acc, p) => {
        const d = p.policy_end_date ? String(p.policy_end_date).slice(0, 10) : "";
        return acc + (d === dateISO ? 1 : 0);
      }, 0);
    });
    return { labels, counts };
  }, [policiesForChart, aprilDates]);

  // Reset component states on resize
  const resetComponentStates = useCallback(() => {
    setChartKey((prev) => prev + 1);

    if (chartRef.current) {
      chartRef.current.resize();
    }

    if (tableRef.current) {
      const tableBody = tableRef.current.querySelector(".ant-table-body");
      if (tableBody) {
        tableBody.scrollTo(0, 0);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/churnedpolicies30days/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const nonZeroData = {
          labels: [],
          counts: [],
        };

        data.trend_data.labels.forEach((label, i) => {
          if (data.trend_data.counts[i] > 0) {
            const readable = new Date(label).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            nonZeroData.labels.push(readable);
            nonZeroData.counts.push(data.trend_data.counts[i]);
          }
        });

        setTrendData(nonZeroData);
        const policiesWithKey = data.policies.map((item, index) => ({
          ...item,
          key: index,
        }));
        setPolicies(policiesWithKey);
        setFilteredPolicies(policiesWithKey);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debouncedResize = debounce(() => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      setTimeout(() => {
        resetComponentStates();
      }, 100);
    }, 150);

    const handleResize = () => debouncedResize();
    const handleOrientation = () => setTimeout(handleResize, 500);

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientation);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, [debounce, resetComponentStates]);

  useEffect(() => {
    let result = [...policies];
    if (selectedState) result = result.filter((p) => p.cleaned_state2 === selectedState);
    if (selectedBranch) result = result.filter((p) => p.cleaned_branch_name_2 === selectedBranch);
    if (selectedEndDate) result = result.filter((p) => p.policy_end_date?.startsWith(selectedEndDate));
    setFilteredPolicies(result);
  }, [selectedState, selectedBranch, selectedEndDate, policies]);

  const openColumnSelector = () => {
    setTempCustomKeys(customKeys);
    setShowColumnSelector(true);
  };

  const allColumnsMap = {
    policy_no: { title: "Policy No", dataIndex: "policy_no", fixed: "left", width: 189 },
    product_name: { title: "Product", dataIndex: "product_name", width: 116 },
    cleaned_state2: { title: "State", dataIndex: "cleaned_state2", width: 80 },
    cleaned_branch_name_2: { title: "Branch", dataIndex: "cleaned_branch_name_2", width: 80 },
    total_premium_payable: {
      title: (
        <span>
          Premium ({CURRENCY_SYMBOL[currencyCode] || ""} {currencyCode})
        </span>
      ),
      dataIndex: "total_premium_payable",
      width: 110,
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
    top_3_reasons: {
      title: "Top 3 Reasons",
      dataIndex: "top_3_reasons",
      key: "Top 3 Reasons",
      width: 140,
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
            {text}
          </Tag>
        </Tooltip>
      ),
    },
    main_reason: {
      title: "Churn Reason",
      dataIndex: "main_reason",
      width: 140,
      render: (value) => (
        <Tooltip title={value}>
          <Tag color="geekblue" style={styles.tagStyle}>
            {value}
          </Tag>
        </Tooltip>
      ),
    },
    policy_end_date: {
      title: "Policy End Date",
      dataIndex: "policy_end_date",
      width: 80,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    age: { title: "Vehicle Age", dataIndex: "age", width: 100 },
    biztype: { title: "Business Type", dataIndex: "biztype", width: 120 },
    vehicle_idv: { title: "Vehicle IDV", dataIndex: "vehicle_idv", width: 120 },
    cleaned_zone_2: { title: "Zone", dataIndex: "cleaned_zone_2", width: 100 },
    tie_up: { title: "Tie Ups", dataIndex: "tie_up", width: 100 },
    number_of_claims: { title: "No of Claims", dataIndex: "number_of_claims", width: 100 },
    customer_tenure: { title: "Customer Tenure", dataIndex: "customer_tenure", width: 120 },
    policy_tenure: { title: "Policy Tenure", dataIndex: "policy_tenure", width: 120 },
    cleaned_reg_no: { title: "Vehicle Reg No", dataIndex: "cleaned_reg_no", width: 140 },
    corrected_name: { title: "Customer Name", dataIndex: "corrected_name", width: 150 },
    make_clean: { title: "Manufacturer", dataIndex: "make_clean", width: 130 },
  };

  const columns = [
    ...mandatoryKeys.map((key) => ({
      ...allColumnsMap[key],
      key,
      align: "center",
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          textAlign: "center",
          padding: "8px 12px",
        },
      }),
    })),
    ...customKeys.map((key) => ({
      ...allColumnsMap[key],
      key,
      align: "center",
      width: allColumnsMap[key].width || 100,
      title: (
        <div
          style={{
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{allColumnsMap[key].title}</span>
          <Tooltip title="Remove column">
            <DeleteOutlined
              style={styles.trashIcon}
              onClick={() => setCustomKeys((prev) => prev.filter((k) => k !== key))}
            />
          </Tooltip>
        </div>
      ),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          textAlign: "center",
          padding: "8px 12px",
        },
      }),
    })),
  ];

  const createGradient = (ctx, area) => {
    const gradient = ctx.createLinearGradient(area.left, area.bottom, area.right, area.top);
    gradient.addColorStop(0, "#00c9ff");
    gradient.addColorStop(0.5, "#fce38a");
    gradient.addColorStop(1, "#f38181");
    return gradient;
  };

  const getAppFontFamily = () =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--app-font-family")
      .trim() || "Inter, Segoe UI, system-ui, sans-serif";

  const appFont = useMemo(() => getAppFontFamily(), []);

  const chartData = {
    labels: trendForChart.labels,
    datasets: [
      {
        label: "Number of Policies",
        data: trendForChart.counts,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(75,192,192,0.8)";
          return createGradient(ctx, chartArea);
        },
        borderRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, font: { family: appFont } },
        onClick: () => {},
        onHover: (e) => {
          e.native.target.style.cursor = "default";
        },
      },
      title: {
        display: true,
        text: "Churned Policies Trend (Next 30 Days)",
        font: { family: appFont, size: 16, weight: "600" },
      },
      datalabels: {
        anchor: "end",
        align: "end",
        font: { weight: "bold", size: 12, family: appFont },
        color: "#333",
        formatter: (v) => (v ? v : null),
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.7)",
        titleFont: { size: 14, family: appFont },
        bodyFont: { size: 12, family: appFont },
        padding: 10,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Number of Policies", font: { family: appFont } },
        ticks: { stepSize: 1, font: { family: appFont } },
        grid: { display: false },
      },
      x: {
        title: { display: true, text: "Date", font: { family: appFont } },
        ticks: { font: { family: appFont } },
        grid: { display: false },
      },
    },
    onResize: (chart) => {
      chart.update("none");
    },
  };

  const downloadCSV = () => {
    const visibleColumns = [...mandatoryKeys, ...customKeys];

    const header = visibleColumns.map((key) => {
      const column = allColumnsMap[key];

      if (React.isValidElement(column?.title)) {
        const children = column.title.props?.children;
        if (Array.isArray(children)) {
          return children
            .map((c) => (typeof c === "string" ? c : ""))
            .join("")
            .replace(/\s+/g, " ")
            .trim() || key;
        }
        return typeof children === "string" ? children : key;
      }

      return column?.title || key;
    });

    const rows = filteredPolicies.map((policy) =>
      visibleColumns.map((key) => {
        const column = allColumnsMap[key];
        let value = policy[key];

        if (column?.render) {
          if (key === "total_premium_payable") {
            return formatMoney(value, currencyCode, inrPer1);
          } else if (key === "churn_probability") {
            return `${Math.round(value * 100)}%`;
          } else if (key === "policy_end_date") {
            return new Date(value).toLocaleDateString();
          } else if (key === "main_reason") {
            return value;
          }
        }

        return value;
      })
    );

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return "";
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const BOM = "\ufeff";

    const csvContent =
      BOM +
      [header.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join(
        "\n"
      );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "churned_policies_30days.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Spin size="large" tip="Loading data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={styles.errorCard}>
        <Typography.Text type="danger">Error: {error}</Typography.Text>
      </Card>
    );
  }

  return (
    <>
      <BlinkingAnimation />
      <div style={styles.mainContainer}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
            margin: "0 24px 1rem",
          }}
        >
          {/* Back Button */}
          <Button
            type="default"
            onClick={() => navigate("/predictivescores")}
            style={styles.shimmerButton}
          >
            <span style={{ fontSize: "16px", lineHeight: "1", color: "white" }}>←</span>
            <span style={{ color: "white" }}>Back</span>
          </Button>

          {/* Title */}
          <div style={{ flexGrow: 1, textAlign: "center" }}>
            <h2 style={styles.fadingGradientTitle}>Churned Policies in Next 30 Days</h2>
          </div>

          {/* Filler */}
          <div style={{ width: "120px" }} />
        </div>

        {/* Chart */}
        <Card style={styles.chartCard}>
          <div style={styles.chartContainer}>
            <Bar key={chartKey} ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Modal
          title="Select Additional Columns"
          open={showColumnSelector}
          onOk={() => {
            setCustomKeys(tempCustomKeys);
            setShowColumnSelector(false);
          }}
          onCancel={() => setShowColumnSelector(false)}
          okText="Apply"
        >
          <div style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
            <Checkbox
              checked={selectAllChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectAllChecked(checked);
                if (checked) {
                  const allKeys = Object.keys(allColumnsMap).filter(
                    (key) => !mandatoryKeys.includes(key)
                  );
                  setTempCustomKeys(allKeys);
                } else {
                  setTempCustomKeys([]);
                }
              }}
              style={{ marginBottom: 10 }}
            >
              Select All
            </Checkbox>

            <Checkbox.Group
              style={styles.modalCheckboxGroup}
              value={tempCustomKeys}
              onChange={setTempCustomKeys}
            >
              {Object.keys(allColumnsMap)
                .filter((key) => !mandatoryKeys.includes(key))
                .map((key) => (
                  <Checkbox key={key} value={key}>
                    {allColumnsMap[key].title}
                  </Checkbox>
                ))}
            </Checkbox.Group>
          </div>
        </Modal>

        <Space wrap style={styles.filtersContainer}>
          <Select
            placeholder="Select State"
            value={selectedState || undefined}
            onChange={(val) => {
              setSelectedState(val);
              setSelectedBranch("");
            }}
            style={styles.selectMinWidth}
            allowClear
          >
            {[...new Set(policies.map((p) => p.cleaned_state2))].map((state) => (
              <Option key={state} value={state}>
                {state}
              </Option>
            ))}
          </Select>

          {!selectedState ? (
            <Tooltip title="Please select state first">
              <Select
                placeholder="Select Branch"
                value={selectedBranch || undefined}
                onChange={(val) => setSelectedBranch(val)}
                style={styles.selectMinWidth}
                allowClear
                disabled
              />
            </Tooltip>
          ) : (
            <Select
              placeholder="Select Branch"
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val)}
              style={styles.selectMinWidth}
              allowClear
            >
              {[
                ...new Set(
                  policies
                    .filter((p) => p.cleaned_state2 === selectedState)
                    .map((p) => p.cleaned_branch_name_2)
                ),
              ].map((branch) => (
                <Option key={branch} value={branch}>
                  {branch}
                </Option>
              ))}
            </Select>
          )}

          <Select
            placeholder="Select End Date"
            value={selectedEndDate || undefined}
            onChange={(val) => setSelectedEndDate(val)}
            style={styles.selectMinWidth}
            allowClear
          >
            {aprilDates.map((date) => (
              <Option key={date} value={date}>
                {new Date(date).toLocaleDateString("en-IN")}
              </Option>
            ))}
          </Select>

          <CustomButton onClick={downloadCSV}>Download CSV</CustomButton>
        </Space>

        {/* Table */}
        <Card style={styles.tableCardWrapper}>
          <Row justify="end" style={styles.customizeButtonRow}>
            <Button type="dashed" icon={<SettingOutlined />} onClick={openColumnSelector}>
              Customize Columns
            </Button>
          </Row>

          <div style={styles.tableContainer} ref={tableRef}>
            <div style={styles.antTableWrapper}>
              <Table
                key={tableKey}
                style={{
                  ...styles.compactHeader,
                  ...styles.compactCell,
                  ...(hasData ? { minWidth: "max-content" } : {}),
                }}
                columns={columns}
                dataSource={filteredPolicies}
                pagination={
                  hasData
                    ? {
                        pageSize: 30,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} policies`,
                        responsive: true,
                      }
                    : false
                }
                scroll={
                  hasData
                    ? {
                        x: "max-content",
                        scrollToFirstRowOnChange: true,
                      }
                    : undefined
                }
                bordered
                size="middle"
                tableLayout={hasData ? "fixed" : undefined}
              />
            </div>
          </div>
        </Card>

        <div style={styles.footerSpacer} />
      </div>
    </>
  );
};

export default Next30Days;
