import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import Grievance from './Grievance';
import emailjs from 'emailjs-com';

const ROWS_PER_PAGE = 30;

const COLUMN_FRIENDLY_NAMES = {
  "COUNT(t1.ResearchCode)": "Count of Research",
  // Add more mappings as needed
};

const Chatbot = () => {
  // State for chat functionality
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('students');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGrievance, setShowGrievance] = useState(false);
  const chatWindowRef = useRef(null);

  // --- Table Pagination State ---
  const [tableRows, setTableRows] = useState([]); // Rows currently shown
  const [tableAllRows, setTableAllRows] = useState([]); // All rows fetched so far
  const [tableOffset, setTableOffset] = useState(0); // Offset for next fetch
  const [tableHasMore, setTableHasMore] = useState(false); // If more rows available
  const [tableLoadingMore, setTableLoadingMore] = useState(false); // Loading more rows
  const [tableMessageId, setTableMessageId] = useState(null); // Message id for which table is shown

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('YOUR_EMAILJS_USER_ID'); // Replace with your actual EmailJS user ID
  }, []);

  const WORKER_URLS = {
    workshop: 'https://pi360-chatbot-rag.theshinchangupta.workers.dev',
    students: 'https://pi360-sql-generator.karan-cse.workers.dev',
    training: 'https://pi360-chatbot-rag.theshinchangupta.workers.dev',
    research: 'https://pi360-chatbot-rag.theshinchangupta.workers.dev',
    seminar: 'https://pi360-chatbot-rag.theshinchangupta.workers.dev',
    conference: 'https://pi360-chatbot-rag.theshinchangupta.workers.dev',
  };

  // Reset table state when new message with table is received
  useEffect(() => {
    // Find latest bot message with table data
    const lastBotMsg = [...messages].reverse().find(m => m.response && Array.isArray(m.response.rawData) && m.response.rawData.length > 0);
    if (lastBotMsg && lastBotMsg.id !== tableMessageId) {
      setTableAllRows(lastBotMsg.response.rawData);
      setTableRows(lastBotMsg.response.rawData.slice(0, ROWS_PER_PAGE));
      setTableOffset(ROWS_PER_PAGE);
      setTableHasMore(lastBotMsg.response.rawData.length > ROWS_PER_PAGE);
      setTableLoadingMore(false);
      setTableMessageId(lastBotMsg.id);
    }
  }, [messages]);

  // Handler for Load More (UI only, for now)
  const handleLoadMoreRows = () => {
    setTableLoadingMore(true);
    setTimeout(() => {
      const nextRows = tableAllRows.slice(tableOffset, tableOffset + ROWS_PER_PAGE);
      setTableRows(prev => [...prev, ...nextRows]);
      setTableOffset(prev => prev + ROWS_PER_PAGE);
      setTableHasMore(tableAllRows.length > tableOffset + ROWS_PER_PAGE);
      setTableLoadingMore(false);
    }, 400); // Simulate loading
  };

  // Helper function to maintain conversation history
  const updateConversationHistory = (newPair) => {
    setConversationHistory(prev => {
      const updatedHistory = [...prev, newPair];
      return updatedHistory.slice(-3); // Keep only last 3 exchanges
    });
  };

  const exportCSV = (data, filename = 'data.csv') => {
    if (!data || data.length === 0) return;

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(item =>
        Object.values(item)
          .map(value => `"${value}"`.replace(/\n/g, ' '))
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const beautifyResponse = async (responseContent, userQuery, history) => {
    try {
      const systemMessage = `You are a conversational data analyst. Use the conversation history to provide contextual responses.
      Current conversation history: ${JSON.stringify(history.map(h => ({
        user: h.prompt,
        bot: h.response.beautified
      })))}
      Provide responses that continue the conversation naturally.`;

      const response = await fetch('https://pi360-deepseek-model.theshinchangupta.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: `Analyze this data and respond conversationally to: "${userQuery}"\n\nDATA: ${JSON.stringify(responseContent)}` }
          ],
        }),
      });

      if (!response.ok) throw new Error(`Beautification failed: ${response.statusText}`);

      const data = await response.json();
      let beautified = data.response;

      const cleanResponse = (text) => {
        return text
          .replace(/\*\*/g, '')
          .replace(/<\/?think>/g, "")
          .replace(/\b2,?024\b/g, "2024")
          .replace(/\.{2,}/g, '.')
          .trim();
      };

      return cleanResponse(beautified);
    } catch (error) {
      console.error('Formatting Error:', error);
      const value = Object.values(responseContent)[0] || 0;
      return `There were ${value.toLocaleString()} records found.`;
    }
  };

  const renderTable = (data, onLoadMore, hasMore, loadingMore) => {
    if (!data || data.length === 0) return <p>No data available</p>;
    const keys = Object.keys(data[0]);

    return (
      <div className="table-container">
        <div className="export-button-container">
          <button
            className="export-csv-button"
            onClick={() => exportCSV(data, `export-${Date.now()}.csv`)}
          >
            Export CSV
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>{keys.map((key) => <th key={key}>{COLUMN_FRIENDLY_NAMES[key] || key}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>{keys.map((key) => <td key={key}>{item[key]}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <button className="load-more-button" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const tempId = Date.now();
    const userMessage = {
      id: tempId,
      type: 'user',
      content: input,
      timestamp: new Date().getTime()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context-aware payload
      const context = conversationHistory.flatMap(pair => [
        { role: 'user', content: pair.prompt },
        { role: 'assistant', content: pair.response.beautified }
      ]);

      const payload = {
        content: input,
        section: activeSection,
        context: context.slice(-6) // Last 3 exchanges (6 messages)
      };

      console.log('Sending payload with context:', payload);

      const workerResponse = await fetch(WORKER_URLS[activeSection], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!workerResponse.ok) {
        const errorText = await workerResponse.text();
        throw new Error(`Failed to generate SQL query: ${workerResponse.status} - ${errorText}`);
      }

      const workerData = await workerResponse.json();
      const sqlQuery = workerData.query;

      const encodedQuery = btoa(sqlQuery);
      const chatResponse = await fetch(
        `https://pi360.net/site/api/endpoints/chat.php?institute_id=mietjammu&secret=R0dqSDg3Njc2cC00NCNAaHg=&query=${encodedQuery}`
      );

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        throw new Error(`Database error: ${chatResponse.status} - ${errorText}`);
      }

      const chatData = await chatResponse.json();

      if (chatData.response_code === "200") {
        const beautified = await beautifyResponse(chatData.content, input, conversationHistory);

        const responseData = {
          sql: sqlQuery,
          rawData: chatData.content,
          beautified: beautified
        };

        updateConversationHistory({
          prompt: input,
          response: responseData
        });

        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, response: responseData }
            : msg
        ));
      } else {
        throw new Error(chatData.response_message || 'Database error');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, error: `Error: ${error.message}` }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const renderResponse = (response, error, paginatedTableState) => {
    if (error) {
      return (
        <div className="error-message">
          <div className="error-text">{error}</div>
        </div>
      );
    }
    if (!response) return null;

    // paginatedTableState: { rows, onLoadMore, hasMore, loadingMore }
    return (
      <div className="bot-response">
        <div className="beautified-response">{response.beautified}</div>
        {renderTable(
          paginatedTableState.rows,
          paginatedTableState.onLoadMore,
          paginatedTableState.hasMore,
          paginatedTableState.loadingMore
        )}
      </div>
    );
  };

  useEffect(() => {
    chatWindowRef.current?.scrollTo(0, chatWindowRef.current.scrollHeight);
  }, [messages]);

  return (
    <div className="chatbot-container">
      <div className="section-selector">
        {Object.keys(WORKER_URLS).map(section => (
          <button
            key={section}
            className={activeSection === section ? 'active' : ''}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
        <button
          className="grievance-button"
          onClick={() => setShowGrievance(true)}
        >
          feedback Section
        </button>
      </div>

      <div className="history-controls">
        <button
          className="history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide Context' : 'Show Context'}
        </button>
        {showHistory && (
          <button
            className="clear-history"
            onClick={() => setConversationHistory([])}
          >
            Clear Context
          </button>
        )}
      </div>

      {showHistory && conversationHistory.length > 0 && (
        <div className="conversation-history">
          <h3>Conversation Context</h3>
          <ul>
            {conversationHistory.map((pair, index) => (
              <li key={index} className="history-item">
                <div className="history-prompt"><strong>You:</strong> {pair.prompt}</div>
                <div className="history-response"><strong>Bot:</strong> {pair.response.beautified}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message) => {
          const isLatestTableMsg = message.id === tableMessageId && Array.isArray(message.response?.rawData) && message.response.rawData.length > 0;
          let paginatedTableState;
          if (isLatestTableMsg) {
            paginatedTableState = {
              rows: tableRows,
              onLoadMore: handleLoadMoreRows,
              hasMore: tableHasMore,
              loadingMore: tableLoadingMore
            };
          } else {
            paginatedTableState = {
              rows: (message.response && Array.isArray(message.response.rawData)) ? message.response.rawData : [],
              onLoadMore: null,
              hasMore: false,
              loadingMore: false
            };
          }
          return (
            <div key={message.id} className="message-container">
              <div className={`message ${message.type}`}>
                <div className="message-content">
                  {message.type === 'user' ? (
                    <div className="user-icon">You</div>
                  ) : (
                    <div className="bot-icon">Bot</div>
                  )}
                  <div className="text-content">{message.content}</div>
                </div>
              </div>
              {renderResponse(message.response, message.error, paginatedTableState)}
            </div>
          );
        })}
        {isLoading && (
          <div className="typing-indicator">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="send-button"
          >
            <svg className="send-icon" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
        <div className="disclaimer">
          Responses may contain inaccuracies. Verify important information.
        </div>
      </div>

      {showGrievance && (
        <Grievance onClose={() => setShowGrievance(false)} />
      )}
    </div>
  );
};

export default Chatbot;