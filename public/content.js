document.addEventListener(
  "click",
  function (event) {
    const target = event.target;

    // Tags typically meant to be interacted with
    const clickableTags = ["A", "BUTTON", "IMG", "INPUT", "TEXTAREA", "LABEL"];
    const isInteractiveTag = clickableTags.includes(target.tagName);

    // Check if clicked element is inside an interactive container
    const isInsideInteractive = target.closest(
      clickableTags.map((tag) => tag.toLowerCase()).join(",")
    );

    // Check if any ancestor contains visible text
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

    // Exit if it's not clickable or textual
    if (!isInteractiveTag && !isInsideInteractive && !textFound) {
      console.log("❌ Ignored click on:", target.tagName);
      return;
    }

    const { clientX: x, clientY: y } = event;

    // Safe message sending with error handling
    try {
      if (!chrome.runtime?.sendMessage) {
        console.warn("⚠️ chrome.runtime.sendMessage is undefined");
        return;
      }

      chrome.runtime.sendMessage(
        { type: "take-screenshot", x, y },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "⚠️ sendMessage failed:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("✅ Screenshot captured from", target.tagName);
          }
        }
      );
    } catch (e) {
      console.error("❌ Error sending message:", e.message);
    }
  },
  true // useCapture = true to catch early
);
