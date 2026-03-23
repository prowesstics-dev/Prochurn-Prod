import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDownload, FiX } from "react-icons/fi";
import "./HistoricalData.module.css"; // Save the CSS below in this file
// import Sidebar from "./SidebarUpload.jsx";

const HistoricalData = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios.get("/api/get_prediction_tables/")
      .then((res) => {
        setTables(res.data.tables);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleTableClick = (tableName) => {
    setIsLoading(true);
    axios.get(`/api/get_prediction_table_data/?table=${tableName}`)
      .then((res) => {
        setTableData(res.data);
        setSelectedTable(tableName);
        setShowModal(true);
      })
      .finally(() => setIsLoading(false));
  };

  const handleDownload = () => {
    window.location.href = `/api/download_prediction_table/?table=${selectedTable}`;
  };

  return (
    
    <div className="historical-tables">
        {/* <Sidebar /> */}
      <h1>Historical Processed Tables</h1>
      
      <table className="table-list">
        <thead>
          <tr>
            <th>Table Name</th>
            <th>Processed Time</th>
          </tr>
        </thead>
        <tbody>
          {tables.sort((a, b) => new Date(b.time) - new Date(a.time)).map((t) => (
            <tr key={t.name}>
              <td className="table-link" onClick={() => handleTableClick(t.name)}>
                {t.name}
              </td>
              <td>{new Date(t.time).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedTable}</h2>
              <div className="modal-actions">
                <button className="download-btn" onClick={handleDownload}>
                  <FiDownload /> Download CSV
                </button>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {tableData.columns.map((col) => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, i) => (
                    <tr key={i}>
                      {tableData.columns.map((col, j) => (
                        <td key={j}>{row[col] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalData;