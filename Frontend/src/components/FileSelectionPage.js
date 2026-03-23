import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function FileSelectionPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [dbCredentials, setDbCredentials] = useState({
        host: "",
        port: "",
        username: "",
        password: "",
        database: "",
    });
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [dataset, setDataset] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [dbMode, setDbMode] = useState(false); // Switch between file and database mode
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
    const [isLoading, setIsLoading] = useState(false); // Loading state for buttons

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            // If no file is selected (cancel button clicked), retain the existing dataset
            alert("No file selected. Retaining the previously loaded dataset.");
            return;
        }

        setFile(selectedFile);
        if (dbMode) {
            alert("Switch to file mode before uploading a file.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            setIsLoading(true);

            const response = await axios.post("http://localhost:5000/upload-file", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setDataset(response.data.dataset);
            setColumns(response.data.columns);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload and parse the file. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDbModeToggle = () => {
        setDbMode(!dbMode);
        setFile(null);
        setDataset([]);
        setColumns([]);
        setSelectedTable("");
    };

    const handleDbCredentialsChange = (e) => {
        setDbCredentials({
            ...dbCredentials,
            [e.target.name]: e.target.value,
        });
    };

    const handleDbConnect = async () => {
        const { host, port, username, password, database } = dbCredentials;
        if (!host || !port || !username || !password || !database) {
            alert("All database fields are required.");
            return;
        }
        try {
            setIsLoading(true);
            const response = await axios.post("http://localhost:5000/connect-db", dbCredentials);
            setTables(response.data.tables);
            setIsDbConnected(true);
        } catch (error) {
            console.error("Error connecting to database:", error);
            alert(error.response?.data?.error || "Failed to connect to the database. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTableChange = (e) => {
        setSelectedTable(e.target.value);
        setDataset([]); // Clear dataset on table change
    };

    const handleViewData = async () => {
        if (!selectedTable) {
          alert("Please select a table first.");
          return;
        }
      
        try {
          setIsLoading(true);
          console.log("Fetching data for table:", selectedTable);
      
          const response = await axios.post("http://localhost:5000/table-data", {
            table: selectedTable,
            host: dbCredentials.host,
            port: dbCredentials.port,
            username: dbCredentials.username,
            password: dbCredentials.password,
            database: dbCredentials.database,
          });
      
          console.log("API Response:", response.data);
          setDataset(response.data.dataset);
          setColumns(response.data.columns);
        } catch (error) {
          console.error("Error fetching table data:", error.response || error);
          alert(error.response?.data?.error || "Failed to fetch data for the selected table.");
        } finally {
          setIsLoading(false);
        }
      };    

    const handleUploadForPrediction = () => {
        if (dataset.length === 0) {
            alert("No dataset available. Please view the data first.");
            return;
        }
        navigate("/upload-for-prediction", { state: { dataset, columns } });
    };

    const handleTrain = () => {
        if (selectedColumns.length === 0) {
            alert("Please select at least one column to train the model.");
            return;
        }
        navigate("/train-dataset", { state: { selectedColumns, dataset } });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>File Selection Page</h1>

            <div>
                <button onClick={handleDbModeToggle} disabled={isLoading}>
                    {dbMode ? "Switch to File Mode" : "Switch to Database Mode"}
                </button>
            </div>

            {!dbMode && (
                <div>
                    <h3>Upload a File</h3>
                    <input type="file" onChange={handleFileChange} disabled={dbMode || isLoading} />
                </div>
            )}

            {dbMode && (
                <div>
                    <h3>Connect to PostgreSQL Database</h3>
                    <form>
                        <input
                            type="text"
                            name="host"
                            placeholder="Host"
                            value={dbCredentials.host}
                            onChange={handleDbCredentialsChange}
                        />
                        <input
                            type="text"
                            name="port"
                            placeholder="Port"
                            value={dbCredentials.port}
                            onChange={handleDbCredentialsChange}
                        />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={dbCredentials.username}
                            onChange={handleDbCredentialsChange}
                        />
                        <div style={{ position: "relative", display: "inline-block" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={dbCredentials.password}
                                onChange={handleDbCredentialsChange}
                                style={{ paddingRight: "30px" }}
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "5px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    cursor: "pointer",
                                    color: "#007bff",
                                }}
                            >
                                {showPassword ? "👁" : "👁‍🗨"}
                            </span>
                        </div>
                        <input
                            type="text"
                            name="database"
                            placeholder="Database Name"
                            value={dbCredentials.database}
                            onChange={handleDbCredentialsChange}
                        />
                        <button type="button" onClick={handleDbConnect} disabled={isLoading}>
                            {isLoading ? "Connecting..." : "Connect to Database"}
                        </button>
                    </form>
                </div>
            )}

            {isDbConnected && dbMode && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Select a Table from the Database</h3>
                    <select value={selectedTable} onChange={handleTableChange}>
                        <option value="">-- Select a Table --</option>
                        {tables.map((table) => (
                            <option key={table} value={table}>
                                {table}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleViewData} style={{ marginLeft: "10px" }} disabled={isLoading}>
                        {isLoading ? "Loading..." : "View Data"}
                    </button>
                </div>
            )}

            {dataset.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Dataset Preview</h3>
                    <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "scroll" }}>
                        <table border="1" cellPadding="5">
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dataset.slice(0, 50).map((row, index) => (
                                    <tr key={index}>
                                        {columns.map((col) => (
                                            <td key={col}>{row[col]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: "10px" }}>
                        <button onClick={handleUploadForPrediction} disabled={isLoading}>
                            Upload for Prediction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileSelectionPage;
