// import React, { useState, useEffect, useRef, useCallback } from "react";
// import Highcharts from "highcharts";
// import HighchartsReact from "highcharts-react-official";
// import { FiSend, FiMaximize2, FiMinimize2 } from "react-icons/fi";
// import { FaDatabase, FaFileAlt } from "react-icons/fa";
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// // import ChatPDF from "./Chatpdf";
// import { Send, X } from "lucide-react";
// import { readSSE } from "../sseClient";


// const ChatPage = () => {
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   const [query, setQuery] = useState("");
//   const [answer, setAnswer] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [suggestions, setSuggestions] = useState([]);
//   const [rotatingIndex, setRotatingIndex] = useState(0);
//   const [rotatingPlaceholder, setRotatingPlaceholder] = useState("");
//   const sessionIdRef = useRef(null);
//   const [sessionId, setSessionId] = useState(null);
//   const [lastAnsweredQuery, setLastAnsweredQuery] = useState("");
//   const didConnectRef = useRef(false);
//   const [summary, setSummary] = useState("");
//   const [serverRows, setServerRows] = useState([]);
//   const [rowCount, setRowCount] = useState(0);   // optional, for “too many rows” banner
//   const [tableExpanded, setTableExpanded] = useState(false);
//   const [sessionReady, setSessionReady] = useState(false);
//   const [typing, setTyping] = useState(false);     // streaming in-progress
//   const [liveText, setLiveText] = useState("");    // streamed text (what user sees “typing”)
//   const liveTextRef = useRef("");

//   const MORE_ROWS_RE = /\.\.\.\s*and\s+(\d+)\s+more\s+rows\.?$/i;
//   const moreRowsMatch = typeof answer === "string" ? answer.match(MORE_ROWS_RE) : null;
//   const displayAnswer = moreRowsMatch ? answer.replace(MORE_ROWS_RE, "").trim() : answer;
  
// useEffect(() => { liveTextRef.current = liveText; }, [liveText]);
// // --- TYPEWRITER QUEUE (add-only) ---
// const typingQueueRef = useRef([]);      // array of strings to animate
// const typingTimerRef = useRef(null);
// const TYPE_DELAY_MS = 12;               // speed: 12ms/char; tweak to taste

// const startTypewriter = useCallback(() => {
//   if (typingTimerRef.current) return;   // already running

//   typingTimerRef.current = setInterval(() => {
//     const q = typingQueueRef.current;
//     if (!q.length) {
//       clearInterval(typingTimerRef.current);
//       typingTimerRef.current = null;
//       return;
//     }
//     // take first string and emit one char
//     let head = q[0];
//     if (!head || head.length === 0) { q.shift(); return; }
//     const ch = head[0];
//     q[0] = head.slice(1);

//     setLiveText(prev => prev + ch);
//     liveTextRef.current = (liveTextRef.current || "") + ch;
//   }, TYPE_DELAY_MS);
// }, []);

// const enqueueForTyping = useCallback((s) => {
//   if (!s) return;
//   typingQueueRef.current.push(String(s));
//   startTypewriter();
// }, [startTypewriter]);

// useEffect(() => {
//   return () => {
//     if (typingTimerRef.current) {
//       clearInterval(typingTimerRef.current);
//       typingTimerRef.current = null;
//     }
//   };
// }, []);
// // --- END TYPEWRITER QUEUE ---



// useEffect(() => {
//     if (!sessionIdRef.current) {
//       const existing = sessionStorage.getItem("session_id");
//       if (existing) sessionIdRef.current = existing;
//       else {
//         const newId = crypto.randomUUID();
//         sessionStorage.setItem("session_id", newId);
//         sessionIdRef.current = newId;
//       }
//     }

    
    


//   const connectToDatabase = async () => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/connect_database/`, { method: "POST" });
//       const data = await res.json();
//       console.log("🔌 DB connection response:", data);

//       // if (res.ok && data.session_id) {
//       //   console.log("✅ Connected. Received session_id:", data.session_id);
//       //   setSessionId(data.session_id);
//       //   localStorage.setItem("session_id", data.session_id);
//       //   setSessionReady(true);
//       // } else {
//       //   console.error("❌ DB connection failed:", data?.error || "Unknown error");
//       //   setSessionReady(false);
//       // }
//       // inside connectToDatabase()
//       if (res.ok && data.session_id) {
//         console.log("✅ Connected. Received session_id:", data.session_id);
//         setSessionId(data.session_id);
//         localStorage.setItem("session_id", data.session_id);
//         setSessionReady(true);
//       } else if (res.ok && (data.message || data.user_id)) {
//         // sessionless success (your backend returns only a message + user_id)
//         console.warn("ℹ️ Connected without session_id (static credentials mode).");
//         setSessionId(null);
//         localStorage.removeItem("session_id");
//         setSessionReady(true);
//       } else {
//         console.error("❌ DB connection failed:", data?.error || "Unknown error");
//         setSessionReady(false);
//       }
//     } catch (err) {
//       console.error("⚠️ Error connecting to database:", err);
//       setSessionReady(false);
//     }
//   };

//   if (didConnectRef.current) return;
//   didConnectRef.current = true;

//   connectToDatabase(); // ⚠️ Always reconnect on reload
// }, [API_BASE_URL]);

// useEffect(() => {
//     if (sessionId) {
//       sessionIdRef.current = sessionId;
//     }
//   }, [sessionId]);

// useEffect(() => {
//     if (!sessionId) {
//       const storedSession = localStorage.getItem("session_id");
//       if (storedSession) {
//         console.log("Restoring session from localStorage:", storedSession);
//         setSessionId(storedSession);
//         // Optionally assume ready when restoring (comment out if you prefer to wait for fresh connect)
//         // setSessionReady(true);
//       }
//     }
//   }, [sessionId]);


// // Only treat text as a table if it looks tabular
// const looksTabular = (text = "") => {
//   if (!text) return false;

//   // Markdown table pattern (header + separator)
//   if (/\n?\s*\|.*\|\s*\n/.test(text) && /\n?\s*\|?\s*:?-{2,}/.test(text)) return true;

//   const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
//   if (lines.length < 2) return false;

//   // CSV/pipe/TSV lines: require at least 2 lines with >= 3 fields
//   const csvLike = lines.filter(l =>
//     (l.split(",").length >= 3) || (l.split("|").length >= 3) || (l.split("\t").length >= 3)
//   );
//   if (csvLike.length >= 2) return true;

//   // Key-value style lists: need >= 3 lines like "key: value" or "key - value"
//   const kvLike = lines.filter(l => /\s*[^:–-]+[:–-]\s+.+/.test(l));
//   return kvLike.length >= 3;
// };


// useEffect(() => {
//   const body = document.body;
//   const bgColor = window.getComputedStyle(body).backgroundColor;
//   const rgb = bgColor.match(/\d+/g);

//   if (rgb) {
//     const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
//     if (brightness < 128) {
//       body.classList.add('dark-mode');
//       body.classList.remove('light-mode');
//     } else {
//       body.classList.add('light-mode');
//       body.classList.remove('dark-mode');
//     }
//   }
// }, []);

//  const generateNextMonthQuestion = (question) => {
//   const monthsFull = [
//     "january", "february", "march", "april", "may", "june",
//     "july", "august", "september", "october", "november", "december"
//   ];

//   const monthsShort = {
//     jan: "january", feb: "february", mar: "march", apr: "april",
//     may: "may", jun: "june", jul: "july", aug: "august",
//     sep: "september", oct: "october", nov: "november", dec: "december"
//   };

//   const match = question.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i);

//   if (match) {
//     const normalized = monthsShort[match[0].toLowerCase()] || match[0].toLowerCase();
//     const index = monthsFull.indexOf(normalized);
//     if (index !== -1) {
//       const nextMonth = monthsFull[(index + 1) % 12];
//       return question.replace(new RegExp(match[0], 'i'), nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1));
//     }
//   }
//   return null;
// };

// // Dataset columns for context-aware suggestions
// const DATASET_COLUMNS = [
//   'rto_risk_factor', 'ncb_%_previous_year', 'state_risk_score', 'retention_rate_pct',
//   'total_od_premium_max', 'applicable_discount_with_ncb', 'policy_wise_purchase',
//   'manufacturer_risk_rate', 'days_between_renewals', 'retention_streak',
//   'total_od_premium_mean', 'total_od_premium', 'firstpolicyyear', 'lag_1_tp_premium',
//   'total_od_premium_min', 'avg_premium_hist', 'lag_1_ncb', 'age', 'total_tp_premium_max',
//   'total_tp_premium_mean', 'total_tp_premium', 'total_tp_premium_min', 'lag_1_premium',
//   'previous_year_premium_ratio', 'total_premium_payable', 'total_revenue', 'gst',
//   'fuel_type_risk_factor', 'lag_1_od_premium', 'customer_apv', 'segment_risk_score',
//   'vehicle_idv', 'policy_tenure', 'number_of_claims', 'approved', 'claim_approval_rate',
//   'customer_tenure', 'before_gst_add-on_gwp', 'od_tp_ratio', 'add_on_adoption',
//   'clv', 'idv_premium_ratio', 'customer_apf', 'days_gap_prev_end_to_curr_start',
//   'customerid', 'claim_happaned/not', 'branch_name', 'chassis_number',
//   'engine_number', 'reg_no', 'state', 'zone',
//   'biztype', 'corrected_name', 'make_clean', 'model_clean', 'product_name',
//   'policy_no', 'decline', 'tie_up', 'variant', 'policy_status',
//   'policy_start_date_year', 'policy_end_date_year', 'policy_start_date_month',
//   'policy_end_date_month', 'policy_start_date_day', 'policy_end_date_day',
//   'predicted_status', 'churn_probability', 'clv_category', 'discount_category',
//   'churn_category', 'customer_segment', 'not_renewed_reasons', 'main_reason',
//   'primary_recommendation', 'additional_offers', 'retention_channel'
// ];

// // Comprehensive suggestion templates organized by topic
// const SUGGESTION_TEMPLATES = {
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
//     // 'Show claim approval rate by state',
//     'What is the relationship between claims and churn?',
//     // 'Show claims distribution by vehicle age',
//     // 'Analyze claim patterns by manufacturer',
//     // 'Show claim frequency vs premium correlation',
//     // 'What are the most common claim scenarios?'
//   ],
//   customer: [
//     'Show customer lifetime value by segment',
//     // 'What are the characteristics of high-value customers?',
//     // 'Show customer tenure distribution',
//     // 'Analyze customer acquisition vs retention costs',
//     // 'Show customer segment migration patterns',
//     // 'What drives customer loyalty in insurance?'
//   ],
//   vehicle: [
//     // 'Show top 10 vehicle makes by policy count',
//     'What is the average IDV by vehicle make?',
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
//     'Show state-wise retention patterns',
//     // 'What are the regional growth opportunities?'
//   ],
//   discount: [
//     // 'Show NCB distribution across customers',
//     'What is the average discount by customer category?',
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
//     'What is the average of customer life time?',
//     'What insights can you provide?',
//     // 'Show IDV to premium ratio analysis',
//     'Give me a top 5 branches performing well',
//     'What is the churn rate by customer segment?',
//     'What is the distribution of vehicle IDV across different policy tenures?',
//     'What are the top churn reasons across all zones?',
//     'Which state has the highest revenue from policies not renewed?',
//     'Give me top 5 branches based on churn',
//     'Show state-wise retention patterns',
//     'Show churn probability by customer segment',
//     'What are the main reasons for not renewing?',
//     'Show retention rate by state and zone',
//     // 'Show me data overview',
//     'What are the key business metrics?'
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

//   // If we don't have enough suggestions, add from related topics
//   if (suggestions.length < 6) {
//     const relatedTopics = getRelatedTopics(primaryTopic);
    
//     relatedTopics.forEach(topic => {
//       if (suggestions.length < 6) {
//         const relatedSuggestions = SUGGESTION_TEMPLATES[topic] || [];
//         relatedSuggestions.forEach(text => {
//           if (suggestions.length < 6 && !usedSuggestions.has(text.toLowerCase())) {
//             suggestions.push({
//               text,
//               type: topic
//             });
//           }
//         });
//       }
//     });
//   }

//   // Database-specific suggestions
//   if (activeSource === 'database') {
//     if (userQuestion.includes('count') || userQuestion.includes('how many')) {
//       suggestions.push(
//         { text: 'Show breakdown by policy status', type: 'breakdown' },
//         { text: 'What is the average across different segments?', type: 'analytics' }
//       );
//     }
//   }

//   // File-specific suggestions
//   if (activeSource === 'file') {
//     if (userQuestion.includes('total') || userQuestion.includes('sum')) {
//       suggestions.push(
//         { text: 'Show detailed breakdown by category', type: 'breakdown' },
//         { text: 'Create a visualization of this data', type: 'visualization' }
//       );
//     }
//   }

//   // Chart suggestions if data is available
//   if (lastAssistantMessage && lastAssistantMessage.rows && lastAssistantMessage.rows.length > 0) {
//     if (suggestions.length < 6) {
//       suggestions.push(
//         { text: 'Create a chart visualization of this data', type: 'chart' },
//         { text: 'Show correlation analysis', type: 'correlation' }
//       );
//     }
//   }

//   // Ensure we have exactly 6 suggestions
//   const finalSuggestions = suggestions.slice(0, 6);
  
//   // If still not enough, fill with general suggestions
//   while (finalSuggestions.length < 6) {
//     const remainingGeneral = SUGGESTION_TEMPLATES.general.filter(text => 
//       !finalSuggestions.some(s => s.text === text) && !usedSuggestions.has(text.toLowerCase())
//     );
    
//     if (remainingGeneral.length > 0) {
//       finalSuggestions.push({
//         text: remainingGeneral[0],
//         type: 'general'
//       });
//     } else {
//       break;
//     }
//   }

//   return finalSuggestions;
// };

// // Helper function to get related topics
// const getRelatedTopics = (primaryTopic) => {
//   const topicRelations = {
//     churn: ['customer', 'recommendations', 'premium'],
//     premium: ['customer', 'vehicle', 'regional'],
//     claims: ['risk', 'vehicle', 'customer'],
//     customer: ['churn', 'premium', 'recommendations'],
//     vehicle: ['premium', 'risk', 'claims'],
//     regional: ['premium', 'risk', 'customer'],
//     discount: ['customer', 'premium', 'churn'],
//     risk: ['vehicle', 'claims', 'regional'],
//     recommendations: ['customer', 'churn', 'premium'],
//     temporal: ['premium', 'customer', 'churn'],
//     general: ['customer', 'premium', 'churn'],
//     conversational: ['general', 'fun'],
//     fun: ['general', 'conversational']
//   };

//   return topicRelations[primaryTopic] || ['general'];
// };

// // Function to refresh suggestions (call this after user clicks a suggestion)
// const refreshSuggestions = (messages, activeSource, connectedDbDetails) => {
//   return generateDynamicSuggestions(messages, activeSource, connectedDbDetails, true);
// };

// // Normalizes responses from ask_question / ask_qwen / askbot
// const normalizeAnswer = (data) => {
//   // If classic shape: { answer, summary }
//   if (typeof data?.answer === "string" && data.answer.trim()) {
//     return {
//       answer: data.answer.trim(),
//       summary: (data.summary || "").trim(),
//       sources: Array.isArray(data.sources) ? data.sources : [],
      
//     };
//   }
// // askbot shape
//   const mode = (data?.mode || "").toLowerCase();
//   const pdf = (data?.pdf_answer || "").trim();
//   const gen = (data?.general_answer || "").trim();

//   let parts = [];
//   if (mode === "both") {
//     const hasPdf = pdf && pdf.toLowerCase() !== "i don't know.";
//     if (hasPdf) parts.push(`**PDF-based answer**\n${pdf}`);
//     if (gen) parts.push(`**General answer**\n${gen}`);
//   } else if (mode === "pdf_only") {
//     if (pdf) parts.push(pdf);
//   } else if (mode === "general_only") {
//     if (gen) parts.push(gen);
//   } else {
//     // Unknown mode: pick whatever exists
//     if (pdf) parts.push(pdf);
//     if (gen) parts.push(gen);
//   }

//   let answer = parts.join("\n\n").trim();
//   if (!answer && pdf) answer = pdf;
//   if (!answer && gen) answer = gen;
//   const sources = Array.isArray(data?.sources) ? data.sources : [];
//   if (sources.length) answer += `\n\n_Sources:_ ${sources.join(", ")}`;

//   return {
//     answer: answer || "No response found.",
//     summary: (data?.summary || "").trim(),
//     sources
//   };
// };
// // helper — keep it near top-level of component/file
// const parseAnswerToTable = (text = "") => {
//   if (!text || !text.trim()) return { columns: [], rows: [] };
//   const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

//   const mdTable = lines.filter(l => /^\|.*\|$/.test(l));
//   if (mdTable.length >= 2) {
//     const clean = mdTable.filter(l => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l));
//     const head = clean[0].split("|").map(s => s.trim()).filter(Boolean);
//     const body = clean.slice(1).map(r => r.split("|").map(s => s.trim()).filter(Boolean));
//     const columns = head.length ? head : body[0]?.map((_, i) => `Col ${i + 1}`) || [];
//     const rows = body.map(arr => {
//       const o = {}; columns.forEach((c, i) => (o[c] = arr[i] ?? "")); return o;
//     });
//     return { columns, rows };
//   }

//   const splitLine = l => {
//     if (l.includes("|")) return l.split("|").map(s => s.trim()).filter(Boolean);
//     if (l.includes(",")) return l.split(",").map(s => s.trim()).filter(Boolean);
//     if (l.includes("\t")) return l.split("\t").map(s => s.trim()).filter(Boolean);
//     const kv = l.split(/\s*[:\-–]\s*/);
//     if (kv.length > 1) return kv.map(s => s.trim()).filter(Boolean);
//     return [l];
//   };

//   const parts = lines.map(splitLine);

//   // Guard 1: reject accidental tables from single-line prose
//   if (parts.length < 2) return { columns: [], rows: [] };

//   const width = Math.max(...parts.map(p => p.length));

//   // Guard 2: if width == 2 (Metric/Value pattern), require at least 3 lines
//   if (width === 2 && parts.length < 3) return { columns: [], rows: [] };

//   if (!width || (width === 1 && parts.length <= 1)) return { columns: [], rows: [] };

//   const headers = width === 2 ? ["Metric", "Value"] : Array.from({ length: width }, (_, i) => `Col ${i + 1}`);
//   const rows = parts.map(arr => {
//     const o = {}; headers.forEach((h, i) => (o[h] = arr[i] ?? "")); return o;
//   });
//   return { columns: headers, rows };
// };



// // Export functions
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = {
//     generateDynamicSuggestions,
//     refreshSuggestions,
//     generateNextMonthQuestion,
//     SUGGESTION_TEMPLATES,
//     DATASET_COLUMNS
//   };
// }

// const checkIntentAndAskStreaming = async (question, userId = "admin") => {
//   if (!question?.trim() || typing) return;

//   // Start “typing”
//   setTyping(true);
//   setLiveText("");
//   setAnswer("");         // clear old answer card if you want
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
//   setLastAnsweredQuery(question);
//   setMessages(prev => [...prev, { role: "user", content: question }]);

//   // (Optional) keep your intent check; or call the stream endpoint directly.
//   // Here we call the streaming endpoint directly:
//   const resp = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json","Accept": "text/event-stream"  },
//     cache: "no-store",
//     body: JSON.stringify({ question, user_id: userId }),
//   });

//   if (!resp.ok || !resp.body) {
//     setTyping(false);
//     setAnswer("Streaming failed. Falling back to normal request.");
//     return;
//   }

//   let finalResult = null;

//   await readSSE(resp, {
//     onToken: (chunk) => enqueueForTyping(chunk),
//     onGenDone: () => {/* optional marker */},
//     onResult: (payload) => { finalResult = payload; },
//     onDone: () => {
//    const settle = () => {
//      const stillTyping = typingQueueRef.current.length > 0 || typingTimerRef.current;
//      if (stillTyping) { setTimeout(settle, 30); return; }

//      setTyping(false);
//      if (finalResult?.success) {
//   // ✅ Only the streamed text goes into `answer`
//   setAnswer(liveTextRef.current || "");
//   setSummary(finalResult.summary || "");
//   setServerRows(Array.isArray(finalResult.rows) ? finalResult.rows : []);
//   setRowCount(typeof finalResult.row_count === "number" ? finalResult.row_count : 0);
//   setMessages((msgs) => msgs.concat([{
//     role: "assistant",
//     content: liveTextRef.current || "",
//     rows: finalResult.rows,
//     query_used: finalResult.query_used,
//     chart_config: finalResult.chart_config,
//     summary: finalResult.summary
//   }]));
// } else {
//   // ✅ No summary fallback into `answer` here either
//   if (!answer) setAnswer(liveTextRef.current || "");
//   setMessages((msgs) => msgs.concat([{ role: "assistant", content: liveTextRef.current || "" }]));
// }
//    };
//    settle();
//  },

//     onError: (e) => {
//       setTyping(false);
//       setAnswer(`Streaming error: ${e?.message || e}`);
//     },
//   });
// };


// const checkIntentAndAsk = async () => {
//   if (!query.trim() || isLoading) return;

//   const asked = query;
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setAnswer("");
//   setSummary("");

//   try {
//     // Intent -> choose endpoint
//     let endpoint = "ask_question";
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked })
//       });
//       const intentData = await intentRes.json();
//       const intent = intentData?.answer?.toUpperCase?.() || "NO";
//       if (intent !== "YES") endpoint = "ask_qwen";  // small-talk/general -> askbot
//     } catch {
//       endpoint = "ask_question";
//     }

//     const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });
//     const data = await res.json();

//     // 🔎 Debug logging — add here
//     if (data?.query_used) {
//       if (typeof console.groupCollapsed === "function") {
//         console.groupCollapsed("🔍 API Debug");
//         console.log("SQL used:\n", data.query_used);
//         console.log("Rows:", data.row_count, "Response time:", data.response_time);
//         console.groupEnd();
//       } else {
//         console.log("🔍 SQL used:\n", data.query_used);
//         console.log("Rows:", data.row_count, "Response time:", data.response_time);
//       }
//     }

//     const norm = normalizeAnswer(data);
//     setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//     setAnswer(norm.answer);
//     setSummary(norm.summary);
//     setServerRows(Array.isArray(data.rows) ? data.rows : []);
//     setRowCount(typeof data.row_count === "number" ? data.row_count : (Array.isArray(data.rows) ? data.rows.length : 0));
//   } catch (e) {
//     setAnswer("Something went wrong.");
//     setSummary("");
//   }

//   setIsLoading(false);
//   setQuery("");
// };

// const downloadCSV = async (questionText) => {
//     try {
//       const actualQuestion = questionText || lastAnsweredQuery || query;
//       if (!actualQuestion) {
//         alert("Missing question for download.");
//         return;
//       }
//       const encoded = encodeURIComponent(actualQuestion);
//       const url = `${API_BASE_URL}/ask_question/?export=true&question=${encoded}`;
//       const response = await fetch(url, {
//         method: "GET",
//         headers: { Accept: "text/csv" },
//       });
//       if (!response.ok) {
//         const errorText = await response.text();
//         alert(`Download failed: ${errorText}`);
//         return;
//       }
//       const blob = await response.blob();
//       const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
//       const filename = `export_${ts}.csv`;
//       const href = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = href;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(href);
//     } catch (error) {
//       alert(`Download failed: ${error.message}`);
//     }
//   };


//   useEffect(() => {
//     const newSuggestions = generateDynamicSuggestions(messages, "file", null);
//     setSuggestions(newSuggestions);
//   }, [messages]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setRotatingIndex(prev => {
//         const next = (prev + 1) % suggestions.length;
//         setRotatingPlaceholder(suggestions[next]?.text || "");
//         return next;
//       });
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [suggestions]);

//   useEffect(() => {
//     if (!query && suggestions.length > 0) {
//       setRotatingPlaceholder(suggestions[0]?.text || "");
//     }
//   }, [suggestions]);

  

//   useEffect(() => {
//     if (!query && suggestions.length > 0) {
//       setRotatingPlaceholder(suggestions[0]?.text || "");
//     }
//   }, [suggestions]);



// // Pretty header labels: remove _/-, split camelCase, Title Case,
// // and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
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

//   // Formats numbers (or numeric strings) to exactly 2 decimals.
// // Keeps non-numeric values as-is. Handles commas and trailing %.
// // const formatCell = (val) => {
// //   if (val === null || val === undefined) return "";
// //   const s = String(val).trim();

// //   // numeric or numeric with commas and optional %
// //   const looksNumeric = /^[-+]?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?%?$/.test(s);
// //   if (typeof val === "number" || looksNumeric) {
// //     const isPercent = s.endsWith("%");
// //     const num = typeof val === "number"
// //       ? val
// //       : Number(s.replace(/,/g, "").replace(/%$/, ""));
// //     if (Number.isFinite(num)) {
// //       const out = num.toLocaleString(undefined, {
// //         minimumFractionDigits: 2,
// //         maximumFractionDigits: 2,
// //       });
// //       return isPercent ? `${out}%` : out;
// //     }
// //   }
// //   return s;
// // };

// const USE_STREAM = true;

// const onSubmit = () => {
//   if (USE_STREAM) checkIntentAndAskStreaming(query);
//   else checkIntentAndAsk();
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

// // Normalize a time unit string to its base word
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

// // Correct singular/plural form based on numeric value
// const pluralizeTimeUnit = (unit, value) => {
//   const base = normalizeTimeUnit(unit);
//   const v = Math.abs(Number(value));
//   const irregularPlural = { Day: "Days" };
//   const defaultPlural   = base.endsWith("s") ? base : base + "s";
//   const pluralWord      = irregularPlural[base] || defaultPlural;
//   return v === 1 ? base : pluralWord;         // 1 -> singular, everything else -> plural
// };

// // Detect if the raw cell already has a time unit to avoid double appending
// const cellAlreadyHasTimeUnit = (raw, unit) => {
//   const base = normalizeTimeUnit(unit);
//   if (!base) return false;
//   const re = new RegExp(`\\b${base}(?:s)?\\b`, "i"); // matches Month/Months, Year/Years, etc.
//   return re.test(raw);
// };

// /** Infer unit from column name + sample values (safe for categorical columns) */
// const inferUnitForColumn = (key, rows) => {
//   const k = String(key || "").toLowerCase();

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
// // Use this instead of plain formatCell() when rendering table cells.
// const formatCellForColumn = (key, val, rows) => {
//   const { type, unit } = inferUnitForColumn(key, rows);

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


// /** Build header like "Policy Tenure (Months)" or "Churn Rate (%)" */
// const buildHeaderLabel = (key, rows) => {
//   const { unit } = inferUnitForColumn(key, rows);
//   const base = formatHeader(key); // your existing pretty title
//   if (!unit) return base;

//   // strip units already stuck to the name
//   const cleaned = base
//     .replace(/\s*%$/i, "")
//     .replace(/\s*\b(Years?|Months?|Weeks?|Days?)\b$/i, "")
//     .trim();

//   return `${cleaned} (${unit})`;
// };

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

// //   // Time: append the unit; for Year(s) show plain integer (no grouping)
// // if (type === "time") {
// //   // If the cell already contains a time unit, leave it as-is
// //   if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

// //   const baseUnit  = normalizeTimeUnit(unit);
// //   const unitLabel = pluralizeTimeUnit(baseUnit, n);

// //   const out =
// //     baseUnit === "Year"
// //       ? String(Math.trunc(n)) // avoid 2,025-style grouping
// //       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// //   return `${out} ${unitLabel}`;
// // }


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
//     // if (baseUnit === "Year" && isNum && n >= 1900 && n <= 2100) {
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





//   return (
//     <>
//       <style>{`
//       body.light-mode {
//     --chat-text-color: #000;
//     --input-bg-color: rgba(255, 255, 255, 0.9);
//   }

//   body.dark-mode {
//     --chat-text-color: #fff;
//     --input-bg-color: rgba(15, 15, 15, 0.3);
//   }
//         .assistant-container {
//           .assistant-container {
//           position: relative;
//           z-index: 9999;
//           width: 100%;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           left: 40px;
//         }
//         .assistant-input-wrapper {
//     display: flex;
//     align-items: center;
//     width: 100%;
//     background: var(--input-bg-color);
//     backdrop-filter: blur(20px);
//     border: 1px solid rgba(255, 255, 255, 0.2);
//     border-radius: 30px;
//     padding: 10px 20px;
//     box-shadow:
//       0 8px 32px rgba(0, 0, 0, 0.1),
//       0 0 8px 2px rgba(37, 99, 235, 0.5);
//     transition: box-shadow 0.3s ease;
//   }
//         .assistant-input {
//     flex: 1;
//     border: none;
//     background: transparent;
//     font-size: 16px;
//     outline: none;
//     padding: 5px 10px;
//     color: var(--chat-text-color);
//   }


// .response-header {
//   position: relative;               /* anchor for the close button */
//   display: flex;
//   align-items: center;
//   padding: 6px 40px 8px 0;          /* right padding so text doesn’t sit under the X */
//   margin-bottom: 8px;
//   font-weight: 600;
// }

// .close-btn {
//   position: absolute;
//   top: -1px;
//   right: 8px;
//   width: 20px;
//   height: 20px;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 9999px;
//   background: rgba(255, 255, 255, 0.9);
//   color: #0f172a;
//   border: 1px solid rgba(0,0,0,0.1);
//   cursor: pointer;
//   box-shadow: 0 2px 10px rgba(0,0,0,0.08);
// }

// .close-btn:hover { background: #f5a48fff; transform: translateY(-1px); }
// .close-btn:active { transform: translateY(0); }
//         .response-body {
//     color: var(--chat-text-color);
//   }
//         .ask-button {
//           background: rgba(37, 99, 235, 0.8);
//           backdrop-filter: blur(10px);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           color: white;
//           border-radius: 9999px;
//           padding: 8px 12px;
//           cursor: pointer;
//           transition: all 0.3s ease;
//         }
//           .assistant-input::placeholder {
//     color: var(--chat-text-color);
//     opacity: 0.7;
//   }
//           .user-question {
//     color: var(--chat-text-color);
//   }

//       .markdown-scroll-wrapper {
//   overflow-x: hidden;
//   width: 100%;
// }

// .markdown-scroll-wrapper table {
//   width: max-content;
//   min-width: 100%;
//   border-collapse: collapse;
// }

// .assistant-response p,
// .assistant-response span {
//   word-break: break-word;
//   white-space: normal;
// }

// .response-body {
//   overflow-wrap: break-word;
//   word-break: break-word;
//   white-space: normal;
// }

//  :root {
//   --shadow-md: 0 12px 40px rgba(0, 0, 0, 0.15);
//   --border-soft: rgba(255, 255, 255, 0.2);
//   --border-table: rgba(255, 255, 255, 0.12);
//   --surface-tableHeader: rgba(255, 255, 255, 0.06);
//   --text-primary: #e5e7eb;
//   --text-muted: #94a3b8;
//   --accent-yellow: #facc15;
//   --input-bg-color: rgba(255, 255, 255, 0.06);
// }

// .resultTableWrapper--alt {
//   margin-top: 1rem;
//   padding: 0.5rem;
//   border-radius: 14px;
//   background: rgba(255, 255, 255, 0.04);
//   backdrop-filter: blur(10px);
//   -webkit-backdrop-filter: blur(10px);
//   box-shadow: var(--shadow-md);
//   overflow: auto;                 /* scroll container */
//   border: 1px solid var(--border-soft);
//   max-height: 380px;              /* adjust as needed */
// }

// .resultTable--alt {
//   width: 100%;
//   border-collapse: separate;
//   border-spacing: 0;
//   font-size: 0.92rem;
//   color: var(--text-primary);
// }

// /* Header */
// .resultTable--alt thead th {
//   position: sticky;
//   top: 0;
//   z-index: 1;
//   background: linear-gradient(135deg, #1e3a8a 50%, #0f172a 97%) !important;
//   color: #fff; /* or keep var(--accent-yellow) if you prefer */
//   text-transform: none;
//   letter-spacing: 0.2px;
//   padding: 12px 14px;
//   border-bottom: 1px solid var(--border-table);
//   font-weight: 700;
// }
// .resultTable--alt thead th:first-child { border-top-left-radius: 10px; }
// .resultTable--alt thead th:last-child  { border-top-right-radius: 10px; }

// /* Cells */
// .resultTable--alt td {
//   padding: 12px 14px;
//   border-bottom: 1px solid rgba(116, 56, 177, 0.95);
// }
// /* Stronger contrast for table rows (alt table) */
// .resultTable--alt tbody tr:nth-child(odd)  { 
//   background: rgba(228, 231, 236, 1) !important;  /* slate/near-navy */
// }
// .resultTable--alt tbody tr:nth-child(even) { 
//   background: rgba(211, 212, 214, 0.97) !important;  /* slate/near-navy */
// }
// .resultTable--alt tbody tr:hover { 
//   background: rgba(99, 102, 241, 0.22) !important; /* keep your hover cue */
// }

// /* Rounded row bottoms */
// .resultTable--alt tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
// .resultTable--alt tbody tr:last-child td:last-child  { border-bottom-right-radius: 10px; }

// /* Align numbers to the right and use tabular figures */
// .resultTable--alt th:nth-child(n+2),
// .resultTable--alt td:nth-child(n+2) {
//   text-align: right;
//   font-variant-numeric: tabular-nums;
//   font-feature-settings: "tnum" 1;
// }

// /* ---------- Result table (dark) ---------- */
// .resultTableWrapper {
//   margin-top: 1.25rem;
//   padding: 1rem;
//   border-radius: 12px;
//   background: rgba(249, 251, 252, 0.91);
//   backdrop-filter: blur(10px);
//   -webkit-backdrop-filter: blur(10px);
//   box-shadow: var(--shadow-md);
//   overflow-x: auto;
//   border: 1px solid var(--border-soft);
// }

// .resultTable {
//   width: 100%;
//   border-collapse: collapse;
//   color: var(--text-primary);
//   font-size: 0.9rem;
// }

// .resultTable th {
//   background-color: var(--surface-tableHeader);
//   color: var(--accent-yellow);
//   padding: 0.65rem;
//   border: 1px solid var(--border-table);
//   text-align: left;
// }

// .resultTable td {
//   padding: 0.6rem;
//   border: 1px solid var(--border-table);
// }

// .warningBox {
//   padding: 10px 12px;
//   background: #fffbe6;
//   border: 1px solid #ffe58f;
//   border-radius: 8px;
//   font-size: 14px;
//   margin: 8px 0;
//   color: #92400e;
// }

// .downloadLink {
//   background: none;
//   border: none;
//   color: var(--accent-yellow);
//   cursor: pointer;
//   text-decoration: underline;
//   padding: 0;
// }

// .resultTableCell { /* if you want extra cell styles beyond .resultTable th/td */
//   padding: 0.6rem;
//   border: 1px solid var(--border-table);
//    textAlign: "center",       // <--- center text horizontally
//    verticalAlign: "middle",
// }

// .collapseButton {
//   text-align: right;
//   margin-top: 6px;
// }

// .collapseButtonLink {
//   background: none;
//   border: none;
//   color: #60a5fa;
//   cursor: pointer;
//   text-decoration: underline;
//   padding: 0;
// }

// .expandNote {
//   padding: 0.5rem;
//   font-size: 0.875rem;
//   text-align: center;
//   color: var(--text-muted);
// }

// /* Assistant card */
// .assistant-response {
//   position: relative;
//   width: 100%;
//   max-height: 300px; /* keep only one */
//   overflow-y: auto;
//   margin-bottom: 10px;
//   background: var(--input-bg-color);
//   backdrop-filter: blur(25px);
//   border: 1px solid rgba(255, 255, 255, 0.2);
//   border-radius: 16px;
//   padding: 20px;
//   box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
//   animation: fadeInUp 0.4s ease;
//   left: 0;
// }


//        .assistant-response {
//         max-height: 300px; 
//   position: relative;
//   width: 100%;
//   max-height: 300px; /* Set your preferred max height */
//   overflow-y: auto;
//   margin-bottom: 10px;
//   background: var(--input-bg-color);
//   backdrop-filter: blur(25px);
//   border: 1px solid rgba(255, 255, 255, 0.2);
//   border-radius: 16px;
//   padding: 20px;
//   box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
//   animation: fadeInUp 0.4s ease;
//   left: 0px;
// }

//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//           @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//       `}
//       </style>


      

//      {/* <div className="assistant-container">
//   {answer && (
//     <div className="assistant-response">
//       <div className="response-header">
//         <strong className="user-question">{query}</strong>
//         <X size={16} onClick={() => setAnswer("")} className="close-btn" />
//       </div>

//       <div className="response-body">
//         <div className="markdown-scroll-wrapper">
//   {answer.includes("- ") || answer.includes("\n") ? (
//     <ReactMarkdown
//       remarkPlugins={[remarkGfm]}
//       components={{
//         ul: ({ node, ...props }) => (
//           <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />
//         ),
//         ol: ({ node, ...props }) => (
//           <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }} {...props} />
//         ),
//         li: ({ node, ...props }) => (
//           <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }} {...props} />
//         ),
//         p: ({ node, ...props }) => (
//           <p style={{ marginBottom: '1rem', lineHeight: '1.6' }} {...props} />
//         ),
//         table: ({ node, ...props }) => (
//           <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }} {...props} />
//         ),
//         th: ({ node, ...props }) => (
//           <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }} {...props} />
//         ),
//         td: ({ node, ...props }) => (
//           <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />
//         ),
//       }}
//     >
//       {answer}
//     </ReactMarkdown>
//   ) : (
//     <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
//       {answer.split(/(?<=[0-9])\s+(?=[A-Z])/).map((item, idx) =>

//         item.trim() && (
//           <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
//             {item.trim()}
//           </li>
//         )
//       )}
//     </ul>
//   )}

//   {answer.includes("please download") && (
//     <button
//       className="download-button"
//       onClick={() => downloadCSV(sessionIdRef.current, query, lastAnsweredQuery)}
//     >
//       ⬇ Download Full CSV
//     </button>
//   )}
// </div>
//       </div>
  
//             {/* <div className="response-body">{answer}</div> */}
//           {/* </div>
//         )}

//         <div className="assistant-input-wrapper">
//           <input
//   type="text"
//   className="assistant-input"
//   placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
//   value={query}
//   onChange={(e) => setQuery(e.target.value)}
//   onClick={() => {
//     if (!query.trim() && rotatingPlaceholder) {
//       setQuery(rotatingPlaceholder);
//     }
//   }}
//   onKeyDown={(e) => e.key === "Enter" && checkIntentAndAsk()}
// />

//           <button 
//             className="ask-button" 
//             onClick={checkIntentAndAsk} 
//             disabled={isLoading || !query.trim() || !sessionId}

//           >
//             {isLoading ? (
//               <div style={{ 
//                 width: 18, 
//                 height: 18, 
//                 border: '2px solid transparent',
//                 borderTop: '2px solid white',
//                 borderRadius: '50%',
//                 animation: 'spin 1s linear infinite'
//               }} />
//             ) : (
//               <Send size={18} />
//             )}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }; */}
// <div className="assistant-container">
//   {/* {answer && ( */}
//   {/* {(answer || typing) && ( */}
//   {(answer || typing || summary || (serverRows && serverRows.length > 0)) && (
//     <div className="assistant-response">
      
//       <div className="response-header">
//         {/* <strong className="user-question">{query}</strong> */}
//         <strong className="user-question" style={{ fontFamily: "'Titillium Web', 'Segoe UI', sans-serif", fontWeight: 700 }}>{lastAnsweredQuery || query}</strong>
//         <X size={16} onClick={() =>  { setAnswer(""); setSummary(""); }} className="close-btn" />
//       </div>

//       <div className="response-body">
//         <div className="markdown-scroll-wrapper">

//           {/* 🔴 STREAMING TEXT FIRST */}
//     {typing && (
//       <div style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
//         {liveText || "Thinking..."}
//       </div>
//     )}
//           {/* Unified table renderer (uses msg.rows if present, else parses displayAnswer) */}
//             {/* Replace the entire ReactMarkdown/list branch with this */}
// {(() => {
//   // 1) If backend provided rows, trust that as tabular.
//   const hasServerRows = Array.isArray(serverRows) && serverRows.length > 0 &&
//     typeof serverRows[0] === "object" && Object.keys(serverRows[0] || {}).length >= 2;

//   // 2) If no rows from server, decide from text shape.
//   const canParseText = !hasServerRows && looksTabular(displayAnswer);

//   // 3) Parse only if it looks tabular; otherwise keep rows empty so we fall back to Markdown.
//   const parsed = canParseText ? parseAnswerToTable(displayAnswer) : { columns: [], rows: [] };

//   // 4) Choose rows source
//   const tableRows = hasServerRows ? serverRows : parsed.rows;

//   if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
//   // If the whole answer is one number, pretty-print it
//   const solo = formatStandaloneNumber(displayAnswer);
//   if (solo !== null) {
//     return (
//       <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
//         {solo}
//       </div>
//     );
//   }

//   // Otherwise render as markdown as usual
//   return (
//     <ReactMarkdown remarkPlugins={[remarkGfm]}>
//       {displayAnswer}
//     </ReactMarkdown>
//   );
// }


//   // 5) If not truly tabular, render plain Markdown (this fixes your "intent = NO" case)
//   // if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
//   //   return (
//   //     <ReactMarkdown remarkPlugins={[remarkGfm]}>
//   //       {displayAnswer || "_No content._"}
//   //     </ReactMarkdown>
//   //   );
//   // }

//   const columns = Object.keys(tableRows[0] || {});
//   const total = rowCount || tableRows.length;
//   const tooMany = total > 50;
//   const visibleRows = tableExpanded ? tableRows : tableRows.slice(0, 8);
//   const visibleCols = tableExpanded ? columns : columns.slice(0, 3);

//   return (
//     <>
//       {tooMany && (
//         <div className="warningBox">
//           Too many results to display ({total} rows).{" "}
//           <button
//             className="downloadLink"
//             onClick={() => downloadCSV(lastAnsweredQuery || query)}
//           >
//             Download full results (CSV)
//           </button>
//         </div>
//       )}

//       {!tooMany && tableRows.length >= 1 && (
//         <div className="resultTableWrapper resultTableWrapper--alt">
//           <table className="resultTable resultTable--alt"  >
//             {/* <thead>
//               <tr>
//                 {visibleCols.map((key) => (
//                   <th key={key} className="resultTableCell">{formatHeader(key)}</th>
//                 ))}
//               </tr>
//             </thead> */}

//             <thead>
//                   <tr>
//                     {visibleCols.map((key) => (
//                       <th key={key} className="resultTableCell">
//                         {buildHeaderLabel(key, tableRows)}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>

//             {/* <tbody>
//               {visibleRows.map((row, i) => (
//                 <tr key={i}>
//                   {visibleCols.map((k) => (
//                     <td key={k} className="resultTableCell">
//                         {formatCellWithUnit(row[k], k, tableRows)}
//                       </td>
//                   ))}
//                 </tr>
//               ))}
//               {tableRows.length > 8 && !tableExpanded && (
//                 <tr>
//                   <td colSpan={Math.min(3, columns.length)} className="expandNote">
//                     Showing first 8 rows.{" "}
//                     <button onClick={() => setTableExpanded(true)}>
//                       Click to expand <FiMaximize2 size={16} />
//                     </button>
//                   </td>
//                 </tr>
//               )}
//             </tbody> */}
//             <tbody>
//   {visibleRows.map((row, i) => (
//     <tr key={i}>
//       {visibleCols.map((k) => (
//         <td key={k} className="resultTableCell">
//           {formatCellForColumn(k, row[k], tableRows)}
//         </td>
//       ))}
//     </tr>
//   ))}
//   {tableRows.length > 8 && !tableExpanded && (
//     <tr>
//       <td colSpan={Math.min(3, columns.length)} className="expandNote">
//         Showing first 8 rows.{" "}
//         <button onClick={() => setTableExpanded(true)}>
//           Click to expand <FiMaximize2 size={16} />
//         </button>
//       </td>
//     </tr>
//   )}
// </tbody>

//           </table>

//           {tableExpanded && (
//             <div className="collapseButton">
//               <button
//                 onClick={() => setTableExpanded(false)}
//                 className="collapseButtonLink"
//               >
//                 Click to collapse <FiMinimize2 size={16} />
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </>
//   );
// })()}


//           {/* {displayAnswer.includes("- ") || displayAnswer.includes("\n") ? (
//             <ReactMarkdown
//               remarkPlugins={[remarkGfm]}
//               components={{
//                 ul: ({ node, ...props }) => (
//                   <ul
//                     style={{
//                       paddingLeft: "1.5rem",
//                       marginBottom: "1rem",
//                       listStyleType: "disc",
//                     }}
//                     {...props}
//                   />
//                 ),
//                 ol: ({ node, ...props }) => (
//                   <ol
//                     style={{
//                       paddingLeft: "1.5rem",
//                       marginBottom: "1rem",
//                       listStyleType: "decimal",
//                     }}
//                     {...props}
//                   />
//                 ),
//                 li: ({ node, ...props }) => (
//                   <li style={{ marginBottom: "0.5rem", lineHeight: "1.6" }} {...props} />
//                 ),
//                 p: ({ node, ...props }) => (
//                   <p style={{ marginBottom: "1rem", lineHeight: "1.6" }} {...props} />
//                 ),
//                 table: ({ node, ...props }) => (
//                   <table
//                     style={{
//                       width: "100%",
//                       borderCollapse: "collapse",
//                       marginBottom: "1rem",
//                     }}
//                     {...props}
//                   />
//                 ),
//                 th: ({ node, ...props }) => (
//                   <th
//                     style={{
//                       border: "1px solid #ddd",
//                       padding: "8px",
//                       fontWeight: "bold",
//                       backgroundColor: "#f9f9f9",
//                     }}
//                     {...props}
//                   />
//                 ),
//                 td: ({ node, ...props }) => (
//                   <td style={{ border: "1px solid #ddd", padding: "8px" }} {...props} />
//                 ),
//               }}
//             >
//               {displayAnswer}
//             </ReactMarkdown>
//           ) : (
//             <ul style={{ paddingLeft: "1.5rem", listStyleType: "disc" }}>
//               {(
//                 // Split into chunks like:
//                 // "Renewed Customers, 124..." | "Low Value Customers, 79..." | ...
//                 displayAnswer.split(/(?<=\d)\s+(?=[A-Z])/)
//               ).map((chunk, idx) => {
//                 const parts = chunk
//                   .split(",")
//                   .map((s) => s.trim())
//                   .filter(Boolean);

//                 if (!parts.length) return null;

//                 const [label, ...vals] = parts;

//                 // Fallback: if it isn't in "Label, value, value..." shape
//                 if (!vals.length) {
//                   const fallback = parts.join(" - ");
//                   return (
//                     <li key={idx} style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>
//                       {fallback}
//                     </li>
//                   );
//                 } */}

//                 {/* // Preferred: Label + sub-bullets of values
//                 return (
//                   <li key={idx} style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
//                     <strong>{label}</strong>
//                     <ul
//                       style={{
//                         paddingLeft: "1.25rem",
//                         marginTop: "0.25rem",
//                         listStyleType: "circle",
//                       }}
//                     >
//                       {vals.map((v, i) => (
//                         <li key={i} style={{ marginBottom: "0.25rem" }}>
//                           {v}
//                         </li>
//                       ))}
//                     </ul>
//                   </li>
//                 );
//               })}
//             </ul>
//           )} */}

//           {/* {typing && (
//   <div style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
//     {liveText || "Thinking..."}
//   </div>
// )} */}
//     {( (answer || liveText) && summary ) && <div style={{height: 8}} />}


//            {/* >>> ADD SUMMARY HERE (inside the same card, under the answer) <<< */}
//           {summary && (
//             <div
//               style={{
//                 marginTop: "12px",
//                 padding: "12px 14px",
//                 borderLeft: "4px solid #facc15",
//                 borderRadius: "8px",
//                 background: "var(--input-bg-color)"
//               }}
//             >
//               <div style={{ fontWeight: 600, marginBottom: "6px" }}></div>
//               <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                 {summary}
//               </ReactMarkdown>
//             </div>
//           )}

          
//           {/* {answer.includes("please download") && (
//   <button
//     className="download-button"
//     onClick={() => downloadCSV(lastAnsweredQuery || query)}
//   >
//     ⬇ Download Full CSV
//   </button>
// )} */}

// {/* {moreRowsMatch && (
//   <button
//     className="download-button"
//     onClick={() => downloadCSV(lastAnsweredQuery || query)}
//     title={`Show remaining ${Number(moreRowsMatch[1])} rows`}
//   >
//     Show remaining {Number(moreRowsMatch[1])} rows
//   </button>
// )} */}

//         </div>
//       </div>
//     </div>
//   )}

//   <div className="assistant-input-wrapper">
//     <input
//       type="text"
//       className="assistant-input"
//       placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
//       value={query}
//       onChange={(e) => setQuery(e.target.value)}
//       onClick={() => {
//         if (!query.trim() && rotatingPlaceholder) {
//           setQuery(rotatingPlaceholder);
//         }
//       }}
//       // onKeyDown={(e) => e.key === "Enter" && checkIntentAndAsk()}
//       onKeyDown={(e) => e.key === "Enter" && checkIntentAndAskStreaming(query)}

//     />
//     <button
//   className="ask-button"
//   onClick={() => checkIntentAndAskStreaming(query)}
//   disabled={typing || isLoading || !query.trim()}
//   aria-busy={typing || isLoading}
//   title={!query.trim() ? "Type your question" : typing ? "Streaming..." : "Send"}
// >
//   {typing ? (
//     <div style={{
//       width: 18, height: 18, border: "2px solid transparent",
//       borderTop: "2px solid white", borderRadius: "50%",
//       animation: "spin 1s linear infinite"
//     }} />
//   ) : (
//     <Send size={18} />
//   )}
// </button>


//     {/* UPDATED BUTTON: gated by sessionReady and sessionId; keeps your spinner */}
//     {/* <button
//       className="ask-button"
//       onClick={checkIntentAndAsk}
//       disabled={isLoading || !query.trim()}
//       // disabled={isLoading || !query.trim() || !sessionId || !sessionReady}
//       aria-busy={isLoading}
//       title={!query.trim() ? "Type your question" : isLoading ? "Sending..." : "Send"}
//       // title={!sessionReady ? "Connecting to database..." : undefined}
//     > {isLoading ? (
//     <div
//       style={{
//         width: 18,
//         height: 18,
//         border: "2px solid transparent",
//         borderTop: "2px solid white",
//         borderRadius: "50%",
//         animation: "spin 1s linear infinite",
//       }}
//     />
//   ) : (
//     <>
//       <Send size={18} />
//       {/* Send */}
//     {/* </> */}
//   {/* )} */} 
//       {/* {!sessionReady ? (
//         <>Connecting...</>
//       ) : isLoading ? (
//         <div
//           style={{
//             width: 18,
//             height: 18,
//             border: "2px solid transparent",
//             borderTop: "2px solid white",
//             borderRadius: "50%",
//             animation: "spin 1s linear infinite",
//           }}
//         />
//       ) : (
//         <>
//           <Send size={18} />
//           Send
//         </>
//       )} */}
//     {/* </button> */}
//   </div>
// </div>

//     </>
//   );
// };


// export default ChatPage;



















// // import React, { useState, useEffect, useRef, useCallback } from "react";
// // import Highcharts from "highcharts";
// // import HighchartsReact from "highcharts-react-official";
// // import { FiSend, FiMaximize2, FiMinimize2 } from "react-icons/fi";
// // import { FaDatabase, FaFileAlt } from "react-icons/fa";
// // import ReactMarkdown from 'react-markdown';
// // import remarkGfm from 'remark-gfm';
// // // import ChatPDF from "./Chatpdf";
// // import { Send, X } from "lucide-react";

// // const ChatPage = () => {
// //   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// //   const [query, setQuery] = useState("");
// //   const [answer, setAnswer] = useState("");
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [messages, setMessages] = useState([]);
// //   const [suggestions, setSuggestions] = useState([]);
// //   const [rotatingIndex, setRotatingIndex] = useState(0);
// //   const [rotatingPlaceholder, setRotatingPlaceholder] = useState("");
// //   const sessionIdRef = useRef(null);
// //   const [sessionId, setSessionId] = useState(null);
// //   const [lastAnsweredQuery, setLastAnsweredQuery] = useState("");
// //   const didConnectRef = useRef(false);
// //   const [summary, setSummary] = useState("");
// //   const [serverRows, setServerRows] = useState([]);
// //   const [rowCount, setRowCount] = useState(0);   // optional, for “too many rows” banner
// //   const [tableExpanded, setTableExpanded] = useState(false);
// //   const [sessionReady, setSessionReady] = useState(false);

// //   const MORE_ROWS_RE = /\.\.\.\s*and\s+(\d+)\s+more\s+rows\.?$/i;
// //   const moreRowsMatch = typeof answer === "string" ? answer.match(MORE_ROWS_RE) : null;
// //   const displayAnswer = moreRowsMatch ? answer.replace(MORE_ROWS_RE, "").trim() : answer;


// // useEffect(() => {
// //     if (!sessionIdRef.current) {
// //       const existing = sessionStorage.getItem("session_id");
// //       if (existing) sessionIdRef.current = existing;
// //       else {
// //         const newId = crypto.randomUUID();
// //         sessionStorage.setItem("session_id", newId);
// //         sessionIdRef.current = newId;
// //       }
// //     }

    
    


// //   const connectToDatabase = async () => {
// //     try {
// //       const res = await fetch(`${API_BASE_URL}/connect_database/`, { method: "POST" });
// //       const data = await res.json();
// //       console.log("🔌 DB connection response:", data);

// //       if (res.ok && data.session_id) {
// //         console.log("✅ Connected. Received session_id:", data.session_id);
// //         setSessionId(data.session_id);
// //         localStorage.setItem("session_id", data.session_id);
// //         setSessionReady(true);
// //       } else {
// //         console.error("❌ DB connection failed:", data?.error || "Unknown error");
// //         setSessionReady(false);
// //       }
// //     } catch (err) {
// //       console.error("⚠️ Error connecting to database:", err);
// //       setSessionReady(false);
// //     }
// //   };

// //   connectToDatabase(); // ⚠️ Always reconnect on reload
// // }, [API_BASE_URL]);

// // useEffect(() => {
// //     if (sessionId) {
// //       sessionIdRef.current = sessionId;
// //     }
// //   }, [sessionId]);

// // useEffect(() => {
// //     if (!sessionId) {
// //       const storedSession = localStorage.getItem("session_id");
// //       if (storedSession) {
// //         console.log("Restoring session from localStorage:", storedSession);
// //         setSessionId(storedSession);
// //         // Optionally assume ready when restoring (comment out if you prefer to wait for fresh connect)
// //         // setSessionReady(true);
// //       }
// //     }
// //   }, [sessionId]);


// // // Only treat text as a table if it looks tabular
// // const looksTabular = (text = "") => {
// //   if (!text) return false;

// //   // Markdown table pattern (header + separator)
// //   if (/\n?\s*\|.*\|\s*\n/.test(text) && /\n?\s*\|?\s*:?-{2,}/.test(text)) return true;

// //   const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
// //   if (lines.length < 2) return false;

// //   // CSV/pipe/TSV lines: require at least 2 lines with >= 3 fields
// //   const csvLike = lines.filter(l =>
// //     (l.split(",").length >= 3) || (l.split("|").length >= 3) || (l.split("\t").length >= 3)
// //   );
// //   if (csvLike.length >= 2) return true;

// //   // Key-value style lists: need >= 3 lines like "key: value" or "key - value"
// //   const kvLike = lines.filter(l => /\s*[^:–-]+[:–-]\s+.+/.test(l));
// //   return kvLike.length >= 3;
// // };


// // useEffect(() => {
// //   const body = document.body;
// //   const bgColor = window.getComputedStyle(body).backgroundColor;
// //   const rgb = bgColor.match(/\d+/g);

// //   if (rgb) {
// //     const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
// //     if (brightness < 128) {
// //       body.classList.add('dark-mode');
// //       body.classList.remove('light-mode');
// //     } else {
// //       body.classList.add('light-mode');
// //       body.classList.remove('dark-mode');
// //     }
// //   }
// // }, []);

// //  const generateNextMonthQuestion = (question) => {
// //   const monthsFull = [
// //     "january", "february", "march", "april", "may", "june",
// //     "july", "august", "september", "october", "november", "december"
// //   ];

// //   const monthsShort = {
// //     jan: "january", feb: "february", mar: "march", apr: "april",
// //     may: "may", jun: "june", jul: "july", aug: "august",
// //     sep: "september", oct: "october", nov: "november", dec: "december"
// //   };

// //   const match = question.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i);

// //   if (match) {
// //     const normalized = monthsShort[match[0].toLowerCase()] || match[0].toLowerCase();
// //     const index = monthsFull.indexOf(normalized);
// //     if (index !== -1) {
// //       const nextMonth = monthsFull[(index + 1) % 12];
// //       return question.replace(new RegExp(match[0], 'i'), nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1));
// //     }
// //   }
// //   return null;
// // };

// // // Dataset columns for context-aware suggestions
// // const DATASET_COLUMNS = [
// //   'rto_risk_factor', 'ncb_%_previous_year', 'state_risk_score', 'retention_rate_pct',
// //   'total_od_premium_max', 'applicable_discount_with_ncb', 'policy_wise_purchase',
// //   'manufacturer_risk_rate', 'days_between_renewals', 'retention_streak',
// //   'total_od_premium_mean', 'total_od_premium', 'firstpolicyyear', 'lag_1_tp_premium',
// //   'total_od_premium_min', 'avg_premium_hist', 'lag_1_ncb', 'age', 'total_tp_premium_max',
// //   'total_tp_premium_mean', 'total_tp_premium', 'total_tp_premium_min', 'lag_1_premium',
// //   'previous_year_premium_ratio', 'total_premium_payable', 'total_revenue', 'gst',
// //   'fuel_type_risk_factor', 'lag_1_od_premium', 'customer_apv', 'segment_risk_score',
// //   'vehicle_idv', 'policy_tenure', 'number_of_claims', 'approved', 'claim_approval_rate',
// //   'customer_tenure', 'before_gst_add-on_gwp', 'od_tp_ratio', 'add_on_adoption',
// //   'clv', 'idv_premium_ratio', 'customer_apf', 'days_gap_prev_end_to_curr_start',
// //   'customerid', 'claim_happaned/not', 'branch_name', 'chassis_number',
// //   'engine_number', 'reg_no', 'state', 'zone',
// //   'biztype', 'corrected_name', 'make_clean', 'model_clean', 'product_name',
// //   'policy_no', 'decline', 'tie_up', 'variant', 'policy_status',
// //   'policy_start_date_year', 'policy_end_date_year', 'policy_start_date_month',
// //   'policy_end_date_month', 'policy_start_date_day', 'policy_end_date_day',
// //   'predicted_status', 'churn_probability', 'clv_category', 'discount_category',
// //   'churn_category', 'customer_segment', 'not_renewed_reasons', 'main_reason',
// //   'primary_recommendation', 'additional_offers', 'retention_channel'
// // ];

// // // Comprehensive suggestion templates organized by topic
// // const SUGGESTION_TEMPLATES = {
// //   churn: [
// //     'Show churn probability by customer segment',
// //     'What are the main reasons for not renewing?',
// //     'Show retention rate by state and zone',
// //     // 'Analyze churn patterns by policy tenure',
// //     // 'What is the relationship between claims and churn?',
// //     // 'Show retention streak analysis across segments'
// //   ],
// //   premium: [
// //     // 'Show average premium by vehicle make',
// //     'What is the premium trend over years?',
// //     // 'Compare OD vs TP premium distribution',
// //     // 'Analyze premium variations by customer segment',
// //     // 'Show IDV to premium ratio analysis',
// //     // 'What factors influence premium pricing most?'
// //   ],
// //   claims: [
// //     // 'Show claim approval rate by state',
// //     'What is the relationship between claims and churn?',
// //     // 'Show claims distribution by vehicle age',
// //     // 'Analyze claim patterns by manufacturer',
// //     // 'Show claim frequency vs premium correlation',
// //     // 'What are the most common claim scenarios?'
// //   ],
// //   customer: [
// //     'Show customer lifetime value by segment',
// //     // 'What are the characteristics of high-value customers?',
// //     // 'Show customer tenure distribution',
// //     // 'Analyze customer acquisition vs retention costs',
// //     // 'Show customer segment migration patterns',
// //     // 'What drives customer loyalty in insurance?'
// //   ],
// //   vehicle: [
// //     // 'Show top 10 vehicle makes by policy count',
// //     'What is the average IDV by vehicle make?',
// //     // 'Show vehicle age vs premium relationship',
// //     // 'Analyze risk factors by manufacturer',
// //     // 'Show fuel type distribution and risk impact',
// //     // 'What are the most profitable vehicle segments?'
// //   ],
// //   cars: [
// //     'Show top 10 vehicle makes by policy count',
// //     // 'What is the average IDV by vehicle make?',
// //     // 'Show vehicle age vs premium relationship',
// //     // 'Analyze risk factors by manufacturer',
// //     // 'Show fuel type distribution and risk impact',
// //     // 'What are the most profitable vehicle segments?'
// //   ],
// //   regional: [
// //     'Show policy distribution by zone',
// //     'Which state has the highest risk score?',
// //     'Compare business performance across states',
// //     // 'Analyze regional premium variations',
// //     'Show state-wise retention patterns',
// //     // 'What are the regional growth opportunities?'
// //   ],
// //   discount: [
// //     // 'Show NCB distribution across customers',
// //     'What is the average discount by customer category?',
// //     // 'Show relationship between NCB and retention',
// //     // 'Analyze discount effectiveness on renewals',
// //     // 'Show applicable discount trends over time',
// //     // 'What is the optimal discount strategy?'
// //   ],
// //   risk: [
// //     // 'Show risk factors by manufacturer',
// //     // 'What are the key risk indicators?',
// //     // 'Show fuel type risk distribution',
// //     // 'Analyze RTO risk factor patterns',
// //     'Show segment risk score analysis',
// //     // 'What predicts high-risk customers?'
// //   ],
// //   recommendations: [
// //     'Show primary recommendations by customer segment',
// //     // 'What retention strategies work best?',
// //     // 'Show additional offers effectiveness',
// //     // 'Analyze recommendation success rates',
// //     // 'Show channel effectiveness for retention',
// //     // 'What are the most successful retention tactics?'
// //   ],
// //   temporal: [
// //     // 'Compare policy trends between 2024 and 2025',
// //     'Show monthly policy distribution',
// //     // 'What is the renewal pattern by month?',
// //     // 'Analyze seasonal variations in business',
// //     // 'Show yearly growth trends',
// //     // 'What are the peak business periods?'
// //   ],
// //   general: [
// //     // 'What can you do?',
// //     // 'Tell me a fun fact about insurance',
// //     // 'How can you help with insurance analysis?',
// //     'Which branch have the high churn probability?',
// //     // 'What is the average of customer life time?',
// //     // 'What insights can you provide?',
// //     // 'Show IDV to premium ratio analysis',
// //     'Give me a top 5 branches performing well',
// //     'What is the churn rate by customer segment?',
// //     // 'What is the distribution of vehicle IDV across different policy tenures?',
// //     'What are the top churn reasons across all zones?',
// //     'Which state has the highest revenue from policies not renewed?',
// //     'Give me top 5 branches based on churn',
// //     'Analyze churn patterns by policy tenure',
// //     'Show state-wise retention patterns',
// //     'Show churn probability by customer segment',
// //     'What are the main reasons for not renewing?',
// //     'Show retention rate by state and zone',
// //     // 'Show me data overview',
// //     // 'What are the key business metrics?'
// //   ],
// //   // conversational: [
// //   //   'What is your name?',
// //   //   'What is your purpose?',
// //   //   'How do you work?',
// //   //   'What services do you provide?',
// //   //   'Can you help me with something?',
// //   //   'Do you have feelings?'
// //   // ],
// //   // fun: [
// //   //   'Want to hear another fun fact?',
// //   //   'Show me something surprising in the data',
// //   //   'What else can you do?',
// //   //   'Tell me an interesting insight',
// //   //   'What would you recommend exploring?',
// //   //   'Show me the most unusual data pattern'
// //   // ]
// // };

// // // Enhanced function to generate dynamic suggestions based on conversation context and dataset
// // const generateDynamicSuggestions = (messages, activeSource, connectedDbDetails, forceRefresh = false) => {
// //   const suggestions = [];
// //   let usedSuggestions = new Set();

// //   // Get conversation history to avoid repeating suggestions
// //   if (!forceRefresh && messages && messages.length > 0) {
// //     messages.forEach(msg => {
// //       if (msg.role === 'user') {
// //         usedSuggestions.add(msg.content.toLowerCase().trim());
// //       }
// //     });
// //   }

// //   const recentMessages = messages.slice(-4);
// //   const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop();
// //   const lastAssistantMessage = recentMessages.filter(m => m.role === 'assistant').pop();

// //   if (!lastUserMessage) {
// //     // Return default suggestions if no user message
// //     return SUGGESTION_TEMPLATES.general.slice(0, 6).map(text => ({
// //       text,
// //       type: 'general'
// //     }));
// //   }

// //   const userQuestion = lastUserMessage.content.toLowerCase();

// //   // Month-based suggestions (always include if applicable)
// //   const nextMonthQuestion = generateNextMonthQuestion(lastUserMessage.content);
// //   if (nextMonthQuestion && !usedSuggestions.has(nextMonthQuestion.toLowerCase())) {
// //     suggestions.push({
// //       text: nextMonthQuestion,
// //       type: 'month-follow-up'
// //     });
// //   }

// //   // Determine primary topic and get 6 suggestions
// //   let primaryTopic = null;
// //   let topicSuggestions = [];

// //   // Topic detection with priority
// //   if (userQuestion.includes('churn') || userQuestion.includes('renewal') || userQuestion.includes('retention')) {
// //     primaryTopic = 'churn';
// //     topicSuggestions = SUGGESTION_TEMPLATES.churn;
// //   } else if (userQuestion.includes('premium') || userQuestion.includes('revenue') || userQuestion.includes('idv')) {
// //     primaryTopic = 'premium';
// //     topicSuggestions = SUGGESTION_TEMPLATES.premium;
// //   } else if (userQuestion.includes('claim') || userQuestion.includes('claims') || userQuestion.includes('approval')) {
// //     primaryTopic = 'claims';
// //     topicSuggestions = SUGGESTION_TEMPLATES.claims;
// //   } else if (userQuestion.includes('customer') || userQuestion.includes('segment') || userQuestion.includes('clv')) {
// //     primaryTopic = 'customer';
// //     topicSuggestions = SUGGESTION_TEMPLATES.customer;
// //   } else if (userQuestion.includes('vehicle') || userQuestion.includes('make') || userQuestion.includes('model') || userQuestion.includes('manufacturer')) {
// //     primaryTopic = 'vehicle';
// //     topicSuggestions = SUGGESTION_TEMPLATES.vehicle;
// //   } else if (userQuestion.includes('state') || userQuestion.includes('zone') || userQuestion.includes('region') || userQuestion.includes('rto')) {
// //     primaryTopic = 'regional';
// //     topicSuggestions = SUGGESTION_TEMPLATES.regional;
// //   } else if (userQuestion.includes('discount') || userQuestion.includes('ncb')) {
// //     primaryTopic = 'discount';
// //     topicSuggestions = SUGGESTION_TEMPLATES.discount;
// //   } else if (userQuestion.includes('risk') || userQuestion.includes('score') || userQuestion.includes('factor')) {
// //     primaryTopic = 'risk';
// //     topicSuggestions = SUGGESTION_TEMPLATES.risk;
// //   } else if (userQuestion.includes('recommendation') || userQuestion.includes('strategy') || userQuestion.includes('retention')) {
// //     primaryTopic = 'recommendations';
// //     topicSuggestions = SUGGESTION_TEMPLATES.recommendations;
// //   } else if (userQuestion.includes('year') || userQuestion.includes('2024') || userQuestion.includes('2025') || userQuestion.includes('month')) {
// //     primaryTopic = 'temporal';
// //     topicSuggestions = SUGGESTION_TEMPLATES.temporal;
// //   // } else if (["hi", "hello", "hey", "how are you"].some(greet => userQuestion.includes(greet))) {
// //   //   primaryTopic = 'conversational';
// //   //   topicSuggestions = SUGGESTION_TEMPLATES.conversational;
// //   // } else if (["wow", "awesome", "cool", "amazing", "great", "nice", "interesting", "hahaha"].some(word => userQuestion.includes(word))) {
// //   //   primaryTopic = 'fun';
// //   //   topicSuggestions = SUGGESTION_TEMPLATES.fun;
// //   // } 
// //   }else {
// //     primaryTopic = 'general';
// //     topicSuggestions = SUGGESTION_TEMPLATES.general;
// //   }

// //   // Add topic-specific suggestions (filtering out already used ones)
// //   const availableTopicSuggestions = topicSuggestions.filter(text => 
// //     !usedSuggestions.has(text.toLowerCase())
// //   );

// //   availableTopicSuggestions.forEach(text => {
// //     if (suggestions.length < 6) {
// //       suggestions.push({
// //         text,
// //         type: primaryTopic
// //       });
// //     }
// //   });

// //   // If we don't have enough suggestions, add from related topics
// //   if (suggestions.length < 6) {
// //     const relatedTopics = getRelatedTopics(primaryTopic);
    
// //     relatedTopics.forEach(topic => {
// //       if (suggestions.length < 6) {
// //         const relatedSuggestions = SUGGESTION_TEMPLATES[topic] || [];
// //         relatedSuggestions.forEach(text => {
// //           if (suggestions.length < 6 && !usedSuggestions.has(text.toLowerCase())) {
// //             suggestions.push({
// //               text,
// //               type: topic
// //             });
// //           }
// //         });
// //       }
// //     });
// //   }

// //   // Database-specific suggestions
// //   if (activeSource === 'database') {
// //     if (userQuestion.includes('count') || userQuestion.includes('how many')) {
// //       suggestions.push(
// //         { text: 'Show breakdown by policy status', type: 'breakdown' },
// //         { text: 'What is the average across different segments?', type: 'analytics' }
// //       );
// //     }
// //   }

// //   // File-specific suggestions
// //   if (activeSource === 'file') {
// //     if (userQuestion.includes('total') || userQuestion.includes('sum')) {
// //       suggestions.push(
// //         { text: 'Show detailed breakdown by category', type: 'breakdown' },
// //         { text: 'Create a visualization of this data', type: 'visualization' }
// //       );
// //     }
// //   }

// //   // Chart suggestions if data is available
// //   if (lastAssistantMessage && lastAssistantMessage.rows && lastAssistantMessage.rows.length > 0) {
// //     if (suggestions.length < 6) {
// //       suggestions.push(
// //         { text: 'Create a chart visualization of this data', type: 'chart' },
// //         { text: 'Show correlation analysis', type: 'correlation' }
// //       );
// //     }
// //   }

// //   // Ensure we have exactly 6 suggestions
// //   const finalSuggestions = suggestions.slice(0, 6);
  
// //   // If still not enough, fill with general suggestions
// //   while (finalSuggestions.length < 6) {
// //     const remainingGeneral = SUGGESTION_TEMPLATES.general.filter(text => 
// //       !finalSuggestions.some(s => s.text === text) && !usedSuggestions.has(text.toLowerCase())
// //     );
    
// //     if (remainingGeneral.length > 0) {
// //       finalSuggestions.push({
// //         text: remainingGeneral[0],
// //         type: 'general'
// //       });
// //     } else {
// //       break;
// //     }
// //   }

// //   return finalSuggestions;
// // };

// // // Helper function to get related topics
// // const getRelatedTopics = (primaryTopic) => {
// //   const topicRelations = {
// //     churn: ['customer', 'recommendations', 'premium'],
// //     premium: ['customer', 'vehicle', 'regional'],
// //     claims: ['risk', 'vehicle', 'customer'],
// //     customer: ['churn', 'premium', 'recommendations'],
// //     vehicle: ['premium', 'risk', 'claims'],
// //     regional: ['premium', 'risk', 'customer'],
// //     discount: ['customer', 'premium', 'churn'],
// //     risk: ['vehicle', 'claims', 'regional'],
// //     recommendations: ['customer', 'churn', 'premium'],
// //     temporal: ['premium', 'customer', 'churn'],
// //     general: ['customer', 'premium', 'churn'],
// //     conversational: ['general', 'fun'],
// //     fun: ['general', 'conversational']
// //   };

// //   return topicRelations[primaryTopic] || ['general'];
// // };

// // // Function to refresh suggestions (call this after user clicks a suggestion)
// // const refreshSuggestions = (messages, activeSource, connectedDbDetails) => {
// //   return generateDynamicSuggestions(messages, activeSource, connectedDbDetails, true);
// // };

// // // Normalizes responses from ask_question / ask_qwen / askbot
// // const normalizeAnswer = (data) => {
// //   // If classic shape: { answer, summary }
// //   if (typeof data?.answer === "string" && data.answer.trim()) {
// //     return {
// //       answer: data.answer.trim(),
// //       summary: (data.summary || "").trim(),
// //       sources: Array.isArray(data.sources) ? data.sources : [],
      
// //     };
// //   }
// // // askbot shape
// //   const mode = (data?.mode || "").toLowerCase();
// //   const pdf = (data?.pdf_answer || "").trim();
// //   const gen = (data?.general_answer || "").trim();

// //   let parts = [];
// //   if (mode === "both") {
// //     const hasPdf = pdf && pdf.toLowerCase() !== "i don't know.";
// //     if (hasPdf) parts.push(`**PDF-based answer**\n${pdf}`);
// //     if (gen) parts.push(`**General answer**\n${gen}`);
// //   } else if (mode === "pdf_only") {
// //     if (pdf) parts.push(pdf);
// //   } else if (mode === "general_only") {
// //     if (gen) parts.push(gen);
// //   } else {
// //     // Unknown mode: pick whatever exists
// //     if (pdf) parts.push(pdf);
// //     if (gen) parts.push(gen);
// //   }

// //   let answer = parts.join("\n\n").trim();
// //   if (!answer && pdf) answer = pdf;
// //   if (!answer && gen) answer = gen;
// //   const sources = Array.isArray(data?.sources) ? data.sources : [];
// //   if (sources.length) answer += `\n\n_Sources:_ ${sources.join(", ")}`;

// //   return {
// //     answer: answer || "No response found.",
// //     summary: (data?.summary || "").trim(),
// //     sources
// //   };
// // };
// // // helper — keep it near top-level of component/file
// // const parseAnswerToTable = (text = "") => {
// //   if (!text || !text.trim()) return { columns: [], rows: [] };
// //   const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

// //   const mdTable = lines.filter(l => /^\|.*\|$/.test(l));
// //   if (mdTable.length >= 2) {
// //     const clean = mdTable.filter(l => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l));
// //     const head = clean[0].split("|").map(s => s.trim()).filter(Boolean);
// //     const body = clean.slice(1).map(r => r.split("|").map(s => s.trim()).filter(Boolean));
// //     const columns = head.length ? head : body[0]?.map((_, i) => `Col ${i + 1}`) || [];
// //     const rows = body.map(arr => {
// //       const o = {}; columns.forEach((c, i) => (o[c] = arr[i] ?? "")); return o;
// //     });
// //     return { columns, rows };
// //   }

// //   const splitLine = l => {
// //     if (l.includes("|")) return l.split("|").map(s => s.trim()).filter(Boolean);
// //     if (l.includes(",")) return l.split(",").map(s => s.trim()).filter(Boolean);
// //     if (l.includes("\t")) return l.split("\t").map(s => s.trim()).filter(Boolean);
// //     const kv = l.split(/\s*[:\-–]\s*/);
// //     if (kv.length > 1) return kv.map(s => s.trim()).filter(Boolean);
// //     return [l];
// //   };

// //   const parts = lines.map(splitLine);

// //   // Guard 1: reject accidental tables from single-line prose
// //   if (parts.length < 2) return { columns: [], rows: [] };

// //   const width = Math.max(...parts.map(p => p.length));

// //   // Guard 2: if width == 2 (Metric/Value pattern), require at least 3 lines
// //   if (width === 2 && parts.length < 3) return { columns: [], rows: [] };

// //   if (!width || (width === 1 && parts.length <= 1)) return { columns: [], rows: [] };

// //   const headers = width === 2 ? ["Metric", "Value"] : Array.from({ length: width }, (_, i) => `Col ${i + 1}`);
// //   const rows = parts.map(arr => {
// //     const o = {}; headers.forEach((h, i) => (o[h] = arr[i] ?? "")); return o;
// //   });
// //   return { columns: headers, rows };
// // };



// // // Export functions
// // if (typeof module !== 'undefined' && module.exports) {
// //   module.exports = {
// //     generateDynamicSuggestions,
// //     refreshSuggestions,
// //     generateNextMonthQuestion,
// //     SUGGESTION_TEMPLATES,
// //     DATASET_COLUMNS
// //   };
// // }

// // const checkIntentAndAsk = async () => {
// //   if (!query.trim() || isLoading) return;


// //   const asked = query;
// //   setLastAnsweredQuery(asked);
// //   setMessages(prev => [...prev, { role: "user", content: asked }]);
// //   setIsLoading(true);
// //   setAnswer("");
// //   setSummary("");


// //   try {
// //     // Intent -> choose endpoint
// //     let endpoint = "ask_question";
// //     try {
// //       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ question: asked })
// //       });
// //       const intentData = await intentRes.json();
// //       const intent = intentData?.answer?.toUpperCase?.() || "NO";
// //       if (intent !== "YES") endpoint = "ask_qwen";  // small-talk/general -> askbot
// //     } catch {
// //       endpoint = "ask_question";
// //     }

// //     const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ question: asked, user_id: "admin" })
// //     });
// //     const data = await res.json();

// //     if (data?.query_used) {
// //       if (typeof console.groupCollapsed === "function") {
// //         console.groupCollapsed("🔍 API Debug");
// //         console.log("SQL used:\n", data.query_used);
// //         console.log("Rows:", data.row_count, "Response time:", data.response_time);
// //         console.groupEnd();
// //       } else {
// //         console.log("🔍 SQL used:\n", data.query_used);
// //         console.log("Rows:", data.row_count, "Response time:", data.response_time);
// //       }
// //     }

// //     const norm = normalizeAnswer(data);
// //     setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
// //     setAnswer(norm.answer);
// //     setSummary(norm.summary);
// //     setServerRows(Array.isArray(data.rows) ? data.rows : []);
// //     setRowCount(typeof data.row_count === "number" ? data.row_count : (Array.isArray(data.rows) ? data.rows.length : 0));
// //   } catch (e) {
// //     setAnswer("Something went wrong.");
// //     setSummary("");
// //   }

// //   setIsLoading(false);
// //   setQuery("");
// // };

// // const downloadCSV = async (questionText) => {
// //     try {
// //       const actualQuestion = questionText || lastAnsweredQuery || query;
// //       if (!actualQuestion) {
// //         alert("Missing question for download.");
// //         return;
// //       }
// //       const encoded = encodeURIComponent(actualQuestion);
// //       const url = `${API_BASE_URL}/ask_question/?export=true&question=${encoded}`;
// //       const response = await fetch(url, {
// //         method: "GET",
// //         headers: { Accept: "text/csv" },
// //       });
// //       if (!response.ok) {
// //         const errorText = await response.text();
// //         alert(`Download failed: ${errorText}`);
// //         return;
// //       }
// //       const blob = await response.blob();
// //       const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
// //       const filename = `export_${ts}.csv`;
// //       const href = URL.createObjectURL(blob);
// //       const a = document.createElement("a");
// //       a.href = href;
// //       a.download = filename;
// //       document.body.appendChild(a);
// //       a.click();
// //       a.remove();
// //       URL.revokeObjectURL(href);
// //     } catch (error) {
// //       alert(`Download failed: ${error.message}`);
// //     }
// //   };


// //   useEffect(() => {
// //     const newSuggestions = generateDynamicSuggestions(messages, "file", null);
// //     setSuggestions(newSuggestions);
// //   }, [messages]);

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setRotatingIndex(prev => {
// //         const next = (prev + 1) % suggestions.length;
// //         setRotatingPlaceholder(suggestions[next]?.text || "");
// //         return next;
// //       });
// //     }, 5000);
// //     return () => clearInterval(interval);
// //   }, [suggestions]);

// //   useEffect(() => {
// //     if (!query && suggestions.length > 0) {
// //       setRotatingPlaceholder(suggestions[0]?.text || "");
// //     }
// //   }, [suggestions]);

  

// //   useEffect(() => {
// //     if (!query && suggestions.length > 0) {
// //       setRotatingPlaceholder(suggestions[0]?.text || "");
// //     }
// //   }, [suggestions]);



// // // Pretty header labels: remove _/-, split camelCase, Title Case,
// // // and keep common short acronyms uppercase (IDV, OD, TP, NCB, CLV, RTO, GST).
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

// //   // Formats numbers (or numeric strings) to exactly 2 decimals.

// // // Keeps non-numeric values as-is. Handles commas and trailing %.
// // // const formatCell = (val) => {
// // //   if (val === null || val === undefined) return "";
// // //   const s = String(val).trim();

// // //   // numeric or numeric with commas and optional %
// // //   const looksNumeric = /^[-+]?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?%?$/.test(s);
// // //   if (typeof val === "number" || looksNumeric) {
// // //     const isPercent = s.endsWith("%");
// // //     const num = typeof val === "number"
// // //       ? val
// // //       : Number(s.replace(/,/g, "").replace(/%$/, ""));
// // //     if (Number.isFinite(num)) {
// // //       const out = num.toLocaleString(undefined, {
// // //         minimumFractionDigits: 2,
// // //         maximumFractionDigits: 2,
// // //       });
// // //       return isPercent ? `${out}%` : out;
// // //     }
// // //   }
// // //   return s;
// // // };


// // const formatCell = (val) => {
// //   if (val === null || val === undefined) return "";
// //   const s = String(val).trim();
// //   const isPercent = s.endsWith("%");
// //   const num = typeof val === "number"
// //     ? val
// //     : Number(s.replace(/,/g, "").replace(/%$/, ""));
// //   if (Number.isFinite(num)) {
// //     const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
// //     return isPercent ? `${formatted}%` : formatted;
// //   }
// //   return s;
// // };
// // // ---------- Unit inference + header/cell helpers ----------
// // // ---------- Unit inference + header/cell helpers (robust) ----------
// // const CURRENCY_SYMBOL = "₹";

// // // Force-known units (lowercase keys)
// // const UNIT_MAP = {
// //   clv: CURRENCY_SYMBOL,
// //   avg_clv: CURRENCY_SYMBOL,
// //   total_revenue: CURRENCY_SYMBOL,
// //   avg_premium: CURRENCY_SYMBOL,
// //   avg_vehicle_idv: CURRENCY_SYMBOL,
// //   idv: CURRENCY_SYMBOL,
// //   gst: CURRENCY_SYMBOL,

// //   churn_probability: "%",
// //   retention_rate_pct: "%",
// //   claim_approval_rate: "%",

// //   policy_tenure: "Months",
// //   customer_tenure: "Months",
// //   policy_start_date_year: "Year",
// //   policy_end_date_year: "Year",
// //   policy_start_date_month: "Months",
// //   policy_end_date_month: "Months",
// //   policy_start_date_day: "Days",
// //   policy_end_date_day: "Days",
// // };

// // // column names that are almost certainly CATEGORICAL, never add units
// // const CATEGORICAL_HINTS =
// //   /\b(segment|customer|name|state|zone|city|branch|make|model|variant|product|channel)\b/i;

// // const _strip = (v) => String(v ?? "").trim();
// // const _num = (v) => Number(_strip(v).replace(/[^0-9.\-]/g, ""));
// // const _isNumeric = (s) => Number.isFinite(_num(s));
// // const _hasLetters = (s) => /[A-Za-z]/.test(_strip(s));

// // const _analyzeSamples = (samples) => {
// //   const n = samples.length || 1;
// //   const numeric = samples.filter(_isNumeric).length;
// //   const alpha   = samples.filter(_hasLetters).length;
// //   return {
// //     shareNumeric: numeric / n,
// //     shareAlpha: alpha / n,
// //     allIntegers: samples
// //       .filter(_isNumeric)
// //       .every((s) => Number.isInteger(_num(s))),
// //   };
// // };

// // // Normalize a time unit string to its base word
// // const normalizeTimeUnit = (unit = "") => {
// //   const u = unit.toLowerCase();
// //   if (u.startsWith("year"))  return "Year";
// //   if (u.startsWith("month")) return "Month";
// //   if (u.startsWith("week"))  return "Week";
// //   if (u.startsWith("day"))   return "Day";
// //   if (u.startsWith("hour"))  return "Hour";
// //   if (u.startsWith("min"))   return "Minute";
// //   if (u.startsWith("sec"))   return "Second";
// //   return unit || "";
// // };

// // // Correct singular/plural form based on numeric value
// // const pluralizeTimeUnit = (unit, value) => {
// //   const base = normalizeTimeUnit(unit);
// //   const v = Math.abs(Number(value));
// //   const irregularPlural = { Day: "Days" };
// //   const defaultPlural   = base.endsWith("s") ? base : base + "s";
// //   const pluralWord      = irregularPlural[base] || defaultPlural;
// //   return v === 1 ? base : pluralWord;         // 1 -> singular, everything else -> plural
// // };

// // // Detect if the raw cell already has a time unit to avoid double appending
// // const cellAlreadyHasTimeUnit = (raw, unit) => {
// //   const base = normalizeTimeUnit(unit);
// //   if (!base) return false;
// //   const re = new RegExp(`\\b${base}(?:s)?\\b`, "i"); // matches Month/Months, Year/Years, etc.
// //   return re.test(raw);
// // };

// // /** Infer unit from column name + sample values (safe for categorical columns) */
// // const inferUnitForColumn = (key, rows) => {
// //   const k = String(key || "").toLowerCase();
// //   const keyLc = String(key || "").toLowerCase();

// //   if (/\bcount\b/.test(keyLc) && typeof val === "string") {
// //    return val.replace(/\s*%$/, "");
// //  }

// //   if (/\bcount\b/.test(k) || /_count\b/.test(k) || /\b(year|month)\s*count\b/.test(k)) {
// //     return { unit: "", type: "number" };
// //   }


// //   // never add units to obvious categorical columns
// //   if (CATEGORICAL_HINTS.test(k)) return { unit: "", type: "text" };

// //   if (UNIT_MAP[k]) {
// //     const u = UNIT_MAP[k];
// //     return {
// //       unit: u,
// //       type: ["Year", "Years", "Months", "Weeks", "Days"].includes(u)
// //         ? "time"
// //         : u === "%"
// //         ? "percent"
// //         : "currency",
// //     };
// //   }

// //   const samples = rows
// //     .slice(0, 50)
// //     .map((r) => r?.[key])
// //     .filter((v) => v !== null && v !== undefined)
// //     .map(String);

// //   const { shareNumeric, shareAlpha, allIntegers } = _analyzeSamples(samples);
// //   const nums = samples.filter(_isNumeric).map(_num);

// //   // Percent by name
// //   if (/\b(pct|percent|percentage|probab|probability|rate|ratio)\b/.test(k)) {
// //     return { unit: "%", type: "percent" };
// //   }
// //   // Percent by values: mostly numeric, all within 0..100, and not many alpha cells
// //   if (
// //     shareNumeric >= 0.7 &&
// //     shareAlpha <= 0.2 &&
// //     nums.length &&
// //     nums.every((n) => n >= 0 && n <= 100)
// //   ) {
// //     return { unit: "%", type: "percent" };
// //   }

// //   // Time by name
// //   if (/\byears?\b|\byrs?\b/.test(k)) return { unit: "Years", type: "time" };
// //   if (/\bmonths?\b/.test(k)) return { unit: "Months", type: "time" };
// //   if (/\bweeks?\b/.test(k)) return { unit: "Weeks", type: "time" };
// //   if (/\bdays?\b/.test(k)) return { unit: "Days", type: "time" };
// //   if (/\btenure\b|\bage\b/.test(k)) return { unit: "Months", type: "time" }; // default

// //   // Time by values: mostly numeric integers with typical ranges and no alpha
// //   if (shareNumeric >= 0.8 && shareAlpha === 0 && allIntegers) {
// //     if (nums.every((n) => n >= 1900 && n <= 2100)) return { unit: "Year", type: "time" };
// //     if (nums.every((n) => n >= 1 && n <= 12))      return { unit: "Months", type: "time" };
// //     if (nums.every((n) => n >= 1 && n <= 53))      return { unit: "Weeks",  type: "time" };
// //     if (nums.every((n) => n >= 1 && n <= 31))      return { unit: "Days",   type: "time" };
// //   }

// //   // Currency by name/value
// //   if (
// //     /\b(revenue|premium|amount|idv|gwp|clv|price|cost|value|payment)\b/.test(k) ||
// //     samples.some((s) => /[₹$€£]/.test(s))
// //   ) {
// //     return { unit: CURRENCY_SYMBOL, type: "currency" };
// //   }

// //   return { unit: "", type: "number" };
// // };

// // // Use this instead of plain formatCell() when rendering table cells.
// // const formatCellForColumn = (key, val, rows) => {
// //   const { type, unit } = inferUnitForColumn(key, rows);

// //   if (val === null || val === undefined) return "";

// //   // Percent columns -> ensure % in cell
// //   if (type === "percent") {
// //     const s = String(val).trim();
// //     const isPercent = /\s*%$/.test(s);
// //     if (isPercent) return formatCell(s);
// //     const num = typeof val === "number" ? val : Number(s.replace(/,/g, ""));
// //     if (Number.isFinite(num)) {
// //       const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
// //       return `${formatted}%`;
// //     }
// //     return s;
// //   }

// //   // TIME columns
// //   if (type === "time") {
// //     // For Year specifically: return raw integer string (no commas)
// //     if (unit === "Year") {
// //       const s = String(val).trim();
// //       const n = typeof val === "number" ? val : Number(s.replace(/[^0-9\-]/g, ""));
// //       return Number.isFinite(n) ? String(Math.trunc(n)) : s;
// //     }
// //     // For Month/Week/Day, keep your normal numeric formatting (usually no commas anyway)
// //     return formatCell(val);
// //   }

// //   // Currency/number/text -> your existing behavior
// //   return formatCell(val);
// // };



// // /** Build header like "Policy Tenure (Months)" or "Churn Rate (%)" */
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

// // // /** Append unit inside the cell only when it's numeric and needs it */
// // // const formatCellWithUnit = (val, key, rows) => {
// // //   const { type, unit } = inferUnitForColumn(key, rows);
// // //   const raw = String(val ?? "").trim();
// // //   let s = formatCell(val); // your existing formatter
// // //   if (s === "") return s;

// // //   // only append to numeric values
// // //   const isNumericCell = _isNumeric(raw);

// // //   if (type === "percent" && isNumericCell && !raw.endsWith("%")) {

// // //     return `${s}%`;
// // //   }
// // //   if (type === "time" && isNumericCell) {
// // //     return `${s} ${unit}`;

// // //   }
// // //   return s;
// // // };

// // /** Append unit inside the cell only when it's numeric and needs it */

// // // const formatCellWithUnit = (val, key, rows) => {
// // //   const { type, unit } = inferUnitForColumn(key, rows);
// // //   const raw = String(val ?? "").trim();
// // //   if (!raw) return "";

// // //   const n = Number(raw.replace(/[^0-9.\-]/g, ""));
// // //   const isNum = Number.isFinite(n);

// // //   // If it's clearly non-numeric text (e.g., "Elite Retainers"), don't touch it
// // //   if (!isNum && /[A-Za-z]/.test(raw)) return raw;

// // //   // Percent: format number and append %, but don't double-append
// // //   if (type === "percent") {
// // //     if (raw.endsWith("%")) return raw; // already has a percent sign
// // //     const numStr = n.toLocaleString(undefined, { maximumFractionDigits: 0 });
// // //     return `${numStr}%`;
// // //   }

// // //   // Time: append the unit; for Year(s) show plain integer (no grouping)
// // //   // if (type === "time") {
// // //   //   // If the cell already contains the unit text, leave it as-is
// // //   //   const alreadyHasUnit = new RegExp(`\\b${unit}\\b`, "i").test(raw);
// // //   //   if (alreadyHasUnit) return raw;

// // //   //   const out =
// // //   //     unit === "Year" || unit === "Years"
// // //   //       ? String(Math.trunc(n)) // no thousands separator for years
// // //   //       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// // //   //   return `${out} ${unit}`;
// // //   // }

// // //   // Time: append the unit; for Year(s) show plain integer (no grouping)
// // // if (type === "time") {
// // //   // If the cell already contains a time unit, leave it as-is
// // //   if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

// // //   const baseUnit  = normalizeTimeUnit(unit);
// // //   const unitLabel = pluralizeTimeUnit(baseUnit, n);

// // //   const out =
// // //     baseUnit === "Year"
// // //       ? String(Math.trunc(n)) // avoid 2,025-style grouping
// // //       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// // //   return `${out} ${unitLabel}`;
// // // }


// // //   // Everything else uses the generic formatter you already have
// // //   return formatCell(val);
// // // };

// // /** Append unit inside the cell only when it's numeric and needs it */

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


// //   // Time units
// //   if (type === "time") {
// //     const baseUnit = normalizeTimeUnit(unit);

// //     // Special case: calendar years → "2025 year" (force singular)
// //     // if (baseUnit === "Year" && isNum && n >= 1900 && n <= 2100) {
// //     //   return `${Math.trunc(n)} year`;
// //     // }
// //     // replace the range check with a 4-digit check
// //     if (baseUnit === "Year" && isNum && /^\d{4}$/.test(String(Math.trunc(n)))) {
// //       return `${Math.trunc(n)} year`;
// //     }

// //     // If the cell already contains a time unit (e.g., "3 Months"), leave it
// //     if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

// //     const unitLabel = pluralizeTimeUnit(baseUnit, n);
// //     const out =
// //       baseUnit === "Year"
// //         ? String(Math.trunc(n)) // avoid 2,025 grouping for durations like 1/2 years
// //         : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// //     return `${out} ${unitLabel}`;
// //   }


// //   // Everything else uses the generic formatter you already have
// //   return formatCell(val);
// // };


// // // Format when the entire answer is just a number (optionally with %, commas, decimals)
// // const formatStandaloneNumber = (text) => {
// //   const s = String(text ?? "").trim();
// //   if (!s) return null;

// //   // numeric like 1234, 1,234.567, -45.9, 88%
// //   const numericLike =
// //     /^-?\d+(?:,\d{3})*(?:\.\d+)?%?$/.test(s) ||
// //     /^-?\d+(?:\.\d+)?%?$/.test(s);

// //   if (!numericLike) return null;

// //   // Reuse your existing numeric formatter (0 decimals, keeps % if present)
// //   return formatCell(s);
// // };


// //   return (
// //     <>
// //       <style>{`
// //       body.light-mode {
// //     --chat-text-color: #000;
// //     --input-bg-color: rgba(255, 255, 255, 0.9);
// //   }

// //   body.dark-mode {
// //     --chat-text-color: #fff;
// //     --input-bg-color: rgba(15, 15, 15, 0.3);
// //   }
// //         .assistant-container {
// //           .assistant-container {
// //           position: relative;
// //           z-index: 9999;
// //           width: 100%;
// //           display: flex;
// //           flex-direction: column;
// //           align-items: center;
// //           left: 40px;
// //         }
// //         .assistant-input-wrapper {
// //     display: flex;
// //     align-items: center;
// //     width: 100%;
// //     background: var(--input-bg-color);
// //     backdrop-filter: blur(20px);
// //     border: 1px solid rgba(255, 255, 255, 0.2);
// //     border-radius: 30px;
// //     padding: 10px 20px;
// //     box-shadow:
// //       0 8px 32px rgba(0, 0, 0, 0.1),
// //       0 0 8px 2px rgba(37, 99, 235, 0.5);
// //     transition: box-shadow 0.3s ease;
// //   }
// //         .assistant-input {
// //     flex: 1;
// //     border: none;
// //     background: transparent;
// //     font-size: 16px;
// //     outline: none;
// //     padding: 5px 10px;
// //     color: var(--chat-text-color);
// //   }


// // .response-header {
// //   position: relative;               /* anchor for the close button */
// //   display: flex;
// //   align-items: center;
// //   padding: 6px 40px 8px 0;          /* right padding so text doesn’t sit under the X */
// //   margin-bottom: 8px;
// //   font-weight: 600;
// // }

// // .close-btn {
// //   position: absolute;
// //   top: -1px;
// //   right: 8px;
// //   width: 20px;
// //   height: 20px;
// //   display: inline-flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 9999px;
// //   background: rgba(255, 255, 255, 0.9);
// //   color: #0f172a;
// //   border: 1px solid rgba(0,0,0,0.1);
// //   cursor: pointer;
// //   box-shadow: 0 2px 10px rgba(0,0,0,0.08);
// // }

// // .close-btn:hover { background: #f5a48fff; transform: translateY(-1px); }
// // .close-btn:active { transform: translateY(0); }
// //         .response-body {
// //     color: var(--chat-text-color);
// //   }
// //         .ask-button {
// //           background: rgba(37, 99, 235, 0.8);
// //           backdrop-filter: blur(10px);
// //           border: 1px solid rgba(255, 255, 255, 0.2);
// //           color: white;
// //           border-radius: 9999px;
// //           padding: 8px 12px;
// //           cursor: pointer;
// //           transition: all 0.3s ease;
// //         }
// //           .assistant-input::placeholder {
// //     color: var(--chat-text-color);
// //     opacity: 0.7;
// //   }
// //           .user-question {
// //     color: var(--chat-text-color);
// //   }

// //       .markdown-scroll-wrapper {
// //   overflow-x: hidden;
// //   width: 100%;
// // }

// // .markdown-scroll-wrapper table {
// //   width: max-content;
// //   min-width: 100%;
// //   border-collapse: collapse;
// // }

// // .assistant-response p,
// // .assistant-response span {
// //   word-break: break-word;
// //   white-space: normal;
// // }

// // .response-body {
// //   overflow-wrap: break-word;
// //   word-break: break-word;
// //   white-space: normal;
// // }

// //  :root {
// //   --shadow-md: 0 12px 40px rgba(0, 0, 0, 0.15);
// //   --border-soft: rgba(255, 255, 255, 0.2);
// //   --border-table: rgba(255, 255, 255, 0.12);
// //   --surface-tableHeader: rgba(255, 255, 255, 0.06);
// //   --text-primary: #e5e7eb;
// //   --text-muted: #94a3b8;
// //   --accent-yellow: #facc15;
// //   --input-bg-color: rgba(255, 255, 255, 0.06);
// // }

// // .resultTableWrapper--alt {
// //   margin-top: 1rem;
// //   padding: 0.5rem;
// //   border-radius: 14px;
// //   background: rgba(255, 255, 255, 0.04);
// //   backdrop-filter: blur(10px);
// //   -webkit-backdrop-filter: blur(10px);
// //   box-shadow: var(--shadow-md);
// //   overflow: auto;                 /* scroll container */
// //   border: 1px solid var(--border-soft);
// //   max-height: 380px;              /* adjust as needed */
// // }

// // .resultTable--alt {
// //   width: 100%;
// //   border-collapse: separate;
// //   border-spacing: 0;
// //   font-size: 0.92rem;
// //   color: var(--text-primary);
// // }

// // /* Header */
// // .resultTable--alt thead th {
// //   position: sticky;
// //   top: 0;
// //   z-index: 1;
// //   background: linear-gradient(135deg, #1e3a8a 50%, #0f172a 97%) !important;
// //   color: #fff; /* or keep var(--accent-yellow) if you prefer */
// //   text-transform: none;
// //   letter-spacing: 0.2px;
// //   padding: 12px 14px;
// //   border-bottom: 1px solid var(--border-table);
// //   font-weight: 700;
// // }
// // .resultTable--alt thead th:first-child { border-top-left-radius: 10px; }
// // .resultTable--alt thead th:last-child  { border-top-right-radius: 10px; }

// // /* Cells */
// // .resultTable--alt td {
// //   padding: 12px 14px;
// //   border-bottom: 1px solid rgba(116, 56, 177, 0.95);
// // }
// // /* Stronger contrast for table rows (alt table) */
// // .resultTable--alt tbody tr:nth-child(odd)  { 
// //   background: rgba(228, 231, 236, 1) !important;  /* slate/near-navy */
// // }
// // .resultTable--alt tbody tr:nth-child(even) { 
// //   background: rgba(211, 212, 214, 0.97) !important;  /* slate/near-navy */
// // }
// // .resultTable--alt tbody tr:hover { 
// //   background: rgba(99, 102, 241, 0.22) !important; /* keep your hover cue */
// // }

// // /* Rounded row bottoms */
// // .resultTable--alt tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
// // .resultTable--alt tbody tr:last-child td:last-child  { border-bottom-right-radius: 10px; }

// // /* Align numbers to the right and use tabular figures */
// // .resultTable--alt th:nth-child(n+2),
// // .resultTable--alt td:nth-child(n+2) {
// //   text-align: right;
// //   font-variant-numeric: tabular-nums;
// //   font-feature-settings: "tnum" 1;
// // }

// // /* ---------- Result table (dark) ---------- */
// // .resultTableWrapper {
// //   margin-top: 1.25rem;
// //   padding: 1rem;
// //   border-radius: 12px;

// //   background: rgba(249, 251, 252, 0.91);

// //   backdrop-filter: blur(10px);
// //   -webkit-backdrop-filter: blur(10px);
// //   box-shadow: var(--shadow-md);
// //   overflow-x: auto;
// //   border: 1px solid var(--border-soft);
// // }

// // .resultTable {
// //   width: 100%;
// //   border-collapse: collapse;
// //   color: var(--text-primary);
// //   font-size: 0.9rem;
// // }

// // .resultTable th {
// //   background-color: var(--surface-tableHeader);
// //   color: var(--accent-yellow);
// //   padding: 0.65rem;
// //   border: 1px solid var(--border-table);
// //   text-align: left;
// // }

// // .resultTable td {
// //   padding: 0.6rem;
// //   border: 1px solid var(--border-table);
// // }

// // .warningBox {
// //   padding: 10px 12px;
// //   background: #fffbe6;
// //   border: 1px solid #ffe58f;
// //   border-radius: 8px;
// //   font-size: 14px;
// //   margin: 8px 0;
// //   color: #92400e;
// // }

// // .downloadLink {
// //   background: none;
// //   border: none;
// //   color: var(--accent-yellow);
// //   cursor: pointer;
// //   text-decoration: underline;
// //   padding: 0;
// // }

// // .resultTableCell { /* if you want extra cell styles beyond .resultTable th/td */
// //   padding: 0.6rem;
// //   border: 1px solid var(--border-table);
// // }

// // .collapseButton {
// //   text-align: right;
// //   margin-top: 6px;
// // }

// // .collapseButtonLink {
// //   background: none;
// //   border: none;
// //   color: #60a5fa;
// //   cursor: pointer;
// //   text-decoration: underline;
// //   padding: 0;
// // }

// // .expandNote {
// //   padding: 0.5rem;
// //   font-size: 0.875rem;
// //   text-align: center;
// //   color: var(--text-muted);
// // }

// // /* Assistant card */
// // .assistant-response {
// //   position: relative;
// //   width: 100%;
// //   max-height: 300px; /* keep only one */
// //   overflow-y: auto;
// //   margin-bottom: 10px;
// //   background: var(--input-bg-color);
// //   backdrop-filter: blur(25px);
// //   border: 1px solid rgba(255, 255, 255, 0.2);
// //   border-radius: 16px;
// //   padding: 20px;
// //   box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
// //   animation: fadeInUp 0.4s ease;
// //   left: 0;
// // }


// //        .assistant-response {
// //         max-height: 300px; 
// //   position: relative;
// //   width: 100%;
// //   max-height: 300px; /* Set your preferred max height */
// //   overflow-y: auto;
// //   margin-bottom: 10px;
// //   background: var(--input-bg-color);
// //   backdrop-filter: blur(25px);
// //   border: 1px solid rgba(255, 255, 255, 0.2);
// //   border-radius: 16px;
// //   padding: 20px;
// //   box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
// //   animation: fadeInUp 0.4s ease;
// //   left: 0px;
// // }

// //         @keyframes spin {
// //           0% { transform: rotate(0deg); }
// //           100% { transform: rotate(360deg); }
// //         }
// //           @keyframes fadeInUp {
// //           from {
// //             opacity: 0;
// //             transform: translateY(20px);
// //           }
// //           to {
// //             opacity: 1;
// //             transform: translateY(0);
// //           }
// //         }
// //       `}
// //       </style>


      

// //      {/* <div className="assistant-container">
// //   {answer && (
// //     <div className="assistant-response">
// //       <div className="response-header">
// //         <strong className="user-question">{query}</strong>
// //         <X size={16} onClick={() => setAnswer("")} className="close-btn" />
// //       </div>

// //       <div className="response-body">
// //         <div className="markdown-scroll-wrapper">
// //   {answer.includes("- ") || answer.includes("\n") ? (
// //     <ReactMarkdown
// //       remarkPlugins={[remarkGfm]}
// //       components={{
// //         ul: ({ node, ...props }) => (
// //           <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />
// //         ),
// //         ol: ({ node, ...props }) => (
// //           <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }} {...props} />
// //         ),
// //         li: ({ node, ...props }) => (
// //           <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }} {...props} />
// //         ),
// //         p: ({ node, ...props }) => (
// //           <p style={{ marginBottom: '1rem', lineHeight: '1.6' }} {...props} />
// //         ),
// //         table: ({ node, ...props }) => (
// //           <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }} {...props} />
// //         ),
// //         th: ({ node, ...props }) => (
// //           <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }} {...props} />
// //         ),
// //         td: ({ node, ...props }) => (
// //           <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />
// //         ),
// //       }}
// //     >
// //       {answer}
// //     </ReactMarkdown>
// //   ) : (
// //     <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
// //       {answer.split(/(?<=[0-9])\s+(?=[A-Z])/).map((item, idx) =>

// //         item.trim() && (
// //           <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
// //             {item.trim()}
// //           </li>
// //         )
// //       )}
// //     </ul>
// //   )}

// //   {answer.includes("please download") && (
// //     <button
// //       className="download-button"
// //       onClick={() => downloadCSV(sessionIdRef.current, query, lastAnsweredQuery)}
// //     >
// //       ⬇ Download Full CSV
// //     </button>
// //   )}
// // </div>
// //       </div>
  
// //             {/* <div className="response-body">{answer}</div> */}
// //           {/* </div>
// //         )}

// //         <div className="assistant-input-wrapper">
// //           <input
// //   type="text"
// //   className="assistant-input"
// //   placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
// //   value={query}
// //   onChange={(e) => setQuery(e.target.value)}
// //   onClick={() => {
// //     if (!query.trim() && rotatingPlaceholder) {
// //       setQuery(rotatingPlaceholder);
// //     }
// //   }}
// //   onKeyDown={(e) => e.key === "Enter" && checkIntentAndAsk()}
// // />

// //           <button 
// //             className="ask-button" 
// //             onClick={checkIntentAndAsk} 
// //             disabled={isLoading || !query.trim() || !sessionId}

// //           >
// //             {isLoading ? (
// //               <div style={{ 
// //                 width: 18, 
// //                 height: 18, 
// //                 border: '2px solid transparent',
// //                 borderTop: '2px solid white',
// //                 borderRadius: '50%',
// //                 animation: 'spin 1s linear infinite'
// //               }} />
// //             ) : (
// //               <Send size={18} />
// //             )}
// //           </button>
// //         </div>
// //       </div>
// //     </>
// //   );
// // }; */}
// // <div className="assistant-container">
// //   {answer && (
// //     <div className="assistant-response">
// //       <div className="response-header">
// //         {/* <strong className="user-question">{query}</strong> */}
// //         <strong className="user-question" style={{ fontFamily: "'Titillium Web', 'Segoe UI', sans-serif", fontWeight: 700 }}>{lastAnsweredQuery || query}</strong>
// //         <X size={16} onClick={() =>  { setAnswer(""); setSummary(""); }} className="close-btn" />
// //       </div>

// //       <div className="response-body">
// //         <div className="markdown-scroll-wrapper">
// //           {/* Unified table renderer (uses msg.rows if present, else parses displayAnswer) */}
// //             {/* Replace the entire ReactMarkdown/list branch with this */}
// // {(() => {
// //   // 1) If backend provided rows, trust that as tabular.
// //   const hasServerRows = Array.isArray(serverRows) && serverRows.length > 0 &&
// //     typeof serverRows[0] === "object" && Object.keys(serverRows[0] || {}).length >= 2;

// //   // 2) If no rows from server, decide from text shape.
// //   const canParseText = !hasServerRows && looksTabular(displayAnswer);

// //   // 3) Parse only if it looks tabular; otherwise keep rows empty so we fall back to Markdown.
// //   const parsed = canParseText ? parseAnswerToTable(displayAnswer) : { columns: [], rows: [] };

// //   // 4) Choose rows source
// //   const tableRows = hasServerRows ? serverRows : parsed.rows;

// //   if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
// //   // If the whole answer is one number, pretty-print it
// //   const solo = formatStandaloneNumber(displayAnswer);
// //   if (solo !== null) {
// //     return (
// //       <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
// //         {solo}
// //       </div>
// //     );
// //   }

// //   // Otherwise render as markdown as usual
// //   return (
// //     <ReactMarkdown remarkPlugins={[remarkGfm]}>
// //       {displayAnswer || "_No content._"}
// //     </ReactMarkdown>
// //   );
// // }


// //   // 5) If not truly tabular, render plain Markdown (this fixes your "intent = NO" case)
// //   // if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
// //   //   return (
// //   //     <ReactMarkdown remarkPlugins={[remarkGfm]}>
// //   //       {displayAnswer || "_No content._"}
// //   //     </ReactMarkdown>
// //   //   );
// //   // }

// //   const columns = Object.keys(tableRows[0] || {});
// //   const total = rowCount || tableRows.length;
// //   const tooMany = total > 50;
// //   const visibleRows = tableExpanded ? tableRows : tableRows.slice(0, 8);
// //   const visibleCols = tableExpanded ? columns : columns.slice(0, 3);

// //   return (
// //     <>
// //       {tooMany && (
// //         <div className="warningBox">
// //           Too many results to display ({total} rows).{" "}
// //           <button
// //             className="downloadLink"
// //             onClick={() => downloadCSV(lastAnsweredQuery || query)}
// //           >
// //             Download full results (CSV)
// //           </button>
// //         </div>
// //       )}

// //       {!tooMany && tableRows.length >= 1 && (
// //         <div className="resultTableWrapper resultTableWrapper--alt">
// //           <table className="resultTable resultTable--alt"  >
// //             {/* <thead>
// //               <tr>
// //                 {visibleCols.map((key) => (
// //                   <th key={key} className="resultTableCell">{formatHeader(key)}</th>
// //                 ))}
// //               </tr>
// //             </thead> */}

// //             <thead>
// //                   <tr>
// //                     {visibleCols.map((key) => (
// //                       <th key={key} className="resultTableCell">
// //                         {buildHeaderLabel(key, tableRows)}
// //                       </th>
// //                     ))}
// //                   </tr>
// //                 </thead>

// //             {/* <tbody>
// //               {visibleRows.map((row, i) => (
// //                 <tr key={i}>
// //                   {visibleCols.map((k) => (
// //                     <td key={k} className="resultTableCell">
// //                         {formatCellWithUnit(row[k], k, tableRows)}
// //                       </td>
// //                   ))}
// //                 </tr>
// //               ))}
// //               {tableRows.length > 8 && !tableExpanded && (
// //                 <tr>
// //                   <td colSpan={Math.min(3, columns.length)} className="expandNote">
// //                     Showing first 8 rows.{" "}
// //                     <button onClick={() => setTableExpanded(true)}>
// //                       Click to expand <FiMaximize2 size={16} />
// //                     </button>
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody> */}
// //             <tbody>
// //   {visibleRows.map((row, i) => (
// //     <tr key={i}>
// //       {visibleCols.map((k) => (
// //         <td key={k} className="resultTableCell">
// //           {formatCellForColumn(k, row[k], tableRows)}
// //         </td>
// //       ))}
// //     </tr>
// //   ))}
// //   {tableRows.length > 8 && !tableExpanded && (
// //     <tr>
// //       <td colSpan={Math.min(3, columns.length)} className="expandNote">
// //         Showing first 8 rows.{" "}
// //         <button onClick={() => setTableExpanded(true)}>
// //           Click to expand <FiMaximize2 size={16} />
// //         </button>
// //       </td>
// //     </tr>
// //   )}
// // </tbody>

// //           </table>

// //           {tableExpanded && (
// //             <div className="collapseButton">
// //               <button
// //                 onClick={() => setTableExpanded(false)}
// //                 className="collapseButtonLink"
// //               >
// //                 Click to collapse <FiMinimize2 size={16} />
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       )}
// //     </>
// //   );
// // })()}


// //           {/* {displayAnswer.includes("- ") || displayAnswer.includes("\n") ? (
// //             <ReactMarkdown
// //               remarkPlugins={[remarkGfm]}
// //               components={{
// //                 ul: ({ node, ...props }) => (
// //                   <ul
// //                     style={{
// //                       paddingLeft: "1.5rem",
// //                       marginBottom: "1rem",
// //                       listStyleType: "disc",
// //                     }}
// //                     {...props}
// //                   />
// //                 ),
// //                 ol: ({ node, ...props }) => (
// //                   <ol
// //                     style={{
// //                       paddingLeft: "1.5rem",
// //                       marginBottom: "1rem",
// //                       listStyleType: "decimal",
// //                     }}
// //                     {...props}
// //                   />
// //                 ),
// //                 li: ({ node, ...props }) => (
// //                   <li style={{ marginBottom: "0.5rem", lineHeight: "1.6" }} {...props} />
// //                 ),
// //                 p: ({ node, ...props }) => (
// //                   <p style={{ marginBottom: "1rem", lineHeight: "1.6" }} {...props} />
// //                 ),
// //                 table: ({ node, ...props }) => (
// //                   <table
// //                     style={{
// //                       width: "100%",
// //                       borderCollapse: "collapse",
// //                       marginBottom: "1rem",
// //                     }}
// //                     {...props}
// //                   />
// //                 ),
// //                 th: ({ node, ...props }) => (
// //                   <th
// //                     style={{
// //                       border: "1px solid #ddd",
// //                       padding: "8px",
// //                       fontWeight: "bold",
// //                       backgroundColor: "#f9f9f9",
// //                     }}
// //                     {...props}
// //                   />
// //                 ),
// //                 td: ({ node, ...props }) => (
// //                   <td style={{ border: "1px solid #ddd", padding: "8px" }} {...props} />
// //                 ),
// //               }}
// //             >
// //               {displayAnswer}
// //             </ReactMarkdown>
// //           ) : (
// //             <ul style={{ paddingLeft: "1.5rem", listStyleType: "disc" }}>
// //               {(
// //                 // Split into chunks like:
// //                 // "Renewed Customers, 124..." | "Low Value Customers, 79..." | ...
// //                 displayAnswer.split(/(?<=\d)\s+(?=[A-Z])/)
// //               ).map((chunk, idx) => {
// //                 const parts = chunk
// //                   .split(",")
// //                   .map((s) => s.trim())
// //                   .filter(Boolean);

// //                 if (!parts.length) return null;

// //                 const [label, ...vals] = parts;

// //                 // Fallback: if it isn't in "Label, value, value..." shape
// //                 if (!vals.length) {
// //                   const fallback = parts.join(" - ");
// //                   return (
// //                     <li key={idx} style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>
// //                       {fallback}
// //                     </li>
// //                   );
// //                 } */}

// //                 {/* // Preferred: Label + sub-bullets of values
// //                 return (
// //                   <li key={idx} style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
// //                     <strong>{label}</strong>
// //                     <ul
// //                       style={{
// //                         paddingLeft: "1.25rem",
// //                         marginTop: "0.25rem",
// //                         listStyleType: "circle",
// //                       }}
// //                     >
// //                       {vals.map((v, i) => (
// //                         <li key={i} style={{ marginBottom: "0.25rem" }}>
// //                           {v}
// //                         </li>
// //                       ))}
// //                     </ul>
// //                   </li>
// //                 );
// //               })}
// //             </ul>
// //           )} */}

// //            {/* >>> ADD SUMMARY HERE (inside the same card, under the answer) <<< */}
// //           {summary && (
// //             <div
// //               style={{
// //                 marginTop: "12px",
// //                 padding: "12px 14px",
// //                 borderLeft: "4px solid #facc15",
// //                 borderRadius: "8px",
// //                 background: "var(--input-bg-color)"
// //               }}
// //             >
// //               <div style={{ fontWeight: 600, marginBottom: "6px" }}></div>
// //               <ReactMarkdown remarkPlugins={[remarkGfm]}>
// //                 {summary}
// //               </ReactMarkdown>
// //             </div>
// //           )}

          
// //           {/* {answer.includes("please download") && (
// //   <button
// //     className="download-button"
// //     onClick={() => downloadCSV(lastAnsweredQuery || query)}
// //   >
// //     ⬇ Download Full CSV
// //   </button>
// // )} */}

// // {/* {moreRowsMatch && (
// //   <button
// //     className="download-button"
// //     onClick={() => downloadCSV(lastAnsweredQuery || query)}
// //     title={`Show remaining ${Number(moreRowsMatch[1])} rows`}
// //   >
// //     Show remaining {Number(moreRowsMatch[1])} rows
// //   </button>
// // )} */}


// //         </div>
// //       </div>
// //     </div>
// //   )}

// //   <div className="assistant-input-wrapper">
// //     <input
// //       type="text"
// //       className="assistant-input"
// //       placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
// //       value={query}
// //       onChange={(e) => setQuery(e.target.value)}
// //       onClick={() => {
// //         if (!query.trim() && rotatingPlaceholder) {
// //           setQuery(rotatingPlaceholder);
// //         }
// //       }}
// //       onKeyDown={(e) => e.key === "Enter" && checkIntentAndAsk()}
// //     />

// //     {/* UPDATED BUTTON: gated by sessionReady and sessionId; keeps your spinner */}
// //     <button
// //       className="ask-button"
// //       onClick={checkIntentAndAsk}
// //       disabled={isLoading || !query.trim()}
// //       // disabled={isLoading || !query.trim() || !sessionId || !sessionReady}
// //       aria-busy={isLoading}
// //       title={!query.trim() ? "Type your question" : isLoading ? "Sending..." : "Send"}
// //       // title={!sessionReady ? "Connecting to database..." : undefined}
// //     > {isLoading ? (
// //     <div
// //       style={{
// //         width: 18,
// //         height: 18,
// //         border: "2px solid transparent",
// //         borderTop: "2px solid white",
// //         borderRadius: "50%",
// //         animation: "spin 1s linear infinite",
// //       }}
// //     />
// //   ) : (
// //     <>
// //       <Send size={18} />
// //       {/* Send */}
// //     </>
// //   )}
// //       {/* {!sessionReady ? (
// //         <>Connecting...</>
// //       ) : isLoading ? (
// //         <div
// //           style={{
// //             width: 18,
// //             height: 18,
// //             border: "2px solid transparent",
// //             borderTop: "2px solid white",
// //             borderRadius: "50%",
// //             animation: "spin 1s linear infinite",
// //           }}
// //         />
// //       ) : (
// //         <>
// //           <Send size={18} />
// //           Send
// //         </>
// //       )} */}
// //     </button>
// //   </div>
// // </div>

// //     </>
// //   );
// // };


// // export default ChatPage;


import React, { useState, useEffect, useRef, useCallback } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { FiSend, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { FaDatabase, FaFileAlt } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import ChatPDF from "./Chatpdf";
import { Send, X } from "lucide-react";
import { FORMAT_CONFIG, formatPercentage } from '../config/formatConfig';


const ChatPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [rotatingPlaceholder, setRotatingPlaceholder] = useState("");
  const sessionIdRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [lastAnsweredQuery, setLastAnsweredQuery] = useState("");
  const didConnectRef = useRef(false);
  const [summary, setSummary] = useState("");
  const [serverRows, setServerRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);   // optional, for “too many rows” banner
  const [isCurrentResponseGeneral, setIsCurrentResponseGeneral] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [narrative, setNarrative] = useState(null);
 const [input, setInput] = useState("");
    const [inputFocused, setInputFocused] = useState(false);
    const [activeResponse, setActiveResponse] = useState(null);
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
    const messagesEndRef = useRef(null);
    const [suggestionList, setSuggestionList] = useState([]);
        const [relatedEntries, setRelatedEntries] = useState([]);
        const [lastQuery, setLastQuery] = useState("");
        const [showIncompletePopup, setShowIncompletePopup] = useState(false);
            // Keep track of last full question
        const [lastFullQuestion, setLastFullQuestion] = useState(null);
        const [lastFullType, setLastFullType] = useState("");
        const [isProcessing, setIsProcessing] = useState(false);
        
const lastUsedSQLRef = useRef(null);

        

    // const USE_STREAMING = true; // toggle on/off without deleting old code
  const processResults = (data, queryLower) => {
    const safeResults = Array.isArray(data.results) ? data.results : [];

    // Extract entity words from query
    const entityWords = [];
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

    Object.entries(monthMap).forEach(([short, full]) => {
      if (queryLower.includes(short) || queryLower.includes(full)) {
        entityWords.push(full);
      }
    });

    const yearMatch = queryLower.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) entityWords.push(yearMatch[1]);

    ["state", "zone", "branch", "city", "region", "district"].forEach((k) => {
      if (queryLower.includes(k)) entityWords.push(k);
    });

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

      // 🚫 Skip greetings or trivial
      if (["hi", "hello", "hey"].includes(q.toLowerCase())) return false;

      // 🚫 Skip fragments like "in jan", "in feb", "in march"
      if (/^in\s+[a-z]+$/i.test(q)) return false;

      // 🚫 Skip "in in ..." duplicates
      if (/in\s+in\s+/i.test(q)) return false;

      // 🚫 Skip too-short questions (≤ 2 words)
      if (q.split(/\s+/).length <= 2) return false;

      // 🚫 Skip duplicates
      if (seen.has(q.toLowerCase())) return false;
      seen.add(q.toLowerCase());

      return true;
    })
    .slice(0, 5);
 // show up to 5
  };

  // ✅ Effect 1: Fetch all entries
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

  // ✅ Effect 2: Fetch search_corpus results
  useEffect(() => {
    if (showIntentPopup && pendingQuestion) {
      fetch(
        `${API_BASE_URL}/search_corpus/?q=${encodeURIComponent(
          pendingQuestion
        )}&prev=${encodeURIComponent(
          lastQuery
        )}&boost=${encodeURIComponent(
          JSON.stringify([
            "date",
            "time",
            "year",
            "month",
            "zone",
            "state",
            "branch",
            "city",
            "country",
            "district",
            "region",
          ])
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          const queryLower = pendingQuestion.toLowerCase();
          setRelatedEntries(processResults(data, queryLower));
          if (data.resolved_query) setLastQuery(data.resolved_query);
        })
        .catch((err) =>
          console.error("Error fetching boosted search corpus:", err)
        );
    }
  }, [showIntentPopup, pendingQuestion]);


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

  

  // Add this right after your component declaration to debug:
useEffect(() => {
  console.log(`🔍 serverRows state updated: ${serverRows?.length || 0} rows`);
}, [serverRows]);

useEffect(() => {
  console.log(`🔍 rowCount state updated: ${rowCount}`);
}, [rowCount]);

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


  const isRatableMessage = (msg) => {
  if (!msg) return false;

  // ❌ Never rate general Qwen responses
  if (msg.isGeneralResponse) return false;

  // ✅ Only rate data-analysis style responses
  return (
    msg.asked_question ||
    msg.rows?.length > 0 ||
    msg.chart_config ||
    msg.narrative ||
    msg.summary ||
    msg.query_used
  );
};
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



  const MORE_ROWS_RE = /\.\.\.\s*and\s+(\d+)\s+more\s+rows\.?$/i;
  const moreRowsMatch = typeof answer === "string" ? answer.match(MORE_ROWS_RE) : null;
  // const displayAnswer = moreRowsMatch ? answer.replace(MORE_ROWS_RE, "").trim() : answer;
  const baseAnswer =
    answer ||
    narrative?.opener ||
    "";

  const displayAnswer = moreRowsMatch
    ? baseAnswer.replace(MORE_ROWS_RE, "").trim()
    : baseAnswer;

  // --- streaming gate + safe loading ref
const USE_STREAMING = true;                         // flip to false to go back to old behavior
// const isLoadingRef = useRef(false);
// useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);


// const Narrative = ({ data, onFollowUp }) => {
//   if (!data) return null;
//   const { opener = "", insights = [], recommendations = [], next_step = "" } = data || {};
//   return (
//     <div style={{
//       margin: "8px 0 12px",
//       padding: "12px 14px",
//       borderRadius: 12,
//       border: "1px solid rgba(255,255,255,0.2)",
//       background: "var(--input-bg-color)"
//     }}>
//       {opener ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{opener}</div> : null}

//       {!!insights.length && (
//         <>
//           <div style={{ fontWeight: 600, marginTop: 6, marginBottom: 4 }}>Key insights</div>
//           <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
//             {insights.map((i, idx) => <li key={idx}>{i}</li>)}
//           </ul>
//         </>
//       )}

//       {!!recommendations.length && (
//         <>
//           <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 4 }}>Recommendations</div>
//           <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
//             {recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
//           </ul>
//         </>
//       )}

//       {next_step ? (
//         <button
//           type="button"
//           onClick={() => onFollowUp?.(next_step)}
//           style={{
//             marginTop: 10,
//             width: "100%",
//             textAlign: "left",
//             border: "1px dashed rgba(255,255,255,0.3)",
//             background: "transparent",
//             color: "var(--text-muted)",
//             borderRadius: 10,
//             padding: "8px 10px",
//             cursor: "pointer"
//           }}
//         >
//           {next_step}
//         </button>
//       ) : null}
//     </div>
//   );
// };


const Narrative = ({ data, onFollowUp }) => {
  if (!data) return null;
  const { opener = "", insights = [], recommendations = [], next_step = "" } = data || {};

  // NEW: state for tabs
  const [activeTab, setActiveTab] = React.useState("insights");

  return (
    <div
      style={{
        margin: "8px 0 12px",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "var(--input-bg-color)",
      }}
    >
      {/* Tab header */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("insights")}
          style={{
            fontWeight: activeTab === "insights" ? 700 : 500,
            borderBottom: activeTab === "insights" ? "2px solid #facc15" : "2px solid transparent",
            background: "transparent",
            color: "#fff",
            paddingBottom: "0.25rem",
            cursor: "pointer",
          }}
        >
          Key Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recommendations")}
          style={{
            fontWeight: activeTab === "recommendations" ? 700 : 500,
            borderBottom: activeTab === "recommendations" ? "2px solid #fde047" : "2px solid transparent",
            background: "transparent",
            color: "#fff",
            paddingBottom: "0.25rem",
            cursor: "pointer",
          }}
        >
          Recommendations
        </button>
      </div>

      {/* Key Insights Tab */}
      {activeTab === "insights" && (
        <>
          {opener ? (
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{opener}</div>
          ) : null}

          {!!insights.length && (
            <>
              <div style={{ fontWeight: 600, marginTop: 6, marginBottom: 4 }}>Key insights</div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
                {insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "var(--text-primary)",
            borderLeft: "4px solid #fde047",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            fontSize: "0.95rem",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#fde047" }}>
            Recommendations
          </div>
          {!!recommendations.length && (
            <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
              {recommendations.map((r, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Follow-up button stays the same */}
      {next_step ? (
        <button
          type="button"
          onClick={() => onFollowUp?.(next_step)}
          style={{
            marginTop: 10,
            width: "100%",
            textAlign: "left",
            border: "1px dashed rgba(255,255,255,0.3)",
            background: "transparent",
            color: "var(--text-muted)",
            borderRadius: 10,
            padding: "8px 10px",
            cursor: "pointer",
          }}
        >
          {next_step}
        </button>
      ) : null}
    </div>
  );
};

const isIncomplete = (q) => {
  const s = q.trim().toLowerCase();

  // Too short
  if (s.length < 5) return true;

  // Starters without object
  if (/^(what|who|where|when|how)\s*(is|are|was|were)?$/.test(s)) return true;

  // Add more patterns if needed
  return false;
};

const checkIntentAndSend = async (question) => {
  console.log("🔍 Checking intent for:", question);

   // 🆕 Incomplete guard before backend
  if (isIncomplete(question)) {
    console.warn("⚠️ Incomplete question (frontend guard)");
    setShowIncompletePopup(true);
    setIsLoading(false);
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/check_intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question }),
    });

    if (!response.ok) {
      console.warn("Intent check failed, defaulting to general");
      await sendMessageWithIntent(question, false); // Default to general
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
          console.log("📊 Routing to data analysis");
          await sendMessageWithIntent(question, true);
          break;

        case "NO":
          console.log("💭 Routing to general knowledge");
          await sendMessageWithIntent(question, false);
          break;

        // case "UNCERTAIN":
        //   if (isIncompleteFragment(question)) {
        //     // 🚨 This is an incomplete fragment → show rephrase popup
        //     console.log("⚠️ Incomplete fragment detected");
        //     setPendingQuestion(question);
        //     setShowIntentPopup(true);   // your existing popup
        //   } else {
        //     // 🤷 Normal uncertain → show your "General vs Data" popup
        //     console.log("❓ Intent uncertain, asking user");
        //     setPendingQuestion(question);
        //     setShowIntentPopup(true);
        //   }
        //   setInput("");
        //   break;


        case "UNCERTAIN":
          // ✅ If it's a clear fragment → block
          if (isIncompleteFragment(question)) {
            console.log("⚠️ Incomplete fragment detected → rephrase popup");
            setPendingQuestion(question);
            setShowIntentPopup(true);
            setInput("");
            break;
          }

          // ✅ If it's long enough (>= 5 words) → treat as data analysis
          if (question.split(" ").length > 5) {
            console.warn("⚡ UNCERTAIN but full question detected → routing to SQL anyway");
            await sendMessageWithIntent(question, true);
            break;
          }

          // ✅ Otherwise fallback popup
          console.log("❓ Intent uncertain, asking user to choose (Data / General)");
          setPendingQuestion(question);
          setShowIntentPopup(true);
          setInput("");
          break;

        default:
          console.warn("Unknown intent response:", data.answer, "- defaulting to general");
          await sendMessageWithIntent(question, false);
      }

      
    
  } catch (error) {
    console.error("❌ Intent check error:", error);
    // Fallback to general knowledge on error
    await sendMessageWithIntent(question, false);
  }
  // const res = { content: `Result for: ${q}` };
  //   setActiveResponse(res); // ✅ feed into one state
  //   return res;
};

// const handleIntentChoice = async (intent) => {
//   setShowIntentPopup(false);
//   setIsCurrentResponseGeneral(intent === "general");

//   const questionToAsk = pendingQuestion;
  
//   if (intent === "general") {
//     // Call ask_qwen for general questions
//     await handleGeneralQuestion(pendingQuestion);
//   } else  {
//     // Call your existing data analysis function
//     if (USE_STREAMING) {
//       await checkIntentAndAskStream(pendingQuestion);
//     } else {
//       await checkIntentAndAsk(pendingQuestion);
//     }
//   }
  
//   setPendingQuestion("");
// };

// const handleIntentChoice = async (intentType) => {
//   console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);

//   const questionToAsk = pendingQuestion; // ✅ capture before clearing
//   if (!questionToAsk) {
//     console.warn("⚠️ No pending question to process");
//     return;
//   }

//   setShowIntentPopup(false);
//   setIsCurrentResponseGeneral(intentType === "general"); // ✅ preserve your flag

//   if (intentType === "general") {
//     // ✅ General path → ask_qwen
//     await handleGeneralQuestion(questionToAsk);
//     // or if you prefer to unify everything later:
//     // await sendMessageWithIntent(questionToAsk, false);
//   } else if (intentType === "data") {
//     // ✅ Data path → ask_question_stream
//     await sendMessageWithIntent(questionToAsk, true);
//     // or, if you need old non-streaming fallback:
//     // if (USE_STREAMING) {
//     //   await checkIntentAndAskStream(questionToAsk);
//     // } else {
//     //   await checkIntentAndAsk(questionToAsk);
//     // }
//   }

//   // ✅ clear AFTER sending
//   setPendingQuestion("");
// };

// Add this new function to handle intent popup choices
const handleIntentChoice = async (intentType) => {
  console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);

  const questionToAsk = pendingQuestion; // ✅ capture before clearing
  if (!questionToAsk) {
    console.warn("⚠️ No pending question to process");
    return;
  }

  setShowIntentPopup(false);

  try {
    if (intentType === "general") {
      console.log("💭 Routing to general knowledge (ask_qwen)");
      setIsCurrentResponseGeneral(true);
      await sendMessageWithIntent(questionToAsk, false); // general = false
    } else if (intentType === "data") {
      console.log("📊 Routing to data analysis (ask_question_stream)");
      await sendMessageWithIntent(questionToAsk, true); // data = true
    } else if (intentType === "pdf") {
      console.log("📄 Routing to PDF/vector knowledge base");
      await sendMessageWithIntent(questionToAsk, "pdf");
    } else {
      console.warn("⚠️ Unknown intent type:", intentType);
      await sendMessageWithIntent(questionToAsk, false); // fallback general
    }
  } catch (err) {
    console.error("❌ Error in handleIntentChoice:", err);
  } finally {
    // ✅ clear AFTER sending
    setPendingQuestion("");
  }
};


// const handleIntentChoice = async (intentType) => {
//   console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);

//   const questionToAsk = pendingQuestion; // ✅ capture before clearing
//   if (!questionToAsk) {
//     console.warn("⚠️ No pending question to process");
//     return;
//   }

//   setShowIntentPopup(false);

//   if (intentType === "general") {
//     // General → ask_qwen
//     await handleGeneralQuestion(pendingQuestion);
//     // await sendMessageWithIntent(questionToAsk, false);
//   } else if (intentType === "data") {
//     // Data Analysis → ask_question_stream
//     await sendMessageWithIntent(questionToAsk, true);
//   }

//   // ✅ clear AFTER using it
//   setPendingQuestion("");
// };

const handleGeneralQuestion = async (question) => {
  setIsLoading(true);
  try {
    // Your existing ask_qwen implementation
    const response = await fetch(`${API_BASE_URL}/ask_qwen/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    
    const data = await response.json();
    
    // Set only the answer for general responses
    setAnswer(data.response || data.answer);
    setLastAnsweredQuery(question);
    
    // Clear data-specific states
    setServerRows([]);
    setSummary("");
    setNarrative(null);
    
  } catch (error) {
    console.error('Error calling ask_qwen:', error);
    setAnswer('Sorry, there was an error processing your request.');
  } finally {
    setIsLoading(false);
  }
};
// const handleIntentChoice = async (intentType) => {
//   console.log("🎯 User chose intent:", intentType, "for question:", pendingQuestion);

//   const questionToAsk = pendingQuestion;  // ✅ capture before clearing
//   if (!questionToAsk) {
//     console.warn("⚠️ No pending question to process");
//     return;
//   }

//   setShowIntentPopup(false);

//   const isDataIntent = intentType === "data";
//   await sendMessageWithIntent(questionToAsk, isDataIntent);

//   // ✅ clear AFTER sending
//   setPendingQuestion("");
// };


// Your existing handleSubmit function remains the same
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🚀 handleSubmit triggered", { input, hasAskedFirstQuestion });


  if (isIncompleteQuestion(query)) {
    setShowIncompletePopup(true);
    return; // 🚫 stop here, don’t send to backend
  }
  if (!input.trim()) return;

  // ✅ Only check rating requirement after the first question has been asked
  if (hasAskedFirstQuestion) {
    const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
    
    if (lastBotIdx !== -1) {
      const lastBotMsg = messages[lastBotIdx];
      const isActualResponse = isRatableMessage(lastBotMsg);
      
      // Check if last bot message needs rating
      if (isActualResponse && !messageRatings[lastBotIdx]) {
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

  // Check intent for uncertain questions
  await checkIntentAndSend(input.trim());
};
// const sendMessageWithIntent = async (question, isDataIntent) => {
//   console.log("📤 Sending message with intent:", { question, isDataIntent });

//   // Add user message
//   const userMessage = { sender: "user", text: question, content: question };
//   setMessages(prev => [...prev, userMessage]);
//   setIsLoading(true);

//   try {
//     if (isDataIntent) {
//       // -----------------------
//       // Data Analysis path
//       // -----------------------
//       const endpoint = `${API_BASE_URL}/ask_question_stream/`;
//       const requestBody = { question, session_id: sessionIdRef.current, db_id: "liberty" };

//       // Seed pending bot
//       setPendingBot({
//         sender: "bot",
//         role: "assistant",
//         content: "Loading data…",
//         asked_question: question,
//         isStreaming: true,
//       });

//       if (USE_STREAMING) {
//         await handleStreamingResponse(endpoint, requestBody, question);
//       } else {
//         await handleRegularResponse(endpoint, requestBody, question);
//       }
//     } else {
//       // -----------------------
//       // General Question path - FIXED
//       // -----------------------
//       const endpoint = `${API_BASE_URL}/ask_qwen/`;
//       const requestBody = { question, session_id: sessionIdRef.current };

//       // Seed pending bot message immediately
//       const pendingBotMsg = {
//         sender: "bot",
//         role: "assistant",
//         content: "Thinking…",
//         asked_question: question,
//         isStreaming: true,
//       };
      
//       // Add the pending message to the messages array
//       setMessages(prev => [...prev, pendingBotMsg]);
//       setPendingBot(pendingBotMsg);

//       // ✅ IMPORTANT: Update assistant card states for general questions
//       setAnswer("Thinking…");
//       setSummary("");
//       setServerRows([]);
//       setRowCount(0);
//       setNarrative(null);
//       setLastAnsweredQuery(question);

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       const data = await response.json();

//       const botResponse = {
//         sender: "bot",
//         role: "assistant",
//         text: data.answer || data.response || "I couldn't generate a response.",
//         content: data.answer || data.response || "",
//         asked_question: question,
//         summary: data.summary || null,
//         isStreaming: false,
//       };

//       // ✅ Replace the pending bot message (last message) with the actual response
//       setMessages(prev => {
//         if (prev.length > 0 && prev[prev.length - 1].sender === "bot" && prev[prev.length - 1].isStreaming) {
//           return [...prev.slice(0, -1), botResponse];
//         }
//         return [...prev, botResponse];
//       });

//       // ✅ IMPORTANT: Update assistant card states with the actual response
//       setAnswer(data.answer || data.response || "I couldn't generate a response.");
//       setSummary(data.summary || "");
//       setServerRows([]);
//       setRowCount(0);
//       setNarrative(null);

//       // Clear pending bot and loading state
//       setPendingBot(null);
//       setIsLoading(false);
//     }
//   } catch (error) {
//     console.error("❌ Error sending message:", error);

//     const errorBot = {
//       sender: "bot",
//       role: "assistant",
//       content: "Error occurred while processing your request.",
//       asked_question: question,
//       isStreaming: false,
//     };

//     // Replace pending bot with error message
//     setMessages(prev => {
//       if (prev.length > 0 && prev[prev.length - 1].sender === "bot" && prev[prev.length - 1].isStreaming) {
//         return [...prev.slice(0, -1), errorBot];
//       }
//       return [...prev, errorBot];
//     });

//     setPendingBot(null);
//     setIsLoading(false);
//   }
// };

const sendMessageWithIntent = async (question, isDataIntent) => {
  console.log("📤 Sending message with intent:", { question, isDataIntent });

  // Add user message
  const userMessage = { sender: "user", text: question, content: question };
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    if (isDataIntent) {
      // -----------------------
      // Data Analysis path
      // -----------------------
      const endpoint = `${API_BASE_URL}/ask_question_stream/`;
      const requestBody = { question, session_id: sessionIdRef.current, db_id: "liberty" };

      // Reset general question flag for data analysis
      setIsCurrentResponseGeneral(false);

      // Seed pending bot
      setPendingBot({
        sender: "bot",
        role: "assistant",
        content: "Loading data…",
        asked_question: question,
        isStreaming: true,
      });

      if (USE_STREAMING) {
        await handleStreamingResponse(endpoint, requestBody, question);
      } else {
        await handleRegularResponse(endpoint, requestBody, question);
      }
    } else {
      // -----------------------
      // General Question path - FIXED
      // -----------------------
      const endpoint = `${API_BASE_URL}/ask_qwen/`;
      const requestBody = { question, session_id: sessionIdRef.current };

      // Seed pending bot message immediately
      const pendingBotMsg = {
        sender: "bot",
        role: "assistant",
        content: "Thinking…",
        asked_question: question,
        isStreaming: true,
      };
      
      // Add the pending message to the messages array
      setMessages(prev => [...prev, pendingBotMsg]);
      setPendingBot(pendingBotMsg);

      // ✅ IMPORTANT: Update assistant card states for general questions
      setAnswer("Thinking…");
      setSummary("");
      setServerRows([]);
      setRowCount(0);
      setNarrative(null);
      setLastAnsweredQuery(question);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const botResponse = {
        sender: "bot",
        role: "assistant",
        text: data.answer || data.response || "I couldn't generate a response.",
        content: data.answer || data.response || "",
        asked_question: question,
        summary: data.summary || null,
        isStreaming: false,
      };

      // ✅ Replace the pending bot message (last message) with the actual response
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].sender === "bot" && prev[prev.length - 1].isStreaming) {
          return [...prev.slice(0, -1), botResponse];
        }
        return [...prev, botResponse];
      });

      // ✅ IMPORTANT: Update assistant card states with the actual response
      setAnswer(data.answer || data.response || "I couldn't generate a response.");
      setSummary(data.summary || "");
      setServerRows([]);
      setRowCount(0);
      setNarrative(null);

      // Clear pending bot and loading state
      setPendingBot(null);
      setIsLoading(false);
    }
  } catch (error) {
    console.error("❌ Error sending message:", error);

    const errorBot = {
      sender: "bot",
      role: "assistant",
      content: "Error occurred while processing your request.",
      asked_question: question,
      isStreaming: false,
    };

    // Replace pending bot with error message
    setMessages(prev => {
      if (prev.length > 0 && prev[prev.length - 1].sender === "bot" && prev[prev.length - 1].isStreaming) {
        return [...prev.slice(0, -1), errorBot];
      }
      return [...prev, errorBot];
    });

    setPendingBot(null);
    setIsLoading(false);
  }
};

const updateStreamingMessage = (question, text) => {
  setMessages(prev => {
    const idx = prev.findIndex(m => m.asked_question === question && m.isStreaming);
    if (idx !== -1) {
      // Update existing streaming bot message
      const updated = [...prev];
      updated[idx] = { ...updated[idx], text, content: text };
      return updated;
    } else {
      // Or append new streaming message if none exists
      return [...prev, { sender: "bot", text, content: text, asked_question: question, isStreaming: true }];
    }
  });
};


const updateFinalMessages = (question, finalData) => {
  setMessages(prev => {
    const updated = [...prev];
    const lastIndex = updated.length - 1;
    if (updated[lastIndex] && updated[lastIndex].sender === "bot") {
      updated[lastIndex] = {
        sender: "bot",
        text: finalData.summary || "Analysis completed",
        content: finalData.summary || "",
        asked_question: question,
        summary: finalData.summary || null,
        rows: finalData.rows || [],
        chart_config: finalData.chart_config || null,
        recommendation: finalData.recommendation || [],
        narrative: finalData.narrative || null,
        query_used: finalData.query_used || null,
        response_time: finalData.response_time || null,
        conversational_opener: finalData.conversational_opener || null,
        isStreaming: false
      };
    }
    return updated;
  });
};

const updateErrorMessage = (question, errorMsg) => {
  setMessages(prev => {
    const updated = [...prev];
    const lastIndex = updated.length - 1;
    if (updated[lastIndex] && updated[lastIndex].asked_question === question) {
      updated[lastIndex] = {
        sender: "bot",
        text: `I apologize, but I encountered an error: ${errorMsg}`,
        content: "Error occurred during streaming",
        asked_question: question,
        isError: true,
        isStreaming: false
      };
    }
    return updated;
  });
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

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     // Handle NDJSON streaming response
//     await handleNDJSONStream(response, question);

//   } catch (error) {
//     console.error("❌ Error in streaming response:", error);
//     throw error;
//   }
// };



const handleStreamingResponse = async (endpoint, requestBody, question) => {
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



// // ENHANCED NDJSON stream handler with timeout protection and heartbeat detection
// const handleNDJSONStream = async (response, question) => {
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();
 
//   const initialBotMessage = {
//     sender: "bot",
//     text: "Processing your request...",
//     content: "",
//     asked_question: question,
//     isStreaming: true,
//     corpus_used: false,
//     intentType: null
//   };

//   setIsProcessing(true);
//   setMessages(prev => [...prev, initialBotMessage]);
 
//   let buffer = '';
//   let currentPhase = '';
//   let streamingData = {
//     summary: '',
//     recommendations: [],
//     chart_config: null,
//     conversational_opener: '',
//     narrative: null,
//     corpus_used: false,
//     intentType: null,
//     rows: [],
//     sql: ''
//   };

//   // Timeout protection
//   let lastEventTime = Date.now();
//   const TIMEOUT_MS = 120000; // 2 minutes max timeout
//   const HEARTBEAT_CHECK_MS = 5000; // Check every 5 seconds
//   let timeoutCheckInterval = null;
//   let receivedFinalEvent = false;

//   // Start timeout monitor
//   timeoutCheckInterval = setInterval(() => {
//     const timeSinceLastEvent = Date.now() - lastEventTime;
    
//     if (!receivedFinalEvent && timeSinceLastEvent > TIMEOUT_MS) {
//       console.error("❌ Stream timeout detected - no events for", timeSinceLastEvent, "ms");
//       clearInterval(timeoutCheckInterval);
//       reader.cancel();
      
//       updateErrorMessage(
//         question, 
//         "Request timed out. The query may be too complex or the server is overloaded. Please try again or simplify your question."
//       );
//       setIsLoading(false);
//       setIsProcessing(false);
//     } else if (timeSinceLastEvent > 30000 && !receivedFinalEvent) {
//       // Show warning after 30 seconds of no updates
//       console.warn("⚠️ Slow response - still processing...", timeSinceLastEvent, "ms");
//       updateStreamingMessage(
//         question, 
//         `${streamingData.conversational_opener}\n\n${currentPhase}\n\n⏳ Still processing (this is taking longer than usual)...`
//       );
//     }
//   }, HEARTBEAT_CHECK_MS);
 
//   try {
//     while (true) {
//       const { done, value } = await reader.read();
     
//       if (done) {
//         console.log("✅ Stream completed");
//         clearInterval(timeoutCheckInterval);
        
//         // If we never received a final event, treat as error
//         if (!receivedFinalEvent) {
//           console.error("❌ Stream ended without final event");
//           updateErrorMessage(
//             question,
//             "Connection closed unexpectedly. Please try again."
//           );
//           setIsLoading(false);
//           setIsProcessing(false);
//         }
//         break;
//       }

//       // Update last event time on ANY data received
//       lastEventTime = Date.now();
     
//       buffer += decoder.decode(value, { stream: true });
     
//       const lines = buffer.split('\n');
//       buffer = lines.pop() || '';
     
//       for (const line of lines) {
//         if (line.trim() === '') continue;
       
//         try {
//           const event = JSON.parse(line);
//           console.log("📡 Stream event:", event);

//           const eventType = event.type || event.event;

//           switch (eventType) {
//             case 'conversational_opener':
//               streamingData.conversational_opener = event.message;
//               updateStreamingMessage(question, `${event.message}\n\nAnalyzing your question...`);
//               break;
             
//             case 'phase':
//               currentPhase = event.message;
//               updateStreamingMessage(
//                 question, 
//                 `${streamingData.conversational_opener}\n\n${event.message}`
//               );
//               break;

//             case 'sql':
//               streamingData.sql = event.sql;
//               updateStreamingMessage(
//                 question, 
//                 `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`
//               );
//               break;

//             case 'rows_preview':
//               streamingData.rows = event.rows || [];
//               updateStreamingMessage(
//                 question, 
//                 `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`
//               );
//               break;

//             case 'summary':
//               streamingData.summary = event.text;
//               updateStreamingMessage(
//                 question,
//                 `${streamingData.conversational_opener}\n\n${event.text}`
//               );
//               // Stop initial loader, start secondary processing
//               setIsLoading(false);
//               setIsProcessing(true);
//               break;

//             case 'recommendation':
//               streamingData.recommendations = event.text.split('\n').filter(r => r.trim());
//               break;

//             case 'chart':
//               streamingData.chart_config = event.config;
//               break;

//             case 'narrative':
//               streamingData.narrative = event.obj;
//               setIsProcessing(false);
//               break;

//             case 'meta':
//               if (typeof event.corpus_used !== "undefined") {
//                 streamingData.corpus_used = event.corpus_used;
//                 console.log("📊 Corpus used flag received:", event.corpus_used);
//               }
//               if (event.intentType) {
//                 streamingData.intentType = event.intentType;
//               }
//               break;

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


//             case 'final':
//                 receivedFinalEvent = true;
//                 clearInterval(timeoutCheckInterval);
                
//                 // 🔍 DEBUG: Log what we received
//                 console.log('📦 Final event payload analysis:', {
//                   previewRows: streamingData.rows?.length,
//                   payloadRows: event.payload?.rows?.length,
//                   payloadRowCount: event.payload?.row_count,
//                   hasFullData: !!event.payload?.rows
//                 });
                
//                 // ✅ CRITICAL FIX: Always prefer payload.rows (complete data) over streamingData.rows (preview)
//                 const fullRows = (event.payload?.rows && event.payload.rows.length > 0)
//                   ? event.payload.rows 
//                   : streamingData.rows || [];
                
//                 const actualRowCount = event.payload?.row_count || fullRows.length;
                
//                 console.log(`✅ Final message will use ${fullRows.length} rows (expected: ${actualRowCount})`);

//                 const rawSummary = streamingData.summary || event.payload?.summary || "";
//                 const summaryText = convertDollarToRupee(rawSummary);
//                 const convOpener = convertDollarToRupee(
//                   streamingData.conversational_opener || event.payload?.conversational_opener || ""
//                 );

//                 const recosRaw = streamingData.recommendations || event.payload?.recommendation || [];
//                 const recos = recosRaw.map(convertDollarToRupee);

//                 let narrativeObj = streamingData.narrative || event.payload?.narrative || null;
//                 narrativeObj = convertNarrativeCurrency(narrativeObj);

//                 const finalMessage = {
//                   sender: "bot",
//                   asked_question: question,
//                   content: summaryText,
//                   text: summaryText,
//                   summary: summaryText,
//                   conversational_opener: convOpener,
//                   recommendations: recos,
//                   chart_config: streamingData.chart_config || event.payload?.chart_config,
//                   narrative: narrativeObj,
//                   rows: fullRows,  // ✅ Use full dataset, not preview
//                   row_count: actualRowCount,  // ✅ Store actual count
//                   corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
//                   intentType: streamingData.intentType || event.payload?.intentType || true,
//                   isStreaming: false,
//                   query_used: streamingData.sql || event.payload?.query_used,
//                 };

//                 console.log("✅ Final message constructed:", {
//                   rowsInMessage: finalMessage.rows.length,
//                   rowCountMeta: finalMessage.row_count,
//                   corpusUsed: finalMessage.corpus_used
//                 });

//                 updateFinalMessage(question, finalMessage);
                
//                 // ✅ IMPORTANT: Update serverRows state for download
//                 setServerRows(fullRows);
//                 setRowCount(actualRowCount);
//                 console.log(`📥 Stored ${fullRows.length} rows in serverRows state for download`);

//                 setIsLoading(false);
//                 setIsProcessing(false);
//                 break;

//             case 'error':
//               receivedFinalEvent = true; // Treat error as completion
//               clearInterval(timeoutCheckInterval);
              
//               console.error("❌ Stream error:", event.message);
//               updateErrorMessage(question, event.message);
//               setIsLoading(false);
//               setIsProcessing(false);
//               break;

//             default:
//               console.log("⚠️ Unknown event type:", eventType);
//           }
         
//         } catch (parseError) {
//           console.warn("⚠️ Failed to parse stream line:", line, parseError);
//         }
//       }
//     }
   
//   } catch (streamError) {
//     clearInterval(timeoutCheckInterval);
//     console.error("❌ Stream reading error:", streamError);
    
//     // Provide user-friendly error message
//     let errorMessage = "Connection error occurred. ";
    
//     if (streamError.name === 'TypeError' && streamError.message.includes('network')) {
//       errorMessage += "Please check your internet connection and try again.";
//     } else if (streamError.name === 'AbortError') {
//       errorMessage += "Request was cancelled. Please try again.";
//     } else {
//       errorMessage += "Please try again or contact support if the issue persists.";
//     }
    
//     updateErrorMessage(question, errorMessage);
//   } finally {
//     clearInterval(timeoutCheckInterval);
//     setIsLoading(false);
//     setIsProcessing(false);
//   }
// };


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
              updateStreamingMessage(question, `${streamingData.conversational_opener}\n\nAnalyzing your question...`);
              break;
             
            case 'phase':
              currentPhase = event.message;
              updateStreamingMessage(
                question, 
                `${streamingData.conversational_opener}\n\n${event.message}`
              );
              break;


            case "sql": {
                  streamingData.sql = evt.sql;
                  lastUsedSQLRef.current = evt.sql; // 🔥 CRITICAL
                  console.log("📝 SQL Stored for CSV");
                  break;
                }

            // case 'sql':
            //   streamingData.sql = event.sql;
            //   updateStreamingMessage(
            //     question, 
            //     `${streamingData.conversational_opener}\n\n${currentPhase}\n\nExecuting query...`
            //   );
            //   break;

            case 'rows_preview':
              // ✅ Only store preview for UI updates, don't use for download
              streamingData.rows = event.rows || [];
              console.log(`📊 Preview received: ${event.rows?.length} rows (Total available: ${event.row_count})`);
              updateStreamingMessage(
                question, 
                `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`
              );
              break;

            case 'summary':
              streamingData.summary = convertDollarToRupee(event.text);
              updateStreamingMessage(
                question,
                `${streamingData.conversational_opener}\n\n${streamingData.summary}`
              );
              setIsLoading(false);
              setIsProcessing(true);
              break;

            case 'recommendation':
              const recoText = convertDollarToRupee(event.text);
              streamingData.recommendations = recoText.split('\n').filter(r => r.trim());
              break;

            case 'chart':
              streamingData.chart_config = event.config;
              break;

            case 'narrative':
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

            // case 'final':
            //   receivedFinalEvent = true;
            //   clearInterval(timeoutCheckInterval);

            //   const rawSummary = streamingData.summary || event.payload?.summary || "";
            //   const summaryText = convertDollarToRupee(rawSummary);
            //   const convOpener = convertDollarToRupee(
            //     streamingData.conversational_opener || event.payload?.conversational_opener || ""
            //   );

            //   const recosRaw = streamingData.recommendations || event.payload?.recommendation || [];
            //   const recos = recosRaw.map(convertDollarToRupee);

            //   let narrativeObj = streamingData.narrative || event.payload?.narrative || null;
            //   narrativeObj = convertNarrativeCurrency(narrativeObj);

            //   // ✅ CRITICAL: Get FULL rows from payload, not the preview
            //   const fullRows = event.payload?.rows || [];
            //   console.log(`✅ Final event - Full dataset: ${fullRows.length} rows`);

            //   const finalMessage = {
            //     sender: "bot",
            //     asked_question: question,
            //     content: summaryText,
            //     text: summaryText,
            //     summary: summaryText,
            //     conversational_opener: convOpener,
            //     recommendations: recos,
            //     chart_config: streamingData.chart_config || event.payload?.chart_config,
            //     narrative: narrativeObj,
            //     rows: fullRows,  // ✅ Use full rows from payload
            //     row_count: event.payload?.row_count || fullRows.length,  // ✅ Add row count
            //     corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
            //     intentType: streamingData.intentType || event.payload?.intentType || true,
            //     isStreaming: false,
            //     query_used: streamingData.sql || event.payload?.query_used,
            //     ...event.payload
            //   };

            //   console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
            //   console.log("📝 Final SQL Used:", finalMessage.query_used);
            //   console.log("📊 Final message rows:", finalMessage.rows.length);

            //   updateFinalMessage(question, finalMessage);

            //   setIsLoading(false);
            //   setIsProcessing(false);
            //   break;

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

              // ✅ CRITICAL: Get FULL rows from payload, not the preview
              const fullRows = event.payload?.rows || [];
              console.log(`✅ Final event - Full dataset: ${fullRows.length} rows`);

              // ✅ Check if this is a zero-results case
              const isZeroResults = fullRows.length === 0;

              // ✅ For zero results, use the clean opener from narrative, clear everything else
              const finalMessage = {
                sender: "bot",
                asked_question: question,
                content: isZeroResults ? "" : summaryText,
                text: isZeroResults ? "" : summaryText,
                summary: isZeroResults ? "" : summaryText,
                conversational_opener: isZeroResults ? "" : convOpener,
                recommendations: isZeroResults ? [] : recos,
                chart_config: isZeroResults ? null : (streamingData.chart_config || event.payload?.chart_config),
                narrative: narrativeObj,  // ✅ Keep narrative - it has the short opener message
                rows: fullRows,
                row_count: event.payload?.row_count || fullRows.length,
                corpus_used: streamingData.corpus_used || event.payload?.corpus_used || false,
                intentType: streamingData.intentType || event.payload?.intentType || true,
                isStreaming: false,
                query_used: streamingData.sql || event.payload?.query_used,
                ...event.payload
              };

              console.log("✅ Final message corpus_used:", finalMessage.corpus_used);
              console.log("📝 Final SQL Used:", finalMessage.query_used);
              console.log("📊 Final message rows:", finalMessage.rows.length);
              
              if (isZeroResults) {
                console.log("⚠️ Zero results - showing only narrative opener");
              }

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

// ========================================
// STEP 2: Update updateFinalMessage to store full rows
// ========================================

const updateFinalMessagess = (question, finalMessage) => {
  console.log(`🔄 Updating final message with ${finalMessage.rows?.length} rows`);
  
  setMessages(prev => {
    const updated = prev.map(msg => {
      if (msg.asked_question === question && msg.isStreaming) {
        return { ...msg, ...finalMessage, isStreaming: false };
      }
      return msg;
    });
    return updated;
  });
  
  // ✅ Update all states with full dataset
  if (finalMessage.rows && finalMessage.rows.length > 0) {
    console.log(`✅ Setting serverRows: ${finalMessage.rows.length} rows`);
    setServerRows(finalMessage.rows);
    setRowCount(finalMessage.row_count || finalMessage.rows.length);
  }
  
  setSummary(finalMessage.summary || "");
  setNarrative(finalMessage.narrative || null);
  setAnswer(finalMessage.content || finalMessage.summary || "");
  setLastAnsweredQuery(question);
};

const handleNDJSONStreaminggg = async (response, question) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // Create initial bot message that will be updated
  let botMessage = {
    sender: "bot",
    text: "Processing your request...",
    content: "Processing your request...",
    asked_question: question,
    isStreaming: true,
  };
  setMessages(prev => [...prev, botMessage]);

  let buffer = "";
  let currentPhase = "";
  let streamingData = {
    summary: "",
    recommendations: [],
    chart_config: null,
    conversational_opener: "",
    narrative: null,
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("✅ Stream completed");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);
          console.log("📡 Stream event:", event);
          const eventType = event.type || event.event;

          switch (eventType) {
            case "conversational_opener":
              streamingData.conversational_opener = event.message;
              botMessage = {
                ...botMessage,
                content: `${event.message}\n\nAnalyzing your question...`,
              };
              replacePendingBot(botMessage);
              setAnswer(event.message); // ✅ keep card in sync
              break;

            case "phase":
              currentPhase = event.message;
              botMessage = {
                ...botMessage,
                content: `${streamingData.conversational_opener}\n\n${event.message}`,
              };
              replacePendingBot(botMessage);

              setAnswer(event.message);
              break;

            case "sql":
              botMessage = {
                ...botMessage,
                content: `${botMessage.content}\n\nExecuting query...`,
              };
              replacePendingBot(botMessage);

              break;

            case "rows_preview":
              botMessage = {
                ...botMessage,
                content: `${streamingData.conversational_opener}\n\n${currentPhase}\n\nFound ${event.row_count} results...`,
              };
              replacePendingBot(botMessage);

              setRowCount(event.row_count || 0);
              setServerRows(event.rows || []);
              break;

            case "summary":
              streamingData.summary = event.text;
              botMessage = {
                ...botMessage,
                content: `${streamingData.conversational_opener}\n\n${event.text}`,
              };
              replacePendingBot(botMessage);

              setSummary(event.text);
              break;

            case "recommendation":
              streamingData.recommendations = event.text
                .split("\n")
                .filter(r => r.trim());
              break;

            case "chart":
              streamingData.chart_config = event.config;
              break;

            case "narrative":
              streamingData.narrative = event.obj;
              setNarrative(event.obj);
              break;

            case "final":
              console.log("🏁 Final payload received:", event.payload);
              // console.log("📝 Final SQL Used:", finalMessage.query_used); 
              const finalBot = {
                ...botMessage,
                content: event.payload.answer || botMessage.content,
                isStreaming: false,
              };
              setMessages(prev => [...prev.slice(0, -1), finalBot]);
              setSummary(event.payload.summary || "");
              setNarrative(event.payload.narrative || null);
              setServerRows(event.payload.rows || []);
              setRowCount(event.payload.row_count || 0);
              setAnswer(event.payload.answer || "Query complete.");
              setIsLoading(false);
              return;

            case "error":
              console.error("❌ Stream error:", event.message);
              const errorBot = {
                ...botMessage,
                content: `Error: ${event.message}`,
                isStreaming: false,
              };
              setMessages(prev => [...prev.slice(0, -1), errorBot]);
              setAnswer("Error while processing your request.");
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
    setMessages(prev => [
      ...prev,
      { sender: "bot", content: "Stream failed", asked_question: question },
    ]);
    setAnswer("Stream processing failed");
  } finally {
    setIsLoading(false);
  }
};


const replacePendingBot = (finalBot) => {
  setMessages(prev => {
    if (
      prev.length > 0 &&
      prev[prev.length - 1].sender === "bot" &&
      prev[prev.length - 1].isStreaming
    ) {
      return [...prev.slice(0, -1), finalBot];
    }
    return [...prev, finalBot];
  });
};

  const handleRating = async (idx, rating, msg) => {
    setMessageRatings((prev) => ({
      ...prev,
      [idx]: rating
    }));

    if (rating === "yes") {
      // ✅ Call backend to save to corpus
      try {
        const res = await fetch(`${API_BASE_URL}/save_to_corpus/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: msg.asked_question || msg.content || "",
            summary: msg.summary || "",
            recommendations: msg.recommendation || [],
            sql: msg.query_used || "",
            chart_config: msg.chart_config || null,
            row_count: msg.rows?.length || 0,
            db_id: "liberty",
            narrative: msg.narrative || null,
            user_id: "admin",
          }),
        });
        const data = await res.json();
        console.log("Corpus save response:", data);
      } catch (err) {
        console.error("⚠️ Failed to save to corpus:", err);
      }
    } else if (rating === "no") {
      // 👎 Put the same question back in the input box for retry
      setInput(msg.asked_question || msg.content || "");
    }
  };

  
  const handleSuggestionClick = (text) => {
    // Check if we have asked the first question and if last response needs rating
    if (hasAskedFirstQuestion) {
      const lastBotIdx = messages.map(m => m.sender).lastIndexOf("bot");
      
      if (lastBotIdx !== -1) {
        const lastBotMsg = messages[lastBotIdx];
        const isActualResponse = isRatableMessage(lastBotMsg);
        
        // Only require rating for actual responses (not welcome messages)
        if (isActualResponse && !messageRatings[lastBotIdx]) {
          setInput(text); // Set the suggestion text in input
          setShowRatingPopup(true); // Show rating popup
          return;
        }
      }
    }

    setInput(text);
    setTimeout(() => checkIntentAndSend(text), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  

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

const handleRegularResponse = async (endpoint, requestBody, question) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  // if (!response.ok) {
  //   throw new Error(`HTTP error! status: ${response.status}`);
  // }

  if (!response.ok) {
      if (response.status === 400) {
        // 🚫 Show incomplete popup
        setShowIncompletePopup(true);
        setIsLoading(false);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  const data = await response.json();
  console.log("📊 Data analysis response:", data);
  
  const botResponse = {
    sender: "bot",
    text: data.summary || data.answer || "Analysis completed",
    content: data.summary || data.answer || "",
    asked_question: question,
    summary: data.summary || null,
    rows: data.rows || [],
    chart_config: data.chart_config || null,
    recommendation: data.recommendation || null,
    narrative: data.narrative || null,
    query_used: data.query_used || null,
  };
  
  setMessages(prev => [...prev, botResponse]);
  setIsLoading(false);
};

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
    hasMoreData: false, // NEW: Track if results were truncated
    totalRows: 0, // NEW: Track total row count
  };
  
  setPendingBot(initialBot);

  try {
    const response = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: question, 
        user_id: "admin",
        max_rows: 1000 // NEW: Add row limit
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let finalBot = { ...initialBot };
    let isStreamComplete = false;

    await readNdjson(response, (event) => {
      console.log("📦 Stream event:", event);

      // Handle both "type" and "event" field names
      const eventType = event.type || event.event;

      if (eventType === "sql_generated" || eventType === "sql") {
        finalBot = {
          ...finalBot,
          query_used: event.sql || "",
          sqlReady: true,
        };
        setPendingBot({ ...finalBot });
      }

      if (eventType === "data_loaded") {
        finalBot = {
          ...finalBot,
          rows: event.rows || [],
          chart_config: event.chart_config || null,
          totalRows: event.total_rows || (event.rows || []).length,
          hasMoreData: event.has_more || false,
          dataReady: true,
        };
        setPendingBot({ ...finalBot });
      }

      // NEW: Handle warning about large datasets
      if (eventType === "warning" || eventType === "data_truncated") {
        finalBot = {
          ...finalBot,
          hasMoreData: true,
          totalRows: event.total_rows || 0,
        };
        setPendingBot({ ...finalBot });
      }

      if (eventType === "summary_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          summary: (finalBot.summary || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (eventType === "narrative_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          narrative: (finalBot.narrative || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (eventType === "recommendation_chunk") {
        const chunk = event.chunk || "";
        finalBot = {
          ...finalBot,
          recommendation: (finalBot.recommendation || "") + chunk,
        };
        setPendingBot({ ...finalBot });
      }

      if (eventType === "complete") {
        console.log("✅ Stream complete");
        isStreamComplete = true;
        
        let contentMessage = finalBot.summary || finalBot.narrative || "Query completed.";
        
        // Add warning if data was truncated
        if (finalBot.hasMoreData && finalBot.totalRows > 0) {
          contentMessage += `\n\n⚠️ Note: Showing ${finalBot.rows.length} of ${finalBot.totalRows} total records. Results have been limited for performance.`;
        }
        
        finalBot = {
          ...finalBot,
          content: contentMessage,
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

    // If stream ended without "complete" event
    if (!isStreamComplete) {
      console.log("⚠️ Stream ended without complete event");
      finalBot = {
        ...finalBot,
        content: finalBot.summary || finalBot.narrative || "Query completed.",
      };
      setMessages((prev) => [...prev, finalBot]);
      setPendingBot(null);
      setIsLoading(false);
    }

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

// // IMPROVED readNdjson with better error recovery
// const readNdjson = async (response, onEvent) => {
//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();
//   let buffer = "";
//   let lineCount = 0;
//   const MAX_LINE_SIZE = 10 * 1024 * 1024; // 10MB max per line

//   try {
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) {
//         console.log(`📊 NDJSON stream complete. Processed ${lineCount} events.`);
//         break;
//       }

//       buffer += decoder.decode(value, { stream: true });

//       let idx;
//       while ((idx = buffer.indexOf("\n")) >= 0) {
//         const line = buffer.slice(0, idx).trim();
//         buffer = buffer.slice(idx + 1);

//         // Skip empty lines
//         if (!line) continue;

//         // Check if line is too large (possible corruption)
//         if (line.length > MAX_LINE_SIZE) {
//           console.error(`⚠️ Line too large (${line.length} bytes), skipping`);
//           continue;
//         }

//         lineCount++;

//         try {
//           const evt = JSON.parse(line);
          
//           // Normalize: support both "event" and "type" fields
//           if (evt.type && !evt.event) {
//             evt.event = evt.type;
//           }
//           if (evt.event && !evt.type) {
//             evt.type = evt.event;
//           }
          
//           // Only warn if neither field exists
//           if (!evt.event && !evt.type) {
//             console.warn("⚠️ Unknown NDJSON event (missing type/event):", evt);
//             continue;
//           }
          
//           onEvent(evt);
//         } catch (err) {
//           // Log first 200 chars of problematic line
//           const preview = line.length > 200 ? line.substring(0, 200) + "..." : line;
//           console.error(`⚠️ Failed to parse NDJSON line #${lineCount}:`, preview);
//           console.error("Parse error:", err.message);
//           // Continue processing instead of breaking
//           continue;
//         }
//       }

//       // Prevent buffer from growing too large
//       if (buffer.length > MAX_LINE_SIZE) {
//         console.error("⚠️ Buffer overflow, clearing buffer");
//         buffer = "";
//       }
//     }
//   } catch (error) {
//     console.error("❌ NDJSON stream error:", error);
//     throw error;
//   }
// };

// ==============================================
// Robust NDJSON reader for streaming responses
// ==============================================
const readNdjson = async (response, onEvent) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lineCount = 0;
  const MAX_LINE_SIZE = 10 * 1024 * 1024; // 10MB max per line

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          // Try parsing leftover buffer as last line
          try {
            const evt = JSON.parse(buffer);
            onEvent(evt);
            lineCount++;
          } catch (err) {
            console.warn("⚠️ Leftover buffer could not be parsed:", buffer.slice(0, 200));
          }
        }
        console.log(`📊 NDJSON stream complete. Processed ${lineCount} events.`);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split by newline
      const lines = buffer.split("\n");

      // Keep the last line (may be incomplete) in buffer
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.length > MAX_LINE_SIZE) {
          console.error(`⚠️ Line too large (${trimmed.length} bytes), skipping`);
          continue;
        }

        lineCount++;
        try {
          const evt = JSON.parse(trimmed);

          // Normalize "event" and "type"
          if (evt.type && !evt.event) evt.event = evt.type;
          if (evt.event && !evt.type) evt.type = evt.event;

          if (!evt.event && !evt.type) {
            console.warn("⚠️ Unknown NDJSON event (missing type/event):", evt);
            continue;
          }

          onEvent(evt);
        } catch (err) {
          const preview = trimmed.length > 200 ? trimmed.substring(0, 200) + "..." : trimmed;
          console.error(`⚠️ Failed to parse NDJSON line #${lineCount}:`, preview);
          console.error("Parse error:", err.message);
          continue;
        }
      }

      // Prevent buffer overflow
      if (buffer.length > MAX_LINE_SIZE) {
        console.error("⚠️ Buffer overflow, clearing buffer");
        buffer = "";
      }
    }
  } catch (error) {
    console.error("❌ NDJSON stream error:", error);
    throw error;
  }
};


// // Update your checkIntentAndAskStream function to use the correct streaming approach
// const checkIntentAndAskStream = async (question) => {
//   if (!question.trim() || isLoading) return;

//   setIsLoading(true);
//   setAnswer("");
//   setSummary("");
//   setNarrative(null);
//   setServerRows([]);
//   setRowCount(0);

//   const userMsg = { sender: "user", role: "user", content: question };
//   setMessages((prev) => [...prev, userMsg]);
//   setInput("");
//   setLastAnsweredQuery(question);

//   try {
//     // 1) Check intent first
//     const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question, user_id: "admin" }),
//     });

//     if (!intentRes.ok) {
//       throw new Error(`Intent check failed: ${intentRes.status}`);
//     }

//     const intentData = await intentRes.json();
//     console.log("🎯 Intent:", intentData);

//     // 2) Route based on intent
//     if (intentData.intent === "data_analysis") {
//       await handleStreamingDataAnalysis(question);
//     } else if (intentData.intent === "general_chat") {
//       await handleGeneralChat(question);
//     } else {
//       // Fallback to streaming Q&A
//       await handleStreamingQA(question);
//     }

//   } catch (error) {
//     console.error("❌ Error in checkIntentAndAskStream:", error);
//     const errorBot = {
//       sender: "bot",
//       content: `Error: ${error.message}`,
//       asked_question: question,
//     };
//     setMessages(prev => [...prev, errorBot]);
//     setIsLoading(false);
//   }
// };

// Separate function for streaming data analysis
const handleStreamingDataAnalysis = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, user_id: "admin" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Create initial bot message
    let botMessage = {
      sender: "bot",
      text: "Processing your request...",
      content: "Processing your request...",
      asked_question: question,
      isStreaming: true,
      summary: "",
      recommendation: "",
      rows: [],
      chart_config: null,
      query_used: null,
      narrative: null,
    };
    
    setMessages(prev => [...prev, botMessage]);

    // Use readNdjson with proper event handling
    await readNdjson(response, (event) => {
      console.log("📦 Stream event:", event);

      // Update botMessage based on event type
      if (event.event === "sql_generated" || event.type === "sql_generated") {
        botMessage.query_used = event.sql || "";
        console.log("📝 Final SQL Used:", event.sql);
      }

      if (event.event === "data_loaded" || event.type === "data_loaded") {
        botMessage.rows = event.rows || [];
        botMessage.chart_config = event.chart_config || null;
        setServerRows(event.rows || []);
        setRowCount(event.rows?.length || 0);
      }

      if (event.event === "summary_chunk" || event.type === "summary_chunk") {
        const chunk = event.chunk || "";
        botMessage.summary = (botMessage.summary || "") + chunk;
        botMessage.content = botMessage.summary;
        setSummary(botMessage.summary);
        
        // Update the message in state
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.asked_question === question) {
            updated[lastIndex] = { ...botMessage };
          }
          return updated;
        });
      }

      if (event.event === "narrative_chunk" || event.type === "narrative_chunk") {
        const chunk = event.chunk || "";
        botMessage.narrative = (botMessage.narrative || "") + chunk;
        setNarrative(botMessage.narrative);
      }

      if (event.event === "recommendation_chunk" || event.type === "recommendation_chunk") {
        const chunk = event.chunk || "";
        botMessage.recommendation = (botMessage.recommendation || "") + chunk;
      }

      if (event.event === "complete" || event.type === "complete") {
        console.log("✅ Stream complete");
        botMessage.isStreaming = false;
        botMessage.content = botMessage.summary || botMessage.narrative || "Query completed.";
        
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.asked_question === question) {
            updated[lastIndex] = { ...botMessage };
          }
          return updated;
        });
        
        setAnswer(botMessage.content);
        setIsLoading(false);
      }

      if (event.event === "error" || event.type === "error") {
        console.error("❌ Stream error:", event.message);
        botMessage.content = `Error: ${event.message}`;
        botMessage.isStreaming = false;
        
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.asked_question === question) {
            updated[lastIndex] = { ...botMessage };
          }
          return updated;
        });
        
        setIsLoading(false);
      }
    });

  } catch (error) {
    console.error("❌ Streaming error:", error);
    throw error;
  }
};

// Separate function for general chat
const handleGeneralChat = async (question) => {
  try {
    const response = await fetch(`${API_BASE_URL}/general_chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, user_id: "admin" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    const botMsg = {
      sender: "bot",
      content: data.answer || "I'm here to help!",
      asked_question: question,
    };

    setMessages(prev => [...prev, botMsg]);
    setAnswer(data.answer);
    setIsLoading(false);

  } catch (error) {
    console.error("❌ General chat error:", error);
    throw error;
  }
};


// Read server-sent NDJSON stream and dispatch per line
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
//       try { onEvent(JSON.parse(line)); } catch {/* ignore bad lines */}
//     }
//   }
// };





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

   
   


  const connectToDatabase = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/connect_database/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // optionally include a user_id you control (from auth or local preference)
        body: JSON.stringify({ user_id: "admin" }),
      });
      const data = await res.json();
      console.log("🔌 DB connection response:", data);

      if (res.ok && data.session_id) {
        console.log("✅ Connected. Received session_id:", data.session_id);
        setSessionId(data.session_id);
        localStorage.setItem("session_id", data.session_id);
        setSessionReady(true);
      } else {
        console.error("❌ DB connection failed:", data?.error || "Unknown error");
        setSessionReady(false);
      }
    } catch (err) {
      console.error("⚠️ Error connecting to database:", err);
      setSessionReady(false);
    }
  };

  connectToDatabase(); // ⚠️ Always reconnect on reload
}, [API_BASE_URL]);

useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
    }
  }, [sessionId]);

useEffect(() => {
    if (!sessionId) {
      const storedSession = localStorage.getItem("session_id");
      if (storedSession) {
        console.log("Restoring session from localStorage:", storedSession);
        setSessionId(storedSession);
        // Optionally assume ready when restoring (comment out if you prefer to wait for fresh connect)
        // setSessionReady(true);
      }
    }
  }, [sessionId]);


// Only treat text as a table if it looks tabular
const looksTabular = (text = "") => {
  if (!text) return false;

  // Markdown table pattern (header + separator)
  if (/\n?\s*\|.*\|\s*\n/.test(text) && /\n?\s*\|?\s*:?-{2,}/.test(text)) return true;

  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  // CSV/pipe/TSV lines: require at least 2 lines with >= 3 fields
  const csvLike = lines.filter(l =>
    (l.split(",").length >= 3) || (l.split("|").length >= 3) || (l.split("\t").length >= 3)
  );
  if (csvLike.length >= 2) return true;

  // Key-value style lists: need >= 3 lines like "key: value" or "key - value"
  const kvLike = lines.filter(l => /\s*[^:–-]+[:–-]\s+.+/.test(l));
  return kvLike.length >= 3;
};


useEffect(() => {
  const body = document.body;
  const bgColor = window.getComputedStyle(body).backgroundColor;
  const rgb = bgColor.match(/\d+/g);

  if (rgb) {
    const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    if (brightness < 128) {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
    }
  }
}, []);

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

  const match = question.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i);

  if (match) {
    const normalized = monthsShort[match[0].toLowerCase()] || match[0].toLowerCase();
    const index = monthsFull.indexOf(normalized);
    if (index !== -1) {
      const nextMonth = monthsFull[(index + 1) % 12];
      return question.replace(new RegExp(match[0], 'i'), nextMonth.charAt(0).toUpperCase() + nextMonth.slice(1));
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
  'customerid', 'claim_happaned/not', 'branch_name', 'chassis_number',
  'engine_number', 'reg_no', 'state', 'zone',
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
    // 'Analyze churn patterns by policy tenure',
    // 'What is the relationship between claims and churn?',
    // 'Show retention streak analysis across segments'
  ],
  premium: [
    // 'Show average premium by vehicle make',
    'What is the premium trend over years?',
    // 'Compare OD vs TP premium distribution',
    // 'Analyze premium variations by customer segment',
    // 'Show IDV to premium ratio analysis',
    // 'What factors influence premium pricing most?'
  ],
  claims: [
    // 'Show claim approval rate by state',
    'What is the relationship between claims and churn?',
    // 'Show claims distribution by vehicle age',
    // 'Analyze claim patterns by manufacturer',
    // 'Show claim frequency vs premium correlation',
    // 'What are the most common claim scenarios?'
  ],
  customer: [
    'Show customer lifetime value by segment',
    // 'What are the characteristics of high-value customers?',
    // 'Show customer tenure distribution',
    // 'Analyze customer acquisition vs retention costs',
    // 'Show customer segment migration patterns',
    // 'What drives customer loyalty in insurance?'
  ],
  vehicle: [
    // 'Show top 10 vehicle makes by policy count',
    'What is the average IDV by vehicle make?',
    // 'Show vehicle age vs premium relationship',
    // 'Analyze risk factors by manufacturer',
    // 'Show fuel type distribution and risk impact',
    // 'What are the most profitable vehicle segments?'
  ],
  cars: [
    'Show top 10 vehicle makes by policy count',
    // 'What is the average IDV by vehicle make?',
    // 'Show vehicle age vs premium relationship',
    // 'Analyze risk factors by manufacturer',
    // 'Show fuel type distribution and risk impact',
    // 'What are the most profitable vehicle segments?'
  ],
  regional: [
    'Show policy distribution by zone',
    'Which state has the highest risk score?',
    'Compare business performance across states',
    // 'Analyze regional premium variations',
    'Show state-wise retention patterns',
    // 'What are the regional growth opportunities?'
  ],
  discount: [
    // 'Show NCB distribution across customers',
    'What is the average discount by customer category?',
    // 'Show relationship between NCB and retention',
    // 'Analyze discount effectiveness on renewals',
    // 'Show applicable discount trends over time',
    // 'What is the optimal discount strategy?'
  ],
  risk: [
    // 'Show risk factors by manufacturer',
    // 'What are the key risk indicators?',
    // 'Show fuel type risk distribution',
    // 'Analyze RTO risk factor patterns',
    'Show segment risk score analysis',
    // 'What predicts high-risk customers?'
  ],
  recommendations: [
    'Show primary recommendations by customer segment',
    // 'What retention strategies work best?',
    // 'Show additional offers effectiveness',
    // 'Analyze recommendation success rates',
    // 'Show channel effectiveness for retention',
    // 'What are the most successful retention tactics?'
  ],
  temporal: [
    // 'Compare policy trends between 2024 and 2025',
    'Show monthly policy distribution',
    // 'What is the renewal pattern by month?',
    // 'Analyze seasonal variations in business',
    // 'Show yearly growth trends',
    // 'What are the peak business periods?'
  ],
  general: [
    // 'What can you do?',
    // 'Tell me a fun fact about insurance',
    // 'How can you help with insurance analysis?',
    'Analyze churn patterns by policy tenure',
    'Which branch have the high churn probability?',
    'What is the average of customer life time?',
    'What insights can you provide?',
    // 'Show IDV to premium ratio analysis',
    'Give me a top 5 branches performing well',
    'What is the churn rate by customer segment?',
    'What is the distribution of vehicle IDV across different policy tenures?',
    'What are the top churn reasons across all zones?',
    'Which state has the highest revenue from policies not renewed?',
    'Give me top 5 branches based on churn',
    'Show state-wise retention patterns',
    'Show churn probability by customer segment',
    'What are the main reasons for not renewing?',
    'Show retention rate by state and zone',
    // 'Show me data overview',
    'What are the key business metrics?'
  ],
  // conversational: [
  //   'What is your name?',
  //   'What is your purpose?',
  //   'How do you work?',
  //   'What services do you provide?',
  //   'Can you help me with something?',
  //   'Do you have feelings?'
  // ],
  // fun: [
  //   'Want to hear another fun fact?',
  //   'Show me something surprising in the data',
  //   'What else can you do?',
  //   'Tell me an interesting insight',
  //   'What would you recommend exploring?',
  //   'Show me the most unusual data pattern'
  // ]
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
  // } else if (["hi", "hello", "hey", "how are you"].some(greet => userQuestion.includes(greet))) {
  //   primaryTopic = 'conversational';
  //   topicSuggestions = SUGGESTION_TEMPLATES.conversational;
  // } else if (["wow", "awesome", "cool", "amazing", "great", "nice", "interesting", "hahaha"].some(word => userQuestion.includes(word))) {
  //   primaryTopic = 'fun';
  //   topicSuggestions = SUGGESTION_TEMPLATES.fun;
  // }
  }else {
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

// Normalizes responses from ask_question / ask_qwen / askbot
const normalizeAnswer = (data) => {
  // If classic shape: { answer, summary }
  if (typeof data?.answer === "string" && data.answer.trim()) {
    return {
      answer: data.answer.trim(),
      summary: (data.summary || "").trim(),
      sources: Array.isArray(data.sources) ? data.sources : [],
     
    };
  }
// askbot shape
  const mode = (data?.mode || "").toLowerCase();
  const pdf = (data?.pdf_answer || "").trim();
  const gen = (data?.general_answer || "").trim();

  let parts = [];
  if (mode === "both") {
    const hasPdf = pdf && pdf.toLowerCase() !== "i don't know.";
    if (hasPdf) parts.push(`**PDF-based answer**\n${pdf}`);
    if (gen) parts.push(`**General answer**\n${gen}`);
  } else if (mode === "pdf_only") {
    if (pdf) parts.push(pdf);
  } else if (mode === "general_only") {
    if (gen) parts.push(gen);
  } else {
    // Unknown mode: pick whatever exists
    if (pdf) parts.push(pdf);
    if (gen) parts.push(gen);
  }

  let answer = parts.join("\n\n").trim();
  if (!answer && pdf) answer = pdf;
  if (!answer && gen) answer = gen;
  const sources = Array.isArray(data?.sources) ? data.sources : [];
  if (sources.length) answer += `\n\n_Sources:_ ${sources.join(", ")}`;

  return {
    answer: answer || "No response found.",
    summary: (data?.summary || "").trim(),
    sources
  };
};
// helper — keep it near top-level of component/file
const parseAnswerToTable = (text = "") => {
  if (!text || !text.trim()) return { columns: [], rows: [] };
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const mdTable = lines.filter(l => /^\|.*\|$/.test(l));
  if (mdTable.length >= 2) {
    const clean = mdTable.filter(l => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l));
    const head = clean[0].split("|").map(s => s.trim()).filter(Boolean);
    const body = clean.slice(1).map(r => r.split("|").map(s => s.trim()).filter(Boolean));
    const columns = head.length ? head : body[0]?.map((_, i) => `Col ${i + 1}`) || [];
    const rows = body.map(arr => {
      const o = {}; columns.forEach((c, i) => (o[c] = arr[i] ?? "")); return o;
    });
    return { columns, rows };
  }

  const splitLine = l => {
    if (l.includes("|")) return l.split("|").map(s => s.trim()).filter(Boolean);
    if (l.includes(",")) return l.split(",").map(s => s.trim()).filter(Boolean);
    if (l.includes("\t")) return l.split("\t").map(s => s.trim()).filter(Boolean);
    const kv = l.split(/\s*[:\-–]\s*/);
    if (kv.length > 1) return kv.map(s => s.trim()).filter(Boolean);
    return [l];
  };

  const parts = lines.map(splitLine);

  // Guard 1: reject accidental tables from single-line prose
  if (parts.length < 2) return { columns: [], rows: [] };

  const width = Math.max(...parts.map(p => p.length));

  // Guard 2: if width == 2 (Metric/Value pattern), require at least 3 lines
  if (width === 2 && parts.length < 3) return { columns: [], rows: [] };

  if (!width || (width === 1 && parts.length <= 1)) return { columns: [], rows: [] };

  const headers = width === 2 ? ["Metric", "Value"] : Array.from({ length: width }, (_, i) => `Col ${i + 1}`);
  const rows = parts.map(arr => {
    const o = {}; headers.forEach((h, i) => (o[h] = arr[i] ?? "")); return o;
  });
  return { columns: headers, rows };
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
// // Intent-gated streaming version. Leaves your old checkIntentAndAsk intact.
// const checkIntentAndAskStream = async () => {
//   const asked = (query || "").trim();
//   if (!asked || isLoadingRef.current) return;

//   // seed UI states
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setAnswer("Loading data…");   // shows the card immediately with your existing styles
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
  
//   // ✅ ADD THIS: Initialize streamingData if you need to track SQL
//   let streamingData = {
//     sql: null,
//     conversational_opener: "",
//   };
//   let currentPhase = "Loading data…";
  
//   // ---- 1) intent check
//   let isDataIntent = true;
//   try {
//     const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked })
//     });
//     const intentData = await intentRes.json();
//     const intent = (intentData?.answer || "").trim().toUpperCase();

//     if (intent === "YES") {
//       isDataIntent = true;
//     } else if (intent === "NO") {
//       isDataIntent = false;
//     } else if (intent === "PDF") {
//       // 👉 call your PDF askbot endpoint
//       try {
//         const res = await fetch(`${API_BASE_URL}/askbot`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ question: asked, user_id: "admin" })
//         });
//         const data = await res.json();
//         const norm = normalizeAnswer(data);
//         setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//         setAnswer(norm.answer);
//         setSummary(norm.summary || "");
//         setServerRows([]);
//         setRowCount(0);
//       } catch (e) {
//         setMessages(prev => [...prev, { role: "assistant", content: "Unable to fetch PDF results." }]);
//         setAnswer("Unable to fetch PDF results.");
//       } finally {
//         setIsLoading(false);
//         setQuery("");
//       }
//       return; // ✅ stop here
//     } else if (intent === "UNCERTAIN") {
//       // 👉 pause & show incomplete popup
//       setPendingQuestion(asked);
//       setShowIncompletePopup(true);
//       setIsLoading(false);
//       return;
//     }
//   } catch {
//     isDataIntent = true; // fail-open to data path
//   }

//   // ---- 2) NON-DATA path -> reuse your current non-streaming logic inline
//   if (!isDataIntent) {
//     try {
//       const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked, user_id: "admin" })
//       });
//       const data = await res.json();
//       const norm = normalizeAnswer(data);
//       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//       setAnswer(norm.answer);
//       setSummary(norm.summary);
//       setServerRows([]); setRowCount(0);
//     } catch (e) {
//       setMessages(prev => [...prev, { role: "assistant", content: "Unable to process general questions at the moment." }]);
//       setAnswer("Unable to process general questions at the moment.");
//       setSummary("");
//     } finally {
//       setIsLoading(false);
//       setQuery("");
//     }
//     return;
//   }

//   // ---- 3) DATA path -> stream from /ask_question_stream
//   try {
//     const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });

//     await readNdjson(res, (evt) => {
//       switch (evt.event) {
//         case "narrative": {
//           setNarrative(evt.obj || evt.data || null);
//           break;
//         }
//         case "phase": {
//           // server phases (e.g., "Generating SQL…", "Loading data…")
//           const msg = evt.message || "Loading data…";
//           currentPhase = msg; // ✅ Store phase
//           setAnswer(msg);
//           break;
//         }
//         case "sql": {
//           // ✅ FIXED: Now streamingData exists
//           streamingData.sql = evt.sql;
//           console.log("📝 SQL Generated:", evt.sql);
          
//           // ✅ Check if updateStreamingMessage function exists before calling
//           if (typeof updateStreamingMessage === 'function') {
//             updateStreamingMessage(
//               asked,
//               `${streamingData.conversational_opener || ""}\n\n${currentPhase || ""}\n\nExecuting query...`
//             );
//           }
//           break;
//         }
//         case "rows_preview": {
//           setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
//           setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
//           break;
//         }
//         case "summary": {
//           setSummary(prev => (narrative ? prev : (evt.text || "")));
//           break;
//         }
//         case "chart": {
//           // you don't render charts here; ignore or store if you add later
//           break;
//         }
//         case "recommendation": {
//           // summary already covers this block in your UI; ignore or store separately if needed
//           break;
//         }
//         case "final": {
//           // final server payload; prefer it over previews
//           const payload = evt.payload || {};
//           const norm = normalizeAnswer(payload);
//           setAnswer(norm.answer || "");
//           setSummary(payload.narrative ? "" : (norm.summary || ""));
//           setNarrative(payload.narrative || null);
//           setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
//           setRowCount(typeof payload.row_count === "number"
//             ? payload.row_count
//             : (Array.isArray(payload.rows) ? payload.rows.length : 0)
//           );

//           if (payload.query_used) {
//             console.log("📝 Final SQL Used:", payload.query_used);
//           }

//           setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
//           setIsLoading(false);
//           setQuery("");
//           break;
//         }
//         case "error": {
//           setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong while processing your question." }]);
//           setAnswer("Something went wrong while processing your question.");
//           setSummary("");
//           setIsLoading(false);
//           break;
//         }
//         default: break;
//       }
//     });
//   } catch (err) {
//     console.error("❌ Stream error:", err);
//     setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
//     setAnswer("Network error.");
//     setSummary("");
//     setIsLoading(false);
//   }
// };


// // --- Non-streaming fallback ---
// const checkIntentAndAsk = async (customQ) => {
//   const q = customQ || query;
//   if (!q.trim()) return;

//   try {
//     const response = await fetch(`${API_BASE_URL}/check_intent/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: q }),
//     });

//     const data = await response.json();
//     const intent = (data.answer || "").trim().toUpperCase();

//     if (intent === "YES") {
//       await sendMessageWithIntent(q, true);
//     } else if (intent === "NO") {
//       await sendMessageWithIntent(q, false);
//     } else if (intent === "PDF") {
//       // ✅ handle PDF also in non-streaming mode
//       try {
//         const res = await fetch(`${API_BASE_URL}/askbot`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ question: q, user_id: "admin" }),
//         });
//         const pdfData = await res.json();
//         const norm = normalizeAnswer(pdfData);
//         setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//         setAnswer(norm.answer);
//         setSummary(norm.summary || "");
//         setServerRows([]);
//         setRowCount(0);
//       } catch (e) {
//         setMessages(prev => [...prev, { role: "assistant", content: "Unable to fetch PDF results." }]);
//         setAnswer("Unable to fetch PDF results.");
//       } finally {
//         setIsLoading(false);
//         setQuery("");
//       }
//       return;
//     } else if (intent === "UNCERTAIN") {
//       // 👉 show incomplete popup
//       setPendingQuestion(q);
//       setShowIncompletePopup(true);
//       return;
//     }
//   } catch (err) {
//     console.error("❌ checkIntentAndAsk failed:", err);
//     await sendMessageWithIntent(q, false); // fallback general
//   }

//   const res = { content: "Demo response" };
//   setActiveResponse(res); // ✅ feed into one state
//   return res;
// };\

// Intent-gated streaming version with improved routing


// const checkIntentAndAskStream = async () => {
//   const asked = (query || "").trim();
  
//   console.log("🔍 Starting checkIntentAndAskStream with question:", asked);
//   console.log("🔍 Original query state:", query);
  
//   if (!asked || isLoadingRef.current) return;

//   // ✅ Clear everything immediately when new question is asked
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setIsProcessing(false);
  
//   // ✅ Clear all previous response data
//   setAnswer("");
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
//   setNarrative(null);

//   // seed UI states
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setIsProcessing(false); // ✅ reset second loader
//   setAnswer("Loading data…");
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
  
//   let streamingData = {
//     sql: null,
//     conversational_opener: "",
//   };
//   let currentPhase = "Loading data…";
  
//   // ✅ IMPROVED: Priority-based keyword detection with word boundaries
//   const databaseKeywords = [
//     'customer', 'policy', 'policies', 'premium', 'claim', 'claims',
//     'revenue', 'vehicle', 'branch', 'renewal', 'renewed', 'churn',
//     'segment', 'idv', 'manufacturer', 'show', 'list', 'count',
//     'total', 'how many', 'what are', 'which', 'average', 'sum',
//     'zone', 'state', 'tie-up', 'ncb', 'bonus', 'approval', 'rate',
//     'customer lifetime value', 'clv', 'tenure', 'age', 'reason',
//     'reasons', 'churned', 'retained', 'insured', 'insurance',
//     'data', 'records', 'entries', 'database'
//   ];
  
//   const pdfKeywords = [
//     'retention pathway', 'overview page', 'data ingestion',
//     'azure blob', 'excel upload', 'alert system', 'segmentation categories',
//     'elite retainers', 'potential customers', 'low value customers',
//     'what caused', 'who is at risk', 'why they are churning',
//     'model building', 'deployment', 'monitoring', 'eda', 'feature engineering',
//     'exploratory data analysis', 'roc curve', 'log loss', 'accuracy',
//     'dashboard reports', 'data cleansing', 'kpi tracking', 'real-time analytics'
//   ];
  
//   const askedLower = asked.toLowerCase();
  
//   // ✅ IMPROVED: Smart matching function that handles word boundaries
//   const countKeywordMatches = (keywords, text) => {
//     let matches = 0;
//     let matchedKeywords = [];
    
//     keywords.forEach(keyword => {
//       if (keyword.includes(' ')) {
//         if (text.includes(keyword)) {
//           matches++;
//           matchedKeywords.push(keyword);
//         }
//       } else {
//         const regex = new RegExp(`\\b${keyword}s?\\b`, 'i');
//         if (regex.test(text)) {
//           matches++;
//           matchedKeywords.push(keyword);
//         }
//       }
//     });
    
//     return { count: matches, keywords: matchedKeywords };
//   };
  
//   const dbMatch = countKeywordMatches(databaseKeywords, askedLower);
//   const pdfMatch = countKeywordMatches(pdfKeywords, askedLower);
  
//   console.log("🔍 Database keyword matches:", dbMatch.count, "→", dbMatch.keywords);
//   console.log("🔍 PDF keyword matches:", pdfMatch.count, "→", pdfMatch.keywords);
  
//   let isDataIntent = true;
//   let isPdfIntent = false;
//   let intent = null;
  
//   if (pdfMatch.count > 0 && dbMatch.count === 0) {
//     console.log("⚡ Fast-track: PDF-only query detected");
//     intent = "PDF";
//     isPdfIntent = true;
//   } else if (dbMatch.count > 0) {
//     console.log("⚡ Fast-track: Database query detected (overriding PDF)");
//     intent = "YES";
//     isDataIntent = true;
//   } else {
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked })
//       });
//       const intentData = await intentRes.json();
//       intent = (intentData?.answer || "").trim().toUpperCase();
      
//       console.log("🎯 Intent API detected:", intent);
      
//       if (intent === "PDF" && dbMatch.count > 0) {
//         console.log("⚠️ Overriding PDF intent - DB keywords present");
//         intent = "YES";
//       }
      
//     } catch (err) {
//       console.error("❌ Intent API error:", err);
//       isDataIntent = true;
//       intent = "YES";
//     }
//   }
  
//   console.log("🎯 Final intent:", intent);

//   if (intent === "YES") {
//     isDataIntent = true;
//     isPdfIntent = false;
//   } else if (intent === "NO") {
//     isDataIntent = false;
//     isPdfIntent = false;
//   } else if (intent === "PDF") {
//     console.log("📄 PDF intent - sending question:", asked);
    
//     try {
//       const requestBody = { question: asked, user_id: "admin" };
//       console.log("📤 Sending to /askbot:", requestBody);
      
//       const res = await fetch(`${API_BASE_URL}/askbot`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody)
//       });
      
//       console.log("📥 /askbot response status:", res.status);
      
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}`);
//       }
      
//       const data = await res.json();
//       console.log("📥 /askbot response data:", data);
      
//       const norm = normalizeAnswer(data);
//       console.log("📥 Normalized answer:", norm);
      
//       const isEmpty = !norm.answer || 
//                       norm.answer.trim() === "" || 
//                       norm.answer.toLowerCase() === "hello!" ||
//                       norm.answer.length < 10;
      
//       if (isEmpty) {
//         console.log("⚠️ PDF returned empty/generic answer, trying database instead");
//         isDataIntent = true;
//         isPdfIntent = false;
//       } else {
//         setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//         setAnswer(norm.answer);
//         setSummary(norm.summary || "");
//         setServerRows([]);
//         setRowCount(0);
//         setIsLoading(false);
//         setQuery("");
//         return;
//       }
//     } catch (e) {
//       console.error("❌ PDF endpoint error:", e);
//       console.log("⚠️ Falling back to database query");
//       isDataIntent = true;
//       isPdfIntent = false;
//     }
//   } else if (intent === "UNCERTAIN") {
//     setPendingQuestion(asked);
//     setShowIncompletePopup(true);
//     setIsLoading(false);
//     return;
//   }

//   if (!isDataIntent && !isPdfIntent) {
//     try {
//       const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked, user_id: "admin" })
//       });
//       const data = await res.json();
//       const norm = normalizeAnswer(data);
//       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//       setAnswer(norm.answer);
//       setSummary(norm.summary);
//       setServerRows([]);
//       setRowCount(0);
//     } catch (e) {
//       console.error("❌ General query error:", e);
//       setMessages(prev => [...prev, { role: "assistant", content: "Unable to process general questions at the moment." }]);
//       setAnswer("Unable to process general questions at the moment.");
//       setSummary("");
//     } finally {
//       setIsLoading(false);
//       setQuery("");
//     }
//     return;
//   }

//   // ---- 4) DATA path -> stream from /ask_question_stream
//   console.log("💾 Routing to database stream endpoint");
  
//   try {
//     const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     await readNdjson(res, (evt) => {
//       switch (evt.event) {
//         case "narrative": {
//           setNarrative(evt.obj || evt.data || null);
//           setIsProcessing(false); // ✅ stop second loader when narrative starts
//           break;
//         }
//         case "phase": {
//           const msg = evt.message || "Loading data…";
//           currentPhase = msg;
//           setAnswer(msg);
//           break;
//         }
//         case "sql": {
//           streamingData.sql = evt.sql;
//           console.log("📝 SQL Generated:", evt.sql);
          
//           if (typeof updateStreamingMessage === 'function') {
//             updateStreamingMessage(
//               asked,
//               `${streamingData.conversational_opener || ""}\n\n${currentPhase || ""}\n\nExecuting query...`
//             );
//           }
//           break;
//         }
//         case "rows_preview": {
//           setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
//           setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
//           break;
//         }
//         case "summary": {
//           setSummary(prev => (narrative ? prev : (evt.text || "")));
//           setIsProcessing(true); // ✅ start second loader when summary arrives
//           break;
//         }
//         case "chart": {
//           break;
//         }
//         case "recommendation": {
//           break;
//         }
//         case "final": {
//           const payload = evt.payload || {};
//           const norm = normalizeAnswer(payload);
//           setAnswer(norm.answer || "");
//           setSummary(payload.narrative ? "" : (norm.summary || ""));
//           setNarrative(payload.narrative || null);
//           setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
//           setRowCount(typeof payload.row_count === "number"
//             ? payload.row_count
//             : (Array.isArray(payload.rows) ? payload.rows.length : 0)
//           );

//           if (payload.query_used) {
//             console.log("📝 Final SQL Used:", payload.query_used);
//           }

//           setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
//           setIsLoading(false);
//           setIsProcessing(false); // ✅ stop it when final data comes
//           setQuery("");
//           break;
//         }
//         case "error": {
//           setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong while processing your question." }]);
//           setAnswer("Something went wrong while processing your question.");
//           setSummary("");
//           setIsLoading(false);
//           setIsProcessing(false); // ✅ stop on error too
//           break;
//         }
//         default: break;
//       }
//     });
//   } catch (err) {
//     console.error("❌ Stream error:", err);
//     setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
//     setAnswer("Network error.");
//     setSummary("");
//     setIsLoading(false);
//     setIsProcessing(false); // ✅ ensure cleanup
//   }
// };
const checkIntentAndAskStreamss = async () => {
  const asked = (query || "").trim();
  
  console.log("🔍 Starting checkIntentAndAskStream with question:", asked);
  console.log("🔍 Original query state:", query);
  
  if (!asked || isLoadingRef.current) return;

  // ✅ Clear everything immediately when new question is asked
  setLastAnsweredQuery(asked);
  setMessages(prev => [...prev, { role: "user", content: asked }]);
  setIsLoading(true);
  setIsProcessing(false);
  
  // ✅ Clear all previous response data
  setAnswer("");
  setSummary("");
  setServerRows([]);
  setRowCount(0);
  setNarrative(null);

  // seed UI states
  setAnswer("Loading data…");
  setSummary("");
  setServerRows([]);
  setRowCount(0);
  
  let streamingData = {
    sql: null,
    conversational_opener: "",
  };
  let currentPhase = "Loading data…";
  
  let isDataIntent = true;
  let isPdfIntent = false;
  let intent = null;
  
  // ✅ Always call Intent API first (removed keyword fast-tracking)
  try {
    console.log("📡 Calling Intent API...");
    const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: asked })
    });
    
    if (!intentRes.ok) {
      console.warn("⚠️ Intent API failed, defaulting to database");
      intent = "YES";
    } else {
      const intentData = await intentRes.json();
      intent = (intentData?.answer || "").trim().toUpperCase();
      console.log("🎯 Intent API detected:", intent);
      
      // Check for incomplete question
      if (intentData.message && intentData.message.includes("Incomplete question")) {
        console.warn("⚠️ Incomplete question flagged by backend");
        setPendingQuestion(asked);
        setShowIncompletePopup(true);
        setIsLoading(false);
        return;
      }
    }
  } catch (err) {
    console.error("❌ Intent API error:", err);
    intent = "YES";
  }
  
  console.log("🎯 Final intent:", intent);

  // ✅ Handle different intents
  if (intent === "YES") {
    // Database query
    isDataIntent = true;
    isPdfIntent = false;
    console.log("📊 Routing to database");
    
  } 
  
  else if (intent === "PDF") {
    // ✅ CHANGED: PDF intent now routes to DATABASE instead of /askbot
    console.log("📄 PDF intent detected - routing to database with corpus lookup");
    isDataIntent = true;
    isPdfIntent = false;
    // Will continue to database flow below - corpus will handle PDF-like questions
  // else if (intent === "PDF") {
    // PDF/Knowledge base query
  //   console.log("📄 PDF intent - sending question:", asked);
    
  //   try {
  //     // ✅ CRITICAL FIX: Use 'query' and 'session_id' instead of 'question' and 'user_id'
  //     const requestBody = { 
  //       query: asked,  // Changed from 'question' to 'query'
  //       session_id: sessionIdRef?.current || "admin"  // Changed from 'user_id' to 'session_id'
  //     };
  //     console.log("📤 Sending to /askbot:", requestBody);
      
  //     const res = await fetch(`${API_BASE_URL}/askbot`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(requestBody)
  //     });
      
  //     console.log("📥 /askbot response status:", res.status);
      
  //     if (!res.ok) {
  //       throw new Error(`HTTP ${res.status}`);
  //     }
      
  //     const data = await res.json();
  //     console.log("📥 /askbot response data:", data);
      
  //     const norm = normalizeAnswer(data);
  //     console.log("📥 Normalized answer:", norm);
      
  //     const isEmpty = !norm.answer || 
  //                     norm.answer.trim() === "" || 
  //                     norm.answer.toLowerCase() === "hello!" ||
  //                     norm.answer.length < 10;
      
  //     if (isEmpty) {
  //       console.log("⚠️ PDF returned empty/generic answer, trying database instead");
  //       isDataIntent = true;
  //       isPdfIntent = false;
  //       // Continue to database flow below
  //     } else {
  //       // ✅ Successful PDF response
  //       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
  //       setAnswer(norm.answer);
  //       setSummary(norm.summary || "");
  //       setServerRows([]);
  //       setRowCount(0);
  //       setIsLoading(false);
  //       setQuery("");
  //       return; // Exit here
  //     }
  //   } catch (e) {
  //     console.error("❌ PDF endpoint error:", e);
  //     console.log("⚠️ Falling back to database query");
  //     isDataIntent = true;
  //     isPdfIntent = false;
  //     // Continue to database flow below
  //   }
    
  } else if (intent === "NO") {
    // General knowledge query
    isDataIntent = false;
    isPdfIntent = false;
    console.log("💭 Routing to general knowledge");
    
    try {
      const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: asked, 
          session_id: sessionIdRef?.current || "admin"
        })
      });
      
      const data = await res.json();
      const norm = normalizeAnswer(data);
      
      setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
      setAnswer(norm.answer);
      setSummary(norm.summary || "");
      setServerRows([]);
      setRowCount(0);
    } catch (e) {
      console.error("❌ General query error:", e);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Unable to process general questions at the moment." 
      }]);
      setAnswer("Unable to process general questions at the moment.");
      setSummary("");
    } finally {
      setIsLoading(false);
      setQuery("");
    }
    return; // Exit here
    
  } else if (intent === "UNCERTAIN") {
    // Uncertain intent
    console.log("❓ Uncertain intent");
    setPendingQuestion(asked);
    setShowIncompletePopup(true);
    setIsLoading(false);
    return; // Exit here
  }

  // ✅ Database path - stream from /ask_question_stream
  // This executes only if intent is "YES" or if PDF/General failed
  console.log("💾 Routing to database stream endpoint");
  
  try {
    // const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ 
    //     question: asked, 
    //     session_id: sessionIdRef?.current || "admin"
    //   })
    // });

    const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    question: asked, 
    session_id: sessionIdRef?.current || "admin",
    max_rows: 1000  // ← Add this limit
  })
});

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    await readNdjson(res, (evt) => {
      switch (evt.event) {
        case "narrative": {
          setNarrative(evt.obj || evt.data || null);
          setIsProcessing(false);
          break;
        }
        case "phase": {
          const msg = evt.message || "Loading data…";
          currentPhase = msg;
          setAnswer(msg);
          break;
        }
        case "sql": {
          streamingData.sql = evt.sql;
          console.log("📝 SQL Generated:", evt.sql);
          
          if (typeof updateStreamingMessage === 'function') {
            updateStreamingMessage(
              asked,
              `${streamingData.conversational_opener || ""}\n\n${currentPhase || ""}\n\nExecuting query...`
            );
          }
          break;
        }
        case "rows_preview": {
          setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
          setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
          break;
        }
        // case "summary": {
        //   setSummary(prev => (narrative ? prev : (evt.text || "")));
        //   setIsProcessing(true);
        //   break;
        // }
        case "summary": {
          setSummary(prev => (narrative ? prev : (evt.text || "")));
          
          // ✅ Only show secondary processing if NOT from corpus
          // Corpus responses are instant, no need for "processing" animation
          if (!evt.corpus_used) {
            setIsProcessing(true);
          }
          break;
        }

        case "chart": {
          break;
        }
        case "recommendation": {
          break;
        }
        // case "final": {
        //   const payload = evt.payload || {};
        //   const norm = normalizeAnswer(payload);
        //   setAnswer(norm.answer || "");
        //   setSummary(payload.narrative ? "" : (norm.summary || ""));
        //   setNarrative(payload.narrative || null);
        //   setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
        //   setRowCount(typeof payload.row_count === "number"
        //     ? payload.row_count
        //     : (Array.isArray(payload.rows) ? payload.rows.length : 0)
        //   );

        //   if (payload.query_used) {
        //     console.log("📝 Final SQL Used:", payload.query_used);
        //   }

        //   setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
        //   setIsLoading(false);
        //   setIsProcessing(false);
        //   setQuery("");
        //   break;
        // }

        case "final": {
  const payload = evt.payload || {};
  const isCorpus = payload.corpus_used === true;
  
  if (isCorpus) {
    console.log("📦 Corpus response - skipped secondary processing");
  }
  
  const norm = normalizeAnswer(payload);
  
  // ✅ CRITICAL: Use payload.rows (full dataset), not existing serverRows
  const fullRows = Array.isArray(payload.rows) ? payload.rows : [];
  
  console.log(`✅ Final event - Setting ${fullRows.length} rows to state`);
  
  setAnswer(norm.answer || "");
  setSummary(payload.narrative ? "" : (norm.summary || ""));
  setNarrative(payload.narrative || null);
  
  // ✅ Force-set the full dataset
  setServerRows(fullRows);
  setRowCount(typeof payload.row_count === "number" 
    ? payload.row_count 
    : fullRows.length
  );

  if (payload.query_used) {
    console.log("📝 Final SQL Used:", payload.query_used);
  }

  setMessages(prev => [...prev, { 
    role: "assistant", 
    content: norm.answer || "",
    fullRows: fullRows  // ✅ Store full rows in message too
  }]);
  
  setIsLoading(false);
  setIsProcessing(false);
  setQuery("");
  break;
}
        case "error": {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Something went wrong while processing your question." 
          }]);
          setAnswer("Something went wrong while processing your question.");
          setSummary("");
          setIsLoading(false);
          setIsProcessing(false);
          break;
        }
        default: break;
      }
    });
  } catch (err) {
    console.error("❌ Stream error:", err);
    setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
    setAnswer("Network error.");
    setSummary("");
    setIsLoading(false);
    setIsProcessing(false);
  }
};



const checkIntentAndAskStream = async () => {
  const asked = (query || "").trim();
  
  console.log("🔍 Starting checkIntentAndAskStream with question:", asked);
  
  if (!asked || isLoadingRef.current) return;

  // Clear everything immediately
  setLastAnsweredQuery(asked);
  setMessages(prev => [...prev, { role: "user", content: asked }]);
  setIsLoading(true);
  setIsProcessing(false);
  
  // Clear all previous response data
  setAnswer("");
  setSummary("");
  setServerRows([]);
  setRowCount(0);
  setNarrative(null);

  // Seed UI states
  setAnswer("Loading data…");
  setSummary("");
  setServerRows([]);
  setRowCount(0);
  
  let streamingData = {
    sql: null,
    conversational_opener: "",
    previewRows: [],      // ✅ Add separate preview storage
    fullRows: []          // ✅ Add full dataset storage
  };
  let currentPhase = "Loading data…";
  
  // ... your intent detection logic here ...

  // Database path - stream from /ask_question_stream
  console.log("💾 Routing to database stream endpoint");
  
  try {
    const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: asked, 
        session_id: sessionIdRef?.current || "admin",
        max_rows: 10000  // ✅ Request more rows from backend
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    await readNdjson(res, (evt) => {
      switch (evt.event) {
        case "narrative": {
          setNarrative(evt.obj || evt.data || null);
          setIsProcessing(false);
          break;
        }
        
        case "phase": {
          const msg = evt.message || "Loading data…";
          currentPhase = msg;
          setAnswer(msg);
          break;
        }
        
        // case "sql": {
        //   streamingData.sql = evt.sql;
        //   console.log("📝 SQL Generated:", evt.sql);
        //   break;
        // }

        case "sql": {
  streamingData.sql = evt.sql;
  lastUsedSQLRef.current = evt.sql;   // 🔥 THIS WAS MISSING
  console.log("📝 SQL Stored for CSV:\n", evt.sql);

  // console.log("📝 SQL Stored for CSV:", evt.sql.slice(0, 120));
  break;
}

        
        case "rows_preview": {
          // ✅ CRITICAL: Store preview separately, don't overwrite full dataset
          streamingData.previewRows = Array.isArray(evt.rows) ? evt.rows : [];
          const previewCount = evt.row_count || streamingData.previewRows.length;
          
          console.log(`📊 Preview received: ${streamingData.previewRows.length} rows (Total: ${previewCount})`);
          
          // ✅ Only use preview for UI display, not for final state
          setServerRows(streamingData.previewRows);
          setRowCount(previewCount);
          break;
        }
        
        case "summary": {
          setSummary(prev => (narrative ? prev : (evt.text || "")));
          
          if (!evt.corpus_used) {
            setIsProcessing(true);
          }
          break;
        }

        case "chart": {
          break;
        }
        
        case "recommendation": {
          break;
        }
        
        case "final": {
          const payload = evt.payload || {};
          const isCorpus = payload.corpus_used === true;
          
          if (isCorpus) {
            console.log("📦 Corpus response - skipped secondary processing");
          }
          
          const norm = normalizeAnswer(payload);
          
          // ✅ CRITICAL FIX: Always use payload.rows (full dataset from backend)
          const fullRows = Array.isArray(payload.rows) && payload.rows.length > 0
            ? payload.rows 
            : streamingData.previewRows || []; // Fallback to preview if payload is empty
          
          const actualRowCount = payload.row_count || fullRows.length;
          
          console.log(`✅ Final event received:`, {
            payloadRows: payload.rows?.length || 0,
            previewRows: streamingData.previewRows?.length || 0,
            usingRows: fullRows.length,
            expectedCount: actualRowCount
          });
          
          // ✅ Store full dataset in state
          streamingData.fullRows = fullRows;
          
          setAnswer(norm.answer || "");
          setSummary(payload.narrative ? "" : (norm.summary || ""));
          setNarrative(payload.narrative || null);
          
          // ✅ CRITICAL: Set the FULL dataset to serverRows
          setServerRows(fullRows);
          setRowCount(actualRowCount);

          if (payload.query_used) {
            console.log("📝 Final SQL Used:", payload.query_used);
          }

          // ✅ Store full rows in message for later retrieval
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: norm.answer || "",
            fullRows: fullRows,           // ✅ Full dataset
            rowCount: actualRowCount,     // ✅ Actual count
            summary: norm.summary || "",
            narrative: payload.narrative || null
          }]);
          
          console.log(`✅ Stored ${fullRows.length} rows in state and messages`);
          
          setIsLoading(false);
          setIsProcessing(false);
          setQuery("");
          break;
        }
        
        case "error": {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Something went wrong while processing your question." 
          }]);
          setAnswer("Something went wrong while processing your question.");
          setSummary("");
          setIsLoading(false);
          setIsProcessing(false);
          break;
        }
        
        default: break;
      }
    });
  } catch (err) {
    console.error("❌ Stream error:", err);
    setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
    setAnswer("Network error.");
    setSummary("");
    setIsLoading(false);
    setIsProcessing(false);
  }
};

// ========================================
// FIX 2: Update updateFinalMessage for the other streaming path
// ========================================

const updateFinalMessage = (question, finalMessage) => {
  console.log(`🔄 Updating final message with ${finalMessage.rows?.length || 0} rows`);
  
  setMessages(prev => {
    const updated = prev.map(msg => {
      if (msg.asked_question === question && msg.isStreaming) {
        return { 
          ...msg, 
          ...finalMessage, 
          isStreaming: false,
          fullRows: finalMessage.rows || []  // ✅ Ensure full rows are stored
        };
      }
      return msg;
    });
    return updated;
  });
  
  // ✅ CRITICAL: Update serverRows with FULL dataset
  if (finalMessage.rows && finalMessage.rows.length > 0) {
    console.log(`✅ Setting serverRows: ${finalMessage.rows.length} rows`);
    setServerRows(finalMessage.rows);
    setRowCount(finalMessage.row_count || finalMessage.rows.length);
  }
  
  setSummary(finalMessage.summary || "");
  setNarrative(finalMessage.narrative || null);
  setAnswer(finalMessage.content || finalMessage.summary || "");
  setLastAnsweredQuery(question);
};
// const checkIntentAndAskStream = async () => {
//   const asked = (query || "").trim();
  
//   console.log("🔍 Starting checkIntentAndAskStream with question:", asked);
//   console.log("🔍 Original query state:", query);
  
//   if (!asked || isLoadingRef.current) return;

//   // seed UI states
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setAnswer("Loading data…");
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
  
//   let streamingData = {
//     sql: null,
//     conversational_opener: "",
//   };
//   let currentPhase = "Loading data…";
  
//   // ✅ IMPROVED: Priority-based keyword detection with word boundaries
//   const databaseKeywords = [
//     'customer', 'policy', 'policies', 'premium', 'claim', 'claims',
//     'revenue', 'vehicle', 'branch', 'renewal', 'renewed', 'churn',
//     'segment', 'idv', 'manufacturer', 'show', 'list', 'count',
//     'total', 'how many', 'what are', 'which', 'average', 'sum',
//     'zone', 'state', 'tie-up', 'ncb', 'bonus', 'approval', 'rate',
//     'customer lifetime value', 'clv', 'tenure', 'age', 'reason',
//     'reasons', 'churned', 'retained', 'insured', 'insurance',
//     'data', 'records', 'entries', 'database'
//   ];
  
//   const pdfKeywords = [
//     'retention pathway', 'overview page', 'data ingestion',
//     'azure blob', 'excel upload', 'alert system', 'segmentation categories',
//     'elite retainers', 'potential customers', 'low value customers',
//     'what caused', 'who is at risk', 'why they are churning',
//     'model building', 'deployment', 'monitoring', 'eda', 'feature engineering',
//     'exploratory data analysis', 'roc curve', 'log loss', 'accuracy',
//     'dashboard reports', 'data cleansing', 'kpi tracking', 'real-time analytics'
//   ];
  
//   const askedLower = asked.toLowerCase();
  
//   // ✅ IMPROVED: Smart matching function that handles word boundaries
//   const countKeywordMatches = (keywords, text) => {
//     let matches = 0;
//     let matchedKeywords = [];
    
//     keywords.forEach(keyword => {
//       // For multi-word phrases, use simple includes
//       if (keyword.includes(' ')) {
//         if (text.includes(keyword)) {
//           matches++;
//           matchedKeywords.push(keyword);
//         }
//       } else {
//         // For single words, use word boundary regex
//         // This matches "customer" in "customer data" but not in "customerable"
//         const regex = new RegExp(`\\b${keyword}s?\\b`, 'i'); // s? makes plural optional
//         if (regex.test(text)) {
//           matches++;
//           matchedKeywords.push(keyword);
//         }
//       }
//     });
    
//     return { count: matches, keywords: matchedKeywords };
//   };
  
//   // Count keyword matches
//   const dbMatch = countKeywordMatches(databaseKeywords, askedLower);
//   const pdfMatch = countKeywordMatches(pdfKeywords, askedLower);
  
//   console.log("🔍 Database keyword matches:", dbMatch.count, "→", dbMatch.keywords);
//   console.log("🔍 PDF keyword matches:", pdfMatch.count, "→", pdfMatch.keywords);
  
//   // ---- 1) Smart intent routing
//   let isDataIntent = true;
//   let isPdfIntent = false;
//   let intent = null;
  
//   // ✅ Rule 1: If PDF keywords are dominant AND no DB keywords, go to PDF
//   if (pdfMatch.count > 0 && dbMatch.count === 0) {
//     console.log("⚡ Fast-track: PDF-only query detected");
//     intent = "PDF";
//     isPdfIntent = true;
//   }
//   // ✅ Rule 2: If DB keywords are present (regardless of PDF keywords), go to DB first
//   else if (dbMatch.count > 0) {
//     console.log("⚡ Fast-track: Database query detected (overriding PDF)");
//     intent = "YES";
//     isDataIntent = true;
//   }
//   // ✅ Rule 3: Ambiguous - call intent API
//   else {
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked })
//       });
//       const intentData = await intentRes.json();
//       intent = (intentData?.answer || "").trim().toUpperCase();
      
//       console.log("🎯 Intent API detected:", intent);
      
//       // ✅ Override: If intent says PDF but we have DB keywords, trust DB
//       if (intent === "PDF" && dbMatch.count > 0) {
//         console.log("⚠️ Overriding PDF intent - DB keywords present");
//         intent = "YES";
//       }
      
//     } catch (err) {
//       console.error("❌ Intent API error:", err);
//       isDataIntent = true; // fail-open to data path
//       intent = "YES";
//     }
//   }
  
//   console.log("🎯 Final intent:", intent);

//   // ---- 2) Handle different intents
//   if (intent === "YES") {
//     isDataIntent = true;
//     isPdfIntent = false;
//   } else if (intent === "NO") {
//     isDataIntent = false;
//     isPdfIntent = false;
//   } else if (intent === "PDF") {
//     // ✅ Only go to PDF if we're confident
//     console.log("📄 PDF intent - sending question:", asked);
    
//     try {
//       const requestBody = { question: asked, user_id: "admin" };
//       console.log("📤 Sending to /askbot:", requestBody);
      
//       const res = await fetch(`${API_BASE_URL}/askbot`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody)
//       });
      
//       console.log("📥 /askbot response status:", res.status);
      
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}`);
//       }
      
//       const data = await res.json();
//       console.log("📥 /askbot response data:", data);
      
//       const norm = normalizeAnswer(data);
//       console.log("📥 Normalized answer:", norm);
      
//       // ✅ Check if PDF gave a meaningful answer
//       const isEmpty = !norm.answer || 
//                       norm.answer.trim() === "" || 
//                       norm.answer.toLowerCase() === "hello!" ||
//                       norm.answer.length < 10; // Too short answers are probably not helpful
      
//       if (isEmpty) {
//         console.log("⚠️ PDF returned empty/generic answer, trying database instead");
//         isDataIntent = true;
//         isPdfIntent = false;
//         // Don't return - fall through to database query
//       } else {
//         setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//         setAnswer(norm.answer);
//         setSummary(norm.summary || "");
//         setServerRows([]);
//         setRowCount(0);
//         setIsLoading(false);
//         setQuery("");
//         return; // ✅ stop here only if PDF succeeded
//       }
//     } catch (e) {
//       console.error("❌ PDF endpoint error:", e);
//       console.log("⚠️ Falling back to database query");
//       isDataIntent = true;
//       isPdfIntent = false;
//       // Fall through to database query
//     }
//   } else if (intent === "UNCERTAIN") {
//     setPendingQuestion(asked);
//     setShowIncompletePopup(true);
//     setIsLoading(false);
//     return;
//   }

//   // ---- 3) NON-DATA path (general conversation)
//   if (!isDataIntent && !isPdfIntent) {
//     try {
//       const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked, user_id: "admin" })
//       });
//       const data = await res.json();
//       const norm = normalizeAnswer(data);
//       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//       setAnswer(norm.answer);
//       setSummary(norm.summary);
//       setServerRows([]);
//       setRowCount(0);
//     } catch (e) {
//       console.error("❌ General query error:", e);
//       setMessages(prev => [...prev, { role: "assistant", content: "Unable to process general questions at the moment." }]);
//       setAnswer("Unable to process general questions at the moment.");
//       setSummary("");
//     } finally {
//       setIsLoading(false);
//       setQuery("");
//     }
//     return;
//   }

//   // ---- 4) DATA path -> stream from /ask_question_stream
//   console.log("💾 Routing to database stream endpoint");
  
//   try {
//     const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     await readNdjson(res, (evt) => {
//       switch (evt.event) {
//         case "narrative": {
//           setNarrative(evt.obj || evt.data || null);
//           break;
//         }
//         case "phase": {
//           const msg = evt.message || "Loading data…";
//           currentPhase = msg;
//           setAnswer(msg);
//           break;
//         }
//         case "sql": {
//           streamingData.sql = evt.sql;
//           console.log("📝 SQL Generated:", evt.sql);
          
//           if (typeof updateStreamingMessage === 'function') {
//             updateStreamingMessage(
//               asked,
//               `${streamingData.conversational_opener || ""}\n\n${currentPhase || ""}\n\nExecuting query...`
//             );
//           }
//           break;
//         }
//         case "rows_preview": {
//           setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
//           setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
//           break;
//         }
//         case "summary": {
//           setSummary(prev => (narrative ? prev : (evt.text || "")));
//           break;
//         }
//         case "chart": {
//           break;
//         }
//         case "recommendation": {
//           break;
//         }
//         case "final": {
//           const payload = evt.payload || {};
//           const norm = normalizeAnswer(payload);
//           setAnswer(norm.answer || "");
//           setSummary(payload.narrative ? "" : (norm.summary || ""));
//           setNarrative(payload.narrative || null);
//           setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
//           setRowCount(typeof payload.row_count === "number"
//             ? payload.row_count
//             : (Array.isArray(payload.rows) ? payload.rows.length : 0)
//           );

//           if (payload.query_used) {
//             console.log("📝 Final SQL Used:", payload.query_used);
//           }

//           setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
//           setIsLoading(false);
//           setQuery("");
//           break;
//         }
//         case "error": {
//           setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong while processing your question." }]);
//           setAnswer("Something went wrong while processing your question.");
//           setSummary("");
//           setIsLoading(false);
//           break;
//         }
//         default: break;
//       }
//     });
//   } catch (err) {
//     console.error("❌ Stream error:", err);
//     setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
//     setAnswer("Network error.");
//     setSummary("");
//     setIsLoading(false);
//   }
// };
// Intent-gated streaming version. Leaves your old checkIntentAndAsk intact.
const checkIntentAndAskStreambfrpdf = async () => {
  const asked = (query || "").trim();
  
  // ✅ ADD THIS DEBUG LOG HERE
  console.log("🔍 Starting checkIntentAndAskStream with question:", asked);
  console.log("🔍 Original query state:", query);
  
  if (!asked || isLoadingRef.current) return;

  // seed UI states
  setLastAnsweredQuery(asked);
  setMessages(prev => [...prev, { role: "user", content: asked }]);
  setIsLoading(true);
  setAnswer("Loading data…");   // shows the card immediately with your existing styles
  setSummary("");
  setServerRows([]);
  setRowCount(0);
  
  // ✅ ADD THIS: Initialize streamingData if you need to track SQL
  let streamingData = {
    sql: null,
    conversational_opener: "",
  };
  let currentPhase = "Loading data…";
  
  // ---- 1) intent check
  let isDataIntent = true;
  try {
    const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: asked })
    });
    const intentData = await intentRes.json();
    const intent = (intentData?.answer || "").trim().toUpperCase();
    
    // ✅ ADD THIS DEBUG LOG HERE
    console.log("🎯 Intent detected:", intent);
    console.log("🎯 Question at intent check:", asked);

    if (intent === "YES") {
      isDataIntent = true;
    } else if (intent === "NO") {
      isDataIntent = false;
    } else if (intent === "PDF") {
      // ✅ ADD THIS DEBUG LOG HERE
      console.log("📄 PDF intent - sending question:", asked);
      console.log("📄 PDF intent - current query state:", query);
      
      // 👉 call your PDF askbot endpoint
      try {
        // ✅ ADD THIS DEBUG LOG HERE
        const requestBody = { question: asked, user_id: "admin" };
        console.log("📤 Sending to /askbot:", requestBody);
        
        const res = await fetch(`${API_BASE_URL}/askbot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody) // ✅ Use the logged variable
        });
        
        // ✅ ADD THIS DEBUG LOG HERE
        console.log("📥 /askbot response status:", res.status);
        
        const data = await res.json();
        
        // ✅ ADD THIS DEBUG LOG HERE
        console.log("📥 /askbot response data:", data);
        
        const norm = normalizeAnswer(data);
        
        // ✅ ADD THIS DEBUG LOG HERE
        console.log("📥 Normalized answer:", norm);
        
        setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
        setAnswer(norm.answer);
        setSummary(norm.summary || "");
        setServerRows([]);
        setRowCount(0);
      } catch (e) {
        // ✅ ADD THIS DEBUG LOG HERE
        console.error("❌ PDF endpoint error:", e);
        
        setMessages(prev => [...prev, { role: "assistant", content: "Unable to fetch PDF results." }]);
        setAnswer("Unable to fetch PDF results.");
      } finally {
        setIsLoading(false);
        setQuery("");
      }
      return; // ✅ stop here
    } else if (intent === "UNCERTAIN") {
      // 👉 pause & show incomplete popup
      setPendingQuestion(asked);
      setShowIncompletePopup(true);
      setIsLoading(false);
      return;
    }
  } catch {
    isDataIntent = true; // fail-open to data path
  }

  // ---- 2) NON-DATA path -> reuse your current non-streaming logic inline
  if (!isDataIntent) {
    try {
      const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, session_id: sessionIdRef?.current || "admin"
          //  user_id: "admin"
           })
      });
      const data = await res.json();
      const norm = normalizeAnswer(data);
      setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
      setAnswer(norm.answer);
      setSummary(norm.summary);
      setServerRows([]); setRowCount(0);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Unable to process general questions at the moment." }]);
      setAnswer("Unable to process general questions at the moment.");
      setSummary("");
    } finally {
      setIsLoading(false);
      setQuery("");
    }
    return;
  }

  // ---- 3) DATA path -> stream from /ask_question_stream
  try {
    const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: asked, user_id: "admin" })
    });

    await readNdjson(res, (evt) => {
      switch (evt.event) {
        case "narrative": {
          setNarrative(evt.obj || evt.data || null);
          break;
        }
        case "phase": {
          // server phases (e.g., "Generating SQL…", "Loading data…")
          const msg = evt.message || "Loading data…";
          currentPhase = msg; // ✅ Store phase
          setAnswer(msg);
          break;
        }
        case "sql": {
          // ✅ FIXED: Now streamingData exists
          streamingData.sql = evt.sql;
          console.log("📝 SQL Generated:", evt.sql);
          
          // ✅ Check if updateStreamingMessage function exists before calling
          if (typeof updateStreamingMessage === 'function') {
            updateStreamingMessage(
              asked,
              `${streamingData.conversational_opener || ""}\n\n${currentPhase || ""}\n\nExecuting query...`
            );
          }
          break;
        }
        case "rows_preview": {
          setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
          setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
          break;
        }
        case "summary": {
          setSummary(prev => (narrative ? prev : (evt.text || "")));
          break;
        }
        case "chart": {
          // you don't render charts here; ignore or store if you add later
          break;
        }
        case "recommendation": {
          // summary already covers this block in your UI; ignore or store separately if needed
          break;
        }
        case "final": {
          // final server payload; prefer it over previews
          const payload = evt.payload || {};
          const norm = normalizeAnswer(payload);
          setAnswer(norm.answer || "");
          setSummary(payload.narrative ? "" : (norm.summary || ""));
          setNarrative(payload.narrative || null);
          setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
          setRowCount(typeof payload.row_count === "number"
            ? payload.row_count
            : (Array.isArray(payload.rows) ? payload.rows.length : 0)
          );

          if (payload.query_used) {
            console.log("📝 Final SQL Used:", payload.query_used);
          }

          setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
          setIsLoading(false);
          setQuery("");
          break;
        }
        case "error": {
          setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong while processing your question." }]);
          setAnswer("Something went wrong while processing your question.");
          setSummary("");
          setIsLoading(false);
          break;
        }
        default: break;
      }
    });
  } catch (err) {
    console.error("❌ Stream error:", err);
    setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
    setAnswer("Network error.");
    setSummary("");
    setIsLoading(false);
  }
};

// const checkIntentAndAsk = async (customQ) => {
//   const q = customQ || query;
//   if (!q.trim()) return;

//   try {
//     const response = await fetch(`${API_BASE_URL}/check_intent/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: q }),
//     });

//     const data = await response.json();
//     const intent = data.answer;

//     if (intent === "YES") {
//       await sendMessageWithIntent(q, true);
//     } else if (intent === "NO") {
//       await sendMessageWithIntent(q, false);
//     } else if (intent === "UNCERTAIN") {
//       // 👉 pause and show popup
//       setPendingQuestion(q);
//       setShowIntentPopup(true);
//     }
//   } catch (err) {
//     console.error("❌ checkIntentAndAsk failed:", err);
//     await sendMessageWithIntent(q, false); // fallback general
//   }

//   const res = { content: "Demo response" };
//     setActiveResponse(res); // ✅ feed into one state
//     return res;
// };
// const handleIntentChoice = async (choice) => {
//   setShowIntentPopup(false);
//   if (!pendingQuestion) return;

//   if (choice === "general") {
//     await sendMessageWithIntent(pendingQuestion, false);
//   } else if (choice === "data") {
//     await sendMessageWithIntent(pendingQuestion, true);
//   }

//   setPendingQuestion(null);
// };



// Intent-gated streaming version. Leaves your old checkIntentAndAsk intact.
// const checkIntentAndAskStream = async () => {
//   const asked = (query || "").trim();
//   if (!asked || isLoadingRef.current) return;

//   // seed UI states
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setAnswer("Loading data…");   // shows the card immediately with your existing styles
//   setSummary("");
//   setServerRows([]);
//   setRowCount(0);
  
//   // ---- 1) intent check
//     // ---- 1) intent check
//   let isDataIntent = true;
// try {
//   const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ question: asked })
//   });
//   const intentData = await intentRes.json();
//   const intent = (intentData?.answer || "").trim().toUpperCase();

//   if (intent === "YES") {
//     isDataIntent = true;
//   } else if (intent === "NO") {
//     isDataIntent = false;
//   } else if (intent === "PDF") {
//     // 👉 call your PDF askbot endpoint
//     try {
//       const res = await fetch(`${API_BASE_URL}/askbot`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked, user_id: "admin" })
//       });
//       const data = await res.json();
//       const norm = normalizeAnswer(data);
//       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//       setAnswer(norm.answer);
//       setSummary(norm.summary || "");
//       setServerRows([]);
//       setRowCount(0);
//     } catch (e) {
//       setMessages(prev => [...prev, { role: "assistant", content: "Unable to fetch PDF results." }]);
//       setAnswer("Unable to fetch PDF results.");
//     } finally {
//       setIsLoading(false);
//       setQuery("");
//     }
//     return; // ✅ stop here
//   } else if (intent === "UNCERTAIN") {
//     setPendingQuestion(asked);
//     setShowIncompletePopup(true); // 🚫 show incomplete popup instead
//     setIsLoading(false);
//     return;
//   }



//     // } else if (intent === "UNCERTAIN") {
//     //   // 👉 pause & show popup
//     //   setPendingQuestion(asked);
//     //   setShowIntentPopup(true);
//     //   setIsLoading(false);   // stop spinner until user chooses
//     //   return;                // exit early, wait for user choice
//     // }
//   } catch {
//     isDataIntent = true; // fail-open to data path
//   }

//   // ---- 2) NON-DATA path -> reuse your current non-streaming logic inline
//   if (!isDataIntent) {
//     try {
//       const res = await fetch(`${API_BASE_URL}/ask_qwen/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked, user_id: "admin" })
//       });
//       const data = await res.json();
//       const norm = normalizeAnswer(data);
//       setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//       setAnswer(norm.answer);
//       setSummary(norm.summary);
//       setServerRows([]); setRowCount(0);
//     } catch (e) {
//       setMessages(prev => [...prev, { role: "assistant", content: "Unable to process general questions at the moment." }]);
//       setAnswer("Unable to process general questions at the moment.");
//       setSummary("");
//     } finally {
//       setIsLoading(false);
//       setQuery("");
//     }
//     return;
//   }

  // ---- 3) DATA path -> stream from /ask_question_stream
//   try {
//     const res = await fetch(`${API_BASE_URL}/ask_question_stream/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });

//     await readNdjson(res, (evt) => {
//       switch (evt.event) {
//         case "narrative": {
//             setNarrative(evt.obj || evt.data || null);
//             break;
//           }

//         case "phase": {
//           // server phases (e.g., "Generating SQL…", "Loading data…")
//           const msg = evt.message || "Loading data…";
//           setAnswer(msg);
//           break;
//         }
//         case "sql": {
//           // optional: you can console.log(evt.sql) for debugging
//           break;
//         }
//         case "rows_preview": {
//           setServerRows(Array.isArray(evt.rows) ? evt.rows : []);
//           setRowCount(typeof evt.row_count === "number" ? evt.row_count : (evt.rows?.length || 0));
//           break;
//         }
//         case "summary": {
//           // setSummary(evt.text || "");
//           setSummary(prev => (narrative ? prev : (evt.text || "")));
//           break;
//         }
//         case "chart": {
//           // you don't render charts here; ignore or store if you add later
//           break;
//         }
//         case "recommendation": {
//           // summary already covers this block in your UI; ignore or store separately if needed
//           break;
//         }
//         case "final": {
//           // final server payload; prefer it over previews
//           const payload = evt.payload || {};
//           const norm = normalizeAnswer(payload);
//           setAnswer(norm.answer || "");                // full answer string (keeps your “more rows…” stripper)
//           // setSummary(norm.summary || "");
//           setSummary(payload.narrative ? "" : (norm.summary || ""));
//           setNarrative(payload.narrative || null);
//           setServerRows(Array.isArray(payload.rows) ? payload.rows : []);
//           setRowCount(typeof payload.row_count === "number"
//             ? payload.row_count
//             : (Array.isArray(payload.rows) ? payload.rows.length : 0)
//           );

//           setMessages(prev => [...prev, { role: "assistant", content: norm.answer || "" }]);
//           setIsLoading(false);
//           setQuery("");
//           break;
//         }
//         case "error": {
//           setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong while processing your question." }]);
//           setAnswer("Something went wrong while processing your question.");
//           setSummary("");
//           setIsLoading(false);
//           break;
//         }
//         default: break;
//       }
//     });
//   } catch (err) {
//     setMessages(prev => [...prev, { role: "assistant", content: "Network error." }]);
//     setAnswer("Network error.");
//     setSummary("");
//     setIsLoading(false);
//   }
// };


// const checkIntentAndAsk = async () => {
//   if (!query.trim() || isLoading) return;

//   const asked = query;
//   setLastAnsweredQuery(asked);
//   setMessages(prev => [...prev, { role: "user", content: asked }]);
//   setIsLoading(true);
//   setAnswer("");
//   setSummary("");

//   try {
//     // Intent -> choose endpoint
//     let endpoint = "ask_question";
//     try {
//       const intentRes = await fetch(`${API_BASE_URL}/check_intent/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: asked })
//       });
//       const intentData = await intentRes.json();
//       const intent = intentData?.answer?.toUpperCase?.() || "NO";
//       if (intent !== "YES") endpoint = "ask_qwen";  // small-talk/general -> askbot
//     } catch {
//       endpoint = "ask_question";
//     }

//     const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: asked, user_id: "admin" })
//     });
//     const data = await res.json();

//     // 🔎 Debug logging — add here
//     if (data?.query_used) {
//       if (typeof console.groupCollapsed === "function") {
//         console.groupCollapsed("🔍 API Debug");
//         console.log("SQL used:\n", data.query_used);
//         console.log("Rows:", data.row_count, "Response time:", data.response_time);
//         console.groupEnd();
//       } else {
//         console.log("🔍 SQL used:\n", data.query_used);
//         console.log("Rows:", data.row_count, "Response time:", data.response_time);
//       }
//     }

//     const norm = normalizeAnswer(data);
//     setMessages(prev => [...prev, { role: "assistant", content: norm.answer }]);
//     setAnswer(norm.answer);
//     setSummary(norm.summary);
//     setServerRows(Array.isArray(data.rows) ? data.rows : []);
//     setRowCount(typeof data.row_count === "number" ? data.row_count : (Array.isArray(data.rows) ? data.rows.length : 0));
//   } catch (e) {
//     setAnswer("Something went wrong.");
//     setSummary("");
//   }

//   setIsLoading(false);
//   setQuery("");
// };

async function askQuestion(question) {
  setIsLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/ask_question/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();

    // normalize
    const normalized = normalizeAnswer(data);

    setAnswer(normalized.answer);
    setSummary(normalized.summary);
    setServerRows(data.rows || []);
    setNarrative(data.narrative || null);
    setRowCount(data.row_count || 0);
  } catch (err) {
    setAnswer("⚠️ Error fetching response.");
  } finally {
    setIsLoading(false);
  }
}


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



// const preferEndYearKey = (keys) => {
//   const pref = ["policy_end_date_year", "max_year", "data_end_year", "scope_end_year", "end_year"];
//   for (const p of pref) {
//     const hit = keys.find((k) => k.toLowerCase() === p);
//     if (hit) return hit;
//   }
//   return keys[0] || null; // fallback
// };


// const visibleColumnsForRows = (rows) => {
//   if (!rows?.length) return [];
//   const all = Object.keys(rows[0] || {});

//   // Drop all start-year-like columns
//   const noStarts = all.filter((k) => !isStartYearKey(k));

//   // Find end-year-like columns
//   const endKeys = noStarts.filter(isEndYearKey);
//   if (endKeys.length <= 1) return noStarts;

//   // Keep a single preferred end-year key
//   const keepLc = preferEndYearKey(endKeys.map((k) => k.toLowerCase()));

//   // Build final list: only one end-year column survives
//   const filtered = noStarts.filter((k) => !isEndYearKey(k) || k.toLowerCase() === keepLc);

//   // Move the kept end-year to the front so it’s visible even in 3-col mode
//   const idx = filtered.findIndex((k) => k.toLowerCase() === keepLc);
//   if (idx > 0) {
//     const [ey] = filtered.splice(idx, 1);
//     filtered.unshift(ey);
//   }
//   return filtered;
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


// const visibleColumnsForRows = (rows) => {
//   if (!rows?.length) return [];
//   const all = Object.keys(rows[0] || {});

//   // 1) drop all start-year-like columns
//   const noStarts = all.filter((k) => !isStartYearKey(k));

//   // 2) end-year keys
//   const endKeys = noStarts.filter(isEndYearKey);

//   if (endKeys.length <= 1) return noStarts;

//   // ✅ Always prefer policy_end_date_year if present, else just keep one
//   const keep = endKeys.find(k => k.toLowerCase() === "policy_end_date_year") || endKeys[0];

//   return noStarts.filter(
//     (k) => !isEndYearKey(k) || k.toLowerCase() === keep.toLowerCase()
//   );
// };


const downloadCSV = async (questionText) => {
    try {
      const actualQuestion = questionText || lastAnsweredQuery || query;
      if (!actualQuestion) {
        alert("Missing question for download.");
        return;
      }
      const encoded = encodeURIComponent(actualQuestion);
      const url = `${API_BASE_URL}/ask_question/?export=true&question=${encoded}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/csv" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Download failed: ${errorText}`);
        return;
      }
      const blob = await response.blob();
      const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const filename = `export_${ts}.csv`;
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };


const downloadCSVFromBackend = async (sql) => {
  try {
    const res = await fetch(`${API_BASE_URL}/download_csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql })
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `data_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("CSV download failed", e);
  }
};


const downloadCSVFromRows = (rows, filePrefix = 'export') => {
  console.log('📥 downloadCSVFromRows called:', {
    totalRows: rows?.length,
    hasData: Array.isArray(rows) && rows.length > 0,
    firstRowKeys: rows?.[0] ? Object.keys(rows[0]) : []
  });

  if (!rows || rows.length === 0) {
    console.error('❌ No rows to download');
    alert('No data available to download');
    return;
  }
  
  try {
    const cols = visibleColumnsForRows(rows);
    
    console.log(`✅ Exporting ${rows.length} rows × ${cols.length} columns`);
    
    // Create headers
    const headers = cols.map(key => buildHeaderLabel(key, rows)).join(',');
    
    // Create CSV rows - USE ALL ROWS
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
    
    console.log(`✅ CSV created: ${csvRows.length} data rows`);
    
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
    
    console.log(`✅ Download complete: ${link.download}`);
  } catch (error) {
    console.error('❌ Error downloading CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
};

  // ✅ Also verify your downloadCSVFromRows function uses ALL columns, not just visible ones:
const downloadCSVFromRowss = (rows, filePrefix = 'export') => {
  if (!rows || rows.length === 0) return;
  
  try {
    // ✅ Get ALL columns from the data, not just visible ones
    const allColumns = Object.keys(rows[0] || {});
    
    // ✅ Apply your filtering logic, but don't limit columns artificially
    const cols = visibleColumnsForRows(rows); // This should return ALL relevant columns
    
    // Create headers
    const headers = cols.map(key => buildHeaderLabel(key, rows)).join(',');
    
    // Create CSV rows - use ALL rows passed in
    const csvRows = rows.map(row => 
      cols.map(key => {
        const val = row[key] ?? '';
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
    
    console.log(`✅ Downloaded ${rows.length} rows × ${cols.length} columns`);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
};

//   const downloadCSVFromRows = (rows, filePrefix = 'export') => {
//   if (!rows || rows.length === 0) return;
  
//   try {
//     const cols = visibleColumnsForRows(rows);
    
//     // Create headers
//     const headers = cols.map(key => buildHeaderLabel(key, rows)).join(',');
    
//     // Create CSV rows
//     const csvRows = rows.map(row => 
//       cols.map(key => {
//         const val = row[key] ?? '';
//         // Escape quotes and wrap in quotes if contains comma or newline
//         const escaped = String(val).replace(/"/g, '""');
//         return (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) 
//           ? `"${escaped}"` 
//           : escaped;
//       }).join(',')
//     );
    
//     // Combine headers and rows
//     const csv = [headers, ...csvRows].join('\n');
    
//     // Create and download file
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error('Error downloading CSV:', error);
//     alert('Failed to download CSV. Please try again.');
//   }
// };


  useEffect(() => {
    const newSuggestions = generateDynamicSuggestions(messages, "file", null);
    setSuggestions(newSuggestions);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex(prev => {
        const next = (prev + 1) % suggestions.length;
        setRotatingPlaceholder(suggestions[next]?.text || "");
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [suggestions]);

  useEffect(() => {
    if (!query && suggestions.length > 0) {
      setRotatingPlaceholder(suggestions[0]?.text || "");
    }
  }, [suggestions]);

 

  useEffect(() => {
    if (!query && suggestions.length > 0) {
      setRotatingPlaceholder(suggestions[0]?.text || "");
    }
  }, [suggestions]);



// Pretty header labels: remove _/-, split camelCase, Title Case,
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

  // Formats numbers (or numeric strings) to exactly 2 decimals.
// Keeps non-numeric values as-is. Handles commas and trailing %.
// const formatCell = (val) => {
//   if (val === null || val === undefined) return "";
//   const s = String(val).trim();

//   // numeric or numeric with commas and optional %
//   const looksNumeric = /^[-+]?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?%?$/.test(s);
//   if (typeof val === "number" || looksNumeric) {
//     const isPercent = s.endsWith("%");
//     const num = typeof val === "number"
//       ? val
//       : Number(s.replace(/,/g, "").replace(/%$/, ""));
//     if (Number.isFinite(num)) {
//       const out = num.toLocaleString(undefined, {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       });
//       return isPercent ? `${out}%` : out;
//     }
//   }
//   return s;
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


const formatCell = (val) => {
  if (val === null || val === undefined) return "";

  const s = String(val).trim();
  const isPercent = s.endsWith("%");

  // Parse number
  const num = typeof val === "number" ? val : Number(s.replace(/,/g, "").replace(/%$/, ""));

  if (Number.isFinite(num)) {
    // Special case: plain calendar year (1900–2100) → return raw integer, no commas
    if (num >= 1900 && num <= 2100 && Number.isInteger(num)) {
      return String(num);
    }

    // Default numeric formatting
    const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return isPercent ? `${formatted}%` : formatted;
  }

  return s;
};


// ---------- Unit inference + header/cell helpers ----------
// ---------- Unit inference + header/cell helpers (robust) ----------
const CURRENCY_SYMBOL = "₹";

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

// Normalize a time unit string to its base word
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

// Correct singular/plural form based on numeric value
const pluralizeTimeUnit = (unit, value) => {
  const base = normalizeTimeUnit(unit);
  const v = Math.abs(Number(value));
  const irregularPlural = { Day: "Days" };
  const defaultPlural   = base.endsWith("s") ? base : base + "s";
  const pluralWord      = irregularPlural[base] || defaultPlural;
  return v === 1 ? base : pluralWord;         // 1 -> singular, everything else -> plural
};

// Detect if the raw cell already has a time unit to avoid double appending
const cellAlreadyHasTimeUnit = (raw, unit) => {
  const base = normalizeTimeUnit(unit);
  if (!base) return false;
  const re = new RegExp(`\\b${base}(?:s)?\\b`, "i"); // matches Month/Months, Year/Years, etc.
  return re.test(raw);
};

/** Infer unit from column name + sample values (safe for categorical columns) */
// const inferUnitForColumn = (key, rows) => {
//   const k = String(key || "").toLowerCase();

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
// const CURRENCY_SYMBOL = "₹";

const normalizeCurrencyInText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // First, replace currency symbols
  let normalized = text
    .replace(/\$/g, CURRENCY_SYMBOL)  // Replace $ with ₹
    .replace(/€/g, CURRENCY_SYMBOL)   // Replace € with ₹
    .replace(/£/g, CURRENCY_SYMBOL);  // Replace £ with ₹
  
  // Then, format decimal percentages (0.xxxx -> xx.x%)
  // Match patterns like: "Rate: 0.6747" or "is 0.6747" or just "0.6747"
  normalized = normalized.replace(
    /(\b(?:rate|ratio|percentage|probability|churn|retention)[:\s]+)?(\d+\.\d+)(?!\d)/gi,
    (match, prefix, number) => {
      const num = parseFloat(number);
      // If number is between 0 and 1 (exclusive), treat as decimal percentage
      if (num > 0 && num < 1) {
        const percentage = (num * 100).toFixed(1);
        return (prefix || '') + percentage + '%';
      }
      // If number is between 1 and 100 and looks like it should be a percentage
      if (num >= 1 && num <= 100 && prefix) {
        return prefix + num.toFixed(1) + '%';
      }
      return match;
    }
  );
  
  return normalized;
};

// const normalizeCurrencyInText = (text) => {
//   if (!text || typeof text !== 'string') return text;
//   return text
//     .replace(/\$/g, CURRENCY_SYMBOL)  // Replace $ with ₹
//     .replace(/€/g, CURRENCY_SYMBOL)   // Replace € with ₹
//     .replace(/£/g, CURRENCY_SYMBOL);  // Replace £ with ₹
// };

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
// Use this instead of plain formatCell() when rendering table cells.
const formatCellForColumn = (key, val, rows) => {
  const { type, unit } = inferUnitForColumn(key, rows);

  if (val === null || val === undefined) return "";

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

  if (type === "percent") {
  const s = String(val).trim();

  // Already formatted (e.g., "61.06%")
  // if (/%$/.test(s)) return s;
  if (/%$/.test(s)) {
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
  if (num > 0 && num <= 1) {
    return formatPercentage(num * 100);   // ✅ Config based
  }

  // Already a percentage number
  return formatPercentage(num);           // ✅ Config based
}

  // TIME columns
  if (type === "time") {
    // For Year specifically: return raw integer string (no commas)
    if (unit === "Year") {
      const s = String(val).trim();
      const n = typeof val === "number" ? val : Number(s.replace(/[^0-9\-]/g, ""));
      return Number.isFinite(n) ? String(Math.trunc(n)) : s;
    }
    // For Month/Week/Day, keep your normal numeric formatting (usually no commas anyway)
    return formatCell(val);
  }

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


// /** Build header like "Policy Tenure (Months)" or "Churn Rate (%)" */
// const buildHeaderLabel = (key, rows) => {
//   const { unit } = inferUnitForColumn(key, rows);
//   const base = formatHeader(key); // your existing pretty title
//   if (!unit) return base;

//   // strip units already stuck to the name
//   const cleaned = base
//     .replace(/\s*%$/i, "")
//     .replace(/\s*\b(Years?|Months?|Weeks?|Days?)\b$/i, "")
//     .trim();

//   return `${cleaned} (${unit})`;
// };

const CUSTOM_HEADER_LABELS = {
  max_year:        "End Year",
  min_year:        "Start Year",        // (optional) if you want this too
  data_end_year:   "End Year",
  data_start_year: "Start Year",
  scope_end_year:  "End Year",
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


// /** Append unit inside the cell only when it's numeric and needs it */
// const formatCellWithUnit = (val, key, rows) => {
//   const { type, unit } = inferUnitForColumn(key, rows);
//   const raw = String(val ?? "").trim();
//   let s = formatCell(val); // your existing formatter
//   if (s === "") return s;

//   // only append to numeric values
//   const isNumericCell = _isNumeric(raw);

//   if (type === "percent" && isNumericCell && !raw.endsWith("%")) {
//     return `${s}%`;
//   }
//   if (type === "time" && isNumericCell) {
//     return `${s} ${unit}`;
//   }
//   return s;
// };

/** Append unit inside the cell only when it's numeric and needs it */
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

//   // Time: append the unit; for Year(s) show plain integer (no grouping)
//   // if (type === "time") {
//   //   // If the cell already contains the unit text, leave it as-is
//   //   const alreadyHasUnit = new RegExp(`\\b${unit}\\b`, "i").test(raw);
//   //   if (alreadyHasUnit) return raw;

//   //   const out =
//   //     unit === "Year" || unit === "Years"
//   //       ? String(Math.trunc(n)) // no thousands separator for years
//   //       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

//   //   return `${out} ${unit}`;
//   // }

//   // Time: append the unit; for Year(s) show plain integer (no grouping)
// if (type === "time") {
//   // If the cell already contains a time unit, leave it as-is
//   if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

//   const baseUnit  = normalizeTimeUnit(unit);
//   const unitLabel = pluralizeTimeUnit(baseUnit, n);

//   const out =
//     baseUnit === "Year"
//       ? String(Math.trunc(n)) // avoid 2,025-style grouping
//       : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

//   return `${out} ${unitLabel}`;
// }


//   // Everything else uses the generic formatter you already have
//   return formatCell(val);
// };

/** Append unit inside the cell only when it's numeric and needs it */
const formatCellWithUnit = (val, key, rows) => {
  const { type, unit } = inferUnitForColumn(key, rows);
  const raw = String(val ?? "").trim();
  if (!raw) return "";

  const n = Number(raw.replace(/[^0-9.\-]/g, ""));
  const isNum = Number.isFinite(n);

  // If it's clearly non-numeric text (e.g., "Elite Retainers"), don't touch it
  if (!isNum && /[A-Za-z]/.test(raw)) return raw;

  // Percent: format number and append %, but don't double-append
  if (type === "percent") {
    if (raw.endsWith("%")) return raw; // already has a percent sign
    const numStr = n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return `${numStr}%`;
  }

  // Time units
  if (type === "time") {
    const baseUnit = normalizeTimeUnit(unit);

    // Special case: calendar years → "2025 year" (force singular)
    // if (baseUnit === "Year" && isNum && n >= 1900 && n <= 2100) {
    //   return `${Math.trunc(n)} year`;
    // }
    // replace the range check with a 4-digit check
    if (baseUnit === "Year" && isNum && /^\d{4}$/.test(String(Math.trunc(n)))) {
      return `${Math.trunc(n)} year`;
    }

    // If the cell already contains a time unit (e.g., "3 Months"), leave it
    if (cellAlreadyHasTimeUnit(raw, unit)) return raw;

    const unitLabel = pluralizeTimeUnit(baseUnit, n);
    const out =
      baseUnit === "Year"
        ? String(Math.trunc(n)) // avoid 2,025 grouping for durations like 1/2 years
        : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return `${out} ${unitLabel}`;
  }

  // Everything else uses the generic formatter you already have
  return formatCell(val);
};

// const handleRating = async (idx, rating, msg) => {
//   setMessageRatings((prev) => ({
//     ...prev,
//     [idx]: rating
//   }));

//   if (rating === "yes") {
//     try {
//       const payload = {
//         question: msg.asked_question || msg.content || "",
//         summary: msg.summary || "",
//         recommendations: Array.isArray(msg.recommendation)
//           ? msg.recommendation.join("\n")     // ensure string
//           : msg.recommendation || "",
//         sql: msg.query_used || "",
//         chart_config: msg.chart_config || {}, // safer than null
//         row_count: msg.rows ? msg.rows.length : 0,
//         db_id: "liberty",                     // ⚠️ verify type expected
//         narrative: msg.narrative || "",       // safer than null
//         user_id: "admin",                     // ⚠️ verify type expected
//       };

//       console.log("📤 Saving to corpus:", payload);

//       const res = await fetch(`${API_BASE_URL}/save_to_corpus/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const errorText = await res.text();
//         throw new Error(`Save failed: ${res.status} ${errorText}`);
//       }

//       const data = await res.json();
//       console.log("✅ Corpus save response:", data);
//     } catch (err) {
//       console.error("⚠️ Failed to save to corpus:", err);
//     }
//   } else if (rating === "no") {
//   // 👎 Put the same question back in the input box for retry
//   setQuery(msg.asked_question || msg.content || "");
// }
// };


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





  return (
    <>
      <style>{`
      body.light-mode {
    --chat-text-color: #000;
    --input-bg-color: rgba(255, 255, 255, 0.9);
  }

  body.dark-mode {
    --chat-text-color: #fff;
    --input-bg-color: rgba(15, 15, 15, 0.3);
  }
        .assistant-container {
          .assistant-container {
          position: relative;
          z-index: 9999;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          left: 40px;
        }
        .assistant-input-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    background: var(--input-bg-color);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 30px;
    padding: 10px 20px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.1),
      0 0 8px 2px rgba(37, 99, 235, 0.5);
    transition: box-shadow 0.3s ease;
  }
        .assistant-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 16px;
    outline: none;
    padding: 5px 10px;
    color: var(--chat-text-color);
  }


.response-header {
  position: relative;               /* anchor for the close button */
  display: flex;
  align-items: center;
  padding: 6px 40px 8px 0;          /* right padding so text doesn’t sit under the X */
  margin-bottom: 8px;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  top: -1px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.close-btn:hover { background: #f5a48fff; transform: translateY(-1px); }
.close-btn:active { transform: translateY(0); }
        .response-body {
    color: var(--chat-text-color);
  }
        .ask-button {
          background: rgba(37, 99, 235, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 9999px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
          .assistant-input::placeholder {
    color: var(--chat-text-color);
    opacity: 0.7;
  }
          .user-question {
    color: var(--chat-text-color);
  }

      .markdown-scroll-wrapper {
  overflow-x: hidden;
  width: 100%;
}

.markdown-scroll-wrapper table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
}

.assistant-response p,
.assistant-response span {
  word-break: break-word;
  white-space: normal;
}

.response-body {
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

 :root {
  --shadow-md: 0 12px 40px rgba(0, 0, 0, 0.15);
  --border-soft: rgba(255, 255, 255, 0.2);
  --border-table: rgba(255, 255, 255, 0.12);
  --surface-tableHeader: rgba(255, 255, 255, 0.06);
  --text-primary: #e5e7eb;
  --text-muted: #94a3b8;
  --accent-yellow: #facc15;
  --input-bg-color: rgba(255, 255, 255, 0.06);
}

.resultTableWrapper--alt {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  overflow: auto;                 /* scroll container */
  border: 1px solid var(--border-soft);
  max-height: 380px;              /* adjust as needed */
}

.resultTable--alt {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.92rem;
  color: var(--text-primary);
}

/* Header */
.resultTable--alt thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(135deg, #1e3a8a 50%, #0f172a 97%) !important;
  color: #fff; /* or keep var(--accent-yellow) if you prefer */
  text-transform: none;
  letter-spacing: 0.2px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-table);
  font-weight: 700;
}
.resultTable--alt thead th:first-child { border-top-left-radius: 10px; }
.resultTable--alt thead th:last-child  { border-top-right-radius: 10px; }

/* Cells */
.resultTable--alt td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(116, 56, 177, 0.95);
}
/* Stronger contrast for table rows (alt table) */
.resultTable--alt tbody tr:nth-child(odd)  {
  background: rgba(228, 231, 236, 1) !important;  /* slate/near-navy */
}
.resultTable--alt tbody tr:nth-child(even) {
  background: rgba(211, 212, 214, 0.97) !important;  /* slate/near-navy */
}
.resultTable--alt tbody tr:hover {
  background: rgba(99, 102, 241, 0.22) !important; /* keep your hover cue */
}

/* Rounded row bottoms */
.resultTable--alt tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
.resultTable--alt tbody tr:last-child td:last-child  { border-bottom-right-radius: 10px; }

/* Align numbers to the right and use tabular figures */
.resultTable--alt th:nth-child(n+2),
.resultTable--alt td:nth-child(n+2) {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* ---------- Result table (dark) ---------- */
.resultTableWrapper {
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(249, 251, 252, 0.91);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  overflow-x: auto;
  border: 1px solid var(--border-soft);
}

.resultTable {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.resultTable th {
  background-color: var(--surface-tableHeader);
  color: var(--accent-yellow);
  padding: 0.65rem;
  border: 1px solid var(--border-table);
  text-align: left;
}

.resultTable td {
  padding: 0.6rem;
  border: 1px solid var(--border-table);
}

.warningBox {
  padding: 10px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  font-size: 14px;
  margin: 8px 0;
  color: #92400e;
}

.downloadLink {
  background: none;
  border: none;
  color: var(--accent-yellow);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.resultTableCell { /* if you want extra cell styles beyond .resultTable th/td */
  padding: 0.6rem;
  border: 1px solid var(--border-table);
}

.collapseButton {
  text-align: right;
  margin-top: 6px;
}

.collapseButtonLink {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.expandNote {
  padding: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
  color: var(--text-muted);
}

/* Assistant card */
.assistant-response {
  position: relative;
  width: 100%;
  max-height: 300px; /* keep only one */
  overflow-y: auto;
  margin-bottom: 10px;
  background: var(--input-bg-color);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.4s ease;
  left: 0;
}


       .assistant-response {
        max-height: 300px;
  position: relative;
  width: 100%;
  max-height: 300px; /* Set your preferred max height */
  overflow-y: auto;
  margin-bottom: 10px;
  background: var(--input-bg-color);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.4s ease;
  left: 0px;
}

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
          @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
      </style>


     

     {/* <div className="assistant-container">
  {answer && (
    <div className="assistant-response">
      <div className="response-header">
        <strong className="user-question">{query}</strong>
        <X size={16} onClick={() => setAnswer("")} className="close-btn" />
      </div>

      <div className="response-body">
        <div className="markdown-scroll-wrapper">
  {answer.includes("- ") || answer.includes("\n") ? (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ul: ({ node, ...props }) => (
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }} {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }} {...props} />
        ),
        li: ({ node, ...props }) => (
          <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }} {...props} />
        ),
        p: ({ node, ...props }) => (
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }} {...props} />
        ),
        table: ({ node, ...props }) => (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }} {...props} />
        ),
        th: ({ node, ...props }) => (
          <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }} {...props} />
        ),
        td: ({ node, ...props }) => (
          <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />
        ),
      }}
    >
      {answer}
    </ReactMarkdown>
  ) : (
    <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
      {answer.split(/(?<=[0-9])\s+(?=[A-Z])/).map((item, idx) =>

        item.trim() && (
          <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
            {item.trim()}
          </li>
        )
      )}
    </ul>
  )}

  {answer.includes("please download") && (
    <button
      className="download-button"
      onClick={() => downloadCSV(sessionIdRef.current, query, lastAnsweredQuery)}
    >
      ⬇ Download Full CSV
    </button>
  )}
</div>
      </div>
 
            {/* <div className="response-body">{answer}</div> */}
          {/* </div>
        )}

        <div className="assistant-input-wrapper">
          <input
  type="text"
  className="assistant-input"
  placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onClick={() => {
    if (!query.trim() && rotatingPlaceholder) {
      setQuery(rotatingPlaceholder);
    }
  }}
  onKeyDown={(e) => e.key === "Enter" && checkIntentAndAsk()}
/>

          <button
            className="ask-button"
            onClick={checkIntentAndAsk}
            disabled={isLoading || !query.trim() || !sessionId}

          >
            {isLoading ? (
              <div style={{
                width: 18,
                height: 18,
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}; */}
<div className="assistant-container">



  
  {/* {answer && ( */}
  {(answer || summary || (serverRows?.length > 0) || narrative) && (
    <div className="assistant-response">
      <div className="response-header">
        {/* <strong className="user-question">{query}</strong> */}
        <strong className="user-question" style={{ fontFamily: "'Titillium Web', 'Segoe UI', sans-serif", fontWeight: 700 }}>
          {/* {lastAnsweredQuery || query} */}
          {normalizeCurrencyInText(lastAnsweredQuery || query)}
          
        </strong>
        <X size={16} 
        // onClick={() =>  { setAnswer(""); setSummary(""); }}
         onClick={() => { setAnswer(""); setSummary(""); setNarrative(null); setServerRows([]);  }}
         className="close-btn" />
      </div>

      <div className="response-body">
        <div className="markdown-scroll-wrapper">

           {/* ✅ ADD NARRATIVE RIGHT HERE */}
    {/* <Narrative>
    //   data={narrative}
      // onFollowUp={(q) => { */}
      {/* //   setQuery(q);
        // pass q so we don't rely on stale state
    //     (USE_STREAMING ? checkIntentAndAskStream : checkIntentAndAsk)(q);
    //   }}
    // /> */}
           {/* Unified table renderer (uses msg.rows if present, else parses displayAnswer) */}
            {/* Replace the entire ReactMarkdown/list branch with this */}
{(() => {
  // ✅ If this is a general question response, always render as plain text - NO TABLE PARSING
  // if (isCurrentResponseGeneral) {
  //   return (
  //     <ReactMarkdown 
  //       remarkPlugins={[remarkGfm]}
  //       components={{
  //         ul: ({ node, ...props }) => (
  //           <ul
  //             style={{
  //               paddingLeft: "1.5rem",
  //               marginBottom: "1rem",
  //               listStyleType: "disc",
  //             }}
  //             {...props}
  //           />
  //         ),
  //         ol: ({ node, ...props }) => (
  //           <ol
  //             style={{
  //               paddingLeft: "1.5rem",
  //               marginBottom: "1rem",
  //               listStyleType: "decimal",
  //             }}
  //             {...props}
  //           />
  //         ),
  //         li: ({ node, ...props }) => (
  //           <li style={{ marginBottom: "0.5rem", lineHeight: "1.6" }} {...props} />
  //         ),
  //         p: ({ node, ...props }) => (
  //           <p style={{ marginBottom: "1rem", lineHeight: "1.6" }} {...props} />
  //         ),
  //       }}
  //     >
  //       {normalizeCurrencyInText(displayAnswer || "_No content._")}
  //       {/* {displayAnswer || "_No content._"} */}
  //     </ReactMarkdown>
  //   );
  // }

  if (isCurrentResponseGeneral) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeCurrencyInText(
          displayAnswer ||
          narrative?.opener ||
          "_No content._"
        )}
      </ReactMarkdown>
    );
  }

  const hasServerRows = Array.isArray(serverRows) && serverRows.length > 0 &&
    typeof serverRows[0] === "object" && Object.keys(serverRows[0] || {}).length >= 2;

  const canParseText = !hasServerRows && looksTabular(displayAnswer);
  const parsed = canParseText ? parseAnswerToTable(displayAnswer) : { columns: [], rows: [] };

  // ✅ CRITICAL: fullDataset should always be the complete serverRows
  const fullDataset = hasServerRows ? serverRows : parsed.rows;
  const tableRows = fullDataset;  // Use same reference

  // console.log(`📊 Rendering table with ${fullDataset.length} rows in fullDataset`);

  // if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
  //   const solo = formatStandaloneNumber(displayAnswer);
  //   if (solo !== null) {
  //     return (
  //       <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
  //         {solo}
  //       </div>
  //     );
  //   }

  //   return (
  //     <ReactMarkdown remarkPlugins={[remarkGfm]}>
  //       {displayAnswer || "_No content._"}
  //     </ReactMarkdown>
  //   );
  // }


    const isCountLikeQuery =
  rowCount &&
  tableRows?.length === 1 &&
  Object.keys(tableRows[0] || {}).length === 1;

if (isCountLikeQuery) {
  // ✅ Do NOT render table or fallback text
  return null;
}



  // 1) If backend provided rows, trust that as tabular.
  // const hasServerRows = Array.isArray(serverRows) && serverRows.length > 0 &&
    // typeof serverRows[0] === "object" && Object.keys(serverRows[0] || {}).length >= 2;

  // 2) If no rows from server, decide from text shape.
  // const canParseText = !hasServerRows && looksTabular(displayAnswer);

  // 3) Parse only if it looks tabular; otherwise keep rows empty so we fall back to Markdown.
  // const parsed = canParseText ? parseAnswerToTable(displayAnswer) : { columns: [], rows: [] };


  // ✅ Keep original data separate for download
  const allRows = hasServerRows ? serverRows : parsed.rows;  // For download
  // const tableRows = hasServerRows ? serverRows : parsed.rows; // For display

  // const allRowsForDownload = hasServerRows ? serverRows : parsed.rows;  // Full dataset
  // const tableRows = hasServerRows ? serverRows : parsed.rows;
  // 4) Choose rows source
  // const tableRows = hasServerRows ? serverRows : parsed.rows;

  // if (!tableRows || !tableRows.length || (Object.keys(tableRows[0] || {}).length <= 1)) {
  //   // If the whole answer is one number, pretty-print it
  //   const solo = formatStandaloneNumber(displayAnswer);
  //   if (solo !== null) {
  //     return (
  //       <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
  //         {solo}
  //       </div>
  //     );
  //   }

  //   // Otherwise render as markdown as usual
  //   return (
  //     <ReactMarkdown remarkPlugins={[remarkGfm]}>
  //       {displayAnswer || "_No content._"}
  //     </ReactMarkdown>
  //   );
  // }

  // const columns = visibleColumnsForRows(tableRows);      // ← use filtered+deduped list
  // const total = rowCount || tableRows.length;
  // const tooMany = total > 50;
  // const visibleRows = tableExpanded ? tableRows : tableRows.slice(0, 8);
  // const visibleCols = tableExpanded ? columns : columns.slice(0, 3);

  // const columns = visibleColumnsForRows(tableRows);
  // const total = rowCount || tableRows.length;
  // const tooMany = total > 50;
  
  // // ✅ Only slice for DISPLAY, not for download
  // const visibleRows = tableExpanded ? tableRows : tableRows.slice(0, 8);
  // const visibleCols = tableExpanded ? columns : columns.slice(0, 3);

 const columns = visibleColumnsForRows(tableRows);
  const total = rowCount || tableRows.length;
  const tooMany = total > 50;
  
  // ✅ Only slice for DISPLAY, never slice fullDataset
  const displayRows = tableExpanded ? tableRows : tableRows.slice(0, 8);
  const displayCols = tableExpanded ? columns : columns.slice(0, 3);

  // ✅ ADD THIS CHECK
  const hasData = tableRows && tableRows.length > 0;
  const noData = tableRows.length === 0;


  // console.log(`🎨 Display: ${displayRows.length} rows × ${displayCols.length} cols | Download: ${fullDataset.length} rows`);


  return (
    // <>
    //   {tooMany && (
    //     <div className="warningBox">
    //       Too many results to display ({total} rows).{" "}
    //       <button
    //         className="downloadLink"
    //         onClick={() => downloadCSV(lastAnsweredQuery || query)}
    //       >
    //         Download full results (CSV)
    //       </button>
    //     </div>
    //   )}

    <>
{/* // ✅ Add convenient download button */}
  {tooMany && (
  <div className="warningBox">
    Too many results to display ({total} rows).{" "}
    <button
      style={{
        padding: "8px 14px",
        borderRadius: "6px",
        backgroundColor: "#10b981",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
     onClick={() => {
  if (!lastUsedSQLRef.current) {
    alert("Query not ready yet");
    return;
  }
  downloadCSVFromBackend(lastUsedSQLRef.current);
}}
    >
      Download Full CSV ({rowCount} rows)
    </button>
  </div>
)}


{/* ✅ Show opener ONLY when backend returns 0 rows */}
{/* {serverRows?.length === 0 && narrative?.opener && (
  <div
    style={{
      margin: "12px 0",
      padding: "1rem 1.25rem",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.10)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      borderLeft: "4px solid #38bdf8",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    }}
  >
    <div style={{ fontWeight: 700 }}>
      {normalizeCurrencyInText(narrative.opener)}
    </div>
  </div>
)} */}


{/* ✅ Show SIMPLE WARNING when backend returns 0 rows */}
{serverRows?.length === 0 && narrative?.opener && (
  <div
    style={{
      margin: "12px 0",
      padding: "1rem 1.25rem",
      borderRadius: "12px",
      background: "#fef3c7",
      borderLeft: "4px solid #f59e0b",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    }}
  >
    <div style={{ 
      fontWeight: 600, 
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
      {normalizeCurrencyInText(narrative.opener)}
    </div>
  </div>
)}


      {/* {narrative?.insights?.length > 0 && ( */}
      {narrative?.opener && (
        <div
          style={{
            margin: "12px 0",
            padding: "12px 14px",
            borderLeft: "4px solid #22c55e",
            borderRadius: "8px",
            background: "var(--input-bg-color)",
            fontWeight: 600
          }}
        >
          {normalizeCurrencyInText(narrative.opener)}
        </div>
      )}
     {serverRows?.length > 0 && narrative?.insights?.length > 0 && (

        <div
          style={{
            margin: "12px 0",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderLeft: "4px solid #38bdf8",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#38bdf8" }}>
            Key Insights
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
            {narrative.insights.map((i, idx) => (
              <li key={idx}>
                {/* {i} */}
                {normalizeCurrencyInText(i)}
                </li>
            ))}
          </ul>
        </div>
      )}

            {!tooMany && tableRows.length >= 1 && (
        <div className="resultTableWrapper resultTableWrapper--alt">
          <table className="resultTable resultTable--alt">
            <thead>
              <tr>
                {displayCols.map((key) => (
                  <th key={key} className="resultTableCell">
                    {buildHeaderLabel(key, tableRows)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row, i) => (
                <tr key={i}>
                  {displayCols.map((k) => (
                    <td key={k} className="resultTableCell">
                      {formatCellForColumn(k, row[k], tableRows)}
                    </td>
                  ))}
                </tr>
              ))}
              
              {(tableRows.length > 8 || columns.length > 3) && !tableExpanded && (
                <tr>
                  <td colSpan={Math.min(3, columns.length)} className="expandNote">
                    <button onClick={() => setTableExpanded(true)}>
                      Click to expand <FiMaximize2 size={16} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {tableExpanded && (
            <div className="collapseButton">
              <button
                onClick={() => setTableExpanded(false)}
                className="collapseButtonLink"
              >
                Click to collapse <FiMinimize2 size={16} />
              </button>
            </div>
          )}

          
        </div>
      )}


      {/* {narrative?.recommendations?.length > 0 && ( */}
       {serverRows?.length > 0 && narrative?.recommendations?.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "var(--text-primary)",
            borderLeft: "4px solid #fde047",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            fontSize: "0.95rem",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#fde047" }}>
            Recommendations
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.55 }}>
            {narrative.recommendations.map((r, idx) => (
              <li key={idx}>
                {/* {r} */}
                {normalizeCurrencyInText(r)}
                </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
})()}

{(serverRows?.length > 0 || summary || narrative) && (() => {
  const currentMsg = {
    asked_question: lastAnsweredQuery || query,
    content: answer || "",
    summary: summary || "",
    recommendation: narrative?.recommendations?.join("\n") || "",
    query_used: "", // fill if you capture SQL
    rows: serverRows || [],
    chart_config: {}, // replace with actual if available
    narrative: narrative || "",
  };

  // Rating buttons logic would go here if needed
  // Return rating component based on your existing hasAskedFirstQuestion logic
  return null; // Replace with your rating component
})()}


{/* ✅ Second stage loading (appears after summary, before narrative) */}
{!isLoading && isProcessing && (
  <div
    style={{
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
    }}
  >
    <div
      style={{
        width: "16px",
        height: "16px",
        border: "2px solid #fff",
        borderTop: "2px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <p>Processing your question...</p>
  </div>
)}
        </div>
      </div>
    </div>
  )}
  {/* {activeResponse && (
  <div
    style={{
      background: "white",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "16px",
      position: "relative",
    }}
  >
    <button
      onClick={() => setActiveResponse(null)} // close button clears response
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "transparent",
        border: "none",
        fontSize: "1.2rem",
        cursor: "pointer",
      }}
    >
      ✖
    </button>

    {/* Render response content */}
    {/* <div>{activeResponse.content || "No content available"}</div> */}
  {/* </div> */}
{/* )} */} 


  <div className="assistant-input-wrapper">
    <input
      type="text"
      className="assistant-input"
      placeholder={query.trim() ? "" : rotatingPlaceholder || "Ask a question..."}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClick={() => {
        if (!query.trim() && rotatingPlaceholder) {
          setQuery(rotatingPlaceholder);
        }
      }}
      onKeyDown={(e) => e.key === "Enter" && (USE_STREAMING ? checkIntentAndAskStream() : checkIntentAndAsk())}
    />

    <button
      className="ask-button"
      onClick={USE_STREAMING ? checkIntentAndAskStream : checkIntentAndAsk}
      disabled={isLoading || !query.trim()}
      aria-busy={isLoading}
      title={!query.trim() ? "Type your question" : isLoading ? "Sending..." : "Send"}
    >
      {isLoading ? (
        <div
          style={{
            width: 18,
            height: 18,
            border: "2px solid transparent",
            borderTop: "2px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <>
          <Send size={18} />
        </>
      )}
    </button>
  </div>

  {/* Rating Popup */}
  {showRatingPopup && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          color: "white",
          padding: "24px",
          borderRadius: "12px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
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
  )}


{/* 🚫 Incomplete Question Popup */}
{showIncompletePopup && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}
  >
    <div
      style={{
        background: "#1e293b",
        color: "white",
        padding: "32px",
        borderRadius: "16px",
        textAlign: "center",
        maxWidth: "400px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        border: "1px solid #334155",
      }}
    >
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px" }}>
        🚫 Incomplete Question
      </h3>
      <p style={{ marginBottom: "20px", color: "#cbd5e1" }}>
        Please rephrase your query into a full question.
      </p>
      <button
        onClick={() => setShowIncompletePopup(false)}
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
)}


</div>
    </>
  );
};



export default ChatPage;