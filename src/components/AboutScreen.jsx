import { useEffect, useRef } from "react";
import "../about.css";

const REPO = "https://github.com/jiaming-sun-900/omni-geo-quiz";

// How to play, where the images and maps come from, and what the site does and
// doesn't do with your data. The credits here are the long form of the short
// lines on the quiz screens and the home footer.
export default function AboutScreen({ onHome }) {
  // Same reason as ResultsScreen: the screen changes under a keyboard or
  // screen-reader user, so move focus to the new heading.
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="about">
      <nav className="home-nav about-nav" aria-label="Site">
        <button type="button" className="home-nav-link" onClick={onHome}>
          <span aria-hidden="true">←</span> Home
        </button>
      </nav>

      <h1 ref={headingRef} tabIndex={-1}>
        About Omni Geo Quiz
      </h1>
      <p className="about-lead">
        A free geography game about recognising places: the states on a blank
        map, and cities and airports from above. Every game is ten rounds.
      </p>

      <section className="about-card">
        <h2>How to play</h2>
        <ul>
          <li>
            Type your answer and press Enter. The suggestions help with
            spelling, and a small typo still counts.
          </li>
          <li>
            For an airport, its code (<b>AMS</b>), its name (<b>Schiphol</b>)
            or its city (<b>Amsterdam</b>) all count. When the city has a second
            airport in the game, like London, say which one (<b>Heathrow</b>).
          </li>
          <li>
            <b>Hint</b> reveals one clue at a time. <b>Shuffle</b> or{" "}
            <b>New Image</b> swaps the place without using up a round.
          </li>
          <li>
            At the end, every round links to its Wikipedia article and to a
            satellite map, so you can see what you missed.
          </li>
        </ul>
      </section>

      <section className="about-card">
        <h2>Credits and data</h2>
        <dl>
          <dt>Satellite images</dt>
          <dd>
            Imagery © Google and its data providers (Airbus, Maxar
            Technologies, Landsat / Copernicus and others, as credited on each
            image), from the Google Maps Static API.
          </dd>
          <dt>Planet textures</dt>
          <dd>
            <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">
              Solar System Scope
            </a>
            , licensed{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>
            .
          </dd>
          <dt>US map</dt>
          <dd>
            <a href="https://github.com/topojson/us-atlas" target="_blank" rel="noreferrer">
              us-atlas
            </a>
            , from the US Census Bureau's cartographic boundary files.
          </dd>
          <dt>World map</dt>
          <dd>
            <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noreferrer">
              world-atlas
            </a>
            , from{" "}
            <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
              Natural Earth
            </a>{" "}
            (public domain).
          </dd>
        </dl>
      </section>

      <section className="about-card">
        <h2>Privacy</h2>
        <p>
          No accounts, no ads, no cookies and no analytics: the game runs
          entirely in your browser and sends your answers nowhere. The site is
          hosted on GitHub Pages, whose server logs are covered by{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noreferrer"
          >
            GitHub's privacy statement
          </a>
          .
        </p>
      </section>

      <section className="about-card">
        <h2>Who made it</h2>
        <p>
          <a href="https://jiaming-sun-900.github.io" target="_blank" rel="noreferrer">
            Jiaming Sun
          </a>
          , who loves maps and airports. The code is{" "}
          <a href={REPO} target="_blank" rel="noreferrer">
            on GitHub
          </a>
          ; ideas and bug reports are welcome there.
        </p>
      </section>
    </div>
  );
}
