// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import ChartTemplate from "./ChartTemplate";
import Sidebar from "./SidebarSSBI";
import TablePreview from "./TablePreview";
import FilterPanel from "./FilterPanel";
import DraggableColumn from "./DraggableColumn";
import html2canvas from 'html2canvas';
import { useFileUpload } from "./FileUpload";
// import FileUploadPage from "./FileUploadPage"; 
import jsPDF from 'jspdf';

import styles from "./SSBI.module.css";
import { notification, Modal } from 'antd';
import { startSSBITour, moveTourNext } from '../utils/ssbiTourShepherd';
import { useLocation } from 'react-router-dom';


const Context = React.createContext({ name: 'Default' });

// Consolidated initial state
const initialState = {
  tables: [],
  selectedTable: "",
  columns: [],
  rows: [],
  columnsInfo: [],
  categorizedColumns: null,
  selectedColumns: [],
  tableData: [],
  slicers: {},
  dashboardComponents: [],
  nextComponentId: 1,
  lastFetchedTable: "",
  currentDashboardType: 'default', // ✅ ADD THIS LINE
  charts: Array.from({ length: 4 }, (_, i) => ({
    key: `chart${i + 1}`,
    type: "bar",
    fields: { xAxis: "", yAxis: "" }, 
  }))
};

// Component templates
const componentTemplates = {
  // sparkline: { type: 'sparkline', title: 'Sparkline Chart', color: '#734CEA', value: '439' },
  kpi: { type: 'kpi', title: 'KPI Card', value: '', subtitle: 'Total Sales', color: 'white', trend: '+12%' },
  chart: { type: 'chart', title: 'Chart Widget', chartType: 'bar', fields: { xAxis: "", yAxis: "" } },
  table: { type: 'table', title: 'Data Table', columns: [], maxRows: 10 },
  // radialBar: { type: 'radialBar', title: 'Progress Chart', value: 65, color: '#E91E63', label: 'Completion' }
};

const getDashboardLayout = (dashboardType) => {
  const layoutConfigs = {
    executive: {
      gridColumns: 'repeat(12, 1fr)',
      gap: '24px',
      typeOrder: ['kpi', 'chart', 'table'],
      maxPerRow: {
        kpi: 4,    // NEVER EXCEED 5
        chart: 2,  // NEVER EXCEED 2
        table: 1   // NEVER EXCEED 1
      },
      totalColumns: 12
    },
    
    sales: {
      gridColumns: 'repeat(12, 1fr)',
      gap: '20px',
      typeOrder: ['kpi', 'chart', 'table'],
      maxPerRow: {
        kpi: 4,    // NEVER EXCEED 4
        chart: 2,  // NEVER EXCEED 2
        table: 2   // NEVER EXCEED 1
      },
      totalColumns: 12
    },
    
    operational: {
      gridColumns: 'repeat(12, 1fr)',
      gap: '16px',
      typeOrder: ['kpi', 'chart', 'table'],
      maxPerRow: {
        kpi: 2,    // NEVER EXCEED 2
        chart: 2,  // NEVER EXCEED 2
        table: 2   // NEVER EXCEED 2
      },
      totalColumns: 12
    },
    
    analytical: {
      gridColumns: 'repeat(12, 1fr)',
      gap: '18px',
      typeOrder: ['kpi', 'chart', 'table'],
      maxPerRow: {
        kpi: 3,    // NEVER EXCEED 3
        chart: 3,  // NEVER EXCEED 3
        table: 1   // NEVER EXCEED 2
      },
      totalColumns: 12
    }
  };

  const defaultConfig = {
    gridColumns: 'repeat(12, 1fr)',
    gap: '20px',
    typeOrder: ['kpi', 'chart', 'table'],
    maxPerRow: { 
      kpi: 6,    // NEVER EXCEED 6
      chart: 2,  // NEVER EXCEED 2
      table: 1   // NEVER EXCEED 1
    },
    totalColumns: 12
  };

  const config = layoutConfigs[dashboardType] || defaultConfig;

  // FIXED: Robust distribution algorithm
  const calculateOptimalDistribution = (totalComponents, maxPerRow) => {
    if (totalComponents === 0) return [];
    if (totalComponents <= maxPerRow) return [totalComponents];

    // Calculate minimum rows needed
    const minRows = Math.ceil(totalComponents / maxPerRow);
    
    // Distribute components optimally
    const basePerRow = Math.floor(totalComponents / minRows);
    const remainder = totalComponents % minRows;
    
    const distribution = [];
    
    // Fill rows with better balance
    for (let i = 0; i < minRows; i++) {
      const componentsInThisRow = basePerRow + (i < remainder ? 1 : 0);
      distribution.push(componentsInThisRow);
    }
    
    // Sort for better visual appearance (larger rows first)
    distribution.sort((a, b) => b - a);
    
    return distribution;
  };

  // FIXED: Stable span calculation
  const getSpan = (type, componentIndex, totalComponentsOfType) => {
    const maxPerRow = config.maxPerRow[type] || 1;
    const totalColumns = config.totalColumns;

    if (totalComponentsOfType === 0) return `span ${Math.floor(totalColumns / maxPerRow)}`;

    // Get optimal distribution
    const rowDistribution = calculateOptimalDistribution(totalComponentsOfType, maxPerRow);
    
    // Find which row this component belongs to
    let currentRow = 0;
    let componentsAccountedFor = 0;
    
    while (currentRow < rowDistribution.length && 
           componentsAccountedFor + rowDistribution[currentRow] <= componentIndex) {
      componentsAccountedFor += rowDistribution[currentRow];
      currentRow++;
    }
    
    const componentsInThisRow = rowDistribution[currentRow] || 1;
    
    // Calculate perfect equal spans
    const spanPerComponent = Math.floor(totalColumns / componentsInThisRow);
    const remainder = totalColumns % componentsInThisRow;
    const positionInRow = componentIndex - componentsAccountedFor;
    
    // Distribute remainder for perfect fit
    const extraSpan = positionInRow < remainder ? 1 : 0;
    
    return `span ${spanPerComponent + extraSpan}`;
  };

  return {
    gridColumns: config.gridColumns,
    gap: config.gap,
    typeOrder: config.typeOrder,
    maxPerRow: config.maxPerRow,
    totalColumns: config.totalColumns,
    getSpan: getSpan,
    calculateOptimalDistribution: calculateOptimalDistribution
  };
};

// FIXED: Clean component organization that handles template switches
const organizeComponentsWithExactDistribution = (components, currentDashboardType) => {
  if (components.length === 0) return { layout: null, sortedComponents: [] };
  
  // FIXED: Always get fresh layout for current dashboard type
  const layout = getDashboardLayout(currentDashboardType || 'default');
  
  // FIXED: Clean component grouping
  const groupedComponents = components.reduce((groups, component) => {
    const type = component.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(component);
    return groups;
  }, {});

  // FIXED: Fresh component organization with clean spans
  const sortedComponents = layout.typeOrder.flatMap(type => {
    const componentsOfType = groupedComponents[type] || [];
    
    return componentsOfType.map((component, index) => ({
      ...component,
      gridColumn: layout.getSpan(type, index, componentsOfType.length),
      typeIndex: index,
      totalOfType: componentsOfType.length,
      exactDistribution: layout.calculateOptimalDistribution(
        componentsOfType.length, 
        layout.maxPerRow[type]
      )
    }));
  });

  return { layout, sortedComponents };
};

// FIXED: Replace the dynamic component rendering logic with this stable version
// const renderComponentsWithStableLayout = (dashboardComponents, currentDashboardType) => {
//   if (dashboardComponents.length === 0) return null;
  
//   // FIXED: Don't pass componentCounts - use static layout
//   const layout = getDashboardLayout(currentDashboardType || 'default');
  
//   // Group components by type
//   const groupedComponents = dashboardComponents.reduce((groups, component) => {
//     const type = component.type;
//     if (!groups[type]) groups[type] = [];
//     groups[type].push(component);
//     return groups;
//   }, {});

//   // FIXED: Stable component organization
//   const sortedComponents = layout.typeOrder.flatMap(type => {
//     const componentsOfType = groupedComponents[type] || [];
    
//     return componentsOfType.map((component, index) => ({
//       ...component,
//       gridColumn: layout.getSpan(type, index, componentsOfType.length),
//       typeIndex: index,
//       totalOfType: componentsOfType.length
//     }));
//   });

//   return {
//     layout,
//     sortedComponents
//   };
// };


// Dashboard Templates with dashboardType
const dashboardTemplates = {
  executive: {
    name: "Template 1",
    description: "High-level KPIs and key metrics overview",
    dashboardType: 'executive', // Add this line
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
      // {
      //   id: 5,
      //   type: 'kpi',
      //   title: 'Growth Rate',
      //   kpiName: 'Growth Rate',
      //   aggregationType: 'avg',
      //   color: '#ffffff',
      //   isConfigured: false
      // },
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
    description: "Comprehensive sales performance analysis",
    dashboardType: 'sales', // Add this line
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
        title: 'Top 10 Performers',
        tableName: 'Top 10 Performers',
        tableColumns: [],
        maxRows: 10,
        isConfigured: false
      }
    ]
  },
  
  operational: {
    name: "Template 3",
    description: "Day-to-day operations and performance metrics",
    dashboardType: 'operational', // Add this line
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
        type: 'kpi',
        title: 'Success Rate',
        kpiName: 'Success Rate',
        aggregationType: 'avg',
        color: '#ffffff',
        isConfigured: false
      },
      {
        id: 4,
        type: 'chart',
        title: 'Daily Operations',
        chartName: 'Daily Operations',
        chartType: 'line',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 5,
        type: 'chart',
        title: 'Performance Metrics',
        chartName: 'Performance Metrics',
        chartType: 'bar',
        fields: { xAxis: "", yAxis: "" },
        isConfigured: false
      },
      {
        id: 6,
        type: 'table',
        title: 'Recent Activity',
        tableName: 'Recent Activity',
        tableColumns: [],
        maxRows: 15,
        isConfigured: false
      },
      {
        id: 7,
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
    description: "Detailed analysis with multiple chart types",
    dashboardType: 'analytical', // Add this line
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
      },
      {
        id: 8,
        type: 'table',
        title: 'Summary Stats',
        tableName: 'Summary Statistics',
        tableColumns: [],
        maxRows: 15,
        isConfigured: false
      }
    ]
  }
};

const styles_shared = {
  card: {
    background: 'linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%)',
    padding: '11px',
    borderRadius: '12px',
    boxShadow: '0px 4px 20px rgba(24, 62, 117, 0.1)',
    position: 'relative',
    border: '1px solid rgba(24, 62, 117, 0.08)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  removeButton: {
    position: 'absolute',
    right: '13px',
    background: 'linear-gradient(135deg, #183E75, #115ECD)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0px 11px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily : "var(--app-font-family)",
    top: '7px',
    transition: 'all 0.2s ease'
  },
  dropZone: {
    border: '2px dashed #115ECD',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontFamily : "var(--app-font-family)",
    color: '#183E75',
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  fieldTag: {
    background: 'linear-gradient(135deg, #183E75, #115ECD)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontFamily : "var(--app-font-family)",
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '500',
    fontFamily : "var(--app-font-family)",
  },
  addButton: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily : "var(--app-font-family)",
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tableCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0px 4px 20px rgba(24, 62, 117, 0.1)',
    border: '1px solid rgba(24, 62, 117, 0.08)',
    position: 'relative'
  },
  tableHeader: {
    backgroundColor: 'linear-gradient(135deg, #183E75, #115ECD)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px 8px 0 0',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily : "var(--app-font-family)",
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(24, 62, 117, 0.1)',
    fontSize: '13px',
    fontFamily : "var(--app-font-family)",
    color: '#183E75'
  },
  alternateRow: { backgroundColor: 'rgba(24, 62, 117, 0.02)' }
};

// FIXED: Accurate Template Preview Card that mimics actual layouts
const TemplatePreviewCard = ({ template, templateKey, onSelectTemplate }) => {
  
  // FIXED: Get actual layout configuration for each template
  const getTemplateLayoutConfig = (dashboardType) => {
    const layouts = {
      executive: {
        gridColumns: 'repeat(8, 1fr)', // 10 columns for executive
        maxPerRow: { kpi: 4, chart: 2, table: 1 },
        gap: '3px'
      },
      sales: {
        gridColumns: 'repeat(8, 1fr)', // 8 columns for sales  
        maxPerRow: { kpi: 4, chart: 2, table: 2 },
        gap: '3px'
      },
      operational: {
        gridColumns: 'repeat(6, 1fr)', // 6 columns for operational
        maxPerRow: { kpi: 2, chart: 2, table: 2 },
        gap: '3px'
      },
      analytical: {
        gridColumns: 'repeat(12, 1fr)', // 12 columns for analytical
        maxPerRow: { kpi: 3, chart: 3, table: 2 },
        gap: '3px'
      }
    };
    return layouts[dashboardType] || layouts.executive;
  };

  const layout = getTemplateLayoutConfig(template.dashboardType);

  // FIXED: Calculate exact preview spans based on actual distribution algorithm
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
    
    // Sort for better visual appearance (larger rows first)
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
    
    // Find which row this component belongs to
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

  // FIXED: Organize components exactly like the actual dashboard
  const organizePreviewComponents = () => {
    // Group components by type
    const groupedComponents = template.components.reduce((groups, component) => {
      const type = component.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(component);
      return groups;
    }, {});

    // Create sorted components in the same order as actual layout
    const typeOrder = ['kpi', 'chart', 'table']; // Same order as actual layout
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

  // FIXED: Show actual distribution info for each template
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
        info.push(`${count} ${type.toUpperCase()}${count > 1 ? 's' : ''} (${distribution.join('+')}/row)`);
      }
    });
    return info.join(' • ');
  };

  return (
    <div 
      id={template.dashboardType === "executive" ? "template-executive" : undefined}
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
        minHeight: '300px' // FIXED: Consistent height for all cards
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
          fontWeight: '600',
          fontFamily : "var(--app-font-family)",
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

      {/* FIXED: Accurate Grid Preview with actual layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: layout.gridColumns, // ACTUAL template grid
        gap: layout.gap,
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
              gridColumn: component.gridColumn, // ACCURATE SPAN
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: component.type === 'table' ? '30px' : 
                        component.type === 'chart' ? '25px' : '20px',
              fontSize: '8px',
              fontWeight: '600',
              fontFamily : "var(--app-font-family)",
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

      {/* FIXED: Template Stats with accurate distribution info */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid #f0f0f0',
        fontSize: '11px',
        fontFamily : "var(--app-font-family)",
        color: '#666'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: '600' , fontFamily : "var(--app-font-family)",}}>
          {template.components.length} Components • {template.dashboardType} Layout
        </div>
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


const Dashboard = () => {
  const navigate = useNavigate();
  const gradientColors = ["#183E75", "#115ECD", "#1E74DF", "#2D90F5", "#215B99"];
  const [state, setState] = useState(initialState);
  const selectedTableRef = useRef();

  const [reportState, setReportState] = useState({
    savedReports: [],
    reportName: "",
    question: "",
    aiResults: [],
    loadingAiResponse: false,
    isTablePaneVisible: true,
    isLoadedReport: false,
  });
  const [api, contextHolder] = notification.useNotification();
  const contextValue = useMemo(() => ({ name: 'Ant Design' }), []);
  const location = useLocation();

  const [selectedAppendTable, setSelectedAppendTable] = useState('');

  // Helper functions
  const updateState = useCallback((updates) => setState(prev => ({ ...prev, ...updates })), []);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: null
  });

  const showConfirmModal = useCallback((title, content, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      content,
      onConfirm
    });
  }, []);

  const handleModalOk = useCallback(() => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    setConfirmModal({ isOpen: false, title: '', content: '', onConfirm: null });
  }, [confirmModal.onConfirm]);

  const handleModalCancel = useCallback(() => {
    setConfirmModal({ isOpen: false, title: '', content: '', onConfirm: null });
  }, []);

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

  // const loadTemplate = useCallback((templateKey) => {
  //   const template = dashboardTemplates[templateKey];
  //   if (!template) return;
    
  //   console.log(`Loading template: ${templateKey}`, template);
    
  //   // FIXED: Create completely fresh components with unique IDs and isolated state
  //   const freshComponents = template.components.map((comp, index) => {
  //     const uniqueId = Date.now() + index + Math.floor(Math.random() * 1000);
      
  //     return {
  //       ...comp,
  //       id: uniqueId, // FIXED: Absolutely unique ID
  //       isConfigured: false, // FIXED: Reset all configuration states
  //       // FIXED: Initialize all fields to prevent sharing
  //       valueField: undefined,
  //       tableColumns: [],
  //       fields: { xAxis: "", yAxis: "" },
  //       // FIXED: Preserve template defaults but reset dynamic states
  //       title: comp.title,
  //       kpiName: comp.kpiName,
  //       aggregationType: comp.aggregationType,
  //       chartName: comp.chartName,
  //       chartType: comp.chartType,
  //       tableName: comp.tableName,
  //       maxRows: comp.maxRows || 10,
  //       color: comp.color || '#ffffff',
  //       // FIXED: Add unique keys for proper rendering
  //       componentKey: `${comp.type}_${uniqueId}_${Date.now()}`,
  //       lastUpdated: Date.now()
  //     };
  //   });
    
  //   // FIXED: Complete state reset with fresh template data
  //   updateState({
  //     dashboardComponents: freshComponents,
  //     nextComponentId: freshComponents.length + 100, // FIXED: Start with higher ID to avoid conflicts
  //     currentDashboardType: template.dashboardType,
  //     // FIXED: Reset any layout-related states
  //     slicers: {}, // Clear any existing filters
  //     selectedColumns: [], // Clear selected columns
  //     tableData: [] // Clear table data
  //   });
    
  //   // Update report name to template name
  //   setReportState(prev => ({ 
  //     ...prev, 
  //     reportName: template.name,
  //     isLoadedReport: false, // FIXED: Mark as fresh template, not loaded report
  //   }));
    
  //   console.log(`Template ${templateKey} loaded with ${freshComponents.length} components`);
  //   openNotification("success", "Template Loaded", `${template.name} template loaded successfully!`, "bottomRight");
  // }, [updateState, setReportState, openNotification]);

// In SSBI.jsx, replace the existing loadTemplate function with this FIXED version:

const loadTemplate = useCallback((templateKey) => {
  const template = dashboardTemplates[templateKey];
  if (!template) return;
  
  console.log(`Loading template: ${templateKey}`, template);
  
  // FIXED: Check if this template is already loaded to prevent duplicate notifications
  if (state.dashboardComponents.length > 0 && state.currentDashboardType === template.dashboardType) {
    console.log('⏭️ Template already loaded, skipping duplicate load');
    return;
  }
  
  // FIXED: Create completely fresh components with unique IDs and isolated state
  const freshComponents = template.components.map((comp, index) => {
    const uniqueId = Date.now() + index + Math.floor(Math.random() * 1000);
    
    return {
      ...comp,
      id: uniqueId, // FIXED: Absolutely unique ID
      isConfigured: false, // FIXED: Reset all configuration states
      // FIXED: Initialize all fields to prevent sharing
      valueField: undefined,
      tableColumns: [],
      fields: { xAxis: "", yAxis: "" },
      // FIXED: Preserve template defaults but reset dynamic states
      title: comp.title,
      kpiName: comp.kpiName,
      aggregationType: comp.aggregationType,
      chartName: comp.chartName,
      chartType: comp.chartType,
      tableName: comp.tableName,
      maxRows: comp.maxRows || 10,
      color: comp.color || '#ffffff',
      // FIXED: Add unique keys for proper rendering
      componentKey: `${comp.type}_${uniqueId}_${Date.now()}`,
      lastUpdated: Date.now()
    };
  });
  
  // FIXED: Complete state reset with fresh template data
  updateState({
    dashboardComponents: freshComponents,
    nextComponentId: freshComponents.length + 100, // FIXED: Start with higher ID to avoid conflicts
    currentDashboardType: template.dashboardType,
    // FIXED: Reset any layout-related states
    slicers: {}, // Clear any existing filters
    selectedColumns: [], // Clear selected columns
    tableData: [] // Clear table data
  });
  
  // Update report name to template name
  setReportState(prev => ({ 
    ...prev, 
    reportName: template.name,
    isLoadedReport: false, // FIXED: Mark as fresh template, not loaded report
  }));
  
  console.log(`Template ${templateKey} loaded with ${freshComponents.length} components`);
  
  // FIXED: Only show notification once by adding a timestamp check
  const notificationKey = `template_${templateKey}_${Date.now()}`;
  if (!window.lastTemplateNotification || Date.now() - window.lastTemplateNotification > 2000) {
    openNotification("success", "Template Loaded", `${template.name} template loaded successfully!`, "bottomRight");
    window.lastTemplateNotification = Date.now();
  }
}, [updateState, setReportState, openNotification, state.dashboardComponents.length, state.currentDashboardType]);

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

        // Only update if something actually changed
        if (prev.selectedTable === newSelectedTable && prev.tables.join(',') === tables.join(',')) {
          return prev;
        }

        return {
          ...prev,
          tables,
          selectedTable: newSelectedTable
        };
      });

      console.log('Tables loaded successfully:', tables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setState(prev => ({ ...prev, tables: [] }));
    }
  }, []);

  const fetchTableData = useCallback(async (tableName) => {
    const targetTable = tableName || state.selectedTable;

    if (!targetTable || state.lastFetchedTable === targetTable) {
      console.log("⏭️ Skipping fetchTableData for", targetTable, " — already loaded.");
      return;
    }

    try {
      console.log('📦 Fetching table data for:', targetTable);

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

      // Prevent applying data if it's for an old/stale table
      if (selectedTableRef.current !== targetTable) {
        console.warn("⚠️ Ignoring stale fetch result for:", targetTable, "(current:", selectedTableRef.current, ")");
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

      console.log('✅ Table data and types loaded for:', targetTable);
    } catch (err) {
      console.error('❌ Error fetching table data:', err);

      if (selectedTableRef.current === targetTable) {
        setState(prev => ({ 
          ...prev, 
          columns: [], 
          rows: [],
          columnsInfo: [],
          categorizedColumns: {
            date: [],
            dimension: [],
            fields: []
          }
        }));
      }
    }
  }, [state.selectedTable, state.lastFetchedTable]);

  const fetchSavedReports = useCallback(async () => {
    try {
      console.log('Fetching saved reports...');
      
      const response = await fetch("https://prowesstics.space/flask/reports");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched reports data:', data);
      
      let reports = [];
      if (Array.isArray(data)) {
        reports = data;
      } else if (data.reports && Array.isArray(data.reports)) {
        reports = data.reports;
      } else if (data.data && Array.isArray(data.data)) {
        reports = data.data;
      }
      
      console.log('Processed reports:', reports);
      
      setReportState(prev => ({ 
        ...prev, 
        savedReports: reports 
      }));
      
    } catch (error) {
      console.error("Error fetching saved reports:", error);
      setReportState(prev => ({ ...prev, savedReports: [] }));
    }
  }, []);

  // const loadSavedReport = useCallback(async (reportIdentifier) => {
  //   try {
  //     console.log('Loading report with identifier:', reportIdentifier);
      
  //     const response = await fetch(`https://prowesstics.space/flask/reports/${encodeURIComponent(reportIdentifier)}`);
      
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Server response:', errorText);
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log('Loaded report data:', data);
      
  //     const report = data.report;
      
  //     if (!report) {
  //       throw new Error('No report data received');
  //     }
      
  //     updateState({
  //       selectedTable: report.table_name || '',
  //       selectedColumns: report.selected_columns || [],
  //       slicers: report.slicers || {},
  //       dashboardComponents: report.dashboard_components || [],
  //       charts: report.charts || initialState.charts,
  //       currentDashboardType: report.current_dashboard_type || 'default',
  //       categorizedColumns: null,
  //       columnsInfo: [],
  //       lastFetchedTable: "" // Reset to force fresh data fetch
  //     });
      
  //     setReportState(prev => ({
  //       ...prev,
  //       reportName: report.report_name || report.name || '',
  //       isLoadedReport: true,
  //     }));
      
  //     // Fetch table data for the loaded report
  //     if (report.table_name) {
  //       setTimeout(() => fetchTableData(report.table_name), 100);
  //     }
      
  //     openNotification("success", "Report Loaded", "Report loaded successfully!", "bottomRight");
      
  //   } catch (error) {
  //     console.error("Error loading report:", error);
  //     openNotification("error", "Load Failed", "Error loading report: " + error.message, "bottomRight");
  //   }
  // }, [updateState, openNotification, fetchTableData]);

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
        dashboard_components: state.dashboardComponents,
        charts: state.charts,
        current_dashboard_type: state.currentDashboardType || 'default',
        description: "",
        tags: [],
        created_by: "current_user"
      };

      console.log('Saving report data:', reportData);

      const response = await fetch("https://prowesstics.space/flask/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save response:', errorText);
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Save result:', result);
      
      // Refresh saved reports list
      fetchSavedReports();
      
      openNotification("success", "Report Saved", "Report saved successfully!", "bottomRight");
      
    } catch (error) {
      console.error("Error saving report:", error);
      openNotification("error", "Save Failed", "Error saving report: " + error.message, "bottomRight");
    }
  }, [reportState.reportName, state.selectedTable, state.selectedColumns, 
      state.slicers, state.dashboardComponents, state.charts, state.currentDashboardType, 
      openNotification, fetchSavedReports]);

  const deleteSavedReport = useCallback(async (reportIdentifier) => {
    if (!reportIdentifier) {
      openNotification("error", "Delete Failed", "Invalid report identifier", "bottomRight");
      return;
    }

    showConfirmModal(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      async () => {
        try {
          await apiCall(`https://prowesstics.space/flask/reports/${encodeURIComponent(reportIdentifier)}`, { method: "DELETE" });
          
          
          // Clear the report-related data and reset dashboard to initial state
          setReportState(prev => ({
            ...prev,
            reportName: "",
            question: "",
            aiResults: [],
            loadingAiResponse: false,
            isLoadedReport: false,
            reportIdentifier: null
          }));
          
          // Clear dashboard components to show template selection again
          setState(prev => ({
            ...prev,
            dashboardComponents: [],
            currentDashboardType: 'default',
            slicers: {},
            selectedColumns: [],
            tableData: []
          }));
          
          fetchSavedReports();
          openNotification("success", "Report Deleted", "Report deleted successfully!", "bottomRight");
        } catch (error) {
          openNotification("error", "Delete Failed", "Error deleting report: " + error.message, "bottomRight");
        }
      }
    );
  }, [openNotification, apiCall, showConfirmModal, fetchSavedReports, reportState, setReportState, setState]);

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

  const getColumnDataType = useCallback((columnName) => {
    if (!state.columnsInfo || !Array.isArray(state.columnsInfo)) return 'unknown';
    
    const columnInfo = state.columnsInfo.find(col => col.column_name === columnName);
    return columnInfo ? columnInfo.data_type : 'unknown';
  }, [state.columnsInfo]);

const clearComponentData = (component) => {
  // Create a fresh component with cleared data but preserve structure and settings
  const clearedComponent = {
    ...component,
    isConfigured: false, // Reset to configuration mode
    lastUpdated: Date.now() // Force re-render
  };

  // Clear data fields based on component type
  switch (component.type) {
    case 'kpi':
      return {
        ...clearedComponent,
        valueField: undefined,
        // Keep: kpiName, aggregationType, color, title
      };
    
    case 'chart':
      return {
        ...clearedComponent,
        fields: { xAxis: "", yAxis: "" },
        // Keep: chartName, chartType, title
      };
    
    case 'table':
      return {
        ...clearedComponent,
        tableColumns: [],
        // Keep: tableName, maxRows, title
      };
    
    case 'sparkline':
      return {
        ...clearedComponent,
        dataField: undefined,
        // Keep: title, color
      };
    
    case 'radialBar':
      return {
        ...clearedComponent,
        progressField: undefined,
        // Keep: title, color, label
      };
    
    default:
      return clearedComponent;
  }
};

  // const handleTableChange = useCallback((newTable) => {
  //   // If no components exist yet, just change the table without confirmation
  //   if (state.dashboardComponents.length === 0) {
  //     updateState({ selectedTable: newTable });
  //     return;
  //   }
    
  //   // If selecting the same table, do nothing
  //   if (newTable === state.selectedTable) {
  //     return;
  //   }
    
  //   // Show confirmation modal if dashboard has components
  //   showConfirmModal(
  //     "Change Table",
  //     `Changing the table will reset your current dashboard. All KPIs, charts, and tables will be removed. Are you sure you want to continue?`,
  //     () => {
  //       console.log(`🔄 Changing table from "${state.selectedTable}" to "${newTable}" - resetting dashboard`);
        
  //       // Reset the entire dashboard to initial state but preserve tables list
  //       setState(prev => ({
  //         ...initialState,
  //         tables: prev.tables, // Preserve loaded tables
  //         selectedTable: newTable, // Set the new table
  //       }));
        
  //       // Reset report state
  //       setReportState(prev => ({
  //         ...prev,
  //         reportName: "",
  //         question: "",
  //         aiResults: [],
  //         loadingAiResponse: false,
  //         isLoadedReport: false 
  //       }));
        
  //       // Show success notification
  //       openNotification(
  //         "success", 
  //         "Table Changed", 
  //         `Successfully switched to "${newTable}". Dashboard has been reset.`, 
  //         "bottomRight"
  //       );
  //     }
  //   );
  // }, [state.selectedTable, state.dashboardComponents.length, updateState, setState, setReportState, showConfirmModal, openNotification]);

  // Component management functions
  
  const handleTableChange = useCallback((newTable) => {
  // If no components exist yet, just change the table without confirmation
  if (state.dashboardComponents.length === 0) {
    updateState({ selectedTable: newTable });
    return;
  }
  
  // If selecting the same table, do nothing
  if (newTable === state.selectedTable) {
    return;
  }
  
  // Show confirmation modal if dashboard has components
  showConfirmModal(
    "Change Table",
    `Changing the table will remove selected columns and data but keep the dashboard layout. Continue?`,
    () => {
      console.log(`🔄 Changing table from "${state.selectedTable}" to "${newTable}" - clearing component data`);
      
      // Clear data from all components but preserve their structure
      const clearedComponents = state.dashboardComponents.map(clearComponentData);
      
      // Update state: change table, clear component data, reset filters and selections
      setState(prev => ({
        ...prev,
        selectedTable: newTable,
        dashboardComponents: clearedComponents,
        // Clear data-related state but preserve component structure
        selectedColumns: [],
        slicers: {},
        tableData: [],
        columns: [],
        rows: [],
        columnsInfo: [],
        categorizedColumns: null,
        lastFetchedTable: "" // Force fresh data fetch
      }));
      
      // Keep report name but mark as needs reconfiguration
      setReportState(prev => ({
        ...prev,
        question: "",
        aiResults: [],
        loadingAiResponse: false,
        // Keep: reportName, isLoadedReport
      }));
      
      // Show success notification
      openNotification(
        "success", 
        "Table Changed", 
        `Successfully switched to "${newTable}". Component data has been cleared - please reconfigure your KPIs, charts, and tables.`, 
        "bottomRight"
      );
    }
  );
}, [state.selectedTable, state.dashboardComponents, updateState, setState, setReportState, showConfirmModal, openNotification]);
  const addComponent = useCallback((componentType) => {
    const template = componentTemplates[componentType];
    if (!template) return;

    setState(prev => {
      // FIXED: Generate truly unique IDs using timestamp + random
      const uniqueId = prev.nextComponentId + Date.now() + Math.floor(Math.random() * 1000);
      
      const newComponent = {
        ...template,
        id: uniqueId, // FIXED: Ensure absolutely unique ID
        title: `${template.title} ${prev.nextComponentId}`,
        // FIXED: Initialize with empty/default values to prevent shared state
        valueField: undefined,
        kpiName: template.kpiName || '',
        aggregationType: template.aggregationType || 'sum',
        isConfigured: false,
        // FIXED: Add unique identifier to prevent reference sharing
        componentKey: `${componentType}_${uniqueId}`,
        lastUpdated: Date.now()
      };

      console.log(`Adding new component:`, newComponent);

      return {
        ...prev,
        dashboardComponents: [...prev.dashboardComponents, newComponent],
        nextComponentId: prev.nextComponentId + 1
      };
    });
  }, []);

  const removeComponent = useCallback((componentId) => {
    setState(prev => {
      const componentsBeforeRemoval = prev.dashboardComponents.length;
      const updatedComponents = prev.dashboardComponents.filter(comp => comp.id !== componentId);
      const componentsAfterRemoval = updatedComponents.length;
      
      console.log(`Removing component ${componentId}. Before: ${componentsBeforeRemoval}, After: ${componentsAfterRemoval}`);
      
      // FIXED: Force complete re-render of remaining components with fresh keys
      const refreshedComponents = updatedComponents.map((comp, index) => ({
        ...comp,
        // FIXED: Refresh component keys to force proper re-rendering
        componentKey: `${comp.type}_${comp.id}_${Date.now()}_${index}`,
        lastUpdated: Date.now()
      }));

      return {
        ...prev,
        dashboardComponents: refreshedComponents
      };
    });
  }, []);

  const updateComponent = useCallback((componentId, updates) => {
  // Store current scroll position BEFORE updating state
  const mainContent = document.querySelector(`.${styles.main}`);
  const scrollTop = mainContent?.scrollTop || 0;
  const scrollLeft = mainContent?.scrollLeft || 0;
  
  setState(prev => ({
    ...prev,
    dashboardComponents: prev.dashboardComponents.map(comp => 
      comp.id === componentId ? { 
        ...comp, 
        ...updates,
        // FIXED: Keep original behavior to prevent template switching issues
        lastUpdated: Date.now()
      } : comp
    )
  }));

  // Restore scroll position after React re-renders
  // Use both setTimeout and requestAnimationFrame for better reliability
  setTimeout(() => {
    const newMainContent = document.querySelector(`.${styles.main}`);
    if (newMainContent) {
      newMainContent.scrollTop = scrollTop;
      newMainContent.scrollLeft = scrollLeft;
    }
  }, 0);
  
  requestAnimationFrame(() => {
    const newMainContent = document.querySelector(`.${styles.main}`);
    if (newMainContent) {
      newMainContent.scrollTop = scrollTop;
      newMainContent.scrollLeft = scrollLeft;
    }
  });
}, []);
  const handleDropForComponent = useCallback((componentId, field, column) => {
    if (!componentId || !field || !column) return;
    
    const columnDataType = getColumnDataType(column);
    console.log('Dropping column', column, 'into component', componentId, 'field', field, 'type:', columnDataType);
    
    setState(prev => {
      // FIXED: Create completely isolated updates per component
      const updatedComponents = prev.dashboardComponents.map(comp => {
        if (comp.id === componentId) {
          // FIXED: Create a fresh component object to prevent reference sharing
          const updatedComponent = {
            ...comp,
            [field]: column,
            [`${field}_datatype`]: columnDataType,
            // FIXED: Force re-render by updating a timestamp
            lastUpdated: Date.now()
          };
          
          console.log(`Updated component ${componentId}:`, updatedComponent);
          return updatedComponent;
        }
        return comp;
      });

      return {
        ...prev,
        dashboardComponents: updatedComponents,
      };
    });
  }, [getColumnDataType]);


  const { handleFileUpload, handleAppendUpload, FileUploadModalComponent } = useFileUpload(
    openNotification, 
    fetchTables, 
    updateState
  );

  const handleDrop = useCallback((column) => {
    if (!column || state.selectedColumns.includes(column)) return;
    
    const updated = [...state.selectedColumns, column];
    const filtered = state.rows.map((row) => 
      Object.fromEntries(updated.map((col) => [col, row[col]]))
    );
    
    updateState({ 
      selectedColumns: updated, 
      tableData: filtered 
    });
  }, [state.selectedColumns, state.rows, updateState]);

  const removeColumn = useCallback((column) => {
    const updated = state.selectedColumns.filter((col) => col !== column);
    const filtered = state.rows.map((row) => 
      Object.fromEntries(updated.map((col) => [col, row[col]]))
    );
    
    updateState({ 
      selectedColumns: updated, 
      tableData: filtered 
    });
  }, [state.selectedColumns, state.rows, updateState]);

  const filteredRows = useMemo(() => {
    if (!Array.isArray(state.rows)) return [];
    return state.rows.filter((row) => {
      if (!row) return false;
      return Object.entries(state.slicers).every(([column, values]) => {
        if (!Array.isArray(values)) return true;
        return values.includes("Select All") || values.length === 0 || values.includes(row[column]);
      });
    });
  }, [state.rows, state.slicers]);

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

  // useEffect(() => {
  //   const shouldLoadFirst = location.state?.loadFirstReport === true;
    
  //   if (shouldLoadFirst) {
  //     console.log("Detected loadFirstReport flag, fetching and loading first report...");
      
  //     const loadFirstReportFromAPI = async () => {
  //       try {
  //         console.log("Fetching saved reports from API...");
          
  //         const response = await fetch("https://prowesstics.space/flask/reports");
          
  //         if (!response.ok) {
  //           throw new Error(`HTTP error! status: ${response.status}`);
  //         }
          
  //         const data = await response.json();
  //         console.log("API Response:", data);
          
  //         let reports = [];
  //         if (Array.isArray(data)) {
  //           reports = data;
  //         } else if (data.reports && Array.isArray(data.reports)) {
  //           reports = data.reports;
  //         } else if (data.data && Array.isArray(data.data)) {
  //           reports = data.data;
  //         }
          
  //         console.log("Processed reports:", reports);
          
  //         if (reports.length > 0) {
  //           const firstReport = reports[0];
  //           console.log("Loading first report:", firstReport);
            
  //           setReportState((prev) => ({ ...prev, savedReports: reports }));
            
  //           setTimeout(() => {
  //             const reportId = firstReport.id || firstReport.report_name;
  //             console.log("Calling loadSavedReport with ID:", reportId);
  //             loadSavedReport(reportId);
  //           }, 200);
  //         } else {
  //           console.log("No saved reports found");
  //         }
          
  //       } catch (error) {
  //         console.error("Error fetching/loading first report:", error);
  //       }
  //     };
      
  //     loadFirstReportFromAPI();
      
  //     // Clear the state flag to prevent re-execution
  //     window.history.replaceState({}, '', location.pathname);
  //   }
  // }, []); // Empty dependency array to run only once
  useEffect(() => {
    const shouldLoadFirst = location.state?.loadFirstReport === true;
    
    // ✅ FIX: Check for recent execution to prevent duplicates
    const lastExecution = window.lastReportLoadExecution || 0;
    const timeSinceLastExecution = Date.now() - lastExecution;
    
    if (shouldLoadFirst && timeSinceLastExecution > 3000) { // 3 second cooldown
      console.log("Detected loadFirstReport flag, fetching and loading first report...");
      
      // Mark execution time
      window.lastReportLoadExecution = Date.now();
      
      const loadFirstReportFromAPI = async () => {
        try {
          console.log("Fetching saved reports from API...");
          
          const response = await fetch("https://prowesstics.space/flask/reports");
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("API Response:", data);
          
          let reports = [];
          if (Array.isArray(data)) {
            reports = data;
          } else if (data.reports && Array.isArray(data.reports)) {
            reports = data.reports;
          } else if (data.data && Array.isArray(data.data)) {
            reports = data.data;
          }
          
          console.log("Processed reports:", reports);
          
          if (reports.length > 0) {
            const firstReport = reports[0];
            console.log("Loading first report:", firstReport);
            
            setReportState((prev) => ({ ...prev, savedReports: reports }));
            
            setTimeout(() => {
              const reportId = firstReport.id || firstReport.report_name;
              console.log("Calling loadSavedReport with ID:", reportId);
              loadSavedReport(reportId);
            }, 200);
          } else {
            console.log("No saved reports found");
          }
          
        } catch (error) {
          console.error("Error fetching/loading first report:", error);
        }
      };
      
      loadFirstReportFromAPI();
      
      // Clear the state flag to prevent re-execution
      window.history.replaceState({}, '', location.pathname);
    }
  }, []);

  useEffect(() => {
    if (location.hash === '#templates') {
      const templatesSection = document.getElementById('templates');
      if (templatesSection) {
        templatesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (!location.state?.loadFirstReport) {
      fetchSavedReports();
    }
  }, [fetchSavedReports]);

  // const exportDashboardToPDF = async () => {
  //   try {
  //     // Use the specific main content selector from your CSS modules
  //     const mainContent = document.querySelector(`.${styles.main}`);
  //     if (!mainContent) {
  //       openNotification("error", "Export Failed", "No content to export", "bottomRight");
  //       return;
  //     }

  //     console.log('Selected element for capture:', mainContent);

  //     const originalCursor = document.body.style.cursor;
  //     document.body.style.cursor = 'wait';

  //     // Store original scroll position
  //     const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  //     const originalScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  //     window.scrollTo(0, 0);

  //     // Helper function to safely get className as string
  //     const getClassName = (element) => {
  //       if (!element.className) return '';
  //       return typeof element.className === 'string' ? element.className : element.className.baseVal || '';
  //     };

  //     // Find elements to hide during PDF export - search within mainContent
  //     const elementsToHide = [];
      
  //     // 1. Hide ALL sidebar elements (even if they're outside mainContent)
  //     const sidebarElements = document.querySelectorAll('.sidebar, [class*="sidebar"], .sider, [class*="sider"], .ant-layout-sider, .side-nav, [class*="side-nav"], .navigation-sidebar, [class*="nav-sidebar"]');
  //     elementsToHide.push(...sidebarElements);
      
  //     // Enhanced filter preservation logic
  //     const isFilterElement = (element) => {
  //       // Check if element is within filter container
  //       const filterContainer = element.closest('[class*="filter"]') || 
  //                             element.closest('.filters') ||
  //                             element.closest('[data-filter]');
        
  //       if (filterContainer) return true;
        
  //       // Check element text and attributes for filter-related content
  //       const text = element.textContent?.toLowerCase() || '';
  //       // Safe className handling for both string and object cases
  //       const className = typeof element.className === 'string' ? 
  //                       element.className.toLowerCase() : 
  //                       (element.className?.toString?.()?.toLowerCase() || '');
  //       const title = element.title?.toLowerCase() || '';
        
  //       // Preserve filter-related elements
  //       const filterKeywords = ['filters:', 'clear all', 'churn', 'gender', 'seniorcitizen', 'tenure'];
  //       const hasFilterText = filterKeywords.some(keyword => 
  //         text.includes(keyword) || className.includes(keyword) || title.includes(keyword)
  //       );
        
  //       // Check if it's a dropdown or filter control
  //       const isFilterControl = element.tagName === 'SELECT' ||
  //                             element.classList.contains('ant-select') ||
  //                             element.classList.contains('filter-dropdown') ||
  //                             element.getAttribute('role') === 'combobox' ||
  //                             element.closest('.ant-select') ||
  //                             element.closest('[role="combobox"]');
        
  //       // Check for filter badge/tag elements (like your blue filter tags)
  //       const isFilterTag = element.classList.contains('ant-tag') ||
  //                         element.classList.contains('filter-tag') ||
  //                         element.style.backgroundColor?.includes('blue') ||
  //                         (element.parentElement && element.parentElement.style.backgroundColor?.includes('blue'));
        
  //       return hasFilterText || isFilterControl || isFilterTag;
  //     };

  //     // Hide export buttons and edit buttons but preserve filters
  //     const elementsToHideQuery = mainContent.querySelectorAll(`
  //       .export-btn, 
  //       .action-btn,
  //       .ant-pagination,
  //       .pagination,
  //       .edit-btn,
  //       .settings-btn,
  //       [data-testid*="export"],
  //       [data-testid*="edit"],
  //       [class*="export-button"],
  //       [class*="action-button"],
  //       [class*="edit-button"],
  //       [class*="pdf-card"],
  //       [class*="excel"],
  //       [class*="table-export"],
  //       button[class*="export"],
  //       button[class*="edit"],
  //       button[title*="Export"],
  //       button[title*="PDF"],
  //       button[title*="Excel"],
  //       button[title*="Download"],
  //       button[title*="Edit"],
  //       button[title*="Settings"],
  //       button[title*="KPI"],
  //       button[title*="Chart"],
  //       button[title*="Table"]
  //     `);
      
  //     // Convert NodeList to Array and filter out filter elements
  //     const specificElementsToHide = Array.from(elementsToHideQuery).filter(el => !isFilterElement(el));
  //     elementsToHide.push(...specificElementsToHide);
      
  //     // More aggressive button detection but preserve filter elements
  //     const allButtons = mainContent.querySelectorAll('button, .ant-btn, [role="button"]');
  //     allButtons.forEach(btn => {
  //       // Skip if this is a filter element
  //       if (isFilterElement(btn)) return;
        
  //       const text = btn.textContent?.toLowerCase() || '';
  //       const title = btn.title?.toLowerCase() || '';
  //       // Safe className handling
  //       const className = typeof btn.className === 'string' ? 
  //                       btn.className.toLowerCase() : 
  //                       (btn.className?.toString?.()?.toLowerCase() || '');
        
  //       const hasExportText = text.includes('pdf') || text.includes('excel') || 
  //                           text.includes('export') || text.includes('download') || 
  //                           text.includes('edit') || text.includes('settings') ||
  //                           text.includes('kpi card') || text.includes('chart') || 
  //                           text.includes('table') || text.includes('exit') ||
  //                           title.includes('pdf') || title.includes('excel') ||
  //                           title.includes('export') || title.includes('edit') ||
  //                           title.includes('kpi') || title.includes('chart') ||
  //                           text.includes('Change Template') || text.includes('🔄') ||
  //                           className.includes('export') || className.includes('edit') ||
  //                           className.includes('action');
        
  //       if (hasExportText && !elementsToHide.includes(btn)) {
  //         elementsToHide.push(btn);
  //       }
  //     });

  //     // Store original styles and hide elements
  //     const hiddenElements = [];
  //     elementsToHide.forEach(el => {
  //       if (el && el.style.display !== 'none') {
  //         hiddenElements.push({
  //           element: el,
  //           originalDisplay: el.style.display,
  //           originalVisibility: el.style.visibility
  //         });
  //         el.style.display = 'none';
  //       }
  //     });

  //     // Store original styles of the main content
  //     const originalStyles = {
  //       position: mainContent.style.position,
  //       overflow: mainContent.style.overflow,
  //       overflowX: mainContent.style.overflowX,
  //       overflowY: mainContent.style.overflowY,
  //       height: mainContent.style.height,
  //       maxHeight: mainContent.style.maxHeight,
  //       width: mainContent.style.width,
  //       maxWidth: mainContent.style.maxWidth,
  //       transform: mainContent.style.transform,
  //       left: mainContent.style.left,
  //       top: mainContent.style.top,
  //       zIndex: mainContent.style.zIndex
  //     };

  //     // Apply styles for PDF export
  //     Object.assign(mainContent.style, {
  //       position: 'static',
  //       overflow: 'visible',
  //       overflowX: 'visible',
  //       overflowY: 'visible',
  //       height: 'auto',
  //       maxHeight: 'none',
  //       width: 'auto',
  //       maxWidth: 'none',
  //       transform: 'none',
  //       left: 'auto',
  //       top: 'auto',
  //       zIndex: 'auto'
  //     });

  //     // Handle all scrollable child elements
  //     const allElements = mainContent.querySelectorAll('*');
  //     const modifiedElements = [];

  //     allElements.forEach(el => {
  //       const computedStyle = window.getComputedStyle(el);
  //       const hasScrolling = computedStyle.overflow !== 'visible' || 
  //                           computedStyle.overflowX !== 'visible' || 
  //                           computedStyle.overflowY !== 'visible';
  //       const hasPositioning = computedStyle.position === 'fixed' || 
  //                             computedStyle.position === 'absolute' || 
  //                             computedStyle.position === 'sticky';

  //       if (hasScrolling || hasPositioning) {
  //         const originalElementStyles = {
  //           element: el,
  //           position: el.style.position,
  //           overflow: el.style.overflow,
  //           overflowX: el.style.overflowX,
  //           overflowY: el.style.overflowY,
  //           height: el.style.height,
  //           maxHeight: el.style.maxHeight,
  //           width: el.style.width,
  //           maxWidth: el.style.maxWidth,
  //           transform: el.style.transform,
  //           top: el.style.top,
  //           left: el.style.left,
  //           right: el.style.right,
  //           bottom: el.style.bottom,
  //           zIndex: el.style.zIndex
  //         };
          
  //         modifiedElements.push(originalElementStyles);

  //         // Apply PDF-friendly styles but preserve layout structure
  //         if (hasPositioning) {
  //           el.style.position = 'static';
  //           el.style.top = 'auto';
  //           el.style.left = 'auto';
  //           el.style.right = 'auto';
  //           el.style.bottom = 'auto';
  //           el.style.transform = 'none';
  //           el.style.zIndex = 'auto';
  //         }

  //         if (hasScrolling) {
  //           el.style.overflow = 'visible';
  //           el.style.overflowX = 'visible';
  //           el.style.overflowY = 'visible';
  //           el.style.height = 'auto';
  //           el.style.maxHeight = 'none';
  //         }

  //         // Special handling for tables
  //         if (el.tagName === 'TABLE' || el.classList.contains('ant-table') || el.closest('table')) {
  //           el.style.width = '100%';
  //           el.style.tableLayout = 'auto';
  //         }
  //       }
  //     });

  //     // Force layout recalculation
  //     void mainContent.offsetHeight;
      
  //     // Wait for layout to stabilize
  //     await new Promise(resolve => setTimeout(resolve, 500));

  //     // Get the actual content dimensions
  //     const rect = mainContent.getBoundingClientRect();
  //     const actualWidth = Math.max(
  //       mainContent.scrollWidth, 
  //       mainContent.offsetWidth, 
  //       rect.width
  //     );
  //     const actualHeight = Math.max(
  //       mainContent.scrollHeight, 
  //       mainContent.offsetHeight, 
  //       rect.height
  //     );

  //     console.log('Content dimensions:', { actualWidth, actualHeight });

  //     // Capture with html2canvas - optimized for smaller file size
  //     const canvas = await html2canvas(mainContent, {
  //       scale: 1, // Use scale 1 for smaller file size
  //       useCORS: true,
  //       allowTaint: true,
  //       backgroundColor: '#ffffff',
  //       width: actualWidth,
  //       height: actualHeight,
  //       scrollX: 0,
  //       scrollY: 0,
  //       x: 0,
  //       y: 0,
  //       windowWidth: actualWidth,
  //       windowHeight: actualHeight,
  //       foreignObjectRendering: false,
  //       removeContainer: false,
  //       logging: false,
  //       onclone: (clonedDoc) => {
  //         // Ensure cloned document has proper styles
  //         const clonedMain = clonedDoc.querySelector(`.${styles.main}`);
  //         if (clonedMain) {
  //           clonedMain.style.position = 'static';
  //           clonedMain.style.transform = 'none';
  //           clonedMain.style.overflow = 'visible';
  //           clonedMain.style.width = 'auto';
  //           clonedMain.style.maxWidth = 'none';
  //         }

  //         // Fix tables in cloned document
  //         const tables = clonedDoc.querySelectorAll('table, .ant-table');
  //         tables.forEach(table => {
  //           table.style.width = '100%';
  //           table.style.height = 'auto';
  //           table.style.overflow = 'visible';
  //           table.style.tableLayout = 'auto';
  //         });
  //       },
  //       ignoreElements: (element) => {
  //         return element.classList?.contains('sidebar') || 
  //               element.classList?.contains('no-print') ||
  //               element.tagName === 'SCRIPT' ||
  //               element.tagName === 'STYLE' ||
  //               element.hasAttribute('data-html2canvas-ignore') ||
  //               element.style.display === 'none';
  //       }
  //     });

  //     console.log('Canvas created:', { width: canvas.width, height: canvas.height });

  //     // Restore all original styles
  //     Object.assign(mainContent.style, originalStyles);
      
  //     modifiedElements.forEach(styleData => {
  //       const el = styleData.element;
  //       Object.keys(styleData).forEach(prop => {
  //         if (prop !== 'element') {
  //           el.style[prop] = styleData[prop];
  //         }
  //       });
  //     });

  //     // Restore hidden elements
  //     hiddenElements.forEach(({ element, originalDisplay, originalVisibility }) => {
  //       element.style.display = originalDisplay;
  //       if (originalVisibility) {
  //         element.style.visibility = originalVisibility;
  //       }
  //     });

  //     // Restore scroll position
  //     window.scrollTo(originalScrollLeft, originalScrollTop);

  //     // Create PDF with proper dimensions - SINGLE PAGE ONLY
  //     const imgWidth = canvas.width;
  //     const imgHeight = canvas.height;
      
  //     // Use A4 landscape for better fit
  //     const pdf = new jsPDF('l', 'mm', 'a4');
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();
      
  //     // Add margins
  //     const margin = 10;
  //     const availableWidth = pdfWidth - (margin * 2);
  //     const availableHeight = pdfHeight - (margin * 2);
      
  //     const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
  //     // Calculate scaling to fit content on single page
  //     const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
  //     const finalWidth = imgWidth * ratio;  
  //     const finalHeight = imgHeight * ratio;

  //     // Center the image on the page
  //     const x = margin + (availableWidth - finalWidth) / 2;
  //     const y = margin + (availableHeight - finalHeight) / 2;
      
  //     // Add image to PDF - always single page
  //     pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      
  //     const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  //     const filename = `dashboard_${timestamp}.pdf`;
  //     pdf.save(filename);
      
  //     document.body.style.cursor = originalCursor;
  //     openNotification("success", "Export Successful", "Dashboard exported to PDF", "bottomRight");
      
  //   } catch (error) {
  //     console.error('PDF export failed:', error);
  //     openNotification("error", "Export Failed", `Failed to export dashboard: ${error.message}`, "bottomRight");
  //     document.body.style.cursor = 'auto';
  //   }
  // };

// const exportDashboardToPDF = async () => {
//   try {
//     // Use the specific main content selector from your CSS modules
//     const mainContent = document.querySelector(`.${styles.main}`);
//     if (!mainContent) {
//       openNotification("error", "Export Failed", "No content to export", "bottomRight");
//       return;
//     }

const exportDashboardToPDF = async () => {
  let modifiedElements = [];
  let hiddenElements = [];
  let originalStyles = {};
  let mainContent = null;
  
  try {
    mainContent = document.querySelector(`.${styles.main}`);
    if (!mainContent) {
      openNotification("error", "Export Failed", "No content to export", "bottomRight");
      return;
    }

    console.log('Selected element for capture:', mainContent);

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    // Store original scroll position
    const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const originalScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    window.scrollTo(0, 0);

    // Enhanced filter preservation logic
    const isFilterElement = (element) => {
      const filterContainer = element.closest('[class*="filter"]') || 
                            element.closest('.filters') ||
                            element.closest('[data-filter]');
      
      if (filterContainer) return true;
      
      const text = element.textContent?.toLowerCase() || '';
      const className = typeof element.className === 'string' ? 
                      element.className.toLowerCase() : 
                      (element.className?.toString?.()?.toLowerCase() || '');
      const title = element.title?.toLowerCase() || '';
      
      const filterKeywords = ['filters:', 'clear all', 'churn', 'gender', 'seniorcitizen', 'tenure'];
      const hasFilterText = filterKeywords.some(keyword => 
        text.includes(keyword) || className.includes(keyword) || title.includes(keyword)
      );
      
      const isFilterControl = element.tagName === 'SELECT' ||
                            element.classList.contains('ant-select') ||
                            element.classList.contains('filter-dropdown') ||
                            element.getAttribute('role') === 'combobox' ||
                            element.closest('.ant-select') ||
                            element.closest('[role="combobox"]');
      
      const isFilterTag = element.classList.contains('ant-tag') ||
                        element.classList.contains('filter-tag') ||
                        element.style.backgroundColor?.includes('blue') ||
                        (element.parentElement && element.parentElement.style.backgroundColor?.includes('blue'));
      
      return hasFilterText || isFilterControl || isFilterTag;
    };

    // Find elements to hide during PDF export
    const elementsToHide = [];
    
    // Hide sidebar elements
    const sidebarElements = document.querySelectorAll('.sidebar, [class*="sidebar"], .sider, [class*="sider"], .ant-layout-sider, .side-nav, [class*="side-nav"], .navigation-sidebar, [class*="nav-sidebar"]');
    elementsToHide.push(...sidebarElements);
    
    // Hide export buttons and edit buttons but preserve filters
    const elementsToHideQuery = mainContent.querySelectorAll(`
      .export-btn, 
      .action-btn,
      .ant-pagination,
      .pagination,
      .edit-btn,
      .settings-btn,
      [data-testid*="export"],
      [data-testid*="edit"],
      [class*="export-button"],
      [class*="action-button"],
      [class*="edit-button"],
      [class*="pdf-card"],
      [class*="excel"],
      [class*="table-export"],
      button[class*="export"],
      button[class*="edit"],
      button[title*="Export"],
      button[title*="PDF"],
      button[title*="Excel"],
      button[title*="Download"],
      button[title*="Edit"],
      button[title*="Settings"],
      button[title*="KPI"],
      button[title*="Chart"],
      button[title*="Table"]
    `);
    
    const specificElementsToHide = Array.from(elementsToHideQuery).filter(el => !isFilterElement(el));
    elementsToHide.push(...specificElementsToHide);
    
    // More aggressive button detection but preserve filter elements
    const allButtons = mainContent.querySelectorAll('button, .ant-btn, [role="button"]');
    allButtons.forEach(btn => {
      if (isFilterElement(btn)) return;
      
      const text = btn.textContent?.toLowerCase() || '';
      const title = btn.title?.toLowerCase() || '';
      const className = typeof btn.className === 'string' ? 
                      btn.className.toLowerCase() : 
                      (btn.className?.toString?.()?.toLowerCase() || '');
      
      const hasExportText = text.includes('pdf') || text.includes('excel') || 
                          text.includes('export') || text.includes('download') || 
                          text.includes('edit') || text.includes('settings') ||
                          text.includes('kpi card') || text.includes('chart') || 
                          text.includes('table') || text.includes('exit') ||
                          title.includes('pdf') || title.includes('excel') ||
                          title.includes('export') || title.includes('edit') ||
                          title.includes('kpi') || title.includes('chart') ||
                          text.includes('Change Template') || text.includes('🔄') ||
                          className.includes('export') || className.includes('edit') ||
                          className.includes('action');
      
      if (hasExportText && !elementsToHide.includes(btn)) {
        elementsToHide.push(btn);
      }
    });

    // Store original styles and hide elements
    hiddenElements = [];
    elementsToHide.forEach(el => {
      if (el && el.style.display !== 'none') {
        hiddenElements.push({
          element: el,
          originalDisplay: el.style.display,
          originalVisibility: el.style.visibility
        });
        el.style.display = 'none';
      }
    });

    // Store and apply styles for PDF export
    originalStyles = {
      position: mainContent.style.position,
      overflow: mainContent.style.overflow,
      overflowX: mainContent.style.overflowX,
      overflowY: mainContent.style.overflowY,
      height: mainContent.style.height,
      maxHeight: mainContent.style.maxHeight,
      width: mainContent.style.width,
      maxWidth: mainContent.style.maxWidth,
      transform: mainContent.style.transform,
      left: mainContent.style.left,
      top: mainContent.style.top,
      zIndex: mainContent.style.zIndex
    };

    Object.assign(mainContent.style, {
      position: 'static',
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
      height: 'auto',
      maxHeight: 'none',
      width: 'auto',
      maxWidth: 'none',
      transform: 'none',
      left: 'auto',
      top: 'auto',
      zIndex: 'auto'
    });

    // Handle scrollable child elements
    const allElements = mainContent.querySelectorAll('*');
    modifiedElements = [];

    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const hasScrolling = computedStyle.overflow !== 'visible' || 
                          computedStyle.overflowX !== 'visible' || 
                          computedStyle.overflowY !== 'visible';
      const hasPositioning = computedStyle.position === 'fixed' || 
                            computedStyle.position === 'absolute' || 
                            computedStyle.position === 'sticky';

      if (hasScrolling || hasPositioning) {
        const originalElementStyles = {
          element: el,
          position: el.style.position,
          overflow: el.style.overflow,
          overflowX: el.style.overflowX,
          overflowY: el.style.overflowY,
          height: el.style.height,
          maxHeight: el.style.maxHeight,
          width: el.style.width,
          maxWidth: el.style.maxWidth,
          transform: el.style.transform,
          top: el.style.top,
          left: el.style.left,
          right: el.style.right,
          bottom: el.style.bottom,
          zIndex: el.style.zIndex
        };
        
        modifiedElements.push(originalElementStyles);

        if (hasPositioning) {
          el.style.position = 'static';
          el.style.top = 'auto';
          el.style.left = 'auto';
          el.style.right = 'auto';
          el.style.bottom = 'auto';
          el.style.transform = 'none';
          el.style.zIndex = 'auto';
        }

        if (hasScrolling) {
          el.style.overflow = 'visible';
          el.style.overflowX = 'visible';
          el.style.overflowY = 'visible';
          el.style.height = 'auto';
          el.style.maxHeight = 'none';
        }

        if (el.tagName === 'TABLE' || el.classList.contains('ant-table') || el.closest('table')) {
          el.style.width = '100%';
          el.style.tableLayout = 'auto';
        }
      }
    });

    // Force layout recalculation
    void mainContent.offsetHeight;
    await new Promise(resolve => setTimeout(resolve, 500));

    // IMPROVED TABLE DETECTION
    const dashboardComponents = state.dashboardComponents || [];
    const tableComponents = dashboardComponents.filter(comp => comp.type === 'table' && comp.isConfigured);
    
    console.log(`Found ${tableComponents.length} configured table components`);
    
    let nonTableContent = null;
    let hasLargeTables = tableComponents.some(comp => (filteredRows?.length || 0) > 20);

    // Create non-table content (KPIs, charts, filters)
    if (tableComponents.length > 0) {
      const mainContentClone = mainContent.cloneNode(true);
      
      // Remove all table containers from the clone
      const tableContainersInClone = mainContentClone.querySelectorAll('table, .ant-table, [class*="table"]:not([class*="table-export"])');
      tableContainersInClone.forEach(tableEl => {
        let containerToRemove = tableEl.closest('[style*="background: linear-gradient"]') || 
                               tableEl.closest('.table-container') ||
                               tableEl.closest('[class*="card"]') ||
                               tableEl.parentElement;
        
        if (containerToRemove && containerToRemove !== mainContentClone) {
          containerToRemove.remove();
        } else {
          tableEl.remove();
        }
      });
      
      nonTableContent = mainContentClone;
    }

    // Initialize PDF
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pdfWidth - (margin * 2);
    const availableHeight = pdfHeight - (margin * 2);

    // FIRST PAGE: Non-table content (KPI cards, charts, filters) - KEEP ORIGINAL SIZING
    if (nonTableContent && nonTableContent.children.length > 0) {
      nonTableContent.style.cssText = `
        position: static;
        overflow: visible;
        width: 100%;
        background: #ffffff;
        padding: 20px;
        box-sizing: border-box;
      `;

      // MINIMAL changes - only fix positioning issues, keep sizing as-is
      const allChildren = nonTableContent.querySelectorAll('*');
      allChildren.forEach(child => {
        if (child.style.position === 'fixed' || child.style.position === 'absolute') {
          child.style.position = 'static';
        }
        if (child.style.overflow === 'hidden') {
          child.style.overflow = 'visible';
        }
      });

      document.body.appendChild(nonTableContent);
      await new Promise(resolve => setTimeout(resolve, 300));

      const nonTableCanvas = await html2canvas(nonTableContent, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false,
        width: nonTableContent.scrollWidth,
        height: nonTableContent.scrollHeight
      });

      const nonTableImgData = nonTableCanvas.toDataURL('image/jpeg', 0.9);
      const nonTableRatio = Math.min(
        availableWidth / nonTableCanvas.width, 
        availableHeight / nonTableCanvas.height
      ) * 0.85;
      
      const nonTableWidth = nonTableCanvas.width * nonTableRatio;
      const nonTableHeight = nonTableCanvas.height * nonTableRatio;
      
      const nonTableX = margin + (availableWidth - nonTableWidth) / 2;
      const nonTableY = margin;

      pdf.addImage(nonTableImgData, 'JPEG', nonTableX, nonTableY, nonTableWidth, nonTableHeight);
      document.body.removeChild(nonTableContent);
      
      console.log('Added non-table content (KPIs, charts, filters) to first page');
    }

    // SUBSEQUENT PAGES: Process each table component individually
    if (tableComponents.length > 0) {
      console.log(`Processing ${tableComponents.length} table component(s) individually...`);
      
      for (let tableIndex = 0; tableIndex < tableComponents.length; tableIndex++) {
        const tableComponent = tableComponents[tableIndex];
        const tableData = filteredRows || [];
        const tableColumns = tableComponent.tableColumns || [];
        const tableName = tableComponent.tableName || `Table ${tableIndex + 1}`;
        const maxRows = tableComponent.maxRows || 10;
        
        const displayData = tableData.slice(0, maxRows);
        
        console.log(`\nProcessing Table Component ${tableIndex + 1}:`);
        console.log(`- Title: ${tableName}`);
        console.log(`- Columns: ${tableColumns.length}`);
        console.log(`- Rows: ${displayData.length}`);
        console.log(`- Max rows: ${maxRows}`);
        
        const isLarge = displayData.length > 20;
        
        if (isLarge) {
          const rowsPerPage = 50;
          const totalPages = Math.ceil(displayData.length / rowsPerPage);
          console.log(`- Will create ${totalPages} pages for this table`);

          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const shouldAddNewPage = !(tableIndex === 0 && pageIndex === 0 && (!nonTableContent || nonTableContent.children.length === 0));
            if (shouldAddNewPage) {
              pdf.addPage();
              console.log(`  Added new page for Table ${tableIndex + 1}, Page ${pageIndex + 1}`);
            }

            const startIndex = pageIndex * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, displayData.length);
            const pageRows = displayData.slice(startIndex, endIndex);

            // Create table section - KEEP ORIGINAL TABLE SIZE, only fix title
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
              position: static;
              overflow: visible;
              width: 100%;
              background: #ffffff;
              padding: 15px;
              box-sizing: border-box;
            `;

            // Create table first to get its actual width
            const tempTable = document.createElement('table');
            tempTable.style.cssText = `
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              font-family: var(--app-font-family);
              background: linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%);
              margin: 0;
              padding: 0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0px 4px 20px rgba(24, 62, 117, 0.1);
            `;

            // Add header
            if (tableColumns.length > 0) {
              const tempThead = document.createElement('thead');
              const headerRow = document.createElement('tr');
              headerRow.style.cssText = `
                background: rgba(24, 62, 117, 0.95);
                color: #ffffff;
              `;
              
              tableColumns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                th.style.cssText = `
                  padding: 12px 10px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                  text-align: left;
                  font-family: var(--app-font-family);
                  font-weight: bold;
                  font-size: 12px;
                  color: #ffffff;
                  min-width: 120px;
                  white-space: nowrap;
                `;
                headerRow.appendChild(th);
              });
              
              tempThead.appendChild(headerRow);
              tempTable.appendChild(tempThead);
            }

            // Add body
            const tempTbody = document.createElement('tbody');
            pageRows.forEach((row, idx) => {
              const tr = document.createElement('tr');
              tr.style.cssText = `
                background: ${idx % 2 === 0 ? 'rgba(33, 91, 153, 0.85)' : 'rgba(24, 62, 117, 0.85)'};
                color: #ffffff;
              `;
              
              tableColumns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] !== undefined && row[col] !== null ? row[col].toString() : '-';
                td.style.cssText = `
                  padding: 10px;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  font-size: 11px;
                  font-family: var(--app-font-family);
                  color: #ffffff;
                  min-width: 120px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                `;
                tr.appendChild(td);
              });
              
              tempTbody.appendChild(tr);
            });
            tempTable.appendChild(tempTbody);
            tempContainer.appendChild(tempTable);

            // Add table to body temporarily to measure it
            document.body.appendChild(tempContainer);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get actual table width
            const actualTableWidth = tempTable.offsetWidth;

            // NOW create title that matches table width exactly
            const titleElement = document.createElement('div');
            titleElement.textContent = tableName;
            titleElement.style.cssText = `
              margin: 0 0 20px 0;
              padding: 15px;
              font-size: 20px;
              font-weight: bold;
              font-family: var(--app-font-family);
              text-align: center;
              background: linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%);
              color: #ffffff;
              border-radius: 8px;
              box-shadow: 0px 4px 20px rgba(24, 62, 117, 0.2);
              width: ${actualTableWidth}px;
              box-sizing: border-box;
            `;

            // Insert title before table
            tempContainer.insertBefore(titleElement, tempTable);

            await new Promise(resolve => setTimeout(resolve, 200));

            const tableCanvas = await html2canvas(tempContainer, {
              scale: 1.3,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              foreignObjectRendering: false,
              width: tempContainer.scrollWidth,
              height: tempContainer.scrollHeight
            });

            const tableImgData = tableCanvas.toDataURL('image/jpeg', 0.9);
            
            const canvasRatio = tableCanvas.width / tableCanvas.height;
            const pageRatio = availableWidth / availableHeight;
            
            let finalWidth, finalHeight;
            if (canvasRatio > pageRatio) {
              finalWidth = availableWidth * 0.95;
              finalHeight = finalWidth / canvasRatio;
            } else {
              finalHeight = availableHeight * 0.9;
              finalWidth = finalHeight * canvasRatio;
            }
            
            const tableX = margin + (availableWidth - finalWidth) / 2;
            const tableY = margin + (availableHeight - finalHeight) / 2;

            pdf.addImage(tableImgData, 'JPEG', tableX, tableY, finalWidth, finalHeight);

            // Add page info at bottom
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            const pageInfo = pageIndex === 0 && totalPages === 1 ? 
              `${tableName} • ${displayData.length} rows` :
              `${tableName} • Page ${pageIndex + 1}/${totalPages} • Rows ${startIndex + 1}-${endIndex} of ${displayData.length}`;
            pdf.text(pageInfo, margin, pdfHeight - 5);

            document.body.removeChild(tempContainer);
            console.log(`  ✓ Processed ${tableName}, Page ${pageIndex + 1}/${totalPages} with rows ${startIndex + 1}-${endIndex}`);
          }
        } else {
          // Single page for smaller tables
          const shouldAddNewPage = !(tableIndex === 0 && (!nonTableContent || nonTableContent.children.length === 0));
          if (shouldAddNewPage) {
            pdf.addPage();
            console.log(`  Added new page for ${tableName} (single page)`);
          }

          // Create complete table section
          const tempContainer = document.createElement('div');
          tempContainer.style.cssText = `
            position: static;
            overflow: visible;
            width: 100%;
            background: #ffffff;
            padding: 15px;
            box-sizing: border-box;
          `;

          // Create table first
          const tempTable = document.createElement('table');
          tempTable.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            font-family: var(--app-font-family);
            background: linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%);
            margin: 0;
            padding: 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0px 4px 20px rgba(24, 62, 117, 0.1);
          `;

          // Add header
          if (tableColumns.length > 0) {
            const tempThead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.cssText = `
              background: rgba(24, 62, 117, 0.95);
              color: #ffffff;
            `;
            
            tableColumns.forEach(col => {
              const th = document.createElement('th');
              th.textContent = col;
              th.style.cssText = `
                padding: 12px 10px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                text-align: left;
                font-weight: bold;
                font-family: var(--app-font-family);                font-size: 13px;
                color: #ffffff;
                min-width: 120px;
                white-space: nowrap;
              `;
              headerRow.appendChild(th);
            });
            
            tempThead.appendChild(headerRow);
            tempTable.appendChild(tempThead);
          }

          // Add all rows
          const tempTbody = document.createElement('tbody');
          displayData.forEach((row, idx) => {
            const tr = document.createElement('tr');
            tr.style.cssText = `
              background: ${idx % 2 === 0 ? 'rgba(33, 91, 153, 0.85)' : 'rgba(24, 62, 117, 0.85)'};
              color: #ffffff;
            `;
            
            tableColumns.forEach(col => {
              const td = document.createElement('td');
              td.textContent = row[col] !== undefined && row[col] !== null ? row[col].toString() : '-';
              td.style.cssText = `
                padding: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px;
                font-family: var(--app-font-family);
                color: #ffffff;
                min-width: 120px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `;
              tr.appendChild(td);
            });
            
            tempTbody.appendChild(tr);
          });
          tempTable.appendChild(tempTbody);
          tempContainer.appendChild(tempTable);

          // Add to body to measure
          document.body.appendChild(tempContainer);
          await new Promise(resolve => setTimeout(resolve, 100));

          // Get actual table width and create matching title
          const actualTableWidth = tempTable.offsetWidth;

          const titleElement = document.createElement('div');
          titleElement.textContent = tableName;
          titleElement.style.cssText = `
            margin: 0 0 20px 0;
            padding: 15px;
            font-size: 20px;
            font-weight: bold;
            font-family: var(--app-font-family);
            text-align: center;
            background: linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%);
            color: #ffffff;
            border-radius: 8px;
            box-shadow: 0px 4px 20px rgba(24, 62, 117, 0.2);
            width: ${actualTableWidth}px;
            box-sizing: border-box;
          `;

          // Insert title before table
          tempContainer.insertBefore(titleElement, tempTable);

          await new Promise(resolve => setTimeout(resolve, 200));

          const tableCanvas = await html2canvas(tempContainer, {
            scale: 1.3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            foreignObjectRendering: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight
          });

          const tableImgData = tableCanvas.toDataURL('image/jpeg', 0.9);
          
          const canvasRatio = tableCanvas.width / tableCanvas.height;
          const pageRatio = availableWidth / availableHeight;
          
          let finalWidth, finalHeight;
          if (canvasRatio > pageRatio) {
            finalWidth = availableWidth * 0.95;
            finalHeight = finalWidth / canvasRatio;
          } else {
            finalHeight = availableHeight * 0.9;
            finalWidth = finalHeight * canvasRatio;
          }
          
          const tableX = margin + (availableWidth - finalWidth) / 2;
          const tableY = margin + (availableHeight - finalHeight) / 2;

          pdf.addImage(tableImgData, 'JPEG', tableX, tableY, finalWidth, finalHeight);

          // Add page info at bottom
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          const pageInfo = `${tableName} • ${displayData.length} rows`;
          pdf.text(pageInfo, margin, pdfHeight - 5);

          document.body.removeChild(tempContainer);
          console.log(`  ✓ Processed ${tableName} (single page) with ${displayData.length} rows`);
        }
      }
      
      console.log(`\n✅ Completed processing all ${tableComponents.length} table components`);
    } else if (!nonTableContent || nonTableContent.children.length === 0) {
      // Fallback: capture entire content as single page
      const canvas = await html2canvas(mainContent, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const ratio = Math.min(availableWidth / canvas.width, availableHeight / canvas.height) * 0.9;
      const finalWidth = canvas.width * ratio;
      const finalHeight = canvas.height * ratio;
      const x = margin + (availableWidth - finalWidth) / 2;
      const y = margin;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      console.log('Used fallback: captured entire content');
    }

    // Restore all original styles
    Object.assign(mainContent.style, originalStyles);
    
    modifiedElements.forEach(styleData => {
      const el = styleData.element;
      Object.keys(styleData).forEach(prop => {
        if (prop !== 'element') {
          el.style[prop] = styleData[prop];
        }
      });
    });

    // Restore hidden elements
    hiddenElements.forEach(({ element, originalDisplay, originalVisibility }) => {
      element.style.display = originalDisplay;
      if (originalVisibility) {
        element.style.visibility = originalVisibility;
      }
    });

    // Restore scroll position
    window.scrollTo(originalScrollLeft, originalScrollTop);

    // Save PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `dashboard_${timestamp}.pdf`;
    pdf.save(filename);
    
    document.body.style.cursor = originalCursor;
    
    const totalPages = pdf.internal.pages.length - 1;
    const totalTables = tableComponents.length;
    const totalRows = tableComponents.reduce((sum, comp) => sum + Math.min(comp.maxRows || 10, filteredRows?.length || 0), 0);
    
    const message = hasLargeTables ? 
      `Dashboard exported to PDF with ${totalPages} pages (${totalTables} table(s), ${totalRows} total rows)` :
      `Dashboard exported to PDF with ${totalPages} page${totalPages > 1 ? 's' : ''} (${totalTables} table(s))`;
      
    openNotification("success", "Export Successful", message, "bottomRight");
    
  } catch (error) {
    console.error('PDF export failed:', error);
    
    // CRITICAL: Restore page state even if export fails
    if (mainContent && originalStyles) {
      Object.assign(mainContent.style, originalStyles);
    }
    
    // Restore modified elements
    if (modifiedElements && modifiedElements.length > 0) {
      modifiedElements.forEach(styleData => {
        try {
          const el = styleData.element;
          Object.keys(styleData).forEach(prop => {
            if (prop !== 'element') {
              el.style[prop] = styleData[prop];
            }
          });
        } catch (restoreError) {
          console.warn('Failed to restore element style:', restoreError);
        }
      });
    }

    // Restore hidden elements
    if (hiddenElements && hiddenElements.length > 0) {
      hiddenElements.forEach(({ element, originalDisplay, originalVisibility }) => {
        try {
          element.style.display = originalDisplay;
          if (originalVisibility) {
            element.style.visibility = originalVisibility;
          }
        } catch (restoreError) {
          console.warn('Failed to restore hidden element:', restoreError);
        }
      });
    }

    // Restore scroll position
    const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const originalScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    window.scrollTo(originalScrollLeft, originalScrollTop);
    
    // Restore cursor
    document.body.style.cursor = 'auto';
    
    openNotification("error", "Export Failed", `Failed to export dashboard: ${error.message}`, "bottomRight");
  }
};

  const exportTableToCSV = () => {
    if (!state.rows.length || !state.columns.length) return;
    
    // Helper function to properly escape CSV values
    const escapeCSVValue = (value) => {
      if (value == null) return '';
      const str = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    
    // Helper function to convert array to CSV row
    const arrayToCSVRow = (arr) => {
      return arr.map(escapeCSVValue).join(',');
    };
    
    const csvRows = [
      arrayToCSVRow(["Report", state.selectedTable]),
      arrayToCSVRow(["Columns", state.selectedColumns.join(", ")]),
      '', // Empty row
      arrayToCSVRow(state.columns),
      ...state.rows.map((row) => 
        arrayToCSVRow(state.columns.map((col) => row?.[col] || ''))
      ),
    ];
    
    const csvContent = csvRows.join('\n');
    const csv = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csv);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.selectedTable || "report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateAppendTemplate = async (tableName) => {
  if (!tableName) {
    openNotification('warning', 'No Table Selected', 'Please select a table first');
    return;
  }

  try {
    // Step 1: Generate the template
    const response = await fetch(`https://prowesstics.space/flask/upload/generate-template/${tableName}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate template');
    }

    const result = await response.json();
    
    // Step 2: Download the template automatically
    if (result.download_url) {
      const downloadUrl = `https://prowesstics.space/flask${result.download_url}`;
      
      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = result.template_info.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      openNotification('success', 'Template Downloaded', 
        `Template for "${tableName}" has been downloaded! Use this template to ensure data compatibility when appending.`);
    } else {
      openNotification('success', 'Template Ready', 
        `Template for "${tableName}" generated successfully!`);
    }
    
    console.log('Template info:', result.template_info);
    
  } catch (error) {
    openNotification('error', 'Template Generation Failed', error.message);
  }
};

  const ComponentCard = ({ component, children }) => (
    <div key={component.id} style={{...styles_shared.card, position: 'relative'}}>
      <div style={styles_shared.header}>
        <button 
          style={styles_shared.removeButton}
          onClick={() => removeComponent(component.id)}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );

const DropZone = ({ field, component, placeholder, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const column = e.dataTransfer.getData('text/plain');
    if (column) onDrop(column);
  };

  // SIMPLIFIED: Let updateComponent handle scroll preservation
  const handleRemove = (colToRemove) => {
    if (field === 'tableColumns') {
      const updated = (component[field] || []).filter(col => col !== colToRemove);
      updateComponent(component.id, { [field]: updated });
    } else {
      updateComponent(component.id, { [field]: "" });
    }
  };

  const renderTableColumns = () => {
    const columns = component[field] || [];
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        width: '100%'
      }}>
        {columns.map((col, index) => (
          <span key={index} style={{
            ...styles_shared.fieldTag,
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {col}
            <button
              style={{ ...styles_shared.removeButton, fontSize: '10px', padding: '2px 4px', fontFamily : "var(--app-font-family)", }}
              onClick={() => handleRemove(col)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block', color: 'white' , fontFamily : "var(--app-font-family)",}}>
        {field.charAt(0).toUpperCase() + field.slice(1)}:
      </label>
      <div
        style={{
          ...styles_shared.dropZone,
          backgroundColor: component[field] ? '#ffffff' : (isDragOver ? '#e3f2fd' : '#f9f9f9'),
          borderColor: isDragOver ? '#2196f3' : '#ddd',
          borderStyle: isDragOver ? 'solid' : 'dashed',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'flex-start',
          padding: '8px'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {field === 'tableColumns' ? (
          component[field] && component[field].length > 0 ? renderTableColumns() : placeholder
        ) : (
          component[field] ? (
            <span style={styles_shared.fieldTag}>
              {component[field]}
              <button
                style={{ ...styles_shared.removeButton, fontSize: '10px', padding: '2px 4px' , fontFamily : "var(--app-font-family)", }}
                onClick={() => handleRemove()}
              >
                ×
              </button>
            </span>
          ) : placeholder
        )}
      </div>
    </div>
  );
};

  const TemplateSelector = () => {
    const [showTemplates, setShowTemplates] = useState(false);
    
    // Don't show the button on initial page (when no components exist) 
    // OR when a saved report is loaded
    if (state.dashboardComponents.length === 0 || reportState.isLoadedReport) {
      return null;
    }
    
    if (!showTemplates) {
      return (
        <button
          onClick={() => setShowTemplates(true)}
          style={{
            ...styles_shared.addButton,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            marginRight: '10px'
          }}
        >
          🔄 Change Template
        </button>
      );
    }
    
    return (
      <div style={{ 
        position: 'relative',
        display: 'inline-block'
      }}>
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          padding: '15px',
          width: '320px',
          marginTop: '5px',
          marginLeft: '-50px',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#333' , fontFamily : "var(--app-font-family)", }}>Change Template</h3>
            <button
              onClick={() => setShowTemplates(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                fontFamily : "var(--app-font-family)",
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gap: '10px'
          }}>
            {Object.entries(dashboardTemplates).map(([key, template]) => (
              <div
                key={key}
                onClick={() => {
                  showConfirmModal(
                    "Change Template",
                    `Change to "${template.name}" template? This will replace your current dashboard with a fresh template.`,
                    () => {
                      console.log(`Switching to template: ${key}`);
                      loadTemplate(key); // FIXED: Uses the enhanced loadTemplate function
                      setShowTemplates(false);
                    }
                  );
                }}
                style={{
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#f9f9f9'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0f0f0';
                  e.target.style.borderColor = '#4A90E2';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f9f9f9';
                  e.target.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{ 
                  fontWeight: 'bold', 
                  fontFamily : "var(--app-font-family)",
                  fontSize: '14px', 
                  color: '#333',
                  marginBottom: '4px'
                }}>
                  {template.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontFamily : "var(--app-font-family)",
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  {template.description}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  fontFamily : "var(--app-font-family)",
                  color: '#888'
                }}>
                  {template.components.length} components • {template.dashboardType} layout
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderComponent = (component) => {
    // Enhanced getValue function with better error handling and aggregation options

    const getValue = (field, aggregationType = 'sum') => {
      if (!component[field] || !filteredRows.length) return component.value || 0;

      console.log('filteredRows:', filteredRows);
      console.log('field:', component[field]);

      const values = filteredRows.map(row => row[component[field]] || 0);
      console.log('Values for field:', values);

      if (values.length === 0) return 0;

      let result = 0;

      switch (aggregationType) {
        case 'sum':
          result = values.reduce((sum, val) => {
            const num = parseFloat(val);
            return sum + (isNaN(num) ? 0 : num);
          }, 0);
          break;
        
        case 'avg':
          const numericValues = values
            .map(val => parseFloat(val))
            .filter(val => !isNaN(val));
          result = numericValues.length === 0 ? 0 : numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          break;
        
        case 'count':
          result = values.length;
          break;
        
        case 'min':
        case 'max':
          const validNums = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
          result = validNums.length === 0 ? 0 : Math[aggregationType](...validNums);
          break;
        
        case 'unique':
          result = new Set(values).size;
          break;
        
        default:
          result = values.reduce((sum, val) => sum + val, 0);
      }

      // Round to 1 decimal place for all cases except count and unique (which should be integers)
      if (aggregationType === 'count' || aggregationType === 'unique') {
        return Math.round(result); // Return whole numbers for count operations
      }
      
      return Math.round(result * 10) / 10; // Round to 1 decimal place
    };

    // Get array of values for sparkline visualization
    const getSparklineData = (field) => {
      if (!component[field] || !filteredRows.length) {
        return Array.from({ length: 10 }, (_, i) => Math.random() * 100);
      }
      return filteredRows
        .slice(0, 20)
        .map(row => parseFloat(row[component[field]]) || 0)
        .filter(val => !isNaN(val));
    };

    // Helper function for input fields
    const renderInput = (label, field, placeholder, defaultValue = '', type = 'text', props = {}) => (
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '12px', fontFamily : "var(--app-font-family)", fontWeight: 'bold', marginBottom: '5px', display: 'block', color: 'white' }}>
          {label}:
        </label>
        <input
          type={type}
          key={`${field}-${component.id}`}
          defaultValue={defaultValue}
          onBlur={(e) => updateComponent(component.id, { [field]: type === 'number' ? parseInt(e.target.value) || 10 : e.target.value })}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              updateComponent(component.id, { [field]: type === 'number' ? parseInt(e.target.value) || 10 : e.target.value });
              e.target.blur();
            }
          }}
          placeholder={placeholder}
          style={{
            padding: '4px 0px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '12px',
            fontFamily : "var(--app-font-family)",
            width: '100%',
            color: '#333',
          }}
          {...props}
        />
      </div>
    );

    // Helper function for buttons
    const renderButton = (text, onClick, condition = true) => condition && (
      <button
        onClick={onClick}
        style={{
          border: 'none',
          borderRadius: '8px',
          padding: '10px 18px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily : "var(--app-font-family)",
          fontWeight: '600',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          background: 'rgb(33, 91, 153)',
          color: 'white',
          width: '100%',
          marginBottom: '15px'
        }}
      >
        {text}
      </button>
    );

    // Helper function for edit button
    const renderEditButton = (isConfigured) => isConfigured && (
      <button
        onClick={() => updateComponent(component.id, { isConfigured: false })}
        style={{
          position: 'absolute',
          top: '8px',
          right: '55px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily : "var(--app-font-family)",
          fontWeight: 'bold'
        }}
      >
        Edit
      </button>
    );

    switch (component.type) {
      case 'sparkline':
        const sparklineValues = getSparklineData('dataField');
        const maxSparklineValue = Math.max(...sparklineValues, 1);
        const minSparklineValue = Math.min(...sparklineValues, 0);
        const range = maxSparklineValue - minSparklineValue || 1;

        return (
          <ComponentCard component={component}>
            <DropZone
              field="dataField"
              component={component}
              placeholder="Drop a column here for sparkline data"
              onDrop={(column) => handleDropForComponent(component.id, 'dataField', column)}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily : "var(--app-font-family)", color: component.color, marginBottom: '10px' }}>
                {getValue('dataField').toLocaleString()}
              </div>
              <div style={{
                height: '60px',
                background: '#f8f9fa',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'center',
                padding: '5px',
                marginBottom: '10px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {sparklineValues.length > 1 ? (
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <polyline
                      points={sparklineValues.map((value, index) => {
                        const x = (index / (sparklineValues.length - 1)) * 100;
                        const y = 100 - ((value - minSparklineValue) / range) * 100;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke={component.color}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points={`0,100 ${sparklineValues.map((value, index) => {
                        const x = (index / (sparklineValues.length - 1)) * 100;
                        const y = 100 - ((value - minSparklineValue) / range) * 100;
                        return `${x},${y}`;
                      }).join(' ')} 100,100`}
                      fill={`${component.color}20`}
                      stroke="none"
                    />
                  </svg>
                ) : (
                  <div style={{ color: '#666', fontSize: '12px' , fontFamily : "var(--app-font-family)", }}>
                    {component.dataField ? 'Insufficient data for sparkline' : 'Drop data to see sparkline'}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' , fontFamily : "var(--app-font-family)", }}>
                {component.dataField ? `${component.dataField} Trend` : 'Sparkline Chart'}
              </div>
            </div>
          </ComponentCard>
        );


      case 'kpi':
        const isConfigured = component.isConfigured || false;
        // FIXED: Create unique keys for all elements using component ID and timestamp
        const componentKey = `kpi_${component.id}_${component.lastUpdated || Date.now()}`;

        return (
          <ComponentCard component={component} key={componentKey}>
            {!isConfigured && (
              <>
                <DropZone
                  key={`dropzone_${componentKey}`}
                  field="valueField"
                  component={component}
                  placeholder="Drop a column here for KPI value"
                  onDrop={(column) => {
                    console.log(`Dropping ${column} into component ${component.id}`);
                    handleDropForComponent(component.id, 'valueField', column);
                  }}
                >
                  <div className="kpi-dropzone" style={{ 
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {component.valueField || 'Drop here'}
                  </div>
                </DropZone>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', fontFamily : "var(--app-font-family)", marginBottom: '5px', display: 'block', color: 'white' }}>
                    Aggregation:
                  </label>
                  <select
                    key={`aggregation_${componentKey}`}
                    value={component.aggregationType || 'sum'}
                    onChange={(e) => {
                      console.log(`Updating aggregation for component ${component.id}: ${e.target.value}`);
                      updateComponent(component.id, { aggregationType: e.target.value });
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '12px',
                      fontFamily : "var(--app-font-family)",
                      width: '100%'
                    }}
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="max">Maximum</option>
                    <option value="min">Minimum</option>
                    <option value="unique">Unique Count</option>
                  </select>
                </div>

                {/* FIXED: Enhanced input with proper key management */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', fontFamily : "var(--app-font-family)",marginBottom: '5px', display: 'block', color: 'white' }}>
                    KPI Name:
                  </label>
                  <input
                    type="text"
                    key={`kpiname_${componentKey}`}
                    defaultValue={component.kpiName || ''}
                    onBlur={(e) => {
                      console.log(`Updating KPI name for component ${component.id}: ${e.target.value}`);
                      updateComponent(component.id, { kpiName: e.target.value });
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateComponent(component.id, { kpiName: e.target.value });
                        e.target.blur();
                      }
                    }}
                    placeholder="Enter KPI name"
                    style={{
                      padding: '4px 0px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '12px',
                      fontFamily : "var(--app-font-family)",
                      width: '100%',
                      color: '#333',
                    }}
                  />
                </div>

                {component.valueField && (
                  <button
                    key={`setbutton_${componentKey}`}
                    onClick={() => {
                      console.log(`Setting KPI for component ${component.id}`);
                      updateComponent(component.id, { isConfigured: true });
                    }}
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily : "var(--app-font-family)",
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      width: '100%',
                    }}
                  >
                    Set KPI
                  </button>
                )}

                <div style={{ textAlign: 'center', opacity: 0.7 }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily : "var(--app-font-family)", color: component.color, marginBottom: '8px' }}>
                    {component.valueField ? getValue('valueField', component.aggregationType || 'sum').toLocaleString() : '0'}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    fontFamily : "var(--app-font-family)",
                    color: 'white', 
                    marginBottom: '8px',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {component.kpiName || component.valueField ?
                      (component.kpiName || `${component.aggregationType || 'Sum'} of ${component.valueField}`) :
                      'KPI Preview'
                    }
                  </div>
                </div>
              </>
            )}

            {isConfigured && (
              <>
                <button
                  key={`editbutton_${componentKey}`}
                  onClick={() => {
                    console.log(`Editing component ${component.id}`);
                    updateComponent(component.id, { isConfigured: false });
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '55px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily : "var(--app-font-family)",
                    fontWeight: 'bold'
                  }}
                >
                  Edit
                </button>
                <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                  <div style={{ fontSize: '30px', fontWeight: 'bold', fontFamily : "var(--app-font-family)", color: component.color, marginBottom: '15px' }}>
                    {getValue('valueField', component.aggregationType || 'sum').toLocaleString()}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    marginBottom: '10px', 
                    fontFamily : "var(--app-font-family)",
                    fontWeight: '500', 
                    color: 'white',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {component.kpiName || `${component.aggregationType || 'Sum'} of ${component.valueField}`}
                  </div>
                </div>
              </>
            )}
          </ComponentCard>
        );

      case 'radialBar':
        const progressValue = component.progressField && filteredRows.length > 0
          ? Math.min(100, Math.max(0, (getValue('progressField') / filteredRows.length)))
          : component.value || 65;

        return (
          <ComponentCard component={component}>
            <DropZone
              field="progressField"
              component={component}
              placeholder="Drop a column here for progress value"
              onDrop={(column) => handleDropForComponent(component.id, 'progressField', column)}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(${component.color} ${progressValue * 3.6}deg, #f0f0f0 0deg)`,
                margin: '0 auto 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontFamily : "var(--app-font-family)",
                fontWeight: 'bold',
                color: component.color,
                position: 'relative'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {progressValue.toFixed(0)}%
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#666' , fontFamily : "var(--app-font-family)", }}>
                {component.progressField || component.label || 'Progress'}
              </div>
              {component.progressField && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' , fontFamily : "var(--app-font-family)", }}>
                  Avg: {getValue('progressField').toFixed(1)}
                </div>
              )}
            </div>
          </ComponentCard>
        );
    
      case 'table':
        const isTableConfigured = component.isConfigured || false;

        return (
          <div key={component.id} style={{ ...styles_shared.card }}>
            <div style={styles_shared.header}>
              <button
                style={styles_shared.removeButton}
                onClick={() => removeComponent(component.id)}
              >
                ×
              </button>
            </div>

            {!isTableConfigured && (
              <>
                <DropZone
                  field="tableColumns"
                  component={component}
                  placeholder="Drop columns here to display in table"
                  onDrop={(column) => {
                    const currentColumns = component.tableColumns || [];
                    if (!currentColumns.includes(column)) {
                      updateComponent(component.id, { tableColumns: [...currentColumns, column] });
                    }
                  }}
                />

                {component.tableColumns?.length > 0 && (
                  <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {component.tableColumns.map(col => (
                      <div key={col} style={{
                        background: 'rgba(52, 152, 219, 0.1)',
                        border: '1px solid #3498db',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily : "var(--app-font-family)",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ color: 'white' }}>{col}</span>
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#3498db',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontFamily : "var(--app-font-family)",
                            fontWeight: 'bold'
                          }}
                          onClick={() => {
                            // SIMPLIFIED: Let updateComponent handle scroll preservation
                            const newColumns = component.tableColumns.filter(c => c !== col);
                            updateComponent(component.id, { tableColumns: newColumns });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {renderInput('Table Name', 'tableName', 'Enter table name', component.tableName || '')}
                {renderInput('Max Rows to Display', 'maxRows', '', component.maxRows || 10, 'number', { min: '1', max: '100' })}
                {renderButton('Set Table', () => updateComponent(component.id, { isConfigured: true }), component.tableColumns?.length > 0)}

                {component.tableColumns?.length > 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.7, marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: 'white', fontFamily : "var(--app-font-family)", marginBottom: '8px', fontWeight: 'bold' }}>
                      {component.tableName || 'Data Table Preview'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc' , fontFamily : "var(--app-font-family)", }}>
                      {component.tableColumns.length} columns selected
                    </div>
                  </div>
                )}
              </>
            )}

            {isTableConfigured && (
              <>
                {renderEditButton(isTableConfigured)}
                <div style={{ textAlign: 'center', marginBottom: '15px', paddingTop: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 'bold' , fontFamily : "var(--app-font-family)", }}>
                    {component.tableName || 'Data Table'}
                  </h3>
                </div>

                {/* SIMPLIFIED: Remove data-table-id, let updateComponent handle scroll */}
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  overflowX: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    minWidth: `${Math.max((component.tableColumns?.length || 1) * 150, 600)}px`,
                    borderCollapse: 'collapse',
                    background: 'linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%)',
                    border: '2px dashed rgb(30, 116, 223)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(24, 62, 117, 0.95)', color: '#ffffff' }}>
                        {/* Show ALL columns */}
                        {component.tableColumns?.map(col => (
                          <th key={col} style={{
                            padding: '10px',
                            borderBottom: '2px dashed rgb(30, 116, 223)',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontFamily : "var(--app-font-family)",
                            color: '#fff',
                            minWidth: '120px',
                            whiteSpace: 'nowrap'
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, component.maxRows || 10).map((row, idx) => (
                        <tr key={idx} style={{
                          backgroundColor: idx % 2 === 0 ? 'rgba(33, 91, 153, 0.85)' : 'rgba(24, 62, 117, 0.85)',
                          color: '#ffffff',
                        }}>
                          {/* Show ALL columns for each row */}
                          {component.tableColumns?.map(col => (
                            <td key={col} style={{
                              padding: '8px 10px',
                              borderBottom: '2px dashed rgb(30, 116, 223)',
                              fontSize: '12px',
                              fontFamily : "var(--app-font-family)",
                              minWidth: '120px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {row[col] !== undefined && row[col] !== null ? row[col].toString() : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ padding: '10px', fontSize: '12px', color: '#ccc', borderTop: '1px solid #dee2e6', fontFamily : "var(--app-font-family)", }}>
                    Showing {Math.min(component.maxRows || 10, filteredRows.length)} of {filteredRows.length} records
                    {component.tableColumns?.length > 5 && (
                      <span style={{ marginLeft: '10px', opacity: 0.8 }}>
                        • Scroll horizontally to see all {component.tableColumns.length} columns
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {!isTableConfigured && (!component.tableColumns || component.tableColumns.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
                Drop columns above to display data
              </div>
            )}
          </div>
        );    
      
      case 'chart':
        const isChartConfigured = component.isConfigured || false;

        return (
          <div key={component.id} style={{ ...styles_shared.card }}>
            <div style={styles_shared.header}>
              <button
                style={styles_shared.removeButton}
                onClick={() => removeComponent(component.id)}
              >
                ×
              </button>
            </div>

            {!isChartConfigured && (
              <>
                {renderInput('Chart Name', 'chartName', 'Enter chart name', component.chartName || '')}

                <ChartTemplate
                  chartKey={`component-${component.id}`}
                  chartType={component.chartType}
                  chartFields={component.fields || {}}
                  onChartTypeChange={(key, type) => updateComponent(component.id, { chartType: type })}
                  handleDrop={(key, axis, column) => {
                    console.log('Chart component drop:', { key, axis, column });
                    const newFields = { ...component.fields, [axis]: column };
                    updateComponent(component.id, { fields: newFields });
                    // if (!state.slicers[column]) {
                    //   updateState({ slicers: { ...state.slicers, [column]: ["Select All"] } });
                    // }
                  }}
                  rows={filteredRows}
                  removeField={(key, axis) => {
                    const newFields = { ...component.fields, [axis]: "" };
                    updateComponent(component.id, { fields: newFields });
                  }}
                  gradientColors={gradientColors}
                />

                {renderButton('Set Chart', () => updateComponent(component.id, { isConfigured: true }), 
                  component.fields && Object.values(component.fields).some(field => field && field.trim() !== ''))}

                {(component.fields && Object.values(component.fields).some(field => field && field.trim() !== '')) && (
                  <div style={{ textAlign: 'center', opacity: 0.7, marginTop: '15px' }}>
                    <div style={{ fontSize: '14px', color: 'white', marginBottom: '8px',fontFamily : "var(--app-font-family)", fontWeight: 'bold' }}>
                      {component.chartName || 'Chart Preview'}
                    </div>
                    <div style={{ fontSize: '12px', fontFamily : "var(--app-font-family)", color: '#ccc' }}>
                      {component.chartType || 'bar'} chart configured
                    </div>
                  </div>
                )}
              </>
            )}

            {isChartConfigured && (
              <>
                {renderEditButton(isChartConfigured)}
                <div style={{ textAlign: 'center', marginBottom: '15px', paddingTop: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'white',fontFamily : "var(--app-font-family)", fontWeight: 'bold' }}>
                    {component.chartName || 'Chart'}
                  </h3>
                </div>

                <div style={{ width: '100%', height: '300px' }}>
                  <ChartTemplate
                    chartKey={`component-${component.id}`}
                    chartType={component.chartType}
                    chartFields={component.fields || {}}
                    rows={filteredRows}
                    gradientColors={gradientColors}
                    displayMode={true}
                    hideConfiguration={true}
                  />
                </div>
              </>
            )}

            {!isChartConfigured && (!component.fields || !Object.values(component.fields).some(field => field && field.trim() !== '')) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
                Configure chart fields above
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };
  
  // Add component buttons
  const addButtons = [
    { type: 'kpi', label: '+ KPI Card', color: '#4A90E2' },
    // { type: 'sparkline', label: '+ Sparkline', color: '#734CEA' },
    // { type: 'radialBar', label: '+ Radial Chart', color: '#E91E63' },
    { type: 'chart', label: '+ Chart', color: '#00C5A4' },
    { type: 'table', label: '+ Table', color: '#FF6B6B' }
  ];

  const resetDashboard = () => {
    setState(prev => ({
      ...initialState,
      tables: prev.tables, // ✅ preserve already-loaded tables
    }));
    setReportState(prev => ({
      ...prev,
      reportName: "",
      question: "",
      aiResults: [],
      loadingAiResponse: false,
      isLoadedReport: false 
    }));
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedReports");
      if (saved) setReportState(prev => ({ ...prev, savedReports: JSON.parse(saved) }));
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  }, []);

  useEffect(() => {
    if (location.hash === '#templates') {
      const el = document.getElementById('template-executive'); // Use the correct ID present in your JSX
      // if (el) {
      //   el.scrollIntoView({ behavior: 'smooth' });
      // }
    }
  }, [location]);

  useEffect(() => {
    const navigationState = location.state;
    
    console.log('🔍 SSBI Navigation State:', navigationState);
    
    // FIXED: Add flag to prevent multiple executions
    if (navigationState?.processed) {
      console.log('⭐️ Navigation state already processed, skipping');
      return;
    }
    
    // ✅ FIX: Handle report loaded from other pages
    if (navigationState?.reportLoaded && navigationState?.reportData) {
      console.log('📊 Report loaded from another page, setting up dashboard...');
      
      const report = navigationState.reportData;
      
      updateState({
        selectedTable: report.table_name || '',
        selectedColumns: report.selected_columns || [],
        slicers: report.slicers || {},
        dashboardComponents: report.dashboard_components || [],
        charts: report.charts || initialState.charts,
        currentDashboardType: report.current_dashboard_type || 'default',
        categorizedColumns: null,
        columnsInfo: [],
        lastFetchedTable: ""
      });
      
      setReportState(prev => ({
        ...prev,
        reportName: report.report_name || report.name || '',
        isLoadedReport: true,
      }));
      
      // Fetch table data
      if (report.table_name) {
        setTimeout(() => fetchTableData(report.table_name), 100);
      }
      
      // Mark as processed and clear navigation state
      window.history.replaceState({ processed: true }, '', location.pathname);
      return;
    }
    
    if (navigationState?.startFresh && navigationState?.fromLanding) {
      // Start with empty dashboard (Create Your Own from landing)
      console.log("✅ Starting fresh dashboard with zero components from landing");
      
      // Reset to completely empty state
      setState(prev => ({
        ...initialState,
        tables: prev.tables, // Preserve loaded tables
      }));
      
      setReportState(prev => ({
        ...prev,
        reportName: "",
        question: "",
        aiResults: [],
        loadingAiResponse: false,
        isLoadedReport: false 
      }));
      
      // FIXED: Mark as processed and clear navigation state
      window.history.replaceState({ processed: true }, '', location.pathname);
      
    } else if (navigationState?.loadTemplate && navigationState?.templateData && navigationState?.fromLanding) {
      // Load specific template from landing
      const templateKey = navigationState.loadTemplate;
      const templateData = navigationState.templateData;
      
      console.log(`✅ Loading template from landing: ${templateKey}`, templateData);
      
      // FIXED: Mark as processed immediately to prevent re-execution
      window.history.replaceState({ processed: true }, '', location.pathname);
      
      // Load template only once
      loadTemplate(templateKey);
      
    } else if (navigationState?.loadFirstReport && !navigationState?.processed) {
      // Existing logic for loading first report (unchanged)
      console.log("Detected loadFirstReport flag, fetching and loading first report...");
      
      // FIXED: Mark as processed immediately
      window.history.replaceState({ processed: true }, '', location.pathname);
      
      const loadFirstReportFromAPI = async () => {
        try {
          console.log("Fetching saved reports from API...");
          
          const response = await fetch("https://prowesstics.space/flask/reports");
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("API Response:", data);
          
          let reports = [];
          if (Array.isArray(data)) {
            reports = data;
          } else if (data.reports && Array.isArray(data.reports)) {
            reports = data.reports;
          } else if (data.data && Array.isArray(data.data)) {
            reports = data.data;
          }
          
          console.log("Processed reports:", reports);
          
          if (reports.length > 0) {
            const firstReport = reports[0];
            console.log("Loading first report:", firstReport);
            
            setReportState((prev) => ({ ...prev, savedReports: reports }));
            
            setTimeout(() => {
              const reportId = firstReport.id || firstReport.report_name;
              console.log("Calling loadSavedReport with ID:", reportId);
              loadSavedReport(reportId);
            }, 200);
          } else {
            console.log("No saved reports found");
          }
          
        } catch (error) {
          console.error("Error fetching/loading first report:", error);
        }
      };
      
      loadFirstReportFromAPI();
    }
  }, [location.pathname, location.state]); 

return (
  <Context.Provider value={contextValue}>
    {contextHolder}
    <DndProvider backend={HTML5Backend}>
      <div className="app" style={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden' // Prevent app-level scrolling
      }}>
        
        <Sidebar
          tables={state.tables}
          selectedTable={state.selectedTable}
          // setSelectedTable={(table) => updateState({ selectedTable: table })}
          setSelectedTable={handleTableChange}
          columns={state.columns}
          rows={state.rows}
          columnsInfo={state.columnsInfo}
          categorizedColumns={state.categorizedColumns} 
          DraggableColumn={DraggableColumn}
          exportTableToCSV={exportTableToCSV}
          exportTableToPDF={exportDashboardToPDF}
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
          handlePageChange={(e) => navigate(e.target.value)}
          isTablePaneVisible={reportState.isTablePaneVisible}
          toggleTablePane={() => setReportState(prev => ({ ...prev, isTablePaneVisible: !prev.isTablePaneVisible }))}
          searchReports={searchReports}
          resetDashboard={resetDashboard}
          isLoadedReport={reportState.isLoadedReport}
        >
          {/* Conditional rendering based on current view */}
            {/* // EXISTING DASHBOARD CONTENT */}
            <div 
              className={styles.main} 
              style={{ 
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '15px',
                boxSizing: 'border-box'
              }}
            >
              {/* Content wrapper for proper spacing */}
              <div style={{ 
                minHeight: 'max-content',
                marginTop: '-25px',
              }}>
                
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap',
                  marginTop: '-25px',
                }}>
                  <h1 style={{ fontSize:'40px' , fontFamily : "var(--app-font-family)",}}>{reportState.reportName || "Smart Insights Workspace"}</h1>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <TemplateSelector />
                    {addButtons.map(({ type, label, color }) => (
                      <button 
                        key={type}
                        onClick={() => addComponent(type)}
                        style={{
                          ...styles_shared.addButton,
                          background: color,
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease, opacity 0.1s ease'
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'scale(0.95)';
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Preview Cards - Show only on initial load when no components exist */}
                {/* {state.dashboardComponents.length === 0 && (
                  <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#333', 
                      marginBottom: '4px' 
                    }}>
                      Choose a Dashboard Template
                    </h2>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '25px',
                      lineHeight: '1.5'
                    }}>
                      Select from our pre-designed templates to get started quickly, or add individual components to build your custom dashboard.
                    </p>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '24px',
                      marginBottom: '40px'
                    }}>
                      {Object.entries(dashboardTemplates).map(([key, template]) => (
                        <TemplatePreviewCard
                          key={key}
                          template={template}
                          templateKey={key}
                          onSelectTemplate={(templateKey) => {
                            const selectedTemplate = dashboardTemplates[templateKey];
                            updateState({ 
                              dashboardComponents: selectedTemplate.components,
                              currentDashboardType: selectedTemplate.dashboardType
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )} */}
                {state.dashboardComponents.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: '#666',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '12px',
                    margin: '20px 0 40px 0',
                    border: '2px dashed #ddd'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 , fontFamily : "var(--app-font-family)", }}>📊</div>
                    <h3 style={{ 
                      fontSize: '24px', 
                      fontWeight: '600', 
                      fontFamily : "var(--app-font-family)",
                      color: '#333', 
                      marginBottom: '12px',
                      margin: '0 0 12px 0'
                    }}>
                      Start Building Your Dashboard
                    </h3>
                    <p style={{ 
                      fontSize: '16px', 
                      fontFamily : "var(--app-font-family)",
                      color: '#666', 
                      marginBottom: '0',
                      lineHeight: '1.5',
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      Use the buttons above to add KPI cards, charts, and tables to create your custom dashboard.
                    </p>
                  </div>
                )}
                
                {/* Conditional Filters - Show when components exist */}
                {(state.dashboardComponents.length > 0 || 
                  (state.currentDashboardType && state.currentDashboardType !== 'default')) && (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0px 1px 15px 1px rgba(69, 65, 78, 0.08)',
                    marginBottom: '30px'
                  }}>
                    <FilterPanel
                      rows={state.rows}
                      slicers={state.slicers}
                      setSlicers={(slicers) => updateState({ slicers })}
                    />
                  </div>
                )}

                {/* Dynamic Components - Show when components exist */}
                {state.dashboardComponents.length > 0 && (() => {
                  const currentDashboardType = state.currentDashboardType || 'default';
                  
                  const { layout, sortedComponents } = organizeComponentsWithExactDistribution(
                    state.dashboardComponents, 
                    currentDashboardType
                  );

                  if (!layout || sortedComponents.length === 0) return null;

                  return (
                    <div style={{ 
                      marginBottom: '30px',
                      width: '100%',
                      maxWidth: '100%',
                      overflowX: 'hidden'
                    }}>
                      {layout.typeOrder.map(componentType => {
                        const componentsOfThisType = sortedComponents.filter(comp => comp.type === componentType);
                        
                        if (componentsOfThisType.length === 0) return null;
                        
                        return (
                          <div key={`${componentType}_section_${Date.now()}`} style={{ 
                            marginBottom: '40px',
                            width: '100%',
                            maxWidth: '100%'
                          }}>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: layout.gridColumns,
                              gap: layout.gap,
                              marginBottom: '20px',
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box'
                            }}>
                              {componentsOfThisType.map((component, index) => {
                                const stableKey = `${component.type}_${component.id}_${component.lastUpdated || Date.now()}`;
                                
                                const ComponentElement = renderComponent(component);
                                
                                return (
                                  <div 
                                    key={stableKey}
                                    style={{ 
                                      gridColumn: component.gridColumn,
                                      transition: 'all 0.3s ease',
                                      width: '100%',
                                      maxWidth: '100%',
                                      boxSizing: 'border-box',
                                      minWidth: 0
                                    }}
                                  >
                                    {component.type === 'table' || component.type === 'chart' ? (
                                      <div style={{ 
                                        ...ComponentElement.props.style,
                                        height: 'auto',
                                        width: '100%',
                                        maxWidth: '100%',
                                        boxSizing: 'border-box'
                                      }}>
                                        {ComponentElement.props.children}
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: '100%',
                                        maxWidth: '100%',
                                        boxSizing: 'border-box'
                                      }}>
                                        {ComponentElement}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                
                {/* Table Preview - Only show if there's data */}
                {state.tableData.length > 0 && (
                  <div style={{ ...styles_shared.card, marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '18px', fontFamily : "var(--app-font-family)", }}>Data Preview</h3>
                    <TablePreview
                      selectedColumns={state.selectedColumns}
                      tableData={state.tableData}
                      handleDrop={handleDrop}
                      removeColumn={removeColumn}
                    />
                  </div>
                )}
                
              </div>
            </div>
        </Sidebar>
        <FileUploadModalComponent />
        <Modal
          title={confirmModal.title}
          open={confirmModal.isOpen}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="Yes"
          cancelText="No"
          okType="danger"
          centered
        >
          <p>{confirmModal.content}</p>
        </Modal>
      </div>
    </DndProvider>
  </Context.Provider>
);
};

export default Dashboard;