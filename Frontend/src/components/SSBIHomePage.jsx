// src/pages/SSBIHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSSBITour } from '../utils/ssbiTourShepherd';
import styles from './SSBI.module.css';



const SSBILandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState({});
  const [currentTemplate, setCurrentTemplate] = useState(0);



  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleStartTour = () => {
    navigate('/dashboard');
    setTimeout(() => {
      startSSBITour();
    }, 500);
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const handleUseTemplate = (templateId) => {
    navigate('/dashboard', { state: { templateId } });
  };

  // Handler for viewing templates - stays on same page, scrolls to templates
  const handleViewTemplates = () => {
    // navigate('/ssbihome#templates');
    navigate('/create-dashboard');
  };

  // Handler for going to saved reports - goes to ssbihome with flag to load first report
  // const handleGoToSavedReports = () => {
  //   navigate('/ssbihome', { state: { loadFirstReport: true } });
  // };
  const handleGoToSavedReports = () => {
    // ✅ FIX: Add timestamp to prevent duplicate processing
    navigate('/ssbihome', { 
      state: { 
        loadFirstReport: true,
        timestamp: Date.now() // Add unique timestamp
      } 
    });
  };
  
  const templates = [
    {
      id: 1,
      title: "High-level KPIs",
      description: "Key metrics overview with comprehensive dashboard layout",
      features: ["5 KPI Cards", "2 Charts", "1 Data Table"],
      layout: "kpi-focused"
    },
    {
      id: 2,
      title: "Sales Performance",
      description: "Comprehensive sales analysis with detailed breakdowns",
      features: ["4 KPI Cards", "2 Charts", "1 Data Table"],
      layout: "sales-analysis"
    },
    {
      id: 3,
      title: "Operations Dashboard",
      description: "Day-to-day operations and performance metrics",
      features: ["3 KPI Cards", "4 Charts", "2 Data Tables"],
      layout: "operations"
    },
    {
      id: 4,
      title: "Multi-Chart Analysis",
      description: "Detailed analysis with multiple chart types",
      features: ["3 KPI Cards", "5 Charts", "2 Data Tables"],
      layout: "multi-chart"
    }
  ];

  const features = [
    {
      icon: "📊",
      title: "Interactive Dashboards",
      description: "Create stunning, interactive dashboards with drag-and-drop functionality"
    },
    {
      icon: "🎯",
      title: "Smart KPI Tracking",
      description: "Monitor key performance indicators with real-time updates and alerts"
    },
    {
      icon: "📈",
      title: "Advanced Analytics",
      description: "Powerful analytics engine with multiple chart types and visualization options"
    },
    {
      icon: "🔧",
      title: "Custom Templates",
      description: "Choose from pre-designed templates or build your own custom dashboard"
    },
    {
      icon: "⚡",
      title: "Real-time Data",
      description: "Connect to live data sources for instant insights and decision making"
    },
    {
      icon: "🎨",
      title: "Beautiful Design",
      description: "Modern, intuitive interface designed for optimal user experience"
    }
  ];

  return (
    // <div className={styles.landingPage} style={{overflowY: "auto"}}>
    <div className={styles.landingPage}>
      <div className={`${styles.landingPage} ${styles.ssbiLandingPageWrapper}`}>
      <section className={styles.hero} id="hero">
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={`${styles.heroTitle} ${isVisible.hero ? styles.fadeInUp : styles.hidden}`} style={{ marginTop: "-20px" }}>
              <span style={{
      background: "linear-gradient(to right, rgb(6, 182, 212), rgb(2, 132, 199), rgb(6, 182, 212))",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
      paddingBottom : "10px",
    }}>Smart Insights</span>
              <br />
              <span style={{
      background: "linear-gradient(to right, rgb(6, 182, 212), rgb(2, 132, 199), rgb(6, 182, 212))",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
    }} >Workspace</span>
            </h1>
            
            <p className={styles.heroSubtitle}>
              Transform your data into actionable insights with our powerful, intuitive dashboard platform. 
              Create stunning visualizations in minutes, not hours.
            </p>
            
            <div className={styles.heroButtons}>
              {/* This button stays on current page and scrolls to templates */}
              <button 
                className={styles.secondaryButton}
                onClick={handleViewTemplates}
              >
                View Templates
              </button>
              
              {/* This button goes to dashboard page and loads first report */}
              <button 
                className={styles.primaryButton}
                onClick={handleGoToSavedReports}
              >
                Saved Reports →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Templates section on the same page */}
      {/* <section id="templates" className={styles.templates}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Dashboard Templates</h2>
            <p>Choose from our professionally designed templates to get started quickly</p>
          </div>
          
          <div className={styles.templatesGrid}>
            {templates.map((template, index) => (
              <div 
                key={template.id}
                className={styles.templateCard}
                onClick={() => handleUseTemplate(template.id)}
              >
                <h3>{template.title}</h3>
                <p>{template.description}</p>
                
                <div className={styles.templateFeatures}>
                  {template.features.map((feature, idx) => (
                    <div key={idx} className={styles.templateFeature}>
                      <div className={styles.featureDot}></div>
                      {feature}
                    </div>
                  ))}
                </div>
                
                <button className={styles.useTemplateButton}>
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      </div>
    </div>
  );
};

export default SSBILandingPage;