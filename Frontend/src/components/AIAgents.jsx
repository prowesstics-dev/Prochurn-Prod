import React, { useState, useEffect } from "react";
import styles from "./AIAgents.module.css";
import { useLocation } from "react-router-dom";


const agents = [
  { name: "Churn Analyzer", icon: "/Icons/ChurnAnalyser.png",  questions: ["Why are users churning?", "Which segment churned most?", "How can we reduce churn?"] },
  { name: "Graph Generator", icon: "/Icons/GraphGenerator.png", questions: ["Show churn by month", "Trend of revenue vs churn", "Graph of product usage"]},
  { name: "Data Query Bot", icon: "/Icons/QueryGenerator.png" , questions: ["Fetch users from Mumbai", "Show top 5 high-risk users", "Get users with > 75% churn score"]},
  { name: "Campaign Recommender", icon: "/Icons/CampaignRecommender.png", questions: ["Suggest a reactivation email", "Who should get retention offer?", "Create a campaign for loyal users"]}
];

const AIAgents = () => {
    const location = useLocation();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]); // Required for reset logic

  const handleQuestionClick = (q) => {
    setMessages([
      ...messages,
      { sender: "user", text: q },
      { sender: "agent", text: "Sample response for: " + q }
    ]);
  };

  useEffect(() => {
    if (location.pathname === "/ai-agents") {
      setSelectedAgent(null);
      setMessages([]);
    }
  }, [location]);

  const handleBack = () => {
    setSelectedAgent(null);
    setMessages([]);
  };

  // Completely remove useLocation usage if not needed:
useEffect(() => {
  const handleReset = () => {
    setSelectedAgent(null);
    setMessages([]);
  };

  window.addEventListener("resetAgentView", handleReset);

  return () => window.removeEventListener("resetAgentView", handleReset);
}, []);


  if (selectedAgent) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <button onClick={handleBack} className={styles.backButton}>← Back</button>
          <h2>{selectedAgent.name}</h2>
        </div>

        <div className={styles.sampleQuestions}>
          {selectedAgent.questions.map((q, i) => (
            <button key={i} className={styles.questionChip} onClick={() => handleQuestionClick(q)}>
              {q}
            </button>
          ))}
        </div>

        <div className={styles.chatBox}>
          {messages.map((msg, i) => (
            <div key={i} className={msg.sender === "user" ? styles.userBubble : styles.agentBubble}>
              {msg.text}
            </div>
          ))}
        </div>

        <input className={styles.chatInput} placeholder="Ask something..." />
      </div>
    );
  }

  return (
    <div className={styles["agent-selection-container"]}>
      <h2>Select an Agent</h2>
      <div className={styles["agent-grid"]}>
        {agents.map((agent, index) => (
          <div
            className={styles["agent-card"]}
            key={index}
            onClick={() => setSelectedAgent(agent)}
          >
            <img src={agent.icon} alt={agent.name} />
            <p>{agent.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIAgents;
