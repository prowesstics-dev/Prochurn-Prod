// FileUploadPage.jsx - Fixed version with dropdown search issue resolved
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Typography, 
  Row, 
  Col, 
  Space, 
  notification,
  Divider,
  Alert,
  Empty,
  Spin,
  Tooltip,
  Modal
} from 'antd';
import { 
  InboxOutlined, 
  FileExcelOutlined, 
  TableOutlined,
  DownloadOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useFileUpload } from './FileUpload';
import { useNavigate, useLocation } from 'react-router-dom';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "./SidebarSSBI";
import DraggableColumn from "./DraggableColumn";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ✅ ADD CONTEXT (same as SSBI.jsx)
const Context = React.createContext({ name: 'Default' });
const dropPreventionStyles = `
  .no-drop-zone,
  .ant-select,
  .ant-select-selector,
  .ant-select-selection-search,
  .ant-select-dropdown {
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
  
  .no-drop-zone * {
    pointer-events: auto !important;
  }
`;

const FileUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTableRef = useRef();

  // 📄 Complete state management (same as Dashboard)
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
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  
  // ✅ ADD CONTEXT VALUE (same as SSBI.jsx)
  const contextValue = useMemo(() => ({ name: 'Ant Design' }), []);

  // 📞 Helper functions
  const updateState = useCallback((updates) => setState(prev => ({ ...prev, ...updates })), []);

  const openNotification = useCallback((type, message, description, placement = 'topRight') => {
    api[type]({
      message,
      description: <Context.Consumer>{() => description}</Context.Consumer>, // ✅ FIX CONTEXT
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

  // 📊 Fetch tables function
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

      console.log('Tables loaded successfully:', tables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setState(prev => ({ ...prev, tables: [] }));
    }
  }, []);

  // 📋 Fetch table data function
  const fetchTableData = useCallback(async (tableName) => {
    const targetTable = tableName || state.selectedTable;

    if (!targetTable || state.lastFetchedTable === targetTable) {
      console.log("⭐️ Skipping fetchTableData for", targetTable, " — already loaded.");
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

  // 💾 Save report function
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
        current_dashboard_type: 'upload',
        description: "File upload workspace",
        tags: ["upload"],
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

  // 📂 Fetch saved reports
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

  // 📖 Load saved report
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

  // 🗑️ Delete saved report
  const deleteSavedReport = useCallback(async (reportIdentifier) => {
    if (!reportIdentifier) {
      openNotification("error", "Delete Failed", "Invalid report identifier", "bottomRight");
      return;
    }

    Modal.confirm({
      title: "Delete Report",
      content: "Are you sure you want to delete this report? This action cannot be undone.",
      onOk: async () => {
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
      }
    });
  }, [openNotification, apiCall, fetchSavedReports]);

  // 🔍 Search reports
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

  // 🔄 Reset dashboard
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

  // 📤 Export functions (dummy for upload page)
  const exportTableToCSV = useCallback(() => {
    openNotification("info", "Export", "CSV export not available on upload page", "bottomRight");
  }, [openNotification]);

  const exportTableToPDF = useCallback(() => {
    openNotification("info", "Export", "PDF export not available on upload page", "bottomRight");
  }, [openNotification]);

  // Initialize file upload hook
  const { handleFileUpload, handleAppendUpload, FileUploadModalComponent } = useFileUpload(
    openNotification, 
    fetchTables, 
    updateState
  );

  // 🎯 Effects
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

  // Generate template for selected table
  const generateAppendTemplate = async (tableName) => {
    if (!tableName) {
      openNotification('warning', 'No Table Selected', 'Please select a table first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://prowesstics.space/flask/upload/generate-template/${tableName}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const result = await response.json();
      
      if (result.download_url) {
        const downloadUrl = `https://prowesstics.space/flask${result.download_url}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.template_info.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        openNotification('success', 'Template Downloaded', 
          `Template for "${tableName}" has been downloaded!`);
      }
      
    } catch (error) {
      openNotification('error', 'Template Generation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFileUpload = () => {
    handleFileUpload();
  };

  const handleAppendClick = () => {
    if (!selectedAppendTable) {
      openNotification('warning', 'No Table Selected', 'Please select a table to append data to');
      return;
    }
    handleAppendUpload(selectedAppendTable);
  };

  // 🔧 FIX: Handle dropdown change with complete isolation
  const handleAppendTableChange = useCallback((value, option) => {
    console.log('Dropdown change:', value); // Debug log
    setSelectedAppendTable(value);
  }, []);

  // 🔧 FIX: Completely disable page change handler for upload page
  const handlePageChangeWithGuard = useCallback((targetPage) => {
    console.log('Page change attempt blocked:', targetPage); // Debug log
    // Block all navigation attempts on upload page to prevent conflicts
    return false;
  }, []);

  return (
    <Context.Provider value={contextValue}>
      {contextHolder}

      <style dangerouslySetInnerHTML={{ __html: dropPreventionStyles }} />

      <DndProvider backend={HTML5Backend}>
        <div className="app" style={{ 
          display: 'flex', 
          height: '100vh', 
          overflow: 'hidden'
        }}>
          
          {/* 🎯 Fully Functional SSBI Sidebar */}
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
            handlePageChange={handlePageChangeWithGuard} // 🔧 FIX: Use guarded function
            isTablePaneVisible={reportState.isTablePaneVisible}
            toggleTablePane={() => setReportState(prev => ({ ...prev, isTablePaneVisible: !prev.isTablePaneVisible }))}
            searchReports={searchReports}
            resetDashboard={resetDashboard}
            isLoadedReport={reportState.isLoadedReport}
          >
            {/* 🏠 Upload Page Content */}
            <div style={{ 
              padding: '24px',
              backgroundColor: '#f5f5f5',
              minHeight: '100vh',
              width: '100%',
              overflow: 'auto'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '32px' }}>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  <DatabaseOutlined style={{ marginRight: '12px' }} />
                  Data Upload Center
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#666', margin: '8px 0 0 0' }}>
                  Upload new files or append data to existing tables
                </Paragraph>
              </div>

              {/* Main Upload Options */}
              <Row gutter={[24, 24]}>
                {/* New File Upload Card */}
                <Col xs={24} lg={12}>
                  <Card
                    hoverable
                    style={{ 
                      height: '320px',
                      borderRadius: '12px',
                      border: '2px solid #e8f4fd',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ 
                      body: { 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        height: '100%',
                        textAlign: 'center'
                      }
                    }}
                    onClick={handleNewFileUpload}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8f4fd';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '24px' }}>
                      <InboxOutlined 
                        style={{ 
                          fontSize: '64px', 
                          color: '#1890ff',
                          marginBottom: '16px',
                          display: 'block'
                        }} 
                      />
                      <Title level={4} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
                        Upload New File
                      </Title>
                      <Text style={{ fontSize: '16px', color: '#666' }}>
                        Create new tables from Excel or CSV files
                      </Text>
                    </div>
                    
                    <div style={{ marginTop: 'auto' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<CloudUploadOutlined />}
                        style={{ 
                          background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                          border: 'none',
                          borderRadius: '8px',
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                      >
                        Choose File
                      </Button>
                      <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
                        Supports .xlsx, .xls, .csv files
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Append Data Card */}
                <Col xs={24} lg={12}>
                  <Card
                    style={{ 
                      height: '320px',
                      borderRadius: '12px',
                      border: '2px solid #e8f4fd',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ 
                      body: { 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        height: '100%',
                        padding: '24px'
                      }
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <FileAddOutlined 
                        style={{ 
                          fontSize: '64px', 
                          color: '#1890ff',
                          marginBottom: '16px',
                          display: 'block'
                        }} 
                      />
                      <Title level={5} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
                        Append to Existing Table
                      </Title>
                      <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '16px' }}>
                        Add data to existing tables in your database
                      </Text>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {/* Table Selection - Completely Isolated */}
                      {/* <div 
                        style={{ marginBottom: '20px' }}
                        onKeyDown={(e) => {
                          // Completely stop all keyboard events from bubbling up
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          // Stop all click events from bubbling up
                          e.stopPropagation();
                        }}
                      > */}
                      <div 
                        className="no-drop-zone"
                        style={{ marginBottom: '20px' }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'none';
                          return false;
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openNotification('warning', 'Drop Not Allowed', 'Please use the dropdown to select a table');
                          return false;
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                      >
                        <Text strong style={{ display: 'block', marginBottom: '8px', color: '#333' }}>
                          Select Target Table:
                        </Text>
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          onKeyDown={(e) => e.stopPropagation()}
                          style={{ width: '100%' }}
                        >
                          <Select
                            placeholder="Select Table"
                            style={{ width: '100%' }}
                            size="medium"
                            value={selectedAppendTable || undefined}
                            onChange={handleAppendTableChange}
                            showSearch
                            allowClear
                            disabled={state.tables.length === 0}
                            filterOption={(input, option) => {
                              if (!input) return true;
                              const text = option?.children || option?.value || '';
                              return text.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
                            }}
                            notFoundContent={state.tables.length === 0 ? "No tables available" : "Not found"}
                            onFocus={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              // Allow normal typing in the search box
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                e.preventDefault();
                              }
                            }}
                            onSearch={(value) => {
                              console.log('Search input:', value); // Debug log
                            }}
                            getPopupContainer={(trigger) => trigger.parentNode}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'none';
                              return false;
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openNotification('warning', 'Drop Not Allowed', 'Please use the dropdown to select a table');
                              return false;
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }}
                          >
                            {state.tables.map((table) => (
                              <Option key={table} value={table}>
                                <TableOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                {table}
                              </Option>
                            ))}
                          </Select>
                        </div>
                        {state.tables.length === 0 && (
                          <Text style={{ color: '#999', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            No tables available. Upload a file first to create tables.
                          </Text>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Button
                            icon={<DownloadOutlined />}
                            disabled={!selectedAppendTable || loading}
                            loading={loading}
                            onClick={() => generateAppendTemplate(selectedAppendTable)}
                            style={{ 
                              width: '100%',
                              height: '40px',
                              borderColor: '#1890ff',
                              color: '#1890ff',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Get Template
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            type="primary"
                            icon={<FileAddOutlined />}
                            disabled={!selectedAppendTable}
                            onClick={handleAppendClick}
                            style={{ 
                              width: '100%',
                              height: '40px',
                              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Append Data
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </Sidebar>

          {/* File Upload Modal Component */}
          <FileUploadModalComponent />
        </div>
      </DndProvider>
    </Context.Provider>
  );
};

export default FileUploadPage;