import React, { useState, useEffect } from "react";
// import SidebarReport from "./SidebarReport"; 
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
import styles from "./ReportPage.module.css";

const PredictiveReport = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [reportId, setReportId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ Fetch Power BI Token and Report ID
    useEffect(() => {
        const fetchAccessToken = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("exports-college-pointer-limit.trycloudflare.com/api/get-powerbi-token/");
                
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const data = await response.json();
                if (!data.accessToken || !data.reportId) {
                    throw new Error("Invalid API response: Missing accessToken or reportId.");
                }

                setAccessToken(data.accessToken);
                setReportId(data.reportId);
            } catch (error) {
                console.error("❌ Power BI Token Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccessToken();
    }, []);

    return (
        <div className={styles.dashboard-container}>
            {/* <SidebarReport /> */}
            <div className={styles.main-content}>
                <h1>Predictive Report</h1>
                <p>Interactive Power BI Predictive Dashboard.</p>

                {/* ✅ Show Loading Indicator */}
                {isLoading && <p>🔄 Loading Power BI Report...</p>}

                {/* ✅ Show Report if Token & ID Exist */}
                {accessToken && reportId && (
                    <PowerBIEmbed
                        embedConfig={{
                            type: "report",
                            id: reportId,  // ✅ Use dynamic report ID
                            embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}`,
                            accessToken: accessToken,
                            tokenType: models.TokenType.Embed,
                            settings: {
                                panes: {
                                    filters: { expanded: false, visible: false },
                                    pageNavigation: { visible: true },
                                },
                            },
                        }}
                        cssClassName="powerbi-container"
                    />
                )}

                {/* ✅ Show Error if Token is Missing */}
                {!isLoading && (!accessToken || !reportId) && (
                    <p style={{ color: "red" }}>⚠ Unable to load Power BI Report. Please check the API response.</p>
                )}
            </div>
        </div>
    );
};

export default PredictiveReport;
