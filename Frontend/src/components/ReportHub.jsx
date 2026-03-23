import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import styles from './ReportHub.module.css';
import { useLocation } from "react-router-dom";

const mockReports = [
  {
    id: 1,
    name: 'Monthly Churn',
    type: 'Churn',
    date: '2025-05-01',
    data: [12, 19, 3, 5, 2, 3],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  {
    id: 2,
    name: 'Retention by Segment',
    type: 'Retention',
    date: '2025-05-15',
    data: [5, 10, 15, 8, 7, 12],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
];

const ReportHub = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
      if (location.pathname === "/reporthub")
    // Reset card selection on sidebar navigation
    setSelectedReport(null);
    setCurrentPage(1);
  }, [location]);

  

  const handleDownload = (report) => {
    window.location.href = `http://localhost:8000/api/download/${report.id}/`;
  };

  if (selectedReport) {
    const chartData = {
      labels: selectedReport.labels,
      datasets: [
        {
          label: selectedReport.name,
          data: selectedReport.data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    };

    return (
      <div className={styles.reportDetail}>
        <div className={styles.headerRow}>
          <span className={styles.back} onClick={() => setSelectedReport(null)}>← Back</span>
          <h1 className={styles.pageTitle}>{selectedReport.name}</h1>
          <button className={styles.downloadButton} onClick={() => handleDownload(selectedReport)}>Download</button>
        </div>

        <p><strong>Type:</strong> {selectedReport.type}</p>
        <p><strong>Last Updated:</strong> {selectedReport.date}</p>

        <div className={styles.chartContainer}>
          <Bar
            data={chartData}
            options={{
              maintainAspectRatio: false,
              responsive: true,
            }}
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport.labels.map((label, idx) => (
                <tr key={idx}>
                  <td>{label}</td>
                  <td>{selectedReport.data[idx]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Report Hub</h1>
      <table className={styles.reportTable}>
        <thead>
          <tr>
            <th>Report Name</th>
            <th>Report Type</th>
            <th>Date of Updation</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {mockReports.map((report) => (
            <tr key={report.id}>
              <td className={styles.clickable} onClick={() => setSelectedReport(report)}>{report.name}</td>
              <td>{report.type}</td>
              <td>{report.date}</td>
              <td><button className={styles.downloadButton} onClick={() => handleDownload(report)}>Download</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportHub;
