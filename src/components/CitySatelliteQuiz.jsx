import { useState, useRef, useEffect } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { satelliteCities } from "../data/satellite-cities";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;

// Satellite images live in public/satellite/cities/{imageFile} and are served
// under the configured base path.
const IMG_BASE = `${import.meta.env.BASE_URL}satellite/cities/`;

// US regions, keyed by state abbreviation.
const REGION_BY_ABBR = {};
{
  const regions = {
    "West Coast": ["CA", "OR", "WA"],
    Southwest: ["AZ", "NV", "NM", "UT", "CO"],
    "Mountain West": ["ID", "MT", "WY"],
    Midwest: ["IL", "IN", "OH", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    South: ["TX", "OK", "AR", "LA", "MS", "AL", "TN", "KY", "WV"],
    Southeast: ["FL", "GA", "SC", "NC", "VA"],
    Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "MD", "DE"],
    "Non-contiguous": ["AK", "HI"],
  };
  for (const [region, abbrs] of Object.entries(regions)) {
    for (const abbr of abbrs) REGION_BY_ABBR[abbr] = region;
  }
}

// satellite-cities.js stores full state names; map them to abbreviations so we
// can look up the region. (Washington DC has no abbreviation here, so its hint
// falls back to the state name.)
const STATE_NAME_TO_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY",
};

function regionForState(stateName) {
  const abbr = STATE_NAME_TO_ABBR[stateName];
  return REGION_BY_ABBR[abbr] || null;
}

// Common abbreviations the quiz accepts, keyed by city name. fuzzyMatch already
// covers most of these against the city name, except "DC" (it maps DC to
// "district of columbia", not "Washington DC"), so we check them explicitly.
const CITY_ABBR = {
  "New York": "NYC",
  "New Orleans": "NOLA",
  "Washington DC": "DC",
  "San Francisco": "SF",
  "Los Angeles": "LA",
};

// Accept the city name (case-insensitive, typo tolerant via fuzzy match) or one
// of the common abbreviations above. The autocomplete fills "City, State", so a
// trailing ", State" is stripped before matching.
function matchCity(guess, city) {
  const raw = guess.trim();
  const cityPart = raw.includes(",") ? raw.slice(0, raw.indexOf(",")).trim() : raw;
  const abbr = CITY_ABBR[city.name];
  if (abbr && cityPart.toLowerCase() === abbr.toLowerCase()) return true;
  if (fuzzyMatch(cityPart, city.name)) return true;
  return false;
}

// Suggestions matched on city name or its abbreviation, formatted "City, State".
// Matches that START with the query rank ahead of those that merely CONTAIN it.
// The "City, State" string doubles as the fill value (unique, so the two
// Portlands don't collide) and is stripped back to the city name on submit.
function getSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const c of satelliteCities) {
    const name = c.name.toLowerCase();
    const abbr = CITY_ABBR[c.name]?.toLowerCase();
    if (name.startsWith(q) || abbr?.startsWith(q)) {
      starts.push(c);
    } else if (name.includes(q) || abbr?.includes(q)) {
      contains.push(c);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((c) => ({
    code: `${c.name}, ${c.state}`,
    label: `${c.name}, ${c.state}`,
  }));
}

function pickCity(usedIndices) {
  const available = satelliteCities
    .map((c, i) => ({ city: c, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : satelliteCities.map((c, i) => ({ city: c, index: i }));
  return pool[Math.floor(Math.random() * pool.length)];
}

function Game({ onHome, onRestart, onFinish }) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickCity(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = region hint, 2 = state hint (max). hintOpen tracks
  // bubble visibility; the level persists while dismissed. Both reset per round.
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const scoreRef = useRef(0);

  const handleGuess = (guess) => {
    const correct = matchCity(guess, current.city);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    setFeedback({ correct });
    setHintOpen(false);
    usedIndices.current.add(current.index);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setHintLevel(0);
      setHintOpen(false);
      setCurrent(pickCity(usedIndices.current));
    }
  };

  // First click reopens an already-revealed hint; otherwise advance (capped at 2).
  const handleHint = () => {
    if (!hintOpen && hintLevel > 0) {
      setHintOpen(true);
      return;
    }
    setHintLevel((l) => Math.min(l + 1, 2));
    setHintOpen(true);
  };

  const closeHint = () => setHintOpen(false);

  const c = current.city;
  // Hint 1 (region), Hint 2 (state).
  let hintText = null;
  if (hintLevel === 1) {
    const region = regionForState(c.state);
    hintText = region
      ? `This city is in the ${region}.`
      : `This city is in ${c.state}.`;
  } else if (hintLevel === 2) {
    hintText =
      c.name === "St. Louis"
        ? "This city is the home of the developer of this game 👨‍💻"
        : `This city is in ${c.state}.`;
  }

  const reveal = `${c.name}, ${c.state}`;

  // While the bubble is up, the next Enter press or click anywhere advances the
  // round (or finishes). Listeners attach after this render so the submitting
  // event doesn't immediately dismiss the bubble.
  useEffect(() => {
    if (!feedback) return;
    const onKey = (e) => {
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault();
        handleNext();
      }
    };
    const onClick = () => handleNext();
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [feedback]);

  return (
    <div
      className="quiz-container state-quiz"
      style={{ minHeight: "100vh", background: "#FAF7F4" }}
    >
      <div className="state-quiz-header">
        <div className="sq-right">
          <div className="sq-box sq-round">Round {round}/{TOTAL_ROUNDS}</div>
          <div className="sq-box sq-score">Score: {score}</div>
          <button className="sq-box sq-restart sq-emoji" onClick={onRestart}>🔄</button>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button className="sq-box sq-home sq-emoji" onClick={onHome}>🏠</button>
      </div>

      {/* Top spacer; paired with the equal-flex controls wrapper below so the
          image keeps its original vertical position while the controls center
          in the gap beneath it. */}
      <div style={{ flex: 1 }} />

      <img
        key={c.imageFile}
        src={`${IMG_BASE}${c.imageFile}`}
        alt="Satellite view of a city"
        style={{
          alignSelf: "center",
          display: "block",
          flexShrink: 0,
          width: "min(68vh, 88vw)",
          height: "min(68vh, 88vw)",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="quiz-controls">
          <p className="prompt" style={{ fontWeight: 700 }}>
            Which city is shown in the satellite image?
          </p>
          <AirportGuessInput
            onSubmit={handleGuess}
            disabled={!!feedback}
            onHint={handleHint}
            onHintClose={closeHint}
            hintDisabled={hintLevel >= 2}
            hintLevel={hintLevel}
            hintOpen={hintOpen}
            hintText={hintText}
            getSuggestions={getSuggestions}
            placeholder="City name..."
          />
        </div>
      </div>

      {feedback && (
        <FeedbackBubble
          correct={feedback.correct}
          message={
            feedback.correct
              ? `Correct! ${reveal}`
              : `Incorrect! The answer was ${reveal}.`
          }
        />
      )}
    </div>
  );
}

export default function CitySatelliteQuiz({ onHome }) {
  const [gameKey, setGameKey] = useState(0);
  const [finalScore, setFinalScore] = useState(null);

  const restart = () => {
    setFinalScore(null);
    setGameKey((k) => k + 1);
  };

  if (finalScore !== null) {
    return (
      <ResultsScreen
        score={finalScore}
        total={TOTAL_ROUNDS}
        onPlayAgain={restart}
        onHome={onHome}
      />
    );
  }

  return (
    <Game
      key={gameKey}
      onHome={onHome}
      onRestart={restart}
      onFinish={setFinalScore}
    />
  );
}
