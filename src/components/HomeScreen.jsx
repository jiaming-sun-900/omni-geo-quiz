import { lazy, Suspense, useState } from "react";
import { dateKey, dayNumber } from "../daily/date";
import { getDay, getStats } from "../daily/store";
import { gridRows } from "../daily/share";
import "../home.css";

// The globe drags in Three.js, OrbitControls, d3-geo, topojson-client and the
// world atlas, roughly three quarters of what used to be the entry bundle. Every
// visitor lands here, so nearly everyone downloads it anyway; splitting it buys
// time-to-paint, not bytes: the title and menu render without waiting on it,
// behind the placeholder below.
const Globe = lazy(() => import("./Globe"));

// Stand-in shown while that chunk is in flight. It reuses the real widget's
// class names so it occupies exactly the same space (the disc and the one
// control row) and the hero can't reflow when the globe arrives; only the disc
// draws anything, as a retro-styled empty circle.
function GlobePlaceholder() {
  return (
    <div className="globe-wrap" aria-hidden="true">
      <div className="globe-stage">
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
      </div>
      <div className="globe-bar" style={{ visibility: "hidden" }}>
        <button className="globe-btn" disabled tabIndex={-1}>
          ⏸
        </button>
      </div>
    </div>
  );
}

// The menu, grouped so it can grow past one screen. Each mode is one card with
// a button per variant; `slug` is the route (see routes.js).
const SECTIONS = [
  {
    title: "United States",
    modes: [
      { num: "I.", icon: "🗺️", name: "US State Quiz", play: [["Blank Map", "us-state"]] },
      {
        num: "II.",
        icon: "📍",
        name: "US City Quiz",
        play: [
          ["Blank Map", "us-city"],
          ["Satellite", "us-city-satellite"],
        ],
      },
      {
        num: "III.",
        icon: "✈️",
        name: "US Airport Quiz",
        play: [
          ["Blank Map", "us-airport"],
          ["Satellite", "us-airport-satellite"],
        ],
      },
    ],
  },
  {
    title: "World",
    modes: [
      { num: "IV.", icon: "🌍", name: "World City Quiz", play: [["Satellite", "world-city"]] },
      { num: "V.", icon: "🛫", name: "World Airport Quiz", play: [["Satellite", "world-airport"]] },
    ],
  },
];

const VARIANT_ICON = { "Blank Map": "🗺️", Satellite: "🛰️" };

// The Daily Challenge card: today's number and date, and one button that
// starts, continues or reopens it. Read from this browser's save at mount.
function DailyCard({ onOpen }) {
  const [state] = useState(() => {
    const day = dateKey();
    return { day, record: getDay(day), streak: getStats(day).streak };
  });
  const { day, record, streak } = state;
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  let action = "Play";
  if (record?.status === "done") action = "Results";
  else if (record?.status === "playing") action = `Continue · ${record.review.length + 1}/10`;

  return (
    <div className="daily-card">
      <div className="daily-head">
        <span className="daily-badge">Today</span>
        <span className="daily-date">
          #{dayNumber(day)} · {date}
        </span>
        {streak > 0 && <span className="daily-streak">🔥 {streak}</span>}
      </div>
      <h2 className="daily-title">Daily Challenge</h2>
      {record?.status === "done" && (
        <p className="daily-done" aria-label={`Today: ${record.score} out of 10`}>
          <span className="daily-done-score">{record.score}/10</span>
          <span aria-hidden="true">{gridRows(record.review).join(" ")}</span>
        </p>
      )}
      <button type="button" className="daily-play" onClick={onOpen}>
        {action}
      </button>
    </div>
  );
}

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

        {/* A Z: the title top-left, where the eye lands first; across to the
            globe; back down-left to the Daily Challenge. On a phone the three
            stack in that same order. Laid out with grid areas in home.css. */}
        <section className="home-hero">
          <div className="home-head">
            <h1 className="home-title">Omni Geo Quiz</h1>
            <p className="home-tagline">Name cities and airports from above.</p>
          </div>

          <div className="home-globe">
            <Suspense fallback={<GlobePlaceholder />}>
              <Globe />
            </Suspense>
          </div>

          <DailyCard onOpen={() => onSelectMode("daily")} />
        </section>

        <main className="home-modes">
          {SECTIONS.map((section) => (
            <section key={section.title} aria-labelledby={`sec-${section.title}`}>
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
                    <div className="mode-play">
                      {m.play.map(([label, slug]) => (
                        <button
                          key={slug}
                          type="button"
                          className="mode-play-btn"
                          onClick={() => onSelectMode(slug)}
                          // The visible label is just "Satellite"; say which quiz.
                          aria-label={`${m.name}, ${label}`}
                        >
                          <span aria-hidden="true">{VARIANT_ICON[label]}</span> {label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>

        {/* The planet photos are CC BY 4.0, so their credit has to be on the page
            that shows them; it moved here from under the globe. */}
        <footer className="home-footer">
          <p>
            Satellite imagery © Google · Planet textures{" "}
            <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">
              Solar System Scope
            </a>
            ,{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>
          </p>
          <p>
            <button type="button" className="home-footer-link" onClick={() => onSelectMode("about")}>
              About
            </button>
            {" · "}
            <a href="https://github.com/jiaming-sun-900/omni-geo-quiz" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
