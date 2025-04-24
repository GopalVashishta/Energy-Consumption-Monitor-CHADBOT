import React from 'react';

function ChatEntry({ sender, message, time, alerts, animate }) {
  return (
    <div className={`chat-entry ${sender === 'You' ? 'user' : 'bot'}${animate ? ' fade-in' : ''}`}>
      <div className="message-content">{message}</div>
      <div className="time">{time}</div>
      {alerts && alerts.length > 0 && (
        alerts.map((alert, index) => (
          <div className="alert" key={index}>
            [ALERT] {alert}
          </div>
        ))
      )}
    </div>
  );
}

export default ChatEntry;
