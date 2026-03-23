// // src/components/ChartRenderer.jsx
// import Highcharts from "highcharts";
// import HighchartsReact from "highcharts-react-official";

// const ChartRenderer = ({ config }) => {
//   try {
//     console.log("🟨 Chart config:", config);

//     if (!config || !config.series) {
//       return <p style={{ color: "orange" }}>⚠️ No valid chart config provided.</p>; 
//     }

//     return <HighchartsReact highcharts={Highcharts} options={config} />;
//   } catch (e) {
//     console.error("Chart render error:", e);
//     return <p style={{ color: "red" }}>Chart rendering failed.</p>;
//   }
// };

// export default ChartRenderer;

// src/components/ChartRenderer.jsx
// import React, { useEffect, useRef } from "react";
// import Highcharts from "highcharts";
// import HighchartsReact from "highcharts-react-official";

// const ChartRenderer = ({ config }) => {
//   const chartRef = useRef();

//   useEffect(() => {
//     console.log("🔍 ChartRenderer mounted with config:", config);
//     console.log("🔍 Highcharts available:", !!Highcharts);
//     console.log("🔍 HighchartsReact available:", !!HighchartsReact);
//   }, [config]);

//   // Debug: Log the exact config structure
//   console.log("📊 Raw config received:", JSON.stringify(config, null, 2));

//   try {
//     // Check if config exists and has required properties
//     if (!config) {
//       console.error("❌ No config provided");
//       return (
//         <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
//           <p style={{ color: "orange" }}>⚠️ No chart configuration provided.</p>
//         </div>
//       );
//     }

//     if (!config.series || !Array.isArray(config.series) || config.series.length === 0) {
//       console.error("❌ Invalid series data:", config.series);
//       return (
//         <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
//           <p style={{ color: "orange" }}>⚠️ No valid chart series data.</p>
//         </div>
//       );
//     }

//     // Validate series data
//     for (let i = 0; i < config.series.length; i++) {
//       const series = config.series[i];
//       if (!series.data || !Array.isArray(series.data)) {
//         console.error(`❌ Invalid data for series ${i}:`, series);
//         return (
//           <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
//             <p style={{ color: "red" }}>⚠️ Invalid series data structure.</p>
//           </div>
//         );
//       }
//     }

//     // Create a clean chart configuration
//     const chartOptions = {
//       chart: {
//         type: config.chart?.type || 'column',
//         height: 400,
//         backgroundColor: 'transparent',
//         style: {
//           fontFamily: 'Arial, sans-serif'
//         }
//       },
//       title: {
//         text: config.title?.text || 'Chart',
//         style: {
//           color: '#333',
//           fontSize: '16px',
//           fontWeight: 'bold'
//         }
//       },
//       xAxis: {
//         categories: config.xAxis?.categories || [],
//         title: {
//           text: config.xAxis?.title?.text || 'Category',
//           style: {
//             color: '#666'
//           }
//         },
//         labels: {
//           style: {
//             color: '#666'
//           }
//         }
//       },
//       yAxis: {
//         title: {
//           text: config.yAxis?.title?.text || 'Value',
//           style: {
//             color: '#666'
//           }
//         },
//         labels: {
//           style: {
//             color: '#666'
//           }
//         }
//       },
//       series: config.series.map((series, index) => ({
//         name: series.name || `Series ${index + 1}`,
//         data: series.data || [],
//         color: index === 0 ? '#ff6b6b' : '#4ecdc4' // Custom colors
//       })),
//       credits: {
//         enabled: false
//       },
//       legend: {
//         enabled: true,
//         align: 'center',
//         verticalAlign: 'bottom',
//         itemStyle: {
//           color: '#333'
//         }
//       },
//       tooltip: {
//         shared: true,
//         useHTML: true,
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         borderColor: '#ccc',
//         style: {
//           color: '#333'
//         }
//       },
//       plotOptions: {
//         column: {
//           dataLabels: {
//             enabled: false
//           },
//           borderWidth: 0,
//           shadow: false
//         },
//         series: {
//           animation: {
//             duration: 1000
//           }
//         }
//       }
//     };

//     console.log("✅ Final chart options:", JSON.stringify(chartOptions, null, 2));

//     return (
//       <div style={{ 
//         width: '100%', 
//         height: '450px', 
//         padding: '10px',
//         border: '1px solid #e0e0e0',
//         borderRadius: '8px',
//         backgroundColor: '#fafafa'
//       }}>
//         <HighchartsReact 
//           ref={chartRef}
//           highcharts={Highcharts} 
//           options={chartOptions}
//           containerProps={{ 
//             style: { 
//               height: '100%', 
//               width: '100%',
//               minHeight: '400px'
//             } 
//           }}
//         />
//       </div>
//     );

//   } catch (error) {
//     console.error("❌ Chart render error:", error);
//     console.error("❌ Error stack:", error.stack);
//     return (
//       <div style={{ 
//         padding: "20px", 
//         border: "1px solid #ff6b6b", 
//         borderRadius: "4px",
//         backgroundColor: "#fff5f5"
//       }}>
//         <p style={{ color: "red", margin: 0 }}>
//           ❌ Chart rendering failed: {error.message}
//         </p>
//         <details style={{ marginTop: "10px" }}>
//           <summary style={{ cursor: "pointer", color: "#666" }}>
//             Show Error Details
//           </summary>
//           <pre style={{ 
//             fontSize: "12px", 
//             color: "#666", 
//             marginTop: "5px",
//             whiteSpace: "pre-wrap"
//           }}>
//             {error.stack}
//           </pre>
//         </details>
//       </div>
//     );
//   }
// };

// export default ChartRenderer;



// src/components/ChartRenderer.jsx
import React, { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Import additional Highcharts modules for advanced chart types
import HighchartsMore from "highcharts/highcharts-more";
// import HighchartsFunnel from "highcharts/modules/funnel";
// import HighchartsTreemap from "highcharts/modules/treemap";
// import HighchartsHeatmap from "highcharts/modules/heatmap";
// import HighchartsGantt from "highcharts/modules/gantt";
import HeatmapModule from "highcharts/modules/heatmap";
import TreemapModule from "highcharts/modules/treemap";
import GanttModule from "highcharts/modules/gantt";
import FunnelModule from "highcharts/modules/funnel";
// import HighchartsWaterfall from "highcharts/modules/waterfall";

// Initialize modules
if (typeof HighchartsMore === "function") HighchartsMore(Highcharts);
// HighchartsFunnel(Highcharts);
if (typeof HeatmapModule === "function") HeatmapModule(Highcharts);
// HighchartsHeatmap(Highcharts);
if (typeof GanttModule === "function") GanttModule(Highcharts);
if (typeof FunnelModule === "function") FunnelModule(Highcharts);
if (typeof TreemapModule === "function") TreemapModule(Highcharts);

// HighchartsWaterfall(Highcharts);

const ChartRenderer = ({ config }) => {
  const chartRef = useRef();

  useEffect(() => {
    console.log("🔍 ChartRenderer mounted with config:", config);
    console.log("🔍 Highcharts available:", !!Highcharts);
    console.log("🔍 HighchartsReact available:", !!HighchartsReact);
  }, [config]);

  // Debug: Log the exact config structure
  console.log("📊 Raw config received:", JSON.stringify(config, null, 2));

  try {
    // Check if config exists and has required properties
    if (!config) {
      console.error("❌ No config provided");
      return (
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <p style={{ color: "orange" }}>⚠️ No chart configuration provided.</p>
        </div>
      );
    }

    if (!config.series || !Array.isArray(config.series) || config.series.length === 0) {
      console.error("❌ Invalid series data:", config.series);
      return (
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <p style={{ color: "orange" }}>⚠️ No valid chart series data.</p>
        </div>
      );
    }

    // Validate series data based on chart type
    const chartType = config.chart?.type || 'column';
    
    for (let i = 0; i < config.series.length; i++) {
      const series = config.series[i];
      if (!series.data || !Array.isArray(series.data)) {
        console.error(`❌ Invalid data for series ${i}:`, series);
        return (
          <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
            <p style={{ color: "red" }}>⚠️ Invalid series data structure.</p>
          </div>
        );
      }
    }

    // Get chart type for specific configurations
    const isRadarChart = config.chart?.polar === true;
    const isPieChart = chartType === 'pie';
    const isBubbleChart = chartType === 'bubble';
    const isHeatmapChart = chartType === 'heatmap';
    const isTreemapChart = chartType === 'treemap';
    const isFunnelChart = chartType === 'funnel';
    const isWaterfallChart = chartType === 'waterfall';
    const isGanttChart = chartType === 'gantt';

    // ✅ Sanitize series data to avoid 'zIndex' or undefined errors
// ✅ Clean & validate series and dataLabels structure
config.series = config.series.map((series, index) => {
  let data = Array.isArray(series.data)
    ? series.data.filter((d) => d !== undefined && d !== null)
    : [];

  const chartType = config.chart?.type;

  if (chartType === 'bubble') {
    data = data.filter(d => typeof d === 'object' && 'x' in d && 'y' in d && 'z' in d);
  } else if (chartType === 'heatmap') {
    data = data.filter(d => Array.isArray(d) && d.length >= 3);
  } else if (chartType === 'treemap') {
    data = data.filter(d => typeof d === 'object' && 'value' in d);
  } else if (chartType === 'waterfall') {
    data = data.filter(d =>
      typeof d === 'object' && ('y' in d || 'isIntermediateSum' in d || 'isSum' in d)
    );
  }

  // ✅ Sanitize dataLabels object
  const defaultDataLabels = {
    enabled: false,
    style: { fontSize: '12px', fontWeight: 'normal', color: '#333' }
  };

  return {
    ...series,
    data,
    dataLabels: {
      ...defaultDataLabels,
      ...(series.dataLabels || {})
    }
  };
});



    // Create a clean chart configuration with enhanced options
    const chartOptions = {
      chart: {
        type: chartType,
        height: isTreemapChart ? 500 : (isRadarChart ? 450 : 400),
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Arial, sans-serif'
        },
        polar: config.chart?.polar || false,
        zoomType: config.chart?.zoomType || (isBubbleChart ? 'xy' : undefined),
        plotBorderWidth: config.chart?.plotBorderWidth || (isBubbleChart ? 1 : undefined),
        marginTop: config.chart?.marginTop || (isHeatmapChart ? 40 : undefined),
        marginBottom: config.chart?.marginBottom || (isHeatmapChart ? 80 : undefined),
        marginRight: config.chart?.marginRight || (isFunnelChart ? 100 : undefined)
      },
      
      title: {
        text: config.title?.text || 'Chart',
        style: {
          color: '#333',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      
      xAxis: isRadarChart ? {
        categories: config.xAxis?.categories || [],
        tickmarkPlacement: config.xAxis?.tickmarkPlacement || 'on',
        lineWidth: config.xAxis?.lineWidth || 0
      } : {
        categories: config.xAxis?.categories || [],
        title: {
          text: config.xAxis?.title?.text || 'Category',
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            color: '#666'
          }
        },
        type: config.xAxis?.type || undefined
      },
      
      yAxis: isRadarChart ? {
        gridLineInterpolation: config.yAxis?.gridLineInterpolation || 'polygon',
        lineWidth: config.yAxis?.lineWidth || 0,
        min: config.yAxis?.min || 0
      } : {
        title: {
          text: config.yAxis?.title?.text || 'Value',
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            color: '#666'
          }
        },
        min: config.yAxis?.min || undefined
      },

      // Color axis for heatmaps
      colorAxis: isHeatmapChart ? {
        min: config.colorAxis?.min || 0,
        minColor: config.colorAxis?.minColor || '#FFFFFF',
        maxColor: config.colorAxis?.maxColor || '#ff6b6b'
      } : undefined,

      series: config.series.map((series, index) => {
        const baseColor = index === 0 ? '#ff6b6b' : 
                         index === 1 ? '#4ecdc4' : 
                         index === 2 ? '#45b7d1' : 
                         index === 3 ? '#f39c12' : 
                         index === 4 ? '#9b59b6' : '#34495e';

        return {
          name: series.name || `Series ${index + 1}`,
          data: series.data || [],
          color: series.color || baseColor,
          innerSize: series.innerSize || (isPieChart && config.series[0]?.innerSize ? config.series[0].innerSize : undefined),
          pointPlacement: series.pointPlacement || (isRadarChart ? 'on' : undefined),
          layoutAlgorithm: series.layoutAlgorithm || (isTreemapChart ? 'squarified' : undefined),
          dataLabels: series.dataLabels || (isPieChart || isFunnelChart || isTreemapChart ? {
            enabled: true,
            format: series.dataLabels?.format || (isPieChart ? '<b>{point.name}</b>: {point.percentage:.1f} %' : undefined)
          } : undefined)
        };
      }),
      
      credits: {
        enabled: false
      },
      
      legend: {
        enabled: !isPieChart && !isTreemapChart,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          color: '#333'
        }
      },


      tooltip: {
  shared: false,            // ← only the bar you hover
  split: false,
  followPointer: true,      // tooltip follows the cursor
  useHTML: true,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderColor: '#ccc',
  style: { color: '#333' },

  formatter: function () {
    const p = this.point;

    // special chart types first
    if (isPieChart) {
      return `<b>${p.name}</b><br/>${this.series.name}: ${Highcharts.numberFormat(this.y,0)}<br/>Percentage: ${this.percentage.toFixed(1)}%`;
    }
    if (isBubbleChart) {
      return `<b>${p.name || 'Point'}</b><br/>X: ${this.x}<br/>Y: ${this.y}<br/>Size: ${p.z}`;
    }
    if (isHeatmapChart) {
      return `<b>${this.series.xAxis.categories[p.x]} / ${this.series.yAxis.categories[p.y]}</b><br/>Value: ${p.value}`;
    }
    if (isTreemapChart) {
      return `<b>${p.name}</b><br/>Value: ${p.value}`;
    }

    // default for column/bar/line/area — just the hovered bar
    return `<b>${this.x}</b><br/>
            <span style="color:${this.series.color}">●</span> ${this.series.name}: 
            <b>${Highcharts.numberFormat(this.y, 0)}</b>`;
  }
},
      
      // tooltip: {
      //   shared: !isPieChart && !isBubbleChart && !isHeatmapChart && !isTreemapChart,
      //   useHTML: true,
      //   backgroundColor: 'rgba(255, 255, 255, 0.9)',
      //   borderColor: '#ccc',
      //   style: {
      //     color: '#333'
      //   },
      //   formatter: function () {
      //           if (isPieChart) {
      //               return `<b>${this.point.name}</b><br/>${this.series.name}: ${this.y}<br/>Percentage: ${this.percentage.toFixed(1)}%`;
      //           } else if (isBubbleChart) {
      //               return `<b>${this.point.name || 'Point'}</b><br/>X: ${this.x}<br/>Y: ${this.y}<br/>Size: ${this.point.z}`;
      //           } else if (isHeatmapChart) {
      //               return `<b>${this.series.xAxis.categories[this.point.x]} / ${this.series.yAxis.categories[this.point.y]}</b><br/>Value: ${this.point.value}`;
      //           } else if (isTreemapChart) {
      //               return `<b>${this.point.name}</b><br/>Value: ${this.point.value}`;
      //           }

      //           // ✅ Fallback for line, column, area, etc.
      //           return `<b>${this.series.name}</b><br/>${this.y}`;
      //           }

      // },

      
      plotOptions: {
        line: {
            dataLabels: {
                enabled: true,
                format: '{y}%', // optional: shows % symbol
                style: {
                color: '#333',
                fontSize: '12px',
                fontWeight: 'bold'
                }
            },
            enableMouseTracking: true
            },
        series: {
    stickyTracking: true,   // easier to catch the bar
    states: {
      inactive: { opacity: 0.25 } // dim other series while hovering one
    }
  },
        column: {
          dataLabels: {
            enabled: false
          },
          borderWidth: 0,
          shadow: false,
          pointPadding: config.plotOptions?.column?.pointPadding || 0.2,
          groupPadding: config.plotOptions?.column?.groupPadding || 0.1
        },
        
        bar: {
          dataLabels: {
            enabled: false
          },
          borderWidth: 0,
          shadow: false
        },
        
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          },
          showInLegend: true
        },
        
        bubble: {
          minSize: '20%',
          maxSize: '20%',
          zMin: 0,
          zMax: 100
        },
        
        heatmap: {
          colsize: 1,
          tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.value}</b></td></tr>',
            footerFormat: '</table>',
            shared: false,
            useHTML: true
          }
        },
        
        treemap: {
          colorByPoint: true,
          layoutAlgorithm: 'squarified',
          alternateStartingDirection: true,
          levels: [{
            level: 1,
            layoutAlgorithm: 'sliceAndDice',
            dataLabels: {
              enabled: true,
              align: 'left',
              verticalAlign: 'top',
              style: {
                fontSize: '15px',
                fontWeight: 'bold'
              }
            }
          }]
        },
        
        funnel: {
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b> ({point.y:,.0f})',
            softConnector: true
          },
          neckWidth: '30%',
          neckHeight: '25%',
          width: '80%',
          height: '80%'
        },
        
        waterfall: {
          dataLabels: {
            enabled: true,
            style: {
              fontWeight: 'bold'
            }
          },
          pointPadding: 0
        },
        
        series: {
          animation: {
            duration: 1000
          },
          turboThreshold: 0 // Disable turbo threshold for large datasets
        }
      },

      // Responsive configuration
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    };

    // Apply specific configurations from the original config
    if (config.plotOptions) {
      chartOptions.plotOptions = {
        ...chartOptions.plotOptions,
        ...config.plotOptions
      };
    }

    console.log("✅ Final chart options:", JSON.stringify(chartOptions, null, 2));

    return (
      <div style={{ 
        width: '100%', 
        height: isTreemapChart ? '550px' : '450px', 
        padding: '10px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        overflow: 'hidden'
      }}>
        <HighchartsReact 
          ref={chartRef}
          highcharts={Highcharts} 
          options={chartOptions}
          containerProps={{ 
            style: { 
              height: '100%', 
              width: '100%',
              minHeight: isTreemapChart ? '500px' : '400px'
            } 
          }}
        />
      </div>
    );

  } catch (error) {
    console.error("❌ Chart render error:", error);
    console.error("❌ Error stack:", error.stack);
    return (
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ff6b6b", 
        borderRadius: "4px",
        backgroundColor: "#fff5f5"
      }}>
        <p style={{ color: "red", margin: 0 }}>
          ❌ Chart rendering failed: {error.message}
        </p>
        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", color: "#666" }}>
            Show Error Details
          </summary>
          <pre style={{ 
            fontSize: "12px", 
            color: "#666", 
            marginTop: "5px",
            whiteSpace: "pre-wrap"
          }}>
            {error.stack}
          </pre>
        </details>
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Chart Configuration Debug Info:</h4>
          <pre style={{ fontSize: "11px", color: "#555", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
};

export default ChartRenderer;