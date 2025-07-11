// === content.js ===

if (!window._screenshotScriptInjected) {
  window._screenshotScriptInjected = true;

  const hasVisibleText = (el) => el?.innerText?.trim().length > 0;

  const clickableTags = new Set([
    "A",
    "BUTTON",
    "IMG",
    "INPUT",
    "TEXTAREA",
    "LABEL",
    "SELECT",
  ]);

  const clickableSelector = [...clickableTags]
    .map((tag) => tag.toLowerCase())
    .join(",");

  function sendScreenshotWithHighlight(target, x, y) {
    if (!target || !document.contains(target)) return;

    const { style } = target;
    const originalBoxShadow = style.boxShadow;
    const originalBackground = style.backgroundColor;

    if (target.tagName === "SELECT") {
      style.backgroundColor = "#ffe6e6";
    } else {
      style.boxShadow = "0 0 0 3px red";
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (typeof chrome?.runtime?.id !== "string") {
          console.warn("❌ Extension context invalidated.");
          restoreStyle();
          return;
        }

        const messagePromise = new Promise((resolve) => {
          try {
            chrome.runtime.sendMessage(
              { type: "take-screenshot", x, y },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.warn(
                    "⚠️ sendMessage failed:",
                    chrome.runtime.lastError.message
                  );
                  resolve(false);
                } else {
                  console.log("✅ Screenshot captured:", target.tagName);
                  resolve(true);
                }
              }
            );
          } catch (err) {
            console.error("❌ Error sending message:", err.message);
            resolve(false);
          }
        });

        messagePromise.finally(() => {
          restoreStyle();
        });
      }, 30);
    });

    function restoreStyle() {
      style.boxShadow = originalBoxShadow;
      style.backgroundColor = originalBackground;
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      const tag = target.tagName;

      if (
        clickableTags.has(tag) ||
        target.closest(clickableSelector) ||
        hasVisibleText(target)
      ) {
        sendScreenshotWithHighlight(target, event.clientX, event.clientY);
      }
    },
    true
  );

  let inputTimeout = null;

  document.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      const tag = target.tagName;

      if (!clickableTags.has(tag)) return;

      const rect = target.getBoundingClientRect();

      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        sendScreenshotWithHighlight(
          target,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
      }, 1000);
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const target = event.target;
      const tag = target.tagName;

      if (
        event.key === " " &&
        clickableTags.has(tag) &&
        document.contains(target)
      ) {
        const rect = target.getBoundingClientRect();
        sendScreenshotWithHighlight(
          target,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
      }
    },
    true
  );
}
