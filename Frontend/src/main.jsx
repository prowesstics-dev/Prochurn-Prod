import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext"; // Adjust path as needed
import App from "./App";
import "./index.css";
import { SegmentationConfigProvider } from "./context/SegmentationConfigContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element not found! Ensure your index.html has a <div id='root'></div>");
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <SegmentationConfigProvider>
          <App />
          </SegmentationConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
