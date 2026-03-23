// CreateDashboardLanding.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  notification
} from 'antd';
import { 
  LayoutOutlined,
  PlusOutlined,
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BuildOutlined,
  ArrowLeftOutlined,
  RocketOutlined
} from '@ant-design/icons';

import Sidebar from "./SidebarSSBI";
import DraggableColumn from "./DraggableColumn";
import { useFileUpload } from "./FileUpload";

const { Title, Paragraph } = Typography;

// Same Context as SSBI.jsx
const Context = React.createContext({ name: 'Default' });

// Dashboard Templates (same as SSBI.jsx)
const dashboardTemplates = {
  executive: {
    name: "Template 1",
    description: "High-level KPIs and key metrics overview for leadership",
    dashboardType: 'executive',
    components: [
      {
        id: 1,
        type: 'kpi',
        title: 'Total Revenue',
        kpiName: 'Total Revenue',
        aggregationType: 'sum',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 2,
        type: 'kpi',
        title: 'Total Orders',
        kpiName: 'Total Orders',
        aggregationType: 'count',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 3,
        type: 'kpi',
        title: 'Average Order Value',
        kpiName: 'Average Order Value',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 4,
        type: 'kpi',
        title: 'Customer Count',
        kpiName: 'Customer Count',
        aggregationType: 'unique',
        color: '#ffffff',
        isConfigured: false
      },
    //   {
    //     id: 5,
    //     type: 'kpi',
    //     title: 'Growth Rate',
    //     kpiName: 'Growth Rate',
    //     aggregationType: 'avg',
    //     color: '#ffffff',
    //     isConfigured: false
    //   },
      {
        id: 5,
        type: 'chart',
        title: 'Revenue Trend',
        chartName: 'Revenue Trend',
        chartType: 'line',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 6,
        type: 'chart',
        title: 'Top Products',
        chartName: 'Top Products',
        chartType: 'bar',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 7,
        type: 'table',
        title: 'Executive Summary',
        tableName: 'Executive Summary',
        tableColumns: [],
        maxRows: 5,
        isConfigured: false
      }
    ]
  },
  
  sales: {
    name: "Template 2",
    description: "Comprehensive sales performance analysis and tracking",
    dashboardType: 'sales',
    components: [
      {
        id: 1,
        type: 'kpi',
        title: 'Total Sales',
        kpiName: 'Total Sales',
        aggregationType: 'sum',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 2,
        type: 'kpi',
        title: 'Monthly Growth',
        kpiName: 'Monthly Growth',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 3,
        type: 'kpi',
        title: 'Conversion Rate',
        kpiName: 'Conversion Rate',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 4,
        type: 'kpi',
        title: 'Average Deal Size',
        kpiName: 'Average Deal Size',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 5,
        type: 'chart',
        title: 'Sales by Category',
        chartName: 'Sales by Category',
        chartType: 'pie',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 6,
        type: 'chart',
        title: 'Sales Trend',
        chartName: 'Sales Trend',
        chartType: 'area',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 7,
        type: 'table',
        title: 'Top Performers',
        tableName: 'Top Performers',
        tableColumns: [],
        maxRows: 10,
        isConfigured: false
      },
      {
        id: 8,
        type: 'table',
        title: 'Top Performers',
        tableName: 'Top Performers',
        tableColumns: [],
        maxRows: 10,
        isConfigured: false
      }
    ]
  },
  
  operational: {
    name: "Template 3",
    description: "Day-to-day operations and performance metrics monitoring",
    dashboardType: 'operational',
    components: [
      {
        id: 1,
        type: 'kpi',
        title: 'Active Items',
        kpiName: 'Active Items',
        aggregationType: 'count',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 2,
        type: 'kpi',
        title: 'Processing Time',
        kpiName: 'Avg Processing Time',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 3,
        type: 'chart',
        title: 'Daily Operations',
        chartName: 'Daily Operations',
        chartType: 'line',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 4,
        type: 'chart',
        title: 'Performance Metrics',
        chartName: 'Performance Metrics',
        chartType: 'bar',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 5,
        type: 'table',
        title: 'Recent Activity',
        tableName: 'Recent Activity',
        tableColumns: [],
        maxRows: 15,
        isConfigured: false
      }
    ]
  },
  
  analytical: {
    name: "Template 4",
    description: "Detailed analysis with multiple chart types and deep insights",
    dashboardType: 'analytical',
    components: [
      {
        id: 1,
        type: 'kpi',
        title: 'Data Points',
        kpiName: 'Total Data Points',
        aggregationType: 'count',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 2,
        type: 'kpi',
        title: 'Accuracy Score',
        kpiName: 'Accuracy Score',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 3,
        type: 'kpi',
        title: 'Variance',
        kpiName: 'Data Variance',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 4,
        type: 'chart',
        title: 'Distribution Analysis',
        chartName: 'Distribution Analysis',
        chartType: 'pie',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 5,
        type: 'chart',
        title: 'Correlation Matrix',
        chartName: 'Correlation Matrix',
        chartType: 'scatter',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 6,
        type: 'chart',
        title: 'Time Series',
        chartName: 'Time Series Analysis',
        chartType: 'area',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 7,
        type: 'table',
        title: 'Detailed Data',
        tableName: 'Detailed Analysis',
        tableColumns: [],
        maxRows: 20,
        isConfigured: false
      }
    ]
  }
};

// Template Preview Card (same as SSBI.jsx)
const TemplatePreviewCard = ({ template, templateKey, onSelectTemplate }) => {
  
  const getTemplateLayoutConfig = (dashboardType) => {
    const layouts = {
      executive: { gridColumns: 'repeat(10, 1fr)', maxPerRow: { kpi: 4, chart: 2, table: 1 } },
      sales: { gridColumns: 'repeat(8, 1fr)', maxPerRow: { kpi: 4, chart: 2, table: 2 } },
      operational: { gridColumns: 'repeat(6, 1fr)', maxPerRow: { kpi: 2, chart: 2, table: 2 } },
      analytical: { gridColumns: 'repeat(12, 1fr)', maxPerRow: { kpi: 3, chart: 3, table: 2 } }
    };
    return layouts[dashboardType] || layouts.executive;
  };

  const layout = getTemplateLayoutConfig(template.dashboardType);

  const calculatePreviewDistribution = (totalComponents, maxPerRow, totalColumns) => {
    if (totalComponents === 0) return [];
    if (totalComponents <= maxPerRow) return [totalComponents];

    const minRows = Math.ceil(totalComponents / maxPerRow);
    const basePerRow = Math.floor(totalComponents / minRows);
    const remainder = totalComponents % minRows;
    
    const distribution = [];
    for (let i = 0; i < minRows; i++) {
      distribution.push(basePerRow + (i < remainder ? 1 : 0));
    }
    
    distribution.sort((a, b) => b - a);
    return distribution;
  };

  const getPreviewSpan = (type, componentIndex, totalOfType, totalColumns) => {
    const maxPerRow = layout.maxPerRow[type] || 1;
    
    if (totalOfType <= maxPerRow) {
      const spanPerComponent = Math.floor(totalColumns / totalOfType);
      const remainder = totalColumns % totalOfType;
      const extraSpan = componentIndex < remainder ? 1 : 0;
      return spanPerComponent + extraSpan;
    }

    const distribution = calculatePreviewDistribution(totalOfType, maxPerRow, totalColumns);
    
    let currentRow = 0;
    let componentsAccountedFor = 0;
    
    while (currentRow < distribution.length && 
           componentsAccountedFor + distribution[currentRow] <= componentIndex) {
      componentsAccountedFor += distribution[currentRow];
      currentRow++;
    }
    
    const componentsInThisRow = distribution[currentRow] || 1;
    const spanPerComponent = Math.floor(totalColumns / componentsInThisRow);
    const remainder = totalColumns % componentsInThisRow;
    const positionInRow = componentIndex - componentsAccountedFor;
    const extraSpan = positionInRow < remainder ? 1 : 0;
    
    return spanPerComponent + extraSpan;
  };

  const organizePreviewComponents = () => {
    const groupedComponents = template.components.reduce((groups, component) => {
      const type = component.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(component);
      return groups;
    }, {});

    const typeOrder = ['kpi', 'chart', 'table'];
    const sortedComponents = [];

    typeOrder.forEach(type => {
      const componentsOfType = groupedComponents[type] || [];
      componentsOfType.forEach((component, index) => {
        const totalColumns = template.dashboardType === 'executive' ? 10 :
                            template.dashboardType === 'sales' ? 8 :
                            template.dashboardType === 'operational' ? 6 : 12;
        
        sortedComponents.push({
          ...component,
          gridColumn: `span ${getPreviewSpan(type, index, componentsOfType.length, totalColumns)}`,
          typeIndex: index,
          totalOfType: componentsOfType.length
        });
      });
    });

    return sortedComponents;
  };

  const previewComponents = organizePreviewComponents();

  const getDistributionInfo = () => {
    const groupedComponents = template.components.reduce((groups, component) => {
      const type = component.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(component);
      return groups;
    }, {});

    const info = [];
    ['kpi', 'chart', 'table'].forEach(type => {
      const count = groupedComponents[type]?.length || 0;
      if (count > 0) {
        const maxPerRow = layout.maxPerRow[type];
        const distribution = calculatePreviewDistribution(count, maxPerRow, 12);
        info.push(`${count} ${type.toUpperCase()}${count > 1 ? 's' : ''}`);
      }
    });
    return info.join(' • ');
  };

  return (
    <div 
      className="template-preview-card"
      onClick={() => onSelectTemplate(templateKey)}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0px 2px 20px rgba(69, 65, 78, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '2px solid transparent',
        minHeight: '300px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0px 4px 25px rgba(69, 65, 78, 0.15)';
        e.currentTarget.style.borderColor = '#1890ff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = '0px 2px 20px rgba(69, 65, 78, 0.1)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {/* Template Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          fontFamily : "var(--app-font-family)",
          fontWeight: '600',
          color: '#333'
        }}>
          {template.name}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontFamily : "var(--app-font-family)",
          color: '#666',
          lineHeight: '1.4'
        }}>
          {template.description}
        </p>
      </div>

      {/* Grid Preview with actual layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: layout.gridColumns,
        gap: '3px',
        marginBottom: '16px',
        minHeight: '140px',
        padding: '8px',
        backgroundColor: '#fafafa',
        borderRadius: '6px',
        position: 'relative',
        isolation: 'isolate'
      }}>
        {previewComponents.map((component, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'rgba(24, 62, 117, 0.8)',
              borderRadius: '3px',
              padding: '4px',
              border: '1px solid rgba(24, 62, 117, 0.3)',
              gridColumn: component.gridColumn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: component.type === 'table' ? '30px' : 
                        component.type === 'chart' ? '25px' : '20px',
              fontSize: '8px',
              fontFamily : "var(--app-font-family)",
              fontWeight: '600',
              color: 'rgb(247, 249, 251)',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transform: 'none',
              pointerEvents: 'none'
            }}
          >
            {component.type === 'kpi' ? 'KPI' :
             component.type === 'chart' ? 'CHART' :
             component.type === 'table' ? 'TABLE' :
             component.type.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Template Stats */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid #f0f0f0',
        fontFamily : "var(--app-font-family)",
        fontSize: '11px',
        color: '#666'
      }}>
        {/* <div style={{ marginBottom: '8px', fontWeight: '600' }}>
          {template.components.length} Components • {template.dashboardType} Layout
        </div> */}
        <div style={{ 
          fontSize: '10px', 
          fontFamily : "var(--app-font-family)",
          color: '#999',
          lineHeight: '1.3'
        }}>
          {getDistributionInfo()}
        </div>
      </div>
    </div>
  );
};

const CreateDashboardLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTableRef = useRef();

  // View state for conditional rendering
  const [currentView, setCurrentView] = useState('initial'); // 'initial' or 'templates'

  // Complete state management (same as SSBI.jsx)
  const [state, setState] = useState({
    tables: [],
    selectedTable: "",
    columns: [],
    rows: [],
    columnsInfo: [],
    categorizedColumns: null,
    selectedColumns: [],
    tableData: [],
    slicers: {},
    lastFetchedTable: "",
  });

  const [reportState, setReportState] = useState({
    savedReports: [],
    reportName: "",
    question: "",
    aiResults: [],
    loadingAiResponse: false,
    isTablePaneVisible: true,
    isLoadedReport: false,
  });

  const [selectedAppendTable, setSelectedAppendTable] = useState('');
  const [api, contextHolder] = notification.useNotification();
  
  const contextValue = useMemo(() => ({ name: 'Ant Design' }), []);

  // Helper functions (same as SSBI.jsx)
  const updateState = useCallback((updates) => setState(prev => ({ ...prev, ...updates })), []);

  const openNotification = useCallback((type, message, description, placement = 'topRight') => {
    api[type]({
      message,
      description: <Context.Consumer>{() => description}</Context.Consumer>,
      placement,
    });
  }, [api]);

  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("API call failed:", err);
      throw err;
    }
  }, []);

  // Fetch functions (same as SSBI.jsx)
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("https://prowesstics.space/flask/tables");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const tables = data.tables || [];

      setState(prev => {
        const newSelectedTable = tables.includes(prev.selectedTable) 
          ? prev.selectedTable 
          : tables[0] || "";

        if (prev.selectedTable === newSelectedTable && prev.tables.join(',') === tables.join(',')) {
          return prev;
        }

        return {
          ...prev,
          tables,
          selectedTable: newSelectedTable
        };
      });
    } catch (err) {
      console.error('Error fetching tables:', err);
      setState(prev => ({ ...prev, tables: [] }));
    }
  }, []);

  const fetchTableData = useCallback(async (tableName) => {
    const targetTable = tableName || state.selectedTable;

    if (!targetTable || state.lastFetchedTable === targetTable) {
      return;
    }

    try {
      const [dataRes, typesRes] = await Promise.all([
        fetch(`https://prowesstics.space/flask/data?table=${encodeURIComponent(targetTable)}`),
        fetch(`https://prowesstics.space/flask/columns-with-types?table=${encodeURIComponent(targetTable)}`)
      ]);

      if (!dataRes.ok || !typesRes.ok) {
        throw new Error(`HTTP error! data: ${dataRes.status}, types: ${typesRes.status}`);
      }

      const [dataText, typesData] = await Promise.all([
        dataRes.text(),
        typesRes.json()
      ]);

      const data = dataText ? JSON.parse(dataText) : { columns: [], data: [] };

      if (selectedTableRef.current !== targetTable) {
        return;
      }

      setState(prev => ({
        ...prev,
        columns: Array.isArray(data.columns) ? data.columns : [],
        rows: Array.isArray(data.data) ? data.data : [],
        columnsInfo: typesData.columns_info || [],
        categorizedColumns: typesData.categorized_columns || {
          date: [],
          dimension: [],
          fields: []
        },
        lastFetchedTable: targetTable
      }));
    } catch (err) {
      console.error('Error fetching table data:', err);
    }
  }, [state.selectedTable, state.lastFetchedTable]);

  // Report management functions
  const saveReport = useCallback(async () => {
    if (!reportState.reportName.trim()) {
      openNotification("warning", "Save Failed", "Please enter a report name", "bottomRight");
      return;
    }

    try {
      const reportData = {
        report_name: reportState.reportName.trim(),
        table_name: state.selectedTable,
        selected_columns: state.selectedColumns,
        slicers: state.slicers,
        dashboard_components: [],
        charts: [],
        current_dashboard_type: 'landing',
        description: "Dashboard created from landing page",
        tags: ["landing"],
        created_by: "current_user"
      };

      await apiCall("https://prowesstics.space/flask/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      fetchSavedReports();
      openNotification("success", "Report Saved", "Report saved successfully!", "bottomRight");
      
    } catch (error) {
      openNotification("error", "Save Failed", "Error saving report: " + error.message, "bottomRight");
    }
  }, [reportState.reportName, state.selectedTable, state.selectedColumns, state.slicers, openNotification, apiCall]);

  const fetchSavedReports = useCallback(async () => {
    try {
      const data = await apiCall("https://prowesstics.space/flask/reports");
      let reports = [];
      if (Array.isArray(data)) {
        reports = data;
      } else if (data.reports && Array.isArray(data.reports)) {
        reports = data.reports;
      } else if (data.data && Array.isArray(data.data)) {
        reports = data.data;
      }
      
      setReportState(prev => ({ ...prev, savedReports: reports }));
    } catch (error) {
      console.error("Error fetching saved reports:", error);
      setReportState(prev => ({ ...prev, savedReports: [] }));
    }
  }, [apiCall]);

const loadSavedReport = useCallback(async (reportIdentifier) => {
  try {
    console.log('Loading report with identifier:', reportIdentifier);
    
    const response = await fetch(`https://prowesstics.space/flask/reports/${encodeURIComponent(reportIdentifier)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Loaded report data:', data);
    
    const report = data.report;
    
    if (!report) {
      throw new Error('No report data received');
    }
    
    updateState({
      selectedTable: report.table_name || '',
      selectedColumns: report.selected_columns || [],
      slicers: report.slicers || {},
      dashboardComponents: report.dashboard_components || [],
      charts: report.charts || initialState.charts,
      currentDashboardType: report.current_dashboard_type || 'default',
      categorizedColumns: null,
      columnsInfo: [],
      lastFetchedTable: "" // Reset to force fresh data fetch
    });
    
    setReportState(prev => ({
      ...prev,
      reportName: report.report_name || report.name || '',
      isLoadedReport: true,
    }));
    
    // ✅ FIX: Navigate to dashboard page when loading report from other pages
    const currentPath = location.pathname;
    if (!currentPath.includes('ssbihome')) {
      console.log('Navigating to dashboard page to show loaded report');
      navigate('/ssbihome', { 
        state: { 
          reportLoaded: true,
          reportData: report 
        },
        replace: true 
      });
      return; // Exit early since navigation will handle the rest
    }
    
    // Fetch table data for the loaded report
    if (report.table_name) {
      setTimeout(() => fetchTableData(report.table_name), 100);
    }
    
    // ✅ FIX: Prevent duplicate notifications
    if (!window.lastReportLoadNotification || Date.now() - window.lastReportLoadNotification > 2000) {
      openNotification("success", "Report Loaded", "Report loaded successfully!", "bottomRight");
      window.lastReportLoadNotification = Date.now();
    }
    
  } catch (error) {
    console.error("Error loading report:", error);
    openNotification("error", "Load Failed", "Error loading report: " + error.message, "bottomRight");
  }
}, [updateState, openNotification, fetchTableData, navigate, location.pathname]);

  const deleteSavedReport = useCallback(async (reportIdentifier) => {
    if (!reportIdentifier) {
      openNotification("error", "Delete Failed", "Invalid report identifier", "bottomRight");
      return;
    }

    try {
      await apiCall(`https://prowesstics.space/flask/reports/${encodeURIComponent(reportIdentifier)}`, { method: "DELETE" });
      
      setReportState(prev => ({
        ...prev,
        reportName: "",
        question: "",
        aiResults: [],
        loadingAiResponse: false,
        isLoadedReport: false,
        reportIdentifier: null
      }));
      
      fetchSavedReports();
      openNotification("success", "Report Deleted", "Report deleted successfully!", "bottomRight");
    } catch (error) {
      openNotification("error", "Delete Failed", "Error deleting report: " + error.message, "bottomRight");
    }
  }, [openNotification, apiCall, fetchSavedReports]);

  const searchReports = useCallback(async (searchQuery = "", tableFilter = "") => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (tableFilter) params.append('table', tableFilter);
      
      const data = await apiCall(`https://prowesstics.space/flask/reports/search?${params}`);
      setReportState(prev => ({ ...prev, savedReports: data.reports || [] }));
    } catch (error) {
      setReportState(prev => ({ ...prev, savedReports: [] }));
    }
  }, [apiCall]);

  const resetDashboard = useCallback(() => {
    setState(prev => ({
      tables: prev.tables,
      selectedTable: "",
      columns: [],
      rows: [],
      columnsInfo: [],
      categorizedColumns: null,
      selectedColumns: [],
      tableData: [],
      slicers: {},
      lastFetchedTable: "",
    }));
    setReportState(prev => ({
      ...prev,
      reportName: "",
      question: "",
      aiResults: [],
      loadingAiResponse: false,
      isLoadedReport: false 
    }));
  }, []);

  const exportTableToCSV = useCallback(() => {
    openNotification("info", "Export", "CSV export not available on landing page", "bottomRight");
  }, [openNotification]);

  const exportTableToPDF = useCallback(() => {
    openNotification("info", "Export", "PDF export not available on landing page", "bottomRight");
  }, [openNotification]);

  const generateAppendTemplate = async (tableName) => {
    openNotification('info', 'Feature', 'Template generation not available on landing page');
  };

  // Initialize file upload hook
  const { handleFileUpload, handleAppendUpload, FileUploadModalComponent } = useFileUpload(
    openNotification, 
    fetchTables, 
    updateState
  );

  // Navigation handlers - FIXED: Proper navigation logic
  const handleChooseTemplates = () => {
    setCurrentView('templates');
    setSearchParams({ view: 'templates' });
  };

//   const handleBackToInitial = () => {
//     setCurrentView('initial');
//     setSearchParams({});
//   };

  const handleTemplateSelect = (templateKey) => {
    const template = dashboardTemplates[templateKey];
    if (!template) return;
    
    console.log(`Navigating to dashboard with template: ${templateKey}`, template);
    
    // FIXED: More reliable navigation with proper state
    navigate('/ssbihome', { 
      state: { 
        loadTemplate: templateKey,
        templateData: template,
        fromLanding: true // Add identifier
      },
      replace: true // Replace current history entry
    });
  };

  const handleCreateYourOwn = () => {
    console.log('Navigating to empty dashboard');
    
    // FIXED: Navigate directly to empty dashboard
    navigate('/ssbihome', { 
      state: { 
        startFresh: true,
        fromLanding: true // Add identifier
      },
      replace: true // Replace current history entry
    });
  };

  // Check URL params on load
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'templates') {
      setCurrentView('templates');
    } else {
      setCurrentView('initial');
    }
  }, [searchParams]);

  // Effects
  useEffect(() => { 
    fetchTables(); 
  }, [fetchTables]);

  useEffect(() => {
    selectedTableRef.current = state.selectedTable;
  }, [state.selectedTable]);

  useEffect(() => { 
    if (state.selectedTable && state.selectedTable !== state.lastFetchedTable) {
      fetchTableData(state.selectedTable); 
    }
  }, [state.selectedTable, state.lastFetchedTable, fetchTableData]);

  useEffect(() => {
    fetchSavedReports();
  }, [fetchSavedReports]);

  // Render Initial View (Two main options)
//   const renderInitialView = () => (
//     <div style={{ 
//       padding: '40px',
//       backgroundColor: '#f5f5f5',
//       minHeight: '100vh',
//       width: '100%',
//       overflow: 'auto'
//     }}>
      
//       {/* Hero Section */}
//       {/* <div style={{ 
//         textAlign: 'center', 
//         marginBottom: '60px',
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         color: 'white',
//         padding: '60px 40px',
//         borderRadius: '16px',
//         boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
//       }}>
//         <div style={{ marginBottom: '20px' }}>
//           <RocketOutlined style={{ fontSize: '64px', marginBottom: '20px' }} />
//         </div>
//         <Title level={1} style={{ color: 'white', margin: '0 0 16px 0', fontSize: '48px' }}>
//           Create Your Dashboard
//         </Title>
//         <Paragraph style={{ 
//           color: 'rgba(255,255,255,0.9)', 
//           fontSize: '20px',
//           margin: 0,
//           maxWidth: '600px',
//           marginLeft: 'auto',
//           marginRight: 'auto'
//         }}>
//           Choose how you'd like to start building your analytics dashboard. 
//           Select from our pre-designed templates or create your own from scratch.
//         </Paragraph>
//       </div> */}

//       {/* Main Options Section */}
//       <Row gutter={[60, 40]} justify="center">
//         {/* Choose Templates Card */}
//         <Col xs={24} lg={12} xl={10}>
//           <Card
//             hoverable
//             style={{ 
//               height: '350px',
//               borderRadius: '16px',
//               border: '2px solid #e8f4fd',
//               cursor: 'pointer',
//               transition: 'all 0.3s ease',
//               background: 'linear-gradient(145deg, #ffffff 0%, #f8fcff 100%)'
//             }}
//             styles={{ 
//               body: { 
//                 display: 'flex', 
//                 flexDirection: 'column', 
//                 justifyContent: 'center', 
//                 alignItems: 'center',
//                 height: '100%',
//                 textAlign: 'center',
//                 padding: '40px'
//               }
//             }}
//             onClick={handleChooseTemplates}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.borderColor = '#1890ff';
//               e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.15)';
//               e.currentTarget.style.transform = 'translateY(-4px)';
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.borderColor = '#e8f4fd';
//               e.currentTarget.style.boxShadow = 'none';
//               e.currentTarget.style.transform = 'translateY(0px)';
//             }}
//           >
//             <div style={{ marginBottom: '24px' }}>
//               <LayoutOutlined 
//                 style={{ 
//                   fontSize: '80px', 
//                   color: '#1890ff',
//                   marginBottom: '20px',
//                   display: 'block'
//                 }} 
//               />
//               <Title level={3} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
//                 Choose Templates
//               </Title>
//               <Paragraph style={{ 
//                 fontSize: '16px', 
//                 color: '#666',
//                 lineHeight: '1.6',
//                 margin: 0
//               }}>
//                 Get started quickly with our professionally designed templates for common business scenarios and analytics use cases.
//               </Paragraph>
//             </div>
            
//             <div style={{ marginTop: 'auto' }}>
//               <Button 
//                 type="primary" 
//                 size="large"
//                 icon={<LayoutOutlined />}
//                 style={{ 
//                   background: 'linear-gradient(135deg, #1890ff, #096dd9)',
//                   border: 'none',
//                   borderRadius: '8px',
//                   height: '48px',
//                   fontSize: '16px',
//                   fontWeight: '600',
//                   paddingLeft: '32px',
//                   paddingRight: '32px'
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleChooseTemplates();
//                 }}
//               >
//                 Browse Templates
//               </Button>
//               <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
//                 4 professional templates available
//               </div>
//             </div>
//           </Card>
//         </Col>

//         {/* Create Your Own Card */}
//         <Col xs={24} lg={12} xl={10}>
//           <Card
//             hoverable
//             style={{ 
//               height: '350px',
//               borderRadius: '16px',
//               border: '2px solid #e8f5e8',
//               cursor: 'pointer',
//               transition: 'all 0.3s ease',
//               background: 'linear-gradient(145deg, #ffffff 0%, #f8fcf8 100%)'
//             }}
//             styles={{ 
//               body: { 
//                 display: 'flex', 
//                 flexDirection: 'column', 
//                 justifyContent: 'center', 
//                 alignItems: 'center',
//                 height: '100%',
//                 textAlign: 'center',
//                 padding: '40px'
//               }
//             }}
//             onClick={handleCreateYourOwn}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.borderColor = '#52c41a';
//               e.currentTarget.style.boxShadow = '0 8px 32px rgba(82, 196, 26, 0.15)';
//               e.currentTarget.style.transform = 'translateY(-4px)';
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.borderColor = '#e8f5e8';
//               e.currentTarget.style.boxShadow = 'none';
//               e.currentTarget.style.transform = 'translateY(0px)';
//             }}
//           >
//             <div style={{ marginBottom: '24px' }}>
//               <BuildOutlined 
//                 style={{ 
//                   fontSize: '80px', 
//                   color: '#52c41a',
//                   marginBottom: '20px',
//                   display: 'block'
//                 }} 
//               />
//               <Title level={3} style={{ margin: '0 0 12px 0', color: '#52c41a' }}>
//                 Create Your Own
//               </Title>
//               <Paragraph style={{ 
//                 fontSize: '16px', 
//                 color: '#666',
//                 lineHeight: '1.6',
//                 margin: 0
//               }}>
//                 Start from scratch and build a completely custom dashboard tailored to your specific needs and data requirements.
//               </Paragraph>
//             </div>
            
//             <div style={{ marginTop: 'auto' }}>
//               <Button 
//                 type="primary" 
//                 size="large"
//                 icon={<PlusOutlined />}
//                 style={{ 
//                   background: 'linear-gradient(135deg, #52c41a, #389e0d)',
//                   border: 'none',
//                   borderRadius: '8px',
//                   height: '48px',
//                   fontSize: '16px',
//                   fontWeight: '600',
//                   paddingLeft: '32px',
//                   paddingRight: '32px'
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleCreateYourOwn();
//                 }}
//               >
//                 Start Building
//               </Button>
//               <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
//                 Complete creative freedom
//               </div>
//             </div>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );

    const renderInitialView = () => (
    <div style={{ 
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh', // CHANGE: Use minHeight so it can grow if needed
        width: '100%',
        // REMOVE: overflow: 'hidden' - let it flow naturally
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    }}>
        
        {/* Main Options Section */}
        <Row gutter={[60, 40]} justify="center" style={{ flex: 1, alignItems: 'center' }}>
        {/* Choose Templates Card */}
        <Col xs={24} lg={12} xl={10}>
            <Card
            hoverable
            style={{ 
                height: '350px',
                borderRadius: '16px',
                border: '2px solid #e8f4fd',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fcff 100%)'
            }}
            styles={{ 
                body: { 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '40px'
                }
            }}
            onClick={handleChooseTemplates}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(24, 144, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8f4fd';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
            <div style={{ marginBottom: '24px' }}>
                <LayoutOutlined 
                style={{ 
                    fontSize: '60px', 
                    fontFamily : "var(--app-font-family)",
                    color: '#1890ff',
                    marginBottom: '20px',
                    display: 'block'
                }} 
                />
                <Title level={4} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
                Choose Templates
                </Title>
                <Paragraph style={{ 
                fontSize: '14px', 
                fontFamily : "var(--app-font-family)",
                color: '#666',
                lineHeight: '1.6',
                margin: 0
                }}>
                Quickly start with ready-to-use business and analytics templates.
                </Paragraph>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
                <Button 
                type="primary" 
                size="large"
                icon={<LayoutOutlined />}
                style={{ 
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px',
                    fontSize: '16px',
                    fontFamily : "var(--app-font-family)",
                    fontWeight: '600',
                    paddingLeft: '32px',
                    paddingRight: '32px'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleChooseTemplates();
                }}
                >
                Browse Templates
                </Button>
                {/* <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
                4 professional templates available
                </div> */}
            </div>
            </Card>
        </Col>

        {/* Create Your Own Card */}
        <Col xs={24} lg={12} xl={10}>
            <Card
            hoverable
            style={{ 
                height: '350px',
                borderRadius: '16px',
                border: '2px solid #e8f5e8',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fcf8 100%)'
            }}
            styles={{ 
                body: { 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '40px'
                }
            }}
            onClick={handleCreateYourOwn}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(82, 196, 26, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8f5e8';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
            <div style={{ marginBottom: '24px' }}>
                <BuildOutlined 
                style={{ 
                    fontSize: '60px', 
                    fontFamily : "var(--app-font-family)",
                    color: '#1890ff',
                    marginBottom: '20px',
                    display: 'block'
                }} 
                />
                <Title level={4} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
                Create Your Own Dashboard
                </Title>
                <Paragraph style={{ 
                fontSize: '14px', 
                fontFamily : "var(--app-font-family)",
                color: '#666',
                lineHeight: '1.6',
                margin: 0
                }}>
                Build a dashboard customized to your requirements.
                </Paragraph>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
                <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />}
                style={{ 
                    background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px',
                    fontSize: '16px',
                    fontFamily : "var(--app-font-family)",
                    fontWeight: '600',
                    paddingLeft: '32px',
                    paddingRight: '32px'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleCreateYourOwn();
                }}
                >
                Start Building
                </Button>
                {/* <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
                Complete creative freedom
                </div> */}
            </div>
            </Card>
        </Col>
        </Row>
    </div>
    );

  // Render Templates View - FIXED: Clean templates-only view
//   const renderTemplatesView = () => (
//     <div style={{ 
//       padding: '40px',
//       backgroundColor: '#f5f5f5',
//       minHeight: '100vh',
//       width: '100%',
//       overflow: 'auto'
//     }}>
      
//       {/* Simple Header with Back Button */}
//       <div style={{ 
//         display: 'flex', 
//         alignItems: 'center', 
//         gap: '20px',
//         marginBottom: '40px'
//       }}>
//         <Button
//           icon={<ArrowLeftOutlined />}
//           onClick={handleBackToInitial}
//           style={{
//             background: 'linear-gradient(135deg, #667eea, #764ba2)',
//             border: 'none',
//             color: 'white',
//             borderRadius: '8px',
//             height: '40px',
//             fontSize: '14px',
//             fontWeight: '600'
//           }}
//         >
//           Back
//         </Button>
//         <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
//           Choose a Template
//         </Title>
//       </div>

//       <div style={{ 
//         textAlign: 'center', 
//         marginBottom: '40px'
//       }}>
//         <Paragraph style={{ 
//           fontSize: '16px', 
//           color: '#666',
//           maxWidth: '600px',
//           margin: '0 auto',
//           lineHeight: '1.6'
//         }}>
//           Select from our pre-designed templates to get started quickly. Each template includes 
//           pre-configured components optimized for specific business scenarios.
//         </Paragraph>
//       </div>

//       {/* Templates Grid - ONLY TEMPLATES */}
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//         gap: '24px',
//         maxWidth: '1200px',
//         margin: '0 auto'
//       }}>
//         {Object.entries(dashboardTemplates).map(([key, template]) => (
//           <TemplatePreviewCard
//             key={key}
//             template={template}
//             templateKey={key}
//             onSelectTemplate={handleTemplateSelect}
//           />
//         ))}
//       </div>
//     </div>
//   );
    const renderTemplatesView = () => (
        <div style={{ 
            padding: '40px',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh', // CHANGE: Back to minHeight to ensure content height
            width: '100%',
            boxSizing: 'border-box'
            // REMOVE: All overflow properties - let the parent handle scroll
        }}>
            
            {/* Simple Header with Back Button */}
            {/* <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            marginBottom: '40px'
            }}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToInitial}
                style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                height: '40px',
                fontSize: '14px',
                fontWeight: '600'
                }}
            >
                Back
            </Button>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                Choose a Template
            </Title>
            </div> */}
            <div style={{ 
                textAlign: 'center',
                marginBottom: '40px'
                }}>
                <Title level={2} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                    Choose a Template
                </Title>
            </div>

            <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px'
            }}>
            <Paragraph style={{ 
                fontSize: '16px', 
                fontFamily : "var(--app-font-family)",
                color: '#666',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.6'
            }}>
                Select from our pre-designed templates to get started quickly. Each template includes 
                pre-configured components optimized for specific business scenarios.
            </Paragraph>
            </div>

            {/* Templates Grid - No container restrictions */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto'
            // REMOVE: paddingBottom - not needed for single scroll
            }}>
            {Object.entries(dashboardTemplates).map(([key, template]) => (
                <TemplatePreviewCard
                key={key}
                template={template}
                templateKey={key}
                onSelectTemplate={handleTemplateSelect}
                />
            ))}
            </div>
        </div>
        );

  return (
    <Context.Provider value={contextValue}>
      {contextHolder}
      <DndProvider backend={HTML5Backend}>
        <div className="app" style={{ 
          display: 'flex', 
          height: '100vh', 
          overflow: 'hidden'
            
        }}>
          
          {/* Fully Functional SSBI Sidebar */}
          <Sidebar
            tables={state.tables}
            selectedTable={state.selectedTable}
            setSelectedTable={(table) => updateState({ selectedTable: table })}
            columns={state.columns}
            rows={state.rows}
            columnsInfo={state.columnsInfo}
            categorizedColumns={state.categorizedColumns}
            DraggableColumn={DraggableColumn}
            exportTableToCSV={exportTableToCSV}
            exportTableToPDF={exportTableToPDF}
            handleFileUpload={handleFileUpload}
            selectedAppendTable={selectedAppendTable}
            setSelectedAppendTable={setSelectedAppendTable}
            generateAppendTemplate={generateAppendTemplate}
            handleAppendUpload={handleAppendUpload}
            reportName={reportState.reportName}
            setReportName={(name) => setReportState(prev => ({ ...prev, reportName: name }))}
            saveReport={saveReport}
            savedReports={reportState.savedReports}
            loadSavedReport={loadSavedReport}
            deleteSavedReport={deleteSavedReport}
            question={reportState.question}
            setQuestion={(q) => setReportState(prev => ({ ...prev, question: q }))}
            fetchAiResponse={() => {}}
            loadingAiResponse={reportState.loadingAiResponse}
            aiResults={reportState.aiResults}
            handlePageChange={() => {}} // Disabled for landing page
            isTablePaneVisible={reportState.isTablePaneVisible}
            toggleTablePane={() => setReportState(prev => ({ ...prev, isTablePaneVisible: !prev.isTablePaneVisible }))}
            searchReports={searchReports}
            resetDashboard={resetDashboard}
            isLoadedReport={reportState.isLoadedReport}
          >
            {/* Content Container - FIXED */}
            <div style={{
                flex: 1,
                height: '100vh',
                overflow: 'auto', // CHANGE: Prevent scroll in main content
                }}>
                {/* Conditional Content Based on Current View */}
                {currentView === 'initial' && renderInitialView()}
                {currentView === 'templates' && renderTemplatesView()}
            </div>
          </Sidebar>

          {/* File Upload Modal Component */}
          <FileUploadModalComponent />
        </div>
      </DndProvider>
    </Context.Provider>
  );
};

export default CreateDashboardLanding;