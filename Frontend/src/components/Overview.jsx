// Overview.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tooltip,
  Spin,
  Dropdown,
  Menu,
  Space,
} from "antd";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./Overview.module.css";

import { FaArrowDown, FaArrowUp, FaCog } from "react-icons/fa";

// ✅ Global currency (from your Configurations Apply)
import { useCurrency } from "../context/CurrencyContext";

const { Title, Text } = Typography;

/* ===================== Currency helpers ===================== */
const LS_CURRENCY_CODE_KEY = "app_currency_code";
const LS_INR_PER_1_KEY = "app_currency_rates_inrPer1";

// Currency symbols (extend anytime)
const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AED: "د.إ",
  RUB: "₽",
  KZT: "₸",
  CHF: "CHF ",
  SGD: "S$",
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


// Convert INR -> selected currency using inrPer1 map (INR per 1 unit)
// Example: inrPer1.USD = 83 => INR 8300 / 83 = USD 100
const convertINR = (inrValue, currencyCode, inrPer1) => {
  const v = Number(inrValue || 0);
  if (!Number.isFinite(v)) return 0;

  if (!currencyCode || currencyCode === "INR") return v;

  const rate = Number(inrPer1?.[currencyCode]);
  if (!Number.isFinite(rate) || rate <= 0) {
    // if rate missing, fallback to INR without conversion
    return v;
  }

  return v / rate;
};

const formatCompactMoney = (inrValue, currencyCode, inrPer1) => {
  const symbol = CURRENCY_SYMBOL[currencyCode] || "";
  const x = convertINR(inrValue, currencyCode, inrPer1);
  const abs = Math.abs(x);

  if (abs >= 1e9) return `${symbol}${(x / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${symbol}${(x / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${symbol}${(x / 1e3).toFixed(2)}K`;
  return `${symbol}${x.toFixed(2)}`;
};

// tooltip detailed format
const formatFullMoney = (inrValue, currencyCode, inrPer1) => {
  const symbol = CURRENCY_SYMBOL[currencyCode] || "";
  const x = convertINR(inrValue, currencyCode, inrPer1);
  return `${symbol}${x.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

/* ===================== Animations ===================== */

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/* ===================== Overview ===================== */

const Overview = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [metrics, setMetrics] = useState({
    totalChurnedPolicies: 0,
    totalPolicies: 0,
    churnRate: 0,
    revenueLoss: 0, // ✅ assumed INR from backend
    avgTenure: 0,
    yearlyTrend: [],
    topRegions: [],
    topBusinessTypes: [],
    topProducts: [],
    topVehicleAges: [],
  });

  const [loading, setLoading] = useState(true);


  const [{ code: currencyCode, inrPer1 }, setCurrencyState] = useState(() =>
    readCurrencyFromStorage()
  );

  const pinRef = useRef(null);
  const chartRef = useRef(null);
  const focusRef = useRef(null);
  const titleRef = useRef(null);

  const [pinInViewRef] = useInView({ threshold: 0.5 });
  const [chartInViewRef] = useInView({ threshold: 0.5 });
  const [focusInViewRef] = useInView({ threshold: 0.5 });

  const sectionEls = useRef([]);
  const ioRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

 

  // IntersectionObserver (for scroll arrow)
  useEffect(() => {
    ioRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const idx = sectionEls.current.findIndex((el) => el === visible.target);
        if (idx !== -1) setCurrentIdx(idx);
      },
      {
        root: null,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "0px",
      }
    );

    return () => ioRef.current?.disconnect();
  }, []);

  const registerSection = useCallback(
    (i) => (el) => {
      const prev = sectionEls.current[i];
      if (prev && ioRef.current) ioRef.current.unobserve(prev);

      sectionEls.current[i] = el;
      if (el && ioRef.current) ioRef.current.observe(el);
    },
    []
  );

  const scrollToIdx = (idx) => {
    const el = sectionEls.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollNext = () => {
    const last = sectionEls.current.filter(Boolean).length - 1;
    const next = Math.min(currentIdx + 1, last);
    scrollToIdx(next);
  };

  const scrollTop = () => {
    titleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API_URL}/businessmetrics/`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        // keep UI alive even if API fails
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [API_URL]);

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

    // initial sync
    sync();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("app_currency_changed", sync);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 100 }}>
        <Spin tip="Loading metrics..." size="large" />
      </div>
    );
  }

  // Revenue Loss display using applied global currency
  const revenueLossCompact = formatCompactMoney(
    metrics.revenueLoss ?? 0,
    currencyCode,
    inrPer1
  );
  const revenueLossTooltip = `Revenue Loss: ${formatFullMoney(
    metrics.revenueLoss ?? 0,
    currencyCode,
    inrPer1
  )} (${currencyCode})`;

  return (
    <div className={styles.dashboardContainer}>
      <div
        data-gradient="linear-gradient(to right, #06b6d4, #8b5cf6)"
        className={styles.highlightSection}
      >
        <div ref={titleRef} className={styles.titleRow}>
          <Title level={2} className={styles.fadingGradientHeader}>
            Let&apos;s see what your data says
          </Title>
          {/* <div style={{ marginLeft: "auto" }}>
            <Text type="secondary">
              Applied Currency:{" "}
              <Text strong>
                {CURRENCY_SYMBOL[currencyCode] || ""} {currencyCode}
              </Text>
            </Text>
          </div> */}

          
          
        </div>
      </div>

      {/* Pin Cards Section */}
      <div
        ref={(el) => {
          pinRef.current = el;
          registerSection(0)(el);
          pinInViewRef(el);
        }}
      >
        <Row justify="center" gutter={[24, 24]} className={styles.pinRow}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <PinCard
              number={metrics.totalChurnedPolicies}
              title="Total Churned Policies"
              color="#253969"
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <PinCard
              number={`${(metrics.churnRate ?? 0).toFixed(2)}%`}
              title="Churn Rate"
              color="#38559c"
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            {/* ✅ Revenue Loss uses global applied currency */}
            <PinCard
              number={revenueLossCompact}
              title="Revenue Loss"
              color="#466ac2"
              tooltip={revenueLossTooltip}
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <PinCard
              number={`${(metrics.avgTenure ?? 0).toFixed(2)} Year`}
              title="Average Customer Tenure"
              color="#537de6"
            />
          </Col>
        </Row>
      </div>

      {/* Chart Section */}
      <div
        ref={(el) => {
          chartRef.current = el;
          registerSection(1)(el);
          chartInViewRef(el);
        }}
      >
        <Card className={styles.chartCard}>
          <Title level={4} className={styles.fadingGradientTitle}>
            Churned Policies Trend By Year
          </Title>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={Array.isArray(metrics.yearlyTrend) ? metrics.yearlyTrend : []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPolicies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 1" stroke="#e0e0e0" />
                <XAxis dataKey="year" stroke="#555" />
                <YAxis stroke="#555" />
                <RechartTooltip
                  contentStyle={{
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ccc",
                  }}
                />
                <Legend verticalAlign="top" height={36} />

                <Area
                  type="monotone"
                  dataKey="churnedPolicies"
                  stroke="#06b6d4"
                  strokeWidth={2.3}
                  fill="url(#colorPolicies)"
                  dot={{
                    r: 6,
                    stroke: "#0284c7",
                    strokeWidth: 2,
                    fill: "white",
                  }}
                  activeDot={{ r: 4 }}
                  label={({ x, y, value }) => (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fill="#333"
                      fontSize={12}
                    >
                      {value}
                    </text>
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Focus Areas Section */}
      <div
        ref={(el) => {
          focusRef.current = el;
          registerSection(2)(el);
          focusInViewRef(el);
        }}
      >
        <Title level={3} className={styles.fadingGradientTitle}>
          Where you have to focus
        </Title>

        <Row gutter={16} className={styles.focusRow}>
          <Col span={6}>
            <FocusCard
              title="Highly Churned Policies By Regions"
              items={metrics.topRegions}
            />
          </Col>
          <Col span={6}>
            <FocusCard
              title="Highly Churned Policies By Business Types"
              items={metrics.topBusinessTypes}
            />
          </Col>
          <Col span={6}>
            <FocusCard
              title="Highly Churned Policies By Products"
              items={metrics.topProducts}
            />
          </Col>
          <Col span={6}>
            <FocusCard
              title="Highly Churned Policies By Vehicle Age"
              items={metrics.topVehicleAges}
            />
          </Col>
        </Row>
      </div>

      {/* Scroll Arrows */}
      <div className={styles.scrollArrowWrapper}>
        {currentIdx < sectionEls.current.filter(Boolean).length - 1 ? (
          <div className={styles.scrollArrow} onClick={scrollNext}>
            <FaArrowDown />
          </div>
        ) : (
          <div className={styles.scrollArrow} onClick={scrollTop}>
            <FaArrowUp />
          </div>
        )}
      </div>

      <div style={{ height: "100px", backgroundColor: "#FFFF" }} />
    </div>
  );
};

/* ===================== PinCard ===================== */

const PinCard = ({ number, title, color, tooltip = null }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionVariants}
      className={styles.pinWrapper}
    >
      <div className={styles.pinContainer}>
        <div className={styles.pin} style={{ borderColor: color }}>
          <Tooltip title={tooltip || null}>
            <div className={styles.pinCircle} style={{ color }}>
              {number}
            </div>
          </Tooltip>
        </div>

        <div className={styles.pinArrow} style={{ borderTopColor: color }} />
        <div className={styles.pinShadow} />
      </div>

      <div className={styles.pinTitle}>{title}</div>
    </motion.div>
  );
};

/* ===================== FocusCard ===================== */

const FocusCard = ({ title, items = [] }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionVariants}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={styles.focusCard}>
        <Title level={4} className={styles.cardTitle}>
          {title}
        </Title>

        <ul className={styles.focusList}>
          {(Array.isArray(items) ? items : []).map((item, index) => (
            <motion.li key={index} className={styles.listItem}>
              <Text strong>{item?.name}</Text>: {item?.value}
            </motion.li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
};

export default Overview;
