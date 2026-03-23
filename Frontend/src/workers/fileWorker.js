self.onmessage = (event) => {
    try {
        const data = new Uint8Array(event.data);
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");

        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        self.postMessage({ success: true, sheetData });
    } catch (error) {
        self.postMessage({ success: false, error: "File processing failed!" });
    }
};
