import { useState, useEffect, useRef, lazy, Suspense } from "react";

// The globe drags in Three.js, OrbitControls, d3-geo, topojson-client and the
// world atlas — roughly three quarters of what used to be the entry bundle, and
// none of it is needed by a player who goes straight into a satellite mode. It
// loads on its own chunk instead, behind the placeholder below.
const Globe = lazy(() => import("./Globe"));

// Stand-in shown while that chunk is in flight. It reuses the real widget's
// class names so it occupies exactly the same rows (disc + dots + controls +
// Reset View + credit) and the column can't reflow when the globe arrives; only the disc
// draws anything, as a retro-styled empty circle.
function GlobePlaceholder() {
  const reserved = { visibility: "hidden" };
  return (
    <div className="globe-wrap" aria-hidden="true">
      <div className="globe-disc">
        <div
          style={{
            width: "80%",
            height: "80%",
            margin: "10%",
            borderRadius: "50%",
            background: "#FAF7F4",
            border: "2px solid #1a1a1a",
            boxShadow: "3px 3px 0px #111",
          }}
        />
      </div>
      <div className="globe-dots" style={reserved}>
        <button className="globe-dot active" disabled tabIndex={-1} />
      </div>
      <div className="globe-controls" style={reserved}>
        <button className="globe-btn" disabled tabIndex={-1}>
          ⏸
        </button>
      </div>
      <button className="globe-reset" style={reserved} disabled tabIndex={-1}>
        Reset View
      </button>
      <p className="globe-credit" style={reserved}>
        Planet textures Solar System Scope · CC BY 4.0
      </p>
    </div>
  );
}

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
  const modalRef = useRef(null);

  const handleSelect = (mode) => {
    if (mode === "airport" || mode === "city") {
      setModalMode(mode);
    } else {
      onSelectMode(mode);
    }
  };

  // Close the mode-selection modal (Airport / City) on Escape, and move focus
  // into it when it opens so the keyboard lands on the first choice instead of
  // staying on the menu button behind the backdrop. Tab is trapped inside the
  // dialog — otherwise it walks onto the menu rows behind the backdrop, which
  // are visually dimmed and unreachable by mouse — and focus returns to the
  // menu row that opened it, so dismissing with Escape doesn't dump the
  // keyboard back at the top of the page.
  useEffect(() => {
    if (!modalMode) return;
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setModalMode(null);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = modalRef.current?.querySelectorAll("button");
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    firstOptionRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
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
        <Suspense fallback={<GlobePlaceholder />}>
          <Globe />
        </Suspense>
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
            ref={modalRef}
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
