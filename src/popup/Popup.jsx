import { useEffect, useState } from "react";
import "./popup.css";

function Popup() {
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(["screenshots"], (result) => {
      setScreenshots(result.screenshots || []);
    });
  }, []);

  const openImage = (shot) => {
    const newTab = window.open();
    newTab.document.write(`
      <html><body style="margin:0; position:relative;">
        <img src="${shot.image}" style="max-width:100%;" />
        
      </body></html>
    `);
  };

  const deleteAll = () => {
    chrome.storage.local.set({ screenshots: [] }, () => {
      setScreenshots([]);
    });
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h3>Screenshots</h3>
        <button className="delete-btn" onClick={deleteAll}>
          🗑 Clear All
        </button>
      </div>

      {screenshots.length === 0 ? (
        <div className="empty-state">No screenshots yet!</div>
      ) : (
        <div className="screenshot-grid">
          {screenshots.map((shot, i) => (
            <div key={i} className="screenshot-item">
              <img
                src={shot.image}
                className="thumb"
                onClick={() => openImage(shot)}
              />
              <div className="info">
                <div className="site">{shot.site}</div>
                <div className="time">{shot.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Popup;
