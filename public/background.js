const MAX_SS = 10;

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ status: "complete" }, (tabs) => {
    for (let tab of tabs) {
      if (
        tab.url &&
        tab.url.startsWith("http") &&
        !tab.url.includes("chrome.google.com/webstore")
      ) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          })
          .catch(() => {
            console.warn("⚠️ Could not inject script into:", tab.url);
          });
      }
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "take-screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.url?.startsWith("http")) return;

      let siteName = "unknown";
      try {
        const urlObj = new URL(tab.url);
        siteName = urlObj.hostname;
      } catch (e) {
        console.warn("Invalid URL:", tab.url);
        return;
      }

      chrome.tabs.captureVisibleTab(
        null,
        { format: "png" },
        async (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error capturing tab:",
              chrome.runtime.lastError.message
            );
            sendResponse({ success: false });
            return;
          }

          try {
            // Use OffscreenCanvas for background compression
            const imgBitmap = await createImageBitmap(
              await (await fetch(dataUrl)).blob()
            );
            const canvas = new OffscreenCanvas(
              imgBitmap.width,
              imgBitmap.height
            );
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imgBitmap, 0, 0);

            const blob = await canvas.convertToBlob({
              type: "image/jpeg",
              quality: 0.7,
            });
            const reader = new FileReader();
            reader.onloadend = () => {
              const screenshotData = {
                image: reader.result,
                x: message.x,
                y: message.y,
                site: siteName,
                time: new Date().toLocaleString(),
              };

              chrome.storage.local.get({ screenshots: [] }, (result) => {
                const updated = [...result.screenshots, screenshotData].slice(
                  -MAX_SS
                );
                chrome.storage.local.set({ screenshots: updated });
              });

              sendResponse({ success: true });
            };
            reader.readAsDataURL(blob);
          } catch (err) {
            console.error("Error processing screenshot:", err.message);
            sendResponse({ success: false });
          }
        }
      );

      return true;
    });

    return true;
  }
});
