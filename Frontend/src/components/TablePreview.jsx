import React from "react";
import { useDrop } from "react-dnd";

const TablePreview = ({ selectedColumns, tableData, handleDrop, removeColumn }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "column",
    drop: (item) => handleDrop(item.column),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  });

  return (
    <div 
      ref={drop} 
      className={`fields-dropzone ${isOver ? "drag-over" : ""}`}
      style={{
        background: isOver 
          ? "linear-gradient(135deg, rgba(46, 144, 245, 0.2) 0%, rgba(30, 116, 223, 0.2) 100%)"
          : "linear-gradient(135deg, #183E75 0%, #215B99 100%)",
        border: isOver ? '2px solid #2D90F5' : '2px solid #115ECD',
        borderRadius: '10px',
        padding: '20px',
        minHeight: '400px',
        boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
        transition: 'all 0.3s ease',
        transform: isOver ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      {selectedColumns.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          textAlign: 'center'
        }}>
          <p style={{
            color: isOver ? '#2D90F5' : '#FFFFFF',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily : "var(--app-font-family)",
            margin: 0,
            opacity: 0.8
          }}>
            {isOver ? 'Release to add column to table' : 'Drag columns here to build your table'}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(24, 62, 117, 0.3)',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #1E74DF'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'transparent',
            color: '#FFFFFF'
          }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #115ECD 0%, #1E74DF 100%)',
                borderBottom: '2px solid #2D90F5'
              }}>
                {selectedColumns.map((col, index) => (
                  <th 
                    key={index}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '14px',
                      fontFamily : "var(--app-font-family)",
                      color: '#FFFFFF',
                      borderRight: index < selectedColumns.length - 1 ? '1px solid #215B99' : 'none',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <span>{col}</span>
                      <button
                        onClick={() => removeColumn(col)}
                        style={{
                          background: 'linear-gradient(135deg, #dc3545, #c82333)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily : "var(--app-font-family)",
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 
                      ? 'rgba(33, 91, 153, 0.3)' 
                      : 'rgba(17, 94, 205, 0.2)',
                    borderBottom: '1px solid #215B99',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(46, 144, 245, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = rowIndex % 2 === 0 
                      ? 'rgba(33, 91, 153, 0.3)' 
                      : 'rgba(17, 94, 205, 0.2)';
                  }}
                >
                  {selectedColumns.map((col, colIndex) => (
                    <td 
                      key={colIndex}
                      style={{
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontFamily : "var(--app-font-family)",
                        color: '#FFFFFF',
                        borderRight: colIndex < selectedColumns.length - 1 ? '1px solid rgba(33, 91, 153, 0.5)' : 'none',
                        wordBreak: 'break-word'
                      }}
                    >
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Table Footer with Row Count */}
          <div style={{
            marginTop: '15px',
            padding: '8px 12px',
            background: 'rgba(17, 94, 205, 0.3)',
            borderRadius: '6px',
            border: '1px solid #115ECD',
            textAlign: 'center'
          }}>
            <span style={{
              color: '#FFFFFF',
              fontSize: '12px',
              fontFamily : "var(--app-font-family)",
              fontWeight: '500',
              opacity: 0.8
            }}>
              Showing {tableData.length} rows × {selectedColumns.length} columns
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePreview;