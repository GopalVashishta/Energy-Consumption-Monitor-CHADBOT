import React, { useState } from 'react';

function SidePanel({ isOpen, toggleSidePanel, chatHistory }) {
  const [devices, setDevices] = useState([{ id: 0, name: '', energy: 0, hours: 0 }]);
  const [totalEnergy, setTotalEnergy] = useState(10);

  const addDevice = () => {
    setDevices([...devices, { id: devices.length, name: '', energy: 0, hours: 0 }]);
  };

  const removeDevice = (id) => {
    setDevices(devices.filter(device => device.id !== id));
  };

  const updateDevice = (id, field, value) => {
    setDevices(devices.map(device =>
      device.id === id ? { ...device, [field]: value } : device
    ));
  };

  const showChatHistory = () => {
    alert(JSON.stringify(chatHistory));
  };

  const deleteChatHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history?")) {
      // This will reload the page and clear chat history in parent state
      window.location.reload();
    }
  };

  return (
    <div className={`sidepanel ${isOpen ? 'open' : ''}`}>
      <div className="settings-card">
        <button
          className="settings-closebtn"
          onClick={toggleSidePanel}
          aria-label="Close settings"
        >
          <i className="fa fa-times"></i>
        </button>
        <h2>
          <i className="fa fa-cog" style={{ marginRight: 8 }}></i>
          Settings
        </h2>
        <div className="settings-section">
          <label className="settings-label">Global Max Energy (kWh):</label>
          <input
            type="number"
            id="totalEnergy"
            value={totalEnergy}
            min="0"
            step="0.1"
            onChange={(e) => setTotalEnergy(e.target.value)}
            className="settings-input"
          />
        </div>
        <div className="settings-section">
          <label className="settings-label">Per-device Thresholds:</label>
          <div id="deviceList" className="device-list">
            {devices.map(device => (
              <div className="device-entry device-entry-card" key={device.id}>
                <input
                  type="text"
                  className="device-name"
                  placeholder="Device Name"
                  value={device.name}
                  onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                  // width is controlled by CSS
                />
                <div className="device-entry-fields-row">
                  <input
                    type="number"
                    className="device-energy"
                    placeholder="Max Energy (kWh)"
                    min="0"
                    step="0.1"
                    value={device.energy}
                    onChange={(e) => updateDevice(device.id, 'energy', parseFloat(e.target.value))}
                  />
                  <input
                    type="number"
                    className="device-hours"
                    placeholder="Max Hours"
                    min="0"
                    step="1"
                    value={device.hours}
                    onChange={(e) => updateDevice(device.id, 'hours', parseInt(e.target.value))}
                  />
                  <button className="remove-device" onClick={() => removeDevice(device.id)} title="Remove device">
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="toggle-btn add-device-btn" onClick={addDevice}>
            <i className="fa fa-plus"></i> Add Device
          </button>
        </div>
        <div className="settings-section">
          <button className="toggle-btn history-btn" onClick={showChatHistory}>
            <i className="fa fa-history"></i> Chat History
          </button>
          <button className="toggle-btn delete-history-btn" onClick={deleteChatHistory} style={{ background: "#e74c3c", marginTop: "0.5rem" }}>
            <i className="fa fa-trash"></i> Delete Chat History
          </button>
        </div>
      </div>
    </div>
  );
}

export default SidePanel;
