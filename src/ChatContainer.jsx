import React, { useState, useRef, useEffect } from 'react';
import ChatEntry from './ChatEntry';

function ChatContainer({ chatHistory, appendChat, isSidePanelOpen, showSnackbar }) {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const checkInput = () => {
    setIsSendButtonDisabled(!query && !file);
  };

  // Only show file selection chip in input area, not in chat
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    checkInput();
    // Reset file input value so selecting the same file again will trigger onChange
    // (this is important for re-uploading the same file after removal)
    if (!selectedFile) e.target.value = "";
  };

  const removeSelectedFile = () => {
    setFile(null);
    checkInput();
    // Reset file input value so user can re-upload the same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendQuery = async () => {
    if (!query && !file) return;
    appendChat(query, false);
    if (file) {
      appendChat(`📎 Sent file: ${file.name}`, false);
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("query", query);
    if (file) formData.append("file", file);
    formData.append("thresholds", JSON.stringify({
      total_energy: 10, // Replace with actual value
      device_thresholds: {} // Replace with actual value
    }));
    formData.append("timestamp", new Date().toISOString());

    try {
      const res = await fetch("http://localhost:5000/simulate", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      appendChat(data.response, true, data.alerts || []);
      if (data.alerts && data.alerts.length > 0) {
        showSnackbar(data.alerts.join('\n'), 'warning');
      }
    } catch (e) {
      appendChat("[Error] Failed to connect to backend.", true);
      showSnackbar("Failed to connect to backend.", "error");
    }
    setLoading(false);
    setQuery("");
    setFile(null);
    setIsSendButtonDisabled(true);
    // Reset file input value after sending
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`chat-container ${isSidePanelOpen ? 'shifted' : ''}`}>
      <div className="chat-box" id="chatBox" ref={chatBoxRef}>
        {chatHistory.map((entry, index) => (
          <ChatEntry
            key={index}
            sender={entry.sender}
            message={entry.message}
            time={entry.time}
            alerts={entry.alerts}
            animate
          />
        ))}
        {loading && (
          <div className="chat-entry bot typing-indicator" style={{ opacity: 0.7 }}>
            <span className="spinner"></span> <span>Bot is typing...</span>
          </div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          id="queryInput"
          placeholder="Ask about your energy usage..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            checkInput();
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !isSendButtonDisabled && !loading) {
              e.preventDefault();
              sendQuery();
            }
          }}
          disabled={loading}
        />
        <label htmlFor="csvFile" className="file-label" title="Attach CSV file">
          <i className="fa-solid fa-paperclip"></i>
        </label>
        <input
          type="file"
          id="csvFile"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: 'none' }}
        />
        {file && (
          <span className="file-chip">
            <i className="fa fa-file"></i> {file.name}
            <button
              type="button"
              className="remove-file-btn"
              onClick={removeSelectedFile}
              aria-label="Remove file"
            >
              <i className="fa fa-times"></i>
            </button>
          </span>
        )}
        <button id="sendBtn" onClick={sendQuery} disabled={isSendButtonDisabled || loading}>
          {loading ? <span className="spinner"></span> : <i className="fa solid fa-paper-plane"></i>}
        </button>
      </div>
    </div>
  );
}

export default ChatContainer;
