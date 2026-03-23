// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import ChartTemplate from "./ChartTemplate";
import Sidebar from "./Sidebar";
import TablePreview from "../components/TablePreview";
import FilterPanel from "../components/FilterPanel";
import DraggableColumn from "../components/DraggableColumn";

import styles from "../styles/Dashboard.module.css";
// import { width } from "@fortawesome/free-solid-svg-icons/fa0";

// Consolidated initial state
const initialState = {
  tables: [],
  selectedTable: "Market Sales",
  columns: [],
  rows: [],
  selectedColumns: [],
  tableData: [],
  slicers: {},
  dashboardComponents: [],
  nextComponentId: 1,
  charts: Array.from({ length: 4 }, (_, i) => ({
    key: `chart${i + 1}`,
    type: "bar",
    fields: { xAxis: "", yAxis: "" },
  }))
};

// Component templates
const componentTemplates = {
  sparkline: {
    type: 'sparkline',
    title: 'Sparkline Chart',
    color: '#734CEA',
    value: '439'
  },
  kpi: {
    type: 'kpi',
    title: 'KPI Card',
    value: '1,234',
    subtitle: 'Total Sales',
    color: 'white',
    trend: '+12%'
  },
  chart: {
    type: 'chart',
    title: 'Chart Widget',
    chartType: 'bar',
    fields: { xAxis: "", yAxis: "" }
  },
  table: {
    type: 'table',
    title: 'Data Table',
    columns: [],
    maxRows: 10
  },
  radialBar: {
    type: 'radialBar',
    title: 'Progress Chart',
    value: 65,
    color: '#E91E63',
    label: 'Completion'
  }
};

// Shared styles
// const styles_shared = {
//   card: {
//     backgroundColor: '#fff',
//     padding: '20px',
//     borderRadius: '8px',
//     boxShadow: '0px 1px 15px 1px rgba(69, 65, 78, 0.08)',
//     position: 'relative',
//     // minHeight: '100px',
//     // width: '200px',
//   },
//   header: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: '15px'
//   },
//   removeButton: {
//     position: 'absolute',
//     right: '13px',
//     background: '#ff4757',
//     color: 'white',
//     border: 'none',
//     borderRadius: '6px',
//     padding: '0px 11px',
//     cursor: 'pointer',
//     fontsize: '12px',
//     top: '7px'
//   },
//   dropZone: {
//     border: '2px dashed #ddd',
//     borderRadius: '4px',
//     padding: '10px',
//     marginBottom: '10px',
//     minHeight: '40px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '12px',
//     color: '#666',
//     position: 'relative'
//   },
//   fieldTag: {
//     backgroundColor: '#e3f2fd',
//     color: '#1976d2',
//     padding: '4px 8px',
//     borderRadius: '4px',
//     fontSize: '12px',
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '5px'
//   },
//   addButton: {
//     color: 'white',
//     border: 'none',
//     borderRadius: '6px',
//     padding: '8px 16px',
//     cursor: 'pointer',
//     fontSize: '14px',
//     fontWeight: '500'
//   }
// };

const styles_shared = {
  card: {
    background: 'linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%)',
    padding: '20px',
    borderRadius: '12px', // More modern border radius
    boxShadow: '0px 4px 20px rgba(24, 62, 117, 0.1)', // Updated shadow with your primary color
    position: 'relative',
    border: '1px solid rgba(24, 62, 117, 0.08)', // Subtle border with your primary color
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  removeButton: {
    position: 'absolute',
    right: '13px',
    background: 'linear-gradient(135deg, #183E75, #115ECD)', // Gradient from your colors
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0px 11px',
    cursor: 'pointer',
    fontSize: '12px',
    top: '7px',
    transition: 'all 0.2s ease'
  },
  dropZone: {
    border: '2px dashed #115ECD', // Updated to your color
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#183E75', // Updated text color
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  fieldTag: {
    background: 'linear-gradient(135deg, #183E75, #115ECD)', // Gradient background
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px', // More modern pill shape
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '500'
  },
  addButton: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
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
    fontWeight: '600'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(24, 62, 117, 0.1)',
    fontSize: '13px',
    color: '#183E75'
  },
  alternateRow: {
    backgroundColor: 'rgba(24, 62, 117, 0.02)'
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const gradientColors = ["#183E75", "#115ECD", "#1E74DF", "#2D90F5", "#215B99"];

  // // Add these functions to your Dashboard component

  // // Save report function
  // const saveReport = useCallback(async () => {
  //   if (!reportState.reportName.trim()) {
  //     alert("Please enter a report name");
  //     return;
  //   }

  //   try {
  //     const reportData = {
  //       report_name: reportState.reportName.trim(),
  //       table_name: state.selectedTable,
  //       selected_columns: state.selectedColumns,
  //       slicers: state.slicers,
  //       dashboard_components: state.dashboardComponents,
  //       charts: state.charts,
  //       description: "", // Add description field if needed
  //       tags: [], // Add tags if needed
  //       created_by: "current_user" // Replace with actual user identification
  //     };

  //     const response = await fetch("http://127.0.0.1:5000/reports", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(reportData),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
      
  //     // Update saved reports list
  //     await fetchSavedReports();
      
  //     alert(result.message || "Report saved successfully!");
      
  //     // Optionally clear the report name after saving
  //     // setReportState(prev => ({ ...prev, reportName: "" }));
      
  //   } catch (error) {
  //     console.error("Error saving report:", error);
  //     alert("Error saving report: " + error.message);
  //   }
  // }, [reportState.reportName, state.selectedTable, state.selectedColumns, 
  //     state.slicers, state.dashboardComponents, state.charts]);

  // // Fetch saved reports function
  // const fetchSavedReports = useCallback(async () => {
  //   try {
  //     const response = await fetch("http://127.0.0.1:5000/reports");
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
      
  //     setReportState(prev => ({ 
  //       ...prev, 
  //       savedReports: data.reports || [] 
  //     }));
      
  //   } catch (error) {
  //     console.error("Error fetching saved reports:", error);
  //     setReportState(prev => ({ ...prev, savedReports: [] }));
  //   }
  // }, []);

  // // Load saved report function
  // const loadSavedReport = useCallback(async (reportId) => {
  //   try {
  //     const response = await fetch(`http://127.0.0.1:5000/reports/${reportId}`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     const report = data.report;
      
  //     // Update state with loaded report data
  //     updateState({
  //       selectedTable: report.table_name,
  //       selectedColumns: report.selected_columns || [],
  //       slicers: report.slicers || {},
  //       dashboardComponents: report.dashboard_components || [],
  //       charts: report.charts || initialState.charts,
  //     });
      
  //     setReportState(prev => ({
  //       ...prev,
  //       reportName: report.report_name
  //     }));
      
  //     // Fetch table data for the loaded report
  //     if (report.table_name) {
  //       await fetchTableData();
  //     }
      
  //     alert("Report loaded successfully!");
      
  //   } catch (error) {
  //     console.error("Error loading report:", error);
  //     alert("Error loading report: " + error.message);
  //   }
  // }, [updateState, fetchTableData]);

  // // Delete saved report function
  // const deleteSavedReport = useCallback(async (reportId) => {
  //   if (!window.confirm("Are you sure you want to delete this report?")) {
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`http://127.0.0.1:5000/reports/${reportId}`, {
  //       method: "DELETE",
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
      
  //     // Refresh the saved reports list
  //     await fetchSavedReports();
      
  //     alert(result.message || "Report deleted successfully!");
      
  //   } catch (error) {
  //     console.error("Error deleting report:", error);
  //     alert("Error deleting report: " + error.message);
  //   }
  // }, [fetchSavedReports]);

  // // Search reports function (optional)
  // const searchReports = useCallback(async (searchQuery = "", tableFilter = "") => {
  //   try {
  //     const params = new URLSearchParams();
  //     if (searchQuery) params.append('q', searchQuery);
  //     if (tableFilter) params.append('table', tableFilter);
      
  //     const response = await fetch(`http://127.0.0.1:5000/reports/search?${params}`);
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
      
  //     setReportState(prev => ({ 
  //       ...prev, 
  //       savedReports: data.reports || [] 
  //     }));
      
  //   } catch (error) {
  //     console.error("Error searching reports:", error);
  //     setReportState(prev => ({ ...prev, savedReports: [] }));
  //   }
  // }, []);

  // // Add useEffect to fetch saved reports on component mount
  // useEffect(() => {
  //   fetchSavedReports();
  // }, [fetchSavedReports]);
  
  // Consolidated state
  const [state, setState] = useState(initialState);
//   const [show, setShow] = useState(null);
  const [reportState, setReportState] = useState({
    savedReports: [],
    reportName: "",
    question: "",
    aiResults: [],
    loadingAiResponse: false,
    isTablePaneVisible: true
  });

  // Helper function to update state
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Component management functions
  const addComponent = useCallback((componentType) => {
    const template = componentTemplates[componentType];
    if (!template) return;

    const newComponent = {
      id: state.nextComponentId,
      ...template,
      title: `${template.title} ${state.nextComponentId}`,
    };

    updateState({
      dashboardComponents: [...state.dashboardComponents, newComponent],
      nextComponentId: state.nextComponentId + 1
    });
  }, [state.dashboardComponents, state.nextComponentId, updateState]);

  const removeComponent = useCallback((componentId) => {
    updateState({
      dashboardComponents: state.dashboardComponents.filter(comp => comp.id !== componentId)
    });
  }, [state.dashboardComponents, updateState]);

  const updateComponent = useCallback((componentId, updates) => {
    updateState({
      dashboardComponents: state.dashboardComponents.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      )
    });
  }, [state.dashboardComponents, updateState]);

  // Chart management functions
  const handleChartTypeChange = useCallback((chartKey, newType) => {
    updateState({
      charts: state.charts.map((chart) =>
        chart.key === chartKey ? { ...chart, type: newType } : chart
      )
    });
  }, [state.charts, updateState]);

  
  const handleDropForChart = useCallback((chartKey, axis, column) => {
      console.log('Chart drop handler called:', { chartKey, axis, column });
        
      if (!chartKey || !axis || !column) {
        console.log('Missing required parameters for chart drop');
        return;
      }

      // Update charts (removed automatic slicer creation)
      const newCharts = state.charts.map((chart) =>
        chart.key === chartKey
          ? { ...chart, fields: { ...chart.fields, [axis]: column } }
          : chart
      );

      console.log('Updating chart:', { newCharts });
      updateState({ charts: newCharts });
}, [state.charts, updateState]);

  const removeFieldFromChart = useCallback((chartKey, axis) => {
    updateState({
      charts: state.charts.map((chart) =>
        chart.key === chartKey
          ? { ...chart, fields: { ...chart.fields, [axis]: "" } }
          : chart
      )
    });
  }, [state.charts, updateState]);


    const handleDropForComponent = useCallback((componentId, field, column) => {
      console.log('Component drop handler called:', { componentId, field, column });
        
      if (!componentId || !field || !column) return;

        //  setShow(column);

      // Only update the component, no automatic slicer creation
      updateComponent(componentId, { [field]: column });
    }, [updateComponent]);


const handleColumnSelect  = useCallback((column) => {
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
  // Data management functions
  const handleFileUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      updateState({ selectedTable: result.tableName });
      fetchTables();
    } catch (error) {
      console.error('Upload error:', error);
      alert("Error uploading file: " + error.message);
    }
  };

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/tables");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const tables = data.tables || [];
      updateState({ 
        tables,
        selectedTable: tables.includes(state.selectedTable) ? state.selectedTable : tables[0] || ""
      });
    } catch (err) {
      console.error("Error fetching tables:", err);
      updateState({ tables: [] });
    }
  }, [state.selectedTable, updateState]);

  const fetchTableData = useCallback(async () => {
    if (!state.selectedTable) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/data?table=${encodeURIComponent(state.selectedTable)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      updateState({
        columns: data.columns || [],
        rows: data.data || []
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
      updateState({ columns: [], rows: [] });
    }
  }, [state.selectedTable, updateState]);

  // Table preview functions
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

  // Filtered rows memoization
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


  // Export functions
  const exportTableToCSV = () => {
    if (!state.rows.length || !state.columns.length) return;
    const csvData = [
      ["Report", state.selectedTable],
      ["Columns", state.selectedColumns.join(", ")],
      [],
      state.columns,
      ...state.rows.map((row) => state.columns.map((col) => row?.[col] || '')),
    ];
    const csv = new Blob([csvData.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(csv);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.selectedTable || "report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  
    const ComponentCard = ({ component, children }) => (
        <div key={component.id} style={{...styles_shared.card, position: 'relative'}} >
            <div style={styles_shared.header}>
            {/* <h3 style={{ margin: 0, fontSize: '16px' }}>{component.title}</h3> */}
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
    console.log('Dropped column:', column);
    
    if (column) {
      onDrop(column);
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' ,color: 'white'}}>
        {field}:
      </label>
      <div 
        style={{
          ...styles_shared.dropZone,
          backgroundColor: component[field] ? '#e8f5e8' : (isDragOver ? '#e3f2fd' : '#f9f9f9'),
          borderColor: isDragOver ? '#2196f3' : '#ddd',
          borderStyle: isDragOver ? 'solid' : 'dashed'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {component[field] ? (
          <span style={styles_shared.fieldTag}>
            {component[field]}
            <button
              style={{ ...styles_shared.removeButton, fontSize: '10px', padding: '2px 4px' }}
              onClick={() => updateComponent(component.id, { [field]: "" })}
            >
              ×
            </button>
          </span>
        ) : placeholder}
      </div>
    </div>
  );
};
// Enhanced component renderer with fixed KPI and Sparkline functionality
    const renderComponent = (component) => {
      // Enhanced getValue function with better error handling and aggregation options
      const getValue = (field, aggregationType = 'sum') => {
        if (!component[field] || !filteredRows.length) {
          return component.value || 0;
        }

        console.log('filteredRows:', filteredRows);
        console.log('field:', component[field]);

        const values = filteredRows
          .map(row => row[component[field]] || 0)
          
        console.log('Values for field:', values);

        if (values.length === 0) return 0;

        switch (aggregationType) {
          case 'sum':
            return values.reduce((sum, val) => {
                const num = parseFloat(val);
                return sum + (isNaN(num) ? 0 : num);
            }, 0);
          case 'avg':
            const numericValues = values
                .map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? null : num; // skip invalid numbers
                })
                .filter(val => val !== null); // keep only valid numbers

            return numericValues.length === 0
                ? 0
                : numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          case 'count':
            return values.length;
          case 'min': {
            const numericValues = values
                .map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
                })
                .filter(val => val !== null);

            return numericValues.length === 0
                ? 0
                : Math.min(...numericValues);
            }

          case 'max': {
            const numericValues = values
                .map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
                })
                .filter(val => val !== null);

            return numericValues.length === 0
                ? 0
                : Math.max(...numericValues);
            }

          case 'unique':
            return new Set(values).size;
          default:
            return values.reduce((sum, val) => sum + val, 0);
        }
      };

      // Get array of values for sparkline visualization
      const getSparklineData = (field) => {
        if (!component[field] || !filteredRows.length) {
          return Array.from({ length: 10 }, (_, i) => Math.random() * 100); // Demo data
        }

        return filteredRows
          .slice(0, 20) // Limit to 20 points for performance
          .map(row => parseFloat(row[component[field]]) || 0)
          .filter(val => !isNaN(val));
      };


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
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: component.color, marginBottom: '10px' }}>
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
                      {/* Fill area under the line */}
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
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {component.dataField ? 'Insufficient data for sparkline' : 'Drop data to see sparkline'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {component.dataField ? `${component.dataField} Trend` : 'Sparkline Chart'}
                </div>
              </div>
            </ComponentCard>
          );

        
        case 'kpi':
        //   const kpiTrend = calculateTrend('valueField');
        //   const trendColor = kpiTrend.startsWith('+') ? '#27ae60' : kpiTrend.startsWith('-') ? '#e74c3c' : '#95a5a6';
          const isConfigured = component.isConfigured || false;

          return (
            <ComponentCard component={component}>
              {/* Configuration Mode */}
              {!isConfigured && (
                <>
                  <DropZone 
                    field="valueField" 
                    component={component} 
                    placeholder="Drop a column here for KPI value"
                    onDrop={(column) => handleDropForComponent(component.id, 'valueField', column)}
                    
                  />

                  {/* Aggregation Type Selector */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' ,color: 'white'}}>
                      Aggregation:
                    </label>
                    <select 
                      value={component.aggregationType || 'sum'}
                      onChange={(e) => updateComponent(component.id, { aggregationType: e.target.value })}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        fontSize: '12px',
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
                  
                  {/* KPI Name Input */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' ,color: 'white'}}>
                      KPI Name:
                    </label>
                    <input 
                      type="text"
                      key={`kpi-name-${component.id}`}
                      defaultValue={component.kpiName || ''}
                      onBlur={(e) => updateComponent(component.id, { kpiName: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateComponent(component.id, { kpiName: e.target.value });
                          e.target.blur();
                        }
                      }}
                      placeholder="Enter KPI name"
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        fontSize: '12px',
                        width: '100%',
                        color: '#333',
                      }}
                    />
                  </div>
                  
                  {/* Set Button */}
                  {component.valueField && (
                    <button 
                      onClick={() => updateComponent(component.id, { isConfigured: true })}
                      style={{
                        // color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        background:  'rgb(33, 91, 153)',
                        width: '100%',
                        marginBottom: '15px'
                      }}
                    >
                      Set KPI
                    </button>
                  )}

                  {/* Preview */}
                  <div style={{ textAlign: 'center', opacity: 0.7 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: component.color, marginBottom: '8px' }}>
                      {component.valueField ? getValue('valueField', component.aggregationType || 'sum').toLocaleString() : '0'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'white', marginBottom: '8px' }}>
                      {component.kpiName || component.valueField ? 
                        (component.kpiName || `${component.aggregationType || 'Sum'} of ${component.valueField}`) : 
                        'KPI Preview'
                      }
                    </div>
                  </div>
                </>
              )}

              {/* Display Mode */}
              {isConfigured && (
                <>
                  {/* Edit Button in Top Corner */}
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
                      fontWeight: 'bold'
                    }}
                  >
            
                    Edit
                  </button>
                
                  {/* Clean KPI Display */}
                  <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: component.color, marginBottom: '15px' }}>
                      {getValue('valueField', component.aggregationType || 'sum').toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#333', marginBottom: '10px', fontWeight: '500', color: 'white' }}>
                      {component.kpiName || `${component.aggregationType || 'Sum'} of ${component.valueField}`}
                    </div>
                    {/* <div style={{ fontSize: '14px', color: trendColor, fontWeight: 'bold' }}>
                      {kpiTrend}
                    </div>
                    {filteredRows.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                        Based on {filteredRows.length} records
                      </div>
                    )} */}
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
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {component.progressField || component.label || 'Progress'}
                </div>
                {component.progressField && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Avg: {getValue('progressField').toFixed(1)}
                  </div>
                )}
              </div>
            </ComponentCard>
          );

        case 'table':
          return (
            <div key={component.id} style={{ ...styles_shared.card }}>
              <div style={styles_shared.header}>
                {/* <h3 style={{ margin: 0, fontSize: '16px' }}>{component.title}</h3> */}
                <button 
                  style={styles_shared.removeButton}
                  onClick={() => removeComponent(component.id)}
                >
                  ×
                </button>
              </div>
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
              {component.tableColumns?.length > 0 ? (
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {/* <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        {component.tableColumns.slice(0, 6).map(col => (
                          <th key={col} style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontSize: '12px' }}>
                            {col}
                            <button
                              style={{ 
                                marginLeft: '5px', 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#999', 
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                              onClick={() => {
                                const newColumns = component.tableColumns.filter(c => c !== col);
                                updateComponent(component.id, { tableColumns: newColumns });
                              }}
                            >
                              ×
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, component.maxRows).map((row, idx) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                          {component.tableColumns.slice(0, 6).map(col => (
                            <td key={col} style={{ padding: '8px 10px', borderBottom: '1px solid #dee2e6', fontSize: '12px' }}>
                              {row[col] !== undefined && row[col] !== null ? row[col].toString() : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table> */}
<table
  style={{
    width: '100%',
    borderCollapse: 'collapse',
    background: 'linear-gradient(135deg, rgb(24, 62, 117) 0%, rgb(33, 91, 153) 100%)',
    border: '2px dashed rgb(30, 116, 223)',
    borderRadius: '8px',
    overflow: 'hidden',
  }}
>
  <thead>
    <tr style={{ backgroundColor: 'rgba(24, 62, 117, 0.95)', color: '#ffffff' }}>
      {component.tableColumns.slice(0, 6).map(col => (
        <th
          key={col}
          style={{
            padding: '10px',
            borderBottom: '2px dashed rgb(30, 116, 223)',
            textAlign: 'left',
            fontSize: '12px',
            color: '#fff'
          }}
        >
          {col}
          <button
            style={{
              marginLeft: '5px',
              background: 'transparent',
              border: 'none',
              color: '#9dbce2',
              cursor: 'pointer',
              fontSize: '10px',
            }}
            onClick={() => {
              const newColumns = component.tableColumns.filter(c => c !== col);
              updateComponent(component.id, { tableColumns: newColumns });
            }}
          >
            ×
          </button>
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {filteredRows.slice(0, component.maxRows).map((row, idx) => (
      <tr
        key={idx}
        style={{
          backgroundColor: idx % 2 === 0 ? 'rgba(33, 91, 153, 0.85)' : 'rgba(24, 62, 117, 0.85)',
          color: '#ffffff',
        }}
      >
        {component.tableColumns.slice(0, 6).map(col => (
          <td
            key={col}
            style={{
              padding: '8px 10px',
              borderBottom: '2px dashed rgb(30, 116, 223)',
              fontSize: '12px',
            }}
          >
            {row[col] !== undefined && row[col] !== null ? row[col].toString() : '-'}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>




                  <div style={{ padding: '10px', fontSize: '12px', color: '#666', borderTop: '1px solid #dee2e6' }}>
                    Showing {Math.min(component.maxRows, filteredRows.length)} of {filteredRows.length} records
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Drop columns above to display data
                </div>
              )}
            </div>
          );

        case 'chart':
          return (
            <div key={component.id} style={{ ...styles_shared.card }}>
              <div style={styles_shared.header}>
                {/* <h3 style={{ margin: 0, fontSize: '16px' }}>{component.title}</h3> */}
                <button 
                  style={styles_shared.removeButton}
                  onClick={() => removeComponent(component.id)}
                >
                  ×
                </button>
              </div>
              <ChartTemplate
                chartKey={`component-${component.id}`}
                chartType={component.chartType}
                chartFields={component.fields || {}}
                onChartTypeChange={(key, type) => updateComponent(component.id, { chartType: type })}
                handleDrop={(key, axis, column) => {
                  console.log('Chart component drop:', { key, axis, column });
                  const newFields = { ...component.fields, [axis]: column };
                  updateComponent(component.id, { fields: newFields });
                  if (!state.slicers[column]) {
                    updateState({ slicers: { ...state.slicers, [column]: ["Select All"] } });
                  }
                }}
                rows={filteredRows}
                removeField={(key, axis) => {
                  const newFields = { ...component.fields, [axis]: "" };
                  updateComponent(component.id, { fields: newFields });
                }}
                gradientColors={gradientColors}
              />
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

  // Effects
  useEffect(() => { fetchTables(); }, [fetchTables]);
  useEffect(() => { fetchTableData(); }, [fetchTableData]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedReports");
      if (saved) setReportState(prev => ({ ...prev, savedReports: JSON.parse(saved) }));
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  }, []);

    return (
    <DndProvider backend={HTML5Backend}>
        <div className="app">
        <Sidebar
            tables={state.tables}
            selectedTable={state.selectedTable}
            setSelectedTable={(table) => updateState({ selectedTable: table })}
            columns={state.columns}
            DraggableColumn={DraggableColumn}
            exportTableToCSV={exportTableToCSV}
            exportTableToPDF={() => {}} // Simplified - implement if needed
            handleFileUpload={handleFileUpload}
            reportName={reportState.reportName}
            setReportName={(name) => setReportState(prev => ({ ...prev, reportName: name }))}
            saveReport={() => {}}
            savedReports={reportState.savedReports}
            loadSavedReport={() => {}}
            deleteSavedReport={() => {}}
            question={reportState.question}
            setQuestion={(q) => setReportState(prev => ({ ...prev, question: q }))}
            fetchAiResponse={() => {}}
            loadingAiResponse={reportState.loadingAiResponse}
            aiResults={reportState.aiResults}
            handlePageChange={(e) => navigate(e.target.value)}
            isTablePaneVisible={reportState.isTablePaneVisible}
            toggleTablePane={() => setReportState(prev => ({ ...prev, isTablePaneVisible: !prev.isTablePaneVisible }))}
        >
            {/* Main Dashboard Content - This will be responsive */}
            <div className={styles.main} style={{ width: '100%', minHeight: '100vh' }}>
            {/* Header with Add Component Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>SSBI Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {addButtons.map(({ type, label, color }) => (
                    <button 
                    key={type}
                    onClick={() => addComponent(type)}
                    style={{ ...styles_shared.addButton, background: color }}
                    >
                    {label}
                    </button>
                ))}
                </div>
            </div>
            
            {/* Filters - Fixed Position */}
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
        
            {/* Dynamic Components */}
            {state.dashboardComponents.length > 0 && (() => {
                // Group components by type for better layout
                const groupedComponents = state.dashboardComponents.reduce((groups, component) => {
                    const type = component.type;
                    if (!groups[type]) groups[type] = [];
                    groups[type].push(component);
                    return groups;
                }, {});

                // Define the order we want components to appear - cards first, then charts/tables
                const typeOrder = ['kpi', 'sparkline', 'radialBar', 'chart', 'table'];
                
                // Create sorted array with all components of each type together
                const sortedComponents = typeOrder.flatMap(type => groupedComponents[type] || []);

                // Define grid column span based on component type
                const getGridColumnSpan = (componentType) => {
                    switch(componentType) {
                    case 'table':
                    case 'chart':
                        return 'span 6'; // Takes 2 columns (2 per row)
                    case 'kpi':
                    case 'sparkline':
                    case 'radialBar':
                    default:
                        return 'span 2'; // Takes 1 column (4 per row)
                    }
                };

                return (
                    <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(12, 1fr)', // Fixed 4 columns for consistent layout
                    gap: '20px',
                    marginBottom: '30px'
                    }}>
                    {sortedComponents.map(component => {
                        // Render component with appropriate grid span
                        // console.log('Rendering component:', component);
                        const ComponentElement = renderComponent(component);
                        
                        // If it's a table or chart, modify the style to include grid-column
                        if (component.type === 'table' || component.type === 'chart') {
                        return (
                            <div 
                            key={component.id} 
                            style={{ 
                                gridColumn: getGridColumnSpan(component.type),
                                ...ComponentElement.props.style 
                            }}
                            >
                            {ComponentElement.props.children}
                            </div>
                        );
                        }
                        
                        // For other components, just add the grid-column style
                        return (
                        <div 
                            key={component.id} 
                            style={{ gridColumn: getGridColumnSpan(component.type) }}
                        >
                            {ComponentElement}
                        </div>
                        );
                    })}
                    </div>
                );
                })()}

            {/* Table Preview */}
            {state.tableData.length > 0 && (
                <div style={{ ...styles_shared.card, marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Data Preview</h3>
                <TablePreview
                    selectedColumns={state.selectedColumns}
                    tableData={state.tableData}
                    handleDrop={handleDrop}
                    removeColumn={removeColumn}
                />
                </div>
            )}

            {/* Default Charts */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '20px',
                marginTop: '20px'
            }}>
                {filteredRows.length > 0 ? (
                state.charts.map((chart) => (
                    <div key={chart.key} style={styles_shared.card}>
                    <ChartTemplate
                        chartKey={chart.key}
                        chartType={chart.type}
                        chartFields={chart.fields || {}}
                        onChartTypeChange={handleChartTypeChange}
                        handleDrop={handleDropForChart}
                        rows={filteredRows}
                        removeField={removeFieldFromChart}
                        gradientColors={gradientColors}
                    />
                    </div>
                ))
                ) : (
                <div style={{ 
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '50px',
                    color: 'gray',
                    border: '1px dashed #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#fff'
                }}>
                    <p>No chart data available.</p>
                    <small>Upload data and configure filters to see charts.</small>
                </div>
                )}
            </div>
            </div>
        </Sidebar>
        </div>
    </DndProvider>
    );
  };
export default Dashboard;




//   return (
//     <DndProvider backend={HTML5Backend}>
//       <div className="app">
//         <Sidebar
//           tables={state.tables}
//           selectedTable={state.selectedTable}
//           setSelectedTable={(table) => updateState({ selectedTable: table })}
//           columns={state.columns}
//           DraggableColumn={DraggableColumn}
//           exportTableToCSV={exportTableToCSV}
//           exportTableToPDF={() => {}} // Simplified - implement if needed
//           handleFileUpload={handleFileUpload}
//           reportName={reportState.reportName}
//           setReportName={(name) => setReportState(prev => ({ ...prev, reportName: name }))}
//           saveReport={() => {}}
//           savedReports={reportState.savedReports}
//           loadSavedReport={() => {}}
//           deleteSavedReport={() => {}}
//           question={reportState.question}
//           setQuestion={(q) => setReportState(prev => ({ ...prev, question: q }))}
//           fetchAiResponse={() => {}}
//           loadingAiResponse={reportState.loadingAiResponse}
//           aiResults={reportState.aiResults}
//           handlePageChange={(e) => navigate(e.target.value)}
//           isTablePaneVisible={reportState.isTablePaneVisible}
//           toggleTablePane={() => setReportState(prev => ({ ...prev, isTablePaneVisible: !prev.isTablePaneVisible }))}
//         />

//         <div className={styles.main}>
//           {/* Header with Add Component Buttons */}
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//             <h1>SSBI Dashboard</h1>
//             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//               {addButtons.map(({ type, label, color }) => (
//                 <button 
//                   key={type}
//                   onClick={() => addComponent(type)}
//                   style={{ ...styles_shared.addButton, background: color }}
//                 >
//                   {label}
//                 </button>
//               ))}
//             </div>
//           </div>
//             {/* Filters - Fixed Position */}
//           <div style={{
//             backgroundColor: 'white',
//             padding: '16px 24px',
//             borderRadius: '8px',
//             boxShadow: '0px 1px 15px 1px rgba(69, 65, 78, 0.08)',
//             marginBottom: '30px'
//           }}>
//             <FilterPanel
//               rows={state.rows}
//               slicers={state.slicers}
//               setSlicers={(slicers) => updateState({ slicers })}
//             />
//           </div>
      
//           {/* Dynamic Components */}
//           {/* {state.dashboardComponents.length > 0 && (
//             <div style={{ 
//               display: 'grid', 
//               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
//               gap: '20px',
//               marginBottom: '30px'
//             }}>
//               {state.dashboardComponents.map(renderComponent)}
//             </div>
//           )} */}
//           {state.dashboardComponents.length > 0 && (() => {
//             // Group components by type for better layout
//             const groupedComponents = state.dashboardComponents.reduce((groups, component) => {
//                 const type = component.type;
//                 if (!groups[type]) groups[type] = [];
//                 groups[type].push(component);
//                 return groups;
//             }, {});

//             // Define the order we want components to appear - cards first, then charts/tables
//             const typeOrder = ['kpi', 'sparkline', 'radialBar', 'chart', 'table'];
            
//             // Create sorted array with all components of each type together
//             const sortedComponents = typeOrder.flatMap(type => groupedComponents[type] || []);

//             // Define grid column span based on component type
//             const getGridColumnSpan = (componentType) => {
//                 switch(componentType) {
//                 case 'table':
//                 case 'chart':
//                     return 'span 5'; // Takes 2 columns (2 per row)
//                 case 'kpi':
//                 case 'sparkline':
//                 case 'radialBar':
//                 default:
//                     return 'span 2'; // Takes 1 column (4 per row)
//                 }
//             };

//             return (
//                 <div style={{ 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(10, 1fr)', // Fixed 4 columns for consistent layout
//                 gap: '20px',
//                 marginBottom: '30px'
//                 }}>
//                 {sortedComponents.map(component => {
//                     // Render component with appropriate grid span
//                     const ComponentElement = renderComponent(component);
                    
//                     // If it's a table or chart, modify the style to include grid-column
//                     if (component.type === 'table' || component.type === 'chart') {
//                     return (
//                         <div 
//                         key={component.id} 
//                         style={{ 
//                             gridColumn: getGridColumnSpan(component.type),
//                             ...ComponentElement.props.style 
//                         }}
//                         >
//                         {ComponentElement.props.children}
//                         </div>
//                     );
//                     }
                    
//                     // For other components, just add the grid-column style
//                     return (
//                     <div 
//                         key={component.id} 
//                         style={{ gridColumn: getGridColumnSpan(component.type) }}
//                     >
//                         {ComponentElement}
//                     </div>
//                     );
//                 })}
//                 </div>
//             );
//             })()}


//           {/* Table Preview */}
//           {state.tableData.length > 0 && (
//             <div style={{ ...styles_shared.card, marginBottom: '30px' }}>
//               <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Data Preview</h3>
//               <TablePreview
//                 selectedColumns={state.selectedColumns}
//                 tableData={state.tableData}
//                 handleDrop={handleDrop}
//                 removeColumn={removeColumn}
//               />
//             </div>
//           )}

//           {/* Default Charts */}
//           <div style={{ 
//             display: 'grid', 
//             gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
//             gap: '20px',
//             marginTop: '20px'
//           }}>
//             {filteredRows.length > 0 ? (
//               state.charts.map((chart) => (
//                 <div key={chart.key} style={styles_shared.card}>
//                   <ChartTemplate
//                     chartKey={chart.key}
//                     chartType={chart.type}
//                     chartFields={chart.fields || {}}
//                     onChartTypeChange={handleChartTypeChange}
//                     handleDrop={handleDropForChart}
//                     rows={filteredRows}
//                     removeField={removeFieldFromChart}
//                     gradientColors={gradientColors}
//                   />
//                 </div>
//               ))
//             ) : (
//               <div style={{ 
//                 gridColumn: '1 / -1',
//                 textAlign: 'center',
//                 padding: '50px',
//                 color: 'gray',
//                 border: '1px dashed #ccc',
//                 borderRadius: '8px',
//                 backgroundColor: '#fff'
//               }}>
//                 <p>No chart data available.</p>
//                 <small>Upload data and configure filters to see charts.</small>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </DndProvider>
//   );
// };

