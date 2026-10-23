import { lazy, Suspense } from "react";
import "../home.css";

// The globe drags in Three.js, OrbitControls, d3-geo, topojson-client and the
// world atlas, roughly three quarters of what used to be the entry bundle. Every
// visitor lands here, so nearly everyone downloads it anyway; splitting it buys
// time-to-paint, not bytes: the title and menu render without waiting on it,
// behind the placeholder below.
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

// The menu, grouped so it can grow past one screen. Each mode is one card with
// a button per variant; `slug` is the route (see routes.js). The variant
// buttons replaced a Blank Map / Satellite pop-up, which doesn't scale to more
// than a handful of modes and hid what each tile led to.
const SECTIONS = [
  {
    title: "United States",
    modes: [
      {
        num: "I.",
        icon: "🗺️",
        name: "US State Quiz",
        blurb: "A red dot on a blank map. Which state is it in?",
        play: [{ label: "Blank Map", icon: "🗺️", slug: "us-state" }],
      },
      {
        num: "II.",
        icon: "📍",
        name: "US City Quiz",
        blurb: "62 cities: find them on a blank map, or name them from orbit.",
        play: [
          { label: "Blank Map", icon: "🗺️", slug: "us-city" },
          { label: "Satellite", icon: "🛰️", slug: "us-city-satellite" },
        ],
      },
      {
        num: "III.",
        icon: "✈️",
        name: "US Airport Quiz",
        blurb: "Hubs, runways and terminals, by code, name or city.",
        play: [
          { label: "Blank Map", icon: "🗺️", slug: "us-airport" },
          { label: "Satellite", icon: "🛰️", slug: "us-airport-satellite" },
        ],
      },
    ],
  },
  {
    title: "World",
    modes: [
      {
        num: "IV.",
        icon: "🌍",
        name: "World City Quiz",
        blurb: "54 cities on six continents, seen from above.",
        play: [{ label: "Satellite", icon: "🛰️", slug: "world-city" }],
      },
      {
        num: "V.",
        icon: "🛫",
        name: "World Airport Quiz",
        blurb: "60 of the world's great airports, from Heathrow to Haneda.",
        play: [{ label: "Satellite", icon: "🛰️", slug: "world-airport" }],
      },
    ],
  },
];

// Today's date as the daily card shows it, e.g. "Fri, Oct 23".
const today = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="home-page">
      <div className="home">
        <nav className="home-nav" aria-label="Site">
          <button type="button" className="home-nav-link" onClick={() => onSelectMode("about")}>
            About
          </button>
          <a className="home-nav-link" href="https://jiaming-sun-900.github.io" target="_blank" rel="noreferrer">
            Meet the Dev 👋
          </a>
        </nav>

        <section className="home-hero">
          <div className="home-globe">
            <Suspense fallback={<GlobePlaceholder />}>
              <Globe />
            </Suspense>
          </div>

          <div className="home-intro">
            <h1 className="home-title">Omni Geo Quiz</h1>
            <p className="home-tagline">
              How well do you know the world from above? Name cities and airports
              from blank maps and satellite images.
            </p>

            {/* The daily challenge arrives in M3 (docs/GOAL.md); until then the
                card holds its place so the hero doesn't change shape when it does. */}
            <div className="daily-card">
              <div className="daily-head">
                <span className="daily-badge">Today</span>
                <span className="daily-date">{today}</span>
              </div>
              <h2 className="daily-title">Daily Challenge</h2>
              <p className="daily-text">
                Ten mixed rounds, the same for everyone today. Share your score
                and keep your streak going.
              </p>
              <button type="button" className="daily-play" disabled>
                Coming soon
              </button>
            </div>
          </div>
        </section>

        <main className="home-modes" id="modes">
          {SECTIONS.map((section) => (
            <section key={section.title} className="mode-section" aria-labelledby={`sec-${section.title}`}>
              <h2 className="mode-section-title" id={`sec-${section.title}`}>
                {section.title}
              </h2>
              <ul className="mode-grid">
                {section.modes.map((m) => (
                  <li key={m.name} className="mode-card">
                    <div className="mode-card-head">
                      <span className="mode-num">{m.num}</span>
                      <span className="mode-card-icon" aria-hidden="true">
                        {m.icon}
                      </span>
                      <h3 className="mode-name">{m.name}</h3>
                    </div>
                    <p className="mode-blurb">{m.blurb}</p>
                    <div className="mode-play">
                      {m.play.map((v) => (
                        <button
                          key={v.slug}
                          type="button"
                          className="mode-play-btn"
                          onClick={() => onSelectMode(v.slug)}
                          // The visible label is just "Satellite"; say which quiz.
                          aria-label={`${m.name}, ${v.label}`}
                        >
                          <span aria-hidden="true">{v.icon}</span> {v.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>

        <footer className="home-footer">
          <p className="home-footer-links">
            <button type="button" className="home-footer-link" onClick={() => onSelectMode("about")}>
              About &amp; credits
            </button>
            <span aria-hidden="true">·</span>
            <a className="home-footer-link" href="https://jiaming-sun-900.github.io" target="_blank" rel="noreferrer">
              Meet the Dev
            </a>
            <span aria-hidden="true">·</span>
            <a
              className="home-footer-link"
              href="https://github.com/jiaming-sun-900/omni-geo-quiz"
              target="_blank"
              rel="noreferrer"
            >
              Source on GitHub
            </a>
          </p>
          <p className="home-footer-credit">
            Satellite imagery © Google. Planet textures by Solar System Scope, CC BY 4.0.
            Free, no ads, no tracking.
          </p>
        </footer>
      </div>
    </div>
  );
}
