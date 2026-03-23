// import React, { useState, useMemo } from 'react';

// const FilterPanel = ({ rows, slicers, setSlicers }) => {
//   const [openDropdowns, setOpenDropdowns] = useState({});

//   // Get unique values for each column that has a slicer
//   const getUniqueValues = (column) => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
    
//     const values = rows
//       .map(row => row[column])
//       .filter(val => val !== null && val !== undefined && val !== '')
//       .map(val => String(val).trim())
//       .filter((val, index, arr) => arr.indexOf(val) === index)
//       .sort();
    
//     return values;
//   };

//   // Handle filter value changes
//   const handleSlicerChange = (column, value, isChecked) => {
//     const currentValues = slicers[column] || [];
//     let newValues;

//     if (value === "Select All") {
//       if (isChecked) {
//         const allValues = getUniqueValues(column);
//         newValues = ["Select All", ...allValues];
//       } else {
//         newValues = [];
//       }
//     } else {
//       if (isChecked) {
//         newValues = [...currentValues.filter(v => v !== "Select All"), value];
//         const allUniqueValues = getUniqueValues(column);
//         if (newValues.length === allUniqueValues.length) {
//           newValues = ["Select All", ...allUniqueValues];
//         }
//       } else {
//         newValues = currentValues.filter(v => v !== value && v !== "Select All");
//       }
//     }

//     setSlicers({
//       ...slicers,
//       [column]: newValues
//     });
//   };

//   // Add a new slicer for a column
//   const addSlicer = (column) => {
//     if (!slicers[column]) {
//       setSlicers({
//         ...slicers,
//         [column]: ["Select All"]
//       });
//     }
//   };

//   // Remove a slicer
//   const removeSlicer = (column) => {
//     const newSlicers = { ...slicers };
//     delete newSlicers[column];
//     setSlicers(newSlicers);
//     // Close dropdown when removing slicer
//     setOpenDropdowns(prev => {
//       const newOpen = { ...prev };
//       delete newOpen[column];
//       return newOpen;
//     });
//   };

//   // Toggle dropdown
//   const toggleDropdown = (column) => {
//     setOpenDropdowns(prev => ({
//       ...prev,
//       [column]: !prev[column]
//     }));
//   };

//   // Get available columns for adding new slicers
//   const availableColumns = useMemo(() => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
//     const allColumns = Object.keys(rows[0] || {});
//     return allColumns.filter(col => !slicers[col]);
//   }, [rows, slicers]);

//   const slicerEntries = Object.entries(slicers);

//   return (
//     // <div style={{
//     // //   position: 'fixed',
//     // //   top: 0,
//     //   left: 0,
//     //   right: 0,
//     //   backgroundColor: 'white',
//     //   borderBottom: '1px solid #e5e7eb',
//     //   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//     //   zIndex: 1000,
//     //   padding: '16px 24px'
//     // }}>
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: '16px',
//         flexWrap: 'wrap'
//       }}>
//         {/* Filter Icon and Title */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           color: '#374151',
//           fontSize: '14px',
//           fontWeight: '500'
//         }}>
//           {/* <span style={{
//             width: '16px',
//             height: '16px',
//             display: 'inline-flex',
//             alignItems: 'center',
//             justifyContent: 'center'
//           }}>⚙</span> */}
//           Filters
//         </div>

//         {/* Active Filter Dropdowns */}
//         {slicerEntries.map(([column, selectedValues]) => {
//           const uniqueValues = getUniqueValues(column);
//           const allSelected = selectedValues.includes("Select All");
//           const isOpen = openDropdowns[column];
          
//           return (
//             <div key={column} style={{ position: 'relative' }}>
//               <button
//                 onClick={() => toggleDropdown(column)}
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '8px',
//                   padding: '8px 12px',
//                   backgroundColor: selectedValues.length === 0 ? '#f3f4f6' : '#3b82f6',
//                   color: selectedValues.length === 0 ? '#6b7280' : 'white',
//                   border: '1px solid',
//                   borderColor: selectedValues.length === 0 ? '#d1d5db' : '#3b82f6',
//                   borderRadius: '6px',
//                   fontSize: '13px',
//                   fontWeight: '500',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s'
//                 }}
//               >
//                 <span>{column}</span>
//                 {selectedValues.length > 0 && !allSelected && (
//                   <span style={{
//                     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//                     borderRadius: '10px',
//                     padding: '2px 6px',
//                     fontSize: '11px',
//                     minWidth: '18px',
//                     textAlign: 'center'
//                   }}>
//                     {selectedValues.length}
//                   </span>
//                 )}
//                 <span style={{
//                   display: 'inline-flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   width: '14px',
//                   height: '14px',
//                   transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//                   transition: 'transform 0.2s'
//                 }}>▼</span>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeSlicer(column);
//                   }}
//                   style={{
//                     padding: '2px',
//                     backgroundColor: 'transparent',
//                     border: 'none',
//                     color: 'inherit',
//                     cursor: 'pointer',
//                     borderRadius: '2px',
//                     display: 'flex',
//                     alignItems: 'center'
//                   }}
//                 >
//                   <span style={{
//                     display: 'inline-flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     width: '12px',
//                     height: '12px',
//                     fontSize: '10px'
//                   }}>×</span>
//                 </button>
//               </button>

//               {/* Dropdown Menu */}
//               {isOpen && (
//                 <div style={{
//                   position: 'absolute',
//                   top: '100%',
//                   left: 0,
//                   marginTop: '4px',
//                   backgroundColor: 'white',
//                   border: '1px solid #e5e7eb',
//                   borderRadius: '8px',
//                   boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
//                   minWidth: '200px',
//                   maxWidth: '300px',
//                   zIndex: 1001
//                 }}>
//                   <div style={{
//                     padding: '12px',
//                     borderBottom: '1px solid #f3f4f6'
//                   }}>
//                     <div style={{
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#374151',
//                       marginBottom: '8px'
//                     }}>
//                       {column}
//                     </div>
                    
//                     {/* Select All */}
//                     <label style={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: '8px',
//                       padding: '4px 0',
//                       cursor: 'pointer',
//                       fontSize: '13px',
//                       fontWeight: '500'
//                     }}>
//                       <input
//                         type="checkbox"
//                         checked={allSelected}
//                         onChange={(e) => handleSlicerChange(column, "Select All", e.target.checked)}
//                         style={{
//                           width: '16px',
//                           height: '16px',
//                           accentColor: '#3b82f6'
//                         }}
//                       />
//                       Select All ({uniqueValues.length})
//                     </label>
//                   </div>

//                   {/* Options List */}
//                   <div style={{
//                     maxHeight: '200px',
//                     overflowY: 'auto',
//                     padding: '8px 12px'
//                   }}>
//                     {uniqueValues.map((value) => (
//                       <label key={value} style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '8px',
//                         padding: '6px 0',
//                         cursor: 'pointer',
//                         fontSize: '12px',
//                         color: '#4b5563'
//                       }}>
//                         <input
//                           type="checkbox"
//                           checked={allSelected || selectedValues.includes(value)}
//                           onChange={(e) => handleSlicerChange(column, value, e.target.checked)}
//                           style={{
//                             width: '14px',
//                             height: '14px',
//                             accentColor: '#3b82f6'
//                           }}
//                         />
//                         {value}
//                       </label>
//                     ))}
//                   </div>

//                   <div style={{
//                     padding: '8px 12px',
//                     backgroundColor: '#f9fafb',
//                     borderTop: '1px solid #f3f4f6',
//                     fontSize: '11px',
//                     color: '#6b7280',
//                     textAlign: 'center'
//                   }}>
//                     {selectedValues.length === 0 ? 'No items selected' :
//                      allSelected ? 'All items selected' :
//                      `${selectedValues.length} of ${uniqueValues.length} selected`}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         {/* Add New Filter Dropdown */}
//         {availableColumns.length > 0 && (
//           <select
//             onChange={(e) => {
//               if (e.target.value) {
//                 addSlicer(e.target.value);
//                 e.target.value = "";
//               }
//             }}
//             style={{
//               padding: '8px 12px',
//               backgroundColor: '#f9fafb',
//               border: '1px solid #d1d5db',
//               borderRadius: '6px',
//               fontSize: '13px',
//               color: '#6b7280',
//               cursor: 'pointer',
//               outline: 'none'
//             }}
//           >
//             <option value="">+ Add Filter</option>
//             {availableColumns.map(col => (
//               <option key={col} value={col}>{col}</option>
//             ))}
//           </select>
//         )}

//         {/* Clear All Filters */}
//         {slicerEntries.length > 0 && (
//           <button
//             onClick={() => setSlicers({})}
//             style={{
//               padding: '8px 12px',
//               backgroundColor: 'transparent',
//               border: '1px solid #dc2626',
//               borderRadius: '6px',
//               color: '#dc2626',
//               fontSize: '13px',
//               cursor: 'pointer',
//               fontWeight: '500',
//               transition: 'all 0.2s'
//             }}
//             onMouseOver={(e) => {
//               e.target.style.backgroundColor = '#dc2626';
//               e.target.style.color = 'white';
//             }}
//             onMouseOut={(e) => {
//               e.target.style.backgroundColor = 'transparent';
//               e.target.style.color = '#dc2626';
//             }}
//           >
//             Clear All
//           </button>
//         )}
//       </div>

//     // </div>
//   );
// };

// export default FilterPanel;


// import React, { useState, useMemo } from 'react';

// const FilterPanel = ({ rows, slicers, setSlicers }) => {
//   const [openDropdowns, setOpenDropdowns] = useState({});

//   // Get unique values for each column that has a slicer
//   const getUniqueValues = (column) => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
    
//     const values = rows
//       .map(row => row[column])
//       .filter(val => val !== null && val !== undefined && val !== '')
//       .map(val => String(val).trim())
//       .filter((val, index, arr) => arr.indexOf(val) === index)
//       .sort();
    
//     return values;
//   };

//   // Handle filter value changes
//   const handleSlicerChange = (column, value, isChecked) => {
//     const currentValues = slicers[column] || [];
//     let newValues;

//     if (value === "Select All") {
//       if (isChecked) {
//         const allValues = getUniqueValues(column);
//         newValues = ["Select All", ...allValues];
//       } else {
//         newValues = [];
//       }
//     } else {
//       if (isChecked) {
//         newValues = [...currentValues.filter(v => v !== "Select All"), value];
//         const allUniqueValues = getUniqueValues(column);
//         if (newValues.length === allUniqueValues.length) {
//           newValues = ["Select All", ...allUniqueValues];
//         }
//       } else {
//         newValues = currentValues.filter(v => v !== value && v !== "Select All");
//       }
//     }

//     setSlicers({
//       ...slicers,
//       [column]: newValues
//     });
//   };

//   // Add a new slicer for a column
//   const addSlicer = (column) => {
//     if (!slicers[column]) {
//       setSlicers({
//         ...slicers,
//         [column]: ["Select All"]
//       });
//     }
//   };

//   // Remove a slicer
//   const removeSlicer = (column) => {
//     const newSlicers = { ...slicers };
//     delete newSlicers[column];
//     setSlicers(newSlicers);
//     // Close dropdown when removing slicer
//     setOpenDropdowns(prev => {
//       const newOpen = { ...prev };
//       delete newOpen[column];
//       return newOpen;
//     });
//   };

//   // Toggle dropdown
//   const toggleDropdown = (column) => {
//     setOpenDropdowns(prev => ({
//       ...prev,
//       [column]: !prev[column]
//     }));
//   };

//   // Get display text for selected values
//   const getDisplayText = (column, selectedValues) => {
//     if (!selectedValues || selectedValues.length === 0) {
//       return "None selected";
//     }
    
//     const allSelected = selectedValues.includes("Select All");
//     if (allSelected) {
//       return "All";
//     }
    
//     if (selectedValues.length === 1) {
//       return selectedValues[0];
//     }
    
//     if (selectedValues.length <= 2) {
//       return selectedValues.join(", ");
//     }
    
//     return `${selectedValues[0]} +${selectedValues.length - 1} more`;
//   };

//   // Get available columns for adding new slicers
//   const availableColumns = useMemo(() => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
//     const allColumns = Object.keys(rows[0] || {});
//     return allColumns.filter(col => !slicers[col]);
//   }, [rows, slicers]);

//   const slicerEntries = Object.entries(slicers);

//   return (
//     <div style={{
//       display: 'flex',
//       alignItems: 'flex-start',
//       gap: '12px',
//       flexWrap: 'wrap',
//       padding: '16px 0'
//     }}>
//       {/* Filter Title */}
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: '8px',
//         color: '#374151',
//         fontSize: '14px',
//         fontWeight: '600',
//         marginRight: '8px'
//       }}>
//         Filters:
//       </div>

//       {/* Active Filter Dropdowns */}
//       {slicerEntries.map(([column, selectedValues]) => {
//         const uniqueValues = getUniqueValues(column);
//         const allSelected = selectedValues.includes("Select All");
//         const isOpen = openDropdowns[column];
//         const displayText = getDisplayText(column, selectedValues);
        
//         return (
//           <div key={column} style={{ position: 'relative' }}>
//             <button
//               onClick={() => toggleDropdown(column)}
//               style={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'flex-start',
//                 padding: '6px 10px',
//                 backgroundColor: selectedValues.length === 0 ? '#f3f4f6' : '#3b82f6',
//                 color: selectedValues.length === 0 ? '#6b7280' : 'white',
//                 border: '1px solid',
//                 borderColor: selectedValues.length === 0 ? '#d1d5db' : '#3b82f6',
//                 borderRadius: '6px',
//                 fontSize: '12px',
//                 cursor: 'pointer',
//                 transition: 'all 0.2s',
//                 minWidth: '100px',
//                 textAlign: 'left',
//                 position: 'relative'
//               }}
//             >
//               {/* Column Name (Top) */}
//               <div style={{
//                 fontSize: '11px',
//                 fontWeight: '600',
//                 opacity: 0.8,
//                 marginBottom: '4px',
//                 paddingBottom: '3px',
//                 borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
//                 width: '100%'
//               }}>
//                 {column}
//               </div>
              
//               {/* Selected Value(s) (Bottom) */}
//               <div style={{
//                 fontSize: '12px',
//                 fontWeight: '500',
//                 lineHeight: '1.2',
//                 wordBreak: 'break-word'
//               }}>
//                 {displayText}
//               </div>

//               {/* Remove button */}
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   removeSlicer(column);
//                 }}
//                 style={{
//                   position: 'absolute',
//                   top: '4px',
//                   right: '4px',
//                   width: '16px',
//                   height: '16px',
//                   padding: '0',
//                   backgroundColor: 'rgba(0, 0, 0, 0.2)',
//                   border: 'none',
//                   color: 'inherit',
//                   cursor: 'pointer',
//                   borderRadius: '50%',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   fontSize: '10px',
//                   lineHeight: '1'
//                 }}
//               >
//                 ×
//               </button>

//               {/* Dropdown arrow */}
//               <div style={{
//                 position: 'absolute',
//                 bottom: '4px',
//                 right: '6px',
//                 width: '12px',
//                 height: '12px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//                 transition: 'transform 0.2s',
//                 fontSize: '8px'
//               }}>
//                 ▼
//               </div>
//             </button>

//             {/* Dropdown Menu */}
//             {isOpen && (
//               <div style={{
//                 position: 'absolute',
//                 top: '100%',
//                 left: 0,
//                 marginTop: '4px',
//                 backgroundColor: 'white',
//                 border: '1px solid #e5e7eb',
//                 borderRadius: '8px',
//                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
//                 minWidth: '200px',
//                 maxWidth: '300px',
//                 zIndex: 1001
//               }}>
//                 <div style={{
//                   padding: '12px',
//                   borderBottom: '1px solid #f3f4f6'
//                 }}>
//                   <div style={{
//                     fontSize: '12px',
//                     fontWeight: '600',
//                     color: '#374151',
//                     marginBottom: '8px'
//                   }}>
//                     {column}
//                   </div>
                  
//                   {/* Select All */}
//                   <div style={{
//                     display: 'flex',
//                     alignItems: 'flex-start',
//                     gap: '8px',
//                     padding: '6px 0',
//                     cursor: 'pointer',
//                     fontSize: '13px',
//                     fontWeight: '500',
//                     lineHeight: '1.4'
//                   }}
//                   onClick={(e) => {
//                     const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
//                     if (checkbox && e.target !== checkbox) {
//                       checkbox.click();
//                     }
//                   }}>
//                     <div style={{
//                       width: '16px',
//                       height: '16px',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       flexShrink: 0,
//                       marginTop: '1px'
//                     }}>
//                       <input
//                         type="checkbox"
//                         checked={allSelected}
//                         onChange={(e) => handleSlicerChange(column, "Select All", e.target.checked)}
//                         style={{
//                           width: '16px',
//                           height: '16px',
//                           accentColor: '#3b82f6',
//                           cursor: 'pointer',
//                           margin: 0
//                         }}
//                       />
//                     </div>
//                     <span style={{
//                       lineHeight: '1.4',
//                       flex: 1
//                     }}>Select All ({uniqueValues.length})</span>
//                   </div>
//                 </div>

//                 {/* Options List */}
//                 <div style={{
//                   maxHeight: '200px',
//                   overflowY: 'auto',
//                   padding: '8px 12px'
//                 }}>
//                   {uniqueValues.map((value) => (
//                     <div key={value} style={{
//                       display: 'flex',
//                       alignItems: 'flex-start',
//                       gap: '8px',
//                       padding: '4px 0',
//                       cursor: 'pointer',
//                       fontSize: '12px',
//                       color: '#4b5563',
//                       lineHeight: '1.4'
//                     }}
//                     onClick={(e) => {
//                       const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
//                       if (checkbox && e.target !== checkbox) {
//                         checkbox.click();
//                       }
//                     }}>
//                       <div style={{
//                         width: '14px',
//                         height: '14px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         flexShrink: 0,
//                         marginTop: '1px'
//                       }}>
//                         <input
//                           type="checkbox"
//                           checked={allSelected || selectedValues.includes(value)}
//                           onChange={(e) => handleSlicerChange(column, value, e.target.checked)}
//                           style={{
//                             width: '14px',
//                             height: '14px',
//                             accentColor: '#3b82f6',
//                             cursor: 'pointer',
//                             margin: 0
//                           }}
//                         />
//                       </div>
//                       <span style={{
//                         wordBreak: 'break-word',
//                         lineHeight: '1.4',
//                         flex: 1
//                       }}>{value}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div style={{
//                   padding: '8px 12px',
//                   backgroundColor: '#f9fafb',
//                   borderTop: '1px solid #f3f4f6',
//                   fontSize: '11px',
//                   color: '#6b7280',
//                   textAlign: 'center'
//                 }}>
//                   {selectedValues.length === 0 ? 'No items selected' :
//                    allSelected ? 'All items selected' :
//                    `${selectedValues.length} of ${uniqueValues.length} selected`}
//                 </div>
//               </div>
//             )}
//           </div>
//         );
//       })}

//       {/* Add New Filter Dropdown */}
//       {availableColumns.length > 0 && (
//         <select
//           onChange={(e) => {
//             if (e.target.value) {
//               addSlicer(e.target.value);
//               e.target.value = "";
//             }
//           }}
//           style={{
//             padding: '8px 12px',
//             backgroundColor: '#f9fafb',
//             border: '1px solid #d1d5db',
//             borderRadius: '6px',
//             fontSize: '13px',
//             color: '#6b7280',
//             cursor: 'pointer',
//             outline: 'none',
//             height: '42px' // Match height of filter buttons
//           }}
//         >
//           <option value="">+ Add Filter</option>
//           {availableColumns.map(col => (
//             <option key={col} value={col}>{col}</option>
//           ))}
//         </select>
//       )}

//       {/* Clear All Filters */}
//       {slicerEntries.length > 0 && (
//         <button
//           onClick={() => setSlicers({})}
//           style={{
//             padding: '8px 12px',
//             backgroundColor: 'transparent',
//             border: '1px solid #dc2626',
//             borderRadius: '6px',
//             color: '#dc2626',
//             fontSize: '13px',
//             cursor: 'pointer',
//             fontWeight: '500',
//             transition: 'all 0.2s',
//             height: '42px' // Match height of filter buttons
//           }}
//           onMouseOver={(e) => {
//             e.target.style.backgroundColor = '#dc2626';
//             e.target.style.color = 'white';
//           }}
//           onMouseOut={(e) => {
//             e.target.style.backgroundColor = 'transparent';
//             e.target.style.color = '#dc2626';
//           }}
//         >
//           Clear All
//         </button>
//       )}
//     </div>
//   );
// };

// export default FilterPanel;

// import React, { useState, useMemo } from 'react';

// const FilterPanel = ({ rows, slicers, setSlicers }) => {
//   const [openDropdowns, setOpenDropdowns] = useState({});
//   const [dragOver, setDragOver] = useState(false);

//   // Get unique values for each column that has a slicer
//   const getUniqueValues = (column) => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
    
//     const values = rows
//       .map(row => row[column])
//       .filter(val => val !== null && val !== undefined && val !== '')
//       .map(val => String(val).trim())
//       .filter((val, index, arr) => arr.indexOf(val) === index)
//       .sort();
    
//     return values;
//   };

//   // Handle filter value changes
//   const handleSlicerChange = (column, value, isChecked) => {
//     const currentValues = slicers[column] || [];
//     let newValues;

//     if (value === "Select All") {
//       if (isChecked) {
//         const allValues = getUniqueValues(column);
//         newValues = ["Select All", ...allValues];
//       } else {
//         newValues = [];
//       }
//     } else {
//       if (isChecked) {
//         newValues = [...currentValues.filter(v => v !== "Select All"), value];
//         const allUniqueValues = getUniqueValues(column);
//         if (newValues.length === allUniqueValues.length) {
//           newValues = ["Select All", ...allUniqueValues];
//         }
//       } else {
//         newValues = currentValues.filter(v => v !== value && v !== "Select All");
//       }
//     }

//     setSlicers({
//       ...slicers,
//       [column]: newValues
//     });
//   };

//   // Add a new slicer for a column
//   const addSlicer = (column) => {
//     if (!slicers[column]) {
//       setSlicers({
//         ...slicers,
//         [column]: ["Select All"]
//       });
//     }
//   };

//   // Remove a slicer
//   const removeSlicer = (column) => {
//     const newSlicers = { ...slicers };
//     delete newSlicers[column];
//     setSlicers(newSlicers);
//     // Close dropdown when removing slicer
//     setOpenDropdowns(prev => {
//       const newOpen = { ...prev };
//       delete newOpen[column];
//       return newOpen;
//     });
//   };

//   // Toggle dropdown
//   const toggleDropdown = (column) => {
//     setOpenDropdowns(prev => ({
//       ...prev,
//       [column]: !prev[column]
//     }));
//   };

//   // Get display text for selected values
//   const getDisplayText = (column, selectedValues) => {
//     if (!selectedValues || selectedValues.length === 0) {
//       return "None selected";
//     }
    
//     const allSelected = selectedValues.includes("Select All");
//     if (allSelected) {
//       return "All";
//     }
    
//     if (selectedValues.length === 1) {
//       return selectedValues[0];
//     }
    
//     if (selectedValues.length <= 2) {
//       return selectedValues.join(", ");
//     }
    
//     return `${selectedValues[0]} +${selectedValues.length - 1} more`;
//   };

//   // Get available columns for adding new slicers
//   const availableColumns = useMemo(() => {
//     if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
//     const allColumns = Object.keys(rows[0] || {});
//     return allColumns.filter(col => !slicers[col]);
//   }, [rows, slicers]);

//   // Handle drag and drop
//   const handleDragStart = (e, column) => {
//     e.dataTransfer.setData('text/plain', column);
//     e.dataTransfer.effectAllowed = 'copy';
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'copy';
//     setDragOver(true);
//   };

//   const handleDragLeave = (e) => {
//     // Only set dragOver to false if we're leaving the drop zone entirely
//     const rect = e.currentTarget.getBoundingClientRect();
//     const x = e.clientX;
//     const y = e.clientY;
    
//     if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
//       setDragOver(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     const column = e.dataTransfer.getData('text/plain');
//     if (column && availableColumns.includes(column)) {
//       addSlicer(column);
//     }
//     setDragOver(false);
//   };

//   const slicerEntries = Object.entries(slicers);

//   return (
//     <div>
//       {/* Available Columns for Dragging */}
//       {/* {availableColumns.length > 0 && (
//         <div style={{
//           marginBottom: '16px',
//           padding: '12px',
//           backgroundColor: '#f8fafc',
//           border: '1px solid #e2e8f0',
//           borderRadius: '8px'
//         }}>
//           <div style={{
//             fontSize: '12px',
//             fontWeight: '600',
//             color: '#64748b',
//             marginBottom: '8px',
//             textTransform: 'uppercase',
//             letterSpacing: '0.5px'
//           }}>
//             Drag columns below to create filters
//           </div>
//           <div style={{
//             display: 'flex',
//             gap: '6px',
//             flexWrap: 'wrap'
//           }}>
//             {availableColumns.map(column => (
//               <div
//                 key={column}
//                 draggable
//                 onDragStart={(e) => handleDragStart(e, column)}
//                 style={{
//                   padding: '4px 8px',
//                   backgroundColor: 'white',
//                   border: '1px solid #cbd5e1',
//                   borderRadius: '4px',
//                   fontSize: '12px',
//                   color: '#475569',
//                   cursor: 'grab',
//                   userSelect: 'none',
//                   transition: 'all 0.2s',
//                   boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
//                 }}
//                 onMouseOver={(e) => {
//                   e.target.style.backgroundColor = '#e2e8f0';
//                   e.target.style.transform = 'translateY(-1px)';
//                   e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
//                 }}
//                 onMouseOut={(e) => {
//                   e.target.style.backgroundColor = 'white';
//                   e.target.style.transform = 'translateY(0)';
//                   e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
//                 }}
//                 onDragStart={(e) => {
//                   handleDragStart(e, column);
//                   e.target.style.cursor = 'grabbing';
//                 }}
//                 onDragEnd={(e) => {
//                   e.target.style.cursor = 'grab';
//                 }}
//               >
//                 📋 {column}
//               </div>
//             ))}
//           </div>
//         </div>
//       )} */}

//       {/* Filter Drop Zone */}
//       <div
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//         style={{
//           display: 'flex',
//           alignItems: 'flex-start',
//           gap: '12px',
//           flexWrap: 'wrap',
//           padding: '16px',
//           minHeight: '60px',
//           border: dragOver ? '2px dashed #3b82f6' : '2px dashed #e5e7eb',
//           borderRadius: '8px',
//           backgroundColor: dragOver ? '#eff6ff' : '#ffffff',
//           transition: 'all 0.2s'
//         }}
//       >
//         {/* Filter Title */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           color: '#374151',
//           fontSize: '14px',
//           fontWeight: '600',
//           marginRight: '8px'
//         }}>
//           🔍 Filters:
//         </div>

//         {/* Drop Zone Message */}
//         {slicerEntries.length === 0 && !dragOver && (
//           <div style={{
//             color: '#9ca3af',
//             fontSize: '13px',
//             fontStyle: 'italic',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '6px'
//           }}>
//             Drop column headers here to create filters
//           </div>
//         )}

//         {/* Drag Over Message */}
//         {dragOver && (
//           <div style={{
//             color: '#3b82f6',
//             fontSize: '13px',
//             fontWeight: '500',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '6px'
//           }}>
//             ✨ Drop here to add filter
//           </div>
//         )}

//         {/* Active Filter Dropdowns */}
//         {slicerEntries.map(([column, selectedValues]) => {
//           const uniqueValues = getUniqueValues(column);
//           const allSelected = selectedValues.includes("Select All");
//           const isOpen = openDropdowns[column];
//           const displayText = getDisplayText(column, selectedValues);
          
//           return (
//             <div key={column} style={{ position: 'relative' }}>
//               <button
//                 onClick={() => toggleDropdown(column)}
//                 style={{
//                   display: 'flex',
//                   flexDirection: 'column',
//                   alignItems: 'flex-start',
//                   padding: '6px 10px',
//                   backgroundColor: selectedValues.length === 0 ? '#f3f4f6' : '#3b82f6',
//                   color: selectedValues.length === 0 ? '#6b7280' : 'white',
//                   border: '1px solid',
//                   borderColor: selectedValues.length === 0 ? '#d1d5db' : '#3b82f6',
//                   borderRadius: '6px',
//                   fontSize: '12px',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s',
//                   minWidth: '100px',
//                   textAlign: 'left',
//                   position: 'relative'
//                 }}
//               >
//                 {/* Column Name (Top) */}
//                 <div style={{
//                   fontSize: '11px',
//                   fontWeight: '600',
//                   opacity: 0.8,
//                   marginBottom: '4px',
//                   paddingBottom: '3px',
//                   borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
//                   width: '100%'
//                 }}>
//                   {column}
//                 </div>
                
//                 {/* Selected Value(s) (Bottom) */}
//                 <div style={{
//                   fontSize: '12px',
//                   fontWeight: '500',
//                   lineHeight: '1.2',
//                   wordBreak: 'break-word'
//                 }}>
//                   {displayText}
//                 </div>

//                 {/* Remove button */}
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeSlicer(column);
//                   }}
//                   style={{
//                     position: 'absolute',
//                     top: '4px',
//                     right: '4px',
//                     width: '16px',
//                     height: '16px',
//                     padding: '0',
//                     backgroundColor: 'rgba(0, 0, 0, 0.2)',
//                     border: 'none',
//                     color: 'inherit',
//                     cursor: 'pointer',
//                     borderRadius: '50%',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: '10px',
//                     lineHeight: '1'
//                   }}
//                 >
//                   ×
//                 </button>

//                 {/* Dropdown arrow */}
//                 <div style={{
//                   position: 'absolute',
//                   bottom: '4px',
//                   right: '6px',
//                   width: '12px',
//                   height: '12px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//                   transition: 'transform 0.2s',
//                   fontSize: '8px'
//                 }}>
//                   ▼
//                 </div>
//               </button>

//               {/* Dropdown Menu */}
//               {isOpen && (
//                 <div style={{
//                   position: 'absolute',
//                   top: '100%',
//                   left: 0,
//                   marginTop: '4px',
//                   backgroundColor: 'white',
//                   border: '1px solid #e5e7eb',
//                   borderRadius: '8px',
//                   boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
//                   minWidth: '200px',
//                   maxWidth: '300px',
//                   zIndex: 1001
//                 }}>
//                   <div style={{
//                     padding: '12px',
//                     borderBottom: '1px solid #f3f4f6'
//                   }}>
//                     <div style={{
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#374151',
//                       marginBottom: '8px'
//                     }}>
//                       {column}
//                     </div>
                    
//                     {/* Select All */}
//                     <div style={{
//                       display: 'flex',
//                       alignItems: 'flex-start',
//                       gap: '8px',
//                       padding: '6px 0',
//                       cursor: 'pointer',
//                       fontSize: '13px',
//                       fontWeight: '500',
//                       lineHeight: '1.4'
//                     }}
//                     onClick={(e) => {
//                       const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
//                       if (checkbox && e.target !== checkbox) {
//                         checkbox.click();
//                       }
//                     }}>
//                       <div style={{
//                         width: '16px',
//                         height: '16px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         flexShrink: 0,
//                         marginTop: '1px'
//                       }}>
//                         <input
//                           type="checkbox"
//                           checked={allSelected}
//                           onChange={(e) => handleSlicerChange(column, "Select All", e.target.checked)}
//                           style={{
//                             width: '16px',
//                             height: '16px',
//                             accentColor: '#3b82f6',
//                             cursor: 'pointer',
//                             margin: 0
//                           }}
//                         />
//                       </div>
//                       <span style={{
//                         lineHeight: '1.4',
//                         flex: 1
//                       }}>Select All ({uniqueValues.length})</span>
//                     </div>
//                   </div>

//                   {/* Options List */}
//                   <div style={{
//                     maxHeight: '200px',
//                     overflowY: 'auto',
//                     padding: '8px 12px'
//                   }}>
//                     {uniqueValues.map((value) => (
//                       <div key={value} style={{
//                         display: 'flex',
//                         alignItems: 'flex-start',
//                         gap: '8px',
//                         padding: '4px 0',
//                         cursor: 'pointer',
//                         fontSize: '12px',
//                         color: '#4b5563',
//                         lineHeight: '1.4'
//                       }}
//                       onClick={(e) => {
//                         const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
//                         if (checkbox && e.target !== checkbox) {
//                           checkbox.click();
//                         }
//                       }}>
//                         <div style={{
//                           width: '14px',
//                           height: '14px',
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           flexShrink: 0,
//                           marginTop: '1px'
//                         }}>
//                           <input
//                             type="checkbox"
//                             checked={allSelected || selectedValues.includes(value)}
//                             onChange={(e) => handleSlicerChange(column, value, e.target.checked)}
//                             style={{
//                               width: '14px',
//                               height: '14px',
//                               accentColor: '#3b82f6',
//                               cursor: 'pointer',
//                               margin: 0
//                             }}
//                           />
//                         </div>
//                         <span style={{
//                           wordBreak: 'break-word',
//                           lineHeight: '1.4',
//                           flex: 1
//                         }}>{value}</span>
//                       </div>
//                     ))}
//                   </div>

//                   <div style={{
//                     padding: '8px 12px',
//                     backgroundColor: '#f9fafb',
//                     borderTop: '1px solid #f3f4f6',
//                     fontSize: '11px',
//                     color: '#6b7280',
//                     textAlign: 'center'
//                   }}>
//                     {selectedValues.length === 0 ? 'No items selected' :
//                      allSelected ? 'All items selected' :
//                      `${selectedValues.length} of ${uniqueValues.length} selected`}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         {/* Clear All Filters */}
//         {slicerEntries.length > 0 && (
//           <button
//             onClick={() => setSlicers({})}
//             style={{
//               padding: '8px 12px',
//               backgroundColor: 'transparent',
//               border: '1px solid #dc2626',
//               borderRadius: '6px',
//               color: '#dc2626',
//               fontSize: '13px',
//               cursor: 'pointer',
//               fontWeight: '500',
//               transition: 'all 0.2s',
//               height: '42px'
//             }}
//             onMouseOver={(e) => {
//               e.target.style.backgroundColor = '#dc2626';
//               e.target.style.color = 'white';
//             }}
//             onMouseOut={(e) => {
//               e.target.style.backgroundColor = 'transparent';
//               e.target.style.color = '#dc2626';
//             }}
//           >
//             Clear All
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FilterPanel;

import React, { useState, useMemo } from 'react';

const FilterPanel = ({ rows, slicers, setSlicers }) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [dragOver, setDragOver] = useState(false);

  // Get unique values for each column that has a slicer
  const getUniqueValues = (column) => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
    
    const values = rows
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined && val !== '')
      .map(val => String(val).trim())
      .filter((val, index, arr) => arr.indexOf(val) === index)
      .sort();
    
    return values;
  };

  // Handle filter value changes
  const handleSlicerChange = (column, value, isChecked) => {
    const currentValues = slicers[column] || [];
    let newValues;

    if (value === "Select All") {
      if (isChecked) {
        const allValues = getUniqueValues(column);
        newValues = ["Select All", ...allValues];
      } else {
        newValues = [];
      }
    } else {
      if (isChecked) {
        newValues = [...currentValues.filter(v => v !== "Select All"), value];
        const allUniqueValues = getUniqueValues(column);
        if (newValues.length === allUniqueValues.length) {
          newValues = ["Select All", ...allUniqueValues];
        }
      } else {
        newValues = currentValues.filter(v => v !== value && v !== "Select All");
      }
    }

    setSlicers({
      ...slicers,
      [column]: newValues
    });
  };

  // Add a new slicer for a column
  const addSlicer = (column) => {
    if (!slicers[column]) {
      setSlicers({
        ...slicers,
        [column]: ["Select All"]
      });
    }
  };

  // Remove a slicer
  const removeSlicer = (column) => {
    const newSlicers = { ...slicers };
    delete newSlicers[column];
    setSlicers(newSlicers);
    // Close dropdown when removing slicer
    setOpenDropdowns(prev => {
      const newOpen = { ...prev };
      delete newOpen[column];
      return newOpen;
    });
  };

  // Toggle dropdown
  const toggleDropdown = (column) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Get display text for selected values
  const getDisplayText = (column, selectedValues) => {
    if (!selectedValues || selectedValues.length === 0) {
      return "None selected";
    }
    
    const allSelected = selectedValues.includes("Select All");
    if (allSelected) {
      return "All";
    }
    
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    
    if (selectedValues.length <= 2) {
      return selectedValues.join(", ");
    }
    
    return `${selectedValues[0]} +${selectedValues.length - 1} more`;
  };

  // Get available columns for adding new slicers
  const availableColumns = useMemo(() => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
    const allColumns = Object.keys(rows[0] || {});
    return allColumns.filter(col => !slicers[col]);
  }, [rows, slicers]);

  // Handle drag and drop
  const handleDragStart = (e, column) => {
    e.dataTransfer.setData('text/plain', column);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set dragOver to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const column = e.dataTransfer.getData('text/plain');
    if (column && availableColumns.includes(column)) {
      addSlicer(column);
    }
    setDragOver(false);
  };

  const slicerEntries = Object.entries(slicers);

  return (
    <div>
      {/* Filter Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '16px',
          minHeight: '60px',
          border: dragOver ? '2px dashed #3b82f6' : '2px dashed #e5e7eb',
          borderRadius: '8px',
          backgroundColor: dragOver ? '#eff6ff' : '#ffffff',
          transition: 'all 0.2s'
        }}
      >
        {/* Filter Title - Only show when no filters are active */}
        {slicerEntries.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily : "var(--app-font-family)",
            marginRight: '8px'
          }}>
            🔍 Filters:
          </div>
        )}

        {/* Drop Zone Message */}
        {slicerEntries.length === 0 && !dragOver && (
          <div style={{
            color: '#9ca3af',
            fontSize: '13px',
            fontFamily : "var(--app-font-family)",
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Drop column headers here to create filters
          </div>
        )}

        {/* Drag Over Message */}
        {dragOver && (
          <div style={{
            color: '#3b82f6',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily : "var(--app-font-family)",
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ✨ Drop here to add filter
          </div>
        )}

        {/* Active Filter Dropdowns */}
        {slicerEntries.map(([column, selectedValues]) => {
          const uniqueValues = getUniqueValues(column);
          const allSelected = selectedValues.includes("Select All");
          const isOpen = openDropdowns[column];
          const displayText = getDisplayText(column, selectedValues);
          
          return (
            <div key={column} style={{ position: 'relative' }}>
              <button
                onClick={() => toggleDropdown(column)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '6px 24px 6px 10px', // Added right padding for remove button
                  backgroundColor: selectedValues.length === 0 ? '#f3f4f6' : '#3b82f6',
                  color: selectedValues.length === 0 ? '#6b7280' : 'white',
                  border: '1px solid',
                  borderColor: selectedValues.length === 0 ? '#d1d5db' : '#3b82f6',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily : "var(--app-font-family)",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '140px', // Fixed width
                  minHeight: '50px', // Fixed height
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden' // Prevent content overflow
                }}
              >
                {/* Column Name (Top) */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  opacity: 0.8,
                  fontFamily : "var(--app-font-family)",
                  marginBottom: '4px',
                  paddingBottom: '3px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {column}
                </div>
                
                {/* Selected Value(s) (Bottom) */}
                <div style={{
                  fontSize: '12px',
                  fontFamily : "var(--app-font-family)",
                  fontWeight: '500',
                  lineHeight: '1.2',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {displayText}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlicer(column);
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '16px',
                    height: '16px',
                    padding: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontFamily : "var(--app-font-family)",
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>

                {/* Dropdown arrow */}
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '6px',
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  fontSize: '8px',
                  fontFamily : "var(--app-font-family)",
                }}>
                  ▼
                </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  minWidth: '200px',
                  maxWidth: '300px',
                  zIndex: 1001
                }}>
                  <div style={{
                    padding: '12px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontFamily : "var(--app-font-family)",
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {column}
                    </div>
                    
                    {/* Select All */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '6px 0',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily : "var(--app-font-family)",
                      fontWeight: '500',
                      lineHeight: '1.4'
                    }}
                    onClick={(e) => {
                      const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
                      if (checkbox && e.target !== checkbox) {
                        checkbox.click();
                      }
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSlicerChange(column, "Select All", e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#3b82f6',
                            cursor: 'pointer',
                            margin: 0
                          }}
                        />
                      </div>
                      <span style={{
                        lineHeight: '1.4',
                        flex: 1
                      }}>Select All ({uniqueValues.length})</span>
                    </div>
                  </div>

                  {/* Options List */}
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '8px 12px'
                  }}>
                    {uniqueValues.map((value) => (
                      <div key={value} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '4px 0',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily : "var(--app-font-family)",
                        color: '#4b5563',
                        lineHeight: '1.4'
                      }}
                      onClick={(e) => {
                        const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
                        if (checkbox && e.target !== checkbox) {
                          checkbox.click();
                        }
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}>
                          <input
                            type="checkbox"
                            checked={allSelected || selectedValues.includes(value)}
                            onChange={(e) => handleSlicerChange(column, value, e.target.checked)}
                            style={{
                              width: '14px',
                              height: '14px',
                              accentColor: '#3b82f6',
                              cursor: 'pointer',
                              margin: 0
                            }}
                          />
                        </div>
                        <span style={{
                          wordBreak: 'break-word',
                          lineHeight: '1.4',
                          flex: 1
                        }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #f3f4f6',
                    fontSize: '11px',
                    fontFamily : "var(--app-font-family)",
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    {selectedValues.length === 0 ? 'No items selected' :
                     allSelected ? 'All items selected' :
                     `${selectedValues.length} of ${uniqueValues.length} selected`}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Clear All Filters */}
        {slicerEntries.length > 0 && (
          <button
            onClick={() => setSlicers({})}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '13px',
              fontFamily : "var(--app-font-family)",
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
              height: '42px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#dc2626';
            }}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;

