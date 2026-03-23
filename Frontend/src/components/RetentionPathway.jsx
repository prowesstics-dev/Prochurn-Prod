  import React, { useState, useEffect, useRef } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { 
      Database, Brush, Wand2, Cog, Eye, Rocket, 
      Monitor, Download, BarChart3
  } from "lucide-react";

  const RetentionPathway = () => {
      const [hoveredItem, setHoveredItem] = useState(null);
      const [iconPositions, setIconPositions] = useState({});
      const iconRefs = useRef({});
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const username = storedUser?.username || "Guest";
      const email = storedUser?.email || "";

      const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
      


      const processItems = [
          {
              icon: Database,
              title: 'Data Collection',
              description: 'Gathering data from various sources such as databases, API and web scrapping',
              points: ['Customer Base', 'Premium Renewal', 'Claim History', 'Customer Feedback'],
              color: '#3B82F6',
              gradient: 'linear-gradient(135deg, #3B82F6, #1E40AF)'
          },
          {
              icon: Brush,
              title: 'Data Cleansing' ,
              description: 'Removing inaccuracies and inconsistencies in the data',
              points: ['Removing Duplicates', 'Handling Missing Values','Fix Mismatches'],
              color: '#06B6D4',
              gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)'
          },

          {
              icon: BarChart3,
              title: 'Exploratory Data Analysis',
              description: 'Analyzing data to discover patterns and insights',
              points: ['Missing Value Detection',
    'Outlier Identification',
    'Class Imbalance Check',],
              color: '#6366F1',
              gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)'
          },

          {
              icon: Wand2,
              title: 'Feature Engineering',
              description: 'Transforming raw data into features that improve model performance',
              points: ['Tenure Calculation', 'Purchase Frequency', 'CLV'],
              color: '#8B5CF6',
              gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
          },
          {
              icon: Cog,
              title: 'Model Building',
              description: 'Creating predictive models using different algorithms',
              points: ['Machine Learning Algorithms', 'Deep Learning Algorithms'],
              color: '#10B981',
              gradient: 'linear-gradient(135deg, #10B981, #059669)'
          },
          {
              icon: Eye,
              title: 'Model Evaluation',
              description: 'Assessing model performance using metrics',
              points: ['Accuracy', 'ROC curve', 'Log Loss','Classification Report'],
              color: '#F59E0B',
              gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
          },
          {
              icon: Rocket,
              title: 'Deployment',
              description: 'Implement the model in production',
              points: ['Cloud Infrastructure', 'API Integration', 'Real-time Processing'],
              color: '#EF4444',
              gradient: 'linear-gradient(135deg, #EF4444, #DC2626)'
          },
          {
              icon: Monitor,
              title: 'Monitoring',
              description: 'Ensuring the model continues performing well over time',
              points: ['Performance Metrics', 'Alert Systems', 'Model Drift Detection'],
              color: '#6366F1',
              gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)'
          },
          {
              icon: Download,
              title: 'Data Access',
              description: 'Seamless data retrieval system',
              points: ['Yearly Predicted Data', 'Monthly Predicted Data'],
              color: '#14B8A6',
              gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)'
          },
          {
              icon: BarChart3,
              title: 'Dashboards',
              description: 'Interactive visualization & insights',
              points: ['Real-time Analytics', 'Custom Reports', 'KPI Tracking'],
              color: '#3B82F6',
              gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)'
          }
      ];

      useEffect(() => {
          const updateIconPositions = () => {
              const positions = {};
              Object.entries(iconRefs.current).forEach(([index, ref]) => {
                  if (ref) {
                      const rect = ref.getBoundingClientRect();
                      const scrollX = window.scrollX || document.documentElement.scrollLeft;
                      const scrollY = window.scrollY || document.documentElement.scrollTop;
                      positions[index] = {
                          x: rect.left + rect.width / 2 + scrollX,
                          y: rect.bottom + 20 + scrollY
                      };
                  }
              });
              setIconPositions(positions);
          };

          // Initial calculation with a slight delay to ensure DOM is ready
          const timer = setTimeout(updateIconPositions, 100);
          
          window.addEventListener('resize', updateIconPositions);
          window.addEventListener('scroll', updateIconPositions);
          
          return () => {
              clearTimeout(timer);
              window.removeEventListener('resize', updateIconPositions);
              window.removeEventListener('scroll', updateIconPositions);
          };
      }, []);

    const handleMouseEnter = (index) => {
      setHoveredItem(index);
  };

  const handleMouseMove = (event) => {
      setMousePos({ x: event.clientX, y: event.clientY });
  };




  const handleMouseLeave = () => {
      setHoveredItem(null);
  };

  const getTooltipPosition = () => {
    const tooltipWidth = 280;
    const tooltipHeight = 200; // Approximate height
    const padding = 12;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Get the icon's position
    const iconPos = iconPositions[hoveredItem];
    if (!iconPos) return { left: 0, top: 0 };

    // Check if it's one of the last two items (Data Access or Dashboards)
    const isRightEdgeItem = hoveredItem >= processItems.length - 2;

    // Calculate horizontal position
    let left;
    if (isRightEdgeItem) {
      // For right-edge items, position tooltip to the left of the icon
      left = iconPos.x - tooltipWidth - 100; // 10px offset from icon
      // Ensure it doesn't go off screen left
      if (left < padding) {
        left = padding;
      }
    } else {
      // For other items, center the tooltip below the icon
      left = iconPos.x - tooltipWidth/1.5 ;
      // Adjust if tooltip goes off screen
      if (left < padding) {
        left = padding;
      }
      if (left + tooltipWidth > screenWidth - padding) {
        left = screenWidth - tooltipWidth - padding;
      }
    }

    // Calculate vertical position - position above the icon by default
    let top = iconPos.y - tooltipHeight +150;

    // If there's not enough space above, position below
    if (top < padding) {
      top = iconPos.y + 40; // 40px below the icon
    }
    // Ensure tooltip doesn't go off screen bottom
    if (top + tooltipHeight > screenHeight - padding) {
      top = screenHeight - tooltipHeight - padding;
    }

    return { left, top };
  };




      const styles = {
          container: {
            top : '30px',
              minHeight: '100vh',
              // height: '100%',
              // maxWidth: '1250px',
              width: '100%',
              margin: '0 auto',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: "var(--app-font-family)",
              // padding: ' 30px 0 0 0'
          },
          backgroundOrb1: {
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '300px',
              height: '300px',
              background: '#3B82F6',
              borderRadius: '50%',
              mixBlendMode: 'multiply',
              filter: 'blur(60px)',
              opacity: 0.2,
              animation: 'pulse 4s ease-in-out infinite'
          },
          backgroundOrb2: {
              position: 'absolute',
              top: '75%',
              right: '25%',
              width: '300px',
              height: '300px',
              background: '#06B6D4',
              borderRadius: '50%',
              mixBlendMode: 'multiply',
              filter: 'blur(60px)',
              opacity: 0.2,
              animation: 'pulse 4s ease-in-out infinite',
              animationDelay: '2s'
          },
          backgroundOrb3: {
              position: 'absolute',
              bottom: '25%',
              left: '50%',
              width: '300px',
              height: '300px',
              background: '#4F46E5',
              borderRadius: '50%',
              mixBlendMode: 'multiply',
              filter: 'blur(60px)',
              opacity: 0.2,
              animation: 'pulse 4s ease-in-out infinite',
              animationDelay: '4s'
          },
          header: {
              textAlign: 'center',
              padding: '40px 20px'
          },
          headerTitle: {
              fontSize: '48px',
              fontFamily: "var(--app-font-family)",
              fontWeight: '700',
              color: 'white',
              marginBottom: '20px',
              lineHeight: '1.1',
              marginTop: '-10px',
          },

          headerHighlight: {
              fontSize: '3rem',
              letterSpacing: '1px',
              fontWeight: 900,
              background: 'linear-gradient(to right,#06b6d4, #0284c7, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'transform 0.3s ease, letter-spacing 0.3s ease'
          },
          headerSubtitle: {
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.9)',
              width:'100%',
              // maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
          },
          timelineSection: {
              marginTop: '-40px',
              padding: '30px 0'
          },
          timelineContainer: {
              width: '100%',
              margin: '0 auto',
              overflowX: 'hidden',
              padding: '20px 0'
          },
          timelineWrapper: {
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              minWidth: '900px',
              padding: '0 50px'
          },
          horizontalLine: {
              position: 'absolute',
              top: '50%',
              left: '50px',
              right: '50px',
              height: '4px',
              background: 'linear-gradient(90deg, #3B82F6, #06B6D4, #3B82F6)',
              borderRadius: '2px',
              transformOrigin: 'left',
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
          },
          movingDot: {
              position: 'absolute',
              top: '50%',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFFFFF, #60A5FA)',
              transform: 'translateY(-50%)',
              boxShadow: '0 0 15px rgba(96, 165, 250, 0.8), 0 0 30px rgba(96, 165, 250, 0.4)',
              zIndex: 5
          },
          processItem: {
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              minWidth: '80px'
          },
          connectionLine: {
              width: '2px',
              height: '50px',
              background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              marginBottom: '12px',
              transformOrigin: 'bottom'
          },
          iconContainer: {
              position: 'relative',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'transform 0.3s ease',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
          },
          featureName: {
              display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    minHeight: '40px', 
          },
          featureTitle: {
    color: 'white',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    whiteSpace: 'normal',
    textOverflow: 'initial',
    maxWidth: '90px',
    textAlign: 'center',
    transition: 'color 0.2s ease',
    wordWrap: 'break-word',
    lineHeight: '1.3', // ✅ Add spacing between wrapped lines
    marginTop: '4px',  // ✅ Add spacing below the icon
  },
          featureTitleHover: {
              color: '#93C5FD'
          },
          popover: {
              position: 'absolute',
              zIndex: 50,
              pointerEvents: 'none',
              // transform: 'translateX(-50%)'
          },
          popoverContent: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
              maxWidth: '280px',
              // width : '100%',
              position: 'relative'
              
          },  
          popoverHeader: {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
          },
          popoverIcon: {
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          },
          popoverTitle: {
              fontWeight: '700',
              color: 'white',
              fontSize: '13px'
          },
          popoverDescription: {
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '13px',
              marginBottom: '14px',
              lineHeight: '1.5'
          },
          pointsList: {
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
          },
          pointItem: {
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '11px'
          },
          pointDot: {
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              marginRight: '6px',
              flexShrink: 0
          },
          popoverArrow: {
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid rgba(255, 255, 255, 0.15)'
          },
          footer: {
    background: 'linear-gradient(135deg, #1B3274 0%, #1e3a8a 50%, #132041 100%)',
    padding: '40px 0px',
    // marginTop:'20px',
    textAlign: 'center',
    marginTop: 'auto', 
    minHeight: '10vh',
    width: '100%',
    // maxWidth: '100%', // ✅ Pushes it to bottom of flex layout
  },
          footerContent: {
              width : '100%',
              // maxWidth: '100%',
              margin: '0 auto',
              textAlign: 'center',
              // marginTop:'auto'
          },
          footerTitle: {
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
          },
          footerText: {
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '6px 0',
              fontSize: '14px'
          },
          footerLink: {
              color: '#06B6D4',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.3s ease'
          },
          fullText: {
    fontFamily: "var(--app-font-family)",
    fontSize: '2rem',
    fontWeight: 700,
    fontStyle: 'italic',
    letterSpacing: '1px',
    background: 'linear-gradient(to right, #1e356b, #0284c7, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    transition: 'transform 0.3s ease, letter-spacing 0.3s ease'
  }
      };

  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      {/* Top Gradient Background Container */}
      <div style={{ flex: 1 }}>
        <div style={styles.container}>
          {/* Animated Background Orbs */}
          <div style={styles.backgroundOrb1}></div>
          <div style={styles.backgroundOrb2}></div>
          <div style={styles.backgroundOrb3}></div>

          <style>
            {`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.2; }
                50% { transform: scale(1.1); opacity: 0.3; }
              }
              @keyframes moveDot {
                0% { left: 2%; }
                100% { left: 98%; }
              }
              .moving-dot {
                animation: moveDot 8s linear infinite;
              }
            `}
          </style>

          <div style={styles.mainContent}>
            {/* Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={styles.header}
            >
              <h1 style={styles.headerTitle}>
                Welcome to <span style={styles.headerHighlight}>ProChurn AI</span>
              </h1>
              <p style={styles.headerSubtitle}>
                Revolutionary data-driven platform transforming customer retention through AI-powered insights
              </p>
            </motion.div>

            {/* Timeline Section */}
            <div style={styles.timelineSection}>
              <div style={styles.timelineContainer}>
                <div style={styles.timelineWrapper}>
                  {/* Horizontal line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={styles.horizontalLine}
                  />

                  {/* Moving dot */}
                  <motion.div
                    style={styles.movingDot}
                    className="moving-dot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                  />

                  {/* Icons */}
                  {processItems.map((item, index) => (
                    <div key={index} style={styles.processItem}>
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        style={styles.connectionLine}
                      />

                      <motion.div
                        ref={(el) => iconRefs.current[index] = el}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: index * 0.1 + 0.3
                        }}
                        whileHover={{ scale: 1.1 }}
                        style={{
                          ...styles.iconContainer,
                          background: item.gradient,
                          boxShadow: `0 10px 30px ${item.color}40, 0 0 20px ${item.color}30`
                        }}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onMouseMove={handleMouseMove}
                      >
                        <item.icon size={24} style={{ color: 'white' }} />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        style={styles.featureName}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <h3 style={{
                          ...styles.featureTitle,
                          ...(hoveredItem === index ? styles.featureTitleHover : {})
                        }}>
                          {item.title}
                        </h3>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredItem !== null && iconPositions[hoveredItem] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  ...styles.popover,
                  ...getTooltipPosition()
                }}
              >
                <div style={styles.popoverContent}>
                  <div style={styles.popoverHeader}>
                    <div style={{
                      ...styles.popoverIcon,
                      background: processItems[hoveredItem].gradient
                    }}>
                      {React.createElement(processItems[hoveredItem].icon, {
                        size: 18,
                        style: { color: 'white' }
                      })}
                    </div>
                    <h4 style={styles.popoverTitle}>
                      {processItems[hoveredItem].title}
                    </h4>
                  </div>
                  <p style={styles.popoverDescription}>{processItems[hoveredItem].description}</p>
                  <ul style={styles.pointsList}>
                    {processItems[hoveredItem].points.map((point, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={styles.pointItem}
                      >
                        <div style={{
                          ...styles.pointDot,
                          backgroundColor: processItems[hoveredItem].color
                        }} />
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
    <div
  //   initial={{ opacity: 0 }}
  //   animate={{ opacity: 1 }}
  //   transition={{ delay: 1.5 }}
    style={styles.footer}
  >
    <div style={styles.footerContent}>
      <h4 style={styles.footerTitle}>
        <Rocket style={{ color: '#60A5FA' }} size={24} />
        Ready to Transform Your Business?
      </h4>
      <div>
        <p style={styles.footerText}>📍 Prowesstics IT Service, Chennai (600029)</p>
        <p style={styles.footerText}>
          Email: <a href="mailto:contact@prowesstics.com" style={styles.footerLink}>
            contact@prowesstics.com
          </a>
        </p>
      </div>
    </div>
  </div>

      {/* Bottom Spacer */}
      <div style={{ height: '100px', backgroundColor: '#FFFFFF' }} />
    </div>
  );

  };

  export default RetentionPathway;