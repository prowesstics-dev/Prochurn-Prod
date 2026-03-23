import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Fluent UI
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
} from '@fluentui/react-components';

const API_BASE =
  (import.meta.env && import.meta.env.VITE_ANALYTICS);

const useFluentStyles = makeStyles({
  control: {
    maxWidth: '260px',
  },
});

const WebUsageMetrics = () => {
  const [timeView, setTimeView] = useState('Day');
  const [moduleHours, setModuleHours] = useState([]);
  const [moduleHoursLoading, setModuleHoursLoading] = useState(true);
  const [moduleHoursError, setModuleHoursError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [usageSummary, setUsageSummary] = useState(null);
  const [systemSummary, setSystemSummary] = useState(null);
  const [downloadsSummary, setDownloadsSummary] = useState(null);
  const [routeFailures, setRouteFailures] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [availableDates, setAvailableDates] = useState([]); // 'YYYY-MM-DD'
  const [dateOptionsLoading, setDateOptionsLoading] = useState(true);
  const [dateError, setDateError] = useState(null);

  // sessions-over-time chart data
  const [sessionsSeries, setSessionsSeries] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  const colors = {
    primary: '#0a77b6',   // page blue -> used for metric titles
    secondary: '#429CB9',
    tertiary: '#075988',
    background: '#f0f9ff',
    card: '#ffffff',
    text: '#0f172a',
    lightBlue: '#e0f2fe',
    darkBlue: '#1e3a5f',
    green: '#16a34a',
    red: '#ee04049d',
    headerBg: '#d4e8f3',
    sectionAccent: '#e6f6fb',
  };

  const styles = {
    title: {
      textAlign: 'center',
      background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      WebkitTextStroke: '0.5px rgba(0,0,0,0.1)',
      backgroundClip: 'text',
      fontSize: '40px',
      fontWeight: '700',
      fontFamily : "var(--app-font-family)",
      letterSpacing: '-1px',
      lineHeight: '1.5',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
      margin: 0,
    },
    chartTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.6,
      textAlign: 'center',
      fontFamily : "var(--app-font-family)",
      background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: '0 0 0.5rem 0',
    },
    backButtonStyle: {
      background: 'linear-gradient(145deg, #075988 0%, #0a77b6 100%)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '10px 18px',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '14px',
      fontFamily : "var(--app-font-family)",
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(7,89,136,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    headerRow: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      marginBottom: '8px',
    },
    headerDateRow: {
      marginTop: '34px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      alignItems: 'center',
    },
  };

  const cardStyles = {
    metricCard: {
      background: '#0a77b6',
      color: '#ffffff',
      padding: '18px',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden',
    },
    metricCardLabel: {
      fontSize: '14px',
      fontWeight: 500,
      fontFamily : "var(--app-font-family)",
      marginBottom: '8px',
      opacity: 0.95,
    },
    metricCardValue: {
      fontSize: '28px',
      fontFamily : "var(--app-font-family)",
      fontWeight: '700',
      textShadow: '0 2px 10px rgba(0,0,0,0.2)',
    },
    metricCardAccent: {
      position: 'absolute',
      top: '-16px',
      right: '-16px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
    },
    glassCard: {
      background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '18px',
      boxShadow: '0 8px 32px rgba(6,58,95,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
      border: '1px solid rgba(255,255,255,0.4)',
    },
    sectionCard: {
      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,249,255,0.92) 100%)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      borderRadius: '18px',
      marginBottom: '18px',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 8px 32px rgba(6,58,95,0.08), inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(6,182,212,0.1)',
    },
  };

  const fluentStyles = useFluentStyles();

  // helpers
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  };

  const formatNumber = (value) => {
    const num = value ?? 0;
    return Number(num).toLocaleString();
  };

  const formatFixed = (value, digits = 0) => {
    const num = value ?? 0;
    return Number(num).toFixed(digits);
  };

  const toYMD = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ show only last segment after "/"
  const lastPathSegment = (path) => {
    const s = String(path ?? '').trim();
    if (!s) return '';
    const noQuery = s.split('?')[0];
    const trimmed = noQuery.replace(/\/+$/, ''); // remove trailing "/"
    const parts = trimmed.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : trimmed;
  };

  // fetches
  useEffect(() => {
    const fetchModuleHours = async () => {
      try {
        setModuleHoursLoading(true);
        setModuleHoursError(null);

        const params = {};
        const dStr = toYMD(selectedDate);
        if (dStr) params.date = dStr;

        const res = await axios.get(`${API_BASE}/module-hours/`, { params });
        const modules = res.data.modules || [];

        const transformed = modules.map((m, idx) => ({
          id: idx,
          category: m.name,
          path: m.path,
          hours: Number(m.hours || 0),
        }));

        setModuleHours(transformed);
      } catch (err) {
        console.error('Failed to load module hours', err);
        setModuleHoursError('Failed to load Hours Spent data');
        setModuleHours([]);
      } finally {
        setModuleHoursLoading(false);
      }
    };

    if (!dateOptionsLoading) {
      fetchModuleHours();
    }
  }, [selectedDate, dateOptionsLoading]);

  useEffect(() => {
    const fetchPeakSessions = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError(null);

        const params = {};
        const dStr = toYMD(selectedDate);
        if (dStr) params.date = dStr;

        const res = await axios.get(`${API_BASE}/peak-sessions-over-time/`, { params });
        const points = res.data.points || [];

        const parsed = points.map((p, idx) => ({
          id: idx,
          label: p.label || `Bucket ${idx + 1}`,
          sessions: Number(p.sessions || 0),
          clicks: Number(p.clicks || 0),
        }));

        setSessionsSeries(parsed);
      } catch (err) {
        console.error('Failed to load peak sessions series', err);
        setSessionsError('Failed to load peak sessions data');
        setSessionsSeries([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    if (!dateOptionsLoading) {
      fetchPeakSessions();
    }
  }, [selectedDate, dateOptionsLoading]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        setDateOptionsLoading(true);
        const res = await axios.get(`${API_BASE}/available-dates/`);
        const dates = (res.data && res.data.dates) || [];
        dates.sort();
        setAvailableDates(dates);

        if (!selectedDate && dates.length > 0) {
          setSelectedDate(new Date(dates[dates.length - 1]));
        }
      } catch (err) {
        console.error('Failed to load available dates', err);
        setDateError('Failed to load available dates');
      } finally {
        setDateOptionsLoading(false);
      }
    };

    fetchAvailableDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minDate = availableDates.length ? new Date(availableDates[0]) : undefined;
  const maxDate = availableDates.length
    ? new Date(availableDates[availableDates.length - 1])
    : undefined;

  const handleDateChange = (date) => {
    if (!date) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(date);
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setSummaryError(null);

        const params = {};
        const dStr = toYMD(selectedDate);
        if (dStr) params.date = dStr;

        const res = await axios.get(`${API_BASE}/system-summary/`, { params });
        setUsageSummary(res.data.usage || null);
        setSystemSummary(res.data.system || null);
        setDownloadsSummary(res.data.downloads || null);
        setRouteFailures(res.data.by_route || []);
      } catch (err) {
        console.error('Failed to load system summary', err);
        setSummaryError('Failed to load metrics');
      } finally {
        setLoadingSummary(false);
      }
    };

    if (!dateOptionsLoading) {
      fetchSummary();
    }
  }, [selectedDate, dateOptionsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchSessionsSeries = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError(null);

        const params = {};
        const dStr = toYMD(selectedDate);
        if (dStr) params.date = dStr;
        params.view = timeView.toLowerCase();

        const res = await axios.get(`${API_BASE}/sessions-over-time/`, { params });
        const points = res.data.points || [];

        const parsed = points.map((p, idx) => ({
          id: idx,
          label: p.label || `Bucket ${idx + 1}`,
          sessions: Number(p.sessions || 0),
          clicks: Number(p.clicks || 0),
        }));

        setSessionsSeries(parsed);
      } catch (err) {
        console.error('Failed to load sessions series', err);
        setSessionsError('Failed to load sessions series');
        setSessionsSeries([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    if (!dateOptionsLoading) {
      fetchSessionsSeries();
    }
  }, [selectedDate, timeView, dateOptionsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const failureComparisonData = routeFailures.map((r) => ({
    category: r.route || 'Unknown',                  // keep full route for tooltip
    categoryLabel: lastPathSegment(r.route),         // ✅ x-axis label (only last part)
    total: r.total || 0,
    errors_5xx: r.errors_5xx || 0,
  }));

  // === BigMetricCard ===
  const BigMetricCard = ({ title, value }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'linear-gradient(135deg, #0a77b6 0%, #06b6d4 100%)',
          padding: '22px 18px',
          borderRadius: '14px',
          boxShadow: isHovered
            ? '0 20px 40px rgba(6, 182, 212, 0.30), inset 0 1px 0 rgba(255,255,255,0.3)'
            : '0 8px 20px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'all 0.32s ease',
          cursor: 'pointer',
          textAlign: 'center',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '14px 14px 0 0',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '18px', fontFamily : "var(--app-font-family)", color: 'rgba(255,255,255,0.95)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {title}
          </div>
          <div style={{ fontSize: '20px', fontFamily : "var(--app-font-family)", fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  // === SmallMetricCard ===
  const SmallMetricCard = ({ title, value, icon, valueColor = colors.green }) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(247,251,255,0.85) 100%)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 6px 20px rgba(2,6,23,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            borderRadius: '12px 12px 0 0',
          }}
        />

        <div style={{
          position: 'relative',
          width: 72,
          height: 72,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(145deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 12px rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.2)',
        }}>
          <div dangerouslySetInnerHTML={{ __html: icon }} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 18, fontFamily : "var(--app-font-family)", color: colors.primary, fontWeight: 800 }}>
            {title}
          </div>

          <div style={{ fontSize: 18, color: valueColor, fontFamily : "var(--app-font-family)", fontWeight: 900, textAlign: 'right', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title }) => (
    <h3
      style={{
        ...styles.chartTitle,
        fontSize: '20px',
        fontFamily : "var(--app-font-family)",
        marginBottom: '8px',
      }}
    >
      {title}
    </h3>
  );

  const pieData = [
    { name: 'Active Users', value: (usageSummary && usageSummary.active_users) || 0 },
    { name: 'Total Sessions', value: (usageSummary && usageSummary.total_sessions) || 0 },
  ];
  const pieColors = ['#06b6d4', '#075988'];

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const renderDonutLabels = (props) => {
  const { cx, cy, midAngle, outerRadius, index, payload, percent, viewBox } = props;
  const RAD = Math.PI / 180;

  // these keep labels close so they don't run out
  const rArc = outerRadius * 0.95;
  const rElbow = outerRadius + 6;
  const rLabel = outerRadius + 18;

  const sx = cx + rArc * Math.cos(-midAngle * RAD);
  const sy = cy + rArc * Math.sin(-midAngle * RAD);

  const mx = cx + rElbow * Math.cos(-midAngle * RAD);
  const my = cy + rElbow * Math.sin(-midAngle * RAD);

  let lx = cx + rLabel * Math.cos(-midAngle * RAD);
  const ly = cy + rLabel * Math.sin(-midAngle * RAD);

  // ✅ clamp label x INSIDE SVG width if available
  const vbW = viewBox?.width; // recharts usually passes this
  if (typeof vbW === "number" && vbW > 0) {
    lx = clamp(lx, 12, vbW - 12);
  }

  const isLeft = lx < cx;
  const textAnchor = isLeft ? "end" : "start";

  const sliceColor = pieColors[index] || "#075988";
  const titleColor = colors.primary || "#0a77b6";
  const pct = `${(percent * 100).toFixed(2)}%`;

  return (
    <g>
      <polyline
        points={`${sx},${sy} ${mx},${my} ${lx},${ly}`}
        fill="none"
        stroke={sliceColor}
        strokeWidth={1.6}
      />
      <circle cx={mx} cy={my} r={4} fill={sliceColor} stroke="#fff" strokeWidth={1} />

      <text
        x={lx + (isLeft ? -6 : 6)}
        y={ly - 6}
        textAnchor={textAnchor}
        fontSize={12}
        fontFamily = "var(--app-font-family)"
        fontWeight={800}
        fill={titleColor}
      >
        {payload?.name}
      </text>

      <text
        x={lx + (isLeft ? -6 : 6)}
        y={ly + 12}
        textAnchor={textAnchor}
        fontSize={12}
        fontFamily = "var(--app-font-family)"
        fontWeight={900}
        fill={sliceColor}
      >
        {pct}
      </text>
    </g>
  );
};




  return (
    <FluentProvider theme={webLightTheme}>
      <div
        style={{
          minHeight: '100vh',
          background: colors.background,
          padding: '36px 20px 60px 20px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '18px', padding: '0 10px' }}>
          <div style={styles.headerRow}>
            <div>
              <button
                style={styles.backButtonStyle}
                onClick={() => window.history.back()}
              >
                ← Back
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <h1 style={styles.title}>Web Usage Metrics</h1>
              </div>
            </div>
            <div />
          </div>

          <div style={styles.headerDateRow}>
            <span style={{ color: '#1f2933', fontSize: '12px', fontFamily : "var(--app-font-family)", fontWeight: 600 }}>
              Date
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <DatePicker
                className={fluentStyles.control}
                
                placeholder={dateOptionsLoading ? 'Loading dates...' : 'Select a date...'}
                value={selectedDate}
                onSelectDate={(d) => setSelectedDate(d || null)}
                minDate={minDate}
                maxDate={maxDate}
                allowTextInput={false}
                isDateDisabled={(date) => {
                  if (!date || !availableDates.length) return false;
                  const key = toYMD(date);
                  return !availableDates.includes(key);
                }}
              />
              {dateError && (
                <span style={{ color: 'red', fontSize: 11 }}>{dateError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(360px, 1fr)',
            gap: '20px',
            alignItems: 'stretch',
            alignContent: 'stretch',
          }}
        >
          {/* MAIN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
            {/* 1) System Performance */}
            <div style={cardStyles.sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <SectionHeader title="System Performance (Selected Date / Last 24h)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <BigMetricCard title="Requests" value={loadingSummary || !systemSummary ? '...' : formatNumber(systemSummary.requests_last_24h)} />
                <BigMetricCard title="Avg API Response Time" value={loadingSummary || !systemSummary ? '...' : `${formatFixed(systemSummary.avg_api_ms, 0)} ms`} />
                <BigMetricCard title="Error Rate" value={loadingSummary || !systemSummary ? '...' : `${formatFixed(systemSummary.error_rate_5xx, 2)}%`} />
                <BigMetricCard title="5xx Errors" value={loadingSummary || !systemSummary ? '...' : formatNumber(systemSummary.server_errors_5xx)} />
                <BigMetricCard title="Downtime (min)" value={loadingSummary || !systemSummary ? '...' : `${formatNumber(systemSummary.downtime_minutes)} min`} />
              </div>
            </div>

            {/* 2) Hours Spent */}
            <div style={cardStyles.sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <SectionHeader title="Hours Spent" />
              </div>

              {moduleHoursError && (
                <div style={{ color: 'red', fontSize: '12px', fontFamily : "var(--app-font-family)", marginBottom: '8px' }}>
                  {moduleHoursError}
                </div>
              )}
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      stroke="#161e2bff"
                      angle={-15}
                      textAnchor="end"
                      height={72}
                      style={{ fontSize: '14px' }}
                    />
                    <YAxis stroke={colors.text} style={{ fontSize: '12px' , fontFamily : "var(--app-font-family)", }} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily : "var(--app-font-family)", }}
                      formatter={(value) => [`${value}`, 'Hours']}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px', fontFamily : "var(--app-font-family)", }} />
                    <Bar dataKey="hours" fill="url(#branchGradient)" radius={[6, 6, 2, 2]} name="Hours" />
                    <defs>
                      <linearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3) Peak Sessions Over Time */}
            <div style={cardStyles.sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <SectionHeader title="Peak Sessions Over Time" />
              </div>

              {sessionsError && (
                <div style={{ color: 'red', fontSize: '12px', fontFamily : "var(--app-font-family)", marginBottom: '8px' }}>
                  {sessionsError}
                </div>
              )}

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionsSeries}>
                    <defs>
                      <linearGradient id="tieupsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke={colors.text} style={{ fontSize: '14px' }} />
                    <YAxis yAxisId="left" stroke={colors.text} style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily : "var(--app-font-family)", fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '13px', fontFamily : "var(--app-font-family)", }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="sessions"
                      stroke="#075988"
                      fill="url(#tieupsAreaGradient)"
                      strokeWidth={1.8}
                      dot={{ fill: colors.primary, r: 3.6 }}
                      name="Sessions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4) Failure Comparison */}
            <div style={cardStyles.sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <SectionHeader title="Failure Comparison (By Route)" />
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureComparisonData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.06} />
                      </linearGradient>

                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.red} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={colors.red} stopOpacity={0.06} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                    {/* ✅ Use categoryLabel for X-axis (last segment only) */}
                    <XAxis
                      dataKey="categoryLabel"
                      stroke={colors.text}
                      fontFamily = "var(--app-font-family)"
                      angle={-15}
                      textAnchor="end"
                      height={72}
                      style={{ fontSize: '14px' }}
                      interval={0}
                    />

                    <YAxis stroke={colors.text} style={{ fontSize: '12px', fontFamily : "var(--app-font-family)", }} />

                    {/* ✅ Tooltip still shows full route */}
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily : "var(--app-font-family)",
                      }}
                      labelFormatter={(label, payload) => {
                        const full = payload?.[0]?.payload?.category;
                        return full ? full : label;
                      }}
                    />

                    <Legend wrapperStyle={{ fontSize: '13px' }} />

                    <Bar dataKey="total" fill="url(#colorTotal)" fontFamily = "var(--app-font-family)" radius={[6, 6, 4, 4]} name="Total Requests" />
                    <Bar dataKey="errors_5xx" fill="url(#colorErrors)" fontFamily = "var(--app-font-family)" radius={[6, 6, 4, 4]} name="5xx Errors" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (kept same as your original) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch', height: '100%' }}>
            <div style={{ ...cardStyles.glassCard, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ ...styles.chartTitle, fontSize: '28px', fontFamily : "var(--app-font-family)", margin: 0 }}>Summary</h3>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, marginTop: 8 }}>
                  <SectionHeader title="Users vs Sessions" />
                </div>

                <div style={{ width: "100%", height: 320 }}>
  <ResponsiveContainer width="100%" height="100%">
    <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
      <defs>
        <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#06b6d4" stopOpacity="0.95" />
          <stop offset="95%" stopColor="#06b6d4" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#075988" stopOpacity="0.95" />
          <stop offset="95%" stopColor="#075988" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <Pie
        data={pieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        fontFamily = "var(--app-font-family)"
        innerRadius={58}
        outerRadius={86}
        labelLine={false}
        label={renderDonutLabels}
        startAngle={90}
        endAngle={-270}
      >
        <Cell fill="url(#gradActive)" />
        <Cell fill="url(#gradSessions)" />
      </Pie>

      <Tooltip
        contentStyle={{
          background: "white",
          border: "1px solid #e5e7eb",
          fontFamily : "var(--app-font-family)",
          borderRadius: "8px",
        }}
        formatter={(value, name) => [`${value}`, name]}
      />
    </PieChart>
  </ResponsiveContainer>
</div>

</div>

              <hr style={{ border: 'none', borderTop: '1px solid #eef2f7', margin: '20px 0 6px 0' }} />

              <div style={{ display: 'grid', gap: 14 }}>
                <SmallMetricCard
                  title="Active Users"
                  value={loadingSummary || !usageSummary ? '...' : formatNumber(usageSummary.active_users)}
                  icon={`<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12z" fill="#075988"/><path d="M3.6 20.4c0-2.88 2.52-5.28 7.2-5.28s7.2 2.4 7.2 5.28v.6H3.6v-.6z" fill="#06b6d4"/></svg>`}
                  valueColor={colors.green}
                />

                <SmallMetricCard
                  title="Total Sessions"
                  value={loadingSummary || !usageSummary ? '...' : formatNumber(usageSummary.total_sessions)}
                  icon={`<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18" stroke="#075988" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 6l6 6 6-6" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>`}
                  valueColor={colors.green}
                />

                <SmallMetricCard
                  title="Avg. Session Duration"
                  value={loadingSummary || !usageSummary ? '...' : formatDuration(usageSummary.avg_session_duration_sec)}
                  icon={`<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#06b6d4"/><path d="M12 7v6l4 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>`}
                  valueColor={colors.green}
                />

                <SmallMetricCard
                  title="Total CSV Downloads"
                  value={loadingSummary || !downloadsSummary ? '...' : formatNumber(downloadsSummary.total_csv_downloads)}
                  icon={`<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="#075988" strokeWidth="1.6" strokeLinecap="round"/><path d="M8 11l4 4 4-4" stroke="#06b6d4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="14" width="16" height="6" rx="2" stroke="#075988" strokeWidth="1.2"/></svg>`}
                  valueColor={colors.green}
                />

                <SmallMetricCard
                  title="Failed Downloads"
                  value={loadingSummary || !downloadsSummary ? '...' : formatNumber(downloadsSummary.failed_csv_downloads)}
                  icon={`<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="#fee2e2"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>`}
                  valueColor={colors.red}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </FluentProvider>
  );
};

export default WebUsageMetrics;
