import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const THEME_KEY = "hm_theme";

/* ------------------------------ Theme Builder ------------------------------ */
function makeStyles(theme = "dark") {
  const isLight = theme === "light";

  const c = isLight
    ? {
        appBg: "linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)",
        text: "#2d3748",
        subText: "#718096",
        cardBg: "#f0f2f5",
        cardBorder: "#e5e7eb",
        navBg: "#f0f2f5",
        navBorder: "#d5dae0",
        accentPanel: "#eef2f6",
        tableHeadBg: "#eaf0f6",
        tableRowBorder: "#e5e7eb",
        chipBg: "#ffffff",
        chipBorder: "#e5e7eb",
        popoverMask: "rgba(0,0,0,0.35)",
        popoverBg: "#ffffff",
        popoverBorder: "#e5e7eb",
        circleBorder: "#d1d5db",
        headerGrad: "linear-gradient(to right, #0f172a, #0284c7, #06b6d4)",
        sectionGrad: "linear-gradient(to right, #23345c, #065279, #06b6d4)",
      }
    : {
        appBg: "#0b0f17",
        text: "#e6e8eb",
        subText: "#98a2b3",
        cardBg: "#0b1220",
        cardBorder: "#1f2937",
        navBorder: "#1f2937",
        accentPanel: "#0b1220",
        tableHeadBg: "#0e1629",
        tableRowBorder: "#1f2937",
        chipBg: "#0e1629",
        chipBorder: "#1f2937",
        popoverMask: "rgba(0,0,0,0.45)",
        popoverBg: "#0b1220",
        popoverBorder: "#1f2937",
        circleBorder: "#1f2937",
        headerGrad: "linear-gradient(to right, #0373acff, #51bed1ff, #acced4ff)",
        sectionGrad: "#0d1d36",
      };

  const shadowCard = isLight
    ? "12px 12px 24px rgba(163,177,198,0.6), -12px -12px 24px rgba(255,255,255,0.8)"
    : "0 6px 24px rgba(0,0,0,0.35)";
  const softInset = isLight
    ? "inset 4px 4px 8px rgba(163,177,198,0.4), inset -4px -4px 8px rgba(255,255,255,0.8)"
    : "none";

  return {
    app: {
      display: "flex",
      padding: "40px 5px 70px 5px",
      marginTop: "20px",
      height: "100vh",
      overflow: "hidden",
      maxWidth: "100vw",
      background: c.appBg,
      color: c.text,
      fontFamily:
        "var(--app-font-family)",
    },

    /* -------- Sidebar -------- */
    sidebar: {
      width: 260,
      border: `2px solid ${c.navBorder}`,
      padding: "12px 12px 16px 12px",
      boxSizing: "border-box",
      height: "clamp(520px, 60vh, 640px)",
      alignSelf: "center",
      alignItems: "stretch",
      overflow: "hidden",
      background: isLight
        ? "linear-gradient(180deg, #f6f8fb 0%, #eef2f6 100%)"
        : "linear-gradient(180deg, #0c1222 0%, #0b0f17 100%)",
      boxShadow: isLight ? shadowCard : "none",
      borderRadius: "26px",
      marginTop: "auto",
      marginBottom: "auto",
      marginLeft: 10,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 12,
    },

    navTitle: {
      fontSize: 14,
      fontWeight: 800,
      background: isLight ? "#1f2e53" : "#111827",
      color: "#ffffff",
      border: "none",
      padding: "10px 12px",
      borderRadius: 12,
      margin: "0 0 10px 0",
      boxShadow: isLight ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
    },
    subdashWrap: {
      marginTop: 6,
      marginBottom: 12,
      padding: "8px 10px 0 10px",
      background: c.accentPanel,
      border: `1px dashed ${c.navBorder}`,
      borderRadius: 10,
      marginLeft: 0,
      width: "90%",
    },
    sublink: {
      display: "block",
      color: isLight ? "#065f8f" : "#a3e3ff",
      textDecoration: "none",
      padding: "6px 8px",
      borderRadius: 8,
      marginBottom: 6,
      border: `1px solid ${c.navBorder}`,
      background: isLight ? "#ffffff" : "#0d1528",
      fontSize: 14,
      boxShadow: isLight ? softInset : "none",
    },
    legendCard: {
      marginTop: 12,
      padding: 10,
      background: c.cardBg,
      border: `1px solid ${c.cardBorder}`,
      borderRadius: 12,
      boxShadow: isLight ? softInset : "none",
      width: "90%",
    },
    legendRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "6px 4px",
      color: c.text,
    },
    legendDot: (color) => ({
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: color,
      border: `1px solid ${isLight ? "#cbd5e1" : "rgba(0,0,0,0.2)"}`,
    }),

    /* -------- Main -------- */
    main: {
      flex: 1,
      minHeight: "100vh",
      maxWidth: "100vw",
      padding: "10px 10px 10px 10px",
      overflow: "auto",
      margin: "0 auto",
    },
    centerWrap: {
      maxWidth: 980,
      margin: "0 auto",
      maxWidth: "100vw",
      padding: "0 0 50px 0",
    },

    topBar: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 16,
    },

    header: {
      textAlign: "center",
      marginBottom: "50px",
      fontSize: "40px",
      fontWeight: 700,
      letterSpacing: "-1px",
      lineHeight: "1.5",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
      backgroundImage: c.headerGrad,
      backgroundRepeat: "no-repeat",
      backgroundSize: "100% 100%",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
      WebkitTextStroke: "0.5px rgba(0,0,0,0.1)",
    },

    rightRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },

    themeBtn: {
      background: isLight ? "#ffffff" : "#111827",
      color: isLight ? "#1f2937" : "#e6e8eb",
      border: `1px solid ${c.cardBorder}`,
      padding: "8px 12px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: isLight ? softInset : "none",
    },

    stopwatchBox: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: isLight ? "#ffffff" : "#0d1528",
      border: `1px solid ${c.cardBorder}`,
      borderRadius: 14,
      padding: "8px 10px",
      boxShadow: isLight ? softInset : "none",
    },
    timeText: { fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
    small: { fontSize: 12, color: c.subText },

    miniOverallWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: c.chipBg,
      border: `1px solid ${c.chipBorder}`,
      padding: "8px 10px",
      borderRadius: 12,
      boxShadow: isLight ? softInset : "none",
      fontSize: 12,
      fontWeight: 700,
    },
    miniDot: (bg, blinking = false) => ({
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: bg,
      border: `2px solid ${c.circleBorder}`,
      animation: blinking ? "hmBlink 1s linear infinite" : "none",
    }),

    toolbar: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
    btn: {
      background: isLight ? "#ffffff" : "#111827",
      border: `1px solid ${c.cardBorder}`,
      color: isLight ? "#1f2937" : "#e6e8eb",
      padding: "8px 12px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: isLight ? softInset : "none",
    },
    btnGhost: {
      background: "transparent",
      border: `1px dashed ${isLight ? "#cbd5e1" : "#2b3445"}`,
      color: isLight ? "#475569" : "#9da7b3",
      padding: "8px 12px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 700,
    },

    card: {
      background: c.cardBg,
      border: `1px solid ${c.cardBorder}`,
      borderRadius: 16,
      padding: "16px 56px 0 36px",
      boxSizing: "border-box",
      boxShadow: isLight ? shadowCard : "none",
      marginBottom: 14,
    },
    sectionHeader: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: 10,
      background: isLight ? c.sectionGrad : "#0d1d36",
      color: "#ffffff",
      fontWeight: 800,
      margin: "6px 0 10px",
    },

    tableWrap: { overflow: "auto", marginTop: 6 },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "fixed",
      fontSize: 14,
      color: c.text,
    },
    th: {
      textAlign: "left",
      padding: "12px 10px",
      background: c.tableHeadBg,
      color: isLight ? "#1f2937" : "#b8c1cc",
      position: "sticky",
      top: 0,
      borderBottom: `1px solid ${c.tableRowBorder}`,
    },
    td: { padding: "12px 10px", borderBottom: `1px solid ${c.tableRowBorder}` },
    statusDot: (color) => ({
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
      marginRight: 8,
      border: `1px solid ${c.cardBorder}`,
    }),

    passPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 800,
      color: "#16a34a",
    },
    tick: {
      display: "inline-block",
      width: 10,
      height: 6,
      borderLeft: "3px solid #16a34a",
      borderBottom: "3px solid #16a34a",
      transform: "rotate(-45deg)",
      transformOrigin: "left bottom",
      verticalAlign: "middle",
      marginLeft: 6,
    },

    finalPill: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 800,
      color,
    }),
    finalIcon: { fontSize: 14, lineHeight: 1 },

    /* Terminal */
    popoverMask: {
      position: "fixed",
      inset: 0,
      background: c.popoverMask,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
    },
    popover: {
      width: "min(900px, 96vw)",
      height: "min(520px, 86vh)",
      background: c.popoverBg,
      border: `1px solid ${c.popoverBorder}`,
      borderRadius: 16,
      boxShadow: isLight ? shadowCard : "0 20px 60px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      color: c.text,
    },
    popHead: {
      padding: "12px 14px",
      borderBottom: `1px solid ${c.popoverBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    popBody: { flex: 1, padding: 12, overflow: "auto" },
    logLine: {
      fontFamily:
        "var(--app-font-family)",
      fontSize: 13,
      padding: "4px 0",
      borderBottom: `1px dashed ${c.popoverBorder}`,
      whiteSpace: "pre-wrap",
      color: isLight ? "#111827" : "#d2d7de",
    },
  };
}

/* ------------------------------ Helpers ------------------------------ */
function formatTimeSecs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

const mapState = (s) =>
  s === "success" ? "done" : s === "running" ? "running" : s === "failed" ? "aborted" : "idle";

const initialStages = [
  { id: "Create_all_schemas", name: "Schema Creation", status: "idle", updatedAt: Date.now() },
  { id: "create_log_schema", name: "Log Table Creation", status: "idle", updatedAt: Date.now() },
  { id: "initial_data_load", name: "Loading Initial Data", status: "idle", updatedAt: Date.now() },
  { id: "clean_and_load_base_data", name: "Cleaning Base Data", status: "idle", updatedAt: Date.now() },
  { id: "clean_pr_file_data", name: "Cleaning PR Data", status: "idle", updatedAt: Date.now() },
  { id: "append_claim", name: "Appending Claim Data", status: "idle", updatedAt: Date.now() },
  { id: "base_pr_data_appending", name: "Appending Base + PR", status: "idle", updatedAt: Date.now() },
  { id: "mergeclaim", name: "Merging Claim Data", status: "idle", updatedAt: Date.now() },
  { id: "adding_fuzzy_matching_for_basepr_append", name: "Running Fuzzy Match", status: "idle", updatedAt: Date.now() },
  { id: "mergebaseprwithclaim", name: "Merging BasePR + Claim", status: "idle", updatedAt: Date.now() },
  { id: "add_on", name: "Loading Add-On Data", status: "idle", updatedAt: Date.now() },
  // { id: "renewal_rate_update", name: "Updating Renewal Rate", status: "idle", updatedAt: Date.now() },
  { id: "new_column_features", name: "Adding New Features", status: "idle", updatedAt: Date.now() },
];

const mlInitial = [ 
  { id: "renewed_notrenewed_pred", name: "Predict Renewed vs Not Renewed", status: "idle" },
  { id: "reason_for_prediction_table", name: "Prediction Reasons", status: "idle" },
  { id: "reason_for_policy_status_table", name: "Policy Status Reasons", status: "idle" },
  { id: "generate_top_3_reasons", name: "Top 3 Reasons", status: "idle" },
  { id: "customer_segmenatation", name: "Customer Segmentation", status: "idle" }, 
  { id: "model_health_monitoring", name: "Monitoring Task", status: "idle" },
];  

const statusColor = (s) =>
  s === "done" ? "#22c55e" : s === "running" ? "#f59e0b" : s === "aborted" ? "#ef4444" : "#9da3af";

const sortStages = (list) => {
  const rank = { running: 0, idle: 1, done: 2, aborted: 3 };
  return [...list].sort((a, b) => (rank[a.status] ?? 99) - (rank[b.status] ?? 99));
};

// If a stage is aborted, mark all later stages as aborted too (fail-fast cascade).
function applyAbortCascade(list) {
  let seenAbort = false;
  return list.map((s) => {
    if (s.status === "aborted") seenAbort = true;
    if (!seenAbort) return s;
    if (s.status === "done") return s; // keep completed as completed
    return { ...s, status: "aborted" };
  });
}

// Overall circles rules (your latest):
// - running  => 1st green, 2nd orange blinking
// - aborted  => 1st green, 2nd red
// - all done => both green
// - none started (all idle) => both red
function computeOverallCircles(deStages, mlStages) {
  const GREEN = "#22c55e";
  const ORANGE = "#f59e0b";
  const RED = "#ef4444";

  const all = [...(deStages || []), ...(mlStages || [])];
  const anyStarted = all.some((s) => s.status !== "idle");
  const anyRunning = all.some((s) => s.status === "running");
  const anyAborted = all.some((s) => s.status === "aborted");
  const allDone = all.length > 0 && all.every((s) => s.status === "done");

  if (!anyStarted) {
    return {
      c1: { color: RED, blinking: false },
      c2: { color: RED, blinking: false },
    };
  }

  if (anyAborted) {
    return {
      c1: { color: GREEN, blinking: false },
      c2: { color: RED, blinking: false },
    };
  }

  if (anyRunning) {
    return {
      c1: { color: GREEN, blinking: false },
      c2: { color: ORANGE, blinking: true },
    };
  }

  if (allDone) {
    return {
      c1: { color: GREEN, blinking: false },
      c2: { color: GREEN, blinking: false },
    };
  }

  // started but neither running nor aborted nor all done (mixed idle/done)
  return {
    c1: { color: GREEN, blinking: false },
    c2: { color: ORANGE, blinking: false },
  };
}

/* ------------------------------ Component ------------------------------ */
export default function HealthMonitor() {
  const API_URL = import.meta.env.VITE_HEALTH_MONITOR;
  const PAGE_TITLE = "Health Monitoring Summary";
  const navigate = useNavigate();

  const GREEN = "#22c55e";
  const RED = "#ef4444";

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  // Stopwatch
  const [isRunning, setIsRunning] = useState(false);
  const [startTs, setStartTs] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);

  // Overall circles (start as red/red)
  const [circle1, setCircle1] = useState({ color: RED, blinking: false });
  const [circle2, setCircle2] = useState({ color: RED, blinking: false });

  // Tables
  const [stages, setStages] = useState(initialStages);
  const [mlStages, setMlStages] = useState(mlInitial);

  const sortedStages = useMemo(() => sortStages(stages), [stages]);
  const sortedMlStages = useMemo(() => sortStages(mlStages), [mlStages]);

  // Terminal
  const [termOpen, setTermOpen] = useState(false);
  const [logs, setLogs] = useState(["[init] Backend log stream ready..."]);

  const overallGreen = circle1.color === GREEN && circle2.color === GREEN;

  // Compute circles from statuses (single source of truth)
  useEffect(() => {
    const o = computeOverallCircles(stages, mlStages);
    setCircle1(o.c1);
    setCircle2(o.c2);
  }, [stages, mlStages]);

  useEffect(() => {
    const loadDE = async () => {
      try {
        const res = await fetch(`${API_URL}/health/de/stages`);
        const data = await res.json();

        setStages((prev) => {
          const mapped = prev.map((s) => {
            const hit = data.stages.find((d) => d.task_id === s.id);
            return hit ? { ...s, status: mapState(hit.status), updatedAt: Date.now() } : s;
          });
          return applyAbortCascade(mapped); // cascade in original list order
        });

        if (data.dag_state === "running") {
          const serverElapsed = Math.floor(data.elapsed_seconds * 1000);
          setStartTs(Date.now() - serverElapsed);
          setIsRunning(true);
        } else if (data.dag_state === "success" || data.dag_state === "failed") {
          setIsRunning(false);
          setElapsed(Math.floor(data.elapsed_seconds * 1000));
        } else {
          setIsRunning(false);
          setElapsed(0);
          setStartTs(null);
        }
      } catch (e) {
        console.error("DE Fetch Failed", e);
      }
    };

    loadDE();
    const i = setInterval(loadDE, 3000);
    return () => clearInterval(i);
  }, [API_URL]);

  useEffect(() => {
    const loadML = async () => {
      try {
        const res = await fetch(`${API_URL}/health/ml/stages`);
        const data = await res.json();

        setMlStages((prev) => {
          const mapped = prev.map((s) => {
            const hit = data.stages.find((d) => d.task_id === s.id);
            return hit ? { ...s, status: mapState(hit.status) } : s;
          });
          return applyAbortCascade(mapped);
        });

        if (data.dag_state === "running") {
          const serverElapsed = Math.floor(data.elapsed_seconds * 1000);
          setStartTs(Date.now() - serverElapsed);
          setIsRunning(true);
        } else if (data.dag_state === "success" || data.dag_state === "failed") {
          setIsRunning(false);
          setElapsed(Math.floor(data.elapsed_seconds * 1000));
        } else {
          setIsRunning(false);
          setElapsed(0);
          setStartTs(null);
        }
      } catch (e) {
        console.error("ML Fetch Failed", e);
      }
    };

    loadML();
    const i = setInterval(loadML, 3000);
    return () => clearInterval(i);
  }, [API_URL]);

  // Stopwatch ticker
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      if (startTs != null) setElapsed(Date.now() - startTs);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, startTs]);

  useEffect(() => {
    if (!termOpen) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/health/logs`);
        const data = await res.json();
        setLogs(data.logs.map((l) => (l.log && l.log.trim().length ? l.log : "(no log yet)")));
      } catch (err) {
        console.error("Log fetch failed", err);
      }
    };

    fetchLogs();
    const i = setInterval(fetchLogs, 2500);
    return () => clearInterval(i);
  }, [termOpen, API_URL]);

  // Auto-stop stopwatch when both green
  useEffect(() => {
    if (overallGreen && isRunning) {
      setIsRunning(false);
      setLogs((L) => [...L, `[timer] Completed in ${formatTimeSecs(Date.now() - startTs)}.`]);
    }
  }, [overallGreen, isRunning, startTs]);

  // Blink keyframes once
  useEffect(() => {
    const id = "hmBlinkKeyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        @keyframes hmBlink {
          0% { filter: brightness(1.0); }
          50% { filter: brightness(1.6); }
          100% { filter: brightness(1.0); }
        }`;
      document.head.appendChild(style);
    }
  }, []);

  const isInitialDone = stages.find((s) => s.id === "initial_data_load")?.status === "done";
  const isMergeBasePRClaimDone = stages.find((s) => s.id === "mergebaseprwithclaim")?.status === "done";
  const isNewFeaturesDone = stages.find((s) => s.id === "new_column_features")?.status === "done";

  const magenta = "#f59e0b";
  const stageColor = isInitialDone ? GREEN : magenta;
  const silverColor = isMergeBasePRClaimDone ? GREEN : magenta;
  const goldColor = isNewFeaturesDone ? GREEN : magenta;

  const renderFinalStatus = (status) => {
    if (status === "done") {
      return (
        <span style={styles.passPill}>
          Pass <span style={styles.tick} />
        </span>
      );
    }
    if (status === "idle") {
      return (
        <span style={styles.finalPill("#9da7b3")}>
          <span style={styles.finalIcon}>🕒</span> Not Started
        </span>
      );
    }
    if (status === "running") {
      return (
        <span style={styles.finalPill("#f59e0b")}>
          <span style={styles.finalIcon}>⏳</span> Running
        </span>
      );
    }
    if (status === "aborted") {
      return (
        <span style={styles.finalPill("#ef4444")}>
          <span style={styles.finalIcon}>❌</span> Failed
        </span>
      );
    }
    return (
      <span style={styles.finalPill("#9da7b3")}>
        <span style={styles.finalIcon}>—</span>
      </span>
    );
  };

    const downloadLogs = () => {
    try {
      const content = (logs || []).join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

      const pad2 = (n) => String(n).padStart(2, "0");
      const now = new Date();
      const ts = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
        now.getDate()
      )}_${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;

      const filename = `health_monitor_logs_${ts}.txt`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download logs failed:", e);
    }
  };



  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.navTitle}>Dashboards</div>

          <div style={styles.subdashWrap}>
            <a
              style={styles.sublink}
              href="/datapipeline"
              onClick={(e) => {
                e.preventDefault();
                navigate("/datapipeline");
              }}
            >
              Data Engineering
            </a>
            <a
              style={styles.sublink}
              href="/modelhealth"
              onClick={(e) => {
                e.preventDefault();
                navigate("/modelhealth");
              }}
            >
              Model Health
            </a>
            <a
              style={styles.sublink}
              href="/webusage"
              onClick={(e) => {
                e.preventDefault();
                navigate("/webusage");
              }}
            >
              Web Analytics
            </a>
          </div>

          <div style={styles.navTitle}>Data Status</div>
          <div style={styles.legendCard}>
            <div style={styles.legendRow}>
              <span style={styles.legendDot(stageColor)} /> <span>Stage</span>
            </div>

            <div style={styles.legendRow}>
              <span style={styles.legendDot(silverColor)} /> <span>Silver</span>
            </div>

            <div style={styles.legendRow}>
              <span style={styles.legendDot(goldColor)} /> <span>Gold</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.centerWrap}>
          <div style={styles.topBar}>
            <div style={styles.header}>Health Monitoring Summary</div>

            <div style={styles.rightRow}>
              <div style={styles.miniOverallWrap}>
                Overall Status
                <span style={styles.miniDot(circle1.color, circle1.blinking)} />
                <span style={styles.miniDot(circle2.color, circle2.blinking)} />
              </div>

              <div style={styles.stopwatchBox} title="Stopwatch auto-stops when both circles are green">
                <span style={styles.small}>⏱</span>
                <span style={styles.timeText}>{formatTimeSecs(elapsed)}</span>
              </div>

              <button style={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
          </div>

          {/* Top controls */}
          <div style={styles.toolbar}>
            <button style={styles.btn} onClick={() => setTermOpen(true)}>
              Open Terminal
            </button>
          </div>

          {/* Data Engineering */}
          <section style={styles.card}>
            <div style={styles.sectionHeader}>Data Engineering</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Stages</th>
                    <th style={styles.th}>Current Status</th>
                    <th style={styles.th}>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStages.length > 0 ? (
                    sortedStages.map((s) => (
                      <tr key={s.id}>
                        <td style={styles.td}>{s.name}</td>
                        <td style={styles.td}>
                          <span style={styles.statusDot(statusColor(s.status))} />
                          {s.status === "idle"
                            ? "Not Started"
                            : s.status === "done"
                            ? "Completed"
                            : s.status === "aborted"
                            ? "Failed"
                            : "Running"}
                        </td>
                        <td style={styles.td}>{renderFinalStatus(s.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={styles.td} colSpan={3}>
                        No stages found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, ...styles.small }}>
              Rule: running steps float to the top, completed go down automatically.
            </div>
          </section>

          {/* Machine Learning */}
          <section style={styles.card}>
            <div style={styles.sectionHeader}>Machine Learning</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Stages</th>
                    <th style={styles.th}>Current Status</th>
                    <th style={styles.th}>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMlStages.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.td}>{row.name}</td>
                      <td style={styles.td}>
                        <span style={styles.statusDot(statusColor(row.status))} />
                        {row.status === "idle"
                          ? "Not Started"
                          : row.status === "done"
                          ? "Completed"
                          : row.status === "aborted"
                          ? "Failed"
                          : "Running"}
                      </td>
                      <td style={styles.td}>{renderFinalStatus(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Terminal Popover */}
      {termOpen && (
        <div
          style={styles.popoverMask}
          onClick={() => setTermOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div style={styles.popover} onClick={(e) => e.stopPropagation()}>
            <div style={styles.popHead}>
              <div style={{ fontWeight: 800 }}>Backend Logs</div>
             <div style={{ display: "flex", gap: 8 }}>
  <button style={styles.btnGhost} onClick={downloadLogs}>
    Download
  </button>
  <button style={styles.btn} onClick={() => setTermOpen(false)}>
    Close
  </button>
</div>

            </div>
            <div style={styles.popBody}>
              {logs.map((line, i) => (
                <div key={i} style={styles.logLine}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
