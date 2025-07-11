// Prevent multiple injections
if (!window._screenshotScriptInjected) {
  window._screenshotScriptInjected = true;

  // --- START SCRIPT LOGIC ---

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

        try {
          chrome.runtime.sendMessage(
            { type: "take-screenshot", x, y },
            (response) => {
              restoreStyle();

              if (chrome.runtime.lastError) {
                console.warn(
                  "⚠️ sendMessage failed:",
                  chrome.runtime.lastError.message
                );
              } else if (response?.success) {
                console.log("✅ Screenshot captured:", target.tagName);
              }
            }
          );
        } catch (err) {
          console.error("❌ Error sending message:", err.message);
          restoreStyle();
        }
      }, 10);
    });

    function restoreStyle() {
      style.boxShadow = originalBoxShadow;
      style.backgroundColor = originalBackground;
    }
  }

  // Click
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

  // Input
  document.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      const tag = target.tagName;

      if (clickableTags.has(tag)) {
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

  // --- END SCRIPT LOGIC ---
}
