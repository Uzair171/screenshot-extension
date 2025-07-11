// === Popup.jsx ===
import { useEffect, useState } from "react";
import {
  getAllScreenshots,
  deleteScreenshot,
  clearAllScreenshots,
} from "../db.js";
import { FiTrash2, FiDownload } from "react-icons/fi";
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

  const downloadImage = (shot) => {
    const a = document.createElement("a");
    a.href = shot.url;
    a.download = `${shot.site.replace(/[^a-z0-9]/gi, "_")}_${shot.id}.png`;
    a.click();
  };

  const deleteSingle = async (id) => {
    await deleteScreenshot(id);
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteAll = async () => {
    await clearAllScreenshots();
    setScreenshots([]);
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h3>Screenshots</h3>
        <button className="delete-btn" onClick={deleteAll}>
          <FiTrash2 /> Clear All
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
              <div className="actions">
                <button onClick={() => downloadImage(shot)} title="Download">
                  <FiDownload />
                </button>
                <button onClick={() => deleteSingle(shot.id)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Popup;
