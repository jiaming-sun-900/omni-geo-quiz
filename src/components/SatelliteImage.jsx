import { useState } from "react";

// The satellite image plus its loading and error states, shared by the four
// satellite modes. The files are ~1.2 MB each, so without this a slow
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
      {status === "loading" && (
        <div style={OVERLAY} role="status">
          Loading satellite image…
        </div>
      )}
      {status === "error" && (
        <div style={OVERLAY} role="alert">
          <span>This satellite image failed to load.</span>
          <button type="button" className="btn" onClick={retry}>
            Retry
          </button>
        </div>
      )}
    </>
  );
}
