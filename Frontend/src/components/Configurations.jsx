import React, { useMemo, useState, useEffect, useRef } from "react";
import { Spin, Modal, message, Upload } from "antd";
import { useSegmentationConfig } from "../context/SegmentationConfigContext";
import { useCurrency } from "../context/CurrencyContext";
import { applyFontFamily, ensureGoogleFontLoaded } from "../utils/fonts";
import { useTheme } from "../context/ThemeContext";

export default function Configurations() {
  const API_URL = import.meta.env.VITE_CONFIGURATIONS;
  

  const [paramsRefresh, setParamsRefresh] = useState(0);
  const bumpParamsRefresh = () => setParamsRefresh((v) => v + 1);

  const menuItems = useMemo(
    () => [
      
      { key: "segment", label: "Segmentation", icon: "👥" },
      { key: "mail", label: "Email", icon: "✉️" },
      { key: "prediction", label: "Prediction", icon: "📅" },
      { key: "currency", label: "Currency", icon: "💱" },
      
      { key: "fonts", label: "Fonts", icon: "🔤" },
      // { key: "theme", label: "Themes", icon: "🎨" },
      
      
    ],
    []
  );

  // const [active, setActive] = useState("theme");
   const [active, setActive] = useState("segment");
  const [openConfig, setOpenConfig] = useState(false);

  const {
    segments,
    setSegments,
    thresholds,
    setThresholds,
    DEFAULT_SEGMENTS: defaultSegments,
    DEFAULT_THRESHOLDS: defaultThresholds,
    applySegmentNames,
    applySegmentMetrics,
    resetMetricsFromBackup,
  } = useSegmentationConfig();

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>Configuration</div>
          <div style={styles.sidebarSubtitle}>System Settings</div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActiveItem = item.key === active;
            return (
              <button
                className="faqNavBtn"
                key={item.key}
                type="button"
                
                onMouseDown={(e) => e.preventDefault()}   // ✅ prevents focus ring on click
                onClick={() => setActive(item.key)}
                
                style={{
                  ...styles.navItem,
                  ...(isActiveItem ? styles.navItemActive : null),
                }}
              >
                <span style={styles.navIcon} aria-hidden>
                  {item.icon}
                </span>
                <span style={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main style={styles.content}>
        <div style={styles.topBar}>
          <div>
            <Header active={active} />
          </div>

          {/* Config button */}
          {active === "segment" && (
            <button
              type="button"
              style={{ ...styles.button, ...styles.secondary }}
              onClick={() => setOpenConfig(true)}
            >
              ⚙️ Configuration
            </button>
          )}
        </div>

        <div style={styles.divider} />

        {/* {active === "theme" && <ThemesSection />} */}
        {active === "currency" && <CurrencySection />}

        {active === "segment" && (
          <SegmentationSection
            segments={segments}
            thresholds={thresholds}
            apiUrl={API_URL}
            paramsRefresh={paramsRefresh}
            setThresholds={setThresholds}
          />
        )}

        {active === "fonts" && <FontsSection />}
        {active === "mail" && <EmailConfigSection />}
        {active === "prediction" && <PredictionSection />}

        {/* Popup */}
        {openConfig && (
          <SegmentationConfigModal
            onClose={() => setOpenConfig(false)}
            segments={segments}
            setSegments={setSegments}
            thresholds={thresholds}
            setThresholds={setThresholds}
            defaultSegments={defaultSegments}
            defaultThresholds={defaultThresholds}
            applySegmentNames={applySegmentNames}
            applySegmentMetrics={applySegmentMetrics}
            resetMetricsFromBackup={resetMetricsFromBackup}
            onParamsChanged={bumpParamsRefresh}
          />
        )}
      </main>
    </div>
  );
}

function Header({ active }) {
  const titleMap = {
    // theme: "Themes",
    currency: "Currency",
    segment: "Segmentation",
    fonts: "Fonts",
    mail: "Email",
    prediction: "Prediction",
  };

  const subtitleMap = {
    // theme: "Pick a theme for your app",
    currency: "Manage conversion values",
    segment: "Segments and threshold rules",
    fonts: "Pick and apply fonts",
    mail: "Update sender email settings",
    prediction: "Pick time windows and apply",
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerTitle}>{titleMap[active] || "Overview"}</div>
      <div style={styles.headerSubtitle}>
        {subtitleMap[active] || "System settings"}
      </div>
    </header>
  );
}

/* ======================== POPUP MODAL ======================== */

function SegmentationConfigModal({
  onClose,
  segments,
  setSegments,
  thresholds,
  setThresholds,
  defaultSegments,
  defaultThresholds,
  applySegmentNames,
  applySegmentMetrics,
  resetMetricsFromBackup,
  onParamsChanged,
}) {
  const segList = Array.isArray(segments) ? segments : [];
  const apiUrl = import.meta.env.VITE_CONFIGURATIONS;

  // Drafts
  const [nameDrafts, setNameDrafts] = useState(() => {
    const map = {};
    segList.forEach((s) => (map[s.id] = s.name || ""));
    return map;
  });

  const [metricDrafts, setMetricDrafts] = useState(() => {
    const map = {};
    segList.forEach((s) => (map[s.id] = { ...(s.metrics || {}) }));
    return map;
  });

  const [thresholdDrafts, setThresholdDrafts] = useState(() =>
    JSON.parse(JSON.stringify(thresholds || {}))
  );

  // Errors + busy
  const [metricsError, setMetricsError] = useState("");
  const [metricsBusy, setMetricsBusy] = useState(false);

  // DB fetch
  const [dbParams, setDbParams] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  // Snapshot of actual parameters from DB (for Clear)
  const [actualMetricDrafts, setActualMetricDrafts] = useState(null);

  // Threshold busy + error + snapshot (for Clear)
  const [thresholdBusy, setThresholdBusy] = useState(false);
  const [thresholdError, setThresholdError] = useState("");
  const [actualThresholdDrafts, setActualThresholdDrafts] = useState(null);

  const isThresholdChanged = useMemo(() => {
    if (!actualThresholdDrafts) return false;
    return (
      JSON.stringify(thresholdDrafts) !== JSON.stringify(actualThresholdDrafts)
    );
  }, [thresholdDrafts, actualThresholdDrafts]);

  // ------- Quartile recompute (debounced 1s) -------
  const recalcTimerRef = React.useRef(null);

  const qToInt = (q) => {
    const n = parseInt(String(q || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 75;
  };

  const clampQ = (n) =>
    Math.max(1, Math.min(99, Number.isFinite(Number(n)) ? Number(n) : 75));

  const intToQ = (n) => `Q${clampQ(n)}`;

  const extractPercentPayload = (drafts) => ({
    discount: {
      low: qToInt(drafts?.discount?.low?.q),
      mid: qToInt(drafts?.discount?.mid?.q),
      high: qToInt(drafts?.discount?.high?.q),
    },
    clv: {
      low: qToInt(drafts?.clv?.low?.q),
      mid: qToInt(drafts?.clv?.mid?.q),
      high: qToInt(drafts?.clv?.high?.q),
    },
  });

  const debounceRecalc = (nextDrafts) => {
    if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);

    recalcTimerRef.current = setTimeout(async () => {
      try {
        setThresholdError("");
        setThresholdBusy(true);

        const payload = extractPercentPayload(nextDrafts);

        const res = await fetch(
          `${apiUrl}/segmentation-config/recompute-thresholds`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const json = await res.json();
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Recompute failed");

        // update ONLY the values, keep q unchanged
        setThresholdDrafts((prev) => ({
          ...prev,
          discount: {
            ...prev.discount,
            low: { ...prev.discount.low, value: json.data.discount.low },
            mid: { ...prev.discount.mid, value: json.data.discount.mid },
            high: { ...prev.discount.high, value: json.data.discount.high },
          },
          clv: {
            ...prev.clv,
            low: { ...prev.clv.low, value: json.data.clv.low },
            mid: { ...prev.clv.mid, value: json.data.clv.mid },
            high: { ...prev.clv.high, value: json.data.clv.high },
          },
        }));
      } catch (e) {
        setThresholdError(e?.message || "Failed to recompute");
      } finally {
        setThresholdBusy(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
    };
  }, []);

  // Confirm modals
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false);
  const [confirmResetLoading, setConfirmResetLoading] = useState(false);
  const [confirmApplyLoading, setConfirmApplyLoading] = useState(false);
  const [confirmThresholdResetOpen, setConfirmThresholdResetOpen] = useState(false);
  const [confirmThresholdApplyOpen, setConfirmThresholdApplyOpen] = useState(false);
  const [confirmThresholdResetLoading, setConfirmThresholdResetLoading] = useState(false);
  const [confirmThresholdApplyLoading, setConfirmThresholdApplyLoading] = useState(false);
  const [thresholdActionLabel, setThresholdActionLabel] = useState("");

  const overlayLoading =
  dbLoading ||
  metricsBusy ||
  thresholdBusy ||
  confirmResetLoading ||
  confirmApplyLoading;

  const overlayTip = dbLoading
  ? "Loading parameters..."
  : thresholdBusy
  ? (thresholdActionLabel || "Processing thresholds...")
  : metricsBusy
  ? "Processing..."
  : "Loading...";

  const isMetricsChanged = useMemo(() => {
    if (!actualMetricDrafts) return false;
    return JSON.stringify(metricDrafts) !== JSON.stringify(actualMetricDrafts);
  }, [metricDrafts, actualMetricDrafts]);

  const ensureArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  const dbParamsToDrafts = (db) => ({
    platinum: {
      churn: ensureArr(db?.Platinum?.churn || db?.Platinum?.churn_values),
      discount: ensureArr(
        db?.Platinum?.discount || db?.Platinum?.discount_values
      ),
      clv: ensureArr(db?.Platinum?.clv || db?.Platinum?.clv_values),
    },
    gold: {
      churn: ensureArr(db?.Gold?.churn || db?.Gold?.churn_values),
      discount: ensureArr(db?.Gold?.discount || db?.Gold?.discount_values),
      clv: ensureArr(db?.Gold?.clv || db?.Gold?.clv_values),
    },
    silver: {
      churn: ensureArr(db?.Silver?.churn || db?.Silver?.churn_values),
      discount: ensureArr(db?.Silver?.discount || db?.Silver?.discount_values),
      clv: ensureArr(db?.Silver?.clv || db?.Silver?.clv_values),
    },
  });

  const toggleMetric = (segmentId, key, opt) => {
    setMetricDrafts((prev) => {
      const curr = prev?.[segmentId]?.[key];
      const arr = Array.isArray(curr) ? curr : curr ? [curr] : [];
      const next = arr.includes(opt)
        ? arr.filter((x) => x !== opt)
        : [...arr, opt];

      return {
        ...prev,
        [segmentId]: {
          ...(prev?.[segmentId] || {}),
          [key]: next,
        },
      };
    });
    setMetricsError("");
  };

  // ✅ Fetch DB segment params AND thresholds when modal opens
  useEffect(() => {
    let alive = true;

    const fetchDb = async () => {
      setDbLoading(true);
      setDbError("");
      try {
        // 1) segment parameters
        const res = await fetch(
          `${apiUrl}/segmentation-config/segment-parameters`
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Failed to fetch");

        const data = json?.data || {};
        if (!alive) return;

        setDbParams(data);

        const draftFromDb = dbParamsToDrafts(data);
        setMetricDrafts(draftFromDb);
        setActualMetricDrafts(draftFromDb);

        // 2) actual thresholds (custom OR computed)
        const tRes = await fetch(
          `${apiUrl}/segmentation-config/actual-thresholds`
        );
        const tJson = await tRes.json();

        if (tRes.ok && tJson?.ok && tJson?.data) {
          if (!alive) return;
          // Normalize shape (ensure clv/discount objects)
          const normalized = pickThresholdPayload(tJson.data);
          setThresholdDrafts(JSON.parse(JSON.stringify(normalized)));
          setActualThresholdDrafts(JSON.parse(JSON.stringify(normalized)));
        }
      } catch (e) {
        if (alive) setDbError(e?.message || "Failed");
      } finally {
        if (alive) setDbLoading(false);
      }
    };

    fetchDb();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync name drafts when segments change
  useEffect(() => {
    const map = {};
    segList.forEach((s) => (map[s.id] = s.name || ""));
    setNameDrafts(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // keep threshold drafts in sync if external thresholds update
  function pickThresholdPayload(t) {
    return {
      churn: {
        low: t?.churn?.low ?? null,
        mid: t?.churn?.mid ?? null,
        high: t?.churn?.high ?? null,
      },
      clv: {
        low: {
          value: t?.clv?.low?.value ?? null,
          q: t?.clv?.low?.q || "Q25",
        },
        mid: {
          value: t?.clv?.mid?.value ?? null,
          q: t?.clv?.mid?.q || "Q50",
        },
        high: {
          value: t?.clv?.high?.value ?? null,
          q: t?.clv?.high?.q || "Q75",
        },
      },
      discount: {
        low: {
          value: t?.discount?.low?.value ?? null,
          q: t?.discount?.low?.q || "Q25",
        },
        mid: {
          value: t?.discount?.mid?.value ?? null,
          q: t?.discount?.mid?.q || "Q50",
        },
        high: {
          value: t?.discount?.high?.value ?? null,
          q: t?.discount?.high?.q || "Q75",
        },
      },
    };
  }

  useEffect(() => {
    setThresholdDrafts(pickThresholdPayload(thresholds || {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholds]);

  // ---------- 1) Segment Names ----------
  const resetNames = () => {
    const map = {};
    (defaultSegments || []).forEach((s) => (map[s.id] = s.name || ""));
    setNameDrafts(map);
  };

  const applyNames = async () => {
    try {
      if (typeof applySegmentNames === "function") {
        await applySegmentNames({ ...nameDrafts });
        message.success("Segment names applied");
      }
    } catch (e) {
      message.error(e?.message || "Failed to apply names");
    }
  };

  // ---------- 2) Metrics: Validate + Apply + Reset ----------
  const norm = (arr) => (Array.isArray(arr) ? [...arr].sort().join(",") : "");
  const validateUniqueCombos = (drafts) => {
    const required = ["platinum", "gold", "silver"];
    const combos = new Map();

    for (const id of required) {
      const m = drafts?.[id] || {};
      const comboKey = `${norm(m.churn)}|${norm(m.discount)}|${norm(m.clv)}`;
      if (combos.has(comboKey)) {
        return `Duplicate metrics not allowed. "${combos.get(
          comboKey
        )}" and "${id}" have the same combination.`;
      }
      combos.set(comboKey, id);
    }
    return "";
  };

  const doApplyMetrics = async () => {
    setMetricsError("");

    const dupMsg = validateUniqueCombos(metricDrafts);
    if (dupMsg) {
      setMetricsError(dupMsg);
      message.error(dupMsg);
      return false;
    }

    setMetricsBusy(true);
    try {
      const res = await fetch(
        `${apiUrl}/segmentation-config/apply-segment-parameters`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metricDrafts),
        }
      );

      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Apply failed");

      setActualMetricDrafts(JSON.parse(JSON.stringify(metricDrafts)));
      message.success("Segment parameters applied successfully ✅");
      onParamsChanged?.();
      return true;
    } catch (e) {
      const msg = e?.message || "Failed to apply";
      setMetricsError(msg);
      message.error(msg);
      return false;
    } finally {
      setMetricsBusy(false);
    }
  };

  const doResetMetricsFromBackup = async () => {
    setMetricsError("");
    setMetricsBusy(true);

    try {
      const r = await fetch(
        `${apiUrl}/segmentation-config/metrics/reset-final-from-backup`,
        {
          method: "POST",
        }
      );
      const j = await r.json();
      if (!r.ok || j?.ok === false)
        throw new Error(j?.message || "Reset failed");

      const res = await fetch(
        `${apiUrl}/segmentation-config/segment-parameters`
      );
      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Fetch failed");

      const data = json?.data || {};
      const draftFromDb = dbParamsToDrafts(data);

      setDbParams(data);
      setMetricDrafts(draftFromDb);
      setActualMetricDrafts(draftFromDb);

      message.success("Segment parameters reset successfully ✅");
      onParamsChanged?.();
      return true;
    } catch (e) {
      const msg = e?.message || "Failed to reset";
      setMetricsError(msg);
      message.error(msg);
      return false;
    } finally {
      setMetricsBusy(false);
    }
  };

  // Confirm handlers
  const openApplyConfirm = () => {
    const dupMsg = validateUniqueCombos(metricDrafts);
    if (dupMsg) {
      setMetricsError(dupMsg);
      message.error(dupMsg);
      return;
    }
    setConfirmApplyOpen(true);
  };

  const confirmApply = async () => {
    setConfirmApplyLoading(true);
    try {
      const ok = await doApplyMetrics();
      if (ok) setConfirmApplyOpen(false);
    } finally {
      setConfirmApplyLoading(false);
    }
  };

  const openResetConfirm = () => setConfirmResetOpen(true);

  const confirmReset = async () => {
    setConfirmResetLoading(true);
    try {
      const ok = await doResetMetricsFromBackup();
      if (ok) setConfirmResetOpen(false);
    } finally {
      setConfirmResetLoading(false);
    }
  };

  // ---------- 3) Thresholds (DB-backed Apply/Reset/Clear) ----------
  const clearThresholds = () => {
    if (!actualThresholdDrafts) return;
    setThresholdDrafts(JSON.parse(JSON.stringify(actualThresholdDrafts)));
    setThresholdError("");
    message.info("Cleared (reverted to actual DB threshold values)");
  };

  const doApplyThresholds = async () => {
    setThresholdError("");
    setThresholdBusy(true);
    try {
      const payload = pickThresholdPayload(thresholdDrafts);

      const res = await fetch(`${apiUrl}/segmentation-config/apply-thresholds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Apply failed");

      setActualThresholdDrafts(JSON.parse(JSON.stringify(payload)));
      setThresholds((prev) => ({ ...prev, ...payload }));
      message.success("Thresholds applied and categories updated ✅");
      onParamsChanged?.();
      return true;
    } catch (e) {
      const msg = e?.message || "Failed to apply thresholds";
      setThresholdError(msg);
      message.error(msg);
      return false;
    } finally {
      setThresholdBusy(false);
    }
  };

  const doResetThresholds = async () => {
    setThresholdError("");
    setThresholdBusy(true);
    try {
      const res = await fetch(`${apiUrl}/segmentation-config/reset-thresholds`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Reset failed");

      const data = pickThresholdPayload(json?.data || {});
      setThresholdDrafts(JSON.parse(JSON.stringify(data)));
      setActualThresholdDrafts(JSON.parse(JSON.stringify(data)));
      setThresholds((prev) => ({ ...prev, ...data }));
      message.success("Thresholds reset to defaults ✅");
      onParamsChanged?.();
      return true;
    } catch (e) {
      const msg = e?.message || "Failed to reset thresholds";
      setThresholdError(msg);
      message.error(msg);
      return false;
    } finally {
      setThresholdBusy(false);
    }
  };

  const openThresholdResetConfirm = () => setConfirmThresholdResetOpen(true);
const openThresholdApplyConfirm = () => setConfirmThresholdApplyOpen(true);

// ✅ Threshold confirm OK handlers
const confirmThresholdReset = async () => {
  // ✅ close alert immediately
  setConfirmThresholdResetOpen(false);

  // ✅ show center overlay text (optional)
  setThresholdActionLabel("Resetting thresholds...");

  // ✅ this will trigger your center overlay because doResetThresholds sets thresholdBusy
  await doResetThresholds();

  setThresholdActionLabel("");
};

const confirmThresholdApply = async () => {
  // ✅ close alert immediately
  setConfirmThresholdApplyOpen(false);

  setThresholdActionLabel("Applying thresholds...");
  await doApplyThresholds();
  setThresholdActionLabel("");
};


  // churn is editable numeric; clv/discount value is read-only; quartile (q) editable and triggers recompute
  const setChurnValue = (levelKey, raw) => {
    setThresholdDrafts((prev) => ({
      ...prev,
      churn: { ...(prev.churn || {}), [levelKey]: raw },
    }));
  };

  const setQuartile = (groupKey, levelKey, newQInt) => {
    const safeInt = clampQ(newQInt);

    setThresholdDrafts((prev) => {
      const prevGroup = prev?.[groupKey] || {};
      const current = prevGroup?.[levelKey] || {};

      const next = {
        ...prev,
        [groupKey]: {
          ...prevGroup,
          [levelKey]: { ...current, q: intToQ(safeInt) },
        },
      };

      // debounce recompute on any quartile change
      debounceRecalc(next);
      return next;
    });
  };

  const metricOptions = ["High", "Mid", "Low"];

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        {/* ✅ Center loader overlay inside the big modal */}
        {overlayLoading && (
          <div style={styles.modalSpinOverlay}>
            <Spin  />
          </div>
        )}

        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Segmentation Configuration</div>
            {/* <div style={styles.modalSub}>
              Edit segment names, metrics, and thresholds. Each section has Reset
              + Apply.
            </div> */}
            {!!dbError && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#b91c1c",
                  fontWeight: 600,
                }}
              >
                DB error: {dbError}
              </div>
            )}
          </div>

          <button
            type="button"
            style={styles.iconBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={overlayLoading}
            title={overlayLoading ? "Please wait..." : "Close"}
          >
            ✕
          </button>
        </div>

        {/* Confirm: Reset */}
        <Modal
          open={confirmResetOpen}
          title="Confirm Reset"
          okText="Reset"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          confirmLoading={confirmResetLoading}
          maskClosable={!confirmResetLoading}
          closable={!confirmResetLoading}
          onCancel={() => setConfirmResetOpen(false)}
          onOk={confirmReset}
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            This will restore <b>2025_prediction_final_data</b> from{" "}
            <b>2025_prediction_data_backup</b>.
            <br />
            Are you sure you want to continue?
          </div>
        </Modal>

        {/* Confirm: Apply */}
        <Modal
          open={confirmApplyOpen}
          title="Confirm Apply"
          okText="Apply"
          cancelText="Cancel"
          confirmLoading={confirmApplyLoading}
          maskClosable={!confirmApplyLoading}
          closable={!confirmApplyLoading}
          onCancel={() => setConfirmApplyOpen(false)}
          onOk={confirmApply}
        >
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            This will apply the selected churn/discount/clv parameters to the
            final table.
            <br />
            Do you want to continue?
          </div>
        </Modal>

        <div style={styles.modalBody}>
          {/* ---------- 1) Edit Segment Names ---------- */}
          <section style={styles.modalCard}>
            <div style={styles.modalCardTop}>
              <div style={styles.modalCardTitle}>1) Edit segment names</div>
              <div style={styles.modalCardActions}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.secondary,
                    ...styles.smallBtn,
                  }}
                  onClick={resetNames}
                  disabled={overlayLoading}
                >
                  Reset
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.primary,
                    ...styles.smallBtn,
                  }}
                  onClick={applyNames}
                  disabled={overlayLoading}
                >
                  Apply
                </button>

              </div>
            </div>

            {/* <div style={styles.subtleText}>
              Change the segment name and click Apply.{" "}
              <b>Data key stays the same</b> (platinum/gold/silver).
            </div> */}

            <div style={styles.nameGrid}>
              {segList.map((s) => (
                <div key={s.id} style={styles.nameRow}>
                  <div style={styles.nameLeft}>
                    <div style={styles.nameIcon} aria-hidden>
                      {s.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.nameLabel}>{s.name}</div>
                      <div style={styles.smallMuted}>Data key: {s.id}</div>
                      <div style={styles.smallMuted}>Tag: {s.tag}</div>
                    </div>
                  </div>

                  <input
                    value={nameDrafts[s.id] ?? ""}
                    onChange={(e) =>
                      setNameDrafts((p) => ({ ...p, [s.id]: e.target.value }))
                    }
                    style={styles.input}
                    placeholder="Segment name"
                    disabled={overlayLoading}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ---------- 2) Edit Segment Metrics ---------- */}
          <section style={styles.modalCard}>
            <div style={styles.modalCardTop}>
              <div style={styles.modalCardTitle}>2) Edit segment metrics</div>
              <div style={styles.modalCardActions}>
                {!dbLoading && actualMetricDrafts && isMetricsChanged && (
                  <button
                    type="button"
                    style={{
                      ...styles.button,
                      ...styles.secondary,
                      ...styles.smallBtn,
                    }}
                    onClick={() => {
                      setMetricDrafts(
                        JSON.parse(JSON.stringify(actualMetricDrafts))
                      );
                      setMetricsError("");
                      message.info("Cleared (reverted to actual DB values)");
                    }}
                    disabled={overlayLoading}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.secondary,
                    ...styles.smallBtn,
                  }}
                  onClick={openResetConfirm}
                  disabled={overlayLoading}
                  title='Restores "2025_prediction_final_data" from "2025_prediction_data_backup"'
                >
                  Reset
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.primary,
                    ...styles.smallBtn,
                  }}
                  onClick={openApplyConfirm}
                  disabled={overlayLoading}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* <div style={styles.subtleText}>
              For each segment, set churn / discount / clv to High / Mid / Low.{" "}
              <b>No two segments can have the same combination.</b>
            </div> */}
            {/* ✅ Confirm: Threshold Reset */}
<Modal
  open={confirmThresholdResetOpen}
  title="Confirm Threshold Reset"
  okText="Reset"
  cancelText="Cancel"
  okButtonProps={{ danger: true }}
  maskClosable={!overlayLoading}
  closable={!overlayLoading}
  onCancel={() => setConfirmThresholdResetOpen(false)}
  onOk={confirmThresholdReset}
>
  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
    This will reset thresholds to default values and update categories.
    <br />
    Are you sure you want to continue?
  </div>
</Modal>


{/* ✅ Confirm: Threshold Apply */}
<Modal
  open={confirmThresholdApplyOpen}
  title="Confirm Threshold Apply"
  okText="Apply"
  cancelText="Cancel"
  maskClosable={!overlayLoading}
  closable={!overlayLoading}
  onCancel={() => setConfirmThresholdApplyOpen(false)}
  onOk={confirmThresholdApply}
>
  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
    This will apply your threshold values and update categories in the final table.
    <br />
    Do you want to continue?
  </div>
</Modal>


            {!!metricsError && (
              <div style={styles.errorBanner}>
                <div style={styles.errorTitle}>Metrics error</div>
                <div style={styles.errorText}>{metricsError}</div>
              </div>
            )}

            <div style={styles.metricsEditGrid}>
              {segList.map((s) => {
                const current = metricDrafts[s.id] || {};
                return (
                  <div key={s.id} style={styles.metricsEditCard}>
                    <div style={styles.metricsEditTop}>
                      <div style={styles.segmentIcon} aria-hidden>
                        {s.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.segmentNameSmall}>{s.name}</div>
                        <div style={styles.segmentBadge}>{s.tag}</div>
                        <div style={styles.smallMuted}>Data key: {s.id}</div>
                      </div>
                    </div>

                    <MetricPicker
                      label="Churn"
                      value={current.churn || []}
                      options={metricOptions}
                      onToggle={(opt) => toggleMetric(s.id, "churn", opt)}
                      disabled={overlayLoading}
                    />
                    <MetricPicker
                      label="Discount"
                      value={current.discount || []}
                      options={metricOptions}
                      onToggle={(opt) => toggleMetric(s.id, "discount", opt)}
                      disabled={overlayLoading}
                    />
                    <MetricPicker
                      label="CLV"
                      value={current.clv || []}
                      options={metricOptions}
                      onToggle={(opt) => toggleMetric(s.id, "clv", opt)}
                      disabled={overlayLoading}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- 3) Edit Thresholds ---------- */}
          <section style={styles.modalCard}>
            <div style={styles.modalCardTop}>
              <div style={styles.modalCardTitle}>3) Edit thresholds</div>
              <div style={styles.modalCardActions}>
                {actualThresholdDrafts && isThresholdChanged && (
                  <button
                    type="button"
                    style={{
                      ...styles.button,
                      ...styles.secondary,
                      ...styles.smallBtn,
                    }}
                    onClick={clearThresholds}
                    disabled={overlayLoading}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.secondary,
                    ...styles.smallBtn,
                  }}
                  onClick={openThresholdResetConfirm}
                  disabled={overlayLoading}
                >
                  Reset
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...styles.primary,
                    ...styles.smallBtn,
                  }}
                  onClick={openThresholdApplyConfirm}
                  disabled={overlayLoading}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* <div style={styles.subtleText}>
              Set numeric cutoffs for churn / clv / discount. For CLV + Discount,
              <b> value is read-only</b> and quartile is editable (debounced 1s).
            </div> */}

            {!!thresholdError && (
              <div style={styles.errorBanner}>
                <div style={styles.errorTitle}>Threshold error</div>
                <div style={styles.errorText}>{thresholdError}</div>
              </div>
            )}

            <div style={styles.thresholdEditGrid}>
              {/* CHURN (editable numbers) */}
              <div style={styles.thresholdEditCard}>
                <div style={styles.thresholdTop}>
                  <div style={styles.thresholdIcon} aria-hidden>
                    📉
                  </div>
                  <div style={styles.thresholdTitle}>Churn Probability</div>
                </div>

                <div style={styles.thresholdEditTable}>
                  <ThresholdRowNumber
                    label="High"
                    value={thresholdDrafts?.churn?.high}
                    onChange={(v) => setChurnValue("high", v)}
                    disabled={overlayLoading}
                  />
                  <ThresholdRowNumber
                    label="Mid"
                    value={thresholdDrafts?.churn?.mid}
                    onChange={(v) => setChurnValue("mid", v)}
                    disabled={overlayLoading}
                  />
                  <ThresholdRowNumber
                    label="Low"
                    value={thresholdDrafts?.churn?.low}
                    onChange={(v) => setChurnValue("low", v)}
                    disabled={overlayLoading}
                  />
                </div>
              </div>

              {/* CLV (value readonly, quartile editable) */}
              <div style={styles.thresholdEditCard}>
                <div style={styles.thresholdTop}>
                  <div style={styles.thresholdIcon} aria-hidden>
                    💰
                  </div>
                  <div style={styles.thresholdTitle}>CLV</div>
                </div>

                <div style={styles.thresholdEditTable}>
                  <ThresholdRowQuartile
                    label="High"
                    valueObj={thresholdDrafts?.clv?.high}
                    onChangeQ={(q) => setQuartile("clv", "high", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                  <ThresholdRowQuartile
                    label="Mid"
                    valueObj={thresholdDrafts?.clv?.mid}
                    onChangeQ={(q) => setQuartile("clv", "mid", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                  <ThresholdRowQuartile
                    label="Low"
                    valueObj={thresholdDrafts?.clv?.low}
                    onChangeQ={(q) => setQuartile("clv", "low", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                </div>
              </div>

              {/* DISCOUNT (value readonly, quartile editable) */}
              <div style={styles.thresholdEditCard}>
                <div style={styles.thresholdTop}>
                  <div style={styles.thresholdIcon} aria-hidden>
                    🏷️
                  </div>
                  <div style={styles.thresholdTitle}>Discount % (with NCB)</div>
                </div>

                <div style={styles.thresholdEditTable}>
                  <ThresholdRowQuartile
                    label="High"
                    valueObj={thresholdDrafts?.discount?.high}
                    onChangeQ={(q) => setQuartile("discount", "high", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                  <ThresholdRowQuartile
                    label="Mid"
                    valueObj={thresholdDrafts?.discount?.mid}
                    onChangeQ={(q) => setQuartile("discount", "mid", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                  <ThresholdRowQuartile
                    label="Low"
                    valueObj={thresholdDrafts?.discount?.low}
                    onChangeQ={(q) => setQuartile("discount", "low", q)}
                    disabled={overlayLoading}
                    qToInt={qToInt}
                    clampQ={clampQ}
                    intToQ={intToQ}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricPicker({ label, value, options, onToggle, disabled }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div style={styles.pickerRow}>
      <div style={styles.pickerLabel}>{label}</div>
      <div style={styles.pills}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              disabled={disabled}
              style={{
                ...styles.pill,
                ...(active ? styles.pillActive : null),
                ...(disabled ? { opacity: 0.6, cursor: "not-allowed" } : null),
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Threshold UI rows ---------------- */

function ThresholdRowNumber({ label, value, onChange, disabled }) {
  const shown = value ?? "";
  return (
    <div style={styles.thresholdEditRow}>
      <div style={styles.thresholdLevel}>
        <div>{label}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          value={shown}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...styles.input, flex: 1 }}
          type="number"
          step="0.0001"
          placeholder="Enter value"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ThresholdRowQuartile({
  label,
  valueObj,
  onChangeQ,
  disabled,
  qToInt,
  clampQ,
  intToQ,
}) {
  const valueText =
    valueObj?.value == null || valueObj?.value === ""
      ? ""
      : String(valueObj.value);

  const qInt = clampQ(qToInt(valueObj?.q));

  return (
    <div style={styles.thresholdEditRow}>
      <div style={styles.thresholdLevel}>
        <div>{label}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* value is readonly */}
        <input
          value={valueText}
          readOnly
          style={{
            ...styles.input,
            flex: 1,
            flex: "0 0 auto",
    width: 80,          // reduce width (adjust: 150–200)
    height: 32,          // reduce height
    fontSize: 12,        // reduce text size
    padding: "0 8px",    // tighter padding

    background: "#f8fafc",
    cursor: "not-allowed",
          }}
          type="text"
          placeholder="Auto"
          disabled={disabled}
        />

        {/* editable quartile with +/- */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            style={{
              ...styles.button,
              ...styles.smallBtn,
              ...styles.secondary,
              height: 36,
            }}
            onClick={() => onChangeQ(qInt - 1)}
            disabled={disabled || qInt <= 1}
            title="Decrease quartile"
          >
            −
          </button>

          <span style={styles.qPill}>{intToQ(qInt)}</span>

          <button
            type="button"
            style={{
              ...styles.button,
              ...styles.smallBtn,
              ...styles.secondary,
              height: 36,
            }}
            onClick={() => onChangeQ(qInt + 1)}
            disabled={disabled || qInt >= 99}
            title="Increase quartile"
          >
            +
          </button>

          
        </div>
      </div>
    </div>
  );
}

/* ======================== SEGMENTATION VIEW ======================== */

function SegmentationSection({
  segments,
  thresholds,
  apiUrl,
  paramsRefresh,
  setThresholds,
}) {
  const segList = Array.isArray(segments) ? segments : [];

  const [dbParams, setDbParams] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    let alive = true;

    const fetchParams = async () => {
      setDbLoading(true);
      setDbError("");
      try {
        // 1) segment parameters
        const res = await fetch(
          `${apiUrl}/segmentation-config/segment-parameters`
        );
        const json = await res.json();

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.message || "Failed to fetch segment parameters");
        }

        const data = json?.data || {};
        if (alive) setDbParams(data);

        // 2) actual thresholds (custom OR computed)
        const tRes = await fetch(
          `${apiUrl}/segmentation-config/actual-thresholds`
        );
        const tJson = await tRes.json();

        if (tRes.ok && tJson?.ok && tJson?.data) {
          if (alive) {
            setThresholds((prev) => ({
              ...prev,
              discount: {
                ...(prev?.discount || {}),
                ...(tJson.data.discount || {}),
              },
              clv: { ...(prev?.clv || {}), ...(tJson.data.clv || {}) },
              churn: { ...(prev?.churn || {}), ...(tJson.data.churn || {}) },
            }));
          }
        }
      } catch (e) {
        if (alive)
          setDbError(e?.message || "Failed to fetch segment parameters");
      } finally {
        if (alive) setDbLoading(false);
      }
    };

    fetchParams();
    return () => {
      alive = false;
    };
  }, [apiUrl, paramsRefresh, setThresholds]);

  const segmentKeyMap = {
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
  };

  const meta = useMemo(
    () => ({
      discount: { title: "Discount % (with NCB)", icon: "🏷️" },
      clv: { title: "CLV", icon: "💰" },
      churn: { title: "Churn Probability", icon: "📉" },
    }),
    []
  );

  const fmtThreshold = (x) => {
    if (x == null) return { valueText: "—", q: "" };

    if (typeof x === "object" && x.value !== undefined) {
      return {
        valueText: String(x.value),
        q: x.q || "",
      };
    }

    return { valueText: String(x), q: "" };
  };

  return (
    <Spin spinning={dbLoading} >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "0 0 150px 0",
        }}
      >
        {/* SEGMENTS */}
        <section style={styles.card}>
          <div style={styles.sectionTopRow}>
            <div style={styles.sectionTitle}>Segments</div>
          </div>

          <div style={styles.subtleText}>
            These are the 3 segment cards. They use churn / discount / clv
            labels.
            {dbError ? ` (DB error: ${dbError})` : ""}
          </div>

          <div style={styles.segmentGrid}>
            {segList.map((s) => {
              const dbKey = segmentKeyMap[s.id];
              const params = dbKey ? dbParams?.[dbKey] : null;

              const churnVals = params?.churn || params?.churn_values || [];
              const discountVals =
                params?.discount || params?.discount_values || [];
              const clvVals = params?.clv || params?.clv_values || [];

              return (
                <div key={s.id} style={styles.segmentCard}>
                  <div style={styles.segmentTop}>
                    <div style={styles.segmentIcon} aria-hidden>
                      {s.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.segmentName}>{s.name}</div>
                      <div style={styles.segmentBadge}>{s.tag}</div>
                    </div>
                  </div>

                  <div style={styles.segmentNote}>{s.note}</div>

                  <div style={styles.metricList}>
                    <MetricView label="Churn" value={churnVals} />
                    <MetricView label="Discount" value={discountVals} />
                    <MetricView label="CLV" value={clvVals} />
                  </div>

                  {s.id === "silver" && <div style={styles.segmentFooter} />}
                </div>
              );
            })}
          </div>
        </section>

        {/* THRESHOLDS */}
        <section style={styles.card}>
          <div style={styles.sectionTopRow}>
            <div style={styles.sectionTitle}>Thresholds</div>
          </div>
          <div style={styles.subtleText}>This is how High / Mid / Low is set.</div>

          <div style={styles.thresholdGrid}>
            {["discount", "clv", "churn"].map((k) => {
              const t = { ...(meta[k] || {}), ...(thresholds?.[k] || {}) };
              const high = fmtThreshold(t.high);
              const mid = fmtThreshold(t.mid);
              const low = fmtThreshold(t.low);

              return (
                <div key={k} style={styles.thresholdCard}>
                  <div style={styles.thresholdTop}>
                    <div style={styles.thresholdIcon} aria-hidden>
                      {t.icon}
                    </div>
                    <div style={styles.thresholdTitle}>{t.title}</div>
                  </div>

                  <div style={styles.thresholdTable}>
                    <div
                      style={{
                        ...styles.thresholdRow,
                        ...styles.thresholdRowFirst,
                      }}
                    >
                      <div style={styles.thresholdLevel}>High</div>
                      <div style={styles.thresholdValue}>
                        {high.valueText}
                        {!!high.q && <span style={styles.qPill}>{high.q}</span>}
                      </div>
                    </div>

                    <div style={styles.thresholdRow}>
                      <div style={styles.thresholdLevel}>Mid</div>
                      <div style={styles.thresholdValue}>
                        {mid.valueText}
                        {!!mid.q && <span style={styles.qPill}>{mid.q}</span>}
                      </div>
                    </div>

                    <div style={styles.thresholdRow}>
                      <div style={styles.thresholdLevel}>Low</div>
                      <div style={styles.thresholdValue}>
                        {low.valueText}
                        {!!low.q && <span style={styles.qPill}>{low.q}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Spin>
  );
}

function MetricView({ label, value }) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div style={styles.metricRow}>
      <div style={styles.metricKey}>{label}</div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {arr.length === 0 ? (
          <div style={styles.metricVal}>—</div>
        ) : (
          arr.map((v) => (
            <div key={`${label}-${v}`} style={styles.metricVal}>
              {v}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------ THEMES ------------------------ */

// function ThemesSection() {
//   const [mode, setMode] = useState("light");
//   const [selectedTheme, setSelectedTheme] = useState("ocean");

//   const themes = useMemo(
//     () => ({
//       light: [
//         { id: "ocean", name: "Ocean", accent: "#0b66ff" },
//         { id: "sky", name: "Sky", accent: "#3b82f6" },
//         { id: "slate", name: "Slate", accent: "#64748b" },
//         { id: "mint", name: "Mint", accent: "#10b981" },
//         { id: "forest", name: "Forest", accent: "#166534" },
//         { id: "sun", name: "Sun", accent: "#f59e0b" },
//         { id: "rose", name: "Rose", accent: "#e11d48" },
//         { id: "grape", name: "Grape", accent: "#7c3aed" },
//         { id: "teal", name: "Teal", accent: "#0f766e" },
//         { id: "stone", name: "Stone", accent: "#78716c" },
//         { id: "peach", name: "Peach", accent: "#fb923c" },
//         { id: "lime", name: "Lime", accent: "#84cc16" },
//       ],
//       dark: [
//         { id: "midnight", name: "Midnight", accent: "#60a5fa" },
//         { id: "carbon", name: "Carbon", accent: "#94a3b8" },
//         { id: "aurora", name: "Aurora", accent: "#34d399" },
//         { id: "ember", name: "Ember", accent: "#fb7185" },
//         { id: "violet", name: "Violet", accent: "#a78bfa" },
//         { id: "cobalt", name: "Cobalt", accent: "#93c5fd" },
//         { id: "copper", name: "Copper", accent: "#fdba74" },
//         { id: "jade", name: "Jade", accent: "#5eead4" },
//         { id: "ruby", name: "Ruby", accent: "#fda4af" },
//         { id: "smoke", name: "Smoke", accent: "#cbd5e1" },
//         { id: "moss", name: "Moss", accent: "#bef264" },
//         { id: "sand", name: "Sand", accent: "#f5f5f4" },
//       ],
//     }),
//     []
//   );

//   const currentThemes = themes[mode];

//   const onApply = () => {
//     message.success(`Applied ${mode} theme: ${selectedTheme}`);
//   };

//   return (
//     <section style={styles.card}>
//       <div style={styles.sectionTopRow}>
//         <div style={styles.sectionTitle}>Theme presets</div>

//         <div style={styles.tabs}>
//           <Tab
//             label="Light"
//             active={mode === "light"}
//             onClick={() => setMode("light")}
//           />
//           <Tab
//             label="Dark"
//             active={mode === "dark"}
//             onClick={() => setMode("dark")}
//           />
//         </div>
//       </div>

//       <div style={styles.subtleText}>
//         Pick a theme. Selected theme is highlighted.
//       </div>

//       <div style={styles.themeGrid}>
//         {currentThemes.map((t) => {
//           const isSelected = selectedTheme === t.id;
//           return (
//             <button
//               key={t.id}
//               type="button"
//               onClick={() => setSelectedTheme(t.id)}
//               style={{
//                 ...styles.themeTile,
//                 ...(isSelected ? styles.themeTileSelected : null),
//               }}
//               aria-label={`Select theme ${t.name}`}
//               title={t.name}
//             >
//               <div style={styles.themeCircleWrap}>
//                 <div
//                   style={{
//                     ...styles.themeCircle,
//                     background: mode === "dark" ? "#0b1220" : "#f8fafc",
//                     borderColor: mode === "dark" ? "#1f2937" : "#e5e7eb",
//                   }}
//                 >
//                   <div style={{ ...styles.themeAccent, background: t.accent }} />
//                   <div
//                     style={{
//                       ...styles.themeMuted,
//                       background: mode === "dark" ? "#334155" : "#cbd5e1",
//                     }}
//                   />
//                 </div>
//               </div>
//               <div style={styles.themeName}>{t.name}</div>
//             </button>
//           );
//         })}
//       </div>

//       <div style={styles.actionsRow}>
//         <button
//           type="button"
//           style={{ ...styles.button, ...styles.secondary }}
//           onClick={() => setSelectedTheme(currentThemes[0].id)}
//         >
//           Reset
//         </button>
//         <button
//           type="button"
//           style={{ ...styles.button, ...styles.primary }}
//           onClick={onApply}
//         >
//           Apply
//         </button>
//       </div>
//     </section>
//   );
// }

/* ------------------------ CURRENCY ------------------------ */

function CurrencySection() {
  const API_URL = import.meta.env.VITE_CONFIGURATIONS;

  const { code: appliedCurrency, setCurrency, resetCurrency, setInrPer1 } = useCurrency();

  const [region, setRegion] = useState("asia");
  const [baseAmount, setBaseAmount] = useState(1);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState("");

  const regionCurrencies = useMemo(
    () => ({
      asia: [
        { code: "USD", name: "US Dollar" },
        { code: "SGD", name: "Singapore Dollar" },
        { code: "JPY", name: "Japanese Yen" },
        { code: "AED", name: "UAE Dirham" },
      ],
      europe: [
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "British Pound" },
        { code: "CHF", name: "Swiss Franc" },
      ],
      russia: [
        { code: "RUB", name: "Russian Ruble" },
        { code: "KZT", name: "Kazakhstani Tenge" },
      ],
    }),
    []
  );

  const wantedCodes = regionCurrencies[region].map((x) => x.code);

  const format = (num) => {
    if (num == null || Number.isNaN(num)) return "—";
    const abs = Math.abs(num);
    if (abs >= 100) return Number(num).toFixed(2);
    if (abs >= 1) return Number(num).toFixed(4);
    return Number(num).toFixed(6);
  };

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const codesParam = wantedCodes.join(",");
      const res = await fetch(
        `${API_URL}/currency/latest?codes=${encodeURIComponent(codesParam)}`
      );
      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Failed to load rates");

      const map = {};
      (json.data || []).forEach((r) => {
        map[r.base_currency] = r;
      });

      const merged = regionCurrencies[region].map((c) => ({
        ...c,
        inrPer1: map[c.code] ? Number(map[c.code].rate) : null, // INR per 1 currency
        fetchedAt: map[c.code]?.fetched_at || null,
      }));

      setRows(merged);

      // ✅ IMPORTANT: update global rates here (merged exists here)
      const rateMap = {};
      merged.forEach((r) => {
        if (r.inrPer1 != null) rateMap[r.code] = Number(r.inrPer1);
      });
      setInrPer1((prev) => ({ ...prev, ...rateMap }));

      const times = merged.map((x) => x.fetchedAt).filter(Boolean).sort();
      setLastFetchedAt(times.length ? times[times.length - 1] : "");
    } catch (e) {
      message.error(e?.message || "Failed to load rates");
    } finally {
      setLoading(false);
    }
  };

  const refreshNow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/currency/refresh/`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || json?.ok === false)
        throw new Error(json?.message || "Refresh failed");

      message.success("Currency rates refreshed ✅");
      await fetchLatest();
    } catch (e) {
      message.error(e?.message || "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const onApply = (code) => {
  if (appliedCurrency === code) return;
  setCurrency(code);
  message.success(`Applied currency: ${code}`);
};


  return (
    <section style={styles.card}>
      <div style={styles.sectionTopRow}>
        <div style={styles.sectionTitle}>
          Conversion{" "}
          <span style={{ ...styles.qPill, marginLeft: 10 }}>
            Active: {appliedCurrency}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={styles.tabs}>
            <Tab label="Asia" active={region === "asia"} onClick={() => setRegion("asia")} />
            <Tab label="Europe" active={region === "europe"} onClick={() => setRegion("europe")} />
            <Tab label="Russia" active={region === "russia"} onClick={() => setRegion("russia")} />
          </div>

          <button
            type="button"
            style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
            onClick={refreshNow}
            disabled={loading}
          >
            🔄 Refresh
          </button>

          <button
  type="button"
  style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
  onClick={() => {
    resetCurrency();

    // ✅ Clear persisted currency selection
    localStorage.removeItem("app_currency_code"); 
    // (change key name if you used a different one)

    message.success("Reset currency to INR ✅");
  }}
  disabled={loading}
>
  ♻️ Reset to INR
</button>
        </div>
      </div>

      <div style={styles.currencyTop}>
        <div style={styles.field}>
          <div style={styles.fieldLabel}>Base amount (common)</div>
          <input
            value={baseAmount}
            onChange={(e) => setBaseAmount(Number(e.target.value || 0))}
            type="number"
            min="0"
            step="1"
            style={styles.input}
          />
        </div>

        <div style={styles.subtleText}>
          Values show <b>INR for 1 unit</b> of each currency.
          {!!lastFetchedAt && (
            <>
              {" "}
              <span style={{ fontWeight: 700 }}>Last fetched:</span> {String(lastFetchedAt)}
            </>
          )}
        </div>
      </div>

      <Spin spinning={loading}>
        <div style={styles.table}>
          <div style={{ ...styles.tr, ...styles.th }}>
            <div style={styles.tdWide}>Currency</div>
            <div style={styles.td}>1 Currency →</div>
            <div style={styles.td}>Value</div>
            <div style={styles.tdEnd}>Action</div>
          </div>

          {rows.map((r) => {
            const inrFor1 = r.inrPer1;
            const preview =
              inrFor1 != null ? inrFor1 * (Number(baseAmount) || 0) : null;

            return (
              <div key={r.code} style={styles.tr}>
                <div style={styles.tdWide}>
                  <div style={styles.rowTitle}>
                    {r.code} <span style={styles.rowSub}>— {r.name}</span>
                  </div>
                </div>

                <div style={styles.td}>to INR</div>

                <div style={styles.td}>
                  <div style={styles.mono}>
                    {format(inrFor1)}{" "}
                    <span style={styles.muted}>
                      ({format(preview)} INR for {baseAmount} {r.code})
                    </span>
                  </div>
                </div>

                <div style={styles.tdEnd}>
                  <button
  type="button"
  style={{
    ...styles.button,
    ...styles.smallBtn,
    ...(appliedCurrency === r.code ? styles.disabledBtn : styles.primary),
  }}
  onClick={() => onApply(r.code)}
  disabled={loading || appliedCurrency === r.code}
>
  {appliedCurrency === r.code ? "Applied ✅" : "Apply"}
</button>
                </div>
              </div>
            );
          })}
        </div>
      </Spin>
    </section>
  );
}



/* ------------------------ FONTS ------------------------ */

function FontsSection() {
  const fonts = useMemo(
    () => [
      {
        name: "Inter",
        stack:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      },
      { name: "Poppins", stack: 'Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Montserrat", stack: 'Montserrat, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Open Sans", stack: '"Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Nunito", stack: 'Nunito, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Raleway", stack: 'Raleway, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Rubik", stack: 'Rubik, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Lato", stack: 'Lato, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Source Sans 3", stack: '"Source Sans 3", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Ubuntu", stack: 'Ubuntu, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', source: "google" },
      { name: "Merriweather", stack: 'Merriweather, Georgia, "Times New Roman", serif', source: "google" },
      { name: "Playfair Display", stack: '"Playfair Display", Georgia, "Times New Roman", serif', source: "google" },
      {
        name: "Roboto",
        stack:
          "Roboto, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial",
      },
      {
        name: "Segoe UI",
        stack:
          "Segoe UI, ui-sans-serif, system-ui, -apple-system, Roboto, Helvetica, Arial",
      },
      { name: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
      { name: "Times New Roman", stack: '"Times New Roman", Times, serif' },
      { name: "Courier New", stack: '"Courier New", Courier, monospace' },
      {
        name: "Trebuchet MS",
        stack: '"Trebuchet MS", ui-sans-serif, system-ui, -apple-system',
      },
      { name: "Verdana", stack: "Verdana, Geneva, Tahoma, sans-serif" },
    ],
    []
  );

  useEffect(() => {
    fonts.filter((f) => f.source === "google").forEach((f) => ensureGoogleFontLoaded(f.name));
  }, [fonts]);

  const [q, setQ] = useState("");

  // "applied" font (what's currently active in the app)
  const [appliedFont, setAppliedFont] = useState(
    () => localStorage.getItem("app_font_family") || fonts[0].name
  );

  // "selected" font (for highlighting row)
  const [selected, setSelected] = useState(appliedFont);

  const filtered = fonts.filter((f) =>
    f.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const applyOne = (fontName) => {
    const picked = fonts.find((f) => f.name === fontName);

    // Load google font (safe to call even for non-google fonts)
    ensureGoogleFontLoaded(picked?.name || fontName);

    // Apply to CSS variable (global)
    applyFontFamily(picked?.name || fontName);

    // Persist
    localStorage.setItem("app_font_family", picked?.name || fontName);

    // Update UI state
    setAppliedFont(picked?.name || fontName);
    setSelected(picked?.name || fontName);

    message.success(`Applied font: ${picked?.name || fontName}`);
  };

  return (
<div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "0 0 150px 0",
        }}
      >
    <section style={styles.card}>
      <div style={styles.sectionTopRow}>
        <div style={styles.sectionTitle}>
          Fonts{" "}
          <span style={{ ...styles.qPill, marginLeft: 10 }}>
            Active: {appliedFont}
          </span>
        </div>

        <div style={styles.fieldInline}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fonts..."
            style={{ ...styles.input, width: 200 }}
          />
        </div>
      </div>

      <div style={styles.fontList}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>No fonts found.</div>
        ) : (
          filtered.map((f) => {
            const isSelected = selected === f.name;
            const isApplied = appliedFont === f.name;

            return (
              <div
                key={f.name}
                style={{
                  ...styles.fontRow,
                  ...(isSelected ? styles.fontRowSelected : null),
                  cursor: "default",
                }}
              >
                {/* left content */}
                <button
                  className="fontPickBtn"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelected(f.name)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div style={styles.fontLeft}>
                    <div style={styles.fontName}>{f.name}</div>
                    <div style={{ ...styles.fontSample, fontFamily: f.stack }}>
                      The quick brown fox jumps over the lazy dog.
                    </div>
                  </div>
                </button>

                {/* right actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      ...styles.radio,
                      ...(isSelected ? styles.radioOn : null),
                    }}
                    aria-hidden
                    title={isSelected ? "Selected" : "Select"}
                  />

                  <button
                  className="fontApplyBtn"
                    type="button"
                    style={{
                      ...styles.button,
                      ...styles.smallBtn,
                      ...(isApplied ? styles.disabledBtn : styles.primary),
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyOne(f.name)}
                    disabled={isApplied}
                  >
                    {isApplied ? "Applied ✅" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
    </div>
  );
}


/* ------------------------ EMAIL ------------------------ */

function EmailConfigSection() {
  const API_URL = import.meta.env.VITE_CONFIGURATIONS;

  const [configs, setConfigs] = useState([
    { id: "churn", name: "Churn Simulator", fromEmail: "churn-sim@yourdomain.com" },
    { id: "bulk", name: "Bulk Email Agent", fromEmail: "bulk-agent@yourdomain.com" },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [draftEmail, setDraftEmail] = useState("");

  // Modal for token generation (python style)
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [activeCfg, setActiveCfg] = useState(null);

  const [authUrl, setAuthUrl] = useState("");
  const [redirectedUrl, setRedirectedUrl] = useState("");
  const [tokenPath, setTokenPath] = useState("");
  const [busy, setBusy] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

  const authHeaders = (extra = {}) => ({
    ...extra,
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const startEdit = (id) => {
    const current = configs.find((c) => c.id === id);
    setEditingId(id);
    setDraftEmail(current?.fromEmail || "");
  };

  const cancel = () => {
    setEditingId(null);
    setDraftEmail("");
  };

  const save = () => {
    if (!editingId) return;

    if (!isValidEmail(draftEmail)) {
      message.error("Please enter a valid email address");
      return;
    }

    setConfigs((prev) =>
      prev.map((c) => (c.id === editingId ? { ...c, fromEmail: draftEmail.trim() } : c))
    );

    setEditingId(null);
    setDraftEmail("");
    message.success("Saved ✅");
  };

  // ✅ Open token modal (python flow)
  const openTokenModal = (cfg) => {
    setActiveCfg(cfg);
    setAuthUrl("");
    setRedirectedUrl("");
    setTokenPath("");
    setTokenModalOpen(true);
  };

  // ✅ Step-1: get auth url from backend
  const generateAuthUrl = async () => {
    if (!activeCfg?.id) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/email/gmail/auth-url/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ config_id: activeCfg.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || "Failed to generate auth url");

      setAuthUrl(json.auth_url || "");
      message.success("Auth URL generated ✅");
    } catch (e) {
      message.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Step-2: exchange code from pasted redirected URL and save token json
  const saveTokenFromRedirectedUrl = async () => {
    if (!activeCfg?.id) return;
    if (!redirectedUrl.trim()) {
      message.error("Paste the redirected URL first");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/email/gmail/exchange/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          config_id: activeCfg.id,
          redirected_url: redirectedUrl.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || "Failed to save token");

      setTokenPath(json.token_path || "");
      message.success("token.json saved ✅");
    } catch (e) {
      message.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      message.success("Copied ✅");
    } catch {
      message.error("Copy failed");
    }
  };

  return (
    <section style={styles.card}>
      <div style={styles.sectionTopRow}>
        <div style={styles.sectionTitle}>Email</div>
      </div>

      <div style={styles.grid2}>
        {configs.map((c) => {
          const isEditing = editingId === c.id;

          return (
            <div key={c.id} style={styles.innerCard}>
              <div style={styles.innerCardTop}>
                <div>
                  <div style={styles.innerCardTitle}>{c.name}</div>
                  <div style={styles.subtleText}>From email</div>
                </div>

                {/* ✅ Token Refresh -> python flow modal */}
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
                  onClick={() => openTokenModal(c)}
                >
                  Token Refresh
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                {!isEditing ? (
                  <div style={styles.kvRowSmall}>
                    <div style={styles.kvKey}>From</div>
                    <div style={styles.kvValMono}>{c.fromEmail}</div>
                  </div>
                ) : (
                  <div style={styles.field}>
                    <div style={styles.fieldLabel}>From email</div>
                    <input
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      placeholder="name@domain.com"
                      style={styles.input}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div style={{ ...styles.actionsRow, marginTop: 14 }}>
                {!isEditing ? (
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.secondary }}
                    onClick={() => startEdit(c.id)}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      style={{ ...styles.button, ...styles.secondary }}
                      onClick={cancel}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      style={{ ...styles.button, ...styles.primary }}
                      onClick={save}
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Token Modal: EXACT python flow UX */}
      <Modal
        open={tokenModalOpen}
        title={`Generate Gmail Token - ${activeCfg?.name || ""}`}
        onCancel={() => setTokenModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={busy}>
          <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.6 }}>
            1) Click <b>Generate Auth URL</b> and open it in browser.<br />
            2) Approve access.<br />
            3) Copy the <b>FULL redirected URL</b> from browser and paste below.<br />
            4) Click <b>Save token.json</b>.
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.primary }}
              onClick={generateAuthUrl}
            >
              Generate Auth URL
            </button>

            {authUrl && (
              <button
                type="button"
                style={{ ...styles.button, ...styles.secondary }}
                onClick={() => copyToClipboard(authUrl)}
              >
                Copy Auth URL
              </button>
            )}
          </div>

          {authUrl && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>Auth URL</div>
              <textarea
                value={authUrl}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 80,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  padding: 10,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ ...styles.fieldLabel, marginBottom: 6 }}>Paste redirected URL</div>
            <textarea
              value={redirectedUrl}
              onChange={(e) => setRedirectedUrl(e.target.value)}
              placeholder="Paste the FULL redirected URL here..."
              style={{
                width: "100%",
                minHeight: 90,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: 10,
                fontSize: 12,
                fontFamily: "monospace",
              }}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.secondary }}
              onClick={() => setTokenModalOpen(false)}
            >
              Close
            </button>

            <button
              type="button"
              style={{ ...styles.button, ...styles.primary }}
              onClick={saveTokenFromRedirectedUrl}
            >
              Save token.json
            </button>
          </div>

          {!!tokenPath && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#166534", fontWeight: 700 }}>
              ✅ Token saved at: <span style={{ fontFamily: "monospace" }}>{tokenPath}</span>
            </div>
          )}
        </Spin>
      </Modal>
    </section>
  );
}







/* ------------------------ PREDICTION ------------------------ */

function PredictionSection() {
  const windows = useMemo(
    () => [
      { key: "d7", label: "Next 7 days", value: 7 },
      { key: "d30", label: "Next 30 days", value: 30 },
      { key: "d60", label: "Next 60 days", value: 60 },
      { key: "d90", label: "Next 90 days", value: 90 },
      { key: "m6", label: "Next 6 months", value: 180 },
      { key: "y1", label: "Next 1 year", value: 365 },
    ],
    []
  );

  const [checked, setChecked] = useState({
    d7: true,
    d30: true,
    d60: false,
    d90: false,
    m6: false,
    y1: false,
  });

  const selectedWindows = windows.filter((w) => checked[w.key]);
  const actualWindowText =
    selectedWindows.length > 0
      ? selectedWindows.map((w) => w.label).join(" + ")
      : "None";

  const toggle = (key) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  const selectAll = () => {
    const next = {};
    windows.forEach((w) => (next[w.key] = true));
    setChecked(next);
  };

  const clearAll = () => {
    const next = {};
    windows.forEach((w) => (next[w.key] = false));
    setChecked(next);
  };

  const apply = () => {
    const picked = windows.filter((w) => checked[w.key]).map((w) => w.label);
    message.success(`Applied: ${picked.length ? picked.join(", ") : "None"}`);
  };

  const customerTypes = useMemo(
    () => [
      { key: "renewed", label: "Renewed customers" },
      { key: "not_renewed", label: "Not renewed customers" },
    ],
    []
  );

  const [customerChecked, setCustomerChecked] = useState({
    renewed: false,
    not_renewed: true,
  });

  const toggleCustomer = (key) =>
    setCustomerChecked((p) => ({ ...p, [key]: !p[key] }));

  const customerActualText = customerChecked.not_renewed
    ? "Not renewed customers"
    : customerChecked.renewed
    ? "Renewed customers"
    : "None";

  const selectAllCustomers = () =>
    setCustomerChecked({ renewed: true, not_renewed: true });
  const clearAllCustomers = () =>
    setCustomerChecked({ renewed: false, not_renewed: false });

  const applyCustomers = () => {
    const picked = customerTypes
      .filter((c) => customerChecked[c.key])
      .map((c) => c.label);
    message.success(
      `Customer filter applied: ${picked.length ? picked.join(", ") : "None"}`
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 0 150px 0", }}>

      
      <section style={styles.card}>
        <div style={styles.sectionTopRow}>
          <div style={styles.sectionTitle}>Checklist</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
              onClick={clearAll}
            >
              Clear
            </button>
            <button
              type="button"
              style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
              onClick={selectAll}
            >
              Select all
            </button>
          </div>
        </div>

        <div style={styles.subtleText}>
          Select windows and click Apply.{" "}
          <span style={styles.actualPill}>
            Actual:{" "}
            <span style={styles.actualPillStrong}>{actualWindowText}</span>
          </span>
        </div>

        <div style={styles.checklistCard}>
          {windows.map((w) => (
            <label key={w.key} style={styles.checkRow}>
              <input
                type="checkbox"
                checked={!!checked[w.key]}
                onChange={() => toggle(w.key)}
              />
              <span style={styles.checkLabel}>{w.label}</span>
            </label>
          ))}
        </div>

        <div style={styles.actionsRow}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.primary }}
            onClick={apply}
          >
            Apply
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTopRow}>
          <div style={styles.sectionTitle}>Customer data</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
              onClick={clearAllCustomers}
            >
              Clear
            </button>
            <button
              type="button"
              style={{ ...styles.button, ...styles.smallBtn, ...styles.secondary }}
              onClick={selectAllCustomers}
            >
              Select all
            </button>
          </div>
        </div>

        <div style={styles.subtleText}>
          Choose which customers to include.{" "}
          <span style={styles.actualPill}>
            Actual:{" "}
            <span style={styles.actualPillStrong}>{customerActualText}</span>
          </span>
        </div>

        <div style={styles.checklistCard}>
          {customerTypes.map((c) => (
            <label key={c.key} style={styles.checkRow}>
              <input
                type="checkbox"
                checked={!!customerChecked[c.key]}
                onChange={() => toggleCustomer(c.key)}
              />
              <span style={styles.checkLabel}>{c.label}</span>
            </label>
          ))}
        </div>

        <div style={styles.actionsRow}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.primary }}
            onClick={applyCustomers}
          >
            Apply
          </button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------ UI HELPERS ------------------------ */

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...styles.tab, ...(active ? styles.tabActive : null) }}
    >
      {label}
    </button>
  );
}

/* ------------------------ STYLES ------------------------ */

const styles = {
  page: {
    marginTop: "30px",
    height: "100vh",
    width: "100%",
    display: "flex",
    background: "#ffffff",
    color: "#0f172a",
    fontFamily:
      "var(--app-font-family)",
  },

  sidebar: {
    width: 280,
    borderRight: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: 18,
    boxSizing: "border-box",
  },
  sidebarHeader: { marginBottom: 14 },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: 2,
  },

  confirmCenterWrap: {
    minHeight: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  sidebarSubtitle: { fontSize: 12, color: "#64748b" },
  nav: { display: "flex", flexDirection: "column", gap: 6, marginTop: 10 },
  navItem: {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,

  // ✅ important (removes native button border/appearance)
  appearance: "none",
  WebkitAppearance: "none",
  background: "transparent",
  border: "1px solid transparent",

  // ✅ remove focus outline ring
  outline: "none",
  boxShadow: "none",

  cursor: "pointer",
  textAlign: "left",
  color: "#0f172a",
},

  navItemActive: { background: "#eef6ff", borderColor: "#dbeafe" },
  navIcon: {
    width: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  navLabel: { fontSize: 13, fontWeight: 600 },

  content: { flex: 1, padding: 28, boxSizing: "border-box" },

  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  header: { paddingBottom: 10 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 13, color: "#64748b" },
  divider: { height: 1, background: "#e5e7eb", margin: "12px 0 22px" },

  card: {
    width: "100%",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 12,
    padding: '18px 18px 18px 18px',
  },

  sectionTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  subtleText: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.4 },

  tabs: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f1f5f9",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
  },
  tabActive: {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },

  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 10,
  },
  themeTile: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 12,
    padding: 10,
    cursor: "pointer",
    textAlign: "center",
  },
  themeTileSelected: {
    borderColor: "#0b66ff",
    boxShadow: "0 0 0 3px rgba(11,102,255,0.12)",
  },
  themeCircleWrap: { display: "flex", justifyContent: "center", marginBottom: 8 },
  themeCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    position: "relative",
    overflow: "hidden",
  },
  themeAccent: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "52%",
    height: "52%",
    borderTopRightRadius: 18,
  },
  themeMuted: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "52%",
    height: "52%",
    borderBottomLeftRadius: 18,
    opacity: 0.9,
  },
  themeName: { fontSize: 12, fontWeight: 600, color: "#0f172a" },

  currencyTop: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  table: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    background: "#ffffff",
  },
  tr: {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.8fr 1.2fr 0.6fr",
    gap: 10,
    alignItems: "center",
    padding: "12px 12px",
    borderTop: "1px solid #e5e7eb",
  },
  th: {
    background: "#f8fafc",
    borderTop: "none",
    fontSize: 12,
    fontWeight: 900,
    color: "#334155",
  },
  tdWide: { minWidth: 0 },
  td: { fontSize: 13, color: "#0f172a", minWidth: 0 },
  tdEnd: { display: "flex", justifyContent: "flex-end" },
  rowTitle: { fontSize: 13, fontWeight: 600 },
  rowSub: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  mono: {
    fontFamily:
      "var(--app-font-family)",
    fontSize: 12,
    color: "#0f172a",
  },
  muted: { color: "#64748b", fontWeight: 700 },

  segmentGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 },
  segmentCard: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 240,
  },
  segmentTop: { display: "flex", alignItems: "center", gap: 10 },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  segmentName: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  segmentNameSmall: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" },
  segmentBadge: { fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 },
  segmentNote: {
    fontSize: 12,
    color: "#334155",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "8px 10px",
    borderRadius: 12,
    lineHeight: 1.35,
  },
  segmentFooter: { marginTop: "auto" },
  smallMuted: { fontSize: 11, color: "#64748b", fontWeight: 700, lineHeight: 1.35 },

  metricList: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#ffffff" },
  metricRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 10px", borderTop: "1px solid #e5e7eb" },
  metricKey: { fontSize: 12, fontWeight: 600, color: "#334155" },
  metricVal: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },

  thresholdGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 },
  thresholdCard: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fontPickBtn : {
    outline: "none",
    boxShadow: "none",
  },
fontApplyBtn : {
  outline: "none",
  boxShadow: "none",
},
  thresholdTop: { display: "flex", alignItems: "center", gap: 10 },
  thresholdIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  thresholdTitle: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" },
  thresholdTable: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  thresholdRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 10px", borderTop: "1px solid #e5e7eb", background: "#ffffff" },
  thresholdRowFirst: { borderTop: "none" },
  thresholdLevel: { fontSize: 12, fontWeight: 600, color: "#334155" },
  thresholdValue: { fontSize: 12, fontWeight: 600, color: "#0f172a" },

  fontList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 , padding : 18 },
  fontRow: { width: "100%", display: "flex", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#ffffff", cursor: "pointer", textAlign: "left", },
  fontRowSelected: { borderColor: "#0b66ff", boxShadow: "0 0 0 3px rgba(11,102,255,0.12)" },
  fontLeft: { minWidth: 0 },
  fontName: { fontSize: 13, fontWeight: 600, marginBottom: 6 },
  fontSample: { fontSize: 13, color: "#334155", lineHeight: 1.35 },
  fontRight: { display: "flex", alignItems: "center" },
  radio: { width: 16, height: 16, borderRadius: 999, border: "2px solid #cbd5e1", background: "#ffffff" },
  radioOn: { borderColor: "#0b66ff", boxShadow: "inset 0 0 0 4px #0b66ff" },
  emptyState: { padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px dashed #e5e7eb", color: "#64748b", fontSize: 13, fontWeight: 700 },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldInline: { display: "flex", alignItems: "center", gap: 8 , },
  fieldLabel: { fontSize: 12, color: "#64748b", fontWeight: 600 },
  input: { height: 36, borderRadius: 10, border: "1px solid #e5e7eb", padding: "0 10px", fontSize: 13, outline: "none" },

  innerCard: { border: "1px solid #e5e7eb", background: "#f8fafc", borderRadius: 12, padding: 14 },
  innerCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  innerCardTitle: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 },
  kvRowSmall: { display: "grid", gridTemplateColumns: "80px 1fr", gap: 10, alignItems: "center", padding: "10px 10px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12 },
  kvKey: { fontSize: 12, fontWeight: 600, color: "#334155" },
  kvValMono: { fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "var(--app-font-family)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  actionsRow: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
  button: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#ffffff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0f172a" },
  smallBtn: { padding: "8px 10px", fontSize: 12, borderRadius: 10 },
  primary: { background: "#0b66ff", borderColor: "#0b66ff", color: "#ffffff" },
  secondary: { background: "#ffffff", color: "#0f172a" },

  grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 10 },

  checklistCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 10 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, background: "#ffffff", border: "1px solid #e5e7eb", cursor: "pointer", userSelect: "none" },
  checkLabel: { fontSize: 13, fontWeight: 600, color: "#0f172a" },

  actualPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    marginLeft: 8,
    fontWeight: 600,
  },
  actualPillStrong: { fontWeight: 600 },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 999,
  },
  modal: {
    width: "min(1100px, 100%)",
    maxHeight: "70vh",
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transform: "translateY(-28px)",
    minHeight: 0,
    position: "relative",
  },
  modalSpinOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },

  qPill: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#334155",
  },

  modalHeader: {
    padding: 14,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  modalSub: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.35 },

  errorBanner: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorTitle: { fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 2 },
  errorText: { fontSize: 12, color: "#7f1d1d", fontWeight: 700, lineHeight: 1.35 },

  iconBtn: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "1px 0 0 2px",
    borderRadius: 10,
    height: 36,
    width: 36,
    cursor: "pointer",
    fontWeight: 600,
    transform: "translateX(-8px)",
  },
  modalBody: {
    padding: 14,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
    minHeight: 0,
  },
  modalCard: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 14,
    padding: 14,
  },
  modalCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  modalCardTitle: { fontSize: 14, fontWeight: 600 },
  modalCardActions: { display: "flex", gap: 8, flexWrap: "wrap" },

  nameGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  nameRow: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: 12,
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
    background: "#f8fafc",
  },
  nameLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  nameIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },

  thresholdHint: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#94a3b8",
  },

  nameLabel: { fontSize: 13, fontWeight: 600, color: "#0f172a" },

  metricsEditGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 },
  metricsEditCard: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#ffffff" },
  metricsEditTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },

  pickerRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderTop: "1px solid #e5e7eb",
  },
  pickerLabel: { fontSize: 12, fontWeight: 600, color: "#334155" },

  pills: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
  },
  disabledBtn: {
  background: "#e5e7eb",
  borderColor: "#e5e7eb",
  color: "#64748b",
  cursor: "not-allowed",
},
  pillActive: { borderColor: "#0b66ff", background: "#eef6ff", boxShadow: "0 0 0 3px rgba(11,102,255,0.12)" },

  thresholdEditGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 },
  thresholdEditCard: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#ffffff" },
  thresholdEditTable: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 },
  thresholdEditRow: { display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, alignItems: "center" },
};
