import { useState } from "react";

// The satellite image plus its loading and error states, shared by the four
// satellite modes. The files are ~0.5 MB each, so without this a slow
// connection showed an unexplained blank square for seconds, and a missing file
// showed a broken-image glyph with no way to recover.
//
// Styling is inline rather than in App.css so the overlay travels with the
// component; it reuses the design system's background and the standard `.btn`.
// The parent keys this component on the image identity, so each round starts
// from "loading" again without resetting state from an effect.
const OVERLAY = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  padding: "1rem",
  background: "#FAF7F4",
  textAlign: "center",
  fontWeight: 600,
};

// Every image came from the Google Maps Static API, so Google has to be
// credited wherever one is shown. Most files carry Google's own credit band
// along the bottom edge, but the four crops (Mumbai, Havana, Nairobi, KUL) lost
// it, and the band is unreadable at phone size, so the credit is drawn here,
// top-left, clear of the north arrow in the opposite corner.
const CREDIT = {
  position: "absolute",
  top: 6,
  left: 6,
  padding: "1px 6px",
  borderRadius: 4,
  background: "rgba(250, 247, 244, 0.85)",
  color: "#1a1a1a",
  fontSize: "0.65rem",
  fontWeight: 600,
  lineHeight: 1.5,
  pointerEvents: "none",
};

export default function SatelliteImage({ src, alt }) {
  const [status, setStatus] = useState("loading");
  // Bumped by Retry to remount the <img> and re-request the same URL.
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  return (
    <>
      <img
        key={attempt}
        src={src}
        alt={alt}
        className="sat-image"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        // Hidden rather than unmounted: the element has to stay in the tree for
        // the browser to keep loading it.
        style={status === "ready" ? undefined : { visibility: "hidden" }}
      />
      {status === "ready" && <span style={CREDIT}>Imagery © Google</span>}
      {status === "loading" && (
        <div style={OVERLAY} role="status">
          Loading satellite image…
        </div>
      )}
      {status === "error" && (
        <div style={OVERLAY} role="alert">
          <span>This satellite image failed to load.</span>
          <button type="button" className="btn sat-retry" onClick={retry}>
            Retry
          </button>
        </div>
      )}
    </>
  );
}
