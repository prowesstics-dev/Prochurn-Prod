import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";

const ChartTemplate = ({
  chartKey,
  chartType,
  chartFields,  
  handleDrop,   
  rows, 
  onChartTypeChange, 
  removeField, 
  hideConfiguration,
  displayMode = false,  
}) => {
  const [dragOverXAxis, setDragOverXAxis] = useState(false);
  const [dragOverYAxis, setDragOverYAxis] = useState(false);

  // X-Axis drop zone handlers
  const handleXAxisDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverXAxis(true);
  };

  const handleXAxisDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverXAxis(false);
  };

  const handleXAxisDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverXAxis(false);
    
    const column = e.dataTransfer.getData('text/plain');
    console.log('X-Axis drop received:', column);
    
    if (column && handleDrop) {
      handleDrop(chartKey, "xAxis", column);
    }
  };

  // Y-Axis drop zone handlers
  const handleYAxisDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverYAxis(true);
  };

  const handleYAxisDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverYAxis(false);
  };

  const handleYAxisDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverYAxis(false);
    
    const column = e.dataTransfer.getData('text/plain');
    console.log('Y-Axis drop received:', column);
    
    if (column && handleDrop) {
      handleDrop(chartKey, "yAxis", column);
    }
  };

  // FIXED: Better data processing for charts
  const aggregateData = useMemo(() => {
    if (!chartFields?.xAxis || !chartFields?.yAxis || !Array.isArray(rows) || rows.length === 0) {
      console.log('Chart data missing:', {
        xAxis: chartFields?.xAxis,
        yAxis: chartFields?.yAxis,
        rowsLength: rows?.length,
        rows: rows
      });
      return { labels: [], values: [] };
    }

    console.log('Processing chart data:', rows);

    const dataMap = new Map();
    
    rows.forEach((row, index) => {
      if (!row) {
        console.log(`Row ${index} is null/undefined`);
        return;
      }
      
      const xValue = row[chartFields.xAxis];
      const yValue = row[chartFields.yAxis];
      
      console.log(`Row ${index}:`, { 
        xValue, 
        yValue, 
        xField: chartFields.xAxis, 
        yField: chartFields.yAxis 
      });
      
      // Handle different data types for x-axis
      let xKey = xValue;
      if (xValue === null || xValue === undefined) {
        xKey = 'Unknown';
      } else if (typeof xValue === 'object') {
        xKey = JSON.stringify(xValue);
      } else {
        xKey = String(xValue);
      }
      
      // Handle y-axis values - ensure they're numeric
      let numericYValue = 0;
      if (yValue !== null && yValue !== undefined) {
        if (typeof yValue === 'number') {
          numericYValue = yValue;
        } else if (typeof yValue === 'string') {
          const parsed = parseFloat(yValue);
          numericYValue = isNaN(parsed) ? 0 : parsed;
        }
      }
      
      // Only include if y-value is valid
      if (isFinite(numericYValue)) {
        dataMap.set(xKey, (dataMap.get(xKey) || 0) + numericYValue);
      }
    });

    // Convert map to arrays
    const entries = Array.from(dataMap.entries());
    
    // Sort by value descending for better visualization
    entries.sort((a, b) => b[1] - a[1]);
    
    // Limit to top 20 for performance
    const limitedEntries = entries.slice(0, 20);
    
    const labels = limitedEntries.map(entry => entry[0]);
    const values = limitedEntries.map(entry => entry[1]);

    console.log('Processed chart data:', { labels, values });

    return {
      labels,
      values,
    };
  }, [chartFields?.xAxis, chartFields?.yAxis, rows]);

  const isRadialOrPie = ["radialBar", "pie", "donut"].includes(chartType);

  const shouldRenderChart = useMemo(() => {
    const isValid = (
      chartFields?.xAxis &&
      chartFields?.yAxis &&
      Array.isArray(aggregateData.labels) &&
      aggregateData.labels.length > 0 &&
      Array.isArray(aggregateData.values) &&
      aggregateData.values.length > 0 &&
      aggregateData.values.every((v) => typeof v === "number" && !isNaN(v) && isFinite(v))
    );
    
    console.log('Should render chart:', isValid, {
      hasXAxis: !!chartFields?.xAxis,
      hasYAxis: !!chartFields?.yAxis,
      labelsLength: aggregateData.labels?.length,
      valuesLength: aggregateData.values?.length,
      valuesValid: aggregateData.values?.every((v) => typeof v === "number" && !isNaN(v) && isFinite(v))
    });
    
    return isValid;
  }, [chartFields?.xAxis, chartFields?.yAxis, aggregateData]);

  const chartConfig = useMemo(() => {
    if (!shouldRenderChart) {
      return { series: [], options: {} };
    }

    const series = isRadialOrPie
      ? aggregateData.values
      : [{ 
          name: chartFields.yAxis || 'Data', 
          data: aggregateData.values 
        }];

    const options = {
      chart: {
        id: `chart-${chartKey}`,
        type: chartType,
        toolbar: { show: false },
        sparkline: { enabled: false },
        background: 'transparent',
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 2,
          opacity: 0.5,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        }
      },
      colors: ['#115ECD', '#1E74DF', '#2D90F5', '#215B99', '#183E75'],
      stroke: { 
        curve: ["line", "area"].includes(chartType) ? "smooth" : "straight",
        width: 2,
        colors: ['#115ECD']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: ['#2D90F5'],
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.6,
        }
      },
      tooltip: { 
        theme: "dark",
        enabled: true,
        style: {
          fontSize: '12px',
          fontFamily : "var(--app-font-family)",
        }
      },
      legend: { 
        position: 'top', 
        horizontalAlign: 'center',
        labels: {
          colors: '#FFFFFF'
        }
      },
      grid: { 
        borderColor: "#215B99",
        strokeDashArray: 1,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      theme: {
        mode: 'dark',
        palette: 'palette1'
      },
      // Conditional options based on chart type
      // ...(isRadialOrPie 
      //   ? { 
      //       labels: aggregateData.labels,
      //       plotOptions: {
      //         pie: {
      //           donut: {
      //             size: chartType === 'donut' ? '50%' : '0%',
      //             labels: {
      //               show: true,
      //               total: {
      //                 show: true,
      //                 color: '#FFFFFF'
      //               }
      //             }
      //           }
      //         },
      //         radialBar: {
      //           hollow: {
      //             size: '50%'
      //           },
      //           dataLabels: {
      //             show: true,
      //             name: {
      //               color: '#FFFFFF'
      //             },
      //             value: {
      //               color: '#FFFFFF'
      //             }
      //           }
      //         }
      //       }
      //     } 
      //   : { 
      //       xaxis: { 
      //         categories: aggregateData.labels,
      //         labels: {
      //           style: {
      //             colors: '#FFFFFF',
      //             fontSize: '12px'
      //           },
      //           rotate: aggregateData.labels.length > 10 ? -45 : 0, // Rotate labels if too many
      //           maxHeight: 100
      //         },
      //         axisBorder: {
      //           color: '#215B99'
      //         },
      //         axisTicks: {
      //           color: '#215B99'
      //         }
      //       },
      //       yaxis: {
      //         labels: {
      //           style: {
      //             colors: '#FFFFFF',
      //             fontSize: '12px'
      //           },
      //           formatter: function (val) {
      //             return val.toFixed(0);
      //           }
      //         }
      //       },
      //       dataLabels: {
      //         enabled: false // Disable data labels for cleaner look
      //       }
      //     }
      // )

      // REPLACE this part in your chartConfig useMemo - only the pie/donut section:

      ...(isRadialOrPie 
        ? { 
            labels: aggregateData.labels,
            plotOptions: {
              // pie: {
              //   // FIXED: Reduce pie chart size to prevent overflow
              //   size: displayMode ? 160 : 180,
              //   donut: {
              //     size: chartType === 'donut' ? '50%' : '0%',
              //     labels: {
              //       show: true,
              //       total: {
              //         show: true,
              //         color: '#FFFFFF'
              //       }
              //     }
              //   },
              //   // FIXED: Add padding to prevent overflow
              //   offsetX: 0,
              //   offsetY: -10,
              //   // FIXED: Disable data labels to prevent overflow
              //   dataLabels: {
              //     enabled: false
              //   }
              // },
              // In the plotOptions.pie section, change this:
              pie: {
                size: displayMode ? 160 : 180,
                donut: {
                  size: chartType === 'donut' ? '50%' : '0%',
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      color: '#FFFFFF'
                    }
                  }
                },
                offsetX: 0,
                offsetY: 10, // CHANGED FROM -10 TO +10 to move pie chart DOWN
                dataLabels: {
                  enabled: false
                }
              },
              
              radialBar: {
                // FIXED: Reduce radial bar size
                size: displayMode ? 160 : 180,
                hollow: {
                  size: '50%'
                },
                dataLabels: {
                  show: true,
                  name: {
                    color: '#FFFFFF'
                  },
                  value: {
                    color: '#FFFFFF'
                  }
                }
              }
            },
            // FIXED: Position legend at bottom with proper spacing
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
              offsetY: 5,
              itemMargin: {
                horizontal: 3,
                vertical: 2
              },
              labels: {
                colors: '#FFFFFF'
              },
              // FIXED: Hide legend if too many items
              show: aggregateData.labels.length <= 5
            },
            // FIXED: Disable data labels globally for pie charts
            dataLabels: {
              enabled: false
            }
          } 
        : { 
            // ... rest of your existing non-pie chart config
            xaxis: { 
              categories: aggregateData.labels,
              labels: {
                style: {
                  colors: '#FFFFFF',
                  fontSize: '12px',
                  fontFamily : "var(--app-font-family)",
                },
                rotate: aggregateData.labels.length > 10 ? -45 : 0,
                maxHeight: 100
              },
              axisBorder: {
                color: '#215B99'
              },
              axisTicks: {
                color: '#215B99'
              }
            },
            yaxis: {
              labels: {
                style: {
                  colors: '#FFFFFF',
                  fontSize: '12px',
                  fontFamily : "var(--app-font-family)",
                },
                formatter: function (val) {
                  return val.toFixed(0);
                }
              }
            },
            dataLabels: {
              enabled: false
            }
          }
      )
    };

    return { series, options };
  }, [shouldRenderChart, isRadialOrPie, aggregateData, chartFields, chartType, chartKey]);

  const chartTypes = ["bar", "line", "area", "radialBar", "scatter", "pie", "donut"];

  // Render chart function
  const renderChart = () => {
    if (!shouldRenderChart) {
      return (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center', 
          color: '#FFFFFF',
          border: '1px dashed #1E74DF',
          borderRadius: '8px',
          backgroundColor: 'rgba(30, 116, 223, 0.1)',
          fontSize: '14px',
          fontFamily : "var(--app-font-family)",
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500' , fontFamily : "var(--app-font-family)", }}>
            {displayMode ? 'Chart not configured' : 'Drop fields to generate the chart'}
          </p>
          {!displayMode && (
            <>
              {chartFields?.xAxis && !chartFields?.yAxis && (
                <small style={{ color: '#2D90F5' }}>X-Axis set. Now drop a Y-Axis field.</small>
              )}
              {chartFields?.yAxis && !chartFields?.xAxis && (
                <small style={{ color: '#2D90F5' }}>Y-Axis set. Now drop an X-Axis field.</small>
              )}
              {chartFields?.xAxis && chartFields?.yAxis && (
                <small style={{ color: '#ff6b6b' }}>
                  No valid data found. Check if Y-axis field contains numeric values.
                </small>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      // <div className="chart-container" style={{ 
      //   marginTop: displayMode ? 0 : 16,
      //   minHeight: displayMode ? 250 : 300,
      //   position: 'relative',
      //   width: '100%',
      //   background: 'rgba(24, 62, 117, 0.3)',
      //   borderRadius: '8px',
      //   padding: '10px',
      //   overflow: 'hidden',
      //   boxSizing: 'border-box'
      // }}>
      //   <Chart
      //     key={`${chartKey}-${chartType}-${aggregateData.labels.length}`}
      //     options={chartConfig.options}
      //     series={chartConfig.series}
      //     type={chartType}
      //     height={displayMode ? 250 : 300}
      //     width="100%"
      //   />
      // </div>

      // FIND this in renderChart function and REPLACE:
      <div className="chart-container" style={{ 
        marginTop: displayMode ? 0 : 16,
        minHeight: 280, // SAME HEIGHT FOR ALL CHART TYPES
        position: 'relative',
        width: '100%',
        background: 'rgba(24, 62, 117, 0.3)',
        borderRadius: '8px',
        padding: '15px 10px', // SAME PADDING FOR ALL CHART TYPES
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Chart
          key={`${chartKey}-${chartType}-${aggregateData.labels.length}`}
          options={chartConfig.options}
          series={chartConfig.series}
          type={chartType}
          height={250} // SAME HEIGHT FOR ALL CHART TYPES
          width="100%"
        />
      </div>
    );
  };

  // If in display mode, only render the chart
  // if (displayMode || hideConfiguration) {
  //   return (
  //     <div style={{ 
  //       background: "linear-gradient(135deg, #183E75 0%, #215B99 100%)", 
  //       padding: "0px 15px", 
  //       borderRadius: 10,
  //       minHeight: 280,
  //       boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
  //       border: '1px solid #115ECD'
  //     }}>
  //       {renderChart()}
  //     </div>
  //   );
  // }
// If in display mode, only render the chart
  if (displayMode || hideConfiguration) {
    return (
      <div style={{ 
        background: "linear-gradient(135deg, #183E75 0%, #215B99 100%)", 
        padding: "0px 15px", 
        borderRadius: 10,
        minHeight: 280, // SAME HEIGHT FOR ALL CHART TYPES
        boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
        border: '1px solid #115ECD',
        overflow: 'hidden'
      }}>
        {renderChart()}
      </div>
    );
  }
  // Original configuration UI
  return (
    <div 
      className="chart-template" 
      style={{ 
        background: "linear-gradient(135deg, #183E75 0%, #215B99 100%)", 
        padding: 21, 
        marginBottom: 20, 
        borderRadius: 10,
        minHeight: 400,
        boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
        border: '1px solid #115ECD'
      }}
    >
      <div className="w-100 mb-2">
        <label 
          htmlFor={`${chartKey}-type`} 
          style={{ 
            color: "white", 
            marginRight: "10px",
            fontSize: '14px',
            fontWeight: '500',
            fontFamily : "var(--app-font-family)",
          }}
        >
          Chart Type:
        </label>
        <select
          id={`${chartKey}-type`}
          value={chartType}
          onChange={(e) => onChartTypeChange(chartKey, e.target.value)}
          style={{ 
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #115ECD',
            backgroundColor: '#215B99',
            color: 'white',
            fontSize: '14px',
            fontFamily : "var(--app-font-family)",
          }}
        >
          {chartTypes.map((type) => (
            <option key={type} value={type} style={{ backgroundColor: '#215B99', color: 'white' }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* X-Axis Drop Zone */}
      <div 
        onDrop={handleXAxisDrop}
        onDragOver={handleXAxisDragOver}
        onDragLeave={handleXAxisDragLeave}
        className={`dropzone ${dragOverXAxis ? "highlight" : ""}`} 
        style={{
          border: '2px dashed #1E74DF',
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '8px',
          backgroundColor: dragOverXAxis ? 'rgba(46, 144, 245, 0.2)' : 'rgba(17, 94, 205, 0.1)',
          borderColor: dragOverXAxis ? '#2D90F5' : '#1E74DF',
          borderStyle: dragOverXAxis ? 'solid' : 'dashed',
          transition: 'all 0.3s ease'
        }}
      >
        {chartFields?.xAxis ? (
          <div className="axis-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(33, 91, 153, 0.8)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #115ECD'
          }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' , fontFamily : "var(--app-font-family)",}}>
              X-Axis: {chartFields.xAxis}
            </span>
            <button 
              className="remove-btn" 
              onClick={() => removeField(chartKey, "xAxis")}
              style={{ 
                background: 'linear-gradient(135deg, #dc3545, #c82333)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '22px', 
                height: '22px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily : "var(--app-font-family)",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="axis-container" style={{ 
            color: '#FFFFFF', 
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily : "var(--app-font-family)",
          }}>
            {dragOverXAxis ? 'Release to drop X-Axis here' : 'Drop X-Axis Here'}
          </div>
        )}
      </div>

      {/* Y-Axis Drop Zone */}
      <div 
        onDrop={handleYAxisDrop}
        onDragOver={handleYAxisDragOver}
        onDragLeave={handleYAxisDragLeave}
        className={`dropzone ${dragOverYAxis ? "highlight" : ""}`} 
        style={{
          border: '2px dashed #1E74DF',
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '8px',
          backgroundColor: dragOverYAxis ? 'rgba(46, 144, 245, 0.2)' : 'rgba(17, 94, 205, 0.1)',
          borderColor: dragOverYAxis ? '#2D90F5' : '#1E74DF',
          borderStyle: dragOverYAxis ? 'solid' : 'dashed',
          transition: 'all 0.3s ease'
        }}
      >
        {chartFields?.yAxis ? (
          <div className="axis-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(33, 91, 153, 0.8)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #115ECD'
          }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' , fontFamily : "var(--app-font-family)", }}>
              Y-Axis: {chartFields.yAxis}
            </span>
            <button 
              className="remove-btn" 
              onClick={() => removeField(chartKey, "yAxis")}
              style={{ 
                background: 'linear-gradient(135deg, #dc3545, #c82333)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '22px', 
                height: '22px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily : "var(--app-font-family)",
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="axis-container" style={{ 
            color: '#FFFFFF', 
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500', 
            fontFamily : "var(--app-font-family)",
          }}>
            {dragOverYAxis ? 'Release to drop Y-Axis here' : 'Drop Y-Axis Here'}
          </div>
        )}
      </div>

      {renderChart()}
    </div>
  );
};

export default ChartTemplate;



// import React, { useMemo, useState } from "react";
// import {
//   BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
//   ScatterChart, Scatter, RadialBarChart, RadialBar, ComposedChart,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from "recharts";

// const ChartTemplate = ({
//   chartKey,
//   chartType,
//   chartFields,
//   handleDrop,
//   rows,
//   onChartTypeChange,
//   removeField,
//   displayMode = false,
//   hideConfiguration = false,
//   updateComponent,
//   component,
// }) => {
//   const [dragOverXAxis, setDragOverXAxis] = useState(false);
//   const [dragOverYAxis, setDragOverYAxis] = useState(false);

//   // Enhanced state for dynamic operations and colors
//   const [yAxisOperation, setYAxisOperation] = useState(component?.yAxisOperation || 'sum');
//   const [colorMode, setColorMode] = useState(component?.colorMode || 'default');
//   const [singleColor, setSingleColor] = useState(component?.singleColor || '#115ECD');
//   const [gradientStart, setGradientStart] = useState(component?.gradientStart || '#115ECD');
//   const [gradientEnd, setGradientEnd] = useState(component?.gradientEnd || '#2D90F5');
//   const [selectedPreset, setSelectedPreset] = useState(component?.selectedPreset || 'default');

//   // Color palette presets - vibrant and modern
//   const colorPresets = {
//     default: ['#115ECD', '#1E74DF', '#2D90F5', '#215B99', '#183E75'],
//     vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
//     neon: ['#FF073A', '#FF6C02', '#FFD700', '#00FF88', '#00D2FF'],
//     sunset: ['#FF416C', '#FF4B2B', '#FFA726', '#FFB74D', '#FFCC02'],
//     ocean: ['#667eea', '#764ba2', '#1387D4', '#2E8B9A', '#3FADA8'],
//     purple: ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE', '#EDE9FE'],
//     emerald: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
//     rose: ['#F43F5E', '#FB7185', '#FDA4AF', '#FECACA', '#FEE2E2'],
//     cosmic: ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B'],
//     tropical: ['#06B6D4', '#14B8A6', '#10B981', '#84CC16', '#EAB308']
//   };

//   // Y-axis operations
//   const operations = [
//     { value: 'sum', label: 'Sum' },
//     { value: 'avg', label: 'Average' },
//     { value: 'count', label: 'Count' },
//     { value: 'max', label: 'Maximum' },
//     { value: 'min', label: 'Minimum' },
//     { value: 'median', label: 'Median' },
//     { value: 'distinct', label: 'Distinct Count' }
//   ];

//   // Save configuration to component
//   const saveConfig = (updates) => {
//     if (updateComponent && component) {
//       updateComponent(component.id, {
//         yAxisOperation,
//         colorMode,
//         singleColor,
//         gradientStart,
//         gradientEnd,
//         selectedPreset,
//         ...updates
//       });
//     }
//   };

//   // X-Axis drop zone handlers
//   const handleXAxisDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverXAxis(true);
//   };

//   const handleXAxisDragLeave = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverXAxis(false);
//   };

//   const handleXAxisDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverXAxis(false);
    
//     const column = e.dataTransfer.getData('text/plain');
//     if (column && handleDrop) {
//       handleDrop(chartKey, "xAxis", column);
//     }
//   };

//   // Y-Axis drop zone handlers
//   const handleYAxisDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverYAxis(true);
//   };

//   const handleYAxisDragLeave = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverYAxis(false);
//   };

//   const handleYAxisDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragOverYAxis(false);
    
//     const column = e.dataTransfer.getData('text/plain');
//     if (column && handleDrop) {
//       handleDrop(chartKey, "yAxis", column);
//     }
//   };

//   // Enhanced data processing with multiple operations
//   const processedData = useMemo(() => {
//     if (!chartFields?.xAxis || !chartFields?.yAxis || !Array.isArray(rows) || rows.length === 0) {
//       return [];
//     }

//     const dataMap = new Map();
    
//     rows.forEach((row) => {
//       if (!row) return;
      
//       const xValue = row[chartFields.xAxis];
//       const yValue = row[chartFields.yAxis];
      
//       let xKey = xValue;
//       if (xValue === null || xValue === undefined) {
//         xKey = 'Unknown';
//       } else {
//         xKey = String(xValue);
//       }
      
//       if (!dataMap.has(xKey)) {
//         dataMap.set(xKey, []);
//       }
      
//       // Store all values for advanced operations
//       if (yValue !== null && yValue !== undefined) {
//         const numericValue = parseFloat(yValue);
//         if (!isNaN(numericValue)) {
//           dataMap.get(xKey).push(numericValue);
//         }
//       }
//     });

//     // Apply the selected operation
//     const processedEntries = Array.from(dataMap.entries()).map(([key, values]) => {
//       let result = 0;
      
//       if (values.length === 0) return { name: key, value: 0 };
      
//       switch (yAxisOperation) {
//         case 'sum':
//           result = values.reduce((sum, val) => sum + val, 0);
//           break;
//         case 'avg':
//           result = values.reduce((sum, val) => sum + val, 0) / values.length;
//           break;
//         case 'count':
//           result = values.length;
//           break;
//         case 'max':
//           result = Math.max(...values);
//           break;
//         case 'min':
//           result = Math.min(...values);
//           break;
//         case 'median':
//           const sorted = [...values].sort((a, b) => a - b);
//           const mid = Math.floor(sorted.length / 2);
//           result = sorted.length % 2 === 0 
//             ? (sorted[mid - 1] + sorted[mid]) / 2 
//             : sorted[mid];
//           break;
//         case 'distinct':
//           result = new Set(values).size;
//           break;
//         default:
//           result = values.reduce((sum, val) => sum + val, 0);
//       }
      
//       return {
//         name: key,
//         value: Math.round(result * 100) / 100,
//         count: values.length,
//         rawValues: values
//       };
//     });

//     // Sort by value descending and limit to top 20
//     return processedEntries
//       .sort((a, b) => b.value - a.value)
//       .slice(0, 20);
//   }, [chartFields?.xAxis, chartFields?.yAxis, rows, yAxisOperation]);

//   // Dynamic color generation
//   const getColors = () => {
//     const currentPreset = colorPresets[selectedPreset] || colorPresets.default;
    
//     switch (colorMode) {
//       case 'single':
//         return Array(processedData.length).fill(singleColor);
//       case 'gradient':
//         return generateGradientColors(gradientStart, gradientEnd, processedData.length);
//       case 'rainbow':
//         return generateRainbowColors(processedData.length);
//       default:
//         return generatePresetColors(currentPreset, processedData.length);
//     }
//   };

//   const generateGradientColors = (start, end, count) => {
//     const colors = [];
//     for (let i = 0; i < count; i++) {
//       const ratio = count === 1 ? 0 : i / (count - 1);
//       colors.push(interpolateColor(start, end, ratio));
//     }
//     return colors;
//   };

//   const generateRainbowColors = (count) => {
//     const colors = [];
//     for (let i = 0; i < count; i++) {
//       const hue = (i * 360) / count;
//       colors.push(`hsl(${hue}, 70%, 60%)`);
//     }
//     return colors;
//   };

//   const generatePresetColors = (preset, count) => {
//     const colors = [];
//     for (let i = 0; i < count; i++) {
//       colors.push(preset[i % preset.length]);
//     }
//     return colors;
//   };

//   const interpolateColor = (color1, color2, factor) => {
//     const c1 = hexToRgb(color1);
//     const c2 = hexToRgb(color2);
    
//     const r = Math.round(c1.r + factor * (c2.r - c1.r));
//     const g = Math.round(c1.g + factor * (c2.g - c1.g));
//     const b = Math.round(c1.b + factor * (c2.b - c1.b));
    
//     return `rgb(${r}, ${g}, ${b})`;
//   };

//   const hexToRgb = (hex) => {
//     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? {
//       r: parseInt(result[1], 16),
//       g: parseInt(result[2], 16),
//       b: parseInt(result[3], 16)
//     } : { r: 0, g: 0, b: 0 };
//   };

//   const chartTypes = [
//     { value: "bar", label: "Bar Chart" },
//     { value: "line", label: "Line Chart" },
//     { value: "area", label: "Area Chart" },
//     { value: "pie", label: "Pie Chart" },
//     { value: "scatter", label: "Scatter Plot" },
//     { value: "radialBar", label: "Radial Bar" },
//     { value: "composed", label: "Composed Chart" }
//   ];

//   // Custom tooltip
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div style={{
//           backgroundColor: 'rgba(0, 0, 0, 0.8)',
//           padding: '10px',
//           borderRadius: '5px',
//           border: '1px solid #ccc',
//           color: 'white'
//         }}>
//           <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
//           <p style={{ margin: 0, color: payload[0].color }}>
//             {`${yAxisOperation.charAt(0).toUpperCase() + yAxisOperation.slice(1)}: ${payload[0].value}`}
//           </p>
//           {data.count && <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
//             {`Count: ${data.count}`}
//           </p>}
//         </div>
//       );
//     }
//     return null;
//   };

//   // Chart components
//   const renderChart = () => {
//     if (!processedData.length) {
//       return (
//         <div style={{ 
//           padding: '50px', 
//           textAlign: 'center', 
//           color: '#FFFFFF',
//           border: '1px dashed #1E74DF',
//           borderRadius: '8px',
//           backgroundColor: 'rgba(30, 116, 223, 0.1)',
//           fontSize: '14px'
//         }}>
//           <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500' }}>
//             {displayMode ? 'Chart not configured' : 'Drop fields to generate the chart'}
//           </p>
//           {!displayMode && (
//             <>
//               {chartFields?.xAxis && !chartFields?.yAxis && (
//                 <small style={{ color: '#2D90F5' }}>X-Axis set. Now drop a Y-Axis field.</small>
//               )}
//               {chartFields?.yAxis && !chartFields?.xAxis && (
//                 <small style={{ color: '#2D90F5' }}>Y-Axis set. Now drop an X-Axis field.</small>
//               )}
//               {chartFields?.xAxis && chartFields?.yAxis && (
//                 <small style={{ color: '#ff6b6b' }}>
//                   No valid data found. Check if Y-axis field contains numeric values.
//                 </small>
//               )}
//             </>
//           )}
//         </div>
//       );
//     }

//     const colors = getColors();

//     const commonProps = {
//       data: processedData,
//       margin: { top: 20, right: 30, left: 20, bottom: 5 }
//     };

//     switch (chartType) {
//       case 'bar':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
//               <XAxis 
//                 dataKey="name" 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <YAxis 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Bar dataKey="value" radius={[4, 4, 0, 0]}>
//                 {processedData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={colors[index]} />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         );

//       case 'line':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
//               <XAxis 
//                 dataKey="name" 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <YAxis 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Line 
//                 type="monotone" 
//                 dataKey="value" 
//                 stroke={colors[0]} 
//                 strokeWidth={3}
//                 dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
//                 activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         );

//       case 'area':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <AreaChart {...commonProps}>
//               <defs>
//                 <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
//                   <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
//               <XAxis 
//                 dataKey="name" 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <YAxis 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Area
//                 type="monotone"
//                 dataKey="value"
//                 stroke={colors[0]}
//                 strokeWidth={2}
//                 fillOpacity={1}
//                 fill="url(#colorGradient)"
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         );

//       case 'pie':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={processedData}
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={80}
//                 dataKey="value"
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                 labelLine={false}
//               >
//                 {processedData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={colors[index]} />
//                 ))}
//               </Pie>
//               <Tooltip content={<CustomTooltip />} />
//             </PieChart>
//           </ResponsiveContainer>
//         );

//       case 'scatter':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <ScatterChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
//               <XAxis 
//                 dataKey="name" 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <YAxis 
//                 dataKey="value"
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Scatter dataKey="value" fill={colors[0]} />
//             </ScatterChart>
//           </ResponsiveContainer>
//         );

//       case 'radialBar':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <RadialBarChart 
//               cx="50%" 
//               cy="50%" 
//               innerRadius="20%" 
//               outerRadius="80%" 
//               data={processedData.slice(0, 5)}
//             >
//               <RadialBar 
//                 dataKey="value" 
//                 cornerRadius={4} 
//                 fill={colors[0]}
//               />
//               <Tooltip content={<CustomTooltip />} />
//             </RadialBarChart>
//           </ResponsiveContainer>
//         );

//       case 'composed':
//         return (
//           <ResponsiveContainer width="100%" height="100%">
//             <ComposedChart {...commonProps}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
//               <XAxis 
//                 dataKey="name" 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <YAxis 
//                 tick={{ fill: '#ffffff', fontSize: 12 }}
//                 axisLine={{ stroke: '#ffffff' }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Bar dataKey="value" fill={colors[0]} />
//               <Line type="monotone" dataKey="value" stroke={colors[1]} strokeWidth={2} />
//             </ComposedChart>
//           </ResponsiveContainer>
//         );

//       default:
//         return null;
//     }
//   };

//   // If in display mode, only render the chart
//   if (displayMode || hideConfiguration) {
//     return (
//       <div style={{ 
//         background: "linear-gradient(135deg, #183E75 0%, #215B99 100%)", 
//         padding: "15px", 
//         borderRadius: 10,
//         height: 280,
//         boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
//         border: '1px solid #115ECD',
//         overflow: 'hidden'
//       }}>
//         {renderChart()}
//       </div>
//     );
//   }

//   // Configuration UI
//   return (
//     <div 
//       className="chart-template" 
//       style={{ 
//         background: "linear-gradient(135deg, #183E75 0%, #215B99 100%)", 
//         padding: 21, 
//         marginBottom: 20, 
//         borderRadius: 10,
//         minHeight: 500,
//         boxShadow: '0 4px 15px rgba(24, 62, 117, 0.3)',
//         border: '1px solid #115ECD'
//       }}
//     >
//       {/* Chart Type Selection */}
//       <div style={{ marginBottom: '15px' }}>
//         <label style={{ color: "white", marginRight: "10px", fontSize: '14px', fontWeight: '500' }}>
//           Chart Type:
//         </label>
//         <select
//           value={chartType}
//           onChange={(e) => {
//             onChartTypeChange(chartKey, e.target.value);
//             saveConfig({ chartType: e.target.value });
//           }}
//           style={{ 
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #115ECD',
//             backgroundColor: '#215B99',
//             color: 'white',
//             fontSize: '14px',
//             marginRight: '15px'
//           }}
//         >
//           {chartTypes.map((type) => (
//             <option key={type.value} value={type.value}>
//               {type.label}
//             </option>
//           ))}
//         </select>

//         {/* Y-Axis Operation */}
//         <label style={{ color: "white", marginRight: "10px", fontSize: '14px', fontWeight: '500' }}>
//           Operation:
//         </label>
//         <select
//           value={yAxisOperation}
//           onChange={(e) => {
//             setYAxisOperation(e.target.value);
//             saveConfig({ yAxisOperation: e.target.value });
//           }}
//           style={{ 
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #115ECD',
//             backgroundColor: '#215B99',
//             color: 'white',
//             fontSize: '14px'
//           }}
//         >
//           {operations.map((op) => (
//             <option key={op.value} value={op.value}>
//               {op.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Color Configuration */}
//       <div style={{ marginBottom: '15px' }}>
//         <label style={{ color: "white", marginRight: "10px", fontSize: '14px', fontWeight: '500' }}>
//           Color Mode:
//         </label>
//         <select
//           value={colorMode}
//           onChange={(e) => {
//             setColorMode(e.target.value);
//             saveConfig({ colorMode: e.target.value });
//           }}
//           style={{ 
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #115ECD',
//             backgroundColor: '#215B99',
//             color: 'white',
//             fontSize: '14px',
//             marginRight: '15px'
//           }}
//         >
//           <option value="default">Preset Colors</option>
//           <option value="single">Single Color</option>
//           <option value="gradient">Gradient</option>
//           <option value="rainbow">Rainbow</option>
//         </select>

//         {/* Color Preset Selection */}
//         {colorMode === 'default' && (
//           <select
//             value={selectedPreset}
//             onChange={(e) => {
//               setSelectedPreset(e.target.value);
//               saveConfig({ selectedPreset: e.target.value });
//             }}
//             style={{ 
//               padding: '8px 12px',
//               borderRadius: '6px',
//               border: '1px solid #115ECD',
//               backgroundColor: '#215B99',
//               color: 'white',
//               fontSize: '14px'
//             }}
//           >
//             {Object.keys(colorPresets).map((preset) => (
//               <option key={preset} value={preset}>
//                 {preset.charAt(0).toUpperCase() + preset.slice(1)}
//               </option>
//             ))}
//           </select>
//         )}

//         {/* Single Color Picker */}
//         {colorMode === 'single' && (
//           <input
//             type="color"
//             value={singleColor}
//             onChange={(e) => {
//               setSingleColor(e.target.value);
//               saveConfig({ singleColor: e.target.value });
//             }}
//             style={{
//               padding: '2px',
//               border: 'none',
//               borderRadius: '4px',
//               width: '40px',
//               height: '35px',
//               cursor: 'pointer'
//             }}
//           />
//         )}

//         {/* Gradient Color Pickers */}
//         {colorMode === 'gradient' && (
//           <div style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
//             <input
//               type="color"
//               value={gradientStart}
//               onChange={(e) => {
//                 setGradientStart(e.target.value);
//                 saveConfig({ gradientStart: e.target.value });
//               }}
//               style={{
//                 padding: '2px',
//                 border: 'none',
//                 borderRadius: '4px',
//                 width: '40px',
//                 height: '35px',
//                 cursor: 'pointer'
//               }}
//             />
//             <span style={{ color: 'white', fontSize: '12px' }}>to</span>
//             <input
//               type="color"
//               value={gradientEnd}
//               onChange={(e) => {
//                 setGradientEnd(e.target.value);
//                 saveConfig({ gradientEnd: e.target.value });
//               }}
//               style={{
//                 padding: '2px',
//                 border: 'none',
//                 borderRadius: '4px',
//                 width: '40px',
//                 height: '35px',
//                 cursor: 'pointer'
//               }}
//             />
//           </div>
//         )}
//       </div>

//       {/* Color Preview */}
//       <div style={{ marginBottom: '15px' }}>
//         <label style={{ color: "white", fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
//           Color Preview:
//         </label>
//         <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
//           {getColors().slice(0, 10).map((color, index) => (
//             <div
//               key={index}
//               style={{
//                 width: '25px',
//                 height: '25px',
//                 backgroundColor: color,
//                 borderRadius: '4px',
//                 border: '1px solid rgba(255,255,255,0.3)'
//               }}
//             />
//           ))}
//         </div>
//       </div>

//       {/* X-Axis Drop Zone */}
//       <div 
//         onDrop={handleXAxisDrop}
//         onDragOver={handleXAxisDragOver}
//         onDragLeave={handleXAxisDragLeave}
//         style={{
//           border: '2px dashed #1E74DF',
//           padding: '12px',
//           marginBottom: '12px',
//           borderRadius: '8px',
//           backgroundColor: dragOverXAxis ? 'rgba(46, 144, 245, 0.2)' : 'rgba(17, 94, 205, 0.1)',
//           borderColor: dragOverXAxis ? '#2D90F5' : '#1E74DF',
//           borderStyle: dragOverXAxis ? 'solid' : 'dashed',
//           transition: 'all 0.3s ease'
//         }}
//       >
//         {chartFields?.xAxis ? (
//           <div style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             background: 'rgba(33, 91, 153, 0.8)',
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #115ECD'
//           }}>
//             <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
//               X-Axis: {chartFields.xAxis}
//             </span>
//             <button 
//               onClick={() => removeField(chartKey, "xAxis")}
//               style={{ 
//                 background: 'linear-gradient(135deg, #dc3545, #c82333)', 
//                 color: 'white', 
//                 border: 'none', 
//                 borderRadius: '50%', 
//                 width: '22px', 
//                 height: '22px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//             >
//               ×
//             </button>
//           </div>
//         ) : (
//           <div style={{ 
//             color: '#FFFFFF', 
//             textAlign: 'center',
//             fontSize: '14px',
//             fontWeight: '500'
//           }}>
//             {dragOverXAxis ? 'Release to drop X-Axis here' : 'Drop X-Axis Here'}
//           </div>
//         )}
//       </div>

//       {/* Y-Axis Drop Zone */}
//       <div 
//         onDrop={handleYAxisDrop}
//         onDragOver={handleYAxisDragOver}
//         onDragLeave={handleYAxisDragLeave}
//         style={{
//           border: '2px dashed #1E74DF',
//           padding: '12px',
//           marginBottom: '12px',
//           borderRadius: '8px',
//           backgroundColor: dragOverYAxis ? 'rgba(46, 144, 245, 0.2)' : 'rgba(17, 94, 205, 0.1)',
//           borderColor: dragOverYAxis ? '#2D90F5' : '#1E74DF',
//           borderStyle: dragOverYAxis ? 'solid' : 'dashed',
//           transition: 'all 0.3s ease'
//         }}
//       >
//         {chartFields?.yAxis ? (
//           <div style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             background: 'rgba(33, 91, 153, 0.8)',
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #115ECD'
//           }}>
//             <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
//               Y-Axis: {chartFields.yAxis} ({yAxisOperation})
//             </span>
//             <button 
//               onClick={() => removeField(chartKey, "yAxis")}
//               style={{ 
//                 background: 'linear-gradient(135deg, #dc3545, #c82333)', 
//                 color: 'white', 
//                 border: 'none', 
//                 borderRadius: '50%', 
//                 width: '22px', 
//                 height: '22px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: 'bold',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//             >
//               ×
//             </button>
//           </div>
//         ) : (
//           <div style={{ 
//             color: '#FFFFFF', 
//             textAlign: 'center',
//             fontSize: '14px',
//             fontWeight: '500'
//           }}>
//             {dragOverYAxis ? 'Release to drop Y-Axis here' : 'Drop Y-Axis Here (Numeric Values)'}
//           </div>
//         )}
//       </div>

//       {/* Chart Render Area */}
//       <div style={{ 
//         marginTop: '20px',
//         height: '300px',
//         background: 'rgba(24, 62, 117, 0.3)',
//         borderRadius: '8px',
//         padding: '10px',
//         overflow: 'hidden'
//       }}>
//         {renderChart()}
//       </div>

//       {/* Chart Statistics */}
//       {processedData.length > 0 && (
//         <div style={{ 
//           marginTop: '15px', 
//           padding: '10px', 
//           background: 'rgba(255,255,255,0.1)', 
//           borderRadius: '6px' 
//         }}>
//           <div style={{ color: 'white', fontSize: '12px' }}>
//             <strong>Data Summary:</strong> {processedData.length} categories • 
//             Operation: {yAxisOperation.charAt(0).toUpperCase() + yAxisOperation.slice(1)} • 
//             Total Records: {rows.length}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChartTemplate;