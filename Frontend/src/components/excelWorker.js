// excelWorker.js (Web Worker for background file processing)
import * as XLSX from "xlsx";

self.onmessage = (event) => {
    const { fileData } = event.data;

    try {
        const workbook = XLSX.read(fileData, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        self.postMessage({ success: true, sheetData });
    } catch (error) {
        self.postMessage({ success: false, error: "Failed to parse Excel file." });
    }
};
