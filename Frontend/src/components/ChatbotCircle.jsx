import React, { useState } from "react";
import { X, Send } from "lucide-react";
// Import your images
import robotGif from "../assets/animaterobo.gif";
import girlrobo from "../assets/animeRobo.png";

const ChatbotCircle = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock API URL for demo
  const API_URL = import.meta.env.VITE_API_URL;

  const toggleChat = () => {
    setOpen((prev) => !prev);
  };

  const handleOpen = () => {
    setOpen(true);
    setMessages([]);
    setQuery("");
  };

  const handleClose = () => {
    setOpen(false);
    setMessages([]);
    setQuery("");
  };


// Turn "• a • b" or "- a\n- b" or numbered lines into a clean bullet array
const extractBullets = (text = "") => {
  const s = text.trim();
  if (!s) return [];

  // Case 1: "• item • item"
  if (s.includes("•")) {
    return s.split("•").map(t => t.trim()).filter(Boolean);
  }

  // Case 2: lines that already start with -, *, •, or 1.
  const lines = s.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
  const prefixed = lines
    .filter(l => /^(-|\*|•|\d+\.)\s+/.test(l))
    .map(l => l.replace(/^(-|\*|•|\d+\.)\s+/, "").trim());

  if (prefixed.length) return prefixed;

  // Case 3: multiple sentences/lines -> treat as bullets
  if (lines.length > 1) return lines;

  return [];
};

  const handleAsk = async () => {
        if (!query.trim()) return;

        const userMessage = { type: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);

        setIsLoading(true);
        setQuery("");

        try {
        const res = await fetch(`${API_URL}/askbot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        const result = await res.json();

        const bullets = extractBullets(result.answer);
        const botMessage = bullets.length
        ? { type: 'bot', content: result.answer, bullets }  // keep original + bullets
        : { type: 'bot', content: result.answer };

        setMessages(prev => [...prev, botMessage]);
        } catch (err) {
        const errorMessage = { type: 'bot', content: "Error fetching answer. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <>
       <style>{`
        .chat-popup-container {
          position: fixed;
          bottom: 120px;
          right: 40px;
          z-index: 1001;
          width: 350px;
          /* Responsive height based on viewport */
          height: min(65vh, 600px);
          max-height: calc(100vh - 140px);
        }
        
        /* Mobile responsive */
        @media (max-width: 480px) {
          .chat-popup-container {
            bottom: 100px;
            right: 20px;
            left: 20px;
            width: auto;
            height: min(85vh, 500px);
            max-height: calc(100vh - 120px);
          }
        }
        
        /* Tablet responsive */
        @media (max-width: 768px) and (min-width: 481px) {
          .chat-popup-container {
            width: 320px;
            height: min(75vh, 550px);
          }
        }
        
        .chat-popup {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .chat-header {
          background: linear-gradient(to right, #38bdf8, #06b6d4);
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .chat-avatar img {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .chat-title {
          color: white;
          font-weight: 600;
        }
        
        .chat-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .chat-content {
          background: #f9fafb;
          overflow-y: auto;
          padding: 1rem;
          flex: 1;
          min-height: 0;
        }
        
        .chat-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .chat-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .chat-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .chat-content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
         .bot-list {
            margin: 0;
            padding-left: 1.1rem;
            }

          .bot-list li {
            margin: 0.25rem 0;
            line-height: 1.4;
            }
            
        .chat-intro, .chat-message {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .chat-intro img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        
        .chat-bubble {
          background: white;
          border-radius: 12px;
          padding: 0.5rem 0.75rem;
          font-size: 0.85rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          max-width: 80%;
          word-wrap: break-word;
        }
        
        .chat-message.user {
          flex-direction: row-reverse;
          justify-content: flex-start;
        }
        
        .chat-message.user .chat-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }
        
        .chat-bubble.user {
          background: #3b82f6;
          color: white;
          border-bottom-right-radius: 4px;
          margin-left: auto;
        }
        
        .chat-bubble.bot {
          border-bottom-left-radius: 4px;
        }
        
        .chat-input-area {
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid #e5e7eb;
          padding: 0.75rem;
          background: rgba(255,255,255,0.9);
          flex-shrink: 0;
        }
        
        .chat-textarea {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          padding: 0.5rem 0.75rem;
          resize: none;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          max-height: 100px;
        }
        
        .chat-textarea:focus {
          border-color: #3b82f6;
        }
        
        .chat-send-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
        }
        
        .chat-send-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .chat-send-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .chat-float-btn {
          position: fixed;
          bottom: 40px;
          right: 44px;
          z-index: 1000;
          background: #3b82f6;
          border-radius: 50%;
          padding: 0;
          border: none;
          width: 60px;
          height: 60px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        
        .chat-float-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        
        .chat-float-btn img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        
        /* Mobile float button */
        @media (max-width: 480px) {
          .chat-float-btn {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
          }
        }
        
        .dot-loader {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
          padding: 4px 0;
        }
        
        .dot-loader div {
          width: 6px;
          height: 6px;
          background: #6b7280;
          border-radius: 50%;
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        
        .dot-loader div:nth-child(1) { animation-delay: -0.32s; }
        .dot-loader div:nth-child(2) { animation-delay: -0.16s; }
        .dot-loader div:nth-child(3) { animation-delay: 0s; }
        
        @keyframes dotBounce {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          } 
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {open && (
        <div className="chat-popup-container">
          <div className="chat-popup">
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-avatar">
                  <img src={girlrobo} alt="Sara" />
                </div>
                <div className="chat-title">Sara</div>
              </div>
              <button onClick={handleClose} className="chat-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="chat-content">
              <div className="chat-intro">
                <img src={girlrobo} alt="Sara" />
                <div className="chat-bubble">
                  👋 Hi I'm Sara, The AI chatbot... How can I help you today?
                </div>
              </div>

              {messages.map((message, idx) => (
                <div key={idx} className={`chat-message ${message.type}`}>
                  {message.type === "user" ? (
                    <div className="chat-avatar"></div>
                  ) : (
                    <div className="chat-avatar">
                      <img src={girlrobo} alt="Sara" />
                    </div>
                  )}
                  <div className={`chat-bubble ${message.type}`}>
                      {/* {message.content} */}
                        {message.type === 'bot' && Array.isArray(message.bullets) && message.bullets.length ? (
                            <ul className="bot-list">
                            {message.bullets.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                            </ul>
                        ) : (
                            message.content
                        )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="chat-message bot">
                  <div className="chat-avatar">
                    <img src={girlrobo} alt="Sara" />
                  </div>
                  <div className="chat-bubble bot">
                    <div className="dot-loader">
                      <div></div><div></div><div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              <textarea
                rows={1}
                placeholder="Write a message..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="chat-textarea"
              />
              <button
                onClick={handleAsk}
                disabled={isLoading || !query.trim()}
                className="chat-send-btn"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={toggleChat} className="chat-float-btn">
        <img src={robotGif} alt="Chatbot" />
      </button>
    </>
  );
};

export default ChatbotCircle;