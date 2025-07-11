// Popup.jsx
import { useEffect, useState } from "react";
import { getAllScreenshots, deleteScreenshot, openDB } from "../db.js";
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
    const tx = db.transaction("screenshots", "readwrite");
    const store = tx.objectStore("screenshots");
    const allKeys = await store.getAllKeys();
    allKeys.forEach((key) => store.delete(key));
    await tx.done;
    setScreenshots([]);
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
          {screenshots.map((shot) => {
            console.log("✅ Rendering blob:", shot.blob);
            return (
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Popup;
