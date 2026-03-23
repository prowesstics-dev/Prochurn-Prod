import React, { useState, useRef, useEffect } from "react";
  // import styles from "./ChatBots.module.css";
  import ReactMarkdown from "react-markdown";
  import remarkGfm from "remark-gfm";
  import Highcharts from "highcharts";
  import HighchartsReact from "highcharts-react-official";
  import ChartRenderer from "./ChartRenderer";
  import { FiMaximize2, FiMinimize2, FiSend, FiMic } from "react-icons/fi";
  import videoFile from '../assets/vecteezy_animated-celestial-blue-waves-abstract-artwork-featuring_55003794.mp4';
  import Spinner from "./Spinner";
  import { FORMAT_CONFIG, formatPercentage } from '../config/formatConfig';
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>


  const API_BASE_URL = import.meta.env.VITE_API_URL;

 
const TOKENS = {
  brand: {
    indigo500: '#4f46e5',
    indigo600: '#4338ca',
    cyan500:   '#06b6d4',
    violet500: '#7c3aed'
  },
  text: {
    primary:   '#ffffff',
    secondary: '#cbd5e1',
    muted:     '#94a3b8',
    dark:      '#111827'
  },
  surface: {
    page:        '#0b1220',
    panel:       'rgba(255,255,255,0.08)',
    bubble:      ' #3b3863ff',
    bubbleUser:  'linear-gradient(135deg, #38daf0ff, #3b3863ff)',
    input:       'rgba(255,255,255,0.16)',
    tableHeader: 'rgba(30,41,59,0.88)',
    tableHover:  'rgba(25, 26, 82, 0.22)',
  },
  border: {
    soft:  'rgba(255,255,255,0.18)',
    hard:  'rgba(255,255,255,0.28)',
    light: '#e5e7eb',
    table: '#475569'
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 10px 36px rgba(0,0,0,0.38)'
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  accent: { yellow: '#facc15', red: '#ef4444', link: '#60a5fa' },
  warn:   { bg: '#fef9c3', border: '#fde68a', text: '#92400e' }
};

/* ---------------- STYLES ---------------- */
const styles = {
  /* ---------- Markdown table (light) ---------- */
  tableWrapper: {
    overflowX: 'auto',
    margin: '0.75rem 0',
    borderRadius: '0.75rem',
    border: `1px solid ${TOKENS.border.light}`,
    boxShadow: TOKENS.shadow.sm,
    background: '#fff'
  },
  markdownTable: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { backgroundColor: '#c01bd6ff' },
  tableHeader: {
    padding: '0.75rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    borderBottom: '1px solid #e5e7eb'
  },
  tableBody: { backgroundColor: '#b4eafaff' },
  tableRow: { transition: 'background-color 0.2s ease' },
  tableRowHover: { backgroundColor: '#abc7ffff' },
  tableCell: {
    padding: '1rem',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
    color: TOKENS.text.dark,
    borderBottom: '1px solid #eee'
  },

  resultTableRow: {
  transition: 'background-color 0.25s ease',
  cursor: 'default',
},

resultTableRowHover: {
  // backgroundColor: TOKENS.surface.tableHover,  // soft indigo tint
   backgroundColor: 'rgba(6,182,212,0.08)',
},

buttonDisabled: {
  opacity: 0.6,
  cursor: 'not-allowed',
  transform: 'none',
  boxShadow: '0 2px 8px rgba(102,126,234,0.2)'
},

// Add this new style here:
toggleButton: {
  padding: "8px 16px",
  borderRadius: "8px",
  border: `1px solid ${TOKENS.border.soft}`,
  background: "rgba(8, 179, 185, 0.93)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: TOKENS.text.primary,
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
},

ratingContainer: {
  display: "flex",
  alignItems: "center",
  marginTop: "10px",
  gap: "8px",
},

  /* ---------- Notices / links ---------- */
  warningBox: {
    backgroundColor: TOKENS.warn.bg,
    border: `1px solid ${TOKENS.warn.border}`,
    color: TOKENS.warn.text,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    marginBottom: '1rem'
  },
  downloadLink: {
    color: TOKENS.accent.link,
    textDecoration: 'underline',
    fontWeight: 600,
    marginLeft: '0.25rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none'
  },

  /* ---------- Header / container ---------- */
  container: {
    position: 'relative',
    padding: '2.2rem',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    marginTsop: '-10px',            // kept as-is (typo preserved)
    marginTop: '30px',
    padding : '30px 20px 20px 20px',
    borderRadius: '16px',
    overflow: 'hidden',
    isolation: 'isolate',
    background: `
      linear-gradient(180deg, rgba(6,11,25,1) 0%, rgba(10,16,34,1) 45%, rgba(15,23,42,1) 100%),
      radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,0.28), transparent 60%),
      radial-gradient(820px 360px at 92% 0%, rgba(6,182,212,0.22), transparent 60%),
      radial-gradient(760px 320px at 50% 110%, rgba(124,58,237,0.18), transparent 60%),
      ${TOKENS.surface.page}
    `,
    zIndex: 1,
    height: '90%',
    color: TOKENS.text.primary
  },
  containerVideo: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -10,
    pointerEvents: 'none'
  },
  heading: {
    fontSize: '2.4rem',
    fontWeight: 800,
    textAlign: 'center',
    background: 'linear-gradient(to right, #60a5fa, #22d3ee, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    marginTop: '10px',
    letterSpacing: '-0.02em'
  },
  headingGlow: {
    textShadow:
      '0 0 14px rgba(96,165,250,.45), 0 0 28px rgba(34,211,238,.35)'
  },
  subheading: {
    textAlign: 'center',
    fontSize: '0.98rem',
    color: TOKENS.text.secondary,
    marginTop: '-10px'
  },

  /* ---------- Chat area ---------- */
  chatBox: {
    position: 'relative',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: '14px',
    padding: '1.25rem',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'visible',                 // let glow breathe
    marginTop: '0',
    marginBottom: '1rem',
    color: TOKENS.text.primary,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    boxShadow: TOKENS.shadow.md,
    border: `1px solid ${TOKENS.border.soft}`
  },
  cardGlow: {
    boxShadow: '0 12px 42px rgba(0,0,0,.45), 0 0 32px rgba(99,102,241,.18)'
  },

  userMsg: {
    alignSelf: 'flex-end',
    background: TOKENS.surface.bubbleUser,
    padding: '0.85rem 0.95rem',
    borderRadius: '12px 12px 0 12px',
    maxWidth: '80%',
    transition: 'box-shadow .25s ease, transform .2s ease'
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.surface.bubble,
    padding: '0.85rem 0.95rem',
    borderRadius: '12px 12px 12px 0',
    maxWidth: '80%',
    border: `1px solid ${TOKENS.border.soft}`,
    transition: 'box-shadow .25s ease, transform .2s ease'
  },

  /* ---------- Bubble glows ---------- */
  userGlow: {
    boxShadow:
      '0 10px 26px rgba(19, 193, 206, 0.45), 0 0 32px rgba(79,70,229,.55)',
    outline: '1px solid rgba(32, 212, 212, 0.35)',
    filter: 'drop-shadow(0 0 20px rgba(79,70,229,.45))'
  },
  botGlow: {
    boxShadow:
      '0 10px 26px rgba(102, 216, 236, 0.38), 0 0 32px rgba(6,182,212,.52)',
    outline: '1px solid rgba(6,182,212,.32)',
    filter: 'drop-shadow(0 0 20px rgba(6,182,212,.42))'
  },

  /* ---------- Composer ---------- */
  inputBox: {
    display: 'flex',
    width : '92%',
    gap: '0.75rem',
    alignItems: 'center',
    position: 'relative',
     zIndex: 20,
    background: TOKENS.surface.input,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '0.75rem',
    borderRadius: '20px',
    border: `1px solid ${TOKENS.border.hard}`,
    boxShadow: '0 10px 28px rgba(0,0,0,.35)'
  },
  input: {
    flex: 1,
    padding: '0.85rem 1.1rem',
    borderRadius: '16px',
    border: 'none',
    background: 'rgba(255,255,255,0.97)',
    color: TOKENS.text.dark,
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, Arial, sans-serif'
  },
  inputFocused: {
    background: '#ffffff',
    boxShadow:
      'inset 0 2px 4px rgba(0,0,0,0.08), 0 0 0 3px rgba(79,70,229,0.28), 0 0 24px rgba(99,102,241,.35)',
    transform: 'translateY(-1px)'
  },
  button: {
    padding: '0.8rem 1.4rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    zIndex: 21,
    pointerEvents: 'auto',
    fontSize: '1rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 10px 26px rgba(102,126,234,0.45)',
    minWidth: '110px',
    justifyContent: 'center'
  },
  buttonHover: {
    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 14px 32px rgba(102,126,234,0.6)'
  },
  buttonActive: {
    transform: 'translateY(0)',
    boxShadow: '0 6px 16px rgba(102,126,234,0.4)'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: '0 2px 8px rgba(102,126,234,0.2)'
  },

   ratingContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
    gap: "8px",
  },
  ratingText: {
    marginRight: "8px",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#d1f531ff",
  },
  ratingButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.2s ease",
  },
  // ✅ Special styles when selected
  ratingButtonYes: {
    background: "#10b981",  // green
    borderColor: "#059669",
    color: "#fff",
  },
  ratingButtonNo: {
    background: "#ef4444",  // red
    borderColor: "#b91c1c",
    color: "#fff",
  },
  ratingButtonSelected: {
    fontWeight: "bold",
    boxShadow: "0 0 6px rgba(0,0,0,0.2)",
  },

  /* ---------- Result table (dark) ---------- */
  resultTableWrapper: {
  marginTop: '1.25rem',
  padding: '1rem',
  borderRadius: '12px',
  background: 'transparent',              // ← Change to transparent
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: TOKENS.shadow.md,
  // overflowX: 'auto',
  overflow: 'hidden',
  border: `1px solid ${TOKENS.border.soft}`
},


resultTableWrapper: {
  width: "100%",
  // overflowX: "auto",
  overflow: 'hidden',
  marginTop: "12px",
  borderRadius: "8px",
  border: "1px solid #94a3b8",
  backgroundColor: "#1e293b",
},
  resultTable: {
    width: '100%',
    borderCollapse: 'collapse',
    color: TOKENS.text.primary,
    fontSize: '0.9rem'
  },
  resultTableHeader: {
  backgroundColor: TOKENS.surface.tableHeader,
  color: TOKENS.accent.yellow,
  padding: '0.65rem',
  border: `1px solid ${TOKENS.border.table}`,
  textAlign: 'center',        // ← Change from 'left' to 'center'
  fontWeight: 700,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap'
},


  resultTableCell: {
    padding: '0.6rem',
    border: `1px solid ${TOKENS.border.table}`,
    textAlign: "center",       // <--- center text horizontally
    verticalAlign: "middle",
  },
  expandNote: {
    padding: '0.5rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    color: TOKENS.text.muted
  },

  /* ---------- Chart section ---------- */
  chartSection: { marginTop: '1rem', marginBottom: '0.5rem' },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: TOKENS.text.primary,
    marginBottom: '10px',
    textShadow: '0 0 14px rgba(250,204,21,.35)'
  },

  /* ---------- Collapse controls ---------- */
  collapseButton: { textAlign: 'right', marginTop: '0.5rem' },
  collapseButtonLink: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    color: TOKENS.accent.red,
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  // recommendationBox: {
  //   background: "#1c1f36",
  //   color: "#fff",
  //   padding: "1rem",
  //   borderRadius: "0.75rem",
  //   marginBottom: "1rem",
  //   boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  // },
  // recommendationHeader: {
  //   fontWeight: "bold",
  //   fontSize: "1.1rem",
  //   marginBottom: "0.5rem",
  //   color: "#ffd43b"
  // },
  recoList: {
    margin: 0,
    padding: 0,
    listStyle: "disc",
  },
  followUpBtn: {
    marginTop: "0.75rem",
    padding: "0.5rem 1rem",
    background: "#00bcd4",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "600",
  },
  // Suggested Questions styles
   suggestedBox: {
    background: "#2c2f48",
    color: "#fff",
    padding: "1rem",
    borderRadius: "0.75rem",
    marginTop: "1rem",  // ensures it appears just under recommendations
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)"
  },
  suggestedHeader: {
    fontWeight: "bold",
    fontSize: "1.05rem",
    marginBottom: "0.5rem",
    color: "#4dd0e1"
  },
  suggestedList: {
    margin: 0,
    padding: 0,
    listStyle: "circle"
  },
  suggestedItem: {
    cursor: "pointer",
    padding: "0.25rem 0",
    transition: "color 0.2s",
  },

  /* ---------- Recommendation panel ---------- */
  recommendationBox: {
    marginTop: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: TOKENS.text.primary,
    borderLeft: `4px solid ${TOKENS.accent.yellow}`,
    boxShadow: TOKENS.shadow.md,
    fontSize: '0.95rem'
  },

 
  recommendationHeader: { fontWeight: 600, marginBottom: '0.5rem', color: '#fde047' },
  recommendationText: { lineHeight: 1.5 }
};



// --- Narrative styles (add near styles.*) ---
styles.narrativeCard = {
  marginTop: '0.5rem',
  padding: '1rem 1.1rem',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.10)',
  border: `1px solid ${TOKENS.border.soft}`,
  boxShadow: TOKENS.shadow.md,
};
styles.narrativeOpener = {
  fontWeight: 700,
  marginBottom: '0.35rem',
  color: TOKENS.text.primary,
  whiteSpace: 'pre-line',     // ← shows the 2–3 lines
  lineHeight: 1.35
};
styles.narrativeList = {
  margin: '0.3rem 0 0.6rem 1.1rem',
  paddingLeft: '0.6rem',
  lineHeight: 1.55
};
styles.narrativeLabel = { fontWeight: 600, color: TOKENS.accent.yellow };
styles.nextStep = { marginTop: '0.25rem', color: TOKENS.text.secondary };
styles.statusPanel = {
  marginTop: '0.5rem',
  padding: '0.75rem 0.9rem',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.08)',
  border: `1px solid ${TOKENS.border.soft}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};
styles.statusLine = { display: 'flex', alignItems: 'center', gap: 10 };
styles.statusText = { fontWeight: 700 };
styles.statusSub  = { fontSize: '0.9rem', color: TOKENS.text.secondary };


styles.followUpBtn = {
  marginTop: '0.5rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  textAlign: 'left',
  border: `1px dashed ${TOKENS.border.hard}`,
  background: 'rgba(255,255,255,0.06)',
  color: TOKENS.text.secondary,
  borderRadius: '10px',
  cursor: 'pointer'
};

styles.progressBanner = {
  position: 'sticky',   // stays visible at the top of the bubble
  top: 0,
  zIndex: 5,
  marginBottom: '0.6rem',
  padding: '0.6rem 0.8rem',
  borderRadius: '10px',
  border: `1px solid ${TOKENS.border.soft}`,
  background: 'rgba(255,255,255,0.10)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};



// --- Recommendation Tabs styles (append to existing styles) ---
styles.tabsCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  marginTop: 12,
  overflow: "hidden",
};
styles.tabsHeader = {
  display: "flex",
  gap: 8,
  padding: "8px 8px 0 8px",
};
styles.tabBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "transparent",
  border: "1px solid transparent",
  cursor: "pointer",
  color: "inherit",
  fontWeight: 600,
  opacity: 0.75,
};
styles.tabBtnActive = {
  background: "rgba(99,102,241,0.15)",
  border: "1px solid rgba(99,102,241,0.35)",
  opacity: 1,
};
styles.tabPanel = { padding: "10px 14px 14px" };
styles.recoList = {
  paddingLeft: "1.25rem",
  margin: 0,
  display: "grid",
  gap: 6,
};
styles.mutedText = { opacity: 0.7, fontStyle: "italic" };
styles.nextStepRow = { display: "flex", alignItems: "center", gap: 8 };

// Add this once at the top level of your component file (e.g., Chat.jsx)
const globalAnimations = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

if (typeof document !== "undefined" && !document.getElementById("globalAnimations")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "globalAnimations";
  styleSheet.innerHTML = globalAnimations;
  document.head.appendChild(styleSheet);
}




  // const styles = {
  //   tableWrapper: {
  //     overflowX: 'auto',
  //     margin: '0.5rem 0',
  //     borderRadius: '0.5rem',
  //     border: '1px solid #e5e7eb',
  //     boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  //   },
  //   markdownTable: {
  //     width: '100%',
  //     borderCollapse: 'collapse',
  //   },
  //   tableHead: {
  //     backgroundColor: '#f9fafb',
  //   },
  //   tableHeader: {
  //     padding: '0.75rem',
  //     textAlign: 'left',
  //     fontSize: '0.75rem',
  //     fontWeight: 600,
  //     color: '#6b7280',
  //     textTransform: 'uppercase',
  //   },
  //   tableBody: {
  //     backgroundColor: '#ffffff',
  //   },
  //   tableRow: {
  //     transition: 'background-color 0.3s',
  //   },
  //   tableRowHover: {
  //     backgroundColor: '#f9fafb',
  //   },
  //   tableCell: {
  //     padding: '1rem',
  //     whiteSpace: 'nowrap',
  //     fontSize: '0.875rem',
  //     color: '#111827',
  //   },
  //   warningBox: {
  //     backgroundColor: '#fef9c3',
  //     border: '1px solid #fde68a',
  //     color: '#92400e',
  //     padding: '0.75rem 1rem',
  //     borderRadius: '0.5rem',
  //     fontSize: '0.875rem',
  //     marginBottom: '1rem',
  //   },
  //   downloadLink: {
  //     color: '#2563eb',
  //     textDecoration: 'underline',
  //     fontWeight: 500,
  //     marginLeft: '0.25rem',
  //     cursor: 'pointer',
  //     background: 'none',
  //     border: 'none',
  //   },
  //   resultTableWrapper: {
  //     marginTop: '1rem',
  //   },
  //   resultTable: {
  //     width: '100%',
  //     borderCollapse: 'collapse',
  //     border: '1px solid #ddd',
  //   },
  //   resultTableCell: {
  //     padding: '0.75rem',
  //     border: '1px solid #ddd',
  //     fontSize: '0.875rem',
  //     textAlign: 'left',
  //   },
  //   expandNote: {
  //     padding: '0.5rem',
  //     fontSize: '0.875rem',
  //     textAlign: 'center',
  //     color: '#6b7280',
  //   },
  //   collapseButton: {
  //     textAlign: 'right',
  //     marginTop: '0.5rem',
  //   },
  //   collapseButtonLink: {
  //     fontWeight: 'bold',
  //     textDecoration: 'underline',
  //     color: '#ef4444',
  //     background: 'none',
  //     border: 'none',
  //     cursor: 'pointer',
  //   },
  //   chartSection: {
  //     marginTop: '1rem',
  //     marginBottom: '0.5rem',
  //   },
  //   chartTitle: {
  //     fontSize: '14px',
  //     fontWeight: 'bold',
  //     color: 'white',
  //     marginBottom: '10px',
  //   },

  //   container: {
  //     position: 'relative',
  //     padding: '2.2rem',
  //     fontFamily: 'sans-serif',
  //     // minHeight: '100vh',
  //     display: 'flex',
  //     flexDirection: 'column',
  //     marginTsop: '-10px',
  //     borderRadius: '16px',
  //     overflow: 'hidden',
  //     background: 'radial-gradient(circle at 10% 20%,   #3b568fff, #2c518bff, #3b568fff)',
  //     zIndex: 1,
  //     height: '90%',
  //     color: 'white',
  //   },
  //   containerVideo: {
  //     position: 'absolute',
  //     top: 0,
  //     left: 0,
  //     width: '100%',
  //     height: '100vh',
  //     objectFit: 'cover',
  //     zIndex: -10,
  //     pointerEvents: 'none',
  //   },
  //   heading: {  
  //     fontSize: '2.2rem',
  //     fontWeight: 800,
  //     textAlign: 'center',
  //     // background: 'linear-gradient(to right, #cccf25, #89b906, #077e60ff)',
  //     background: 'linear-gradient(to right, #4968afff, #0796ddff, #05c4e6ff)',
  //     WebkitBackgroundClip: 'text',
  //     WebkitTextFillColor: 'transparent',
  //     backgroundClip: 'text',
  //     textFillColor: 'transparent',
  //     marginTop: '-10px',
  //   },
  //   subheading: {
  //     textAlign: 'center',
  //     fontSize: '0.95rem',
  //     color: '#e1f0e5ff',
  //     marginTop: '-10px',
  //   },
  //   chatBox: {
  //     background: 'rgba(255, 255, 255, 0.1)',
  //     backdropFilter: 'blur(12px)',
  //     WebkitBackdropFilter: 'blur(12px)',
  //     borderRadius: '12px',
  //     padding: '1rem',
  //     height: '100%',
  //     overflowY: 'auto',
  //     marginTop: '0px',
  //     marginBottom: '1rem',
  //     color: 'white',
  //     display: 'flex',
  //     flexDirection: 'column',
  //     gap: '0.75rem',
  //     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
  //     border: '1px solid rgba(255, 255, 255, 0.2)',
  //   },
  //   userMsg: {
  //     alignSelf: 'flex-end',
  //     backgroundColor: '#4f46e5',
  //     padding: '0.75rem',
  //     borderRadius: '10px 10px 0 10px',
  //     maxWidth: '80%',
  //   },
  //   botMsg: {
  //     alignSelf: 'flex-start',
  //     backgroundColor: '#2d2f4a',
  //     padding: '0.75rem',
  //     borderRadius: '10px 10px 10px 0',
  //     maxWidth: '80%',
  //   },
  //   inputBox: {
  //     display: 'flex',
  //     gap: '0.75rem',
  //     width : '91%',
  //     alignItems: 'center',
  //     position: 'relative',
  //     background: 'rgba(255, 255, 255, 0.15)',
  //     backdropFilter: 'blur(20px)',
  //     WebkitBackdropFilter: 'blur(20px)',
  //     padding: '0.75rem',
  //     borderRadius: '20px',
  //     border: '1px solid rgba(255, 255, 255, 0.3)',
  //     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  //   },
  //   input: {
  //     flex: 1,
  //     padding: '0.75rem 1.25rem',
  //     borderRadius: '16px',
  //     border: 'none',
  //     background: 'rgba(255, 255, 255, 0.9)',
  //     color: '#1a1a1a',
  //     fontSize: '1rem',
  //     outline: 'none',
  //     transition: 'all 0.3s ease',
  //     boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  //     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  //   },
  //   inputFocused: {
  //     background: 'rgba(255, 255, 255, 0.95)',
  //     boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(79, 70, 229, 0.2)',
  //     transform: 'translateY(-1px)',
  //   },
  //   button: {
  //     padding: '0.75rem 1.5rem',
  //     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  //     color: 'white',
  //     border: 'none',
  //     borderRadius: '16px',
  //     cursor: 'pointer',
  //     fontSize: '1rem',
  //     fontWeight: 600,
  //     display: 'flex',
  //     alignItems: 'center',
  //     gap: '0.5rem',
  //     transition: 'all 0.3s ease',
  //     boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  //     minWidth: '100px',
  //     justifyContent: 'center',
  //   },
  //   buttonHover: {
  //     background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
  //     transform: 'translateY(-2px)',
  //     boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
  //   },
  //   buttonActive: {
  //     transform: 'translateY(0)',
  //     boxShadow: '0 2px 10px rgba(102, 126, 234, 0.4)',
  //   },
  //   buttonDisabled: {
  //     opacity: 0.6,
  //     cursor: 'not-allowed',
  //     transform: 'none',
  //     boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
  //   },
  //   warningBox: {
  //     backgroundColor: '#fef9c3',
  //     border: '1px solid #fde68a',
  //     color: '#92400e',
  //     padding: '0.75rem 1rem',
  //     borderRadius: '0.5rem',
  //     fontSize: '0.875rem',
  //     marginBottom: '1rem',
  //   },
  //   downloadLink: {
  //     color: '#2563eb',
  //     textDecoration: 'underline',
  //     fontWeight: 500,
  //     marginLeft: '0.25rem',
  //     cursor: 'pointer',
  //     background: 'none',
  //     border: 'none',
  //   },
  //   resultTableWrapper: {
  //     marginTop: '1.25rem',
  //     padding: '1rem',
  //     borderRadius: '12px',
  //     background: 'rgba(255, 255, 255, 0.05)',
  //     backdropFilter: 'blur(10px)',
  //     WebkitBackdropFilter: 'blur(10px)',
  //     boxShadow: '0 0 12px rgba(0, 0, 0, 0.2)',
  //     overflowX: 'auto',
  //     border: '1px solid rgba(255, 255, 255, 0.15)',
  //   },
  //   resultTable: {
  //     width: '100%',
  //     borderCollapse: 'collapse',
  //     color: 'white',
  //     fontSize: '0.9rem',
  //   },
  //   resultTableHeader: {
  //     backgroundColor: 'rgba(30, 41, 59, 0.8)',
  //     color: '#facc15',
  //     padding: '0.5rem',
  //     border: '1px solid #4b5563',
  //     textAlign: 'left',
  //   },
  //   resultTableCell: {
  //     padding: '0.5rem',
  //     border: '1px solid #4b5563',
  //   },
  //   expandNote: {
  //     textAlign: 'center',
  //     backgroundColor: '#f9fafb',
  //     color: '#374151',
  //     fontStyle: 'italic',
  //     padding: '0.5rem',
  //   },
  //   chartSection: {
  //     marginTop: '1rem',
  //     marginBottom: '0.5rem',
  //   },
  //   chartTitle: {
  //     fontSize: '14px',
  //     fontWeight: 'bold',
  //     color: 'white',
  //     marginBottom: '10px',
  //   },
  //   collapseButton: {
  //     textAlign: 'right',
  //     marginTop: '0.5rem',
  //   },
  //   collapseButtonLink: {
  //     fontWeight: 'bold',
  //     textDecoration: 'underline',
  //     color: '#ef4444',
  //     background: 'none',
  //     border: 'none',
  //     cursor: 'pointer',
  //   },
  //   recommendationBox: {
  //     marginTop: '1rem',
  //     padding: '1rem 1.25rem',
  //     borderRadius: '12px',
  //     background: 'rgba(255, 255, 255, 0.1)',
  //     backdropFilter: 'blur(8px)',
  //     WebkitBackdropFilter: 'blur(8px)',
  //     color: 'white',
  //     borderLeft: '4px solid #facc15',
  //     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  //     fontSize: '0.95rem',
  //   },
  //   recommendationHeader: {
  //     fontWeight: 600,
  //     marginBottom: '0.5rem',
  //     color: '#fde047',
  //   },
  //   recommendationText: {
  //     lineHeight: 1.5,
  //   },
  // };

 


 

  const formatDateForChat = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === today.toDateString()) return "Today";
    if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
const generateNextMonthQuestion = (question) => {
  const monthsFull = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  const monthsShort = {
    jan: "january", feb: "february", mar: "march", apr: "april",
    may: "may", jun: "june", jul: "july", aug: "august",
    sep: "september", oct: "october", nov: "november", dec: "december"
  };

  // 1) Your existing word-based month detection (unchanged)
  const match = question.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i
  );

  if (match) {
    const normalized = monthsShort[match[0].toLowerCase()] || match[0].toLowerCase();
    const index = monthsFull.indexOf(normalized);
    if (index !== -1) {
      const nextMonth = monthsFull[(index + 1) % 12];
      return question.replace(
        new RegExp(match[0], 'i'),
        nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
      );
    }
  }

  // 2) NEW: contextual numeric month like "month 2", "mon:03", "m=11"
  const ctxNum = question.match(/\b(?:month|mon|m)\s*[:=]?\s*(0?[1-9]|1[0-2])\b/i);
  if (ctxNum) {
    const n = parseInt(ctxNum[1], 10);            // 1..12
    const nextMonth = monthsFull[n % 12];         // 1→Feb, 12→Jan
    return question.replace(
      ctxNum[0],
      nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
    );
  }

  // 3) NEW: bare numeric month if it's the ONLY number in the question (e.g., "1", "02")
  const numbers = question.match(/\b\d+\b/g);
  if (numbers && numbers.length === 1) {
    const n = parseInt(numbers[0], 10);
    if (n >= 1 && n <= 12) {
      const nextMonth = monthsFull[n % 12];
      // replace that exact number (optionally with a leading 0)
      return question.replace(
        new RegExp(`\\b0?${n}\\b`),
        nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
      );
    }
  }

  return null;
};


  // Dataset columns for context-aware suggestions
  const DATASET_COLUMNS = [
    'rto_risk_factor', 'ncb_%_previous_year', 'state_risk_score', 'retention_rate_pct',
    'total_od_premium_max', 'applicable_discount_with_ncb', 'policy_wise_purchase',
    'manufacturer_risk_rate', 'days_between_renewals', 'retention_streak',
    'total_od_premium_mean', 'total_od_premium', 'firstpolicyyear', 'lag_1_tp_premium',
    'total_od_premium_min', 'avg_premium_hist', 'lag_1_ncb', 'age', 'total_tp_premium_max',
    'total_tp_premium_mean', 'total_tp_premium', 'total_tp_premium_min', 'lag_1_premium',
    'previous_year_premium_ratio', 'total_premium_payable', 'total_revenue', 'gst',
    'fuel_type_risk_factor', 'lag_1_od_premium', 'customer_apv', 'segment_risk_score',
    'vehicle_idv', 'policy_tenure', 'number_of_claims', 'approved', 'claim_approval_rate',
    'customer_tenure', 'before_gst_add-on_gwp', 'od_tp_ratio', 'add_on_adoption',
    'clv', 'idv_premium_ratio', 'customer_apf', 'days_gap_prev_end_to_curr_start',
    'customerid', 'claim_happaned/not', 'cleaned_branch_name_2', 'cleaned_chassis_number',
    'cleaned_engine_number', 'cleaned_reg_no', 'cleaned_state2', 'cleaned_zone_2',
    'biztype', 'corrected_name', 'make_clean', 'model_clean', 'product_name',
    'policy_no', 'decline', 'tie_up', 'variant', 'policy_status',
    'policy_start_date_year', 'policy_end_date_year', 'policy_start_date_month',
    'policy_end_date_month', 'policy_start_date_day', 'policy_end_date_day',
    'predicted_status', 'churn_probability', 'clv_category', 'discount_category',
    'churn_category', 'customer_segment', 'not_renewed_reasons', 'main_reason',
    'primary_recommendation', 'additional_offers', 'retention_channel'
  ];

  // Comprehensive suggestion templates organized by topic
  const SUGGESTION_TEMPLATES = {
    churn: [
      'Show churn probability by customer segment',
      'What are the main reasons for not renewing?',
      'Show retention rate by state and zone',
      'Analyze churn patterns by policy tenure',
      'What is the relationship between claims and churn?',
      // 'Show retention streak analysis across segments'
    ],
    premium: [
      'Show average premium by vehicle make',
      'What is the premium trend over years?',
      'Compare OD vs TP premium distribution',
      'Analyze premium variations by customer segment',
      'Show IDV to premium ratio analysis',
      'What factors influence premium pricing most?'
    ],
    claims: [
      'Show claim approval rate by state',
      'What is the relationship between claims and churn?',
      'Show claims distribution by vehicle age',
      'Analyze claim patterns by manufacturer',
      'Show claim frequency vs premium correlation',
      'What are the most common claim scenarios?'
    ],
    customer: [
      // 'Show customer lifetime value by segment',
      'What are the characteristics of high-value customers?',
      'Show customer tenure distribution',
      'Analyze customer acquisition vs retention costs',
      'Show customer segment migration patterns',
      'What drives customer loyalty in insurance?'
    ],
    vehicle: [
      'Show top 10 vehicle makes by policy count',
      'What is the average IDV by vehicle make?',
      'Show vehicle age vs premium relationship',
      'Analyze risk factors by manufacturer',
      'Show fuel type distribution and risk impact',
      'What are the most profitable vehicle segments?'
    ],
    cars: [
      'Show top 10 vehicle makes by policy count',
      'What is the average IDV by vehicle make?',
      'Show vehicle age vs premium relationship',
      'Analyze risk factors by manufacturer',
      'Show fuel type distribution and risk impact',
      'What are the most profitable vehicle segments?'
    ],
    regional: [
      'Show policy distribution by zone',
      'Which state has the highest risk score?',
      'Compare business performance across states',
      'Analyze regional premium variations',
      'Show state-wise retention patterns',
      'What are the regional growth opportunities?'
    ],
    discount: [
      'Show NCB distribution across customers',
      'What is the average discount by customer category?',
      'Show relationship between NCB and retention',
      'Analyze discount effectiveness on renewals',
      'Show applicable discount trends over time',
      'What is the optimal discount strategy?'
    ],
    risk: [
      'Show risk factors by manufacturer',
      'What are the key risk indicators?',
      'Show fuel type risk distribution',
      'Analyze RTO risk factor patterns',
      'Show segment risk score analysis',
      'What predicts high-risk customers?'
    ],
    recommendations: [
      'Show primary recommendations by customer segment',
      'What retention strategies work best?',
      'Show additional offers effectiveness',
      'Analyze recommendation success rates',
      'Show channel effectiveness for retention',
      'What are the most successful retention tactics?'
    ],
    temporal: [
      'Compare policy trends between 2024 and 2025',
      'Show monthly policy distribution',
      'What is the renewal pattern by month?',
      'Analyze seasonal variations in business',
      'Show yearly growth trends',
      'What are the peak business periods?'
    ],
    general: [
      // 'What can you do?',
      // 'Tell me a fun fact about insurance',
      'How can you help with insurance analysis?',
      'What insights can you provide?',
      // 'Show me data overview',
      'What are the key business metrics?'
    ],
    conversational: [
      // 'What is your name?',
      // 'What is your purpose?',
      // 'How do you work?',
      'What services do you provide?',
      'Can you help me with something?',
      // 'Do you have feelings?'
    ],
    fun: [
      // 'Want to hear another fun fact?',
      // 'Show me something surprising in the data',
      // 'What else can you do?',
      // 'Tell me an interesting insight',
      'What would you recommend exploring?',
      // 'Show me the most unusual data pattern'
    ]
  };

  // Enhanced function to generate dynamic suggestions based on conversation context and dataset
  const generateDynamicSuggestions = (messages, activeSource, connectedDbDetails, forceRefresh = false) => {
    const suggestions = [];
    let usedSuggestions = new Set();

    // Get conversation history to avoid repeating suggestions
    if (!forceRefresh && messages && messages.length > 0) {
      messages.forEach(msg => {
        if (msg.role === 'user') {
          usedSuggestions.add(msg.content.toLowerCase().trim());
        }
      });
    }

    const recentMessages = messages.slice(-4);
    const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop();
    const lastAssistantMessage = recentMessages.filter(m => m.role === 'assistant').pop();

    if (!lastUserMessage) {
      // Return default suggestions if no user message
      return SUGGESTION_TEMPLATES.general.slice(0, 6).map(text => ({
        text,
        type: 'general'
      }));
    }

    const userQuestion = lastUserMessage.content.toLowerCase();

    // Month-based suggestions (always include if applicable)
    const nextMonthQuestion = generateNextMonthQuestion(lastUserMessage.content);
    if (nextMonthQuestion && !usedSuggestions.has(nextMonthQuestion.toLowerCase())) {
      suggestions.push({
        text: nextMonthQuestion,
        type: 'month-follow-up'
      });
    }

    // Determine primary topic and get 6 suggestions
    let primaryTopic = null;
    let topicSuggestions = [];

    // Topic detection with priority
    if (userQuestion.includes('churn') || userQuestion.includes('renewal') || userQuestion.includes('retention')) {
      primaryTopic = 'churn';
      topicSuggestions = SUGGESTION_TEMPLATES.churn;
    } else if (userQuestion.includes('premium') || userQuestion.includes('revenue') || userQuestion.includes('idv')) {
      primaryTopic = 'premium';
      topicSuggestions = SUGGESTION_TEMPLATES.premium;
    } else if (userQuestion.includes('claim') || userQuestion.includes('claims') || userQuestion.includes('approval')) {
      primaryTopic = 'claims';
      topicSuggestions = SUGGESTION_TEMPLATES.claims;
    } else if (userQuestion.includes('customer') || userQuestion.includes('segment') || userQuestion.includes('clv')) {
      primaryTopic = 'customer';
      topicSuggestions = SUGGESTION_TEMPLATES.customer;
    } else if (userQuestion.includes('vehicle') || userQuestion.includes('make') || userQuestion.includes('model') || userQuestion.includes('manufacturer')) {
      primaryTopic = 'vehicle';
      topicSuggestions = SUGGESTION_TEMPLATES.vehicle;
    } else if (userQuestion.includes('state') || userQuestion.includes('zone') || userQuestion.includes('region') || userQuestion.includes('rto')) {
      primaryTopic = 'regional';
      topicSuggestions = SUGGESTION_TEMPLATES.regional;
    } else if (userQuestion.includes('discount') || userQuestion.includes('ncb')) {
      primaryTopic = 'discount';
      topicSuggestions = SUGGESTION_TEMPLATES.discount;
    } else if (userQuestion.includes('risk') || userQuestion.includes('score') || userQuestion.includes('factor')) {
      primaryTopic = 'risk';
      topicSuggestions = SUGGESTION_TEMPLATES.risk;
    } else if (userQuestion.includes('recommendation') || userQuestion.includes('strategy') || userQuestion.includes('retention')) {
      primaryTopic = 'recommendations';
      topicSuggestions = SUGGESTION_TEMPLATES.recommendations;
    } else if (userQuestion.includes('year') || userQuestion.includes('2024') || userQuestion.includes('2025') || userQuestion.includes('month')) {
      primaryTopic = 'temporal';
      topicSuggestions = SUGGESTION_TEMPLATES.temporal;
    } else if (["hi", "hello", "hey", "how are you"].some(greet => userQuestion.includes(greet))) {
      primaryTopic = 'conversational';
      topicSuggestions = SUGGESTION_TEMPLATES.conversational;
    } else if (["wow", "awesome", "cool", "amazing", "great", "nice", "interesting", "hahaha"].some(word => userQuestion.includes(word))) {
      primaryTopic = 'fun';
      topicSuggestions = SUGGESTION_TEMPLATES.fun;
    } else {
      primaryTopic = 'general';
      topicSuggestions = SUGGESTION_TEMPLATES.general;
    }

    // Add topic-specific suggestions (filtering out already used ones)
    const availableTopicSuggestions = topicSuggestions.filter(text =>
      !usedSuggestions.has(text.toLowerCase())
    );

    availableTopicSuggestions.forEach(text => {
      if (suggestions.length < 6) {
        suggestions.push({
          text,
          type: primaryTopic
        });
      }
    });

    // If we don't have enough suggestions, add from related topics
    if (suggestions.length < 6) {
      const relatedTopics = getRelatedTopics(primaryTopic);
     
      relatedTopics.forEach(topic => {
        if (suggestions.length < 6) {
          const relatedSuggestions = SUGGESTION_TEMPLATES[topic] || [];
          relatedSuggestions.forEach(text => {
            if (suggestions.length < 6 && !usedSuggestions.has(text.toLowerCase())) {
              suggestions.push({
                text,
                type: topic
              });
            }
          });
        }
      });
    }

    // Database-specific suggestions
    if (activeSource === 'database') {
      if (userQuestion.includes('count') || userQuestion.includes('how many')) {
        suggestions.push(
          { text: 'Show breakdown by policy status', type: 'breakdown' },
          { text: 'What is the average across different segments?', type: 'analytics' }
        );
      }
    }

    // File-specific suggestions
    if (activeSource === 'file') {
      if (userQuestion.includes('total') || userQuestion.includes('sum')) {
        suggestions.push(
          { text: 'Show detailed breakdown by category', type: 'breakdown' },
          { text: 'Create a visualization of this data', type: 'visualization' }
        );
      }
    }

    // Chart suggestions if data is available
    if (lastAssistantMessage && lastAssistantMessage.rows && lastAssistantMessage.rows.length > 0) {
      if (suggestions.length < 6) {
        suggestions.push(
          { text: 'Create a chart visualization of this data', type: 'chart' },
          { text: 'Show correlation analysis', type: 'correlation' }
        );
      }
    }

    // Ensure we have exactly 6 suggestions
    const finalSuggestions = suggestions.slice(0, 6);
   
    // If still not enough, fill with general suggestions
    while (finalSuggestions.length < 6) {
      const remainingGeneral = SUGGESTION_TEMPLATES.general.filter(text =>
        !finalSuggestions.some(s => s.text === text) && !usedSuggestions.has(text.toLowerCase())
      );
     
      if (remainingGeneral.length > 0) {
        finalSuggestions.push({
          text: remainingGeneral[0],
          type: 'general'
        });
      } else {
        break;
      }
    }

    return finalSuggestions;
  };

  // Helper function to get related topics
  const getRelatedTopics = (primaryTopic) => {
    const topicRelations = {
      churn: ['customer', 'recommendations', 'premium'],
      premium: ['customer', 'vehicle', 'regional'],
      claims: ['risk', 'vehicle', 'customer'],
      customer: ['churn', 'premium', 'recommendations'],
      vehicle: ['premium', 'risk', 'claims'],
      regional: ['premium', 'risk', 'customer'],
      discount: ['customer', 'premium', 'churn'],
      risk: ['vehicle', 'claims', 'regional'],
      recommendations: ['customer', 'churn', 'premium'],
      temporal: ['premium', 'customer', 'churn'],
      general: ['customer', 'premium', 'churn'],
      conversational: ['general', 'fun'],
      fun: ['general', 'conversational']
    };

    return topicRelations[primaryTopic] || ['general'];
  };

  // Function to refresh suggestions (call this after user clicks a suggestion)
  const refreshSuggestions = (messages, activeSource, connectedDbDetails) => {
    return generateDynamicSuggestions(messages, activeSource, connectedDbDetails, true);
  };

  // Export functions
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      generateDynamicSuggestions,
      refreshSuggestions,
      generateNextMonthQuestion,
      SUGGESTION_TEMPLATES,
      DATASET_COLUMNS
    };
  }

  const components = {
    table: ({ children }) => (
      <div style={styles.tableWrapper}>
        <table style={styles.markdownTable}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead style={styles.tableHead}>{children}</thead>,
    th: ({ children }) => <th style={styles.tableHeader}>{children}</th>,
    tbody: ({ children }) => <tbody style={styles.tableBody}>{children}</tbody>,
    tr: ({ children }) => <tr style={styles.tableRow}>{children}</tr>,
    td: ({ children }) => <td style={styles.tableCell}>{children}</td>,
  };

  // --- Narrative renderer (JSON from backend humanizer) ---
// const NarrativeBlock = ({ narrative }) => {
//   if (!narrative) return null;
//   const { opener = "", insights = [], recommendations = [], next_step = "" } = narrative || {};
//   const hasInsights = Array.isArray(insights) && insights.length;
//   const hasRecs = Array.isArray(recommendations) && recommendations.length;

//   return (
//     <div style={styles.narrativeCard}>
//       {opener ? <div style={styles.narrativeOpener}>{opener}</div> : null}

//       {hasInsights && (
//         <div>
//           <div style={styles.narrativeLabel}>Key insights</div>
//           <ul style={styles.narrativeList}>
//             {insights.map((i, idx) => <li key={idx}>{i}</li>)}
//           </ul>
//         </div>
//       )}

//       {hasRecs && (
//         <div>
//           <div style={styles.narrativeLabel}>Recommendations</div>
//           <ul style={styles.narrativeList}>
//             {recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
//           </ul>
//         </div>
//       )}

//       {next_step ? <div style={styles.nextStep}>{next_step}</div> : null}
//     </div>
//   );
// };
// before: const NarrativeBlock = ({ narrative }) => {



const NARRATIVE_ONLY_DURING_STREAM = true;

// const NarrativeBlock = ({ narrative, onFollowUp }) => {
//   if (!narrative) return null;
//   const { opener = "", insights = [], recommendations = [], next_step = "" } = narrative || {};

//   return (
//     <div style={styles.narrativeCard}>
//       {opener ? <div style={styles.narrativeOpener}>{opener}</div> : null}

//       {!!insights.length && (
//         <>
//           <div style={styles.narrativeLabel}>Key insights</div>
//           <ul style={styles.narrativeList}>{insights.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
//         </>
//       )}

//       {!!recommendations.length && (
//         <>
//           <div style={styles.narrativeLabel}>Recommendations</div>
//           <ul style={styles.narrativeList}>{recommendations.map((r, idx) => <li key={idx}>{r}</li>)}</ul>
//         </>
//       )}

//       {next_step ? (
//         <button
//           type="button"
//           onClick={() => onFollowUp?.(next_step)}
//           style={styles.followUpBtn}
//           aria-label={`Ask: ${next_step}`}
//         >
//           {next_step}
//         </button>
//       ) : null}
//     </div>
//   );
// };
// --- INSIGHTS-ONLY narrative (no recommendations here)
const NarrativeBlocktoday = ({ narrative }) => {
  if (!narrative) return null;
  const { opener = "", insights = [] } = narrative || {};

  return (
    <div style={styles.narrativeCard}>
      {opener ? <div style={styles.narrativeOpener}>{opener}</div> : null}

      {!!insights.length && (
        <>
          <div style={styles.narrativeLabel}>Key insights</div>
          <ul style={styles.narrativeList}>
            {insights.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </>
      )}
    </div>
  );
};


const NarrativeBlock = ({ narrative, rows, onFollowUp }) => {
  if (!narrative) return null;
  
  const hasData = rows && rows.length > 0;
  const { opener = "", insights = [], recommendations = [] } = narrative || {};

  // ✅ If no data, show ONLY the short warning message
  if (!hasData) {
    return (
      <div style={{
        padding: "20px",
        backgroundColor: "#fef3c7",
        borderLeft: "4px solid #f59e0b",
        borderRadius: "12px",
        marginBottom: "16px"
      }}>
        <div style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#92400e",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          ⚠️ No Results Found
        </div>
        <div style={{
          color: "#78350f",
          fontSize: "0.95rem",
          lineHeight: "1.6"
        }}>
          {/* ✅ Use ONLY the opener text, nothing else */}
          {normalizeCurrencyInText(opener || "No records were found matching your criteria.")}
        </div>
      </div>
    );
  }

  // Has data - show normal narrative
  return (
    <div style={styles.narrativeCard}>
      {opener && (
        <div style={styles.narrativeOpener}>
          {normalizeCurrencyInText(opener)}
        </div>
      )}

      {insights.length > 0 && (
        <>
          <div style={styles.narrativeLabel}>💡 Key Insights</div>
          <ul style={styles.narrativeList}>
            {insights.map((i, idx) => (
              <li key={idx}>{normalizeCurrencyInText(i)}</li>
            ))}
          </ul>
        </>
      )}

      {/* {recommendations.length > 0 && (
        <>
          <div style={styles.narrativeLabel}>🔎 Recommendations</div>
          <ul style={styles.narrativeList}>
            {recommendations.map((r, idx) => (
              <li key={idx}>{normalizeCurrencyInText(r)}</li>
            ))}
          </ul>
        </>
      )} */}
    </div>
  );
};

const NarrativeBlock0502 = ({ narrative, rows, onFollowUp }) => {
  if (!narrative) return null;
  
  const hasData = rows && rows.length > 0;
  const { opener = "", insights = [], recommendations = [] } = narrative || {};

  return (
    <div style={styles.narrativeCard}>
      {/* ✅ Show opener always if present */}
      {opener && (
        <div style={styles.narrativeOpener}>
          {normalizeCurrencyInText(opener)}
        </div>
      )}

      {/* ✅ Show insights ONLY if there's data */}
      {hasData && insights.length > 0 && (
        <>
          <div style={styles.narrativeLabel}>💡 Key Insights</div>
          <ul style={styles.narrativeList}>
            {insights.map((i, idx) => (
              <li key={idx}>{normalizeCurrencyInText(i)}</li>
            ))}
          </ul>
        </>
      )}

      {/* ✅ Show recommendations ONLY if there's data */}
      {/* {hasData && recommendations.length > 0 && (
        <>
          <div style={styles.narrativeLabel}>🔎 Recommendations</div>
          <ul style={styles.narrativeList}>
            {recommendations.map((r, idx) => (
              <li key={idx}>{normalizeCurrencyInText(r)}</li>
            ))}
          </ul>
        </>
      )} */}

      {/* ✅ Optional: Show message when no data but insights/recs exist */}
      {!hasData && (insights.length > 0 || recommendations.length > 0) && (
        <div style={{
          marginTop: "12px",
          padding: "12px 16px",
          backgroundColor: "#fef3c7",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
          color: "#92400e",
          fontSize: "0.9rem"
        }}>
          ℹ️ No data available for analysis.
        </div>
      )}
    </div>
  );
};

// ⭐ UPDATED NarrativeBlock Component with data check
const NarrativeBlocks = ({ narrative, rows, onFollowUp }) => { // ← ADD rows prop
  if (!narrative) return null;
  
  // ✅ CHECK IF THERE'S DATA
  const hasData = rows && rows.length > 0;
  const { opener = "", insights = [] } = narrative || {};

  return (
    <div style={styles.narrativeCard}>
      {/* ✅ Always show opener if present */}
      {opener ? (
        <div style={styles.narrativeOpener}>
          {normalizeCurrencyInText(opener)}
        </div>
      ) : null}

      {/* ✅ ONLY SHOW INSIGHTS IF THERE'S DATA */}
      {hasData && !!insights.length && (
        <>
          <div style={styles.narrativeLabel}>Key insights</div>
          <ul style={styles.narrativeList}>
            {insights.map((i, idx) => (
              <li key={idx}>
                {normalizeCurrencyInText(i)}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ✅ Show message when no data */}
      {/* {!hasData && (
        <div style={{
          marginTop: "12px",
          padding: "12px 16px",
          backgroundColor: "#fef3c7",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
          color: "#92400e",
          fontSize: "0.9rem"
        }}>
          ℹ️ No data available for this query.
        </div>
      )} */}
    </div>
  );
};
// ⭐ UPDATED NarrativeBlock Component
const NarrativeBlock0801 = ({ narrative }) => {
  if (!narrative) return null;
  const { opener = "", insights = [] } = narrative || {};

  return (
    <div style={styles.narrativeCard}>
      {opener ? (
        <div style={styles.narrativeOpener}>
          {/* ⭐ CONVERT CURRENCY IN OPENER */}
          {normalizeCurrencyInText(opener)}
        </div>
      ) : null}

      {!!insights.length && (
        <>
          <div style={styles.narrativeLabel}>Key insights</div>
          <ul style={styles.narrativeList}>
            {insights.map((i, idx) => (
              <li key={idx}>
                {/* ⭐ CONVERT CURRENCY IN EACH INSIGHT */}
                {normalizeCurrencyInText(i)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};



// --- RECOMMENDATIONS panel (goes under the chart)
// const RecommendationsPanel = ({ narrative, fallbackRec, onFollowUp }) => {
//   const recs = Array.isArray(narrative?.recommendations)
//     ? narrative.recommendations
//     : (fallbackRec || "")
//         .split(/\n|\. /)
//         .map(s => s.trim())
//         .filter(Boolean);

//   if (!recs.length) return null;

//   return (
//     <div style={styles.recommendationBox}>
//       <div style={styles.recommendationHeader}>🔎 Recommendations</div>
//       <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
//         {recs.map((r, i) => <li key={i}>{r.replace(/\.*$/, ".")}</li>)}
//       </ul>

//       {narrative?.next_step && (
//         <button
//           type="button"
//           onClick={() => onFollowUp?.(narrative.next_step)}
//           style={styles.followUpBtn}
//           aria-label={`Ask: ${narrative.next_step}`}
//         >
//           {narrative.next_step}
//         </button>
//       )}
//     </div>
//   );
// };

// // --- RECOMMENDATIONS panel (goes under the chart)
// const RecommendationsPanel = ({ narrative, fallbackRec, onFollowUp }) => {
//   const recs = Array.isArray(narrative?.recommendations)
//     ? narrative.recommendations
//     : (fallbackRec || "")
//         .split(/\n|\. /)
//         .map(s => s.trim())
//         .filter(Boolean);

//   const suggestedQs = Array.isArray(narrative?.next_steps)
//     ? narrative.next_steps
//     : narrative?.next_step
//       ? [narrative.next_step]
//       : [];

//   // 🔥 Don't early-return here — otherwise suggestedQs never render
//   if (!recs.length && !suggestedQs.length) return null;

//   return (
//     <div>
//       {/* Recommendations Box (only if recs exist) */}
//       {recs.length > 0 && (
//         <div style={styles.recommendationBox}>
//           <div style={styles.recommendationHeader}>🔎 Recommendations</div>
//           <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
//             {recs.map((r, i) => <li key={i}>{r.replace(/\.*$/, ".")}</li>)}
//           </ul>
//         </div>
//       )}

//       {/* Suggested Next Steps Box */}
//       {suggestedQs.length > 0 && (
//         <div style={styles.suggestedBox}>
//           <div style={styles.suggestedHeader}>💡 Suggested Next Steps</div>
//           <ul style={{ ...styles.suggestedList, paddingLeft: "1.25rem" }}>
//             {suggestedQs.slice(0, 3).map((q, i) => (
//               <li
//                 key={i}
//                 style={styles.suggestedItem}
//                 onClick={() => onFollowUp?.(q)}
//               >
//                 {q}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// const RecommendationsPanel = ({ narrative, fallbackRec, onFollowUp }) => {
//   // ✅ Always normalize recommendations into array
//   const recs = Array.isArray(narrative?.recommendations)
//     ? narrative.recommendations
//     : (fallbackRec || "")
//         .split(/\n|\. /)
//         .map(s => s.trim())
//         .filter(Boolean);

//   // ✅ Normalize next steps (handle both `next_step` and `next_steps`)
//   let suggestedQs = [];
//   if (Array.isArray(narrative?.next_steps)) {
//     suggestedQs = narrative.next_steps;
//   } else if (Array.isArray(narrative?.next_step)) {
//     suggestedQs = narrative.next_step; // <-- handle array case too
//   } else if (narrative?.next_step) {
//     suggestedQs = [narrative.next_step]; // <-- single string case
//   }

//   if (!recs.length && !suggestedQs.length) return null;

//   return (
//     <div>
//       {/* 🔎 Recommendations */}
//       {recs.length > 0 && (
//         <div style={styles.recommendationBox}>
//           <div style={styles.recommendationHeader}>🔎 Recommendations</div>
//           <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
//             {recs.map((r, i) => (
//               <li key={i}>{r.replace(/\.*$/, ".")}</li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* 💡 Suggested Next Steps */}
//       {suggestedQs.length > 0 && (
//         <div style={styles.suggestedBox}>
//           <div style={styles.suggestedHeader}>💡 Suggested Next Steps</div>
//           <ul style={{ ...styles.suggestedList, paddingLeft: "1.25rem" }}>
//             {suggestedQs.slice(0, 3).map((q, i) => (
//               <li
//                 key={i}
//                 style={styles.suggestedItem}
//                 onClick={() => onFollowUp?.(q)}
//               >
//                 {q}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };


// ⭐ Add this helper at the top of your file (if not already present)
const normalizeCurrencyInText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Replace all currency symbols
  result = result.replace(/\$/g, '₹');
  result = result.replace(/€/g, '₹');
  result = result.replace(/£/g, '₹');
  
  // Replace dollar/dollars with rupee/rupees (case insensitive)
  result = result.replace(/\bdollars?\b/gi, (match) => {
    return match.toLowerCase().endsWith('s') ? 'rupees' : 'rupee';
  });
  
  // Replace USD with INR
  result = result.replace(/\bUSD\b/gi, 'INR');
  
  return result;
};


// ⭐ FIXED RecommendationsPanel Component with data check
const RecommendationsPanel = ({ narrative, fallbackRec, onFollowUp, rows }) => { // ← ADD rows prop
  try {
    // ✅ CHECK IF THERE'S DATA FIRST
    const hasData = rows && rows.length > 0;
    
    // ✅ Always normalize recommendations into array AND convert currency
    const recs = Array.isArray(narrative?.recommendations)
      ? narrative.recommendations.map(normalizeCurrencyInText)
      : (fallbackRec || "")
          .split(/\n|\. /)
          .map(s => s.trim())
          .filter(Boolean)
          .map(normalizeCurrencyInText);

    // ✅ Normalize next steps AND convert currency
    let suggestedQs = [];
    if (Array.isArray(narrative?.next_steps)) {
      suggestedQs = narrative.next_steps.map(normalizeCurrencyInText);
    } else if (Array.isArray(narrative?.next_step)) {
      suggestedQs = narrative.next_step.map(normalizeCurrencyInText);
    } else if (narrative?.next_step) {
      suggestedQs = [normalizeCurrencyInText(narrative.next_step)];
    }

    // ✅ ONLY SHOW IF THERE'S DATA
    if (!hasData || (!recs.length && !suggestedQs.length)) return null;

    return (
      <div>
        {/* 🔎 Recommendations - Only show if there's data */}
        {hasData && recs.length > 0 && (
          <div style={styles.recommendationBox}>
            <div style={styles.recommendationHeader}>🔎 Recommendations</div>
            <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
              {recs.map((r, i) => (
                <li key={i}>
                  {normalizeCurrencyInText(r.replace(/\.*$/, "."))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 💡 Suggested Next Steps */}
        {/* {hasData && suggestedQs.length > 0 && (
          <div style={styles.suggestedBox}>
            <div style={styles.suggestedHeader}>💡 Suggested Next Steps</div>
            <ul style={{ ...styles.suggestedList, paddingLeft: "1.25rem" }}>
              {suggestedQs.slice(0, 3).map((q, i) => (
                <li
                  key={i}
                  style={styles.suggestedItem}
                  onClick={() => {
                    console.log("🎯 Next step clicked:", q);
                    onFollowUp?.(q);
                  }}
                >
                  {normalizeCurrencyInText(q)}
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    );
  } catch (error) {
    console.error("❌ RecommendationsPanel error:", error);
    return null;
  }
};
// ⭐ FIXED RecommendationsPanel Component
const RecommendationsPanel0801 = ({ narrative, fallbackRec, onFollowUp }) => {
  try {
    // ✅ Always normalize recommendations into array AND convert currency
    const recs = Array.isArray(narrative?.recommendations)
      ? narrative.recommendations.map(normalizeCurrencyInText) // ⭐ CONVERT HERE
      : (fallbackRec || "")
          .split(/\n|\. /)
          .map(s => s.trim())
          .filter(Boolean)
          .map(normalizeCurrencyInText); // ⭐ AND HERE

    // ✅ Normalize next steps AND convert currency
    let suggestedQs = [];
    if (Array.isArray(narrative?.next_steps)) {
      suggestedQs = narrative.next_steps.map(normalizeCurrencyInText); // ⭐ CONVERT
    } else if (Array.isArray(narrative?.next_step)) {
      suggestedQs = narrative.next_step.map(normalizeCurrencyInText); // ⭐ CONVERT
    } else if (narrative?.next_step) {
      suggestedQs = [normalizeCurrencyInText(narrative.next_step)]; // ⭐ CONVERT
    }

    if (!recs.length && !suggestedQs.length) return null;

    return (
      <div>
        {/* 🔎 Recommendations */}
        {recs.length > 0 && (
          <div style={styles.recommendationBox}>
            <div style={styles.recommendationHeader}>🔎 Recommendations</div>
            <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
              {recs.map((r, i) => (
                <li key={i}>
                  {/* ⭐ Text is already converted above, but we can add extra safety */}
                  {normalizeCurrencyInText(r.replace(/\.*$/, "."))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 💡 Suggested Next Steps */}
        {/* {suggestedQs.length > 0 && (
          <div style={styles.suggestedBox}>
            <div style={styles.suggestedHeader}>💡 Suggested Next Steps</div>
            <ul style={{ ...styles.suggestedList, paddingLeft: "1.25rem" }}>
              {suggestedQs.slice(0, 3).map((q, i) => (
                <li
                  key={i}
                  style={styles.suggestedItem}
                  onClick={() => {
                    console.log("🎯 Next step clicked:", q);
                    onFollowUp?.(q);
                  }}
                > */}
                  {/* ⭐ Already converted above, but double-check here too */}
                  {/* {normalizeCurrencyInText(q)}
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    );
  } catch (error) {
    console.error("❌ RecommendationsPanel error:", error);
    return null;
  }
};


const RecommendationsPaneltoday = ({ narrative, fallbackRec, onFollowUp }) => {
  try {
    // ✅ Always normalize recommendations into array
    const recs = Array.isArray(narrative?.recommendations)
      ? narrative.recommendations
      : (fallbackRec || "")
          .split(/\n|\. /)
          .map(s => s.trim())
          .filter(Boolean);

    // ✅ Normalize next steps
    let suggestedQs = [];
    if (Array.isArray(narrative?.next_steps)) {
      suggestedQs = narrative.next_steps;
    } else if (Array.isArray(narrative?.next_step)) {
      suggestedQs = narrative.next_step;
    } else if (narrative?.next_step) {
      suggestedQs = [narrative.next_step];
    }

    if (!recs.length && !suggestedQs.length) return null;

    return (
      <div>
        {/* 🔎 Recommendations */}
        {recs.length > 0 && (
          <div style={styles.recommendationBox}>
            <div style={styles.recommendationHeader}>🔎 Recommendations</div>
            <ul style={{ ...styles.recoList, paddingLeft: "1.25rem" }}>
              {recs.map((r, i) => (
                <li key={i}>{r.replace(/\.*$/, ".")}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 💡 Suggested Next Steps */}
        {/* {suggestedQs.length > 0 && (
          <div style={styles.suggestedBox}>
            <div style={styles.suggestedHeader}>💡 Suggested Next Steps</div>
            <ul style={{ ...styles.suggestedList, paddingLeft: "1.25rem" }}>
              {suggestedQs.slice(0, 3).map((q, i) => (
                <li
                  key={i}
                  style={styles.suggestedItem}
                  onClick={() => {
                    console.log("🎯 Next step clicked:", q); // Debug log
                    onFollowUp?.(q);
                  }}
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    );
  } catch (error) {
    console.error("❌ RecommendationsPanel error:", error);
    return null;
  }
};


// --- Month mapping
const monthMap = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

// --- 🔹 Resolve partial queries like "in feb"
const resolveQueryWithContext = (pending, lastQuery) => {
  if (!lastQuery) return pending;

  let resolved = lastQuery;
  let replaced = false;

  // Replace month
  const inMonth = pending.match(/^in\s+([a-z]+)/i);
  if (inMonth) {
    const short = inMonth[1].toLowerCase();
    const fullMonth = monthMap[short] || short;
    resolved = resolved.replace(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      fullMonth
    );
    replaced = true;
  }

  // Replace year
  const yearMatch = pending.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) {
    resolved = resolved.replace(/\b(20\d{2}|19\d{2})\b/, yearMatch[1]);
    replaced = true;
  }

  // Ensure branch/state/zone/etc present
  ["branch", "state", "zone", "city", "region", "district"].forEach((k) => {
    if (pending.toLowerCase().includes(k)) {
      if (!resolved.toLowerCase().includes(k)) {
        resolved = resolved + " " + k;
      }
      replaced = true;
    }
  });

  return replaced ? resolved : pending;
};

// --- 🔹 Dynamic filter extraction
const extractFilters = (queryLower) => {
  const filters = {};

  // Month
  Object.entries(monthMap).forEach(([short, full]) => {
    if (queryLower.includes(short) || queryLower.includes(full)) {
      filters.month = full;
    }
  });

  // Year
  const yearMatch = queryLower.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) filters.year = yearMatch[1];

  // Explicit "branch mumbai", "state tamilnadu"
  const dimensionKeywords = ["branch", "state", "zone", "city", "region", "district"];
  dimensionKeywords.forEach((dim) => {
    const regex = new RegExp(`${dim}\\s+([a-zA-Z]+)`, "i");
    const match = queryLower.match(regex);
    if (match) {
      filters[dim] = match[1].toLowerCase();
    }
  });

  // --- Dynamic fallback: capture unknown tokens as "location"
  const stopwords = new Set([
    "in","on","at","by","for","to","from","with","have","the","which","how","many",
    "high","policy","renewal","churn","data","year","month","date","time"
  ]);
  const words = queryLower.split(/\s+/);

  words.forEach((word) => {
    if (
      word.length > 3 &&
      !stopwords.has(word) &&
      !Object.values(monthMap).includes(word) &&
      !filters.branch &&
      !filters.state &&
      !filters.zone &&
      !filters.city &&
      !filters.region &&
      !filters.district
    ) {
      filters.location = word.toLowerCase();
    }
  });

  return filters;
};

// --- 🔹 Normalize months for matching
// --- 🔹 Normalize months consistently
const normalizeMonths = (text) => {
  let result = text.toLowerCase();
  Object.entries(monthMap).forEach(([short, full]) => {
    const regex = new RegExp(`\\b${short}\\b`, "gi"); // "jan" → "january"
    result = result.replace(regex, full);
  });
  return result;
};

// --- 🔹 Strict keyword-matching suggestions
const processResults = (data, queryLower) => {
  const safeResults = Array.isArray(data.results) ? data.results : [];

  // Extract filters from the asked question
  const filters = extractFilters(queryLower);
  const filterValues = Object.values(filters).map((v) => v.toLowerCase());

  const seen = new Set();

  return safeResults
    .map((item) => {
      const q =
        item.content?.display_question ||
        item.content?.raw_question ||
        item.content?.asked_question ||
        "";
      return q.trim();
    })
    .filter((q) => {
      if (!q) return false;
      if (["hi", "hello", "hey"].includes(q.toLowerCase())) return false;
      if (/^in\s+[a-z]+$/i.test(q)) return false;
      if (/in\s+in\s+/i.test(q)) return false;
      if (q.split(/\s+/).length <= 2) return false;
      if (seen.has(q.toLowerCase())) return false;

      // Normalize corpus question for comparison
      const qNormalized = normalizeMonths(q.toLowerCase());

      // 🔹 Strict check: every filter must appear in the question
      for (const val of filterValues) {
        if (!qNormalized.includes(val)) {
          return false;
        }
      }

      seen.add(q.toLowerCase());
      return true;
    })
    .slice(0, 5);
};

const Popup = ({ message, onClose }) => {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#1e293b",
        color: "white",
        padding: "24px",
        borderRadius: "12px",
        textAlign: "center",
        maxWidth: "400px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
      }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px" }}>
          ⚠️ Please Rephrase
        </h3>
        <p style={{ marginBottom: "20px", color: "#cbd5e1" }}>
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#3b82f6",
            color: "white",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};


  const Sara = () => {
    const USE_STREAMING = true;
    const [messages, setMessages] = useState([
      {
        sender: "bot",
        text: "👋 Welcome! I'm here to help you explore insights from your data — including churn patterns, customer segments, performance dashboards, and strategic recommendations. Ask a question to get started."
      }
    ]);
    const [input, setInput] = useState("");
    const [inputFocused, setInputFocused] = useState(false);
    const [buttonHovered, setButtonHovered] = useState(false);
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const sessionIdRef = useRef(null);
    const [expandedTables, setExpandedTables] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [expandedTableContent, setExpandedTableContent] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loopingSuggestionIndex, setLoopingSuggestionIndex] = useState(0);
    const [loopingSuggestionsActive, setLoopingSuggestionsActive] = useState(false);
    const chatBoxRef = useRef(null);
    const hasMountedRef = useRef(false);
    const [sessionReady, setSessionReady] = useState(false);
    const connectOnceRef = useRef(false);
    const [pendingBot, setPendingBot] = useState(null);
    const lastMsgRef = useRef(null);
    const pendingMsgRef = useRef(null);
    const [messageRatings, setMessageRatings] = useState({});
    const [showRatingPopup, setShowRatingPopup] = useState(false);

    const [showIntentPopup, setShowIntentPopup] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState("");
    const [hasAskedFirstQuestion, setHasAskedFirstQuestion] = useState(false);
    const [visibleTables, setVisibleTables] = useState({});
    const [visibleCharts, setVisibleCharts] = useState({});
    const [suggestionList, setSuggestionList] = useState([]);
    const [relatedEntries, setRelatedEntries] = useState([]);
    const [lastQuery, setLastQuery] = useState("");
    const [showIncompletePopup, setShowIncompletePopup] = useState(false);
    // Keep track of last full question
const [lastFullQuestion, setLastFullQuestion] = useState(null);
const [lastFullType, setLastFullType] = useState("");
const [fromNextStepSuggestion, setFromNextStepSuggestion] = useState(false);
const [customPopupMessage, setCustomPopupMessage] = useState("");
const [isProcessing, setIsProcessing] = useState(false);
const [visibleSQL, setVisibleSQL] = useState({});





// Fixed useEffects
// Fixed useEffects


// ✅ Effect 1: Fetch entries
  useEffect(() => {
    if (showIntentPopup) {
      fetch(`${API_BASE_URL}/entries/`)
        .then((res) => res.json())
        .then((data) => {
          const queryLower = pendingQuestion.toLowerCase();
          setRelatedEntries(processResults(data, queryLower));
          if (data.resolved_query) setLastQuery(data.resolved_query);
        })
        .catch((err) => console.error("Error fetching corpus:", err));
    }
  }, [showIntentPopup]);


   useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsLoading(false);
        setMessages(prev => {
          const last = prev[prev.length-1];
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, isStreaming: false, text: last.text || "No final response received." }
            ];
          }
          return prev;
        });
      }, 8000); // 8s fallback if final event never arrives
    }
    return () => clearTimeout(timer);
  }, [isLoading, setMessages]);



// Normalize rows: enforce Platinum → Gold → Silver, drop nulls, add missing
const normalizeSegmentationRows = (rows) => {
  if (!rows || rows.length === 0) return [];

  const requiredTiers = ["Platinum", "Gold", "Silver"];
  const cleaned = rows.filter(
    (r) => r.customer_segmentation && r.customer_segmentation.trim() !== ""
  );

  const ensured = requiredTiers.map((tier) => {
    const found = cleaned.find((r) => r.customer_segmentation === tier);
    return (
      found || {
        customer_segmentation: tier,
        count: 0,
        revenue: "-",
      }
    );
  });

  return ensured;
};

// Row highlighting colors
const rowHighlight = (segmentation) => {
  switch (segmentation) {
    case "Platinum":
      return { backgroundColor: "#105b8dff" }; // light blue
    case "Gold":
      return { backgroundColor: "#2b3ea7ff" }; // light yellow
    case "Silver":
      return { backgroundColor: "#0c3a96ff" }; // light gray
    default:
      return {};
  }
};


  // ✅ Effect 2: Boosted search with context + filters
  useEffect(() => {
    if (showIntentPopup && pendingQuestion) {
      const resolvedQ = resolveQueryWithContext(pendingQuestion, lastQuery);
      const filters = extractFilters(resolvedQ.toLowerCase());

      fetch(
        `${API_BASE_URL}/search_corpus/?q=${encodeURIComponent(
          resolvedQ
        )}&prev=${encodeURIComponent(lastQuery)}&boost=${encodeURIComponent(
          JSON.stringify([
            "date","time","year","month","zone","state","branch","city","country","district","region"
          ])
        )}&filters=${encodeURIComponent(JSON.stringify(filters))}`
      )
        .then((res) => res.json())
        .then((data) => {
          const queryLower = resolvedQ.toLowerCase();
          setRelatedEntries(processResults(data, queryLower));
          if (data.resolved_query) setLastQuery(data.resolved_query);
          else setLastQuery(resolvedQ);
        })
        .catch((err) =>
          console.error("Error fetching boosted search corpus:", err)
        );
    }
  }, [showIntentPopup, pendingQuestion]);

  // ✅ Effect 1: Fetch all entries
 


    // const USE_STREAMING = true; // toggle on/off without deleting old code

   // Helper function to check if a bot message needs rating
  // const isRatableMessage = (msg) => {
  //   return msg && (
  //     msg.asked_question || // This indicates it was a response to a user question
  //     msg.rows?.length > 0 ||
  //     msg.chart_config ||
  //     msg.narrative ||
  //     msg.summary ||
  //     msg.query_used
  //   );
  // };

//   const isRatableMessage = (msg) => {
//   if (!msg) return false;

//   // ❌ Never rate general Qwen responses
//   if (msg.isGeneralResponse) return false;

//   // ✅ Only rate data-analysis style responses
//   return (
//     msg.asked_question ||
//     msg.rows?.length > 0 ||
//     msg.chart_config ||
//     msg.narrative ||
//     msg.summary ||
//     msg.query_used
//   );
// };
// const isRatableMessage = (msg) => {
//   if (!msg) return false;
//   if (msg.isError) return false;
//   return Boolean(msg.summary || msg.recommendation || msg.narrative);
// };
 const isRatableMessage = (msg) => {
    if (!msg) return false;
    if (msg.isError) return false;
    if (msg.isStreaming) return false;
    if (msg.isGeneralResponse) return false;
    if (msg.isPdfResponse) return false;
    
    // Only rate data-analysis responses that are NOT from corpus
    // corpus_used === false means fresh SQL was generated (needs rating)
    // corpus_used === true means response came from knowledge base (no rating needed)
    return msg.corpus_used === false;
  };

  const isLoadingRef = useRef(false);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const sendMessageStream = async (questionText) => {
   const text = (questionText ?? "").trim();
  //  if (!text || isLoading) return;
  if (!text || isLoadingRef.current) return;
    // if (!input.trim() || isLoading) return;
    setIsLoading(true);

    // const userMsg = { sender: "user", role: "user", content: input };
    const userMsg = { sender: "user", role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // seed a progressive bubble
    let draft = {
      sender: "bot",
      role: "assistant",
      content: "Loading data…",
      summary: null,
      recommendation: null,
      rows: [],
      asked_question: text,
      chart_config: null,
      // asked_question: input,
      query_used: null,
      time_scope: null,
      narrative: null,
    };
    setPendingBot(draft);
 // 🔎 INTENT GATE (moved here)
  let isDataIntent = true;
  try {
    const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text })
    });
    const intentData = await intentRes.json();
    if ((intentData.answer || "").trim().toUpperCase() === "NO") {
      isDataIntent = false;
    }
  } catch {
    isDataIntent = true; // fail open to data
  }

  // Non-data → general Q&A, no streaming
  if (!isDataIntent) {
    try {
      const qwenRes = await fetch(`${API_BASE_URL}/ask_qwen/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });
      const qwenData = await qwenRes.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          role: "assistant",
          content: qwenData.answer || "Sorry, I couldn't process that."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", role: "assistant", content: "Unable to process general questions at the moment." }
      ]);
    } finally {
      setPendingBot(null);
      setInput("");
      setIsLoading(false);
    }
    return;
  }

  // Data intent → streaming path (your existing code)
  try {
    const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, user_id: "admin" })
    });

    await readNdjson(res, (evt) => {
      switch (evt.event) {
        case "phase":
          // draft = { ...draft, content: evt.message || draft.content };
          draft = { ...draft, phase: evt.message || draft.phase };
          setPendingBot({ ...draft });
          break;
        case "sql":
          draft = { ...draft, query_used: evt.sql, sqlReady: true };
          streamingData.sql = event.sql;
          console.log("📝 SQL Generated:", event.sql);   // ✅ separate log line
          updateStreamingMessage(
            question,
            `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`
          );
          setPendingBot({ ...draft });
          break;
        case "rows_preview":
          draft = { ...draft, rows: evt.rows || [], row_count: evt.row_count || 0, dataReady: true };
          setPendingBot({ ...draft });
          break;
        case "summary":
        if (!NARRATIVE_ONLY_DURING_STREAM) {
          draft = { ...draft, summary: evt.text || "" };
          setPendingBot({ ...draft });
        }
          break;
        case "chart":
          draft = { ...draft, chart_config: evt.config || null };
          setPendingBot({ ...draft });
          break;
        case "recommendation":
          draft = { ...draft, recommendation: evt.text || null };
          setPendingBot({ ...draft });
          break;
        case "narrative":
          draft = { ...draft, narrative: evt.obj || null };
          setPendingBot({ ...draft });
          break;
        case "final": {
          const finalBot = { ...draft, ...evt.payload };
          if (!finalBot.narrative && draft.summary && !finalBot.summary) {
          finalBot.summary = draft.summary;
        }

          console.log("📝 Final SQL Used:", finalMessage.query_used);  // <---- ADD THIS
          setMessages((prev) => [...prev, finalBot]);
          setPendingBot(null);

          const updatedMessages = [...messages, userMsg, finalBot];
          setSuggestions(generateDynamicSuggestions(updatedMessages, "database", {}, true));
          break;
        }
        case "error":
  console.error("STREAM ERROR:", evt.message, evt.traceback || "");
  setMessages(prev => [...prev, {
    sender: "bot", role: "assistant",
    content: "Something went wrong while processing your question."
  }]);
  setPendingBot(null);
  break;
        // case "error":
        //   setMessages((prev) => [...prev, { sender: "bot", role: "assistant", content: "Something went wrong while processing your question." }]);
        //   setPendingBot(null);
        //   break;
        default:
          break;
      }
    });
  } catch (e) {
    setMessages((prev) => [...prev, { sender: "bot", role: "assistant", content: "Network error." }]);
    setPendingBot(null);
  } finally {
    setInput("");
    setIsLoading(false);
  }
};

//  useEffect(() => {
//     if (showIntentPopup) {
//       setLoading(true);
//       fetch(`${API_BASE_URL}/list_corpus_entries/`)
//         .then((res) => res.json())
//         .then((data) => {
//           // ✅ Take only the top 2
//           setSuggestionList(data.slice(0, 2));
//         })
//         .catch((err) => console.error("Fetch error:", err))
//         .finally(() => setLoading(false));
//     }
//   }, [showIntentPopup]);

//   if (!showIntentPopup) return null;
useEffect(() => {
  if (!pendingBot || !pendingMsgRef.current || !chatBoxRef.current) return;

  // Scroll to the top of the streaming bubble
  pendingMsgRef.current.scrollIntoView({ block: "start", behavior: "auto" });

  // Small offset so it isn't flush against the top edge
  chatBoxRef.current.scrollTop -= 8;

  // NOTE: This runs on key streaming milestones so it won't spam-scroll on every tiny change.
}, [
  !!pendingBot,                 // when the bubble appears/disappears
  pendingBot?.phase,            // “Generating SQL…”, etc.
  pendingBot?.sqlReady,         // SQL is ready
  pendingBot?.dataReady,        // rows preview arrived
  pendingBot?.rows?.length,     // table grows
  pendingBot?.chart_config,     // chart arrived
  pendingBot?.narrative         // narrative arrived
]);

   
    useEffect(() => {
      if (!sessionIdRef.current) {
        const existing = sessionStorage.getItem("session_id");
        if (existing) sessionIdRef.current = existing;
        else {
          const newId = crypto.randomUUID();
          sessionStorage.setItem("session_id", newId);
          sessionIdRef.current = newId;
        }
      }
    }, []);

useEffect(() => {
  if (pendingBot) return; // skip bottom scroll while streaming
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, pendingBot]);

    // and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
const UPPER_WORDS = new Set(['idv','od','tp','ncb','clv','rto','gst']);

const formatHeader = (key) => {
  if (!key) return '';
  const spaced = String(key)
    .replace(/[_\-]+/g, ' ')            // snake/kebab -> spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')// split camelCase
    .trim();

  return spaced
    .split(/\s+/)
    .map(w => {
      const lw = w.toLowerCase();
      return UPPER_WORDS.has(lw) ? lw.toUpperCase() : lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');
};

    useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return; // prevent scroll on first render
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Pretty header labels: remove _/-, split camelCase, Title Case,
// and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
// const UPPER_WORDS = new Set(['idv','od','tp','ncb','clv','rto','gst']);

// const formatHeader = (key) => {
//   if (!key) return '';
//   const spaced = String(key)
//     .replace(/[_\-]+/g, ' ')            // snake/kebab -> spaces
//     .replace(/([a-z])([A-Z])/g, '$1 $2')// split camelCase
//     .trim();

//   return spaced
//     .split(/\s+/)
//     .map(w => {
//       const lw = w.toLowerCase();
//       return UPPER_WORDS.has(lw) ? lw.toUpperCase() : lw.charAt(0).toUpperCase() + lw.slice(1);
//     })
//     .join(' ');
// };


  useEffect(() => {
    // Function to reset all scroll positions
    const resetScrollPositions = () => {
      // Reset window scroll
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
     
      // Reset chat box scroll
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = 0;
      }
     
      // Reset body scroll if needed
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    // Try immediate reset
    resetScrollPositions();
   
    // Also try after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(resetScrollPositions, 10);
   
    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array means this runs once on mount

  // You might also want to add this effect to handle route changes
  // if you're using React Router or similar
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = 0;
      }
    };

    // If you're using React Router, you can listen to location changes
    // This is just an example - adjust based on your routing solution
    window.addEventListener('popstate', handleRouteChange);
   
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // put this inside your component, above the return()
// const formatCell = (val) => {
//   if (val === null || val === undefined) return "";
//   const num = typeof val === "number" ? val : Number(val);
//   if (Number.isFinite(num)) {
//     // always show exactly 2 decimals
//     return num.toLocaleString(undefined, {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   }
//   return String(val);
// };

// const formatCell = (val) => {
//   if (val === null || val === undefined) return "";
//   const s = String(val).trim();
//   const isPercent = s.endsWith("%");
//   const num = typeof val === "number"
//     ? val
//     : Number(s.replace(/,/g, "").replace(/%$/, ""));
//   if (Number.isFinite(num)) {
//     const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
//     return isPercent ? `${formatted}%` : formatted;
//   }
//   return s;
// };

 // Fetch suggestions when component mounts or when needed
  // const fetchSuggestions = async (query = "") => {
  //   try {
  //     const response = await fetch("/api/get_suggestions/", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         query: query,
  //         limit: 5 // Request more suggestions
  //       }),
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       // Make sure we're getting the full question text
  //       const fullSuggestions = data.suggestions?.map(suggestion => {
  //         // If suggestion is an object with question property, use that
  //         if (typeof suggestion === 'object' && suggestion.question) {
  //           return suggestion.question;
  //         }
  //         // If suggestion has asked_question property, use that for display
  //         if (typeof suggestion === 'object' && suggestion.asked_question) {
  //           return suggestion.asked_question;
  //         }
  //         // If it's just a string, use it as is
  //         return typeof suggestion === 'string' ? suggestion : String(suggestion);
  //       }) || [];
       
  //       setSuggestionList(fullSuggestions);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching suggestions:", error);
  //     setSuggestionList([]);
  //   }
  // };

  // // Load initial suggestions when component mounts
  // useEffect(() => {
  //   fetchSuggestions();
  // }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
   
    // Check if this might need intent clarification
    const needsIntent = await checkIfNeedsIntent(input.trim());
   
    if (needsIntent) {
      setPendingQuestion(input.trim());
      setShowIntentPopup(true);
      setInput("");
      // Fetch related suggestions for the current question
      await fetchSuggestions(input.trim());
      return;
    }

    await sendMessageStream(input.trim());
    setInput("");
  };
const checkIfNeedsIntent = async (question) => {
    try {
      const response = await fetch("/api/check_intent/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.needs_clarification || false;
      }
    } catch (error) {
      console.error("Error checking intent:", error);
    }
    return false;
  };
 

// const formatCell = (val) => {
//   if (val === null || val === undefined) return "";

//   const s = String(val).trim();
//   const isPercent = s.endsWith("%");

//   // Parse number
//   const num = typeof val === "number" ? val : Number(s.replace(/,/g, "").replace(/%$/, ""));

//   if (Number.isFinite(num)) {
//     // Special case: plain calendar year (1900–2100) → return raw integer, no commas
//     if (num >= 1900 && num <= 2100 && Number.isInteger(num)) {
//       return String(num);
//     }

//     // Default numeric formatting
//     const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
//     return isPercent ? `${formatted}%` : formatted;
//   }

//   return s;
// };



const formatCell = (val) => {
  if (val === null || val === undefined) return "";

  const num = typeof val === "number" ? val : Number(val);

  if (!Number.isFinite(num)) return String(val);

  // Calendar year safeguard
  if (num >= 1900 && num <= 2100 && Number.isInteger(num)) {
    return String(num);
  }

  // 🔥 FIX: fraction = percentage
  // if (num > 0 && num < 1) {
  //   return `${(num * 100).toFixed(2)}%`;
  // }
  if (num > 0 && num < 1) {
    return `${Math.round(num * 100)}%`;
}

  // Normal numbers
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const checkIntentAndSendtoday = async (question) => {
    console.log("🔍 Checking intent for:", question);
    
    try {
      const response = await fetch(`${API_BASE_URL}/check_intent/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        console.warn("Intent check failed, defaulting to data analysis");
        await sendMessageWithIntent(question, true);
        return;
      }

      const data = await response.json();
      console.log("✅ Intent classification result:", data.answer);

      // Handle incomplete question
      if (data.message && data.message.includes("Incomplete question")) {
        console.warn("⚠️ Incomplete question flagged by backend");
        setShowIncompletePopup(true);
        setIsLoading(false);
        return;
      }

      switch (data.answer) {
        case "YES":
          console.log("📊 Routing to data analysis (will check corpus first)");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, true);
          break;

        case "PDF":
          console.log("📄 PDF intent → Routing to DATABASE (PDF treated as DB query)");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, "PDF");
          break;

         
        // case "PDF":
        //   console.log("📄 Routing to PDF / knowledge base");
        //   setLastFullQuestion(question);
        //   await sendMessageWithIntent(question, "pdf");
        //   break;
         
        case "NO":
          console.log("💭 Routing to general knowledge");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, false);
          break;

        case "UNCERTAIN":
            console.log("❓ Intent uncertain");

            // If it's from a suggestion, or long enough, just continue to SQL
            if (fromNextStep || question.split(" ").length > 5) {
              console.warn("⚡ UNCERTAIN but looks like a valid question → routing to SQL");
              await sendMessageWithIntent(question, true, fromNextStep);
              return;
            }

            // Otherwise show popup (short fragments, unclear queries)
            setInput(question);
            setCustomPopupMessage("⚠️ Please rephrase the question as sensible.");
            setShowIncompletePopup(true);
            setIsLoading(false);
            setPendingBot(null);
            return;

        // case "UNCERTAIN":
        //     console.log("❓ Intent uncertain");

        //     // Don’t push to messages
        //     // Instead, put it back in the input for editing
        //     setInput(question);

        //     // Show popup for rephrasing
        //     setCustomPopupMessage("⚠️ Please rephrase the question as sensible.");
        //     setShowIncompletePopup(true);  // reuse existing popup

        //     // Reset bot state
        //     setIsLoading(false);
        //     setPendingBot(null);
        //     return;


        // case "UNCERTAIN":
        //   console.log("❓ Intent uncertain");
        //   const qTrim = question.trim().toLowerCase();

        //   if (data.message && data.message.includes("Incomplete question")) {
        //     if (!lastFullQuestion) {
        //       console.warn("⚠️ Incomplete question (first question) → show incomplete popup");
        //       setShowIncompletePopup(true);
        //       setIsLoading(false);
        //       return;
        //     } else {
        //       const combined = `${lastFullQuestion} ${question}`;
        //       console.log("🔗 Auto-merge with last full question:", combined);
        //       await sendMessageWithIntent(combined, true);
        //       return;
        //     }
        //   }

        //   if (/^(in|for|by|on|at)\b/.test(qTrim)) {
        //     if (!lastFullQuestion) {
        //       console.warn("⚠️ Fragment asked as first question → show incomplete popup");
        //       setShowIncompletePopup(true);
        //       setIsLoading(false);
        //       return;
        //     } else {
        //       const combined = `${lastFullQuestion} ${question}`;
        //       console.log("🔗 Auto-merge follow-up fragment:", combined);
        //       await sendMessageWithIntent(combined, true);
        //       return;
        //     }
        //   }

        //   setPendingQuestion(question);
        //   setRelatedEntries([...(data.related_questions || [])]);
        //   setShowIntentPopup(true);
        //   setIsLoading(false);
        //   setPendingBot(null);
        //   break;
         
        default:
          console.warn("Unknown intent response:", data.answer, "- defaulting to data analysis");
          await sendMessageWithIntent(question, true);
      }
     
    } catch (error) {
      console.error("❌ Intent check error:", error);
      await sendMessageWithIntent(question, true);
    }
  };

  // UPDATED: Enhanced message sending with corpus awareness
  const sendMessageWithIntenttoday = async (question, isDataIntent, fromNextStep = false) => {
    console.log("📤 Sending message with intent:", { question, isDataIntent, fromNextStep });

     // ⭐ FIX START — Allow PDF to go to DB query flow
    if (isDataIntent === "PDF" || isDataIntent === "pdf") {
      console.log("🔧 Converting PDF intent → DB intent");
      isDataIntent = true;
    }
    
    const userMessage = {
      sender: "user",
      text: question,
      content: question
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      let endpoint, requestBody;
      
      if (isDataIntent === true || isDataIntent === "pdf") {
        // 📊 Data analysis - use streaming endpoint (will check corpus first)
        endpoint = `${API_BASE_URL}/ask_question_stream/`;
        requestBody = {
          question: question,
          session_id: sessionIdRef.current,
          db_id: "liberty",
          from_next_step_suggestion: fromNextStep, // Pass the flag
        };
        console.log("🔄 Using data analysis endpoint with corpus checking");
        
        setLastFullQuestion(question);
        setLastFullType("db");
        
        await handleStreamingResponse(endpoint, requestBody, question);
        
      }
      //  else if (isDataIntent === "pdf") {
      //   // 📄 PDF/vector knowledge base
      //   endpoint = `${API_BASE_URL}/askbot`;
      //   requestBody = {
      //     query: question,
      //     session_id: sessionIdRef.current,
      //   };
      //   console.log("📄 Using PDF/vector knowledge base endpoint");
        
      //   setLastFullQuestion(question);
      //   setLastFullType("pdf");
        
      //   const response = await fetch(endpoint, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(requestBody),
      //   });
        
      //   if (!response.ok) {
      //     throw new Error(`HTTP error! status: ${response.status}`);
      //   }
        
      //   const data = await response.json();
      //   console.log("✅ PDF/vector response:", data);
        
      //   const botResponse = {
      //     sender: "bot",
      //     text: data.answer || "I couldn't find an answer in the knowledge base.",
      //     content: data.answer || "",
      //     asked_question: question,
      //     summary: data.summary || null,
      //     isPdfResponse: true,
      //     intentType: "pdf",
      //     corpus_used: true, // PDF responses don't need rating
      //   };
        
      //   setMessages(prev => [...prev, botResponse]);
      //   setIsLoading(false);
        
      // } 
    //   if (isDataIntent === true || isDataIntent === "pdf") {
    //   endpoint = `${API_BASE_URL}/ask_question_stream/`;
    //   requestBody = {
    //     question: question,
    //     session_id: sessionIdRef.current,
    //     db_id: "liberty",
    //     from_next_step_suggestion: fromNextStep,
    //   };

    //   console.log("🔄 Routing to DATABASE stream (includes PDF intent)");

    //   setLastFullQuestion(question);
    //   setLastFullType("db");

    //   await handleStreamingResponse(endpoint, requestBody, question);
    // }
      else {
        // 💭 General knowledge - use Qwen endpoint
        endpoint = `${API_BASE_URL}/ask_qwen/`;
        requestBody = {
          question: question,
          session_id: sessionIdRef.current,
        };
        console.log("💭 Using general question endpoint");
        
        setLastFullQuestion("");
        setLastFullType("general");
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // const data = await response.json();
        // console.log("✅ Qwen response:", data);
        
        // const botResponse = {
        //   sender: "bot",
        //   text: data.answer || data.response || "I apologize, but I couldn't generate a response.",
        //   content: data.answer || data.response || "",
        //   asked_question: question,
        //   summary: data.summary || null,
        //   isGeneralResponse: true,
        //   intentType: false,
        //   corpus_used: true, // General responses don't need rating
        // };

        const data = await response.json();
        console.log("✅ Qwen response:", data);

        const rawText =
          data.answer || data.response || "I apologize, but I couldn't generate a response.";
        const normalizedText = normalizeCurrencyInText(rawText);
        const normalizedSummary = normalizeCurrencyInText(data.summary || "");

        const botResponse = {
          sender: "bot",
          text: normalizedText,
          content: normalizedText,
          asked_question: question,
          summary: normalizedSummary || null,
          isGeneralResponse: true,
          intentType: false,
          corpus_used: true,
        };


        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      
      const errorMessage = {
        sender: "bot",
        text: "I apologize, but I encountered an error processing your question. Please try again.",
        content: "Error occurred",
        asked_question: question,
        isError: true,
        corpus_used: true, // Error messages don't need rating
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // // UPDATED: Enhanced streaming response handler
  // const handleStreamingResponse = async (endpoint, requestBody, question) => {
  //   console.log("🌊 Starting streaming response for:", question);
   
  //   try {
  //     const response = await fetch(endpoint, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify(requestBody),
  //     });

  //     if (!response.ok) {
  //       if (response.status === 400) {
  //         console.warn("⚠️ Backend blocked incomplete question");
  //         setShowIncompletePopup(true);
  //         setIsLoading(false);
  //         return;
  //       }
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     await handleNDJSONStream(response, question);

  //   } catch (error) {
  //     console.error("❌ Error in streaming response:", error);
  //     throw error;
  //   }
  // };


  // UPDATED: Enhanced streaming response handler with wake lock
const handleStreamingResponsetoday = async (endpoint, requestBody, question) => {
  console.log("🌊 Starting streaming response for:", question);
  
  // Prevent tab throttling
  let wakeLock = null;
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake lock active - tab won\'t throttle');
    }
  } catch (err) {
    console.warn('⚠️ Wake lock not available:', err);
  }
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "keep-alive",
        "Keep-Alive": "timeout=60"
      },
      body: JSON.stringify(requestBody),
      keepalive: true
    });

    if (!response.ok) {
      // Handle incomplete question popup
      if (response.status === 400) {
        console.warn("⚠️ Backend blocked incomplete question");
        setShowIncompletePopup(true);
        setIsLoading(false);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle NDJSON streaming response
    await handleNDJSONStream(response, question);

  } catch (error) {
    console.error("❌ Error in streaming response:", error);
    
    // Check if it's the HTTP/2 throttling error
    const isHTTP2Error = error.message?.includes('network error') || 
                         error.message?.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
                         error.message?.includes('ERR_INCOMPLETE_CHUNKED_ENCODING');
    
    if (isHTTP2Error) {
      throw new Error("Connection interrupted due to tab inactivity. Please keep the tab active and try again.");
    }
    
    throw error;
  } finally {
    // Always release wake lock when done
    if (wakeLock) {
      await wakeLock.release();
      console.log('✅ Wake lock released');
    }
  }
};

// ⭐ ADD THIS HELPER FUNCTION AT THE TOP
const convertDollarToRupee = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Replace $ with ₹
  text = text.replace(/\$/g, '₹');
  
  // Replace dollar/dollars with rupee/rupees (case insensitive)
  text = text.replace(/\bdollars?\b/gi, (match) => {
    return match.toLowerCase().endsWith('s') ? 'rupees' : 'rupee';
  });
  
  // Replace USD with INR
  text = text.replace(/\bUSD\b/gi, 'INR');
  
  return text;
};

const convertNarrativeCurrencytoday = (narrative) => {
  if (!narrative) return narrative;
  
  if (typeof narrative === 'string') {
    return convertDollarToRupee(narrative);
  }
  
  if (Array.isArray(narrative)) {
    return narrative.map(item => convertNarrativeCurrency(item));
  }
  
  if (typeof narrative === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(narrative)) {
      if (typeof value === 'string') {
        converted[key] = convertDollarToRupee(value);
      } else if (Array.isArray(value)) {
        converted[key] = value.map(item => 
          typeof item === 'string' ? convertDollarToRupee(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        converted[key] = convertNarrativeCurrency(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }
  
  return narrative;
};

const checkIntentAndSend = async (question) => {
    console.log("🔍 Checking intent for:", question);
    
    try {
      const response = await fetch(`${API_BASE_URL}/check_intent/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        console.warn("Intent check failed, defaulting to data analysis");
        await sendMessageWithIntent(question, true);
        return;
      }

      const data = await response.json();
      console.log("✅ Intent classification result:", data.answer);

      if (data.message && data.message.includes("Incomplete question")) {
        console.warn("⚠️ Incomplete question flagged by backend");
        setShowIncompletePopup(true);
        setIsLoading(false);
        return;
      }

      switch (data.answer) {
        case "YES":
          console.log("📊 Routing to data analysis (will check corpus first)");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, true);
          break;

        case "PDF":
          console.log("📄 PDF intent → Routing to DATABASE (PDF treated as DB query)");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, true);
          break;
         
        case "NO":
          console.log("💭 Routing to general knowledge");
          setLastFullQuestion(question);
          await sendMessageWithIntent(question, false);
          break;

        case "UNCERTAIN":
            console.log("❓ Intent uncertain");

            if (fromNextStep || question.split(" ").length > 5) {
              console.warn("⚡ UNCERTAIN but looks like a valid question → routing to SQL");
              await sendMessageWithIntent(question, true, fromNextStep);
              return;
            }

            setInput(question);
            setCustomPopupMessage("⚠️ Please rephrase the question as sensible.");
            setShowIncompletePopup(true);
            setIsLoading(false);
            setPendingBot(null);
            return;
         
        default:
          console.warn("Unknown intent response:", data.answer, "- defaulting to data analysis");
          await sendMessageWithIntent(question, true);
      }
     
    } catch (error) {
      console.error("❌ Intent check error:", error);
      await sendMessageWithIntent(question, true);
    }
  };

  const sendMessageWithIntent = async (question, isDataIntent, fromNextStep = false) => {
    console.log("📤 Sending message with intent:", { question, isDataIntent, fromNextStep });

    const userMessage = {
      sender: "user",
      text: question,
      content: question
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      let endpoint, requestBody;
      
      if (isDataIntent === true) {
        endpoint = `${API_BASE_URL}/ask_question_stream/`;
        requestBody = {
          question: question,
          session_id: sessionIdRef.current,
          db_id: "liberty",
          from_next_step_suggestion: fromNextStep,
        };
        console.log("🔄 Using data analysis endpoint with corpus checking");
        
        setLastFullQuestion(question);
        setLastFullType("db");
        
        await handleStreamingResponse(endpoint, requestBody, question);
        
      } else {
        endpoint = `${API_BASE_URL}/ask_qwen/`;
        requestBody = {
          question: question,
          session_id: sessionIdRef.current,
        };
        console.log("💭 Using general question endpoint");
        
        setLastFullQuestion("");
        setLastFullType("general");
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Qwen response:", data);

        const rawText = data.answer || data.response || "I apologize, but I couldn't generate a response.";
        const normalizedText = convertDollarToRupee(rawText);
        const normalizedSummary = convertDollarToRupee(data.summary || "");

        const botResponse = {
          sender: "bot",
          text: normalizedText,
          content: normalizedText,
          asked_question: question,
          summary: normalizedSummary || null,
          isGeneralResponse: true,
          intentType: false,
          corpus_used: true,
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      
      const errorMessage = {
        sender: "bot",
        text: "I apologize, but I encountered an error processing your question. Please try again.",
        content: "Error occurred",
        asked_question: question,
        isError: true,
        corpus_used: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleStreamingResponse = async (endpoint, requestBody, question) => {
    console.log("🌊 Starting streaming response for:", question);
    
    let wakeLock = null;
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('✅ Wake lock active - tab won\'t throttle');
      }
    } catch (err) {
      console.warn('⚠️ Wake lock not available:', err);
    }
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Connection": "keep-alive",
          "Keep-Alive": "timeout=60"
        },
        body: JSON.stringify(requestBody),
        keepalive: true
      });

      if (!response.ok) {
        if (response.status === 400) {
          console.warn("⚠️ Backend blocked incomplete question");
          setShowIncompletePopup(true);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await handleNDJSONStream(response, question);

    } catch (error) {
      console.error("❌ Error in streaming response:", error);
      
      const isHTTP2Error = error.message?.includes('network error') || 
                           error.message?.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
                           error.message?.includes('ERR_INCOMPLETE_CHUNKED_ENCODING');
      
      if (isHTTP2Error) {
        throw new Error("Connection interrupted due to tab inactivity. Please keep the tab active and try again.");
      }
      
      throw error;
    } finally {
      if (wakeLock) {
        await wakeLock.release();
        console.log('✅ Wake lock released');
      }
    }
  };

  const handleNDJSONStream = async (response, question) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
   
    const initialBotMessage = {
      sender: "bot",
      text: "Processing your request...",
      content: "",
      asked_question: question,
      isStreaming: true,
      corpus_used: false,
      intentType: null
    };

    setIsProcessing(true);
    setMessages(prev => [...prev, initialBotMessage]);
   
    let buffer = '';
    let currentPhase = '';
    let streamingData = {
      summary: '',
      recommendations: [],
      chart_config: null,
      conversational_opener: '',
      narrative: null,
      corpus_used: false,
      intentType: null,
      rows: [],
      sql: ''
    };

    let lastEventTime = Date.now();
    const TIMEOUT_MS = 180000;
    const HEARTBEAT_CHECK_MS = 3000;
    let timeoutCheckInterval = null;
    let receivedFinalEvent = false;

    timeoutCheckInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - lastEventTime;
      
      if (!receivedFinalEvent && timeSinceLastEvent > TIMEOUT_MS) {
        console.error("❌ Stream timeout detected - no events for", timeSinceLastEvent, "ms");
        clearInterval(timeoutCheckInterval);
        reader.cancel();
        
        updateErrorMessage(
          question, 
          "Request timed out. The query may be too complex or the server is overloaded. Please try again or simplify your question."
        );
        setIsLoading(false);
        setIsProcessing(false);
      } else if (timeSinceLastEvent > 30000 && !receivedFinalEvent) {
        console.warn("⚠️ Slow response - still processing...", timeSinceLastEvent, "ms");
        updateStreamingMessage(
          question, 
          `${streamingData.conversational_opener}\n\n${currentPhase}\n\n⏳ Still processing (this is taking longer than usual)...`
        );
      }
    }, HEARTBEAT_CHECK_MS);
   
    try {
      while (true) {
        const { done, value } = await reader.read();
       
        if (done) {
          console.log("✅ Stream completed");
          clearInterval(timeoutCheckInterval);
          
          if (!receivedFinalEvent) {
            console.error("❌ Stream ended without final event");
            updateErrorMessage(
              question,
              "Connection closed unexpectedly. Please try again."
            );
            setIsLoading(false);
            setIsProcessing(false);
          }
          break;
        }

        lastEventTime = Date.now();
       
        buffer += decoder.decode(value, { stream: true });
       
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
       
        for (const line of lines) {
          if (line.trim() === '') continue;
         
          try {
            const event = JSON.parse(line);
            console.log("📡 Stream event:", event);

            const eventType = event.type || event.event;

            switch (eventType) {

              case 'conversational_opener':
                streamingData.conversational_opener = convertDollarToRupee(event.message);
                updateStreamingMessage(question, streamingData.conversational_opener);  // Show once
                break;
                
              case 'phase':
                currentPhase = event.message;
                updateStreamingMessage(question, event.message);  // Don't repeat opener
                break;

              case 'summary':
                streamingData.summary = convertDollarToRupee(event.text);
                updateStreamingMessage(question, streamingData.summary);  // Don't repeat opener
                break;
              // case 'conversational_opener':
              //   streamingData.conversational_opener = convertDollarToRupee(event.message);
              //   updateStreamingMessage(question, `${streamingData.conversational_opener}\n\nAnalyzing your question...`);
              //   break;
               
              // case 'phase':
              //   currentPhase = event.message;
              //   updateStreamingMessage(
              //     question, 
              //     `${streamingData.conversational_opener}\n\n${event.message}`
              //   );
              //   break;

              case 'sql':
                streamingData.sql = event.sql;
                updateStreamingMessage(
                  question, 
                  `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`
                );
                break;

              case 'rows_preview':
                streamingData.rows = event.rows || [];
                updateStreamingMessage(
                  question, 
                  `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`
                );
                break;

              // case 'summary':
              //   streamingData.summary = convertDollarToRupee(event.text);
              //   updateStreamingMessage(
              //     question,
              //     `${streamingData.conversational_opener}\n\n${streamingData.summary}`
              //   );
              //   setIsLoading(false);
              //   setIsProcessing(true);
              //   break;

              case 'recommendation':
                const recoText = convertDollarToRupee(event.text);
                streamingData.recommendations = recoText.split('\n').filter(r => r.trim());
                break;

              case 'chart':
                streamingData.chart_config = event.config;
                break;

              case 'narrative':
                // streamingData.narrative = convertNarrativeCurrency(event.obj);
                // setIsProcessing(false);
                streamingData.narrative = convertNarrativeCurrency(event.obj);
                setIsProcessing(false);
                break;

              case 'meta':
                if (typeof event.corpus_used !== "undefined") {
                  streamingData.corpus_used = event.corpus_used;
                  console.log("📊 Corpus used flag received:", event.corpus_used);
                }
                if (event.intentType) {
                  streamingData.intentType = event.intentType;
                }
                break;

              case 'heartbeat':
                heartbeatCount++;
                lastEventTime = Date.now(); // ✅ Reset timeout on heartbeat
                console.log(`💓 Heartbeat ${heartbeatCount} received`);
                // Don't update UI - just keepalive
                break;

              case 'final':
                receivedFinalEvent = true;
                clearInterval(timeoutCheckInterval);

                const rawSummary = streamingData.summary || event.payload?.summary || "";
                const summaryText = convertDollarToRupee(rawSummary);
                const convOpener = convertDollarToRupee(
                  streamingData.conversational_opener || event.payload?.conversational_opener || ""
                );

                const recosRaw = streamingData.recommendations || event.payload?.recommendation || [];
                const recos = recosRaw.map(convertDollarToRupee);

                let narrativeObj = streamingData.narrative || event.payload?.narrative || null;
                narrativeObj = convertNarrativeCurrency(narrativeObj);

                const finalMessage = {
                  sender: "bot",
                  asked_question: question,
                  content: summaryText,
                  text: summaryText,
                  summary: summaryText,
                  conversational_opener: convOpener,
                  recommendations: recos,
                  chart_config: streamingData.chart_config || event.payload?.chart_config,
                  narrative: narrativeObj,
                  rows: streamingData.rows || event.payload?.rows || [],
                  corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
                  intentType: streamingData.intentType || event.payload?.intentType || true,
                  isStreaming: false,
                  query_used: streamingData.sql || event.payload?.query_used,
                  ...event.payload
                };

                console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
                console.log("📝 Final SQL Used:", finalMessage.query_used);

                updateFinalMessage(question, finalMessage);

                setIsLoading(false);
                setIsProcessing(false);
                break;

              case 'error':
                receivedFinalEvent = true;
                clearInterval(timeoutCheckInterval);
                
                console.error("❌ Stream error:", event.message);
                updateErrorMessage(question, event.message);
                setIsLoading(false);
                setIsProcessing(false);
                break;

              default:
                console.log("⚠️ Unknown event type:", eventType);
            }
           
          } catch (parseError) {
            console.warn("⚠️ Failed to parse stream line:", line, parseError);
          }
        }
      }
     
    } catch (streamError) {
      clearInterval(timeoutCheckInterval);
      console.error("❌ Stream reading error:", streamError);
      
      let errorMessage = "Connection error occurred. ";
      
      if (streamError.name === 'TypeError' && streamError.message.includes('network')) {
        errorMessage += "Please check your internet connection and try again.";
      } else if (streamError.name === 'AbortError') {
        errorMessage += "Request was cancelled. Please try again.";
      } else {
        errorMessage += "Please try again or contact support if the issue persists.";
      }
      
      updateErrorMessage(question, errorMessage);
    } finally {
      clearInterval(timeoutCheckInterval);
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

// ENHANCED NDJSON stream handler with timeout protection and heartbeat detection
const handleNDJSONStreamtoday = async (response, question) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
 
  const initialBotMessage = {
    sender: "bot",
    text: "Processing your request...",
    content: "",
    asked_question: question,
    isStreaming: true,
    corpus_used: false,
    intentType: null
  };

  setIsProcessing(true);
  setMessages(prev => [...prev, initialBotMessage]);
 
  let buffer = '';
  let currentPhase = '';
  let streamingData = {
    summary: '',
    recommendations: [],
    chart_config: null,
    conversational_opener: '',
    narrative: null,
    corpus_used: false,
    intentType: null,
    rows: [],
    sql: ''
  };

  // Timeout protection
  let lastEventTime = Date.now();
  const TIMEOUT_MS = 120000; // 2 minutes max timeout
  const HEARTBEAT_CHECK_MS = 5000; // Check every 5 seconds
  let timeoutCheckInterval = null;
  let receivedFinalEvent = false;

  // Start timeout monitor
  timeoutCheckInterval = setInterval(() => {
    const timeSinceLastEvent = Date.now() - lastEventTime;
    
    if (!receivedFinalEvent && timeSinceLastEvent > TIMEOUT_MS) {
      console.error("❌ Stream timeout detected - no events for", timeSinceLastEvent, "ms");
      clearInterval(timeoutCheckInterval);
      reader.cancel();
      
      updateErrorMessage(
        question, 
        "Request timed out. The query may be too complex or the server is overloaded. Please try again or simplify your question."
      );
      setIsLoading(false);
      setIsProcessing(false);
    } else if (timeSinceLastEvent > 30000 && !receivedFinalEvent) {
      // Show warning after 30 seconds of no updates
      console.warn("⚠️ Slow response - still processing...", timeSinceLastEvent, "ms");
      updateStreamingMessage(
        question, 
        `${streamingData.conversational_opener}\n\n${currentPhase}\n\n⏳ Still processing (this is taking longer than usual)...`
      );
    }
  }, HEARTBEAT_CHECK_MS);
 
  try {
    while (true) {
      const { done, value } = await reader.read();
     
      if (done) {
        console.log("✅ Stream completed");
        clearInterval(timeoutCheckInterval);
        
        // If we never received a final event, treat as error
        if (!receivedFinalEvent) {
          console.error("❌ Stream ended without final event");
          updateErrorMessage(
            question,
            "Connection closed unexpectedly. Please try again."
          );
          setIsLoading(false);
          setIsProcessing(false);
        }
        break;
      }

      // Update last event time on ANY data received
      lastEventTime = Date.now();
     
      buffer += decoder.decode(value, { stream: true });
     
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
     
      for (const line of lines) {
        if (line.trim() === '') continue;
       
        try {
          const event = JSON.parse(line);
          console.log("📡 Stream event:", event);

          const eventType = event.type || event.event;

          switch (eventType) {
            case 'conversational_opener':
              streamingData.conversational_opener = event.message;
              updateStreamingMessage(question, `${event.message}\n\nAnalyzing your question...`);
              break;
             
            case 'phase':
              currentPhase = event.message;
              updateStreamingMessage(
                question, 
                `${streamingData.conversational_opener}\n\n${event.message}`
              );
              break;

            case 'sql':
              streamingData.sql = event.sql;
              updateStreamingMessage(
                question, 
                `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`
              );
              break;

            case 'rows_preview':
              streamingData.rows = event.rows || [];
              updateStreamingMessage(
                question, 
                `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`
              );
              break;

            case 'summary':
              streamingData.summary = event.text;
              updateStreamingMessage(
                question,
                `${streamingData.conversational_opener}\n\n${event.text}`
              );
              // Stop initial loader, start secondary processing
              setIsLoading(false);
              setIsProcessing(true);
              break;

            case 'recommendation':
              streamingData.recommendations = event.text.split('\n').filter(r => r.trim());
              break;

            case 'chart':
              streamingData.chart_config = event.config;
              break;

            case 'narrative':
              streamingData.narrative = event.obj;
              setIsProcessing(false);
              break;

            case 'meta':
              if (typeof event.corpus_used !== "undefined") {
                streamingData.corpus_used = event.corpus_used;
                console.log("📊 Corpus used flag received:", event.corpus_used);
              }
              if (event.intentType) {
                streamingData.intentType = event.intentType;
              }
              break;

            // case 'final':
            //   receivedFinalEvent = true;
            //   clearInterval(timeoutCheckInterval);
              
            //   const finalMessage = {
            //     sender: "bot",
            //     asked_question: question,
            //     content: streamingData.summary || event.payload?.summary || "",
            //     text: streamingData.summary || event.payload?.summary || "",
            //     summary: streamingData.summary || event.payload?.summary,
            //     recommendations: streamingData.recommendations || event.payload?.recommendation || [],
            //     chart_config: streamingData.chart_config || event.payload?.chart_config,
            //     narrative: streamingData.narrative || event.payload?.narrative,
            //     rows: streamingData.rows || event.payload?.rows || [],
            //     corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
            //     intentType: streamingData.intentType || event.payload?.intentType || true,
            //     isStreaming: false,
            //     query_used: streamingData.sql || event.payload?.query_used,
            //     ...event.payload
            //   };

            //   console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
            //   console.log("📝 Final SQL Used:", finalMessage.query_used);

            //   updateFinalMessage(question, finalMessage);

            //   // Always stop both spinners
            //   setIsLoading(false);
            //   setIsProcessing(false);
            //   break;

            case 'final':
              receivedFinalEvent = true;
              clearInterval(timeoutCheckInterval);

              const rawSummary =
                streamingData.summary || event.payload?.summary || "";

              const summaryText = normalizeCurrencyInText(rawSummary);
              const convOpener = normalizeCurrencyInText(
                streamingData.conversational_opener || event.payload?.conversational_opener || ""
              );

              const recosRaw =
                streamingData.recommendations ||
                event.payload?.recommendation ||
                [];
              const recos = recosRaw.map(normalizeCurrencyInText);

              let narrativeObj =
                streamingData.narrative || event.payload?.narrative || null;
              if (narrativeObj && typeof narrativeObj === "object") {
                narrativeObj = {
                  ...narrativeObj,
                  text: normalizeCurrencyInText(narrativeObj.text || narrativeObj.content || "")
                };
              }

              const finalMessage = {
                sender: "bot",
                asked_question: question,
                content: summaryText,
                text: summaryText,
                summary: summaryText,
                conversational_opener: convOpener,
                recommendations: recos,
                chart_config: streamingData.chart_config || event.payload?.chart_config,
                narrative: narrativeObj,
                rows: streamingData.rows || event.payload?.rows || [],
                corpus_used:
                  streamingData.corpus_used || event.payload?.corpus_used || false,
                intentType:
                  streamingData.intentType || event.payload?.intentType || true,
                isStreaming: false,
                query_used: streamingData.sql || event.payload?.query_used,
                ...event.payload
              };

              console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
              console.log("📝 Final SQL Used:", finalMessage.query_used);

              updateFinalMessage(question, finalMessage);

              setIsLoading(false);
              setIsProcessing(false);
              break;


            case 'error':
              receivedFinalEvent = true; // Treat error as completion
              clearInterval(timeoutCheckInterval);
              
              console.error("❌ Stream error:", event.message);
              updateErrorMessage(question, event.message);
              setIsLoading(false);
              setIsProcessing(false);
              break;

            default:
              console.log("⚠️ Unknown event type:", eventType);
          }
         
        } catch (parseError) {
          console.warn("⚠️ Failed to parse stream line:", line, parseError);
        }
      }
    }
   
  } catch (streamError) {
    clearInterval(timeoutCheckInterval);
    console.error("❌ Stream reading error:", streamError);
    
    // Provide user-friendly error message
    let errorMessage = "Connection error occurred. ";
    
    if (streamError.name === 'TypeError' && streamError.message.includes('network')) {
      errorMessage += "Please check your internet connection and try again.";
    } else if (streamError.name === 'AbortError') {
      errorMessage += "Request was cancelled. Please try again.";
    } else {
      errorMessage += "Please try again or contact support if the issue persists.";
    }
    
    updateErrorMessage(question, errorMessage);
  } finally {
    clearInterval(timeoutCheckInterval);
    setIsLoading(false);
    setIsProcessing(false);
  }
};



// Enhanced question submission with retry logic
const handleAskQuestion = async (inputQuestion = null) => {
  const question = (inputQuestion || input).trim();
  
  if (!question) {
    toast.error("Please enter a question");
    return;
  }

  const userMessage = {
    sender: "user",
    text: question,
    asked_question: question
  };

  setMessages(prev => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);
  setIsProcessing(false);

  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ask-stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ 
          question,
          user_id: "admin",
          from_next_step_suggestion: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success - process stream
      await handleNDJSONStream(response, question);
      break; // Exit retry loop on success

    } catch (error) {
      attempt++;
      console.error(`❌ Attempt ${attempt} failed:`, error);

      if (attempt > maxRetries) {
        // All retries exhausted
        const errorMessage = {
          sender: "bot",
          text: `Failed to process your question after ${maxRetries + 1} attempts. ${error.message}. Please try again later.`,
          content: `Failed to process your question after ${maxRetries + 1} attempts. ${error.message}. Please try again later.`,
          isError: true,
          corpus_used: true,
          asked_question: question
        };

        setMessages(prev => {
          const updated = [...prev];
          // Replace the loading message with error
          if (updated[updated.length - 1].asked_question === question) {
            updated[updated.length - 1] = errorMessage;
          }
          return updated;
        });

        setIsLoading(false);
        setIsProcessing(false);
        toast.error("Request failed. Please try again.");
      } else {
        // Retry after delay
        console.log(`🔄 Retrying in 2 seconds... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        updateStreamingMessage(question, `Connection issue detected. Retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
};

  // UPDATED: Enhanced NDJSON stream handler with corpus awareness
  const handleNDJSONStreaminggg = async (response, question) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
   
    const initialBotMessage = {
      sender: "bot",
      text: "Processing your request...",
      content: "",
      asked_question: question,
      isStreaming: true,
      corpus_used: false,
      intentType: null
    };

    setIsProcessing(true); // ✅ show loading state

    setMessages(prev => [...prev, initialBotMessage]);
   
    let buffer = '';
    let currentPhase = '';
    let streamingData = {
      summary: '',
      recommendations: [],
      chart_config: null,
      conversational_opener: '',
      narrative: null,
      corpus_used: false,
      intentType: null,
      rows: [],
      sql: ''
    };
   
    try {
      while (true) {
        const { done, value } = await reader.read();
       
        if (done) {
          console.log("✅ Stream completed");
          break;
        }
       
        buffer += decoder.decode(value, { stream: true });
       
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
       
        for (const line of lines) {
          if (line.trim() === '') continue;
         
          try {
            const event = JSON.parse(line);
            console.log("📡 Stream event:", event);

            const eventType = event.type || event.event;

            switch (eventType) {
              case 'conversational_opener':
                streamingData.conversational_opener = event.message;
                updateStreamingMessage(question, `${event.message}\n\nAnalyzing your question...`);
                break;
               
              case 'phase':
                currentPhase = event.message;
                updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${event.message}`);
                break;

              case 'sql':
                streamingData.sql = event.sql;
                updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`);
                break;

              case 'rows_preview':
                streamingData.rows = event.rows || [];
                updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`);
                break;

              // case 'summary':
              //   streamingData.summary = event.text;
              //   updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${event.text}`);
              //   break;
              case 'summary':
                streamingData.summary = event.text;
                updateStreamingMessage(
                  question,
                  `${streamingData.conversational_opener}\n\n${event.text}`
                );

                // ✅ Stop the initial loader, start secondary processing spinner
                setIsLoading(false);
                setIsProcessing(true);
                break;

              case 'recommendation':
                streamingData.recommendations = event.text.split('\n').filter(r => r.trim());
                break;

              case 'chart':
                streamingData.chart_config = event.config;
                break;

              // case 'narrative':
              //   streamingData.narrative = event.obj;
              //   break;\

              case 'narrative':
                streamingData.narrative = event.obj;
                setIsProcessing(false); // ✅ stop secondary loader
                break;


              case 'meta':
                if (typeof event.corpus_used !== "undefined") {
                  streamingData.corpus_used = event.corpus_used;
                  console.log("📊 Corpus used flag received:", event.corpus_used);
                }
                if (event.intentType) {
                  streamingData.intentType = event.intentType;
                }
                break;

                case 'final':
                  const finalMessage = {
                    sender: "bot",
                    asked_question: question,
                    content: streamingData.summary || "",
                    text: streamingData.summary || "",
                    summary: streamingData.summary,
                    recommendations: streamingData.recommendations,
                    chart_config: streamingData.chart_config,
                    narrative: streamingData.narrative,
                    rows: streamingData.rows,
                    corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
                    intentType: streamingData.intentType || event.payload?.intentType || true,
                    isStreaming: false,
                    query_used: streamingData.sql,
                    ...event.payload
                  };

                  console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
                  console.log("📝 Final SQL Used:", finalMessage.query_used);

                  updateFinalMessage(question, finalMessage);

                  // ✅ Always stop both spinners
                  setIsLoading(false);
                  setIsProcessing(false);  // ensure processing bubble disappears

                  break;


              // case 'final':
              //   const finalMessage = {
              //     sender: "bot",
              //     asked_question: question,
              //     content: streamingData.summary || "",
              //     text: streamingData.summary || "",
              //     summary: streamingData.summary,
              //     recommendations: streamingData.recommendations,
              //     chart_config: streamingData.chart_config,
              //     narrative: streamingData.narrative,
              //     rows: streamingData.rows,
              //     corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
              //     intentType: streamingData.intentType || event.payload?.intentType || true,
              //     isStreaming: false,
              //     query_used: streamingData.sql,
              //     ...event.payload
              //   };
                
              //   console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
              //   console.log("📝 Final SQL Used:", finalMessage.query_used);  // <---- ADD THIS
              //   updateFinalMessage(question, finalMessage);
              //   setIsLoading(false);
              //   setIsProcessing(false); // ✅ stop spinner if narrative not sent

              //   break;

                // return;

              case 'error':
                console.error("❌ Stream error:", event.message);
                updateErrorMessage(question, event.message);
                setIsLoading(false);
                return;

              default:
                console.log("⚠️ Unknown event type:", eventType);
            }
           
          } catch (parseError) {
            console.warn("⚠️ Failed to parse stream line:", line, parseError);
          }
        }
      }
     
    } catch (streamError) {
      console.error("❌ Stream reading error:", streamError);
      updateErrorMessage(question, "Stream processing failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for stream message updates
  const updateStreamingMessage = (question, text) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          text: text,
          content: text,
          isStreaming: true
        };
      }
      return updated;
    });
  };

  const updateFinalMessage = (question, finalMessage) => {
  setMessages(prev => {
    const updated = [...prev];
    const lastIndex = updated.length - 1;
    if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
      updated[lastIndex] = finalMessage;
    }
    return updated;
  });
};


  // const updateFinalMessage = (question, finalMessage) => {
  //   setMessages(prev => {
  //     const updated = [...prev];
  //     const lastIndex = updated.length - 1;
  //     if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
  //       updated[lastIndex] = finalMessage;
  //     }
  //     return updated;
  //   });
  // };

  const updateErrorMessage = (question, errorText) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          text: errorText,
          content: errorText,
          isError: true,
          corpus_used: true, // Errors don't need rating
          isStreaming: false
        };
      }
      return updated;
    });
  };

  // UPDATED: Enhanced submit handler with proper rating checks
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 handleSubmit triggered", { input, hasAskedFirstQuestion });

    if (!input.trim()) return;

    // Only check rating requirement after the first question has been asked
    if (hasAskedFirstQuestion) {
      const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");

      if (lastBotIdx !== -1) {
        const lastBotMsg = messages[lastBotIdx];
        const needsRating = isRatableMessage(lastBotMsg);

        // Block only if response needs rating and hasn't been rated
        if (needsRating && !messageRatings[lastBotIdx]) {
          console.warn("⛔ Blocked: please rate before sending");
          setShowRatingPopup(true);
          return;
        }
      }
    }

    // Mark that first question has been asked
    if (!hasAskedFirstQuestion) {
      setHasAskedFirstQuestion(true);
    }

    const currentInput = input.trim();
    setInput("");

    // Check intent for the question
    await checkIntentAndSend(currentInput);
  };

  // // UPDATED: Enhanced suggestion click handler with next-step support
  // const handleSuggestionClick = (text, isNextStep = false) => {
  //   console.log("🎯 Suggestion clicked:", { text, isNextStep });
    
  //   // Check if we need rating for last response (only for non-next-step clicks)
  //   if (!isNextStep && hasAskedFirstQuestion) {
  //     const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
     
  //     if (lastBotIdx !== -1) {
  //       const lastBotMsg = messages[lastBotIdx];
  //       const needsRating = isRatableMessage(lastBotMsg);
       
  //       if (needsRating && !messageRatings[lastBotIdx]) {
  //         setInput(text);
  //         setShowRatingPopup(true);
  //         return;
  //       }
  //     }
  //   }

  //   setInput(text);
    
  //   if (isNextStep) {
  //     // Next-step suggestions bypass corpus and go directly to SQL generation
  //     console.log("🚀 Next-step suggestion - bypassing corpus check");
  //     setTimeout(() => sendMessageWithIntent(text, true, true), 0);
  //   } else {
  //     // Regular suggestions go through normal intent checking
  //     setTimeout(() => checkIntentAndSend(text), 0);
  //   }
  // };

  // ✅ REPLACE your existing handleSuggestionClick with this
const handleSuggestionClick = (text, isNextStep = false) => {
  console.log("🎯 Suggestion clicked:", { text, isNextStep });
  
  // Validate input
  const questionText = typeof text === 'string' 
    ? text.trim() 
    : (text?.text || text?.question || "").trim();
  
  if (!questionText) {
    console.error("❌ Invalid suggestion:", text);
    return;
  }
  
  // Prevent duplicate submissions
  if (isLoadingRef.current) {
    console.warn("⚠️ Already processing a message");
    return;
  }
  
  // Check if we need rating for last response (only for non-next-step clicks)
  if (!isNextStep && hasAskedFirstQuestion) {
    const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
   
    if (lastBotIdx !== -1) {
      const lastBotMsg = messages[lastBotIdx];
      const needsRating = isRatableMessage(lastBotMsg);
     
      if (needsRating && !messageRatings[lastBotIdx]) {
        setInput(questionText);
        setShowRatingPopup(true);
        return;
      }
    }
  }

  // Set input for visual feedback
  setInput(questionText);
  
  // Process the suggestion
  if (isNextStep) {
    // Next-step suggestions bypass corpus and go directly to SQL generation
    console.log("🚀 Next-step suggestion - bypassing corpus check");
    setTimeout(() => sendMessageWithIntent(questionText, true, true), 0);
  } else {
    // Regular suggestions go through normal intent checking
    setTimeout(() => checkIntentAndSend(questionText), 0);
  }
};

  // UPDATED: Enhanced rating handler
  const handleRating = async (idx, rating, msg) => {
    setMessageRatings((prev) => ({
      ...prev,
      [idx]: rating,
    }));

    if (rating === "yes") {
      try {
        const res = await fetch(`${API_BASE_URL}/save_to_corpus/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: msg.asked_question || msg.content || "",
            asked_question: msg.asked_question || msg.content || "",
            normalized_q: msg.normalized_question || null,
            summary: msg.summary || "",
            recommendations: msg.recommendations || msg.recommendation || [],
            sql: msg.query_used || "",
            chart_config: msg.chart_config || null,
            row_count: msg.rows?.length || 0,
            db_id: "liberty",
            narrative: msg.narrative || null,
            raw_examples: {
              raw_question: msg.asked_question || msg.content || "",
              resolved_question: msg.resolved_question || "",
            },
          }),
        });

        const data = await res.json();
        console.log("✅ Corpus save response:", data);
      } catch (err) {
        console.error("⚠️ Failed to save to corpus:", err);
      }
    } else if (rating === "no") {
      setInput(msg.asked_question || msg.content || "");
    }
  };

  // Intent popup handler
  const handleIntentChoice = async (intentType) => {
    console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);
   
    setShowIntentPopup(false);

    let isDataIntent = false;

    if (intentType === "data") {
      isDataIntent = true;
    } else if (intentType === "pdf") {
      isDataIntent = "pdf";
    }

    await sendMessageWithIntent(pendingQuestion, isDataIntent);
    setPendingQuestion("");
  };

  // All your existing utility functions remain the same...
  // (formatCell, buildHeaderLabel, visibleColumnsForRows, etc.)

  // Existing useEffects and other functions...
  useEffect(() => {
    const connectDatabaseOnce = async () => {
      if (connectOnceRef.current) return;
      connectOnceRef.current = true;

      try {
        const res = await fetch(`${API_BASE_URL}/connect_database/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: "admin" }),
        });

        const data = await res.json();
        if (res.ok) {
          setSessionReady(true);
          console.log("Connected:", data?.message || "ok");
        } else {
          setSessionReady(false);
          console.error("connect_database failed:", data?.error || data);
        }
      } catch (err) {
        setSessionReady(false);
        console.error("Failed to connect to backend DB", err);
      }
    };

    connectDatabaseOnce();
  }, [API_BASE_URL]);

  // Your existing helper functions and styles would go here...
 

// ---------- Unit inference + header/cell helpers ----------
// ---------- Unit inference + header/cell helpers (robust) ----------
const CURRENCY_SYMBOL = "₹";


// const CURRENCY_SYMBOL = "₹";

// Base text converter
const normalizeCurrencyInText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Replace all currency symbols
  result = result.replace(/\$/g, CURRENCY_SYMBOL);
  result = result.replace(/€/g, CURRENCY_SYMBOL);
  result = result.replace(/£/g, CURRENCY_SYMBOL);
  
  // Replace dollar/dollars with rupee/rupees (case insensitive)
  result = result.replace(/\bdollars?\b/gi, (match) => {
    return match.toLowerCase().endsWith('s') ? 'rupees' : 'rupee';
  });
  
  // Replace USD with INR
  result = result.replace(/\bUSD\b/gi, 'INR');
  
  return result;
};

// Deep object converter
const convertNarrativeCurrency = (obj) => {
  if (!obj) return obj;
  
  // Handle strings
  if (typeof obj === 'string') {
    return normalizeCurrencyInText(obj);
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertNarrativeCurrency(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertNarrativeCurrency(value);
    }
    return converted;
  }
  
  return obj;
};

const normalizeCurrencyInTexttoday = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\$/g, CURRENCY_SYMBOL)  // Replace $ with ₹
    .replace(/€/g, CURRENCY_SYMBOL)   // Replace € with ₹
    .replace(/£/g, CURRENCY_SYMBOL);  // Replace £ with ₹
};

// Force-known units (lowercase keys)
const UNIT_MAP = {
  clv: CURRENCY_SYMBOL,
  avg_clv: CURRENCY_SYMBOL,
  total_revenue: CURRENCY_SYMBOL,
  avg_premium: CURRENCY_SYMBOL,
  avg_vehicle_idv: CURRENCY_SYMBOL,
  idv: CURRENCY_SYMBOL,
  gst: CURRENCY_SYMBOL,

  churn_probability: "%",
  retention_rate_pct: "%",
  claim_approval_rate: "%",

  policy_tenure: "Months",
  customer_tenure: "Months",
  policy_start_date_year: "Year",
  policy_end_date_year: "Year",
  policy_start_date_month: "Months",
  policy_end_date_month: "Months",
  policy_start_date_day: "Days",
  policy_end_date_day: "Days",
};

// column names that are almost certainly CATEGORICAL, never add units
const CATEGORICAL_HINTS =
  /\b(segment|customer|name|state|zone|city|branch|make|model|variant|product|channel)\b/i;

const _strip = (v) => String(v ?? "").trim();
const _num = (v) => Number(_strip(v).replace(/[^0-9.\-]/g, ""));
const _isNumeric = (s) => Number.isFinite(_num(s));
const _hasLetters = (s) => /[A-Za-z]/.test(_strip(s));

const _analyzeSamples = (samples) => {
  const n = samples.length || 1;
  const numeric = samples.filter(_isNumeric).length;
  const alpha   = samples.filter(_hasLetters).length;
  return {
    shareNumeric: numeric / n,
    shareAlpha: alpha / n,
    allIntegers: samples
      .filter(_isNumeric)
      .every((s) => Number.isInteger(_num(s))),
  };
};

const normalizeTimeUnit = (unit = "") => {
  const u = unit.toLowerCase();
  if (u.startsWith("year"))  return "Year";
  if (u.startsWith("month")) return "Month";
  if (u.startsWith("week"))  return "Week";
  if (u.startsWith("day"))   return "Day";
  if (u.startsWith("hour"))  return "Hour";
  if (u.startsWith("min"))   return "Minute";
  if (u.startsWith("sec"))   return "Second";
  return unit || "";
};

const pluralizeTimeUnit = (unit, value) => {
  const base = normalizeTimeUnit(unit);
  const v = Math.abs(Number(value));
  return v === 1 ? base : `${base}${base.endsWith("s") ? "" : "s"}`;
};

const cellAlreadyHasTimeUnit = (raw, unit) => {
  const base = normalizeTimeUnit(unit);
  if (!base) return false;
  const re = new RegExp(`\\b${base}(?:s)?\\b`, "i"); // Month/Months, Year/Years, etc.
  return re.test(raw);
};

const inferUnitForColumn = (key, rows) => {
  const k = String(key || "").toLowerCase();
  // treat "_" and "-" like spaces so word-boundary checks work
  const kPlain = k.replace(/[_\-]+/g, " ");
  const nameHas = (re) => re.test(kPlain);

  // never add units to obvious categorical columns
  if (CATEGORICAL_HINTS.test(kPlain)) return { unit: "", type: "text" };

  // explicit map wins (support both raw + normalized keys)
  if (UNIT_MAP[k] || UNIT_MAP[kPlain]) {
    const u = UNIT_MAP[k] || UNIT_MAP[kPlain];
    return {
      unit: u,
      type: ["Year", "Years", "Months", "Weeks", "Days"].includes(u)
        ? "time"
        : u === "%"
        ? "percent"
        : "currency",
    };
  }

  // sample values
  const samples = rows
    .slice(0, 50)
    .map((r) => r?.[key])
    .filter((v) => v !== null && v !== undefined)
    .map(String);

  const { shareNumeric, shareAlpha, allIntegers } = _analyzeSamples(samples);
  const nums = samples.filter(_isNumeric).map(_num);
  const hasPercentSign = samples.some((s) => /%/.test(s));

  // ---- TIME gets priority (names)
  if (nameHas(/\byears?\b|\byrs?\b/))   return { unit: "Years",  type: "time" };
  if (nameHas(/\bmonths?\b/))           return { unit: "Months", type: "time" };
  if (nameHas(/\bweeks?\b/))            return { unit: "Weeks",  type: "time" };
  if (nameHas(/\bdays?\b/))             return { unit: "Days",   type: "time" };
  if (nameHas(/\btenure\b|\bage\b/))    return { unit: "Months", type: "time" }; // default

  // Time by values: mostly numeric integers with typical ranges and no alpha
  if (shareNumeric >= 0.8 && shareAlpha === 0 && allIntegers) {
    if (nums.every((n) => n >= 1900 && n <= 2100)) return { unit: "Year",   type: "time" };
    if (nums.every((n) => n >= 1 && n <= 12))      return { unit: "Months", type: "time" };
    if (nums.every((n) => n >= 1 && n <= 53))      return { unit: "Weeks",  type: "time" };
    if (nums.every((n) => n >= 1 && n <= 31))      return { unit: "Days",   type: "time" };
  }

  // Percent — require a name hint OR actual % signs to avoid month/year counts being % by accident
  if (
    hasPercentSign ||
    nameHas(/\b(pct|percent|percentage|probab|probability|rate|ratio|share)\b/)
  ) {
    if (shareNumeric >= 0.7 && nums.length && nums.every((n) => n >= 0 && n <= 100)) {
      return { unit: "%", type: "percent" };
    }
  }

  // Currency by name/value
  if (
    /\b(revenue|premium|amount|idv|gwp|clv|price|cost|value|payment)\b/.test(kPlain) ||
    samples.some((s) => /[₹$€£]/.test(s))
  ) {
    return { unit: CURRENCY_SYMBOL, type: "currency" };
  }

  return { unit: "", type: "number" };
};


// Replace your existing checkIntentAndSend function with this enhanced version
// const checkIntentAndSend = async (question) => {
//   console.log("🔍 Checking intent for:", question);
 
//   try {
//     const response = await fetch(`${API_BASE_URL}/check_intent/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: question }),
//     });

//     if (!response.ok) {
//       console.warn("Intent check failed, defaulting to general");
//       await sendMessageWithIntent(question, false); // Default to general
//       return;
//     }

//     const data = await response.json();
//     console.log("✅ Intent classification result:", data.answer);

//      // 🆕 Handle incomplete question
//     if (data.message && data.message.includes("Incomplete question")) {
//       console.warn("⚠️ Incomplete question flagged by backend");
//       setShowIncompletePopup(true);
//       setIsLoading(false);
//       return;
//     }

//     switch (data.answer) {
//       case "YES":
//         console.log("📊 Routing to data analysis (DB query)");
//         setLastFullQuestion(question);
//         await sendMessageWithIntent(question, true); // DB query
//         break;
       
//       case "PDF":
//         console.log("📄 Routing to PDF / knowledge base");
//         setLastFullQuestion(question);
//         await sendMessageWithIntent(question, "pdf"); // new route
//         break;
       
//       case "NO":
//         console.log("💭 Routing to general knowledge");
//         setLastFullQuestion(question);
//         await sendMessageWithIntent(question, false);
//         break;

//       case "UNCERTAIN":
//         console.log("❓ Intent uncertain");

//         const qTrim = question.trim().toLowerCase();

//         // 🆕 Case 1: Incomplete starter flagged by backend
//         if (data.message && data.message.includes("Incomplete question")) {
//           if (!lastFullQuestion) {
//             console.warn("⚠️ Incomplete question (first question) → show incomplete popup");
//             setShowIncompletePopup(true);
//             setIsLoading(false);
//             return;
//           } else {
//             const combined = `${lastFullQuestion} ${question}`;
//             console.log("🔗 Auto-merge with last full question:", combined);
//             await sendMessageWithIntent(combined, true);
//             return;
//           }
//         }

//         // 🆕 Case 2: Fragment follow-up ("in March", "in Delhi", etc.)
//         if (/^(in|for|by|on|at)\b/.test(qTrim)) {
//           if (!lastFullQuestion) {
//             // ❌ No history → incomplete popup
//             console.warn("⚠️ Fragment asked as first question → show incomplete popup");
//             setShowIncompletePopup(true);
//             setIsLoading(false);
//             return;
//           } else {
//             // ✅ Merge with last full question
//             const combined = `${lastFullQuestion} ${question}`;
//             console.log("🔗 Auto-merge follow-up fragment:", combined);
//             await sendMessageWithIntent(combined, true);
//             return;
//           }
//         }

//         // Case 3: Normal UNCERTAIN → show intent popup
//         setPendingQuestion(question);
//         setSuggestionList([...(data.related_questions || [])]);
//         setShowIntentPopup(true);
//         setIsLoading(false);
//         setPendingBot(null);
//         break;


       
      // case "UNCERTAIN":
      //   console.log("❓ Intent uncertain, showing popup");
       
      //   // Use the current question as pending
      //   setPendingQuestion(question);

      //   // If backend returns suggestions, use them; otherwise just leave empty
      //   setSuggestionList([
      //     ...(data.related_questions || []),
      //     // ...(data.previous_questions || [])
      //   ]);

      //   setShowIntentPopup(true);
      //   setIsLoading(false);
      //   setPendingBot(null);
      //   break;
       
//       default:
//         console.warn("Unknown intent response:", data.answer, "- defaulting to general");
//         await sendMessageWithIntent(question, false);
//     }
   
//   } catch (error) {
//     console.error("❌ Intent check error:", error);
//     // Fallback to general knowledge on error
//     await sendMessageWithIntent(question, false);
//   }
// };

// Add this new function to handle intent popup choices
// const handleIntentChoice = async (intentType) => {
//   console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);
 
//   setShowIntentPopup(false);

//   let isDataIntent = false;

//   if (intentType === "data") {
//     isDataIntent = true;
//   } else if (intentType === "pdf") {
//     isDataIntent = "pdf"; // special flag for PDF
//   }

//   await sendMessageWithIntent(pendingQuestion, isDataIntent);
 
//   // Clear pending question
//   setPendingQuestion("");
// };


// const handleSubmit = async (e) => {
//   e.preventDefault();
//   console.log("🚀 handleSubmit triggered", { input, hasAskedFirstQuestion });

//   if (!input.trim()) return;

//   // ✅ Only check rating requirement after the first question has been asked
//   if (hasAskedFirstQuestion) {
//     const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");

//     if (lastBotIdx !== -1) {
//       const lastBotMsg = messages[lastBotIdx];
//       const isActualResponse = isRatableMessage(lastBotMsg);

//       // ✅ Block only if response is ratable, not rated, and not corpus
//       if (
//         isActualResponse &&
//         !lastBotMsg.corpus_used &&   // 🚀 skip rating check for corpus answers
//         !messageRatings[lastBotIdx]
//       ) {
//         console.warn("⛔ Blocked: please rate before sending");
//         setShowRatingPopup(true);
//         return;
//       }
//     }
//   }

//   // Mark that first question has been asked
//   if (!hasAskedFirstQuestion) {
//     setHasAskedFirstQuestion(true);
//   }

//   const currentInput = input.trim();

//   // ✅ Clear the input immediately so UI resets
//   setInput("");

//   // Check intent for uncertain questions
//   await checkIntentAndSend(currentInput);
// };



// // Enhanced sendMessageWithIntent with PDF + follow-up tracking support
// const sendMessageWithIntent = async (question, isDataIntent) => {
//   console.log("📤 Sending message with intent:", { question, isDataIntent });
  
//   // Add user message to chat
//   const userMessage = {
//     sender: "user",
//     text: question,
//     content: question
//   };
  
//   setMessages(prev => [...prev, userMessage]);
//   setIsLoading(true);
  
//   try {
//     let endpoint, requestBody;
    
//     if (isDataIntent === true) {
//       // 📊 Data analysis - use streaming endpoint
//       endpoint = `${API_BASE_URL}/ask_question_stream/`;
//       requestBody = {
//         question: question,
//         session_id: sessionIdRef.current,
//         db_id: "liberty", // or your database ID
//       };
//       console.log("🔄 Using data analysis endpoint");
      
//       // ✅ Track last full DB question
//       setLastFullQuestion(question);
//       setLastFullType("db");
      
//       if (USE_STREAMING) {
//         await handleStreamingResponse(endpoint, requestBody, question);
//       } else {
//         await handleRegularResponse(endpoint, requestBody, question);
//       }
      
//     } else if (isDataIntent === "pdf") {
//       // 📄 PDF/vector knowledge base
//       endpoint = `${API_BASE_URL}/askbot`;
//       requestBody = {
//         query: question,
//         session_id: sessionIdRef.current,
//       };
//       console.log("📄 Using PDF/vector knowledge base endpoint (ask_questionbot)");
      

//       // ✅ Track last full PDF question (optional merge)
//       setLastFullQuestion(question);
//       setLastFullType("pdf");
      
//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log("✅ PDF/vector response:", data);
      
//       const botResponse = {
//         sender: "bot",
//         text: data.answer || "I couldn't find an answer in the knowledge base.",
//         content: data.answer || "",
//         asked_question: question,
//         summary: data.summary || null,
//         isPdfResponse: true, // marker so UI knows this came from PDF
//         intentType: "pdf", // Add this for rating logic
//         corpus_used: true, // Add this flag to prevent rating
//       };
      
//       setMessages(prev => [...prev, botResponse]);
//       setIsLoading(false);
      
//     } else {
//       // 💭 General knowledge - use Qwen endpoint
//       endpoint = `${API_BASE_URL}/ask_qwen/`;
//       requestBody = {
//         question: question,
//         session_id: sessionIdRef.current,
//       };
//       console.log("💭 Using general question endpoint (ask_qwen)");
      
//       // ❌ Don't track general questions for follow-ups
//       setLastFullQuestion("");
//       setLastFullType("general");
      
//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log("✅ Qwen response:", data);
      
//       const botResponse = {
//         sender: "bot",
//         text: data.answer || data.response || "I apologize, but I couldn't generate a response.",
//         content: data.answer || data.response || "",
//         asked_question: question,
//         summary: data.summary || null,
//         isGeneralResponse: true,
//         intentType: false, // Add this for rating logic
//         corpus_used: false, // General responses don't need rating either
//       };
      
//       setMessages(prev => [...prev, botResponse]);
//       setIsLoading(false);
//     }
    
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
    
//     const errorMessage = {
//       sender: "bot",
//       text: "I apologize, but I encountered an error processing your question. Please try again.",
//       content: "Error occurred",
//       asked_question: question,
//       isError: true,
//       corpus_used: false, // Error messages don't need rating
//     };
    
//     setMessages(prev => [...prev, errorMessage]);
//     setIsLoading(false);
//   }
// };

// // Enhanced streaming response handler to include corpus_used flag
// const handleStreamingResponse = async (endpoint, requestBody, question) => {
//   // Your existing streaming logic, but ensure to add corpus_used to final message
//   // When building the final bot message, include:
  
//   const finalBotMessage = {
//     // ... your existing properties ...
//     intentType: true, // This is data analysis
//     corpus_used: data.corpus_used || false, // Get from backend response
//     // ... rest of properties ...
//   };
// };

// Enhanced regular response handler
const handleRegularResponse = async (endpoint, requestBody, question) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  const botMessage = {
    sender: "bot",
    text: data.answer || data.summary || "Analysis completed",
    content: data.answer || data.summary || "",
    summary: data.summary || "",
    recommendation: data.recommendation || [],
    rows: data.rows || [],
    chart_config: data.chart_config || null,
    narrative: data.narrative || null,
    asked_question: question,
    intentType: true, // Data analysis
    corpus_used: data.corpus_used || false, // Key flag from backend
    query_used: data.query_used || "",
    response_time: data.response_time || ""
  };
  
  setMessages(prev => [...prev, botMessage]);
  setIsLoading(false);
};
// All your existing streaming functions remain the same
// const handleStreamingResponse = async (endpoint, requestBody, question) => {
//   console.log("🌊 Starting streaming response for:", question);
 
//   try {
//     const response = await fetch(endpoint, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(requestBody),
//     });

//     // if (!response.ok) {
//     //   throw new Error(`HTTP error! status: ${response.status}`);
//     // }
//     if (!response.ok) {
//       if (response.status === 400) {
//         console.warn("⚠️ Backend blocked incomplete question");
//         setShowIncompletePopup(true);
//         setIsLoading(false);
//         return;
//       }
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }


//     // Handle NDJSON streaming response
//     await handleNDJSONStream(response, question);

//   } catch (error) {
//     console.error("❌ Error in streaming response:", error);
//     throw error;
//   }
// };

// const handleNDJSONStream = async (response, question) => {
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();
 
//   // Create initial bot message that will be updated during streaming
//   const initialBotMessage = {
//     sender: "bot",
//     text: "Processing your request...",
//     content: "",
//     asked_question: question,
//     isStreaming: true,
//     corpus_used: false,
//     intentType: null
//   };
 
//   setMessages(prev => [...prev, initialBotMessage]);
 
//   let buffer = '';
//   let currentPhase = '';
//   let streamingData = {
//     summary: '',
//     recommendations: [],
//     chart_config: null,
//     conversational_opener: '',
//     narrative: null
//   };
 
//   try {
//     while (true) {
//       const { done, value } = await reader.read();
     
//       if (done) {
//         console.log("✅ Stream completed");
//         break;
//       }
     
//       buffer += decoder.decode(value, { stream: true });
     
//       // Process complete lines (NDJSON format)
//       const lines = buffer.split('\n');
//       buffer = lines.pop() || ''; // Keep incomplete line in buffer
     
//       for (const line of lines) {
//         if (line.trim() === '') continue;
       
//         try {
//           const event = JSON.parse(line);
//           console.log("📡 Stream event:", event);

//           // Support both backend styles: "type" or "event"
//           const eventType = event.type || event.event;

//           switch (eventType) {
//             case 'conversational_opener':
//               streamingData.conversational_opener = event.message;
//               updateStreamingMessage(question, `${event.message}\n\nAnalyzing your question...`);
//               break;
             
//             case 'phase':
//               currentPhase = event.message;
//               updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${event.message}`);
//               break;

//             case 'sql':
//               updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`);
//               break;

//             case 'rows_preview':
//               updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`);
//               break;

//             case 'summary':
//               streamingData.summary = event.text;
//               updateStreamingMessage(question, `${streamingData.conversational_opener}\n\n${event.text}`);
//               break;

//             case 'recommendation':
//               streamingData.recommendations = event.text.split('\n').filter(r => r.trim());
//               break;

//             case 'chart':
//               streamingData.chart_config = event.config;
//               break;

//             case 'narrative':
//               streamingData.narrative = event.obj;
//               break;

//             case 'meta':
//                 if (typeof event.corpus_used !== "undefined") {
//                   streamingData.corpus_used = event.corpus_used;
//                 }
//                 if (event.intentType) {
//                   streamingData.intentType = event.intentType;
//                 }
//                 break;

//               case 'final':
//                 const finalMessage = {
//                   sender: "bot",
//                   asked_question: question,
//                   content: streamingData.summary || "",
//                   recommendations: streamingData.recommendations,
//                   chart_config: streamingData.chart_config,
//                   narrative: streamingData.narrative,
//                   corpus_used: streamingData.corpus_used,   // ✅ propagate corpus_used
//                   intentType: streamingData.intentType,     // ✅ propagate intentType
//                   isStreaming: false,
//                   ...event.payload
//                 };
//                 updateFinalMessage(question, finalMessage);
//                 setIsLoading(false);
//                 return;

//             case 'error':
//               console.error("❌ Stream error:", event.message);
//               updateErrorMessage(question, event.message);
//               setIsLoading(false);
//               return;

//             default:
//               console.log("⚠️ Unknown event type:", eventType);
//           }
         
//         } catch (parseError) {
//           console.warn("⚠️ Failed to parse stream line:", line, parseError);
//         }
//       }
//     }
   
//   } catch (streamError) {
//     console.error("❌ Stream reading error:", streamError);
//     updateErrorMessage(question, "Stream processing failed");
//   } finally {
//     setIsLoading(false);
//   }
// };

// const handleRegularResponse = async (endpoint, requestBody, question) => {
//   const response = await fetch(endpoint, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(requestBody),
//   });

//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }

//   const data = await response.json();
//   console.log("📊 Data analysis response:", data);
 
//   const botResponse = {
//     sender: "bot",
//     text: data.summary || data.answer || "Analysis completed",
//     content: data.summary || data.answer || "",
//     asked_question: question,
//     summary: data.summary || null,
//     rows: data.rows || [],
//     chart_config: data.chart_config || null,
//     recommendation: data.recommendation || null,
//     narrative: data.narrative || null,
//     query_used: data.query_used || null,
//   };
 
//   setMessages(prev => [...prev, botResponse]);
//   setIsLoading(false);
// };

const sendMessageWithQuestion = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask_question/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, user_id: "admin" }) // no session_id
    });
    const data = await response.json();

    // if (import.meta.env.DEV && data.query_used) {
    if (data.query_used) {
      console.groupCollapsed("SQL debug");
      console.log("SQL:", data.query_used);
      console.log("Row count:", data.row_count);
      console.log("Response time:", data.response_time);
      console.groupEnd();
    }

    const botMsg = {
      sender: "bot",
      role: "assistant",
      content: data.answer,
      summary: data.summary ?? null,
      recommendation: data.recommendation ?? null,
      rows: data.rows ?? [],
      chart_config: data.chart_config ?? null,
      asked_question: question,
      query_used: data.query_used ?? null,
      time_scope: data.time_scope ?? null,
      narrative: data.narrative ?? null,
    };

    const updatedMessages = [...messages, botMsg];
    setMessages(updatedMessages);
    setInput("");

    // Dynamic suggestions after each turn
    const newSuggestions = generateDynamicSuggestions(updatedMessages, "database", {}, true);
    setSuggestions(newSuggestions);
  } catch (err) {
    const botMsg = {
      sender: "bot",
      role: "assistant",
      content: "Something went wrong while processing your question. Please try again."
    };
    setMessages((prev) => [...prev, botMsg]);
    setInput("");
  } finally {
    setIsLoading(false);
  }
};

const sendMessageStreamWithQuestion = async (question) => {
  if (!question.trim() || isLoading) return;

  setIsLoading(true);
 
  const userMsg = { sender: "user", role: "user", content: question };
  setMessages((prev) => [...prev, userMsg]);

  // Initialize streaming bot message
  const initialBot = {
    sender: "bot",
    role: "assistant",
    content: "",
    summary: null,
    recommendation: null,
    rows: [],
    chart_config: null,
    asked_question: question,
    query_used: null,
    time_scope: null,
    narrative: null,
    sqlReady: false,
    dataReady: false,
  };
 
  setPendingBot(initialBot);

  try {
    const response = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, user_id: "admin" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let finalBot = { ...initialBot };

    await readNdjson(response, (event) => {
      console.log("📦 Stream event:", event);

      if (event.type === "sql_generated") {
        finalBot = {
          ...finalBot,
          query_used: event.sql || "",
          sqlReady: true,
        };
        setPendingBot({ ...finalBot });
      }

      if (event.type === "data_loaded") {
        finalBot = {
          ...finalBot,
          rows: event.rows || [],
          chart_config: event.chart_config || null,
          dataReady: true,
        };
        setPendingBot({ ...finalBot });
      }

      if (event.type === "summary_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          summary: (finalBot.summary || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (event.type === "narrative_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          narrative: (finalBot.narrative || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (event.type === "recommendation_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          recommendation: (finalBot.recommendation || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (event.type === "complete") {
        console.log("✅ Stream complete");
        finalBot = {
          ...finalBot,
          content: finalBot.summary || finalBot.narrative || "Query completed.",
        };
       
        // Move from pending to actual messages
        setMessages((prev) => [...prev, finalBot]);
        setPendingBot(null);
       
        // Generate dynamic suggestions
        const updatedMessages = [...messages, userMsg, finalBot];
        const newSuggestions = generateDynamicSuggestions(updatedMessages, "database", {}, true);
        setSuggestions(newSuggestions);
       
        setIsLoading(false);
      }
    });

    setInput("");
   
  } catch (error) {
    console.error("❌ Streaming error:", error);
   
    const errorBot = {
      sender: "bot",
      role: "assistant",
      content: "Something went wrong while processing your question. Please try again.",
    };
   
    setMessages((prev) => [...prev, errorBot]);
    setPendingBot(null);
    setInput("");
    setIsLoading(false);
  }
};

const shouldShowRating = (msg, idx) => {
  // Don't show if it's a corpus response
  if (msg.corpus_used) return false;
  
  // Don't show if it's PDF/general knowledge
  if (msg.intentType === "pdf" || msg.intentType === false) return false;
  
  // Don't show if not a bot message
  if (msg.sender !== "bot") return false;
  
  // Don't show if user hasn't asked first question
  if (!hasAskedFirstQuestion) return false;
  
  // Don't show if already rated
  if (messageRatings[idx]) return false;
  
  // Only show for actual database analysis
  return isRatableMessage(msg);
};

const CUSTOM_HEADER_LABELS = {
  max_year:        "Policy End Year",
  min_year:        "Start Year",        // (optional) if you want this too
  data_end_year:   "Policy End Year",
  data_start_year: "Start Year",
  scope_end_year:  "Policy End Year",
  scope_start_year:"Start Year",
};

const buildHeaderLabel = (key, rows) => {
  const rawKey = String(key || "").toLowerCase();

  // 👇 If we have an override, use it exactly as-is (no unit suffix)
  if (CUSTOM_HEADER_LABELS[rawKey]) {
    return CUSTOM_HEADER_LABELS[rawKey];
  }

  const { unit } = inferUnitForColumn(key, rows);
  const base = formatHeader(key); // e.g., "Max Year"

  if (!unit) return base;

  // strip trailing unit-y words to avoid "Year (Year)"
  const cleaned = base
    .replace(/\s*%$/i, "")
    .replace(/\s*\b(Years?|Months?|Weeks?|Days?)\b$/i, "")
    .trim();

  return `${cleaned} (${unit})`;
};



//   const handleRating = async (idx, rating, msg) => {
//   setMessageRatings((prev) => ({
//     ...prev,
//     [idx]: rating,
//   }));

//   if (rating === "yes") {
//     try {
//       const res = await fetch(`${API_BASE_URL}/save_to_corpus/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           question: msg.asked_question || msg.content || "",
//           asked_question: msg.asked_question || msg.content || "",
//           normalized_q: msg.normalized_question || null,   // ✅ for entity-aware rewrite
//           summary: msg.summary || "",
//           recommendations: msg.recommendations || msg.recommendation || [], // ✅ handle both
//           sql: msg.query_used || "",
//           chart_config: msg.chart_config || null,
//           row_count: msg.rows?.length || 0,
//           db_id: "liberty",
//           narrative: msg.narrative || null,
//           raw_examples: {
//             raw_question: msg.asked_question || msg.content || "",
//             resolved_question: msg.resolved_question || "",
//           },
//         }),
//       });

//       const data = await res.json();
//       console.log("✅ Corpus save response:", data);
//     } catch (err) {
//       console.error("⚠️ Failed to save to corpus:", err);
//     }
//   } else if (rating === "no") {
//     setInput(msg.asked_question || msg.content || "");
//   }
// };


 
  // const handleSuggestionClick = (text) => {
  //   // Check if we have asked the first question and if last response needs rating
  //   if (hasAskedFirstQuestion) {
  //     const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
     
  //     if (lastBotIdx !== -1) {
  //       const lastBotMsg = messages[lastBotIdx];
  //       const isActualResponse = isRatableMessage(lastBotMsg);
       
  //       // Only require rating for actual responses (not welcome messages)
  //       if (isActualResponse && !messageRatings[lastBotIdx]) {
  //         setInput(text); // Set the suggestion text in input
  //         setShowRatingPopup(true); // Show rating popup
  //         return;
  //       }
  //     }
  //   }

  //   setInput(text);
  //   setTimeout(() => checkIntentAndSend(text), 0);
  // };

  // const handleKeyDown = (e) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSubmit(e);
  //   }
  // };
// const handleSuggestionClick = (text, isFromNextStep = false) => {
//   console.log("🎯 Suggestion clicked:", { text, isFromNextStep });
  
//   // Check rating requirement for previous messages
//   if (hasAskedFirstQuestion) {
//     const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
    
//     if (lastBotIdx !== -1) {
//       const lastBotMsg = messages[lastBotIdx];
//       const isActualResponse = isRatableMessage(lastBotMsg);
      
//       // Only require rating for actual responses that aren't from corpus
//       if (isActualResponse && !lastBotMsg.corpus_used && !messageRatings[lastBotIdx]) {
//         setInput(text);
//         setShowRatingPopup(true);
//         return;
//       }
//     }
//   }

//   setInput(text);
//   setFromNextStepSuggestion(isFromNextStep); // Track the flag
  
//   // Send immediately with the next-step flag
//   setTimeout(() => checkIntentAndSend(text, false, isFromNextStep), 0);
// };
 

  const getButtonStyle = () => {
    let buttonStyle = { ...styles.button };
    if (isLoading || !sessionReady) {
      buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
    } else if (buttonHovered) {
      buttonStyle = { ...buttonStyle, ...styles.buttonHover };
    }
    return buttonStyle;
  };

  const getInputStyle = () => {
    let inputStyle = { ...styles.input };
   
    if (inputFocused) {
      inputStyle = { ...inputStyle, ...styles.inputFocused };
    }
   
    return inputStyle;
  };



const formatCellWithUnit = (val, key, rows) => {
  const { type, unit } = inferUnitForColumn(key, rows);
  const raw = String(val ?? "").trim();
  if (!raw) return "";

  const n = Number(raw.replace(/[^0-9.\-]/g, ""));
  const isNum = Number.isFinite(n);

  // If it's clearly text (e.g., "Elite Retainers"), return as-is
  if (!isNum && /[A-Za-z]/.test(raw)) return raw;

  // Percent formatting
  if (type === "percent") {
    if (raw.endsWith("%")) return raw;
    const numStr = n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return `${numStr}%`;
  }

  // Time units
  if (type === "time") {
    const baseUnit = normalizeTimeUnit(unit);

    // Special case: plain calendar year (4 digits like 2025) → no commas, no suffix
    if (baseUnit === "Year" && isNum && /^\d{4}$/.test(String(Math.trunc(n)))) {
      return String(Math.trunc(n));   // ✅ shows 2025
    }

    if (cellAlreadyHasTimeUnit(raw, unit)) return raw;
    const unitLabel = pluralizeTimeUnit(baseUnit, n);
    const out =
      baseUnit === "Year"
        ? String(Math.trunc(n))       // ✅ avoid "2,025"
        : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return `${out} ${unitLabel}`;
  }

  // Default numeric/text formatting
  return formatCell(val);
};


const HIDE_COLUMNS = new Set([
  "policy_start_date_year",
  "min_year",          // data/scope start
  "start_year",
  "scope_start_year",
  "data_start_year"
]);

const isStartYearKey = (k) => {
  const s = String(k).toLowerCase();
  if (HIDE_COLUMNS.has(s)) return true;
  // catches: "min_year", "start_year", "policy_start_date_year",
  // "Data Start (Year)", "Scope Start (Year)", etc.
  return /(^|[^a-z])(min|start)[^a-z]*year/i.test(k);
};

// const isEndYearKey = (k) => {
//   // catches: "max_year", "end_year", "policy_end_date_year",
//   // "Data End (Year)", "Scope End (Year)", etc.
//   return /(^|[^a-z])(Policy end year|end)[^a-z]*year/i.test(k);
// };

const isEndYearKey = (k) => {
  const s = String(k).toLowerCase();

  return (
    s.includes("end_year") ||
    s.includes("end_date_year") ||
    (s.includes("end") && s.includes("year"))
  );
};



// const preferEndYearKey = (keys) => {
//   const pref = ["max_year", "data_end_year", "scope_end_year", "policy_end_date_year", "end_year"];
//   for (const p of pref) {
//     const hit = keys.find((k) => k.toLowerCase() === p);
//     if (hit) return hit;
//   }
//   // fallback: first end-year-looking key
//   return keys[0] || null;
// };

const preferEndYearKey = (keys) => {
  const priority = [
    "policy_end_date_year",
    // "policy_end_year",
    "date_end_year",
    "scope_end_year",
    "max_year",
    "end_year"
  ];

  const lower = keys.map(k => k.toLowerCase());

  for (const p of priority) {
    const idx = lower.indexOf(p);
    if (idx !== -1) return keys[idx];
  }

  return keys[0] || null;
};



// const visibleColumnsForRows = (rows) => {
//   if (!rows?.length) return [];
//   const all = Object.keys(rows[0] || {});

//   // 1) drop all start-year-like columns
//   const noStarts = all.filter((k) => !isStartYearKey(k));

//   // 2) dedupe end-year columns — keep only one
//   const endKeys = noStarts.filter(isEndYearKey);
//   if (endKeys.length <= 1) return noStarts;

//   const keep = preferEndYearKey(endKeys.map((k) => k.toLowerCase()));
//   return noStarts.filter((k) => !isEndYearKey(k) || k.toLowerCase() === keep);
// };

const visibleColumnsForRows = (rows) => {
  if (!rows?.length) return [];
  const all = Object.keys(rows[0] || {});

  // 1) drop all start-year-like columns
  const noStarts = all.filter((k) => !isStartYearKey(k));

  // 2) find end-year columns
  const endKeys = noStarts.filter(isEndYearKey);
  if (endKeys.length <= 1) return noStarts;

  // 3) decide which one to keep (case-insensitive, but return ORIGINAL key)
  const keepLower = preferEndYearKey(endKeys.map(k => k.toLowerCase()));
  const keepOriginal = endKeys.find(k => k.toLowerCase() === keepLower);

  // 4) filter out other end-year columns
  return noStarts.filter(
    (k) => !isEndYearKey(k) || k === keepOriginal
  );
};

// Use this instead of plain formatCell() when rendering table cells.
const formatCellForColumn = (key, val, rows) => {
  const { type, unit } = inferUnitForColumn(key, rows);

  if (val === null || val === undefined) return "";

  // 🔥 FIX: Handle ID columns - return raw value without formatting
  const keyLower = key.toLowerCase();
  if (keyLower.includes('id') || 
      keyLower.includes('customerid') || 
      keyLower.includes('policy') ||
      keyLower === 'customer_id') {
    return String(val); // Return as-is, no commas
  }

  // Percent columns -> ensure % in cell
  // if (type === "percent") {
  //   const s = String(val).trim();
  //   const isPercent = /\s*%$/.test(s);
  //   if (isPercent) return formatCell(s);
  //   const num = typeof val === "number" ? val : Number(s.replace(/,/g, ""));
  //   if (Number.isFinite(num)) {
  //     const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  //     return `${formatted}%`;
  //   }
  //   return s;
  // }

  // Percent columns -> ensure correct % rendering
if (type === "percent") {
  const s = String(val).trim();

  // Already formatted (e.g., "61.06%")
  // if (/%$/.test(s)) return s;
  // if (/%$/.test(s)) return `${Math.round(parseFloat(s))}%`;
      if (/%$/.test(s)) {
    // ✅ Config based:
    return FORMAT_CONFIG.ROUND_PERCENTAGES 
      ? `${Math.round(parseFloat(s))}%` 
      : s;
  }


  const num = typeof val === "number"
    ? val
    : Number(s.replace(/,/g, ""));

  if (!Number.isFinite(num)) return s;

  // 🔥 KEY FIX:
  // Fraction → convert to percentage
  // if (num > 0 && num <= 1) {
  //   return `${(num * 100).toFixed(2)}%`;
  // }
  if (num > 0 && num <= 1) {
    return `${Math.round(num * 100)}%`;   // Fix 2
}
  // Already a percentage number
  // return `${num.toFixed(2)}%`;
  // return `${Math.round(num)}%`; 
  return formatPercentage(num);
}


  // TIME columns
  if (type === "time") {
    // For Year specifically: return raw integer string (no commas)
    if (unit === "Year") {
      const s = String(val).trim();
      const n = typeof val === "number" ? val : Number(s.replace(/[^0-9\-]/g, ""));
      return Number.isFinite(n) ? String(Math.trunc(n)) : s;  // ✅ no comma
    }
    // For Month/Week/Day, keep your normal numeric formatting (usually no commas anyway)
    return formatCell(val);
  }

  // Currency columns
  // Currency columns
    if (type === "currency") {
      const num = typeof val === "number"
        ? val
        : Number(String(val).replace(/[^0-9.\-]/g, ""));

      if (Number.isFinite(num)) {
        if (FORMAT_CONFIG.ROUND_CURRENCY) {
          return `${CURRENCY_SYMBOL}${Math.round(num).toLocaleString("en-IN")}`;
        } else {
          return `${CURRENCY_SYMBOL}${num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
      }
    }

      return String(val);
    }

  // Currency/number/text -> your existing behavior
  return formatCell(val);
};


// Format when the entire answer is just a number (optionally with %, commas, decimals)
const formatStandaloneNumber = (text) => {
  const s = String(text ?? "").trim();
  if (!s) return null;

  // numeric like 1234, 1,234.567, -45.9, 88%
  const numericLike =
    /^-?\d+(?:,\d{3})*(?:\.\d+)?%?$/.test(s) ||
    /^-?\d+(?:\.\d+)?%?$/.test(s);

  if (!numericLike) return null;

  // Reuse your existing numeric formatter (0 decimals, keeps % if present)
  return formatCell(s);
};




    useEffect(() => {
      const defaultSuggestions = generateDynamicSuggestions([], 'database', {}, true);
      setSuggestions(defaultSuggestions);
    }, []);

    const currentPlaceholder = !inputFocused && !input
      ? SUGGESTION_TEMPLATES.general[loopingSuggestionIndex]
      : '';

   useEffect(() => {
  const connectDatabaseOnce = async () => {
    if (connectOnceRef.current) return; // guard StrictMode double call
    connectOnceRef.current = true;

    try {
      const res = await fetch(`${API_BASE_URL}/connect_database/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // If you want per-user memory, send a stable user_id:
        body: JSON.stringify({ user_id: "admin" }),
        // If you later switch to cookie sessions on the backend, add:
        // credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSessionReady(true);
        console.log("Connected:", data?.message || "ok");
      } else {
        setSessionReady(false);
        console.error("connect_database failed:", data?.error || data);
      }
    } catch (err) {
      setSessionReady(false);
      console.error("Failed to connect to backend DB", err);
    }
  };

  connectDatabaseOnce();
}, [API_BASE_URL]);


    // useEffect(() => {
    //   if (messagesEndRef.current) {
    //     messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    //   }
    // }, [messages]);

    useEffect(() => {
  const last = messages[messages.length - 1];
  if (!last || last.sender !== "bot") return;

  // Scroll to the *top* of the latest bot message, not bottom
  const id = setTimeout(() => {
    if (lastMsgRef.current && chatBoxRef.current) {
      lastMsgRef.current.scrollIntoView({ block: "start", behavior: "auto" });
      chatBoxRef.current.scrollTop -= 8; // optional offset so bubble isn't flush to top
    }
  }, 0);

  return () => clearTimeout(id);
}, [messages]);

    const normalize = (s = "") => s.replace(/[^\w]/g, "").toLowerCase();

const shouldShowContent = (msg) => {
  const raw = (msg.content || msg.text || "").trim();
  if (!raw) return false;

  // Hide "Found N results" banners
  if (/^found\s+\d+\s+results/i.test(raw)) return false;

  // Hide plain numeric answers like "40362"
  if (/^\d{1,3}(,\d{3})*$/.test(raw)) return false;

  // If summary exists, hide content that is redundant
  if (msg.summary) {
    const c = normalize(raw);
    const s = normalize(String(msg.summary));
    if (c && s.includes(c)) return false;
    if (/^(there\s+(were|are)|total)\b/i.test(raw)) return false;
  }

  return true;
};


   const downloadCSV = async (questionText) => {
    try {
      const encodedQuestion = encodeURIComponent(questionText || "");
      const url = `${API_BASE_URL}/ask_question/?export=true&question=${encodedQuestion}`;
      const response = await fetch(url, { method: "GET", headers: { Accept: "text/csv" } });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Download failed: ${errorText}`);
        return;
      }
      const blob = await response.blob();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const filename = `export_${timestamp}.csv`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };


const downloadCSVFromRows = (rows, filePrefix = 'export') => {
  if (!rows || rows.length === 0) return;
  
  try {
    const cols = visibleColumnsForRows(rows);
    
    // Create headers
    const headers = cols.map(key => buildHeaderLabel(key, rows)).join(',');
    
    // Create CSV rows
    const csvRows = rows.map(row => 
      cols.map(key => {
        const val = row[key] ?? '';
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = String(val).replace(/"/g, '""');
        return (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    );
    
    // Combine headers and rows
    const csv = [headers, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
};





//   const handleSubmit = (e) => {
//   e.preventDefault();
//   console.log("🚀 handleSubmit triggered", { input });

//   // ✅ Check if last bot message exists and isn’t rated yet
//   const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
//   const needsRating =
//     lastBotIdx !== -1 &&
//     !messageRatings[lastBotIdx] && // no rating stored
//     input.trim();

//   if (needsRating) {
//     console.warn("⛔ Blocked: please rate before sending");
//     setShowRatingPopup(true);
//     return;
//   }

//   if (!input.trim()) return;

//   USE_STREAMING ? sendMessageStream(input) : sendMessage();
// };


// const updateStreamingMessage = (question, text) => {
//   setMessages(prev => {
//     const updated = [...prev];
//     // Find the last message for this question
//     const lastIndex = updated.length - 1;
//     if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
//       updated[lastIndex] = {
//         ...updated[lastIndex],
//         text: text,
//         content: text,
//         isStreaming: true
//       };
//     }
//     return updated;
//   });
// };

// const updateFinalMessage = (question, finalData) => {
//   setMessages(prev => {
//     const updated = [...prev];
//     const lastIndex = updated.length - 1;
//     if (updated[lastIndex] && updated[lastIndex].sender === "bot") {
//       updated[lastIndex] = {
//         sender: "bot",
//         text: finalData.summary || "Analysis completed",
//         content: finalData.summary || "",
//         asked_question: question,
//         summary: finalData.summary || null,
//         rows: finalData.rows || [],
//         chart_config: finalData.chart_config || null,
//         recommendation: finalData.recommendation || [],
//         narrative: finalData.narrative || null,
//         query_used: finalData.query_used || null,
//         response_time: finalData.response_time || null,
//         conversational_opener: finalData.conversational_opener || null,
//         isStreaming: false
//       };
//     }
//     return updated;
//   });
// };

useEffect(() => {
  if (messages.some(m => m.sender === "bot")) {
    setHasAskedFirstQuestion(true);
  }
}, [messages]);

// const updateFinalMessage = (question, finalData) => {
//   setMessages(prev => {
//     const updated = [...prev];
//     const lastIndex = updated.length - 1;
//     if (updated[lastIndex] && updated[lastIndex].sender === "bot") {
//       updated[lastIndex] = {
//         ...updated[lastIndex],   // ✅ keep existing values
//         ...finalData,            // ✅ merge everything from backend (including corpus_used)
//         sender: "bot",
//         text: finalData.summary || "Analysis completed",
//         content: finalData.summary || "",
//         isStreaming: false
//       };
//     }
//     return updated;
//   });
// };


// const updateErrorMessage = (question, errorMsg) => {
//   setMessages(prev => {
//     const updated = [...prev];
//     const lastIndex = updated.length - 1;
//     if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
//       updated[lastIndex] = {
//         sender: "bot",
//         text: `I apologize, but I encountered an error: ${errorMsg}`,
//         content: "Error occurred during streaming",
//         asked_question: question,
//         isError: true,
//         isStreaming: false
//       };
//     }
//     return updated;
//   });
// };
   

  // Your existing sendMessageWithIntent function should be here

  // const sendMessageWithIntent = async (question, isDataIntent) => {
  //   console.log("📤 Sending message with intent:", { question, isDataIntent });
   
  //   // Add user message to chat
  //   const userMessage = {
  //     sender: "user",
  //     text: question,
  //     content: question
  //   };
   
  //   setMessages(prev => [...prev, userMessage]);
  //   setIsLoading(true);
   
  //   try {
  //     let endpoint, requestBody;
     
  //     if (isDataIntent) {
  //       // Data analysis - use streaming endpoint
  //       endpoint = `${API_BASE_URL}/ask_question_stream/`;
  //       requestBody = {
  //         question: question,
  //         session_id: sessionIdRef.current,
  //         db_id: "liberty", // or your database ID
  //       };
  //       console.log("🔄 Using data analysis endpoint");
       
  //       if (USE_STREAMING) {
  //         await handleStreamingResponse(endpoint, requestBody, question);
  //       } else {
  //         await handleRegularResponse(endpoint, requestBody, question);
  //       }
  //     } else {
  //       // General question - use Qwen endpoint
  //       endpoint = `${API_BASE_URL}/ask_qwen/`;
  //       requestBody = {
  //         question: question,
  //         session_id: sessionIdRef.current,
  //       };
  //       console.log("💭 Using general question endpoint (ask_qwen)");
       
  //       const response = await fetch(endpoint, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(requestBody),
  //       });

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       const data = await response.json();
  //       console.log("✅ Qwen response:", data);
       
  //       const botResponse = {
  //         sender: "bot",
  //         text: data.answer || data.response || "I apologize, but I couldn't generate a response.",
  //         content: data.answer || data.response || "",
  //         asked_question: question,
  //         summary: data.summary || null,
  //         // Mark as general response (not data analysis)
  //         isGeneralResponse: true,
  //       };
       
  //       setMessages(prev => [...prev, botResponse]);
  //       setIsLoading(false);
  //     }
     
  //   } catch (error) {
  //     console.error("❌ Error sending message:", error);
     
  //     const errorMessage = {
  //       sender: "bot",
  //       text: "I apologize, but I encountered an error processing your question. Please try again.",
  //       content: "Error occurred",
  //       asked_question: question,
  //       isError: true,
  //     };
     
  //     setMessages(prev => [...prev, errorMessage]);
  //     setIsLoading(false);
  //   }
  // };


//   const handleSubmit = (e) => {
//   e.preventDefault();
//   USE_STREAMING ? sendMessageStream(input) : sendMessage();
//   // sendMessage();
// };

// const readNdjson = async (response, onEvent) => {
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();
//   let buf = "";
//   while (true) {
//     const { value, done } = await reader.read();
//     if (done) break;
//     buf += decoder.decode(value, { stream: true });
//     let idx;
//     while ((idx = buf.indexOf("\n")) >= 0) {
//       const line = buf.slice(0, idx).trim();
//       buf = buf.slice(idx + 1);
//       if (!line) continue;
//       try { onEvent(JSON.parse(line)); } catch {}
//     }
//   }
// };

// const readNdjson = async (response, onEvent) => {
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();
//   let buf = "";
//   while (true) {
//     const { value, done } = await reader.read();
//     if (done) break;
//     buf += decoder.decode(value, { stream: true });
//     let idx;
//     while ((idx = buf.indexOf("\n")) >= 0) {
//       const line = buf.slice(0, idx).trim();
//       buf = buf.slice(idx + 1);
//       if (!line) continue;
//       try { onEvent(JSON.parse(line)); } catch {}
//     }
//   }
// };

const readNdjson = async (response, onEvent) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let lineCount = 0;
  
  console.log("🌊 Starting NDJSON stream...");
  
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log(`✅ Stream completed successfully. Processed ${lineCount} events.`);
        break;
      }
      
      buf += decoder.decode(value, { stream: true });
      let idx;
      
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        
        lineCount++;
        
        try {
          const evt = JSON.parse(line);
          
          // Normalize event/type fields
          if (evt.type && !evt.event) evt.event = evt.type;
          if (evt.event && !evt.type) evt.type = evt.event;
          
          console.log(`📦 Event ${lineCount} [${evt.event || evt.type || 'unknown'}]:`, evt);
          
          onEvent(evt);
          
        } catch (parseError) {
          // Log the actual error instead of silently ignoring
          console.error(`❌ Failed to parse line ${lineCount}:`, line.substring(0, 200));
          console.error("Parse error:", parseError.message);
          
          // Continue processing other lines instead of breaking
          continue;
        }
      }
    }
    
    // Process any remaining buffer
    if (buf.trim()) {
      console.warn("⚠️ Leftover buffer at end of stream:", buf.substring(0, 200));
      try {
        const evt = JSON.parse(buf.trim());
        if (evt.type && !evt.event) evt.event = evt.type;
        if (evt.event && !evt.type) evt.type = evt.event;
        console.log(`📦 Final event from buffer:`, evt);
        onEvent(evt);
        lineCount++;
      } catch (e) {
        console.error("❌ Failed to parse leftover buffer:", e.message);
      }
    }
    
  } catch (streamError) {
    console.error("❌ Critical stream error:", streamError);
    console.error("Stack:", streamError.stack);
    throw streamError; // Re-throw so the caller knows something failed
  }
};

//   const sendMessage = async () => {
//   if (!input.trim() || isLoading) return;

//   setIsLoading(true);

//   const userMsg = { sender: "user", role: "user", content: input };
//   setMessages((prev) => [...prev, userMsg]);

//   try {
//     // 1) Intent check (no session_id)
//     let isDataIntent = true;
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: input })
//       });
//       const intentData = await intentRes.json();
//       if ((intentData.answer || "").trim().toUpperCase() === "NO") {
//         isDataIntent = false;
//       }
//     } catch {
//       // If intent check fails, default to data-intent path
//       isDataIntent = true;
//     }

//     // 2) General Q&A path
//     if (!isDataIntent) {
//       try {
//         const qwenRes = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ question: input }) // no session_id
//         });
//         const qwenData = await qwenRes.json();

//         const botMsg = {
//           sender: "bot",
//           role: "assistant",
//           content: qwenData.answer || "Sorry, I couldn't process that."
//         };
//         setMessages((prev) => [...prev, botMsg]);
//         setInput("");
//         setIsLoading(false);
//         return;
//       } catch (err) {
//         const botMsg = {
//           sender: "bot",
//           role: "assistant",
//           content: "Unable to process general questions at the moment."
//         };
//         setMessages((prev) => [...prev, botMsg]);
//         setInput("");
//         setIsLoading(false);
//         return;
//       }
//     }

//     // 3) Data Q&A path
//     const response = await fetch(`${API_BASE_URL}/ask_question/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: input, user_id: "admin" }) // no session_id
//     });
//     const data = await response.json();

//     if (import.meta.env.DEV && data.query_used) {
//       console.groupCollapsed("SQL debug");
//       console.log("SQL:", data.query_used);
//       console.log("Row count:", data.row_count);
//       console.log("Response time:", data.response_time);
//       console.groupEnd();
//     }

//     const botMsg = {
//       sender: "bot",
//       role: "assistant",
//       content: data.answer,
//       summary: data.summary ?? null,
//       recommendation: data.recommendation ?? null,
//       rows: data.rows ?? [],
//       chart_config: data.chart_config ?? null,
//       asked_question: input,
//       query_used: data.query_used ?? null,
//       time_scope: data.time_scope ?? null,
//       narrative: data.narrative ?? null,
//     };

//     const updatedMessages = [...messages, userMsg, botMsg];
//     setMessages(updatedMessages);
//     setInput("");

//     // Dynamic suggestions after each turn
//     const newSuggestions = generateDynamicSuggestions(updatedMessages, "database", {}, true);
//     setSuggestions(newSuggestions);
//   } catch (err) {
//     const botMsg = {
//       sender: "bot",
//       role: "assistant",
//       content: "Something went wrong while processing your question. Please try again."
//     };
//     setMessages((prev) => [...prev, botMsg]);
//     setInput("");
//   } finally {
//     setIsLoading(false);
//   }
// };

const sendMessage = async () => {
  if (!input.trim() || isLoading) return;
  await checkIntentAndSend(input.trim());
};
// const handleRating = async (idx, rating, msg) => {
//   setMessageRatings((prev) => ({
//     ...prev,
//     [idx]: rating
//   }));

//   if (rating === "yes") {
//     // ✅ Call backend to save to corpus
//     try {
//       const res = await fetch(`${API_BASE_URL}/save_to_corpus/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           question: msg.asked_question || msg.content || "",
//           summary: msg.summary || "",
//           recommendations: msg.recommendation || [],
//           sql: msg.query_used || "",
//           chart_config: msg.chart_config || null,
//           row_count: msg.rows?.length || 0,
//           db_id: "liberty",
//           narrative: msg.narrative || null,
//           user_id: "admin",
//         }),
//       });
//       const data = await res.json();
//       console.log("Corpus save response:", data);
//     } catch (err) {
//       console.error("⚠️ Failed to save to corpus:", err);
//     }
//   } else if (rating === "no") {
//     // 👎 Put the same question back in the input box for retry
//     setInput(msg.asked_question || msg.content || "");
//   }
// };
    // const handleSuggestionClick = (text) => {
    //   setInput(text);
    //   // setTimeout(() => sendMessage(), 0);
    //   setTimeout(() => (USE_STREAMING ? sendMessageStream(text) : sendMessage()), 0);
    // };

    // const handleKeyDown = (e) => {
    //   if (e.key === "Enter" && !e.shiftKey) {
    //     e.preventDefault();
    //     // sendMessage();
    //     USE_STREAMING ? sendMessageStream(input) : sendMessage();
    //   }
    // };





//   return (
//     <div style={styles.container}>
//       <h1 style={styles.heading}>Retention Assistant</h1>
//       <p style={styles.subheading}>
//         Get answers to anything about churn, retention, campaigns, dashboards,
//         and more. Start by asking a question below!
//       </p>

//       <div style={styles.chatBox} ref={chatBoxRef}>
//         {messages.map((msg, idx) => (
//           <div
//             key={idx}
//             ref={
//               idx === messages.length - 1 && msg.sender === "bot"
//                 ? lastMsgRef
//                 : null
//             }
//             style={msg.sender === "user" ? styles.userMsg : styles.botMsg}
//           >
//             {msg.sender === "user" ? (
//               <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                 {(msg.content || msg.text || "").trim()}
//               </ReactMarkdown>
//             ) : (
//               <>
//                 {msg.narrative ? (
//                   <NarrativeBlock
//                     narrative={msg.narrative}
//                     onFollowUp={handleSuggestionClick}
//                   />
//                 ) : (
//                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                     {msg.summary
//                       ? `${msg.summary}`
//                       : (msg.content || msg.text || "").trim()}
//                   </ReactMarkdown>
//                 )}

//                 {/* Corpus Match indicator */}
// {/* {typeof msg.corpus_used !== "undefined" && (
//   <small
//     style={{
//       display: "block",
//       marginTop: "6px",
//       fontStyle: "italic",
//       color: "#bbb"
//     }}
//   >
//     Corpus Match: {msg.corpus_used ? "Yes" : "No"}
//   </small>
// )} */}

//                 {!msg.narrative && msg.recommendation && (
//                   <div style={styles.recommendationBox}>
//                     <div style={styles.recommendationHeader}>
//                       🔎 Recommendation
//                     </div>
//                     <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
//                       {msg.recommendation
//                         .split(/\n|\. /)
//                         .filter((line) => line.trim() !== "")
//                         .map((line, index) => (
//                           <li
//                             key={index}
//                             style={{
//                               marginBottom: "0.5rem",
//                               lineHeight: "1.5",
//                             }}
//                           >
//                             {line.trim().replace(/\.$/, "")}.
//                           </li>
//                         ))}
//                     </ul>
//                   </div>
//                 )}

//                 {/* 🆕 Toggle Buttons */}
//                 {(msg.rows || msg.chart_config) && (
//                   <div
//                     style={{ display: "flex", gap: "10px", marginTop: "12px" }}
//                   >
//                     {/* ✅ Table button only if >1 row */}
//                         {msg.rows && msg.rows.length > 1 && (
//                           <button
//                             style={styles.toggleButton}
//                             onClick={() =>
//                               setVisibleTables((prev) => ({
//                                 ...prev,
//                                 [idx]: !prev[idx],
//                               }))
//                             }
//                           >
//                             {visibleTables[idx] ? "Hide Table" : "Show Table"}
//                           </button>
//                         )}
//                     {msg.chart_config && (
//                       <button
//                         style={styles.toggleButton}
//                         onClick={() =>
//                           setVisibleCharts((prev) => ({
//                             ...prev,
//                             [idx]: !prev[idx],
//                           }))
//                         }
//                       >
//                         {visibleCharts[idx] ? "Hide Chart" : "Show Chart"}
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 {/* Table */}
//                 {visibleTables[idx] &&
//                   msg.rows &&
//                   msg.rows.length > 1 &&
//                   msg.rows.length <= 50 && (
//                     <div style={styles.resultTableWrapper}>
//                       <table style={styles.resultTable}>
//                         <thead>
//                           <tr>
//                             {(() => {
//                               const colsAll = visibleColumnsForRows(msg.rows);
//                               const cols = expandedTables[idx]
//                                 ? colsAll
//                                 : colsAll.slice(0, 3);
//                               return cols.map((key) => (
//                                 <th key={key} style={styles.resultTableCell}>
//                                   {buildHeaderLabel(key, msg.rows)}
//                                 </th>
//                               ));
//                             })()}
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(() => {
//                             const rowsToShow = expandedTables[idx]
//                               ? msg.rows
//                               : msg.rows.slice(0, 8);
//                             const allKeys = visibleColumnsForRows(msg.rows);
//                             const cols = expandedTables[idx]
//                               ? allKeys
//                               : allKeys.slice(0, 3);

//                             return rowsToShow.map((row, i) => (
//                               <tr key={i}>
//                                 {cols.map((key, j) => (
//                                   <td
//                                     key={j}
//                                     style={styles.resultTableCell}
//                                   >
//                                     {formatCellForColumn(key, row[key], msg.rows)}
//                                   </td>
//                                 ))}
//                               </tr>
//                             ));
//                           })()}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}

//                   {/* ✅ Always show single-row as a small table */}
// {/* {msg.rows && msg.rows.length === 1 && (
//   <div style={styles.resultTableWrapper}>
//     <table style={styles.resultTable}>
//       <thead>
//         <tr>
//           {visibleColumnsForRows(msg.rows).map((key) => (
//             <th key={key} style={styles.resultTableCell}>
//               {buildHeaderLabel(key, msg.rows)}
//             </th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         <tr>
//           {visibleColumnsForRows(msg.rows).map((key, j) => (
//             <td key={j} style={styles.resultTableCell}>
//               {formatCellForColumn(key, msg.rows[0][key], msg.rows)}
//             </td>
//           ))}
//         </tr>
//       </tbody>
//     </table>
//   </div>
// )} */}

// {/* ✅ Always show single-row as a small table, but only if ≥ 2 columns */}
// {msg.rows && msg.rows.length === 1 && visibleColumnsForRows(msg.rows).length > 1 && (
//   <div style={styles.resultTableWrapper}>
//     <table style={styles.resultTable}>
//       <thead>
//         <tr>
//           {visibleColumnsForRows(msg.rows).map((key) => (
//             <th key={key} style={styles.resultTableCell}>
//               {buildHeaderLabel(key, msg.rows)}
//             </th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         <tr>
//           {visibleColumnsForRows(msg.rows).map((key, j) => (
//             <td key={j} style={styles.resultTableCell}>
//               {formatCellForColumn(key, msg.rows[0][key], msg.rows)}
//             </td>
//           ))}
//         </tr>
//       </tbody>
//     </table>
//   </div>
// )}

//                 {/* Chart */}
//                 {visibleCharts[idx] && msg.chart_config && (
//                   <div style={styles.chartSection}>
//                     <h4 style={styles.chartTitle}>Data Visualization</h4>
//                     <ChartRenderer config={msg.chart_config} />
//                   </div>
//                 )}

//                 <RecommendationsPanel
//                   narrative={msg.narrative}
//                   fallbackRec={msg.recommendation}
//                   onFollowUp={handleSuggestionClick}
//                 />
//                 {hasAskedFirstQuestion &&
//           msg.sender === "bot" &&
//           isRatableMessage(msg) &&
//           !msg.corpus_used && ( // Extra safety check
//             <div style={styles.ratingContainer}>
//               <span style={styles.ratingText}>Was this helpful?</span>
//               <button
//                 style={{
//                   ...styles.ratingButton,
//                   marginRight: "8px",
//                   ...(messageRatings[idx] === "yes"
//                     ? styles.ratingButtonYes
//                     : {}),
//                   ...(messageRatings[idx] === "yes"
//                     ? styles.ratingButtonSelected
//                     : {}),
//                 }}
//                 onClick={() => handleRating(idx, "yes", msg)}
//                 disabled={messageRatings[idx] === "yes"}
//               >
//                 👍 Yes
//               </button>
//               <button
//                 style={{
//                   ...styles.ratingButton,
//                   ...(messageRatings[idx] === "no"
//                     ? styles.ratingButtonNo
//                     : {}),
//                   ...(messageRatings[idx] === "no"
//                     ? styles.ratingButtonSelected
//                     : {}),
//                 }}
//                 onClick={() => handleRating(idx, "no", msg)}
//                 disabled={messageRatings[idx] === "no"}
//               >
//                 👎 No
//               </button>
//             </div>
//           )}
 // Add this function before the return statement in your component


 return (
  <div style={styles.container}>
    <h1 style={styles.heading}>Retention Assistant</h1>
    <p style={styles.subheading}>
      Get answers to anything about churn, retention, campaigns, dashboards,
      and more. Start by asking a question below!
    </p>

    <div style={styles.chatBox} ref={chatBoxRef}>
      {messages.map((msg, idx) => (
        
        <div
          key={idx}
          ref={
            idx === messages.length - 1 && msg.sender === "bot"
              ? lastMsgRef
              : null
          }
          style={msg.sender === "user" ? styles.userMsg : styles.botMsg}
        >
          {msg.sender === "user" ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {normalizeCurrencyInText((msg.content || msg.text || "").trim())}
              {/* {(msg.content || msg.text || "").trim()} */}
            </ReactMarkdown>
          ) : (
            
            <>
              {msg.narrative ? (
                <NarrativeBlock
                  narrative={msg.narrative}
                  rows={msg.rows}
                  onFollowUp={(text) => handleSuggestionClick(text, true)}
                />
              ) : (
                <>
                  {msg.conversational_opener && (
                    <div style={{
                      marginBottom: "16px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#374151"
                    }}>
                      {/* {msg.conversational_opener} */}
                      {normalizeCurrencyInText(msg.conversational_opener)}
                    </div>
                  )}

                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizeCurrencyInText(msg.summary
                        ? `${msg.summary}`
                        : (msg.content || msg.text || "").trim())}

                    {/* {msg.summary
                      ? `${msg.summary}`
                      : (msg.content || msg.text || "").trim()} */}
                  </ReactMarkdown>

                  {(!msg.rows || msg.rows.length === 0) && msg.conversational_opener && (
      <div style={{
        padding: "20px",
        backgroundColor: "#fef3c7",
        borderLeft: "4px solid #f59e0b",
        borderRadius: "12px",
        marginBottom: "16px"
      }}>
        <div style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#92400e",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          ⚠️ No Results Found
        </div>
        <div style={{
          color: "#78350f",
          fontSize: "0.95rem",
          lineHeight: "1.6"
        }}>
          {normalizeCurrencyInText(msg.conversational_opener)}
        </div>
      </div>
    )}

                  {/* {msg.narrative && msg.narrative.insights && Array.isArray(msg.narrative.insights) && msg.narrative.insights.length > 0 && ( */}
                  {msg.rows && msg.rows.length > 0 && msg.narrative?.insights && Array.isArray(msg.narrative.insights) && msg.narrative.insights.length > 0 && (
                    <div style={{
                      marginTop: "16px",
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderLeft: "4px solid #3b82f6",
                      borderRadius: "8px"
                    }}>
                      <div style={{
                        fontWeight: "700",
                        marginBottom: "12px",
                        color: "#1e40af",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        💡 Key Insights
                      </div>
                      <ul style={{ 
                        paddingLeft: "1.5rem", 
                        marginTop: "0.5rem",
                        listStyleType: "disc"
                      }}>
                        {msg.narrative.insights.map((insight, index) => (
                          <li
                            key={index}
                            style={{
                              marginBottom: "0.75rem",
                              lineHeight: "1.6",
                              color: "#374151"
                            }}
                          >
                            {/* {insight} */}
                            {normalizeCurrencyInText(insight)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* {msg.narrative && msg.narrative.recommendations && Array.isArray(msg.narrative.recommendations) && msg.narrative.recommendations.length > 0 && ( */}
                  {msg.rows && msg.rows.length > 0 && msg.narrative?.recommendations && Array.isArray(msg.narrative.recommendations) && msg.narrative.recommendations.length > 0 && (
                    <div style={{
                      marginTop: "16px",
                      padding: "16px",
                      backgroundColor: "#f0fdf4",
                      borderLeft: "4px solid #10b981",
                      borderRadius: "8px"
                    }}>
                      <div style={{
                        fontWeight: "700",
                        marginBottom: "12px",
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        🔎 Recommendations
                      </div>
                      <ul style={{ 
                        paddingLeft: "1.5rem", 
                        marginTop: "0.5rem",
                        listStyleType: "disc"
                      }}>
                        {msg.narrative.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            style={{
                              marginBottom: "0.75rem",
                              lineHeight: "1.6",
                              color: "#374151"
                            }}
                          >
                            {/* {recommendation} */}
                            {normalizeCurrencyInText(recommendation)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}


    {/* ✅ Show opener when NO data
{(!msg.rows || msg.rows.length === 0) && msg.conversational_opener && (
  <div style={{
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#fef3c7",
    borderLeft: "4px solid #f59e0b",
    borderRadius: "8px",
    color: "#92400e",
    fontSize: "0.95rem"
  }}>
    {normalizeCurrencyInText(msg.conversational_opener)}
  </div>
)} */}

              {!msg.narrative && msg.recommendation && (
                <div style={styles.recommendationBox}>
                  <div style={styles.recommendationHeader}>🔎 Recommendation</div>
                  <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                    {msg.recommendation
                      .split(/\n|\. /)
                      .filter((line) => line.trim() !== "")
                      .map((line, index) => (
                        <li
                          key={index}
                          style={{
                            marginBottom: "0.5rem",
                            lineHeight: "1.5",
                          }}
                        >
                          {/* {line.trim().replace(/\.$/, "")}. */}
                          {normalizeCurrencyInText(line.trim().replace(/\.$/, ""))}.
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Charts and Tables buttons */}
              {(msg.rows || msg.chart_config) && (
                <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                  {msg.rows && msg.rows.length > 1 && (
                    <button
                      style={styles.toggleButton}
                      onClick={() =>
                        setVisibleTables((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                    >
                      {visibleTables[idx] ? "Hide Table" : "Show Table"}
                    </button>
                  )}

                  {msg.chart_config &&
                    msg.chart_config.series &&
                    msg.chart_config.series.some((s) =>
                      s.data.some((val) => val !== 0)
                    ) && (
                      <button
                        style={styles.toggleButton}
                        onClick={() =>
                          setVisibleCharts((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                      >
                        {visibleCharts[idx] ? "Hide Chart" : "Show Chart"}
                      </button>
                    )}

                  {msg.rows && msg.rows.length > 1 && (
                    <button
                      style={{ 
                        ...styles.toggleButton, 
                        backgroundColor: "#10b981", 
                        color: "#fff",
                        border: "none"
                      }}
                      onClick={() => downloadCSVFromRows(msg.rows, `data_export_${idx}`)}
                    >
                      Download CSV
                    </button>
                  )}

                  {/* ✅ Show SQL Query button */}
                  {msg.query_used && (
                    <button
                      style={{
                        ...styles.toggleButton,
                        backgroundColor: "#4338ca",
                        color: "#fff",
                        border: "none",
                      }}
                      onClick={() =>
                        setVisibleSQL((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                    >
                      {visibleSQL[idx] ? "Hide SQL" : "Show SQL"}
                    </button>
                  )}
                </div>
              )}

              {/* ✅ SQL query display */}
              {visibleSQL[idx] && msg.query_used && (
                <div
                  style={{
                    marginTop: "12px",
                    backgroundColor: "#1e1b4b",
                    color: "#e0e7ff",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    borderLeft: "4px solid #6366f1",
                    boxShadow: "inset 0 0 6px rgba(99,102,241,0.4)",
                  }}
                >
                  <strong style={{ color: "#a5b4fc" }}>SQL Query:</strong>
                  <br />
                  {msg.query_used}
                </div>
              )}

              {/* Table rendering - Multi-row tables */}
              {/* Table rendering - Multi-row tables */}
              {/* Table rendering - Multi-row tables */}
               {visibleTables[idx] && msg.rows && msg.rows.length > 1 && (
                <div style={{
                  width: "100%",
                  maxWidth: "600px",  // ← THIS LINE WAS ADDED
                  marginTop: "1.25rem",
                  borderRadius: "12px",
                  border: `1px solid ${TOKENS.border.soft}`,
                  backgroundColor: "#7b9cd3ff",
                  boxShadow: TOKENS.shadow.md,
                  overflowX: expandedTables[idx] ? "auto" : "hidden",
                  overflowY: "visible",
                }}>
                  {/* Row count indicator for large tables */}
                  {/* {msg.rows.length > 50 && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fef08a",
                        borderBottom: "1px solid #facc15",
                        fontSize: "0.85rem",
                        color: "#78350f",
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ Large dataset: Showing first 50 rows. Download CSV for complete data.
                    </div>
                  )} */}

                   {msg.rows.length > 50 && (
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#fef08a",
          borderBottom: "1px solid #facc15",
          fontSize: "0.85rem",
          color: "#78350f",
          fontWeight: "600",
          width: "100%",              // ← ADDED
          boxSizing: "border-box",    // ← ADDED
          position: "sticky",         // ← ADDED
          left: 0,                    // ← ADDED
        }}
      >
        ⚠️ Large dataset: Showing first 50 rows. Download CSV for complete data.
      </div>
    )}

                  {/* <table style={styles.resultTable}> */}
                  {/* <table style={{
                    ...styles.resultTable,
                    borderBottom: "none", // Remove table's own bottom border
                  }}> */}
                   <table style={{
  ...styles.resultTable,
  borderBottom: "none",
  width: expandedTables[idx] ? "max-content" : "100%",  // ← THIS LINE WAS ADDED
  minWidth: "100%",  // ← THIS LINE WAS ADDED
}}>
                    <thead>
                      <tr>
                        {(() => {
                          const colsAll = visibleColumnsForRows(msg.rows);
                          const cols = expandedTables[idx] ? colsAll : colsAll.slice(0, 3);
                          return cols.map((key) => (
                            <th key={key} style={styles.resultTableHeader}>
                              {buildHeaderLabel(key, msg.rows)}
                            </th>
                          ));
                        })()}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const hasSegmentation =
                          msg.rows &&
                          msg.rows.length > 0 &&
                          msg.rows.some((row) => "customer_segmentation" in row);

                        const normalized = hasSegmentation
                          ? normalizeSegmentationRows(msg.rows)
                          : msg.rows;

                        const maxRows = msg.rows.length > 50 ? 50 : msg.rows.length;
                        const rowsToShow = expandedTables[idx]
                          ? normalized.slice(0, maxRows)
                          : normalized.slice(0, Math.min(8, maxRows));

                        const allKeys = visibleColumnsForRows(normalized);
                        const cols = expandedTables[idx] ? allKeys : allKeys.slice(0, 3);

                        return rowsToShow.map((row, i) => {
                          // Determine base color (supports segmentation)
                          const baseColor = hasSegmentation
                            ? rowHighlight(row.customer_segmentation).backgroundColor
                            : i % 2 === 0
                            ? "#2c2f4b" // even row
                            : "#2a2d47"; // odd row (slightly darker)

                          return (
                            <tr
                              key={i}
                              style={{
                                backgroundColor: baseColor,
                                transition: "background-color 0.25s ease",
                                cursor: "default",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#2f4796ff"; // Light indigo
                                // Change all td text colors to dark
                                Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => {
                                  td.style.color = "#dae2f0ff"; // Dark text
                                });
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = baseColor;
                                Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => {
                                  td.style.color = TOKENS.text.primary; // Back to white
                                });
                              }}
                            >
                              {cols.map((key, j) => (
                                <td key={j} style={styles.resultTableCell}>
                                  {formatCellForColumn(key, row[key], normalized)}
                                </td>
                              ))}
                            </tr>
                          );
                        });
                      })()}
                      
                      {/* 🔥 FIXED: Expand button row - Shows when table has more content than displayed */}
                      {(msg.rows.length > 8 || visibleColumnsForRows(msg.rows).length > 3) && !expandedTables[idx] && (
                        <tr>
                          <td 
                            colSpan={Math.min(3, visibleColumnsForRows(msg.rows).length)}
                            style={{
                              textAlign: "center",
                              padding: "16px",
                              backgroundColor: "#91a6c7ff",
                              borderTop: "1px solid #475569",
                            }}
                          >
                            <button
                              onClick={() =>
                                setExpandedTables((prev) => ({
                                  ...prev,
                                  [idx]: true,
                                }))
                              }
                              style={{
                                padding: "10px 20px",
                                borderRadius: "8px",
                                backgroundColor: "#3b82f6",
                                color: "#ffffff",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.95rem",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#2563eb";
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#3b82f6";
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                              }}
                            >
                              Click to expand <FiMaximize2 size={16} style={{ marginLeft: "4px" }} />
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* 🔥 FIXED: Collapse button - Shows when table is expanded */}
                  {expandedTables[idx] && (msg.rows.length > 8 || visibleColumnsForRows(msg.rows).length > 3) && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        borderTop: "1px solid #94a3b8",
                        backgroundColor: "#829dcaff",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <button
                        onClick={() =>
                          setExpandedTables((prev) => ({
                            ...prev,
                            [idx]: false,
                          }))
                        }
                        style={{
                          padding: "10px 20px",
                          borderRadius: "8px",
                          backgroundColor: "#3b82f6",
                          color: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#3b82f6";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                        }}
                      >
                        Click to collapse <FiMinimize2 size={16} style={{ marginLeft: "4px" }} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Single-row table rendering */}
              {msg.rows &&
                msg.rows.length === 1 &&
                visibleColumnsForRows(msg.rows).length > 1 && (
                  <div style={styles.resultTableWrapper}>
                    <table style={styles.resultTable}>
                      <thead>
                        <tr>
                          {visibleColumnsForRows(msg.rows).map((key) => (
                            <th key={key} style={styles.resultTableHeader}>
                              {buildHeaderLabel(key, msg.rows)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          style={{
                            backgroundColor: "#2c2f4b",
                            transition: "background-color 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(96,165,250,0.15)"; // Light indigo
                            // Change all td text colors to dark
                            Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => {
                              td.style.color = "#e3e9f3ff"; // Dark text
                            });
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => {
                              td.style.color = TOKENS.text.primary; // Back to white
                            });
                          }}
                        >
                          {visibleColumnsForRows(msg.rows).map((key, j) => (
                            <td key={j} style={styles.resultTableCell}>
                              {formatCellForColumn(key, msg.rows[0][key], msg.rows)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Chart */}
              {visibleCharts[idx] && msg.chart_config && (
                <div style={styles.chartSection}>
                  <h4 style={styles.chartTitle}>Data Visualization</h4>
                  <ChartRenderer config={msg.chart_config} />
                </div>
              )}

              <RecommendationsPanel
                narrative={msg.narrative}
                fallbackRec={msg.recommendation}
                rows={msg.rows}
                onFollowUp={(question) => handleSuggestionClick(question, true)}
              />

              {hasAskedFirstQuestion &&
                msg.sender === "bot" &&
                isRatableMessage(msg) && (
                  <div style={styles.ratingContainer}>
                    <span style={styles.ratingText}>Was this helpful?</span>
                    <button
                      style={{
                        ...styles.ratingButton,
                        marginRight: "8px",
                        ...(messageRatings[idx] === "yes"
                          ? { ...styles.ratingButtonYes, ...styles.ratingButtonSelected }
                          : {}),
                      }}
                      onClick={() => handleRating(idx, "yes", msg)}
                      disabled={messageRatings[idx] === "yes"}
                    >
                      👍 Yes
                    </button>
                    <button
                      style={{
                        ...styles.ratingButton,
                        ...(messageRatings[idx] === "no"
                          ? { ...styles.ratingButtonNo, ...styles.ratingButtonSelected }
                          : {}),
                      }}
                      onClick={() => handleRating(idx, "no", msg)}
                      disabled={messageRatings[idx] === "no"}
                    >
                      👎 No
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      ))}

      {pendingBot && (
        <div ref={pendingMsgRef} style={styles.botMsg}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {/* {pendingBot.summary || pendingBot.text || pendingBot.content || "Processing..."} */}
            {normalizeCurrencyInText(pendingBot.summary || pendingBot.text || pendingBot.content || "Processing...")}
          </ReactMarkdown>
          
          {/* {pendingBot.narrative && pendingBot.narrative.insights && ( */}
          {pendingBot.rows && pendingBot.rows.length > 0 && pendingBot.narrative && pendingBot.narrative.insights && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              borderLeft: "4px solid #3b82f6",
              borderRadius: "8px"
            }}>
              <div style={{ fontWeight: "700", marginBottom: "12px", color: "#1e40af" }}>
                💡 Key Insights
              </div>
              <ul style={{ paddingLeft: "1.5rem" }}>
                {pendingBot.narrative.insights.map((insight, index) => (
                  <li key={index} style={{ marginBottom: "0.75rem", lineHeight: "1.6" }}>
                    {/* {insight} */}
                     {normalizeCurrencyInText(insight)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* {pendingBot.narrative && pendingBot.narrative.recommendations && ( */}
          {pendingBot.rows && pendingBot.rows.length > 0 && pendingBot.narrative && pendingBot.narrative.recommendations && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "#f0fdf4",
              borderLeft: "4px solid #10b981",
              borderRadius: "8px"
            }}>
              <div style={{ fontWeight: "700", marginBottom: "12px", color: "#047857" }}>
                🔎 Recommendations
              </div>
              <ul style={{ paddingLeft: "1.5rem" }}>
                {pendingBot.narrative.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: "0.75rem", lineHeight: "1.6" }}>
                    {/* {rec} */}
                    {normalizeCurrencyInText(rec)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isLoading && !pendingBot && (
        <div style={{
          ...styles.botMsg,
          display: "flex",
          alignItems: "center",
          gap: 14,
          minHeight: 64,
          padding: "0.9rem 1.1rem",
        }}>
          <Spinner size={33} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              Processing your question...
            </div>
            <div style={{ fontSize: "0.9rem" }}>Checking knowledge base and analyzing data...</div>
          </div>
        </div>
      )}

      {/* ✅ Secondary loader (shown only after summary, before final/narrative) */}
      {!isLoading && isProcessing && (
        <div style={{
          background: "linear-gradient(90deg, #2e2b5f, #403d83)",
          color: "#fff",
          padding: "12px 18px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "10px 0",
          fontSize: "14px",
          animation: "fadeIn 0.3s ease-in-out",
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            border: "2px solid #fff",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <p>Processing your question...</p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>

    <form style={styles.inputBox} onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        placeholder="Ask me anything..."
        style={styles.input}
        disabled={isLoading}
      />
      <button
        type="submit"
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? "Sending…" : <FiSend size={18} />}
      </button>
    </form>

    {showRatingPopup && (() => {
      const lastBotMsg = messages.slice().reverse().find(m => m.sender === "bot");
      if (lastBotMsg && !isRatableMessage(lastBotMsg)) {
        return null;
      }
      return (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "#1e293b",
            color: "white",
            padding: "24px",
            borderRadius: "12px",
            textAlign: "center",
            maxWidth: "400px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px" }}>
              Rating Required
            </h3>
            <p style={{ marginBottom: "20px", color: "#cbd5e1" }}>
              Please rate the last response before asking a new question.
            </p>
            <button
              onClick={() => setShowRatingPopup(false)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#3b82f6",
                color: "white",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      );
    })()}

    {showIncompletePopup && (
      <Popup
        message={customPopupMessage || "⚠️ Incomplete question, please rephrase."}
        onClose={() => setShowIncompletePopup(false)}
      />
    )}
  </div>
);
};
export default Sara;






// import React, { useState, useRef, useEffect } from "react";
//   // import styles from "./ChatBots.module.css";
//   import ReactMarkdown from "react-markdown";
//   import remarkGfm from "remark-gfm";
//   import Highcharts from "highcharts";
//   import HighchartsReact from "highcharts-react-official";
//   import ChartRenderer from "./ChartRenderer";
//   import { FiMaximize2, FiMinimize2, FiSend, FiMic } from "react-icons/fi";
//   import videoFile from '../assets/vecteezy_animated-celestial-blue-waves-abstract-artwork-featuring_55003794.mp4';
//   import Spinner from "./Spinner";
//   <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>


//   const API_BASE_URL = import.meta.env.VITE_API_URL;

 
// const TOKENS = {
//   brand: {
//     indigo500: '#4f46e5',
//     indigo600: '#4338ca',
//     cyan500:   '#06b6d4',
//     violet500: '#7c3aed'
//   },
//   text: {
//     primary:   '#ffffff',
//     secondary: '#cbd5e1',
//     muted:     '#94a3b8',
//     dark:      '#111827'
//   },
//   surface: {
//     page:        '#0b1220',
//     panel:       'rgba(255,255,255,0.08)',
//     bubble:      ' #3b3863ff',
//     bubbleUser:  'linear-gradient(135deg, #38daf0ff, #3b3863ff)',
//     input:       'rgba(255,255,255,0.16)',
//     tableHeader: 'rgba(30,41,59,0.88)'
//   },
//   border: {
//     soft:  'rgba(255,255,255,0.18)',
//     hard:  'rgba(255,255,255,0.28)',
//     light: '#e5e7eb',
//     table: '#475569'
//   },
//   shadow: {
//     sm: '0 1px 2px rgba(0,0,0,0.05)',
//     md: '0 10px 36px rgba(0,0,0,0.38)'
//   },
//   radius: { sm: 8, md: 12, lg: 16, xl: 20 },
//   accent: { yellow: '#facc15', red: '#ef4444', link: '#60a5fa' },
//   warn:   { bg: '#fef9c3', border: '#fde68a', text: '#92400e' }
// };

// /* ---------------- STYLES ---------------- */
// const styles = {
//   /* ---------- Markdown table (light) ---------- */
//   tableWrapper: {
//     overflowX: 'auto',
//     margin: '0.75rem 0',
//     borderRadius: '0.75rem',
//     border: `1px solid ${TOKENS.border.light}`,
//     boxShadow: TOKENS.shadow.sm,
//     background: '#fff'
//   },
//   markdownTable: { width: '100%', borderCollapse: 'collapse' },
//   tableHead: { backgroundColor: '#f9fafb' },
//   tableHeader: {
//     padding: '0.75rem',
//     textAlign: 'left',
//     fontSize: '0.75rem',
//     fontWeight: 700,
//     color: '#6b7280',
//     textTransform: 'uppercase',
//     letterSpacing: '0.02em',
//     borderBottom: '1px solid #e5e7eb'
//   },
//   tableBody: { backgroundColor: '#ffffff' },
//   tableRow: { transition: 'background-color 0.2s ease' },
//   tableRowHover: { backgroundColor: '#f3f4f6' },
//   tableCell: {
//     padding: '1rem',
//     whiteSpace: 'nowrap',
//     fontSize: '0.875rem',
//     color: TOKENS.text.dark,
//     borderBottom: '1px solid #eee'
//   },

//   /* ---------- Notices / links ---------- */
//   warningBox: {
//     backgroundColor: TOKENS.warn.bg,
//     border: `1px solid ${TOKENS.warn.border}`,
//     color: TOKENS.warn.text,
//     padding: '0.75rem 1rem',
//     borderRadius: '0.5rem',
//     fontSize: '0.875rem',
//     marginBottom: '1rem'
//   },
//   downloadLink: {
//     color: TOKENS.accent.link,
//     textDecoration: 'underline',
//     fontWeight: 600,
//     marginLeft: '0.25rem',
//     cursor: 'pointer',
//     background: 'none',
//     border: 'none'
//   },

//   /* ---------- Header / container ---------- */
//   container: {
//     position: 'relative',
//     padding: '2.2rem',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, Arial, sans-serif',
//     display: 'flex',
//     flexDirection: 'column',
//     marginTsop: '-10px',            // kept as-is (typo preserved)
//     marginTop: '-10px',
//     borderRadius: '16px',
//     overflow: 'hidden',
//     isolation: 'isolate',
//     background: `
//       linear-gradient(180deg, rgba(6,11,25,1) 0%, rgba(10,16,34,1) 45%, rgba(15,23,42,1) 100%),
//       radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,0.28), transparent 60%),
//       radial-gradient(820px 360px at 92% 0%, rgba(6,182,212,0.22), transparent 60%),
//       radial-gradient(760px 320px at 50% 110%, rgba(124,58,237,0.18), transparent 60%),
//       ${TOKENS.surface.page}
//     `,
//     zIndex: 1,
//     height: '90%',
//     color: TOKENS.text.primary
//   },
//   containerVideo: {
//     position: 'absolute',
//     top: 0, left: 0,
//     width: '100%',
//     height: '100%',
//     objectFit: 'cover',
//     zIndex: -10,
//     pointerEvents: 'none'
//   },
//   heading: {
//     fontSize: '2.4rem',
//     fontWeight: 800,
//     textAlign: 'center',
//     background: 'linear-gradient(to right, #60a5fa, #22d3ee, #34d399)',
//     WebkitBackgroundClip: 'text',
//     WebkitTextFillColor: 'transparent',
//     backgroundClip: 'text',
//     textFillColor: 'transparent',
//     marginTop: '-10px',
//     letterSpacing: '-0.02em'
//   },
//   headingGlow: {
//     textShadow:
//       '0 0 14px rgba(96,165,250,.45), 0 0 28px rgba(34,211,238,.35)'
//   },
//   subheading: {
//     textAlign: 'center',
//     fontSize: '0.98rem',
//     color: TOKENS.text.secondary,
//     marginTop: '-10px'
//   },

//   /* ---------- Chat area ---------- */
//   chatBox: {
//     position: 'relative',
//     background: 'rgba(255,255,255,0.07)',
//     backdropFilter: 'blur(14px)',
//     WebkitBackdropFilter: 'blur(14px)',
//     borderRadius: '14px',
//     padding: '1.25rem',
//     height: '100%',
//     overflowY: 'auto',
//     overflowX: 'visible',                 // let glow breathe
//     marginTop: '0',
//     marginBottom: '1rem',
//     color: TOKENS.text.primary,
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '0.85rem',
//     boxShadow: TOKENS.shadow.md,
//     border: `1px solid ${TOKENS.border.soft}`
//   },
//   cardGlow: {
//     boxShadow: '0 12px 42px rgba(0,0,0,.45), 0 0 32px rgba(99,102,241,.18)'
//   },

//   userMsg: {
//     alignSelf: 'flex-end',
//     background: TOKENS.surface.bubbleUser,
//     padding: '0.85rem 0.95rem',
//     borderRadius: '12px 12px 0 12px',
//     maxWidth: '80%',
//     transition: 'box-shadow .25s ease, transform .2s ease'
//   },
//   botMsg: {
//     alignSelf: 'flex-start',
//     backgroundColor: TOKENS.surface.bubble,
//     padding: '0.85rem 0.95rem',
//     borderRadius: '12px 12px 12px 0',
//     maxWidth: '80%',
//     border: `1px solid ${TOKENS.border.soft}`,
//     transition: 'box-shadow .25s ease, transform .2s ease'
//   },

//   /* ---------- Bubble glows ---------- */
//   userGlow: {
//     boxShadow:
//       '0 10px 26px rgba(19, 193, 206, 0.45), 0 0 32px rgba(79,70,229,.55)',
//     outline: '1px solid rgba(32, 212, 212, 0.35)',
//     filter: 'drop-shadow(0 0 20px rgba(79,70,229,.45))'
//   },
//   botGlow: {
//     boxShadow:
//       '0 10px 26px rgba(102, 216, 236, 0.38), 0 0 32px rgba(6,182,212,.52)',
//     outline: '1px solid rgba(6,182,212,.32)',
//     filter: 'drop-shadow(0 0 20px rgba(6,182,212,.42))'
//   },

//   /* ---------- Composer ---------- */
//   inputBox: {
//     display: 'flex',
//     width : '92%',
//     gap: '0.75rem',
//     alignItems: 'center',
//     position: 'relative',
//      zIndex: 20,
//     background: TOKENS.surface.input,
//     backdropFilter: 'blur(20px)',
//     WebkitBackdropFilter: 'blur(20px)',
//     padding: '0.75rem',
//     borderRadius: '20px',
//     border: `1px solid ${TOKENS.border.hard}`,
//     boxShadow: '0 10px 28px rgba(0,0,0,.35)'
//   },
//   input: {
//     flex: 1,
//     padding: '0.85rem 1.1rem',
//     borderRadius: '16px',
//     border: 'none',
//     background: 'rgba(255,255,255,0.97)',
//     color: TOKENS.text.dark,
//     fontSize: '1rem',
//     outline: 'none',
//     transition: 'all 0.2s ease',
//     boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, Arial, sans-serif'
//   },
//   inputFocused: {
//     background: '#ffffff',
//     boxShadow:
//       'inset 0 2px 4px rgba(0,0,0,0.08), 0 0 0 3px rgba(79,70,229,0.28), 0 0 24px rgba(99,102,241,.35)',
//     transform: 'translateY(-1px)'
//   },
//   button: {
//     padding: '0.8rem 1.4rem',
//     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '16px',
//     cursor: 'pointer',
//     zIndex: 21,
//     pointerEvents: 'auto',
//     fontSize: '1rem',
//     fontWeight: 700,
//     display: 'flex',
//     alignItems: 'center',
//     gap: '0.5rem',
//     transition: 'all 0.2s ease',
//     boxShadow: '0 10px 26px rgba(102,126,234,0.45)',
//     minWidth: '110px',
//     justifyContent: 'center'
//   },
//   buttonHover: {
//     background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
//     transform: 'translateY(-2px)',
//     boxShadow: '0 14px 32px rgba(102,126,234,0.6)'
//   },
//   buttonActive: {
//     transform: 'translateY(0)',
//     boxShadow: '0 6px 16px rgba(102,126,234,0.4)'
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//     cursor: 'not-allowed',
//     transform: 'none',
//     boxShadow: '0 2px 8px rgba(102,126,234,0.2)'
//   },

//   /* ---------- Result table (dark) ---------- */
//   resultTableWrapper: {
//     marginTop: '1.25rem',
//     padding: '1rem',
//     borderRadius: '12px',
//     background: 'rgba(255,255,255,0.06)',
//     backdropFilter: 'blur(10px)',
//     WebkitBackdropFilter: 'blur(10px)',
//     boxShadow: TOKENS.shadow.md,
//     overflowX: 'auto',
//     border: `1px solid ${TOKENS.border.soft}`
//   },
//   resultTable: {
//     width: '100%',
//     borderCollapse: 'collapse',
//     color: TOKENS.text.primary,
//     fontSize: '0.9rem'
//   },
//   resultTableHeader: {
//     backgroundColor: TOKENS.surface.tableHeader,
//     color: TOKENS.accent.yellow,
//     padding: '0.65rem',
//     border: `1px solid ${TOKENS.border.table}`,
//     textAlign: 'left'
//   },
//   resultTableCell: {
//     padding: '0.6rem',
//     border: `1px solid ${TOKENS.border.table}`,
//     textAlign: 'center',
//     verticalAlign: 'middle'
//   },
//   expandNote: {
//     padding: '0.5rem',
//     fontSize: '0.875rem',
//     textAlign: 'center',
//     color: TOKENS.text.muted
//   },

//   /* ---------- Chart section ---------- */
//   chartSection: { marginTop: '1rem', marginBottom: '0.5rem' },
//   chartTitle: {
//     fontSize: '14px',
//     fontWeight: 'bold',
//     color: TOKENS.text.primary,
//     marginBottom: '10px',
//     textShadow: '0 0 14px rgba(250,204,21,.35)'
//   },

//   /* ---------- Collapse controls ---------- */
//   collapseButton: { textAlign: 'right', marginTop: '0.5rem' },
//   collapseButtonLink: {
//     fontWeight: 'bold',
//     textDecoration: 'underline',
//     color: TOKENS.accent.red,
//     background: 'none',
//     border: 'none',
//     cursor: 'pointer'
//   },

//   /* ---------- Recommendation panel ---------- */
//   recommendationBox: {
//     marginTop: '1rem',
//     padding: '1rem 1.25rem',
//     borderRadius: '12px',
//     background: 'rgba(255,255,255,0.10)',
//     backdropFilter: 'blur(8px)',
//     WebkitBackdropFilter: 'blur(8px)',
//     color: TOKENS.text.primary,
//     borderLeft: `4px solid ${TOKENS.accent.yellow}`,
//     boxShadow: TOKENS.shadow.md,
//     fontSize: '0.95rem'
//   },
//   recommendationHeader: { fontWeight: 600, marginBottom: '0.5rem', color: '#fde047' },
//   recommendationText: { lineHeight: 1.5 }
// };


// // --- Narrative styles (add near styles.*) ---
// styles.narrativeCard = {
//   marginTop: '0.5rem',
//   padding: '1rem 1.1rem',
//   borderRadius: '12px',
//   background: 'rgba(255,255,255,0.10)',
//   border: `1px solid ${TOKENS.border.soft}`,
//   boxShadow: TOKENS.shadow.md,
// };
// styles.narrativeOpener = {
//   fontWeight: 700,
//   marginBottom: '0.35rem',
//   color: TOKENS.text.primary
// };
// styles.narrativeList = {
//   margin: '0.3rem 0 0.6rem 1.1rem',
//   paddingLeft: '0.6rem',
//   lineHeight: 1.55
// };
// styles.narrativeLabel = { fontWeight: 600, color: TOKENS.accent.yellow };
// styles.nextStep = { marginTop: '0.25rem', color: TOKENS.text.secondary };


//   // const styles = {
//   //   tableWrapper: {
//   //     overflowX: 'auto',
//   //     margin: '0.5rem 0',
//   //     borderRadius: '0.5rem',
//   //     border: '1px solid #e5e7eb',
//   //     boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
//   //   },
//   //   markdownTable: {
//   //     width: '100%',
//   //     borderCollapse: 'collapse',
//   //   },
//   //   tableHead: {
//   //     backgroundColor: '#f9fafb',
//   //   },
//   //   tableHeader: {
//   //     padding: '0.75rem',
//   //     textAlign: 'left',
//   //     fontSize: '0.75rem',
//   //     fontWeight: 600,
//   //     color: '#6b7280',
//   //     textTransform: 'uppercase',
//   //   },
//   //   tableBody: {
//   //     backgroundColor: '#ffffff',
//   //   },
//   //   tableRow: {
//   //     transition: 'background-color 0.3s',
//   //   },
//   //   tableRowHover: {
//   //     backgroundColor: '#f9fafb',
//   //   },
//   //   tableCell: {
//   //     padding: '1rem',
//   //     whiteSpace: 'nowrap',
//   //     fontSize: '0.875rem',
//   //     color: '#111827',
//   //   },
//   //   warningBox: {
//   //     backgroundColor: '#fef9c3',
//   //     border: '1px solid #fde68a',
//   //     color: '#92400e',
//   //     padding: '0.75rem 1rem',
//   //     borderRadius: '0.5rem',
//   //     fontSize: '0.875rem',
//   //     marginBottom: '1rem',
//   //   },
//   //   downloadLink: {
//   //     color: '#2563eb',
//   //     textDecoration: 'underline',
//   //     fontWeight: 500,
//   //     marginLeft: '0.25rem',
//   //     cursor: 'pointer',
//   //     background: 'none',
//   //     border: 'none',
//   //   },
//   //   resultTableWrapper: {
//   //     marginTop: '1rem',
//   //   },
//   //   resultTable: {
//   //     width: '100%',
//   //     borderCollapse: 'collapse',
//   //     border: '1px solid #ddd',
//   //   },
//   //   resultTableCell: {
//   //     padding: '0.75rem',
//   //     border: '1px solid #ddd',
//   //     fontSize: '0.875rem',
//   //     textAlign: 'left',
//   //   },
//   //   expandNote: {
//   //     padding: '0.5rem',
//   //     fontSize: '0.875rem',
//   //     textAlign: 'center',
//   //     color: '#6b7280',
//   //   },
//   //   collapseButton: {
//   //     textAlign: 'right',
//   //     marginTop: '0.5rem',
//   //   },
//   //   collapseButtonLink: {
//   //     fontWeight: 'bold',
//   //     textDecoration: 'underline',
//   //     color: '#ef4444',
//   //     background: 'none',
//   //     border: 'none',
//   //     cursor: 'pointer',
//   //   },
//   //   chartSection: {
//   //     marginTop: '1rem',
//   //     marginBottom: '0.5rem',
//   //   },
//   //   chartTitle: {
//   //     fontSize: '14px',
//   //     fontWeight: 'bold',
//   //     color: 'white',
//   //     marginBottom: '10px',
//   //   },

//   //   container: {
//   //     position: 'relative',
//   //     padding: '2.2rem',
//   //     fontFamily: 'sans-serif',
//   //     // minHeight: '100vh',
//   //     display: 'flex',
//   //     flexDirection: 'column',
//   //     marginTsop: '-10px',
//   //     borderRadius: '16px',
//   //     overflow: 'hidden',
//   //     background: 'radial-gradient(circle at 10% 20%,   #3b568fff, #2c518bff, #3b568fff)',
//   //     zIndex: 1,
//   //     height: '90%',
//   //     color: 'white',
//   //   },
//   //   containerVideo: {
//   //     position: 'absolute',
//   //     top: 0,
//   //     left: 0,
//   //     width: '100%',
//   //     height: '100vh',
//   //     objectFit: 'cover',
//   //     zIndex: -10,
//   //     pointerEvents: 'none',
//   //   },
//   //   heading: {  
//   //     fontSize: '2.2rem',
//   //     fontWeight: 800,
//   //     textAlign: 'center',
//   //     // background: 'linear-gradient(to right, #cccf25, #89b906, #077e60ff)',
//   //     background: 'linear-gradient(to right, #4968afff, #0796ddff, #05c4e6ff)',
//   //     WebkitBackgroundClip: 'text',
//   //     WebkitTextFillColor: 'transparent',
//   //     backgroundClip: 'text',
//   //     textFillColor: 'transparent',
//   //     marginTop: '-10px',
//   //   },
//   //   subheading: {
//   //     textAlign: 'center',
//   //     fontSize: '0.95rem',
//   //     color: '#e1f0e5ff',
//   //     marginTop: '-10px',
//   //   },
//   //   chatBox: {
//   //     background: 'rgba(255, 255, 255, 0.1)',
//   //     backdropFilter: 'blur(12px)',
//   //     WebkitBackdropFilter: 'blur(12px)',
//   //     borderRadius: '12px',
//   //     padding: '1rem',
//   //     height: '100%',
//   //     overflowY: 'auto',
//   //     marginTop: '0px',
//   //     marginBottom: '1rem',
//   //     color: 'white',
//   //     display: 'flex',
//   //     flexDirection: 'column',
//   //     gap: '0.75rem',
//   //     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
//   //     border: '1px solid rgba(255, 255, 255, 0.2)',
//   //   },
//   //   userMsg: {
//   //     alignSelf: 'flex-end',
//   //     backgroundColor: '#4f46e5',
//   //     padding: '0.75rem',
//   //     borderRadius: '10px 10px 0 10px',
//   //     maxWidth: '80%',
//   //   },
//   //   botMsg: {
//   //     alignSelf: 'flex-start',
//   //     backgroundColor: '#2d2f4a',
//   //     padding: '0.75rem',
//   //     borderRadius: '10px 10px 10px 0',
//   //     maxWidth: '80%',
//   //   },
//   //   inputBox: {
//   //     display: 'flex',
//   //     gap: '0.75rem',
//   //     width : '91%',
//   //     alignItems: 'center',
//   //     position: 'relative',
//   //     background: 'rgba(255, 255, 255, 0.15)',
//   //     backdropFilter: 'blur(20px)',
//   //     WebkitBackdropFilter: 'blur(20px)',
//   //     padding: '0.75rem',
//   //     borderRadius: '20px',
//   //     border: '1px solid rgba(255, 255, 255, 0.3)',
//   //     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
//   //   },
//   //   input: {
//   //     flex: 1,
//   //     padding: '0.75rem 1.25rem',
//   //     borderRadius: '16px',
//   //     border: 'none',
//   //     background: 'rgba(255, 255, 255, 0.9)',
//   //     color: '#1a1a1a',
//   //     fontSize: '1rem',
//   //     outline: 'none',
//   //     transition: 'all 0.3s ease',
//   //     boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
//   //     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//   //   },
//   //   inputFocused: {
//   //     background: 'rgba(255, 255, 255, 0.95)',
//   //     boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(79, 70, 229, 0.2)',
//   //     transform: 'translateY(-1px)',
//   //   },
//   //   button: {
//   //     padding: '0.75rem 1.5rem',
//   //     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//   //     color: 'white',
//   //     border: 'none',
//   //     borderRadius: '16px',
//   //     cursor: 'pointer',
//   //     fontSize: '1rem',
//   //     fontWeight: 600,
//   //     display: 'flex',
//   //     alignItems: 'center',
//   //     gap: '0.5rem',
//   //     transition: 'all 0.3s ease',
//   //     boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
//   //     minWidth: '100px',
//   //     justifyContent: 'center',
//   //   },
//   //   buttonHover: {
//   //     background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
//   //     transform: 'translateY(-2px)',
//   //     boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
//   //   },
//   //   buttonActive: {
//   //     transform: 'translateY(0)',
//   //     boxShadow: '0 2px 10px rgba(102, 126, 234, 0.4)',
//   //   },
//   //   buttonDisabled: {
//   //     opacity: 0.6,
//   //     cursor: 'not-allowed',
//   //     transform: 'none',
//   //     boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
//   //   },
//   //   warningBox: {
//   //     backgroundColor: '#fef9c3',
//   //     border: '1px solid #fde68a',
//   //     color: '#92400e',
//   //     padding: '0.75rem 1rem',
//   //     borderRadius: '0.5rem',
//   //     fontSize: '0.875rem',
//   //     marginBottom: '1rem',
//   //   },
//   //   downloadLink: {
//   //     color: '#2563eb',
//   //     textDecoration: 'underline',
//   //     fontWeight: 500,
//   //     marginLeft: '0.25rem',
//   //     cursor: 'pointer',
//   //     background: 'none',
//   //     border: 'none',
//   //   },
//   //   resultTableWrapper: {
//   //     marginTop: '1.25rem',
//   //     padding: '1rem',
//   //     borderRadius: '12px',
//   //     background: 'rgba(255, 255, 255, 0.05)',
//   //     backdropFilter: 'blur(10px)',
//   //     WebkitBackdropFilter: 'blur(10px)',
//   //     boxShadow: '0 0 12px rgba(0, 0, 0, 0.2)',
//   //     overflowX: 'auto',
//   //     border: '1px solid rgba(255, 255, 255, 0.15)',
//   //   },
//   //   resultTable: {
//   //     width: '100%',
//   //     borderCollapse: 'collapse',
//   //     color: 'white',
//   //     fontSize: '0.9rem',
//   //   },
//   //   resultTableHeader: {
//   //     backgroundColor: 'rgba(30, 41, 59, 0.8)',
//   //     color: '#facc15',
//   //     padding: '0.5rem',
//   //     border: '1px solid #4b5563',
//   //     textAlign: 'left',
//   //   },
//   //   resultTableCell: {
//   //     padding: '0.5rem',
//   //     border: '1px solid #4b5563',
//   //   },
//   //   expandNote: {
//   //     textAlign: 'center',
//   //     backgroundColor: '#f9fafb',
//   //     color: '#374151',
//   //     fontStyle: 'italic',
//   //     padding: '0.5rem',
//   //   },
//   //   chartSection: {
//   //     marginTop: '1rem',
//   //     marginBottom: '0.5rem',
//   //   },
//   //   chartTitle: {
//   //     fontSize: '14px',
//   //     fontWeight: 'bold',
//   //     color: 'white',
//   //     marginBottom: '10px',
//   //   },
//   //   collapseButton: {
//   //     textAlign: 'right',
//   //     marginTop: '0.5rem',
//   //   },
//   //   collapseButtonLink: {
//   //     fontWeight: 'bold',
//   //     textDecoration: 'underline',
//   //     color: '#ef4444',
//   //     background: 'none',
//   //     border: 'none',
//   //     cursor: 'pointer',
//   //   },
//   //   recommendationBox: {
//   //     marginTop: '1rem',
//   //     padding: '1rem 1.25rem',
//   //     borderRadius: '12px',
//   //     background: 'rgba(255, 255, 255, 0.1)',
//   //     backdropFilter: 'blur(8px)',
//   //     WebkitBackdropFilter: 'blur(8px)',
//   //     color: 'white',
//   //     borderLeft: '4px solid #facc15',
//   //     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
//   //     fontSize: '0.95rem',
//   //   },
//   //   recommendationHeader: {
//   //     fontWeight: 600,
//   //     marginBottom: '0.5rem',
//   //     color: '#fde047',
//   //   },
//   //   recommendationText: {
//   //     lineHeight: 1.5,
//   //   },
//   // };

 


 

//   const formatDateForChat = (timestamp) => {
//     const messageDate = new Date(timestamp);
//     const today = new Date();
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     if (messageDate.toDateString() === today.toDateString()) return "Today";
//     if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
//     return messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
//   };
// const generateNextMonthQuestion = (question) => {
//   const monthsFull = [
//     "january", "february", "march", "april", "may", "june",
//     "july", "august", "september", "october", "november", "december"
//   ];

//   const monthsShort = {
//     jan: "january", feb: "february", mar: "march", apr: "april",
//     may: "may", jun: "june", jul: "july", aug: "august",
//     sep: "september", oct: "october", nov: "november", dec: "december"
//   };

//   // 1) Your existing word-based month detection (unchanged)
//   const match = question.match(
//     /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i
//   );

//   if (match) {
//     const normalized = monthsShort[match[0].toLowerCase()] || match[0].toLowerCase();
//     const index = monthsFull.indexOf(normalized);
//     if (index !== -1) {
//       const nextMonth = monthsFull[(index + 1) % 12];
//       return question.replace(
//         new RegExp(match[0], 'i'),
//         nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
//       );
//     }
//   }

//   // 2) NEW: contextual numeric month like "month 2", "mon:03", "m=11"
//   const ctxNum = question.match(/\b(?:month|mon|m)\s*[:=]?\s*(0?[1-9]|1[0-2])\b/i);
//   if (ctxNum) {
//     const n = parseInt(ctxNum[1], 10);            // 1..12
//     const nextMonth = monthsFull[n % 12];         // 1→Feb, 12→Jan
//     return question.replace(
//       ctxNum[0],
//       nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
//     );
//   }

//   // 3) NEW: bare numeric month if it's the ONLY number in the question (e.g., "1", "02")
//   const numbers = question.match(/\b\d+\b/g);
//   if (numbers && numbers.length === 1) {
//     const n = parseInt(numbers[0], 10);
//     if (n >= 1 && n <= 12) {
//       const nextMonth = monthsFull[n % 12];
//       // replace that exact number (optionally with a leading 0)
//       return question.replace(
//         new RegExp(`\\b0?${n}\\b`),
//         nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1)
//       );
//     }
//   }

//   return null;
// };


//   // Dataset columns for context-aware suggestions
//   const DATASET_COLUMNS = [
//     'rto_risk_factor', 'ncb_%_previous_year', 'state_risk_score', 'retention_rate_pct',
//     'total_od_premium_max', 'applicable_discount_with_ncb', 'policy_wise_purchase',
//     'manufacturer_risk_rate', 'days_between_renewals', 'retention_streak',
//     'total_od_premium_mean', 'total_od_premium', 'firstpolicyyear', 'lag_1_tp_premium',
//     'total_od_premium_min', 'avg_premium_hist', 'lag_1_ncb', 'age', 'total_tp_premium_max',
//     'total_tp_premium_mean', 'total_tp_premium', 'total_tp_premium_min', 'lag_1_premium',
//     'previous_year_premium_ratio', 'total_premium_payable', 'total_revenue', 'gst',
//     'fuel_type_risk_factor', 'lag_1_od_premium', 'customer_apv', 'segment_risk_score',
//     'vehicle_idv', 'policy_tenure', 'number_of_claims', 'approved', 'claim_approval_rate',
//     'customer_tenure', 'before_gst_add-on_gwp', 'od_tp_ratio', 'add_on_adoption',
//     'clv', 'idv_premium_ratio', 'customer_apf', 'days_gap_prev_end_to_curr_start',
//     'customerid', 'claim_happaned/not', 'cleaned_branch_name_2', 'cleaned_chassis_number',
//     'cleaned_engine_number', 'cleaned_reg_no', 'cleaned_state2', 'cleaned_zone_2',
//     'biztype', 'corrected_name', 'make_clean', 'model_clean', 'product_name',
//     'policy_no', 'decline', 'tie_up', 'variant', 'policy_status',
//     'policy_start_date_year', 'policy_end_date_year', 'policy_start_date_month',
//     'policy_end_date_month', 'policy_start_date_day', 'policy_end_date_day',
//     'predicted_status', 'churn_probability', 'clv_category', 'discount_category',
//     'churn_category', 'customer_segment', 'not_renewed_reasons', 'main_reason',
//     'primary_recommendation', 'additional_offers', 'retention_channel'
//   ];

//   // Comprehensive suggestion templates organized by topic
//   const SUGGESTION_TEMPLATES = {
//   churn: [
//     'Show churn probability by customer segment',
//     'What are the main reasons for not renewing?',
//     'Show retention rate by state and zone',
//     // 'Analyze churn patterns by policy tenure',
//     // 'What is the relationship between claims and churn?',
//     // 'Show retention streak analysis across segments'
//   ],
//   premium: [
//     // 'Show average premium by vehicle make',
//     'What is the premium trend over years?',
//     // 'Compare OD vs TP premium distribution',
//     // 'Analyze premium variations by customer segment',
//     // 'Show IDV to premium ratio analysis',
//     // 'What factors influence premium pricing most?'
//   ],
//   claims: [
//     'Show claim approval rate by state',
//     // 'What is the relationship between claims and churn?',
//     // 'Show claims distribution by vehicle age',
//     // 'Analyze claim patterns by manufacturer',
//     // 'Show claim frequency vs premium correlation',
//     // 'What are the most common claim scenarios?'
//   ],
//   customer: [
//     'Show top 10 vehicle makes by policy count',

//     // 'Show customer lifetime value by segment',
//     // 'What are the characteristics of high-value customers?',
//     // 'Show customer tenure distribution',
//     // 'Analyze customer acquisition vs retention costs',
//     // 'Show customer segment migration patterns',
//     // 'What drives customer loyalty in insurance?'
//   ],
//   vehicle: [
//     'Show state-wise retention patterns',
//     // 'What is the average IDV by vehicle make?',
//     // 'Show vehicle age vs premium relationship',
//     // 'Analyze risk factors by manufacturer',
//     // 'Show fuel type distribution and risk impact',
//     // 'What are the most profitable vehicle segments?'
//   ],
//   cars: [
//     'Show top 10 vehicle makes by policy count',
//     // 'What is the average IDV by vehicle make?',
//     // 'Show vehicle age vs premium relationship',
//     // 'Analyze risk factors by manufacturer',
//     // 'Show fuel type distribution and risk impact',
//     // 'What are the most profitable vehicle segments?'
//   ],
//   regional: [
//     'Show policy distribution by zone',
//     'Which state has the highest risk score?',
//     'Compare business performance across states',
//     // 'Analyze regional premium variations',
   
//     // 'What are the regional growth opportunities?'
//   ],
//   discount: [
//     // 'Show NCB distribution across customers',
//     // 'What is the average discount by customer category?',
//     'Give me top 5 branches based on churn',
//     // 'Show relationship between NCB and retention',
//     // 'Analyze discount effectiveness on renewals',
//     // 'Show applicable discount trends over time',
//     // 'What is the optimal discount strategy?'
//   ],
//   risk: [
//     // 'Show risk factors by manufacturer',
//     // 'What are the key risk indicators?',
//     // 'Show fuel type risk distribution',
//     // 'Analyze RTO risk factor patterns',
//     'Show segment risk score analysis',
//     // 'What predicts high-risk customers?'
//   ],
//   recommendations: [
//     'Show primary recommendations by customer segment',
//     // 'What retention strategies work best?',
//     // 'Show additional offers effectiveness',
//     // 'Analyze recommendation success rates',
//     // 'Show channel effectiveness for retention',
//     // 'What are the most successful retention tactics?'
//   ],
//   temporal: [
//     // 'Compare policy trends between 2024 and 2025',
//     'Show monthly policy distribution',
//     // 'What is the renewal pattern by month?',
//     // 'Analyze seasonal variations in business',
//     // 'Show yearly growth trends',
//     // 'What are the peak business periods?'
//   ],
//   general: [
//     // 'What can you do?',
//     // 'Tell me a fun fact about insurance',
//     // 'How can you help with insurance analysis?',
//     'Analyze churn patterns by policy tenure',
//     'Which branch have the high churn probability?',
//     // 'What is the average of customer life time?',
//     // 'What insights can you provide?',
//     // 'Show IDV to premium ratio analysis',
//     'Give me a top 5 branches performing well',
//     'What is the churn rate by customer segment?',
//     // 'What is the distribution of vehicle IDV across different policy tenures?',
//     'What are the top churn reasons across all zones?',
//     'Which state has the highest revenue from policies not renewed?',
//     'Give me top 5 branches based on churn',
//     // 'Show state-wise retention patterns',
//     'Show churn probability by customer segment',
//     'What are the main reasons for not renewing?',
//     'Show retention rate by state and zone',
//     // 'Show me data overview',
//     // 'What are the key business metrics?'
//   ],
//   // conversational: [
//   //   'What is your name?',
//   //   'What is your purpose?',
//   //   'How do you work?',
//   //   'What services do you provide?',
//   //   'Can you help me with something?',
//   //   'Do you have feelings?'
//   // ],
//   // fun: [
//   //   'Want to hear another fun fact?',
//   //   'Show me something surprising in the data',
//   //   'What else can you do?',
//   //   'Tell me an interesting insight',
//   //   'What would you recommend exploring?',
//   //   'Show me the most unusual data pattern'
//   // ]
// };

// // Enhanced function to generate dynamic suggestions based on conversation context and dataset
// const generateDynamicSuggestions = (messages, activeSource, connectedDbDetails, forceRefresh = false) => {
//   const suggestions = [];
//   let usedSuggestions = new Set();

//   // Get conversation history to avoid repeating suggestions
//   if (!forceRefresh && messages && messages.length > 0) {
//     messages.forEach(msg => {
//       if (msg.role === 'user') {
//         usedSuggestions.add(msg.content.toLowerCase().trim());
//       }
//     });
//   }

//   const recentMessages = messages.slice(-4);
//   const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop();
//   const lastAssistantMessage = recentMessages.filter(m => m.role === 'assistant').pop();

//   if (!lastUserMessage) {
//     // Return default suggestions if no user message
//     return SUGGESTION_TEMPLATES.general.slice(0, 6).map(text => ({
//       text,
//       type: 'general'
//     }));
//   }

//   const userQuestion = lastUserMessage.content.toLowerCase();

//   // Month-based suggestions (always include if applicable)
//   const nextMonthQuestion = generateNextMonthQuestion(lastUserMessage.content);
//   if (nextMonthQuestion && !usedSuggestions.has(nextMonthQuestion.toLowerCase())) {
//     suggestions.push({
//       text: nextMonthQuestion,
//       type: 'month-follow-up'
//     });
//   }

//   // Determine primary topic and get 6 suggestions
//   let primaryTopic = null;
//   let topicSuggestions = [];

//   // Topic detection with priority
//   if (userQuestion.includes('churn') || userQuestion.includes('renewal') || userQuestion.includes('retention')) {
//     primaryTopic = 'churn';
//     topicSuggestions = SUGGESTION_TEMPLATES.churn;
//   } else if (userQuestion.includes('premium') || userQuestion.includes('revenue') || userQuestion.includes('idv')) {
//     primaryTopic = 'premium';
//     topicSuggestions = SUGGESTION_TEMPLATES.premium;
//   } else if (userQuestion.includes('claim') || userQuestion.includes('claims') || userQuestion.includes('approval')) {
//     primaryTopic = 'claims';
//     topicSuggestions = SUGGESTION_TEMPLATES.claims;
//   } else if (userQuestion.includes('customer') || userQuestion.includes('segment') || userQuestion.includes('clv')) {
//     primaryTopic = 'customer';
//     topicSuggestions = SUGGESTION_TEMPLATES.customer;
//   } else if (userQuestion.includes('vehicle') || userQuestion.includes('make') || userQuestion.includes('model') || userQuestion.includes('manufacturer')) {
//     primaryTopic = 'vehicle';
//     topicSuggestions = SUGGESTION_TEMPLATES.vehicle;
//   } else if (userQuestion.includes('state') || userQuestion.includes('zone') || userQuestion.includes('region') || userQuestion.includes('rto')) {
//     primaryTopic = 'regional';
//     topicSuggestions = SUGGESTION_TEMPLATES.regional;
//   } else if (userQuestion.includes('discount') || userQuestion.includes('ncb')) {
//     primaryTopic = 'discount';
//     topicSuggestions = SUGGESTION_TEMPLATES.discount;
//   } else if (userQuestion.includes('risk') || userQuestion.includes('score') || userQuestion.includes('factor')) {
//     primaryTopic = 'risk';
//     topicSuggestions = SUGGESTION_TEMPLATES.risk;
//   } else if (userQuestion.includes('recommendation') || userQuestion.includes('strategy') || userQuestion.includes('retention')) {
//     primaryTopic = 'recommendations';
//     topicSuggestions = SUGGESTION_TEMPLATES.recommendations;
//   } else if (userQuestion.includes('year') || userQuestion.includes('2024') || userQuestion.includes('2025') || userQuestion.includes('month')) {
//     primaryTopic = 'temporal';
//     topicSuggestions = SUGGESTION_TEMPLATES.temporal;
//   // } else if (["hi", "hello", "hey", "how are you"].some(greet => userQuestion.includes(greet))) {
//   //   primaryTopic = 'conversational';
//   //   topicSuggestions = SUGGESTION_TEMPLATES.conversational;
//   // } else if (["wow", "awesome", "cool", "amazing", "great", "nice", "interesting", "hahaha"].some(word => userQuestion.includes(word))) {
//   //   primaryTopic = 'fun';
//   //   topicSuggestions = SUGGESTION_TEMPLATES.fun;
//   // }
//   }else {
//     primaryTopic = 'general';
//     topicSuggestions = SUGGESTION_TEMPLATES.general;
//   }

//   // Add topic-specific suggestions (filtering out already used ones)
//   const availableTopicSuggestions = topicSuggestions.filter(text =>
//     !usedSuggestions.has(text.toLowerCase())
//   );

//   availableTopicSuggestions.forEach(text => {
//     if (suggestions.length < 6) {
//       suggestions.push({
//         text,
//         type: primaryTopic
//       });
//     }
//   });

//     // If we don't have enough suggestions, add from related topics
//     if (suggestions.length < 6) {
//       const relatedTopics = getRelatedTopics(primaryTopic);
     
//       relatedTopics.forEach(topic => {
//         if (suggestions.length < 6) {
//           const relatedSuggestions = SUGGESTION_TEMPLATES[topic] || [];
//           relatedSuggestions.forEach(text => {
//             if (suggestions.length < 6 && !usedSuggestions.has(text.toLowerCase())) {
//               suggestions.push({
//                 text,
//                 type: topic
//               });
//             }
//           });
//         }
//       });
//     }

//     // Database-specific suggestions
//     if (activeSource === 'database') {
//       if (userQuestion.includes('count') || userQuestion.includes('how many')) {
//         suggestions.push(
//           { text: 'Show breakdown by policy status', type: 'breakdown' },
//           { text: 'What is the average across different segments?', type: 'analytics' }
//         );
//       }
//     }

//     // File-specific suggestions
//     if (activeSource === 'file') {
//       if (userQuestion.includes('total') || userQuestion.includes('sum')) {
//         suggestions.push(
//           { text: 'Show detailed breakdown by category', type: 'breakdown' },
//           { text: 'Create a visualization of this data', type: 'visualization' }
//         );
//       }
//     }

//     // Chart suggestions if data is available
//     if (lastAssistantMessage && lastAssistantMessage.rows && lastAssistantMessage.rows.length > 0) {
//       if (suggestions.length < 6) {
//         suggestions.push(
//           { text: 'Create a chart visualization of this data', type: 'chart' },
//           { text: 'Show correlation analysis', type: 'correlation' }
//         );
//       }
//     }

//     // Ensure we have exactly 6 suggestions
//     const finalSuggestions = suggestions.slice(0, 6);
   
//     // If still not enough, fill with general suggestions
//     while (finalSuggestions.length < 6) {
//       const remainingGeneral = SUGGESTION_TEMPLATES.general.filter(text =>
//         !finalSuggestions.some(s => s.text === text) && !usedSuggestions.has(text.toLowerCase())
//       );
     
//       if (remainingGeneral.length > 0) {
//         finalSuggestions.push({
//           text: remainingGeneral[0],
//           type: 'general'
//         });
//       } else {
//         break;
//       }
//     }

//     return finalSuggestions;
//   };

//   // Helper function to get related topics
//   const getRelatedTopics = (primaryTopic) => {
//     const topicRelations = {
//       churn: ['customer', 'recommendations', 'premium'],
//       premium: ['customer', 'vehicle', 'regional'],
//       claims: ['risk', 'vehicle', 'customer'],
//       customer: ['churn', 'premium', 'recommendations'],
//       vehicle: ['premium', 'risk', 'claims'],
//       regional: ['premium', 'risk', 'customer'],
//       discount: ['customer', 'premium', 'churn'],
//       risk: ['vehicle', 'claims', 'regional'],
//       recommendations: ['customer', 'churn', 'premium'],
//       temporal: ['premium', 'customer', 'churn'],
//       general: ['customer', 'premium', 'churn'],
//       conversational: ['general', 'fun'],
//       fun: ['general', 'conversational']
//     };

//     return topicRelations[primaryTopic] || ['general'];
//   };

//   // Function to refresh suggestions (call this after user clicks a suggestion)
//   const refreshSuggestions = (messages, activeSource, connectedDbDetails) => {
//     return generateDynamicSuggestions(messages, activeSource, connectedDbDetails, true);
//   };

//   // Export functions
//   if (typeof module !== 'undefined' && module.exports) {
//     module.exports = {
//       generateDynamicSuggestions,
//       refreshSuggestions,
//       generateNextMonthQuestion,
//       SUGGESTION_TEMPLATES,
//       DATASET_COLUMNS
//     };
//   }

//   const components = {
//     table: ({ children }) => (
//       <div style={styles.tableWrapper}>
//         <table style={styles.markdownTable}>{children}</table>
//       </div>
//     ),
//     thead: ({ children }) => <thead style={styles.tableHead}>{children}</thead>,
//     th: ({ children }) => <th style={styles.tableHeader}>{children}</th>,
//     tbody: ({ children }) => <tbody style={styles.tableBody}>{children}</tbody>,
//     tr: ({ children }) => <tr style={styles.tableRow}>{children}</tr>,
//     td: ({ children }) => <td style={styles.tableCell}>{children}</td>,
//   };

//   // --- Narrative renderer (JSON from backend humanizer) ---
// // const NarrativeBlock = ({ narrative }) => {
// //   if (!narrative) return null;
// //   const { opener = "", insights = [], recommendations = [], next_step = "" } = narrative || {};
// //   const hasInsights = Array.isArray(insights) && insights.length;
// //   const hasRecs = Array.isArray(recommendations) && recommendations.length;

// //   return (
// //     <div style={styles.narrativeCard}>
// //       {opener ? <div style={styles.narrativeOpener}>{opener}</div> : null}

// //       {hasInsights && (
// //         <div>
// //           <div style={styles.narrativeLabel}>Key insights</div>
// //           <ul style={styles.narrativeList}>
// //             {insights.map((i, idx) => <li key={idx}>{i}</li>)}
// //           </ul>
// //         </div>
// //       )}

// //       {hasRecs && (
// //         <div>
// //           <div style={styles.narrativeLabel}>Recommendations</div>
// //           <ul style={styles.narrativeList}>
// //             {recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
// //           </ul>
// //         </div>
// //       )}

// //       {next_step ? <div style={styles.nextStep}>{next_step}</div> : null}
// //     </div>
// //   );
// // };


//   const Sara = () => {
//     const [messages, setMessages] = useState([
//       {
//         sender: "bot",
//         text: "👋 Welcome! I'm here to help you explore insights from your data — including churn patterns, customer segments, performance dashboards, and strategic recommendations. Ask a question to get started."
//       }
//     ]);
//     const [input, setInput] = useState("");
//     const [inputFocused, setInputFocused] = useState(false);
//     const [buttonHovered, setButtonHovered] = useState(false);
//     const messagesEndRef = useRef(null);
//     const sessionIdRef = useRef(null);
//     const [expandedTables, setExpandedTables] = useState({});
//     const [isLoading, setIsLoading] = useState(false);
//     const [expandedTableContent, setExpandedTableContent] = useState(null);
//     const [suggestions, setSuggestions] = useState([]);
//     const [loopingSuggestionIndex, setLoopingSuggestionIndex] = useState(0);
//     const [loopingSuggestionsActive, setLoopingSuggestionsActive] = useState(false);
//     const chatBoxRef = useRef(null);
//     const hasMountedRef = useRef(false);
//     const [sessionReady, setSessionReady] = useState(false);
//     const connectOnceRef = useRef(false);
//     const lastMsgRef = useRef(null);

   
//     useEffect(() => {
//       if (!sessionIdRef.current) {
//         const existing = sessionStorage.getItem("session_id");
//         if (existing) sessionIdRef.current = existing;
//         else {
//           const newId = crypto.randomUUID();
//           sessionStorage.setItem("session_id", newId);
//           sessionIdRef.current = newId;
//         }
//       }
//     }, []);


//     // and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
// const UPPER_WORDS = new Set(['idv','od','tp','ncb','clv','rto','gst']);

// const formatHeader = (key) => {
//   if (!key) return '';
//   const spaced = String(key)
//     .replace(/[_\-]+/g, ' ')            // snake/kebab -> spaces
//     .replace(/([a-z])([A-Z])/g, '$1 $2')// split camelCase
//     .trim();

//   return spaced
//     .split(/\s+/)
//     .map(w => {
//       const lw = w.toLowerCase();
//       return UPPER_WORDS.has(lw) ? lw.toUpperCase() : lw.charAt(0).toUpperCase() + lw.slice(1);
//     })
//     .join(' ');
// };

//     useEffect(() => {
//     if (!hasMountedRef.current) {
//       hasMountedRef.current = true;
//       return; // prevent scroll on first render
//     }

//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   // Pretty header labels: remove _/-, split camelCase, Title Case,
// // and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
// // const UPPER_WORDS = new Set(['idv','od','tp','ncb','clv','rto','gst']);

// // const formatHeader = (key) => {
// //   if (!key) return '';
// //   const spaced = String(key)
// //     .replace(/[_\-]+/g, ' ')            // snake/kebab -> spaces
// //     .replace(/([a-z])([A-Z])/g, '$1 $2')// split camelCase
// //     .trim();

// //   return spaced
// //     .split(/\s+/)
// //     .map(w => {
// //       const lw = w.toLowerCase();
// //       return UPPER_WORDS.has(lw) ? lw.toUpperCase() : lw.charAt(0).toUpperCase() + lw.slice(1);
// //     })
// //     .join(' ');
// // };


//   useEffect(() => {
//     // Function to reset all scroll positions
//     const resetScrollPositions = () => {
//       // Reset window scroll
//       window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
     
//       // Reset chat box scroll
//       if (chatBoxRef.current) {
//         chatBoxRef.current.scrollTop = 0;
//       }
     
//       // Reset body scroll if needed
//       document.body.scrollTop = 0;
//       document.documentElement.scrollTop = 0;
//     };

//     // Try immediate reset
//     resetScrollPositions();
   
//     // Also try after a small delay to ensure DOM is ready
//     const timeoutId = setTimeout(resetScrollPositions, 10);
   
//     // Cleanup timeout on unmount
//     return () => clearTimeout(timeoutId);
//   }, []); // Empty dependency array means this runs once on mount

//   // You might also want to add this effect to handle route changes
//   // if you're using React Router or similar
//   useEffect(() => {
//     const handleRouteChange = () => {
//       window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
//       if (chatBoxRef.current) {
//         chatBoxRef.current.scrollTop = 0;
//       }
//     };

//     // If you're using React Router, you can listen to location changes
//     // This is just an example - adjust based on your routing solution
//     window.addEventListener('popstate', handleRouteChange);
   
//     return () => {
//       window.removeEventListener('popstate', handleRouteChange);
//     };
//   }, []);

//   // put this inside your component, above the return()
// // const formatCell = (val) => {
// //   if (val === null || val === undefined) return "";
// //   const num = typeof val === "number" ? val : Number(val);
// //   if (Number.isFinite(num)) {
// //     // always show exactly 2 decimals
// //     return num.toLocaleString(undefined, {
// //       minimumFractionDigits: 2,
// //       maximumFractionDigits: 2,
// //     });
// //   }
// //   return String(val);
// // };

// const formatCell = (val) => {
//   if (val === null || val === undefined) return "";
//   const s = String(val).trim();
//   const isPercent = s.endsWith("%");
//   const num = typeof val === "number"
//     ? val
//     : Number(s.replace(/,/g, "").replace(/%$/, ""));
//   if (Number.isFinite(num)) {
//     const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
//     return isPercent ? `${formatted}%` : formatted;
//   }
//   return s;
// };


// // ---------- Unit inference + header/cell helpers ----------
// // ---------- Unit inference + header/cell helpers (robust) ----------
// const CURRENCY_SYMBOL = "₹";

// // Force-known units (lowercase keys)
// const UNIT_MAP = {
//   clv: CURRENCY_SYMBOL,
//   avg_clv: CURRENCY_SYMBOL,
//   total_revenue: CURRENCY_SYMBOL,
//   avg_premium: CURRENCY_SYMBOL,
//   avg_vehicle_idv: CURRENCY_SYMBOL,
//   idv: CURRENCY_SYMBOL,
//   gst: CURRENCY_SYMBOL,

//   churn_probability: "%",
//   retention_rate_pct: "%",
//   claim_approval_rate: "%",

//   policy_tenure: "Months",
//   customer_tenure: "Months",
//   policy_start_date_year: "Year",
//   policy_end_date_year: "Year",
//   policy_start_date_month: "Months",
//   policy_end_date_month: "Months",
//   policy_start_date_day: "Days",
//   policy_end_date_day: "Days",
// };

// // column names that are almost certainly CATEGORICAL, never add units
// const CATEGORICAL_HINTS =
//   /\b(segment|customer|name|state|zone|city|branch|make|model|variant|product|channel)\b/i;

// const _strip = (v) => String(v ?? "").trim();
// const _num = (v) => Number(_strip(v).replace(/[^0-9.\-]/g, ""));
// const _isNumeric = (s) => Number.isFinite(_num(s));
// const _hasLetters = (s) => /[A-Za-z]/.test(_strip(s));

// const _analyzeSamples = (samples) => {
//   const n = samples.length || 1;
//   const numeric = samples.filter(_isNumeric).length;
//   const alpha   = samples.filter(_hasLetters).length;
//   return {
//     shareNumeric: numeric / n,
//     shareAlpha: alpha / n,
//     allIntegers: samples
//       .filter(_isNumeric)
//       .every((s) => Number.isInteger(_num(s))),
//   };
// };

// const normalizeTimeUnit = (unit = "") => {
//   const u = unit.toLowerCase();
//   if (u.startsWith("year"))  return "Year";
//   if (u.startsWith("month")) return "Month";
//   if (u.startsWith("week"))  return "Week";
//   if (u.startsWith("day"))   return "Day";
//   if (u.startsWith("hour"))  return "Hour";
//   if (u.startsWith("min"))   return "Minute";
//   if (u.startsWith("sec"))   return "Second";
//   return unit || "";
// };

// const pluralizeTimeUnit = (unit, value) => {
//   const base = normalizeTimeUnit(unit);
//   const v = Math.abs(Number(value));
//   return v === 1 ? base : `${base}${base.endsWith("s") ? "" : "s"}`;
// };

// const cellAlreadyHasTimeUnit = (raw, unit) => {
//   const base = normalizeTimeUnit(unit);
//   if (!base) return false;
//   const re = new RegExp(`\\b${base}(?:s)?\\b`, "i"); // Month/Months, Year/Years, etc.
//   return re.test(raw);
// };


// /** Infer unit from column name + sample values (safe for categorical columns) */
// const inferUnitForColumn = (key, rows) => {
//   const k = String(key || "").toLowerCase();

//   // counts should be plain numbers, never percent—even if values are 0..100
//   if (/\bcount\b/.test(k) || /_count\b/.test(k) || /\b(year|month)\s*count\b/.test(k)) {
//     return { unit: "", type: "number" };
//   }


//   // never add units to obvious categorical columns
//   if (CATEGORICAL_HINTS.test(k)) return { unit: "", type: "text" };

//   if (UNIT_MAP[k]) {
//     const u = UNIT_MAP[k];
//     return {
//       unit: u,
//       type: ["Year", "Years", "Months", "Weeks", "Days"].includes(u)
//         ? "time"
//         : u === "%"
//         ? "percent"
//         : "currency",
//     };
//   }

//   const samples = rows
//     .slice(0, 50)
//     .map((r) => r?.[key])
//     .filter((v) => v !== null && v !== undefined)
//     .map(String);

//   const { shareNumeric, shareAlpha, allIntegers } = _analyzeSamples(samples);
//   const nums = samples.filter(_isNumeric).map(_num);

//   // Percent by name
//   if (/\b(pct|percent|percentage|probab|probability|rate|ratio)\b/.test(k)) {
//     return { unit: "%", type: "percent" };
//   }
//   // Percent by values: mostly numeric, all within 0..100, and not many alpha cells
//   if (
//     shareNumeric >= 0.7 &&
//     shareAlpha <= 0.2 &&
//     nums.length &&
//     nums.every((n) => n >= 0 && n <= 100)
//   ) {
//     return { unit: "%", type: "percent" };
//   }

//   // Time by name
//   if (/\byears?\b|\byrs?\b/.test(k)) return { unit: "Years", type: "time" };
//   if (/\bmonths?\b/.test(k)) return { unit: "Months", type: "time" };
//   if (/\bweeks?\b/.test(k)) return { unit: "Weeks", type: "time" };
//   if (/\bdays?\b/.test(k)) return { unit: "Days", type: "time" };
//   if (/\btenure\b|\bage\b/.test(k)) return { unit: "Months", type: "time" }; // default

//   // Time by values: mostly numeric integers with typical ranges and no alpha
//   if (shareNumeric >= 0.8 && shareAlpha === 0 && allIntegers) {
//     if (nums.every((n) => n >= 1900 && n <= 2100)) return { unit: "Year", type: "time" };
//     if (nums.every((n) => n >= 1 && n <= 12))      return { unit: "Months", type: "time" };
//     if (nums.every((n) => n >= 1 && n <= 53))      return { unit: "Weeks",  type: "time" };
//     if (nums.every((n) => n >= 1 && n <= 31))      return { unit: "Days",   type: "time" };
//   }

//   // Currency by name/value
//   if (
//     /\b(revenue|premium|amount|idv|gwp|clv|price|cost|value|payment)\b/.test(k) ||
//     samples.some((s) => /[₹$€£]/.test(s))
//   ) {
//     return { unit: CURRENCY_SYMBOL, type: "currency" };
//   }

//   return { unit: "", type: "number" };
// };

// const CUSTOM_HEADER_LABELS = {
//   max_year:        "Policy End Year",
//   min_year:        "Start Year",        // (optional) if you want this too
//   data_end_year:   "Policy End Year",
//   data_start_year: "Start Year",
//   scope_end_year:  "Policy End Year",
//   scope_start_year:"Start Year",
// };

// const buildHeaderLabel = (key, rows) => {
//   const rawKey = String(key || "").toLowerCase();

//   // 👇 If we have an override, use it exactly as-is (no unit suffix)
//   if (CUSTOM_HEADER_LABELS[rawKey]) {
//     return CUSTOM_HEADER_LABELS[rawKey];
//   }

//   const { unit } = inferUnitForColumn(key, rows);
//   const base = formatHeader(key); // e.g., "Max Year"

//   if (!unit) return base;

//   // strip trailing unit-y words to avoid "Year (Year)"
//   const cleaned = base
//     .replace(/\s*%$/i, "")
//     .replace(/\s*\b(Years?|Months?|Weeks?|Days?)\b$/i, "")
//     .trim();

//   return `${cleaned} (${unit})`;
// };

// /** Build header like "Policy Tenure (Months)" or "Churn Rate (%)" */
// // const buildHeaderLabel = (key, rows) => {
// //   const { unit } = inferUnitForColumn(key, rows);
// //   const base = formatHeader(key); // your existing pretty title
// //   if (!unit) return base;

// //   // strip units already stuck to the name
// //   const cleaned = base
// //     .replace(/\s*%$/i, "")
// //     .replace(/\s*\b(Years?|Months?|Weeks?|Days?)\b$/i, "")
// //     .trim();

// //   return `${cleaned} (${unit})`;
// // };

// // /** Append unit inside the cell only when it's numeric and needs it */
// // const formatCellWithUnit = (val, key, rows) => {
// //   const { type, unit } = inferUnitForColumn(key, rows);
// //   const raw = String(val ?? "").trim();
// //   let s = formatCell(val); // your existing formatter
// //   if (s === "") return s;

// //   // only append to numeric values
// //   const isNumericCell = _isNumeric(raw);

// //   if (type === "percent" && isNumericCell && !raw.endsWith("%")) {
// //     return `${s}%`;
// //   }
// //   if (type === "time" && isNumericCell) {
// //     return `${s} ${unit}`;
// //   }
// //   return s;
// // };

// /** Append unit inside the cell only when it's numeric and needs it */
// // const formatCellWithUnit = (val, key, rows) => {
// //   const { type, unit } = inferUnitForColumn(key, rows);
// //   const raw = String(val ?? "").trim();
// //   if (!raw) return "";

// //   const n = Number(raw.replace(/[^0-9.\-]/g, ""));
// //   const isNum = Number.isFinite(n);

// //   // If it's clearly non-numeric text (e.g., "Elite Retainers"), don't touch it
// //   if (!isNum && /[A-Za-z]/.test(raw)) return raw;

// //   // Percent: format number and append %, but don't double-append
// //   if (type === "percent") {
// //     if (raw.endsWith("%")) return raw; // already has a percent sign
// //     const numStr = n.toLocaleString(undefined, { maximumFractionDigits: 0 });
// //     return `${numStr}%`;
// //   }

// //   // Time: append the unit; for Year(s) show plain integer (no grouping)
// //   // if (type === "time") {
// //   //   // If the cell already contains the unit text, leave it as-is
// //   //   const alreadyHasUnit = new RegExp(`\\b${unit}\\b`, "i").test(raw);
// //   //   if (alreadyHasUnit) return raw;

// //   //   const out =
// //   //     unit === "Year" || unit === "Years"
// //   //       ? String(Math.trunc(n)) // no thousands separator for years
// //   //       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// //   //   return `${out} ${unit}`;
// //   // }

// //   if (type === "time") {
// //     // If the cell already has a unit (Month/Months/Year/Years/etc.), keep as-is
// //     if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

// //     const baseUnit  = normalizeTimeUnit(unit);         // -> Year/Month/Week/Day/Hour/Minute/Second
// //     const unitLabel = pluralizeTimeUnit(baseUnit, n);  // 1 Month, 2 Months, etc.

// //     const out =
// //       baseUnit === "Year"
// //         ? String(Math.trunc(n)) // avoid thousands grouping for years
// //         : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// //     return `${out} ${unitLabel}`;
// //   }

// //   // Everything else uses the generic formatter you already have
// //   return formatCell(val);
// // };

// /** Append unit inside the cell only when it's numeric and needs it */
// const formatCellWithUnit = (val, key, rows) => {
//   const { type, unit } = inferUnitForColumn(key, rows);
//   const raw = String(val ?? "").trim();
//   if (!raw) return "";

//   const n = Number(raw.replace(/[^0-9.\-]/g, ""));
//   const isNum = Number.isFinite(n);

//   // If it's clearly non-numeric text (e.g., "Elite Retainers"), don't touch it
//   if (!isNum && /[A-Za-z]/.test(raw)) return raw;

//   // Percent: format number and append %, but don't double-append
//   if (type === "percent") {
//     if (raw.endsWith("%")) return raw; // already has a percent sign
//     const numStr = n.toLocaleString(undefined, { maximumFractionDigits: 0 });
//     return `${numStr}%`;
//   }

//   // Time units
//   if (type === "time") {
//     const baseUnit = normalizeTimeUnit(unit);

//     // Special case: calendar years → "2025 year" (force singular)
//     // if (baseUnit === "Year" && isNum && n >= 1100 && n <= 2500) {
//     //   return `${Math.trunc(n)} year`;
//     // }
//     // replace the range check with a 4-digit check
//     if (baseUnit === "Year" && isNum && /^\d{4}$/.test(String(Math.trunc(n)))) {
//       return `${Math.trunc(n)} year`;
//     }

//     // If the cell already contains a time unit (e.g., "3 Months"), leave it
//     if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

//     const unitLabel = pluralizeTimeUnit(baseUnit, n);
//     const out =
//       baseUnit === "Year"
//         ? String(Math.trunc(n)) // avoid 2,025 grouping for durations like 1/2 years
//         : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

//     return `${out} ${unitLabel}`;
//   }

//   // Everything else uses the generic formatter you already have
//   return formatCell(val);
// };

// const HIDE_COLUMNS = new Set([
//   "policy_start_date_year",
//   "min_year",          // data/scope start
//   "start_year",
//   "scope_start_year",
//   "data_start_year"
// ]);

// const isStartYearKey = (k) => {
//   const s = String(k).toLowerCase();
//   if (HIDE_COLUMNS.has(s)) return true;
//   // catches: "min_year", "start_year", "policy_start_date_year",
//   // "Data Start (Year)", "Scope Start (Year)", etc.
//   return /(^|[^a-z])(min|start)[^a-z]*year/i.test(k);
// };

// const isEndYearKey = (k) => {
//   // catches: "max_year", "end_year", "policy_end_date_year",
//   // "Data End (Year)", "Scope End (Year)", etc.
//   return /(^|[^a-z])(Policy end year|end)[^a-z]*year/i.test(k);
// };

// const preferEndYearKey = (keys) => {
//   const pref = ["max_year", "data_end_year", "scope_end_year", "policy_end_date_year", "end_year"];
//   for (const p of pref) {
//     const hit = keys.find((k) => k.toLowerCase() === p);
//     if (hit) return hit;
//   }
//   // fallback: first end-year-looking key
//   return keys[0] || null;
// };

// const visibleColumnsForRows = (rows) => {
//   if (!rows?.length) return [];
//   const all = Object.keys(rows[0] || {});

//   // 1) drop all start-year-like columns
//   const noStarts = all.filter((k) => !isStartYearKey(k));

//   // 2) dedupe end-year columns — keep only one
//   const endKeys = noStarts.filter(isEndYearKey);
//   if (endKeys.length <= 1) return noStarts;

//   const keep = preferEndYearKey(endKeys.map((k) => k.toLowerCase()));
//   return noStarts.filter((k) => !isEndYearKey(k) || k.toLowerCase() === keep);
// };
// // Use this instead of plain formatCell() when rendering table cells.
// const formatCellForColumn = (key, val, rows) => {
//   const { type, unit } = inferUnitForColumn(key, rows);

//   const keyLc = String(key || "").toLowerCase();

//  // hard strip % for any *count* column coming as "1%"
//  if (/\bcount\b/.test(keyLc) && typeof val === "string") {
//    return val.replace(/\s*%$/, "");
//  }

//   if (val === null || val === undefined) return "";

//   // Percent columns -> ensure % in cell
//   if (type === "percent") {
//     const s = String(val).trim();
//     const isPercent = /\s*%$/.test(s);
//     if (isPercent) return formatCell(s);
//     const num = typeof val === "number" ? val : Number(s.replace(/,/g, ""));
//     if (Number.isFinite(num)) {
//       const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
//       return `${formatted}%`;
//     }
//     return s;
//   }

//   // TIME columns
//   if (type === "time") {
//     // For Year specifically: return raw integer string (no commas)
//     if (unit === "Year") {
//       const s = String(val).trim();
//       const n = typeof val === "number" ? val : Number(s.replace(/[^0-9\-]/g, ""));
//       return Number.isFinite(n) ? String(Math.trunc(n)) : s;
//     }
//     // For Month/Week/Day, keep your normal numeric formatting (usually no commas anyway)
//     return formatCell(val);
//   }

//   // Currency/number/text -> your existing behavior
//   return formatCell(val);
// };


// // Format when the entire answer is just a number (optionally with %, commas, decimals)
// const formatStandaloneNumber = (text) => {
//   const s = String(text ?? "").trim();
//   if (!s) return null;

//   // numeric like 1234, 1,234.567, -45.9, 88%
//   const numericLike =
//     /^-?\d+(?:,\d{3})*(?:\.\d+)?%?$/.test(s) ||
//     /^-?\d+(?:\.\d+)?%?$/.test(s);

//   if (!numericLike) return null;

//   // Reuse your existing numeric formatter (0 decimals, keeps % if present)
//   return formatCell(s);
// };




//     useEffect(() => {
//       const defaultSuggestions = generateDynamicSuggestions([], 'database', {}, true);
//       setSuggestions(defaultSuggestions);
//     }, []);

//     const currentPlaceholder = !inputFocused && !input
//       ? SUGGESTION_TEMPLATES.general[loopingSuggestionIndex]
//       : '';

//    useEffect(() => {
//   const connectDatabaseOnce = async () => {
//     if (connectOnceRef.current) return; // guard StrictMode double call
//     connectOnceRef.current = true;

//     try {
//       const res = await fetch(`${API_BASE_URL}/connect_database/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         // If you want per-user memory, send a stable user_id:
//         body: JSON.stringify({ user_id: "admin" }),
//         // If you later switch to cookie sessions on the backend, add:
//         // credentials: "include",
//       });

//       const data = await res.json();
//       if (res.ok) {
//         setSessionReady(true);
//         console.log("Connected:", data?.message || "ok");
//       } else {
//         setSessionReady(false);
//         console.error("connect_database failed:", data?.error || data);
//       }
//     } catch (err) {
//       setSessionReady(false);
//       console.error("Failed to connect to backend DB", err);
//     }
//   };

//   connectDatabaseOnce();
// }, [API_BASE_URL]);


//     useEffect(() => {
//       if (messagesEndRef.current) {
//         messagesEndRef.current.scrollIntoView({ behavior: "auto" });
//       }
//     }, [messages]);

//     const normalize = (s = "") => s.replace(/[^\w]/g, "").toLowerCase();

// const shouldShowContent = (msg) => {
//   const raw = (msg.content || msg.text || "").trim();
//   if (!raw) return false;

//   // Hide "Found N results" banners
//   if (/^found\s+\d+\s+results/i.test(raw)) return false;

//   // Hide plain numeric answers like "40362"
//   if (/^\d{1,3}(,\d{3})*$/.test(raw)) return false;

//   // If summary exists, hide content that is redundant
//   if (msg.summary) {
//     const c = normalize(raw);
//     const s = normalize(String(msg.summary));
//     if (c && s.includes(c)) return false;
//     if (/^(there\s+(were|are)|total)\b/i.test(raw)) return false;
//   }

//   return true;
// };


//    const downloadCSV = async (questionText) => {
//     try {
//       const encodedQuestion = encodeURIComponent(questionText || "");
//       const url = `${API_BASE_URL}/ask_question/?export=true&question=${encodedQuestion}`;
//       const response = await fetch(url, { method: "GET", headers: { Accept: "text/csv" } });
//       if (!response.ok) {
//         const errorText = await response.text();
//         alert(`Download failed: ${errorText}`);
//         return;
//       }
//       const blob = await response.blob();
//       const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
//       const filename = `export_${timestamp}.csv`;
//       const downloadUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = downloadUrl;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(downloadUrl);
//     } catch (error) {
//       alert(`Download failed: ${error.message}`);
//     }
//   };

//   const handleSubmit = (e) => {
//   e.preventDefault();
//   sendMessage();
// };


//   const sendMessage = async () => {
//   if (!input.trim() || isLoading) return;

//   setIsLoading(true);

//   const userMsg = { sender: "user", role: "user", content: input };
//   setMessages((prev) => [...prev, userMsg]);

//   try {
//     // 1) Intent check (no session_id)
//     let isDataIntent = true;
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: input })
//       });
//       const intentData = await intentRes.json();
//       if ((intentData.answer || "").trim().toUpperCase() === "NO") {
//         isDataIntent = false;
//       }
//     } catch {
//       // If intent check fails, default to data-intent path
//       isDataIntent = true;
//     }

//     // 2) General Q&A path
//     if (!isDataIntent) {
//       try {
//         const qwenRes = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ question: input }) // no session_id
//         });
//         const qwenData = await qwenRes.json();

//         const botMsg = {
//           sender: "bot",
//           role: "assistant",
//           content: qwenData.answer || "Sorry, I couldn't process that."
//         };
//         setMessages((prev) => [...prev, botMsg]);
//         setInput("");
//         setIsLoading(false);
//         return;
//       } catch (err) {
//         const botMsg = {
//           sender: "bot",
//           role: "assistant",
//           content: "Unable to process general questions at the moment."
//         };
//         setMessages((prev) => [...prev, botMsg]);
//         setInput("");
//         setIsLoading(false);
//         return;
//       }
//     }

//     // 3) Data Q&A path
//     const response = await fetch(`${API_BASE_URL}/ask_question/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: input, user_id: "admin" }) // no session_id
//     });
//     const data = await response.json();

//     if (import.meta.env.DEV && data.query_used) {
//       console.groupCollapsed("SQL debug");
//       console.log("SQL:", data.query_used);
//       console.log("Row count:", data.row_count);
//       console.log("Response time:", data.response_time);
//       console.groupEnd();
//     }

//     const botMsg = {
//       sender: "bot",
//       role: "assistant",
//       content: data.answer,
//       summary: data.summary ?? null,
//       recommendation: data.recommendation ?? null,
//       rows: data.rows ?? [],
//       chart_config: data.chart_config ?? null,
//       asked_question: input,
//       query_used: data.query_used ?? null,
//       time_scope: data.time_scope ?? null,
//       narrative: data.narrative ?? null,
//     };

//     const updatedMessages = [...messages, userMsg, botMsg];
//     setMessages(updatedMessages);
//     setInput("");

//     // Dynamic suggestions after each turn
//     const newSuggestions = generateDynamicSuggestions(updatedMessages, "database", {}, true);
//     setSuggestions(newSuggestions);
//   } catch (err) {
//     const botMsg = {
//       sender: "bot",
//       role: "assistant",
//       content: "Something went wrong while processing your question. Please try again."
//     };
//     setMessages((prev) => [...prev, botMsg]);
//     setInput("");
//   } finally {
//     setIsLoading(false);
//   }
// };

// useEffect(() => {
//   const last = messages[messages.length - 1];
//   if (!last) return;

//   // If the newest message is from the assistant, show its start, not the bottom of the chat.
//   if (last.sender === "bot") {
//     const id = setTimeout(() => {
//       if (lastMsgRef.current && chatBoxRef.current) {
//         lastMsgRef.current.scrollIntoView({ block: "start", behavior: "auto" });
//         // Optional: small offset so the bubble isn’t flush to the top
//         chatBoxRef.current.scrollTop -= 8;
//       }
//     }, 0); // let your existing scroll-to-bottom effects run first
//     return () => clearTimeout(id);
//   }
// }, [messages]);

//     const handleSuggestionClick = (text) => {
//       setInput(text);
//       setTimeout(() => sendMessage(), 0);
//     };

//     const handleKeyDown = (e) => {
//       if (e.key === "Enter" && !e.shiftKey) {
//         e.preventDefault();
//         sendMessage();
//       }
//     };

//     // Dynamic button styles
//    const getButtonStyle = () => {
//         let buttonStyle = { ...styles.button };
//         if (isLoading || !sessionReady) {
//           buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
//         } else if (buttonHovered) {
//           buttonStyle = { ...buttonStyle, ...styles.buttonHover };
//         }
//         return buttonStyle;
//       };

//     const getInputStyle = () => {
//       let inputStyle = { ...styles.input };
     
//       if (inputFocused) {
//         inputStyle = { ...inputStyle, ...styles.inputFocused };
//       }
     
//       return inputStyle;
//     };

//     return (
//       <div style={styles.container}>
//         {/* <video autoPlay muted loop style={styles.containerVideo}>
//           <source src={videoFile} type="video/mp4" />
//           Your browser does not support the video tag.
//         </video> */}
//         <h1 style={styles.heading}>Retention Assistant</h1>
//         <p style={styles.subheading}>
//           Get answers to anything about churn, retention, campaigns, dashboards, and more. Start by asking a question below!
//         </p>

//         <div style={styles.chatBox} ref={chatBoxRef}>
//           {messages.map((msg, idx) => (
//             <div
//               key={idx}
//               ref={idx === messages.length - 1 ? lastMsgRef : null}
//               style={msg.sender === "user" ? styles.userMsg : styles.botMsg}
//             >
//               {/* <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
//                 {(msg.content || msg.text || "").trim()}
//               </ReactMarkdown> */}

//              {msg.sender === "user" ? (
//   // USER: show the typed question
//   <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
//     {(msg.content || msg.text || "").trim()}
//   </ReactMarkdown>
// ) : (
 
//   // BOT: show only Summary (hide raw answer like "4955"); fallback to content if no summary exists
//   <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
//     {msg.summary
//       // ? `📌 **Summary:**\n${msg.summary}`
//       ? `${msg.summary}`
//       : (msg.content || msg.text || "").trim()}
//   </ReactMarkdown>
// )}

//               {/* {msg.recommendation && (
//                 <div style={styles.recommendationBox}>
//                   <div style={styles.recommendationHeader}>🔎 Recommendation</div>
//                   <div style={styles.recommendationText}>{msg.recommendation}</div>
//                 </div>
//               )} */}
             


//               {msg.rows && msg.rows.length > 50 && (
//                 <div style={styles.warningBox}>
//                   Too many results to display ({msg.rows.length} rows).{" "}
//                   <button
//                     style={styles.downloadLink}
//                     onClick={() => downloadCSV(msg.asked_question)}
//                   >
//                     Download full results (CSV)
//                   </button>
//                 </div>
//               )}
// {/*
//               {msg.rows && msg.rows.length > 1 && msg.rows.length <= 50 && (
//                 <div style={styles.resultTableWrapper}>
//                   <table style={styles.resultTable}>
//                     <thead>
//                       <tr>
//                         {Object.keys(msg.rows[0])
//                           .slice(0, expandedTables[idx] ? undefined : 3)
//                           .map((key) => (
//                             //  <th key={key} style={styles.resultTableCell}>{formatHeader(key)}</th>
//                              <th key={key} style={styles.resultTableCell}> {buildHeaderLabel(key, msg.rows)} </th>
//                           ))}
//                       </tr>
//                     </thead>
//                      <tbody>
//   {(expandedTables[idx] ? msg.rows : msg.rows.slice(0, 8)).map((row, i) => (
//     <tr key={i}>
//       {Object.values(row)
//         .slice(0, expandedTables[idx] ? undefined : 3)
//         .map((val, j) => (
//           // <td key={j} style={styles.resultTableCell}>{formatCell(val)}</td>
//           <td key={j} style={styles.resultTableCell}> {formatCellWithUnit(
//                     val,
//                     Object.keys(row)[j],    // pass the matching key for this value
//                     msg.rows
//                   )}      </td>
//         ))}
//     </tr>
//   ))}
//   {!expandedTables[idx] && (
//   (msg.rows.length > 8 || (Object.keys(msg.rows[0] || {}).length > 3)) && (
//     <tr>
//       <td
//         colSpan={Math.min(3, Object.keys(msg.rows[0] || {}).length) || 3}
//         style={styles.expandNote}
//       >
//         Showing first {Math.min(8, msg.rows.length)} rows and first 3 columns.{" "}
//         <button onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: true }))}>
//           Click to expand <FiMaximize2 size={16} />

//         </button>
//       </td>
//     </tr>
//   )
// )}

// </tbody>

//                   </table>

//                   {expandedTables[idx] && (
//                     <div style={styles.collapseButton}>
//                       <button
//                         onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: false }))}
//                         style={styles.collapseButtonLink}
//                       >
//                         Click to collapse <FiMinimize2 size={16} />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )} */}
//               {msg.rows && msg.rows.length > 1 && msg.rows.length <= 50 && (
//   <div style={styles.resultTableWrapper}>
//     <table style={styles.resultTable}>
//       <thead>
//         <tr>
//           {(() => {
//             // const colsAll = Object.keys(msg.rows[0] || {});
//             // const cols = expandedTables[idx] ? colsAll : colsAll.slice(0, 3);
//             // return cols.map((key) => (
//             //   <th key={key} style={styles.resultTableCell}>
//             //     {buildHeaderLabel(key, msg.rows)}
//             //   </th>
//             // ));
//             const colsAll = visibleColumnsForRows(msg.rows);
//             const cols = expandedTables[idx] ? colsAll : colsAll.slice(0, 3);
//             return cols.map((key) => (
//               <th key={key} style={styles.resultTableCell}>
//                 {buildHeaderLabel(key, msg.rows)}
//               </th>
//             ));
//           })()}
//         </tr>
//       </thead>

//       <tbody>
//         {(() => {
//           const rowsToShow = expandedTables[idx] ? msg.rows : msg.rows.slice(0, 8);
//           const allKeys = visibleColumnsForRows(msg.rows);
//           const cols = expandedTables[idx] ? allKeys : allKeys.slice(0, 3);

//           return rowsToShow.map((row, i) => (
//             <tr key={i}>
//               {cols.map((key, j) => (
//                 <td key={j} style={styles.resultTableCell}>
//                   {formatCellForColumn(key, row[key], msg.rows)}
//                 </td>
//               ))}
//             </tr>
//           ));
//           // const rowsToShow = expandedTables[idx] ? msg.rows : msg.rows.slice(0, 8);
//           // const colsAll = Object.keys(msg.rows[0] || {});
//           // const cols = expandedTables[idx] ? colsAll : colsAll.slice(0, 3);

//           // return rowsToShow.map((row, i) => (
//           //   <tr key={i}>
//           //     {cols.map((key, j) => (
//           //       <td key={j} style={styles.resultTableCell}>
//           //         {formatCellForColumn(key, row[key], msg.rows)}
//           //       </td>
//           //     ))}
//           //   </tr>
//           // ));
//         })()}

//         {!expandedTables[idx] && (
//           (msg.rows.length > 8 || (Object.keys(msg.rows[0] || {}).length > 3)) && (
//             <tr>
//               <td
//   colSpan={(expandedTables[idx] ? visibleColumnsForRows(msg.rows).length
//                                 : Math.min(3, visibleColumnsForRows(msg.rows).length)) || 3}
//   style={styles.expandNote}
// >
//   Showing first {Math.min(8, msg.rows.length)} rows and first 3 columns{" "}
//   <button onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: true }))}>
//     Click to expand <FiMaximize2 size={16} />
//   </button>
// </td>
//               {/* <td
//                 colSpan={Math.min(3, Object.keys(msg.rows[0] || {}).length) || 3}
//                 style={styles.expandNote}
//               >
//                 Showing first {Math.min(8, msg.rows.length)} rows and first 3 columns{" "}
//                 <button onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: true }))}>
//                   Click to expand <FiMaximize2 size={16} />
//                 </button>
//               </td> */}
//             </tr>
//           )
//         )}
//       </tbody>
//     </table>



   


//     {expandedTables[idx] && (
//       <div style={styles.collapseButton}>
//         <button
//           onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: false }))}
//           style={styles.collapseButtonLink}
//         >
//           Click to collapse <FiMinimize2 size={16} />
//         </button>
//       </div>
//     )}
//   </div>
// )}


//               {/* {msg.rows && msg.rows.length > 1 && msg.rows.length <= 50 && (
//                 <div style={styles.resultTableWrapper}>
//                   <table style={styles.resultTable}>
//                     <thead>
//                       <tr>
//                         {Object.keys(msg.rows[0])
//                           .slice(0, expandedTables[idx] ? undefined : 3)
//                           .map((key) => (
//                             //  <th key={key} style={styles.resultTableCell}>{formatHeader(key)}</th>
//                              <th key={key} style={styles.resultTableCell}> {buildHeaderLabel(key, msg.rows)} </th>
//                           ))}
//                       </tr>
//                     </thead>
//                      <tbody>
//   {(expandedTables[idx] ? msg.rows : msg.rows.slice(0, 8)).map((row, i) => (
//     <tr key={i}>
//       {Object.values(row)
//         .slice(0, expandedTables[idx] ? undefined : 3)
//         .map((val, j) => (
//           // <td key={j} style={styles.resultTableCell}>{formatCell(val)}</td>
//           <td key={j} style={styles.resultTableCell}> {formatCellWithUnit(
//                     val,
//                     Object.keys(row)[j],    // pass the matching key for this value
//                     msg.rows
//                   )}      </td>
//         ))}
//     </tr>
//   ))}
//   {msg.rows.length > 8 && !expandedTables[idx] && (
//     <tr>
//       <td colSpan={3} style={styles.expandNote}>
//         Showing first 8 rows.{" "}
//         <button onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: true }))}>
//           Click to expand <FiMaximize2 size={16} />
//         </button>
//       </td>
//     </tr>
//   )}
// </tbody>

//                   </table>

//                   {expandedTables[idx] && (
//                     <div style={styles.collapseButton}>
//                       <button
//                         onClick={() => setExpandedTables((prev) => ({ ...prev, [idx]: false }))}
//                         style={styles.collapseButtonLink}
//                       >
//                         Click to collapse <FiMinimize2 size={16} />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )} */}

//               {msg.chart_config && (
//                 <div style={styles.chartSection}>
//                   <h4 style={styles.chartTitle}>Data Visualization</h4>
//                   <ChartRenderer config={msg.chart_config} />
//                 </div>
//               )}

// {/* Recommendations tab below the chart */}this is separte while add the pendingbot also added this as ref
// <RecommendationTabs
//   recText={msg.recommendation}
//   recList={msg.narrative?.recommendations}
//   nextStep={msg.narrative?.next_step}
//   onFollowUp={handleSuggestionClick}
// />



//                {msg.recommendation && (
//               <div style={styles.recommendationBox}>
//                 <div style={styles.recommendationHeader}>🔎 Recommendation</div>
//                 <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
//                   {msg.recommendation
//                     .split(/\n|\. /) // split by newline or period+space
//                     .filter((line) => line.trim() !== "")
//                     .map((line, index) => (
//                       <li key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>
//                         {line.trim().replace(/\.$/, '')}.
//                       </li>
//                     ))}
//                 </ul>
//               </div>
//             )}
//             </div>
//           ))}


//             {/* ↙️ Add this block here */}
//   {isLoading && (
//   <div
//     style={{
//       ...styles.botMsg,
//       display: "flex",
//       alignItems: "center",
//       gap: 14,
//       minHeight: 64,
//       padding: "0.9rem 1.1rem"
//     }}
//   >
//     <Spinner
//       size={33}                 // ⬅️ make it as big as you like
//       speed={0.8}               // rotate a bit faster
//       thickness={5}             // thicker ring
//       colors={["#60a5fa","#22d3ee","#34d399","#f59e0b","#f472b6"]} // cycle
//     />
//     <div>
//       <div style={{ fontWeight: 700, marginBottom: 2 }}>Loading data…</div>
//       <div style={{ fontSize: "0.9rem", color: TOKENS.text.secondary }}>
//         Fetching results from the database.
//       </div>
//     </div>
//   </div>
// )}

//           <div ref={messagesEndRef} />
//         </div>
       

//        <form style={styles.inputBox} onSubmit={handleSubmit}>
//   <input
//     value={input}
//     onChange={(e) => setInput(e.target.value)}
//     onKeyDown={handleKeyDown}
//     onFocus={() => setInputFocused(true)}
//     onBlur={() => setInputFocused(false)}
//     placeholder={inputFocused || input ? "Ask me anything..." : currentPlaceholder || "Ask me anything..."}
//     style={getInputStyle()}
//     disabled={isLoading}
//   />
//   <button
//     type="submit"                    // ⬅ submit the form
//     style={getButtonStyle()}
//     onClick={sendMessage}            // (optional) still fine
//     onMouseEnter={() => setButtonHovered(true)}
//     onMouseLeave={() => setButtonHovered(false)}
//     disabled={isLoading}             // only when sending
//     aria-busy={isLoading}
//     title={isLoading ? "Sending..." : "Send"}
//   >
//     {isLoading ? (
//       <>
//         <div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginRight:8}} />
//         Sending...
//       </>
//     ) : (<FiSend size={18} />)}
//   </button>
// </form>
       
//         <style>
//           {`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//       </div>
//     );
//   };

//   export default Sara;