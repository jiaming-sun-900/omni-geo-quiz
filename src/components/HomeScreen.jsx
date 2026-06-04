import { useState } from "react";
import Globe from "./Globe";

const ENTRIES = [
  { num: "I.", icon: "🗺️ 🇺🇸", name: "US State Quiz", mode: "state" },
  { num: "II.", icon: "📍 🇺🇸", name: "US City Quiz", mode: "city" },
  { num: "III.", icon: "✈️ 🇺🇸", name: "US Airport Quiz", mode: "airport" },
];

export default function HomeScreen({ onSelectMode }) {
  const [modalMode, setModalMode] = useState(null);

  const handleSelect = (mode) => {
    if (mode === "airport" || mode === "city") {
      setModalMode(mode);
    } else {
      onSelectMode(mode);
    }
  };

  return (
    <>
      <a
        className="dev-link"
        href="https://jiaming-sun-900.github.io"
        target="_blank"
        rel="noreferrer"
      >
        Meet the Dev 👋
      </a>
      <div className="home-screen">
      <div className="home-left">
        <Globe />
      </div>

      <div className="home-right">
        <h1 className="home-title">Omni Geo Quiz</h1>

        <div className="menu-panel">
          {ENTRIES.map((e) => (
            <button
              key={e.num}
              className="menu-row"
              onClick={() => handleSelect(e.mode)}
            >
              <span className="menu-num">{e.num}</span>
              <span className="menu-icon">{e.icon}</span>
              <span className="menu-name">{e.name}</span>
              <span className="menu-tag">[ENTER]</span>
            </button>
          ))}
        </div>
      </div>
    </div>

      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal-options" onClick={(e) => e.stopPropagation()}>
            <div className="mode-option">
              <button
                className="mode-square"
                onClick={() => onSelectMode(modalMode)}
              >
                <span className="mode-icon">🗺️</span>
                <span>Blank Map</span>
              </button>
            </div>
            <div className="mode-option">
              <div className="mode-square disabled">
                <span className="mode-icon">🛰️</span>
                <span>Satellite</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
