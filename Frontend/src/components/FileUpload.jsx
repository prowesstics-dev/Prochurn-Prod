// // FileUpload.jsx - Append mode with drag and drop
// import React, { useState, useRef, useCallback } from 'react';
// import { Modal, Steps, Button, Input, Select, Table, Checkbox, Radio, Progress, Alert, Spin } from 'antd';
// import { InboxOutlined, FileExcelOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';

// const { Step } = Steps;
// const { Option } = Select;
// const { TextArea } = Input;

// // Enhanced File Upload Modal Component with Append Mode
// const FileUploadModal = ({ 
//   visible, 
//   onCancel, 
//   onSuccess, 
//   openNotification,
//   existingTables = [],
//   // NEW: Append mode props
//   appendMode = false,
//   appendTargetTable = null
// }) => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [uploadData, setUploadData] = useState(null);
//   const [processing, setProcessing] = useState(false);
//   const [dragOver, setDragOver] = useState(false);
//   const fileInputRef = useRef(null);

//   // Step 1: File Upload State
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploading, setUploading] = useState(false);

//   // Step 2: Configuration State
//   const [processingType, setProcessingType] = useState('single');
//   const [selectedSheets, setSelectedSheets] = useState([]);
//   const [tableConfiguration, setTableConfiguration] = useState({
//     table_name: '',
//     has_header: true,
//     column_types: {}
//   });

//   // 🔧 FIXED: Column selection with proper state management
//   const toggleColumnInSheet = useCallback((sheetName, columnToToggle) => {
//     if (!uploadData || !uploadData.sheets) return;
    
//     setUploadData(prev => {
//       const updatedSheets = { ...prev.sheets };
//       const sheetData = { ...updatedSheets[sheetName] };
      
//       // Initialize selectedColumns if it doesn't exist
//       if (!sheetData.selectedColumns) {
//         sheetData.selectedColumns = [...sheetData.columns];
//       }
      
//       // Toggle column selection
//       const isCurrentlySelected = sheetData.selectedColumns.includes(columnToToggle);
      
//       if (isCurrentlySelected) {
//         // Prevent deselecting all columns
//         if (sheetData.selectedColumns.length <= 1) {
//           openNotification('warning', 'Column Required', 'At least one column must be selected');
//           return prev; // Don't update state
//         }
//         sheetData.selectedColumns = sheetData.selectedColumns.filter(col => col !== columnToToggle);
//       } else {
//         sheetData.selectedColumns = [...sheetData.selectedColumns, columnToToggle];
//       }
      
//       updatedSheets[sheetName] = sheetData;
      
//       return {
//         ...prev,
//         sheets: updatedSheets
//       };
//     });
//   }, [uploadData, openNotification]);

//   const resetState = () => {
//     setCurrentStep(0);
//     setUploadData(null);
//     setSelectedFile(null);
//     setUploadProgress(0);
//     setUploading(false);
//     setProcessing(false);
//     // Reset processing type based on mode
//     setProcessingType(appendMode ? 'single' : 'single');
//     setSelectedSheets([]);
//     setTableConfiguration({
//       table_name: appendMode ? appendTargetTable || '' : '',
//       has_header: true,
//       column_types: {}
//     });
//   };

//   const handleFileSelect = useCallback((file) => {
//     if (!file) return;

//     // Validate file type
//     const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
//     const allowedExtensions = ['.xlsx', '.xls', '.csv'];
//     const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

//     if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
//       setTimeout(() => {
//         openNotification('error', 'Invalid File Type', 'Please upload Excel (.xlsx, .xls) or CSV files only');
//       }, 0);
//       return;
//     }

//     // Check file size (50MB limit)
//     const maxSize = 50 * 1024 * 1024;
//     if (file.size > maxSize) {
//       setTimeout(() => {
//         openNotification('error', 'File Too Large', 'File size should be less than 50MB');
//       }, 0);
//       return;
//     }

//     setSelectedFile(file);
//   }, [openNotification]);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);

//     const files = Array.from(e.dataTransfer.files);
//     if (files.length > 0) {
//       handleFileSelect(files[0]);
//     }
//   }, [handleFileSelect]);

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(true);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);
//   }, []);

//   const uploadFile = async () => {
//     if (!selectedFile) return;

//     setUploading(true);
//     setUploadProgress(0);

//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     try {
//       const xhr = new XMLHttpRequest();

//       return new Promise((resolve, reject) => {
//         xhr.upload.addEventListener('progress', (event) => {
//           if (event.lengthComputable) {
//             const percentComplete = Math.round((event.loaded / event.total) * 100);
//             setUploadProgress(percentComplete);
//           }
//         });

//         xhr.addEventListener('load', async () => {
//           if (xhr.status === 200) {
//             try {
//               const result = JSON.parse(xhr.responseText);
              
//               // 🔧 FIXED: Initialize selectedColumns for all sheets
//               if (result.sheets) {
//                 Object.keys(result.sheets).forEach(sheetName => {
//                   const sheet = result.sheets[sheetName];
//                   if (!sheet.selectedColumns) {
//                     sheet.selectedColumns = [...sheet.columns]; // All columns selected by default
//                   }
//                 });
//               }
              
//               setUploadData(result);
              
//               // Set table name based on mode
//               setTableConfiguration(prev => ({
//                 ...prev,
//                 table_name: appendMode ? appendTargetTable : (result.suggested_table_name || '')
//               }));
              
//               // Auto-select first sheet
//               if (result.sheets && Object.keys(result.sheets).length > 0) {
//                 setSelectedSheets([Object.keys(result.sheets)[0]]);
//               }
              
//               setCurrentStep(1);
//               resolve(result);
//             } catch (parseError) {
//               const error = new Error('Invalid response format');
//               openNotification('error', 'Processing Failed', error.message);
//               reject(error);
//             }
//           } else {
//             const errorText = xhr.responseText;
//             let errorMessage = `Upload failed (${xhr.status})`;
//             try {
//               const errorData = JSON.parse(errorText);
//               errorMessage = errorData.error || errorMessage;
//             } catch (e) {
//               errorMessage = errorText || errorMessage;
//             }
//             const error = new Error(errorMessage);
//             openNotification('error', 'Upload Failed', error.message);
//             reject(error);
//           }
//         });

//         xhr.addEventListener('error', () => {
//           const error = new Error('Network error during upload');
//           openNotification('error', 'Network Error', error.message);
//           reject(error);
//         });

//         xhr.open('POST', 'https://prowesstics.space/flask/upload');
//         xhr.send(formData);
//       });

//     } catch (error) {
//       openNotification('error', 'Upload Failed', `Error uploading file: ${error.message}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const processFile = async () => {
//     if (!uploadData) return;

//     setProcessing(true);

//     try {
//       // Check if this is append mode
//       if (appendMode && appendTargetTable) {
//         // Use append endpoint
//         const appendData = {
//           file_id: uploadData.file_id,
//           target_table: appendTargetTable,
//           selected_sheet: selectedSheets[0],
//           // Include selected columns data
//           sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
//             const sheet = uploadData.sheets[sheetName];
//             const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
//               ? sheet.selectedColumns 
//               : sheet.columns || [];
            
//             if (selectedColumns.length > 0) {
//               acc[sheetName] = {
//                 selected_columns: selectedColumns,
//                 all_columns: sheet.columns || []
//               };
//             }
//             return acc;
//           }, {}) : {}
//         };

//         console.log('🔍 Sending append data:', JSON.stringify(appendData, null, 2));

//         const response = await fetch('https://prowesstics.space/flask/upload/append', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(appendData)
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || 'Append failed');
//         }

//         const result = await response.json();
        
//         openNotification('success', 'Data Appended', result.message);
//         onSuccess([appendTargetTable]); // Return the table that was appended to
//         handleCancel();
//         return;
//       }

//       // Regular processing (non-append mode)
//       const processData = {
//         file_id: uploadData.file_id,
//         processing_type: processingType,
//         selected_sheet: processingType === 'single' ? selectedSheets[0] : undefined,
//         selected_sheets: processingType !== 'single' ? selectedSheets : undefined,
//         table_configuration: {
//           ...tableConfiguration,
//           base_table_name: processingType === 'multiple' ? tableConfiguration.table_name : undefined
//         },
//         sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
//           const sheet = uploadData.sheets[sheetName];
//           const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
//             ? sheet.selectedColumns 
//             : sheet.columns || [];
          
//           if (selectedColumns.length > 0) {
//             acc[sheetName] = {
//               selected_columns: selectedColumns,
//               all_columns: sheet.columns || []
//             };
//           }
//           return acc;
//         }, {}) : {}
//       };

//       console.log('🔍 Sending process data:', JSON.stringify(processData, null, 2));

//       // Validate that we have selected columns
//       const hasSelectedColumns = Object.keys(processData.sheet_column_selections).length > 0;
//       if (!hasSelectedColumns) {
//         throw new Error('No columns selected for processing. Please select at least one column.');
//       }

//       const response = await fetch('https://prowesstics.space/flask/upload/process', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(processData)
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Processing failed');
//       }

//       const result = await response.json();
      
//       openNotification('success', 'Success', 
//         `File processed successfully! Created ${result.created_tables.length} table(s): ${result.created_tables.join(', ')}`);
      
//       onSuccess(result.created_tables);
//       handleCancel();

//     } catch (error) {
//       console.error('Processing error:', error);
//       openNotification('error', 'Processing Failed', `Error processing file: ${error.message}`);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleCancel = () => {
//     resetState();
//     onCancel();
//   };

//   const renderFileUploadStep = () => (
//     <div style={{ padding: '20px' }}>
//       {/* Show append mode info */}
//       {appendMode && appendTargetTable && (
//         <Alert
//           message={`Append Mode: Adding data to "${appendTargetTable}"`}
//           description="Your file data will be added to the existing table. Make sure your file has compatible columns."
//           type="info"
//           style={{ marginBottom: '20px' }}
//         />
//       )}

//       <div
//         style={{
//           border: dragOver ? '2px solid #1890ff' : '2px dashed #d9d9d9',
//           borderRadius: '8px',
//           padding: '60px 20px',
//           textAlign: 'center',
//           backgroundColor: dragOver ? '#f0f8ff' : '#fafafa',
//           cursor: 'pointer',
//           transition: 'all 0.3s ease'
//         }}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        
//         {selectedFile ? (
//           <div>
//             <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
//               Selected: {selectedFile.name}
//             </div>
//             <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
//               Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
//             </div>
//             {uploading && (
//               <div style={{ maxWidth: '300px', margin: '0 auto' }}>
//                 <Progress percent={uploadProgress} status="active" />
//               </div>
//             )}
//           </div>
//         ) : (
//           <div>
//             <div style={{ fontSize: '16px', marginBottom: '8px' }}>
//               {appendMode ? 
//                 `Click or drag files to upload and append to "${appendTargetTable}"` :
//                 'Click or drag files to this area to upload'
//               }
//             </div>
//             <div style={{ fontSize: '14px', color: '#666' }}>
//               Support Excel (.xlsx, .xls) and CSV files. Maximum file size: 50MB
//             </div>
//           </div>
//         )}

//         <input
//           ref={fileInputRef}
//           type="file"
//           style={{ display: 'none' }}
//           accept=".xlsx,.xls,.csv"
//           onChange={(e) => {
//             const file = e.target.files?.[0];
//             if (file) handleFileSelect(file);
//           }}
//         />
//       </div>

//       {selectedFile && !uploading && (
//         <div style={{ textAlign: 'center', marginTop: '20px' }}>
//           <Button type="primary" onClick={uploadFile} size="large">
//             Analyze File
//           </Button>
//         </div>
//       )}
//     </div>
//   );

//   const renderConfigurationStep = () => {
//     if (!uploadData) return null;

//     const sheetsData = uploadData.sheets || {};

//     return (
//       <div style={{ 
//         padding: '20px',
//         maxWidth: '100%',
//         overflow: 'hidden',
//         boxSizing: 'border-box'
//       }}>
//         {/* File Information */}
//         <Alert
//           message={`File: ${uploadData.filename}`}
//           description={`${uploadData.total_sheets} sheet(s) detected. File type: ${uploadData.file_type.toUpperCase()}`}
//           type="info"
//           style={{ marginBottom: '20px' }}
//         />

//         {/* Show append mode restrictions */}
//         {appendMode && (
//           <Alert
//             message="Append Mode Active"
//             description={`Data will be added to the existing table "${appendTargetTable}". Only single sheet processing is available in append mode.`}
//             type="warning"
//             style={{ marginBottom: '20px' }}
//           />
//         )}

//         {/* Processing Type Selection - Hidden in append mode */}
//         {!appendMode && (
//           <div style={{ marginBottom: '24px' }}>
//             <h4>Processing Options:</h4>
//             <Radio.Group 
//               value={processingType} 
//               onChange={(e) => {
//                 setProcessingType(e.target.value);
//                 // Reset sheet selection when changing processing type
//                 if (e.target.value === 'single') {
//                   setSelectedSheets([Object.keys(sheetsData)[0] || '']);
//                 } else {
//                   setSelectedSheets(Object.keys(sheetsData));
//                 }
//               }}
//             >
//               <Radio value="single" disabled={uploadData.total_sheets === 0}>
//                 Process Single Sheet
//               </Radio>
//               <Radio value="multiple" disabled={uploadData.total_sheets <= 1}>
//                 Create Multiple Tables (One per Sheet)
//               </Radio>
//               <Radio 
//                 value="combine" 
//                 disabled={!uploadData.can_combine_sheets || uploadData.total_sheets <= 1}
//               >
//                 Combine All Sheets into One Table
//               </Radio>
//             </Radio.Group>

//             {!uploadData.can_combine_sheets && uploadData.compatibility_issues.length > 0 && (
//               <Alert
//                 type="warning"
//                 message="Sheets cannot be combined"
//                 description={
//                   <ul style={{ margin: 0, paddingLeft: '20px' }}>
//                     {uploadData.compatibility_issues.map((issue, idx) => (
//                       <li key={idx}>{issue}</li>
//                     ))}
//                   </ul>
//                 }
//                 style={{ marginTop: '12px' }}
//               />
//             )}
//           </div>
//         )}

//         {/* Sheet Selection */}
//         <div style={{ marginBottom: '24px' }}>
//           <h4>Select Sheets to Process:</h4>
//           <Checkbox.Group
//             value={selectedSheets}
//             onChange={setSelectedSheets}
//             style={{ width: '100%' }}
//           >
//             {Object.entries(sheetsData).map(([sheetName, sheetInfo]) => (
//               <div key={sheetName} style={{
//                 border: '1px solid #d9d9d9',
//                 borderRadius: '4px',
//                 padding: '12px',
//                 marginBottom: '8px',
//                 backgroundColor: selectedSheets.includes(sheetName) ? '#f6ffed' : '#fafafa',
//                 maxWidth: '100%',
//                 overflow: 'hidden',
//                 boxSizing: 'border-box'
//               }}>
//                 <Checkbox 
//                   value={sheetName}
//                   disabled={(processingType === 'single' || appendMode) && selectedSheets.length === 1 && selectedSheets[0] !== sheetName}
//                 >
//                   <strong>{sheetName}</strong>
//                 </Checkbox>
//                 <div style={{ marginLeft: '24px', fontSize: '12px', color: '#666' }}>
//                   {sheetInfo.rows} rows, {sheetInfo.columns.length} columns
//                 </div>
                
//                 {/* Column selection with proper scrolling */}
//                 <div style={{ marginLeft: '24px', marginTop: '8px' }}>
//                   <details>
//                     <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
//                       View Columns & Preview ({sheetInfo.selectedColumns?.length || sheetInfo.columns.length} of {sheetInfo.columns.length} columns selected)
//                     </summary>
//                     <div style={{ marginTop: '8px' }}>
//                       <div style={{ marginBottom: '8px' }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                           <strong>Columns (click to toggle):</strong>
//                           <div>
//                             <Button 
//                               size="small" 
//                               type="link"
//                               onClick={() => {
//                                 // Select all columns
//                                 setUploadData(prev => ({
//                                   ...prev,
//                                   sheets: {
//                                     ...prev.sheets,
//                                     [sheetName]: {
//                                       ...prev.sheets[sheetName],
//                                       selectedColumns: [...prev.sheets[sheetName].columns]
//                                     }
//                                   }
//                                 }));
//                               }}
//                             >
//                               Select All
//                             </Button>
//                             <Button 
//                               size="small" 
//                               type="link"
//                               onClick={() => {
//                                 // Deselect all but first column
//                                 setUploadData(prev => ({
//                                   ...prev,
//                                   sheets: {
//                                     ...prev.sheets,
//                                     [sheetName]: {
//                                       ...prev.sheets[sheetName],
//                                       selectedColumns: [prev.sheets[sheetName].columns[0]]
//                                     }
//                                   }
//                                 }));
//                               }}
//                             >
//                               Clear
//                             </Button>
//                           </div>
//                         </div>
                        
//                         {/* Scrollable column selection area */}
//                         <div style={{ 
//                           maxHeight: '120px', 
//                           overflowY: 'auto',
//                           overflowX: 'hidden',
//                           border: '1px solid #e8e8e8',
//                           borderRadius: '4px',
//                           padding: '8px',
//                           backgroundColor: '#fafafa'
//                         }}>
//                           <div style={{ 
//                             display: 'flex', 
//                             flexWrap: 'wrap', 
//                             gap: '4px'
//                           }}>
//                             {sheetInfo.columns.map(col => {
//                               const isSelected = sheetInfo.selectedColumns ? 
//                                 sheetInfo.selectedColumns.includes(col) : 
//                                 true;
                              
//                               return (
//                                 <span 
//                                   key={col}
//                                   style={{
//                                     backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
//                                     color: isSelected ? '#1565c0' : '#999',
//                                     padding: '4px 8px',
//                                     borderRadius: '4px',
//                                     fontSize: '11px',
//                                     cursor: 'pointer',
//                                     border: isSelected ? '1px solid #1565c0' : '1px solid #ddd',
//                                     transition: 'all 0.2s ease',
//                                     userSelect: 'none',
//                                     maxWidth: '140px',
//                                     overflow: 'hidden',
//                                     textOverflow: 'ellipsis',
//                                     whiteSpace: 'nowrap',
//                                     display: 'inline-block',
//                                     flex: '0 0 auto'
//                                   }}
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     toggleColumnInSheet(sheetName, col);
//                                   }}
//                                   title={isSelected ? `Click to deselect ${col}` : `Click to select ${col}`}
//                                 >
//                                   {isSelected ? '✓ ' : ''}{col}
//                                 </span>
//                               );
//                             })}
//                           </div>
//                         </div>
                        
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
//                           {sheetInfo.selectedColumns ? 
//                             `${sheetInfo.selectedColumns.length} of ${sheetInfo.columns.length} columns selected` :
//                             `${sheetInfo.columns.length} columns selected`
//                           }
//                           {sheetInfo.columns.length > 10 && ' • Scroll up/down to see all columns'}
//                         </div>
//                       </div>
                      
//                       {/* Preview table */}
//                       {sheetInfo.preview && sheetInfo.preview.length > 0 && (
//                         <div style={{ marginTop: '8px' }}>
//                           <strong>Preview (first 3 rows, selected columns only):</strong>
//                           <div style={{ 
//                             width: '100%',
//                             maxWidth: '100%',
//                             height: '180px',
//                             overflow: 'auto',
//                             border: '2px solid #e0e0e0',
//                             borderRadius: '6px',
//                             marginTop: '4px',
//                             backgroundColor: '#fafafa',
//                             boxSizing: 'border-box'
//                           }}>
//                             <div style={{ 
//                               width: 'max-content',
//                               minWidth: '100%'
//                             }}>
//                               <table style={{
//                                 width: '100%',
//                                 borderCollapse: 'collapse',
//                                 fontSize: '10px',
//                                 tableLayout: 'fixed'
//                               }}>
//                                 <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1890ff', zIndex: 1 }}>
//                                   <tr>
//                                     {(sheetInfo.selectedColumns || sheetInfo.columns).map((col, index) => (
//                                       <th
//                                         key={`header-${col}`}
//                                         style={{
//                                           backgroundColor: '#1890ff',
//                                           color: 'white',
//                                           padding: '6px 8px',
//                                           fontWeight: 'bold',
//                                           textAlign: 'left',
//                                           borderRight: '1px solid #fff',
//                                           fontSize: '9px',
//                                           width: '100px',
//                                           minWidth: '80px',
//                                           maxWidth: '120px',
//                                           overflow: 'hidden',
//                                           textOverflow: 'ellipsis',
//                                           whiteSpace: 'nowrap',
//                                           boxSizing: 'border-box'
//                                         }}
//                                         title={col}
//                                       >
//                                         {col}
//                                       </th>
//                                     ))}
//                                   </tr>
//                                 </thead>
                                
//                                 <tbody>
//                                   {sheetInfo.preview.slice(0, 3).map((row, rowIdx) => (
//                                     <tr 
//                                       key={rowIdx}
//                                       style={{
//                                         backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9f9f9'
//                                       }}
//                                     >
//                                       {(sheetInfo.selectedColumns || sheetInfo.columns).map(col => (
//                                         <td
//                                           key={`${rowIdx}-${col}`}
//                                           style={{
//                                             padding: '4px 8px',
//                                             borderRight: '1px solid #e0e0e0',
//                                             borderBottom: '1px solid #e0e0e0',
//                                             fontSize: '9px',
//                                             width: '100px',
//                                             minWidth: '80px',
//                                             maxWidth: '120px',
//                                             overflow: 'hidden',
//                                             textOverflow: 'ellipsis',
//                                             whiteSpace: 'nowrap',
//                                             color: '#333',
//                                             boxSizing: 'border-box'
//                                           }}
//                                           title={row[col] || '-'}
//                                         >
//                                           {row[col] || '-'}
//                                         </td>
//                                       ))}
//                                     </tr>
//                                   ))}
//                                 </tbody>
//                               </table>
//                             </div>
//                           </div>
//                           <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', textAlign: 'center' }}>
//                             ← → Scroll horizontally to view all columns • ↑ ↓ Scroll vertically for more rows
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </details>
//                 </div>
//               </div>
//             ))}
//           </Checkbox.Group>
//         </div>

//         {/* Table Configuration */}
//         <div style={{ marginBottom: '24px' }}>
//           <h4>Table Configuration:</h4>
          
//           <div style={{ marginBottom: '16px' }}>
//             <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//               Table Name:
//             </label>
//             <Input
//               value={tableConfiguration.table_name}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 table_name: e.target.value
//               }))}
//               placeholder={appendMode ? appendTargetTable : uploadData.suggested_table_name}
//               disabled={appendMode} // Disable in append mode
//             />
//             <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
//               {appendMode ? 
//                 'Target table for appending data (cannot be changed)' :
//                 (processingType === 'multiple' ? 
//                   'Base name for tables (sheet names will be appended)' : 
//                   'Name for the database table'
//                 )
//               }
//             </div>
//           </div>

//           <div style={{ marginBottom: '16px' }}>
//             <Checkbox
//               checked={tableConfiguration.has_header}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 has_header: e.target.checked
//               }))}
//             >
//               First row contains column headers
//             </Checkbox>
//           </div>

//           {/* Column Type Configuration - Show only in non-append mode or for information */}
//           {selectedSheets.length > 0 && sheetsData[selectedSheets[0]] && !appendMode && (
//             <div>
//               <h5>Column Data Types (Selected Columns Only):</h5>
//               <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
//                 Configure data types for the columns you've selected to include in the table
//               </div>
//               <div style={{ 
//                 maxHeight: '200px', 
//                 overflowY: 'auto', 
//                 overflowX: 'hidden',
//                 border: '1px solid #d9d9d9', 
//                 borderRadius: '4px', 
//                 padding: '8px',
//                 backgroundColor: '#fafafa'
//               }}>
//                 {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).map(column => (
//                   <div key={column} style={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     marginBottom: '8px',
//                     fontSize: '12px',
//                     gap: '8px'
//                   }}>
//                     <div style={{ 
//                       width: '140px', 
//                       fontWeight: 'bold', 
//                       overflow: 'hidden', 
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       flex: '0 0 140px'
//                     }} title={column}>
//                       {column}:
//                     </div>
//                     <Select
//                       size="small"
//                       style={{ width: '110px', flex: '0 0 110px' }}
//                       value={tableConfiguration.column_types[column] || sheetsData[selectedSheets[0]].column_types[column] || 'TEXT'}
//                       onChange={(value) => setTableConfiguration(prev => ({
//                         ...prev,
//                         column_types: {
//                           ...prev.column_types,
//                           [column]: value
//                         }
//                       }))}
//                     >
//                       <Option value="TEXT">TEXT</Option>
//                       <Option value="INTEGER">INTEGER</Option>
//                       <Option value="DECIMAL">DECIMAL</Option>
//                       <Option value="BOOLEAN">BOOLEAN</Option>
//                       <Option value="TIMESTAMP">TIMESTAMP</Option>
//                       <Option value="DATE">DATE</Option>
//                     </Select>
//                     <div style={{ color: '#666', fontSize: '11px', flex: '1' }}>
//                       (detected: {sheetsData[selectedSheets[0]].column_types[column]})
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).length > 5 && (
//                 <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
//                   Scroll up/down to see all column types
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const isConfigurationValid = () => {
//     return selectedSheets.length > 0 && 
//            tableConfiguration.table_name.trim() !== '' &&
//            uploadData;
//   };

//   return (
//     <Modal
//       title={appendMode ? `Append Data to "${appendTargetTable}"` : "Upload File to Database"}
//       open={visible}
//       onCancel={handleCancel}
//       width={900}
//       footer={null}
//       destroyOnClose={true}
//       style={{ top: 20 }}
//     >
//       <Steps current={currentStep} style={{ marginBottom: '24px' }}>
//         <Step title="Upload File" description="Select and analyze file" />
//         <Step title="Configure" description="Set processing options" />
//         <Step title="Process" description={appendMode ? "Append to table" : "Create database tables"} />
//       </Steps>

//       {currentStep === 0 && renderFileUploadStep()}
//       {currentStep === 1 && renderConfigurationStep()}

//       {/* Footer Buttons */}
//       <div style={{ 
//         borderTop: '1px solid #f0f0f0', 
//         padding: '16px 0 0 0', 
//         textAlign: 'right',
//         marginTop: '20px'
//       }}>
//         {currentStep === 1 && (
//           <>
//             <Button 
//               onClick={() => setCurrentStep(0)} 
//               style={{ marginRight: '8px' }}
//             >
//               Back
//             </Button>
//             <Button
//               type="primary"
//               onClick={processFile}
//               loading={processing}
//               disabled={!isConfigurationValid()}
//             >
//               {processing ? 
//                 (appendMode ? 'Appending...' : 'Processing...') : 
//                 (appendMode ? 'Append Data' : 'Create Tables')
//               }
//             </Button>
//           </>
//         )}

//         {currentStep === 0 && (
//           <Button onClick={handleCancel}>
//             Cancel
//           </Button>
//         )}
//       </div>

//       {processing && (
//         <div style={{ 
//           position: 'absolute', 
//           top: 0, 
//           left: 0, 
//           right: 0, 
//           bottom: 0, 
//           backgroundColor: 'rgba(255, 255, 255, 0.8)', 
//           display: 'flex', 
//           alignItems: 'center', 
//           justifyContent: 'center',
//           flexDirection: 'column',
//           zIndex: 1000
//         }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px', fontSize: '16px' }}>
//             {appendMode ? 
//               'Processing file and appending to database table...' :
//               'Processing file and creating database tables...'
//             }
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// };

// // Enhanced handleFileUpload hook with append support
// const useFileUpload = (openNotification, fetchTables, updateState) => {
//   const [uploadModalVisible, setUploadModalVisible] = useState(false);
//   const [appendModalVisible, setAppendModalVisible] = useState(false);
//   const [appendTargetTable, setAppendTargetTable] = useState(null);

//   const handleFileUpload = useCallback((file) => {
//     if (file) {
//       setUploadModalVisible(true);
//       return;
//     }
    
//     setUploadModalVisible(true);
//   }, []);

//   // NEW: Handle append upload
//   const handleAppendUpload = useCallback((tableName) => {
//     if (!tableName) {
//       openNotification('warning', 'No Table Selected', 'Please select a table to append data to');
//       return;
//     }
    
//     setAppendTargetTable(tableName);
//     setAppendModalVisible(true);
//   }, [openNotification]);

//   const handleUploadSuccess = useCallback(async (createdTables) => {
//     await fetchTables();
    
//     if (createdTables.length > 0) {
//       updateState({ 
//         selectedTable: createdTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setUploadModalVisible(false);
//   }, [fetchTables, updateState]);

//   const handleAppendSuccess = useCallback(async (affectedTables) => {
//     await fetchTables();
    
//     if (affectedTables.length > 0) {
//       updateState({ 
//         selectedTable: affectedTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setAppendModalVisible(false);
//   }, [fetchTables, updateState]);

//   const FileUploadModalComponent = () => (
//     <>
//       {/* Regular Upload Modal */}
//       <FileUploadModal
//         visible={uploadModalVisible}
//         onCancel={() => setUploadModalVisible(false)}
//         onSuccess={handleUploadSuccess}
//         openNotification={openNotification}
//         existingTables={[]}
//         appendMode={false}
//       />
      
//       {/* Append Mode Modal */}
//       <FileUploadModal
//         visible={appendModalVisible}
//         onCancel={() => {
//           setAppendModalVisible(false);
//           setAppendTargetTable(null);
//         }}
//         onSuccess={handleAppendSuccess}
//         openNotification={openNotification}
//         existingTables={[]}
//         appendMode={true}
//         appendTargetTable={appendTargetTable}
//       />
//     </>
//   );

//   return {
//     handleFileUpload,
//     handleAppendUpload, // NEW: Export the append handler
//     FileUploadModalComponent
//   };
// };

// export { useFileUpload, FileUploadModal };


// // FileUpload.jsx - Enhanced with full CSV support
// import React, { useState, useRef, useCallback } from 'react';
// import { Modal, Steps, Button, Input, Select, Table, Checkbox, Radio, Progress, Alert, Spin } from 'antd';
// import { InboxOutlined, FileExcelOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';

// const { Step } = Steps;
// const { Option } = Select;
// const { TextArea } = Input;

// // Enhanced File Upload Modal Component with Append Mode and Full CSV Support
// const FileUploadModal = ({ 
//   visible, 
//   onCancel, 
//   onSuccess, 
//   openNotification,
//   existingTables = [],
//   // NEW: Append mode props
//   appendMode = false,
//   appendTargetTable = null
// }) => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [uploadData, setUploadData] = useState(null);
//   const [processing, setProcessing] = useState(false);
//   const [dragOver, setDragOver] = useState(false);
//   const fileInputRef = useRef(null);

//   // Step 1: File Upload State
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploading, setUploading] = useState(false);

//   // Step 2: Configuration State
//   const [processingType, setProcessingType] = useState('single');
//   const [selectedSheets, setSelectedSheets] = useState([]);
//   const [tableConfiguration, setTableConfiguration] = useState({
//     table_name: '',
//     has_header: true,
//     column_types: {}
//   });

//   // CSV specific configuration
//   const [csvConfig, setCsvConfig] = useState({
//     delimiter: 'auto', // auto, comma, semicolon, tab, pipe
//     encoding: 'utf-8',
//     quote_char: '"',
//     escape_char: '"'
//   });

//   // 🔧 FIXED: Column selection with proper state management
//   const toggleColumnInSheet = useCallback((sheetName, columnToToggle) => {
//     if (!uploadData || !uploadData.sheets) return;
    
//     setUploadData(prev => {
//       const updatedSheets = { ...prev.sheets };
//       const sheetData = { ...updatedSheets[sheetName] };
      
//       // Initialize selectedColumns if it doesn't exist
//       if (!sheetData.selectedColumns) {
//         sheetData.selectedColumns = [...sheetData.columns];
//       }
      
//       // Toggle column selection
//       const isCurrentlySelected = sheetData.selectedColumns.includes(columnToToggle);
      
//       if (isCurrentlySelected) {
//         // Prevent deselecting all columns
//         if (sheetData.selectedColumns.length <= 1) {
//           openNotification('warning', 'Column Required', 'At least one column must be selected');
//           return prev; // Don't update state
//         }
//         sheetData.selectedColumns = sheetData.selectedColumns.filter(col => col !== columnToToggle);
//       } else {
//         sheetData.selectedColumns = [...sheetData.selectedColumns, columnToToggle];
//       }
      
//       updatedSheets[sheetName] = sheetData;
      
//       return {
//         ...prev,
//         sheets: updatedSheets
//       };
//     });
//   }, [uploadData, openNotification]);

//   const resetState = () => {
//     setCurrentStep(0);
//     setUploadData(null);
//     setSelectedFile(null);
//     setUploadProgress(0);
//     setUploading(false);
//     setProcessing(false);
//     // Reset processing type based on mode
//     setProcessingType(appendMode ? 'single' : 'single');
//     setSelectedSheets([]);
//     setTableConfiguration({
//       table_name: appendMode ? appendTargetTable || '' : '',
//       has_header: true,
//       column_types: {}
//     });
//     // Reset CSV config
//     setCsvConfig({
//       delimiter: 'auto',
//       encoding: 'utf-8',
//       quote_char: '"',
//       escape_char: '"'
//     });
//   };

//   // Enhanced file validation with better CSV support
//   const handleFileSelect = useCallback((file) => {
//     if (!file) return;

//     // Enhanced file type validation
//     const allowedTypes = [
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'text/csv',
//       'application/csv',
//       'text/plain' // Sometimes CSV files are detected as plain text
//     ];
    
//     const allowedExtensions = ['.xlsx', '.xls', '.csv'];
//     const fileName = file.name.toLowerCase();
//     const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

//     // Check file extension first (more reliable than MIME type for CSV)
//     const hasValidExtension = allowedExtensions.includes(fileExtension);
//     const hasValidMimeType = allowedTypes.includes(file.type);

//     // For CSV files, be more lenient with MIME type checking
//     const isCsvFile = fileExtension === '.csv';
//     const isValidFile = hasValidExtension && (hasValidMimeType || isCsvFile);

//     if (!isValidFile) {
//       setTimeout(() => {
//         openNotification('error', 'Invalid File Type', 
//           `Please upload Excel (.xlsx, .xls) or CSV (.csv) files only. 
//            Detected: ${file.type} with extension ${fileExtension}`);
//       }, 0);
//       return;
//     }

//     // Check file size (50MB limit)
//     const maxSize = 50 * 1024 * 1024;
//     if (file.size > maxSize) {
//       setTimeout(() => {
//         openNotification('error', 'File Too Large', 'File size should be less than 50MB');
//       }, 0);
//       return;
//     }

//     console.log('✅ File selected:', {
//       name: file.name,
//       type: file.type,
//       size: file.size,
//       extension: fileExtension
//     });

//     setSelectedFile(file);
//   }, [openNotification]);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);

//     const files = Array.from(e.dataTransfer.files);
//     if (files.length > 0) {
//       handleFileSelect(files[0]);
//     }
//   }, [handleFileSelect]);

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(true);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);
//   }, []);

//   const uploadFile = async () => {
//     if (!selectedFile) return;

//     setUploading(true);
//     setUploadProgress(0);

//     const formData = new FormData();
//     formData.append('file', selectedFile);
    
//     // Add CSV configuration if it's a CSV file
//     const isCsvFile = selectedFile.name.toLowerCase().endsWith('.csv');
//     if (isCsvFile) {
//       formData.append('csv_config', JSON.stringify(csvConfig));
//     }

//     try {
//       const xhr = new XMLHttpRequest();

//       return new Promise((resolve, reject) => {
//         xhr.upload.addEventListener('progress', (event) => {
//           if (event.lengthComputable) {
//             const percentComplete = Math.round((event.loaded / event.total) * 100);
//             setUploadProgress(percentComplete);
//           }
//         });

//         xhr.addEventListener('load', async () => {
//           if (xhr.status === 200) {
//             try {
//               const result = JSON.parse(xhr.responseText);
              
//               console.log('📊 Upload result:', result);
              
//               // 🔧 FIXED: Initialize selectedColumns for all sheets
//               if (result.sheets) {
//                 Object.keys(result.sheets).forEach(sheetName => {
//                   const sheet = result.sheets[sheetName];
//                   if (!sheet.selectedColumns) {
//                     sheet.selectedColumns = [...sheet.columns]; // All columns selected by default
//                   }
//                 });
//               }
              
//               setUploadData(result);
              
//               // Set table name based on mode
//               setTableConfiguration(prev => ({
//                 ...prev,
//                 table_name: appendMode ? appendTargetTable : (result.suggested_table_name || '')
//               }));
              
//               // Auto-select first sheet
//               if (result.sheets && Object.keys(result.sheets).length > 0) {
//                 setSelectedSheets([Object.keys(result.sheets)[0]]);
//               }
              
//               setCurrentStep(1);
//               resolve(result);
//             } catch (parseError) {
//               console.error('❌ Parse error:', parseError);
//               const error = new Error('Invalid response format from server');
//               openNotification('error', 'Processing Failed', error.message);
//               reject(error);
//             }
//           } else {
//             const errorText = xhr.responseText;
//             let errorMessage = `Upload failed (${xhr.status})`;
//             try {
//               const errorData = JSON.parse(errorText);
//               errorMessage = errorData.error || errorMessage;
//             } catch (e) {
//               errorMessage = errorText || errorMessage;
//             }
//             console.error('❌ Upload error:', { status: xhr.status, errorText });
//             const error = new Error(errorMessage);
//             openNotification('error', 'Upload Failed', error.message);
//             reject(error);
//           }
//         });

//         xhr.addEventListener('error', () => {
//           console.error('❌ Network error during upload');
//           const error = new Error('Network error during upload');
//           openNotification('error', 'Network Error', error.message);
//           reject(error);
//         });

//         xhr.open('POST', 'https://prowesstics.space/flask/upload');
//         xhr.send(formData);
//       });

//     } catch (error) {
//       console.error('❌ Upload exception:', error);
//       openNotification('error', 'Upload Failed', `Error uploading file: ${error.message}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const processFile = async () => {
//     if (!uploadData) return;

//     setProcessing(true);

//     try {
//       // Check if this is append mode
//       if (appendMode && appendTargetTable) {
//         // Use append endpoint
//         const appendData = {
//           file_id: uploadData.file_id,
//           target_table: appendTargetTable,
//           selected_sheet: selectedSheets[0],
//           csv_config: selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? csvConfig : undefined,
//           // Include selected columns data
//           sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
//             const sheet = uploadData.sheets[sheetName];
//             const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
//               ? sheet.selectedColumns 
//               : sheet.columns || [];
            
//             if (selectedColumns.length > 0) {
//               acc[sheetName] = {
//                 selected_columns: selectedColumns,
//                 all_columns: sheet.columns || []
//               };
//             }
//             return acc;
//           }, {}) : {}
//         };

//         console.log('🔍 Sending append data:', JSON.stringify(appendData, null, 2));

//         const response = await fetch('https://prowesstics.space/flask/upload/append', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(appendData)
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || 'Append failed');
//         }

//         const result = await response.json();
        
//         openNotification('success', 'Data Appended', result.message);
//         onSuccess([appendTargetTable]); // Return the table that was appended to
//         handleCancel();
//         return;
//       }

//       // Regular processing (non-append mode)
//       const processData = {
//         file_id: uploadData.file_id,
//         processing_type: processingType,
//         selected_sheet: processingType === 'single' ? selectedSheets[0] : undefined,
//         selected_sheets: processingType !== 'single' ? selectedSheets : undefined,
//         csv_config: selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? csvConfig : undefined,
//         table_configuration: {
//           ...tableConfiguration,
//           base_table_name: processingType === 'multiple' ? tableConfiguration.table_name : undefined
//         },
//         sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
//           const sheet = uploadData.sheets[sheetName];
//           const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
//             ? sheet.selectedColumns 
//             : sheet.columns || [];
          
//           if (selectedColumns.length > 0) {
//             acc[sheetName] = {
//               selected_columns: selectedColumns,
//               all_columns: sheet.columns || []
//             };
//           }
//           return acc;
//         }, {}) : {}
//       };

//       console.log('🔍 Sending process data:', JSON.stringify(processData, null, 2));

//       // Validate that we have selected columns
//       const hasSelectedColumns = Object.keys(processData.sheet_column_selections).length > 0;
//       if (!hasSelectedColumns) {
//         throw new Error('No columns selected for processing. Please select at least one column.');
//       }

//       const response = await fetch('https://prowesstics.space/flask/upload/process', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(processData)
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Processing failed');
//       }

//       const result = await response.json();
      
//       openNotification('success', 'Success', 
//         `File processed successfully! Created ${result.created_tables.length} table(s): ${result.created_tables.join(', ')}`);
      
//       onSuccess(result.created_tables);
//       handleCancel();

//     } catch (error) {
//       console.error('❌ Processing error:', error);
//       openNotification('error', 'Processing Failed', `Error processing file: ${error.message}`);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleCancel = () => {
//     resetState();
//     onCancel();
//   };

//   // Get appropriate file icon
//   const getFileIcon = (fileName) => {
//     if (!fileName) return <InboxOutlined />;
    
//     const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
//     if (ext === '.csv') {
//       return <FileTextOutlined style={{ color: '#52c41a' }} />;
//     } else {
//       return <FileExcelOutlined style={{ color: '#1890ff' }} />;
//     }
//   };

//   const renderFileUploadStep = () => (
//     <div style={{ padding: '20px' }}>
//       {/* Show append mode info */}
//       {appendMode && appendTargetTable && (
//         <Alert
//           message={`Append Mode: Adding data to "${appendTargetTable}"`}
//           description="Your file data will be added to the existing table. Make sure your file has compatible columns."
//           type="info"
//           style={{ marginBottom: '20px' }}
//         />
//       )}

//       <div
//         style={{
//           border: dragOver ? '2px solid #1890ff' : '2px dashed #d9d9d9',
//           borderRadius: '8px',
//           padding: '60px 20px',
//           textAlign: 'center',
//           backgroundColor: dragOver ? '#f0f8ff' : '#fafafa',
//           cursor: 'pointer',
//           transition: 'all 0.3s ease'
//         }}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         {selectedFile ? (
//           getFileIcon(selectedFile.name)
//         ) : (
//           <InboxOutlined />
//         )}
//         <div style={{ fontSize: '48px', marginBottom: '16px' }} />
        
//         {selectedFile ? (
//           <div>
//             <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
//               Selected: {selectedFile.name}
//             </div>
//             <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
//               Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
//             </div>
//             <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
//               Type: {selectedFile.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel'} file
//             </div>
//             {uploading && (
//               <div style={{ maxWidth: '300px', margin: '0 auto' }}>
//                 <Progress percent={uploadProgress} status="active" />
//               </div>
//             )}
//           </div>
//         ) : (
//           <div>
//             <div style={{ fontSize: '16px', marginBottom: '8px' }}>
//               {appendMode ? 
//                 `Click or drag files to upload and append to "${appendTargetTable}"` :
//                 'Click or drag files to this area to upload'
//               }
//             </div>
//             <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
//               <strong>Supports:</strong> Excel (.xlsx, .xls) and CSV (.csv) files
//             </div>
//             <div style={{ fontSize: '12px', color: '#999' }}>
//               Maximum file size: 50MB
//             </div>
//           </div>
//         )}

//         <input
//           ref={fileInputRef}
//           type="file"
//           style={{ display: 'none' }}
//           accept=".xlsx,.xls,.csv"
//           onChange={(e) => {
//             const file = e.target.files?.[0];
//             if (file) handleFileSelect(file);
//           }}
//         />
//       </div>

//       {/* CSV Configuration Panel */}
//       {selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') && (
//         <div style={{ 
//           marginTop: '20px',
//           border: '1px solid #d9d9d9',
//           borderRadius: '8px',
//           padding: '16px',
//           backgroundColor: '#fafafa'
//         }}>
//           <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>
//             <FileTextOutlined style={{ marginRight: '8px' }} />
//             CSV Configuration Options
//           </h4>
          
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
//             <div>
//               <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//                 Delimiter:
//               </label>
//               <Select
//                 value={csvConfig.delimiter}
//                 onChange={(value) => setCsvConfig(prev => ({ ...prev, delimiter: value }))}
//                 style={{ width: '100%' }}
//               >
//                 <Option value="auto">Auto-detect</Option>
//                 <Option value="comma">Comma (,)</Option>
//                 <Option value="semicolon">Semicolon (;)</Option>
//                 <Option value="tab">Tab</Option>
//                 <Option value="pipe">Pipe (|)</Option>
//               </Select>
//             </div>
            
//             <div>
//               <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//                 Encoding:
//               </label>
//               <Select
//                 value={csvConfig.encoding}
//                 onChange={(value) => setCsvConfig(prev => ({ ...prev, encoding: value }))}
//                 style={{ width: '100%' }}
//               >
//                 <Option value="utf-8">UTF-8</Option>
//                 <Option value="iso-8859-1">ISO-8859-1</Option>
//                 <Option value="windows-1252">Windows-1252</Option>
//                 <Option value="ascii">ASCII</Option>
//               </Select>
//             </div>
            
//             <div>
//               <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//                 Quote Character:
//               </label>
//               <Select
//                 value={csvConfig.quote_char}
//                 onChange={(value) => setCsvConfig(prev => ({ ...prev, quote_char: value }))}
//                 style={{ width: '100%' }}
//               >
//                 <Option value='"'>Double Quote (")</Option>
//                 <Option value="'">Single Quote (')</Option>
//                 <Option value="">None</Option>
//               </Select>
//             </div>
            
//             <div>
//               <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//                 Escape Character:
//               </label>
//               <Select
//                 value={csvConfig.escape_char}
//                 onChange={(value) => setCsvConfig(prev => ({ ...prev, escape_char: value }))}
//                 style={{ width: '100%' }}
//               >
//                 <Option value='"'>Double Quote (")</Option>
//                 <Option value="'">Single Quote (')</Option>
//                 <Option value="\">\</Option>
//                 <Option value="">None</Option>
//               </Select>
//             </div>
//           </div>
          
//           <div style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
//             <strong>Tip:</strong> Use "Auto-detect" for delimiter if you're unsure. The system will analyze your CSV file and choose the best settings.
//           </div>
//         </div>
//       )}

//       {selectedFile && !uploading && (
//         <div style={{ textAlign: 'center', marginTop: '20px' }}>
//           <Button type="primary" onClick={uploadFile} size="large">
//             {selectedFile.name.toLowerCase().endsWith('.csv') ? 'Analyze CSV File' : 'Analyze File'}
//           </Button>
//         </div>
//       )}
//     </div>
//   );

//   const renderConfigurationStep = () => {
//     if (!uploadData) return null;

//     const sheetsData = uploadData.sheets || {};
//     const isCsvFile = selectedFile && selectedFile.name.toLowerCase().endsWith('.csv');

//     return (
//       <div style={{ 
//         padding: '20px',
//         maxWidth: '100%',
//         overflow: 'hidden',
//         boxSizing: 'border-box'
//       }}>
//         {/* File Information */}
//         <Alert
//           message={`File: ${uploadData.filename}`}
//           description={
//             <>
//               {uploadData.total_sheets} sheet(s) detected. File type: {uploadData.file_type.toUpperCase()}
//               {isCsvFile && (
//                 <div style={{ marginTop: '4px', fontSize: '12px' }}>
//                   <strong>CSV Settings:</strong> Delimiter: {csvConfig.delimiter}, Encoding: {csvConfig.encoding}
//                 </div>
//               )}
//             </>
//           }
//           type="info"
//           style={{ marginBottom: '20px' }}
//           icon={getFileIcon(uploadData.filename)}
//         />

//         {/* Show append mode restrictions */}
//         {appendMode && (
//           <Alert
//             message="Append Mode Active"
//             description={`Data will be added to the existing table "${appendTargetTable}". Only single sheet processing is available in append mode.`}
//             type="warning"
//             style={{ marginBottom: '20px' }}
//           />
//         )}

//         {/* Processing Type Selection - Hidden in append mode */}
//         {!appendMode && (
//           <div style={{ marginBottom: '24px' }}>
//             <h4>Processing Options:</h4>
//             <Radio.Group 
//               value={processingType} 
//               onChange={(e) => {
//                 setProcessingType(e.target.value);
//                 // Reset sheet selection when changing processing type
//                 if (e.target.value === 'single') {
//                   setSelectedSheets([Object.keys(sheetsData)[0] || '']);
//                 } else {
//                   setSelectedSheets(Object.keys(sheetsData));
//                 }
//               }}
//             >
//               <Radio value="single" disabled={uploadData.total_sheets === 0}>
//                 Process Single Sheet {isCsvFile && '(CSV as single table)'}
//               </Radio>
//               <Radio value="multiple" disabled={uploadData.total_sheets <= 1 || isCsvFile}>
//                 Create Multiple Tables (One per Sheet) {isCsvFile && '(Not available for CSV)'}
//               </Radio>
//               <Radio 
//                 value="combine" 
//                 disabled={!uploadData.can_combine_sheets || uploadData.total_sheets <= 1 || isCsvFile}
//               >
//                 Combine All Sheets into One Table {isCsvFile && '(Not available for CSV)'}
//               </Radio>
//             </Radio.Group>

//             {!uploadData.can_combine_sheets && uploadData.compatibility_issues && uploadData.compatibility_issues.length > 0 && (
//               <Alert
//                 type="warning"
//                 message="Sheets cannot be combined"
//                 description={
//                   <ul style={{ margin: 0, paddingLeft: '20px' }}>
//                     {uploadData.compatibility_issues.map((issue, idx) => (
//                       <li key={idx}>{issue}</li>
//                     ))}
//                   </ul>
//                 }
//                 style={{ marginTop: '12px' }}
//               />
//             )}
//           </div>
//         )}

//         {/* Sheet Selection */}
//         <div style={{ marginBottom: '24px' }}>
//           <h4>Select {isCsvFile ? 'Data' : 'Sheets'} to Process:</h4>
//           <Checkbox.Group
//             value={selectedSheets}
//             onChange={setSelectedSheets}
//             style={{ width: '100%' }}
//           >
//             {Object.entries(sheetsData).map(([sheetName, sheetInfo]) => (
//               <div key={sheetName} style={{
//                 border: '1px solid #d9d9d9',
//                 borderRadius: '4px',
//                 padding: '12px',
//                 marginBottom: '8px',
//                 backgroundColor: selectedSheets.includes(sheetName) ? '#f6ffed' : '#fafafa',
//                 maxWidth: '100%',
//                 overflow: 'hidden',
//                 boxSizing: 'border-box'
//               }}>
//                 <Checkbox 
//                   value={sheetName}
//                   disabled={(processingType === 'single' || appendMode) && selectedSheets.length === 1 && selectedSheets[0] !== sheetName}
//                 >
//                   <strong>{isCsvFile ? `${sheetName} (CSV Data)` : sheetName}</strong>
//                 </Checkbox>
//                 <div style={{ marginLeft: '24px', fontSize: '12px', color: '#666' }}>
//                   {sheetInfo.rows} rows, {sheetInfo.columns.length} columns
//                   {isCsvFile && (
//                     <span style={{ marginLeft: '8px', color: '#1890ff' }}>
//                       • CSV format detected and parsed
//                     </span>
//                   )}
//                 </div>
                
//                 {/* Column selection with proper scrolling */}
//                 <div style={{ marginLeft: '24px', marginTop: '8px' }}>
//                   <details>
//                     <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
//                       View Columns & Preview ({sheetInfo.selectedColumns?.length || sheetInfo.columns.length} of {sheetInfo.columns.length} columns selected)
//                     </summary>
//                     <div style={{ marginTop: '8px' }}>
//                       <div style={{ marginBottom: '8px' }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                           <strong>Columns (click to toggle):</strong>
//                           <div>
//                             <Button 
//                               size="small" 
//                               type="link"
//                               onClick={() => {
//                                 // Select all columns
//                                 setUploadData(prev => ({
//                                   ...prev,
//                                   sheets: {
//                                     ...prev.sheets,
//                                     [sheetName]: {
//                                       ...prev.sheets[sheetName],
//                                       selectedColumns: [...prev.sheets[sheetName].columns]
//                                     }
//                                   }
//                                 }));
//                               }}
//                             >
//                               Select All
//                             </Button>
//                             <Button 
//                               size="small" 
//                               type="link"
//                               onClick={() => {
//                                 // Deselect all but first column
//                                 setUploadData(prev => ({
//                                   ...prev,
//                                   sheets: {
//                                     ...prev.sheets,
//                                     [sheetName]: {
//                                       ...prev.sheets[sheetName],
//                                       selectedColumns: [prev.sheets[sheetName].columns[0]]
//                                     }
//                                   }
//                                 }));
//                               }}
//                             >
//                               Clear
//                             </Button>
//                           </div>
//                         </div>
                        
//                         {/* Scrollable column selection area */}
//                         <div style={{ 
//                           maxHeight: '120px', 
//                           overflowY: 'auto',
//                           overflowX: 'hidden',
//                           border: '1px solid #e8e8e8',
//                           borderRadius: '4px',
//                           padding: '8px',
//                           backgroundColor: '#fafafa'
//                         }}>
//                           <div style={{ 
//                             display: 'flex', 
//                             flexWrap: 'wrap', 
//                             gap: '4px'
//                           }}>
//                             {sheetInfo.columns.map(col => {
//                               const isSelected = sheetInfo.selectedColumns ? 
//                                 sheetInfo.selectedColumns.includes(col) : 
//                                 true;
                              
//                               return (
//                                 <span 
//                                   key={col}
//                                   style={{
//                                     backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
//                                     color: isSelected ? '#1565c0' : '#999',
//                                     padding: '4px 8px',
//                                     borderRadius: '4px',
//                                     fontSize: '11px',
//                                     cursor: 'pointer',
//                                     border: isSelected ? '1px solid #1565c0' : '1px solid #ddd',
//                                     transition: 'all 0.2s ease',
//                                     userSelect: 'none',
//                                     maxWidth: '140px',
//                                     overflow: 'hidden',
//                                     textOverflow: 'ellipsis',
//                                     whiteSpace: 'nowrap',
//                                     display: 'inline-block',
//                                     flex: '0 0 auto'
//                                   }}
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     toggleColumnInSheet(sheetName, col);
//                                   }}
//                                   title={isSelected ? `Click to deselect ${col}` : `Click to select ${col}`}
//                                 >
//                                   {isSelected ? '✓ ' : ''}{col}
//                                 </span>
//                               );
//                             })}
//                           </div>
//                         </div>
                        
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
//                           {sheetInfo.selectedColumns ? 
//                             `${sheetInfo.selectedColumns.length} of ${sheetInfo.columns.length} columns selected` :
//                             `${sheetInfo.columns.length} columns selected`
//                           }
//                           {sheetInfo.columns.length > 10 && ' • Scroll up/down to see all columns'}
//                         </div>
//                       </div>
                      
//                       {/* Preview table */}
//                       {sheetInfo.preview && sheetInfo.preview.length > 0 && (
//                         <div style={{ marginTop: '8px' }}>
//                           <strong>Preview (first 3 rows, selected columns only):</strong>
//                           <div style={{ 
//                             width: '100%',
//                             maxWidth: '100%',
//                             height: '180px',
//                             overflow: 'auto',
//                             border: '2px solid #e0e0e0',
//                             borderRadius: '6px',
//                             marginTop: '4px',
//                             backgroundColor: '#fafafa',
//                             boxSizing: 'border-box'
//                           }}>
//                             <div style={{ 
//                               width: 'max-content',
//                               minWidth: '100%'
//                             }}>
//                               <table style={{
//                                 width: '100%',
//                                 borderCollapse: 'collapse',
//                                 fontSize: '10px',
//                                 tableLayout: 'fixed'
//                               }}>
//                                 <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1890ff', zIndex: 1 }}>
//                                   <tr>
//                                     {(sheetInfo.selectedColumns || sheetInfo.columns).map((col, index) => (
//                                       <th
//                                         key={`header-${col}`}
//                                         style={{
//                                           backgroundColor: '#1890ff',
//                                           color: 'white',
//                                           padding: '6px 8px',
//                                           fontWeight: 'bold',
//                                           textAlign: 'left',
//                                           borderRight: '1px solid #fff',
//                                           fontSize: '9px',
//                                           width: '100px',
//                                           minWidth: '80px',
//                                           maxWidth: '120px',
//                                           overflow: 'hidden',
//                                           textOverflow: 'ellipsis',
//                                           whiteSpace: 'nowrap',
//                                           boxSizing: 'border-box'
//                                         }}
//                                         title={col}
//                                       >
//                                         {col}
//                                       </th>
//                                     ))}
//                                   </tr>
//                                 </thead>
                                
//                                 <tbody>
//                                   {sheetInfo.preview.slice(0, 3).map((row, rowIdx) => (
//                                     <tr 
//                                       key={rowIdx}
//                                       style={{
//                                         backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9f9f9'
//                                       }}
//                                     >
//                                       {(sheetInfo.selectedColumns || sheetInfo.columns).map(col => (
//                                         <td
//                                           key={`${rowIdx}-${col}`}
//                                           style={{
//                                             padding: '4px 8px',
//                                             borderRight: '1px solid #e0e0e0',
//                                             borderBottom: '1px solid #e0e0e0',
//                                             fontSize: '9px',
//                                             width: '100px',
//                                             minWidth: '80px',
//                                             maxWidth: '120px',
//                                             overflow: 'hidden',
//                                             textOverflow: 'ellipsis',
//                                             whiteSpace: 'nowrap',
//                                             color: '#333',
//                                             boxSizing: 'border-box'
//                                           }}
//                                           title={row[col] || '-'}
//                                         >
//                                           {row[col] || '-'}
//                                         </td>
//                                       ))}
//                                     </tr>
//                                   ))}
//                                 </tbody>
//                               </table>
//                             </div>
//                           </div>
//                           <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', textAlign: 'center' }}>
//                             ← → Scroll horizontally to view all columns • ↑ ↓ Scroll vertically for more rows
//                             {isCsvFile && ' • CSV data parsed successfully'}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </details>
//                 </div>
//               </div>
//             ))}
//           </Checkbox.Group>
//         </div>

//         {/* Table Configuration */}
//         <div style={{ marginBottom: '24px' }}>
//           <h4>Table Configuration:</h4>
          
//           <div style={{ marginBottom: '16px' }}>
//             <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//               Table Name:
//             </label>
//             <Input
//               value={tableConfiguration.table_name}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 table_name: e.target.value
//               }))}
//               placeholder={appendMode ? appendTargetTable : uploadData.suggested_table_name}
//               disabled={appendMode} // Disable in append mode
//             />
//             <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
//               {appendMode ? 
//                 'Target table for appending data (cannot be changed)' :
//                 (processingType === 'multiple' ? 
//                   'Base name for tables (sheet names will be appended)' : 
//                   'Name for the database table'
//                 )
//               }
//               {isCsvFile && !appendMode && ' • CSV file will create a single table'}
//             </div>
//           </div>

//           <div style={{ marginBottom: '16px' }}>
//             <Checkbox
//               checked={tableConfiguration.has_header}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 has_header: e.target.checked
//               }))}
//             >
//               First row contains column headers
//             </Checkbox>
//             {isCsvFile && (
//               <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
//                 For CSV files, headers are usually automatically detected
//               </div>
//             )}
//           </div>

//           {/* Column Type Configuration - Show only in non-append mode or for information */}
//           {selectedSheets.length > 0 && sheetsData[selectedSheets[0]] && !appendMode && (
//             <div>
//               <h5>Column Data Types (Selected Columns Only):</h5>
//               <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
//                 Configure data types for the columns you've selected to include in the table
//                 {isCsvFile && ' • CSV columns are auto-detected but you can override them here'}
//               </div>
//               <div style={{ 
//                 maxHeight: '200px', 
//                 overflowY: 'auto', 
//                 overflowX: 'hidden',
//                 border: '1px solid #d9d9d9', 
//                 borderRadius: '4px', 
//                 padding: '8px',
//                 backgroundColor: '#fafafa'
//               }}>
//                 {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).map(column => (
//                   <div key={column} style={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     marginBottom: '8px',
//                     fontSize: '12px',
//                     gap: '8px'
//                   }}>
//                     <div style={{ 
//                       width: '140px', 
//                       fontWeight: 'bold', 
//                       overflow: 'hidden', 
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       flex: '0 0 140px'
//                     }} title={column}>
//                       {column}:
//                     </div>
//                     <Select
//                       size="small"
//                       style={{ width: '110px', flex: '0 0 110px' }}
//                       value={tableConfiguration.column_types[column] || sheetsData[selectedSheets[0]].column_types[column] || 'TEXT'}
//                       onChange={(value) => setTableConfiguration(prev => ({
//                         ...prev,
//                         column_types: {
//                           ...prev.column_types,
//                           [column]: value
//                         }
//                       }))}
//                     >
//                       <Option value="TEXT">TEXT</Option>
//                       <Option value="INTEGER">INTEGER</Option>
//                       <Option value="DECIMAL">DECIMAL</Option>
//                       <Option value="BOOLEAN">BOOLEAN</Option>
//                       <Option value="TIMESTAMP">TIMESTAMP</Option>
//                       <Option value="DATE">DATE</Option>
//                     </Select>
//                     <div style={{ color: '#666', fontSize: '11px', flex: '1' }}>
//                       (detected: {sheetsData[selectedSheets[0]].column_types[column]})
//                       {isCsvFile && <span style={{ color: '#1890ff' }}> • CSV</span>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).length > 5 && (
//                 <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
//                   Scroll up/down to see all column types
//                 </div>
//               )}
//             </div>
//           )}

//           {/* CSV specific information panel */}
//           {isCsvFile && (
//             <div style={{
//               marginTop: '16px',
//               padding: '12px',
//               backgroundColor: '#f0f9ff',
//               border: '1px solid #bae6fd',
//               borderRadius: '6px'
//             }}>
//               <h6 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>
//                 <FileTextOutlined style={{ marginRight: '6px' }} />
//                 CSV File Information
//               </h6>
//               <div style={{ fontSize: '12px', color: '#0369a1' }}>
//                 • File format: CSV (Comma Separated Values)<br/>
//                 • Delimiter used: {csvConfig.delimiter === 'auto' ? 'Auto-detected' : csvConfig.delimiter}<br/>
//                 • Character encoding: {csvConfig.encoding.toUpperCase()}<br/>
//                 • All data will be imported as a single table<br/>
//                 • Column types have been automatically detected and can be modified above
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const isConfigurationValid = () => {
//     return selectedSheets.length > 0 && 
//            tableConfiguration.table_name.trim() !== '' &&
//            uploadData;
//   };

//   return (
//     <Modal
//       title={
//         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//           {selectedFile && getFileIcon(selectedFile.name)}
//           <span>
//             {appendMode ? `Append Data to "${appendTargetTable}"` : "Upload File to Database"}
//           </span>
//         </div>
//       }
//       open={visible}
//       onCancel={handleCancel}
//       width={900}
//       footer={null}
//       destroyOnClose={true}
//       style={{ top: 20 }}
//     >
//       <Steps current={currentStep} style={{ marginBottom: '24px' }}>
//         <Step 
//           title="Upload File" 
//           description={selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
//             "Select CSV file & configure options" : 
//             "Select and analyze file"
//           } 
//         />
//         <Step title="Configure" description="Set processing options" />
//         <Step title="Process" description={appendMode ? "Append to table" : "Create database tables"} />
//       </Steps>

//       {currentStep === 0 && renderFileUploadStep()}
//       {currentStep === 1 && renderConfigurationStep()}

//       {/* Footer Buttons */}
//       <div style={{ 
//         borderTop: '1px solid #f0f0f0', 
//         padding: '16px 0 0 0', 
//         textAlign: 'right',
//         marginTop: '20px'
//       }}>
//         {currentStep === 1 && (
//           <>
//             <Button 
//               onClick={() => setCurrentStep(0)} 
//               style={{ marginRight: '8px' }}
//             >
//               Back
//             </Button>
//             <Button
//               type="primary"
//               onClick={processFile}
//               loading={processing}
//               disabled={!isConfigurationValid()}
//             >
//               {processing ? 
//                 (appendMode ? 'Appending...' : 'Processing...') : 
//                 (appendMode ? 'Append Data' : 
//                   (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
//                     'Import CSV' : 'Create Tables'
//                   )
//                 )
//               }
//             </Button>
//           </>
//         )}

//         {currentStep === 0 && (
//           <Button onClick={handleCancel}>
//             Cancel
//           </Button>
//         )}
//       </div>

//       {processing && (
//         <div style={{ 
//           position: 'absolute', 
//           top: 0, 
//           left: 0, 
//           right: 0, 
//           bottom: 0, 
//           backgroundColor: 'rgba(255, 255, 255, 0.8)', 
//           display: 'flex', 
//           alignItems: 'center', 
//           justifyContent: 'center',
//           flexDirection: 'column',
//           zIndex: 1000
//         }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px', fontSize: '16px' }}>
//             {appendMode ? 
//               (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ?
//                 'Processing CSV file and appending to database table...' :
//                 'Processing file and appending to database table...'
//               ) :
//               (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ?
//                 'Processing CSV file and creating database table...' :
//                 'Processing file and creating database tables...'
//               )
//             }
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// };

// // Enhanced handleFileUpload hook with append support
// const useFileUpload = (openNotification, fetchTables, updateState) => {
//   const [uploadModalVisible, setUploadModalVisible] = useState(false);
//   const [appendModalVisible, setAppendModalVisible] = useState(false);
//   const [appendTargetTable, setAppendTargetTable] = useState(null);

//   const handleFileUpload = useCallback((file) => {
//     if (file) {
//       setUploadModalVisible(true);
//       return;
//     }
    
//     setUploadModalVisible(true);
//   }, []);

//   // NEW: Handle append upload
//   const handleAppendUpload = useCallback((tableName) => {
//     if (!tableName) {
//       openNotification('warning', 'No Table Selected', 'Please select a table to append data to');
//       return;
//     }
    
//     setAppendTargetTable(tableName);
//     setAppendModalVisible(true);
//   }, [openNotification]);

//   const handleUploadSuccess = useCallback(async (createdTables) => {
//     await fetchTables();
    
//     if (createdTables.length > 0) {
//       updateState({ 
//         selectedTable: createdTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setUploadModalVisible(false);
//   }, [fetchTables, updateState]);

//   const handleAppendSuccess = useCallback(async (affectedTables) => {
//     await fetchTables();
    
//     if (affectedTables.length > 0) {
//       updateState({ 
//         selectedTable: affectedTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setAppendModalVisible(false);
//   }, [fetchTables, updateState]);

//   const FileUploadModalComponent = () => (
//     <>
//       {/* Regular Upload Modal */}
//       <FileUploadModal
//         visible={uploadModalVisible}
//         onCancel={() => setUploadModalVisible(false)}
//         onSuccess={handleUploadSuccess}
//         openNotification={openNotification}
//         existingTables={[]}
//         appendMode={false}
//       />
      
//       {/* Append Mode Modal */}
//       <FileUploadModal
//         visible={appendModalVisible}
//         onCancel={() => {
//           setAppendModalVisible(false);
//           setAppendTargetTable(null);
//         }}
//         onSuccess={handleAppendSuccess}
//         openNotification={openNotification}
//         existingTables={[]}
//         appendMode={true}
//         appendTargetTable={appendTargetTable}
//       />
//     </>
//   );

//   return {
//     handleFileUpload,
//     handleAppendUpload, // NEW: Export the append handler
//     FileUploadModalComponent
//   };
// };

// export { useFileUpload, FileUploadModal };



// FileUpload.jsx - Complete implementation with clear exports
// import React, { useState, useRef, useCallback } from 'react';
// import { Modal, Steps, Button, Input, Select, Checkbox, Progress, Alert, Spin } from 'antd';
// import { InboxOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';

// const { Step } = Steps;
// const { Option } = Select;

// // 📝 THIS IS THE MAIN MODAL COMPONENT
// const FileUploadModal = ({ 
//   visible, 
//   onCancel, 
//   onSuccess, 
//   openNotification,
//   appendMode = false,
//   appendTargetTable = null
// }) => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [uploadData, setUploadData] = useState(null);
//   const [processing, setProcessing] = useState(false);
//   const [dragOver, setDragOver] = useState(false);
//   const fileInputRef = useRef(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploading, setUploading] = useState(false);
//   const [processingType, setProcessingType] = useState('single');
//   const [selectedSheets, setSelectedSheets] = useState([]);
//   const [tableConfiguration, setTableConfiguration] = useState({
//     table_name: '',
//     has_header: true,
//     column_types: {}
//   });

//   const resetState = () => {
//     setCurrentStep(0);
//     setUploadData(null);
//     setSelectedFile(null);
//     setUploadProgress(0);
//     setUploading(false);
//     setProcessing(false);
//     setProcessingType(appendMode ? 'single' : 'single');
//     setSelectedSheets([]);
//     setTableConfiguration({
//       table_name: appendMode ? appendTargetTable || '' : '',
//       has_header: true,
//       column_types: {}
//     });
//   };

//   const handleFileSelect = useCallback((file) => {
//     if (!file) return;

//     const allowedExtensions = ['.xlsx', '.xls', '.csv'];
//     const fileName = file.name.toLowerCase();
//     const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

//     if (!allowedExtensions.includes(fileExtension)) {
//       openNotification('error', 'Invalid File Type', 'Please upload Excel (.xlsx, .xls) or CSV (.csv) files only');
//       return;
//     }

//     const maxSize = 50 * 1024 * 1024;
//     if (file.size > maxSize) {
//       openNotification('error', 'File Too Large', 'File size should be less than 50MB');
//       return;
//     }

//     setSelectedFile(file);
//   }, [openNotification]);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);
//     const files = Array.from(e.dataTransfer.files);
//     if (files.length > 0) {
//       handleFileSelect(files[0]);
//     }
//   }, [handleFileSelect]);

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(true);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOver(false);
//   }, []);

//   const uploadFile = async () => {
//     if (!selectedFile) return;

//     setUploading(true);
//     setUploadProgress(0);

//     const formData = new FormData();
//     formData.append('file', selectedFile);
    
//     try {
//       const response = await fetch('https://prowesstics.space/flask/upload', {
//         method: 'POST',
//         body: formData
//       });

//       if (!response.ok) {
//         throw new Error(`Upload failed with status: ${response.status}`);
//       }

//       const result = await response.json();
      
//       if (result.sheets) {
//         Object.keys(result.sheets).forEach(sheetName => {
//           const sheet = result.sheets[sheetName];
//           if (!sheet.selectedColumns) {
//             sheet.selectedColumns = [...sheet.columns];
//           }
//         });
//       }
      
//       setUploadData(result);
//       setTableConfiguration(prev => ({
//         ...prev,
//         table_name: appendMode ? appendTargetTable : (result.suggested_table_name || '')
//       }));
      
//       if (result.sheets && Object.keys(result.sheets).length > 0) {
//         setSelectedSheets([Object.keys(result.sheets)[0]]);
//       }
      
//       setCurrentStep(1);
//     } catch (error) {
//       openNotification('error', 'Upload Failed', error.message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const processFile = async () => {
//     if (!uploadData) return;

//     setProcessing(true);

//     try {
//       const processData = {
//         file_id: uploadData.file_id,
//         processing_type: processingType,
//         selected_sheet: processingType === 'single' ? selectedSheets[0] : undefined,
//         table_configuration: tableConfiguration,
//         sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
//           const sheet = uploadData.sheets[sheetName];
//           const selectedColumns = sheet.selectedColumns || sheet.columns || [];
          
//           if (selectedColumns.length > 0) {
//             acc[sheetName] = {
//               selected_columns: selectedColumns,
//               all_columns: sheet.columns || []
//             };
//           }
//           return acc;
//         }, {}) : {}
//       };

//       const endpoint = appendMode ? 
//         'https://prowesstics.space/flask/upload/append' : 
//         'https://prowesstics.space/flask/upload/process';

//       if (appendMode) {
//         processData.target_table = appendTargetTable;
//       }

//       const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(processData)
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Processing failed');
//       }

//       const result = await response.json();
      
//       const successMessage = appendMode ? 
//         result.message || 'Data appended successfully' :
//         `File processed successfully! Created ${result.created_tables?.length || 1} table(s)`;
      
//       openNotification('success', 'Success', successMessage);
      
//       const resultTables = appendMode ? [appendTargetTable] : (result.created_tables || []);
//       onSuccess(resultTables);
//       handleCancel();

//     } catch (error) {
//       openNotification('error', 'Processing Failed', error.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleCancel = () => {
//     resetState();
//     onCancel();
//   };

//   const getFileIcon = (fileName) => {
//     if (!fileName) return <InboxOutlined />;
//     const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
//     return ext === '.csv' ? 
//       <FileTextOutlined style={{ color: '#52c41a' }} /> : 
//       <FileExcelOutlined style={{ color: '#1890ff' }} />;
//   };

//   const renderFileUploadStep = () => (
//     <div style={{ padding: '20px' }}>
//       {appendMode && appendTargetTable && (
//         <Alert
//           message={`Append Mode: Adding data to "${appendTargetTable}"`}
//           description="Your file data will be added to the existing table."
//           type="info"
//           style={{ marginBottom: '20px' }}
//         />
//       )}

//       <div
//         style={{
//           border: dragOver ? '2px solid #1890ff' : '2px dashed #d9d9d9',
//           borderRadius: '8px',
//           padding: '60px 20px',
//           textAlign: 'center',
//           backgroundColor: dragOver ? '#f0f8ff' : '#fafafa',
//           cursor: 'pointer',
//           transition: 'all 0.3s ease'
//         }}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         {selectedFile ? getFileIcon(selectedFile.name) : <InboxOutlined />}
//         <div style={{ fontSize: '48px', marginBottom: '16px' }} />
        
//         {selectedFile ? (
//           <div>
//             <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
//               Selected: {selectedFile.name}
//             </div>
//             <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
//               Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
//             </div>
//             {uploading && (
//               <Progress percent={uploadProgress} status="active" style={{ maxWidth: '300px', margin: '0 auto' }} />
//             )}
//           </div>
//         ) : (
//           <div>
//             <div style={{ fontSize: '16px', marginBottom: '8px' }}>
//               Click or drag files to upload
//             </div>
//             <div style={{ fontSize: '14px', color: '#666' }}>
//               Supports Excel (.xlsx, .xls) and CSV (.csv) files
//             </div>
//           </div>
//         )}

//         <input
//           ref={fileInputRef}
//           type="file"
//           style={{ display: 'none' }}
//           accept=".xlsx,.xls,.csv"
//           onChange={(e) => {
//             const file = e.target.files?.[0];
//             if (file) handleFileSelect(file);
//           }}
//         />
//       </div>

//       {selectedFile && !uploading && (
//         <div style={{ textAlign: 'center', marginTop: '20px' }}>
//           <Button type="primary" onClick={uploadFile} size="large">
//             Analyze File
//           </Button>
//         </div>
//       )}
//     </div>
//   );

//   const renderConfigurationStep = () => {
//     if (!uploadData) return null;

//     const sheetsData = uploadData.sheets || {};

//     return (
//       <div style={{ padding: '20px' }}>
//         <Alert
//           message={`File: ${uploadData.filename}`}
//           description={`${uploadData.total_sheets} sheet(s) detected`}
//           type="info"
//           style={{ marginBottom: '20px' }}
//         />

//         <div style={{ marginBottom: '24px' }}>
//           <h4>Select Sheets to Process:</h4>
//           <Checkbox.Group
//             value={selectedSheets}
//             onChange={setSelectedSheets}
//             style={{ width: '100%' }}
//           >
//             {Object.entries(sheetsData).map(([sheetName, sheetInfo]) => (
//               <div key={sheetName} style={{
//                 border: '1px solid #d9d9d9',
//                 borderRadius: '4px',
//                 padding: '12px',
//                 marginBottom: '8px',
//                 backgroundColor: selectedSheets.includes(sheetName) ? '#f6ffed' : '#fafafa'
//               }}>
//                 <Checkbox value={sheetName}>
//                   <strong>{sheetName}</strong>
//                 </Checkbox>
//                 <div style={{ marginLeft: '24px', fontSize: '12px', color: '#666' }}>
//                   {sheetInfo.rows} rows, {sheetInfo.columns.length} columns
//                 </div>
//               </div>
//             ))}
//           </Checkbox.Group>
//         </div>

//         <div style={{ marginBottom: '24px' }}>
//           <h4>Table Configuration:</h4>
          
//           <div style={{ marginBottom: '16px' }}>
//             <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
//               Table Name:
//             </label>
//             <Input
//               value={tableConfiguration.table_name}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 table_name: e.target.value
//               }))}
//               placeholder={appendMode ? appendTargetTable : uploadData.suggested_table_name}
//               disabled={appendMode}
//             />
//           </div>

//           <div style={{ marginBottom: '16px' }}>
//             <Checkbox
//               checked={tableConfiguration.has_header}
//               onChange={(e) => setTableConfiguration(prev => ({
//                 ...prev,
//                 has_header: e.target.checked
//               }))}
//             >
//               First row contains column headers
//             </Checkbox>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const isConfigurationValid = () => {
//     return selectedSheets.length > 0 && 
//            tableConfiguration.table_name.trim() !== '' &&
//            uploadData;
//   };

//   return (
//     <Modal
//       title={appendMode ? `Append Data to "${appendTargetTable}"` : "Upload File to Database"}
//       open={visible}
//       onCancel={handleCancel}
//       width={900}
//       footer={null}
//       destroyOnClose={true}
//       style={{ top: 20 }}
//     >
//       <Steps current={currentStep} style={{ marginBottom: '24px' }}>
//         <Step title="Upload File" description="Select and analyze file" />
//         <Step title="Configure" description="Set processing options" />
//         <Step title="Process" description={appendMode ? "Append to table" : "Create database tables"} />
//       </Steps>

//       {currentStep === 0 && renderFileUploadStep()}
//       {currentStep === 1 && renderConfigurationStep()}

//       <div style={{ 
//         borderTop: '1px solid #f0f0f0', 
//         padding: '16px 0 0 0', 
//         textAlign: 'right',
//         marginTop: '20px'
//       }}>
//         {currentStep === 1 && (
//           <>
//             <Button onClick={() => setCurrentStep(0)} style={{ marginRight: '8px' }}>
//               Back
//             </Button>
//             <Button
//               type="primary"
//               onClick={processFile}
//               loading={processing}
//               disabled={!isConfigurationValid()}
//             >
//               {processing ? 
//                 (appendMode ? 'Appending...' : 'Processing...') : 
//                 (appendMode ? 'Append Data' : 'Create Tables')
//               }
//             </Button>
//           </>
//         )}

//         {currentStep === 0 && (
//           <Button onClick={handleCancel}>Cancel</Button>
//         )}
//       </div>

//       {processing && (
//         <div style={{ 
//           position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
//           backgroundColor: 'rgba(255, 255, 255, 0.8)', 
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           flexDirection: 'column', zIndex: 1000
//         }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px', fontSize: '16px' }}>
//             {appendMode ? 'Appending data...' : 'Processing file...'}
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// };

// // 🎣 THIS IS THE HOOK THAT MANAGES THE MODAL STATE
// const useFileUpload = (openNotification, fetchTables, updateState) => {
//   const [uploadModalVisible, setUploadModalVisible] = useState(false);
//   const [appendModalVisible, setAppendModalVisible] = useState(false);
//   const [appendTargetTable, setAppendTargetTable] = useState(null);

//   const handleFileUpload = useCallback((file) => {
//     if (file) {
//       setUploadModalVisible(true);
//       return;
//     }
    
//     setUploadModalVisible(true);
//   }, []);

//   const handleAppendUpload = useCallback((tableName) => {
//     if (!tableName) {
//       openNotification('warning', 'No Table Selected', 'Please select a table to append data to');
//       return;
//     }
    
//     setAppendTargetTable(tableName);
//     setAppendModalVisible(true);
//   }, [openNotification]);

//   const handleUploadSuccess = useCallback(async (createdTables) => {
//     if (typeof fetchTables === 'function') {
//       await fetchTables();
//     }
    
//     if (createdTables.length > 0 && typeof updateState === 'function') {
//       updateState({ 
//         selectedTable: createdTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setUploadModalVisible(false);
//   }, [fetchTables, updateState]);

//   const handleAppendSuccess = useCallback(async (affectedTables) => {
//     if (typeof fetchTables === 'function') {
//       await fetchTables();
//     }
    
//     if (affectedTables.length > 0 && typeof updateState === 'function') {
//       updateState({ 
//         selectedTable: affectedTables[0],
//         lastFetchedTable: ""
//       });
//     }
    
//     setAppendModalVisible(false);
//   }, [fetchTables, updateState]);

//   // 🎭 THIS COMPONENT RENDERS THE MODALS
//   const FileUploadModalComponent = () => (
//     <>
//       {/* Regular Upload Modal */}
//       <FileUploadModal
//         visible={uploadModalVisible}
//         onCancel={() => setUploadModalVisible(false)}
//         onSuccess={handleUploadSuccess}
//         openNotification={openNotification}
//         appendMode={false}
//       />
      
//       {/* Append Mode Modal */}
//       <FileUploadModal
//         visible={appendModalVisible}
//         onCancel={() => {
//           setAppendModalVisible(false);
//           setAppendTargetTable(null);
//         }}
//         onSuccess={handleAppendSuccess}
//         openNotification={openNotification}
//         appendMode={true}
//         appendTargetTable={appendTargetTable}
//       />
//     </>
//   );

//   return {
//     handleFileUpload,
//     handleAppendUpload,
//     FileUploadModalComponent // 👈 THIS IS WHAT YOU IMPORT
//   };
// };

// // 📤 THESE ARE THE EXPORTS
// export { useFileUpload, FileUploadModal };


// FileUpload.jsx - Complete implementation with all features and visual differentiation
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Steps, Button, Input, Select, Table, Checkbox, Radio, Progress, Alert, Spin } from 'antd';
import { InboxOutlined, FileExcelOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, FileAddOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

// Enhanced File Upload Modal Component with Append Mode and Full CSV Support
const FileUploadModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  openNotification,
  existingTables = [],
  // Append mode props
  appendMode = false,
  appendTargetTable = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadData, setUploadData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Step 1: File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Step 2: Configuration State
  const [processingType, setProcessingType] = useState('single');
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [tableConfiguration, setTableConfiguration] = useState({
    table_name: '',
    has_header: true,
    column_types: {}
  });

  // CSV specific configuration
  const [csvConfig, setCsvConfig] = useState({
    delimiter: 'auto', // auto, comma, semicolon, tab, pipe
    encoding: 'utf-8',
    quote_char: '"',
    escape_char: '"'
  });

  useEffect(() => {
    const handleResize = () => {
      // Force a re-render when window is resized or sidebar changes
      // This ensures the modal position updates correctly
      if (visible) {
        // You can add any state update here to trigger re-render if needed
        console.log('🔄 Window resized, recalculating modal position');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visible]);

  const getModalDimensions = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 🔍 CHECK IF SIDEBAR IS OPEN
    // Look for the sidebar element or check the drawer state
    const sidebarElement = document.querySelector('.MuiDrawer-paper');
    const isSidebarOpen = sidebarElement && sidebarElement.offsetWidth > 60; // 60px is collapsed width
    
    // Calculate sidebar width - use actual width if available
    const sidebarWidth = isSidebarOpen ? (sidebarElement?.offsetWidth || 280) : 60;
    
    console.log('🔍 Sidebar check:', { isSidebarOpen, sidebarWidth, viewportWidth });
    
    // Calculate available space after sidebar
    const availableWidth = viewportWidth - sidebarWidth - 60; // 60px total margins
    
    // Calculate modal width based on available space
    let modalWidth;
    if (availableWidth >= 900) {
      modalWidth = 850; // Slightly smaller for better spacing
    } else if (availableWidth >= 700) {
      modalWidth = Math.min(availableWidth * 0.85, 800);
    } else {
      modalWidth = Math.min(availableWidth * 0.8, 600);
    }
    
    // 🎯 POSITION LOGIC: More right when sidebar is open
    let leftPosition;
    if (isSidebarOpen) {
      // When sidebar is open, move modal significantly to the right
      leftPosition = sidebarWidth + 40; // 40px margin from sidebar
    } else {
      // When sidebar is closed, center the modal or position it normally
      leftPosition = Math.max(80, (viewportWidth - modalWidth) / 2);
    }
    
    return {
      width: modalWidth,
      maxWidth: `${Math.min(availableWidth, modalWidth)}px`,
      left: leftPosition,
      top: 40, // Fixed top position
      maxHeight: viewportHeight * 0.9,
      transform: 'none', // Disable default centering
      isSidebarOpen // Include this for debugging
    };
  }, []);

  // 🔧 Column selection with proper state management
  const toggleColumnInSheet = useCallback((sheetName, columnToToggle) => {
    if (!uploadData || !uploadData.sheets) return;
    
    setUploadData(prev => {
      const updatedSheets = { ...prev.sheets };
      const sheetData = { ...updatedSheets[sheetName] };
      
      // Initialize selectedColumns if it doesn't exist
      if (!sheetData.selectedColumns) {
        sheetData.selectedColumns = [...sheetData.columns];
      }
      
      // Toggle column selection
      const isCurrentlySelected = sheetData.selectedColumns.includes(columnToToggle);
      
      if (isCurrentlySelected) {
        // Prevent deselecting all columns
        if (sheetData.selectedColumns.length <= 1) {
          openNotification('warning', 'Column Required', 'At least one column must be selected');
          return prev; // Don't update state
        }
        sheetData.selectedColumns = sheetData.selectedColumns.filter(col => col !== columnToToggle);
      } else {
        sheetData.selectedColumns = [...sheetData.selectedColumns, columnToToggle];
      }
      
      updatedSheets[sheetName] = sheetData;
      
      return {
        ...prev,
        sheets: updatedSheets
      };
    });
  }, [uploadData, openNotification]);

  const resetState = () => {
    setCurrentStep(0);
    setUploadData(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploading(false);
    setProcessing(false);
    // Reset processing type based on mode
    setProcessingType(appendMode ? 'single' : 'single');
    setSelectedSheets([]);
    setTableConfiguration({
      table_name: appendMode ? appendTargetTable || '' : '',
      has_header: true,
      column_types: {}
    });
    // Reset CSV config
    setCsvConfig({
      delimiter: 'auto',
      encoding: 'utf-8',
      quote_char: '"',
      escape_char: '"'
    });
  };

  // Enhanced file validation with better CSV support
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Enhanced file type validation
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/plain' // Sometimes CSV files are detected as plain text
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    // Check file extension first (more reliable than MIME type for CSV)
    const hasValidExtension = allowedExtensions.includes(fileExtension);
    const hasValidMimeType = allowedTypes.includes(file.type);

    // For CSV files, be more lenient with MIME type checking
    const isCsvFile = fileExtension === '.csv';
    const isValidFile = hasValidExtension && (hasValidMimeType || isCsvFile);

    if (!isValidFile) {
      setTimeout(() => {
        openNotification('error', 'Invalid File Type', 
          `Please upload Excel (.xlsx, .xls) or CSV (.csv) files only. 
           Detected: ${file.type} with extension ${fileExtension}`);
      }, 0);
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setTimeout(() => {
        openNotification('error', 'File Too Large', 'File size should be less than 50MB');
      }, 0);
      return;
    }

    console.log('✅ File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      extension: fileExtension
    });

    setSelectedFile(file);
  }, [openNotification]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Add CSV configuration if it's a CSV file
    const isCsvFile = selectedFile.name.toLowerCase().endsWith('.csv');
    if (isCsvFile) {
      formData.append('csv_config', JSON.stringify(csvConfig));
    }

    try {
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              
              console.log('📊 Upload result:', result);
              
              // 🔧 Initialize selectedColumns for all sheets
              if (result.sheets) {
                Object.keys(result.sheets).forEach(sheetName => {
                  const sheet = result.sheets[sheetName];
                  if (!sheet.selectedColumns) {
                    sheet.selectedColumns = [...sheet.columns]; // All columns selected by default
                  }
                });
              }
              
              setUploadData(result);
              
              // Set table name based on mode
              setTableConfiguration(prev => ({
                ...prev,
                table_name: appendMode ? appendTargetTable : (result.suggested_table_name || '')
              }));
              
              // Auto-select first sheet
              if (result.sheets && Object.keys(result.sheets).length > 0) {
                setSelectedSheets([Object.keys(result.sheets)[0]]);
              }
              
              setCurrentStep(1);
              resolve(result);
            } catch (parseError) {
              console.error('❌ Parse error:', parseError);
              const error = new Error('Invalid response format from server');
              openNotification('error', 'Processing Failed', error.message);
              reject(error);
            }
          } else {
            const errorText = xhr.responseText;
            let errorMessage = `Upload failed (${xhr.status})`;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = errorText || errorMessage;
            }
            console.error('❌ Upload error:', { status: xhr.status, errorText });
            const error = new Error(errorMessage);
            openNotification('error', 'Upload Failed', error.message);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          console.error('❌ Network error during upload');
          const error = new Error('Network error during upload');
          openNotification('error', 'Network Error', error.message);
          reject(error);
        });

        xhr.open('POST', 'https://prowesstics.space/flask/upload');
        xhr.send(formData);
      });

    } catch (error) {
      console.error('❌ Upload exception:', error);
      openNotification('error', 'Upload Failed', `Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const processFile = async () => {
    if (!uploadData) return;

    setProcessing(true);

    try {
      // Check if this is append mode
      if (appendMode && appendTargetTable) {
        // Use append endpoint
        const appendData = {
          file_id: uploadData.file_id,
          target_table: appendTargetTable,
          selected_sheet: selectedSheets[0],
          csv_config: selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? csvConfig : undefined,
          // Include selected columns data
          sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
            const sheet = uploadData.sheets[sheetName];
            const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
              ? sheet.selectedColumns 
              : sheet.columns || [];
            
            if (selectedColumns.length > 0) {
              acc[sheetName] = {
                selected_columns: selectedColumns,
                all_columns: sheet.columns || []
              };
            }
            return acc;
          }, {}) : {}
        };

        console.log('🔍 Sending append data:', JSON.stringify(appendData, null, 2));

        const response = await fetch('https://prowesstics.space/flask/upload/append', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appendData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Append failed');
        }

        const result = await response.json();
        
        openNotification('success', 'Data Appended', result.message);
        onSuccess([appendTargetTable]); // Return the table that was appended to
        handleCancel();
        return;
      }

      // Regular processing (non-append mode)
      const processData = {
        file_id: uploadData.file_id,
        processing_type: processingType,
        selected_sheet: processingType === 'single' ? selectedSheets[0] : undefined,
        selected_sheets: processingType !== 'single' ? selectedSheets : undefined,
        csv_config: selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? csvConfig : undefined,
        table_configuration: {
          ...tableConfiguration,
          base_table_name: processingType === 'multiple' ? tableConfiguration.table_name : undefined
        },
        sheet_column_selections: uploadData.sheets ? Object.keys(uploadData.sheets).reduce((acc, sheetName) => {
          const sheet = uploadData.sheets[sheetName];
          const selectedColumns = sheet.selectedColumns && Array.isArray(sheet.selectedColumns) 
            ? sheet.selectedColumns 
            : sheet.columns || [];
          
          if (selectedColumns.length > 0) {
            acc[sheetName] = {
              selected_columns: selectedColumns,
              all_columns: sheet.columns || []
            };
          }
          return acc;
        }, {}) : {}
      };

      console.log('🔍 Sending process data:', JSON.stringify(processData, null, 2));

      // Validate that we have selected columns
      const hasSelectedColumns = Object.keys(processData.sheet_column_selections).length > 0;
      if (!hasSelectedColumns) {
        throw new Error('No columns selected for processing. Please select at least one column.');
      }

      const response = await fetch('https://prowesstics.space/flask/upload/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await response.json();
      
      openNotification('success', 'Success', 
        `File processed successfully! Created ${result.created_tables.length} table(s): ${result.created_tables.join(', ')}`);
      
      onSuccess(result.created_tables);
      handleCancel();

    } catch (error) {
      console.error('❌ Processing error:', error);
      openNotification('error', 'Processing Failed', `Error processing file: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  // Get appropriate file icon with different colors for modes
  const getFileIcon = (fileName) => {
    if (!fileName) return <InboxOutlined />;
    
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const iconColor = appendMode ? '#fa8c16' : (ext === '.csv' ? '#52c41a' : '#1890ff');
    
    if (ext === '.csv') {
      return <FileTextOutlined style={{ color: iconColor }} />;
    } else {
      return <FileExcelOutlined style={{ color: iconColor }} />;
    }
  };

  const renderFileUploadStep = () => (
    // <div style={{ padding: '20px' }}>
    <div style={{ padding: '20px 0' }}>
      {/* 🎯 DIFFERENT ALERTS FOR DIFFERENT MODES */}
      {appendMode && appendTargetTable ? (
        <Alert
          message={`Append Mode: Adding data to "${appendTargetTable}"`}
          description="Your file data will be added to the existing table. Make sure your file has compatible columns."
          type="warning"
          icon={<FileAddOutlined />}
          style={{ marginBottom: '20px' }}
          showIcon
        />
      ) : (
        <Alert
          message="New File Upload"
          description="Upload Excel or CSV files to create new database tables."
          type="info"
          style={{ marginBottom: '12px' }}
          showIcon
        />
      )}

      <div
        style={{
          border: dragOver ? 
            (appendMode ? '2px solid #fa8c16' : '2px solid #1890ff') : 
            '2px dashed #d9d9d9',
          borderRadius: '8px',
          // padding: '60px 20px',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: dragOver ? 
            (appendMode ? '#fff7e6' : '#f0f8ff') : 
            '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: '200px',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? (
          getFileIcon(selectedFile.name)
        ) : (
          <InboxOutlined style={{ color: appendMode ? '#fa8c16' : '#1890ff' }} />
        )}
        <div style={{ fontSize: '48px', marginBottom: '16px' , fontFamily : "var(--app-font-family)",}} />
        
        {selectedFile ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' , fontFamily : "var(--app-font-family)",}}>
              Selected: {selectedFile.name}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' , fontFamily : "var(--app-font-family)",}}>
              Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' , fontFamily : "var(--app-font-family)",}}>
              Type: {selectedFile.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel'} file
            </div>
            {uploading && (
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <Progress percent={uploadProgress} status="active" />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '16px', marginBottom: '8px', color: appendMode ? '#fa8c16' : '#1890ff' }}>
              {appendMode ? 
                `Select file to append to "${appendTargetTable}"` :
                'Click or drag files to this area to upload'
              }
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' , fontFamily : "var(--app-font-family)", }}>
              <strong>Supports:</strong> Excel (.xlsx, .xls) and CSV (.csv) files
            </div>
            <div style={{ fontSize: '12px', color: '#999' , fontFamily : "var(--app-font-family)",}}>
              Maximum file size: 50MB
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* CSV Configuration Panel */}
      {selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') && (
        <div style={{ 
          marginTop: '20px',
          border: `1px solid ${appendMode ? '#ffec99' : '#d9d9d9'}`,
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: appendMode ? '#fff7e6' : '#fafafa'
        }}>
          <h4 style={{ marginBottom: '16px', color: appendMode ? '#fa8c16' : '#1890ff' }}>
            <FileTextOutlined style={{ marginRight: '8px' }} />
            CSV Configuration Options
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' , fontFamily : "var(--app-font-family)",}}>
                Delimiter:
              </label>
              <Select
                value={csvConfig.delimiter}
                onChange={(value) => setCsvConfig(prev => ({ ...prev, delimiter: value }))}
                style={{ width: '100%' }}
              >
                <Option value="auto">Auto-detect</Option>
                <Option value="comma">Comma (,)</Option>
                <Option value="semicolon">Semicolon (;)</Option>
                <Option value="tab">Tab</Option>
                <Option value="pipe">Pipe (|)</Option>
              </Select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' , fontFamily : "var(--app-font-family)",}}>
                Encoding:
              </label>
              <Select
                value={csvConfig.encoding}
                onChange={(value) => setCsvConfig(prev => ({ ...prev, encoding: value }))}
                style={{ width: '100%' }}
              >
                <Option value="utf-8">UTF-8</Option>
                <Option value="iso-8859-1">ISO-8859-1</Option>
                <Option value="windows-1252">Windows-1252</Option>
                <Option value="ascii">ASCII</Option>
              </Select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' , fontFamily : "var(--app-font-family)",}}>
                Quote Character:
              </label>
              <Select
                value={csvConfig.quote_char}
                onChange={(value) => setCsvConfig(prev => ({ ...prev, quote_char: value }))}
                style={{ width: '100%' }}
              >
                <Option value='"'>Double Quote (")</Option>
                <Option value="'">Single Quote (')</Option>
                <Option value="">None</Option>
              </Select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' , fontFamily : "var(--app-font-family)", }}>
                Escape Character:
              </label>
              <Select
                value={csvConfig.escape_char}
                onChange={(value) => setCsvConfig(prev => ({ ...prev, escape_char: value }))}
                style={{ width: '100%' }}
              >
                <Option value='"'>Double Quote (")</Option>
                <Option value="'">Single Quote (')</Option>
                <Option value="\">\</Option>
                <Option value="">None</Option>
              </Select>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '12px' , fontFamily : "var(--app-font-family)", }}>
            <strong>Tip:</strong> Use "Auto-detect" for delimiter if you're unsure. The system will analyze your CSV file and choose the best settings.
          </div>
        </div>
      )}

      {selectedFile && !uploading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Button 
            type="primary" 
            onClick={uploadFile} 
            size="large"
            style={{
              backgroundColor: appendMode ? '#fa8c16' : '#1890ff',
              borderColor: appendMode ? '#fa8c16' : '#1890ff'
            }}
          >
            {appendMode ? 
              (selectedFile.name.toLowerCase().endsWith('.csv') ? 'Analyze CSV for Appending' : 'Analyze File for Appending') :
              (selectedFile.name.toLowerCase().endsWith('.csv') ? 'Analyze CSV File' : 'Analyze File')
            }
          </Button>
        </div>
      )}
    </div>
  );

  const renderConfigurationStep = () => {
    if (!uploadData) return null;

    const sheetsData = uploadData.sheets || {};
    const isCsvFile = selectedFile && selectedFile.name.toLowerCase().endsWith('.csv');

    return (
      <div style={{ 
        // padding: '20px',
        padding: '0',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* File Information */}
        <Alert
          message={`File: ${uploadData.filename}`}
          description={
            <>
              {uploadData.total_sheets} sheet(s) detected. File type: {uploadData.file_type.toUpperCase()}
              {isCsvFile && (
                <div style={{ marginTop: '4px', fontSize: '12px' , fontFamily : "var(--app-font-family)", }}>
                  <strong>CSV Settings:</strong> Delimiter: {csvConfig.delimiter}, Encoding: {csvConfig.encoding}
                </div>
              )}
            </>
          }
          type="info"
          style={{ marginBottom: '20px' }}
          icon={getFileIcon(uploadData.filename)}
        />

        {/* Show append mode restrictions */}
        {appendMode && (
          <Alert
            message="Append Mode Configuration"
            description={`Data will be appended to table "${appendTargetTable}". Only single sheet processing is available in append mode.`}
            type="warning"
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* Processing Type Selection - Hidden in append mode */}
        {!appendMode && (
          <div style={{ marginBottom: '24px' }}>
            <h4>Processing Options:</h4>
            <Radio.Group 
              value={processingType} 
              onChange={(e) => {
                setProcessingType(e.target.value);
                // Reset sheet selection when changing processing type
                if (e.target.value === 'single') {
                  setSelectedSheets([Object.keys(sheetsData)[0] || '']);
                } else {
                  setSelectedSheets(Object.keys(sheetsData));
                }
              }}
            >
              <Radio value="single" disabled={uploadData.total_sheets === 0}>
                Process Single Sheet {isCsvFile && '(CSV as single table)'}
              </Radio>
              <Radio value="multiple" disabled={uploadData.total_sheets <= 1 || isCsvFile}>
                Create Multiple Tables (One per Sheet) {isCsvFile && '(Not available for CSV)'}
              </Radio>
              <Radio 
                value="combine" 
                disabled={!uploadData.can_combine_sheets || uploadData.total_sheets <= 1 || isCsvFile}
              >
                Combine All Sheets into One Table {isCsvFile && '(Not available for CSV)'}
              </Radio>
            </Radio.Group>

            {!uploadData.can_combine_sheets && uploadData.compatibility_issues && uploadData.compatibility_issues.length > 0 && (
              <Alert
                type="warning"
                message="Sheets cannot be combined"
                description={
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {uploadData.compatibility_issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                }
                style={{ marginTop: '12px' }}
              />
            )}
          </div>
        )}

        {/* Sheet Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h4>Select {isCsvFile ? 'Data' : 'Sheets'} to Process:</h4>
          <div style={{                              // ✅ ADDED: Scrollable container for sheets
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}></div>
          <Checkbox.Group
            value={selectedSheets}
            onChange={setSelectedSheets}
            style={{ width: '100%' }}
          >
            {Object.entries(sheetsData).map(([sheetName, sheetInfo]) => (
              <div key={sheetName} style={{
                border: `1px solid ${appendMode ? '#ffec99' : '#d9d9d9'}`,
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: selectedSheets.includes(sheetName) ? 
                  (appendMode ? '#fff7e6' : '#f6ffed') : 
                  '#fafafa',
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}>
                <Checkbox 
                  value={sheetName}
                  disabled={(processingType === 'single' || appendMode) && selectedSheets.length === 1 && selectedSheets[0] !== sheetName}
                >
                  <strong>{isCsvFile ? `${sheetName} (CSV Data)` : sheetName}</strong>
                </Checkbox>
                <div style={{ marginLeft: '24px', fontSize: '12px', color: '#666' , fontFamily : "var(--app-font-family)", }}>
                  {sheetInfo.rows} rows, {sheetInfo.columns.length} columns
                  {isCsvFile && (
                    <span style={{ marginLeft: '8px', color: appendMode ? '#fa8c16' : '#1890ff' }}>
                      • CSV format detected and parsed
                    </span>
                  )}
                </div>
                
                {/* Column selection with proper scrolling */}
                <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', fontFamily : "var(--app-font-family)",}}>
                      View Columns & Preview ({sheetInfo.selectedColumns?.length || sheetInfo.columns.length} of {sheetInfo.columns.length} columns selected)
                    </summary>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong>Columns (click to toggle):</strong>
                          <div>
                            <Button 
                              size="small" 
                              type="link"
                              onClick={() => {
                                // Select all columns
                                setUploadData(prev => ({
                                  ...prev,
                                  sheets: {
                                    ...prev.sheets,
                                    [sheetName]: {
                                      ...prev.sheets[sheetName],
                                      selectedColumns: [...prev.sheets[sheetName].columns]
                                    }
                                  }
                                }));
                              }}
                            >
                              Select All
                            </Button>
                            <Button 
                              size="small" 
                              type="link"
                              onClick={() => {
                                // Deselect all but first column
                                setUploadData(prev => ({
                                  ...prev,
                                  sheets: {
                                    ...prev.sheets,
                                    [sheetName]: {
                                      ...prev.sheets[sheetName],
                                      selectedColumns: [prev.sheets[sheetName].columns[0]]
                                    }
                                  }
                                }));
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        
                        {/* Scrollable column selection area */}
                        <div style={{ 
                          maxHeight: '120px', 
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          border: '1px solid #e8e8e8',
                          borderRadius: '4px',
                          padding: '8px',
                          backgroundColor: '#fafafa'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '4px'
                          }}>
                            {sheetInfo.columns.map(col => {
                              const isSelected = sheetInfo.selectedColumns ? 
                                sheetInfo.selectedColumns.includes(col) : 
                                true;
                              
                              return (
                                <span 
                                  key={col}
                                  style={{
                                    backgroundColor: isSelected ? 
                                      (appendMode ? '#fff2e8' : '#e3f2fd') : 
                                      '#f5f5f5',
                                    color: isSelected ? 
                                      (appendMode ? '#d46b08' : '#1565c0') : 
                                      '#999',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontFamily : "var(--app-font-family)",
                                    cursor: 'pointer',
                                    border: isSelected ? 
                                      (appendMode ? '1px solid #d46b08' : '1px solid #1565c0') : 
                                      '1px solid #ddd',
                                    transition: 'all 0.2s ease',
                                    userSelect: 'none',
                                    maxWidth: '140px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    flex: '0 0 auto'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleColumnInSheet(sheetName, col);
                                  }}
                                  title={isSelected ? `Click to deselect ${col}` : `Click to select ${col}`}
                                >
                                  {isSelected ? '✓ ' : ''}{col}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' , fontFamily : "var(--app-font-family)", }}>
                          {sheetInfo.selectedColumns ? 
                            `${sheetInfo.selectedColumns.length} of ${sheetInfo.columns.length} columns selected` :
                            `${sheetInfo.columns.length} columns selected`
                          }
                          {sheetInfo.columns.length > 10 && ' • Scroll up/down to see all columns'}
                        </div>
                      </div>
                      
                      {/* Preview table */}
                      {sheetInfo.preview && sheetInfo.preview.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <strong>Preview (first 3 rows, selected columns only):</strong>
                          <div style={{ 
                            width: '100%',
                            maxWidth: '100%',
                            height: '180px',
                            overflow: 'auto',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            marginTop: '4px',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}>
                            <div style={{ 
                              width: 'max-content',
                              minWidth: '100%'
                            }}>
                              <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '10px',
                                fontFamily : "var(--app-font-family)",
                                tableLayout: 'fixed'
                              }}>
                                <thead style={{ 
                                  position: 'sticky', 
                                  top: 0, 
                                  backgroundColor: appendMode ? '#fa8c16' : '#1890ff', 
                                  zIndex: 1 
                                }}>
                                  <tr>
                                    {(sheetInfo.selectedColumns || sheetInfo.columns).map((col, index) => (
                                      <th
                                        key={`header-${col}`}
                                        style={{
                                          backgroundColor: appendMode ? '#fa8c16' : '#1890ff',
                                          color: 'white',
                                          padding: '6px 8px',
                                          fontWeight: 'bold',
                                          fontFamily : "var(--app-font-family)",
                                          textAlign: 'left',
                                          borderRight: '1px solid #fff',
                                          fontSize: '9px',
                                          width: '100px',
                                          minWidth: '80px',
                                          maxWidth: '120px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          boxSizing: 'border-box'
                                        }}
                                        title={col}
                                      >
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                
                                <tbody>
                                  {sheetInfo.preview.slice(0, 3).map((row, rowIdx) => (
                                    <tr 
                                      key={rowIdx}
                                      style={{
                                        backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9f9f9'
                                      }}
                                    >
                                      {(sheetInfo.selectedColumns || sheetInfo.columns).map(col => (
                                        <td
                                          key={`${rowIdx}-${col}`}
                                          style={{
                                            padding: '4px 8px',
                                            borderRight: '1px solid #e0e0e0',
                                            borderBottom: '1px solid #e0e0e0',
                                            fontFamily : "var(--app-font-family)",
                                            fontSize: '9px',
                                            width: '100px',
                                            minWidth: '80px',
                                            maxWidth: '120px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: '#333',
                                            boxSizing: 'border-box'
                                          }}
                                          title={row[col] || '-'}
                                        >
                                          {row[col] || '-'}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', textAlign: 'center' , fontFamily : "var(--app-font-family)", }}>
                            ← → Scroll horizontally to view all columns • ↑ ↓ Scroll vertically for more rows
                            {isCsvFile && ' • CSV data parsed successfully'}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </Checkbox.Group>
        </div>

        {/* Table Configuration */}
        <div style={{ marginBottom: '24px' }}>
          <h4>Table Configuration:</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' , fontFamily : "var(--app-font-family)",}}>
              {appendMode ? 'Target Table:' : 'Table Name:'}
            </label>
            <Input
              value={tableConfiguration.table_name}
              onChange={(e) => setTableConfiguration(prev => ({
                ...prev,
                table_name: e.target.value
              }))}
              placeholder={appendMode ? appendTargetTable : uploadData.suggested_table_name}
              disabled={appendMode} // Disable in append mode
              style={appendMode ? { 
                backgroundColor: '#fff7e6', 
                borderColor: '#ffec99' 
              } : {}}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' , fontFamily : "var(--app-font-family)", }}>
              {appendMode ? 
                'Target table for appending data (cannot be changed)' :
                (processingType === 'multiple' ? 
                  'Base name for tables (sheet names will be appended)' : 
                  'Name for the database table'
                )
              }
              {isCsvFile && !appendMode && ' • CSV file will create a single table'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Checkbox
              checked={tableConfiguration.has_header}
              onChange={(e) => setTableConfiguration(prev => ({
                ...prev,
                has_header: e.target.checked
              }))}
            >
              First row contains column headers
            </Checkbox>
            {isCsvFile && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' , fontFamily : "var(--app-font-family)", }}>
                For CSV files, headers are usually automatically detected
              </div>
            )}
          </div>

          {/* Column Type Configuration - Show only in non-append mode or for information */}
          {selectedSheets.length > 0 && sheetsData[selectedSheets[0]] && !appendMode && (
            <div>
              <h5>Column Data Types (Selected Columns Only):</h5>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' , fontFamily : "var(--app-font-family)", }}>
                Configure data types for the columns you've selected to include in the table
                {isCsvFile && ' • CSV columns are auto-detected but you can override them here'}
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                overflowX: 'hidden',
                border: '1px solid #d9d9d9', 
                borderRadius: '4px', 
                padding: '8px',
                backgroundColor: '#fafafa'
              }}>
                {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).map(column => (
                  <div key={column} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontFamily : "var(--app-font-family)",
                    gap: '8px'
                  }}>
                    <div style={{ 
                      width: '140px', 
                      fontWeight: 'bold', 
                      fontFamily : "var(--app-font-family)",
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: '0 0 140px'
                    }} title={column}>
                      {column}:
                    </div>
                    <Select
                      size="small"
                      style={{ width: '110px', flex: '0 0 110px' }}
                      value={tableConfiguration.column_types[column] || sheetsData[selectedSheets[0]].column_types[column] || 'TEXT'}
                      onChange={(value) => setTableConfiguration(prev => ({
                        ...prev,
                        column_types: {
                          ...prev.column_types,
                          [column]: value
                        }
                      }))}
                    >
                      <Option value="TEXT">TEXT</Option>
                      <Option value="INTEGER">INTEGER</Option>
                      <Option value="DECIMAL">DECIMAL</Option>
                      <Option value="BOOLEAN">BOOLEAN</Option>
                      <Option value="TIMESTAMP">TIMESTAMP</Option>
                      <Option value="DATE">DATE</Option>
                    </Select>
                    <div style={{ color: '#666', fontSize: '11px', flex: '1' , fontFamily : "var(--app-font-family)",}}>
                      (detected: {sheetsData[selectedSheets[0]].column_types[column]})
                      {isCsvFile && <span style={{ color: appendMode ? '#fa8c16' : '#1890ff' }}> • CSV</span>}
                    </div>
                  </div>
                ))}
              </div>
              {(sheetsData[selectedSheets[0]].selectedColumns || sheetsData[selectedSheets[0]].columns).length > 5 && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' , fontFamily : "var(--app-font-family)", }}>
                  Scroll up/down to see all column types
                </div>
              )}
            </div>
          )}

          {/* CSV specific information panel */}
          {isCsvFile && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: appendMode ? '#fff7e6' : '#f0f9ff',
              border: appendMode ? '1px solid #ffec99' : '1px solid #bae6fd',
              borderRadius: '6px'
            }}>
              <h6 style={{ margin: '0 0 8px 0', color: appendMode ? '#d46b08' : '#0369a1' }}>
                <FileTextOutlined style={{ marginRight: '6px' }} />
                CSV File Information
              </h6>
              <div style={{ fontSize: '12px', color: appendMode ? '#d46b08' : '#0369a1' , fontFamily : "var(--app-font-family)", }}>
                • File format: CSV (Comma Separated Values)<br/>
                • Delimiter used: {csvConfig.delimiter === 'auto' ? 'Auto-detected' : csvConfig.delimiter}<br/>
                • Character encoding: {csvConfig.encoding.toUpperCase()}<br/>
                • All data will be imported as a single table<br/>
                • Column types have been automatically detected and can be modified above
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isConfigurationValid = () => {
    return selectedSheets.length > 0 && 
           tableConfiguration.table_name.trim() !== '' &&
           uploadData;
  };

  // return (
  //   <Modal
  //     title={
  //       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  //         {appendMode ? 
  //           <FileAddOutlined style={{ color: '#fa8c16' }} /> : 
  //           (selectedFile && getFileIcon(selectedFile.name)) || <InboxOutlined style={{ color: '#1890ff' }} />
  //         }
  //         <span style={{ color: appendMode ? '#fa8c16' : '#1890ff' }}>
  //           {appendMode ? `Append Data to "${appendTargetTable}"` : "Upload File to Database"}
  //         </span>
  //       </div>
  //     }
  //     open={visible}
  //     onCancel={handleCancel}
  //     width={900}
  //     footer={null}
  //     destroyOnClose={true}
  //     style={{ top: 20 }}
  //   >
  //     <Steps current={currentStep} style={{ marginBottom: '24px' }}>
  //       <Step 
  //         title={appendMode ? "Select File" : "Upload File"} 
  //         description={appendMode ? 
  //           "Choose file to append" : 
  //           (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
  //             "Select CSV file & configure options" : 
  //             "Select and analyze file"
  //           )
  //         } 
  //       />
  //       <Step title="Configure" description="Set processing options" />
  //       <Step 
  //         title={appendMode ? "Append" : "Process"} 
  //         description={appendMode ? "Append to existing table" : "Create database tables"} 
  //       />
  //     </Steps>

  //     {currentStep === 0 && renderFileUploadStep()}
  //     {currentStep === 1 && renderConfigurationStep()}

  //     {/* Footer Buttons */}
  //     <div style={{ 
  //       borderTop: '1px solid #f0f0f0', 
  //       padding: '16px 0 0 0', 
  //       textAlign: 'right',
  //       marginTop: '20px'
  //     }}>
  //       {currentStep === 1 && (
  //         <>
  //           <Button 
  //             onClick={() => setCurrentStep(0)} 
  //             style={{ marginRight: '8px' }}
  //           >
  //             Back
  //           </Button>
  //           <Button
  //             type="primary"
  //             onClick={processFile}
  //             loading={processing}
  //             disabled={!isConfigurationValid()}
  //             style={{
  //               backgroundColor: appendMode ? '#fa8c16' : '#1890ff',
  //               borderColor: appendMode ? '#fa8c16' : '#1890ff'
  //             }}
  //           >
  //             {processing ? 
  //               (appendMode ? 'Appending...' : 'Processing...') : 
  //               (appendMode ? 'Append Data' : 
  //                 (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
  //                   'Import CSV' : 'Create Tables'
  //                 )
  //               )
  //             }
  //           </Button>
  //         </>
  //       )}

  //       {currentStep === 0 && (
  //         <Button onClick={handleCancel}>
  //           Cancel
  //         </Button>
  //       )}
  //     </div>

  //     {processing && (
  //       <div style={{ 
  //         position: 'absolute', 
  //         top: 0, 
  //         left: 0, 
  //         right: 0, 
  //         bottom: 0, 
  //         backgroundColor: 'rgba(255, 255, 255, 0.8)', 
  //         display: 'flex', 
  //         alignItems: 'center', 
  //         justifyContent: 'center',
  //         flexDirection: 'column',
  //         zIndex: 1000
  //       }}>
  //         <Spin size="large" />
  //         <div style={{ marginTop: '16px', fontSize: '16px' }}>
  //           {appendMode ? 
  //             `Appending data to "${appendTargetTable}"...` :
  //             (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ?
  //               'Processing CSV file and creating database table...' :
  //               'Processing file and creating database tables...'
  //             )
  //           }
  //         </div>
  //       </div>
  //     )}
  //   </Modal>
  // );
return (
  <Modal
    title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {appendMode ? 
          <FileAddOutlined style={{ color: '#fa8c16' }} /> : 
          (selectedFile && getFileIcon(selectedFile.name)) || <InboxOutlined style={{ color: '#1890ff' }} />
        }
        <span style={{ color: appendMode ? '#fa8c16' : '#1890ff' }}>
          {appendMode ? `Append Data to "${appendTargetTable}"` : "Upload File to Database"}
        </span>
      </div>
    }
    open={visible}
    onCancel={handleCancel}
    width={getModalDimensions().width}
    footer={null}
    destroyOnClose={true}
    centered={false}                             // ✅ Disable auto-centering
    mask={true}                                  // ✅ Keep backdrop mask but make it light
    maskClosable={false}                         // ✅ Prevent accidental closes
    style={{                                     // ✅ UPDATED: Dynamic positioning based on sidebar
      position: 'fixed',
      left: getModalDimensions().left,           // ✅ Dynamic left position
      top: getModalDimensions().top,
      maxHeight: getModalDimensions().maxHeight,
      transform: 'none',
      margin: 0,
      padding: 0,
      zIndex: 1000                               // ✅ Ensure it's above sidebar
    }}
    styles={{
      body: {
        maxHeight: `${getModalDimensions().maxHeight - 120}px`,
        overflowY: 'auto',
        padding: 0
      },
      mask: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',   // ✅ Light mask so sidebar is still visible
        zIndex: 999                              // ✅ Below modal but above content
      }
    }}
    getContainer={() => document.body}          // ✅ Ensure proper container
  >
    {/* Rest of your modal content stays exactly the same */}
    <Steps current={currentStep} style={{ marginBottom: '14px', padding: '0 24px', paddingTop: '24px' }}>
      <Step 
        title={appendMode ? "Select File" : "Upload File"} 
        description={appendMode ? 
          "Choose file to append" : 
          (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
            "Select CSV file & configure options" : 
            "Select and analyze file"
          )
        } 
      />
      <Step title="Configure" description="Set processing options" />
      <Step 
        title={appendMode ? "Append" : "Process"} 
        description={appendMode ? "Append to existing table" : "Create database tables"} 
      />
    </Steps>

    <div style={{ 
      padding: '0 24px 24px 24px',
      minHeight: '400px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {currentStep === 0 && renderFileUploadStep()}
      {currentStep === 1 && renderConfigurationStep()}
    </div>

    {/* Footer */}
    <div style={{ 
      borderTop: '1px solid #f0f0f0', 
      padding: '16px 24px', 
      textAlign: 'right',
      background: '#fff',
      position: 'sticky',
      bottom: 0,
      zIndex: 10
    }}>
      {currentStep === 1 && (
        <>
          <Button 
            onClick={() => setCurrentStep(0)} 
            style={{ marginRight: '8px' }}
          >
            Back
          </Button>
          <Button
            type="primary"
            onClick={processFile}
            loading={processing}
            disabled={!isConfigurationValid()}
            style={{
              backgroundColor: appendMode ? '#fa8c16' : '#1890ff',
              borderColor: appendMode ? '#fa8c16' : '#1890ff'
            }}
          >
            {processing ? 
              (appendMode ? 'Appending...' : 'Processing...') : 
              (appendMode ? 'Append Data' : 
                (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ? 
                  'Import CSV' : 'Create Tables'
                )
              )
            }
          </Button>
        </>
      )}

      {currentStep === 0 && (
        <Button onClick={handleCancel}>
          Cancel
        </Button>
      )}
    </div>

    {/* Processing overlay stays the same */}
    {processing && (
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 1000
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', fontSize: '16px' , fontFamily : "var(--app-font-family)", }}>
          {appendMode ? 
            `Appending data to "${appendTargetTable}"...` :
            (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv') ?
              'Processing CSV file and creating database table...' :
              'Processing file and creating database tables...'
            )
          }
        </div>
      </div>
    )}
  </Modal>
);

};

// Enhanced handleFileUpload hook with append support
const useFileUpload = (openNotification, fetchTables, updateState) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [appendModalVisible, setAppendModalVisible] = useState(false);
  const [appendTargetTable, setAppendTargetTable] = useState(null);

  const handleFileUpload = useCallback((file) => {
    console.log('🔄 handleFileUpload called - Opening NEW FILE modal');
    if (file) {
      setUploadModalVisible(true);
      return;
    }
    
    setUploadModalVisible(true);
  }, []);

  // Handle append upload
  const handleAppendUpload = useCallback((tableName) => {
    console.log('🔄 handleAppendUpload called for table:', tableName);
    if (!tableName) {
      openNotification('warning', 'No Table Selected', 'Please select a table to append data to');
      return;
    }
    
    setAppendTargetTable(tableName);
    setAppendModalVisible(true);
  }, [openNotification]);

  const handleUploadSuccess = useCallback(async (createdTables) => {
    if (typeof fetchTables === 'function') {
      await fetchTables();
    }
    
    if (createdTables.length > 0 && typeof updateState === 'function') {
      updateState({ 
        selectedTable: createdTables[0],
        lastFetchedTable: ""
      });
    }
    
    setUploadModalVisible(false);
  }, [fetchTables, updateState]);

  const handleAppendSuccess = useCallback(async (affectedTables) => {
    if (typeof fetchTables === 'function') {
      await fetchTables();
    }
    
    if (affectedTables.length > 0 && typeof updateState === 'function') {
      updateState({ 
        selectedTable: affectedTables[0],
        lastFetchedTable: ""
      });
    }
    
    setAppendModalVisible(false);
    setAppendTargetTable(null);
  }, [fetchTables, updateState]);

  // Component renders two visually different modals
  const FileUploadModalComponent = () => (
    <>
      {/* Regular Upload Modal - Blue Theme */}
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
        openNotification={openNotification}
        existingTables={[]}
        appendMode={false}
      />
      
      {/* Append Mode Modal - Orange Theme */}
      <FileUploadModal
        visible={appendModalVisible}
        onCancel={() => {
          setAppendModalVisible(false);
          setAppendTargetTable(null);
        }}
        onSuccess={handleAppendSuccess}
        openNotification={openNotification}
        existingTables={[]}
        appendMode={true}
        appendTargetTable={appendTargetTable}
      />
    </>
  );

  return {
    handleFileUpload,
    handleAppendUpload,
    FileUploadModalComponent
  };
};

export { useFileUpload, FileUploadModal };