import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, Card, Button, Spin, message, Modal, Form, Input, Select, Table } from "antd";
import axios from "axios";

const { Sider, Content } = Layout;

const API_URL = import.meta.env.VITE_CONNECTION;

// LocalStorage keys
const LS_BOOKMARKS = "connectors_bookmarks_v1"; // string[]
const LS_USAGE = "connectors_usage_v1"; // record { [providerKey]: number }

// sessionStorage for Zoho oauth roundtrip (temporary)
const SS_ZOHO_CTX = "zoho_oauth_ctx_v1";

// -----------------------------
// ✅ clamp() equivalent in JS (because AntD Sider expects number widths)
// -----------------------------
function clampPx(minPx, preferredPx, maxPx) {
  return Math.max(minPx, Math.min(preferredPx, maxPx));
}

// Expanded: clamp(220px, 18vw, 280px)
// Collapsed: clamp(68px, 6vw, 88px)
function getResponsiveSiderWidths() {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;

  const expanded = clampPx(220, w * 0.18, 280);
  const collapsed = clampPx(68, w * 0.06, 88);

  return { expanded: Math.round(expanded), collapsed: Math.round(collapsed) };
}

// ✅ open Zoho auth in centered popup (new window)
function openCenteredPopup(url, name = "zoho_oauth") {
  const width = 900;
  const height = 750;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const w = window.open(
    url,
    name,
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  );
  return w;
}

// ---- styles
const styles = {
  shell: {
    minHeight: "100vh",
    background: "#f6f8fc",
    fontFamily: "var(--app-font-family)",
  },

  siderWrap: {
    position: "relative",
    background: "#ffffff",
    borderRight: "1px solid #eef2f7",
  },

  siderInner: {
    height: "100%",
    padding: "29px 16px 16px 16px",
    background: "#ffffff",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "10px 8px 0 8px",
  },
  brandTitle: { margin: 0, fontSize: 30, fontWeight: 700, color: "#0f172a" },

  brandRowCollapsed: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 0 6px 0",
  },

  collapsedConnIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  backBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    padding: "3px 0 0 3px",
    background: "transparent",
    border: "2px solid #0f172a",
    boxShadow: "0 10px 18px rgba(15, 23, 42, 0.10)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 14px 24px rgba(15, 23, 42, 0.14)",
  },
  backIconWrap: {
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  collapseBtn: {
    position: "absolute",
    top: 140,
    right: -14,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid #e7ecf5",
    background: "#ffffff",
    boxShadow: "0 10px 18px rgba(15, 23, 42, 0.12)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    zIndex: 10,
  },

  divider: {
    height: 1,
    opacity: 0.35,
    background: "#000308",
    marginBottom: 12,
    width: "100%",
    marginTop: 14,
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.06)",
  },
  dividerCollapsed: {
    height: 1,
    background: "#000308",
    opacity: 0.35,
    marginBottom: 12,
    width: 44,
    margin: "14px auto 0 auto",
    borderRadius: 999,
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.06)",
  },

  menu: { border: "none", marginTop: 0 },

  menuIcon: {
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    opacity: 0.9,
    marginRight: 10,
    flex: "0 0 auto",
  },

  contentWrap: {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    background: "#f0f9ff",
    padding: "clamp(56px, 6vw, 80px) clamp(12px, 3vw, 24px) clamp(60px, 6vw, 90px)",
    position: "relative",
    overflowX: "hidden",
    fontFamily: "var(--app-font-family)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    maxWidth: "100%",
    margin: "0 auto",
  },
  h1: { margin: 0, fontSize: 36, fontWeight: 700, color: "#0f172a" },
  sub: { margin: "8px 0 0 0", color: "#64748b" },

  section: {
    maxWidth: "100%",
    margin: "22px auto 0 auto",
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid #eef2f7",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
    padding: 18,
  },

  grid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },

  miniCard: {
    borderRadius: 16,
    border: "1px solid #eef2f7",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
    cursor: "pointer",
    userSelect: "none",
    position: "relative",
  },

  cardHeaderRow: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 8,
    zIndex: 2,
  },

  bookmarkBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#ffffff",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  miniCardInner: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
  },
  miniIcon: { width: 52, height: 52, objectFit: "contain" },
  miniTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" },

  modalTop: { display: "flex", alignItems: "center", gap: 10 },
  modalIcon: { width: 34, height: 34, objectFit: "contain" },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" },

  center: { display: "flex", justifyContent: "center", padding: "34px 0" },

  emptyBox: {
    padding: 18,
    borderRadius: 12,
    border: "1px dashed #dbe3ef",
    background: "#fbfdff",
    color: "#64748b",
    textAlign: "center",
  },

  helpBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eef2f7",
    background: "#f8fafc",
    color: "#475569",
    lineHeight: 1.5,
    fontSize: 13,
  },

  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 14,
    flexWrap: "wrap",
  },
};

// ---- simple inline SVG icons for sidebar (no extra libraries)
const SidebarIcon = ({ type }) => {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24" };

  if (type === "frequently") {
    return (
      <span style={styles.menuIcon}>
        <svg {...common} fill="none">
          <path
            d="M12 3l2.7 5.6 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.5 20.1l1.1-6.2L3 9.5l6.3-.9L12 3z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (type === "bookmarks") {
    return (
      <span style={styles.menuIcon}>
        <svg {...common} fill="none">
          <path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span style={styles.menuIcon}>
      <svg {...common} fill="none">
        <path
          d="M5 5h6v6H5V5zm8 0h6v6h-6V5zM5 13h6v6H5v-6zm8 0h6v6h-6v-6z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

const CollapseIcon = ({ collapsed }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
      stroke="#0f172a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DataConnectivityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="6" cy="12" r="2.2" stroke="#0f172a" strokeWidth="2" />
    <circle cx="18" cy="7" r="2.2" stroke="#0f172a" strokeWidth="2" />
    <circle cx="18" cy="17" r="2.2" stroke="#0f172a" strokeWidth="2" />
    <path d="M8 12h6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 12l2.4-3" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 12l2.4 3" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ---- Providers
const PROVIDERS = [
  { key: "hubspot", name: "HubSpot", authType: "Token", icon: "/Icons/HUBSPOT.png", connectionType: "token" },
  { key: "zoho", name: "Zoho CRM", authType: "OAuth2", icon: "/Icons/ZOHO(White)png.png", connectionType: "oauth" },
  { key: "salesforce", name: "Salesforce", authType: "OAuth2", icon: "/Icons/salesforce2.png", connectionType: "oauth" },
  { key: "freshdesk", name: "Freshdesk", authType: "API Key", icon: "/Icons/freshdesk.png", connectionType: "apikey" },
];

// HubSpot object types (static for now)
const HUBSPOT_OBJECT_OPTIONS = [
  { label: "Contacts", value: "contacts" },
  { label: "Companies", value: "companies" },
  { label: "Deals", value: "deals" },
  { label: "Tickets", value: "tickets" },
];

// Zoho accounts domains
const ZOHO_ACCOUNTS_DOMAINS = [
  { label: "accounts.zoho.com", value: "accounts.zoho.com" },
  { label: "accounts.zoho.in", value: "accounts.zoho.in" },
  { label: "accounts.zoho.eu", value: "accounts.zoho.eu" },
  { label: "accounts.zoho.com.au", value: "accounts.zoho.com.au" },
  { label: "accounts.zoho.jp", value: "accounts.zoho.jp" },
  { label: "accounts.zohocloud.ca", value: "accounts.zohocloud.ca" },
  { label: "accounts.zoho.sa", value: "accounts.zoho.sa" },
  { label: "accounts.zoho.uk", value: "accounts.zoho.uk" },
];

// ---- helpers
function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function getInitialBookmarks() {
  const raw = localStorage.getItem(LS_BOOKMARKS);
  const arr = safeParseJSON(raw, []);
  return Array.isArray(arr) ? arr : [];
}
function getInitialUsage() {
  const raw = localStorage.getItem(LS_USAGE);
  const obj = safeParseJSON(raw, {});
  return obj && typeof obj === "object" ? obj : {};
}

function randomState() {
  try {
    const a = new Uint32Array(4);
    window.crypto.getRandomValues(a);
    return Array.from(a).map((n) => n.toString(16)).join("") + Date.now().toString(16);
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export default function ConnectorsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [statusMap, setStatusMap] = useState({});

  const [sectionKey, setSectionKey] = useState("connectors");
  const [collapsed, setCollapsed] = useState(false);

  const [siderSize, setSiderSize] = useState(() => getResponsiveSiderWidths());
  useEffect(() => {
    const onResize = () => setSiderSize(getResponsiveSiderWidths());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [bookmarks, setBookmarks] = useState(() => getInitialBookmarks());
  const [usageMap, setUsageMap] = useState(() => getInitialUsage());

  const [backHover, setBackHover] = useState(false);

  const [activeProvider, setActiveProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [form] = Form.useForm();

  // ---------------------------
  // HubSpot state (token-based)
  // ---------------------------
  const [hubspotToken, setHubspotToken] = useState("");
  const [hubspotObjectTypeId, setHubspotObjectTypeId] = useState("contacts");
  const [hubspotProps, setHubspotProps] = useState([]);
  const [hubspotRows, setHubspotRows] = useState([]);
  const [hubspotLoading, setHubspotLoading] = useState(false);

  // ---------------------------
  // Zoho state (OAuth from client creds)
  // ---------------------------
  const [zohoAccountsDomain, setZohoAccountsDomain] = useState("accounts.zoho.in");
  const [zohoClientId, setZohoClientId] = useState("");
  const [zohoClientSecret, setZohoClientSecret] = useState("");
  const [zohoScopes, setZohoScopes] = useState("ZohoCRM.modules.ALL,ZohoCRM.settings.ALL");
  const [zohoRedirectUri, setZohoRedirectUri] = useState("");
  const [zohoTokenLoading, setZohoTokenLoading] = useState(false);

  const [zohoAccessToken, setZohoAccessToken] = useState("");
  const [zohoRefreshToken, setZohoRefreshToken] = useState("");
  const [zohoApiDomain, setZohoApiDomain] = useState("");

  const [zohoModules, setZohoModules] = useState([]);
  const [zohoModuleApiName, setZohoModuleApiName] = useState("");
  const [zohoFields, setZohoFields] = useState([]);
  const [zohoRows, setZohoRows] = useState([]);
  const [zohoLoading, setZohoLoading] = useState(false);
  // ✅ Zoho field batching (max 50 fields per preview)
  const ZOHO_FIELDS_BATCH_SIZE = 50;

  const [zohoFieldBatchIndex, setZohoFieldBatchIndex] = useState(0); // 0-based


  // Salesforce CRM

  const SS_SF_CTX = "sf_oauth_ctx_v1";
  const LS_SF_RESULT = "sf_oauth_result_v1";

  const SF_LOGIN_DOMAINS = [
  { label: "login.salesforce.com (Production)", value: "login.salesforce.com" },
  // { label: "test.salesforce.com (Sandbox)", value: "test.salesforce.com" },
  ];

  const [sfLoginDomain, setSfLoginDomain] = useState("login.salesforce.com");
const [sfClientId, setSfClientId] = useState("");
const [sfClientSecret, setSfClientSecret] = useState("");
const [sfScopes, setSfScopes] = useState("api refresh_token offline_access");
const [sfRedirectUri, setSfRedirectUri] = useState("");

const [sfTokenLoading, setSfTokenLoading] = useState(false);
const [sfAccessToken, setSfAccessToken] = useState("");
const [sfRefreshToken, setSfRefreshToken] = useState("");
const [sfInstanceUrl, setSfInstanceUrl] = useState("");

const [sfObjects, setSfObjects] = useState([]);
const [sfObjectName, setSfObjectName] = useState("");
const [sfFields, setSfFields] = useState([]);
const [sfRows, setSfRows] = useState([]);
const [sfLoading, setSfLoading] = useState(false);

const SF_FIELDS_BATCH_SIZE = 50;
const [sfFieldBatchIndex, setSfFieldBatchIndex] = useState(0);


  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/integrations/status`);
      setStatusMap(res.data || {});
    } catch (e) {
      // optional
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(LS_USAGE, JSON.stringify(usageMap));
  }, [usageMap]);

  const toggleBookmark = (providerKey) => {
    setBookmarks((prev) => {
      const has = prev.includes(providerKey);
      if (has) return prev.filter((k) => k !== providerKey);
      return [...prev, providerKey];
    });
  };

  const bumpUsage = (providerKey) => {
    setUsageMap((prev) => ({
      ...prev,
      [providerKey]: (prev[providerKey] || 0) + 1,
    }));
  };

  const openProviderModal = (provider) => {
    bumpUsage(provider.key);
    setActiveProvider(provider);
    setIsModalOpen(true);

    form.resetFields();
    form.setFieldsValue({
      provider: provider?.key,
      connectionName: `${provider?.name} Connector`,
      environment: "production",
    });

    if (provider.key === "hubspot") {
      setHubspotToken("");
      setHubspotObjectTypeId("contacts");
      setHubspotProps([]);
      setHubspotRows([]);
      setHubspotLoading(false);
    }

    if (provider.key === "zoho") {
      setZohoRedirectUri(`${window.location.origin}${window.location.pathname}`); // redirect back to same page
      setZohoAccessToken("");
      setZohoRefreshToken("");
      setZohoApiDomain("");
      setZohoModules([]);
      setZohoModuleApiName("");
      setZohoFields([]);
      setZohoRows([]);
      setZohoLoading(false);
      setZohoTokenLoading(false);
    }

    if (provider.key === "salesforce") {
  setSfRedirectUri(`${window.location.origin}${window.location.pathname}`);
  setSfAccessToken("");
  setSfRefreshToken("");
  setSfInstanceUrl("");
  setSfObjects([]);
  setSfObjectName("");
  setSfFields([]);
  setSfRows([]);
  setSfLoading(false);
  setSfTokenLoading(false);
  setSfFieldBatchIndex(0);
}


  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveProvider(null);

    setHubspotToken("");
    setZohoClientSecret("");
    setZohoAccessToken("");
    setZohoRefreshToken("");
    setZohoApiDomain("");

    setHubspotProps([]);
    setHubspotRows([]);

    setZohoModules([]);
    setZohoFields([]);
    setZohoRows([]);
    setSfClientSecret("");
setSfAccessToken("");
setSfRefreshToken("");
setSfInstanceUrl("");
setSfObjects([]);
setSfFields([]);
setSfRows([]);


    form.resetFields();
  };

  const startOAuthConnect = async (providerKey) => {
    setConnectLoading(true);
    try {
      const res = await axios.get(`${API_URL}/integrations/${providerKey}/auth-url`);
      const authUrl = res.data?.auth_url;
      if (!authUrl) {
        message.error("Auth URL not returned by server");
        return;
      }
      window.location.href = authUrl;
    } catch (e) {
      message.error(e.response?.data?.error || "Failed to start connection");
    } finally {
      setConnectLoading(false);
    }
  };

  const saveApiKeyConnect = async (values) => {
    setConnectLoading(true);
    try {
      await axios.post(`${API_URL}/integrations/${activeProvider.key}/connect`, values);
      message.success(`${activeProvider.name} connected successfully`);
      closeModal();
      fetchStatuses();
    } catch (e) {
      message.error(e.response?.data?.error || "Failed to connect");
    } finally {
      setConnectLoading(false);
    }
  };

  // ---------------------------
  // HubSpot: load fields + preview
  // ---------------------------
  const loadHubspotProperties = async () => {
    if (!hubspotToken) return message.error("Enter HubSpot Access Token");
    if (!hubspotObjectTypeId) return message.error("Select an Object Type");

    setHubspotLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/hubspot/properties`, {
        access_token: hubspotToken,
        object_type_id: hubspotObjectTypeId,
      });
      setHubspotProps(res.data?.properties || []);
      message.success("Fields loaded");
    } catch (e) {
      message.error(e.response?.data?.detail || "Failed to load fields");
    } finally {
      setHubspotLoading(false);
    }
  };

  const loadHubspotPreview = async () => {
    if (!hubspotToken) return message.error("Enter HubSpot Access Token");
    if (!hubspotObjectTypeId) return message.error("Select an Object Type");
    if (!hubspotProps.length) return message.error("Click Load Fields first");

    setHubspotLoading(true);
    try {
      const props = hubspotProps.map((p) => p.name).filter(Boolean);

      const res = await axios.post(`${API_URL}/integrations/hubspot/preview`, {
        access_token: hubspotToken,
        object_type_id: hubspotObjectTypeId,
        limit: 20,
        properties: props,
      });
      setHubspotRows(res.data?.items || []);
      message.success("Data loaded");
    } catch (e) {
      message.error(e.response?.data?.detail || "Failed to load data");
    } finally {
      setHubspotLoading(false);
    }
  };

  const hubspotColumns = useMemo(() => {
    return (hubspotProps || [])
      .filter((p) => p?.name)
      .map((p) => ({
        title: p.label || p.name,
        key: p.name,
        width: 220,
        ellipsis: true,
        render: (_, row) => row?.properties?.[p.name] ?? "-",
      }));
  }, [hubspotProps]);

  // ---------------------------
  // Zoho: OAuth flow (client creds) + modules/fields/preview
  // ---------------------------
  const startZohoAuthorize = async () => {
    if (!zohoAccountsDomain) return message.error("Select Zoho Accounts Domain");
    if (!zohoClientId) return message.error("Enter Zoho Client ID");
    if (!zohoClientSecret) return message.error("Enter Zoho Client Secret");
    if (!zohoRedirectUri) return message.error("Enter Redirect URI");
    if (!zohoScopes) return message.error("Enter Scopes");

    const state = `zoho_${randomState()}`;

    // store temporary context for exchange step (client side only)
    sessionStorage.setItem(
      SS_ZOHO_CTX,
      JSON.stringify({
        state,
        accounts_domain: zohoAccountsDomain,
        client_id: zohoClientId,
        client_secret: zohoClientSecret,
        redirect_uri: zohoRedirectUri,
        scopes: zohoScopes,
      })
    );

    setZohoTokenLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/zoho/auth-url`, {
        accounts_domain: zohoAccountsDomain,
        client_id: zohoClientId,
        redirect_uri: zohoRedirectUri,
        scopes: zohoScopes,
        state,
      });

      const authUrl = res.data?.auth_url;
      if (!authUrl) {
        message.error("Auth URL not returned");
        setZohoTokenLoading(false);
        return;
      }

      // ✅ open in new window / popup (not same tab)
      const w = openCenteredPopup(authUrl);
      if (!w) {
        message.error("Popup blocked. Please allow popups for this site.");
        setZohoTokenLoading(false);
        return;
      }

      // main window should not stay loading
      setZohoTokenLoading(false);
    } catch (e) {
      message.error(e.response?.data?.error || "Failed to generate Zoho auth URL");
      setZohoTokenLoading(false);
    }
  };


  const startSalesforceAuthorize = async () => {
  if (!sfLoginDomain) return message.error("Select Salesforce Login Domain");
  if (!sfClientId) return message.error("Enter Salesforce Client ID");
  if (!sfClientSecret) return message.error("Enter Salesforce Client Secret");
  if (!sfRedirectUri) return message.error("Enter Redirect URI");
  if (!sfScopes) return message.error("Enter Scopes");

  const state = `sf_${randomState()}`;

  sessionStorage.setItem(
    SS_SF_CTX,
    JSON.stringify({
      state,
      login_domain: sfLoginDomain,
      client_id: sfClientId,
      client_secret: sfClientSecret,
      redirect_uri: sfRedirectUri,
      scopes: sfScopes,
    })
  );

  setSfTokenLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/salesforce/auth-url`, {
      login_domain: sfLoginDomain,
      client_id: sfClientId,
      redirect_uri: sfRedirectUri,
      scopes: sfScopes,
      state,
    });

    const authUrl = res.data?.auth_url;
    if (!authUrl) return message.error("Auth URL not returned");

    const w = openCenteredPopup(authUrl, "sf_oauth");
    if (!w) message.error("Popup blocked. Please allow popups for this site.");
  } catch (e) {
    message.error(e.response?.data?.error || "Failed to generate Salesforce auth URL");
  } finally {
    setSfTokenLoading(false);
  }
};

const exchangeSalesforceCode = async (code, state) => {
  const rawCtx = sessionStorage.getItem(SS_SF_CTX);
  if (!rawCtx) throw new Error("Salesforce context missing. Click Authorize again.");

  const ctx = JSON.parse(rawCtx);
  if (!ctx || ctx.state !== state) throw new Error("Salesforce state mismatch. Please authorize again.");

  const res = await axios.post(`${API_URL}/integrations/salesforce/exchange-code`, {
    login_domain: ctx.login_domain,
    client_id: ctx.client_id,
    client_secret: ctx.client_secret,
    redirect_uri: ctx.redirect_uri,
    code,
  });

  const access_token = res.data?.access_token;
  const refresh_token = res.data?.refresh_token;
  const instance_url = res.data?.instance_url;

  if (!access_token || !instance_url) throw new Error("Missing access_token/instance_url in response.");

  setSfAccessToken(access_token);
  setSfRefreshToken(refresh_token || "");
  setSfInstanceUrl(instance_url);

  message.success("Salesforce connected. You can load objects now.");
  sessionStorage.removeItem(SS_SF_CTX);
};

useEffect(() => {
  const handler = async () => {
    const raw = localStorage.getItem(LS_SF_RESULT);
    if (!raw) return;

    let payload;
    try { payload = JSON.parse(raw); } catch { localStorage.removeItem(LS_SF_RESULT); return; }

    const { code, state, ts } = payload || {};
    if (!code || !state) { localStorage.removeItem(LS_SF_RESULT); return; }

    // TTL 2 mins
    if (Date.now() - (ts || 0) > 2 * 60 * 1000) {
      localStorage.removeItem(LS_SF_RESULT);
      message.error("Salesforce authorization expired. Please authorize again.");
      return;
    }

    setSfTokenLoading(true);
    try {
      await exchangeSalesforceCode(code, state);
    } catch (err) {
      message.error(err?.message || "Salesforce exchange failed");
    } finally {
      setSfTokenLoading(false);
      localStorage.removeItem(LS_SF_RESULT);
      navigate(location.pathname, { replace: true });
    }
  };

  handler();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}, [API_URL, navigate, location.pathname]);

const refreshSalesforceAccessToken = async () => {
  if (!sfRefreshToken) return message.error("No refresh token available");

  const raw = sessionStorage.getItem(SS_SF_CTX);
  const ctx = raw ? safeParseJSON(raw, null) : null;

  const login_domain = sfLoginDomain || ctx?.login_domain;
  const client_id = sfClientId || ctx?.client_id;
  const client_secret = sfClientSecret || ctx?.client_secret;

  if (!login_domain || !client_id || !client_secret) return message.error("Login domain / Client ID / Secret missing");

  setSfTokenLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/salesforce/refresh-token`, {
      login_domain,
      client_id,
      client_secret,
      refresh_token: sfRefreshToken,
    });

    const access_token = res.data?.access_token;
    if (!access_token) return message.error("Refresh failed: missing access_token");

    setSfAccessToken(access_token);
    message.success("Salesforce access token refreshed");
  } catch (e) {
    message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to refresh token");
  } finally {
    setSfTokenLoading(false);
  }
};

const loadSalesforceObjects = async () => {
  if (!sfAccessToken || !sfInstanceUrl) return message.error("Authorize Salesforce first");
  setSfLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/salesforce/sobjects`, {
      access_token: sfAccessToken,
      instance_url: sfInstanceUrl,
    });
    const list = res.data?.sobjects || [];
    setSfObjects(list);
    const first = list.find(x => x?.name) || null;
    setSfObjectName(first?.name || "");
    message.success("Objects loaded");
  } catch (e) {
    message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load objects");
  } finally {
    setSfLoading(false);
  }
};

const loadSalesforceFields = async () => {
  if (!sfAccessToken || !sfInstanceUrl) return message.error("Authorize Salesforce first");
  if (!sfObjectName) return message.error("Select an object");

  setSfLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/salesforce/fields`, {
      access_token: sfAccessToken,
      instance_url: sfInstanceUrl,
      sobject: sfObjectName,
    });
    const fields = res.data?.fields || [];
    setSfFields(fields);
    setSfRows([]);
    setSfFieldBatchIndex(0);
    message.success("Fields loaded");
  } catch (e) {
    message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load fields");
  } finally {
    setSfLoading(false);
  }
};

const loadSalesforcePreview = async () => {
  if (!sfAccessToken || !sfInstanceUrl) return message.error("Authorize Salesforce first");
  if (!sfObjectName) return message.error("Select an object");
  if (!sfFields.length) return message.error("Click Load Fields first");

  const start = sfFieldBatchIndex * SF_FIELDS_BATCH_SIZE;
  const end = start + SF_FIELDS_BATCH_SIZE;

  let fieldNames = sfFields.map(f => f.name).filter(Boolean).slice(start, end);
  if (!fieldNames.length) return message.error("No fields in this batch");

  // ensure Id is there
  if (!fieldNames.includes("Id")) fieldNames = ["Id", ...fieldNames].slice(0, SF_FIELDS_BATCH_SIZE);

  setSfLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/salesforce/preview`, {
      access_token: sfAccessToken,
      instance_url: sfInstanceUrl,
      sobject: sfObjectName,
      fields: fieldNames,
      limit: 20,
    });

    const rows = res.data?.records || [];
    setSfRows(Array.isArray(rows) ? rows : []);
    message.success(`Data loaded (fields ${start + 1}-${Math.min(end, sfFields.length)})`);
  } catch (e) {
    message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load data");
  } finally {
    setSfLoading(false);
  }
};

const sfColumns = useMemo(() => {
  const start = sfFieldBatchIndex * SF_FIELDS_BATCH_SIZE;
  const end = start + SF_FIELDS_BATCH_SIZE;
  const batch = (sfFields || []).slice(start, end);

  return batch
    .filter(f => f?.name)
    .map(f => ({
      title: f.label || f.name,
      key: f.name,
      dataIndex: f.name,
      width: 220,
      ellipsis: true,
      render: (v) => (v === null || v === undefined || v === "" ? "-" : String(v)),
    }));
}, [sfFields, sfFieldBatchIndex]);



  // ✅ If Zoho redirects back inside POPUP, send code to opener and close popup
  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return;

  const payload = JSON.stringify({ code, state, ts: Date.now() });

  if (state.startsWith("zoho_")) localStorage.setItem("zoho_oauth_result_v1", payload);
  if (state.startsWith("sf_")) localStorage.setItem(LS_SF_RESULT, payload);

  // only close if this is a popup
  setTimeout(() => window.close(), 50);
}, [location.search]);



// ✅ PARENT LISTENER: pick up zoho code from localStorage and exchange it
// ✅ PARENT LISTENER: pick up zoho code from localStorage and exchange it
useEffect(() => {
  const key = "zoho_oauth_result_v1";

  const handler = async () => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
      return;
    }

    const { code, state, ts } = payload || {};
    if (!code || !state) {
      localStorage.removeItem(key);
      return;
    }

    // optional TTL (2 mins)
    if (Date.now() - (ts || 0) > 2 * 60 * 1000) {
      localStorage.removeItem(key);
      message.error("Zoho authorization expired. Please authorize again.");
      return;
    }

    // read your saved ctx
    const rawCtx = sessionStorage.getItem(SS_ZOHO_CTX);
    if (!rawCtx) {
      localStorage.removeItem(key);
      return;
    }

    let ctx;
    try {
      ctx = JSON.parse(rawCtx);
    } catch {
      sessionStorage.removeItem(SS_ZOHO_CTX);
      localStorage.removeItem(key);
      return;
    }

    if (!ctx || ctx.state !== state) {
      localStorage.removeItem(key);
      message.error("Zoho state mismatch. Please authorize again.");
      return;
    }

    setZohoTokenLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/zoho/exchange-code`, {
        accounts_domain: ctx.accounts_domain,
        client_id: ctx.client_id,
        client_secret: ctx.client_secret,
        redirect_uri: ctx.redirect_uri,
        code,
      });

      const access_token = res.data?.access_token;
      const refresh_token = res.data?.refresh_token;
      const api_domain = res.data?.api_domain;

      if (!access_token || !api_domain) {
        message.error("Zoho token response missing access_token/api_domain");
        return;
      }

      setZohoAccessToken(access_token);
      setZohoRefreshToken(refresh_token || "");
      setZohoApiDomain(api_domain);

      message.success("Zoho connected. You can load modules now.");
    } catch (e) {
      message.error(e.response?.data?.detail || e.response?.data?.error || "Zoho exchange failed");
    } finally {
      setZohoTokenLoading(false);
      sessionStorage.removeItem(SS_ZOHO_CTX);
      localStorage.removeItem(key);

      // clean URL if needed
      navigate(location.pathname, { replace: true });
    }
  };

  // run once + when storage changes (other tab/popup)
  handler();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}, [API_URL, navigate, location.pathname]);




  // ✅ Main window: listen for OAuth code from popup and exchange
  useEffect(() => {
    const onMsg = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ZOHO_OAUTH_CODE") return;

      const { code, state } = event.data;

      const raw = sessionStorage.getItem(SS_ZOHO_CTX);
      if (!raw) return message.error("Zoho context missing. Click Authorize again.");

      let ctx;
      try {
        ctx = JSON.parse(raw);
      } catch {
        return message.error("Zoho context invalid. Click Authorize again.");
      }

      if (!ctx || ctx.state !== state) {
        return message.error("Zoho state mismatch. Please retry Authorize.");
      }

      setZohoTokenLoading(true);
      try {
        const res = await axios.post(`${API_URL}/integrations/zoho/exchange-code`, {
          accounts_domain: ctx.accounts_domain,
          client_id: ctx.client_id,
          client_secret: ctx.client_secret,
          redirect_uri: ctx.redirect_uri,
          code,
        });

        const access_token = res.data?.access_token;
        const refresh_token = res.data?.refresh_token;
        const api_domain = res.data?.api_domain;

        if (!access_token || !api_domain) {
          message.error("Zoho token response missing access_token/api_domain");
          return;
        }

        setZohoAccessToken(access_token);
        setZohoRefreshToken(refresh_token || "");
        setZohoApiDomain(api_domain);

        message.success("Zoho connected. You can load modules now.");
        sessionStorage.removeItem(SS_ZOHO_CTX);
      } catch (e) {
        message.error(e.response?.data?.detail || e.response?.data?.error || "Zoho exchange failed");
      } finally {
        setZohoTokenLoading(false);
      }
    };

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [API_URL]);

  // ✅ Fallback: if user ends up redirected in SAME WINDOW (rare), exchange here too
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) return;

    // if it is popup, popup handler will close itself; skip here
    if (window.opener && !window.opener.closed) return;

    const raw = sessionStorage.getItem(SS_ZOHO_CTX);
    if (!raw) return;

    let ctx = null;
    try {
      ctx = JSON.parse(raw);
    } catch {
      return;
    }
    if (!ctx || ctx.state !== state) return;

    const doExchange = async () => {
      setZohoTokenLoading(true);
      try {
        const res = await axios.post(`${API_URL}/integrations/zoho/exchange-code`, {
          accounts_domain: ctx.accounts_domain,
          client_id: ctx.client_id,
          client_secret: ctx.client_secret,
          redirect_uri: ctx.redirect_uri,
          code,
        });

        const access_token = res.data?.access_token;
        const refresh_token = res.data?.refresh_token;
        const api_domain = res.data?.api_domain;

        if (!access_token || !api_domain) {
          message.error("Zoho token response missing access_token/api_domain");
          return;
        }

        setZohoAccessToken(access_token);
        setZohoRefreshToken(refresh_token || "");
        setZohoApiDomain(api_domain);

        message.success("Zoho connected. You can load modules now.");
      } catch (e) {
        message.error(e.response?.data?.detail || e.response?.data?.error || "Zoho exchange failed");
      } finally {
        setZohoTokenLoading(false);
        sessionStorage.removeItem(SS_ZOHO_CTX);
        // clean URL
        navigate(location.pathname, { replace: true });
      }
    };

    doExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const refreshZohoAccessToken = async () => {
    if (!zohoRefreshToken) return message.error("No refresh token available");

    const raw = sessionStorage.getItem(SS_ZOHO_CTX);
    let ctx = null;
    try {
      ctx = raw ? JSON.parse(raw) : null;
    } catch {
      ctx = null;
    }

    // prefer current UI state, fallback to stored ctx if available
    const accounts_domain = zohoAccountsDomain || ctx?.accounts_domain;
    const client_id = zohoClientId || ctx?.client_id;
    const client_secret = zohoClientSecret || ctx?.client_secret;

    if (!accounts_domain) return message.error("Accounts domain missing");
    if (!client_id || !client_secret) return message.error("Client ID/Secret missing");

    setZohoTokenLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/zoho/refresh-token`, {
        accounts_domain,
        client_id,
        client_secret,
        refresh_token: zohoRefreshToken,
      });

      const access_token = res.data?.access_token;
      const api_domain = res.data?.api_domain || zohoApiDomain;

      if (!access_token) {
        message.error("Refresh failed: missing access_token");
        return;
      }

      setZohoAccessToken(access_token);
      if (api_domain) setZohoApiDomain(api_domain);
      message.success("Access token refreshed");
    } catch (e) {
      message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to refresh token");
    } finally {
      setZohoTokenLoading(false);
    }
  };

  const loadZohoModules = async () => {
    if (!zohoAccessToken || !zohoApiDomain) {
      return message.error("Authorize Zoho first (access_token/api_domain missing)");
    }

    setZohoLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/zoho/modules`, {
        access_token: zohoAccessToken,
        api_domain: zohoApiDomain,
      });

      const mods = res.data?.modules || [];
      setZohoModules(mods);
      if (mods.length) setZohoModuleApiName(mods[0]?.api_name || "");
      message.success("Modules loaded");
    } catch (e) {
      message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load modules");
    } finally {
      setZohoLoading(false);
    }
  };

  const loadZohoFields = async () => {
    if (!zohoAccessToken || !zohoApiDomain) return message.error("Authorize Zoho first");
    if (!zohoModuleApiName) return message.error("Select a module");

    setZohoLoading(true);
    try {
      const res = await axios.post(`${API_URL}/integrations/zoho/fields`, {
        access_token: zohoAccessToken,
        api_domain: zohoApiDomain,
        module_api_name: zohoModuleApiName,
      });

      const fields = res.data?.fields || [];
      setZohoFields(fields);
      setZohoRows([]);
      setZohoFieldBatchIndex(0);
      message.success("Fields loaded");
    } catch (e) {
      message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load fields");
    } finally {
      setZohoLoading(false);
    }
  };

  const loadZohoPreview = async () => {
  if (!zohoAccessToken || !zohoApiDomain) return message.error("Authorize Zoho first");
  if (!zohoModuleApiName) return message.error("Select a module");
  if (!zohoFields.length) return message.error("Click Load Fields first");

  // ✅ current batch [start..end)
  const start = zohoFieldBatchIndex * ZOHO_FIELDS_BATCH_SIZE;
  const end = start + ZOHO_FIELDS_BATCH_SIZE;

  const fieldApiNames = zohoFields
    .map((f) => f.api_name)
    .filter(Boolean)
    .slice(start, end); // ✅ max 50

  if (!fieldApiNames.length) return message.error("No fields available in this batch");

  setZohoLoading(true);
  try {
    const res = await axios.post(`${API_URL}/integrations/zoho/preview`, {
      access_token: zohoAccessToken,
      api_domain: zohoApiDomain,
      module_api_name: zohoModuleApiName,
      fields: fieldApiNames,
      page: 1,
      per_page: 20,
    });

    const rows = res.data?.data || [];
    setZohoRows(Array.isArray(rows) ? rows : []);
    message.success(`Data loaded (fields ${start + 1}-${Math.min(end, zohoFields.length)})`);
  } catch (e) {
    message.error(e.response?.data?.detail || e.response?.data?.error || "Failed to load data");
  } finally {
    setZohoLoading(false);
  }
};


  const zohoColumns = useMemo(() => {
  const start = zohoFieldBatchIndex * ZOHO_FIELDS_BATCH_SIZE;
  const end = start + ZOHO_FIELDS_BATCH_SIZE;

  const batchFields = (zohoFields || []).slice(start, end);

  return batchFields
    .filter((f) => f?.api_name)
    .map((f) => ({
      title: f.field_label || f.api_name,
      key: f.api_name,
      dataIndex: f.api_name,
      width: 220,
      ellipsis: true,
      render: (v) => (v === null || v === undefined || v === "" ? "-" : String(v)),
    }));
}, [zohoFields, zohoFieldBatchIndex]);


  // ---------------------------
  // Modal body rendering
  // ---------------------------
  const renderModalBody = () => {
    if (!activeProvider) return null;

    const canLoadHubspotFields = !!hubspotToken && !!hubspotObjectTypeId;
    const canHubspotPreview = canLoadHubspotFields && hubspotProps.length > 0;

    const canZohoLoadModules = !!zohoAccessToken && !!zohoApiDomain;
    const canZohoLoadFields = canZohoLoadModules && !!zohoModuleApiName;
    const canZohoPreview = canZohoLoadFields && zohoFields.length > 0;

    return (
      <>
        <div style={styles.modalTop}>
          <img src={activeProvider.icon} alt={activeProvider.name} style={styles.modalIcon} />
          <div>
            <p style={styles.modalTitle}>{activeProvider.name} Connection</p>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {/* HubSpot token-based */}
          {activeProvider.key === "hubspot" ? (
            <>
              <Form layout="vertical" autoComplete="off">
                <Form.Item
                  label="HubSpot Access Token (Private App Token)"
                  extra="Paste your HubSpot Private App token. We will not store it."
                  required
                >
                  <Input.Password
                    value={hubspotToken}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHubspotToken(v);
                      setHubspotProps([]);
                      setHubspotRows([]);
                    }}
                    placeholder="pat-xxxxxxxxxxxxxxxxxxxx"
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item label="Object Type" required>
                  <Select
                    value={hubspotObjectTypeId || undefined}
                    onChange={(v) => {
                      setHubspotObjectTypeId(v);
                      setHubspotProps([]);
                      setHubspotRows([]);
                    }}
                    options={HUBSPOT_OBJECT_OPTIONS}
                    showSearch
                    optionFilterProp="label"
                    disabled={!hubspotToken}
                    placeholder={!hubspotToken ? "Paste token first" : "Select object type"}
                  />
                </Form.Item>

                <div style={styles.helpBox}>
                  <b>Steps:</b> Create HubSpot <b>Private App</b> → copy <b>Access Token</b> → paste here → choose object →
                  click <b>Load Fields</b> → click <b>Preview Data</b>.
                </div>

                <div style={styles.modalActions}>
                  <Button onClick={loadHubspotProperties} loading={hubspotLoading} disabled={!canLoadHubspotFields}>
                    Load Fields
                  </Button>

                  <Button type="primary" onClick={loadHubspotPreview} loading={hubspotLoading} disabled={!canHubspotPreview}>
                    Preview Data
                  </Button>
                </div>

                {/* ✅ table ONLY after Load Fields (no static columns like ID) */}
                {hubspotProps.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <Table
                      rowKey={(row) => row?.id}
                      columns={hubspotColumns}
                      dataSource={hubspotRows}
                      loading={hubspotLoading}
                      pagination={{ pageSize: 10 }}
                      sticky
                      scroll={{ x: "max-content", y: 420 }} // ✅ horizontal + vertical scroll
                      tableLayout="fixed"
                    />
                  </div>
                ) : null}
              </Form>
            </>
          ) : null}

          {/* Zoho OAuth (credentials from client only) */}
          {activeProvider.key === "zoho" ? (
            <>
              <Form layout="vertical" autoComplete="off">
                <Form.Item label="Zoho Accounts Domain" required>
                  <Select
                    value={zohoAccountsDomain}
                    onChange={(v) => setZohoAccountsDomain(v)}
                    options={ZOHO_ACCOUNTS_DOMAINS}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item label="Client ID" required>
                  <Input value={zohoClientId} onChange={(e) => setZohoClientId(e.target.value)} />
                </Form.Item>

                <Form.Item label="Client Secret" required>
                  <Input.Password
                    value={zohoClientSecret}
                    onChange={(e) => setZohoClientSecret(e.target.value)}
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item label="Redirect URI" required extra="This Redirect URI must be added in Zoho API Console.">
                  <Input value={zohoRedirectUri} onChange={(e) => setZohoRedirectUri(e.target.value)} />
                </Form.Item>

                <Form.Item label="Scopes" required extra="Comma separated. Example: ZohoCRM.modules.ALL,ZohoCRM.settings.ALL">
                  <Input value={zohoScopes} onChange={(e) => setZohoScopes(e.target.value)} />
                </Form.Item>

                <div style={styles.helpBox}>
                  <b>Steps:</b> Create Zoho OAuth client → set Redirect URI (same as above) → click <b>Authorize</b> →
                  Zoho redirects back with <b>code</b> → app exchanges code and gets <b>access_token</b> →
                  click <b>Load Modules</b> → select module → <b>Load Fields</b> → <b>Preview Data</b>.
                  <br />
                  <b>Note:</b> Authorize opens in a new popup window.
                </div>

                <div style={styles.modalActions}>
                  <Button onClick={closeModal}>Close</Button>

                  <Button onClick={startZohoAuthorize} loading={zohoTokenLoading}>
                    Authorize
                  </Button>

                  <Button onClick={refreshZohoAccessToken} loading={zohoTokenLoading} disabled={!zohoRefreshToken}>
                    Refresh Token
                  </Button>

                  <Button onClick={loadZohoModules} loading={zohoLoading} disabled={!canZohoLoadModules}>
                    Load Modules
                  </Button>

                  <Button onClick={loadZohoFields} loading={zohoLoading} disabled={!canZohoLoadFields}>
                    Load Fields
                  </Button>

                  {/* <Button type="primary" onClick={loadZohoPreview} loading={zohoLoading} disabled={!canZohoPreview}>
                    Preview Data
                  </Button> */}
                </div>

                {zohoModules.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Module</div>
                    <Select
                      value={zohoModuleApiName || undefined}
                      onChange={(v) => {
                        setZohoModuleApiName(v);
                        setZohoFields([]);
                        setZohoRows([]);
                      }}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="label"
                      options={zohoModules.map((m) => ({
                        value: m.api_name,
                        label: `${m.plural_label || m.module_name || m.api_name} (${m.api_name})`,
                      }))}
                    />
                  </div>
                ) : null}

                {/* ✅ Field batch navigator (appears after Load Fields) */}
{zohoFields.length > 0 ? (
  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
    {(() => {
      const total = zohoFields.length;
      const totalBatches = Math.ceil(total / ZOHO_FIELDS_BATCH_SIZE);
      const start = zohoFieldBatchIndex * ZOHO_FIELDS_BATCH_SIZE;
      const end = Math.min(start + ZOHO_FIELDS_BATCH_SIZE, total);

      return (
        <>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            Showing fields: {start + 1} – {end} (Batch {zohoFieldBatchIndex + 1}/{totalBatches})
          </div>

          <Button
            disabled={zohoFieldBatchIndex <= 0}
            onClick={() => {
              setZohoFieldBatchIndex((v) => Math.max(0, v - 1));
              setZohoRows([]); // optional: clear old data
            }}
          >
            ◀ Prev 50
          </Button>

          <Button
            disabled={zohoFieldBatchIndex >= totalBatches - 1}
            onClick={() => {
              setZohoFieldBatchIndex((v) => Math.min(totalBatches - 1, v + 1));
              setZohoRows([]); // optional: clear old data
            }}
          >
            Next 50 ▶
          </Button>

          <Button
            type="primary"
            loading={zohoLoading}
            onClick={loadZohoPreview}
          >
            Preview Data
          </Button>
        </>
      );
    })()}
  </div>
) : null}


                {/* ✅ table ONLY after Load Fields (no static columns) */}
                {zohoFields.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <Table
                      rowKey={(row) => row?.id || row?.ID || JSON.stringify(row)}
                      columns={zohoColumns}
                      dataSource={zohoRows}
                      loading={zohoLoading}
                      pagination={{ pageSize: 10 }}
                      sticky
                      scroll={{ x: "max-content", y: 420 }}
                      tableLayout="fixed"
                    />
                  </div>
                ) : null}
              </Form>
            </>
          ) : null}

          {activeProvider.key === "salesforce" ? (
  <Form layout="vertical" autoComplete="off">
    <Form.Item label="Salesforce Login Domain" required>
      <Select
        value={sfLoginDomain}
        onChange={setSfLoginDomain}
        options={SF_LOGIN_DOMAINS}
        showSearch
        optionFilterProp="label"
      />
    </Form.Item>

    <Form.Item label="Client ID (Consumer Key)" required>
      <Input value={sfClientId} onChange={(e) => setSfClientId(e.target.value)} />
    </Form.Item>

    <Form.Item label="Client Secret (Consumer Secret)" required>
      <Input.Password value={sfClientSecret} onChange={(e) => setSfClientSecret(e.target.value)} autoComplete="off" />
    </Form.Item>

    <Form.Item label="Redirect URI" required extra="This must match Connected App Callback URL exactly.">
      <Input value={sfRedirectUri} onChange={(e) => setSfRedirectUri(e.target.value)} />
    </Form.Item>

    <Form.Item label="Scopes" required extra='Space separated. Example: "api refresh_token offline_access"'>
      <Input value={sfScopes} onChange={(e) => setSfScopes(e.target.value)} />
    </Form.Item>

    <div style={styles.helpBox}>
      <b>Steps:</b> Create Salesforce Connected App → set Callback URL → copy Client ID/Secret → click <b>Authorize</b> →
      exchange code → click <b>Load Objects</b> → select object → <b>Load Fields</b> → <b>Preview Data</b>.
      <br />
      <b>Note:</b> Authorize opens in a popup window.
    </div>

    <div style={styles.modalActions}>
      <Button onClick={closeModal}>Close</Button>

      <Button onClick={startSalesforceAuthorize} loading={sfTokenLoading}>
        Authorize
      </Button>

      <Button onClick={refreshSalesforceAccessToken} loading={sfTokenLoading} disabled={!sfRefreshToken}>
        Refresh Token
      </Button>

      <Button onClick={loadSalesforceObjects} loading={sfLoading} disabled={!sfAccessToken || !sfInstanceUrl}>
        Load Objects
      </Button>

      <Button onClick={loadSalesforceFields} loading={sfLoading} disabled={!sfObjectName}>
        Load Fields
      </Button>
    </div>

    {sfObjects.length > 0 ? (
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Object</div>
        <Select
          value={sfObjectName || undefined}
          onChange={(v) => {
            setSfObjectName(v);
            setSfFields([]);
            setSfRows([]);
          }}
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="label"
          options={sfObjects.map((o) => ({
            value: o.name,
            label: `${o.label || o.name} (${o.name})`,
          }))}
        />
      </div>
    ) : null}

    {sfFields.length > 0 ? (
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {(() => {
          const total = sfFields.length;
          const totalBatches = Math.ceil(total / SF_FIELDS_BATCH_SIZE);
          const start = sfFieldBatchIndex * SF_FIELDS_BATCH_SIZE;
          const end = Math.min(start + SF_FIELDS_BATCH_SIZE, total);

          return (
            <>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                Showing fields: {start + 1} – {end} (Batch {sfFieldBatchIndex + 1}/{totalBatches})
              </div>

              <Button
                disabled={sfFieldBatchIndex <= 0}
                onClick={() => { setSfFieldBatchIndex((v) => Math.max(0, v - 1)); setSfRows([]); }}
              >
                ◀ Prev 50
              </Button>

              <Button
                disabled={sfFieldBatchIndex >= totalBatches - 1}
                onClick={() => { setSfFieldBatchIndex((v) => Math.min(totalBatches - 1, v + 1)); setSfRows([]); }}
              >
                Next 50 ▶
              </Button>

              <Button type="primary" loading={sfLoading} onClick={loadSalesforcePreview}>
                Preview Data
              </Button>
            </>
          );
        })()}
      </div>
    ) : null}

    {sfFields.length > 0 ? (
      <div style={{ marginTop: 14 }}>
        <Table
          rowKey={(row) => row?.Id || JSON.stringify(row)}
          columns={sfColumns}
          dataSource={sfRows}
          loading={sfLoading}
          pagination={{ pageSize: 10 }}
          sticky
          scroll={{ x: "max-content", y: 420 }}
          tableLayout="fixed"
        />
      </div>
    ) : null}
  </Form>
) : null}


          {/* Other providers */}
          {activeProvider.key !== "hubspot" && activeProvider.key !== "zoho" && activeProvider.key !== "salesforce" ? (

            <Form form={form} layout="vertical" autoComplete="off" onFinish={saveApiKeyConnect}>
              <Form.Item label="Environment" name="environment" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "production", label: "Production" },
                    { value: "staging", label: "Staging" },
                  ]}
                />
              </Form.Item>

              

              {activeProvider.connectionType === "apikey" ? (
                <>
                  <Form.Item
                    label="Freshdesk Domain"
                    name="domain"
                    rules={[{ required: true, message: "Enter your Freshdesk domain" }]}
                    extra='Example: "companyname.freshdesk.com"'
                  >
                    <Input placeholder="companyname.freshdesk.com" />
                  </Form.Item>

                  <Form.Item label="Freshdesk Account Email" name="email" rules={[{ required: true, message: "Enter Freshdesk email" }]}>
                    <Input placeholder="name@company.com" />
                  </Form.Item>

                  <Form.Item label="Freshdesk API Key" name="api_key" rules={[{ required: true, message: "Enter API key" }]}>
                    <Input.Password placeholder="Enter API key" />
                  </Form.Item>

                  <div style={styles.modalActions}>
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={connectLoading}>
                      Save & Connect
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.helpBox}>
                    This connector uses <b>OAuth2</b>. Click <b>Connect</b> to authorize access securely.
                  </div>

                  <div style={styles.modalActions}>
                    <Button onClick={closeModal}>Close</Button>
                    <Button type="primary" loading={connectLoading} onClick={() => startOAuthConnect(activeProvider.key)}>
                      Connect
                    </Button>
                  </div>
                </>
              )}
            </Form>
          ) : null}
        </div>
      </>
    );
  };

  const providersByKey = useMemo(() => {
    const map = {};
    for (const p of PROVIDERS) map[p.key] = p;
    return map;
  }, []);

  const bookmarkedProviders = useMemo(
    () => bookmarks.map((k) => providersByKey[k]).filter(Boolean),
    [bookmarks, providersByKey]
  );

  const frequentlyUsedProviders = useMemo(() => {
    const sorted = [...PROVIDERS].sort((a, b) => (usageMap[b.key] || 0) - (usageMap[a.key] || 0));
    return sorted.filter((p) => (usageMap[p.key] || 0) > 0).slice(0, 6);
  }, [usageMap]);

  const visibleProviders = useMemo(() => {
    if (sectionKey === "bookmarks") return bookmarkedProviders;
    if (sectionKey === "frequently") return frequentlyUsedProviders;
    return PROVIDERS;
  }, [sectionKey, bookmarkedProviders, frequentlyUsedProviders]);

  const ConnectorCard = ({ provider }) => {
    const isBookmarked = bookmarks.includes(provider.key);

    return (
      <Card key={provider.key} style={styles.miniCard} hoverable onClick={() => openProviderModal(provider)}>
        <div style={styles.cardHeaderRow}>
          <div
            role="button"
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            style={styles.bookmarkBtn}
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(provider.key);
              message.success(isBookmarked ? "Removed from Bookmarks" : "Added to Bookmarks");
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
                fill={isBookmarked ? "#0ea5e9" : "transparent"}
                stroke={isBookmarked ? "#0ea5e9" : "#334155"}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div style={styles.miniCardInner}>
          <img src={provider.icon} alt={provider.name} style={styles.miniIcon} />
          <p style={styles.miniTitle}>{provider.name}</p>
        </div>
      </Card>
    );
  };

  const sectionTitle = useMemo(() => {
    if (sectionKey === "frequently") return "Frequently Used";
    if (sectionKey === "bookmarks") return "Bookmarks";
    return "All Connectors";
  }, [sectionKey]);

  const sectionSubtitle = useMemo(() => {
    if (sectionKey === "frequently") return "Most opened connectors are shown here.";
    if (sectionKey === "bookmarks") return "Pinned connectors for quick access.";
    return "Select a connector to configure and connect.";
  }, [sectionKey]);

  return (
    <Layout style={styles.shell}>
      <Sider
        width={siderSize.expanded}
        collapsedWidth={siderSize.collapsed}
        collapsed={collapsed}
        trigger={null}
        style={styles.siderWrap}
      >
        <Button
          type="default"
          shape="circle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          style={styles.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          icon={<CollapseIcon collapsed={collapsed} />}
        />

        <div style={styles.siderInner}>
          {!collapsed ? (
            <div style={styles.brandRow}>
              <h2 style={styles.brandTitle}>Connectors</h2>

              <Button
                type="default"
                shape="circle"
                aria-label="Back"
                title="Back"
                style={{ ...styles.backBtn, ...(backHover ? styles.backBtnHover : {}) }}
                onMouseEnter={() => setBackHover(true)}
                onMouseLeave={() => setBackHover(false)}
                onClick={() => navigate(-1)}
                icon={
                  <span style={styles.backIconWrap}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 18l-6-6 6-6"
                        stroke="#0f172a"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M7 12h10" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
                    </svg>
                  </span>
                }
              />
            </div>
          ) : (
            <div style={styles.brandRowCollapsed} title="Connectors">
              <div style={styles.collapsedConnIcon}>
                <DataConnectivityIcon />
              </div>
            </div>
          )}

          <div style={collapsed ? styles.dividerCollapsed : styles.divider} />

          <Menu
            mode="inline"
            selectedKeys={[sectionKey]}
            onClick={({ key }) => setSectionKey(key)}
            style={styles.menu}
            inlineCollapsed={collapsed}
            items={[
              {
                key: "frequently",
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <SidebarIcon type="frequently" />
                    {!collapsed && "Frequently Used"}
                  </span>
                ),
              },
              {
                key: "bookmarks",
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <SidebarIcon type="bookmarks" />
                    {!collapsed && "Bookmarks"}
                  </span>
                ),
              },
              {
                key: "connectors",
                label: (
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <SidebarIcon type="connectors" />
                    {!collapsed && "All Connectors"}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </Sider>

      <Content style={styles.contentWrap}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.h1}>{sectionTitle}</h1>
            <p style={styles.sub}>{sectionSubtitle}</p>
          </div>
        </div>

        <div style={styles.section}>
          {loading ? (
            <div style={styles.center}>
              <Spin />
            </div>
          ) : visibleProviders.length === 0 ? (
            <div style={styles.emptyBox}>
              {sectionKey === "bookmarks"
                ? "No bookmarks yet. Click the bookmark icon on a connector."
                : "No frequently used connectors yet. Open a connector to start tracking."}
            </div>
          ) : (
            <div style={styles.grid}>
              {visibleProviders.map((p) => (
                <ConnectorCard key={p.key} provider={p} />
              ))}
            </div>
          )}
        </div>
      </Content>

      <Modal open={isModalOpen} onCancel={closeModal} footer={null} width={900} title={null} destroyOnClose>
        {renderModalBody()}
      </Modal>
    </Layout>
  );
}
