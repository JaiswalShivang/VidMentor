const DEFAULT_BACKEND_URL = "http://localhost:8000";

function getBackendUrl() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get({ backendUrl: DEFAULT_BACKEND_URL }, (items) => {
        const url = (items.backendUrl || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
        resolve(url);
      });
    } else {
      resolve(DEFAULT_BACKEND_URL);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHAT") {
    getBackendUrl().then((backendUrl) => {
      fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: message.video_id,
          query: message.query,
          current_time: message.current_time,
        }),
      })
        .then((res) => res.json())
        .then((data) => sendResponse(data))
        .catch((err) => sendResponse({ success: false, error: String(err) }));
    });

    return true; // keeps sendResponse alive for async fetch
  }

  if (message.type === "INDEX") {
    getBackendUrl().then((backendUrl) => {
      fetch(`${backendUrl}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: message.video_id }),
      })
        .then((res) => res.json())
        .then((data) => sendResponse(data))
        .catch((err) => sendResponse({ success: false, error: String(err) }));
    });

    return true;
  }
});