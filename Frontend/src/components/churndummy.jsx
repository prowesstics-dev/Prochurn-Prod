// // ChurnSimulator.jsx
// import React, { useMemo, useState, useEffect } from "react";

// /**
//  * Dummy dataset (mimics your CSV columns)
//  */
// const DUMMY_DATA = [
//   {
//     customerid: "C1001",
//     "policy no": "P-9001",
//     biztype: "Renewal",
//     "tie up": "OEM",
//     "Cleaned Zone 2": "West",
//     "Cleaned State2": "Maharashtra",
//     "Cleaned Branch Name 2": "Pune",
//     make_clean: "Maruti",
//     model_clean: "Swift",
//     variant: "ZXI",
//     "total od premium": 14500,
//     "total tp premium": 8200,
//     "before gst add-on gwp": 2100,
//     "applicable discount with ncb": 20,
//     "ncb % previous year": 25,
//     "vehicle idv": 450000,
//     "Churn Probability": 0.62,
//     "Predicted Status": "Not Renewed",
//     "Top 3 Reasons": "High Own-Damage Premium, Low Vehicle IDV, Low Discount with NCB",
//   },
//   {
//     customerid: "C1002",
//     "policy no": "P-9002",
//     biztype: "Renewal",
//     "tie up": "Non-OEM",
//     "Cleaned Zone 2": "South",
//     "Cleaned State2": "Karnataka",
//     "Cleaned Branch Name 2": "Bengaluru",
//     make_clean: "Hyundai",
//     model_clean: "i20",
//     variant: "Sportz",
//     "total od premium": 17500,
//     "total tp premium": 7800,
//     "before gst add-on gwp": 1800,
//     "applicable discount with ncb": 15,
//     "ncb % previous year": 20,
//     "vehicle idv": 520000,
//     "Churn Probability": 0.48,
//     "Predicted Status": "Not Renewed",
//     "Top 3 Reasons": "High Third-Party Premium, High Add-On Premium, Low No Claim Bonus Percentage",
//   },
//   {
//     customerid: "C1003",
//     "policy no": "P-9003",
//     biztype: "New",
//     "tie up": "OEM",
//     "Cleaned Zone 2": "North",
//     "Cleaned State2": "Delhi",
//     "Cleaned Branch Name 2": "Delhi-CP",
//     make_clean: "Tata",
//     model_clean: "Nexon",
//     variant: "XZ+",
//     "total od premium": 16000,
//     "total tp premium": 9000,
//     "before gst add-on gwp": 2500,
//     "applicable discount with ncb": 10,
//     "ncb % previous year": 0,
//     "vehicle idv": 700000,
//     "Churn Probability": 0.37,
//     "Predicted Status": "Renewed",
//     "Top 3 Reasons": "Young Vehicle Age, Minimal Policies Purchased, Tie Up with Non-OEM",
//   },
// ];

// /**
//  * Dummy parameter ranges (would normally come from DB)
//  */
// const PARAM_RANGES = {
//   discount: { min: 0, max: 90 },
//   od_premium: { min: 5000, max: 50000 },
//   tp_premium: { min: 4000, max: 30000 },
//   idv: { min: 200000, max: 2000000 },
//   add_on_premium: { min: 0, max: 10000 },
//   ncb: { min: 0, max: 100 },
// };

// function getAdjustableParameters(reasons) {
//   const adjustableMap = {
//     "Low Vehicle IDV": "idv",
//     "High Own-Damage Premium": "od_premium",
//     "High Third-Party Premium": "tp_premium",
//     "High Add-On Premium": "add_on_premium",
//     "Low Discount with NCB": "discount",
//     "Low No Claim Bonus Percentage": "ncb",
//   };

//   const fallbackParams = new Set(["idv", "od_premium", "tp_premium", "discount"]);
//   const nonAdjustable = new Set([
//     "Young Vehicle Age",
//     "Old Vehicle Age",
//     "Claims Happened",
//     "Multiple Claims on Record",
//     "Minimal Policies Purchased",
//     "Tie Up with Non-OEM",
//   ]);

//   const adjustable = new Set();
//   let sawNonAdj = false;

//   reasons.forEach((r) => {
//     if (adjustableMap[r]) adjustable.add(adjustableMap[r]);
//     if (nonAdjustable.has(r)) sawNonAdj = true;
//   });

//   if (sawNonAdj) {
//     fallbackParams.forEach((p) => adjustable.add(p));
//   }

//   return Array.from(adjustable);
// }

// const PARAM_TO_COLUMN = {
//   discount: "applicable discount with ncb",
//   od_premium: "total od premium",
//   tp_premium: "total tp premium",
//   idv: "vehicle idv",
//   add_on_premium: "before gst add-on gwp",
//   ncb: "ncb % previous year",
// };

// const COL_TITLE_MAP = {
//   discount: ["Applicable Discount (%)", "applicable discount with ncb"],
//   od_premium: ["OD Premium (₹)", "total od premium"],
//   tp_premium: ["TP Premium (₹)", "total tp premium"],
//   idv: ["Vehicle IDV (₹)", "vehicle idv"],
//   add_on_premium: ["Add-On Premium (₹)", "before gst add-on gwp"],
//   ncb: ["NCB (%)", "ncb % previous year"],
// };

// /**
//  * Heuristic updated churn calculator (demo only)
//  */
// function computeUpdatedChurnPct(baselinePct, originalRow, updatedRow) {
//   const W = {
//     discount: -0.25,
//     ncb: -0.1,
//     od_premium: 0.0005,
//     tp_premium: 0.0004,
//     add_on_premium: 0.0002,
//     idv: -0.00002,
//   };

//   let delta = 0;
//   delta += (updatedRow[PARAM_TO_COLUMN.discount] - originalRow[PARAM_TO_COLUMN.discount]) * W.discount;
//   delta += (updatedRow[PARAM_TO_COLUMN.ncb] - originalRow[PARAM_TO_COLUMN.ncb]) * W.ncb;
//   delta += ((updatedRow[PARAM_TO_COLUMN.od_premium] - originalRow[PARAM_TO_COLUMN.od_premium]) / 1000) * (W.od_premium * 1000);
//   delta += ((updatedRow[PARAM_TO_COLUMN.tp_premium] - originalRow[PARAM_TO_COLUMN.tp_premium]) / 1000) * (W.tp_premium * 1000);
//   delta += ((updatedRow[PARAM_TO_COLUMN.add_on_premium] - originalRow[PARAM_TO_COLUMN.add_on_premium]) / 1000) * (W.add_on_premium * 1000);
//   delta += ((updatedRow[PARAM_TO_COLUMN.idv] - originalRow[PARAM_TO_COLUMN.idv]) / 50000) * (W.idv * 50000);

//   return Math.min(100, Math.max(0, baselinePct + delta));
// }

// /**
//  * Styles
//  */
// const styles = {
//   page: {
//     maxWidth: 1080,
//     margin: "0 auto",
//     padding: "24px",
//     fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
//     color: "#0f172a",
//   },
//   header: {
//     display: "flex",
//     alignItems: "baseline",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   title: { fontSize: 28, fontWeight: 700, letterSpacing: 0.2 },
//   sub: { fontSize: 13, color: "#64748b" },

//   card: {
//     background: "white",
//     border: "1px solid #e5e7eb",
//     borderRadius: 14,
//     padding: 16,
//     marginTop: 16,
//     boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
//   },

//   row: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 12,
//   },

//   select: {
//     width: "100%",
//     padding: "10px 12px",
//     borderRadius: 10,
//     border: "1px solid #e5e7eb",
//     fontSize: 14,
//     outline: "none",
//     background: "#fff",
//   },

//   label: { fontSize: 13, color: "#475569", marginBottom: 6, display: "block" },

//   profList: { margin: 0, paddingLeft: 18, lineHeight: 1.7 },
//   profItem: { marginBottom: 4 },

//   sliderWrap: { margin: "12px 0" },
//   sliderLabel: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 },
//   slider: { width: "100%" },

//   gauges: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 16,
//   },

//   gaugeBox: {
//     padding: 12,
//     borderRadius: 14,
//     border: "1px solid #e5e7eb",
//     background: "linear-gradient(180deg, #ffffff, #f8fafc)",
//   },

//   gaugeTitle: { fontSize: 14, color: "#334155", marginBottom: 8, fontWeight: 600 },

//   sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
// };

// /**
//  * Range input with numeric display
//  */
// function RangeField({ label, min, max, step, value, onChange, suffix = "" }) {
//   return (
//     <div style={styles.sliderWrap}>
//       <div style={styles.sliderLabel}>
//         <span>{label}</span>
//         <strong>
//           {Math.round(value).toLocaleString()}
//           {suffix}
//         </strong>
//       </div>
//       <input
//         type="range"
//         style={styles.slider}
//         min={min}
//         max={max}
//         step={step}
//         value={value}
//         onChange={(e) => onChange(Number(e.target.value))}
//       />
//     </div>
//   );
// }

// /**
//  * Analogue semicircle gauge (pure SVG)
//  * Props:
//  *  - value: 0..100
//  *  - label: string
//  *  - highlight: "good" | "bad" | undefined (affects needle color)
//  *  - zones: [{from,to,color}] optional custom zones
//  */
// function AnalogGauge({
//   value = 0,
//   label = "",
//   highlight,
//   zones = [
//     { from: 0, to: 40, color: "#16a34a" },
//     { from: 40, to: 70, color: "#f59e0b" },
//     { from: 70, to: 100, color: "#dc2626" },
//   ],
// }) {
//   const size = 260; // overall svg size
//   const cx = size / 2;
//   const cy = size / 2 + 20; // center slightly lower
//   const radius = 110;
//   const startAngle = -Math.PI; // left end of semicircle (180°)
//   const endAngle = 0; // right end (0°)

//   // Map 0..100 → angle from startAngle..endAngle
//   const toAngle = (pct) => startAngle + (pct / 100) * Math.PI;

//   const polarToCartesian = (centerX, centerY, r, angle) => ({
//     x: centerX + r * Math.cos(angle),
//     y: centerY + r * Math.sin(angle),
//   });

//   const arcPath = (fromPct, toPct, r = radius) => {
//     const start = polarToCartesian(cx, cy, r, toAngle(fromPct));
//     const end = polarToCartesian(cx, cy, r, toAngle(toPct));
//     const largeArcFlag = toPct - fromPct <= 50 ? 0 : 1; // semicircle segments only
//     return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
//   };

//   // Needle
//   const needleAngle = toAngle(Math.max(0, Math.min(100, value)));
//   const needleLen = radius - 12;
//   const needleTip = polarToCartesian(cx, cy, needleLen, needleAngle);
//   const needleColor = highlight === "good" ? "#16a34a" : highlight === "bad" ? "#dc2626" : "#0f172a";

//   // Ticks
//   const majorTicks = [0, 20, 40, 60, 80, 100];

//   return (
//     <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} ${value}%`}>
//       {/* Zones */}
//       {zones.map((z, i) => (
//         <path
//           key={i}
//           d={arcPath(z.from, z.to, radius)}
//           fill="none"
//           stroke={z.color}
//           strokeWidth="16"
//           strokeLinecap="round"
//           opacity="0.9"
//         />
//       ))}

//       {/* Inner track */}
//       <path d={arcPath(0, 100, radius - 14)} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />

//       {/* Ticks and labels */}
//       {majorTicks.map((t) => {
//         const a = toAngle(t);
//         const p1 = polarToCartesian(cx, cy, radius - 4, a);
//         const p2 = polarToCartesian(cx, cy, radius - 20, a);
//         const pl = polarToCartesian(cx, cy, radius - 34, a);
//         return (
//           <g key={t}>
//             <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94a3b8" strokeWidth="2" />
//             <text x={pl.x} y={pl.y} fill="#334155" fontSize="10" textAnchor="middle" dominantBaseline="middle">
//               {t}
//             </text>
//           </g>
//         );
//       })}

//       {/* Needle */}
//       <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={needleColor} strokeWidth="4" strokeLinecap="round" />
//       <circle cx={cx} cy={cy} r="6" fill={needleColor} />
//       <circle cx={cx} cy={cy} r="12" fill="white" stroke="#cbd5e1" />

//       {/* Value box */}
//       <rect x={cx - 46} y={cy - 16} width="92" height="26" rx="8" fill="white" stroke="#e2e8f0" />
//       <text x={cx} y={cy} fill="#0f172a" fontSize="14" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
//         {value.toFixed(2)}%
//       </text>

//       {/* Label */}
//       <text x={cx} y={cy + 40} fill="#334155" fontSize="12" textAnchor="middle">
//         {label}
//       </text>
//     </svg>
//   );
// }

// export default function ChurnSimulator() {
//   const churned = useMemo(() => DUMMY_DATA.filter((r) => r["Predicted Status"] === "Not Renewed"), []);
//   const customerOptions = useMemo(() => ["Select", ...Array.from(new Set(churned.map((r) => r.customerid))).sort()], [churned]);
//   const policyOptions = useMemo(() => ["Select", ...Array.from(new Set(churned.map((r) => r["policy no"]))).sort()], [churned]);

//   const [selectedCustomer, setSelectedCustomer] = useState("Select");
//   const [selectedPolicy, setSelectedPolicy] = useState("Select");

//   const filteredRow = useMemo(() => {
//     if (selectedCustomer !== "Select") return churned.find((r) => r.customerid === selectedCustomer) || null;
//     if (selectedPolicy !== "Select") return churned.find((r) => r["policy no"] === selectedPolicy) || null;
//     return null;
//   }, [selectedCustomer, selectedPolicy, churned]);

//   const reasons = useMemo(() => {
//     if (!filteredRow) return [];
//     const raw = String(filteredRow["Top 3 Reasons"] || "");
//     return raw
//       .split(/,| and /i)
//       .map((s) => s.trim())
//       .filter(Boolean);
//   }, [filteredRow]);

//   const paramKeys = useMemo(() => getAdjustableParameters(reasons), [reasons]);

//   const [tuned, setTuned] = useState(null);
//   useEffect(() => {
//     if (!filteredRow) {
//       setTuned(null);
//       return;
//     }
//     const init = {};
//     Object.entries(PARAM_TO_COLUMN).forEach(([_, col]) => {
//       init[col] = filteredRow[col];
//     });
//     setTuned(init);
//   }, [filteredRow]);

//   const baselinePct = filteredRow ? Math.round(filteredRow["Churn Probability"] * 100 * 100) / 100 : 0;
//   const updatedPct =
//     filteredRow && tuned ? Math.round(computeUpdatedChurnPct(baselinePct, filteredRow, tuned) * 100) / 100 : 0;

//   const delta = updatedPct - baselinePct;
//   const deltaText =
//     delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} pp`;
//   const updatedHighlight = updatedPct < baselinePct ? "good" : updatedPct > baselinePct ? "bad" : undefined;

//   return (
//     <div style={styles.page}>
//       <div style={styles.header}>
//         <div style={styles.title}>Churn Simulator</div>
//         <div style={styles.sub}>Analogue meter comparison with inline styles</div>
//       </div>

//       <div style={{ ...styles.card, ...styles.row }}>
//         <div>
//           <label style={styles.label}>Select Customer ID</label>
//           <select
//             style={styles.select}
//             value={selectedCustomer}
//             onChange={(e) => {
//               setSelectedCustomer(e.target.value);
//               if (e.target.value !== "Select") setSelectedPolicy("Select");
//             }}
//           >
//             {customerOptions.map((v) => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label style={styles.label}>Select Policy ID</label>
//           <select
//             style={styles.select}
//             value={selectedPolicy}
//             onChange={(e) => {
//               setSelectedPolicy(e.target.value);
//               if (e.target.value !== "Select") setSelectedCustomer("Select");
//             }}
//           >
//             {policyOptions.map((v) => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {filteredRow && (
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Customer Profile Summary</div>
//           <ul style={styles.profList}>
//             <li style={styles.profItem}>
//               <strong>Policy No:</strong> {filteredRow["policy no"]}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Customer ID:</strong> {filteredRow.customerid}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Business Type:</strong> {filteredRow.biztype}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Tie-up Type:</strong> {filteredRow["tie up"]}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Zone/State/Branch:</strong> {filteredRow["Cleaned Zone 2"]} / {filteredRow["Cleaned State2"]} /{" "}
//               {filteredRow["Cleaned Branch Name 2"]}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Vehicle:</strong> {filteredRow.make_clean} {filteredRow.model_clean} ({filteredRow.variant})
//             </li>
//             <li style={styles.profItem}>
//               <strong>OD Premium:</strong> ₹{filteredRow["total od premium"].toLocaleString()}
//             </li>
//             <li style={styles.profItem}>
//               <strong>TP Premium:</strong> ₹{filteredRow["total tp premium"].toLocaleString()}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Add-On Premium:</strong> ₹{filteredRow["before gst add-on gwp"].toLocaleString()}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Discount:</strong> {filteredRow["applicable discount with ncb"]}%
//             </li>
//             <li style={styles.profItem}>
//               <strong>NCB %:</strong> {filteredRow["ncb % previous year"]}%
//             </li>
//             <li style={styles.profItem}>
//               <strong>Vehicle IDV:</strong> ₹{filteredRow["vehicle idv"].toLocaleString()}
//             </li>
//             <li style={styles.profItem}>
//               <strong>Churn Risk %:</strong> {baselinePct.toFixed(2)}%
//             </li>
//             <li style={styles.profItem}>
//               <strong>Top 3 Reasons:</strong> {filteredRow["Top 3 Reasons"] || "N/A"}
//             </li>
//           </ul>
//         </div>
//       )}

//       {filteredRow && tuned && (
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Churn Risk Comparison (Analogue)</div>
//           <div style={styles.gauges}>
//             <div style={styles.gaugeBox}>
//               <div style={styles.gaugeTitle}>Baseline</div>
//               <AnalogGauge value={baselinePct} label="Baseline Churn %" />
//             </div>
//             <div style={styles.gaugeBox}>
//               <div style={styles.gaugeTitle}>
//                 Updated <span style={{ color: updatedHighlight === "good" ? "#16a34a" : updatedHighlight === "bad" ? "#dc2626" : "#334155" }}>({deltaText})</span>
//               </div>
//               <AnalogGauge value={updatedPct} label="Updated Churn %" highlight={updatedHighlight} />
//             </div>
//           </div>
//         </div>
//       )}

//       {filteredRow && tuned && (
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Adjust Parameters</div>
//           {getAdjustableParameters(reasons).map((paramKey) => {
//             const range = PARAM_RANGES[paramKey];
//             const titlePair = COL_TITLE_MAP[paramKey];
//             const colName = titlePair?.[1];
//             const label = titlePair?.[0] || paramKey;
//             if (!range || !colName) return null;

//             const step = paramKey === "discount" || paramKey === "ncb" ? 1 : 100;
//             const suffix = paramKey === "discount" || paramKey === "ncb" ? "%" : "";

//             return (
//               <RangeField
//                 key={paramKey}
//                 label={label}
//                 min={range.min}
//                 max={range.max}
//                 step={step}
//                 suffix={suffix}
//                 value={tuned[colName]}
//                 onChange={(v) => {
//                   const next = { ...tuned, [colName]: v };
//                   // Update immediately to reflect in gauge
//                   next.__updatedPct = computeUpdatedChurnPct(baselinePct, filteredRow, next);
//                   setTuned(next);
//                 }}
//               />
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }
//--------------------------------------------metergauge----------------------------------------------------------

// import React, { useState, useMemo } from 'react';

// // Dummy data for predictions
// const dummyPredictionData = [
//   {
//     customerid: "CUST001",
//     "policy no": "POL001",
//     biztype: "Individual",
//     "tie up": "Direct",
//     "Cleaned Zone 2": "North",
//     "Cleaned State2": "Delhi",
//     "Cleaned Branch Name 2": "Delhi Main",
//     make_clean: "Maruti",
//     model_clean: "Swift",
//     variant: "VXI",
//     "total od premium": 15000,
//     "total tp premium": 2500,
//     "before gst add-on gwp": 3000,
//     "applicable discount with ncb": 20,
//     "ncb % previous year": 20,
//     "vehicle idv": 450000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.75,
//     "Top 3 Reasons": "High Own-Damage Premium, Low Discount with NCB, High Add-On Premium"
//   },
//   {
//     customerid: "CUST002",
//     "policy no": "POL002",
//     biztype: "Corporate",
//     "tie up": "Broker",
//     "Cleaned Zone 2": "West",
//     "Cleaned State2": "Maharashtra",
//     "Cleaned Branch Name 2": "Mumbai Central",
//     make_clean: "Honda",
//     model_clean: "City",
//     variant: "ZX",
//     "total od premium": 18000,
//     "total tp premium": 2800,
//     "before gst add-on gwp": 2200,
//     "applicable discount with ncb": 15,
//     "ncb % previous year": 25,
//     "vehicle idv": 650000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.68,
//     "Top 3 Reasons": "Low Vehicle IDV, High Third-Party Premium, Young Vehicle Age"
//   },
//   {
//     customerid: "CUST003",
//     "policy no": "POL003",
//     biztype: "Individual",
//     "tie up": "Direct",
//     "Cleaned Zone 2": "South",
//     "Cleaned State2": "Karnataka",
//     "Cleaned Branch Name 2": "Bangalore Tech",
//     make_clean: "Hyundai",
//     model_clean: "Creta",
//     variant: "SX",
//     "total od premium": 22000,
//     "total tp premium": 3200,
//     "before gst add-on gwp": 4500,
//     "applicable discount with ncb": 10,
//     "ncb % previous year": 15,
//     "vehicle idv": 850000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.82,
//     "Top 3 Reasons": "High Own-Damage Premium, Low No Claim Bonus Percentage, Claims Happened"
//   }
// ];

// // Parameter ranges
// const parameterRanges = {
//   discount: { min: 0.0, max: 90.0 },
//   od_premium: { min: 10000, max: 50000 },
//   tp_premium: { min: 1500, max: 8000 },
//   idv: { min: 200000, max: 2000000 },
//   add_on_premium: { min: 1000, max: 10000 },
//   ncb: { min: 0, max: 50 }
// };

// const styles = {
//   container: {
//     minHeight: '100vh',
//     backgroundColor: '#fafafa',
//     padding: '40px 20px',
//     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
//   },
//   innerContainer: {
//     maxWidth: '1200px',
//     margin: '0 auto'
//   },
//   header: {
//     textAlign: 'center',
//     color: '#1a1a1a',
//     marginBottom: '48px',
//     fontSize: '32px',
//     fontWeight: '300',
//     letterSpacing: '-0.5px'
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: '12px',
//     marginBottom: '24px',
//     boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
//     border: '1px solid #e5e5e5'
//   },
//   cardContent: {
//     padding: '32px'
//   },
//   selectContainer: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gap: '24px'
//   },
//   selectGroup: {
//     display: 'flex',
//     flexDirection: 'column'
//   },
//   label: {
//     fontSize: '14px',
//     fontWeight: '500',
//     color: '#4a5568',
//     marginBottom: '8px'
//   },
//   select: {
//     padding: '12px 16px',
//     border: '1px solid #d2d6dc',
//     borderRadius: '8px',
//     fontSize: '16px',
//     backgroundColor: '#ffffff',
//     color: '#1a202c',
//     outline: 'none',
//     transition: 'border-color 0.2s',
//     appearance: 'none',
//     backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m19 9-7 7-7-7\'/%3E%3C/svg%3E")',
//     backgroundRepeat: 'no-repeat',
//     backgroundPosition: 'right 12px center',
//     backgroundSize: '16px',
//     paddingRight: '40px'
//   },
//   sectionTitle: {
//     fontSize: '20px',
//     fontWeight: '500',
//     color: '#1a202c',
//     marginBottom: '24px'
//   },
//   profileGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//     gap: '16px'
//   },
//   profileItem: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '12px 0',
//     borderBottom: '1px solid #f1f1f1'
//   },
//   profileLabel: {
//     fontSize: '14px',
//     color: '#6b7280',
//     fontWeight: '400'
//   },
//   profileValue: {
//     fontSize: '14px',
//     color: '#1a202c',
//     fontWeight: '500'
//   },
//   reasonsItem: {
//     gridColumn: '1 / -1',
//     flexDirection: 'column',
//     alignItems: 'flex-start',
//     gap: '8px',
//     paddingTop: '16px',
//     marginTop: '8px',
//     borderTop: '1px solid #e5e5e5',
//     borderBottom: 'none'
//   },
//   sliderContainer: {
//     marginBottom: '32px'
//   },
//   sliderWrapper: {
//     marginTop: '16px'
//   },
//   slider: {
//     width: '100%',
//     height: '6px',
//     borderRadius: '3px',
//     background: '#e5e7eb',
//     outline: 'none',
//     appearance: 'none',
//     cursor: 'pointer'
//   },
//   sliderValue: {
//     marginTop: '8px',
//     fontSize: '14px',
//     color: '#6b7280',
//     textAlign: 'right'
//   },
//   metersContainer: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gap: '48px',
//     marginTop: '32px'
//   },
//   meterContainer: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     position: 'relative'
//   },
//   meterTitle: {
//     fontSize: '16px',
//     fontWeight: '500',
//     color: '#4a5568',
//     marginBottom: '24px'
//   },
//   meterSvg: {
//     width: '200px',
//     height: '200px',
//     transform: 'rotate(-90deg)'
//   },
//   meterValue: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     marginTop: '12px',
//     fontSize: '28px',
//     fontWeight: '300',
//     color: '#1a202c'
//   },
//   meterDelta: {
//     marginTop: '16px',
//     fontSize: '14px',
//     fontWeight: '500'
//   },
//   riskBadge: {
//     marginTop: '12px',
//     padding: '4px 12px',
//     borderRadius: '16px',
//     fontSize: '12px',
//     fontWeight: '500',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px'
//   }
// };

// // Clean Analog Meter Component
// const AnalogMeter = ({ value, title, delta }) => {
//   const radius = 80;
//   const strokeWidth = 8;
//   const normalizedRadius = radius - strokeWidth * 2;
//   const circumference = normalizedRadius * 2 * Math.PI;
//   const strokeDasharray = `${circumference} ${circumference}`;
//   const strokeDashoffset = circumference - (value / 100) * circumference;

//   const getColor = (val) => {
//     if (val > 70) return '#ef4444';
//     if (val > 40) return '#f59e0b';
//     return '#10b981';
//   };

//   const getRiskLevel = (val) => {
//     if (val > 70) return 'High Risk';
//     if (val > 40) return 'Medium Risk';
//     return 'Low Risk';
//   };

//   const getRiskColor = (val) => {
//     if (val > 70) return { backgroundColor: '#fef2f2', color: '#dc2626' };
//     if (val > 40) return { backgroundColor: '#fffbeb', color: '#d97706' };
//     return { backgroundColor: '#f0fdf4', color: '#059669' };
//   };

//   const color = getColor(value);
//   const deltaColor = delta > 0 ? '#ef4444' : '#10b981';

//   return (
//     <div style={styles.meterContainer}>
//       <div style={styles.meterTitle}>{title}</div>
//       <div style={{ position: 'relative' }}>
//         <svg style={styles.meterSvg}>
//           <circle
//             stroke="#f3f4f6"
//             fill="transparent"
//             strokeWidth={strokeWidth}
//             r={normalizedRadius}
//             cx="100"
//             cy="100"
//           />
//           <circle
//             stroke={color}
//             fill="transparent"
//             strokeWidth={strokeWidth}
//             strokeDasharray={strokeDasharray}
//             strokeDashoffset={strokeDashoffset}
//             strokeLinecap="round"
//             r={normalizedRadius}
//             cx="100"
//             cy="100"
//             style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
//           />
//         </svg>
//         <div style={styles.meterValue}>{value.toFixed(1)}%</div>
//       </div>
//       {delta !== undefined && delta !== 0 && (
//         <div style={{ ...styles.meterDelta, color: deltaColor }}>
//           {delta > 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)}%
//         </div>
//       )}
//       <div style={{ ...styles.riskBadge, ...getRiskColor(value) }}>
//         {getRiskLevel(value)}
//       </div>
//     </div>
//   );
// };

// const ChurnSimulator = () => {
//   const [selectedCustomer, setSelectedCustomer] = useState('Select');
//   const [selectedPolicy, setSelectedPolicy] = useState('Select');
//   const [adjustedParams, setAdjustedParams] = useState({});

//   // Filter churned customers
//   const churnedData = dummyPredictionData.filter(row => row["Predicted Status"] === "Not Renewed");

//   // Get unique options
//   const customerOptions = ['Select', ...churnedData.map(row => row.customerid)];
//   const policyOptions = ['Select', ...churnedData.map(row => row["policy no"])];

//   // Get current row based on selection
//   const currentRow = useMemo(() => {
//     if (selectedCustomer !== 'Select') {
//       return churnedData.find(row => row.customerid === selectedCustomer);
//     } else if (selectedPolicy !== 'Select') {
//       return churnedData.find(row => row["policy no"] === selectedPolicy);
//     }
//     return null;
//   }, [selectedCustomer, selectedPolicy, churnedData]);

//   // Get adjustable parameters based on reasons
//   const getAdjustableParameters = (reasons) => {
//     const adjustableMap = {
//       "Low Vehicle IDV": "idv",
//       "High Own-Damage Premium": "od_premium",
//       "High Third-Party Premium": "tp_premium",
//       "High Add-On Premium": "add_on_premium",
//       "Low Discount with NCB": "discount",
//       "Low No Claim Bonus Percentage": "ncb"
//     };

//     const fallbackParams = ["idv", "od_premium", "tp_premium", "discount"];
//     const nonAdjustable = [
//       "Young Vehicle Age", "Old Vehicle Age", "Claims Happened",
//       "Multiple Claims on Record", "Minimal Policies Purchased", "Tie Up with Non-OEM"
//     ];

//     const adjustable = new Set();
//     let sawNonAdj = false;

//     const reasonsList = reasons.split(/,|\band\b/).map(r => r.trim()).filter(r => r);

//     for (const reason of reasonsList) {
//       if (adjustableMap[reason]) {
//         adjustable.add(adjustableMap[reason]);
//       } else if (nonAdjustable.includes(reason)) {
//         sawNonAdj = true;
//       }
//     }

//     if (sawNonAdj) {
//       fallbackParams.forEach(param => adjustable.add(param));
//     }

//     return Array.from(adjustable);
//   };

//   // Parameter mapping
//   const paramToColumn = {
//     discount: "applicable discount with ncb",
//     od_premium: "total od premium",
//     tp_premium: "total tp premium",
//     idv: "vehicle idv",
//     add_on_premium: "before gst add-on gwp",
//     ncb: "ncb % previous year"
//   };

//   const colTitleMap = {
//     discount: "Discount",
//     od_premium: "OD Premium",
//     tp_premium: "TP Premium",
//     idv: "Vehicle IDV",
//     add_on_premium: "Add-On Premium",
//     ncb: "NCB Percentage"
//   };

//   // Handle customer selection
//   const handleCustomerChange = (customerId) => {
//     setSelectedCustomer(customerId);
//     if (customerId !== 'Select') {
//       setSelectedPolicy('Select');
//     }
//     setAdjustedParams({});
//   };

//   // Handle policy selection
//   const handlePolicyChange = (policyId) => {
//     setSelectedPolicy(policyId);
//     if (policyId !== 'Select') {
//       setSelectedCustomer('Select');
//     }
//     setAdjustedParams({});
//   };

//   // Calculate updated churn probability (mock calculation)
//   const calculateUpdatedChurn = (baselineChurn, adjustments) => {
//     let adjustment = 0;
//     Object.entries(adjustments).forEach(([param, value]) => {
//       const originalValue = currentRow[paramToColumn[param]];
//       const percentChange = (value - originalValue) / originalValue;
      
//       // Mock impact calculation
//       if (param === 'discount') adjustment -= percentChange * 20;
//       else if (param === 'od_premium') adjustment += percentChange * 15;
//       else if (param === 'tp_premium') adjustment += percentChange * 10;
//       else if (param === 'idv') adjustment -= percentChange * 5;
//       else if (param === 'add_on_premium') adjustment += percentChange * 12;
//       else if (param === 'ncb') adjustment -= percentChange * 8;
//     });

//     const newChurn = Math.max(0, Math.min(100, baselineChurn + adjustment));
//     return newChurn;
//   };

//   const baseline = currentRow ? currentRow["Churn Probability"] * 100 : 0;
//   const updated = currentRow && Object.keys(adjustedParams).length > 0 
//     ? calculateUpdatedChurn(baseline, adjustedParams) 
//     : baseline;

//   return (
//     <div style={styles.container}>
//       <div style={styles.innerContainer}>
//         <h1 style={styles.header}>Churn Simulator</h1>

//         <div style={styles.card}>
//           <div style={styles.cardContent}>
//             <div style={styles.selectContainer}>
//               <div style={styles.selectGroup}>
//                 <label style={styles.label}>Customer ID</label>
//                 <select 
//                   style={styles.select}
//                   value={selectedCustomer}
//                   onChange={(e) => handleCustomerChange(e.target.value)}
//                 >
//                   {customerOptions.map(option => (
//                     <option key={option} value={option}>{option}</option>
//                   ))}
//                 </select>
//               </div>
//               <div style={styles.selectGroup}>
//                 <label style={styles.label}>Policy ID</label>
//                 <select 
//                   style={styles.select}
//                   value={selectedPolicy}
//                   onChange={(e) => handlePolicyChange(e.target.value)}
//                 >
//                   {policyOptions.map(option => (
//                     <option key={option} value={option}>{option}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {currentRow && (
//           <>
//             <div style={styles.card}>
//               <div style={styles.cardContent}>
//                 <h2 style={styles.sectionTitle}>Customer Profile</h2>
//                 <div style={styles.profileGrid}>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Policy Number</span>
//                     <span style={styles.profileValue}>{currentRow["policy no"]}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Customer ID</span>
//                     <span style={styles.profileValue}>{currentRow.customerid}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Business Type</span>
//                     <span style={styles.profileValue}>{currentRow.biztype}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Zone</span>
//                     <span style={styles.profileValue}>{currentRow["Cleaned Zone 2"]}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>State</span>
//                     <span style={styles.profileValue}>{currentRow["Cleaned State2"]}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Vehicle</span>
//                     <span style={styles.profileValue}>{currentRow.make_clean} {currentRow.model_clean} {currentRow.variant}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>OD Premium</span>
//                     <span style={styles.profileValue}>₹{currentRow["total od premium"].toLocaleString()}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>TP Premium</span>
//                     <span style={styles.profileValue}>₹{currentRow["total tp premium"].toLocaleString()}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Add-On Premium</span>
//                     <span style={styles.profileValue}>₹{currentRow["before gst add-on gwp"].toLocaleString()}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Vehicle IDV</span>
//                     <span style={styles.profileValue}>₹{currentRow["vehicle idv"].toLocaleString()}</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>Discount</span>
//                     <span style={styles.profileValue}>{currentRow["applicable discount with ncb"]}%</span>
//                   </div>
//                   <div style={styles.profileItem}>
//                     <span style={styles.profileLabel}>NCB Percentage</span>
//                     <span style={styles.profileValue}>{currentRow["ncb % previous year"]}%</span>
//                   </div>
//                   <div style={{...styles.profileItem, ...styles.reasonsItem}}>
//                     <span style={styles.profileLabel}>Churn Reasons</span>
//                     <span style={styles.profileValue}>{currentRow["Top 3 Reasons"]}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {(() => {
//               const paramKeys = getAdjustableParameters(currentRow["Top 3 Reasons"]);
//               return paramKeys.length > 0 && (
//                 <div style={styles.card}>
//                   <div style={styles.cardContent}>
//                     <h2 style={styles.sectionTitle}>Adjust Parameters</h2>
//                     {paramKeys.map(param => {
//                       if (!parameterRanges[param] || !paramToColumn[param]) return null;
                      
//                       const column = paramToColumn[param];
//                       const label = colTitleMap[param];
//                       const min = parameterRanges[param].min;
//                       const max = parameterRanges[param].max;
//                       const current = adjustedParams[param] || currentRow[column];
                      
//                       return (
//                         <div key={param} style={styles.sliderContainer}>
//                           <label style={styles.label}>{label}</label>
//                           <div style={styles.sliderWrapper}>
//                             <input
//                               type="range"
//                               min={min}
//                               max={max}
//                               value={current}
//                               step={param === 'discount' || param === 'ncb' ? 1 : 100}
//                               style={styles.slider}
//                               onChange={(e) => setAdjustedParams(prev => ({
//                                 ...prev,
//                                 [param]: parseFloat(e.target.value)
//                               }))}
//                             />
//                             <div style={styles.sliderValue}>
//                               {param === 'idv' || param.includes('premium') ? '₹' : ''}{current.toLocaleString()}{param === 'discount' || param === 'ncb' ? '%' : ''}
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               );
//             })()}

//             <div style={styles.card}>
//               <div style={styles.cardContent}>
//                 <h2 style={styles.sectionTitle}>Churn Risk Analysis</h2>
//                 <div style={styles.metersContainer}>
//                   <AnalogMeter 
//                     value={baseline}
//                     title="Baseline Risk"
//                     delta={baseline - updated}
//                   />
//                   <AnalogMeter 
//                     value={updated}
//                     title="Adjusted Risk"
//                     delta={updated - baseline}
//                   />
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChurnSimulator;


//-------------------------------------Simple white design------------------------------------------------------

// import React, { useState, useMemo } from 'react';

// // Dummy data for predictions
// const dummyPredictionData = [
//   {
//     customerid: "CUST001",
//     "policy no": "POL001",
//     biztype: "Individual",
//     "tie up": "Direct",
//     "Cleaned Zone 2": "North",
//     "Cleaned State2": "Delhi",
//     "Cleaned Branch Name 2": "Delhi Main",
//     make_clean: "Maruti",
//     model_clean: "Swift",
//     variant: "VXI",
//     "total od premium": 15000,
//     "total tp premium": 2500,
//     "before gst add-on gwp": 3000,
//     "applicable discount with ncb": 20,
//     "ncb % previous year": 20,
//     "vehicle idv": 450000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.75,
//     "Top 3 Reasons": "High Own-Damage Premium, Low Discount with NCB, High Add-On Premium"
//   },
//   {
//     customerid: "CUST002",
//     "policy no": "POL002",
//     biztype: "Corporate",
//     "tie up": "Broker",
//     "Cleaned Zone 2": "West",
//     "Cleaned State2": "Maharashtra",
//     "Cleaned Branch Name 2": "Mumbai Central",
//     make_clean: "Honda",
//     model_clean: "City",
//     variant: "ZX",
//     "total od premium": 18000,
//     "total tp premium": 2800,
//     "before gst add-on gwp": 2200,
//     "applicable discount with ncb": 15,
//     "ncb % previous year": 25,
//     "vehicle idv": 650000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.68,
//     "Top 3 Reasons": "Low Vehicle IDV, High Third-Party Premium, Young Vehicle Age"
//   },
//   {
//     customerid: "CUST003",
//     "policy no": "POL003",
//     biztype: "Individual",
//     "tie up": "Direct",
//     "Cleaned Zone 2": "South",
//     "Cleaned State2": "Karnataka",
//     "Cleaned Branch Name 2": "Bangalore Tech",
//     make_clean: "Hyundai",
//     model_clean: "Creta",
//     variant: "SX",
//     "total od premium": 22000,
//     "total tp premium": 3200,
//     "before gst add-on gwp": 4500,
//     "applicable discount with ncb": 10,
//     "ncb % previous year": 15,
//     "vehicle idv": 850000,
//     "Predicted Status": "Not Renewed",
//     "Churn Probability": 0.82,
//     "Top 3 Reasons": "High Own-Damage Premium, Low No Claim Bonus Percentage, Claims Happened"
//   }
// ];

// // Parameter ranges
// const parameterRanges = {
//   discount: { min: 0.0, max: 90.0 },
//   od_premium: { min: 10000, max: 50000 },
//   tp_premium: { min: 1500, max: 8000 },
//   idv: { min: 200000, max: 2000000 },
//   add_on_premium: { min: 1000, max: 10000 },
//   ncb: { min: 0, max: 50 }
// };

// const styles = {
//   container: {
//     minHeight: '100vh',
//     background: '#1a1a0f',
//     backgroundImage: `
//       radial-gradient(circle at 20% 30%, rgba(255, 138, 76, 0.15) 0%, transparent 50%),
//       radial-gradient(circle at 80% 70%, rgba(255, 205, 102, 0.15) 0%, transparent 50%),
//       radial-gradient(circle at 50% 50%, rgba(75, 85, 99, 0.1) 0%, transparent 50%),
//       linear-gradient(45deg, #1a1a0f 25%, #2d2516 25%, #2d2516 50%, #1a1a0f 50%, #1a1a0f 75%, #2d2516 75%)
//     `,
//     backgroundSize: '20px 20px, 20px 20px, 100% 100%, 40px 40px',
//     padding: '40px 24px',
//     fontFamily: '"Courier New", "Lucida Console", monospace',
//     position: 'relative'
//   },
//   innerContainer: {
//     maxWidth: '1400px',
//     margin: '0 auto',
//     position: 'relative'
//   },
//   header: {
//     textAlign: 'center',
//     color: '#ff8a4c',
//     marginBottom: '60px',
//     fontSize: '48px',
//     fontWeight: '900',
//     letterSpacing: '4px',
//     textTransform: 'uppercase',
//     textShadow: `
//       0 0 10px #ff8a4c,
//       0 0 20px #ff8a4c,
//       0 0 30px #ff8a4c,
//       2px 2px 0px #b8860b,
//       4px 4px 0px #8b4513
//     `,
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     position: 'relative'
//   },
//   headerSubtitle: {
//     textAlign: 'center',
//     color: '#ffcd66',
//     marginTop: '16px',
//     fontSize: '18px',
//     fontWeight: '600',
//     letterSpacing: '2px',
//     textTransform: 'uppercase',
//     textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
//   },
//   scanlines: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `repeating-linear-gradient(
//       0deg,
//       transparent,
//       transparent 2px,
//       rgba(255, 138, 76, 0.03) 2px,
//       rgba(255, 138, 76, 0.03) 4px
//     )`,
//     pointerEvents: 'none'
//   },
//   card: {
//     backgroundColor: '#2a2a1a',
//     border: '3px solid #ff8a4c',
//     borderRadius: '0',
//     marginBottom: '40px',
//     boxShadow: `
//       inset 0 0 20px rgba(255, 138, 76, 0.1),
//       0 0 20px rgba(255, 138, 76, 0.2),
//       8px 8px 0px #1a1a0f
//     `,
//     position: 'relative',
//     transition: 'all 0.3s ease',
//     backgroundImage: `
//       linear-gradient(45deg, #2a2a1a 25%, #333322 25%, #333322 50%, #2a2a1a 50%, #2a2a1a 75%, #333322 75%)
//     `,
//     backgroundSize: '20px 20px'
//   },
//   cardHover: {
//     transform: 'translate(-4px, -4px)',
//     boxShadow: `
//       inset 0 0 30px rgba(255, 138, 76, 0.15),
//       0 0 30px rgba(255, 138, 76, 0.3),
//       12px 12px 0px #1a1a0f
//     `
//   },
//   cardHeader: {
//     backgroundColor: '#3a3a2a',
//     borderBottom: '3px solid #ff8a4c',
//     padding: '24px 32px',
//     position: 'relative',
//     backgroundImage: `
//       repeating-linear-gradient(
//         90deg,
//         #3a3a2a,
//         #3a3a2a 2px,
//         #4a4a3a 2px,
//         #4a4a3a 4px
//       )
//     `
//   },
//   cardContent: {
//     padding: '32px'
//   },
//   sectionTitle: {
//     fontSize: '24px',
//     fontWeight: '700',
//     color: '#ffcd66',
//     textTransform: 'uppercase',
//     letterSpacing: '2px',
//     textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
//     fontFamily: '"Orbitron", "Courier New", monospace'
//   },
//   sectionSubtitle: {
//     fontSize: '14px',
//     color: '#b8b8a8',
//     marginBottom: '28px',
//     letterSpacing: '1px',
//     textTransform: 'uppercase',
//     fontFamily: '"Courier New", monospace'
//   },
//   selectContainer: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(2, 1fr)',
//     gap: '32px'
//   },
//   selectGroup: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px'
//   },
//   label: {
//     fontSize: '16px',
//     fontWeight: '700',
//     color: '#ff8a4c',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
//     fontFamily: '"Orbitron", "Courier New", monospace'
//   },
//   select: {
//     padding: '16px 20px',
//     border: '3px solid #ff8a4c',
//     borderRadius: '0',
//     fontSize: '14px',
//     backgroundColor: '#1a1a0f',
//     color: '#ffcd66',
//     outline: 'none',
//     fontFamily: '"Courier New", monospace',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
//     cursor: 'pointer'
//   },
//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
//     gap: '24px'
//   },
//   statCard: {
//     backgroundColor: '#1a1a0f',
//     border: '2px solid #ffcd66',
//     padding: '24px',
//     position: 'relative',
//     transition: 'all 0.3s ease',
//     boxShadow: 'inset 0 0 15px rgba(255, 205, 102, 0.1)',
//     backgroundImage: `
//       repeating-linear-gradient(
//         45deg,
//         #1a1a0f,
//         #1a1a0f 10px,
//         #252515 10px,
//         #252515 20px
//       )
//     `
//   },
//   statCardHover: {
//     transform: 'scale(1.02)',
//     boxShadow: `
//       inset 0 0 20px rgba(255, 205, 102, 0.15),
//       0 0 20px rgba(255, 205, 102, 0.3)
//     `,
//     borderColor: '#ff8a4c'
//   },
//   statRow: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '12px 0',
//     borderBottom: '1px solid #4a4a3a'
//   },
//   statRowLast: {
//     borderBottom: 'none'
//   },
//   statLabel: {
//     fontSize: '13px',
//     color: '#b8b8a8',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     fontFamily: '"Courier New", monospace'
//   },
//   statValue: {
//     fontSize: '14px',
//     color: '#ffcd66',
//     fontWeight: '700',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
//     fontFamily: '"Orbitron", "Courier New", monospace'
//   },
//   specialCard: {
//     backgroundColor: '#2a1a1a',
//     borderColor: '#ff6b4c',
//     boxShadow: `
//       inset 0 0 20px rgba(255, 107, 76, 0.1),
//       0 0 20px rgba(255, 107, 76, 0.2)
//     `
//   },
//   sliderContainer: {
//     marginBottom: '32px'
//   },
//   sliderGroup: {
//     backgroundColor: '#2a2a1a',
//     border: '2px solid #ff8a4c',
//     padding: '24px',
//     marginBottom: '20px',
//     position: 'relative',
//     boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
//     backgroundImage: `
//       repeating-linear-gradient(
//         90deg,
//         #2a2a1a,
//         #2a2a1a 1px,
//         #3a3a2a 1px,
//         #3a3a2a 2px
//       )
//     `
//   },
//   sliderHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: '20px'
//   },
//   sliderLabel: {
//     fontSize: '16px',
//     fontWeight: '700',
//     color: '#ff8a4c',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
//   },
//   slider: {
//     width: '100%',
//     height: '8px',
//     borderRadius: '0',
//     outline: 'none',
//     appearance: 'none',
//     cursor: 'pointer',
//     background: '#1a1a0f',
//     border: '2px solid #4a4a3a',
//     boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
//   },
//   sliderValue: {
//     marginTop: '12px',
//     fontSize: '14px',
//     color: '#ffcd66',
//     fontWeight: '700',
//     textAlign: 'right',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
//   },
//   sliderOriginal: {
//     fontSize: '12px',
//     color: '#8a8a7a',
//     fontWeight: '400',
//     fontFamily: '"Courier New", monospace'
//   },
//   metersContainer: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(2, 1fr)',
//     gap: '48px',
//     marginTop: '40px'
//   },
//   meterContainer: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     backgroundColor: '#2a2a1a',
//     border: '3px solid #ff8a4c',
//     padding: '32px',
//     position: 'relative',
//     boxShadow: `
//       inset 0 0 20px rgba(255, 138, 76, 0.1),
//       8px 8px 0px #1a1a0f
//     `,
//     backgroundImage: `
//       radial-gradient(circle at center, #2a2a1a 30%, #3a3a2a 70%)
//     `
//   },
//   meterTitle: {
//     fontSize: '18px',
//     fontWeight: '700',
//     color: '#ffcd66',
//     marginBottom: '24px',
//     textAlign: 'center',
//     textTransform: 'uppercase',
//     letterSpacing: '2px',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
//   },
//   meterSvg: {
//     width: '200px',
//     height: '200px',
//     transform: 'rotate(-90deg)',
//     filter: 'drop-shadow(0 0 10px rgba(255, 138, 76, 0.5))'
//   },
//   meterValue: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     marginTop: '12px',
//     fontSize: '28px',
//     fontWeight: '900',
//     color: '#ff8a4c',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: `
//       0 0 10px #ff8a4c,
//       2px 2px 4px rgba(0,0,0,0.8)
//     `
//   },
//   meterDelta: {
//     marginTop: '20px',
//     fontSize: '14px',
//     fontWeight: '700',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '8px',
//     padding: '8px 16px',
//     border: '2px solid',
//     backgroundColor: '#1a1a0f',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     fontFamily: '"Orbitron", "Courier New", monospace'
//   },
//   riskBadge: {
//     marginTop: '16px',
//     padding: '8px 20px',
//     fontSize: '12px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '2px',
//     border: '2px solid',
//     backgroundColor: '#1a1a0f',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
//   },
//   resetButton: {
//     backgroundColor: '#1a1a0f',
//     color: '#ff8a4c',
//     border: '3px solid #ff8a4c',
//     padding: '16px 32px',
//     fontSize: '14px',
//     fontWeight: '700',
//     cursor: 'pointer',
//     transition: 'all 0.3s ease',
//     marginTop: '24px',
//     textTransform: 'uppercase',
//     letterSpacing: '2px',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     boxShadow: '4px 4px 0px #2a2a1a',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
//   },
//   resetButtonHover: {
//     transform: 'translate(-2px, -2px)',
//     boxShadow: '6px 6px 0px #2a2a1a',
//     backgroundColor: '#ff8a4c',
//     color: '#1a1a0f'
//   },
//   impactSummary: {
//     marginTop: '24px',
//     padding: '20px',
//     backgroundColor: '#2a2a1a',
//     border: '2px solid #ffcd66',
//     position: 'relative',
//     boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
//     backgroundImage: `
//       repeating-linear-gradient(
//         45deg,
//         #2a2a1a,
//         #2a2a1a 5px,
//         #3a3a2a 5px,
//         #3a3a2a 10px
//       )
//     `
//   },
//   impactTitle: {
//     fontSize: '16px',
//     fontWeight: '700',
//     color: '#ff8a4c',
//     marginBottom: '8px',
//     textTransform: 'uppercase',
//     letterSpacing: '1px',
//     fontFamily: '"Orbitron", "Courier New", monospace',
//     textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
//   },
//   impactText: {
//     fontSize: '13px',
//     color: '#b8b8a8',
//     lineHeight: '1.6',
//     fontFamily: '"Courier New", monospace'
//   },
//   terminalPrompt: {
//     color: '#ff8a4c',
//     fontFamily: '"Courier New", monospace',
//     fontSize: '14px',
//     marginBottom: '8px'
//   }
// };

// // Retro Analog Meter Component with CRT styling
// const AnalogMeter = ({ value, title, delta, isBaseline = false }) => {
//   const radius = 80;
//   const strokeWidth = 12;
//   const normalizedRadius = radius - strokeWidth * 2;
//   const circumference = normalizedRadius * 2 * Math.PI;
//   const strokeDasharray = `${circumference} ${circumference}`;
//   const strokeDashoffset = circumference - (value / 100) * circumference;

//   const getColor = (val) => {
//     if (val > 70) return '#ff6b4c';
//     if (val > 40) return '#ffcd66';
//     return '#4cff6b';
//   };

//   const getRiskLevel = (val) => {
//     if (val > 70) return 'HIGH RISK';
//     if (val > 40) return 'MED RISK';
//     return 'LOW RISK';
//   };

//   const getRiskStyle = (val) => {
//     if (val > 70) return { 
//       backgroundColor: '#1a1a0f', 
//       color: '#ff6b4c', 
//       borderColor: '#ff6b4c' 
//     };
//     if (val > 40) return { 
//       backgroundColor: '#1a1a0f', 
//       color: '#ffcd66', 
//       borderColor: '#ffcd66' 
//     };
//     return { 
//       backgroundColor: '#1a1a0f', 
//       color: '#4cff6b', 
//       borderColor: '#4cff6b' 
//     };
//   };

//   const color = getColor(value);
//   const deltaStyle = delta > 0 ? 
//     { borderColor: '#ff6b4c', color: '#ff6b4c' } :
//     { borderColor: '#4cff6b', color: '#4cff6b' };

//   return (
//     <div style={styles.meterContainer}>
//       <div style={styles.terminalPrompt}> SCANNING CHURN_RISK.EXE</div>
//       <div style={styles.meterTitle}>
//         {title}
//       </div>
//       <div style={{ position: 'relative' }}>
//         <svg style={styles.meterSvg}>
//           {/* Background circle */}
//           <circle
//             stroke="#4a4a3a"
//             fill="transparent"
//             strokeWidth={strokeWidth}
//             r={normalizedRadius}
//             cx="100"
//             cy="100"
//             strokeDasharray="5,5"
//           />
//           {/* Progress circle */}
//           <circle
//             stroke={color}
//             fill="transparent"
//             strokeWidth={strokeWidth}
//             strokeDasharray={strokeDasharray}
//             strokeDashoffset={strokeDashoffset}
//             strokeLinecap="square"
//             r={normalizedRadius}
//             cx="100"
//             cy="100"
//             style={{ 
//               transition: 'stroke-dashoffset 1s ease-in-out',
//               filter: `drop-shadow(0 0 10px ${color})`
//             }}
//           />
//           {/* Center dot */}
//           <circle
//             fill={color}
//             r={6}
//             cx="100"
//             cy="100"
//           />
//           {/* Scan line effect */}
//           <line
//             x1="20"
//             y1="100"
//             x2="180"
//             y2="100"
//             stroke={color}
//             strokeWidth="1"
//             opacity="0.3"
//             strokeDasharray="2,2"
//           >
//             <animate
//               attributeName="stroke-opacity"
//               values="0.1;0.8;0.1"
//               dur="2s"
//               repeatCount="indefinite"
//             />
//           </line>
//         </svg>
//         <div style={styles.meterValue}>{value.toFixed(1)}%</div>
//       </div>
//       {delta !== undefined && delta !== 0 && (
//         <div style={{ ...styles.meterDelta, ...deltaStyle }}>
//           <span>{delta > 0 ? '▲' : '▼'}</span>
//           <span>{Math.abs(delta).toFixed(1)}% VS BASELINE</span>
//         </div>
//       )}
//       <div style={{ ...styles.riskBadge, ...getRiskStyle(value) }}>
//         {getRiskLevel(value)}
//       </div>
//     </div>
//   );
// };

// const ChurnSimulator = () => {
//   const [selectedCustomer, setSelectedCustomer] = useState('Select');
//   const [selectedPolicy, setSelectedPolicy] = useState('Select');
//   const [adjustedParams, setAdjustedParams] = useState({});
//   const [hoveredCard, setHoveredCard] = useState(null);
//   const [hoveredStat, setHoveredStat] = useState(null);
//   const [hoveredButton, setHoveredButton] = useState(false);

//   // Filter churned customers
//   const churnedData = dummyPredictionData.filter(row => row["Predicted Status"] === "Not Renewed");

//   // Get unique options
//   const customerOptions = ['Select', ...churnedData.map(row => row.customerid)];
//   const policyOptions = ['Select', ...churnedData.map(row => row["policy no"])];

//   // Get current row based on selection
//   const currentRow = useMemo(() => {
//     if (selectedCustomer !== 'Select') {
//       return churnedData.find(row => row.customerid === selectedCustomer);
//     } else if (selectedPolicy !== 'Select') {
//       return churnedData.find(row => row["policy no"] === selectedPolicy);
//     }
//     return null;
//   }, [selectedCustomer, selectedPolicy, churnedData]);

//   // Get adjustable parameters based on reasons
//   const getAdjustableParameters = (reasons) => {
//     const adjustableMap = {
//       "Low Vehicle IDV": "idv",
//       "High Own-Damage Premium": "od_premium",
//       "High Third-Party Premium": "tp_premium",
//       "High Add-On Premium": "add_on_premium",
//       "Low Discount with NCB": "discount",
//       "Low No Claim Bonus Percentage": "ncb"
//     };

//     const fallbackParams = ["idv", "od_premium", "tp_premium", "discount"];
//     const nonAdjustable = [
//       "Young Vehicle Age", "Old Vehicle Age", "Claims Happened",
//       "Multiple Claims on Record", "Minimal Policies Purchased", "Tie Up with Non-OEM"
//     ];

//     const adjustable = new Set();
//     let sawNonAdj = false;

//     const reasonsList = reasons.split(/,|\band\b/).map(r => r.trim()).filter(r => r);

//     for (const reason of reasonsList) {
//       if (adjustableMap[reason]) {
//         adjustable.add(adjustableMap[reason]);
//       } else if (nonAdjustable.includes(reason)) {
//         sawNonAdj = true;
//       }
//     }

//     if (sawNonAdj) {
//       fallbackParams.forEach(param => adjustable.add(param));
//     }

//     return Array.from(adjustable);
//   };

//   // Parameter mapping
//   const paramToColumn = {
//     discount: "applicable discount with ncb",
//     od_premium: "total od premium",
//     tp_premium: "total tp premium",
//     idv: "vehicle idv",
//     add_on_premium: "before gst add-on gwp",
//     ncb: "ncb % previous year"
//   };

//   const colTitleMap = {
//     discount: "DISCOUNT PERCENTAGE",
//     od_premium: "OWN DAMAGE PREMIUM",
//     tp_premium: "THIRD PARTY PREMIUM", 
//     idv: "INSURED DECLARED VALUE",
//     add_on_premium: "ADD-ON PREMIUM",
//     ncb: "NO CLAIM BONUS"
//   };

//   // Handle customer selection
//   const handleCustomerChange = (customerId) => {
//     setSelectedCustomer(customerId);
//     if (customerId !== 'Select') {
//       setSelectedPolicy('Select');
//     }
//     setAdjustedParams({});
//   };

//   // Handle policy selection
//   const handlePolicyChange = (policyId) => {
//     setSelectedPolicy(policyId);
//     if (policyId !== 'Select') {
//       setSelectedCustomer('Select');
//     }
//     setAdjustedParams({});
//   };

//   // Reset parameters
//   const resetParameters = () => {
//     setAdjustedParams({});
//   };

//   // Calculate updated churn probability
//   const calculateUpdatedChurn = (baselineChurn, adjustments) => {
//     let adjustment = 0;
//     Object.entries(adjustments).forEach(([param, value]) => {
//       const originalValue = currentRow[paramToColumn[param]];
//       const percentChange = (value - originalValue) / originalValue;
      
//       if (param === 'discount') adjustment -= percentChange * 20;
//       else if (param === 'od_premium') adjustment += percentChange * 15;
//       else if (param === 'tp_premium') adjustment += percentChange * 10;
//       else if (param === 'idv') adjustment -= percentChange * 5;
//       else if (param === 'add_on_premium') adjustment += percentChange * 12;
//       else if (param === 'ncb') adjustment -= percentChange * 8;
//     });

//     const newChurn = Math.max(0, Math.min(100, baselineChurn + adjustment));
//     return newChurn;
//   };

//   const baseline = currentRow ? currentRow["Churn Probability"] * 100 : 0;
//   const updated = currentRow && Object.keys(adjustedParams).length > 0 
//     ? calculateUpdatedChurn(baseline, adjustedParams) 
//     : baseline;

//   const getCardStyle = (cardId) => ({
//     ...styles.card,
//     ...(hoveredCard === cardId ? styles.cardHover : {})
//   });

//   const getStatCardStyle = (statId) => ({
//     ...styles.statCard,
//     ...(hoveredStat === statId ? styles.statCardHover : {})
//   });

//   const getButtonStyle = () => ({
//     ...styles.resetButton,
//     ...(hoveredButton ? styles.resetButtonHover : {})
//   });

//   return (
//     <div style={styles.container}>
//       <div style={styles.scanlines}></div>
//       <div style={styles.innerContainer}>
//         <h1 style={styles.header}>
//           CUSTOMER CHURN
//           <br />
//           RISK ASSESSMENT
//         </h1>
//         <p style={styles.headerSubtitle}>
//           VINTAGE ANALYTICS TERMINAL v2.1.85
//         </p>

//         <div 
//           style={getCardStyle('selector')}
//           onMouseEnter={() => setHoveredCard('selector')}
//           onMouseLeave={() => setHoveredCard(null)}
//         >
//           <div style={styles.cardHeader}>
//             <div style={styles.terminalPrompt}> CUSTOMER_SELECTION.EXE</div>
//             <span style={styles.sectionTitle}>
//               CUSTOMER SELECTION MODULE
//             </span>
//           </div>
//           <div style={styles.cardContent}>
//             <p style={styles.sectionSubtitle}>
//               SELECT TARGET FOR CHURN RISK ANALYSIS
//             </p>
//             <div style={styles.selectContainer}>
//               <div style={styles.selectGroup}>
//                 <label style={styles.label}>
//                   CUSTOMER_ID:
//                 </label>
//                 <select 
//                   style={styles.select}
//                   value={selectedCustomer}
//                   onChange={(e) => handleCustomerChange(e.target.value)}
//                 >
//                   {customerOptions.map(option => (
//                     <option key={option} value={option}>{option}</option>
//                   ))}
//                 </select>
//               </div>
//               <div style={styles.selectGroup}>
//                 <label style={styles.label}>
//                   POLICY_NO:
//                 </label>
//                 <select 
//                   style={styles.select}
//                   value={selectedPolicy}
//                   onChange={(e) => handlePolicyChange(e.target.value)}
//                 >
//                   {policyOptions.map(option => (
//                     <option key={option} value={option}>{option}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {currentRow && (
//           <>
//             <div 
//               style={getCardStyle('profile')}
//               onMouseEnter={() => setHoveredCard('profile')}
//               onMouseLeave={() => setHoveredCard(null)}
//             >
//               <div style={styles.cardHeader}>
//                 <div style={styles.terminalPrompt}> CUSTOMER_PROFILE.DAT</div>
//                 <span style={styles.sectionTitle}>
//                   CUSTOMER DATA MATRIX
//                 </span>
//               </div>
//               <div style={styles.cardContent}>
//                 <p style={styles.sectionSubtitle}>
//                   COMPREHENSIVE CUSTOMER RECORD ANALYSIS
//                 </p>
//                 <div style={styles.statsGrid}>
//                   <div 
//                     style={getStatCardStyle('basic')}
//                     onMouseEnter={() => setHoveredStat('basic')}
//                     onMouseLeave={() => setHoveredStat(null)}
//                   >
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>POLICY_NO:</span>
//                       <span style={styles.statValue}>{currentRow["policy no"]}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>CUST_ID:</span>
//                       <span style={styles.statValue}>{currentRow.customerid}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>BIZ_TYPE:</span>
//                       <span style={styles.statValue}>{currentRow.biztype}</span>
//                     </div>
//                     <div style={{...styles.statRow, ...styles.statRowLast}}>
//                       <span style={styles.statLabel}>CHANNEL:</span>
//                       <span style={styles.statValue}>{currentRow["tie up"]}</span>
//                     </div>
//                   </div>

//                   <div 
//                     style={getStatCardStyle('location')}
//                     onMouseEnter={() => setHoveredStat('location')}
//                     onMouseLeave={() => setHoveredStat(null)}
//                   >
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>ZONE:</span>
//                       <span style={styles.statValue}>{currentRow["Cleaned Zone 2"]}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>STATE:</span>
//                       <span style={styles.statValue}>{currentRow["Cleaned State2"]}</span>
//                     </div>
//                     <div style={{...styles.statRow, ...styles.statRowLast}}>
//                       <span style={styles.statLabel}>BRANCH:</span>
//                       <span style={styles.statValue}>{currentRow["Cleaned Branch Name 2"]}</span>
//                     </div>
//                   </div>

//                   <div 
//                     style={getStatCardStyle('vehicle')}
//                     onMouseEnter={() => setHoveredStat('vehicle')}
//                     onMouseLeave={() => setHoveredStat(null)}
//                   >
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>MAKE:</span>
//                       <span style={styles.statValue}>{currentRow.make_clean}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>MODEL:</span>
//                       <span style={styles.statValue}>{currentRow.model_clean}</span>
//                     </div>
//                     <div style={{...styles.statRow, ...styles.statRowLast}}>
//                       <span style={styles.statLabel}>VARIANT:</span>
//                       <span style={styles.statValue}>{currentRow.variant}</span>
//                     </div>
//                   </div>

//                   <div 
//                     style={getStatCardStyle('financial')}
//                     onMouseEnter={() => setHoveredStat('financial')}
//                     onMouseLeave={() => setHoveredStat(null)}
//                   >
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>OD_PREM:</span>
//                       <span style={styles.statValue}>₹{currentRow["total od premium"].toLocaleString()}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>TP_PREM:</span>
//                       <span style={styles.statValue}>₹{currentRow["total tp premium"].toLocaleString()}</span>
//                     </div>
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>ADDON:</span>
//                       <span style={styles.statValue}>₹{currentRow["before gst add-on gwp"].toLocaleString()}</span>
//                     </div>
//                     <div style={{...styles.statRow, ...styles.statRowLast}}>
//                       <span style={styles.statLabel}>IDV:</span>
//                       <span style={styles.statValue}>₹{currentRow["vehicle idv"].toLocaleString()}</span>
//                     </div>
//                   </div>

//                   <div 
//                     style={getStatCardStyle('benefits')}
//                     onMouseEnter={() => setHoveredStat('benefits')}
//                     onMouseLeave={() => setHoveredStat(null)}
//                   >
//                     <div style={styles.statRow}>
//                       <span style={styles.statLabel}>DISCOUNT:</span>
//                       <span style={styles.statValue}>{currentRow["applicable discount with ncb"]}%</span>
//                     </div>
//                     <div style={{...styles.statRow, ...styles.statRowLast}}>
//                       <span style={styles.statLabel}>NCB:</span>
//                       <span style={styles.statValue}>{currentRow["ncb % previous year"]}%</span>
//                     </div>
//                   </div>

//                   <div style={{...getStatCardStyle('reasons'), ...styles.specialCard}}>
//                     <div style={{...styles.statRow, ...styles.statRowLast, flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
//                       <span style={styles.statLabel}>RISK_FACTORS:</span>
//                       <span style={styles.statValue}>{currentRow["Top 3 Reasons"]}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {(() => {
//               const paramKeys = getAdjustableParameters(currentRow["Top 3 Reasons"]);
//               return paramKeys.length > 0 && (
//                 <div 
//                   style={getCardStyle('adjust')}
//                   onMouseEnter={() => setHoveredCard('adjust')}
//                   onMouseLeave={() => setHoveredCard(null)}
//                 >
//                   <div style={styles.cardHeader}>
//                     <div style={styles.terminalPrompt}> PARAMETER_CONTROL.SYS</div>
//                     <span style={styles.sectionTitle}>
//                       RETENTION PARAMETER MATRIX
//                     </span>
//                   </div>
//                   <div style={styles.cardContent}>
//                     <p style={styles.sectionSubtitle}>
//                       ADJUST VALUES TO SIMULATE RETENTION STRATEGIES
//                     </p>
//                     <div style={styles.sliderContainer}>
//                       {paramKeys.map(param => {
//                         const originalValue = currentRow[paramToColumn[param]];
//                         const currentValue = adjustedParams[param] || originalValue;
//                         const range = parameterRanges[param];
                        
//                         const formatValue = (val) => {
//                           if (param === 'discount' || param === 'ncb') return `${val.toFixed(1)}%`;
//                           return `₹${val.toLocaleString()}`;
//                         };

//                         return (
//                           <div key={param} style={styles.sliderGroup}>
//                             <div style={styles.sliderHeader}>
//                               <span style={styles.sliderLabel}>
//                                 {colTitleMap[param]}
//                               </span>
//                               <span style={styles.sliderValue}>
//                                 CURRENT: {formatValue(currentValue)}
//                                 <div style={styles.sliderOriginal}>
//                                   ORIGINAL: {formatValue(originalValue)}
//                                 </div>
//                               </span>
//                             </div>
//                             <input
//                               type="range"
//                               min={range.min}
//                               max={range.max}
//                               step={param === 'discount' || param === 'ncb' ? 0.5 : 100}
//                               value={currentValue}
//                               onChange={(e) => {
//                                 const newValue = parseFloat(e.target.value);
//                                 setAdjustedParams(prev => ({
//                                   ...prev,
//                                   [param]: newValue
//                                 }));
//                               }}
//                               style={{
//                                 ...styles.slider,
//                                 background: `linear-gradient(to right, #ff8a4c 0%, #ff8a4c ${((currentValue - range.min) / (range.max - range.min)) * 100}%, #1a1a0f ${((currentValue - range.min) / (range.max - range.min)) * 100}%, #1a1a0f 100%)`
//                               }}
//                             />
//                           </div>
//                         );
//                       })}
                      
//                       <button
//                         style={getButtonStyle()}
//                         onMouseEnter={() => setHoveredButton(true)}
//                         onMouseLeave={() => setHoveredButton(false)}
//                         onClick={resetParameters}
//                       >
//                         RESET ALL PARAMETERS
//                       </button>

//                       {Object.keys(adjustedParams).length > 0 && (
//                         <div style={styles.impactSummary}>
//                           <div style={styles.impactTitle}>SYSTEM STATUS</div>
//                           <div style={styles.impactText}>
//                             PARAMETER MODIFICATIONS ACTIVE. ANALYZING RETENTION IMPACT...
//                             CHURN PROBABILITY CALCULATION IN PROGRESS.
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })()}

//             <div 
//               style={getCardStyle('results')}
//               onMouseEnter={() => setHoveredCard('results')}
//               onMouseLeave={() => setHoveredCard(null)}
//             >
//               <div style={styles.cardHeader}>
//                 <div style={styles.terminalPrompt}> CHURN_ANALYSIS.EXE</div>
//                 <span style={styles.sectionTitle}>
//                   RISK ASSESSMENT MATRIX
//                 </span>
//               </div>
//               <div style={styles.cardContent}>
//                 <p style={styles.sectionSubtitle}>
//                   REAL-TIME CHURN PROBABILITY COMPUTATION
//                 </p>
//                 <div style={styles.metersContainer}>
//                   <AnalogMeter 
//                     value={baseline}
//                     title="BASELINE RISK"
//                     isBaseline={true}
//                   />
//                   <AnalogMeter 
//                     value={updated}
//                     title="ADJUSTED RISK"
//                     delta={updated - baseline}
//                   />
//                 </div>
                
//                 {Object.keys(adjustedParams).length > 0 && (
//                   <div style={styles.impactSummary}>
//                     <div style={styles.impactTitle}>RETENTION IMPACT ANALYSIS</div>
//                     <div style={styles.impactText}>
//                       {updated < baseline ? (
//                         `POSITIVE IMPACT DETECTED: CHURN RISK REDUCED BY ${(baseline - updated).toFixed(1)} POINTS. 
//                         RETENTION STRATEGIES SHOWING FAVORABLE RESULTS. RECOMMEND IMPLEMENTATION.`
//                       ) : updated > baseline ? (
//                         `WARNING: CHURN RISK INCREASED BY ${(updated - baseline).toFixed(1)} POINTS. 
//                         CURRENT PARAMETERS COUNTERPRODUCTIVE. SUGGEST ALTERNATIVE APPROACH.`
//                       ) : (
//                         `STATUS: NO CHANGE IN RISK LEVEL. PARAMETERS NEUTRAL. 
//                         RECOMMEND EXPLORING DIFFERENT VALUE COMBINATIONS.`
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 <div style={{
//                   ...styles.impactSummary, 
//                   borderColor: baseline > 70 ? '#ff6b4c' : baseline > 40 ? '#ffcd66' : '#4cff6b',
//                   marginTop: '20px'
//                 }}>
//                   <div style={styles.impactTitle}>RECOMMENDED ACTION PROTOCOL</div>
//                   <div style={styles.impactText}>
//                     {baseline > 70 ? (
//                       "ALERT: HIGH-RISK CUSTOMER DETECTED. INITIATE IMMEDIATE RETENTION PROTOCOL. " +
//                       "DEPLOY PREMIUM DISCOUNTS, PERSONAL ACCOUNT MANAGER, AND PRIORITY SUPPORT CHANNELS."
//                     ) : baseline > 40 ? (
//                       "CAUTION: MEDIUM-RISK CUSTOMER IDENTIFIED. IMPLEMENT PROACTIVE RETENTION MEASURES. " +
//                       "SCHEDULE POLICY REVIEW, OFFER LOYALTY BENEFITS, AND CONDUCT SATISFACTION SURVEY."
//                     ) : (
//                       "STATUS: LOW-RISK CUSTOMER CLASSIFICATION. MAINTAIN STANDARD SERVICE LEVEL. " +
//                       "CONTINUE REGULAR TOUCHPOINTS AND VALUE-ADDED SERVICE OFFERINGS."
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}

//         {!currentRow && (
//           <div style={styles.card}>
//             <div style={styles.cardContent}>
//               <div style={{
//                 textAlign: 'center',
//                 padding: '80px 20px',
//                 backgroundColor: '#2a2a1a',
//                 border: '2px dashed #ff8a4c',
//                 margin: '20px 0'
//               }}>
//                 <div style={styles.terminalPrompt}> SYSTEM_READY.STATUS</div>
//                 <div style={{
//                   fontSize: '48px', 
//                   marginBottom: '24px',
//                   color: '#ff8a4c',
//                   fontFamily: '"Orbitron", "Courier New", monospace',
//                   textShadow: '0 0 10px #ff8a4c'
//                 }}>◉</div>
//                 <h3 style={{
//                   fontSize: '24px', 
//                   fontWeight: '700', 
//                   marginBottom: '16px', 
//                   color: '#ffcd66',
//                   textTransform: 'uppercase',
//                   letterSpacing: '2px',
//                   fontFamily: '"Orbitron", "Courier New", monospace'
//                 }}>
//                   AWAITING USER INPUT
//                 </h3>
//                 <p style={{
//                   fontSize: '14px', 
//                   maxWidth: '600px', 
//                   margin: '0 auto',
//                   color: '#b8b8a8',
//                   lineHeight: '1.6',
//                   textTransform: 'uppercase',
//                   letterSpacing: '1px',
//                   fontFamily: '"Courier New", monospace'
//                 }}>
//                   SELECT CUSTOMER_ID OR POLICY_NO FROM DROPDOWN MENUS TO INITIATE 
//                   CHURN RISK ANALYSIS SEQUENCE. SYSTEM READY FOR DATA PROCESSING.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChurnSimulator;