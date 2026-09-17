import { useState, useEffect, useRef } from "react";
import Globe from "./Globe";

const ENTRIES = [
  { num: "I.", icon: "🗺️ 🇺🇸", name: "US State Quiz", mode: "state" },
  { num: "II.", icon: "📍 🇺🇸", name: "US City Quiz", mode: "city" },
  { num: "III.", icon: "✈️ 🇺🇸", name: "US Airport Quiz", mode: "airport" },
  // Modes IV and V are satellite-only (no Blank Map submode), so they skip the
  // submode-selection modal and launch the game directly.
  { num: "IV.", icon: "📍 🌍", name: "World City Quiz", mode: "world-city-satellite" },
  { num: "V.", icon: "✈️ 🌍", name: "World Airport Quiz", mode: "world-airport-satellite" },
];

export default function HomeScreen({ onSelectMode }) {
  const [modalMode, setModalMode] = useState(null);
  const firstOptionRef = useRef(null);

  const handleSelect = (mode) => {
    if (mode === "airport" || mode === "city") {
      setModalMode(mode);
    } else {
      onSelectMode(mode);
    }
  };

  // Close the mode-selection modal (Airport / City) on Escape, and move focus
  // into it when it opens so the keyboard lands on the first choice instead of
  // staying on the menu button behind the backdrop.
  useEffect(() => {
    if (!modalMode) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModalMode(null);
    };
    window.addEventListener("keydown", onKey);
    firstOptionRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [modalMode]);

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
              <span className="menu-icon" aria-hidden="true">
                {e.icon}
              </span>
              <span className="menu-name">{e.name}</span>
              <span className="menu-tag" aria-hidden="true">
                [ENTER]
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>

      {modalMode && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="modal-options"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Choose a ${modalMode === "city" ? "City" : "Airport"} Quiz mode`}
          >
            <div className="mode-option">
              <button
                ref={firstOptionRef}
                className="mode-square"
                onClick={() => onSelectMode(modalMode)}
              >
                <span className="mode-icon" aria-hidden="true">
                  🗺️
                </span>
                <span>Blank Map</span>
              </button>
            </div>
            <div className="mode-option">
              <button
                className="mode-square"
                onClick={() => onSelectMode(`${modalMode}-satellite`)}
              >
                <span className="mode-icon" aria-hidden="true">
                  🛰️
                </span>
                <span>Satellite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
