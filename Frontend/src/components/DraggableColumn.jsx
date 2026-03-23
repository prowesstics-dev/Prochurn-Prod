// // src/components/DraggableColumn.jsx
// import React from "react";

// const DraggableColumn = ({ column, onDrop }) => {
//   const handleDragStart = (e) => {
//     e.dataTransfer.setData('text/plain', column);
//     e.dataTransfer.effectAllowed = 'copy';
//   };

//   const columnStyle = {
//     padding: '8px 12px',
//     margin: '4px',
//     backgroundColor: '#f8f9fa',
//     border: '1px solid #dee2e6',
//     borderRadius: '4px',
//     cursor: 'grab',
//     userSelect: 'none',
//     fontSize: '13px',
//     color: '#495057',
//     display: 'inline-block',
//     transition: 'all 0.2s ease',
//     ':hover': {
//       backgroundColor: '#e9ecef',
//       borderColor: '#adb5bd'
//     }
//   };

//   return (
//     <div
//       draggable
//       onDragStart={handleDragStart}
//       style={columnStyle}
//       onMouseEnter={(e) => {
//         e.target.style.backgroundColor = '#e9ecef';
//         e.target.style.borderColor = '#adb5bd';
//         e.target.style.cursor = 'grab';
//       }}
//       onMouseLeave={(e) => {
//         e.target.style.backgroundColor = '#f8f9fa';
//         e.target.style.borderColor = '#dee2e6';
//       }}
//       onMouseDown={(e) => {
//         e.target.style.cursor = 'grabbing';
//       }}
//       onMouseUp={(e) => {
//         e.target.style.cursor = 'grab';
//       }}
//     >
//       {column}
//     </div>
//   );
// };

// export default DraggableColumn;

// src/components/DraggableColumn.jsx
import React from "react";

const DraggableColumn = ({ column, onDrop }) => {
  const handleDragStart = (e) => {
    console.log('Starting drag for column:', column); // Debug log
    
    // Set the data being dragged
    e.dataTransfer.setData('text/plain', column);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    console.log('Drag ended for column:', column); // Debug log
    
    // Reset visual feedback
    e.target.style.opacity = '1';
  };

  const columnStyle = {
    padding: '8px 12px',
    margin: '4px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'grab',
    userSelect: 'none',
    fontSize: '13px',
    fontFamily : "var(--app-font-family)",
    color: '#495057',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    // Remove the :hover pseudo-selector as it doesn't work in inline styles
  };

  return (
    <div
      draggable={true} // Explicitly set to true
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={columnStyle}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#e9ecef';
        e.target.style.borderColor = '#adb5bd';
        e.target.style.cursor = 'grab';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.borderColor = '#dee2e6';
      }}
      onMouseDown={(e) => {
        e.target.style.cursor = 'grabbing';
      }}
      onMouseUp={(e) => {
        e.target.style.cursor = 'grab';
      }}
      title={`Drag ${column} to drop zones`} // Add tooltip for better UX
    >
      {column}
    </div>
  );
};

export default DraggableColumn;