// BulkEmail.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mail, RefreshCw, Send, CheckCircle, XCircle, Clock,
  Filter, Search, Download, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Modal, Table, Checkbox, Spin, Alert, message } from 'antd';
// import 'antd/dist/reset.css';
const { confirm } = Modal;

/** API base */

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

// Convert selected currency -> INR (INR per 1 unit of currency)
const convertToINR = (val, currencyCode, inrPer1) => {
  const v = Number(val || 0);
  if (!Number.isFinite(v)) return 0;
  if (!currencyCode || currencyCode === "INR") return v;

  const rate = Number(inrPer1?.[currencyCode]);
  if (!Number.isFinite(rate) || rate <= 0) return v; // fallback
  return v * rate;
};


const formatMoney = (inrValue, currencyCode, inrPer1) => {
  const symbol = CURRENCY_SYMBOL[currencyCode] || "";
  const x = convertINR(inrValue, currencyCode, inrPer1);
  return `${symbol}${x.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

// --- Money formatting helpers (UI only) ---
const currencyLabel = (code) => {
  if (!code) return "";
  if (code === "INR") return "₹ (INR)";
  const sym = CURRENCY_SYMBOL[code];
  return sym ? `${sym} (${code})` : code;
};

// For deltas: show "-$123.45" instead of "$-123.45"
const formatMoneySigned = (inrValue, currencyCode, inrPer1) => {
  const v = Number(inrValue || 0);
  if (!Number.isFinite(v)) return formatMoney(0, currencyCode, inrPer1);
  const sign = v < 0 ? "-" : "";
  return sign + formatMoney(Math.abs(v), currencyCode, inrPer1);
};

// If you want a “small hint” under INR inputs (optional)
const formatMoneyHint = (inrValue, currencyCode, inrPer1) => {
  if (!currencyCode || currencyCode === "INR") return "";
  return `≈ ${formatMoney(inrValue, currencyCode, inrPer1)}`;
};


const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
// replaces: const n = (x) => Number(x ?? 0);
const n = (x) => {
  if (x == null) return 0;
  const v = parseFloat(String(x).replace(/[^\d.-]/g, "")); // strip ₹ and commas
  return Number.isFinite(v) ? v : 0;
};

const API_BASE =
  import.meta.env.VITE_BULK_EMAIL_BASE;

/** Auth helper */
function authHeaders(extra = {}) {
  const h = { ...extra };
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

/** change update endpoint (expects array of changes) */
async function apiUpdateChangeBatch(changes = []) {
  const r = await fetch(`${API_BASE}/change/update`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ changes }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(txt || 'Change update failed');
  }
  return r.json();
}

async function apiUpdateDraft({ policy_no_norm, subject, body_text }) {
  const r = await fetch(`${API_BASE}/draft/update`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ policy_no_norm, subject, body_text })
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || 'Draft update failed');
  }
  return r.json();
}

/** Neumorphic + utility styles (kept same as your provided file) */
const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)', padding: '20px 24px 74px 24px', fontFamily : "var(--app-font-family)", position: 'relative' },
  innerContainer: { maxWidth: '1400px', margin: '0 auto', position: 'relative' },
  header: { textAlign: 'center', background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', WebkitTextStroke: '0.5px rgba(0,0,0,0.1)', backgroundClip: 'text', marginBottom: '50px', fontSize: '40px', fontWeight: '700', letterSpacing: '-1px', lineHeight: '1.5', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' },
  headerSubtitle: { textAlign: 'center', color: '#718096', marginTop: '-36px', fontSize: '16px', fontWeight: '500', letterSpacing: '0.5px', marginBottom: '32px' },
  card: { backgroundColor: '#f0f2f5', borderRadius: '24px', marginBottom: '32px', boxShadow: `12px 12px 24px rgba(163, 177, 198, 0.6), -12px -12px 24px rgba(255, 255, 255, 0.8)`, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' },
  cardHeader: { background: 'linear-gradient(to right, #23345cff, #065279ff, #06b6d4)', padding: '20px 32px', position: 'relative', borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { padding: '32px' },
  sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px' },
  sectionSubtitle: { fontSize: '14px', color: '#718096', marginBottom: '24px', fontWeight: '500', textAlign: 'center' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(161, 170, 189, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(1px)' },
  overlayPanel: { padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14, fontWeight: 600, color: '#174a92ff' },
  gridTwoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' },
  gridThreeCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '12px' },
  select: { width: '100%', padding: '14px 20px', border: 'none', borderRadius: '16px', fontSize: '14px', backgroundColor: '#f0f2f5', color: '#2d3748', outline: 'none', fontFamily : "var(--app-font-family)", fontWeight: '500', cursor: 'pointer', boxShadow: `inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.8)`, transition: 'all 0.2s ease' },
  input: { width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '14px', backgroundColor: '#fff', color: '#2d3748', outline: 'none', fontFamily : "var(--app-font-family)", fontWeight: '500', boxShadow: 'inset 2px 2px 6px rgba(163,177,198,0.06)', transition: 'all 0.2s ease' },
  textarea: { width: '100%', minHeight: 140, padding: '12px', borderRadius: 10, border: 'none', background: '#fff', boxSizing: 'border-box', fontFamily : "var(--app-font-family)", fontSize: 14, boxShadow: 'inset 2px 2px 6px rgba(163,177,198,0.06)' },
  inputDisabled: { width: '100%', padding: '14px 20px', border: 'none', borderRadius: '16px', backgroundColor: '#e8ecf0', color: '#9ca3af', fontSize: '14px', fontWeight: '500', cursor: 'not-allowed' },
  inputHint: { fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontWeight: 400 },
  btnPrimary: { padding: '12px 20px', background: 'linear-gradient(145deg, #f0f2f5 0%, #e8ecf0 50%, #f0f2f5 100%)', color: '#2d3748', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', boxShadow: '6px 6px 12px rgba(163,177,198,0.12)' },
  btnSecondary: { padding: '10px 16px', background: 'linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)', color: '#4a5568', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' },
  btnSuccess: { padding: '10px 14px', background: 'linear-gradient(135deg, #f0f2f5 0%, #f0fff4 100%)', color: '#16a34a', borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'inline-flex', gap: '8px' },
  btnDanger: { padding: '10px 14px', background: 'linear-gradient(135deg,#fff5f5 0%, #fff1f2 100%)', color: '#c53030', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'inline-flex', gap: '8px' },
  btnDisabled: { opacity: '0.6', cursor: 'not-allowed', transform: 'none' },
  filterContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' },
  filterBtnActive: { background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  filterBtnInactive: { background: '#e8ecf0', color: '#718096' },
  stepCard: { borderRadius: '20px', padding: '24px' },
  stepCardComplete: { borderRadius: '20px', padding: '24px', background: 'linear-gradient(135deg, #ccfbf1 0%, #bdeeee 50%, #e6fffa 100%)', boxShadow: 'inset 4px 4px 12px rgba(13, 148, 136, 0.06), 6px 8px 20px rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.08)' },
  progressContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  progressBg: { width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '6px' },
  progressBar: { height: '100%', transition: 'width 0.3s ease', borderRadius: '6px', background: 'linear-gradient(90deg,#667eea,#764ba2)' },
  progressText: { fontSize: '13px', color: '#718096' },
  progressInline: { fontSize: '12px', color: '#64748b', fontWeight: 600 },
  textSuccess: { color: '#16a34a', fontWeight: '600' },
  textDanger: { color: '#dc2626', fontWeight: '600' },
  expandedContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  expandedSectionTitle: { fontWeight: '700', fontSize: '14px', color: '#2d3748', marginBottom: '8px' },
  expandedPre: { fontSize: '13px', color: '#4a5568', whiteSpace: 'pre-wrap', background: 'white', padding: '16px', borderRadius: '12px' },
  expandedMetric: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#718096', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  emptyState: { textAlign: 'center', padding: '64px 40px', backgroundColor: '#f0f2f5', borderRadius: '20px' },
  summaryCard: { borderRadius: '16px', marginBottom: '20px', overflow: 'hidden', boxShadow: `12px 12px 24px rgba(163, 177, 198, 0.08), -12px -12px 24px rgba(255,255,255,0.9)`, background: '#f8fafc', border: '1px solid rgba(14, 165, 233, 0.06)' },
  summaryCardHeader: { background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' },
  summaryLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  summaryPills: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  summaryPill: { padding: '6px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#f0f9ff 0%, #e6fffa 100%)', color: '#064e3b', cursor: 'pointer', userSelect: 'none' },
  summaryPillAlt: { padding: '6px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#fff7ed 0%, #fff1f2 100%)', color: '#7c2d12', cursor: 'pointer', userSelect: 'none' },
  spinIcon: { animation: 'spin 1s linear infinite', display: 'inline-block' },
  completeIcon: { color: '#16a34a', width: 18, height: 18 },
  flyMessage: { position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 12000, padding: '10px 16px', borderRadius: 10, background: '#d1fae5', color: '#065f46', boxShadow: '0 6px 20px rgba(16,24,40,0.15)', fontWeight: 700, display: 'flex', gap: 10, alignItems: 'center' }
};

/** Ensure keyframes exist for spin if code uses it */
if (typeof document !== 'undefined') {
  const styleSheet = document.getElementById('bulk-email-extra-styles');
  if (!styleSheet) {
    const ss = document.createElement('style');
    ss.id = 'bulk-email-extra-styles';
    ss.textContent = `
      @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
    `;
    document.head.appendChild(ss);
  }
}

/** Helpers */
const percent = (i, n) => (n > 0 ? Math.min(100, Math.round((i / n) * 100)) : 0);

function statusBadgeStyle(s) {
  if (s === 'sent') return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46' };
  if (s === 'failed') return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b' };
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' };
}
function statusIcon(s) {
  if (s === 'sent') return <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} />;
  if (s === 'failed') return <XCircle style={{ width: 14, height: 14, color: '#991b1b' }} />;
  return <Clock style={{ width: 14, height: 14 }} />;
}

/** Green completed icon component (reuse) */
const CompleteIcon = () => <CheckCircle style={styles.completeIcon} />;

// Helper: get current OD/TP from original row + modal edits
function getCurrentOdTp(pr, edit) {
  const od = Number(
    (edit && edit.new_od) ??
    pr.new_od ??
    pr.old_od ??
    0
  ) || 0;

  const tp = Number(
    (edit && edit.new_tp) ??
    pr.new_tp ??
    pr.old_tp ??
    0
  ) || 0;

  return { od, tp, sum: od + tp };
}

/** API wrappers */
async function apiGetSegments() {
  const r = await fetch(`${API_BASE}/segments/`, { headers: authHeaders() });
  if (!r.ok) throw new Error('Failed to load segments');
  const j = await r.json();
  return j.segments || [];
}
async function apiGetReview({ segment, status, q }) {
  const url = new URL(`${API_BASE}/review/`);
  url.searchParams.set('segment', segment);
  if (status?.length) url.searchParams.set('status', status.join(','));
  if (q) url.searchParams.set('q', q);
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error('Failed to load review');
  const j = await r.json();
  return (j.rows || []).map(mapServerRow);
}

async function apiDownloadCSV({ segment, status, q, fileName, policy_no_norms = [] }) {
  const url = new URL(`${API_BASE}/review/export/`);
  if (segment) url.searchParams.set('segment', segment);
  if (status?.length) url.searchParams.set('status', status.join(','));
  if ((!policy_no_norms || policy_no_norms.length === 0) && q) url.searchParams.set('q', q);
  if (policy_no_norms && policy_no_norms.length > 0) {
    url.searchParams.set('policy_no_norm', policy_no_norms.join(','));
    url.searchParams.set('policy_no_norms', policy_no_norms.join(','));
  }
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error('CSV export failed');
  const blob = await r.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function apiSendSelected({ segment, policy_no_norms }) {
  const r = await fetch(`${API_BASE}/send_selected/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ segment, policies: policy_no_norms })
  });
  if (!r.ok) throw new Error('Send selected failed');
  return r.json();
}

async function apiStartProcess({ segment, batch_id }) {
  const r = await fetch(`${API_BASE}/process/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ segment, batch_id })
  });
  if (!r.ok || !r.body) throw new Error('Failed to start process');
  return r.body.getReader();
}

function mapServerRow(row) {
  return {
    key: row.policy_no_norm ?? row.policy_no ?? Math.random().toString(36).slice(2),
    policy_no: row.policy_no ?? '',
    policy_no_norm: row.policy_no_norm ?? '',
    to_email: row.to_email ?? '',
    status: row.status ?? 'drafted',
    subject: row.subject ?? '',
    body_text: row.body_text ?? '',
    sent_at: row.sent_at ?? null,
    gmail_message_id: row.gmail_message_id ?? null,
    discount_delta: row['Δ Discount (pp)'] ?? row.discount_delta ?? 0,
    od_delta: row['Δ OD (₹)'] ?? row.od_delta ?? 0,
    tp_delta: row['Δ TP (₹)'] ?? row.tp_delta ?? 0,
    total_delta: row['Δ Total (₹)'] ?? row.total_delta ?? 0,
    old_total_premium: row.old_total_premium,
    new_total_premium: row.new_total_premium,
    old_od: row.old_od,
    new_od: row.new_od,
    old_tp: row.old_tp,
    new_tp: row.new_tp,
    old_discount: row.old_discount,
    new_discount: row.new_discount,
    error_text: row.error_text ?? null,
    old_ncb: row.old_ncb,
    new_ncb: row.new_ncb,
    old_idv: row.old_idv,
    new_idv: row.new_idv,
    old_add_on_premium: row.old_add_on_premium,
    new_add_on_premium: row.new_add_on_premium,
    old_gst: row.old_gst,
    new_gst: row.new_gst,
    churn_risk_pct: row.churn_risk_pct,
    top_3_reasons: row.top_3_reasons,
    created_at: row.created_at,
    customerid: row.customerid,
    segment: row.segment,
    batch_id: row.batch_id,
    vehicle: row.vehicle
  };
}

/** Component */
const BulkEmail = () => {

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

  const bodyRefs = useRef({});
  const [segments, setSegments] = useState([]);
  const [segment, setSegment] = useState('');
  const [batchId] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8);
    return `batch_${yyyy}-${mm}-${dd}_${rand}`;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resetFilterModalOpen, setResetFilterModalOpen] = useState(false);

  const [msg, contextHolder] = message.useMessage();
  const [flyMsg, setFlyMsg] = useState(null);
  const flyTimerRef = useRef(null);

  const triggerFlySuccess = (text = "Success") => {
    setFlyMsg({ text });
    if (flyTimerRef.current) {
      clearTimeout(flyTimerRef.current);
      flyTimerRef.current = null;
    }
    flyTimerRef.current = setTimeout(() => {
      setFlyMsg(null);
      flyTimerRef.current = null;
    }, 1600);
  };

  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [p1, setP1] = useState({ i: 0, n: 0 });
  const [p2, setP2] = useState({ i: 0, n: 0 });
  const [p3, setP3] = useState({ i: 0, n: 0 });

  const [statusFilter, setStatusFilter] = useState(['drafted', 'sent', 'failed']);
  const [policySearch, setPolicySearch] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');

  const [initialized, setInitialized] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [sending, setSending] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPercentKey, setModalPercentKey] = useState(null);
  const [modalRows, setModalRows] = useState([]);
  const [modalEdits, setModalEdits] = useState({});
  const [modalSaving, setModalSaving] = useState(false);
  const [savingPerPolicy, setSavingPerPolicy] = useState({});
  const [openEmail, setOpenEmail] = useState({});
  const [modalDirty, setModalDirty] = useState({});

  const phaseMeta = useMemo(() => {
    if (!processing) return null;
    if (processingStep === 1) return { name: 'Auto-Suggest', pct: percent(p1.i, p1.n) };
    if (processingStep === 2) return { name: 'Save Selected Changes', pct: percent(p2.i, p2.n) };
    if (processingStep === 3) return { name: 'Draft Emails', pct: percent(p3.i, p3.n) };
    return null;
  }, [processing, processingStep, p1, p2, p3]);

  const draftedCount = useMemo(
    () => rows.filter(r => r.status === 'drafted').length,
    [rows]
  );

  const processDisabled = useMemo(
    () => processing || !segment || draftedCount > 0 || hasProcessed,
    [processing, segment, draftedCount, hasProcessed]
  );

  const draftDiscountDistribution = useMemo(() => {
    const drafted = rows.filter(r => r.status === 'drafted');
    const counts = drafted.reduce((acc, r) => {
      const raw = typeof r.discount_delta !== 'undefined' && r.discount_delta !== null ? r.discount_delta : 0;
      const key = String(raw);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const items = Object.entries(counts).map(([k, v]) => ({ value: k, count: v }));
    items.sort((a, b) => b.count - a.count || Number(a.value) - Number(b.value));
    return { items, total: drafted.length, unique: items.length };
  }, [rows]);

  const CMP_EPS = 1e-6;

  function labelForKey(k) {
    if (!k) return k;
    const map = {
      discount: 'Discount',
      ncb: 'NCB',
      idv: 'IDV',
      add_on_premium: 'Add-on',
      od: 'OD',
      tp: 'TP',
      gst: 'GST',
      total_premium: 'Total',
      churn_risk_pct: 'Churn Risk'
    };
    return map[k] || k.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }

  const expectedFieldKeys = useMemo(() => {
    return [
      'discount',
      'ncb',
      'idv',
      'add_on_premium',
      'od',
      'tp',
      'gst',
    ];
  }, []);

  function buildFieldPairs() {
    const percentKeys = new Set(['discount', 'ncb', 'churn_risk_pct']);
    const pairs = [];
    for (const k of expectedFieldKeys) {
      pairs.push({
        key: k,
        label: labelForKey(k),
        oldCol: `old_${k}`,
        newCol: `new_${k}`,
        mode: percentKeys.has(k) ? 'avg' : 'sum',
        fmt: percentKeys.has(k) ? 'percent' : 'currency'
      });
    }
    return pairs;
  }

  const adjustedMetrics = useMemo(() => {
    const drafted = rows.filter(r => r.status === 'drafted');
    const pairs = buildFieldPairs();

    const items = pairs.map(p => {
      let count = 0;
      for (const r of drafted) {
        const a = Number(r[p.oldCol] ?? 0);
        const b = Number(r[p.newCol] ?? 0);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          if ((r[p.oldCol] ?? null) !== (r[p.newCol] ?? null)) count++;
        } else {
          if (Math.abs(a - b) > CMP_EPS) count++;
        }
      }
      return { ...p, count };
    });

    const totalAdjusted = items.reduce((s, it) => s + it.count, 0);
    return { total: drafted.length || 0, totalAdjusted, items };
  }, [rows]);

  const adjustedSummary = useMemo(() => {
    const drafted = rows.filter(r => r.status === 'drafted');
    const countTotal = drafted.length || 0;
    const pairs = buildFieldPairs();

    const items = pairs.map(p => {
      let origAgg = 0;
      let newAgg = 0;
      let adjustedCount = 0;

      for (const r of drafted) {
        const aRaw = r[p.oldCol];
        const bRaw = newColFromRow(r, p);

        const a = Number(aRaw ?? 0);
        const b = Number(bRaw ?? 0);

        if (Number.isFinite(a)) origAgg += a;
        if (Number.isFinite(b)) newAgg += b;

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          if ((aRaw ?? null) !== (bRaw ?? null)) adjustedCount++;
        } else {
          if (Math.abs(a - b) > CMP_EPS) adjustedCount++;
        }
      }

      const origDisplay = (p.mode === 'avg' && countTotal > 0) ? (origAgg / countTotal) : origAgg;
      const newDisplay = (p.mode === 'avg' && countTotal > 0) ? (newAgg / countTotal) : newAgg;
      const delta = newDisplay - origDisplay;

      return {
        key: p.key,
        label: p.label,
        orig: origDisplay,
        adj: newDisplay,
        delta,
        count: adjustedCount,
        fmt: p.fmt
      };
    });

    return { total: countTotal, items };
  }, [rows]);

  function newColFromRow(row, p) {
    if (p.key === 'churn_risk_pct') return row[p.oldCol] ?? row[p.newCol];
    return row[p.newCol];
  }

  function formatCurrency(v) {
  return formatMoney(v, currencyCode, inrPer1);
}
  function formatPercent(v) {
    const num = Number(v) || 0;
    return `${num.toFixed(2)}%`;
  }

  useEffect(() => {
    message.config({ top: 70, duration: 4 });
  }, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      if (flyTimerRef.current) {
        clearTimeout(flyTimerRef.current);
        flyTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const segs = await apiGetSegments();
        setSegments(segs);
        if (segs.length) setSegment(segs[0]);
        setInitialized(true);
      } catch (e) {
        console.error(e);
        setError('Failed to load segments');
      }
    })();
  }, []);

  useEffect(() => {
    if (!segment || !initialized) return;
    if (!hasProcessed) {
      setRows([]);
      return;
    }
    fetchReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, statusFilter.join('|'), initialized, hasProcessed]);

  function openPercentModal(percentKey) {
    const groupRows = rows.filter(r => r.status === 'drafted' && String(r.discount_delta) === String(percentKey));

    const edits = {};
    for (const rr of groupRows) {
      const key = rr.policy_no_norm || rr.key;

      const hasNewOd = rr.new_od !== undefined && rr.new_od !== null && !Number.isNaN(Number(rr.new_od));
      const hasNewTp = rr.new_tp !== undefined && rr.new_tp !== null && !Number.isNaN(Number(rr.new_tp));
      const hasOldOd = rr.old_od !== undefined && rr.old_od !== null && !Number.isNaN(Number(rr.old_od));
      const hasOldTp = rr.old_tp !== undefined && rr.old_tp !== null && !Number.isNaN(Number(rr.old_tp));
      const hasNewTotal = rr.new_total_premium !== undefined && rr.new_total_premium !== null && !Number.isNaN(Number(rr.new_total_premium));
      const gstFactor = 1.18;

      let new_od = hasNewOd ? Number(rr.new_od) : (hasOldOd ? Number(rr.old_od) : 0);
      let new_tp = hasNewTp ? Number(rr.new_tp) : (hasOldTp ? Number(rr.old_tp) : 0);
      let new_total = hasNewTotal ? Number(rr.new_total_premium) : (rr.new_total_premium ?? null);

      if ((!hasNewOd || !hasNewTp) && new_total !== null && (hasOldOd || hasOldTp)) {
        const oldOd = Number(rr.old_od || 0);
        const oldTp = Number(rr.old_tp || 0);
        const oldSum = oldOd + oldTp;
        if (oldSum > 0) {
          const targetNet = Number(new_total) / gstFactor;
          const factor = targetNet / oldSum;
          new_od = Math.round((oldOd * factor) * 100) / 100;
          new_tp = Math.round((oldTp * factor) * 100) / 100;
        } else {
          new_od = Number(rr.new_od ?? rr.old_od ?? 0);
          new_tp = Number(rr.new_tp ?? rr.old_tp ?? 0);
        }
      }

      if (new_total === null) {
        new_total = Math.round((Number(new_od || 0) + Number(new_tp || 0)) * gstFactor * 1000) / 1000;
      }

      const new_discount = (typeof rr.new_discount !== 'undefined' && rr.new_discount !== null)
        ? Number(rr.new_discount)
        : Number(rr.old_discount || 0);

      edits[key] = {
        new_discount,
        new_od,
        new_tp,
        new_total_premium: new_total,
        subject: rr.subject ?? '',
        body_text: rr.body_text ?? ''
      };
    }

    setModalRows(groupRows);
    setModalEdits(edits);
    setModalDirty({});
    setModalPercentKey(percentKey);
    setModalOpen(true);
    setOpenEmail({});
    setModalDirty({});
  }

  function closeModal() {
    setModalOpen(false);
    setModalPercentKey(null);
    setModalRows([]);
    setModalEdits({});
    setOpenEmail({});
  }

  function onModalFieldChange(policyNorm, field, value) {
    const key = policyNorm;

    if (field === 'new_discount') {
      const pr = modalRows.find(r => (r.policy_no_norm || r.key) === key);
      const oldMin = pr ? Number(pr.old_discount || 0) : 0;
      const clamped = clampDiscountForPolicy(value, oldMin);
      applyDiscountCoupling(key, clamped);
      setModalDirty(prev => ({ ...prev, [key]: true }));
      return;
    }

    if (field === 'new_od' || field === 'new_tp') {
      const rawVal = Number(value) || 0;
      const pr = modalRows.find(r => (r.policy_no_norm || r.key) === key) || {};
      const currentEdit = modalEdits[key] || {};

      const oldDisc = Number(pr.old_discount || 0);
      const maxDisc = 100;

      const currentDiscount = Number(
        currentEdit.new_discount ??
        pr.new_discount ??
        oldDisc
      ) || oldDisc;

      const { od: curOd, tp: curTp, sum: curSum } = getCurrentOdTp(pr, currentEdit);

      const nextOd = field === 'new_od' ? rawVal : curOd;
      const nextTp = field === 'new_tp' ? rawVal : curTp;
      const nextSum = nextOd + nextTp;

      if (currentDiscount >= maxDisc - 1e-9 && nextSum < curSum - 1e-9) return;
      if (currentDiscount <= oldDisc + 1e-9 && nextSum > curSum + 1e-9) return;

      setModalEdits(prev => {
        const prevEntry = (prev && prev[key]) ? { ...prev[key] } : {};
        const otherField = field === 'new_od' ? 'new_tp' : 'new_od';
        const otherVal = typeof prevEntry[otherField] !== 'undefined'
          ? Number(prevEntry[otherField])
          : Number(pr[otherField] ?? pr[`old_${otherField.replace('new_', '')}`] ?? 0);

        const od = field === 'new_od'
          ? Math.round(rawVal * 100) / 100
          : Math.round(Number(otherVal) * 100) / 100;
        const tp = field === 'new_tp'
          ? Math.round(rawVal * 100) / 100
          : Math.round(Number(otherVal) * 100) / 100;

        const nextEntry = {
          ...prevEntry,
          [field]: Math.round(rawVal * 100) / 100,
          manual: true,
          manualField: field,
          base_od: prevEntry.base_od ?? (pr.old_od ?? pr.new_od ?? prevEntry.base_od),
          base_tp: prevEntry.base_tp ?? (pr.old_tp ?? pr.new_tp ?? prevEntry.base_tp),
          new_total_premium: computeTotalFromOdTp(od, tp),
        };

        return { ...(prev || {}), [key]: nextEntry };
      });

      inferDiscountFromOdTpAndSet(key, nextOd, nextTp);
      setModalDirty(prev => ({ ...prev, [key]: true }));
      return;
    }

    setModalEdits(prev => ({
      ...(prev || {}),
      [key]: { ...(prev?.[key] || {}), [field]: value }
    }));
    setModalDirty(prev => ({ ...prev, [key]: true }));
  }

  function computeTotalFromOdTp(od, tp) {
    const o = Number(od) || 0;
    const t = Number(tp) || 0;
    return Math.round((o + t) * 1.18 * 1000) / 1000;
  }

  const EPS = 1e-9;

  function clampDiscountForPolicy(raw, oldMin) {
    let v = Number(raw);
    if (!Number.isFinite(v)) v = Number(oldMin || 0);
    v = Math.min(100, v);
    v = Math.max(Number(oldMin || 0), v);
    return Math.round(v * 100) / 100;
  }

  function clearManualFlag(key) {
    setModalEdits(prev => {
      if (!prev || !prev[key]) return prev;
      const next = { ...(prev || {}) };
      const entry = { ...(next[key] || {}) };
      delete entry.manual;
      delete entry.manualField;
      next[key] = entry;
      return next;
    });
  }

  function applyDiscountCoupling(key, newDiscount) {
    const pr = modalRows.find(r => (r.policy_no_norm || r.key) === key);
    const currentEdit = modalEdits[key] || {};

    if (!pr && !currentEdit) {
      setModalEdits(prev => ({
        ...(prev || {}),
        [key]: {
          ...(prev?.[key] || {}),
          new_discount: clampDiscountForPolicy(newDiscount, 0)
        }
      }));
      return;
    }

    const oldMin = Number(pr?.old_discount ?? 0);
    const clamped = clampDiscountForPolicy(newDiscount, oldMin);

    const baseOdPref = Number(currentEdit.base_od ?? pr.old_od ?? pr.new_od ?? 0);
    const baseTpPref = Number(currentEdit.base_tp ?? pr.old_tp ?? pr.new_tp ?? 0);

    const extra = Math.max(0, (clamped - oldMin) / 100.0);

    const finalNewOd = Math.round(baseOdPref * (1.0 - extra) * 100) / 100;
    const finalNewTp = Math.round(baseTpPref * (1.0 - extra) * 100) / 100;

    const new_total_premium = computeTotalFromOdTp(finalNewOd, finalNewTp);

    setModalEdits(prev => ({
      ...(prev || {}),
      [key]: {
        ...(prev?.[key] || {}),
        manual: prev?.[key]?.manual,
        manualField: prev?.[key]?.manualField,
        new_discount: clamped,
        new_od: finalNewOd,
        new_tp: finalNewTp,
        new_total_premium
      }
    }));
  }

  function inferDiscountFromOdTpAndSet(key, newOdRaw, newTpRaw) {
    const pr = modalRows.find(r => (r.policy_no_norm || r.key) === key);
    const ods = Number(newOdRaw) || 0;
    const tps = Number(newTpRaw) || 0;

    if (!pr) {
      const new_total = computeTotalFromOdTp(ods, tps);
      setModalEdits(prev => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), new_od: Math.round(ods * 100) / 100, new_tp: Math.round(tps * 100) / 100, new_total_premium: new_total } }));
      return;
    }

    const oldOd = Number(pr.old_od || 0);
    const oldTp = Number(pr.old_tp || 0);
    const base = oldOd + oldTp;

    let new_discount = Number(pr.new_discount ?? pr.old_discount ?? 0);

    if (base <= EPS) {
      new_discount = clampDiscountForPolicy(new_discount, pr.old_discount || 0);
    } else {
      const extra = Math.max(0, 1.0 - (ods + tps) / base);
      new_discount = Number(pr.old_discount || 0) + 100.0 * extra;
      new_discount = Math.min(100, new_discount);
      new_discount = Math.round(new_discount * 100) / 100;
      new_discount = Math.max(Number(pr.old_discount || 0), new_discount);
    }

    const new_total_premium = computeTotalFromOdTp(ods, tps);

    setModalEdits(prev => ({
      ...(prev || {}),
      [key]: {
        ...(prev?.[key] || {}),
        new_od: Math.round(ods * 100) / 100,
        new_tp: Math.round(tps * 100) / 100,
        new_discount,
        new_total_premium
      }
    }));
  }

  function resetSinglePolicy(policyNorm) {
    const original = modalRows.find(r => (r.policy_no_norm || r.key) === policyNorm);
    if (!original) return;
    const new_od = (typeof original.new_od !== 'undefined' && original.new_od !== null) ? Number(original.new_od) : Number(original.old_od || 0);
    const new_tp = (typeof original.new_tp !== 'undefined' && original.new_tp !== null) ? Number(original.new_tp) : Number(original.old_tp || 0);
    const new_discount = (typeof original.new_discount !== 'undefined' && original.new_discount !== null) ? Number(original.new_discount) : Number(original.old_discount || 0);
    const computed_total = computeTotalFromOdTp(new_od, new_tp);
    setModalEdits(prev => ({
      ...prev,
      [policyNorm]: {
        ...(prev?.[policyNorm] || {}),
        new_discount,
        new_od,
        new_tp,
        new_total_premium: computed_total,
        subject: original.subject ?? '',
        body_text: original.body_text ?? ''
      }
    }));
    setTimeout(() => clearManualFlag(policyNorm), 0);
    setModalDirty(prev => {
      const next = { ...prev };
      delete next[policyNorm];
      return next;
    });
  }

  function isModalEmailDirty(policyNorm) {
    const orig = modalRows.find(r => (r.policy_no_norm || r.key) === policyNorm) || {};
    const edited = modalEdits[policyNorm] || {};
    const origSubj = (orig.subject || '').toString();
    const origBody = (orig.body_text || '').toString();
    const newSubj = (edited.subject ?? '').toString();
    const newBody = (edited.body_text ?? '').toString();
    return (newSubj !== origSubj) || (newBody !== origBody);
  }

  function revertModalEmail(policyNorm) {
    const orig = modalRows.find(r => (r.policy_no_norm || r.key) === policyNorm) || {};
    setModalEdits(prev => ({ ...prev, [policyNorm]: { ...(prev[policyNorm] || {}), subject: orig.subject ?? '', body_text: orig.body_text ?? '' } }));
  }

  async function saveModalEmail(policyNorm) {
    const ok = window.confirm(
      "Once saved, this email draft cannot be reverted using Reset.\n" +
      "You can manually edit the email content again if needed.\n\n" +
      "Do you want to continue?"
    );
    if (!ok) return;
    const ed = modalEdits[policyNorm];
    if (!ed) return;
    setSavingPerPolicy(prev => ({ ...prev, [policyNorm]: true }));
    try {
      const payload = {
        policy_no_norm: policyNorm,
        subject: ed.subject ?? '',
        body_text: ed.body_text ?? ''
      };
      const resp = await apiUpdateDraft(payload);
      const finalSubject = (resp && resp.subject) ? resp.subject : payload.subject;
      const finalBody = (resp && resp.body_text) ? resp.body_text : payload.body_text;

      setModalRows(prev => prev.map(r => {
        const k = r.policy_no_norm || r.key;
        if (k !== policyNorm) return r;
        return { ...r, subject: finalSubject, body_text: finalBody };
      }));

      setModalEdits(prev => ({ ...prev, [policyNorm]: { ...(prev[policyNorm] || {}), subject: finalSubject, body_text: finalBody } }));

      setRows(prev => prev.map(r => {
        const k = r.policy_no_norm || r.key;
        if (k !== policyNorm) return r;
        return { ...r, subject: finalSubject, body_text: finalBody };
      }));

      Modal.success({ title: 'Saved', content: `Draft for ${policyNorm} updated` });
      try { await fetchReview(); } catch (e) { /* non-blocking */ }
    } catch (e) {
      console.error('saveModalEmail failed', e);
      Modal.error({ title: 'Save failed', content: e?.message || 'Failed to save draft' });
    } finally {
      setSavingPerPolicy(prev => ({ ...prev, [policyNorm]: false }));
    }
  }

  async function saveSinglePolicy(policyNorm) {
    const ok = window.confirm(
      "Once saved, these metric changes cannot be reverted using Reset.\n" +
      "You can manually edit the metrics again if needed.\n\n" +
      "Do you want to continue?"
    );
    if (!ok) return;
    const edit = modalEdits[policyNorm];
    if (!edit) return;
    setSavingPerPolicy(prev => ({ ...prev, [policyNorm]: true }));
    setError('');
    try {
      const origRow = modalRows.find(r => (r.policy_no_norm || r.key) === policyNorm) || {};
      const oldMin = Number(origRow.old_discount || 0);
      const computed_od = Number(edit.new_od || 0);
      const computed_tp = Number(edit.new_tp || 0);
      const payloadDiscount = Math.max(Number(edit.new_discount || 0), oldMin);

      const changePayload = [{
        policy_no_norm: policyNorm,
        new_discount: payloadDiscount,
        new_od: computed_od,
        new_tp: computed_tp,
        new_total_premium: Number(edit.new_total_premium || computeTotalFromOdTp(computed_od, computed_tp) || 0)
      }];

      let res = null;
      try {
        res = await apiUpdateChangeBatch(changePayload);
      } catch (err) {
        throw err;
      }

      const updatedArr = (res && Array.isArray(res.updated)) ? res.updated : [];
      const serverObj = updatedArr.length ? updatedArr[0] : null;

      let draftRes = null;
      if (!serverObj || (typeof serverObj.subject === 'undefined' && typeof serverObj.body_text === 'undefined')) {
        if ((edit.subject ?? '') !== (origRow.subject ?? '') || (edit.body_text ?? '') !== (origRow.body_text ?? '')) {
          try {
            draftRes = await apiUpdateDraft({
              policy_no_norm: policyNorm,
              subject: edit.subject ?? '',
              body_text: edit.body_text ?? ''
            });
          } catch (err) {
            console.warn('Draft update fallback failed:', err);
            draftRes = null;
          }
        }
      }

      const finalSubject = (serverObj && (serverObj.subject ?? null) !== null)
        ? serverObj.subject
        : (draftRes && (draftRes.subject ?? null) !== null)
          ? draftRes.subject
          : (edit.subject ?? origRow.subject ?? '');

      const finalBody = (serverObj && (serverObj.body_text ?? null) !== null)
        ? serverObj.body_text
        : (draftRes && (draftRes.body_text ?? null) !== null)
          ? draftRes.body_text
          : (edit.body_text ?? origRow.body_text ?? '');

      const finalNumeric = serverObj ? {
        new_discount: serverObj.new_discount,
        new_od: serverObj.new_od,
        new_tp: serverObj.new_tp,
        new_total_premium: serverObj.new_total_premium
      } : {
        new_discount: Math.max(Number(edit.new_discount || 0), Number(origRow.old_discount || 0)),
        new_od: Number(edit.new_od || 0),
        new_tp: Number(edit.new_tp || 0),
        new_total_premium: Number(edit.new_total_premium || computeTotalFromOdTp(edit.new_od, edit.new_tp) || 0)
      };

      setModalRows(prevModalRows => prevModalRows.map(r => {
        const k = r.policy_no_norm || r.key;
        if (k !== policyNorm) return r;
        return {
          ...r,
          new_discount: finalNumeric.new_discount,
          new_od: finalNumeric.new_od,
          new_tp: finalNumeric.new_tp,
          new_total_premium: finalNumeric.new_total_premium,
          subject: finalSubject,
          body_text: finalBody
        };
      }));

      setModalEdits(prev => ({
        ...prev,
        [policyNorm]: {
          ...(prev[policyNorm] || {}),
          subject: finalSubject,
          body_text: finalBody,
          new_discount: finalNumeric.new_discount,
          new_od: finalNumeric.new_od,
          new_tp: finalNumeric.new_tp,
          new_total_premium: finalNumeric.new_total_premium
        }
      }));

      setRows(prevRows => prevRows.map(r => {
        const k = r.policy_no_norm || r.key;
        if (k !== policyNorm) return r;
        return {
          ...r,
          new_discount: finalNumeric.new_discount,
          new_od: finalNumeric.new_od,
          new_tp: finalNumeric.new_tp,
          new_total_premium: finalNumeric.new_total_premium,
          subject: finalSubject,
          body_text: finalBody
        };
      }));

      Modal.success({ title: 'Saved', content: `Policy ${policyNorm} updated` });

      try {
        await fetchReview();
      } catch (err) {
        console.warn('Refresh after single save failed:', err);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Save single policy failed');
      Modal.error({ title: 'Save error', content: e.message || 'Save failed' });
    } finally {
      setSavingPerPolicy(prev => ({ ...prev, [policyNorm]: false }));
    }
  }

  async function saveModalChanges() {
    const changed = [];
    const draftsToUpdate = [];
    for (const pr of modalRows) {
      const key = pr.policy_no_norm || pr.key;
      const e = modalEdits[key];
      if (!e) continue;
      const oldMin = Number(pr.old_discount || 0);
      changed.push({
        policy_no_norm: key,
        new_discount: Math.max(Number(e.new_discount || pr.new_discount || pr.old_discount || 0), oldMin),
        new_od: Number(e.new_od || pr.new_od || pr.old_od || 0),
        new_tp: Number(e.new_tp || pr.new_tp || pr.old_tp || 0),
        new_total_premium: Number(e.new_total_premium || pr.new_total_premium || pr.old_total_premium || computeTotalFromOdTp(e.new_od, e.new_tp))
      });
      if ((e.subject ?? '') !== (pr.subject ?? '') || (e.body_text ?? '') !== (pr.body_text ?? '')) {
        draftsToUpdate.push({ policy_no_norm: key, subject: e.subject ?? '', body_text: e.body_text ?? '' });
      }
    }
    if (changed.length === 0 && draftsToUpdate.length === 0) {
      closeModal();
      return;
    }
    setModalSaving(true);
    setError('');
    try {
      let updatedMap = {};

      if (changed.length > 0) {
        const res = await apiUpdateChangeBatch(changed);
        const updated = (res && Array.isArray(res.updated)) ? res.updated : [];
        updated.forEach(u => { updatedMap[(u.policy_no_norm || '').toString()] = u; });
      }

      const draftRespMap = {};
      for (const d of draftsToUpdate) {
        try {
          const dr = await apiUpdateDraft(d);
          if (dr && (d.policy_no_norm || d.policy_no_norm === 0)) {
            draftRespMap[d.policy_no_norm.toString()] = dr;
          }
        } catch (err) {
          console.warn('Draft update failed for', d.policy_no_norm, err);
        }
      }

      setModalRows(prevModalRows => prevModalRows.map(r => {
        const k = r.policy_no_norm || r.key;
        const u = updatedMap[k];
        const dr = draftRespMap[k];
        const localEdit = modalEdits[k] || {};

        const finalSubject = (u && (u.subject ?? null) !== null)
          ? u.subject
          : (dr && (dr.subject ?? null) !== null)
            ? dr.subject
            : (localEdit.subject ?? r.subject ?? '');
        const finalBody = (u && (u.body_text ?? null) !== null)
          ? u.body_text
          : (dr && (dr.body_text ?? null) !== null)
            ? dr.body_text
            : (localEdit.body_text ?? r.body_text ?? '');

        if (u) {
          return {
            ...r,
            new_discount: u.new_discount,
            new_od: u.new_od,
            new_tp: u.new_tp,
            new_total_premium: u.new_total_premium,
            subject: finalSubject,
            body_text: finalBody
          };
        }

        const new_discount = Number(localEdit.new_discount ?? r.new_discount ?? r.old_discount ?? 0);
        const new_od = Number(localEdit.new_od ?? r.new_od ?? r.old_od ?? 0);
        const new_tp = Number(localEdit.new_tp ?? r.new_tp ?? r.old_tp ?? 0);
        const new_total_premium = Number(localEdit.new_total_premium ?? r.new_total_premium ?? r.old_total_premium ?? computeTotalFromOdTp(new_od, new_tp));
        return {
          ...r,
          new_discount,
          new_od,
          new_tp,
          new_total_premium,
          subject: finalSubject,
          body_text: finalBody
        };
      }));

      setRows(prevRows => prevRows.map(r => {
        const k = r.policy_no_norm || r.key;
        const u = updatedMap[k];
        const dr = draftRespMap[k];
        const localEdit = modalEdits[k] || {};
        const finalSubject = (u && (u.subject ?? null) !== null)
          ? u.subject
          : (dr && (dr.subject ?? null) !== null)
            ? dr.subject
            : (localEdit.subject ?? r.subject ?? '');
        const finalBody = (u && (u.body_text ?? null) !== null)
          ? u.body_text
          : (dr && (dr.body_text ?? null) !== null)
            ? dr.body_text
            : (localEdit.body_text ?? r.body_text ?? '');

        if (u) {
          return {
            ...r,
            new_discount: u.new_discount,
            new_od: u.new_od,
            new_tp: u.new_tp,
            new_total_premium: u.new_total_premium,
            subject: finalSubject,
            body_text: finalBody
          };
        }

        const new_discount = Number(localEdit.new_discount ?? r.new_discount ?? r.old_discount ?? 0);
        const new_od = Number(localEdit.new_od ?? r.new_od ?? r.old_od ?? 0);
        const new_tp = Number(localEdit.new_tp ?? r.new_tp ?? r.old_tp ?? 0);
        const new_total_premium = Number(localEdit.new_total_premium ?? r.new_total_premium ?? r.old_total_premium ?? computeTotalFromOdTp(new_od, new_tp));
        return {
          ...r,
          new_discount,
          new_od,
          new_tp,
          new_total_premium,
          subject: finalSubject,
          body_text: finalBody
        };
      }));

      setModalEdits(prev => {
        const next = { ...prev };
        for (const k of Object.keys(prev || {})) {
          const sv = updatedMap[k] || draftRespMap[k] || {};
          next[k] = {
            ...(prev[k] || {}),
            subject: (sv && sv.subject) ? sv.subject : (prev[k] && prev[k].subject) || '',
            body_text: (sv && (sv.body_text)) ? sv.body_text : (prev[k] && prev[k].body_text) || ''
          };
        }
        return next;
      });

      closeModal();
      Modal.success({ title: 'Saved', content: 'All changes saved and drafts updated' });

      try {
        await fetchReview();
      } catch (err) {
        console.warn('Refresh after saveModalChanges failed:', err);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Save failed');
      Modal.error({ title: 'Save error', content: e.message || 'Save failed' });
    } finally {
      setModalSaving(false);
    }
  }

  function startEdit(draft) {
    const id = draft.policy_no_norm || draft.key;
    setEditingKey(id);
    setEditSubject(draft.subject || '');
    setEditBody(draft.body_text || '');
    setTimeout(() => {
      const el = bodyRefs.current[id];
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }
  function cancelEdit() {
    setEditingKey(null);
    setEditSubject('');
    setEditBody('');
  }
  async function saveEdit(draft) {
    const id = draft.policy_no_norm || draft.key;
    setRows(prev => prev.map(r => {
      const k = r.policy_no_norm || r.key;
      if (k !== id) return r;
      return { ...r, subject: editSubject, body_text: editBody };
    }));

    setModalRows(prev => prev.map(r => {
      const k = r.policy_no_norm || r.key;
      if (k !== id) return r;
      return { ...r, subject: editSubject, body_text: editBody };
    }));
    setModalEdits(prev => ({ ...(prev || {}), [id]: { ...(prev[id] || {}), subject: editSubject, body_text: editBody } }));

    try {
      const resp = await apiUpdateDraft({
        policy_no_norm: id,
        subject: editSubject,
        body_text: editBody
      });

      if (resp && (resp.subject || resp.body_text)) {
        const finalSubject = (resp.subject ?? editSubject);
        const finalBody = (resp.body_text ?? editBody);
        setRows(prev => prev.map(r => {
          const k = r.policy_no_norm || r.key;
          if (k !== id) return r;
          return { ...r, subject: finalSubject, body_text: finalBody };
        }));
        setModalRows(prev => prev.map(r => {
          const k = r.policy_no_norm || r.key;
          if (k !== id) return r;
          return { ...r, subject: finalSubject, body_text: finalBody };
        }));
        setModalEdits(prev => ({ ...(prev || {}), [id]: { ...(prev[id] || {}), subject: finalSubject, body_text: finalBody } }));
      }

      cancelEdit();
      await fetchReview();
    } catch (e) {
      console.error('saveEdit failed', e);
      setError(e?.message || 'Failed to save draft');
      await fetchReview().catch(() => { });
    }
  }

  async function fetchReview(qOverride) {
    try {
      setLoadingRows(true);
      setError('');
      const q = (typeof qOverride !== 'undefined') ? (qOverride && qOverride.trim() ? qOverride.trim() : undefined)
        : (policySearch.trim() || undefined);

      const data = await apiGetReview({
        segment,
        status: statusFilter,
        q
      });
      setRows(data);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setError('Failed to load review');
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }

  async function fetchReviewFor(seg, qOverride) {
    try {
      setLoadingRows(true);
      setError('');
      const q = (typeof qOverride !== 'undefined') ? (qOverride && qOverride.trim() ? qOverride.trim() : undefined)
        : (policySearch.trim() || undefined);

      const data = await apiGetReview({
        segment: seg,
        status: statusFilter,
        q
      });
      setRows(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load review');
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }

  async function handleSendSelected() {
    const selectedDraftedCount = Array.from(selected).filter(k => {
      const r = rows.find(x => (x.policy_no_norm || x.key) === k);
      return r && r.status === 'drafted';
    }).length;
    if (!selectedDraftedCount) return;

    setError('');
    setSending(true);

    try {
      const res = await apiSendSelected({ segment, policy_no_norms: Array.from(selected) });

      console.log('apiSendSelected response:', res);

      const sent = Number(res && (res.sent ?? res.sent_count ?? res.success_count ?? 0)) || 0;
      const failed = Number(res && (res.failed ?? res.error_count ?? 0)) || 0;

      if (failed > 0 && sent > 0) {
        msg.info(`Partial success — Sent: ${sent}, Failed: ${failed}`);
      } else if (failed > 0 && sent === 0) {
        msg.error(`Send Failed — Sent: ${sent}, Failed: ${failed}`);
      } else if (sent > 0) {
        msg.success(`All emails sent (${sent})`);
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
          successTimerRef.current = null;
        }
        successTimerRef.current = setTimeout(() => setSuccessMessage(''), 4000);
      } else if (typeof res === 'object' && Object.keys(res).length === 0) {
        msg.success('Send request completed (no details).');
        triggerFlySuccess('Send request completed');
      } else {
        msg.info(`Result: ${JSON.stringify(res)}`);
      }

      setSelected(new Set());
      await fetchReview();
    } catch (err) {
      console.error('handleSendSelected error', err);
      const msgText = err?.message || 'Send selected failed';
      Modal.error({
        title: 'Send Error',
        content: msgText,
        centered: false,
        style: { top: 20 },
        maskClosable: true
      });
      setError(msgText);
    } finally {
      setSending(false);
    }
  }

  async function handleProcessSegment() {
    if (processDisabled) return;
    if (draftedCount > 0) {
      setError('Drafts already exist. Click “Cancel All” to reset, then run Process Segment again.');
      return;
    }
    if (!segment || processing) return;

    setProcessing(true);
    setError('');
    setProcessingStep(1);
    setP1({ i: 0, n: 0 });
    setP2({ i: 0, n: 0 });
    setP3({ i: 0, n: 0 });
    setHasProcessed(false);

    try {
      const reader = await apiStartProcess({ segment, batch_id: batchId });
      const decoder = new TextDecoder();
      let buffer = '';

      const pump = async () => {
        const { value, done } = await reader.read();

        if (done) {
          setProcessing(false);
          setProcessingStep(0);
          setHasProcessed(true);
          await fetchReview();
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        for (; ;) {
          const sep = buffer.indexOf('\n\n');
          if (sep < 0) break;

          const chunk = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);

          const lines = chunk.split('\n');
          const ev = (lines.find(l => l.startsWith('event:')) || '').replace('event:', '').trim();
          const dataLine = (lines.find(l => l.startsWith('data:')) || '').replace('data:', '').trim();

          const evt = ev || 'data';
          try {
            const data = dataLine ? JSON.parse(dataLine) : {};
            if (evt === 'phase') {
              setProcessingStep(data.phase || 0);
            } else if (evt === 'progress') {
              const { phase, i = 0, n = 0 } = data;
              if (phase === 1) setP1({ i, n });
              if (phase === 2) setP2({ i, n });
              if (phase === 3) setP3({ i, n });
            } else if (evt === 'done') {
              setProcessing(false);
              setProcessingStep(0);
              setHasProcessed(true);
              await fetchReview();
            } else if (evt === 'error') {
              setError(data.message || 'Pipeline error');
            }
          } catch (err) {
            console.warn('Stream parse error:', err);
          }
        }

        pump();
      };

      pump();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to start process');
      setProcessing(false);
      setProcessingStep(0);
    }
  }

  async function handleRefresh(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    setSelected(new Set());
    setCurrentPage(1);
    setPolicySearch('');
    setHasProcessed(true);

    try {
      await fetchReview('');
    } catch (err) {
      console.error(err);
      setError('Failed to refresh');
    }
  }

  async function handleDownloadCSV() {
    try {
      const selectedKeys = Array.from(selected);
      const validSelected = selectedKeys.filter(k => rows.find(r => (r.policy_no_norm || r.key) === k));

      if (validSelected.length === 0) {
        Modal.info({
          title: 'No policies selected',
          content: 'Please select one or more drafted policies using the checkboxes, then click CSV to download them.',
          centered: true
        });
        return;
      }

      const fileName = `bulk_selected_${segment || 'all'}_${batchId}_${validSelected.length}.csv`;

      await apiDownloadCSV({
        segment,
        status: statusFilter,
        fileName,
        policy_no_norms: validSelected
      });
    } catch (e) {
      console.error(e);
      setError('CSV download failed');
      Modal.error({ title: 'Download failed', content: e?.message || 'CSV download failed' });
    }
  }

  async function resetSegmentFilter() {
    try {
      setSelected(new Set());
      setCurrentPage(1);
      setPolicySearch('');
      setHasProcessed(false);
      setRows([]);
      setProcessing(false);
      setProcessingStep(0);
      setP1({ i: 0, n: 0 });
      setP2({ i: 0, n: 0 });
      setP3({ i: 0, n: 0 });
      setError('');
      cancelEdit();

      if (segments && segments.length > 0) {
        setSegment(segments[0]);
      } else {
        setSegment('');
      }
    } catch (err) {
      console.warn('Reset segment filter failed', err);
      setError('Failed to reset segment filter');
    } finally {
      setResetFilterModalOpen(false);
    }
  }

  async function showCancelConfirm() {
    try {
      setSelected(new Set());
      setCurrentPage(1);
      setHasProcessed(true);
      setProcessing(false);
      setProcessingStep(0);
      setP1({ i: 0, n: 0 });
      setP2({ i: 0, n: 0 });
      setP3({ i: 0, n: 0 });
      setError('');
      cancelEdit();

      const qOverride = (policySearch && policySearch.trim()) ? policySearch.trim() : '';
      await fetchReview(qOverride);
    } catch (err) {
      console.warn('Refresh after Cancel All failed', err);
      setError('Failed to refresh after cancel');
    }
  }

  function onChangeSegment(e) {
    const next = e.target.value;
    if (processing) return;

    if (hasProcessed && rows.length > 0) {
      Modal.confirm({
        title: 'Switch segment?',
        content:
          'Processed mail drafts for the current segment will be removed from view. Load the actual state for the new segment?',
        okText: 'Yes, Switch',
        cancelText: 'Stay',
        centered: true,
        onOk: async () => {
          setSelected(new Set());
          setSegment(next);
          setHasProcessed(true);
          await fetchReviewFor(next);
        }
      });
    } else {
      setSelected(new Set());
      setSegment(next);
      setHasProcessed(false);
      setRows([]);
    }
  }

  const filteredDrafts = useMemo(() => {
    const q = policySearch.trim().toLowerCase();
    return rows.filter(r => {
      const st = statusFilter.includes(r.status);
      const pol = !q || (r.policy_no || '').toLowerCase().includes(q);
      return st && pol;
    });
  }, [rows, statusFilter, policySearch]);

  const selectedRowKeys = useMemo(() => Array.from(selected), [selected]);

  const selectedDraftedCount = useMemo(() => {
    let c = 0;
    for (const r of rows) if (r.status === 'drafted' && selected.has(r.policy_no_norm || r.key)) c++;
    return c;
  }, [rows, selected]);

  function isStatusSelectable(recordStatus, statusFilter) {
    if (!statusFilter || statusFilter.length === 0) return false;

    const hasDrafted = statusFilter.includes('drafted');

    if (hasDrafted && statusFilter.length > 1) {
      return recordStatus === 'drafted';
    }

    return statusFilter.includes(recordStatus);
  }

  const selectableStatuses = useMemo(
    () => statusFilter.slice(),
    [statusFilter]
  );

  const allEligibleKeys = useMemo(
    () =>
      filteredDrafts
        .filter(r => isStatusSelectable(r.status, statusFilter))
        .map(r => r.policy_no_norm || r.key),
    [filteredDrafts, statusFilter]
  );

  const isAllSelected = useMemo(
    () => allEligibleKeys.length > 0 && allEligibleKeys.every(k => selected.has(k)),
    [allEligibleKeys, selected]
  );

  const isPartiallySelected = useMemo(
    () => selected.size > 0 && !isAllSelected && allEligibleKeys.some(k => selected.has(k)),
    [allEligibleKeys, selected, isAllSelected]
  );

  const columns = [
    { title: 'Policy', dataIndex: 'policy_no', key: 'policy_no', render: (t) => <span style={{ fontWeight: 600, color: '#2d3748' }}>{t}</span> },
    { title: 'Email', dataIndex: 'to_email', key: 'to_email', render: (t) => <span style={{ color: '#718096' }}>{t}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (<span style={statusBadgeStyle(s)}>{statusIcon(s)}{s}</span>) },
    { title: 'Δ Discount', dataIndex: 'discount_delta', key: 'discount_delta', render: (v) => { const num = Number(v) || 0; const style = num > 0 ? styles.textSuccess : styles.textDanger; return <span style={style}>{num > 0 ? `+${num}%` : `${num}%`}</span>; } },
    {
  title: `Δ Total (${currencyLabel(currencyCode)})`,
  dataIndex: "total_delta",
  key: "total_delta",
  render: (v) => {
    const num = Number(v) || 0;
    const style = num < 0 ? styles.textSuccess : styles.textDanger;
    return <span style={style}>{formatMoneySigned(num, currencyCode, inrPer1)}</span>;
  },
},

  ];

  return (
    <div style={styles.container}>
      {contextHolder}
      <div style={styles.innerContainer}>
        <h1 style={styles.header}>Bulk Email Agent</h1>
        <p style={styles.headerSubtitle}>Automated policy renewal email generation and distribution</p>

        {/* Config card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.sectionTitle}><Mail style={{ width: 24, height: 24 }} /> Configuration</span>
          </div>
          <div style={styles.cardContent}>
            <p style={styles.sectionSubtitle}>Select a customer segment and configure batch settings for email generation</p>
            <div style={styles.gridTwoCol}>
              <div>
                <label style={styles.label}>Customer Segment</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={segment} onChange={onChangeSegment} style={{ ...styles.select, width: 360, minWidth: 200 }} disabled={draftedCount > 0} title={draftedCount > 0 ? 'Drafts exist. Click “Cancel All” to reset, then you can change segment.' : undefined}>
                    {segments.length === 0 ? <option value="">(no segments)</option> : null}
                    {segments.map(seg => <option key={seg} value={seg}>{seg}</option>)}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={handleProcessSegment} disabled={processDisabled} title={!segment ? 'Select a segment first' : draftedCount > 0 ? 'Drafts exist. Click “Cancel All” to reset before re-processing.' : undefined} style={processDisabled ? { ...styles.btnPrimary, ...styles.btnDisabled } : styles.btnPrimary} aria-disabled={processDisabled}>
                      <RefreshCw style={{ width: 18, height: 18, ...(processing ? styles.spinIcon : {}) }} />
                      {processing ? `Processing… ${phaseMeta ? `(${phaseMeta.pct}%)` : ''}` : 'Process Segment'}
                    </button>
                  </div>

                  {(processing || hasProcessed) && (
                    <button onClick={() => setResetFilterModalOpen(true)} style={{ ...styles.btnSecondary, padding: '8px 12px', fontSize: 13, height: 40, alignSelf: 'center' }} title="Reset segment filter to initial page state">
                      Reset filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Flow */}
        {(processing || processingStep > 0) && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.sectionTitle}><RefreshCw style={{ width: 24, height: 24 }} /> Processing Flow</span>
            </div>
            <div style={styles.cardContent}>
              <p style={styles.sectionSubtitle}>Track the progress of email generation through three automated stages</p>
              <div style={styles.gridThreeCol}>
                <div style={processingStep === 1 ? { ...styles.stepCard, background: '#eef2ff' } : (processingStep > 1 ? { ...styles.stepCardComplete } : { ...styles.stepCard })}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2d3748' }}>1) Auto-Suggest</h3>
                  {processingStep === 1 ? (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBg}><div style={{ ...styles.progressBar, width: `${percent(p1.i, p1.n)}%` }} /></div>
                      <p style={styles.progressText}>{p1.i}/{p1.n} ({percent(p1.i, p1.n)}%)</p>
                    </div>
                  ) : processingStep > 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CompleteIcon /><span style={styles.progressText}>Completed</span></div>
                  ) : null}
                </div>

                <div style={processingStep === 2 ? { ...styles.stepCard, background: '#eef2ff' } : (processingStep > 2 ? { ...styles.stepCardComplete } : { ...styles.stepCard })}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2d3748' }}>2) Save Selected Changes</h3>
                  {processingStep === 2 ? (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBg}><div style={{ ...styles.progressBar, width: `${percent(p2.i, p2.n)}%` }} /></div>
                      <p style={styles.progressText}>{p2.i}/{p2.n} ({percent(p2.i, p2.n)}%)</p>
                    </div>
                  ) : processingStep > 2 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CompleteIcon /><span style={styles.progressText}>Completed</span></div>
                  ) : null}
                </div>

                <div style={processingStep === 3 ? { ...styles.stepCard, background: '#eef2ff' } : (processingStep > 3 ? { ...styles.stepCardComplete } : { ...styles.stepCard })}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2d3748' }}>3) Draft Emails</h3>
                  {processingStep === 3 ? (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBg}><div style={{ ...styles.progressBar, width: `${percent(p3.i, p3.n)}%` }} /></div>
                      <p style={styles.progressText}>{p3.i}/{p3.n} ({percent(p3.i, p3.n)}%)</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draft Summary */}
        {hasProcessed && !processing && draftDiscountDistribution.total > 0 && (
          <div style={styles.summaryCard} role="region" aria-label="Draft summary">
            <div style={styles.summaryCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail style={{ width: 18, height: 18, opacity: 0.95 }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>Draft Summary</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginLeft: 8 }}>
                  {draftDiscountDistribution.total} drafted · {draftDiscountDistribution.unique} unique Δ Discount values
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{draftDiscountDistribution.total} drafts</div>
                {processing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw style={{ width: 16, height: 16, ...(processing ? styles.spinIcon : {}), color: '#ffffff' }} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>{phaseMeta ? `${phaseMeta.name} (${phaseMeta.pct}%)` : 'Processing…'}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {/* LEFT: Adjusted params */}
              <div style={{ flex: '1 1 540px', minWidth: 260 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Adjusted params</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{adjustedSummary.total} drafted · {adjustedSummary.items.reduce((s, it) => s + it.count, 0)} adjusted</div>
                </div>

                <div style={{ width: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {adjustedSummary.items
                      .filter(it => it.count > 0)
                      .map(it => (
                        <div key={it.key} style={{ padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #eef2f6', minHeight: 52 }}>
                          <div style={{ fontWeight: 700, color: '#1f2937' }}>{it.label}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 6 }}>{it.count} adjusted</div>
                        </div>
                      ))
                    }

                    {adjustedSummary.items.every(it => it.count === 0) && (
                      <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#94a3b8' }}>No numeric adjustments</div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Discount group pills */}
              <div style={{ width: 340, maxWidth: '38%', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, alignSelf: 'stretch', textAlign: 'right' }}>Discount groups</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch', width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }} aria-hidden={false}>
                    {draftDiscountDistribution.items.map((it, idx) => {
                      const pillStyle = (idx % 2 === 0) ? styles.summaryPill : styles.summaryPillAlt;
                      const numeric = !Number.isNaN(Number(it.value));
                      const label = numeric ? `${it.value}% (${it.count})` : `${it.value} (${it.count})`;

                      return (
                        <div key={it.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <div
                            role="button"
                            tabIndex={0}
                            title={`${it.count} policies with Δ Discount ${it.value}`}
                            onClick={() => openPercentModal(it.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') openPercentModal(it.value); }}
                            style={{ ...pillStyle, display: 'inline-flex', alignItems: 'center', gap: 8, paddingRight: 8 }}
                          >
                            <span>{label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                    {draftDiscountDistribution.total} drafts · {draftDiscountDistribution.unique} unique Δ Discount values
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {hasProcessed && !processing && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.sectionTitle}><Mail style={{ width: 24, height: 24 }} /> Review Drafted Emails</span>
            </div>
            <div style={styles.cardContent}>
              <p style={styles.sectionSubtitle}>
                {hasProcessed ? 'Filter, search, and review all drafted emails before sending' : 'Run “Process Segment” or press Refresh to load latest drafts'}
              </p>

              <div style={styles.gridThreeCol}>
                <div>
                  <label style={styles.label}><Filter style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} /> Status</label>
                  <div style={styles.filterContainer}>
                    {['drafted', 'sent', 'failed'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        style={statusFilter.includes(s) ? { ...styles.filterBtn, ...styles.filterBtnActive } : { ...styles.filterBtn, ...styles.filterBtnInactive }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={styles.label}><Search style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} /> Search Policy</label>
                  <input
                    type="text"
                    value={policySearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPolicySearch(v);

                      if (v.trim() === '') {
                        fetchReview('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e && typeof e.preventDefault === 'function') e.preventDefault();
                        const val = (e.target && e.target.value)
                          ? e.target.value.trim()
                          : policySearch.trim();
                        fetchReview(val || '');
                      }
                    }}
                    placeholder="Enter policy number..."
                    style={{ ...styles.input }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <button type="button" onClick={handleRefresh} style={styles.btnSecondary} disabled={loadingRows}>
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    {loadingRows ? 'Refreshing…' : 'Refresh'}
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    style={styles.btnSecondary}
                    disabled={!segment || loadingRows || selected.size === 0}
                    title={selected.size > 0 ? 'Download CSV for selected policies' : 'Select one or more policies to download'}
                  >
                    <Download style={{ width: 14, height: 14 }} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 12, color: '#718096', fontWeight: 600 }}>
                {!hasProcessed ? 'No data yet' : (loadingRows ? 'Loading…' : `Showing ${filteredDrafts.length} email${filteredDrafts.length !== 1 ? 's' : ''}`)}
              </div>

              {(!hasProcessed) ? (
                <div style={styles.emptyState}>
                  <AlertCircle style={{ width: 64, height: 64, color: '#cbd5e1', margin: '0 auto 16px' }} />
                  <p style={{ color: '#718096' }}>Process or refresh to load drafts</p>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div style={styles.emptyState}>
                  <AlertCircle style={{ width: 64, height: 64, color: '#cbd5e1', margin: '0 auto 16px' }} />
                  <p style={{ color: '#718096' }}>No drafts found for current filters</p>
                </div>
              ) : (
                <Table
                  rowKey={(r) => r.policy_no_norm || r.key}
                  columns={columns}
                  dataSource={filteredDrafts}
                  loading={loadingRows}
                  pagination={{
                    current: currentPage,
                    pageSize: 5,
                    showSizeChanger: false,
                    onChange: (page) => setCurrentPage(page)
                  }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (newKeys) => {
                      setSelected(prev => {
                        const next = new Set(prev);
                        const newSet = new Set(newKeys);

                        for (const k of prev) {
                          if (!newSet.has(k)) next.delete(k);
                        }

                        for (const k of newSet) next.add(k);

                        return next;
                      });
                    },
                    getCheckboxProps: (record) => ({
                      disabled: !isStatusSelectable(record.status, statusFilter),
                    }),
                    preserveSelectedRowKeys: true,
                    columnTitle: (
                      <Checkbox
                        indeterminate={isPartiallySelected}
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelected(new Set(allEligibleKeys));
                          else {
                            const next = new Set(selected);
                            for (const k of allEligibleKeys) next.delete(k);
                            setSelected(next);
                          }
                        }}
                        aria-label="Select all drafted policies across all pages"
                      />
                    ),
                  }}
                  expandable={{
                    expandIcon: ({ expanded, onExpand, record }) => (
                      <span onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer', color: '#667eea' }}>
                        {expanded ? <ChevronUp style={{ width: 20, height: 20 }} /> : <ChevronDown style={{ width: 20, height: 20 }} />}
                      </span>
                    ),
                    expandedRowRender: (draft) => {
                      const id = draft.policy_no_norm || draft.key;
                      const isEditing = editingKey === id;

                      return (
                        <div style={{ padding: 16, background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)', borderRadius: 12 }}>
                          <div style={styles.expandedContainer}>
                            <div>
                              <h4 style={styles.expandedSectionTitle}>Subject:</h4>
                              {isEditing ? (
                                <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} style={{ ...styles.input, fontWeight: 600, width: '100%', boxSizing: 'border-box' }} maxLength={500} placeholder="Enter subject..." />
                              ) : (
                                <p style={{ fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>{draft.subject}</p>
                              )}
                            </div>

                            <div>
                              <h4 style={styles.expandedSectionTitle}>Email Body:</h4>
                              {isEditing ? (
                                <textarea rows={12} value={editBody} onChange={(e) => setEditBody(e.target.value)} ref={(el) => { bodyRefs.current[id] = el; }} autoComplete="off" style={{ ...styles.textarea, minHeight: 220, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Type the email body..." />
                              ) : (
                                <pre style={{ ...styles.expandedPre, maxHeight: 260, overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>{draft.body_text}</pre>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(163, 177, 198, 0.2)' }}>
                              <div style={styles.expandedMetric}><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Δ OD:</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{formatMoneySigned(draft.od_delta, currencyCode, inrPer1)}</span></div>
                              <div style={styles.expandedMetric}><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Δ TP:</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{formatMoneySigned(draft.tp_delta, currencyCode, inrPer1)}</span></div>
                              <div style={styles.expandedMetric}><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Old Premium:</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{formatMoney(draft.old_total_premium, currencyCode, inrPer1)}</span></div>
                              <div style={styles.expandedMetric}><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>New Premium:</span><span style={{ marginLeft: 8, fontWeight: 700 }}>{formatMoney(draft.new_total_premium, currencyCode, inrPer1)}</span></div>
                            </div>

                            {draft.sent_at && (
                              <div style={styles.expandedMetric}>
                                {draft.gmail_message_id && (
                                  <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>(ID: {draft.gmail_message_id})</span>
                                )}
                              </div>
                            )}
                            {draft.status === 'failed' && draft.error_text && (
                              <div style={{ ...styles.expandedMetric, color: '#991b1b', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                                <AlertCircle style={{ width: 16, height: 16 }} />
                                <span>Failure reason: {draft.error_text}</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed rgba(163,177,198,0.35)' }}>
                              {!isEditing ? (
                                <button onClick={() => startEdit(draft)} style={styles.btnSecondary} disabled={draft.status !== 'drafted'} title={draft.status !== 'drafted' ? 'Only drafted emails can be edited' : undefined}>Edit Email</button>
                              ) : (
                                <>
                                  <button onClick={() => saveEdit(draft)} style={styles.btnSuccess} disabled={!editSubject.trim() || !editBody.trim()}>Save</button>
                                  <button onClick={cancelEdit} style={{ ...styles.btnSecondary, background: '#e8ecf0' }}>Cancel</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }}
                  style={{ backgroundColor: '#f0f2f5', borderRadius: 16 }}
                />
              )}
            </div>
          </div>
        )}

        {/* Send Selected */}
        {hasProcessed && !processing && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.sectionTitle}><Send style={{ width: 24, height: 24 }} /> Send Emails</span>
            </div>
            <div style={styles.cardContent}>
              {draftedCount === 0 ? (
                <div style={styles.emptyState}>
                  <AlertCircle style={{ width: 64, height: 64, color: '#cbd5e1', margin: '0 auto 16px' }} />
                  <p style={{ color: '#718096' }}>No drafted emails to send</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#4a5568' }}>
                    Ready to send <strong style={{ color: '#667eea' }}>{selectedDraftedCount}</strong> selected drafted email{selectedDraftedCount !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: 8 }}>
                    <button
                      onClick={handleSendSelected}
                      disabled={selectedDraftedCount === 0 || sending}
                      style={selectedDraftedCount === 0 || sending ? { ...styles.btnPrimary, ...styles.btnDisabled } : styles.btnPrimary}
                    >
                      {sending ? 'Sending…' : `Send Selected (${selectedDraftedCount})`}
                    </button>
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      disabled={sending}
                      style={{ ...styles.btnSecondary, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b' }}
                    >
                      Cancel All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reset modal */}
      <Modal open={resetFilterModalOpen} title="Reset segment filter?" onCancel={() => setResetFilterModalOpen(false)} onOk={async () => { await resetSegmentFilter(); }} centered>
        <p>This will reset the page to its original state for the current segment. Continue?</p>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelModalOpen} title="Reset drafts?" onCancel={() => setCancelModalOpen(false)} onOk={async () => { setCancelModalOpen(false); await showCancelConfirm(); }} centered>
        <p>This will discard selected policies!</p>
      </Modal>

      {/* Modal for editing policies in a Δ Discount group */}
      <Modal
        title={`Policies with Δ Discount ${modalPercentKey}`}
        open={modalOpen}
        onCancel={() => closeModal()}
        width={980}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 24px' }}
        footer={[
          <button key="cancel" onClick={() => closeModal()} style={styles.btnSecondary} disabled={modalSaving}>
            Close
          </button>
        ]}
        centered
        destroyOnClose={false}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, color: '#4a5568', fontWeight: 700 }}>Edit numeric fields or the drafted email.</div>
        </div>

        {modalRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#718096' }}>No drafted policies for this Δ Discount group.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {modalRows.map((r) => {
              const key = r.policy_no_norm || r.key;
              const e = modalEdits[key] || {};
              const computedTotal = computeTotalFromOdTp(e.new_od, e.new_tp);
              const totalToShow = (typeof e.new_total_premium !== 'undefined' && e.new_total_premium !== null) ? e.new_total_premium : (r.new_total_premium ?? computedTotal);
              const saving = !!savingPerPolicy[key];
              const emailExpanded = !!openEmail[key];
              const isEmailDirty = isModalEmailDirty(key);
              const isSaving = !!savingPerPolicy[key];
              const canSavePolicy = !!modalDirty[key];

              return (
                <div key={key} style={{ padding: 12, borderRadius: 8, background: '#fafafa', border: '1px solid #eef2f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 16,
                          paddingBottom: 6
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#2d3748' }}>
                            {r.policy_no}
                            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>({key})</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#718096' }}>{r.to_email}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>Old Discount</div>
                            <div style={{ fontWeight: 700 }}>{r.old_discount}%</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>Old OD</div>
                            <div style={{ fontWeight: 700 }}>{formatMoney(r.old_od, currencyCode, inrPer1)}</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>Old TP</div>
                            <div style={{ fontWeight: 700 }}>{formatMoney(r.old_tp, currencyCode, inrPer1)}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginTop: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>New Discount (%)</label>
                          <input
                            type="number"
                            value={(e.new_discount ?? '')}
                            onChange={(ev) => {
                              const raw = ev.target.value;
                              const oldMin = Number(r.old_discount || 0);
                              const parsed = Number(raw);
                              const next = Number.isFinite(parsed) ? Math.max(parsed, oldMin) : oldMin;
                              onModalFieldChange(key, 'new_discount', next);
                            }}
                            style={styles.input}
                            min={Number(r.old_discount ?? 0)}
                            title={`Minimum ${r.old_discount ?? 0}%`}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>{`New OD (${currencyLabel(currencyCode)})`}</label>
                          <input
  type="number"
  min={0}
  step="0.01"
  value={
    (e.new_od ?? e.new_od === 0)
      ? String(Number(convertINR(e.new_od, currencyCode, inrPer1).toFixed(2)))
      : ""
  }
  onChange={(ev) => {
    const uiVal = ev.target.value;              // value user types (selected currency)
    const inrVal = convertToINR(uiVal, currencyCode, inrPer1); // convert back to INR
    onModalFieldChange(key, "new_od", inrVal);
  }}
  style={styles.input}
/>

                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>{`New TP (${currencyLabel(currencyCode)})`}</label>
                          <input
  type="number"
  min={0}
  step="0.01"
  value={
    (e.new_tp ?? e.new_tp === 0)
      ? String(Number(convertINR(e.new_tp, currencyCode, inrPer1).toFixed(2)))
      : ""
  }
  onChange={(ev) => {
    const uiVal = ev.target.value;
    const inrVal = convertToINR(uiVal, currencyCode, inrPer1);
    onModalFieldChange(key, "new_tp", inrVal);
  }}
  style={styles.input}
/>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>{`New Total (${currencyLabel(currencyCode)}) (calculated)`}</label>
                          <input
                            type="text"
                            value={formatMoney(e.new_total_premium ?? totalToShow ?? 0, currencyCode, inrPer1)}
                            readOnly
                            style={{ ...styles.input, background: '#f6f6f9', cursor: 'not-allowed' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button onClick={() => setOpenEmail(prev => ({ ...prev, [key]: !prev[key] }))} style={{ ...styles.btnSecondary, fontSize: 13 }}>
                            {emailExpanded ? 'Hide email' : 'View / edit email'}
                          </button>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>Click to expand the draft subject/body</div>
                        </div>

                        {emailExpanded && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>Draft subject</label>
                              <input
                                type="text"
                                value={e.subject ?? ''}
                                onChange={(ev) => onModalFieldChange(key, 'subject', ev.target.value)}
                                style={styles.input}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 12, color: '#718096', marginBottom: 6 }}>Draft body</label>
                              <textarea
                                value={e.body_text ?? ''}
                                onChange={(ev) => onModalFieldChange(key, 'body_text', ev.target.value)}
                                style={{ ...styles.textarea, maxHeight: 260, height: 180, overflowY: 'auto', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                              <button
                                onClick={() => {
                                  // reset subject/body back to original
                                  revertModalEmail(key);
                                  // hide the email editor section
                                  setOpenEmail(prev => ({ ...prev, [key]: false }));
                                }}
                                style={{ ...styles.btnSecondary, background: '#fff' }}
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveModalEmail(key)}
                                style={isSaving ? { ...styles.btnPrimary, ...styles.btnDisabled } : styles.btnPrimary}
                                disabled={!isEmailDirty || isSaving}
                              >
                                {isSaving ? 'Saving…' : 'Save Email'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={() => resetSinglePolicy(key)} style={styles.btnSecondary} disabled={saving || modalSaving}>Reset</button>
                      <button
                        onClick={() => saveSinglePolicy(key)}
                        style={(!canSavePolicy || saving || modalSaving)
                          ? { ...styles.btnPrimary, ...styles.btnDisabled }
                          : styles.btnPrimary}
                        disabled={!canSavePolicy || saving || modalSaving}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {sending && (
        <div style={styles.overlay}>
          <div style={styles.overlayPanel}>
            <Spin size="large" />
          </div>
        </div>
      )}

      {flyMsg && (
        <div style={styles.flyMessage}>
          <CheckCircle style={{ width: 16, height: 16 }} />
          <div>{flyMsg.text}</div>
        </div>
      )}
    </div>
  );
};

export default BulkEmail;
