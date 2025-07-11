function sendScreenshotWithHighlight(target, x, y) {
  if (!target) return;

  const originalBoxShadow = target.style.boxShadow;
  const originalBackground = target.style.backgroundColor;

  // Special handling for dropdown/select
  if (target.tagName === "SELECT") {
    target.style.backgroundColor = "#ffe6e6"; // light red background
  } else {
    target.style.boxShadow = "0 0 0 3px red";
  }

  // Small delay to ensure style is visible before screenshot
  setTimeout(() => {
    if (!chrome.runtime?.sendMessage) {
      target.style.boxShadow = originalBoxShadow;
      target.style.backgroundColor = originalBackground;
      return;
    }

    chrome.runtime.sendMessage(
      { type: "take-screenshot", x, y },
      (response) => {
        // Reset visual styles
        target.style.boxShadow = originalBoxShadow;
        target.style.backgroundColor = originalBackground;

        if (chrome.runtime.lastError) {
          console.warn(
            "⚠️ sendMessage failed:",
            chrome.runtime.lastError.message
          );
        } else if (response?.success) {
          console.log("✅ Screenshot captured from", target.tagName);
        }
      }
    );
  }, 50); // Wait 100ms before taking screenshot
}

// Capture click interactions
document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    const clickableTags = [
      "A",
      "BUTTON",
      "IMG",
      "INPUT",
      "TEXTAREA",
      "LABEL",
      "SELECT",
    ];
    const isInteractiveTag = clickableTags.includes(target.tagName);
    const isInsideInteractive = target.closest(
      clickableTags.map((tag) => tag.toLowerCase()).join(",")
    );

    const hasVisibleText = (el) => el?.innerText?.trim().length > 0;

    let textFound = false;
    let el = target;
    while (el && el !== document.body) {
      if (hasVisibleText(el)) {
        textFound = true;
        break;
      }
      el = el.parentElement;
    }

    if (!isInteractiveTag && !isInsideInteractive && !textFound) return;

    const { clientX: x, clientY: y } = event;
    sendScreenshotWithHighlight(target, x, y);
  },
  true
);

// Capture typing in form fields
document.addEventListener(
  "input",
  (event) => {
    const target = event.target;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      sendScreenshotWithHighlight(target, x, y);
    }
  },
  true
);
