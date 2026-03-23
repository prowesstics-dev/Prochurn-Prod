import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FaSignOutAlt, FaCloudDownloadAlt,FaCalendarAlt, FaUserCircle, FaEye,FaInfoCircle,FaTimes  } from "react-icons/fa"; 
import styles from "./DummyUploadPage.module.css"; // ✅ Ensure styles are applied
import { color } from "d3";
import DatePicker from "react-datepicker"; // Import the DatePicker component
import "react-datepicker/dist/react-datepicker.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const MAX_FILE_SIZE_MB = 1024;
const START_YEAR = 1980;
const CURRENT_YEAR = new Date().getFullYear();

function DummyUploadPage() {
    const navigate = useNavigate();
    const [uploadedFiles, setUploadedFiles] = useState({ 
        base: null, 
        pr: null, 
        claims: null, 
        feedback: null, 
        additional: []
    });
    const [username, setUsername] = useState("Guest");
    const [fileData, setFileData] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [years, setYears] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        // Populate the years dropdown dynamically
        const yearOptions = [];
        for (let i = CURRENT_YEAR; i >= START_YEAR; i--) {
            yearOptions.push(i);
        }
        setYears(yearOptions);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.warn("No token found! Redirecting to login...");
            navigate("/login");
            return;
        }

        fetch("http://127.0.0.1:8000/api/user-details/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch user details");
            return response.json();
        })
        .then(data => {
            if (data.username) setUsername(data.username);
        })
        .catch(error => {
            console.error("Error fetching user details:", error);
            Swal.fire("Error", "Failed to load user details. Please refresh.", "error");
        });
    }, [navigate]);

    const TEMPLATE_FILES = {
        base: "/Excel_Templates/Base Template.xlsx".replace(/\\/g, "/"),
        pr: "/Excel_Templates/PR Template.xlsx".replace(/\\/g, "/"),
        claims: "/Excel_Templates/Claim Template.xlsx".replace(/\\/g, "/"),
    };
    
    const [templateColumns, setTemplateColumns] = useState({});
    const [templatesLoaded, setTemplatesLoaded] = useState(false);
    
    // ✅ Normalize headers: remove extra spaces, lowercase, and replace multiple spaces
    const normalizeHeaders = (headers) => {
        return headers.map(header => 
            header?.trim()
                .toLowerCase()
                .replace(/\s+/g, "_")  // ✅ Replace spaces with underscores
                .replace(/[^a-z0-9_\d]/g, "") // ✅ Remove special characters
        );
    };
    
    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (date) {
            const year = date.getFullYear();
            setSelectedYear(year);
        }
        setShowCalendar(false); // Hide the calendar after selecting a date
    };

    useEffect(() => {
        // Populate the years dropdown dynamically
        const yearOptions = [];
        for (let i = CURRENT_YEAR; i >= START_YEAR; i--) {
            yearOptions.push(i);
        }
        setYears(yearOptions);
    }, []);

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar); // Toggle calendar visibility
    };

    // ✅ Load template headers before validation
    const loadTemplateColumns = async () => {
        if (templatesLoaded) return; // Prevent multiple loads
    
        let newTemplateColumns = {};
    
        for (const [category, filePath] of Object.entries(TEMPLATE_FILES)) {
            try {
                const response = await fetch(filePath);
                const blob = await response.blob();
                const reader = new FileReader();
    
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
    
                    newTemplateColumns[category] = normalizeHeaders(headers);
                    setTemplateColumns(prev => ({ ...prev, ...newTemplateColumns }));
                };
    
                reader.readAsArrayBuffer(blob);
            } catch {
                Swal.fire("Error", `Failed to load template: ${filePath}`, "error");
            }
        }
        
        setTemplatesLoaded(true);
    };
    
    // ✅ File Upload Handler with Validation
    const handleFileUpload = async (event, category) => {
    const files = event.target.files;
    if (!files.length) return;

    const file = files[0];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["xlsx", "csv", "xlsb"];

    if (category === "additional") {
        setUploadedFiles(prev => ({
            ...prev,
            additional: [...prev.additional, ...Array.from(files)]
        }));
        return;
    }

    if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire("Error", "Only .xlsx, .csv, and .xlsb files are allowed!", "error");
        return;
    }

    if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
        Swal.fire("File Too Large", `Max file size is ${MAX_FILE_SIZE_MB}MB.`, "warning");
        return;
    }
    
    const renamedFile = new File([file], `${selectedYear}_${category}.${fileExtension}`, { type: file.type });
        setUploadedFiles(prev => ({ ...prev, [category]: renamedFile }));

    const fileHeaders = await getExcelHeaders(file);
    if (!fileHeaders.length) {
        Swal.fire("Error", "Uploaded file contains no headers!", "error");
        return;
    }

    // ✅ Validate against expected template headers
    const requiredHeaders = templateColumns[category] || [];
    const missingColumns = requiredHeaders.filter(col => !fileHeaders.includes(col));

    if (missingColumns.length > 0) {
        Swal.fire("Error", `Missing required columns: ${missingColumns.join(", ")}`, "error");
        return;
    }

    Swal.fire({
        title: "Uploading File...",
        text: "Please wait while we upload your file.",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const normalizedCategory = category.replace(/\s+/g, "_").toLowerCase();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", normalizedCategory);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/upload-excel/", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            setUploadedFiles(prev => ({ ...prev, [category]: file }));
            Swal.fire("Upload Successful!", `${file.name} uploaded successfully.`, "success");
        } else {
            throw new Error(data.message || "Upload failed!");
        }
    } catch (error) {
        Swal.fire("Error", error.message, "error");
    }
};

    
    
    const getExcelHeaders = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    let headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
                    
                    headers = normalizeHeaders(headers); // ✅ Apply normalization
                    resolve(headers);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };
    
    
    
    
    // ✅ Load template columns on first render
    useEffect(() => {
        loadTemplateColumns();
    }, []);
    
    
    
    const handleDownloadTemplates = () => {
        Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: start; gap: 8px; margin-top:-55px;border-radius:35px;">
                    <i id="info-icon" class="fas fa-info-circle" style="color: #007BFF; font-size: 18px; cursor: pointer;">
                        
                    </i>
                    <h3 style="font-weight: bold; margin: 0;">Download Templates</h3>
                </div>
            `,
            html: `
                <div id="info-message" style="display: none; 
                    background: #f8f9fa; 
                    padding: 20px; /* ✅ Reduced padding */
                    border-radius: 10px;
                    top:40%; 
                    border-left: 4px solid #007BFF; 
                    text-align: left; 
                    margin-bottom: 49px; /* ✅ Reduced margin */
                    font-size: 15px; /* ✅ Slightly smaller text */
                    ">
                    <span style="color: #d9534f; font-weight: bold;">
                     Please use the below template to upload the data and if you have any additional data related to that file please make sure it is present after the mandatory columns.
                    </span>
                </div>
    
                <ul style="list-style:none; text-align:left; padding: 12px 16px; /* ✅ Less padding */
                    background: #ffffff; 
                    border-radius: 6px; /* ✅ Slightly smaller border radius */
                    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.1); /* ✅ Reduced shadow */
                    margin-top: -10px; /* ✅ Less space between sections */
                    ">
                    <li style="margin-bottom: 6px;"> 
                        📄 <a href="/Excel_Templates/Base Template.xlsx" download style="font-weight: bold;">Customer Base Template</a>
                    </li>
                    <li style="margin-bottom: 6px;">
                        📄 <a href="/Excel_Templates/PR Template.xlsx" download style="font-weight: bold;">Policy Renewal Template</a>
                    </li>
                    <li>
                        📄 <a href="/Excel_Templates/Claim Template.xlsx" download style="font-weight: bold;">Claim History Template</a>
                    </li>
                </ul>
    
                <hr style="margin: 10px 0;">
    
                
            `,
            confirmButtonText: "Close",
            didOpen: () => {
                let infoMessage = document.getElementById("info-message");
                let infoIcon = document.getElementById("info-icon");
    
                infoIcon.addEventListener("click", () => {
                    infoMessage.style.display = infoMessage.style.display === "none" ? "block" : "none";
                });
            }
        });
    };
    
    
    const handleFeedbackInfo = () => {
        Swal.fire({
            title: "Customer Feedback Information",
            text: "For the feedback, we haven’t provided any templates. You can upload the relevant data if you have.",
            icon: "info",
            confirmButtonText: "OK"
        });
    };
    
    const handleRemoveFile = async (category) => {
        const file = uploadedFiles[category];
        if (!file) return;
    
        console.log("Attempting to delete:", file.name);  // ✅ Debugging
    
        Swal.fire({
            title: "Are you sure?",
            text: `Do you want to delete ${file.name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // ✅ Send DELETE request with query params instead of body
                    const response = await fetch(`http://127.0.0.1:8000/api/delete-uploaded-file/?category=${category}&file_name=${encodeURIComponent(file.name)}`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                    });
    
                    const data = await response.json();
                    if (data.success) {
                        setUploadedFiles(prev => ({ ...prev, [category]: null }));
    
                        // Reset file input field
                        const fileInput = document.getElementById(`file-input-${category}`);
                        if (fileInput) {
                            fileInput.value = "";
                        }
    
                        Swal.fire("Deleted!", `${file.name} has been deleted.`, "success");
                    } else {
                        console.error("Error deleting file:", data.message);  // ✅ Debugging
                        Swal.fire("Error", data.message, "error");
                    }
                } catch (error) {
                    console.error("Delete request failed:", error);  // ✅ Debugging
                    Swal.fire("Error", "Failed to delete the file.", "error");
                }
            }
        });
    };
    
    
    

    const handleRemoveAdditionalFile = (index) => {
        setUploadedFiles(prev => {
            const updatedFiles = prev.additional.filter((_, i) => i !== index);
    
            // Reset file input field when all files are removed
            const fileInput = document.getElementById("file-input-additional");
            if (fileInput && updatedFiles.length === 0) {
                fileInput.value = "";
            }
    
            return { ...prev, additional: updatedFiles };
        });
    };
    
    
    // const handleViewData = async (category) => {
    //     try {
    //         const normalizedCategory = category.replace(/\s+/g, "_").toLowerCase();

    //         console.log("Fetching data for category:", normalizedCategory);
    //         const response = await fetch(`http://127.0.0.1:8000/api/view-uploaded-data/?category=${normalizedCategory}`);
    //         const data = await response.json();

    //         if (!data.success) {
    //             Swal.fire("Error", data.message, "error");
    //             return;
    //         }
    //         console.log("Received Data:", data);
    //         const rows = data.data;
    //         const columnNames = Object.keys(rows[0]);
    //         const rowCount = rows.length;
    //         const columnCount = columnNames.length;

    //         let tableHtml = `
    //             <div style="display: flex; justify-content: space-between; align-items: center;">
    //                 <h3 style="margin: 0;">${category.toUpperCase()} Data Preview</h3>
    //                 <button id="closePreview" style="background: none; border: none; font-size: 15px; cursor: pointer; font-weight: bold; color: #FF0000;">❌</button>
    //             </div>
    //             <div style="margin-bottom: 10px; font-size: 14px; font-weight: bold; text-align: center;">
    //                 <span style="color: #007BFF;">Total Rows:</span> ${rowCount} | 
    //                 <span style="color: #007BFF;">Total Columns:</span> ${columnCount}
    //             </div>
    //             <div style="max-height: 500px; overflow: auto; border: 1px solid #ddd; padding: 10px;">
    //                 <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
    //                     <thead>
    //                         <tr style="background-color: #007BFF; color: white;">
    //                             ${columnNames.map(col => `<th style="padding: 8px; border: 1px solid #ddd;">${col}</th>`).join("")}
    //                         </tr>
    //                     </thead>
    //                     <tbody>
    //                         ${rows.map(row => `<tr>${columnNames.map(col => `<td style="padding: 8px; border: 1px solid #ddd;">${row[col] || ""}</td>`).join("")}</tr>`).join("")}
    //                     </tbody>
    //                 </table>
    //             </div>
    //         `;

    //         Swal.fire({
    //             html: tableHtml,
    //             width: "90%",
    //             showConfirmButton: false,
    //             didOpen: () => {
    //                 document.getElementById("closePreview").addEventListener("click", () => Swal.close());
    //             },
    //         });

    //     } catch (error) {
    //         Swal.fire("Error", "Failed to load data preview.", "error");
    //     }
    // };

    const handleLogout = () => {
        Swal.fire({
            title: "Logout?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                navigate("/login");
            }
        });
    };
    const tooltips = {
        base: "Contains the whole purchase data",
        pr: "Contains the Policy renewed, new policies, and rollover details",
        claims: "Contains claim-related details",
        feedback: "Customer satisfaction data & churn reasons",
        additional: "Any extra business-related data for better model accuracy",
    };

    const handleProcessData = async () => {
        if (!uploadedFiles.base || !uploadedFiles.pr || !uploadedFiles.claims) {
            Swal.fire("Error", "Please upload all required files.", "error");
            return;
        }
    
        Swal.fire({
            title: "Processing Data...",
            text: "Please wait while we process the uploaded files.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    
        try {
            const formData = new FormData();
            formData.append("year", selectedYear);
            formData.append("base", uploadedFiles.base);
            formData.append("pr", uploadedFiles.pr);
            formData.append("claims", uploadedFiles.claims);
            if (uploadedFiles.feedback) {
                formData.append("feedback", uploadedFiles.feedback);
            }
            uploadedFiles.additional.forEach(file => {
                formData.append("additional", file);
            });

            const response = await fetch("http://127.0.0.1:8000/api/process-uploaded-data/", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire("Processing Complete!", "Data stored successfully!", "success")
                    .then(() => navigate("/datapreprocessing"));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire("Error", error.message, "error");
        }
    };
    
    const isAllRequiredUploaded = uploadedFiles.base && uploadedFiles.pr && uploadedFiles.claims;

    return (
        <div className={styles.uploadpage}>
            <div className= {styles.headercontainer}>
                <div className= {styles.titlecontainer}>
                    <h1 className= {styles.welcometext}>
                        Welcome, <span className= {styles.highlight}>{username}</span>!
                    </h1>
                    <p className= {styles.subtext}>Please download the template and upload data.</p>
                </div>
                
                <div className= {styles.profilecontainer}>
                    <div className= {styles.profileicon} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <FaUserCircle size={30} title={username} />
                    </div>
                    {showProfileMenu && (
                        <div className= {styles.profilemenu}>
                            <p className= {styles.profilename}>{username}</p>
                            <hr />
                            <button onClick={handleLogout} className= {styles.logoutoption}>
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
    
            <div className= {styles.controlscontainer}>
                <button onClick={handleDownloadTemplates} className= {styles.downloadbtn}>
                    <FaCloudDownloadAlt /> Download Template
                </button>
    
                <div className={styles.yearselector}>
                    <label>Select Year: </label>
                    <div className={styles.datepickercontainer}>
                        <button onClick={toggleCalendar} className={styles.calendariconbtn}>
                            <FaCalendarAlt size={20} />
                        </button>
                        {showCalendar && (
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                showYearPicker
                                dateFormat="yyyy"
                                className={styles.datepicker}
                                popperPlacement="bottom"
                                inline
                            />
                        )}
                    </div>
                    <span className={styles.selectedYear}>{selectedYear}</span>
                </div>
            
            </div>
    
            <div className= {styles.fileuploadcontainer}>
                {[
                    { key: "base", label: "Customer Base Data", required: true },
                    { key: "pr", label: "Policy Renewal Data", required: true },
                    { key: "claims", label: "Claims History Data", required: true },
                    { key: "feedback", label: "Customer Feedback Data", required: false, info: true },
                    { key: "additional", label: "Additional Data", required: false }
                ].map(({ key, label, required, info }) => (
                    <div className= {styles.filecard} key={key}>
                        <div className= {styles.fileheader}>
                            <div className= {styles.filetitle}>
                                {required && <span className= {styles.required}>*</span>}
                                <h4 className= {styles.filelabel}>{label}</h4>
                                {info && (
                                    <FaInfoCircle 
                                        onClick={handleFeedbackInfo} 
                                        className= {styles.infoicon}
                                        title="More information about Customer Feedback"
                                    />
                                )}
                            </div>
                           
                        </div>
    
                        <div className= {styles.fileinputwrapper}>
                            <input 
                                type="file" 
                                accept=".xlsx,.csv,.xlsb" 
                                id={`file-input-${key}`}
                                onChange={(e) => handleFileUpload(e, key)} 
                                className= {styles.fileinput} 
                                multiple={key === "additional"}  
                            />
                            <span className={styles.tooltiptext}>{tooltips[key]}</span>
                            {uploadedFiles[key] && key !== "additional" && (
                                <div className= {styles.fileactions}>
                                    <button onClick={() => handleViewData(key)} className= {styles.actionbtnviewbtn} title="View Data">
                                        <FaEye />
                                    </button>
                                    <button onClick={() => handleRemoveFile(key)} className= {styles.actionbtnremovebtn} title="Remove File">
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                        </div>
    
                        {key === "additional" && uploadedFiles.additional.length > 0 && (
                            <div className= {styles.additionalfilescontainer}>
                                <p className= {styles.filecount}>
                                    {uploadedFiles.additional.length} {uploadedFiles.additional.length === 1 ? "file" : "files"}
                                </p>
                                <div className= {styles.additionalfileslist}>
                                    {uploadedFiles.additional.map((file, index) => (
                                        <div key={index} className= {styles.filechip}>
                                            <span className= {styles.filename}>{file.name}</span>
                                            <div className= {styles.filechipactions}>
                                                <button onClick={() => handleViewData(file)} className= {styles.actionbtnviewbtn} title="View Data">
                                                    <FaEye />
                                                </button>
                                                <button onClick={() => handleRemoveAdditionalFile(index)} className= {styles.actionbtnremovebtn} title="Remove File">
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
    
            {isAllRequiredUploaded && (
                <button onClick={handleProcessData} className= {styles.processbtn}>
                    Process Data
                </button>
            )}
        </div>
    );
}

export default DummyUploadPage;