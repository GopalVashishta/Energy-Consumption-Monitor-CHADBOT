import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import SidePanel from './SidePanel';
import ChatContainer from './ChatContainer';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMode, setLoginMode] = useState('login'); // or 'signup'
  const [loginError, setLoginError] = useState('');
  const [greeted, setGreeted] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [accountHistory, setAccountHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  // Prevent background scroll when sidepanel is open on mobile
  useEffect(() => {
    if (isSidePanelOpen && window.innerWidth <= 900) {
      document.body.classList.add('sidepanel-open');
    } else {
      document.body.classList.remove('sidepanel-open');
    }
    // Clean up on unmount
    return () => document.body.classList.remove('sidepanel-open');
  }, [isSidePanelOpen]);

  const appendChat = (message, isBot, alerts = [], timeOverride = null) => {
    const time = timeOverride || new Date().toLocaleTimeString();
    const sender = isBot ? "Bot" : "You";
    setChatHistory(prevHistory => [...prevHistory, { sender, message, time, alerts }]);
  };

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (isLoggedIn && !greeted) {
      appendChat("Hi! I'm a chatbot, here to help with your energy-related queries.", true, [], "just now");
      setGreeted(true);
    }
  }, [isLoggedIn, greeted]);

  // Login/signup handlers
  const handleLogin = async (username, password) => {
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setUser({ username });
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (e) {
      setLoginError('Server error');
    }
  };

  const handleSignup = async (username, password) => {
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setUser({ username });
      } else {
        setLoginError(data.error || 'Signup failed');
      }
    } catch (e) {
      setLoginError('Server error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setGreeted(false);
    setChatHistory([]);
  };

  // Fetch chat history from backend
  const fetchAccountHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('http://localhost:5000/history', { credentials: 'include' });
      const data = await res.json();
      if (data.history) setAccountHistory(data.history);
      else setAccountHistory([]);
    } catch {
      setAccountHistory([]);
    }
    setHistoryLoading(false);
  };

  // Delete chat history from backend
  const handleDeleteAccountHistory = async () => {
    if (!window.confirm("Are you sure you want to delete all your chat history?")) return;
    try {
      await fetch('http://localhost:5000/history', { method: 'DELETE', credentials: 'include' });
      setAccountHistory([]);
      showSnackbar("Chat history deleted.", "info");
    } catch {
      showSnackbar("Failed to delete chat history.", "error");
    }
  };

  // Show history modal when requested
  useEffect(() => {
    if (historyOpen) fetchAccountHistory();
  }, [historyOpen]);

  // Responsive login/signup form
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">
            {loginMode === 'login' ? 'Login to Chadbot' : 'Create Your Account'}
          </h2>
          <LoginForm
            mode={loginMode}
            onLogin={handleLogin}
            onSignup={handleSignup}
            error={loginError}
            switchMode={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <Header
        isSidePanelOpen={isSidePanelOpen}
        toggleSidePanel={toggleSidePanel}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
      />
      <UserProfileButton
        user={user}
        open={profileOpen}
        setOpen={setProfileOpen}
        onLogout={handleLogout}
      />
      <div className="container">
        <SidePanel
          isOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
          chatHistory={chatHistory}
        />
        <ChatContainer
          chatHistory={chatHistory}
          appendChat={appendChat}
          isSidePanelOpen={isSidePanelOpen}
          showSnackbar={showSnackbar}
        />
      </div>
      {historyOpen && (
        <div className="history-modal">
          <div className="history-modal-content">
            <button className="history-modal-close" onClick={() => setHistoryOpen(false)}>&times;</button>
            <h3>Your Chat History</h3>
            {historyLoading ? (
              <div style={{ textAlign: "center", margin: "1.5em" }}>Loading...</div>
            ) : accountHistory.length === 0 ? (
              <div style={{ textAlign: "center", margin: "1.5em" }}>No chat history.</div>
            ) : (
              <div className="history-list">
                {accountHistory.map((entry, idx) => (
                  <div className={`chat-entry ${entry.sender === "You" ? "user" : "bot"}`} key={idx}>
                    <div className="message-content">{entry.message}</div>
                    <div className="time">{entry.time}</div>
                    {entry.alerts && entry.alerts.length > 0 && entry.alerts.map((alert, i) =>
                      <div className="alert" key={i}>[ALERT] {alert}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="delete-history-btn" onClick={handleDeleteAccountHistory} style={{ marginTop: 16 }}>
              <i className="fa fa-trash"></i> Delete All History
            </button>
          </div>
        </div>
      )}
      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.type}`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}

// Responsive LoginForm with show/hide password and enter-to-submit
function LoginForm({ mode, onLogin, onSignup, error, switchMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordInput = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') await onLogin(username, password);
    else await onSignup(username, password);
    setLoading(false);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
      <div className="input-group">
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoFocus
          onChange={e => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={32}
        />
      </div>
      <div className="input-group" style={{ position: 'relative' }}>
        <input
          ref={passwordInput}
          type={showPass ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={4}
          maxLength={64}
        />
        <button
          type="button"
          className="show-pass-btn"
          tabIndex={-1}
          onClick={() => setShowPass(v => !v)}
          aria-label={showPass ? "Hide password" : "Show password"}
        >
          <i className={`fa ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
        </button>
      </div>
      <button type="submit" className="login-main-btn" disabled={loading}>
        {loading ? <span className="spinner"></span> : (mode === 'login' ? 'Login' : 'Create Account')}
      </button>
      <button type="button" className="login-switch-btn" onClick={switchMode} disabled={loading}>
        {mode === 'login' ? 'Create Account' : 'Back to Login'}
      </button>
      {error && <div className="login-error">{error}</div>}
    </form>
  );
}

// User profile button with dropdown, now excludes history option
function UserProfileButton({ user, open, setOpen, onLogout }) {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);
  if (!user) return null;
  return (
    <div className="user-profile-btn" ref={ref}>
      <button className="profile-btn" onClick={() => setOpen(v => !v)}>
        <i className="fa fa-user-circle"></i> {user.username}
      </button>
      {open && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <i className="fa fa-user"></i> <span>{user.username}</span>
          </div>
          <button className="profile-dropdown-btn" onClick={onLogout}>
            <i className="fa fa-sign-out-alt"></i> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
