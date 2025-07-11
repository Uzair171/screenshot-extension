// background.js
import { saveScreenshot } from "./db.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ status: "complete" }, (tabs) => {
    tabs.forEach((tab) => {
      if (
        tab.url?.startsWith("http") &&
        !tab.url.includes("chrome.google.com/webstore")
      ) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          })
          .catch((err) =>
            console.warn("⚠️ Could not inject into:", tab.url, err.message)
          );
      }
    });
  });
});

// Reinject content script after navigation (if needed)
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    chrome.scripting
      .executeScript({
        target: { tabId: details.tabId },
        files: ["content.js"],
      })
      .catch((err) => console.warn("⚠️ Reinjection failed:", err.message));
  },
  { url: [{ schemes: ["http", "https"] }] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "take-screenshot") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.url?.startsWith("http")) {
      sendResponse({ success: false });
      return;
    }

    const siteName = (() => {
      try {
        return new URL(tab.url).hostname;
      } catch {
        return "unknown";
      }
    })();

    chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("❌ Capture failed:", chrome.runtime.lastError?.message);
        sendResponse({ success: false });
        return;
      }

      try {
        const blob = await (await fetch(dataUrl)).blob();

        await saveScreenshot({
          blob,
          x: message.x,
          y: message.y,
          site: siteName,
        });

        sendResponse({ success: true });
      } catch (err) {
        console.error("❌ Saving screenshot failed:", err.message);
        sendResponse({ success: false });
      }
    });
  });

  // Required to keep sendResponse alive for async call
  return true;
});
