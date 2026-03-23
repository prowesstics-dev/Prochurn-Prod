import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DataSource.module.css";
import { UploadSection } from "../components/UploadPage"; // Adjust path if needed
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const dataSources = {
  Database: [
    { name: "MySQL", icon: "/Icons/MYSQL.png" },
    { name: "PostgreSQL", icon: "/Icons/POSTGRES.png" },
    { name: "MongoDB", icon: "/Icons/MONGODB.png" },
    { name: "Oracle", icon: "/Icons/ORACLE.png" },
  ],
  FlatFiles: [
    { name: "Excel/CSV", icon: "/Icons/EXCEL.png" },
  ],
  CRM: [
    { name: "Salesforce", icon: "/Icons/SALESFORCE.png" },
    { name: "Zoho CRM", icon: "/Icons/ZOHO(White)png.png" },
    { name: "HubSpot", icon: "/Icons/HUBSPOT.png" },
  ],
  CLOUD: [
    { name: "Google Cloud", icon: "/Icons/GCLOUD.png" },
    { name: "AWS", icon: "/Icons/AWS.png" },
    { name: "AZURE", icon: "/Icons/AZURE.png" },
  ]
};

const flattenSources = () => {
  return Object.entries(dataSources).flatMap(([cat, items]) =>
    items.map(item => ({ ...item, category: cat }))
  );
};

const DataSource = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const MySwal = withReactContent(Swal);
  const allItems = flattenSources();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadSection, setShowUploadSection] = useState(false);
  const navigate = useNavigate();
  const [showPostgresForm, setShowPostgresForm] = useState(false);
const [pgCreds, setPgCreds] = useState({ host: "", port: "", database: "", user: "", password: "", schema: "" });
const [pgTables, setPgTables] = useState([]);
const [selectedTables, setSelectedTables] = useState([]);
const [showPostgresOnlyPage, setShowPostgresOnlyPage] = useState(false);
const [oracleCreds, setOracleCreds] = useState({ server: "", port: "", database: "", user: "", password: "" });
const [showOracleOnlyPage, setShowOracleOnlyPage] = useState(false);



  const [uploadedFiles, setUploadedFiles] = useState({ base: null, pr: null, claims: null, feedback: null, additional: [] });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // const handleDateChange = (date) => {
  //   setSelectedDate(date);
  //   if (date) setSelectedYear(date.getFullYear());
  //   setShowCalendar(false);
  // };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const categories = ["All", ...Object.keys(dataSources)];

  const getCategoryCount = (category) => {
    if (category === "All") return allItems.length;
    return dataSources[category].length;
  };

  const categoryItems = selectedCategory === "All" ? allItems : dataSources[selectedCategory] || [];
  const filteredApps = categoryItems.filter(app => app.name.toLowerCase().includes(searchTerm));


  const handleCardClick = (item) => {
  if (item.name === "Excel/CSV") {
      navigate("/uploadpage");
    } else if (item.name === "PostgreSQL") {
    setShowPostgresOnlyPage(true);
    setShowOracleOnlyPage(false);
  } else if (item.name === "Oracle") {
    setShowOracleOnlyPage(true);
    setShowPostgresOnlyPage(false);
  } else {
    setShowPostgresForm(false);
    setShowUploadSection(false);
    setShowPostgresOnlyPage(false);
    setShowOracleOnlyPage(false);
  }
};

const handleUploadTables = () => {
  console.log("Selected tables to upload:", selectedTables);
  // TODO: Add logic to send selectedTables to your backend if needed
};



const handlePgConnect = async () => {
  try {
    const res = await fetch(`${API_URL}/fetchpostgrestables/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pgCreds),
    });

    const data = await res.json();
    if (!data.tables || data.tables.length === 0) {
      Swal.fire("No tables found", "Check your credentials or schema.", "info");
      return;
    }

    const tableHtml = `
  <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 0; margin-top: 10px;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: left;">Select</th>
          <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: left;">Table Name</th>
        </tr>
      </thead>
      <tbody>
        ${data.tables
          .map(
            (table) => `
            <tr>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">
                <input type='checkbox' name='table' value='${table}' />
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${table}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
`;


    Swal.fire({
      title: "<strong>Available Tables</strong>",
      html: tableHtml,
      width: "600px",
      confirmButtonText: "Add & Upload",
      showCancelButton: true,
      preConfirm: () => {
        const selected = Array.from(
          document.querySelectorAll("input[name=table]:checked")
        ).map((el) => el.value);

        if (selected.length === 0) {
          Swal.showValidationMessage("Please select at least one table");
        }

        return selected;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const selected = result.value;
        setSelectedTables(selected);
        console.log("Selected Tables:", selected);
        // handleUploadTables(selected); // You can trigger upload here
      }
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Connection Failed", "Please check your credentials", "error");
  }
};

const handleOracleConnect = async () => {
  try {
    const res = await fetch(`${API_URL}/fetchoracletables/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(oracleCreds),
    });

    const data = await res.json();
    if (!data.tables || data.tables.length === 0) {
      Swal.fire("No tables found", "Check your credentials or schema.", "info");
      return;
    }

    const tableHtml = `
      <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 0; margin-top: 10px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: left;">Select</th>
              <th style="padding: 8px; border-bottom: 1px solid #ccc; text-align: left;">Table Name</th>
            </tr>
          </thead>
          <tbody>
            ${data.tables.map((table) => `
              <tr>
                <td style="padding: 6px; border-bottom: 1px solid #eee;">
                  <input type='checkbox' name='table' value='${table}' />
                </td>
                <td style="padding: 6px; border-bottom: 1px solid #eee;">${table}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;

    Swal.fire({
      title: "<strong>Available Tables</strong>",
      html: tableHtml,
      width: "600px",
      confirmButtonText: "Add & Upload",
      showCancelButton: true,
      preConfirm: () => {
        const selected = Array.from(document.querySelectorAll("input[name=table]:checked"))
          .map(el => el.value);
        if (selected.length === 0) {
          Swal.showValidationMessage("Please select at least one table");
        }
        return selected;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedTables(result.value);
        console.log("Oracle Selected Tables:", result.value);
      }
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Connection Failed", "Please check your Oracle credentials", "error");
  }
};

  // const handleDownloadTemplates = () => {};
  // const handleFeedbackInfo = () => {};
  // const handleFileUpload = async () => {};
  // const handleRemoveFile = () => {};
  // const handleRemoveAdditionalFile = () => {};
  // const handleProcessData = () => {};
  // const tooltips = {
  //   base: "Contains the whole purchase data",
  //   pr: "Contains the Policy renewed, new policies, and rollover details",
  //   claims: "Contains claim-related details",
  //   feedback: "Customer satisfaction data & churn reasons",
  //   additional: "Any extra business-related data for better model accuracy",
  // };
  // const isAllRequiredUploaded = uploadedFiles.base && uploadedFiles.pr && uploadedFiles.claims;

 return (
    <div className={styles.wrapper}>
      {showOracleOnlyPage ? (
  <div className={styles.pgWrapper}>
    <button className={styles.backButton} onClick={() => setShowOracleOnlyPage(false)}>← Back</button>
    <h2>Connect to Oracle</h2>
    <input placeholder="Server" value={oracleCreds.server} onChange={(e) => setOracleCreds({ ...oracleCreds, server: e.target.value })} />
    <input placeholder="Port" value={oracleCreds.port} onChange={(e) => setOracleCreds({ ...oracleCreds, port: e.target.value })} />
    <input placeholder="Database" value={oracleCreds.database} onChange={(e) => setOracleCreds({ ...oracleCreds, database: e.target.value })} />
    <input placeholder="Username" value={oracleCreds.user} onChange={(e) => setOracleCreds({ ...oracleCreds, user: e.target.value })} />
    <input type="password" placeholder="Password" value={oracleCreds.password} onChange={(e) => setOracleCreds({ ...oracleCreds, password: e.target.value })} />
    <button onClick={handleOracleConnect}>Connect</button>
  </div>
) : null}

      {showPostgresOnlyPage ? (
        <div className={styles.pgWrapper}>
          <button className={styles.backButton} onClick={() => setShowPostgresOnlyPage(false)}>
          ← Back
         </button>
          <h2>Connect to PostgreSQL</h2>
          <input placeholder="Host" value={pgCreds.host} onChange={(e) => setPgCreds({ ...pgCreds, host: e.target.value })} />
          <input placeholder="Database" value={pgCreds.database} onChange={(e) => setPgCreds({ ...pgCreds, database: e.target.value })} />
          <input placeholder="User" value={pgCreds.user} onChange={(e) => setPgCreds({ ...pgCreds, user: e.target.value })} />
          <input type="password" placeholder="Password" value={pgCreds.password} onChange={(e) => setPgCreds({ ...pgCreds, password: e.target.value })} />
          <input placeholder="Schema" value={pgCreds.schema} onChange={(e) => setPgCreds({ ...pgCreds, schema: e.target.value })} />
          <button onClick={handlePgConnect}>Connect</button>

          {pgTables.length > 0 && (
            <>
              <h4>Select Tables</h4>
              {pgTables.map((table) => (
                <label key={table}>
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={(e) =>
                      setSelectedTables(prev =>
                        e.target.checked
                          ? [...prev, table]
                          : prev.filter(t => t !== table)
                      )
                    }
                  />
                  {table}
                </label>
              ))}
              <button onClick={handleUploadTables}>Add & Upload</button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.leftPanel}>
            <div className={styles.leftPanelHeader}>
              <h3 className={styles.leftPanelTitle}>Data Sources</h3>
            </div>
            {categories.map((cat) => (
              <div
                key={cat}
                className={`${styles.categoryItem} ${selectedCategory === cat ? styles.active : ""}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat !== "FlatFiles") setShowUploadSection(false);
                }}
              >
                {cat}
                <span className={styles.countBadge}>{getCategoryCount(cat)}</span>
              </div>
            ))}
          </div>

          <div className={styles.rightPanel}>
                <div className={styles.topBar}>
                  <h2 className={styles.heading}>{selectedCategory}</h2>
                  <input
                    type="text"
                    placeholder="Search for an app"
                    className={styles.dataSearchInput}
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>

                <div className={styles.cardGrid}>
                  {filteredApps.map((item) => (
                    <div key={item.name} className={styles.card} onClick={() => handleCardClick(item)}>
                      <img src={item.icon} alt={item.name} className={styles.icon} />
                      <h4 className={styles.cardTitle}>{item.name}</h4>
                    </div>
                  ))}
                  <div className={styles.suggestionBox}>
                    <p className={styles.suggestionText}>Don’t see what you need?</p>
                    <button className={styles.suggestionButton}>Mention It</button>
                 </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSource;