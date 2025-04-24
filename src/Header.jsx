import React from 'react';

function Header({ isSidePanelOpen, toggleSidePanel, toggleDarkMode, isDarkMode }) {
  return (
    <div className={`header ${isSidePanelOpen ? 'shifted' : ''}`}>
      {!isSidePanelOpen && (
        <button className="openbtn" onClick={toggleSidePanel}>☰</button>
      )}
      <h1>CHADBOT⚡️</h1>
      <button className="toggle-dark-btn" onClick={toggleDarkMode}>
        <i className={`theme-icon fa ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>
    </div>
  );
}

export default Header;
