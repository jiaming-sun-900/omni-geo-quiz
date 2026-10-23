import SatelliteImage from "../components/SatelliteImage";

// Flexible stage: takes the room left between the top bar and the controls. The
// square frame inside scales down to fit whatever is available (capped at the
// desktop size), so the image never overflows on short or narrow screens.
export default function SatelliteStage({ def, target }) {
  const src = def.image(target);
  return (
    <div className="sat-stage">
      <div className="sat-frame">
        {/* Keyed on the file, so each image starts from "loading" again. */}
        <SatelliteImage key={src} src={src} alt={def.imageAlt} />
        {/* North compass indicator — satellite images are north-up. */}
        <svg className="sat-compass" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16" fill="rgba(255,255,255,0.75)" stroke="#111" strokeWidth="1.5" />
          <text x="18" y="11" textAnchor="middle" fontSize="9" fontWeight="700" fill="#111">N</text>
          <polygon points="18,13 13.5,24 18,21 22.5,24" fill="#111" />
        </svg>
      </div>
    </div>
  );
}

