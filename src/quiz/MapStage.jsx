import USMap from "../components/USMap";

const OVERLAYS = [
  ["rivers", "Rivers"],
  ["mountains", "Mountains"],
  ["borders", "State Borders"],
];

// The blank US map with its red dot, and the Rivers / Mountains / State Borders
// switches under it. The overlay state is held by QuizScreen, above the remount
// that Play Again does, so a new game keeps the overlays as the player set them.
export default function MapStage({ def, target, revealed, overlays, toggleOverlay }) {
  return (
    <>
      <USMap
        dotPosition={def.dot(target)}
        revealedStateId={revealed && def.revealStateId ? def.revealStateId(target) : null}
        showRivers={overlays.rivers}
        showMountains={overlays.mountains}
        showBorders={overlays.borders}
      />

      <div className="sq-toggles">
        {OVERLAYS.map(([key, label]) => (
          <div className="sq-toggle" key={key}>
            <span className="sq-toggle-label">{label}</span>
            {/* aria-label because the visible label is a sibling span, so the
                switch otherwise announced as just "switch, ON". */}
            <button
              type="button"
              role="switch"
              aria-label={label}
              aria-checked={overlays[key]}
              className={`push-toggle ${overlays[key] ? "on" : ""}`}
              onClick={() => toggleOverlay(key)}
            >
              {overlays[key] ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
