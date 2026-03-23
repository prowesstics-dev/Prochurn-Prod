import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SegConfigCtx = createContext(null);
const STORAGE_KEY = "segmentation_config_v2"; // bump version so old broken {} doesn't load

// ✅ Default segments (DB keys never change)
const DEFAULT_SEGMENTS = [
  {
    id: "platinum",
    code: "Platinum",
    name: "Platinum",
    icon: "💎",
    tag: "Elite Retainers",
    note: "Only when Predicted Status = Not Renewed",
    metrics: { churn: "Mid", discount: "Mid", clv: "High" },
  },
  {
    id: "gold",
    code: "Gold",
    name: "Gold",
    icon: "🥇",
    tag: "Potential Customers",
    note: "Only when Predicted Status = Not Renewed",
    metrics: { churn: "Low", discount: "High", clv: "Mid" },
  },
  {
    id: "silver",
    code: "Silver",
    name: "Silver",
    icon: "🥈",
    tag: "Low Value Customers",
    note: "Only when Predicted Status = Not Renewed",
    metrics: { churn: "High", discount: "Low", clv: "Low" },
  },
];

const DEFAULT_THRESHOLDS = {
  churn: { low: null, mid: null, high: null },
  clv: {
    low: { value: null, q: "Q25" },
    mid: { value: null, q: "Q50" },
    high: { value: null, q: "Q75" },
  },
  discount: {
    low: { value: null, q: "Q25" },
    mid: { value: null, q: "Q50" },
    high: { value: null, q: "Q75" },
  },
};

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isPlainObject(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function mergeThresholdsWithDefaults(incoming) {
  const out = JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS));
  if (!isPlainObject(incoming)) return out;

  // churn numbers
  if (isPlainObject(incoming.churn)) {
    out.churn.low = incoming.churn.low ?? out.churn.low;
    out.churn.mid = incoming.churn.mid ?? out.churn.mid;
    out.churn.high = incoming.churn.high ?? out.churn.high;
  }

  // clv/discount objects
  ["clv", "discount"].forEach((k) => {
    if (!isPlainObject(incoming[k])) return;

    ["low", "mid", "high"].forEach((lvl) => {
      const v = incoming[k][lvl];

      // allow object or raw number
      if (isPlainObject(v)) {
        out[k][lvl].value = v.value ?? out[k][lvl].value;
        out[k][lvl].q = v.q || out[k][lvl].q;
      } else if (v !== undefined && v !== null && v !== "") {
        out[k][lvl].value = Number(v);
      }
    });
  });

  return out;
}

function normalizeSegments(incoming) {
  // Keep default structure; only allow overriding name/metrics if present
  const base = JSON.parse(JSON.stringify(DEFAULT_SEGMENTS));
  if (!Array.isArray(incoming)) return base;

  const map = {};
  incoming.forEach((s) => {
    if (s?.id) map[s.id] = s;
  });

  return base.map((d) => {
    const x = map[d.id];
    if (!x) return d;
    return {
      ...d,
      name: typeof x.name === "string" ? x.name : d.name,
      metrics: isPlainObject(x.metrics) ? { ...d.metrics, ...x.metrics } : d.metrics,
    };
  });
}

export function SegmentationConfigProvider({ children }) {
  const loaded = safeLoad();

  const [segments, setSegments] = useState(() => normalizeSegments(loaded?.segments));
  const [thresholds, setThresholds] = useState(() =>
    mergeThresholdsWithDefaults(loaded?.thresholds)
  );

  const [renaming, setRenaming] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);

  // ⚠️ ensure this env var is correct
  const API_URL = import.meta.env.VITE_CONFIGURATIONS;

  // ✅ Save to localStorage for fast UI restore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ segments, thresholds }));
    } catch {}
  }, [segments, thresholds]);

  // ✅ Display mapping (table shows DB code but UI shows name)
  const segmentDisplayMap = useMemo(() => {
    const m = {};
    (segments || []).forEach((s) => {
      m[s.id] = s.name || s.id;
      m[s.code] = s.name || s.code;
    });
    return m;
  }, [segments]);

  // ✅ Load saved config from DB on first mount
  useEffect(() => {
    if (!API_URL) return;

    async function loadConfig() {
      try {
        const res = await fetch(`${API_URL}/segmentation-config`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();

        // Segment names from DB
        if (isPlainObject(json?.segment_names)) {
          setSegments((prev) =>
            (prev || []).map((s) => ({
              ...s,
              name: json.segment_names[s.id] ?? s.name,
            }))
          );
        }

        // Thresholds from DB (MERGE, don't overwrite)
        const tRes = await fetch(`${API_URL}/segmentation-config/actual-thresholds`, {
        credentials: "include",
      });

      if (tRes.ok) {
        const tJson = await tRes.json();

        // support either {data:{...}} OR {thresholds:{...}} OR direct {...}
        const incoming =
          (isPlainObject(tJson?.data) && tJson.data) ||
          (isPlainObject(tJson?.thresholds) && tJson.thresholds) ||
          (isPlainObject(tJson) && tJson) ||
          null;

        if (isPlainObject(incoming)) {
          setThresholds((prev) =>
            mergeThresholdsWithDefaults({ ...prev, ...incoming })
          );
        }
      }
      } catch (e) {
        console.error("Failed to load segmentation config", e);
      }
    }

    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Apply + persist names
  const applySegmentNames = async (namesMap) => {
    if (!isPlainObject(namesMap)) return;

    setRenaming(true);

    // 1) Update UI immediately
    setSegments((prev) =>
      (prev || []).map((s) => ({
        ...s,
        name: namesMap[s.id] ?? s.name,
      }))
    );

    // 2) Persist to DB
    try {
      if (API_URL) {
        const res = await fetch(`${API_URL}/segmentation-config/save`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment_names: namesMap }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to save segment names", e);
    } finally {
      setRenaming(false);
    }
  };

  // ✅ Apply + persist thresholds (so next reload shows them)
  const applyThresholds = async (nextThresholds) => {
    const merged = mergeThresholdsWithDefaults(nextThresholds);
    setSavingThresholds(true);

    // 1) Update UI immediately
    setThresholds(merged);

    // 2) Persist to DB
    try {
      if (API_URL) {
        const res = await fetch(`${API_URL}/segmentation-config/save`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ thresholds: merged }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to save thresholds", e);
    } finally {
      setSavingThresholds(false);
    }
  };

  const value = {
    segments,
    setSegments,
    thresholds,
    setThresholds, // still exposed (but better to use applyThresholds)
    segmentDisplayMap,
    renaming,
    savingThresholds,
    applySegmentNames,
    applyThresholds,
    DEFAULT_SEGMENTS,
    DEFAULT_THRESHOLDS,
  };

  return <SegConfigCtx.Provider value={value}>{children}</SegConfigCtx.Provider>;
}

export function useSegmentationConfig() {
  const ctx = useContext(SegConfigCtx);
  if (!ctx) throw new Error("useSegmentationConfig must be used inside SegmentationConfigProvider");
  return ctx;
}
