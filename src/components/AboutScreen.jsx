import { useEffect, useRef } from "react";
import "../about.css";

// Kept deliberately short: how to answer, the credits the licences require,
// and what the site does with your data (nothing).
export default function AboutScreen({ onHome }) {
  // Same reason as ResultsScreen: the screen changes under a keyboard or
  // screen-reader user, so move focus to the new heading.
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const link = (href, text) => (
    <a href={href} target="_blank" rel="noreferrer">
      {text}
    </a>
  );

  return (
    <div className="about">
      <nav className="home-nav about-nav" aria-label="Site">
        <button type="button" className="home-nav-link" onClick={onHome}>
          <span aria-hidden="true">←</span> Home
        </button>
      </nav>

      <h1 ref={headingRef} tabIndex={-1}>
        About
      </h1>

      <div className="about-card">
        <p>
          Type the place you see. Small typos count. For an airport, the code,
          the name or the city all work.
        </p>
        <p>
          <b>Credits.</b> Satellite imagery © Google. Planet textures{" "}
          {link("https://www.solarsystemscope.com/textures/", "Solar System Scope")},{" "}
          {link("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0")}. Maps{" "}
          {link("https://github.com/topojson/us-atlas", "us-atlas")} (US Census Bureau) and{" "}
          {link("https://github.com/topojson/world-atlas", "world-atlas")} (Natural Earth).
        </p>
        <p>
          <b>Privacy.</b> No accounts, ads, cookies or tracking.
        </p>
        <p>
          Made by {link("https://jiaming-sun-900.github.io", "Jiaming Sun")} ·{" "}
          {link("https://github.com/jiaming-sun-900/omni-geo-quiz", "GitHub")}
        </p>
      </div>
    </div>
  );
}
