import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import CustomButton from "./CustomButton";
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tooltip, 
  Spin,
  message,
  Select, 
  Checkbox, 
  Modal,
  Tag
} from 'antd';
import { 
  DownloadOutlined, 
  SettingOutlined, 
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const API_URL = import.meta.env.VITE_API_URL;


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

const normalizeCode = (c) => String(c || "INR").trim().toUpperCase();

// converts "83.25" / "83,25" / "83,250.10" -> 83250.10?? (commas removed)
const toNumberSafe = (x) => {
  if (x === null || x === undefined) return NaN;
  const s = String(x).trim().replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
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

// normalize keys to uppercase and values to numbers
const normalizeRateMap = (obj) => {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    const code = normalizeCode(k);
    const n = toNumberSafe(v);
    if (Number.isFinite(n) && n > 0) out[code] = n;
  });
  return out;
};

const readCurrencyFromStorage = () => {
  const code = normalizeCode(localStorage.getItem(LS_CURRENCY_CODE_KEY) || "INR");
  const raw = safeJsonParse(localStorage.getItem(LS_INR_PER_1_KEY), {});
  const inrPer1 = normalizeRateMap(raw);

  // helpful debugging (remove later)
  if (code !== "INR" && !inrPer1[code]) {
    console.warn(
      `[Currency] Missing INR-per-1 rate for ${code}. Stored keys:`,
      Object.keys(inrPer1)
    );
  }

  return { code, inrPer1 };
};

// Convert INR -> selected currency using inrPer1 map (INR per 1 unit of currency)
const convertINR = (inrValue, currencyCode, inrPer1) => {
  const code = normalizeCode(currencyCode);
  const v = toNumberSafe(inrValue);
  if (!Number.isFinite(v)) return 0;
  if (code === "INR") return v;

  const rate = toNumberSafe(inrPer1?.[code]);
  if (!Number.isFinite(rate) || rate <= 0) return v; // fallback if missing rate
  return v / rate;
};

const formatMoney = (inrValue, currencyCode, inrPer1) => {
  const code = normalizeCode(currencyCode);
  const symbol = CURRENCY_SYMBOL[code] || "";
  const x = convertINR(inrValue, code, inrPer1);

  // keep Indian grouping (optional) — change to undefined if you want browser locale
  const formatted = x.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return `${symbol}${formatted}`;
};


const monthNames = {
  1: "January", 2: "February", 3: "March", 4: "April",
  5: "May", 6: "June", 7: "July", 8: "August",
  9: "September", 10: "October", 11: "November", 12: "December"
};

const mandatoryKeys = [
  'policy_no',
  'corrected_name',
  'product_name',
  'primary_recommendation',
  'additional_offers',
  'policy_end_date'
];

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Segoe UI", sans-serif',
    width: '100%',  
    minHeight: '100vh',
    // padding: '20px',
    boxSizing: 'border-box'
  },
  
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '20px',
    width: '100%',
    
  },

  bottomRowWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  },

  bottomRowInnerGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '20px',
    width: '100%'
  },

  title: {
    fontSize: '2rem',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '2rem'
  },

  filterBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginBottom: '1.5rem'
  },

  cardBox: {
    flex: '1 1 calc(25% - 20px)',
    minWidth: '250px',
    textAlign: 'center',
    cursor: 'pointer',
    gap: '10px',
    transition: 'transform 0.3s, box-shadow 0.3s',
    borderRadius: '18px',
    padding: '20px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1e3a8a 50%, #0f172a 97%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },

  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(to right, #93c5fd, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent'
  },

  cardStats: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#dbeafe',
    lineHeight: 1.5
  },

  card: {
    width: '200px',
    padding: '1rem 1.2rem',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    backgroundImage: 'linear-gradient(to right, #6366f1, #3b82f6)'
  },

  topBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'space-between'
  },

  loading: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#3b82f6'
  },

  error: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#ef4444'
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },

  backButton: {
    color: '#1e3a8a',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color 0.2s ease'
  },

  downloadButton: {
    padding: '0.5rem 1.2rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: 'pointer'
  },

  reasonCell: {
    whiteSpace: 'normal',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  fadingGradientTitle: {
    fontSize: '2.2rem',
    margin: '1rem auto 2rem',
    maxWidth: '100%',
    fontWeight: 800,
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    marginBottom: '1rem'
  }

  
};

// CSS-in-JS keyframes for shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { left: -75%; }
    50% { left: 125%; }
    100% { left: 125%; }
  }
`;

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = shimmerKeyframes;
  document.head.appendChild(styleSheet);
}

const columnDisplayNames = {
  policy_no: 'Policy No',
  corrected_name: 'Customer Name',
  product_name: 'Product',
  primary_recommendation: 'Recommendation',
  number_of_claims: 'Claim Count',
  make_clean: 'Manufacturer',
  additional_offers: 'Additional Offer',
  policy_end_date: 'Policy End Date',
  cleaned_zone_2:'Zone',
  biztype: 'Business Type',
  age: 'Vehicle Age',
  customer_tenure: 'Customer Tenure',
  // rto_location: 'RTO Location',
  cleaned_reg_no: 'Registration No',
  total_premium_payable: 'Premium (₹)',
  cleaned_branch_name_2: 'Branch',
  cleaned_state2: 'State',
  tie_up: 'Tie Ups',
  top_3_reasons: 'Top 3 Reasons'
};


const Recommendation = () => {

   const [{ code: currencyCode, inrPer1 }, setCurrencyState] = useState(() =>
    readCurrencyFromStorage()
  );

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

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [columnModalVisible, setColumnModalVisible] = useState(false);
  const location = useLocation();
  const [reasons, setReasons] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tableKey, setTableKey] = useState(0);
  const tableRef = useRef(null);
  const [tempVisibleColumns, setTempVisibleColumns] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  const renderBullets = (text) => {
  if (!text) return "-";
  const items = String(text)
    .split("•")                    // split on bullets coming from backend
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <ul style={{ margin: 0, paddingLeft: "1.2em", textAlign: "left" }}>
      {items.map((it, i) => <li key={i} style={{ whiteSpace: "normal" }}>{it}</li>)}
    </ul>
  );
};

 const premiumTitle = useMemo(() => {
    return `Premium (${CURRENCY_SYMBOL[currencyCode] || ""} ${currencyCode})`;
  }, [currencyCode]);
  
   const allColumns = useMemo(() => {
    return {
      policy_no: {
        title: "Policy No",
        dataIndex: "policy_no",
        key: "Policy No",
        width: 120,
        fixed: "left",
        ellipsis: true,
      },
      product_name: {
        title: "Product",
        dataIndex: "product_name",
        key: "Product",
        width: 120,
        ellipsis: true,
      },
      predicted_status: {
        title: <div style={{ whiteSpace: "normal", textAlign: "center" }}>Predicted Status</div>,
        dataIndex: "predicted_status",
        key: "Predicted Status",
        width: 80,
        ellipsis: true,
      },
      policy_tenure: {
        title: <div style={{ whiteSpace: "normal", textAlign: "center" }}>Policy Tenure</div>,
        dataIndex: "policy_tenure",
        key: "Policy Tenure",
        width: 70,
        ellipsis: true,
      },
      main_reason: {
        title: "Main Reason",
        dataIndex: "main_reason",
        key: "Main Reason",
        width: 120,
        ellipsis: true,
      },
      churn_probability: {
        title: <div style={{ whiteSpace: "normal", textAlign: "center" }}>Churn Probability</div>,
        dataIndex: "churn_probability",
        width: 107,
        render: (value) => `${Math.round(value * 100)}%`,
        align: "center",
        sorter: (a, b) => a.churn_probability - b.churn_probability,
        sortDirections: ["descend", "ascend"],
      },
      biztype: {
        title: "Business Type",
        dataIndex: "biztype",
        key: "Business Type",
        width: 110,
        ellipsis: true,
      },
      age: {
        title: "Vehicle Age",
        dataIndex: "age",
        key: "Vehicle Age",
        width: 110,
        sorter: (a, b) => a.age - b.age,
      },
      customer_tenure: {
        title: <div style={{ whiteSpace: "normal", textAlign: "center" }}>Customer Tenure</div>,
        dataIndex: "customer_tenure",
        key: "Customer Tenure",
        width: 90,
      },
      cleaned_reg_no: {
        title: "Registration No",
        dataIndex: "cleaned_reg_no",
        key: "Registration No",
        width: 110,
        ellipsis: true,
      },
      total_premium_payable: {
        title: premiumTitle,
        dataIndex: "total_premium_payable",
        key: premiumTitle,
        width: 130,
        render: (value) => formatMoney(value, currencyCode, inrPer1),
        sorter: (a, b) => (a.total_premium_payable || 0) - (b.total_premium_payable || 0),
      },
      cleaned_branch_name_2: {
        title: "Branch",
        dataIndex: "cleaned_branch_name_2",
        key: "Branch",
        width: 70,
        ellipsis: true,
      },
      cleaned_state2: {
        title: "State",
        dataIndex: "cleaned_state2",
        key: "State",
        width: 70,
        ellipsis: true,
      },
      tie_up: {
        title: "Tie Ups",
        dataIndex: "tie_up",
        key: "Tie Ups",
        width: 90,
        ellipsis: true,
      },
      make_clean: {
        title: "Manufacturer",
        dataIndex: "make_clean",
        key: "Manufacturer",
        width: 130,
        ellipsis: true,
      },
      vehicle_idv: {
        title: "Vehicle IDV",
        dataIndex: "vehicle_idv",
        key: "Vehicle IDV",
        width: 90,
        ellipsis: true,
      },
      cleaned_zone_2: {
        title: "Zone",
        dataIndex: "cleaned_zone_2",
        key: "Zone",
        width: 70,
        ellipsis: true,
      },
      number_of_claims: {
        title: "Claim Count",
        dataIndex: "number_of_claims",
        key: "Claim Count",
        width: 90,
        ellipsis: true,
      },
      corrected_name: {
        title: "Customer Name",
        dataIndex: "corrected_name",
        key: "Customer Name",
        width: 120,
        ellipsis: { showTitle: false },
        render: (text) => (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        ),
      },
      primary_recommendation: {
        title: "Recommendation",
        dataIndex: "primary_recommendation",
        key: "Recommendation",
        align: "left",
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
        allign: "left",
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
      top_3_reasons: {
        title: "Top 3 Reasons",
        dataIndex: "top_3_reasons",
        allign: "left",
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
      policy_end_date: {
        title: <div style={{ whiteSpace: "normal", textAlign: "center" }}>Policy End Date</div>,
        dataIndex: "policy_end_date",
        key: "Policy End Date",
        width: 100,
        render: (_, r) => {
          if (r.policy_end_date) return String(r.policy_end_date);
          const d = r.policy_end_date_day;
          const m = r.policy_end_date_month;
          const y = r.policy_end_date_year;
          return d && m && y ? `${d}/${m}/${y}` : "-";
        },
      },
    };
  }, [currencyCode, inrPer1, premiumTitle]);

    

   const optionalKeys = useMemo(
    () => Object.keys(allColumns).filter((k) => !mandatoryKeys.includes(k)),
    [allColumns]
  );


  const [visibleColumns, setVisibleColumns] = useState([...mandatoryKeys]);
  
  const uniqueMonths = [...new Set(policies.map(p => p.policy_end_date_month))]
  .filter(Boolean)
  .sort((a, b) => a - b);

  const uniqueYears = [...new Set(policies.map(p => p.policy_end_date_year))].filter(Boolean);

  const getVisibleKeys = () => {
  // visibleColumns already includes mandatory + optionals in order
  return [...visibleColumns];
};

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
    setTableKey(prev => prev + 1);

    if (tableRef.current) {
      const tableBody = tableRef.current.querySelector('.ant-table-body');
      if (tableBody) {
        tableBody.scrollTo(0, 0);
      }
    }
  }, []);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await fetch(`${API_URL}/reason_details/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setReasons(data.reasons);
      } catch (error) {
        console.error("Error fetching reasons:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
  }, []);

  useEffect(() => {
    if (location.pathname === "/recommendation") {
      setSelectedReason(null);
    }
  }, [location]);

  useEffect(() => {
    const debouncedResize = debounce(() => {
      setWindowWidth(window.innerWidth);
      setTimeout(() => resetComponentStates(), 100);
    }, 150);

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => setTimeout(debouncedResize, 500));

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, [debounce, resetComponentStates]);

  const handleDownloadReasonData = (reason, year, month, filetype) => {
  const visibleKeys = getVisibleKeys();

  const params = new URLSearchParams({
    reason: reason || "",
    year: year || "",
    month: month || "",
    type: filetype || "csv",
    columns: visibleKeys.join(","),   // << pass the order you see in the table
    display_names: "true"             // << ask backend to use display names
  });

  const downloadUrl = `${API_URL}/download-reason-data?${params.toString()}`;
  window.open(downloadUrl, "_blank");
};


  const handleSelectAllChange = (checked) => {
  setSelectAllChecked(checked);
  setTempVisibleColumns(() => {
    if (checked) {
      // Combine mandatory and all optional keys
      return Array.from(new Set([...mandatoryKeys, ...optionalKeys]));
    } else {
      return [...mandatoryKeys];
    }
  });
};





  const fetchReasonDetails = async (reason) => {
    try {
      setTableLoading(true);
      const response = await fetch(`${API_URL}/reason_details/${encodeURIComponent(reason)}/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPolicies(data.policies);
      setSelectedReason(reason);
      setVisibleColumns((prev) => Array.from(new Set([...mandatoryKeys, ...prev.filter((k) => !mandatoryKeys.includes(k))])));
    } catch (error) {
      console.error("Error fetching reason details:", error);
      message.error(error.message);
    } finally {
      setTableLoading(false);
    }
  };

  const handleDownload = () => {
  handleDownloadReasonData(selectedReason, selectedYear, selectedMonth, "csv");
};

  // const exportFile = (type) => {
  //   const ws = XLSX.utils.json_to_sheet(policies);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Policies");
  //   const buffer = XLSX.write(wb, { bookType: type, type: "array" });
  //   const blob = new Blob([buffer], { type: "application/octet-stream" });
  //   saveAs(blob, `${selectedReason}_policies.${type}`);
  //   message.success(`Downloaded ${selectedReason} data as ${type.toUpperCase()}`);
  // };

  const filteredPolicies = policies.filter(p => {
    return (!selectedMonth || p.policy_end_date_month === selectedMonth) &&
           (!selectedYear || p.policy_end_date_year === selectedYear);
  });

  const getResponsiveCardStyles = () => {
    const baseStyles = { ...styles.cardBox };
    
    if (windowWidth <= 500) {
      baseStyles.flex = '1 1 100%';
    } else if (windowWidth <= 800) {
      baseStyles.flex = '1 1 calc(50% - 20px)';
    } else if (windowWidth <= 1200) {
      baseStyles.flex = '1 1 calc(33.33% - 20px)';
    }
    
    return baseStyles;
  };

  const BlinkingAnimation = () => (
    <style>
      {`
      @keyframes blinkEffect {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        /* Prevent page-level horizontal overflow */
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
        }
        
        /* Force all table containers to respect width - RESPONSIVE APPROACH */
        .ant-table-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        .ant-table-container {
          overflow-x: auto !important;
          overflow-y: visible !important;
          max-width: 100% !important;
          width: 100% !important;
        }

        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td {
        min-width: 100px !important;
        text-align: center;
         }

        /*.ant-table {
          table-layout: auto !important;
          width: 100% !important;
          min-width: fit-content !important;
        }*/

        /* Responsive table container */
        .table-container {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          position: relative;
          box-sizing: border-box !important;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure proper scrolling behavior */
        .ant-table-body {
          overflow-x: auto !important;
          overflow-y: auto !important;
          max-width: 100% !important;
          width: 100% !important;
        }

        .ant-table-content {
          overflow-x: auto !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Column styling for better fit */
        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          padding: 8px 12px !important;
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            min-width: 80px !important;
            max-width: 150px !important;
          }
        }

        /* Force scroll behavior on small screens */
        @media (max-width: 768px) {
          .table-container {
            overflow-x: scroll !important;
          }
        }
        
        /* Card shimmer animation */
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
        
        /* Table styling */
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

  const shimmerStyles = {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '-75%',
  width: '50%',
  height: '100%',
  borderRadius: '18px', // match card radius
  background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
  animation: 'shimmer 7s infinite',
  pointerEvents: 'none',
  zIndex: 1
};


  const getPolicyColumns = () => {
    

    return visibleColumns
      .filter((key) => key in allColumns)
      .map((key) => {
        const isOptional = !mandatoryKeys.includes(key);
        const baseColumn = allColumns[key];
        const displayTitle =
          key === "total_premium_payable"
            ? premiumTitle
            : columnDisplayNames[key] || baseColumn.title;

        return {
          ...baseColumn,
          align: 'center',
          width: baseColumn.width || 120,
          title: isOptional ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6
            }}>
              <span>{baseColumn.title}</span>
              <DeleteOutlined
                style={{
                  color: '#ff4d4f',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibleColumns(prev => prev.filter(col => col !== key));
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>{baseColumn.title}</div>
          ),
          onCell: () => ({
            style: { 
              whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    textAlign: 'center',
    padding: '8px 12px'
            },
          }),
        };
      });
  };

  if (loading && !selectedReason) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading reasons..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card style={{ textAlign: 'center' }}>
          <Title level={4} type="danger">Error Loading Data</Title>
          <Text type="secondary">{error}</Text>
          <br />
          <Button type="primary" onClick={() => window.location.reload()} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <BlinkingAnimation />
      
      <div style={{ 
        // marginTop: -45, 
        // padding: '24px', 
        width: '100%',
        maxWidth: '97vw', 
        margin: '0 auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        padding: '20px',
      }}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  width: '100%',
  margin: '0 24px 1rem'
}}>

  {selectedReason && (
    <Button
      type="default"
      // icon={<DeleteOutlined />}
      onClick={() => {
        setSelectedReason(null);
        setPolicies([]); // Optional: Clear old data
        setSelectedMonth("");
        setSelectedYear("");
      }}
      style={{
        background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    height: '35px',
    fontWeight: '600',
    borderRadius: '8px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    animation: 'blinkEffect 2s infinite',
      }}
    >
      <span style={{ display: 'inline-block', fontSize: '16px', lineHeight: '1', color: 'white' }}>
    ←
  </span>
  <span style={{ color: 'white' }}>Back</span>
    </Button>
  )}
<div style={{ flexGrow: 1, textAlign: 'center' }}>
  <h2 style={styles.fadingGradientTitle}>
    {selectedReason ? `Recommendations for ${selectedReason}` : "Recommendations based on Churn Reasons"}
  </h2>
  </div>
   <div style={{ width: '120px' }} />
</div>


        {tableLoading && !selectedReason ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh'
          }}>
            <Spin size="large" tip="Loading policies..." />
          </div>
        ) : !selectedReason && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: 24 }}>
            {/* Row 1 - First 4 Cards */}
            <div style={styles.cardGrid}>
              {reasons
                .slice(0, 4)
                .sort((a, b) => b.total_premium - a.total_premium)
                .map((rec) => {
                  const isHovered = hoveredCard === rec.main_reason;

                  return(
                  <Card
        key={rec.main_reason}
        hoverable
        onClick={() => fetchReasonDetails(rec.main_reason)}
        onMouseEnter={() => setHoveredCard(rec.main_reason)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          ...getResponsiveCardStyles(),
          ...(isHovered ? {
            transform: 'translateY(-5px) scale(1.03)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          } : {}),
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <div style={shimmerStyles}></div>
        <Title level={4} style={styles.cardTitle}>{rec.main_reason}</Title>
        <div style={{marginTop: "10px"}}>
          <Text style={styles.cardStats}>
            <strong>Policies : {rec.policy_count}</strong><br />
            {/* {rec.policy_count} */}
          </Text>
          {/* <br /> */}
          <Text style={styles.cardStats}>
            <strong>Total Premium : {formatMoney(Math.round(rec.total_premium || 0), currencyCode, inrPer1)}</strong><br />
            
          </Text>
        </div>
      </Card>
    );
  })}
            </div>

            {/* Row 2 - Remaining Cards */}
            <div style={styles.bottomRowWrapper}>
              <div style={styles.bottomRowInnerGrid}>
                {reasons.slice(4).map((rec) => {
                  const isHovered = hoveredCard === rec.main_reason;

                  return (
                    <Card
                      key={rec.main_reason}
                      hoverable
                      onClick={() => fetchReasonDetails(rec.main_reason)}
                      onMouseEnter={() => setHoveredCard(rec.main_reason)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        ...getResponsiveCardStyles(),
                        ...(isHovered ? {
                          transform: 'translateY(-5px) scale(1.03)',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                        } : {}),
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                    >
                      <div style={shimmerStyles}></div>
                      <Title level={4} style={styles.cardTitle}>
                        {rec.main_reason}
                      </Title>
                      <div style={{marginTop: "10px"}}>
                        <Text style={styles.cardStats}>
                          <strong>Policies : {rec.policy_count} </strong><br />
                          
                        </Text>
                        {/* <br /> */}
                        {rec.total_premium && (
                          <Text style={styles.cardStats}>
                            <strong>Total Premium : {formatMoney(Math.round(rec.total_premium || 0), currencyCode, inrPer1)}</strong><br />
                            
                          </Text>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {selectedReason && (
          <Spin spinning={tableLoading} tip="Loading policies...">
            <div style ={{paddingRight: 'calc(24px + 55px)',paddingLeft: '24px',}}>
            <Card
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '100%',
                marginTop: 24,
                overflow: 'hidden',
                boxSizing: 'border-box',
                // paddingRight: '10px'

              }}
              bodyStyle={{ padding: 0, width: '100%', maxWidth: '100%' }}
            >
              {/* Header section */}
              <div style={{ padding: '16px 24px' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                  <Space wrap>
                    <CustomButton onClick={handleDownload}>
                      Download CSV
                    </CustomButton>
                    <Button 
                      icon={<SettingOutlined />} 
                      onClick={() => {
                        setTempVisibleColumns(visibleColumns);
                        setColumnModalVisible(true);
                      }}
                    >
                      Customize Columns
                    </Button>
                  </Space>

                  <Space wrap>
                    <Select 
                      value={selectedYear || undefined} 
                      onChange={setSelectedYear} 
                      allowClear 
                      placeholder="Year" 
                      style={{ width: 100 }}
                    >
                      {uniqueYears.map(y => (
                        <Option key={y} value={y}>{y}</Option>
                      ))}
                    </Select>
                    <Select 
                      value={selectedMonth || undefined} 
                      onChange={setSelectedMonth} 
                      allowClear 
                      placeholder="Month" 
                      style={{ width: 120 }}
                    >
                      {uniqueMonths.map(m => (
                        <Option key={m} value={m}>{monthNames[m]}</Option>
                      ))}
                    </Select>
                  </Space>
                </Space>
              </div>

              <Modal
                title="Select Columns"
                open={columnModalVisible}
                onOk={() => {
                  setVisibleColumns(tempVisibleColumns);
                  setColumnModalVisible(false);
                }}
                onCancel={() => setColumnModalVisible(false)}

                okText="Apply">
                <div style={{
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '8px'
  }}>
              
              {/* <div style={{ marginBottom: '10px' }}> */}
    <Checkbox
      checked={selectAllChecked}
      indeterminate={
        tempVisibleColumns.length > mandatoryKeys.length &&
        tempVisibleColumns.length < mandatoryKeys.length + optionalKeys.length
      }
      onChange={(e) => handleSelectAllChange(e.target.checked)}
    >
      Select All
    </Checkbox>
  
                {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}> */}

                  {optionalKeys.map((key) => (
                    <Checkbox
                      key={key}
                      checked={tempVisibleColumns.includes(key)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTempVisibleColumns((prev) => {
                            const updated = checked ? [...prev, key] : prev.filter((col) => col !== key);
                            const merged = Array.from(new Set([...mandatoryKeys, ...updated]));
                            setSelectAllChecked(merged.length === mandatoryKeys.length + optionalKeys.length);
                            return merged;
                          });
                        }}
                      >
                        {key === "total_premium_payable"
                          ? premiumTitle
                          : columnDisplayNames[key] ||
                            key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Checkbox>
                  ))}
                </div>
              </Modal>

              {/* Table section with responsive container */}
              <div 
                className="table-container"
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  backgroundColor: 'white',
                  position: 'relative',
                  boxSizing: 'border-box',
                  
                  // paddingRight: 90
                  
                }}
                ref={tableRef}
              >
                <Table
                  key={tableKey}
                  columns={getPolicyColumns()}
                  dataSource={filteredPolicies}
                  loading={tableLoading}
                  scroll={{ 
                    x: 'max-content',  // Let it expand based on content
                    y: 400     // Keep vertical scroll
                  }}
                  pagination={{
                    pageSize: 30,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} policies`
                  }}
                  bordered
                  rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
                  size="middle"
                  tableLayout="fixed"  // Changed back to auto for flexibility
                  style={{ 
                    minWidth: '100%'
                  }}
                />
              </div>
            </Card>
            </div>
          </Spin>
        )}
        
        <div style={{ height: '100px', backgroundColor: '#FFFF' }} />
      </div>
    </>
  );
};

export default Recommendation;