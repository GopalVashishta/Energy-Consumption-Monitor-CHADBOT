const chatBox = document.getElementById("chatBox");
const queryInput = document.getElementById("queryInput");
const csvFile = document.getElementById("csvFile");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");
const openBtn = document.querySelector(".openbtn");
let dark = false;
let chatHistory = [];

function openNav() {
  document.getElementById("mySidepanel").classList.add("open");
  chatContainer.classList.add("shifted");
  openBtn.style.display = "none"; // Hide open button when sidebar is open
}

function closeNav() {
  document.getElementById("mySidepanel").classList.remove("open");
  chatContainer.classList.remove("shifted");
  openBtn.style.display = "block"; // Show open button when sidebar is closed
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  dark = !dark;
  const themeIcon = document.querySelector(".theme-icon");
  if (dark) {
    document.body.classList.remove("light-mode");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  } else {
    document.body.classList.add("light-mode");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  }
}

function addDevice() {
  const deviceList = document.getElementById("deviceList");
  const entry = document.createElement("div");
  entry.className = "device-entry";
  entry.innerHTML = `
    <input type="text" class="device-name" placeholder="Device Name" />
    <input type="number" class="device-energy" placeholder="Max Energy (kWh)" min="0" step="0.1" />
    <input type="number" class="device-hours" placeholder="Max Hours" min="0" step="1" />
    <button class="remove-device" onclick="removeDevice(this)">-</button>
  `;
  deviceList.appendChild(entry);
}

function removeDevice(btn) {
  btn.parentElement.remove();
}

function getDeviceThresholds() {
  const devices = document.querySelectorAll(".device-entry");
  const thresholds = {};
  devices.forEach(device => {
    const name = device.querySelector(".device-name").value.trim();
    const energy = parseFloat(device.querySelector(".device-energy").value);
    const hours = parseInt(device.querySelector(".device-hours").value);
    if (name && !isNaN(energy) && !isNaN(hours)) {
      thresholds[name] = { max_energy: energy, max_hours: hours };
    }
  });
  return thresholds;
}

function checkInput() {
  const query = queryInput.value.trim();
  const file = csvFile.files[0];
  sendBtn.disabled = !query && !file;
}

function appendChat(message, isBot, alerts = [], timeOverride = null) {
  const div = document.createElement("div");
  div.className = `chat-entry ${isBot ? 'bot' : 'user'}`;
  const time = timeOverride || new Date().toLocaleTimeString();
  const sender = isBot ? "Bot" : "You";

  const msgDiv = document.createElement("div");
  msgDiv.innerHTML = `<span class="message-content">${message}</span>`;
  div.appendChild(msgDiv);

  const timeDiv = document.createElement("div");
  timeDiv.className = "time";
  timeDiv.innerText = time;
  div.appendChild(timeDiv);

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  chatHistory.push({ sender, message, time, alerts });
  if (isBot && !timeOverride) {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-entry bot typing-indicator";
    typingDiv.innerHTML = `<span><span>.</span><span>.</span><span>.</span></span>`;
    chatBox.appendChild(typingDiv);
    setTimeout(() => {
      chatBox.removeChild(typingDiv);
      typeMessage(msgDiv.querySelector(".message-content"), message, () => {
        if (alerts.length > 0) {
          alerts.forEach(a => {
            const alertDiv = document.createElement("div");
            alertDiv.className = "alert";
            alertDiv.innerText = "[ALERT] " + a;
            div.appendChild(alertDiv);
          });
        }
      });
    }, 1000);
  } else {
    typeMessage(msgDiv.querySelector(".message-content"), message, () => {
      if (alerts.length > 0) {
        alerts.forEach(a => {
          const alertDiv = document.createElement("div");
          alertDiv.className = "alert";
          alertDiv.innerText = "[ALERT] " + a;
          div.appendChild(alertDiv);
        });
      }
    });
  }
}

function showChatHistory() {
  const historyDiv = document.createElement("div");
  historyDiv.className = "chat-entry";
  historyDiv.innerHTML = `<strong>Chat History:</strong><br>`;
  chatHistory.forEach(entry => {
    historyDiv.innerHTML += `
      <div>
        <strong>${entry.sender} (${entry.time}):</strong> ${entry.message}
        ${entry.alerts.length > 0 ? entry.alerts.map(a => `<div class="alert">[ALERT] ${a}</div>`).join("") : ""}
      </div>
    `;
  });
  chatBox.appendChild(historyDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function typeMessage(target, text, callback) {
  target.textContent = "";
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      target.textContent += text[index++];
    } else {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 20);
}

async function sendQuery() {
  const query = queryInput.value.trim();
  const file = csvFile.files[0];
  const totalEnergy = Number(document.getElementById("totalEnergy").value);
  const deviceThresholds = getDeviceThresholds();

  if (!query && !file) return;

  appendChat(query, false);

  const form = new FormData();
  form.append("query", query);
  if (file) form.append("file", file);
  form.append("thresholds", JSON.stringify({
    total_energy: totalEnergy,
    device_thresholds: deviceThresholds
  }));
  form.append("timestamp", new Date().toISOString());

  try {
    const res = await fetch("http://localhost:5000/simulate", {
      method: "POST",
      body: form
    });
    const data = await res.json();
    appendChat(data.response, true, data.alerts || []);
  } catch (e) {
    appendChat("[Error] Failed to connect to backend.", true);
  }

  queryInput.value = "";
  // Reset file input so user can re-upload the same file
  handleFileInputReset(csvFile);
  checkInput();
}

// Reset file input so user can re-upload the same file
function handleFileInputReset(input) {
  input.value = "";
}

// Greeting message on load
document.addEventListener('DOMContentLoaded', () => {
  appendChat("Hi! I'm a chatbot, here to help with your energy-related queries.", true, [], "just now");
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        sendQuery();
      }
    }
  });
  // Set initial theme icon based on current mode
  if (document.body.classList.contains("dark-mode")) {
    document.querySelector(".theme-icon").classList.remove("fa-moon");
    document.querySelector(".theme-icon").classList.add("fa-sun");
  } else {
    document.querySelector(".theme-icon").classList.remove("fa-sun");
    document.querySelector(".theme-icon").classList.add("fa-moon");
  }
});

// Add this event listener to allow re-uploading the same file
csvFile.addEventListener('click', function() {
  handleFileInputReset(this);
});