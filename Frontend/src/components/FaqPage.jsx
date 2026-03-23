import React, { useMemo, useState } from "react";

/**
 * ProChurn AI - FAQ Page (Professional Edition)
 * - Clean, corporate design with sophisticated color palette
 * - Improved typography and spacing
 * - Professional visual hierarchy
 */

const HEADER_OFFSET = 30;

// Scrollbar colors
const SCROLL_TRACK = "#f1f5f9";
const SCROLL_THUMB = "#cad4e2";
const SCROLL_THUMB_HOVER = "#64748b";

export default function FaqPage() {
  const segments = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
        icon: "📊",
        subtitle: "Platform purpose and scope",
        items: [
          {
            q: "What is ProChurn AI?",
            a: "ProChurn AI is an end-to-end retention platform for insurance businesses designed to predict churn risk and enable targeted actions through segmentation, recommendations, automated outreach, churn simulation, and an AI-powered conversational assistant.",
          },
          {
            q: "Which insurance line does ProChurn AI currently support?",
            a: "ProChurn AI is currently focused on Motor Insurance. The solution can be extended to other insurance lines based on data availability, business rules, and deployment requirements.",
          },
          {
            q: "What business outcomes does ProChurn AI help improve?",
            a: "The platform supports measurable retention outcomes such as reduced churn, improved renewals, better segment-level prioritization, improved campaign effectiveness, and structured retention workflows.",
          },
        ],
      },
      {
        key: "data",
        label: "Data Sources & Integrations",
        icon: "🔗",
        subtitle: "Ingestion, connectors, and staging",
        items: [
          {
            q: "What data sources can I connect to ProChurn AI?",
            a: "You can ingest data via Excel upload, Azure Blob Storage connection, and API-based ingestion through HubSpot, Zoho CRM, and Salesforce integrations.",
          },
          {
            q: "Does ProChurn AI support data cleansing and staging (Raw/Silver/Gold)?",
            a: "Yes. ProChurn AI supports staged processing (Raw → Silver → Gold) to perform cleansing, transformation, deduplication, and curated outputs for analytics and modeling.",
          },
          {
            q: "Can data ingestion be automated?",
            a: "Yes. Automated ingestion can be configured through connected sources (Blob/API). Execution status and logs can be monitored through Health Monitoring.",
          },
        ],
      },
      {
        key: "modules",
        label: "Modules & Workflow",
        icon: "⚙️",
        subtitle: "End-to-end product modules",
        items: [
          {
            q: "What are the key modules in ProChurn AI?",
            a: "Key modules include Retention Pathway, Controls & Settings, Data Ingestion, Dashboards, Health Monitoring, Power BI reporting, At-Risk Alerts, Segmentation, Recommendations, Churn Simulator, Email Agent, Retention Assistant, SSBI, and the FAQ module.",
          },
          {
            q: "What is the Retention Pathway module?",
            a: "Retention Pathway showcases the end-to-end workflow—from ingestion and modeling to segmentation, recommendations, outreach, and monitoring—so teams can execute retention actions in a structured manner.",
          },
          {
            q: "What does SSBI (Self-Service BI) provide?",
            a: "SSBI allows users to connect data, drag-and-drop fields into charts, build custom reports, and download outputs—reducing dependency on technical teams for routine analytics.",
          },
        ],
      },
      {
        key: "prediction",
        label: "Churn Prediction & Alerts",
        icon: "📈",
        subtitle: "Risk outputs and alert windows",
        items: [
          {
            q: "What does ProChurn AI predict?",
            a: "ProChurn AI identifies at-risk policies/customers and produces churn risk outputs used across alerts, segmentation, recommendations, and outreach workflows.",
          },
          {
            q: "What are At-Risk Policy Alerts?",
            a: "At-Risk Policy Alerts provide prioritized views of predicted churn risk—commonly organized into operational windows such as Next 7 Days and Next 30 Days.",
          },
          {
            q: "Can we customize prediction outputs?",
            a: "Yes. Prediction data outputs can be customized based on business requirements and configurable settings.",
          },
        ],
      },
      {
        key: "segmentation",
        label: "Segmentation & Recommendations",
        icon: "🎯",
        subtitle: "Business rules and actions",
        items: [
          {
            q: "What is Segmentation in ProChurn AI?",
            a: "Segmentation groups customers/policies based on configurable business metrics, enabling targeted retention strategies and differentiated outreach.",
          },
          {
            q: "Can business users adjust segmentation rules and metrics?",
            a: "Yes. The Configurations module allows users to customize segmentation definitions and related business parameters without code changes.",
          },
          {
            q: "What does the Recommendation module deliver?",
            a: "The Recommendation module provides prioritized actions aligned to churn risk and configurable business logic to support retention execution.",
          },
        ],
      },
      {
        key: "email-ai",
        label: "Email Automation & AI",
        icon: "✉️",
        subtitle: "Email Agent, Simulator, Assistant",
        items: [
          {
            q: "How does bulk email sending work?",
            a: "Bulk outreach is currently executed via Gmail. Email sending can be customized based on client requirements (sender identity, routing rules, governance controls, and related settings).",
          },
          {
            q: "What is the Email Agent module?",
            a: "Email Agent is an AI-powered workflow where users select a customer segment, generate email drafts guided by business metrics, optionally refine the content, and send emails in bulk to the selected segment.",
          },
          {
            q: "What is the Churn Simulator module used for?",
            a: "Churn Simulator enables controlled 'what-if' analysis by adjusting business parameters per policy/customer and generating customized recommended emails based on the simulated scenario.",
          },
          {
            q: "What is the Retention Assistant?",
            a: "Retention Assistant is a conversational AI module that answers general or data-driven questions with structured insights and interactive visual summaries.",
          },
        ],
      },
      {
        key: "security",
        label: "Security & Deployment",
        icon: "🔒",
        subtitle: "Data storage and protection",
        items: [
          {
            q: "Where is client data stored?",
            a: "Data storage is deployed based on the client's requested environment and location preferences.",
          },
          {
            q: "Is customer data encrypted?",
            a: "Yes. Customer-related data is protected through encryption as part of the platform's security design, aligned with ISO guidance as per client expectations.",
          },
        ],
      },
      {
        key: "pricing-support",
        label: "Pricing & Support",
        icon: "💼",
        subtitle: "Commercials and contact",
        items: [
          {
            q: "How do we get pricing and packaging details?",
            a: "For pricing and packaging details, please contact: contact@prowesstics.com.",
          },
          {
            q: "How do we reach support?",
            a: "For support and operations, please contact: contact@prowesstics.com.",
          },
        ],
      },
    ],
    []
  );

  const [active, setActive] = useState(segments[0]?.key || "overview");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const activeSeg = useMemo(
    () => segments.find((s) => s.key === active) || segments[0],
    [active, segments]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeSeg.items;
    return activeSeg.items.filter((it) => {
      const hay = `${it.q} ${it.a}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeSeg.items, query]);

  const toggle = (id) => setOpenId((p) => (p === id ? null : id));

  return (
    <>
      {/* ✅ Scrollbar + focus styling */}
      <style>{`
  .faqSidebarScroll::-webkit-scrollbar { width: 10px; }
  .faqSidebarScroll::-webkit-scrollbar-track { background: ${SCROLL_TRACK}; border-radius: 999px; }
  .faqSidebarScroll::-webkit-scrollbar-thumb { background: ${SCROLL_THUMB}; border-radius: 999px; border: 2px solid ${SCROLL_TRACK}; }
  .faqSidebarScroll::-webkit-scrollbar-thumb:hover { background: ${SCROLL_THUMB_HOVER}; }

  /* ✅ kill ALL browser ring/highlight styles */
  .faqNavBtn {
    outline: none !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .faqNavBtn:focus,
  .faqNavBtn:focus-visible,
  .faqNavBtn:active {
    outline: none !important;
    box-shadow: none !important;
  }

  .faqNavBtn::-moz-focus-inner { border: 0; }
`}</style>


      <div style={styles.page}>
        {/* Sidebar */}
        <aside style={styles.sidebar} className="faqSidebarScroll">
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitle}>Frequently Asked Questions</div>
            <div style={styles.sidebarSubtitle}>Find answers to common questions about ProChurn AI</div>
          </div>

          {/* Search (optional)
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>🔍</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              style={styles.sidebarSearch}
            />
          </div>
          */}

          <nav style={styles.nav} aria-label="FAQ Sections">
            {segments.map((s , idx) => {
              const isActiveItem = s.key === active;
              return (
                <button
                  key={`${s.key}-${idx}`}
                  className="faqNavBtn"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
    e.currentTarget.blur();   // ✅ remove focus so border won’t “stick”
    setActive(s.key);
    setOpenId(null);
  }}
                  style={{
                    ...styles.navItem,
                    ...(isActiveItem ? styles.navItemActive : {}),
                  }}
                  aria-current={isActiveItem ? "page" : undefined}
                >
                  <span style={styles.navIcon} aria-hidden>
                    {s.icon}
                  </span>

                  <span style={styles.navLabelWrap}>
                    <span style={styles.navLabel}>{s.label}</span>
                    <span style={styles.navSmall}>{s.subtitle}</span>
                  </span>

                  {/* <span
                    style={{
                      ...styles.countPill,
                      ...(isActiveItem ? styles.countPillActive : {}),
                    }}
                  >
                    {s.items.length}
                  </span> */}
                </button>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <div style={styles.contactCard}>
              <div style={styles.contactTitle}>Need Additional Help?</div>
              <div style={styles.contactText}>Our support team is ready to assist you</div>
              <a style={styles.contactButton} href="mailto:contact@prowesstics.com">
                Contact Support
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <div>
              <h1 style={styles.contentTitle}>{activeSeg.label}</h1>
              <p style={styles.contentSubtitle}>
                {activeSeg.subtitle} • {filteredItems.length} question
                {filteredItems.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <section style={styles.faqSection}>
            {filteredItems.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔍</div>
                <div style={styles.emptyTitle}>No results found</div>
                <div style={styles.emptyText}>
                  Try adjusting your search terms or browse different categories
                </div>
              </div>
            ) : (
              <div style={styles.faqList}>
                {filteredItems.map((it, idx) => {
                  const id = `${activeSeg.key}-${idx}`;
                  const isOpen = openId === id;

                  return (
                    <div
                      key={id}
                      style={{
                        ...styles.faqItem,
                        ...(isOpen ? styles.faqItemOpen : {}),
                      }}
                    >
                      <button
                      className="faqNoFocus"
                        type="button"
                        onClick={(e) => {
    e.currentTarget.blur();
    toggle(id);
  }}
                        onMouseDown={(e) => e.preventDefault()}
                        style={styles.faqQuestion}
                        aria-expanded={isOpen}
                      >
                        <div style={styles.questionNumber}>Q{idx + 1}</div>
                        <div style={styles.faqQText}>{it.q}</div>
                        <div
                          style={{
                            ...styles.chevron,
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                          aria-hidden
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div style={styles.faqAnswer}>
                          <div style={styles.answerLabel}>Answer</div>
                          <div style={styles.answerText}>{it.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

/* ========================= PROFESSIONAL STYLES ========================= */

const styles = {
  page: {
    height: `calc(100vh - ${HEADER_OFFSET}px)`,
    width: "100%",
    marginTop: `${HEADER_OFFSET}px`,
    display: "flex",
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    overflow: "hidden", // prevent outer scrolling
  },

  /* Sidebar */
  sidebar: {
    width: 340,
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "32px 24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    height: "100%",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
    scrollbarColor: `${SCROLL_THUMB} ${SCROLL_TRACK}`,
  },

  sidebarHeader: {
    paddingBottom: 24,
    borderBottom: "1px solid #e2e8f0",
  },

  sidebarTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1.3,
    marginBottom: 8,
    letterSpacing: "-0.01em",
  },

  sidebarSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.5,
    fontWeight: 400,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },

  navItem: {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 10,
  appearance: "none",
  WebkitAppearance: "none",
  background: "transparent",
  border: "1px solid transparent",
  outline: "none",
  boxShadow: "none",
  cursor: "pointer",
  textAlign: "left",
  color: "#475569",
  transition: "all 0.2s ease",

  // ✅ add these
  WebkitTapHighlightColor: "transparent",
  userSelect: "none",
},


  navItemActive: {
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    borderColor: "#bfdbfe",
    color: "#1e40af",
  },

  navIcon: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    borderRadius: 8,
    background: "#f1f5f9",
  },

  navLabelWrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  navLabel: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
  },

  navSmall: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 400,
    lineHeight: 1.3,
  },

  countPill: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 6,
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  },

  countPillActive: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },

  sidebarFooter: {
    paddingTop: 24,
    borderTop: "1px solid #e2e8f0",
  },

  contactCard: {
    padding: 20,
    borderRadius: 12,
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    border: "1px solid #bae6fd",
  },

  contactTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0c4a6e",
    marginBottom: 6,
  },

  contactText: {
    fontSize: 13,
    color: "#075985",
    marginBottom: 16,
    lineHeight: 1.5,
  },

  contactButton: {
    display: "block",
    width: "88%",
    padding: "10px 16px",
    borderRadius: 8,
    background: "#0284c7",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    transition: "all 0.2s",
  },

  /* Main Content */
  content: {
    flex: 1,
    padding: 40,
    boxSizing: "border-box",
    maxWidth: 1200,
    height: "100%",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },

  contentHeader: {
    marginBottom: 32,
  },

  contentTitle: {
    fontSize: 30,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: "-0.02em",
    margin: 0,
  },

  contentSubtitle: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: 400,
    margin: 0,
  },

  faqSection: {
    width: "100%",
  },

  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  faqItem: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    transition: "all 0.2s ease",
  },

  faqItemOpen: {
    borderColor: "#3b82f6",
    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.1)",
  },

  faqQuestion: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 24px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    outline: "none",
    transition: "background 0.2s",
  },

  questionNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  faqQText: {
    flex: 1,
    fontSize: 15,
    fontWeight: 400,
    color: "#0f172a",
    lineHeight: 1.5,
  },

  chevron: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
    color: "#64748b",
  },

  faqAnswer: {
    padding: "0 24px 24px 76px",
    borderTop: "1px solid #f1f5f9",
  },

  answerLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 12,
    marginTop: 20,
  },

  answerText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.7,
    fontWeight: 400,
  },

  emptyState: {
    padding: 80,
    textAlign: "center",
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: 400,
  },
};
