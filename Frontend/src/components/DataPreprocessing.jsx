import React, { useState, useEffect ,useRef, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Empty } from "antd";
const { Title, Text } = Typography;

import axios from "axios";
import { FaPlay, FaTrash, FaDownload } from "react-icons/fa";
import { BsFileEarmark, BsGraphUp, BsDiagram3,BsGearFill,BsBoxes, BsFileText,BsCalendarWeek,BsBox, BsShare, BsTree ,BsTools, BsUnion, BsDatabaseFillGear,BsCopy} from "react-icons/bs";
import styles from "./DataPreprocessing.module.css";
import Swal from "sweetalert2";
import { xml } from "d3";

const DataPreprocessing = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [schemas, setSchemas] = useState({ Stage: [], Cleaned: [], merged: [] });
  const [runningStep, setRunningStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const logFetchInterval = useRef(null);
  const logsStopped = useRef(false);
  const sequentialWorkflowStarted = useRef(false);
  const tableFetchInterval = useRef(null);
  const eventSourceRef = useRef(null);
  const navigate = useNavigate();
  const visibleSteps = Math.max(runningStep, 1);
  const spacing = 160;
  const startX = 124;
  



  useEffect(() => {
    if (runningStep < 3) {
      fetchTables();
      tableFetchInterval.current = setInterval(fetchTables, 5000);
    } else {
      clearInterval(tableFetchInterval.current);
      tableFetchInterval.current = null;
      console.log("✅ Stopped fetchTables at Step 3");
    }

    return () => clearInterval(tableFetchInterval.current);
  }, [runningStep]);

  useEffect(() => {
    if (isFetchingLogs && runningStep < 3 && !logFetchInterval.current) {
      logFetchInterval.current = setInterval(fetchDAGLogs, 5000);
      console.log("⏳ Started log fetching interval...");
    }
  
    if (runningStep >= 3 && logFetchInterval.current) {
      console.log("🛑 Stopping DAG Log Fetch...");
      clearInterval(logFetchInterval.current);
      logFetchInterval.current = null;
      setIsFetchingLogs(false);
    }
  
    return () => {
      if (logFetchInterval.current) {
        console.log("🧹 Cleanup: Clearing log fetch interval");
        clearInterval(logFetchInterval.current);
        logFetchInterval.current = null;
      }
    };
  }, [isFetchingLogs, runningStep]);


  const renderSchemaCard = (title, tables) => (
  <Card
  title={<Title level={5} style={{ color: "#1f2937", margin: 0 }}>{title}</Title>}
  bordered={false}
  style={{
    background: "#f9fafb", // Light gray card background
    color: "#111827",       // Darker text
    borderRadius: "10px",
    marginBottom: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)", // Very soft shadow
    border: "1px solid #e5e7eb"
  }}
  headStyle={{ 
    borderBottom: "1px solid #e5e7eb", 
    backgroundColor: "#f3f4f6",         // Light section header
    borderRadius: "10px 10px 0 0"
  }}
  bodyStyle={{
    padding: "12px 16px",
    background: "#ffffff",              // White body for better readability
    borderRadius: "0 0 10px 10px",
  }}
>
  {tables.length > 0 ? (
    tables.map((table, idx) => (
      <Text key={idx} style={{ display: "block", color: "#374151", marginBottom: "6px" }}>
        • {table}
      </Text>
    ))
  ) : (
    <Empty description="No tables" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  )}
</Card>

);
  
  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-postgres-tables/`);
      setSchemas(response.data);
    } catch (error) {
      console.error("❌ Error fetching tables:", error);
    }
  };

  const fetchDAGLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-airflow-dag-logs/`);
      if (response.status === 200) {
        const newLogs = response.data.logs || [];
        setLogs((prevLogs) => [...prevLogs, ...newLogs.filter(log => !prevLogs.includes(log))]);
  
        setRunningStep((prevStep) => {
          if (prevStep === 1 && newLogs.some(log => log.includes("Task trigger_cleanse_and_load_PR: success"))) {
            console.log("✔ Moving to 'Data Merging'...");
            return 2;
          }
          if (prevStep === 2 && newLogs.some(log => log.includes("Task trigger_base_PR_append: success"))) {
            console.log("✔ Moving to 'Moved to Merged DB'...");
            
            // ✅ Stop log fetching before going to Step 4
            stopFetching();
  
            // ✅ Only trigger Feature Prediction ONCE
            if (!sequentialWorkflowStarted.current) {
              sequentialWorkflowStarted.current = true;
              setTimeout(() => setRunningStep(4), 3000);
            }
            
            return 3;
          }
          return prevStep;
        });
      }
    } catch (error) {
      console.error("❌ Error fetching DAG logs:", error);
    }
  };

 const generateStepPositions = (count, spacing = 160, startX = 124, baseY = 110) => {
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * spacing,
    y: i % 2 === 0 ? baseY : baseY + 20, // alternate up/down
  }));
};

const CIRCLE_RADIUS = 24; // since your .stepCircle is 48px, radius = 24

const generateWavySegments = (positions) => {
  const segments = [];
  const verticalOffset = 0; // no vertical bias
  const curveAmplitude = 28; // adjust for more or less wave

  for (let i = 0; i < positions.length - 1; i++) {
    const p1 = positions[i];
    const p2 = positions[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    const unitX = dx / length;
    const unitY = dy / length;

    const offsetX = unitX * CIRCLE_RADIUS;
    const offsetY = unitY * CIRCLE_RADIUS;

    // perfectly centered along the circle's edge
    const startX = p1.x + offsetX;
    const startY = p1.y + offsetY + verticalOffset;
    const endX = p2.x - offsetX;
    const endY = p2.y - offsetY + verticalOffset;

    const ctrlX = (startX + endX) / 2;
    const ctrlY = (startY + endY) / 2 + (i % 2 === 0 ? curveAmplitude : -curveAmplitude);

    segments.push({
      d: `M${startX},${startY} Q ${ctrlX},${ctrlY} ${endX},${endY}`,
    });
  }

  return segments;
};






const stepPositions = useMemo(() => generateStepPositions(runningStep), [runningStep]);
const wavyPaths = useMemo(() => generateWavySegments(stepPositions), [stepPositions]);





  
  const stopFetching = () => {
    console.log("✅ Stopping Log and Schema Refresh");
  
    if (logFetchInterval.current) {
      clearInterval(logFetchInterval.current);
      logFetchInterval.current = null;
    }
  
    if (tableFetchInterval.current) {
      clearInterval(tableFetchInterval.current);
      tableFetchInterval.current = null;
    }
  
    setIsFetchingLogs(false);
    setLogs([]);  // ✅ Ensures logs are cleared after stopping
    logsStopped.current = true;
  };
  
  const handleViewPredictedData = () => {
    navigate("/rawdata");
  };

  const startProcessing = async () => {
    setLogs([]); // ✅ Clears previous logs before fetching new ones
    setRunningStep(1);
    setIsFetchingLogs(true);
    setShowStartButton(false);
  
    try {
      const response = await axios.get(`${API_URL}/trigger-airflow-dags/`);
      if (response.status === 200) {
        setLogs(["DAGs triggered..."]);
  
        // ✅ Properly assign interval using `.current`
        logFetchInterval.current = setInterval(fetchDAGLogs, 5000);
      } else {
        throw new Error("Failed to trigger DAGs");
      }
    } catch (error) {
      console.error("Error triggering DAGs:", error);
      setLogs(["Error triggering DAGs"]);
      setIsFetchingLogs(false);
    }
  };
  
  useEffect(() => {
    if (runningStep === 4) {
      console.log("🚀 Running Feature Prediction...");
      runFeaturePrediction();
    }
  }, [runningStep]);
  
  const runFeaturePrediction = () => {

    closeEventSource();
    if (eventSourceRef.current) {
      console.log("🛑 SSE already running, skipping duplicate request...");
      return;
    }
  
    console.log("🚀 Triggering Feature Prediction...");
  
    eventSourceRef.current = new EventSource(`${API_URL}/run-feature-prediction/`);
  
    eventSourceRef.current.onmessage = (event) => {
      const message = event.data.trim();
  
      setLogs((prevLogs) => [...prevLogs, message]);

      if (
        message.includes("Predictions successfully saved to PostgreSQL table") &&
        runningStep < 5
      ) {
        console.log("✅ Prediction complete → moving to Reason Identification");
        setRunningStep(5); // 🔥 Move to Reason Identification step
      }
  
    };
  
    eventSourceRef.current.onerror = (error) => {
      console.error("❌ SSE Error:", error);
  
      // Stop retrying after failure
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    };
    
    // Return cleanup function if needed
    return () => {
      if (eventSourceRef.current) {
        console.log("🛑 Closing SSE connection...");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  };

  const closeEventSource = () => {
    if (eventSourceRef.current) {
      console.log("🛑 Closing previous SSE...");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };
  

  useEffect(() => {
    if (runningStep === 5) {
      console.log("🚀 Running Reason Identification...");
      runReasonIdentification();
    }
  }, [runningStep]);

  const runReasonIdentification = () => {
    closeEventSource();
    eventSourceRef.current = new EventSource(`${API_URL}/run-reason-identification/`);
    eventSourceRef.current.onopen = () => {
      console.log("✅ SSE connection opened");
    };
    eventSourceRef.current.onmessage = (event) => {
      const message = event.data.trim();
      setLogs((prevLogs) => [...prevLogs, message]);
      if (message.includes("Reason identified and merged with the table")) {
        const reasonBucketSource = new EventSource(`${API_URL}/run-reason-bucket/`);
        reasonBucketSource.onmessage = (event) => {
          const bucketMessage = event.data.trim();
          setLogs((prevLogs) => [...prevLogs, `${bucketMessage}`]);
          if (bucketMessage.includes("Data updated with reason bucket and saved back to the database") && runningStep < 6) {
            reasonBucketSource.close();
            setRunningStep(6);
          }
        };
        reasonBucketSource.onerror = (error) => {
          console.error("❌ SSE Error (Reason Bucket):", error);
          reasonBucketSource.close();
        };
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      const state = eventSourceRef.current.readyState;
    
      if (state === EventSource.CLOSED) {
        console.log("ℹ️ SSE connection closed normally (state 2).");
      } else if (state === EventSource.CONNECTING) {
        console.warn("🔄 SSE is reconnecting (state 0)...");
      } else {
        console.error("❌ SSE Error occurred while open (state 1):", error);
      }
    
      // Only close if truly needed
      closeEventSource();
    };
    
  };

  useEffect(() => {
    if (runningStep === 6) {
      console.log("🚀 Running CLV Cleaned...");
      runCLVCleaned1();
    }
  }, [runningStep]);

  const runCLVCleaned1 = () => {
    closeEventSource();
  
    eventSourceRef.current = new EventSource(`${API_URL}/run-clv-cleaned/`);
    eventSourceRef.current.onopen = () => {
      console.log("✅ SSE connection opened for CLV Cleaned");
    };
  
    eventSourceRef.current.onmessage = (event) => {
      const message = event.data.trim();
      setLogs((prevLogs) => [...prevLogs, message]);
  
      if (message.includes("CLV is calculated and inserted in the table")) {
        console.log("🚀 Running CLV Prediction...");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
  
        const clvPredictionSource = new EventSource(`${API_URL}/run-clv-prediction/`);
        clvPredictionSource.onmessage = (event) => {
          const clvMessage = event.data.trim();
          setLogs((prevLogs) => [...prevLogs, clvMessage]);
  
          if (clvMessage.includes("CLV for predicted data is identified and inserted")) {
            console.log("🚀 Running Segmentation...");
            clvPredictionSource.close();
  
            const segmentationSource = new EventSource(`${API_URL}/run-segmentation/`);
            segmentationSource.onmessage = (event) => {
              const segMessage = event.data.trim();
              setLogs((prevLogs) => [...prevLogs, segMessage]);
  
              if (segMessage.includes("Segmented data saved to") && runningStep < 7) {
                segmentationSource.close();
                setRunningStep(7);
                console.log("✅ Final Step Reached");
              }


            };
  
            segmentationSource.onerror = (error) => {
              console.error("❌ SSE Error (Segmentation):", error);
              segmentationSource.close();
            };
          }
        };
  
        clvPredictionSource.onerror = (error) => {
          console.error("❌ SSE Error (CLV Prediction):", error);
          clvPredictionSource.close();
        };
      }
    };
  
    eventSourceRef.current.onerror = (error) => {
      const state = eventSourceRef.current.readyState;
      if (state === EventSource.CLOSED) {
        console.log("ℹ️ SSE connection closed normally (state 2).");
      } else if (state === EventSource.CONNECTING) {
        console.warn("🔄 SSE is reconnecting (state 0)...");
      } else {
        console.error("❌ SSE Error (CLV Cleaned):", error);
      }
      closeEventSource();
    };
  };
  
  useEffect(() => {
  if (runningStep === 7) {
    Swal.fire({
      title: "Your data was created!",
      text: "Click below to view your data in Segmentation.",
      icon: "success",
      confirmButtonText: "Go to Segmentation",
      showCancelButton: true,
      cancelButtonText: "Stay Here",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/segmentation");
      }
    });
  }
}, [runningStep]);
  
  const deleteTables = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "All loaded files in the database will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          console.log("🛑 Stopping all fetch intervals...");
          stopFetching(); // ✅ Stops all fetches before deleting
  
          await axios.post(`${API_URL}/delete-postgres-tables/`, {
            Cleaned: schemas.Cleaned,
            merged: schemas.merged,
          });
  
          console.log("🧹 Clearing UI state...");
          setSchemas({ Stage: [], Cleaned: [], merged: [] });
          setLogs([]);  // ✅ Clears logs immediately
          setRunningStep(0);  // ✅ Resets step back to 0
          setShowStartButton(true);
  
          console.log("✅ Tables deleted & UI reset!");
  
          Swal.fire("Deleted!", "The tables have been deleted.", "success");
        } catch (error) {
          console.error("❌ Error deleting tables:", error);
          setLogs(["Error deleting tables."]);
          Swal.fire("Error!", "Failed to delete tables.", "error");
        }
      }
    });
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Data Sets</h3>

        {renderSchemaCard("Stage", schemas.Stage)}
{schemas.Cleaned.length > 0 && renderSchemaCard("Cleaned", schemas.Cleaned)}
{schemas.merged.length > 0 && renderSchemaCard("Merged", schemas.merged)}


         {showStartButton && (
          <button className={styles.startBtn} onClick={startProcessing}>
            <FaPlay /> Start Processing
          </button>
        )}

        <button className={styles.deleteBtn} onClick={deleteTables}>
          <FaTrash /> Change Data
        </button>

        {runningStep === 7 && (
          <button className={styles.viewBtn} onClick={handleViewPredictedData}>
            <BsBoxes/> View Predicted Data
          </button>
         )} 

      </div>

      <div className={styles.mainSection}>
        <h2 className={styles.header}>Data Processing Pipeline</h2>

        <div className={styles.pipelineWrapper}>
{runningStep > 1 && (
  <svg className={styles.wavyConnectorSVG}>
    {wavyPaths.slice(0, runningStep - 1).map((seg, i) => (
      <path
        key={i}
        d={seg.d}
        stroke="#bbb"
        strokeDasharray="8,6"
        fill="none"
        strokeWidth="2"
      />
    ))}
  </svg>
)}


<div className={styles.stepsContainer}>
  {[
  { label: "Data Cleansing", icon: <BsTools /> },
  { label: "Data Merging", icon: <BsCopy /> },
  { label: "Moved to Merged DB", icon: <BsDatabaseFillGear /> },
  { label: "Future Prediction", icon: <BsCalendarWeek /> },
  { label: "Reason Identification", icon: <BsFileText /> },
  { label: "Customer Segmentation", icon: <BsDiagram3 /> },
  { label: "Prediction Completed", icon: <BsBox /> },
]
.slice(0, runningStep)
.map((step, index) => {
  const { x, y } = stepPositions[index];
  return (
    <div
      key={index}
      className={`${styles.stepGroup} ${runningStep === index + 1 ? styles.blinking : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
        position: "absolute",
      }}
    >
      <div className={styles.stepLabel}>{step.label}</div>
      <div className={styles.verticalLine}></div>
      <div className={styles.stepCircle}>{step.icon}</div>
    </div>
  );
})}


</div>

</div>







        <div className={styles.logBox}>
          <FaDownload className={styles.downloadIcon} onClick={() => downloadLogs(logs)} />
          <div className={styles.logContent}>
            {logs.map((log, index) => <p key={index}>{log}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

const downloadLogs = (logs) => {
  const element = document.createElement("a");
  const file = new Blob([logs.join("\n")], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = "process_log.txt";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
  
export default DataPreprocessing;
