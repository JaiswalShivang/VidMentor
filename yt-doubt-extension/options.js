const DEFAULT_BACKEND_URL = "http://localhost:8000";

const backendUrlInput = document.getElementById("backendUrl");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusMessage = document.getElementById("statusMessage");
const presetButtons = document.querySelectorAll(".preset-btn");

function showStatus(text, type = "info", durationMs = 4000) {
  statusMessage.textContent = text;
  statusMessage.className = `status-msg ${type}`;
  if (durationMs > 0) {
    setTimeout(() => {
      if (statusMessage.textContent === text) {
        statusMessage.className = "status-msg";
        statusMessage.textContent = "";
      }
    }, durationMs);
  }
}

function normalizeUrl(url) {
  let trimmed = (url || "").trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = "http://" + trimmed;
  }
  return trimmed.replace(/\/+$/, "");
}

function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get({ backendUrl: DEFAULT_BACKEND_URL }, (items) => {
      backendUrlInput.value = items.backendUrl || DEFAULT_BACKEND_URL;
    });
  } else {
    backendUrlInput.value = DEFAULT_BACKEND_URL;
  }
}

function saveSettings() {
  const normalized = normalizeUrl(backendUrlInput.value);
  if (!normalized) {
    showStatus("Please enter a valid URL.", "error");
    return;
  }

  backendUrlInput.value = normalized;

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ backendUrl: normalized }, () => {
      if (chrome.runtime.lastError) {
        showStatus("Failed to save URL: " + chrome.runtime.lastError.message, "error");
      } else {
        showStatus("✓ Saved successfully!", "success", 3000);
      }
    });
  } else {
    showStatus("✓ Saved (preview mode)!", "success", 3000);
  }
}

async function testConnection() {
  const url = normalizeUrl(backendUrlInput.value);
  if (!url) {
    showStatus("Please enter a URL first.", "error");
    return;
  }

  testBtn.disabled = true;
  showStatus("Testing connection...", "info", 0);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${url}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      showStatus("✓ Connected! Backend is healthy.", "success", 4000);
    } else {
      showStatus(`⚠️ Server responded with status ${res.status}`, "error", 4000);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    showStatus(`✗ Connection failed: ${err.message || "Network error"}`, "error", 5000);
  } finally {
    testBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  saveBtn.addEventListener("click", saveSettings);
  testBtn.addEventListener("click", testConnection);

  backendUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveSettings();
    }
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      backendUrlInput.value = btn.dataset.url;
      saveSettings();
    });
  });
});
