// import React, { useState, useMemo, useCallback } from "react";
// import { useNavigate } from "react-router-dom";

// import { styled, useTheme } from '@mui/material/styles';
// import { LogoutOutlined } from "@ant-design/icons";
// import InfoIcon from '@mui/icons-material/Info';

// import { Button as AntdButton } from 'antd';
// import {
//   Box,
//   Drawer,
//   List,
//   Typography,
//   Tooltip, 
//   Divider,
//   IconButton,
//   ListItem,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Collapse,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Button,
//   TextField,
//   Chip,
//   Paper,
//   Card,
//   CardContent,
//   Badge,
//   Stack
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   ChevronLeft as ChevronLeftIcon,
//   ChevronRight as ChevronRightIcon,
//   ExpandLess,
//   ExpandMore,
//   Dashboard as DashboardIcon,
//   Save as SaveIcon,
//   SmartToy as AIIcon,
//   TableChart as TableIcon,
//   ViewColumn as ColumnIcon,
//   GetApp as ExportIcon,
//   CloudUpload as UploadIcon,
//   Delete as DeleteIcon,
//   Close as CloseIcon,
//   DateRange as DateIcon,
//   Functions as MeasureIcon,
//   TextFields as TextIcon,
//   Category as CategoryIcon,
//   Add as AddIcon,
//   GetApp as TemplateIcon 
// } from '@mui/icons-material';

// const drawerWidth = 280;
// const collapsedWidth = 60;

// const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
//   width: open ? drawerWidth : collapsedWidth,
//   flexShrink: 0,
//   '& .MuiDrawer-paper': {
//     width: open ? drawerWidth : collapsedWidth,
//     boxSizing: 'border-box',
//     backgroundColor: '#1A1A2E',
//     color: '#fff',
//     borderRight: `1px solid ${theme.palette.divider}`,
//     zIndex: theme.zIndex.drawer,
//     position: 'fixed',
//     top: 0,
//     left: 0,
//     height: '100vh',
//     overflowY: 'auto',
//     overflowX: 'hidden',
//   },
// }));

// // Root container - uses CSS Grid for proper layout with 3 columns
// const RootContainer = styled(Box)(({ theme }) => ({
//   display: 'grid',
//   gridTemplateColumns: 'auto 1fr auto',
//   minHeight: '100vh',
//   width: '100%',
//   backgroundColor: theme.palette.background.default,
//   position: 'relative',
// }));

// // Main container
// const MainContainer = styled('main', {
//   shouldForwardProp: (prop) => prop !== 'open' && prop !== 'columnsOpen',
// })(({ theme, open, columnsOpen }) => ({
//   gridColumn: 2,
//   display: 'flex',
//   flexDirection: 'column',
//   height: '100vh',
//   padding: theme.spacing(3),
//   boxSizing: 'border-box',
//   backgroundColor: theme.palette.background.default,
//   transition: theme.transitions.create(['margin-left', 'margin-right'], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   width: '100%',
//   overflowY: 'auto',
//   overflowX: 'hidden',
// }));

// // Sidebar container
// const SidebarContainer = styled(Box, {
//   shouldForwardProp: (prop) => prop !== 'open',
// })(({ theme, open }) => ({
//   gridColumn: 1,
//   width: open ? drawerWidth : collapsedWidth,
//   transition: theme.transitions.create(['width'], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   overflow: 'hidden',
// }));

// const DrawerHeader = styled('div')(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   padding: theme.spacing(0, 1),
//   ...theme.mixins.toolbar,
//   justifyContent: 'space-between',
// }));

// const SubMenuItem = styled(ListItemButton)(({ theme }) => ({
//   paddingLeft: theme.spacing(4),
//   paddingY: theme.spacing(0.5),
// }));

// // Columns drawer container - Updated for single scroll
// const ColumnsDrawerContainer = styled(Box, {
//   shouldForwardProp: (prop) => prop !== 'open',
// })(({ theme, open }) => ({
//   gridColumn: 3,
//   width: open ? 320 : 0,
//   transition: theme.transitions.create(['width'], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   overflow: 'hidden',
//   ...(open && {
//     transition: theme.transitions.create(['width'], {
//       easing: theme.transitions.easing.easeOut,
//       duration: theme.transitions.duration.enteringScreen,
//     }),
//   }),
// }));

// const StyledColumnsDrawer = styled(Box)(({ theme }) => ({
//   width: 320,
//   height: '100vh',
//   backgroundColor: theme.palette.background.default,
//   borderLeft: `1px solid ${theme.palette.divider}`,
//   display: 'flex',
//   flexDirection: 'column',
//   overflowY: 'auto', // Single scroll for entire drawer
// }));

// const ColumnsDrawerHeader = styled('div')(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   padding: theme.spacing(1, 2),
//   justifyContent: 'space-between',
//   minHeight: 64,
//   backgroundColor: theme.palette.primary.main,
//   color: theme.palette.primary.contrastText,
//   flexShrink: 0,
// }));

// const ExportButton = styled(IconButton)(({ theme }) => ({
//   margin: theme.spacing(0.5),
//   border: `1px solid ${theme.palette.divider}`,
//   borderRadius: theme.spacing(1),
// }));

// const BreadcrumbNavigation = ({ currentPath, onNavigate }) => {
//   const getBreadcrumbs = (path) => {
//     const breadcrumbs = [
//       { label: 'Home', path: '/ssbi', icon: '🏠' }
//     ];

//     // ✅ FIXED: Handle all page types including file upload
//     if (path.includes('create-dashboard')) {
//       breadcrumbs.push({ label: 'Create Dashboard', path: '/create-dashboard' });
      
//       if (path.includes('view=templates')) {
//         breadcrumbs.push({ label: 'Templates', path: '/create-dashboard?view=templates' });
//       }
//     } else if (path.includes('ssbihome')) {
//       breadcrumbs.push({ label: 'Dashboard', path: '/ssbihome' });
//     } else if (path.includes('data-upload') || path.includes('file-upload') || path.includes('upload')) {
//       // ✅ FIXED: Add breadcrumb for upload pages
//       breadcrumbs.push({ label: 'Data Upload', path: '/data-upload' });
//     }

//     return breadcrumbs;
//   };

//   const breadcrumbs = getBreadcrumbs(currentPath);

//   return (
//     <div style={{
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px',
//       padding: '8px 16px',
//       backgroundColor: 'transparent',
//       fontSize: '14px',
//       color: '#666'
//     }}>
//       {breadcrumbs.map((crumb, index) => (
//         <React.Fragment key={crumb.path}>
//           {index > 0 && <span style={{ color: '#ccc', margin: '0 4px' }}>›</span>}
//           <button
//             onClick={() => onNavigate(crumb.path)}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: index === breadcrumbs.length - 1 ? '#1976d2' : '#666',
//               cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
//               fontSize: '14px',
//               fontWeight: index === breadcrumbs.length - 1 ? '600' : '400',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '4px',
//               padding: '4px 8px',
//               borderRadius: '4px',
//               transition: 'background-color 0.2s',
//               '&:hover': {
//                 backgroundColor: index !== breadcrumbs.length - 1 ? '#f5f5f5' : 'transparent'
//               }
//             }}
//             disabled={index === breadcrumbs.length - 1}
//           >
//             {index === 0 && <span style={{ marginRight: '4px' }}>🏠</span>}
//             {crumb.label}
//           </button>
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };


// // Enhanced Draggable Column Component
// const DraggableColumn = ({ column, category, dataType }) => {
//   const [isDragging, setIsDragging] = useState(false);

//   const getCategoryStyles = () => {
//     return {
//       backgroundColor: '#e3f2fd',
//       color: '#1565c0',
//       borderColor: '#1976d2',
//       '&:hover': {
//         backgroundColor: '#1976d2',
//         color: '#fff',
//         transform: 'scale(1.02)',
//       }
//     };
//   };

//   const handleDragStart = (e) => {
//     setIsDragging(true);
    
//     e.dataTransfer.setData('text/plain', column);
//     e.dataTransfer.setData('application/json', JSON.stringify({ 
//       type: 'column', 
//       data: column,
//       category: category,
//       dataType: dataType
//     }));
//     e.dataTransfer.effectAllowed = 'copy';
    
//     e.target.style.opacity = '0.5';
//     console.log('Drag started for column:', column, 'Category:', category, 'Type:', dataType);
//   };

//   const handleDragEnd = (e) => {
//     setIsDragging(false);
//     e.target.style.opacity = '1';
//   };

//   return (
//     <Chip
//       label={column}
//       draggable
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//       size="small"
//       sx={{
//         margin: 0.5,
//         cursor: isDragging ? 'grabbing' : 'grab',
//         userSelect: 'none',
//         transition: 'all 0.2s ease',
//         border: '1px solid',
//         fontSize: '0.75rem',
//         height: '28px',
//         ...getCategoryStyles(),
//         '&:active': {
//           cursor: 'grabbing',
//         },
//       }}
//       onClick={(e) => e.stopPropagation()}
//     />
//   );
// };

// // Datatype-based categorization function
// const categorizeColumnsByDatatype = (columnsInfo) => {
//   const categorized = {
//     date: [],
//     dimension: [],
//     fields: []
//   };

//   if (!columnsInfo || !Array.isArray(columnsInfo)) {
//     return categorized;
//   }

//   // Define data type mappings
//   const dateTypes = new Set([
//     'date', 'time', 'timestamp', 'timestamptz', 'timetz', 'interval',
//     'timestamp without time zone', 'timestamp with time zone',
//     'time without time zone', 'time with time zone'
//   ]);
  
//   const numericTypes = new Set([
//     'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 
//     'double precision', 'serial', 'bigserial', 'smallserial',
//     'int2', 'int4', 'int8', 'float4', 'float8', 'money'
//   ]);
  
//   const booleanTypes = new Set(['boolean', 'bool']);
  
//   // Keywords that indicate ID/reference columns (should go to fields even if numeric)
//   const idKeywords = ['id', '_id', 'key', '_key', 'code', '_code', 'ref', '_ref', 'uuid'];

//   columnsInfo.forEach(colInfo => {
//     const columnName = colInfo.column_name;
//     const dataType = (colInfo.data_type || '').toLowerCase();
//     const udtName = (colInfo.udt_name || '').toLowerCase();
//     const columnNameLower = columnName.toLowerCase();
    
//     // Check if it's an ID-like column
//     const isIdColumn = idKeywords.some(keyword => columnNameLower.includes(keyword));
    
//     // Categorize based on data type
//     if (dateTypes.has(dataType) || dateTypes.has(udtName)) {
//       categorized.date.push(columnName);
//     } else if ((numericTypes.has(dataType) || numericTypes.has(udtName)) && !isIdColumn) {
//       categorized.dimension.push(columnName);
//     } else if (booleanTypes.has(dataType) || booleanTypes.has(udtName)) {
//       categorized.fields.push(columnName);
//     } else {
//       // Text types, IDs, and everything else goes to fields
//       categorized.fields.push(columnName);
//     }
//   });

//   return categorized;
// };

// // Fallback categorization function (original logic)
// const categorizeColumns = (columns, rows) => {
//   const categorized = {
//     date: [],
//     dimension: [],
//     fields: []
//   };

//   // Keywords for better categorization
//   const dateKeywords = ['date', 'time', 'created', 'updated', 'modified', 'timestamp', 'year', 'month', 'day', 'week'];
//   const dimensionKeywords = ['amount', 'price', 'cost', 'total', 'sum', 'count', 'value', 'number', 'qty', 'quantity', 'revenue', 'sales', 'profit', 'score', 'rate', 'percent'];

//   columns.forEach(column => {
//     const columnLower = column.toLowerCase();
//     let category = 'fields'; // default
    
//     // Get sample values for analysis (first 10 non-null values)
//     const sampleValues = rows
//       .slice(0, 20)
//       .map(row => row[column])
//       .filter(val => val !== null && val !== undefined && val !== '')
//       .slice(0, 10);

//     // Check for date/time
//     if (dateKeywords.some(keyword => columnLower.includes(keyword)) ||
//         isDateTimeColumn(sampleValues)) {
//       category = 'date';
//     }
//     // Check for dimension (numeric/measures)
//     else if (dimensionKeywords.some(keyword => columnLower.includes(keyword)) ||
//              isNumericColumn(sampleValues)) {
//       category = 'dimension';
//     }
//     // Everything else goes to fields
    
//     categorized[category].push(column);
//   });

//   return categorized;
// };

// // Helper functions for fallback categorization
// const isDateTimeColumn = (sampleValues) => {
//   if (sampleValues.length === 0) return false;
  
//   let dateCount = 0;
//   sampleValues.forEach(value => {
//     if (value) {
//       const str = value.toString();
//       const datePatterns = [
//         /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
//         /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
//         /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
//         /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
//         /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // M/D/YY or MM/DD/YYYY
//       ];
      
//       if (datePatterns.some(pattern => pattern.test(str)) || 
//           !isNaN(Date.parse(str))) {
//         dateCount++;
//       }
//     }
//   });
  
//   return dateCount / sampleValues.length > 0.7; // 70% threshold
// };

// const isNumericColumn = (sampleValues) => {
//   if (sampleValues.length === 0) return false;
  
//   let numericCount = 0;
//   sampleValues.forEach(value => {
//     if (value !== null && value !== undefined) {
//       const numValue = parseFloat(value.toString().replace(/[$,\s%]/g, ''));
//       if (!isNaN(numValue) && isFinite(numValue)) {
//         numericCount++;
//       }
//     }
//   });
  
//   return numericCount / sampleValues.length > 0.8; // 80% threshold
// };

// // Toggle button when sidebar is closed
// const ToggleButton = styled(IconButton, {
//   shouldForwardProp: (prop) => prop !== 'open',
// })(({ theme, open }) => ({
//   position: 'fixed',
//   top: theme.spacing(1),
//   left: theme.spacing(1),
//   zIndex: theme.zIndex.drawer + 2,
//   backgroundColor: theme.palette.background.paper,
//   border: `1px solid ${theme.palette.divider}`,
//   boxShadow: theme.shadows[2],
//   transition: theme.transitions.create(['opacity', 'transform'], {
//     duration: theme.transitions.duration.shortest,
//   }),
//   opacity: open ? 0 : 1,
//   transform: open ? 'scale(0)' : 'scale(1)',
//   '&:hover': {
//     backgroundColor: theme.palette.action.hover,
//   },
// }));

// // Enhanced Category Card Component with datatype support
// const CategoryCardWithTypes = ({ title, icon, columns, category, description, columnsInfo = [] }) => {
//   const [expanded, setExpanded] = useState(true);
//   const commonColor = '#1976d2';
  
//   // Create a map of column names to their type info
//   const columnTypeMap = useMemo(() => {
//     const map = {};
//     columnsInfo.forEach(col => {
//       map[col.column_name] = col;
//     });
//     return map;
//   }, [columnsInfo]);
  
//   return (
//     <Card 
//       sx={{ 
//         mb: 1, 
//         boxShadow: 1,
//         border: `1px solid ${commonColor}20`,
//         '&:hover': {
//           boxShadow: 2,
//         }
//       }}
//     >
//       <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
//         <Box 
//           sx={{ 
//             display: 'flex', 
//             alignItems: 'center', 
//             justifyContent: 'space-between',
//             cursor: 'pointer',
//             p: 1.5,
//             backgroundColor: commonColor,
//             color: 'white'
//           }}
//           onClick={() => setExpanded(!expanded)}
//         >
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             {icon}
//             <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white' }}>
//               {title}
//             </Typography>
//             <Badge 
//               badgeContent={columns.length} 
//               sx={{
//                 '& .MuiBadge-badge': {
//                   backgroundColor: 'white',
//                   color: commonColor,
//                   fontSize: '0.7rem',
//                   fontWeight: 'bold',
//                 },
//                 paddingLeft: '15px',
//               }}
//             />
//           </Box>
//           <IconButton size="small" sx={{ color: 'white' }}>
//             {expanded ? <ExpandLess /> : <ExpandMore />}
//           </IconButton>
//         </Box>
        
//         {expanded && (
//           <Box sx={{ p: 1 }}>
//             {columns.length > 0 ? (
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//                 {columns.map((column, index) => {
//                   const typeInfo = columnTypeMap[column];
//                   const dataType = typeInfo?.data_type || 'unknown';
                  
//                   return (
//                     <Box
//                       key={`${category}-${index}`}
//                       className="draggable-column"
//                       draggable
//                       onDragStart={(e) => {
//                         e.dataTransfer.setData('text/plain', column);
//                         e.dataTransfer.setData('application/json', JSON.stringify({ 
//                           type: 'column', 
//                           data: column,
//                           category: category,
//                           dataType: dataType
//                         }));
//                         e.dataTransfer.effectAllowed = 'copy';
//                         e.target.style.opacity = '0.5';
//                         console.log('Drag started for column:', column, 'Category:', category, 'Type:', dataType);
//                       }}
//                       onDragEnd={(e) => {
//                         e.target.style.opacity = '1';
//                       }}
//                       sx={{
//                         backgroundColor: '#e3f2fd',
//                         color: '#1565c0',
//                         border: '1px solid #1976d2',
//                         borderRadius: 1,
//                         padding: '8px 12px',
//                         cursor: 'grab',
//                         userSelect: 'none',
//                         transition: 'all 0.2s ease',
//                         fontSize: '0.875rem',
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         '&:hover': {
//                           backgroundColor: '#1976d2',
//                           color: '#fff',
//                           transform: 'translateX(4px)',
//                         },
//                         '&:active': {
//                           cursor: 'grabbing',
//                         },
//                       }}
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <span>{column}</span>
//                       <Tooltip title={`Data Type: ${dataType}`} arrow>
//                         <Typography 
//                           variant="caption" 
//                           sx={{ 
//                             fontSize: '0.7rem',
//                             opacity: 0.8,
//                             fontStyle: 'italic',
//                             ml: 1
//                           }}
//                         >
//                           {dataType}
//                         </Typography>
//                       </Tooltip>
//                     </Box>
//                   );
//                 })}
//               </Box>
//             ) : (
//               <Typography 
//                 variant="body2" 
//                 color="text.secondary" 
//                 sx={{ 
//                   textAlign: 'center', 
//                   py: 2,
//                   fontStyle: 'italic'
//                 }}
//               >
//                 No {title.toLowerCase()} found
//               </Typography>
//             )}
//           </Box>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// // Simple Category Card (fallback when no datatype info)
// const CategoryCard = ({ title, icon, columns, category, description }) => {
//   const [expanded, setExpanded] = useState(true);
//   const commonColor = '#1976d2';
  
//   return (
//     <Card 
//       sx={{ 
//         mb: 1, 
//         boxShadow: 1,
//         border: `1px solid ${commonColor}20`,
//         '&:hover': {
//           boxShadow: 2,
//         }
//       }}
//     >
//       <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
//         <Box 
//           sx={{ 
//             display: 'flex', 
//             alignItems: 'center', 
//             justifyContent: 'space-between',
//             cursor: 'pointer',
//             p: 1.5,
//             backgroundColor: commonColor,
//             color: 'white'
//           }}
//           onClick={() => setExpanded(!expanded)}
//         >
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             {icon}
//             <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white' }}>
//               {title}
//             </Typography>
//             <Badge 
//               badgeContent={columns.length} 
//               sx={{
//                 '& .MuiBadge-badge': {
//                   backgroundColor: 'white',
//                   color: commonColor,
//                   fontSize: '0.7rem',
//                   fontWeight: 'bold',
//                 },
//                 paddingLeft: '15px',
//               }}
//             />
//           </Box>
//           <IconButton size="small" sx={{ color: 'white' }}>
//             {expanded ? <ExpandLess /> : <ExpandMore />}
//           </IconButton>
//         </Box>
        
//         {expanded && (
//           <Box sx={{ p: 1 }}>
//             {columns.length > 0 ? (
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//                 {columns.map((column, index) => (
//                   <Box
//                     key={`${category}-${index}`}
//                     draggable
//                     onDragStart={(e) => {
//                       e.dataTransfer.setData('text/plain', column);
//                       e.dataTransfer.setData('application/json', JSON.stringify({ 
//                         type: 'column', 
//                         data: column,
//                         category: category
//                       }));
//                       e.dataTransfer.effectAllowed = 'copy';
//                       e.target.style.opacity = '0.5';
//                       console.log('Drag started for column:', column, 'Category:', category);
//                     }}
//                     onDragEnd={(e) => {
//                       e.target.style.opacity = '1';
//                     }}
//                     sx={{
//                       backgroundColor: '#e3f2fd',
//                       color: '#1565c0',
//                       border: '1px solid #1976d2',
//                       borderRadius: 1,
//                       padding: '8px 12px',
//                       cursor: 'grab',
//                       userSelect: 'none',
//                       transition: 'all 0.2s ease',
//                       fontSize: '0.875rem',
//                       '&:hover': {
//                         backgroundColor: '#1976d2',
//                         color: '#fff',
//                         transform: 'translateX(4px)',
//                       },
//                       '&:active': {
//                         cursor: 'grabbing',
//                       },
//                     }}
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     {column}
//                   </Box>
//                 ))}
//               </Box>
//             ) : (
//               <Typography 
//                 variant="body2" 
//                 color="text.secondary" 
//                 sx={{ 
//                   textAlign: 'center', 
//                   py: 2,
//                   fontStyle: 'italic'
//                 }}
//               >
//                 No {title.toLowerCase()} found
//               </Typography>
//             )}
//           </Box>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// const SidebarSSBI = ({
//   tables,
//   selectedTable,
//   setSelectedTable,
//   columns,
//   rows = [],
//   // NEW PROPS for datatype support
//   columnsInfo = [],
//   categorizedColumns = null,
//   // Existing props
//   DraggableColumn: OriginalDraggableColumn,
//   exportTableToCSV,
//   exportTableToPDF,
//   handleFileUpload,
//   selectedAppendTable,
//   setSelectedAppendTable,
//   generateAppendTemplate,
//   handleAppendUpload,
//   reportName,
//   setReportName,
//   saveReport,
//   savedReports,
//   loadSavedReport,
//   deleteSavedReport,
//   question,
//   setQuestion,
//   fetchAiResponse,
//   loadingAiResponse,
//   aiResults,
//   resetDashboard,
//   handlePageChange,
//   isTablePaneVisible,
//   toggleTablePane,
//   // NEW PROPS
//   // currentView,
//   // setCurrentView,
//   isLoadedReport = false,
//   children,
// }) => {
//   const theme = useTheme();
//   const navigate = useNavigate();
//   const [open, setOpen] = useState(true);
//   const [columnsDrawerOpen, setColumnsDrawerOpen] = useState(false);
//   const [expandedMenus, setExpandedMenus] = useState({
//     ssbi: false,
//     savedReports: false,
//     aiAssistant: false,
//   });

//   // Categorize columns using useMemo for performance
//   const finalCategorizedColumns = useMemo(() => {
//     // If we have categorized columns from the backend, use them
//     if (categorizedColumns && Object.keys(categorizedColumns).length > 0) {
//       return categorizedColumns;
//     }
    
//     // If we have columns info with datatypes, categorize them
//     if (columnsInfo && columnsInfo.length > 0) {
//       return categorizeColumnsByDatatype(columnsInfo);
//     }
    
//     // Fallback to the old method if no datatype info is available
//     return categorizeColumns(columns, rows);
//   }, [categorizedColumns, columnsInfo, columns, rows]);

//   const handleDrawerToggle = () => {
//     setOpen(!open);
//   };

//   const handleMenuToggle = (menu) => {
//     setExpandedMenus(prev => ({
//       ...prev,
//       [menu]: !prev[menu]
//     }));
//   };

//   const handleTableChange = (event) => {
//     setSelectedTable(event.target.value);
//   };

//   const handleColumnsDrawerOpen = () => {
//     setColumnsDrawerOpen(true);
//     setOpen(false);
//   };

//   const handleColumnsDrawerClose = () => {
//     setColumnsDrawerOpen(false);
//     setOpen(true);
//   };

//   // Category definitions
//   const categoryDefinitions = [
//     {
//       key: 'fields',
//       title: 'Fields',
//       icon: <TextIcon sx={{ color: 'white' }} />,
//       description: 'Text fields, categories, and other data'
//     },
//     {
//       key: 'date',
//       title: 'Time',
//       icon: <DateIcon sx={{ color: 'white' }} />,
//       description: 'Date, time, and timestamp fields'
//     },
//     {
//       key: 'dimension',
//       title: 'Dimension',
//       icon: <MeasureIcon sx={{ color: 'white' }} />,
//       description: 'Numerical values for calculations and measures'
//     }
//   ];

//   return (
//     <RootContainer>
//       {/* Sidebar Container */}
//       <SidebarContainer open={open}>
//         <StyledDrawer
//           variant="persistent"
//           anchor="left"
//           open={open}
//           sx={{
//             width: open ? drawerWidth : 0,
//             '& .MuiDrawer-paper': {
//               width: drawerWidth,
//               position: 'relative',
//             },
//           }}
//         >
//           <DrawerHeader>
//             <Typography
//               variant="h6"
//               noWrap
//               component="div"
//               sx={{
//                 fontFamily: "'Titillium Web', 'Segoe UI', sans-serif",
//                 fontSize: "2rem",
//                 fontWeight: 700,
//                 fontStyle: "italic",
//                 letterSpacing: "1px",
//                 background: "linear-gradient(to right, #1e356b, #0284c7, #06b6d4)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//                 backgroundClip: "text",
//                 color: "transparent",
//                 transition: "transform 0.3s ease, letter-spacing 0.3s ease",
//               }}
//             >
//               Dashboard
//             </Typography>

//             <IconButton
//               style={{ color: 'white' }}
//               onClick={handleDrawerToggle}
//             >
//               {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
//             </IconButton>
//           </DrawerHeader>
          
//           <Divider />
          
//           <List>
//             <Divider />

//             {/* SSBI Menu */}
//             <ListItem disablePadding>
//               <ListItemButton sx={{
//                 '&:hover': {
//                   background: 'linear-gradient(to right, rgba(106,90,205,0.55), rgba(209,107,165,0.55))',
//                   color: '#4cc9f0',
//                   borderRadius: '12px',
//                 },
//                 '&.Mui-selected': {
//                   background: 'linear-gradient(to right, rgba(106,90,205,0.25), rgba(209,107,165,0.25))',
//                   color: '#4cc9f0',
//                   borderRadius: '12px',
//                 },
//                 '.MuiListItemIcon-root': {
//                   color: '#ecf0f1',
//                   minWidth: '40px',
//                 },
//               }} onClick={() => handleMenuToggle('ssbi')}>
//                 <ListItemIcon sx={{ color: '#fff' }}>
//                   <DashboardIcon />
//                 </ListItemIcon>
//                 <ListItemText primary="SSBI" />
//                 {expandedMenus.ssbi ? <ExpandLess /> : <ExpandMore />}
//               </ListItemButton>
//             </ListItem>
            
//             <Collapse in={expandedMenus.ssbi} timeout="auto" unmountOnExit>
//               {/* <List component="div" disablePadding>
//                 {reportName && (
//                   <Box sx={{ px: 3, pt: 2 }}>
//                     <Button
//                       variant="contained"
//                       fullWidth
//                       size="small"
//                       onClick={resetDashboard}
//                     >
//                       + New Report
//                     </Button>
//                   </Box>
//                 )} */}
//                 <List component="div" disablePadding>
//                   {(() => {
//                     const currentPath = window.location.pathname;
//                     const hasReportName = !!reportName;
//                     const isUploadPage = currentPath.includes('upload') || 
//                                         currentPath.includes('data-upload') || 
//                                         currentPath.includes('file-upload');
                    
//                     console.log('🐛 NEW REPORT BUTTON DEBUG:');
//                     console.log('- Current path:', currentPath);
//                     console.log('- Has report name:', hasReportName);
//                     console.log('- Is upload page:', isUploadPage);
//                     console.log('- Should show button:', hasReportName && !isUploadPage);
                    
//                     return null; // This is just for debugging, doesn't render anything
//                   })()}

//                   {/* ✅ FIXED: New Report Button with proper condition */}
//                   {/* {reportName && 
//                   !window.location.pathname.includes('upload') && 
//                   !window.location.pathname.includes('data-upload') && 
//                   !window.location.pathname.includes('file-upload') ? (
//                     <Box sx={{ px: 3, pt: 2 }}>
//                       <Button
//                         variant="contained"
//                         fullWidth
//                         size="small"
//                         onClick={resetDashboard}
//                       >
//                         + New Report
//                       </Button>
//                     </Box>
//                   ) : null} */}

//                 {/* Dashboard Submenu */}
//                 {/* <SubMenuItem onClick={() => setCurrentView('dashboard')}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <DashboardIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Dashboard" />
//                 </SubMenuItem> */}
                
//                 {/* <SubMenuItem onClick={() => navigate('/ssbihome')}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <DashboardIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Dashboard" />
//                 </SubMenuItem> */}
//                 {/* <SubMenuItem onClick={() => {
//                   console.log('🔄 Navigating to create-dashboard from sidebar');
//                   navigate('/create-dashboard', { replace: true });
//                 }}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <DashboardIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Dashboard" />
//                 </SubMenuItem> */}
//                 <SubMenuItem 
//                   onClick={() => navigate('/create-dashboard', { replace: true })}
//                   sx={{
//                     backgroundColor: window.location.pathname.includes('create-dashboard') 
//                       ? 'rgba(25, 118, 210, 0.2)' 
//                       : 'transparent'
//                   }}
//                 >
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <DashboardIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Create Dashboard" />
//                   {window.location.pathname.includes('create-dashboard') && (
//                     <div style={{
//                       width: '4px',
//                       height: '20px',
//                       backgroundColor: '#1976d2',
//                       borderRadius: '2px',
//                       marginLeft: '8px'
//                     }} />
//                   )}
//                 </SubMenuItem>
                
//                 {/* Upload Data Submenu */}
//                 {/* <SubMenuItem onClick={() => setCurrentView('upload')}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <UploadIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Upload Data" />
//                 </SubMenuItem> */}

//                 {/* Tables Submenu */}
//                 <SubMenuItem>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <TableIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Tables" />
//                 </SubMenuItem>
                
//                 <Box sx={{ px: 3, pb: 2 }}>
//                   <FormControl fullWidth size="small" sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}>
//                     <InputLabel sx={{ color: '#fff' }}>Select Table</InputLabel>
//                     <Select
//                       id="table-dropdown"
//                       value={selectedTable}
//                       label="Select Table"
//                       onChange={handleTableChange}
//                       sx={{
//                         color: '#fff',
//                         '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
//                         '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
//                         '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
//                         '& .MuiSvgIcon-root': { color: '#fff' },
//                       }}
//                       MenuProps={{
//                         disablePortal: true,
//                         PaperProps: {
//                           sx: {
//                             bgcolor: '#1A1A2E',
//                             color: '#fff',
//                           },
//                         },
//                       }}
//                     >
//                       {tables.length > 0 ? (
//                         tables.map((table, index) => (
//                           <MenuItem
//                             id={index === 0 ? "table-option-1" : undefined}
//                             key={index}
//                             value={table}
//                             sx={{
//                               color: '#fff',
//                               whiteSpace: 'normal',
//                               wordWrap: 'break-word',
//                               maxWidth: '200px',
//                             }}
//                           >
//                             {table}
//                           </MenuItem>
//                         ))
//                       ) : (
//                         <MenuItem value="">Loading tables...</MenuItem>
//                       )}
//                     </Select>
//                   </FormControl>
//                 </Box>

//                 {/* Columns Submenu - Opens Drawer */}
//                 <SubMenuItem onClick={handleColumnsDrawerOpen}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <ColumnIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Columns" />
//                   <ChevronRightIcon />
//                 </SubMenuItem>

//                 <SubMenuItem onClick={() => {
//                   // Check current route and navigate accordingly
//                   const currentPath = window.location.pathname;
//                   if (currentPath.includes('upload') || currentPath.includes('file-upload') || currentPath.includes('data-upload')) {
//                     // Already on upload page, don't navigate
//                     console.log('Already on upload page');
//                   } else {
//                     // Navigate to your upload page route
//                     navigate('/data-upload'); // Or whatever your upload route is
//                   }
//                 }}>
//                   <ListItemIcon sx={{ color: '#fff' }}>
//                     <UploadIcon />
//                   </ListItemIcon>
//                   <ListItemText primary="Upload Data" />
//                 </SubMenuItem>
//               </List>
//             </Collapse>

//             <Divider />

//             {/* Saved Reports Menu */}
//             <ListItem disablePadding>
//               <ListItemButton sx={{
//                 '&:hover': {
//                   background: 'linear-gradient(to right, rgba(106,90,205,0.55), rgba(209,107,165,0.55))',
//                   color: '#4cc9f0',
//                   borderRadius: '12px',
//                 },
//                 '&.Mui-selected': {
//                   background: 'linear-gradient(to right, rgba(106,90,205,0.25), rgba(209,107,165,0.25))',
//                   color: '#4cc9f0',
//                   borderRadius: '12px',
//                 },
//                 '.MuiListItemIcon-root': {
//                   color: '#ecf0f1',
//                   minWidth: '40px',
//                 },
//               }} onClick={() => handleMenuToggle('savedReports')}>
//                 <ListItemIcon sx={{ color: '#fff' }}>
//                   <SaveIcon />
//                 </ListItemIcon>
//                 <ListItemText primary="Saved Reports" />
//                 {expandedMenus.savedReports ? <ExpandLess /> : <ExpandMore />}
//               </ListItemButton>
//             </ListItem>
            
//             <Collapse in={expandedMenus.savedReports} timeout="auto" unmountOnExit>
//               <List component="div" disablePadding>
//                 {/* Save Report Section */}
//                 <Box sx={{ px: 3, py: 2 }}>
//                   <TextField
//                     fullWidth
//                     size="small"
//                     label="Report Name"
//                     value={reportName}
//                     onChange={(e) => setReportName(e.target.value)}
//                     sx={{
//                       mb: 2,
//                       '& .MuiInputLabel-root': { color: '#fff' },
//                       '& .MuiOutlinedInput-root': {
//                         color: '#fff',
//                         '& fieldset': { borderColor: '#fff' },
//                         '&:hover fieldset': { borderColor: '#fff' },
//                         '&.Mui-focused fieldset': { borderColor: '#fff' },
//                       },
//                       '& .MuiOutlinedInput-notchedOutline': {
//                         borderColor: '#fff',
//                       },
//                     }}
//                     InputProps={{ style: { color: '#fff' } }}
//                     InputLabelProps={{ style: { color: '#fff' } }}
//                   />

//                   <Button
//                     variant="contained"
//                     fullWidth
//                     size="small"
//                     onClick={saveReport}
//                     startIcon={<SaveIcon />}
//                   >
//                     Save Report
//                   </Button>
//                 </Box>

//                 <Divider />

//                 {/* Saved Reports List */}
//                 <Box sx={{ px: 2, py: 1 }}>
//                   <Typography variant="subtitle2" sx={{px: 1, py: 1, color: '#fff' }}>
//                     Saved Reports
//                   </Typography>
                  
//                   {!savedReports || savedReports.length === 0 ? (
//                     <Box sx={{ px: 1, py: 2, textAlign: 'center' }}>
//                       <Typography variant="body2" sx={{ px: 1, py: 1, color: '#fff' }}>
//                         No saved reports found
//                       </Typography>
//                     </Box>
//                   ) : (
//                     savedReports.map((report, index) => (
//                       <Box
//                         key={report.id || report.name || index}
//                         sx={{
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'space-between',
//                           px: 1,
//                           py: 0.5,
//                           borderRadius: 1,
//                           '&:hover': {
//                             backgroundColor: 'action.hover',
//                           },
//                         }}
//                       >
//                         <Typography
//                           variant="body2"
//                           sx={{
//                             cursor: 'pointer',
//                             flex: 1,
//                             textAlign: 'left',
//                             padding: '4px 8px',
//                             borderRadius: 1,
//                             color: '#fff',
//                             '&:hover': { 
//                               color: 'primary.main',
//                               backgroundColor: 'primary.light',
//                             },
//                           }}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             console.log('Loading report:', report.id || report.name);
//                             loadSavedReport(report.id || report.name);
//                           }}
//                         >
//                           {report.name || report.report_name || `Report ${index + 1}`}
//                         </Typography>
//                         <IconButton
//                           size="small"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             console.log('Deleting report:', report.id || report.name);
//                             deleteSavedReport(report.id || report.name);
//                           }}
//                           sx={{ 
//                             color: 'error.main',
//                             '&:hover': {
//                               backgroundColor: 'error.light',
//                             }
//                           }}
//                         >
//                           <DeleteIcon fontSize="small" />
//                         </IconButton>
//                       </Box>
//                     ))
//                   )}
//                 </Box>
//               </List>
//             </Collapse>

//             <Divider />
//           </List>
//         </StyledDrawer>
//       </SidebarContainer>

//       {/* Main Content Area */}
//       <MainContainer open={open} columnsOpen={columnsDrawerOpen}>
//         {/* <Box sx={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           padding: '-1px 8px',
//           minHeight: '20px',
//           backgroundColor: 'transparent',
//           paddingBottom: '10px',
//         }}> */}
//           {/* Back Button - Left Corner */}
//           {/* <AntdButton
//             type="primary"
//             size="small"
//             icon={<ChevronLeftIcon />}
//             onClick={() => navigate("/ssbi")}
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               fontSize: '12px',
//               height: '28px',
//               padding: '0 8px',
//               backgroundColor: '#1976d2',
//               borderColor: '#1976d2'
//             }}
//           >
//             Back
//           </AntdButton> */}
//           <Box sx={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               padding: '0px 8px',
//               minHeight: '40px',
//               backgroundColor: 'transparent',
//               paddingBottom: '10px',
//             }}>
//               {/* REPLACE Back Button with Breadcrumb */}
//               <BreadcrumbNavigation 
//                 currentPath={window.location.pathname + window.location.search}
//                 onNavigate={(path) => navigate(path)}
//               />

//           {/* Export Buttons - Center/Right */}
//           {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//             <AntdButton
//               size="small"
//               onClick={exportTableToCSV}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 fontSize: '12px',
//                 height: '28px',
//                 padding: '0 8px',
//                 backgroundColor: '#4caf50',
//                 borderColor: '#4caf50',
//                 color: 'white'
//               }}
//             >
//               <img src="https://i.ibb.co/Fkjr9YSJ/CSV.png" alt="CSV" style={{ width: 16, height: 16, marginRight: 4 }} />
//               CSV
//             </AntdButton>
            
//             <AntdButton
//               size="small"
//               onClick={exportTableToPDF}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 fontSize: '12px',
//                 height: '28px',
//                 padding: '0 8px',
//                 backgroundColor: '#f44336',
//                 borderColor: '#f44336',
//                 color: 'white'
//               }}
//             >
//               <img src="https://i.ibb.co/tpdRcGg6/pdf.png" alt="PDF" style={{ width: 16, height: 16, marginRight: 4 }} />
//               PDF
//             </AntdButton> */}
//             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//             {/* ✅ ONLY SHOW EXPORT BUTTONS WHEN A SAVED REPORT IS LOADED */}
//             {isLoadedReport && (
//               <>
//                 <AntdButton
//                   size="small"
//                   onClick={exportTableToCSV}
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     fontSize: '12px',
//                     height: '28px',
//                     padding: '0 8px',
//                     backgroundColor: '#4caf50',
//                     borderColor: '#4caf50',
//                     color: 'white'
//                   }}
//                 >
//                   <img src="https://i.ibb.co/Fkjr9YSJ/CSV.png" alt="CSV" style={{ width: 16, height: 16, marginRight: 4 }} />
//                   CSV
//                 </AntdButton>
                
//                 <AntdButton
//                   size="small"
//                   onClick={exportTableToPDF}
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     fontSize: '12px',
//                     height: '28px',
//                     padding: '0 8px',
//                     backgroundColor: '#f44336',
//                     borderColor: '#f44336',
//                     color: 'white'
//                   }}
//                 >
//                   <img src="https://i.ibb.co/tpdRcGg6/pdf.png" alt="PDF" style={{ width: 16, height: 16, marginRight: 4 }} />
//                   PDF
//                 </AntdButton>
//               </>
//             )}
//             {/* Exit Button */}
//             <AntdButton
//               type="primary"
//               danger
//               size="small"
//               icon={<LogoutOutlined />}
//               onClick={() => navigate("/retentionpathway")}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 fontSize: '12px',
//                 height: '28px',
//                 padding: '0 8px'
//               }}
//             >
//               Exit
//             </AntdButton>
//           </Box>
//         </Box>
//         {children}
//       </MainContainer>

//       {/* Enhanced Columns Drawer Container */}
//       <ColumnsDrawerContainer open={columnsDrawerOpen}>
//         <StyledColumnsDrawer>
//           <ColumnsDrawerHeader>
//             <Box>
//               <Typography variant="h6" component="div">
//                 Data Fields
//               </Typography>
//               <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                 {selectedTable || 'No table selected'}
//               </Typography>
//             </Box>
//             <IconButton
//               color="inherit"
//               onClick={handleColumnsDrawerClose}
//               size="small"
//             >
//               <CloseIcon />
//             </IconButton>
//           </ColumnsDrawerHeader>
          
//           <Divider />
        
//           <Box sx={{ 
//             p: 2, 
//             flex: 1, 
//             display: 'flex', 
//             flexDirection: 'column'
//           }}>
//             {/* Info Section */}
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//               <Tooltip 
//                 title={
//                   <Box>
//                     <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
//                       💡 Drag & Drop Fields:
//                     </Typography>
//                     <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
//                       • Click category headers to expand/collapse
//                     </Typography>
//                     <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
//                       • Drag individual fields to create charts
//                     </Typography>
//                     <Typography variant="caption" sx={{ display: 'block' }}>
//                       • Fields are automatically categorized by data type
//                     </Typography>
//                   </Box>
//                 }
//                 arrow
//                 placement="left"
//                 sx={{
//                   '& .MuiTooltip-tooltip': {
//                     backgroundColor: 'info.main',
//                     color: 'info.contrastText',
//                     fontSize: '0.875rem',
//                     maxWidth: 350
//                   }
//                 }}
//               >
//                 <IconButton size="small" sx={{ color: 'info.main' }}>
//                   <InfoIcon />
//                 </IconButton>
//               </Tooltip>
//               <Typography variant="body2" color="text.secondary">
//                 Drag fields to create visualizations
//               </Typography>
//             </Box>
            
//             {columns.length > 0 ? (
//               <Box>
//                 {categoryDefinitions.map(categoryDef => {
//                   // Check if we have datatype information
//                   const hasDataTypeInfo = columnsInfo && columnsInfo.length > 0;
                  
//                   return hasDataTypeInfo ? (
//                     <CategoryCardWithTypes
//                       key={categoryDef.key}
//                       title={categoryDef.title}
//                       icon={categoryDef.icon}
//                       columns={finalCategorizedColumns[categoryDef.key] || []}
//                       category={categoryDef.key}
//                       description={categoryDef.description}
//                       columnsInfo={columnsInfo}
//                     />
//                   ) : (
//                     <CategoryCard
//                       key={categoryDef.key}
//                       title={categoryDef.title}
//                       icon={categoryDef.icon}
//                       columns={finalCategorizedColumns[categoryDef.key] || []}
//                       category={categoryDef.key}
//                       description={categoryDef.description}
//                     />
//                   );
//                 })}
//               </Box>
//             ) : (
//               <Box sx={{ 
//                 textAlign: 'center', 
//                 py: 4,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flex: 1
//               }}>
//                 <ColumnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary" gutterBottom>
//                   No Data Available
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   Select a table to view available columns
//                 </Typography>
//               </Box>
//             )}
//           </Box>
//         </StyledColumnsDrawer>
//       </ColumnsDrawerContainer>

//       {/* Toggle Button when drawer is closed */}
//       <ToggleButton id="toggle-columns" open={open} onClick={handleDrawerToggle}>
//         <MenuIcon />
//       </ToggleButton>
//     </RootContainer>
//   );
// };

// export default SidebarSSBI;



import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { styled, useTheme } from '@mui/material/styles';
import { LogoutOutlined } from "@ant-design/icons";
import InfoIcon from '@mui/icons-material/Info';

import { Button as AntdButton } from 'antd';
import {
  Box,
  Drawer,
  List,
  Typography,
  Tooltip, 
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Chip,
  Paper,
  Card,
  CardContent,
  Badge,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuList,
  ListItemIcon as MuiListItemIcon,
  Checkbox,
  ClickAwayListener,
  Popper
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  Save as SaveIcon,
  SmartToy as AIIcon,
  TableChart as TableIcon,
  ViewColumn as ColumnIcon,
  GetApp as ExportIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  DateRange as DateIcon,
  Functions as MeasureIcon,
  TextFields as TextIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  GetApp as TemplateIcon,
  Numbers as NumbersIcon,
  Filter as FilterIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 60;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? drawerWidth : collapsedWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : collapsedWidth,
    boxSizing: 'border-box',
    backgroundColor: '#1A1A2E',
    color: '#fff',
    borderRight: `1px solid ${theme.palette.divider}`,
    zIndex: theme.zIndex.drawer,
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
}));

// Root container - uses CSS Grid for proper layout with 3 columns
const RootContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
}));

// Main container
const MainContainer = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'columnsOpen',
})(({ theme, open, columnsOpen }) => ({
  gridColumn: 2,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: theme.spacing(3),
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.default,
  transition: theme.transitions.create(['margin-left', 'margin-right'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
}));

// Sidebar container
const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  gridColumn: 1,
  width: open ? drawerWidth : collapsedWidth,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflow: 'hidden',
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const SubMenuItem = styled(ListItemButton)(({ theme }) => ({
  paddingLeft: theme.spacing(4),
  paddingY: theme.spacing(0.5),
}));

// Columns drawer container - Updated for single scroll
const ColumnsDrawerContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  gridColumn: 3,
  width: open ? 320 : 0,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflow: 'hidden',
  ...(open && {
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledColumnsDrawer = styled(Box)(({ theme }) => ({
  width: 320,
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto', // Single scroll for entire drawer
}));

const ColumnsDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  justifyContent: 'space-between',
  minHeight: 64,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  flexShrink: 0,
}));

const ExportButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
}));

const BreadcrumbNavigation = ({ currentPath, onNavigate }) => {
  const getBreadcrumbs = (path) => {
    const breadcrumbs = [
      { label: 'Home', path: '/ssbi', icon: '🏠' }
    ];

    // ✅ FIXED: Handle all page types including file upload
    if (path.includes('create-dashboard')) {
      breadcrumbs.push({ label: 'Create Dashboard', path: '/create-dashboard' });
      
      if (path.includes('view=templates')) {
        breadcrumbs.push({ label: 'Templates', path: '/create-dashboard?view=templates' });
      }
    } else if (path.includes('ssbihome')) {
      breadcrumbs.push({ label: 'Dashboard', path: '/ssbihome' });
    } else if (path.includes('data-upload') || path.includes('file-upload') || path.includes('upload')) {
      // ✅ FIXED: Add breadcrumb for upload pages
      breadcrumbs.push({ label: 'Data Upload', path: '/data-upload' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: 'transparent',
      fontFamily : "var(--app-font-family)",
      fontSize: '14px',
      color: '#666'
    }}>
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span style={{ color: '#ccc', margin: '0 4px' }}>›</span>}
          <button
            onClick={() => onNavigate(crumb.path)}
            style={{
              background: 'none',
              border: 'none',
              color: index === breadcrumbs.length - 1 ? '#1976d2' : '#666',
              cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
              fontFamily : "var(--app-font-family)",
              fontSize: '14px',
              fontWeight: index === breadcrumbs.length - 1 ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: index !== breadcrumbs.length - 1 ? '#f5f5f5' : 'transparent'
              }
            }}
            disabled={index === breadcrumbs.length - 1}
          >
            {index === 0 && <span style={{ marginRight: '4px' }}>🏠</span>}
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// Enhanced Draggable Column Component
const DraggableColumn = ({ column, category, dataType }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getCategoryStyles = () => {
    return {
      backgroundColor: '#e3f2fd',
      color: '#1565c0',
      borderColor: '#1976d2',
      '&:hover': {
        backgroundColor: '#1976d2',
        color: '#fff',
        transform: 'scale(1.02)',
      }
    };
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    
    e.dataTransfer.setData('text/plain', column);
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'column', 
      data: column,
      category: category,
      dataType: dataType
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    e.target.style.opacity = '0.5';
    console.log('Drag started for column:', column, 'Category:', category, 'Type:', dataType);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    e.target.style.opacity = '1';
  };

  return (
    <Chip
      label={column}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      size="small"
      sx={{
        margin: 0.5,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        border: '1px solid',
        fontFamily : "var(--app-font-family)",
        fontSize: '0.75rem',
        height: '28px',
        ...getCategoryStyles(),
        '&:active': {
          cursor: 'grabbing',
        },
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

// Function to categorize columns by data type for filtering
const categorizeColumnsByDatatype = (columnsInfo) => {
  const categorized = {
    numbers: [],
    characters: [],
    datetime: [],
    all: []
  };

  if (!columnsInfo || !Array.isArray(columnsInfo)) {
    return categorized;
  }

  // Define data type mappings
  const numericTypes = new Set([
    'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 
    'double precision', 'serial', 'bigserial', 'smallserial',
    'int2', 'int4', 'int8', 'float4', 'float8', 'money', 'int', 'float', 'double'
  ]);
  
  const dateTimeTypes = new Set([
    'date', 'time', 'timestamp', 'timestamptz', 'timetz', 'interval',
    'timestamp without time zone', 'timestamp with time zone',
    'time without time zone', 'time with time zone', 'datetime'
  ]);
  
  const characterTypes = new Set([
    'character', 'character varying', 'varchar', 'char', 'text', 'string',
    'bpchar', 'name', 'citext', 'uuid', 'json', 'jsonb', 'xml', 'boolean', 'bool'
  ]);

  columnsInfo.forEach(colInfo => {
    const columnName = colInfo.column_name;
    const dataType = (colInfo.data_type || '').toLowerCase();
    const udtName = (colInfo.udt_name || '').toLowerCase();
    
    // Add to all columns
    categorized.all.push({ name: columnName, dataType: dataType || udtName });
    
    // Categorize based on data type
    if (numericTypes.has(dataType) || numericTypes.has(udtName)) {
      categorized.numbers.push({ name: columnName, dataType: dataType || udtName });
    } else if (dateTimeTypes.has(dataType) || dateTimeTypes.has(udtName)) {
      categorized.datetime.push({ name: columnName, dataType: dataType || udtName });
    } else if (characterTypes.has(dataType) || characterTypes.has(udtName)) {
      categorized.characters.push({ name: columnName, dataType: dataType || udtName });
    } else {
      // Default to characters for unknown types
      categorized.characters.push({ name: columnName, dataType: dataType || udtName });
    }
  });

  return categorized;
};

// Fallback categorization when no datatype info is available
const categorizeColumnsSimple = (columns) => {
  const allColumns = columns.map(col => ({ name: col, dataType: 'unknown' }));
  
  return {
    numbers: [],
    characters: allColumns,
    datetime: [],
    all: allColumns
  };
};

// Toggle button when sidebar is closed
const SidebarToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  position: 'fixed',
  top: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: theme.zIndex.drawer + 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  transition: theme.transitions.create(['opacity', 'transform'], {
    duration: theme.transitions.duration.shortest,
  }),
  opacity: open ? 0 : 1,
  transform: open ? 'scale(0)' : 'scale(1)',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// Single Column Item Component
const ColumnItem = ({ column, dataType, category }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    
    e.dataTransfer.setData('text/plain', column);
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'column', 
      data: column,
      category: category,
      dataType: dataType
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    e.target.style.opacity = '0.5';
    console.log('Drag started for column:', column, 'Category:', category, 'Type:', dataType);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    e.target.style.opacity = '1';
  };

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        border: '1px solid #1976d2',
        borderRadius: 1,
        padding: '8px 12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        fontFamily : "var(--app-font-family)",
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0.5,
        '&:hover': {
          backgroundColor: '#1976d2',
          color: '#fff',
          // Removed the transform to prevent shaking
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span>{column}</span>
      <Tooltip title={`Data Type: ${dataType}`} arrow>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.7rem',
            fontFamily : "var(--app-font-family)",
            opacity: 0.8,
            fontStyle: 'italic',
            ml: 1
          }}
        >
          {dataType}
        </Typography>
      </Tooltip>
    </Box>
  );
};

const SidebarSSBI = ({
  tables,
  selectedTable,
  setSelectedTable,
  columns,
  rows = [],
  // NEW PROPS for datatype support
  columnsInfo = [],
  categorizedColumns = null,
  // Existing props
  DraggableColumn: OriginalDraggableColumn,
  exportTableToCSV,
  exportTableToPDF,
  handleFileUpload,
  selectedAppendTable,
  setSelectedAppendTable,
  generateAppendTemplate,
  handleAppendUpload,
  reportName,
  setReportName,
  saveReport,
  savedReports,
  loadSavedReport,
  deleteSavedReport,
  question,
  setQuestion,
  fetchAiResponse,
  loadingAiResponse,
  aiResults,
  resetDashboard,
  handlePageChange,
  isTablePaneVisible,
  toggleTablePane,
  isLoadedReport = false,
  children,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [columnsDrawerOpen, setColumnsDrawerOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    ssbi: false,
    savedReports: false,
    aiAssistant: false,
  });

  // State for column filters
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // Categorize columns using useMemo for performance
  const categorizedColumnData = useMemo(() => {
    // If we have columns info with datatypes, categorize them
    if (columnsInfo && columnsInfo.length > 0) {
      return categorizeColumnsByDatatype(columnsInfo);
    }
    
    // Fallback to simple categorization
    return categorizeColumnsSimple(columns);
  }, [columnsInfo, columns]);

  // Filter columns based on active filters
  const filteredColumns = useMemo(() => {
    if (activeFilters.includes('all')) {
      return categorizedColumnData.all;
    }
    
    let filtered = [];
    if (activeFilters.includes('numbers')) {
      filtered = [...filtered, ...categorizedColumnData.numbers];
    }
    if (activeFilters.includes('characters')) {
      filtered = [...filtered, ...categorizedColumnData.characters];
    }
    if (activeFilters.includes('datetime')) {
      filtered = [...filtered, ...categorizedColumnData.datetime];
    }
    
    // Remove duplicates
    const uniqueFiltered = filtered.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name)
    );
    
    return uniqueFiltered;
  }, [categorizedColumnData, activeFilters]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuToggle = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  const handleColumnsDrawerOpen = () => {
    setColumnsDrawerOpen(true);
    setOpen(false);
  };

  const handleColumnsDrawerClose = () => {
    setColumnsDrawerOpen(false);
    setOpen(true);
  };

  const handleFilterChange = (event, newFilters) => {
    // If nothing is selected, default to 'all'
    if (newFilters.length === 0) {
      setActiveFilters(['all']);
    } else {
      // If 'all' is clicked, deselect everything else
      if (newFilters.includes('all') && !activeFilters.includes('all')) {
        setActiveFilters(['all']);
      } else if (newFilters.includes('all') && activeFilters.includes('all')) {
        // If 'all' was already selected and another filter is clicked, remove 'all'
        setActiveFilters(newFilters.filter(filter => filter !== 'all'));
      } else {
        // Normal multi-selection
        setActiveFilters(newFilters);
      }
    }
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
    setFilterMenuOpen(true);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuOpen(false);
    setFilterAnchorEl(null);
  };

  const handleFilterOptionToggle = (filterValue) => {
    let newFilters;
    
    if (filterValue === 'all') {
      newFilters = ['all'];
    } else {
      if (activeFilters.includes(filterValue)) {
        // Remove the filter
        newFilters = activeFilters.filter(f => f !== filterValue);
        // If no specific filters left, default to 'all'
        if (newFilters.length === 0 || (newFilters.length === 1 && newFilters[0] === 'all')) {
          newFilters = ['all'];
        }
      } else {
        // Add the filter and remove 'all' if it was selected
        newFilters = activeFilters.filter(f => f !== 'all');
        newFilters.push(filterValue);
      }
    }
    
    setActiveFilters(newFilters);
  };

  // Get filter button text
  const getFilterButtonText = () => {
    if (activeFilters.includes('all')) {
      return `All Columns (${categorizedColumnData.all.length})`;
    }
    
    const count = filteredColumns.length;
    if (activeFilters.length === 1) {
      const filter = activeFilters[0];
      const filterNames = {
        numbers: 'Numbers',
        characters: 'Characters', 
        datetime: 'DateTime'
      };
      return `${filterNames[filter]} (${count})`;
    }
    
    return `${activeFilters.length} Types Selected (${count})`;
  };

  return (
    <RootContainer>
      {/* Sidebar Container */}
      <SidebarContainer open={open}>
        <StyledDrawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            width: open ? drawerWidth : 0,
            fontFamily : "var(--app-font-family)",
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              position: 'relative',
            },
          }}
        >
          <DrawerHeader>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontFamily : "var(--app-font-family)",
                fontSize: "2rem",
                fontWeight: 700,
                fontStyle: "italic",
                letterSpacing: "1px",
                background: "linear-gradient(to right, #1e356b, #0284c7, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                transition: "transform 0.3s ease, letter-spacing 0.3s ease",
              }}
            >
              Dashboard
            </Typography>

            <IconButton
              style={{ color: 'white' }}
              onClick={handleDrawerToggle}
            >
              {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          
          <Divider />
          
          <List>
            <Divider />

            {/* SSBI Menu */}
            <ListItem disablePadding>
              <ListItemButton sx={{
                fontFamily : "var(--app-font-family)",
                '&:hover': {
                  background: 'linear-gradient(to right, rgba(106,90,205,0.55), rgba(209,107,165,0.55))',
                  color: '#4cc9f0',
                  borderRadius: '12px',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(to right, rgba(106,90,205,0.25), rgba(209,107,165,0.25))',
                  color: '#4cc9f0',
                  borderRadius: '12px',
                },
                '.MuiListItemIcon-root': {
                  color: '#ecf0f1',
                  minWidth: '40px',
                },
              }} onClick={() => handleMenuToggle('ssbi')}>
                <ListItemIcon sx={{ color: '#fff' , fontFamily : "var(--app-font-family)", }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="SSBI"  sx={{fontFamily : "var(--app-font-family)",}}/>
                {expandedMenus.ssbi ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={expandedMenus.ssbi} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                <SubMenuItem 
                  onClick={() => navigate('/create-dashboard', { replace: true })}
                  sx={{
                    fontFamily : "var(--app-font-family)",
                    backgroundColor: window.location.pathname.includes('create-dashboard') 
                      ? 'rgba(25, 118, 210, 0.2)' 
                      : 'transparent'
                  }}
                >
                  <ListItemIcon sx={{ color: '#fff', fontFamily : "var(--app-font-family)",}}>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Create Dashboard" sx={{fontFamily : "var(--app-font-family)",}}/>
                  {window.location.pathname.includes('create-dashboard') && (
                    <div style={{
                      width: '4px',
                      height: '20px',
                      backgroundColor: '#1976d2',
                      borderRadius: '2px',
                      marginLeft: '8px',
                      fontFamily : "var(--app-font-family)",
                    }} />
                  )}
                </SubMenuItem>

                {/* Tables Submenu */}
                <SubMenuItem>
                  <ListItemIcon sx={{ color: '#fff' , fontFamily : "var(--app-font-family)", }}>
                    <TableIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tables" sx={{fontFamily : "var(--app-font-family)",}} />
                </SubMenuItem>
                
                <Box sx={{ px: 3, pb: 2 , fontFamily : "var(--app-font-family)",}}>
                  <FormControl fullWidth size="small" sx={{ '& .MuiInputLabel-root': { color: '#fff' } , fontFamily : "var(--app-font-family)", }}>
                    <InputLabel sx={{ color: '#fff' , fontFamily : "var(--app-font-family)", }}>Select Table</InputLabel>
                    <Select
                      id="table-dropdown"
                      value={selectedTable}
                      label="Select Table"
                      onChange={handleTableChange}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '& .MuiSvgIcon-root': { color: '#fff' },
                        fontFamily : "var(--app-font-family)",
                      }}
                      MenuProps={{
                        disablePortal: true,
                        PaperProps: {
                          sx: {
                            bgcolor: '#1A1A2E',
                            color: '#fff',
                          },
                        },
                      }}
                    >
                      {tables.length > 0 ? (
                        tables.map((table, index) => (
                          <MenuItem
                            id={index === 0 ? "table-option-1" : undefined}
                            key={index}
                            value={table}
                            sx={{
                              color: '#fff',
                              fontFamily : "var(--app-font-family)",
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              maxWidth: '200px',
                            }}
                          >
                            {table}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="">Loading tables...</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Box>

                {/* Columns Submenu - Opens Drawer */}
                <SubMenuItem onClick={handleColumnsDrawerOpen}>
                  <ListItemIcon sx={{ color: '#fff' , fontFamily : "var(--app-font-family)",}}>
                    <ColumnIcon />
                  </ListItemIcon>
                  <ListItemText primary="Columns" sx={{fontFamily : "var(--app-font-family)",}} />
                  <ChevronRightIcon />
                </SubMenuItem>

                <SubMenuItem onClick={() => {
                  // Check current route and navigate accordingly
                  const currentPath = window.location.pathname;
                  if (currentPath.includes('upload') || currentPath.includes('file-upload') || currentPath.includes('data-upload')) {
                    // Already on upload page, don't navigate
                    console.log('Already on upload page');
                  } else {
                    // Navigate to your upload page route
                    navigate('/data-upload'); // Or whatever your upload route is
                  }
                }}>
                  <ListItemIcon sx={{ color: '#fff', fontFamily : "var(--app-font-family)",}}>
                    <UploadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Upload Data" sx={{fontFamily : "var(--app-font-family)",}}/>
                </SubMenuItem>
              </List>
            </Collapse>

            <Divider />

            {/* Saved Reports Menu */}
            <ListItem disablePadding>
              <ListItemButton sx={{
                fontFamily : "var(--app-font-family)",
                '&:hover': {
                  background: 'linear-gradient(to right, rgba(106,90,205,0.55), rgba(209,107,165,0.55))',
                  color: '#4cc9f0',
                  borderRadius: '12px',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(to right, rgba(106,90,205,0.25), rgba(209,107,165,0.25))',
                  color: '#4cc9f0',
                  borderRadius: '12px',
                },
                '.MuiListItemIcon-root': {
                  color: '#ecf0f1',
                  minWidth: '40px',
                },
              }} onClick={() => handleMenuToggle('savedReports')}>
                <ListItemIcon sx={{ color: '#fff', fontFamily : "var(--app-font-family)", }}>
                  <SaveIcon />
                </ListItemIcon>
                <ListItemText primary="Saved Reports" sx={{fontFamily : "var(--app-font-family)",}} />
                {expandedMenus.savedReports ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={expandedMenus.savedReports} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Save Report Section */}
                <Box sx={{ px: 3, py: 2 , fontFamily : "var(--app-font-family)",}}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Report Name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    sx={{
                      fontFamily : "var(--app-font-family)",
                      mb: 2,
                      '& .MuiInputLabel-root': { color: '#fff' },
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: '#fff' },
                        '&:hover fieldset': { borderColor: '#fff' },
                        '&.Mui-focused fieldset': { borderColor: '#fff' },
                        
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#fff',
                      },
                      
                    }}
                    InputProps={{ style: { color: '#fff' } }}
                    InputLabelProps={{ style: { color: '#fff' } }}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    onClick={saveReport}
                    startIcon={<SaveIcon />}
                    style={{fontFamily : "var(--app-font-family)",}}
                  >
                    Save Report
                  </Button>
                </Box>

                <Divider />

                {/* Saved Reports List */}
                <Box sx={{ px: 2, py: 1 , fontFamily : "var(--app-font-family)",}}>
                  <Typography variant="subtitle2" sx={{px: 1, py: 1, color: '#fff', fontFamily : "var(--app-font-family)", }}>
                    Saved Reports
                  </Typography>
                  
                  {!savedReports || savedReports.length === 0 ? (
                    <Box sx={{ px: 1, py: 2, textAlign: 'center', fontFamily : "var(--app-font-family)", }}>
                      <Typography variant="body2" sx={{ px: 1, py: 1, color: '#fff' , fontFamily : "var(--app-font-family)", }}>
                        No saved reports found
                      </Typography>
                    </Box>
                  ) : (
                    savedReports.map((report, index) => (
                      <Box
                        key={report.id || report.name || index}
                        sx={{
                          fontFamily : "var(--app-font-family)",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            cursor: 'pointer',
                            flex: 1,
                            textAlign: 'left',
                            padding: '4px 8px',
                            fontFamily : "var(--app-font-family)",
                            borderRadius: 1,
                            color: '#fff',
                            '&:hover': { 
                              color: 'primary.main',
                              backgroundColor: 'primary.light',
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Loading report:', report.id || report.name);
                            loadSavedReport(report.id || report.name);
                          }}
                        >
                          {report.name || report.report_name || `Report ${index + 1}`}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Deleting report:', report.id || report.name);
                            deleteSavedReport(report.id || report.name);
                          }}
                          sx={{ 
                            fontFamily : "var(--app-font-family)",
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Box>
              </List>
            </Collapse>

            <Divider />
          </List>
        </StyledDrawer>
      </SidebarContainer>

      {/* Main Content Area */}
      <MainContainer open={open} columnsOpen={columnsDrawerOpen}>
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0px 8px',
            minHeight: '40px',
            backgroundColor: 'transparent',
            fontFamily : "var(--app-font-family)",
            paddingBottom: '10px',
          }}>
            {/* REPLACE Back Button with Breadcrumb */}
            <BreadcrumbNavigation 
              currentPath={window.location.pathname + window.location.search}
              onNavigate={(path) => navigate(path)}
            />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' , fontFamily : "var(--app-font-family)",}}>
            {/* ✅ ONLY SHOW EXPORT BUTTONS WHEN A SAVED REPORT IS LOADED */}
            {isLoadedReport && (
              <>
                <AntdButton
                  size="small"
                  onClick={exportTableToCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontFamily : "var(--app-font-family)",
                    height: '28px',
                    padding: '0 8px',
                    backgroundColor: '#4caf50',
                    borderColor: '#4caf50',
                    color: 'white'
                  }}
                >
                  <img src="https://i.ibb.co/Fkjr9YSJ/CSV.png" alt="CSV" style={{ width: 16, height: 16, marginRight: 4 }} />
                  CSV
                </AntdButton>
                
                <AntdButton
                  size="small"
                  onClick={exportTableToPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontFamily : "var(--app-font-family)",
                    height: '28px',
                    padding: '0 8px',
                    backgroundColor: '#f44336',
                    borderColor: '#f44336',
                    color: 'white'
                  }}
                >
                  <img src="https://i.ibb.co/tpdRcGg6/pdf.png" alt="PDF" style={{ width: 16, height: 16, marginRight: 4 }} />
                  PDF
                </AntdButton>
              </>
            )}
            {/* Exit Button */}
            <AntdButton
              type="primary"
              danger
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => navigate("/retentionpathway")}
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                fontFamily : "var(--app-font-family)",
                height: '28px',
                padding: '0 8px'
              }}
            >
              Exit
            </AntdButton>
          </Box>
        </Box>
        {children}
      </MainContainer>

      {/* Enhanced Columns Drawer Container with Filters */}
      <ColumnsDrawerContainer open={columnsDrawerOpen}>
        <StyledColumnsDrawer>
          <ColumnsDrawerHeader>
            <Box>
              <Typography variant="h6" component="div">
                Data Fields
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 , fontFamily : "var(--app-font-family)",}}>
                {selectedTable || 'No table selected'}
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={handleColumnsDrawerClose}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </ColumnsDrawerHeader>
          
          <Divider />
        
          <Box sx={{ 
            p: 2, 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            fontFamily : "var(--app-font-family)",
          }}>
            {/* Info Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 , fontFamily : "var(--app-font-family)",}}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 , fontFamily : "var(--app-font-family)",}}>
                      💡 Filter & Drag Fields:
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 , fontFamily : "var(--app-font-family)",}}>
                      • Use filter buttons to show specific data types
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 , fontFamily : "var(--app-font-family)", }}>
                      • Multiple filters can be selected at once
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' , fontFamily : "var(--app-font-family)", }}>
                      • Drag individual fields to create charts
                    </Typography>
                  </Box>
                }
                arrow
                placement="left"
                sx={{fontFamily : "var(--app-font-family)",
                  '& .MuiTooltip-tooltip': {
                    backgroundColor: 'info.main',
                    color: 'info.contrastText',
                    fontSize: '0.875rem',
                    
                    maxWidth: 350
                  }
                }}
              >
                <IconButton size="small" sx={{ color: 'info.main' , fontFamily : "var(--app-font-family)",}}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary">
                Filter and drag fields to create visualizations
              </Typography>
            </Box>
            
            {/* Filter Dropdown Button */}
            <Box sx={{ mb: 2 , fontFamily : "var(--app-font-family)", }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 , fontFamily : "var(--app-font-family)",}}>
                <FilterIcon sx={{ fontSize: '1rem', color: 'text.secondary', fontFamily : "var(--app-font-family)", }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Data Type Filters
                </Typography>
              </Box>
              
              <Box sx={{ position: 'relative' , fontFamily : "var(--app-font-family)", }}>
                <Button
                  variant="outlined"
                  onClick={handleFilterMenuOpen}
                  endIcon={<ArrowDownIcon />}
                  sx={{
                    fontFamily : "var(--app-font-family)",
                    width: '100%',
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    padding: '12px 16px',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                    '& .MuiButton-endIcon': {
                      marginLeft: 'auto',
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 , fontFamily : "var(--app-font-family)", }}>
                    {getFilterButtonText()}
                  </Typography>
                </Button>

                <Popper
                  open={filterMenuOpen}
                  anchorEl={filterAnchorEl}
                  placement="bottom-start"
                  sx={{ zIndex: 1300, width: filterAnchorEl?.offsetWidth , fontFamily : "var(--app-font-family)", }}
                  modifiers={[
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 4],
                      },
                    },
                  ]}
                >
                  <ClickAwayListener onClickAway={handleFilterMenuClose}>
                    <Paper
                      elevation={8}
                      sx={{
                        fontFamily : "var(--app-font-family)",
                        width: '100%',
                        minWidth: 280,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mt: 0.5,
                      }}
                    >
                      <MenuList dense>
                        {/* All Option */}
                        <MenuItem
                          onClick={() => handleFilterOptionToggle('all')}
                          sx={{
                            fontFamily : "var(--app-font-family)",
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <MuiListItemIcon sx={{ minWidth: 36 , fontFamily : "var(--app-font-family)",}}>
                            <Checkbox
                              checked={activeFilters.includes('all')}
                              size="small"
                              sx={{ p: 0 , fontFamily : "var(--app-font-family)", }}
                            />
                          </MuiListItemIcon>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 , fontFamily : "var(--app-font-family)", }}>
                            <CategoryIcon sx={{ fontSize: '1.1rem', color: 'action.active' , fontFamily : "var(--app-font-family)", }} />
                            <Typography variant="body2" sx={{ flex: 1 , fontFamily : "var(--app-font-family)",}}>
                              All Columns
                            </Typography>
                            <Badge 
                              badgeContent={categorizedColumnData.all.length} 
                              sx={{
                                fontFamily : "var(--app-font-family)",
                                '& .MuiBadge-badge': {
                                  backgroundColor: 'primary.main',
                                  color: 'primary.contrastText',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  
                                },
                              }}
                            />
                          </Box>
                        </MenuItem>

                        <Divider />

                        {/* Numbers Option */}
                        <MenuItem
                          onClick={() => handleFilterOptionToggle('numbers')}
                          sx={{fontFamily : "var(--app-font-family)",
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <MuiListItemIcon sx={{ minWidth: 36 , fontFamily : "var(--app-font-family)",}}>
                            <Checkbox
                              checked={activeFilters.includes('numbers')}
                              size="small"
                              sx={{ p: 0 , fontFamily : "var(--app-font-family)", }}
                            />
                          </MuiListItemIcon>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 , fontFamily : "var(--app-font-family)", }}>
                            <NumbersIcon sx={{ fontSize: '1.1rem', color: 'success.main' , fontFamily : "var(--app-font-family)", }} />
                            <Typography variant="body2" sx={{ flex: 1 , fontFamily : "var(--app-font-family)",}}>
                              Numbers
                            </Typography>
                            <Badge 
                              badgeContent={categorizedColumnData.numbers.length} 
                              sx={{fontFamily : "var(--app-font-family)",
                                '& .MuiBadge-badge': {
                                  backgroundColor: 'success.main',
                                  color: 'success.contrastText',
                                  fontSize: '0.7rem',
                                  
                                  fontWeight: 'bold',
                                },
                              }}
                            />
                          </Box>
                        </MenuItem>

                        {/* Characters Option */}
                        <MenuItem
                          onClick={() => handleFilterOptionToggle('characters')}
                          sx={{fontFamily : "var(--app-font-family)",
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <MuiListItemIcon sx={{ minWidth: 36 , fontFamily : "var(--app-font-family)", }}>
                            <Checkbox
                              checked={activeFilters.includes('characters')}
                              size="small"
                              sx={{ p: 0 , fontFamily : "var(--app-font-family)",}}
                            />
                          </MuiListItemIcon>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 , fontFamily : "var(--app-font-family)",}}>
                            <TextIcon sx={{ fontSize: '1.1rem', color: 'info.main' , fontFamily : "var(--app-font-family)",}} />
                            <Typography variant="body2" sx={{ flex: 1 , fontFamily : "var(--app-font-family)", }}>
                              Characters
                            </Typography>
                            <Badge 
                              badgeContent={categorizedColumnData.characters.length} 
                              sx={{
                                fontFamily : "var(--app-font-family)",
                                '& .MuiBadge-badge': {
                                  backgroundColor: 'info.main',
                                  color: 'info.contrastText',
                                  fontSize: '0.7rem',
                                  
                                  fontWeight: 'bold',
                                },
                              }}
                            />
                          </Box>
                        </MenuItem>

                        {/* DateTime Option */}
                        <MenuItem
                          onClick={() => handleFilterOptionToggle('datetime')}
                          sx={{ fontFamily : "var(--app-font-family)",
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <MuiListItemIcon sx={{ minWidth: 36 , fontFamily : "var(--app-font-family)",}}>
                            <Checkbox
                              checked={activeFilters.includes('datetime')}
                              size="small"
                              sx={{ p: 0 , fontFamily : "var(--app-font-family)", }}
                            />
                          </MuiListItemIcon>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 , fontFamily : "var(--app-font-family)",}}>
                            <DateIcon sx={{ fontSize: '1.1rem', color: 'warning.main' , fontFamily : "var(--app-font-family)",}} />
                            <Typography variant="body2" sx={{ flex: 1 , fontFamily : "var(--app-font-family)",}}>
                              DateTime
                            </Typography>
                            <Badge 
                              badgeContent={categorizedColumnData.datetime.length} 
                              sx={{
                                fontFamily : "var(--app-font-family)",
                                '& .MuiBadge-badge': {
                                  backgroundColor: 'warning.main',
                                  color: 'warning.contrastText',
                                  fontSize: '0.7rem',
                                  
                                  fontWeight: 'bold',
                                },
                              }}
                            />
                          </Box>
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 , fontFamily : "var(--app-font-family)", }} />
            
            {/* Columns List */}
            {filteredColumns.length > 0 ? (
              <Box sx={{ flex: 1, overflowY: 'auto' , fontFamily : "var(--app-font-family)", }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' , fontFamily : "var(--app-font-family)", }}>
                  Available Columns ({filteredColumns.length})
                </Typography>
                <Box>
                  {filteredColumns.map((columnData, index) => (
                    <ColumnItem
                      key={`${columnData.name}-${index}`}
                      column={columnData.name}
                      dataType={columnData.dataType}
                      category={
                        categorizedColumnData.numbers.some(item => item.name === columnData.name) ? 'numbers' :
                        categorizedColumnData.datetime.some(item => item.name === columnData.name) ? 'datetime' :
                        'characters'
                      }
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                fontFamily : "var(--app-font-family)",
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}>
                <ColumnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 , fontFamily : "var(--app-font-family)",}} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a table to view available columns
                </Typography>
              </Box>
            )}
          </Box>
        </StyledColumnsDrawer>
      </ColumnsDrawerContainer>

      {/* Toggle Button when drawer is closed */}
      <SidebarToggleButton id="toggle-columns" open={open} onClick={handleDrawerToggle}>
        <MenuIcon />
      </SidebarToggleButton>
    </RootContainer>
  );
};

export default SidebarSSBI;