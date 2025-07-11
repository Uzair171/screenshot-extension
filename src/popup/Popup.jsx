import { useEffect, useState } from "react";
import { getAllScreenshots, openDB } from "../db.js";
import "./popup.css";

function Popup() {
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    const shots = await getAllScreenshots();
    const withUrls = shots.map((shot) => ({
      ...shot,
      url: URL.createObjectURL(shot.blob),
    }));
    setScreenshots(withUrls);
  };

  const openImage = (shot) => {
    const newTab = window.open();
    newTab.document.write(`
      <html><body style="margin:0">
        <img src="${shot.url}" style="max-width:100%" />
      </body></html>
    `);
  };

  const deleteAll = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("screenshots", "readwrite");
      const store = tx.objectStore("screenshots");

      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log("✅ All screenshots cleared");
        setScreenshots([]);
        resolve();
      };
      clearRequest.onerror = () => {
        console.error("❌ Failed to clear screenshots:", clearRequest.error);
        reject(clearRequest.error);
      };
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
          {screenshots.map((shot) => (
            <div key={shot.id} className="screenshot-item">
              <img
                src={shot.url}
                className="thumb"
                onClick={() => openImage(shot)}
              />
              <div className="info">
                <div className="site">{shot.site}</div>
                <div className="time">
                  {new Date(shot.time).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Popup;
