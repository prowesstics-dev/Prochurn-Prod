import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList, Label, AreaChart, Area } from 'recharts';
import {
  Filter, TrendingUp, TrendingDown, Users, AlertTriangle, Gauge,
  Download, ArrowLeft, Settings,
  Files, FileText, Layers, Database, ClipboardList, BookOpen
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Select, Spin, Modal, Table, Button, Space } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import CustomButton from "./CustomButton";

// Professional color palette
const colors = {
  primary: '#075988',
  primaryLight: '#075988',
  primaryDark: '#075988',
  secondary: '#075988',
  secondaryLight: '#075988',
  secondaryDark: '#075988',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#075988',
  purple: '#7c3aed',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#161e2bff',
  gray700: '#334155',
  gray800: '#161e2bff',
  gray900: '#0f172a',
};

// Professional chart color palette
const chartColors = [
  '#075988', '#06b6d4', '#087ea4', '#0d9488', '#1d4ed8', '#4338ca', '#6d28d9', '#3b82f6',
];

// Internal styles with professional theme
const styles = {
  container: {
    top: '30px',
    minHeight: '100vh',
    background: colors.gray50,
    position: 'relative',
    padding: '0 0 90px 0',
  },
  fullBleed: {
    width: '90vw',
    marginLeft: 'calc(-42vw + 45%)'
  },

  contentWrapper: {
    position: 'relative',
    zIndex: 10,
    padding: '10px 24px 24px 24px',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    transition: 'all 0.3s ease-in-out',
  },
  blurredContent: {
    filter: 'blur(2px)',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    WebkitTextStroke: '0.5px rgba(0,0,0,0.1)',
    backgroundClip: 'text',
    marginBottom: '50px',
    fontSize: '40px',
    fontWeight: '700',
    letterSpacing: '-1px',
    lineHeight: '1.5',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
  },
  drillHeaderContainer: {
    display: 'flex',
    maxWidth: '90vw',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px 0',
    borderBottom: `2px solid ${colors.primary}`,
  },
  drillTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: colors.primary,
    margin: 0,
  },
  drillActions: {
    display: 'flex',
    gap: '12px',
  },
  backButton: {
    backgroundColor: colors.gray600,
    borderColor: colors.gray600,
    color: 'white',
  },
  downloadButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    color: 'white',
  },
  customizeButton: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
    color: 'white',
  },
  filtersContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '32px',
    justifyContent: 'flex-end'
  },
  filterWrapper: {
    position: 'relative',
    transition: 'transform 0.2s ease'
  },
  filterIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.primary,
    width: '20px',
    height: '20px',
    transition: 'color 0.3s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '18px',
  },
  kpiCard: {
    borderRadius: '12px',
    padding: '24px',
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transform: 'scale(1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    width: '75%',
    height: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: '#075988',
  },
  kpiCardHover: {
    transform: 'scale(1.05) translateY(-4px)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
  },
  kpiContent: {
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kpiLabel: {
    fontSize: '1.5rem',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
    transition: 'opacity 0.3s ease',
    padding: '0 0 0 0',
  },
  kpiValue: {
    fontSize: '1.6rem',
    fontWeight: '700',
    transition: 'transform 0.3s ease',
    textAlign: 'center',
    padding: '0 0 50px 0',
  },
  kpiIcon: {
    width: '40px',
    height: '40px',
    opacity: 0.9,
    transition: 'all 0.3s ease'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '28px',
    marginTop: '24px'
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${colors.gray200}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'visible'
  },
  chartTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },
  legendGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    marginRight: '8px',
    transition: 'transform 0.3s ease'
  },
  legendText: {
    color: colors.gray700,
    fontSize: '14px',
    fontWeight: '500',
    transition: 'color 0.3s ease'
  },
  tooltipContainer: {
    backgroundColor: colors.white,
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.gray200}`,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
    animation: 'tooltipSlideIn 0.2s ease'
  },
  tooltipLabel: {
    color: colors.gray800,
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '14px'
  },
  tooltipEntry: {
    color: colors.gray600,
    fontSize: '13px'
  },
  churnReasonsContainer: {
    padding: '20px 0'
  },
  churnReasonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '24px'
  },
  churnReasonCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${colors.gray200}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  churnReasonTitle: {
    color: '#075988',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.4',
    flex: 1,
    marginRight: '12px',
    transition: 'color 0.3s ease'
  },
  churnReasonPercentage: {
    color: '#074264ff',
    fontSize: '24px',
    fontWeight: 'bold',
    minWidth: 'fit-content',
    transition: 'all 0.3s ease'
  },
  chartContainer: {
    borderRadius: '8px',
    overflow: 'visible',
    padding: '10px 10px 0 0',
  },
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${colors.gray200}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginTop: '24px'
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    textAlign: 'center'
  },
  errorText: {
    marginBottom: '16px',
    color: colors.danger,
    fontSize: '18px'
  }
};

// UPDATED MetricCard – used for all 4 KPI cards
const MetricCard = ({ title, value, onClick, disabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const clickable = !!onClick && !disabled;

  const handleClick = () => {
    if (clickable) onClick();
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(135deg, #0a77b6 0%, #06b6d4 100%)',
        padding: '28px 24px',
        borderRadius: '20px',
        boxShadow: isHovered
          ? '0 20px 40px rgba(6, 182, 212, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset'
          : '0 10px 30px rgba(6, 182, 212, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: clickable ? 'pointer' : 'default',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      {/* Animated gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 60%)',
          opacity: isHovered ? 1 : 0.6,
          transition: 'opacity 0.4s ease'
        }}
      />

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
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '38px',
            color: 'white',
            fontWeight: '800',
            marginBottom: '8px',
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};


// (allColumnsConfig, mandatoryKeys etc. left as-is – unchanged)
const allColumnsConfig = {
  policy_no: {
    title: 'Policy No',
    dataIndex: 'policy no',
    key: 'policy no',
    width: 120,
    fixed: 'left',
    ellipsis: true,
  },
  product_name: {
    title: 'Product',
    dataIndex: 'product name 2',
    key: 'Product',
    width: 120,
    ellipsis: true,
  },

  policy_tenure: {
    title: (<div style={{ whiteSpace: 'normal', textAlign: 'center' }}>Policy Tenure</div>),
    dataIndex: 'policy_tenure',
    key: 'Policy Tenure',
    width: 70,
    ellipsis: true,
  },
  main_reason: {
    title: 'Main Reason',
    dataIndex: 'main_reason',
    key: 'Main Reason',
    width: 120,
    ellipsis: true,
  },
  churn_probability: {
    title: (<div style={{ whiteSpace: 'normal', textAlign: 'center' }}>Churn Probablity</div>),
    dataIndex: 'churn_probability',
    width: 107,
    render: value => `${Math.round(value * 100)}%`,
    align: 'center',
    sorter: (a, b) => (a.churn_probability ?? 0) - (b.churn_probability ?? 0),
    sortDirections: ['descend', 'ascend']
  },
  biztype: {
    title: 'Business Type',
    dataIndex: 'biztype',
    key: 'Business Type',
    width: 110,
    ellipsis: true,
  },
  age: {
    title: 'Vehicle Age',
    dataIndex: 'age',
    key: 'Vehicle Age',
    width: 110,
    sorter: (a, b) => (a.age ?? 0) - (b.age ?? 0),
  },
  customer_tenure: {
    title: (<div style={{ whiteSpace: 'normal', textAlign: 'center' }}>Customer Tenure</div>),
    dataIndex: 'customer_tenure',
    key: 'Customer Tenure',
    width: 90,
  },
  cleaned_reg_no: {
    title: 'Registration No',
    dataIndex: 'cleaned_reg_no',
    key: 'Registration No',
    width: 110,
    ellipsis: true,
  },
  total_premium_payable: {
    title: 'Premium (₹)',
    dataIndex: 'total_premium_payable',
    key: 'Premium (₹)',
    width: 120,
    render: (value) => `₹${(value ?? 0).toLocaleString('en-IN')}`,
    sorter: (a, b) => (a.total_premium_payable ?? 0) - (b.total_premium_payable ?? 0),
  },
  cleaned_branch_name_2: {
    title: 'Branch',
    dataIndex: 'cleaned_branch_name_2',
    key: 'Branch',
    width: 70,
    ellipsis: true,
  },
  cleaned_state2: {
    title: 'State',
    dataIndex: 'cleaned_state2',
    key: 'State',
    width: 70,
    ellipsis: true,
  },
  tie_up: {
    title: 'Tie Ups',
    dataIndex: 'tie_up',
    key: 'Tie Ups',
    width: 90,
    ellipsis: true,
  },
  make_clean: {
    title: 'Manufacturer',
    dataIndex: 'make_clean',
    key: 'Manufacturer',
    width: 130,
    ellipsis: true,
  },
  vehicle_idv: {
    title: 'Vehicle IDV',
    dataIndex: 'vehicle_idv',
    key: 'Vehicle IDV',
    width: 90,
    ellipsis: true,
  },
  cleaned_zone_2: {
    title: 'Zone',
    dataIndex: 'cleaned_zone_2',
    key: 'Zone',
    width: 70,
    ellipsis: true,
  },
  number_of_claims: {
    title: 'Claim Count',
    dataIndex: 'number_of_claims',
    key: 'Claim Count',
    width: 90,
    ellipsis: true,
  },
  corrected_name: {
    title: 'Customer Name',
    dataIndex: 'corrected_name',
    key: 'Customer Name',
    width: 120,
    ellipsis: true,
  },
  primary_recommendation: {
    title: 'Recommendation',
    dataIndex: 'primary_recommendation',
    key: 'Recommendation',
    align: 'left',
    width: 240,
    ellipsis: true,
  },
  additional_offers: {
    title: 'Additional Offer',
    dataIndex: 'additional_offers',
    key: 'Additional Offer',
    width: 240,
    ellipsis: true,
  },
  top_3_reasons: {
    title: 'Top 3 Reasons',
    dataIndex: 'top_3_reasons',
    key: 'Top 3 Reasons',
    width: 140,
    ellipsis: true,
  },
  policy_end_date: {
    title: (<div style={{ whiteSpace: 'normal', textAlign: 'center' }}>Policy End Date</div>),
    dataIndex: 'policy_end_date',
    key: 'Policy End Date',
    width: 100,
    render: (_, r) => r.policy_end_date ? String(r.policy_end_date) : '-',
  },
};

// What you considered mandatory on the other screen
const mandatoryKeys = [
  'policy_no',
  'corrected_name',
  'product_name',
  'primary_recommendation',
  'additional_offers',
  'policy_end_date'
];


const ChurnPatternAnalysis = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const CURRENT_YEAR = new Date().getFullYear();
  const DEFAULT_YEAR = String(CURRENT_YEAR - 1);

  // Dashboard state
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drillthrough state
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [drillData, setDrillData] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [currentDrillQuery, setCurrentDrillQuery] = useState(null);

  // Column customization
  const [columnCustomizationVisible, setColumnCustomizationVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Hover states (charts / filters / legends only)
  const [hoveredChart, setHoveredChart] = useState(null);
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [hoveredLegendItem, setHoveredLegendItem] = useState(null);

  const { isCollapsed, scrollRef } = useOutletContext() || {};

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scrollRef]);

  const fetchData = useCallback(async (yearParam = null, stateParam = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (yearParam) params.append('year', String(yearParam));
      if (stateParam) params.append('state', String(stateParam));

      const response = await fetch(`${API_BASE_URL}/dashboard/?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response - check if API endpoint exists');
      }

      const data = await response.json();
      setDashboardData(data);

      if (selectedYear === null || selectedState === null) {
        const apiYears = (data.availableYears || []).map(String);
        const initYear = apiYears.includes(DEFAULT_YEAR)
          ? DEFAULT_YEAR
          : (apiYears[0] || null);

        const apiStates = data.availableStates || [];
        const initState = apiStates.length > 0 ? apiStates[0] : null;

        if (selectedYear === null) setSelectedYear(initYear);
        if (selectedState === null) setSelectedState(initState);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, selectedYear, selectedState, DEFAULT_YEAR]);

  const toCamelLabel = (s) => {
    if (s == null) return '';
    return String(s)
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };


  const fetchDrillData = async (drillQuery) => {
    try {
      setDrillLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add common parameters
      if (drillQuery.year) params.append('year', drillQuery.year);
      if (drillQuery.state) params.append('state', drillQuery.state);
      params.append('type', drillQuery.type);

      // Add type-specific parameters
      switch (drillQuery.type) {
        case 'total':
          params.append('total', 'true');
          break;
        case 'churned':
          params.append('churned', 'true');
          break;
        case 'new':
          params.append('new', 'true');
          break;
        case 'firstyear':
          params.append('firstyear', 'true');
          break;
        case 'branch':
          params.append('branch', drillQuery.branch);
          break;
        case 'product':
          params.append('product', drillQuery.product);
          break;
        case 'vehicle_age':
          params.append('vehicle_age', drillQuery.age);
          break;
        case 'claim_status':
          params.append('claim_status', drillQuery.claimStatus);
          break;
        case 'business':
          params.append('business', drillQuery.businessType);
          break;
        case 'tieup':
          params.append('tieup', drillQuery.tieup);
          break;
      }

      const response = await fetch(`${API_BASE_URL}/drillthrough/?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setDrillData(data.results || []);
      setCurrentDrillQuery(drillQuery);
      setIsDrillMode(true);

      // Generate dynamic title
      const stateLbl = toCamelLabel(drillQuery.state);
      const branchLbl = drillQuery.branch != null ? toCamelLabel(drillQuery.branch) : '';
      const productLbl = drillQuery.product != null ? toCamelLabel(drillQuery.product) : '';
      const bizLbl = drillQuery.businessType != null ? toCamelLabel(drillQuery.businessType) : '';
      const claimLbl = drillQuery.claimStatus != null ? toCamelLabel(drillQuery.claimStatus) : '';
      const tieupLbl = drillQuery.tieup != null ? toCamelLabel(drillQuery.tieup) : '';
      const ageLbl = drillQuery.age != null ? String(drillQuery.age) : '';

      const titleMap = {
        total: `Total Policies — ${stateLbl} (${drillQuery.year})`,
        churned: `Churned Policies — ${stateLbl} (${drillQuery.year})`,
        new: `New Customers — ${stateLbl} (${drillQuery.year})`,
        firstyear: `First Year Churn — ${stateLbl} (${drillQuery.year})`,
        branch: `Branch Churn: ${branchLbl} — ${stateLbl} (${drillQuery.year})`,
        product: `Product Churn: ${productLbl} — ${stateLbl} (${drillQuery.year})`,
        vehicle_age: `Vehicle Age Churn: ${ageLbl} Years — ${stateLbl} (${drillQuery.year})`,
        claim_status: `Claim Status Churn: ${claimLbl} — ${stateLbl} (${drillQuery.year})`,
        business: `Business Type Churn: ${bizLbl} — ${stateLbl} (${drillQuery.year})`,
        tieup: `Tieup Churn: ${tieupLbl} — ${stateLbl} (${drillQuery.year})`,
      };

      setDrillTitle(titleMap[drillQuery.type] || `Drillthrough — ${stateLbl} (${drillQuery.year})`);

      // Set default visible columns
      if (data.results && data.results.length > 0) {
        const columns = Object.keys(data.results[0]);
        setVisibleColumns(columns);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching drill data:', err);
    } finally {
      setDrillLoading(false);
    }
  };


  const handleDrillClick = (drillQuery) => {
    const queryWithDefaults = {
      ...drillQuery,
      year: selectedYear,
      state: selectedState
    };
    fetchDrillData(queryWithDefaults);
  };

  const handleBackToDashboard = () => {
    setIsDrillMode(false);
    setDrillData([]);
    setCurrentDrillQuery(null);
    setDrillTitle('');
  };

  const downloadCSV = () => {
    if (!drillData.length) return;

    const headers = visibleColumns.join(',');
    const csvContent = [
      headers,
      ...drillData.map(row =>
        visibleColumns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${drillTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial data fetch on mount
  useEffect(() => {
    if (!isDrillMode) {
      fetchData();
    }
  }, [isDrillMode]);

  // Handle filter changes
  useEffect(() => {
    if (selectedYear && selectedState && !isDrillMode) {
      fetchData(selectedYear, selectedState);
    }
  }, [selectedYear, selectedState, fetchData, isDrillMode]);

  // Table columns configuration
  const getTableColumns = () => {
    if (!drillData.length) return [];

    const allCols = Object.keys(drillData[0]).filter(col => visibleColumns.includes(col));

    return allCols.map((col, idx) => {
      const isFirst = idx === 0;
      return {
        title: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        dataIndex: col,
        key: col,
        width: isFirst ? 180 : 160,
        fixed: isFirst ? 'left' : undefined,
        sorter: (a, b) => {
          const aVal = a[col]; const bVal = b[col];
          if (aVal === null || aVal === undefined) return -1;
          if (bVal === null || bVal === undefined) return 1;
          if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
          return String(aVal).localeCompare(String(bVal));
        },
        render: (text) => (text === null || text === undefined ? '-' : String(text)),
        ellipsis: true,
      };
    });
  };


  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    const RADIAN = Math.PI / 180;
    const r = (innerRadius || 0) + ((outerRadius - (innerRadius || 0)) * 0.5);
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="bold">
        {value}
      </text>
    );
  };

  const outsideLabel = (props) => {
    const RAD = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, name, value } = props;

    const cos = Math.cos(-midAngle * RAD);
    const sin = Math.sin(-midAngle * RAD);
    const sx = cx + outerRadius * cos;
    const sy = cy + outerRadius * sin;
    const ex = cx + (outerRadius + 25) * cos;
    const ey = cy + (outerRadius + 25) * sin;
    const isRight = cos >= 0;
    const tx = ex + (isRight ? 16 : -16);
    const ty = ey;

    return (
      <g>
        <path d={`M${sx},${sy} L${ex},${ey} L${tx},${ty}`} stroke={colors.primary} strokeWidth={1.6} fill="none" />
        <text
          x={tx + (isRight ? 8 : -8)}
          y={ty}
          textAnchor={isRight ? "start" : "end"}
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          fill={colors.gray800}
        >
          {name}: {value}
        </text>
      </g>
    );
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltipContainer}>
          <p style={styles.tooltipLabel}>{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={styles.tooltipEntry}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  marginRight: '8px',
                  backgroundColor: entry.color,
                }}
              ></span>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
          <p style={{ marginTop: "8px", fontSize: "12px", color: colors.gray500, fontStyle: "italic" }}>
            Click for detailed data
          </p>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={styles.errorContainer}>
            <div>
              <div style={styles.errorText}>Error loading data:</div>
              <div>{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData && !loading && !isDrillMode) {
    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={styles.errorContainer}>No data available</div>
        </div>
      </div>
    );
  }



  const yearOptions = (dashboardData?.availableYears || [])
    .map(String)
    .map(y => ({ label: y, value: y }));

  const stateOptions = (dashboardData?.availableStates || [])
    .map((state) => {
      const value = String(state);
      return { label: toCamelLabel(value), value };
    });

  const enhancedKeyframes = `
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
    @keyframes tooltipSlideIn { 0%{opacity:0;transform:translateY(-10px) scale(0.95);} 100%{opacity:1;transform:translateY(0) scale(1);} }
    @keyframes spinPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
  `;

  return (
    <div style={styles.container}>
      <style>{enhancedKeyframes}</style>

      <div style={{
        ...styles.contentWrapper,
        ...(loading || drillLoading ? styles.blurredContent : {})
      }}>

        {/* Conditional rendering based on drill mode */}
        {isDrillMode ? (
          <>
            <div style={styles.drillHeaderContainer}>
              <h1 style={styles.drillTitle}>{drillTitle}</h1>
              <div style={styles.drillActions}>
                <Button
                  style={styles.backButton}
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToDashboard}
                >
                  Back
                </Button>
                <Button
                  style={styles.downloadButton}
                  icon={<DownloadOutlined />}
                  onClick={downloadCSV}
                  disabled={!drillData.length}
                >
                  Download CSV
                </Button>
              </div>
            </div>

            <div style={{ ...styles.tableContainer, ...styles.fullBleed }}>
              <Table
                dataSource={drillData}
                columns={getTableColumns()}
                rowKey={(record, index) => index}
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`
                }}
                scroll={{ x: 'max-content' }}
                loading={drillLoading}
                bordered
                size="middle"
              />
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h1 style={styles.title}>
                  Churn Pattern Analysis Dashboard
                </h1>
              </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersContainer}>
              <div
                style={{
                  ...styles.filterWrapper,
                  ...(hoveredFilter === 'year' ? { transform: 'translateY(-2px)' } : {})
                }}
                onMouseEnter={() => setHoveredFilter('year')}
                onMouseLeave={() => setHoveredFilter(null)}
              >
                <Filter style={styles.filterIcon} />
                <Select
                  value={selectedYear || undefined}
                  onChange={(v) => setSelectedYear(String(v))}
                  options={yearOptions}
                  style={{ width: 150, marginLeft: '40px' }}
                  placeholder="Select Year"
                  suffixIcon={null}
                />
              </div>

              <div
                style={{
                  ...styles.filterWrapper,
                  ...(hoveredFilter === 'state' ? { transform: 'translateY(-2px)' } : {})
                }}
                onMouseEnter={() => setHoveredFilter('state')}
                onMouseLeave={() => setHoveredFilter(null)}
              >
                <Filter style={styles.filterIcon} />
                <Select
                  value={selectedState || undefined}
                  onChange={setSelectedState}
                  options={stateOptions}
                  style={{ width: 200, marginLeft: '40px' }}
                  placeholder="Select State"
                  suffixIcon={null}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>
            </div>

            {/* KPI Cards – NOW USING MetricCard THEME */}
            <div style={styles.kpiGrid}>
              <MetricCard
                title="Total Policies"
                value={dashboardData?.totalPolicies?.toLocaleString() || '0'}
                onClick={() => handleDrillClick({ type: 'total' })}
              />

              <MetricCard
                title="Churned Policies"
                value={dashboardData?.churned?.toLocaleString() || '0'}
                onClick={() => handleDrillClick({ type: 'churned' })}
              />

              <MetricCard
                title="First Year Churn"
                value={dashboardData?.firstYearChurn?.toLocaleString() || '0'}
                onClick={() => handleDrillClick({ type: 'firstyear' })}
              />

              <MetricCard
                title="Churn Rate"
                value={dashboardData?.churnRate || '0'}
                disabled
              />
            </div>

            {/* Charts Grid */}
            <div style={styles.chartsGrid}>

              {/* Top Branches by Churn */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'branch' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3 style={styles.chartTitle}>
                    Top Branches by Churn
                  </h3>
                </div>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dashboardData?.branchChurnData || []} margin={{ top: 50, right: 24, left: 8, bottom: 80 }}>
                      <XAxis
                        dataKey="branch"
                        stroke={colors.gray600}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar
                        dataKey="churn"
                        fill="url(#branchGradient)"
                        radius={[4, 4, 0, 0]}
                      >
                        {dashboardData?.branchChurnData?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            onClick={() => handleDrillClick({
                              type: "branch",
                              branch: entry.branch,
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                        <LabelList
                          dataKey="churn"
                          position="top"
                          fill={colors.gray700}
                          fontSize={12}
                          fontWeight="bold"
                          offset={10}
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

              {/* Business Type Donut */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'business' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <h3 style={styles.chartTitle}>
                  Business Type - Churned Policies
                </h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <defs>
                        {(dashboardData?.businessTypeChurnData || []).map((entry, index) => (
                          <linearGradient
                            key={`biz-grad-${index}`}
                            id={`biz-grad-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.3}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={dashboardData?.businessTypeChurnData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={outsideLabel}
                      >
                        {(dashboardData?.businessTypeChurnData || []).map((entry, index) => (
                          <Cell
                            key={`cell-biz-${index}`}
                            fill={`url(#biz-grad-${index})`}
                            onClick={() => handleDrillClick({
                              type: "business",
                              businessType: entry.name,
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.legendGrid}>
                  {(dashboardData?.businessTypeChurnData || []).map((entry, index) => (
                    <div
                      key={entry.name}
                      style={{
                        ...styles.legendItem,
                        ...(hoveredLegendItem === `business-${index}` ? { transform: 'translateX(3px)' } : {})
                      }}
                    >
                      <div
                        style={{
                          ...styles.legendColor,
                          backgroundColor: chartColors[index % chartColors.length],
                        }}
                      ></div>
                      <span style={styles.legendText}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Donut */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'product' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <h3 style={styles.chartTitle}>
                  Product Distribution - Churned Policies
                </h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <defs>
                        {(dashboardData?.productChurnData || []).map((entry, index) => (
                          <linearGradient
                            key={`prod-grad-${index}`}
                            id={`prod-grad-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.3}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={dashboardData?.productChurnData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={outsideLabel}
                      >
                        {(dashboardData?.productChurnData || []).map((entry, index) => (
                          <Cell
                            key={`cell-prod-${index}`}
                            fill={`url(#prod-grad-${index})`}
                            onClick={() => handleDrillClick({
                              type: "product",
                              product: entry.name,
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.legendGrid}>
                  {(dashboardData?.productChurnData || []).map((entry, index) => (
                    <div
                      key={entry.name}
                      style={{
                        ...styles.legendItem,
                        ...(hoveredLegendItem === `product-${index}` ? { transform: 'translateX(3px)' } : {})
                      }}
                    >
                      <div
                        style={{
                          ...styles.legendColor,
                          backgroundColor: chartColors[index % chartColors.length],
                        }}
                      ></div>
                      <span style={styles.legendText}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Claim Status */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'claim' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3 style={styles.chartTitle}>
                    Churned Policies by Claim Status
                  </h3>
                </div>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <defs>
                        {(dashboardData?.claimStatusChurnData || []).map((entry, index) => (
                          <linearGradient
                            key={`claim-grad-${index}`}
                            id={`claim-grad-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor={chartColors[index % chartColors.length]}
                              stopOpacity={0.3}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={dashboardData?.claimStatusChurnData || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={outsideLabel}
                      >
                        {(dashboardData?.claimStatusChurnData || []).map((entry, index) => (
                          <Cell
                            key={`cell-claim-${index}`}
                            fill={`url(#claim-grad-${index})`}
                            onClick={() => handleDrillClick({
                              type: "claim_status",
                              claimStatus: entry.name,
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.legendGrid}>
                  {(dashboardData?.claimStatusChurnData || []).map((entry, index) => (
                    <div
                      key={entry.name}
                      style={{
                        ...styles.legendItem,
                        ...(hoveredLegendItem === `claim-${index}` ? { transform: 'translateX(3px)' } : {})
                      }}
                    >
                      <div
                        style={{
                          ...styles.legendColor,
                          backgroundColor: chartColors[index % chartColors.length],
                        }}
                      ></div>
                      <span style={styles.legendText}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tieups Area */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'tieups' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3 style={styles.chartTitle}>
                    Churned Policies by Tieups
                  </h3>
                </div>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={dashboardData?.tieupsChurnData || []} margin={{ top: 50, right: 30, left: 8, bottom: 80 }}>
                      <defs>
                        <linearGradient id="tieupsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="tieup"
                        stroke={colors.gray600}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="churn"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#tieupsAreaGradient)"
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={6}
                              stroke={colors.primaryDark}
                              strokeWidth={2}
                              fill="white"
                              onClick={() => handleDrillClick({
                                type: "tieup",
                                tieup: payload.tieup,
                              })}
                              style={{ cursor: 'pointer' }}
                            />
                          );
                        }}
                        activeDot={{ r: 4 }}
                      >
                        <LabelList
                          dataKey="churn"
                          position="top"
                          fill={colors.gray700}
                          fontSize={12}
                          fontWeight="bold"
                          offset={15}
                        />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Vehicle Age */}
              <div
                style={{
                  ...styles.chartCard,
                  ...(hoveredChart === 'vehicle' ? { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)' } : {})
                }}
              >
                <h3 style={styles.chartTitle}>
                  Top Vehicle Age by Churned Policies
                </h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData?.vehicleAgeChurnData || []} margin={{ top: 32, right: 24, left: 8, bottom: 32 }}>
                      <XAxis
                        dataKey="age"
                        stroke={colors.gray600}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="churn" fill="url(#vehicleGradient)" radius={[4, 4, 0, 0]}>
                        {dashboardData?.vehicleAgeChurnData?.map((entry, index) => (
                          <Cell
                            key={`cell-veh-${index}`}
                            onClick={() => handleDrillClick({
                              type: "vehicle_age",
                              age: entry.age,
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                        <LabelList
                          dataKey="churn"
                          position="top"
                          fill={colors.gray700}
                          fontSize={12}
                          fontWeight="bold"
                        />
                      </Bar>
                      <defs>
                        <linearGradient id="vehicleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Churn Reasons */}
              <div style={{ ...styles.chartCard, gridColumn: '1 / -1' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3 style={styles.chartTitle}>Top Reasons for Churn - Impact Analysis</h3>
                </div>
                <div style={styles.churnReasonsContainer}>
                  <div style={styles.churnReasonsGrid}>
                    {(dashboardData?.churnReasonsData || []).map((item, index) => (
                      <div
                        key={item.reason}
                        style={{
                          ...styles.churnReasonCard,
                          ...(hoveredChart === `reason-${index}` ? {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                            border: `1px solid ${colors.primary}`,
                            backgroundColor: colors.gray50
                          } : {})
                        }}
                        onMouseEnter={() => setHoveredChart(`reason-${index}`)}
                        onMouseLeave={() => setHoveredChart(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div style={styles.churnReasonTitle}>
                            {item.reason}
                          </div>
                          <div style={styles.churnReasonPercentage}>
                            {item.percentage}%
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ color: colors.gray500, fontSize: '14px', fontWeight: '500' }}>
                            {item.count?.toLocaleString()} policies affected
                          </div>
                        </div>

                        <div style={{
                          height: '4px',
                          backgroundColor: colors.gray200,
                          borderRadius: '2px',
                          marginTop: '12px',
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '2px',
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
                              width: `${item.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {(loading || drillLoading) && (
        <div style={styles.loadingOverlay}>
          <div>
            <Spin
              size="large"
              style={{
                fontSize: '24px',
                animation: 'spinPulse 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurnPatternAnalysis;
