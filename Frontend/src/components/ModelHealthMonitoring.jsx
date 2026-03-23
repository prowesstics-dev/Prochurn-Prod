import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Label, LabelList, Legend
} from 'recharts';

// Fluent UI imports
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  makeStyles,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components';
// import { fontFamily } from 'html2canvas/dist/types/css/property-descriptors/font-family';

// Fallback sample data (only used if API fails and you decide to enable it)
const SAMPLE_DATA = {
  metrics: {
    trainAccuracy: 86,
    rocAUC: 93,
    logLoss: 33,
    accuracyChange: '+3',
    rocChange: '+2',
    lossChange: '-3'
  },
  accuracyQuarterData: [
    { quarter: 'Q1', accuracy: 84 },
    { quarter: 'Q2', accuracy: 82 },
    { quarter: 'Q3', accuracy: 86 },
    { quarter: 'Q4', accuracy: 88 },
  ],
  rocCurveData: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.1, tpr: 0.6 },
    { fpr: 0.2, tpr: 0.75 },
    { fpr: 0.3, tpr: 0.82 },
    { fpr: 0.4, tpr: 0.87 },
    { fpr: 0.5, tpr: 0.90 },
    { fpr: 0.6, tpr: 0.93 },
    { fpr: 0.7, tpr: 0.95 },
    { fpr: 0.8, tpr: 0.97 },
    { fpr: 0.9, tpr: 0.98 },
    { fpr: 1.0, tpr: 1.0 }
  ],
  actualVsPredictedData: [],
  renewalData: [
    { name: 'Renewed', value: 84 },
    { name: 'Not Renewed', value: 86 }
  ],
  classificationData: {
    renewed: [
      { name: 'Precision', value: 86 },
      { name: 'Recall', value: 84 },
      { name: 'F1 Score', value: 85 }
    ],
    notRenewed: [
      { name: 'Precision', value: 82 },
      { name: 'Recall', value: 80 },
      { name: 'F1 Score', value: 81 }
    ]
  },
  // sample confusion matrix values matching your screenshot
  confusionMatrix: {
    truePositive: 817527,
    falsePositive: 143706,
    trueNegative: 803932,
    falseNegative: 130111,
  },
  stats: {
    highestAccuracy: 98,
    lowestAccuracy: 82,
    overallAccuracy: 98
  }
};

const styles = {
  title: {
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    WebkitTextStroke: '0.5px rgba(0,0,0,0.1)',
    backgroundClip: 'text',
    marginBottom: '20px',
    fontSize: '40px',
    fontWeight: '700',
    letterSpacing: '-1px',
    lineHeight: '1.5',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
    fontFamily : "var(--app-font-family)",
  },
  chartTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    lineHeight: 1.4,
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.75rem 0',
    fontFamily : "var(--app-font-family)",
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.6,
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 1.5rem 0',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e0f2fe',
    fontFamily : "var(--app-font-family)",
  }
};

// Fluent UI styles for DatePicker
const useFluentStyles = makeStyles({
  control: {
    maxWidth: '300px'
  }
});

// === Base URL for API (port 8000 or env) ===
const API_BASE =
  (import.meta.env && import.meta.env.VITE_HEALTH_MONITOR); // fallback

// ====== Generic label renderers ======
const renderPercentLabel = (props) => {
  const { x, y, value } = props;
  if (value == null) return null;
  return (
    <text
      x={x}
      y={y - 4}
      fill="#0f172a"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {`${value}%`}
    </text>
  );
};

const renderNumericLabel = (props) => {
  const { x, y, value } = props;
  if (value == null) return null;
  return (
    <text
      x={x}
      y={y - 4}
      fill="#0f172a"
      textAnchor="middle"
      fontSize={10}
    >
      {value}
    </text>
  );
};

const ModelHealthMonitoring = () => {
  const [renewalView, setRenewalView] = useState('Ren');

  // which class to show in Classification Report ('renewed' | 'notRenewed')
  const [classificationView, setClassificationView] = useState('renewed');
  const [classificationLoading, setClassificationLoading] = useState(false);

  // Date picker & data
  const [selectedDate, setSelectedDate] = useState(null);   // Date object
  const [availableDates, setAvailableDates] = useState([]); // ['YYYY-MM-DD', ...]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const fluentStyles = useFluentStyles();

  const colors = {
    primary: '#0a77b6',
    secondary: '#429CB9',
    tertiary: '#075988',
    background: '#f0f9ff',
    card: '#ffffff',
    text: '#161e2bff',
    lightBlue: '#e0f2fe',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    gradientStart: '#0f172a',
    gradientMid: '#0284c7',
    gradientEnd: '#06b6d4'
  };

  // Pre-compute a Set of allowed date strings for fast lookup
  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates]
  );

  // ===========================
  //  API CALL: DASHBOARD DATA
  // ===========================
  const fetchDashboardData = async (date) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (date) {
        params.append('date', date.toISOString().slice(0, 10)); // YYYY-MM-DD
      }

      const base = API_BASE.replace(/\/$/, '');
      const url =
        base +
        '/model-health/' +
        (params.toString() ? `?${params.toString()}` : '');

      console.log('Fetching model health from:', url);

      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        console.error('Non-200 response text:', text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = JSON.parse(text);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      // optional fallback:
      // setDashboardData(SAMPLE_DATA);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  //  API CALL: AVAILABLE DATES
  // ===========================
  const fetchAvailableDates = async () => {
    try {
      const base = API_BASE.replace(/\/$/, '');
      const url = base + '/model-health-dates/';
      console.log('Fetching model health dates from:', url);

      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        console.error('Non-200 response text (dates):', text);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = JSON.parse(text); // { dates: ["YYYY-MM-DD", ...] }

      setAvailableDates(data.dates || []);

      // Auto-select the latest date if nothing chosen yet
      if (!selectedDate && data.dates && data.dates.length > 0) {
        const last = data.dates[data.dates.length - 1]; // latest
        setSelectedDate(new Date(last)); // triggers fetchDashboardData via effect below
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
      // You could surface an error, but don't block main dashboard
    }
  };

  // Fetch available dates on first render
  useEffect(() => {
    fetchAvailableDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard data whenever selectedDate changes
  useEffect(() => {
    fetchDashboardData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Helper for DatePicker: disable dates that are not in DB
  const isDateDisabled = (date) => {
    if (!date) return true;
    if (availableDateSet.size === 0) {
      // while loading, disable all to avoid selecting invalid dates
      return true;
    }
    const key = date.toISOString().slice(0, 10);
    return !availableDateSet.has(key);
  };

  if (loading && !dashboardData) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          style={{
            minHeight: '100vh',
            background: colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '18px',
                color: colors.primary,
                fontWeight: 600
              }}
            >
              Loading Dashboard...
            </div>
          </div>
        </div>
      </FluentProvider>
    );
  }

  if (error && !dashboardData) {
    return (
      <FluentProvider theme={webLightTheme}>
        <div
          style={{
            minHeight: '100vh',
            background: colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center', color: '#ef4444', fontFamily : "var(--app-font-family)", }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', fontFamily : "var(--app-font-family)", }}>
              Error Loading Dashboard
            </div>
            <div style={{ fontSize: '14px' , fontFamily : "var(--app-font-family)", }}>{error}</div>
          </div>
        </div>
      </FluentProvider>
    );
  }

  if (!dashboardData) return null;

  // ===== Donut data from backend accuracy per class =====
  const renewedAccuracy =
    (dashboardData.renewalData && dashboardData.renewalData[0]?.value) || 0;
  const notRenewedAccuracy =
    (dashboardData.renewalData && dashboardData.renewalData[1]?.value) || 0;

  const renewedDonutData = [
    { name: 'Renewed', value: renewedAccuracy },
    { name: 'Error', value: Math.max(0, 100 - renewedAccuracy) },
  ];

  const notRenewedDonutData = [
    { name: 'Not Renewed', value: notRenewedAccuracy },
    { name: 'Error', value: Math.max(0, 100 - notRenewedAccuracy) },
  ];

  // Classification data by view
  const rawClassData = dashboardData.classificationData;
  const classDataRenewed =
    (rawClassData && rawClassData.renewed) || rawClassData || [];
  const classDataNotRenewed =
    (rawClassData && (rawClassData.notRenewed || rawClassData.not_renewed)) ||
    classDataRenewed;

  const classificationChartData =
    classificationView === 'renewed' ? classDataRenewed : classDataNotRenewed;

  // Confusion matrix (real values from backend)
  const cm = dashboardData.confusionMatrix || {};
  const {
    truePositive = 0,
    falsePositive = 0,
    trueNegative = 0,
    falseNegative = 0,
  } = cm;

  const maxCM = Math.max(truePositive, falsePositive, trueNegative, falseNegative, 1);

  const cmCellStyle = (value, type) => {
    const ratio = value / maxCM; // 0 → 1
    const lightOpacity = 0.25;   // base light shade
    const darkOpacity = 0.85 * ratio + 0.15; // darker for higher values

    let gradient;
    if (type === "true") {
      // Updated turquoise gradient (same as SVG stops)
      gradient = `linear-gradient(
        to bottom,
        rgba(6, 182, 212, 0.8) 5%,
        rgba(6, 182, 212, 0.3) 95%
      )`;
    }
    else {
      // Red gradient (top lighter → bottom darker)
      gradient = `linear-gradient(to bottom,
        rgba(239, 68, 68, ${lightOpacity}),
        rgba(239, 68, 68, ${darkOpacity})
      )`;
    }

    return {
      background: gradient,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily : "var(--app-font-family)",
      fontWeight: 600,
      fontSize: '14px',
      borderRadius: '12px', // matches your card style
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)' // optional soft shadow
    };
  };

  // Handle toggle with loading visual
  const handleClassificationToggle = () => {
    if (classificationLoading) return;
    setClassificationLoading(true);
    setTimeout(() => {
      setClassificationView(prev =>
        prev === 'renewed' ? 'notRenewed' : 'renewed'
      );
      setClassificationLoading(false);
    }, 450); // small delay so user can see the loading effect
  };

  return (
    <FluentProvider theme={webLightTheme}>
      {/* Local CSS for back button + animation + remove "today" highlight + spinner */}
      <style>{`
        .backButton { 
          background-color: #075988;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          fontFamily : var(--app-font-family);
          cursor: pointer;
          animation: blink 1.2s linear infinite;
          margin-bottom: 20px;
          margin-left: 10px;
          z-index: 2;
        }

        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .ms-DatePicker-day--today {
          border: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
        .ms-DatePicker-day--today:hover {
          border: 1px solid transparent !important;
          background-color: rgba(148, 163, 184, 0.15) !important;
        }

        .mini-spinner {
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,0.6);
          border-top-color: white;
          width: 14px;
          height: 14px;
          margin-right: 6px;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: colors.background,
          padding: '20px 10px 40px 10px'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px', padding: '0 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center'
            }}
          >
            <div>
              <button
                className="backButton"
                onClick={() => window.history.back()}
              >
                Back
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h1 style={styles.title}>Model - Health Monitoring Dashboard</h1>
              </div>
            </div>

            <div />
          </div>

          <div
            style={{
              marginTop: '-12px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* <span
                style={{
                  color: colors.text,
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Date
              </span>
              <DatePicker
                className={fluentStyles.control}
                placeholder={
                  availableDates.length
                    ? 'Select a run date...'
                    : 'No run dates available'
                }
                value={selectedDate}
                onSelectDate={(date) => setSelectedDate(date || null)}
                isDateDisabled={isDateDisabled}
              /> */}
            </div>
          </div>
        </div>

        {/* Main Content Layout - Two Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '20px',
            padding: '0 20px',
            marginBottom: '30px'
          }}
        >
          {/* Left Column: Main Charts */}
          <div>
            {/* Accuracy Quarter Wise Chart */}
            <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(2, 132, 199, 0.05) 100%)',
            padding: '30px',
            borderRadius: '20px',
            margin: '0',
            border: '2px solid rgba(6, 182, 212, 0.15)',
            boxShadow: '0 8px 32px rgba(2, 132, 199, 0.1)'
          }}>
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h2 style={styles.chartTitle}>Accuracy Quarter Wise</h2>
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={dashboardData.accuracyQuarterData}>
                  <defs>
                    <linearGradient id="colorPolicies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="quarter" stroke={colors.text}  fontFamily = "var(--app-font-family)"/>
                  <YAxis stroke={colors.text} fontFamily = "var(--app-font-family)" />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#06b6d4"
                    fill="url(#colorPolicies)"
                    strokeWidth={3}
                    dot={{ fill: colors.primary, r: 5 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    <LabelList content={renderPercentLabel} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#64748b',
                  fontFamily : "var(--app-font-family)",
                }}
              >
                <span>Highest Accuracy {dashboardData.stats.highestAccuracy}%</span>
                <span style={{ margin: '0 20px' }}>•</span>
                <span>Lowest Accuracy {dashboardData.stats.lowestAccuracy}%</span>
              </div>
            </div></div>
          </div>

          {/* Right Column: Metric Cards */}
          <div
            style={{
    background: 'linear-gradient(135deg, rgba(6,182,212,0.85), rgba(7,89,136,0.9))',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 12px 30px rgba(2,132,199,0.35)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.25)',
    height: 'fit-content'
  }}
>
  <div
    style={{
      textAlign: 'center',
      fontSize: '20px',
      fontWeight: 700,
      color: 'white',
      marginTop : '15px',
      marginBottom: '28px',
      fontFamily : "var(--app-font-family)",
      letterSpacing: '0.5px'
    }}
  >
    MODEL METRICS
  </div>
            <GlassMetricRow
    label="Train Accuracy"
    value={`${dashboardData.metrics.trainAccuracy}%`}
  />
             <GlassMetricRow
    label="ROC [AUC] %"
    value={`${dashboardData.metrics.rocAUC}%`}
  />
            <GlassMetricRow
    label="Log Loss %"
    value={`${dashboardData.metrics.logLoss}%`}
  />
          </div>
        </div>

        {/* Charts Section Container */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(2, 132, 199, 0.05) 100%)',
            padding: '30px',
            borderRadius: '20px',
            margin: '0 20px',
            border: '2px solid rgba(6, 182, 212, 0.15)',
            boxShadow: '0 8px 32px rgba(2, 132, 199, 0.1)'
          }}
        >
          <h2 style={styles.sectionTitle}>Model Performance Metrics</h2>
          
          {/* First Row: ROC Curve + Confusion Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}
          >
            {/* ROC Curve */}
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h2 style={styles.chartTitle}>ROC - Curve</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.rocCurveData}>
                  <defs>
                    <linearGradient id="tieupsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="fpr"
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(value) => value.toFixed(2)}  // 0.00, 0.25, ...
                    label={{
                      value: 'False Positive Rate',
                      position: 'insideBottom',
                      fontFamily : "var(--app-font-family)",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(value) => value.toFixed(2)}
                    label={{
                      value: 'True Positive Rate',
                      angle: -90,
                      fontFamily : "var(--app-font-family)",
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value) => value.toFixed(4)}
                    labelFormatter={(value) => `FPR: ${value.toFixed(4)}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="tpr"
                    stroke="#075988"
                    strokeWidth={1.5}
                    fill="url(#tieupsAreaGradient)"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Confusion Matrix Heatmap */}
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h2 style={styles.chartTitle}>Confusion Matrix - Training Data (GBM)</h2>

              {/* Axes labels */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px repeat(2, 1fr)',
                  gridTemplateRows: '40px repeat(2, 80px) 30px',
                  gap: '4px',
                  marginTop: '12px'
                }}
              >
                {/* Top-left empty cell */}
                <div />

                {/* Column headers (Predicted) */}
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily : "var(--app-font-family)",
                    color: '#334155'
                  }}
                >
                  Not Churn (0)
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontFamily : "var(--app-font-family)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  Churn (1)
                </div>

                {/* Row header: Actual Not Churn */}
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    textAlign: 'center',
                    fontSize: 12,
                    fontFamily : "var(--app-font-family)",
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  Not Churn (0)
                </div>

                {/* TN (0,0) */}
                <div style={cmCellStyle(trueNegative, "true")}>
                  {trueNegative.toLocaleString()}
                </div>

                {/* FP (0,1) */}
                <div style={cmCellStyle(falsePositive, "error")}>
                  {falsePositive.toLocaleString()}
                </div>

                {/* Row header: Actual Churn */}
                <div
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily : "var(--app-font-family)",
                    color: '#334155'
                  }}
                >
                  Churn (1)
                </div>

                {/* FN (1,0) */}
                <div style={cmCellStyle(falseNegative, "error")}>
                  {falseNegative.toLocaleString()}
                </div>

                {/* TP (1,1) */}
                <div style={cmCellStyle(truePositive, "true")}>
                  {truePositive.toLocaleString()}
                </div>

                {/* Bottom row for "Predicted" axis label */}
                <div /> {/* empty under y-axis label */}
                <div
                  style={{
                    gridColumn: '2 / span 2',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily : "var(--app-font-family)",
                    color: '#334155',
                    alignSelf: 'center'
                  }}
                >
                  Predicted
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Renewed vs Not Renewed + Classification Report */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}
          >
            {/* Renewed vs Not Renewed Accuracy */}
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h2 style={styles.chartTitle}>Renewed vs Not Renewed Accuracy</h2>
              
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  alignItems: 'center',
                  marginTop: '20px'
                }}
              >
                {/* Renewed donut */}
                <div style={{ textAlign: 'center' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <defs>
                        <linearGradient id="renewedBlueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#075988" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={renewedDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={800}
                      >
                        <Cell fill="url(#renewedBlueGradient)" />   {/* Gradient for Renewed */}
                        <Cell fill={colors.lightBlue} />            {/* Normal Light Blue */}
                        <Label
                          value={`${renewedAccuracy}%`}
                          position="center"
                          fontFamily = "var(--app-font-family)"
                          fill={colors.text}
                          style={{ fontSize: 18, fontWeight: 700 }}
                        />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily : "var(--app-font-family)",
                      color: '#4c525aff',
                      marginBottom: '8px'
                    }}
                  >
                    Renewed Accuracy
                  </div>
                </div>

                {/* Not renewed donut */}
                <div style={{ textAlign: 'center' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <defs>
                        <linearGradient id="notRenewedBlueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#075988" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={notRenewedDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={800}
                      >
                        <Cell fill="url(#notRenewedBlueGradient)" /> {/* Gradient Slice */}
                        <Cell fill={colors.lightBlue} />             {/* Flat Slice */}
                        <Label
                          value={`${notRenewedAccuracy}%`}
                          position="center"
                          fontFamily = "var(--app-font-family)"
                          fill={colors.text}
                          style={{ fontSize: 18, fontWeight: 700 }}
                        />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily : "var(--app-font-family)",
                      color: '#4c525aff',
                      marginBottom: '8px'
                    }}
                  >
                    Not Renewed Accuracy
                  </div>
                </div>
              </div>
            </div>

            {/* Classification Report */}
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2 style={styles.chartTitle}>Classification Report</h2>

                <button
                  onClick={handleClassificationToggle}
                  disabled={classificationLoading}
                  style={{
                    position: 'absolute',
                    right: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily : "var(--app-font-family)",
                    cursor: classificationLoading ? 'default' : 'pointer',
                    opacity: classificationLoading ? 0.8 : 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  {classificationLoading && <span className="mini-spinner" />}
                  <span>
                    {classificationView === 'renewed' ? 'Renewed' : 'Not-Renewed'}
                  </span>
                </button> 
              </div>

              <div style={{ position: 'relative', width: '100%', height: 250 }}>
                {classificationLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontFamily : "var(--app-font-family)",
                      color: colors.text,
                      zIndex: 2
                    }}
                  >
                    Switching…
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classificationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke={colors.text}
                      fontSize={12}
                      fontFamily = "var(--app-font-family)"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#branchGradient)"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      <LabelList
    dataKey="value"
    position="top"
    offset={8}                  // ✅ pushes label slightly above the bar
    formatter={(v) => `${Number(v).toFixed(2)}%`}
    style={{ fill: "#0f172a", fontWeight: 500, fontSize: 12 }}
  />
                    </Bar>
                    <defs>
                      <linearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FluentProvider>
  );
};


const GlassMetricRow = ({ label, value }) => {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.18)',
        borderRadius: '14px',
        // gap: '20',
        padding: '16px 14px 40px 16px',
        marginBottom: '14px',
        textAlign: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
    >
      <div
        style={{
          fontSize: '18px',
          marginTop : '10px',
          fontFamily : "var(--app-font-family)",
          fontWeight: 800,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '25px',
          fontFamily : "var(--app-font-family)",
          marginTop : '10px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.5px'
        }}
      >
        {value}
      </div>
    </div>
  );
};



const MetricCard = ({ title, value, change, changeColor, bgColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'linear-gradient(135deg, #0a77b6 0%, #06b6d4 100%)',
        padding: '24px 20px',
        borderRadius: '16px',
        boxShadow: isHovered 
          ? '0 12px 24px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset'
          : '0 6px 16px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(255,255,255,0.1) inset',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: 'fit-content'
      }}
    >
      {/* Shimmer effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isHovered ? '100%' : '-100%',
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transition: 'left 0.8s ease',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div
          // style={{
          //   width: '40px',
          //   height: '40px',
          //   borderRadius: '10px',
          //   background: 'rgba(255,255,255,0.15)',
          //   backdropFilter: 'blur(10px)',
          //   display: 'flex',
          //   alignItems: 'center',
          //   justifyContent: 'center',
          //   marginBottom: '12px',
          //   border: '1px solid rgba(255,255,255,0.2)',
          //   transform: isHovered ? 'rotate(10deg) scale(1.05)' : 'rotate(0deg) scale(1)',
          //   transition: 'all 0.3s ease'
          // }}
        >
          {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="rgba(255,255,255,0.9)"
              style={{
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}
            />
          </svg> */}
        </div>

        <div
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            fontFamily : "var(--app-font-family)",
            marginBottom: '8px',
            textAlign : 'center',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '28px',
            color: 'white',
            textAlign : 'center',
            fontFamily : "var(--app-font-family)",
            fontWeight: '800',
            marginBottom: '6px',
            letterSpacing: '-0.5px'
          }}
        >
          {value}
        </div>

        {/* Change indicator */}
        {/* {change && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              color: changeColor || '#22c55e'
            }}
          >
            <span>{change}</span>
          </div>
        )} */}

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '16px'
          }}
        >
          <div
            style={{
              width: '70%',
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
              borderRadius: '999px',
              transition: 'width 1s ease-out',
              boxShadow: '0 0 8px rgba(255,255,255,0.4)'
            }}
          />
        </div>
      </div>
    </div>
  );
  
};

export default ModelHealthMonitoring;