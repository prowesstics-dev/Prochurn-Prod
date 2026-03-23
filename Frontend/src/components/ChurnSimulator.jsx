// // import { textAlign } from 'html2canvas/dist/types/css/property-descriptors/text-align';
// import React, { useState, useMemo, useEffect ,useRef} from 'react';
// import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
// import { Select ,message, Spin} from "antd";

// const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
// // replaces: const n = (x) => Number(x ?? 0);
// const n = (x) => {
//   if (x == null) return 0;
//   const v = parseFloat(String(x).replace(/[^\d.-]/g, "")); // strip ₹ and commas
//   return Number.isFinite(v) ? v : 0;
// };



// const styles = {
//   container: {
//     minHeight: '100vh',
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)',
//     padding: '10px 24px 74px 24px',
//     fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
//     position: 'relative'
//   },
//   innerContainer: { maxWidth: '100%', margin: '0 auto', position: 'relative' },
//   header: {
//     textAlign: 'center',
//     background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
//     WebkitBackgroundClip: 'text',
//     WebkitTextFillColor: 'transparent',
//     WebkitTextStroke: '0.5px rgba(0,0,0,0.1)',
//     backgroundClip: 'text',
//     marginBottom: '50px',
//     fontSize: '40px',
//     fontWeight: '700',
//     letterSpacing: '-1px',
//     lineHeight: '1.5',
//     textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
//   },
//   headerSubtitle: {
//     textAlign: 'center',
//     color: '#718096',
//     marginTop: '-36px',
//     fontSize: '16px',
//     fontWeight: '500',
//     letterSpacing: '0.5px'
//   },
//   card: {
//     backgroundColor: '#f0f2f5',
//     borderRadius: '24px',
//     marginBottom: '32px',
//     boxShadow: `
//       12px 12px 24px rgba(163, 177, 198, 0.6),
//       -12px -12px 24px rgba(255, 255, 255, 0.8)
//     `,
//     position: 'relative',
//     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//     overflow: 'hidden',
//     marginTop : '-5px'
//   },
//   cardHover: {
//     transform: 'translateY(-4px)',
//     boxShadow: `
//       16px 16px 32px rgba(163, 177, 198, 0.7),
//       -16px -16px 32px rgba(255, 255, 255, 0.9)
//     `
//   },
//   cardHeader: {
//     background: 'linear-gradient(to right, #23345cff, #065279ff, #06b6d4)',
//     padding: '15px 32px',
//     position: 'relative',
//     borderRadius: '24px 24px 0 0'
//   },
//   cardContent: { padding: '0 32px 19px 32px' },
//   sectionTitle: {
//     fontSize: '22px',
//     fontWeight: '700',
//     color: '#ffffff',
//     letterSpacing: '-0.5px',
//     textShadow: '0 2px 4px rgba(0,0,0,0.1)'
//   },
//   sectionSubtitle: {
//     fontSize: '14px',
//     color: '#718096',
//     marginBottom: '28px',
//     fontWeight: '500',
//     textAlign: 'center'
//   },
//   selectContainer: {
//     marginTop: '-10px',
//     display: 'grid',
//     gridTemplateColumns: 'repeat(3, 1fr)',
//     gap: '32px'
//   },
//   selectGroup: { display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 999 },
//   label: { fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' },
//   select: {
//     padding: '16px 20px',
//     border: 'none',
//     borderRadius: '16px',
//     fontSize: '14px',
//     backgroundColor: '#f0f2f5',
//     color: '#2d3748',
//     outline: 'none',
//     fontFamily: 'inherit',
//     fontWeight: '500',
//     cursor: 'pointer',
//     boxShadow: `
//       inset 4px 4px 8px rgba(163, 177, 198, 0.4),
//       inset -4px -4px 8px rgba(255, 255, 255, 0.8)
//     `,
//     transition: 'all 0.2s ease'
//   },
//   selectFocus: {
//     boxShadow: `
//       inset 6px 6px 12px rgba(163, 177, 198, 0.5),
//       inset -6px -6px 12px rgba(255, 255, 255, 0.9),
//       0 0 0 3px rgba(102, 126, 234, 0.1)
//     `
//   },
//   ctaRow: {
//   display: "grid",
//   gridTemplateColumns: "1fr 1fr", // two equal columns
//   gap: 12,
//   marginTop: 18,
//   width: "100%",
// },

  
//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//     gap: '15px',
//     marginTop : '-15px'
//   },
//   statCard: {
//     backgroundColor: '#f0f2f5',
//     borderRadius: '20px',
//     padding: '24px',
//     position: 'relative',
//     transition: 'all 0.3s ease',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.8)
//     `
//   },
//   statCardHover: {
//     transform: 'translateY(-2px)',
//     boxShadow: `
//       12px 12px 24px rgba(163, 177, 198, 0.5),
//       -12px -12px 24px rgba(255, 255, 255, 0.9)
//     `
//   },
//   statRow: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '12px 0',
//     borderBottom: '1px solid rgba(163, 177, 198, 0.2)'
//   },
//   statRowLast: { borderBottom: 'none' },
//   statLabel: { fontSize: '13px', color: '#718096', fontWeight: '500' },
//   statValue: { fontSize: '14px', color: '#2d3748', fontWeight: '600' },
//   specialCard: { background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)', color: '#2d3748' },

//   combinedContainer: { display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start' },
//   filtersGrid: {
//     marginTop: '-10px',
//     display: 'grid',
//     gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
//     gap: '15px'
//   },

//   sliderGroup: {
//     backgroundColor: '#f0f2f5',
//     borderRadius: '20px',
//     padding: '24px',
//     marginBottom: '20px',
//     position: 'relative',
//     boxShadow: `
//       inset 6px 6px 12px rgba(163, 177, 198, 0.3),
//       inset -6px -6px 12px rgba(255, 255, 255, 0.8)
//     `
//   },
//   sliderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//   sliderLabel: { fontSize: '14px', fontWeight: '600', color: '#4a5568' },
//   slider: {
//     flex: 1,
//     width: '100%',
//     height: '5px',
//     marginTop: '10px',
//     borderRadius: '20px',
//     outline: 'none',
//     appearance: 'none',
//     cursor: 'pointer',
//     background: '#e2e8f0',
//     boxShadow: `
//       inset 2px 2px 4px rgba(163, 177, 198, 0.3),
//       inset -2px -2px 4px rgba(255, 255, 255, 0.8)
//     `
//   },
//   sliderRow: { display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" },
//   button: {
//     border: "none",
//     background: "transparent",
//     cursor: "pointer",
//     padding: 6,
//     borderRadius: 8,
//     color: "#000",
//     boxShadow: "4px 4px 8px rgba(163,177,198,0.05), -4px -4px 8px #fff",
//   },
//   sliderValue: { marginTop: '12px', fontSize: '14px', color: '#2d3748', fontWeight: '600', textAlign: 'right' },
//   sliderOriginal: { fontSize: '12px', color: '#a0aec0', fontWeight: '400', marginTop: '4px' },

//   resetWrap: {
//     position: 'absolute',
//     right: 24,
//     top: '50%',
//     transform: 'translateY(-50%)',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     padding: '8px 12px',
//     borderRadius: '14px',
//     cursor: 'pointer',
//     backgroundColor: '#f0f2f5',
//     color: '#4a5568',
//     boxShadow: `
//       4px 4px 8px rgba(163, 177, 198, 0.4),
//       -4px -4px 8px rgba(255, 255, 255, 0.8),
//       inset 2px 2px 4px rgba(163, 177, 198, 0.2),
//       inset -2px -2px 4px rgba(255, 255, 255, 0.8)
//     `
//   },
//   resetIcon: { fontSize: '18px', lineHeight: 1 },
//   resetHint: { fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px' },

//   metersRowFixed: {
//     position: 'relative',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '0 min(10vw, 100px)'
//   },
//   meterBox: { width: 240, display: 'flex', justifyContent: 'center' },

//   centerBadge: {
//     alignSelf: 'center',
//     justifySelf: 'center',
//     display: 'flex',
//     gap: '8px',
//     padding: '12px 18px',
//     borderRadius: '16px',
//     fontSize: '14px',
//     fontWeight: 600,
//     whiteSpace: 'nowrap',
//     boxShadow: '6px 6px 12px rgba(163,177,198,0.35), -6px -6px 12px #fff'
//   },
//   centerBadgeFixed: {
//     position: 'absolute',
//     left: '50%',
//     top: '35%',
//     transform: 'translate(-50%, -50%)',
//     zIndex: 5
//   },

//   meterValue: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     marginTop: '12px',
//     fontSize: '34px',
//     fontWeight: '800',
//     color: '#4a5568',
//     textShadow: '2px 2px 4px rgba(163, 177, 198, 0.3)'
//   },

//   resetButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#4a5568',
//     border: 'none',
//     padding: '16px 32px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     marginTop: '24px',
//     borderRadius: '16px',
//     fontFamily: 'inherit',
//     width: '100%',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.8)
//     `
//   },

//   primaryButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#2d3748',
//     border: 'none',
//     padding: '14px 28px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//     borderRadius: '16px',
//     fontFamily: 'inherit',
//     width: '100%',
//     position: 'relative',
//     overflow: 'hidden',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.8),
//       inset 2px 2px 4px rgba(255, 255, 255, 0.1)
//     `,
//     background: 'linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 50%, #f0f2f5 100%)'
//   },

//   primaryButtonHover: {
//     transform: 'translateY(-2px)',
//     boxShadow: `
//       12px 12px 24px rgba(163, 177, 198, 0.5),
//       -12px -12px 24px rgba(255, 255, 255, 0.9),
//       inset 3px 3px 6px rgba(255, 255, 255, 0.2)
//     `,
//     background: 'linear-gradient(145deg, #e8ecf0 0%, #f0f2f5 50%, #e8ecf0 100%)'
//   },

//   primaryButtonActive: {
//     transform: 'translateY(0px)',
//     boxShadow: `
//       inset 6px 6px 12px rgba(163, 177, 198, 0.3),
//       inset -6px -6px 12px rgba(255, 255, 255, 0.8)
//     `,
//     background: 'linear-gradient(145deg, #e0e4e8 0%, #f0f2f5 100%)'
//   },

//   // Secondary action buttons (Save, Show, Draft Email)
//   secondaryButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#4a5568',
//     border: 'none',
//     padding: '12px 24px',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     borderRadius: '14px',
//     fontFamily: 'inherit',
//     minWidth: '160px',
//     position: 'relative',
//     boxShadow: `
//       6px 6px 12px rgba(163, 177, 198, 0.3),
//       -6px -6px 12px rgba(255, 255, 255, 0.8),
//       inset 1px 1px 2px rgba(255, 255, 255, 0.1)
//     `,
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)'
//   },

//   secondaryButtonHover: {
//     transform: 'translateY(-1px)',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.9),
//       inset 2px 2px 4px rgba(255, 255, 255, 0.15)
//     `,
//     color: '#2d3748'
//   },

//   // Special button for "Auto-suggest" with accent colors
//   accentButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#0284c7',
//     border: 'none',
//     padding: '14px 28px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//     borderRadius: '16px',
//     fontFamily: 'inherit',
//     width: '100%',
//     position: 'relative',
//     overflow: 'hidden',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.8),
//       inset 2px 2px 4px rgba(6, 182, 212, 0.1)
//     `,
//     background: 'linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 50%, #f0f8ff 100%)'
//   },

//   accentButtonHover: {
//     transform: 'translateY(-2px)',
//     color: '#0369a1',
//     boxShadow: `
//       12px 12px 24px rgba(163, 177, 198, 0.5),
//       -12px -12px 24px rgba(255, 255, 255, 0.9),
//       inset 3px 3px 6px rgba(6, 182, 212, 0.15)
//     `,
//     background: 'linear-gradient(145deg, #e8ecf0 0%, #f0f2f5 50%, #f0f8ff 100%)'
//   },

//   // Reset/Clear buttons with warning accent
//   resetButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#dc2626',
//     border: 'none',
//     padding: '10px 20px',
//     fontSize: '12px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     borderRadius: '12px',
//     fontFamily: 'inherit',
//     boxShadow: `
//       4px 4px 8px rgba(163, 177, 198, 0.3),
//       -4px -4px 8px rgba(255, 255, 255, 0.8),
//       inset 1px 1px 2px rgba(220, 38, 38, 0.1)
//     `,
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #fef2f2 100%)'
//   },

//   resetButtonHover: {
//     transform: 'translateY(-1px)',
//     color: '#b91c1c',
//     boxShadow: `
//       6px 6px 12px rgba(163, 177, 198, 0.4),
//       -6px -6px 12px rgba(255, 255, 255, 0.9),
//       inset 2px 2px 4px rgba(220, 38, 38, 0.15)
//     `
//   },

//   // Success buttons (for save actions)
//   successButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#16a34a',
//     border: 'none',
//     padding: '12px 24px',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     borderRadius: '14px',
//     fontFamily: 'inherit',
//     minWidth: '160px',
//     boxShadow: `
//       6px 6px 12px rgba(163, 177, 198, 0.3),
//       -6px -6px 12px rgba(255, 255, 255, 0.8),
//       inset 1px 1px 2px rgba(22, 163, 74, 0.1)
//     `,
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #f0fdf4 100%)'
//   },

//   successButtonHover: {
//     transform: 'translateY(-1px)',
//     color: '#15803d',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.9),
//       inset 2px 2px 4px rgba(22, 163, 74, 0.15)
//     `
//   },
//   inlineLoader: {
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   padding: '8px 0',
//   color: '#64748b'
// },


//   // Success buttons (for save actions)
//   successButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#16a34a',
//     border: 'none',
//     padding: '12px 24px',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     borderRadius: '14px',
//     fontFamily: 'inherit',
//     minWidth: '160px',
//     boxShadow: `
//       6px 6px 12px rgba(163, 177, 198, 0.3),
//       -6px -6px 12px rgba(255, 255, 255, 0.8),
//       inset 1px 1px 2px rgba(22, 163, 74, 0.1)
//     `,
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #f0fdf4 100%)'
//   },


// headerBtnRow: {
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'flex-end',
//   gap: 8,
//   flexWrap: 'nowrap' // keep them in one line for a tidy header
// },
// headerButton: {
//   width: 'auto',         // overrides accentButton's 100%
//   minWidth: 180,
//   padding: '12px 24px',  // same height/feel for all
//   fontSize: 13,
//   borderRadius: 14,
//   lineHeight: 1.2
// },

//   // Info buttons (for show/display actions)
//   infoButton: {
//     backgroundColor: '#f0f2f5',
//     color: '#0369a1',
//     border: 'none',
//     padding: '12px 24px',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     borderRadius: '14px',
//     fontFamily: 'inherit',
//     minWidth: '160px',
//     boxShadow: `
//       6px 6px 12px rgba(163, 177, 198, 0.3),
//       -6px -6px 12px rgba(255, 255, 255, 0.8),
//       inset 1px 1px 2px rgba(3, 105, 161, 0.1)
//     `,
//     background: 'linear-gradient(135deg, #f0f2f5 0%, #eff6ff 100%)'
//   },


//   infoButtonHover: {
//     transform: 'translateY(-1px)',
//     color: '#0284c7',
//     boxShadow: `
//       8px 8px 16px rgba(163, 177, 198, 0.4),
//       -8px -8px 16px rgba(255, 255, 255, 0.9),
//       inset 2px 2px 4px rgba(3, 105, 161, 0.15)
//     `
//   },

//   impactSummary: {
//     marginTop: '24px',
//     padding: '24px',
//     backgroundColor: '#f0f2f5',
//     borderRadius: '20px',
//     position: 'relative',
//     boxShadow: `
//       inset 6px 6px 12px rgba(163, 177, 198, 0.3),
//       inset -6px -6px 12px rgba(255, 255, 255, 0.8)
//     `
//   },
//   impactTitle: { fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '12px', letterSpacing: '-0.5px' },
//   impactText: { fontSize: '14px', color: '#718096', lineHeight: '1.6', fontWeight: '400' },

//   waitingCard: {
//     textAlign: 'center',
//     padding: '80px 40px',
//     backgroundColor: '#f0f2f5',
//     borderRadius: '24px',
//     margin: '20px 0',
//     boxShadow: `
//       inset 8px 8px 16px rgba(163, 177, 198, 0.3),
//       inset -8px -8px 16px rgba(255, 255, 255, 0.8)
//     `
//   },
//   waitingIcon: { fontSize: '64px', marginBottom: '32px', color: '#667eea', filter: 'drop-shadow(2px 2px 4px rgba(163, 177, 198, 0.3))' },
//   waitingTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#4a5568', letterSpacing: '-0.5px' },
//   waitingText: { fontSize: '16px', maxWidth: '500px', margin: '0 auto', color: '#718096', lineHeight: '1.6' }
// };

// const GaugeMeter = ({
//   value = 0, label = "Risk Level", size = 220, strokeWidth = 12,
//   dynamicColor = true, color, thresholds = { low: 40, high: 70 },
//   trackColor = "#f1f5f9", fontColor = "#1f2937", subTextColor = "#64748b"
// }) => {
//   const v = Math.max(0, Math.min(100, Number(value) || 0));
//   const getRiskColor = (x) =>
//     x > thresholds.high ? "#e53e3e" : x > thresholds.low ? "#dd6b20" : "#38a169";
//   const strokeColor = dynamicColor ? getRiskColor(v) : (color || "#3B82F6");

//   const cx = size / 2, cy = size / 2, radius = size * 0.4;
//   const circumference = 2 * Math.PI * radius;
//   const dashOffset = circumference * (1 - v / 100);

//   return (
//     <div aria-label={`Gauge ${label} ${v.toFixed(1)}%`} role="img" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
//       <div style={{ position: "relative" }}>
//         <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
//           <circle cx={cx} cy={cy} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
//           <circle
//             cx={cx} cy={cy} r={radius} fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
//             strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
//             style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1), stroke 250ms ease-in" }}
//           />
//         </svg>
//         <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
//           <div style={{ fontSize: 32, fontWeight: 800, color: fontColor }}>{v.toFixed(1)}%</div>
//           <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: subTextColor }}>{label}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ChurnSimulator = () => {
//   const API_BASE_URL = import.meta.env.VITE_API_URL;

//   const SAVE_SELECTED_URL = `${API_BASE_URL}/churn/save-selected`;
//   const DRAFT_EMAIL_URL   = `${API_BASE_URL}/churn/draft-email`;


//   // Selection
//   const [selectedSegment, setSelectedSegment] = useState("Select");
//   const [selectedPolicy, setSelectedPolicy] = useState("Select");
//   const [selectedProbability, setSelectedProbability] = useState("Select");
//   const [segments, setSegments] = useState(["Select"]);
//   const [policies, setPolicies] = useState(["Select"]);
//   const [policyOpts, setPolicyOpts] = useState([]);
//   const [probabilityOpts, setProbabilityOpts] = useState([]);
//   const [drafting, setDrafting] = useState(false);
//   // Data
//   const [currentRow, setCurrentRow] = useState(null);
//   const [paramRanges, setParamRanges] = useState({});

//   // UI
//   const [hoveredCard, setHoveredCard] = useState(null);
//   const [hoveredStat, setHoveredStat] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [saveBusy, setSaveBusy] = useState(false);
//   const [latestBusy, setLatestBusy] = useState(false);

//   // Sliders & coupling
//   const [adjustedParams, setAdjustedParams] = useState({});
//   const [coupledPreviewRow, setCoupledPreviewRow] = useState(null); // row from server with coupling applied
//   const coupleTimerRef = useRef(null);
//   const couplingGuardRef = useRef(false);
//   const [couplingBusy, setCouplingBusy] = useState(false);

//   // Run results & gating
//   const [baselinePct, setBaselinePct] = useState(0);
//   const [manualResult, setManualResult] = useState(null);     // {baseline_pct, updated_pct, row}
//   const [autoTrials, setAutoTrials] = useState([]);
//   const [autoBest, setAutoBest] = useState(null);
//   const [finalManualRow, setFinalManualRow] = useState(null);
//   const [finalAutoRow, setFinalAutoRow] = useState(null);
//        // ⟵ only show after a button click
//   const [lastRunMode, setLastRunMode] = useState(null);       // 'manual' | 'auto'

//   // Misc
//   const [latestSaved, setLatestSaved] = useState(null);
//   const isSegmentChosen = selectedSegment !== "Select";
//   const isProbabilityChosen = selectedProbability !== "Select";
//   const PAGE_SIZE = 50;
//   const [polPage, setPolPage] = useState(1);
//   const [polHasMore, setPolHasMore] = useState(true);
//   const [polLoading, setPolLoading] = useState(false);
//   const [polQuery, setPolQuery] = useState("");

//   // Email
//   const [emailSubj, setEmailSubj] = useState("");
//   const [emailBody, setEmailBody] = useState("");
//   const [toEmail, setToEmail] = useState("");
//   const [ccEmail, setCcEmail] = useState("");
//   const [bccEmail, setBccEmail] = useState("");
//   const [emailSending, setEmailSending] = useState(false);

//   const [actionLoading, setActionLoading] = useState(false);
//   const [actionTip, setActionTip] = useState("");
//   const [previewPct, setPreviewPct] = useState(null);

//   const [showEmailComposer, setShowEmailComposer] = useState(false);
//   const emailSectionRef = useRef(null);
//   const [hideDraftButtons, setHideDraftButtons] = useState(false);

  

//  const paramToColumn = {
//     discount: "applicable discount with ncb",
//     od_premium: "total od premium",
//     tp_premium: "total tp premium",
//     idv: "vehicle idv",
//     add_on_premium: "before gst add-on gwp",
//     ncb: "ncb % previous year",
//   };
//   const colTitleMap = {
//     discount: "Discount Percentage",
//     od_premium: "Own Damage Premium",
//     tp_premium: "Third Party Premium",
//     idv: "Insured Declared Value",
//     add_on_premium: "Add-on Premium",
//     ncb: "No Claim Bonus",
//   };




//   const originalParams = useMemo(() => {
//   if (!currentRow) return {};
//   const m = {};
//   ["discount","od_premium","tp_premium","idv","add_on_premium","ncb"].forEach(k=>{
//     const col = paramToColumn[k];
//     const v = n(currentRow?.[col]);
//     if (Number.isFinite(v)) m[k] = v;
//   });
//   return m;
// }, [currentRow]);

// // Helper: min step used as tolerance (avoid flicker from tiny diffs)
// const stepFor = (param) => (param === "discount" || param === "ncb" ? 0.5 : 100);

// // Is any slider moved from its original policy value?
// // ====== Reasons → slider keys ======
// const paramKeys = useMemo(() => {
//   if (!currentRow) return [];
//   return getAdjustableParameters(currentRow["Top 3 Reasons"]);
// }, [currentRow]);

// // Is any slider moved from its original policy value?
// const hasSliderChanges = useMemo(() => {
//   if (!currentRow || !paramKeys.length) return false;
//   return paramKeys.some((k) => {
//     const cur  = n(adjustedParams[k] ?? originalParams[k]);
//     const orig = n(originalParams[k]);
//     const tol  = stepFor(k) / 2; // small tolerance to avoid flicker
//     return Math.abs(cur - orig) > tol;
//   });
// }, [adjustedParams, originalParams, paramKeys, currentRow]);



//   // Utility
//   function getAdjustableParameters(reasons) {
//     if (!reasons) return [];
//     const adjustableMap = {
//       "Low Vehicle IDV": "idv",
//       "High Own-Damage Premium": "od_premium",
//       "High Third-Party Premium": "tp_premium",
//       "High Add-On Premium": "add_on_premium",
//       "Low Discount with NCB": "discount",
//       "Low No Claim Bonus Percentage": "ncb",
//     };
//     const fallbackParams = ["idv","od_premium","tp_premium","discount"];
//     const nonAdjustable = ["Young Vehicle Age","Old Vehicle Age","Claims Happened","Multiple Claims on Record","Minimal Policies Purchased","Tie Up with Non-OEM"];
//     const adj = new Set(); let sawNA = false;
//     String(reasons).split(/,|\band\b/).map(r => r.trim()).filter(Boolean).forEach(reason=>{
//       if (adjustableMap[reason]) adj.add(adjustableMap[reason]);
//       else if (nonAdjustable.includes(reason)) sawNA = true;
//     });
//     if (sawNA) fallbackParams.forEach(p=>adj.add(p));
//     return Array.from(adj);
//   }




//   // ⬇️ put this just below resetSlidersToOriginal
// const resetAllState = () => {
//   if (!currentRow) return;
//   // prevent coupling effect from firing during reset
//   couplingGuardRef.current = true;

//   // restore sliders to policy’s original values
//   setAdjustedParams(originalParams);

//   // clear all simulation/preview state
//   setCoupledPreviewRow(null);
//   setManualResult(null);
//   setAutoTrials([]);
//   setAutoBest(null);
//   setFinalManualRow(null);
//   setFinalAutoRow(null);
//   setPreviewPct(null);
//   setLastRunMode(null);

//   // clear any transient loaders/tips
//   setActionLoading(false);
//   setActionTip("");
//   setSaveBusy(false);
//   setLatestBusy(false);
//   setShowEmailComposer(false);
//   setHideDraftButtons(false);


//   // release the guard after state is set
//   setTimeout(() => { couplingGuardRef.current = false; }, 0);
// };



// const resetSlidersToOriginal = () => {
//   if (!currentRow) return;

//   couplingGuardRef.current = true;

//   // sliders back to original policy values
//   setAdjustedParams(originalParams);

//   // clear preview & simulation state
//   setCoupledPreviewRow(null);
//   setPreviewPct(null);
//   setManualResult(null);
//   setAutoTrials([]);
//   setAutoBest(null);
//   setFinalManualRow(null);
//   setFinalAutoRow(null);
//   setLastRunMode(null);        // <-- super important

//   // UI clean-up
//   setActionLoading(false);
//   setActionTip("");
//   setSaveBusy(false);
//   setLatestBusy(false);
//   setShowEmailComposer(false);
//   setHideDraftButtons(false);

//   setTimeout(() => { couplingGuardRef.current = false; }, 0);
// };




//   const handleMinStep = (param) => (param === "discount" || param === "ncb" ? 0.5 : 100);

//   // ====== Fetch segments & ranges ======
//   useEffect(() => {
//     fetch(`${API_BASE_URL}/churn/segments`)
//       .then((r) => r.json())
//       .then((data) => {
//         if (Array.isArray(data.segments)) {
//           const order = ["Platinum", "Gold", "Silver"];
//           const sorted = data.segments.sort((a,b)=>{
//             const ai = order.indexOf(a), bi = order.indexOf(b);
//             if (ai===-1 && bi===-1) return a.localeCompare(b);
//             if (ai===-1) return 1; if (bi===-1) return -1; return ai-bi;
//           });
//           setSegments(["Select", ...sorted]);
//         }
//       }).catch(()=>{});
//   }, [API_BASE_URL]);

//   useEffect(() => {
//   if (currentRow) setShowEmailComposer(false);
// }, [adjustedParams, currentRow]);

//   useEffect(() => {
//     fetch(`${API_BASE_URL}/churn/param-ranges`)
//       .then((r)=>r.json())
//       .then((data)=>{ if (data && data.ranges) setParamRanges(data.ranges); })
//       .catch(()=>{});
//   }, [API_BASE_URL]);

//   // ====== Policy list (paged) ======
//   const fetchPolicies = async (page=1, q="") => {
//     if (!isSegmentChosen || !isProbabilityChosen) return;
//     setPolLoading(true);
//     try {
//       const params = new URLSearchParams({
//         segment: selectedSegment, page: String(page), page_size: String(PAGE_SIZE), q
//       });
//       if (selectedProbability !== "Select") params.append('probability_range', selectedProbability);
//       const url = `${API_BASE_URL}/churn/policies?${params.toString()}`;
//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//       const data = await res.json();
//       const newItems = (data.policies || []).map(v => ({ value: v, label: v }));
//       setPolicyOpts(prev => page===1 ? newItems : [...prev, ...newItems.filter(x => !prev.some(p => p.value === x.value))]);
//       setPolHasMore(typeof data.hasMore === "boolean" ? data.hasMore : newItems.length === PAGE_SIZE);
//       setPolPage(page);
//     } catch {
//       if (page===1) setPolicyOpts([]);
//     } finally { setPolLoading(false); }
//   };
//   const searchTimerRef = useRef(null);
//   const debouncedSearch = (q) => {
//     if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
//     searchTimerRef.current = setTimeout(() => {
//       setPolQuery(q);
//       if (isSegmentChosen && isProbabilityChosen) fetchPolicies(1, q);
//     }, 300);
//   };
//   const handlePopupScroll = (e) => {
//     const { scrollTop, clientHeight, scrollHeight } = e.target;
//     const nearBottom = scrollTop + clientHeight >= scrollHeight - 8;
//     if (nearBottom && polHasMore && !polLoading && isSegmentChosen && isProbabilityChosen) {
//       fetchPolicies(polPage + 1, polQuery);
//     }
//   };

//   // ====== Selections reset ======
//   const handleSegmentChange = (segment) => {
//     const val = segment ?? "Select";
//     setSelectedSegment(val);
//     setSelectedProbability("Select");
//     setSelectedPolicy("Select");
//     setCurrentRow(null);
//     setPolicyOpts([]); setProbabilityOpts([]);
//     setAdjustedParams({});
//     setCoupledPreviewRow(null);
//     setManualResult(null); setAutoTrials([]); setAutoBest(null);
//     setFinalManualRow(null); setFinalAutoRow(null);
//     setBaselinePct(0);
//     setHideDraftButtons(false);

//     // setShowGauges
//      setLastRunMode(null);
//   };
//   useEffect(() => {
//     setPolicyOpts([]); setPolPage(1); setPolHasMore(true); setPolQuery("");
//     setSelectedPolicy("Select"); setCurrentRow(null);
//     if (isSegmentChosen && isProbabilityChosen) fetchPolicies(1, "");
//   }, [selectedSegment, selectedProbability, API_BASE_URL]);

//   useEffect(() => {
//     if (!selectedSegment || selectedSegment==="Select") { setProbabilityOpts([]); setSelectedProbability("Select"); return; }
//     fetch(`${API_BASE_URL}/churn/probability?segment=${encodeURIComponent(selectedSegment)}`)
//       .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then(data=>{
//         if (!data || !Array.isArray(data.probability)) { setProbabilityOpts([]); return; }
//         const opts = data.probability.map(item => {
//           const pr = typeof item === "string" ? item : String(item.probability_range ?? "");
//           return { value: pr, label: pr };
//         });
//         setProbabilityOpts(opts);
//         if (selectedProbability !== "Select" && !opts.some(o => o.value === selectedProbability)) {
//           setSelectedProbability("Select");
//         }
//       }).catch(()=> setProbabilityOpts([]));
//   }, [API_BASE_URL, selectedSegment]);


//   const handlePolicyChange = (policyId) => {
//     setSelectedPolicy(policyId || "Select");
//     setAdjustedParams({});
//     setManualResult(null); setAutoTrials([]); setAutoBest(null);
//     setFinalManualRow(null); setFinalAutoRow(null);
//     setCoupledPreviewRow(null);
//     setHideDraftButtons(false);

//     // setShowGauges(false);
//      setLastRunMode(null);
//     if (!policyId || policyId === "Select") { setCurrentRow(null); return; }

//     setLoading(true);
//     fetch(`${API_BASE_URL}/churn/policy?policy_no=${encodeURIComponent(policyId)}`)
//       .then(r=>r.json())
//       .then(async (data) => {
//         if (data && data.data) {
//           setCurrentRow(data.data);
          
//         }
//       })
//       .catch(()=>{})
//       .finally(()=> setLoading(false));
//   };

 
//   // ====== Baseline helpers ======
//   const baseline = useMemo(() => {
//     if (!currentRow) return 0;
//     const raw = n(currentRow["Churn Probability"]);
//     return raw <= 1 ? raw * 100 : raw;
//   }, [currentRow]);
//   const baselineVal = baseline;


//   const rightGaugeVal = useMemo(() => {
//   if (lastRunMode === 'auto') {
//     return Number.isFinite(autoBest?.churn_pct) ? autoBest.churn_pct : (previewPct ?? baselineVal);
//   }
//   if (Number.isFinite(manualResult?.updated_pct)) return manualResult.updated_pct;
//   if (Number.isFinite(previewPct)) return previewPct;
//   return baselineVal;
// }, [lastRunMode, autoBest, manualResult, previewPct, baselineVal]);


// const summaryRow = useMemo(() => {
//   if (lastRunMode === 'auto' && finalAutoRow) return finalAutoRow;
//   if (finalManualRow) return finalManualRow;
//   if (coupledPreviewRow) return coupledPreviewRow;
//   return currentRow;
// }, [lastRunMode, finalAutoRow, finalManualRow, coupledPreviewRow, currentRow]);


//   useEffect(() => {
//   if (!currentRow) return;

//   if (Object.keys(adjustedParams).length === 0) {
//     setCoupledPreviewRow(null);
//     setPreviewPct(null);            // NEW: reset preview gauge
//     return;
//   }

//   if (couplingGuardRef.current) return;
//   if (coupleTimerRef.current) clearTimeout(coupleTimerRef.current);

//   coupleTimerRef.current = setTimeout(async () => {
//     try {
//       setCouplingBusy(true);
//       const res = await fetch(`${API_BASE_URL}/churn/simulate-manual`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           policy_no: currentRow["policy no"],
//           sliders: adjustedParams,
//           preview: true
//         })
//       });
//       const js = await res.json();
//       if (res.ok && js?.row) {
//         // map server-coupled values back into sliders
//         const next = { ...adjustedParams };
//         ["discount","od_premium","tp_premium","idv","add_on_premium","ncb"].forEach(k=>{
//           const col = paramToColumn[k];
//           const v = js.row[col];
//           if (v != null && !Number.isNaN(+v)) next[k] = +v;
//         });
//         const changed = JSON.stringify(next) !== JSON.stringify(adjustedParams);
//         if (changed) {
//           couplingGuardRef.current = true;
//           setAdjustedParams(next);
//           setTimeout(()=> { couplingGuardRef.current = false; }, 0);
//         }
//         setCoupledPreviewRow(js.row);
//         setPreviewPct(
//           typeof js.updated_pct === "number" ? js.updated_pct : null // NEW
//         );
//       }
//     } catch(e) {
//       // ignore
//     } finally {
//       setCouplingBusy(false);
//     }
//   }, 300);

//   return () => clearTimeout(coupleTimerRef.current);
// }, [adjustedParams, currentRow, API_BASE_URL]);





// // Simulate with current sliders and get a definitive row + pct
// const simulateManualNow = async () => {
//   const res = await fetch(`${API_BASE_URL}/churn/simulate-manual`, {
//     method:"POST", headers:{ "Content-Type":"application/json" },
//     body: JSON.stringify({
//       policy_no: currentRow["policy no"],
//       sliders: adjustedParams || {}
//     })
//   });
//   const js = await res.json();
//   if (!res.ok) throw new Error(js?.error || "Manual simulation failed");
//   return js; // {baseline_pct, updated_pct, row, deltas}
// };

// // Save the current 'manual' (slider) result, update UI, show in summary
// const handleSaveManual = async () => {
//   if (!currentRow) return;
//   try {
//     setHideDraftButtons(true);
//     setSaveBusy(true);
//     const js = await simulateManualNow();
//     setManualResult(js);
//     setFinalManualRow(js.row);
//     setLastRunMode('manual');

//     // Persist
//     const res2 = await fetch(`${API_BASE_URL}/churn/save-selected`, {
//       method:"POST", headers:{"Content-Type":"application/json"},
//       body: JSON.stringify({
//         policy_no: currentRow["policy no"],
//         selection_type: "Manual Simulation",
//         selected_row: js.row
//       })
//     });
//     const js2 = await res2.json();
//     if (!res2.ok) throw new Error(js2?.error || "Save failed");

//        // optional: immediately draft & show email so the Draft button isn't needed
//    await draftEmailNow();
//    setShowEmailComposer(true);

//     message.success("Saved Selected changes (Manual)");
//   } catch (e) {
//     message.error(String(e.message || e));
//   } finally {
//     setSaveBusy(false);
//   }
// };


// const handleSaveSuggested = async () => {
//   if (!currentRow || !finalAutoRow) { message.warning("Run Auto-suggest first"); return; }
//   try {
//     setSaveBusy(true);
//     const res = await fetch(`${API_BASE_URL}/churn/save-selected`, {
//       method:"POST", headers:{"Content-Type":"application/json"},
//       body: JSON.stringify({
//         policy_no: currentRow["policy no"],
//         selection_type: "Smart Auto-suggest",
//         selected_row: finalAutoRow
//       })
//     });
//     const js = await res.json();
//     if (!res.ok) throw new Error(js?.error || "Save failed");
//     message.success("Saved Selected changes (Auto)");
//   } catch(e) {
//     message.error(String(e.message || e));
//   } finally {
//     setSaveBusy(false);
//   }
// };


// const saveBaselineAndDraft = async () => {
//   if (!currentRow) return;
//   try {
//     setLatestBusy(true);
//     const res = await fetch(`${API_BASE_URL}/churn/simulate-manual`, {
//       method:"POST", headers:{ "Content-Type":"application/json" },
//       body: JSON.stringify({ policy_no: currentRow["policy no"], sliders: {} })
//     });
//     const js = await res.json();
//     if (!res.ok) throw new Error(js?.error || "Baseline simulate failed");

//     const res2 = await fetch(`${API_BASE_URL}/churn/save-selected`, {
//       method:"POST", headers:{"Content-Type":"application/json"},
//       body: JSON.stringify({
//         policy_no: currentRow["policy no"],
//         selection_type: "Baseline",
//         selected_row: js.row
//       })
//     });
//     const js2 = await res2.json();
//     if (!res2.ok) throw new Error(js2?.error || "Save failed");

//     await draftEmailNow();                 // this also reveals & scrolls
//     setShowEmailComposer(true);         // safety (in case draftEmail short-circuits)
//     setTimeout(() => emailSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
//     message.success("Saved current parameters & drafted email");
//   } catch(e) {
//     message.error(String(e.message || e));
//   } finally {
//     setLatestBusy(false);
//   }
// };



//   const runAutoSuggest = async () => {
//     if (!currentRow) return;
//     try {
//       setHideDraftButtons(true);
//       setActionTip("Finding best changes…");
//       setActionLoading(true);
//       const res = await fetch(`${API_BASE_URL}/churn/auto-suggest`, {
//         method:"POST", headers:{ "Content-Type":"application/json" },
//         body: JSON.stringify({ policy_no: currentRow["policy no"] })
//       });
//       const js = await res.json();
//       if (!res.ok) throw new Error(js?.error || "Auto-suggest failed");
//       setAutoTrials(js.trials || []);
//       setAutoBest(js.best || null);
//       if (js.best?.row) {
//         setFinalAutoRow(js.best.row);
//         // reflect suggestion into sliders (still editable)
//         const suggested = {};
//         ["discount","od_premium","tp_premium","idv","add_on_premium","ncb"].forEach(k=>{
//           const col = paramToColumn[k];
//           const v = js.best.row[col];
//           if (v != null) suggested[k] = v;
//         });
//         setAdjustedParams(suggested);
//         setCoupledPreviewRow(js.best.row);
//       }
      
//       setLastRunMode('auto');
      
//       message.success("Auto-suggest complete");
//     } catch (e) {
//       message.error(String(e.message || e));
//     }finally {
//    setActionLoading(false);
//    setActionTip("");
//   }
// };

//   const showLatestSelected = async () => {
//   if (!currentRow) return;
//   try {
//     setLatestBusy(true); // <-- NEW
//     const res = await fetch(`${API_BASE_URL}/churn/latest-selected?policy_no=${encodeURIComponent(currentRow["policy no"])}`);
//     const js = await res.json();
//     if (!res.ok) throw new Error(js?.error || "No saved record");
//     setLatestSaved(js);
//     message.info("Loaded latest saved Selected changes");
//     await draftEmailNow();
//   } catch(e) {
//     message.warning(String(e.message || e));
//   } finally {
//     setLatestBusy(false); // <-- NEW
//   }
// };

//   const saveSelected = async (selectionType) => {
//   if (!currentRow) return;
//   const row = selectionType === "Manual Simulation" ? finalManualRow : finalAutoRow;
//   if (!row) { message.warning(`Run ${selectionType} first`); return; }
//   try {
//     setHideDraftButtons(true);
//     setSaveBusy(true);
//     const res = await fetch(`${API_BASE_URL}/churn/save-selected`, {
//       method:"POST", headers:{"Content-Type":"application/json"},
//       body: JSON.stringify({ policy_no: currentRow["policy no"], selection_type: selectionType, selected_row: row })
//     });
//     const js = await res.json();
//     if (!res.ok) throw new Error(js?.error || "Save failed");

//     // After a successful save, draft & reveal the email
//     await draftEmailNow();                          // fills subject/body and sets showEmailComposer(true)
//     setShowEmailComposer(true);                  // safety
//     setTimeout(() => emailSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

//     message.success("Saved Selected changes");
//   } catch(e) {
//     message.error(String(e.message || e));
//   } finally {
//     setSaveBusy(false);
//   }
// };



// const draftEmailNow = async () => {
//   if (!currentRow?.["policy no"]) {
//     message.warning("Select a policy first.");
//     return;
//   }

//   // open composer immediately
//   setShowEmailComposer(true);
//   setEmailSubj("");
//   setEmailBody("");
//   setDrafting(true);

//   try {
//     if (!API_BASE_URL) throw new Error("Missing API base URL (VITE_API_URL).");

//     // choose the best adjusted row if available, otherwise baseline/current row
//     const adjustedRow =
//       (lastRunMode === "auto"   && finalAutoRow)   ? finalAutoRow   :
//       (lastRunMode === "manual" && finalManualRow) ? finalManualRow :
//       (coupledPreviewRow || null);

//     const useAdjusted = adjustedRow && Object.keys(adjustedParams || {}).length > 0;
//     const chosenRow   = useAdjusted ? adjustedRow : currentRow;

//     // Build a "selected_row" payload similar to what backend expects,
//     // but we can just send `chosenRow` as-is because your Django save-selected
//     // only reads specific keys and recomputes totals if missing.
//     const selectedRow = { ...chosenRow };

//     const selectionType = useAdjusted ? "Manual Simulation (Frontend)" : "Actual Baseline";

//     // 1) SAVE the row snapshot
//     const saveRes = await fetch(SAVE_SELECTED_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         policy_no: currentRow["policy no"],
//         selection_type: selectionType,
//         selected_row: selectedRow
//       })
//     });

//     if (!saveRes.ok) {
//       const txt = await saveRes.text().catch(() => "");
//       throw new Error(txt || `Save failed (HTTP ${saveRes.status})`);
//     }

//     // 2) DRAFT email using the latest saved snapshot on the server
//     const res = await fetch(DRAFT_EMAIL_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ policy_no: currentRow["policy no"] })
//     });

//     if (!res.ok) {
//       const txt = await res.text().catch(() => "");
//       throw new Error(txt || `Draft failed (HTTP ${res.status})`);
//     }

//     const data = await res.json();
//     setEmailSubj(data.subject || "");
//     setEmailBody(data.body || "");
//   } catch (err) {
//     console.error("Draft email failed:", err);

//     // Keep composer open and show a safe fallback
//     const make = currentRow["make_clean"] || "";
//     const model = currentRow["model_clean"] || "";
//     const variant = currentRow["variant"] || "";
//     const disc = n(currentRow["applicable discount with ncb"]).toFixed(0);

//     const fallbackSubject = `Exclusive Renewal Offer for Your ${make} ${model}${variant ? ` (${variant})` : ""}!`;
//     const fallbackBody = [
//       `Hi there,`,
//       ``,
//       `We’ve prepared a renewal offer for your ${make} ${model}${variant ? ` (${variant})` : ""}.`,
//       `You could get up to ${disc}% discount with optimised OD/TP and add-on review.`,
//       ``,
//       `Reply to this email and we’ll finalize the best price for you.`,
//       ``,
//       `Best regards,`,
//       `Retention Team`,
//     ].join("\n");

//     setEmailSubj((s) => s || fallbackSubject);
//     setEmailBody((b) => b || fallbackBody);
//     message.error("Couldn’t save & draft from server. Using a fallback template you can edit.");
//   } finally {
//     setDrafting(false);
//     setTimeout(() => emailSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
//   }
// };


//   const sendEmail = async () => {
//     if (!currentRow) return;
//     if (!toEmail.trim()) { message.warning("Add at least one recipient in To"); return; }
//     if (!emailSubj.trim() || !emailBody.trim()) { message.warning("Please fill Subject and Body before sending"); return; }
//     const parseList = (s) => s.split(",").map(v => v.trim()).filter(Boolean);
//     const payload = {
//       policy_no: currentRow["policy no"],
//       subject: emailSubj, body: emailBody,
//       to: parseList(toEmail), cc: parseList(ccEmail), bcc: parseList(bccEmail),
//     };
//     setEmailSending(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/churn/send-email`, {
//         method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
//       });
//       const js = await res.json().catch(() => ({}));
//       if (!res.ok) throw new Error(js?.error || "Send failed");
//       message.success("Email sent successfully");
//     } catch (e) {
//       message.error(String(e.message || e));
//     } finally { setEmailSending(false); }
//   };

//   // ====== Render ======
//   const probabilitySelectDisabled = !isSegmentChosen;
//   const policySelectDisabled = !isSegmentChosen || !isProbabilityChosen;

//   /* ------------------------------- render ------------------------------- */
//  return (
//   <div style={styles.container}>
//     <div style={styles.innerContainer}>
//       <style>{`@keyframes blink { 50% { opacity: 0.2; } }`}</style>

//       <h1 style={styles.header}>Churn Risk Simulator</h1>
//       <p style={styles.headerSubtitle}>Advanced Analytics Dashboard</p>

//       {/* Selection */}
//       <div
//         style={{ ...styles.card, ...(hoveredCard === "selector" ? styles.cardHover : {}) }}
//         onMouseEnter={() => setHoveredCard("selector")}
//         onMouseLeave={() => setHoveredCard(null)}
//       >
//         <div style={styles.cardHeader}>
//           <span style={styles.sectionTitle}>Customer Selection</span>
//         </div>
//         <div style={styles.cardContent}>
//           <p style={styles.sectionSubtitle}>
//             Choose a customer segment, then select a probability range to filter policies
//           </p>
//           <div style={styles.selectContainer}>
//             <div style={styles.selectGroup}>
//               <label style={styles.label}>Customer Segment</label>
//               <Select
//                 value={selectedSegment === "Select" ? undefined : selectedSegment}
//                 placeholder="Select segment"
//                 onChange={(val) => handleSegmentChange(val ?? "Select")}
//                 options={toOptions(segments.filter((s) => s !== "Select"))}
//                 placement="bottomLeft"
//                 listHeight={240}
//                 dropdownStyle={{ maxHeight: 240, overflowY: "auto" }}
//                 getPopupContainer={() => document.body}
//                 style={{ width: "100%" }}
//                 showSearch
//                 optionFilterProp="label"
//                 allowClear
//               />
//             </div>
//             <div style={styles.selectGroup}>
//               <label style={styles.label}>Churn Probability Range</label>
//               <Select
//                 value={selectedProbability === "Select" ? undefined : selectedProbability}
//                 placeholder={isSegmentChosen ? "Select probability range" : "Select segment first"}
//                 onChange={(val) => {
//                   const newVal = val ?? "Select";
//                   setSelectedProbability(newVal);
//                   setSelectedPolicy("Select");
//                   setCurrentRow(null);
//                   setAdjustedParams({});
//                   setCoupledPreviewRow(null);
//                   setLastRunMode(null);
//                 }}
//                 options={probabilityOpts}
//                 placement="bottomLeft"
//                 listHeight={240}
//                 dropdownStyle={{ maxHeight: 240, overflowY: "auto" }}
//                 getPopupContainer={() => document.body}
//                 style={{ width: "100%" }}
//                 allowClear
//                 disabled={probabilitySelectDisabled}
//                 showSearch
//                 optionFilterProp="label"
//                 filterOption={(input, option) =>
//                   option?.label?.toLowerCase().includes(input.toLowerCase())
//                 }
//               />
//             </div>
//             <div style={styles.selectGroup}>
//               <label style={styles.label}>Policy Number</label>
//               <Select
//                 value={selectedPolicy === "Select" ? undefined : selectedPolicy}
//                 placeholder={policySelectDisabled ? "Select segment & probability first" : "Select policy"}
//                 onChange={(val) => handlePolicyChange(val ?? "Select")}
//                 options={policyOpts}
//                 disabled={policySelectDisabled}
//                 getPopupContainer={() => document.body}
//                 dropdownStyle={{ maxHeight: "min(60vh, 150px)", overflowY: "auto" }}
//                 listHeight={150}
//                 showSearch
//                 optionFilterProp="label"
//                 filterOption={(input, option) =>
//                   option?.label?.toLowerCase().includes(input.toLowerCase())
//                 }
//                 onPopupScroll={handlePopupScroll}
//                 notFoundContent={
//                   polLoading ? (
//                     <span style={{ padding: 8 }}>Loading...</span>
//                   ) : policyOpts.length === 0 && isSegmentChosen && isProbabilityChosen ? (
//                     <span style={{ padding: 8 }}>No policies found for selected criteria</span>
//                   ) : null
//                 }
//                 dropdownRender={(menu) => (
//                   <div>
//                     {menu}
//                     {(polLoading || polHasMore) && (
//                       <div style={{ padding: 8, textAlign: "center", fontSize: 12, color: "#666" }}>
//                         {polLoading ? "Loading..." : polHasMore ? "Scroll for more" : "No more results"}
//                       </div>
//                     )}
//                   </div>
//                 )}
//                 style={{ width: "100%" }}
//                 allowClear
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Profile */}
//       {currentRow ? (
//         <>
//           <div
//             style={{ ...styles.card, ...(hoveredCard === "profile" ? styles.cardHover : {}) }}
//             onMouseEnter={() => setHoveredCard("profile")}
//             onMouseLeave={() => setHoveredCard(null)}
//           >
//             <div style={styles.cardHeader}>
//               <span style={styles.sectionTitle}>Customer Profile</span>
//             </div>
//             <div style={styles.cardContent}>
//               <p style={styles.sectionSubtitle}>Complete customer information and policy details</p>

//               <div style={styles.statsGrid}>
//                 {/* Basic */}
//                 <div
//                   style={{ ...styles.statCard, ...(hoveredStat === "basic" ? styles.statCardHover : {}) }}
//                   onMouseEnter={() => setHoveredStat("basic")}
//                   onMouseLeave={() => setHoveredStat(null)}
//                 >
//                   <div style={styles.statRow}><span style={styles.statLabel}>Policy Number:</span><span style={styles.statValue}>{currentRow["policy no"]}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>Customer ID:</span><span style={styles.statValue}>{currentRow["customerid"]}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>Business Type:</span><span style={styles.statValue}>{currentRow["biztype"]}</span></div>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast }}><span style={styles.statLabel}>Channel:</span><span style={styles.statValue}>{currentRow["tie up"]}</span></div>
//                 </div>

//                 {/* Location */}
//                 <div
//                   style={{ ...styles.statCard, ...(hoveredStat === "location" ? styles.statCardHover : {}) }}
//                   onMouseEnter={() => setHoveredStat("location")}
//                   onMouseLeave={() => setHoveredStat(null)}
//                 >
//                   <div style={styles.statRow}><span style={styles.statLabel}>Zone:</span><span style={styles.statValue}>{currentRow["Cleaned Zone 2"]}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>State:</span><span style={styles.statValue}>{currentRow["Cleaned State2"]}</span></div>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast }}><span style={styles.statLabel}>Branch:</span><span style={styles.statValue}>{currentRow["Cleaned Branch Name 2"]}</span></div>
//                 </div>

//                 {/* Vehicle */}
//                 <div
//                   style={{ ...styles.statCard, ...(hoveredStat === "vehicle" ? styles.statCardHover : {}) }}
//                   onMouseEnter={() => setHoveredStat("vehicle")}
//                   onMouseLeave={() => setHoveredStat(null)}
//                 >
//                   <div style={styles.statRow}><span style={styles.statLabel}>Make:</span><span style={styles.statValue}>{currentRow["make_clean"]}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>Model:</span><span style={styles.statValue}>{currentRow["model_clean"]}</span></div>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast }}><span style={styles.statLabel}>Variant:</span><span style={styles.statValue}>{currentRow["variant"]}</span></div>
//                 </div>

//                 {/* Financial */}
//                 <div
//                   style={{ ...styles.statCard, ...(hoveredStat === "financial" ? styles.statCardHover : {}) }}
//                   onMouseEnter={() => setHoveredStat("financial")}
//                   onMouseLeave={() => setHoveredStat(null)}
//                 >
//                   <div style={styles.statRow}><span style={styles.statLabel}>OD Premium:</span><span style={styles.statValue}>₹{n(currentRow["total od premium"]).toLocaleString()}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>TP Premium:</span><span style={styles.statValue}>₹{n(currentRow["total tp premium"]).toLocaleString()}</span></div>
//                   <div style={styles.statRow}><span style={styles.statLabel}>Add-on Premium:</span><span style={styles.statValue}>₹{n(currentRow["before gst add-on gwp"]).toLocaleString()}</span></div>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast }}><span style={styles.statLabel}>Vehicle IDV:</span><span style={styles.statValue}>₹{n(currentRow["vehicle idv"]).toLocaleString()}</span></div>
//                 </div>

//                 {/* Benefits */}
//                 <div
//                   style={{ ...styles.statCard, ...(hoveredStat === "benefits" ? styles.statCardHover : {}) }}
//                   onMouseEnter={() => setHoveredStat("benefits")}
//                   onMouseLeave={() => setHoveredStat(null)}
//                 >
//                   <div style={styles.statRow}><span style={styles.statLabel}>Discount:</span><span style={styles.statValue}>{n(currentRow["applicable discount with ncb"]).toFixed(1)}%</span></div>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast }}><span style={styles.statLabel}>NCB:</span><span style={styles.statValue}>{n(currentRow["ncb % previous year"]).toFixed(1)}%</span></div>
//                 </div>

//                 {/* Reasons */}
//                 <div style={{ ...styles.statCard, ...styles.specialCard }}>
//                   <div style={{ ...styles.statRow, ...styles.statRowLast, flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
//                     <span style={styles.statLabel}>Key Risk Factors:</span>
//                     <span style={{ ...styles.statValue, fontSize: "13px", lineHeight: "1.5" }}>{currentRow["Top 3 Reasons"]}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Parameter Adjustment (sliders + gauges + summary) */}
//           {paramKeys.length > 0 && (
//             <div
//               style={{ ...styles.card, ...(hoveredCard === "sliders" ? styles.cardHover : {}) }}
//               onMouseEnter={() => setHoveredCard("sliders")}
//               onMouseLeave={() => setHoveredCard(null)}
//             >
//               <div
//                 style={{
//                   ...styles.cardHeader,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   gap: 12,
//                 }}
//               >
//                 <span style={styles.sectionTitle}>Parameter Adjustment</span>

//                 {/* Header actions — visibility rules */}
//                 <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                   <div style={styles.headerBtnRow}>
//   {(() => {
//     const autoActive = lastRunMode === "auto" && !!finalAutoRow;

//     if (autoActive) {
//       // After Suggest Auto: Save Suggested + Reset
//       return (
//         <>
//           <button
//             style={{ ...styles.successButton, ...styles.headerButton }}
//             onClick={() => saveSelected("Smart Auto-suggest")}
//             disabled={saveBusy}
//           >
//             {saveBusy ? "Saving…" : "Save Suggested changes (Auto)"}
//           </button>
//           <button
//             style={{ ...styles.resetButton, ...styles.headerButton }}
//             onClick={resetAllState}
//             title="Reset sliders"
//           >
//             Reset
//           </button>
//         </>
//       );
//     }

//     if (hasSliderChanges) {
//       // Slider adjusted: Save Manual + Suggest Auto + Reset
//       return (
//         <>
//           <button
//             style={{ ...styles.successButton, ...styles.headerButton }}
//             onClick={handleSaveManual}
//             disabled={saveBusy}
//           >
//             {saveBusy ? "Saving…" : "Save Selected changes (Manual)"}
//           </button>
//           <button
//             style={{ ...styles.accentButton, ...styles.headerButton }}
//             onClick={runAutoSuggest}
//             disabled={actionLoading}
//           >
//             {actionLoading ? "Finding best…" : "Suggest Changes (Auto)"}
//           </button>
//           <button
//             style={{ ...styles.resetButton, ...styles.headerButton }}
//             onClick={resetSlidersToOriginal}
//             title="Reset sliders"
//           >
//             Reset
//           </button>
//         </>
//       );
//     }

//     // No slider changes (or after Reset): only Suggest Auto
//     return (
//       <button
//         style={{ ...styles.accentButton, ...styles.headerButton }}
//         onClick={runAutoSuggest}
//         disabled={actionLoading}
//       >
//         {actionLoading ? "Finding best…" : "Suggest Changes (Auto)"}
//       </button>
//     );
//   })()}
// </div>

//                 </div>
//               </div>

//               <div style={styles.cardContent}>
//                 <p style={styles.sectionSubtitle}>
//                   Adjust any parameter. Server will re-couple the rest (same logic as your Streamlit app).
//                 </p>

//                 <div style={styles.combinedContainer}>
//                   {/* Sliders */}
//                   <div style={styles.filtersGrid}>
//                     {paramKeys.map((param) => {
//                       const originalValue = n(currentRow[paramToColumn[param]]);
//                       const currentValue = n(adjustedParams[param] ?? originalValue);
//                       const range = paramRanges[param] || { min: 0, max: 100 };
//                       const minV = n(range.min);
//                       const maxV = Math.max(minV + 1, n(range.max));
//                       const denom = Math.max(1e-9, maxV - minV);
//                       const progressPercentage = ((currentValue - minV) / denom) * 100;
//                       const formatValue = (val) =>
//                         param === "discount" || param === "ncb"
//                           ? `${Number(val).toFixed(1)}%`
//                           : `₹${Number(val).toLocaleString()}`;
//                       const step = stepFor(param);

//                       return (
//                         <div key={param} style={styles.sliderGroup}>
//                           <div style={styles.sliderHeader}>
//                             <span style={styles.sliderLabel}>{colTitleMap[param]}</span>
//                             <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
//                               <div style={styles.sliderValue}>Current: {formatValue(currentValue)}</div>
//                               <div style={styles.sliderOriginal}>Original: {formatValue(originalValue)}</div>
//                             </div>
//                           </div>

//                           <div style={styles.sliderRow}>
//                             <button
//                               onPointerDown={(e) => {
//                                 e.preventDefault();
//                                 e.currentTarget.setPointerCapture(e.pointerId);
//                                 const next = Math.max(minV, currentValue - step);
//                                 setAdjustedParams((prev) => ({ ...prev, [param]: next }));
//                               }}
//                               style={styles.button}
//                             >
//                               <MinusOutlined />
//                             </button>

//                             <input
//                               type="range"
//                               min={minV}
//                               max={maxV}
//                               step={step}
//                               value={currentValue}
//                               onChange={(e) => {
//                                 const newValue = parseFloat(e.target.value);
//                                 const clamped = Math.max(minV, Math.min(maxV, newValue));
//                                 setAdjustedParams((prev) => ({ ...prev, [param]: clamped }));
//                               }}
//                               style={{
//                                 ...styles.slider,
//                                 flex: 1,
//                                 margin: "0 8px",
//                                 background: `linear-gradient(to right, #667eea 0%, #667eea ${progressPercentage}%, #e2e8f0 ${progressPercentage}%, #e2e8f0 100%)`,
//                               }}
//                             />

//                             <button
//                               onPointerDown={(e) => {
//                                 e.preventDefault();
//                                 e.currentTarget.setPointerCapture(e.pointerId);
//                                 const next = Math.min(maxV, currentValue + step);
//                                 setAdjustedParams((prev) => ({ ...prev, [param]: next }));
//                               }}
//                               style={styles.button}
//                             >
//                               <PlusOutlined />
//                             </button>
//                           </div>

//                           <div style={styles.innerContainer}>
//                             <style>{`
//                               input[type="range"]::-webkit-slider-thumb {
//                                 appearance: none;
//                                 height: 18px; width: 18px; border-radius: 10%;
//                                 margin-top: -2px;
//                                 background: #f0f2f5; cursor: pointer;
//                                 box-shadow: 4px 4px 8px rgba(163,177,198,0.4),
//                                             -4px -4px 8px rgba(255,255,255,0.8),
//                                             inset 2px 2px 4px rgba(163,177,198,0.2),
//                                             inset 2px 2px 4px rgba(255,255,255,0.8);
//                               }
//                               input[type="range"]::-moz-range-thumb {
//                                 height: 18px; width: 18px; border-radius: 50%;
//                                 background: #f0f2f5; cursor: pointer; border: none;
//                                 box-shadow: 4px 4px 8px rgba(163,177,198,0.4),
//                                             -4px -4px 8px rgba(255,255,255,0.8),
//                                             inset 2px 2px 4px rgba(163,177,198,0.2),
//                                             inset 2px 2px 4px rgba(255,255,255,0.8);
//                               }
//                             `}</style>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>

//                   {/* Gauges */}
//                   {/* Gauges */}
// <div style={{ marginTop: 16 }}>
//   <div style={styles.metersRowFixed}>
//     <div style={styles.meterBox}>
//       <GaugeMeter value={baselineVal} label="Baseline Risk" color="#ef4444" size={220} />
//     </div>

//     <div style={styles.meterBox}>
//       <GaugeMeter
//         value={rightGaugeVal}   // <-- use computed value that includes previewPct
//         label={
//           lastRunMode === "auto"
//             ? "Auto Suggest"
//             : "Adjusted"
//         }
//         color="#f97316"
//         size={220}
//       />
//     </div>

//     {(() => {
//       const sim = rightGaugeVal;          // <-- also use rightGaugeVal here
//       const delta = sim - baselineVal;
//       const show = Number.isFinite(delta) && Math.abs(delta) > 1e-4;

//       return show ? (
//         <div
//           style={{
//             ...styles.centerBadge,
//             ...styles.centerBadgeFixed,
//             backgroundColor: sim < baselineVal ? "#c6f6d5" : "#fed7d7",
//             color: sim < baselineVal ? "#2f855a" : "#c53030",
//           }}
//         >
//           <span>{sim < baselineVal ? "↘" : "↗"}</span>
//           <span>{`${Math.abs(delta).toFixed(1)}% vs Baseline`}</span>
//         </div>
//       ) : null;
//     })()}
//   </div>
// </div>


//                   {/* Live Summary: Original vs Adjusted (+ Δ) */}
//                   <div style={{ ...styles.impactSummary, marginTop: 16 }}>
//                     <div style={styles.impactTitle}>
//                       {couplingBusy ? "Coupling…" : "Live Summary (Original vs Adjusted)"}
//                     </div>
//                     <div style={styles.impactText}>
//                       {(() => {
//                         const originalRow = currentRow;
//                         const adjustedRow =
//                           (lastRunMode === "auto" && finalAutoRow) ? finalAutoRow :
//                           (lastRunMode === "manual" && finalManualRow) ? finalManualRow :
//                           (coupledPreviewRow || null);

//                         if (!adjustedRow) {
//                           return <span>Move a slider to see coupled values.</span>;
//                         }

//                         const rows = [
//                           { label: "Discount", key: "applicable discount with ncb", fmt: (v) => `${n(v).toFixed(1)}%`, deltaFmt: (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)} pp` },
//                           { label: "OD", key: "total od premium", fmt: (v) => `₹${Math.round(n(v)).toLocaleString()}`, deltaFmt: (d) => `₹${Math.round(d).toLocaleString()}` },
//                           { label: "TP", key: "total tp premium", fmt: (v) => `₹${Math.round(n(v)).toLocaleString()}`, deltaFmt: (d) => `₹${Math.round(d).toLocaleString()}` },
//                           { label: "GST (18%)", key: "gst", fmt: (v) => `₹${Math.round(n(v)).toLocaleString()}`, deltaFmt: (d) => `₹${Math.round(d).toLocaleString()}` },
//                           { label: "Total Premium", key: "total premium payable", fmt: (v) => `₹${Math.round(n(v)).toLocaleString()}`, deltaFmt: (d) => `₹${Math.round(d).toLocaleString()}` },
//                           { label: "IDV", key: "vehicle idv", fmt: (v) => `₹${Math.round(n(v)).toLocaleString()}`, deltaFmt: (d) => `₹${Math.round(d).toLocaleString()}` },
//                           { label: "NCB %", key: "ncb % previous year", fmt: (v) => `${n(v).toFixed(1)}%`, deltaFmt: (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)} pp` },
//                         ];

//                         return (
//                           <div style={{ overflowX: "auto" }}>
//                             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//                               <thead>
//                                 <tr>
//                                   <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Metric</th>
//                                   <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Original</th>
//                                   <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Adjusted</th>
//                                   <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Δ</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {rows.map(({ label, key, fmt, deltaFmt }) => {
//                                   const orig = originalRow?.[key];
//                                   const adj = adjustedRow?.[key];
//                                   const dRaw = n(adj) - n(orig);
//                                   const delta = Number.isFinite(dRaw) ? dRaw : 0;
//                                   return (
//                                     <tr key={key}>
//                                       <td style={{ padding: "6px 8px" }}>{label}</td>
//                                       <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt(orig)}</td>
//                                       <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt(adj)}</td>
//                                       <td style={{ padding: "6px 8px", textAlign: "right", color: delta < 0 ? "#16a34a" : delta > 0 ? "#dc2626" : "#475569" }}>
//                                         {delta === 0 ? "—" : deltaFmt(delta)}
//                                       </td>
//                                     </tr>
//                                   );
//                                 })}
//                               </tbody>
//                             </table>
//                           </div>
//                         );
//                       })()}
//                     </div>
//                   </div>

                 
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Bottom actions: Latest selected + Email compose */}
//           <div style={styles.card}>
//             <div style={styles.cardContent}>
              
// {/* Draft Email (moved out of Parameter Adjustment) */}
// {!showEmailComposer && !hideDraftButtons && (
//   <div style={{ display: "flex", justifyContent: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
//     {hasSliderChanges ? (
//       <button style={styles.infoButton} onClick={draftEmailNow} disabled={emailSending}>
//         Draft Email (no save)
//       </button>
//     ) : (
//       <button style={styles.infoButton} onClick={saveBaselineAndDraft} disabled={latestBusy}>
//         {latestBusy ? "Saving & Drafting…" : "Draft Email (save current)"}
//       </button>
//     )}
//   </div>
// )}


// {/* Latest Saved (DB) — hide while composing to show only the email container */}
// {!showEmailComposer && latestSaved && (
//   <div style={{ ...styles.impactSummary, marginTop: 16 }}>
//     <div style={styles.impactTitle}>Latest Saved (DB)</div>
//     <div style={styles.impactText}>
//       <div><b>Policy:</b> {latestSaved.policy_no}</div>
//       <div><b>Vehicle:</b> {latestSaved.vehicle}</div>
//       <div style={{ marginTop: 8 }}>
//         <b>Old vs New</b> — Discount {latestSaved.old_discount?.toFixed(1)}% → {latestSaved.new_discount?.toFixed(1)}%,&nbsp;
//         OD ₹{Math.round(latestSaved.old_od || 0).toLocaleString()} → ₹{Math.round(latestSaved.new_od || 0).toLocaleString()},&nbsp;
//         TP ₹{Math.round(latestSaved.old_tp || 0).toLocaleString()} → ₹{Math.round(latestSaved.new_tp || 0).toLocaleString()},&nbsp;
//         Total ₹{Math.round(latestSaved.old_total_premium || 0).toLocaleString()} → ₹{Math.round(latestSaved.new_total_premium || 0).toLocaleString()}
//       </div>
//     </div>
//   </div>
// )}

// {/* Retention Email — ONLY shown after Draft Email click */}
// {showEmailComposer && (
//   <div ref={emailSectionRef} style={{ ...styles.impactSummary, marginTop: 16 }}>
//     <div style={styles.impactTitle}>Retention Email</div>

//     <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
//       <input
//         value={toEmail}
//         onChange={(e) => setToEmail(e.target.value)}
//         placeholder="To (comma-separated)"
//         style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
//       />
//       <input
//         value={ccEmail}
//         onChange={(e) => setCcEmail(e.target.value)}
//         placeholder="Cc (optional, comma-separated)"
//         style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
//       />
//       <input
//         value={bccEmail}
//         onChange={(e) => setBccEmail(e.target.value)}
//         placeholder="Bcc (optional, comma-separated)"
//         style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
//       />
//     </div>

//     <div style={{ display: "grid", gap: 8 }}>
//       <input
//   value={emailSubj}
//   onChange={(e) => setEmailSubj(e.target.value)}
//   placeholder={drafting ? "Drafting subject..." : "Subject"}
//   disabled={drafting}
//   style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
// />

// <textarea
//   value={emailBody}
//   onChange={(e) => setEmailBody(e.target.value)}
//   placeholder={drafting ? "Drafting body..." : "Email body"}
//   rows={8}
//   disabled={drafting}
//   style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
// />
//     </div>

//     <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
//       <button
//   style={{
//     ...styles.successButton,
//     opacity: emailSending ? 0.7 : 1,
//     cursor: emailSending ? "not-allowed" : "pointer"
//   }}
//   onClick={sendEmail}
//   disabled={emailSending}
//   title="Send email using backend"
// >
//   {emailSending ? "Sending..." : "Send Email"}
// </button>

//     </div>
//     <div style={{ fontSize: 12, marginTop: 8, color: "#64748b" }}>
//   Leave Subject/Body blank to auto-draft with Groq on the server.
// </div>

//   </div>
// )}

//             </div>
//           </div>
//         </>
//       ) : (
//         <div style={styles.card}>
//           <div style={styles.cardContent}>
//             <div style={styles.waitingCard}>
//               <div style={styles.waitingIcon}>{loading ? "⏳" : "📊"}</div>
//               <h3 style={styles.waitingTitle}>{loading ? "Loading..." : "Ready for Analysis"}</h3>
//               <p style={styles.waitingText}>
//                 {!isSegmentChosen
//                   ? "Select a customer segment to begin"
//                   : !isProbabilityChosen
//                   ? "Select a probability range to filter policies"
//                   : "Select a policy to begin the churn risk analysis"}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   </div>
// );





// };

// export default ChurnSimulator;













import React, { useState, useMemo, useEffect ,useRef} from 'react';
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";

import { Select,message ,notification } from "antd";


const LS_CURRENCY_CODE_KEY = "app_currency_code";
const LS_INR_PER_1_KEY = "app_currency_rates_inrPer1";

const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF ",
  CNY: "CN¥",
  SGD: "S$",
  AED: "د.إ",
};

const safeJsonParse = (value, fallback) => {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readCurrencyFromStorage = () => {
  const code = localStorage.getItem(LS_CURRENCY_CODE_KEY) || "INR";
  const inrPer1 = safeJsonParse(localStorage.getItem(LS_INR_PER_1_KEY), {});
  return { code, inrPer1 };
};

// Convert INR -> selected currency using inrPer1 map (INR per 1 unit of currency)
const convertINR = (inrValue, currencyCode, inrPer1) => {
  const v = Number(inrValue || 0);
  if (!Number.isFinite(v)) return 0;
  if (!currencyCode || currencyCode === "INR") return v;

  const rate = Number(inrPer1?.[currencyCode]);
  if (!Number.isFinite(rate) || rate <= 0) return v; // fallback if missing rate
  return v / rate;
};

const formatMoney = (inrValue, currencyCode, inrPer1) => {
  const symbol = CURRENCY_SYMBOL[currencyCode] || "";
  const x = convertINR(inrValue, currencyCode, inrPer1);
  return `${symbol}${x.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
// replaces: const n = (x) => Number(x ?? 0);
const n = (x) => {
  if (x == null) return 0;
  const v = parseFloat(String(x).replace(/[^\d.-]/g, "")); // strip ₹ and commas
  return Number.isFinite(v) ? v : 0;
};

const parameterRanges = {
  discount: { min: 0.0, max: 90.0 },
  od_premium: { min: 10000, max: 50000 },
  tp_premium: { min: 1500, max: 8000 },
  idv: { min: 200000, max: 2000000 },
  add_on_premium: { min: 1000, max: 10000 },
  ncb: { min: 0, max: 50 }
};


const styles = {
  container: {
    minHeight: '100vh',
    // maxHeight: '100%',
    background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)',
    padding: '10px 24px 74px 24px',
    fontFamily : "var(--app-font-family)",
    position: 'relative'
  },
  innerContainer: {
    // marginTop:'-45px',
    maxWidth: '100%',
    margin: '0 auto',
    position: 'relative'
  },
  header: {
    textAlign: 'center',
    background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
    marginBottom: '60px',
    fontSize: '42px',
    fontWeight: '800',
    letterSpacing: '-1px',
    lineHeight: '1'
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#718096',
    marginTop: '-36px',
    fontSize: '16px',
    fontWeight: '500',
    letterSpacing: '0.5px'
  },
  card: {
    backgroundColor: '#f0f2f5',
    borderRadius: '24px',
    marginBottom: '32px',
    boxShadow: `
      12px 12px 24px rgba(163, 177, 198, 0.6),
      -12px -12px 24px rgba(255, 255, 255, 0.8)
    `,
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    marginTop : '-5px'
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: `
      16px 16px 32px rgba(163, 177, 198, 0.7),
      -16px -16px 32px rgba(255, 255, 255, 0.9)
    `
  },
  cardHeader: {
    background: 'linear-gradient(to right, #23345cff, #065279ff, #06b6d4)',
    padding: '15px 32px',
    position: 'relative',
    borderRadius: '24px 24px 0 0'
  },
  cardContent: {
    padding: '0 32px 19px 32px'
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '28px',
    fontWeight: '500',
    textAlign: 'center'
  },
  selectContainer: {
    marginTop: '-10px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px'
  },
  selectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex : 999
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px'
  },
  select: {
    padding: '16px 20px',
    border: 'none',
    borderRadius: '16px',
    fontSize: '14px',
    backgroundColor: '#f0f2f5',
    color: '#2d3748',
    outline: 'none',
    fontFamily : "var(--app-font-family)",
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: `
      inset 4px 4px 8px rgba(163, 177, 198, 0.4),
      inset -4px -4px 8px rgba(255, 255, 255, 0.8)
    `,
    transition: 'all 0.2s ease'
  },
  selectFocus: {
    boxShadow: `
      inset 6px 6px 12px rgba(163, 177, 198, 0.5),
      inset -6px -6px 12px rgba(255, 255, 255, 0.9),
      0 0 0 3px rgba(102, 126, 234, 0.1)
    `
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '15px',
    marginTop : '-15px'
  },
  statCard: {
    backgroundColor: '#f0f2f5',
    borderRadius: '20px',
    padding: '24px',
    position: 'relative',
    transition: 'all 0.3s ease',
    boxShadow: `
      8px 8px 16px rgba(163, 177, 198, 0.4),
      -8px -8px 16px rgba(255, 255, 255, 0.8)
    `
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: `
      12px 12px 24px rgba(163, 177, 198, 0.5),
      -12px -12px 24px rgba(255, 255, 255, 0.9)
    `
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(163, 177, 198, 0.2)'
  },
  statRowLast: {
    borderBottom: 'none'
  },
  statLabel: {
    fontSize: '13px',
    color: '#718096',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '14px',
    color: '#2d3748',
    fontWeight: '600'
  },
  specialCard: {
    background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
    color: '#2d3748'
  },
  combinedContainer: {
  display: 'grid',
  gridTemplateColumns: '1fr',
  // gap: '4px',
  alignItems: 'start'
},

filtersGrid: {
  marginTop: '-10px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '15px'
},
metersRow: {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '32px',
  alignItems: 'center',
  marginTop: '4px'
},

centerBadge: {
  alignSelf: 'center',
  justifySelf: 'center',
  display: 'flex',
  gap: '8px',
  padding: '12px 18px',
  borderRadius: '16px',
  fontSize: '14px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  boxShadow: '6px 6px 12px rgba(163,177,198,0.35), -6px -6px 12px #fff'
},

  sliderContainer: {
    marginBottom: '0'
  },
  sliderGroup: {
    backgroundColor: '#f0f2f5',
    borderRadius: '20px',
    padding: '24px',
    // gap: '20px',
    marginBottom: '20px',
    position: 'relative',
    boxShadow: `
      inset 6px 6px 12px rgba(163, 177, 198, 0.3),
      inset -6px -6px 12px rgba(255, 255, 255, 0.8)
    `
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sliderLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568'
  },

  infoButton: {
  backgroundColor: '#f0f2f5',
  color: '#0369a1',
  border: 'none',
  padding: '12px 24px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  borderRadius: '14px',
  boxShadow: '6px 6px 12px rgba(163, 177, 198, 0.3), -6px -6px 12px rgba(255, 255, 255, 0.8)'
},
successButton: {
  backgroundColor: '#f0f2f5',
  color: '#16a34a',
  border: 'none',
  padding: '12px 24px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  borderRadius: '14px',
  boxShadow: '6px 6px 12px rgba(163, 177, 198, 0.3), -6px -6px 12px rgba(255, 255, 255, 0.8)'
},

  slider: {
    flex : 1,
    width: '100%',
    height: '5px',
    marginTop:'10px',
    borderRadius: '20px',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    background: '#e2e8f0',
    boxShadow: `
      inset 2px 2px 4px rgba(163, 177, 198, 0.3),
      inset -2px -2px 4px rgba(255, 255, 255, 0.8)
    `
  },

  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
  },
  button: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    color: "#000",
    boxShadow:
      "4px 4px 8px rgba(163,177,198,0.05), -4px -4px 8px #fff",
  },
  sliderValue: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#2d3748',
    fontWeight: '600',
    textAlign: 'right'
  },
  sliderOriginal: {
    fontSize: '12px',
    color: '#a0aec0',
    fontWeight: '400',
    marginTop: '4px'
  },
  metersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    alignItems: 'center'
  },
  meterContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: '32px',
    padding: '0',
    position: 'relative',
    width: '100%',
    overflow: 'visible',
    boxShadow: 'none'
  },
  meterTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#4a5568',
    marginBottom: '24px',
    textAlign: 'center',
    letterSpacing: '-0.5px'
  },

  deltaBadgeSide: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-190%, -190%)',
  whiteSpace: 'nowrap',
  zIndex: 10
},

  resetWrap: {
  position: 'absolute',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '14px',
  cursor: 'pointer',
  backgroundColor: '#f0f2f5',
  color: '#4a5568',
  boxShadow: `
    4px 4px 8px rgba(163, 177, 198, 0.4),
    -4px -4px 8px rgba(255, 255, 255, 0.8),
    inset 2px 2px 4px rgba(163, 177, 198, 0.2),
    inset -2px -2px 4px rgba(255, 255, 255, 0.8)
  `
},
resetIcon: {
  fontSize: '18px',
  lineHeight: 1,
},
resetHint: {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.3px'
},

badgeRow: {
  minHeight: 40,            // reserve space to prevent movement
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
},

metersRowFixed: {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  // marginTop: '4px',
  padding: '0 min(10vw, 100px)'
},

meterBox: {
  width: 240,               // fixed width
  display: 'flex',
  justifyContent: 'center',
  // padding: '0 150px 0 150px'
},

metersSection: {
  display: 'grid',
  gridTemplateRows: 'auto auto',
  rowGap: 16,
},

centerBadgeFixed: {
  position: 'absolute',
  left: '50%',
  top: '35%',
  transform: 'translate(-50%, -50%)',
  zIndex: 5                // above meters; does not affect layout
},

  meterSvg: {
    // width: '200px',   // was 160px
    // height: '200px',
    transform: 'rotate(-90deg)',
    filter: 'drop-shadow(2px 2px 4px rgba(163, 177, 198, 0.3))'
  },
  meterValue: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    marginTop: '12px',
    fontSize: '34px',
    fontWeight: '800',
    color: '#4a5568',
    textShadow: '2px 2px 4px rgba(163, 177, 198, 0.3)'
  },
  meterDelta: {
    marginTop: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '16px',
    backgroundColor: '#f0f2f5',
    boxShadow: `
      6px 6px 12px rgba(163, 177, 198, 0.4),
      -6px -6px 12px rgba(255, 255, 255, 0.8)
    `
  },
  riskBadge: {
    marginTop: '16px',
    padding: '12px 24px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '20px',
    backgroundColor: '#f0f2f5',
    boxShadow: `
      4px 4px 8px rgba(163, 177, 198, 0.4),
      -4px -4px 8px rgba(255, 255, 255, 0.8)
    `
  },
  resetButton: {
    backgroundColor: '#f0f2f5',
    color: '#4a5568',
    border: 'none',
    padding: '16px 32px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '24px',
    borderRadius: '16px',
    fontFamily : "var(--app-font-family)",
    width: '100%',
    boxShadow: `
      8px 8px 16px rgba(163, 177, 198, 0.4),
      -8px -8px 16px rgba(255, 255, 255, 0.8)
    `
  },
  resetButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: `
      12px 12px 24px rgba(163, 177, 198, 0.5),
      -12px -12px 24px rgba(255, 255, 255, 0.9)
    `
  },
  resetButtonActive: {
    transform: 'translateY(0px)',
    boxShadow: `
      inset 4px 4px 8px rgba(163, 177, 198, 0.4),
      inset -4px -4px 8px rgba(255, 255, 255, 0.8)
    `
  },
  impactSummary: {
    marginTop: '24px',
    padding: '24px',
    backgroundColor: '#f0f2f5',
    borderRadius: '20px',
    position: 'relative',
    boxShadow: `
      inset 6px 6px 12px rgba(163, 177, 198, 0.3),
      inset -6px -6px 12px rgba(255, 255, 255, 0.8)
    `
  },
  impactTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4a5568',
    marginBottom: '12px',
    letterSpacing: '-0.5px'
  },
  impactText: {
    fontSize: '14px',
    color: '#718096',
    lineHeight: '1.6',
    fontWeight: '400'
  },
  waitingCard: {
    textAlign: 'center',
    padding: '80px 40px',
    backgroundColor: '#f0f2f5',
    borderRadius: '24px',
    margin: '20px 0',
    boxShadow: `
      inset 8px 8px 16px rgba(163, 177, 198, 0.3),
      inset -8px -8px 16px rgba(255, 255, 255, 0.8)
    `
  },
  waitingIcon: {
    fontSize: '64px',
    marginBottom: '32px',
    color: '#667eea',
    filter: 'drop-shadow(2px 2px 4px rgba(163, 177, 198, 0.3))'
  },
  waitingTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#4a5568',
    letterSpacing: '-0.5px'
  },
  waitingText: {
    fontSize: '16px',
    maxWidth: '500px',
    margin: '0 auto',
    color: '#718096',
    lineHeight: '1.6'
  }
};



const GaugeMeter = ({
  value = 0,
  label = "Risk Level",
  size = 220,
  strokeWidth = 12,
  dynamicColor = true,
  color,
  thresholds = { low: 40, high: 70 },
  trackColor = "#f1f5f9",
  fontColor = "#1f2937",
  subTextColor = "#64748b"
}) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const getRiskColor = (x) =>
    x > thresholds.high ? "#e53e3e" : x > thresholds.low ? "#dd6b20" : "#38a169";
  const strokeColor = dynamicColor ? getRiskColor(v) : (color || "#3B82F6");

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;

  // percent → offset
  const dashOffset = circumference * (1 - v / 100);

  return (
    <div
      aria-label={`Gauge ${label} ${v.toFixed(1)}%`}
      role="img"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <div style={{ position: "relative" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition:
                "stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1), stroke 250ms ease-in"
            }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, color: fontColor }}>
            {v.toFixed(1)}%
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginTop: 4,
              color: subTextColor
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

const paramToColumn = {
    discount: "applicable discount with ncb",
    od_premium: "total od premium",
    tp_premium: "total tp premium",
    idv: "vehicle idv",
    add_on_premium: "before gst add-on gwp",
    ncb: "ncb % previous year",
  };

  const colTitleMap = {
    discount: "Discount Percentage",
    od_premium: "Own Damage Premium",
    tp_premium: "Third Party Premium",
    idv: "Insured Declared Value",
    add_on_premium: "Add-on Premium",
    ncb: "No Claim Bonus",
  };


const ChurnSimulator = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [{ code: currencyCode, inrPer1 }, setCurrencyState] = useState(() =>
  readCurrencyFromStorage()
);

useEffect(() => {
  const sync = () => setCurrencyState(readCurrencyFromStorage());

  const onStorage = (e) => {
    if (e.key === LS_CURRENCY_CODE_KEY || e.key === LS_INR_PER_1_KEY || e.key === null) {
      sync();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("app_currency_changed", sync);
  sync();

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("app_currency_changed", sync);
  };
}, []);

  const [selectedSegment, setSelectedSegment] = useState("Select");
  const [selectedPolicy, setSelectedPolicy] = useState("Select");
  const [selectedProbability, setSelectedProbability] = useState("Select");
  const [adjustedParams, setAdjustedParams] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [loading, setLoading] = useState(false);

  const [segments, setSegments] = useState(["Select"]);
  const [policies, setPolicies] = useState(["Select"]);
  const [currentRow, setCurrentRow] = useState(null);
  const [paramRanges, setParamRanges] = useState({});

  const isSegmentChosen = selectedSegment !== "Select";
  const isProbabilityChosen = selectedProbability !== "Select";

  const PAGE_SIZE = 50;
  const [policyOpts, setPolicyOpts] = useState([]); // [{value,label}]
  const [polPage, setPolPage] = useState(1);
  const [polHasMore, setPolHasMore] = useState(true);
  const [polLoading, setPolLoading] = useState(false);
  const [polQuery, setPolQuery] = useState("");
  const [probabilityOpts, setProbabilityOpts] = useState([]);

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const emailSectionRef = useRef(null);
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [bccEmail, setBccEmail] = useState("");
  const [emailSubj, setEmailSubj] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
 const SEND_EMAIL_URL = `${API_BASE_URL}/churn/send-email`; // <-- change if your backend uses another path
 const csv = (s="") => s.split(",").map(v => v.trim()).filter(Boolean);
 const [drafting, setDrafting] = useState(false);

 const DRAFT_EMAIL_URL = `${API_BASE_URL}/churn/draft-email`;
 const SAVE_SELECTED_URL = `${API_BASE_URL}/churn/save-selected`;
 const [msg, contextHolder] = message.useMessage();
 const [flyMsg, setFlyMsg] = useState(null);

// const SEND_EMAIL_URL  = `${API_BASE_URL}/churn/send-email`;
  


// FIXED: Improved fetchPolicies function with better error handling and proper URL construction
const fetchPolicies = async (page = 1, q = "") => {
  if (!isSegmentChosen || !isProbabilityChosen) {
    console.log("Skipping policy fetch - segment or probability not selected");
    return;
  }
  
  setPolLoading(true);
  try {
    // FIXED: Properly construct URL with probability filter using URLSearchParams
    const params = new URLSearchParams({
      segment: selectedSegment,
      page: page.toString(),
      page_size: PAGE_SIZE.toString(),
      q: q
    });
    
    // FIXED: Always include probability_range when it's selected
    if (selectedProbability !== "Select") {
      params.append('probability_range', selectedProbability);
    }

    const url = `${API_BASE_URL}/churn/policies?${params.toString()}`;
    console.log("Fetching policies with URL:", url); // Debug log

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Policy fetch response:", data); // Debug log

    const newItems = (data.policies || []).map(v => ({ value: v, label: v }));
    setPolicyOpts(prev =>
      page === 1
        ? newItems
        : [...prev, ...newItems.filter(x => !prev.some(p => p.value === x.value))]
    );
    setPolHasMore(
      typeof data.hasMore === "boolean"
        ? data.hasMore
        : newItems.length === PAGE_SIZE
    );
    setPolPage(page);
  } catch (error) {
    console.error("Error fetching policies:", error);
    if (page === 1) {
      setPolicyOpts([]);
    }
  } finally {
    setPolLoading(false);
  }
};

const triggerFlySuccess = (text = "Email sent successfully") => {
  setFlyMsg({ text });
  // auto-hide after animation (~1.6s)
  setTimeout(() => setFlyMsg(null), 1600);
};

// Build a DB-shaped row and compute GST/Total on the client too (server will also recompute if missing)
const buildSelectedRow = (row) => {
  if (!row) return null;

  // pull required values with your original DB keys
  const od  = n(row["total od premium"]);
  const tp  = n(row["total tp premium"]);
  const gst = (od + tp) * 0.18;
  const total = od + tp + gst;

  return {
    // DB column names the backend expects
    "applicable discount with ncb": n(row["applicable discount with ncb"]),
    "ncb % previous year":          n(row["ncb % previous year"]),
    "vehicle idv":                  n(row["vehicle idv"]),
    "before gst add-on gwp":        n(row["before gst add-on gwp"]),
    "total od premium":             od,
    "total tp premium":             tp,
    // pre-computed (optional; backend will compute if missing)
    "gst":                          gst,
    "total premium payable":        total
  };
};


const showEmailRef = useRef(false);
useEffect(() => { showEmailRef.current = showEmailComposer; }, [showEmailComposer]);

const invalidateDraft = React.useCallback(() => {
  if (showEmailRef.current) {
    setShowEmailComposer(false);
    setEmailSubj("");
    setEmailBody("");
  }
}, []);

useEffect(() => {
  invalidateDraft();
}, [adjustedParams, invalidateDraft]);

// Any filter change invalidates the email draft
useEffect(() => {
  invalidateDraft();
}, [selectedSegment, selectedProbability, selectedPolicy, invalidateDraft]);

const adjustedRow = useMemo(() => {
  if (!currentRow) return null;
  const row = { ...currentRow };
  Object.entries(adjustedParams).forEach(([k, v]) => {
    const col = paramToColumn[k];
    if (col) row[col] = v;
  });
  return row;
}, [currentRow, adjustedParams]);

const draftEmailNow = async () => {
  if (!currentRow?.["policy no"]) {
    msg.warning("Select a policy first.");
    return;
  }

  // open composer immediately
  setShowEmailComposer(true);
  setEmailSubj("");
  setEmailBody("");
  setDrafting(true);

  try {
    if (!API_BASE_URL) throw new Error("Missing API base URL (VITE_API_URL).");

    // choose adjusted row (if any) else actual
    const useAdjusted = adjustedRow && Object.keys(adjustedParams).length > 0;
    const chosenRow   = useAdjusted ? adjustedRow : currentRow;

    // Build the payload for /save-selected
    const selectedRow = buildSelectedRow(chosenRow);
    if (!selectedRow) throw new Error("Could not build selected row.");

    const selectionType = useAdjusted ? "Manual Simulation (Frontend)" : "Actual Baseline";

    // 1) SAVE the row snapshot
    const saveRes = await fetch(SAVE_SELECTED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policy_no: currentRow["policy no"],
        selection_type: selectionType,
        selected_row: selectedRow
      })
    });

    if (!saveRes.ok) {
      const txt = await saveRes.text().catch(() => "");
      throw new Error(txt || `Save failed (HTTP ${saveRes.status})`);
    }

    // 2) DRAFT email using the latest saved snapshot on the server
    const res = await fetch(DRAFT_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_no: currentRow["policy no"] })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Draft failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    setEmailSubj(data.subject || "");
    setEmailBody(data.body || "");
  } catch (err) {
    console.error("Draft email failed:", err);

    // Keep composer open and show a safe fallback
    const make = currentRow["make_clean"] || "";
    const model = currentRow["model_clean"] || "";
    const variant = currentRow["variant"] || "";
    const disc = n(currentRow["applicable discount with ncb"]).toFixed(0);

    const fallbackSubject = `Exclusive Renewal Offer for Your ${make} ${model}${variant ? ` (${variant})` : ""}!`;
    const fallbackBody = [
      `Hi there,`,
      ``,
      `We’ve prepared a renewal offer for your ${make} ${model}${variant ? ` (${variant})` : ""}.`,
      `You could get up to ${disc}% discount with optimised OD/TP and add-on review.`,
      ``,
      `Reply to this email and we’ll finalize the best price for you.`,
      ``,
      `Best regards,`,
      `Retention Team`,
    ].join("\n");

    setEmailSubj((s) => s || fallbackSubject);
    setEmailBody((b) => b || fallbackBody);
    msg.error("Couldn’t save & draft from server. Using a fallback template you can edit.");
  } finally {
    setDrafting(false);
    setTimeout(() => emailSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  }
};



// FIXED: Proper useEffect for policy fetching that includes probability dependency
useEffect(() => {
  console.log("Policy fetch useEffect triggered:", { selectedSegment, selectedProbability });
  
  // Reset policy state when segment or probability changes
  setPolicyOpts([]);
  setPolPage(1);
  setPolHasMore(true);
  setPolQuery("");
  setSelectedPolicy("Select");
  setCurrentRow(null);

  // Only fetch if both segment and probability are selected
  if (isSegmentChosen && isProbabilityChosen) {
    console.log("Fetching policies for segment:", selectedSegment, "probability:", selectedProbability);
    fetchPolicies(1, "");
  }
}, [selectedSegment, selectedProbability, API_BASE_URL]); // FIXED: Added proper dependencies

// FIXED: Debounced search function
const searchTimerRef = useRef(null);
const debouncedSearch = (q) => {
  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  searchTimerRef.current = setTimeout(() => {
    setPolQuery(q);
    if (isSegmentChosen && isProbabilityChosen) {
      fetchPolicies(1, q);
    }
  }, 300);
};

// FIXED: Probability options fetch with better error handling
useEffect(() => {
  if (!selectedSegment || selectedSegment === "Select") {
    setProbabilityOpts([]);
    setSelectedProbability("Select");
    return;
  }

  console.log("Fetching probability options for segment:", selectedSegment);

  fetch(`${API_BASE_URL}/churn/probability?segment=${encodeURIComponent(selectedSegment)}`)
    .then(r => {
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      return r.json();
    })
    .then(data => {
      console.log("Probability fetch response:", data);
      
      if (!data || !Array.isArray(data.probability)) {
        setProbabilityOpts([]);
        return;
      }

      // Use the API's string EXACTLY as value + label (no trimming, no padding, no changes)
      const opts = data.probability.map(item => {
        const pr = typeof item === "string"
          ? item
          : String(item.probability_range ?? ""); // keep exactly as provided
        return { value: pr, label: pr };
      });

      setProbabilityOpts(opts);

      // If current selection vanished, reset
      if (selectedProbability !== "Select" && !opts.some(o => o.value === selectedProbability)) {
        setSelectedProbability("Select");
      }
    })
    .catch(error => {
      console.error("Error fetching probability options:", error);
      setProbabilityOpts([]);
    });
}, [API_BASE_URL, selectedSegment]);
 


const handlePopupScroll = (e) => {
  const { scrollTop, clientHeight, scrollHeight } = e.target;
  const nearBottom = scrollTop + clientHeight >= scrollHeight - 8;
  if (nearBottom && polHasMore && !polLoading && isSegmentChosen && isProbabilityChosen) {
    fetchPolicies(polPage + 1, polQuery);
  }
};

  const changeBy = (param, delta) => {
  // find range
  const range = paramRanges[param] || { min: 0, max: 100 };
  const minV = n(range.min);
  const maxV = Math.max(minV + 1, n(range.max));

  // current value (fall back to original from row)
  const current = n(adjustedParams[param] ?? currentRow?.[paramToColumn[param]]);
  const next = Math.max(minV, Math.min(maxV, current + delta)); // clamp

  setAdjustedParams(prev => ({ ...prev, [param]: next }));
};

const holdRef = useRef({});

const stopHold = () => {
  const h = holdRef.current;
  if (h.interval) clearInterval(h.interval);
  if (h.boost1) clearTimeout(h.boost1);
  if (h.boost2) clearTimeout(h.boost2);
  holdRef.current = {};
};

const startHold = (param, delta) => {
  // immediate nudge
  changeBy(param, delta);

  // repeat + accelerate
  let step = delta;
  holdRef.current.interval = setInterval(() => changeBy(param, step), 140);
  holdRef.current.boost1 = setTimeout(() => { step = delta * 3; }, 600);
  holdRef.current.boost2 = setTimeout(() => { step = delta * 8; }, 1500);
};

// stop if the user releases anywhere or window loses focus
useEffect(() => {
  const end = () => stopHold();
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end); // <— add this
  window.addEventListener('blur', end);
  return () => {
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end); // <— and remove
    window.removeEventListener('blur', end);
  };
}, []);


  /* fetch segments */
  /* fetch segments */
useEffect(() => {
  fetch(`${API_BASE_URL}/churn/segments`)
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data.segments)) {
        // Force order Platinum → Gold → Silver after "Select"
        const order = ["Platinum", "Gold", "Silver"];
        const sortedSegments = data.segments.sort((a, b) => {
          const ai = order.indexOf(a);
          const bi = order.indexOf(b);
          if (ai === -1 && bi === -1) return a.localeCompare(b); // both not in order → alpha sort
          if (ai === -1) return 1; // a not in order → send to bottom
          if (bi === -1) return -1; // b not in order → send to bottom
          return ai - bi; // both in order → sort by index
        });
        setSegments(["Select", ...sortedSegments]);
      }
    })
    .catch((e) => console.error("Error fetching segments:", e));
}, [API_BASE_URL]);


  /* fetch parameter ranges */
  useEffect(() => {
    fetch(`${API_BASE_URL}/churn/param-ranges`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ranges) setParamRanges(data.ranges);
      })
      .catch((e) => console.error("Error fetching parameter ranges:", e));
  }, [API_BASE_URL]);

  // FIXED: Improved segment change handler with proper state resets
  const handleSegmentChange = (segment) => {
    console.log("Segment changed to:", segment);
    invalidateDraft();
    setSelectedSegment(segment);
    setSelectedPolicy("Select");
    setSelectedProbability("Select");  // Reset probability when segment changes
    setAdjustedParams({});
    setPolicies(["Select"]);
    setCurrentRow(null);
    setPolicyOpts([]);               // Clear policy options
    setProbabilityOpts([]);          // Clear probability options
  };

  const handlePolicyChange = (policyId) => {
    console.log("Policy changed to:", policyId);
    invalidateDraft();
    if (!isSegmentChosen) return;
    setSelectedPolicy(policyId || "Select");
    setAdjustedParams({});
    setCurrentRow(null);

    if (policyId && policyId !== "Select") {
      setLoading(true);
      fetch(`${API_BASE_URL}/churn/policy?policy_no=${encodeURIComponent(policyId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) setCurrentRow(data.data);
        })
        .catch((e) => console.error("Error fetching policy detail:", e))
        .finally(() => setLoading(false));
    }
  };

  /* parse reasons → adjustable params */
  const getAdjustableParameters = (reasons) => {
    if (!reasons) return [];
    const adjustableMap = {
      "Low Vehicle IDV": "idv",
      "High Own-Damage Premium": "od_premium",
      "High Third-Party Premium": "tp_premium",
      "High Add-On Premium": "add_on_premium",
      "Low Discount with NCB": "discount",
      "Low No Claim Bonus Percentage": "ncb",
    };
    const fallbackParams = ["idv", "od_premium", "tp_premium", "discount"];
    const nonAdjustable = [
      "Young Vehicle Age",
      "Old Vehicle Age",
      "Claims Happened",
      "Multiple Claims on Record",
      "Minimal Policies Purchased",
      "Tie Up with Non-OEM",
    ];

    const adjustable = new Set();
    let sawNonAdj = false;

    const reasonsList = String(reasons)
      .split(/,|\band\b/)
      .map((r) => r.trim())
      .filter(Boolean);

    for (const reason of reasonsList) {
      if (adjustableMap[reason]) adjustable.add(adjustableMap[reason]);
      else if (nonAdjustable.includes(reason)) sawNonAdj = true;
    }
    if (sawNonAdj) fallbackParams.forEach((p) => adjustable.add(p));
    return Array.from(adjustable);
  };

  
  
  const cappedMaxValue = (param, rangeMax, original) => {
  // For premiums, max cannot exceed the original (baseline) value.
  // For everything else, keep the API range.
  // return PREMIUM_CAP_PARAMS.has(param) ? Math.min(rangeMax, original) : 
   return rangeMax;
};

  const resetParameters = () => {
  invalidateDraft();
  setAdjustedParams({});
};

const calculateUpdatedChurn = (baselineChurn, adjustments) => {
  if (!currentRow) return baselineChurn;
  let adjustment = 0;

  Object.entries(adjustments).forEach(([param, value]) => {
    const col = paramToColumn[param];
    const originalValue = n(currentRow[col]);
    const newValue = n(value);

    const isPercentParam = (p) => p === "discount" || p === "ncb";

    // For % params, use 100 as the scale (work in percentage points).
    // For money-like params, normalize by the original (fallback to 1 to avoid /0).
    const denom = isPercentParam(param) ? 100 : Math.max(1, originalValue);

    const change = (newValue - originalValue) / denom;

    if (param === "discount")            adjustment -= change * 20; // each %-pt up lowers risk
    else if (param === "od_premium")     adjustment += change * 15;
    else if (param === "tp_premium")     adjustment += change * 10;
    else if (param === "idv")            adjustment -= change * 5;
    else if (param === "add_on_premium") adjustment += change * 12;
    else if (param === "ncb")            adjustment -= change * 8;  // each %-pt up lowers risk
  });

  return Math.max(0, Math.min(100, baselineChurn + adjustment));
};

const handleSendEmail = async () => {
  if (!toEmail) {
    msg.warning("Please fill the To field.");
    return;
  }
  if (!currentRow?.["policy no"]) {
    msg.warning("Select a policy first.");
    return;
  }

  setSending(true);
  try {
    const payload = {
      to: csv(toEmail),
      cc: csv(ccEmail),
      bcc: csv(bccEmail),

      // let backend auto-draft with Groq if these are blank:
      ...(emailSubj ? { subject: emailSubj } : {}),
      ...(emailBody ? { body: emailBody }   : {}),

      // required for server auto-draft context
      policy_no: currentRow["policy no"],

      // optional context you were sending already (safe to keep/omit)
      segment: selectedSegment,
      probability_range: selectedProbability,
      baseline_risk: Number(baseline.toFixed(1)),
      adjusted_risk: Number(updated.toFixed(1)),
      adjustments: adjustedParams
    };

    const res = await fetch(SEND_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status}`);
    }

    msg.success("Email sent successfully.");
    setShowEmailComposer(false);
    setToEmail(""); setCcEmail(""); setBccEmail("");
    setEmailSubj(""); setEmailBody("");
  } catch (err) {
    console.error(err);
    msg.error("Failed to send email. Check the endpoint/payload.");
  } finally {
    setSending(false);
    setShowEmailComposer(false);
  }
};



  const baseline = currentRow
  ? (() => {
      const raw = n(currentRow["Churn Probability"]);
      return raw <= 1 ? raw * 100 : raw; // auto-detect fraction vs percent
    })()
  : 0;
  const updated =
    currentRow && Object.keys(adjustedParams).length > 0
      ? calculateUpdatedChurn(baseline, adjustedParams)
      : baseline;

  const deltaVal = updated - baseline;
  const improved = deltaVal < 0;
  const showDelta = Number.isFinite(deltaVal) && Math.abs(deltaVal) > 0.0001;

  /* ------------------------------- render ------------------------------- */
  return (
    <div style={styles.container}>
      {contextHolder}
      <div style={styles.innerContainer}>
        <style>{`@keyframes blink { 50% { opacity: 0.2; } }`}</style>

        <h1 style={styles.header}>Churn Risk Simulator</h1>
        <p style={styles.headerSubtitle}>Advanced Analytics Dashboard</p>

        <div
          style={{
            ...styles.card,
            ...(hoveredCard === "selector" ? styles.cardHover : {}),
          }}
          onMouseEnter={() => setHoveredCard("selector")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={styles.cardHeader}>
            <span style={styles.sectionTitle}>Customer Selection</span>
          </div>

          <div style={styles.cardContent}>
            <p style={styles.sectionSubtitle}>
              Choose a customer segment, then select a probability range to filter policies
            </p>

            <div style={styles.selectContainer}>
              {/* Segment */}
              <div style={styles.selectGroup}>
                <label style={styles.label}>Customer Segment</label>
                <Select
                  value={selectedSegment === "Select" ? undefined : selectedSegment}
                  placeholder="Select segment"
                  onChange={(val) => handleSegmentChange(val ?? "Select")}
                  options={toOptions(segments.filter((s) => s !== "Select"))}
                  placement="bottomLeft"
                  listHeight={240}
                  dropdownStyle={{ maxHeight: 240, overflowY: "auto" }}
                  getPopupContainer={() => document.body}
                  style={{ width: "100%" }}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                />
              </div>

              {/* Probability Range */}
              <div style={styles.selectGroup}>
                <label style={styles.label}>Churn Probability Range</label>
                <Select
                  value={selectedProbability === "Select" ? undefined : selectedProbability}
                  placeholder={isSegmentChosen ? "Select probability range" : "Select segment first"}
                  onChange={(val) => {
                    invalidateDraft();
                    const newVal = val ?? "Select";
                    console.log("Probability changed to:", newVal);
                    setSelectedProbability(newVal);
                    // Reset dependent policy when probability changes/clears
                    setSelectedPolicy("Select");
                    setCurrentRow(null);
                  }}
                  options={probabilityOpts}
                  placement="bottomLeft"
                  listHeight={240}
                  dropdownStyle={{ maxHeight: 240, overflowY: "auto" }}
                  getPopupContainer={() => document.body}
                  style={{ width: "100%" }}
                  allowClear
                  disabled={!isSegmentChosen}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
               }
                />
              </div>

              {/* Policy */}
              <div style={styles.selectGroup}>
                <label style={styles.label}>Policy Number</label>
                <Select
                  value={selectedPolicy === "Select" ? undefined : selectedPolicy}
                  placeholder={
                    isSegmentChosen && isProbabilityChosen
                      ? "Select policy"
                      : "Select segment & probability first"
                  }
                  onChange={(val) => handlePolicyChange(val ?? "Select")}
                  options={policyOpts}
                  disabled={!isSegmentChosen || !isProbabilityChosen}
                  getPopupContainer={() => document.body}
                  dropdownStyle={{ maxHeight: 'min(60vh, 150px)', overflowY: 'auto' }}
                  listHeight={150}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                     option?.label?.toLowerCase().includes(input.toLowerCase())
                   }
                  // filterOption={false}
                  // onSearch={debouncedSearch}
                  onPopupScroll={handlePopupScroll}
                  notFoundContent={
                    polLoading ? (
                      <span style={{ padding: 8 }}>Loading...</span>
                    ) : policyOpts.length === 0 && isSegmentChosen && isProbabilityChosen ? (
                      <span style={{ padding: 8 }}>No policies found for selected criteria</span>
                    ) : null
                  }
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      {(polLoading || polHasMore) && (
                        <div style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#666' }}>
                          {polLoading ? 'Loading...' : polHasMore ? 'Scroll for more' : 'No more results'}
                        </div>
                      )}
                    </div>
                  )}
                  style={{ width: '100%' }}
                  allowClear
                />
              </div>
            </div>
          </div>
        </div>

        {currentRow ? (
          <>
            {/* Profile */}
            <div
              style={{
                ...styles.card,
                ...(hoveredCard === "profile" ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredCard("profile")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.sectionTitle}>Customer Profile</span>
              </div>
              <div style={styles.cardContent}>
                <p style={styles.sectionSubtitle}>
                  Complete customer information and policy details
                </p>

                <div style={styles.statsGrid}>
                  <div
                    style={{
                      ...styles.statCard,
                      ...(hoveredStat === "basic" ? styles.statCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredStat("basic")}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Policy Number:</span>
                      <span style={styles.statValue}>{currentRow["policy no"]}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Customer ID:</span>
                      <span style={styles.statValue}>{currentRow["customerid"]}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Business Type:</span>
                      <span style={styles.statValue}>{currentRow["biztype"]}</span>
                    </div>
                    <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                      <span style={styles.statLabel}>Channel:</span>
                      <span style={styles.statValue}>{currentRow["tie up"]}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statCard,
                      ...(hoveredStat === "location" ? styles.statCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredStat("location")}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Zone:</span>
                      <span style={styles.statValue}>
                        {currentRow["Cleaned Zone 2"]}
                      </span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>State:</span>
                      <span style={styles.statValue}>
                        {currentRow["Cleaned State2"]}
                      </span>
                    </div>
                    <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                      <span style={styles.statLabel}>Branch:</span>
                      <span style={styles.statValue}>
                        {currentRow["Cleaned Branch Name 2"]}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statCard,
                      ...(hoveredStat === "vehicle" ? styles.statCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredStat("vehicle")}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Make:</span>
                      <span style={styles.statValue}>{currentRow["make_clean"]}</span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Model:</span>
                      <span style={styles.statValue}>{currentRow["model_clean"]}</span>
                    </div>
                    <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                      <span style={styles.statLabel}>Variant:</span>
                      <span style={styles.statValue}>{currentRow["variant"]}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statCard,
                      ...(hoveredStat === "financial" ? styles.statCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredStat("financial")}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>OD Premium:</span>
                      <span style={styles.statValue}>
                        {formatMoney(n(currentRow["total od premium"]), currencyCode, inrPer1)}
                      </span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>TP Premium:</span>
                      <span style={styles.statValue}>
                        {formatMoney(n(currentRow["total tp premium"]), currencyCode, inrPer1)}
                      </span>
                    </div>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Add-on Premium:</span>
                      <span style={styles.statValue}>
                        {formatMoney(n(currentRow["before gst add-on gwp"]), currencyCode, inrPer1)}
                      </span>
                    </div>
                    <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                      <span style={styles.statLabel}>Vehicle IDV:</span>
                      <span style={styles.statValue}>
                        {formatMoney(n(currentRow["vehicle idv"]), currencyCode, inrPer1)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statCard,
                      ...(hoveredStat === "benefits" ? styles.statCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredStat("benefits")}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>Discount:</span>
                      <span style={styles.statValue}>
                        {n(currentRow["applicable discount with ncb"]).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ ...styles.statRow, ...styles.statRowLast }}>
                      <span style={styles.statLabel}>NCB:</span>
                      <span style={styles.statValue}>
                        {n(currentRow["ncb % previous year"]).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div style={{ ...styles.statCard, ...styles.specialCard }}>
                    <div
                      style={{
                        ...styles.statRow,
                        ...styles.statRowLast,
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <span style={styles.statLabel}>Key Risk Factors:</span>
                      <span
                        style={{ ...styles.statValue, fontSize: "13px", lineHeight: "1.5" }}
                      >
                        {currentRow["Top 3 Reasons"]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjustments + meters */}
            {(() => {
              const paramKeys = getAdjustableParameters(currentRow["Top 3 Reasons"]);
              if (paramKeys.length === 0) return null;

              return (
                <div
                  style={{
                    ...styles.card,
                    ...(hoveredCard === "combined" ? styles.cardHover : {}),
                  }}
                  onMouseEnter={() => setHoveredCard("combined")}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.sectionTitle}>
                      Parameter Adjustment & Risk Analysis
                    </span>

                    {Object.keys(adjustedParams).length > 0 && (
                      <div
                        style={styles.resetWrap}
                        onClick={resetParameters}
                        title="Reset all parameters"
                      >
                        <span style={styles.resetIcon} aria-hidden>
                          ↺
                        </span>
                        <span
                          style={{
                            ...styles.resetHint,
                            animation: "blink 1.1s linear infinite",
                          }}
                        >
                          click to reset
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardContent}>
                    <p style={styles.sectionSubtitle}>
                      Modify parameters to simulate retention strategies and see
                      real-time impact on churn risk
                    </p>

                    <div style={styles.combinedContainer}>
                      <div style={styles.filtersGrid}>
                        {paramKeys.map((param) => {
                          const originalValue = n(currentRow[paramToColumn[param]]);
                          const currentValue = n(adjustedParams[param] ?? originalValue);
                          const range = paramRanges[param] || { min: 0, max: 100 };
                          const minV = n(range.min);
                          const rangeMax     = Math.max(minV + 1, n(range.max));
                          const maxV         = cappedMaxValue(param, rangeMax, originalValue);
                          const denom = Math.max(1e-9, maxV - minV);
                          const progressPercentage = ((currentValue - minV) / denom) * 100;

                          const formatValue = (val) => {
                            if (param === "discount" || param === "ncb")
                              return `${Number(val).toFixed(1)}%`;
                            return formatMoney(Number(val), currencyCode, inrPer1); 
                          };

                          return (
                            <div key={param} style={styles.sliderGroup}>
                              <div style={styles.sliderHeader}>
  {/* Left: Label */}
  <span style={styles.sliderLabel}>{colTitleMap[param]}</span>

  {/* Right: Current + Original in same row */}
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
    <div style={styles.sliderValue}>Current: {formatValue(currentValue)}</div>
    <div style={styles.sliderOriginal}>Original: {formatValue(originalValue)}</div>
  </div>
</div>
                                  
    <div style={styles.sliderRow}>
  <button
    onPointerDown={(e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startHold(param, -10);
    }}
    onPointerUp={stopHold}
    onPointerCancel={stopHold}
    onLostPointerCapture={stopHold}
    style={styles.button}
  >
    <MinusOutlined />
  </button>

  <input
    type="range"
    min={minV}
    max={maxV}
    step={param === "discount" || param === "ncb" ? 0.5 : 100}
    value={currentValue}
    onChange={(e) => {
      const newValue = parseFloat(e.target.value);
      const clamped = Math.max(minV, Math.min(maxV, newValue));
      setAdjustedParams((prev) => ({ ...prev, [param]: clamped }));
    }}
    style={{
      ...styles.slider,
      flex: 1,               // stretch slider
      margin: "0 8px",       // spacing between buttons
      background: `linear-gradient(to right, #667eea 0%, #667eea ${progressPercentage}%, #e2e8f0 ${progressPercentage}%, #e2e8f0 100%)`,
    }}
  />

  <button
    onPointerDown={(e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startHold(param, +10);
    }}
    onPointerUp={stopHold}
    onPointerCancel={stopHold}
    onLostPointerCapture={stopHold}
    style={styles.button}
  >
    <PlusOutlined />
  </button>
</div>
<div style={styles.innerContainer}>
                                <style>{`
                                  input[type="range"]::-webkit-slider-thumb {
                                    appearance: none;
                                    height: 18px; width: 18px; border-radius: 10%;
                                    margin-top: -2px;
                                    background: #f0f2f5; cursor: pointer;
                                    box-shadow: 4px 4px 8px rgba(163,177,198,0.4),
                                                -4px -4px 8px rgba(255,255,255,0.8),
                                                inset 2px 2px 4px rgba(163,177,198,0.2),
                                                inset -2px -2px 4px rgba(255,255,255,0.8);
                                  }
                                  input[type="range"]::-moz-range-thumb {
                                    height: 18px; width: 18px; border-radius: 50%;
                                    background: #f0f2f5; cursor: pointer; border: none;
                                    box-shadow: 4px 4px 8px rgba(163,177,198,0.4),
                                                -4px -4px 8px rgba(255,255,255,0.8),
                                                inset 2px 2px 4px rgba(163,177,198,0.2),
                                                inset -2px -2px 4px rgba(255,255,255,0.8);
                                  }
                                                .ant-message {
    top: auto !important;
    bottom: 200px !important;
    left: 50% !important;
    transform: translateX(-50%);
  }
                                `}</style>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={styles.metersRowFixed}>
                        <div style={styles.meterBox}>
                          <GaugeMeter value={baseline} label="Baseline Risk" color="#ef4444" size={220} />
                        </div>
                        <div style={styles.meterBox}>
                          <GaugeMeter value={updated} label="Adjusted Risk" color="#f97316" size={220} />
                        </div>

                        {showDelta && (
                          <div
                            style={{
                              ...styles.centerBadge,
                              ...styles.centerBadgeFixed,
                              backgroundColor: improved ? "#c6f6d5" : "#fed7d7",
                              color: improved ? "#2f855a" : "#c53030",
                              boxShadow: `inset 4px 4px 8px ${
                                improved ? "#2f855a" : "#c53030"
                              }20, inset -4px -4px 8px rgba(255,255,255,0.9),
                              6px 6px 12px rgba(163,177,198,0.35), -6px -6px 12px #fff`,
                            }}
                          >
                            <span>{improved ? "↘" : "↗"}</span>
                            <span>{`${Math.abs(deltaVal).toFixed(1)}% vs Baseline`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {Object.keys(adjustedParams).length > 0 && (
                      <div style={styles.impactSummary}>
                        <div style={styles.impactTitle}>Impact Analysis</div>
                        <div style={styles.impactText}>
                          {updated < baseline
                            ? `Positive impact detected: Churn risk reduced by ${(baseline - updated).toFixed(1)} percentage points.`
                            : updated > baseline
                            ? `Warning: Churn risk increased by ${(updated - baseline).toFixed(1)} percentage points.`
                            : `Status: No significant change in risk level.`}
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        ...styles.impactSummary,
                        background:
                          baseline > 70
                            ? "linear-gradient(135deg, #fed7d7 0%, #fbb6ce 100%)"
                            : baseline > 40
                            ? "linear-gradient(135deg, #feebc8 0%, #f6e05e 100%)"
                            : "linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)",
                        marginTop: "20px",
                      }}
                    >
                      <div style={styles.impactTitle}>Recommended Actions</div>
                      <div style={styles.impactText}>
                        {baseline > 70
                          ? "High-risk customer: deploy immediate retention offers, dedicated outreach, and premium reviews."
                          : baseline > 40
                          ? "Medium-risk: schedule policy review, propose loyalty benefits, and follow-ups."
                          : "Low-risk: maintain service levels and explore cross-sell opportunities."}
                      </div>
                    </div>
                    {/* Live Summary (Original vs Adjusted) */}
<div style={{ ...styles.impactSummary, marginTop: 16 }}>
  <div style={styles.impactTitle}>Live Summary (Original vs Adjusted)</div>
  <div style={styles.impactText}>
    {(() => {
      if (!currentRow) return null;

      const originalRow = currentRow;
      const adjRow = adjustedRow;

      // same list you use for sliders
      const paramKeys = getAdjustableParameters(currentRow["Top 3 Reasons"]);

      if (!adjRow || Object.keys(adjustedParams).length === 0) {
        return <span>Move a slider to see coupled values.</span>;
      }

      // master catalog of possible rows (add/remove formats here)
      const summaryDefs = [
        {
          param: "discount",
          label: "Discount",
          key: "applicable discount with ncb",
          fmt: (v) => `${n(v).toFixed(1)}%`,
          deltaFmt: (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)} pp`,
        },
        {
          param: "od_premium",
          label: "OD",
          key: "total od premium",
          fmt: (v) => formatMoney(n(v), currencyCode, inrPer1),
deltaFmt: (d) => {
  const sign = d < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n(d)), currencyCode, inrPer1)}`;
},
        },
        {
          param: "tp_premium",
          label: "TP",
          key: "total tp premium",
          fmt: (v) => formatMoney(n(v), currencyCode, inrPer1),
deltaFmt: (d) => {
  const sign = d < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n(d)), currencyCode, inrPer1)}`;
},
        },
        {
          param: "add_on_premium",
          label: "Add-on",
          key: "before gst add-on gwp",
          fmt: (v) => formatMoney(n(v), currencyCode, inrPer1),
deltaFmt: (d) => {
  const sign = d < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n(d)), currencyCode, inrPer1)}`;
},
        },
        {
          param: "idv",
          label: "IDV",
          key: "vehicle idv",
          fmt: (v) => formatMoney(n(v), currencyCode, inrPer1),
deltaFmt: (d) => {
  const sign = d < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n(d)), currencyCode, inrPer1)}`;
},
        },
        {
          param: "ncb",
          label: "NCB %",
          key: "ncb % previous year",
          fmt: (v) => `${n(v).toFixed(1)}%`,
          deltaFmt: (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)} pp`,
        },
      ];

      // show only rows that have a slider
      const visibleRows = summaryDefs.filter(def => paramKeys.includes(def.param));

      if (visibleRows.length === 0) {
        return <span>No adjustable parameters for this policy.</span>;
      }

      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Metric</th>
                <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Original</th>
                <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Adjusted</th>
                <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ label, key, fmt, deltaFmt }) => {
                const orig = originalRow?.[key];
                const adj  = adjRow?.[key];
                const dRaw = n(adj) - n(orig);
                const delta = Number.isFinite(dRaw) ? dRaw : 0;
                return (
                  <tr key={key}>
                    <td style={{ padding: "6px 8px" }}>{label}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt(orig)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmt(adj)}</td>
                    <td
                      style={{
                        padding: "6px 8px",
                        textAlign: "right",
                        color: delta < 0 ? "#16a34a" : delta > 0 ? "#dc2626" : "#475569",
                      }}
                    >
                      {delta === 0 ? "—" : deltaFmt(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    })()}
  </div>

  {/* Draft Email trigger */}
  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
    <button
      style={styles.infoButton}
      onClick={draftEmailNow}
      title="Create a retention email from these values"
    >
      Draft Email
    </button>
  </div>
</div>

{/* Retention Email composer (appears after Draft Email click) */}
{showEmailComposer && (
  <div ref={emailSectionRef} style={{ ...styles.impactSummary, marginTop: 16 }}>
    <div style={styles.impactTitle}>Retention Email</div>

    <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
      <input
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        placeholder="To (comma-separated)"
        style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
      />
      <input
        value={ccEmail}
        onChange={(e) => setCcEmail(e.target.value)}
        placeholder="Cc (optional, comma-separated)"
        style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
      />
      <input
        value={bccEmail}
        onChange={(e) => setBccEmail(e.target.value)}
        placeholder="Bcc (optional, comma-separated)"
        style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
      />
    </div>

    <div style={{ display: "grid", gap: 8 }}>
      <input
  value={emailSubj}
  onChange={(e) => setEmailSubj(e.target.value)}
  placeholder={drafting ? "Drafting subject..." : "Subject"}
  disabled={drafting}
  style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
/>

<textarea
  value={emailBody}
  onChange={(e) => setEmailBody(e.target.value)}
  placeholder={drafting ? "Drafting body..." : "Email body"}
  rows={8}
  disabled={drafting}
  style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
/>
    </div>

    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
      <button
        style={{ ...styles.successButton, opacity: sending ? 0.7 : 1, cursor: sending ? "not-allowed" : "pointer" }}
        onClick={handleSendEmail}
        disabled={sending}
        title="Send email using backend"
      >
        {sending ? "Sending..." : "Send Email"}
      </button>
    </div>
    <div style={{ fontSize: 12, marginTop: 8, color: "#64748b" }}>
  Leave Subject/Body blank to auto-draft with Groq on the server.
</div>

  </div>
)}

                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.waitingCard}>
                <div style={styles.waitingIcon}>{loading ? "⏳" : "📊"}</div>
                <h3 style={styles.waitingTitle}>
                  {loading ? "Loading..." : "Ready for Analysis"}
                </h3>
                <p style={styles.waitingText}>
                  {!isSegmentChosen 
                    ? "Select a customer segment to begin"
                    : !isProbabilityChosen
                    ? "Select a probability range to filter policies"
                    : "Select a policy to begin the churn risk analysis"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );  
};
 

export default ChurnSimulator;
