// src/analytics.js


// const API_BASE = import.meta.env.VITE_ANALYTICS ||
//   'http://localhost:8000/analytics';

const API_BASE = import.meta.env.VITE_ANALYTICS || 
  `${import.meta.env.VITE_API_URL}/analytics`;


const ENDPOINT = `${API_BASE}/ingest/`; // Django endpoint (same origin via NGINX)
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH = 50;

const state = {
  queue: [],
  sessionId: (() => {
    const k = "hm_session_id";
    let v = localStorage.getItem(k);
    if (!v) {
      const uuid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
      v = uuid;
      localStorage.setItem(k, v);
    }
    return v;
  })(),
  userId: undefined
};

export function setUser(id) {
  state.userId = id;
}

export function track(type, data = {}) {
  state.queue.push({
    type,
    ts: Date.now(),
    session_id: state.sessionId,
    user_id: state.userId,
    route: location.pathname + location.search,
    data
  });
  if (state.queue.length >= MAX_BATCH) flush();
}

function post(payload) {
  const body = JSON.stringify({ events: payload });
  if (navigator.sendBeacon) {
    const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!ok) fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  } else {
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }
}

export function flush() {
  if (!state.queue.length) return;
  const batch = state.queue.splice(0, MAX_BATCH);
  post(batch);
}

// ---- Session visibility → duration heartbeats ----
let visibleSince = document.visibilityState === "visible" ? performance.now() : null;

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    visibleSince = performance.now();
  } else if (visibleSince != null) {
    const delta = Math.round(performance.now() - visibleSince);
    track("session_heartbeat", { ms_visible: delta });
    flush();
    visibleSince = null;
  }
});

// ---- Page views (call on route change, too) ----
export function trackPageView() {
  track("page_view", {});
}

// ---- Click tracking (use data-uxid on important elements) ----
export function enableClickTracking() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;
    const id =
      target.getAttribute && (target.getAttribute("data-uxid") || target.id || target.getAttribute("aria-label")) ||
      (target.tagName || "UNKNOWN");
    track("ui_click", { id });
  });
}

// ---- API timing helper (wrap your fetch calls) ----
export async function timedFetch(input, init) {
  const t0 = performance.now();
  try {
    const res = await fetch(input, init);
    const t1 = performance.now();
    track("api_timing", { url: String(input), status: res.status, ms: Math.round(t1 - t0) });
    return res;
  } catch (err) {
    const t1 = performance.now();
    track("api_timing", { url: String(input), status: "CLIENT_ERROR", ms: Math.round(t1 - t0) });
    throw err;
  }
}

// ---- Navigation timing on full load ----
window.addEventListener("load", () => {
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav) {
    track("page_load", {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      dom_content_loaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      load: Math.round(nav.loadEventEnd - nav.startTime)
    });
  }
});

// Auto-flush every few seconds
setInterval(flush, FLUSH_INTERVAL_MS);
