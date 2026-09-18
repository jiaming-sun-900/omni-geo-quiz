import { useState, useRef } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import SatelliteImage from "./SatelliteImage";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { airportWikiQuery } from "../utils/reviewLinks";
import { satelliteAirports } from "../data/satellite-airports";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;

// Satellite images live in public/satellite/airports/{CODE}.jpg and are served
// under the configured base path.
const IMG_BASE = `${import.meta.env.BASE_URL}satellite/airports/`;

// US Census-style regions, keyed by state abbreviation.
const REGION_BY_ABBR = {};
{
  const regions = {
    Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
    Southeast: ["DE", "MD", "VA", "WV", "NC", "SC", "GA", "FL"],
    Midwest: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    South: ["TX", "OK", "AR", "LA", "MS", "AL", "TN", "KY"],
    "Western US": ["MT", "ID", "WY", "CO", "NM", "AZ", "UT", "NV"],
    "West Coast": ["WA", "OR", "CA", "AK", "HI"],
  };
  for (const [region, abbrs] of Object.entries(regions)) {
    for (const abbr of abbrs) REGION_BY_ABBR[abbr] = region;
  }
}

// satellite-airports.js stores full state names; map them to abbreviations so we
// can look up the region.
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

// Every valid answer of each kind, handed to the fuzzy matcher so a guess that
// exactly names a different airport is rejected rather than treated as a typo of
// this one (the shared "International" suffix otherwise makes unrelated names
// look one small edit apart).
const AIRPORT_ANSWERS = [
  ...satelliteAirports.map((a) => a.name),
  ...satelliteAirports.map((a) => a.code),
];
const AIRPORT_CITIES = [...new Set(satelliteAirports.map((a) => a.city))];

// Cities with more than one airport in this pool. The city name alone cannot
// identify which one is shown, so it is not accepted for them — the player gives
// the IATA code or the airport name. Derived from the data, so it is empty when
// the pool has no such pair. Same rule as the World Airport Quiz.
const AMBIGUOUS_CITIES = (() => {
  const counts = new Map();
  for (const a of satelliteAirports) counts.set(a.city, (counts.get(a.city) || 0) + 1);
  return new Set([...counts].filter(([, n]) => n > 1).map(([city]) => city));
})();

// Accept the exact IATA code, the full airport name, or — when it identifies a
// single airport — the city, both names via the shared fuzzy matcher
// (case-insensitive, typo tolerant).
function matchAirport(guess, airport) {
  if (guess.trim().toLowerCase() === airport.code.toLowerCase()) return true;
  if (fuzzyMatch(guess, airport.name, AIRPORT_ANSWERS)) return true;
  if (
    !AMBIGUOUS_CITIES.has(airport.city) &&
    fuzzyMatch(guess, airport.city, AIRPORT_CITIES)
  ) {
    return true;
  }
  return false;
}

// Suggestions matched on IATA code or city name, formatted "ATL — Atlanta".
// Matches that START with the query rank ahead of those that merely CONTAIN it.
function getSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const a of satelliteAirports) {
    const code = a.code.toLowerCase();
    const city = a.city.toLowerCase();
    const name = a.name.toLowerCase();
    if (code.startsWith(q) || city.startsWith(q) || name.startsWith(q)) {
      starts.push(a);
    } else if (code.includes(q) || city.includes(q) || name.includes(q)) {
      contains.push(a);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((a) => ({
    code: a.code,
    label: `${a.code} — ${a.city}`,
  }));
}

function pickAirport(usedIndices) {
  const available = satelliteAirports
    .map((a, i) => ({ airport: a, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : satelliteAirports.map((a, i) => ({ airport: a, index: i }));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Pick a random airport guaranteed to differ from the one currently shown. Used
// by the "New Image" button, which doesn't touch the used-index set or the round.
function pickDifferentAirport(currentIndex) {
  let pick;
  do {
    const i = Math.floor(Math.random() * satelliteAirports.length);
    pick = { airport: satelliteAirports[i], index: i };
  } while (pick.index === currentIndex && satelliteAirports.length > 1);
  return pick;
}

function Game({ onHome, onFinish }) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  // Seeded with an empty set rather than usedIndices.current: nothing is used
  // yet on mount, and reading a ref during render is a React rules violation.
  const [current, setCurrent] = useState(() => pickAirport(new Set()));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = region hint, 2 = state hint (max). hintOpen tracks
  // bubble visibility; the level persists while dismissed. Both reset per round.
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const scoreRef = useRef(0);
  // One entry per answered round, handed to ResultsScreen at the end.
  const reviewRef = useRef([]);

  const handleGuess = (guess) => {
    const correct = matchAirport(guess, current.airport);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    // Recorded for the end-of-game review (see ResultsScreen). The thumbnail is
    // the same file the round just showed, so it is already cached.
    reviewRef.current.push({
      round,
      correct,
      guess,
      answer: `${current.airport.name} (${current.airport.code}) — ${current.airport.city}, ${current.airport.state}`,
      wiki: airportWikiQuery(current.airport.name),
      lat: current.airport.lat,
      lng: current.airport.lng,
      image: `${IMG_BASE}${current.airport.code}.jpg`,
    });
    setFeedback({ correct });
    setHintOpen(false);
    usedIndices.current.add(current.index);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current, reviewRef.current);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setHintLevel(0);
      setHintOpen(false);
      setCurrent(pickAirport(usedIndices.current));
    }
  };

  // Swap in a different random image without advancing the round or changing the
  // score. Only the shown airport and the hint state reset, so hints are fresh
  // for the new image. The guess input is keyed on current.index, so it clears too.
  const handleNewImage = () => {
    setCurrent((cur) => pickDifferentAirport(cur.index));
    setHintLevel(0);
    setHintOpen(false);
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

  const a = current.airport;
  // Hint 1 (region), Hint 2 (state).
  let hintText = null;
  if (hintLevel === 1) {
    const region = regionForState(a.state);
    hintText = region
      ? `This airport is in the ${region}.`
      : `This airport is in ${a.state}.`;
  } else if (hintLevel === 2) {
    hintText =
      a.code === "STL"
        ? "This airport is the home airport of the developer 👨‍💻"
        : `This airport is in ${a.state}.`;
  }

  const reveal = `${a.name} (${a.code}) — ${a.city}, ${a.state}`;

  // Enter or a click anywhere advances the round while the bubble is up.
  useAdvanceOnDismiss(!!feedback, handleNext);

  return (
    <div className="quiz-container state-quiz">
      <div className="state-quiz-header">
        <div className="sq-right">
          <div className="sq-box sq-round" role="status">Round {round}/{TOTAL_ROUNDS}</div>
          <div className="sq-box sq-score" role="status">Score: {score}</div>
          <button className="sq-box sq-restart" onClick={handleNewImage} disabled={!!feedback}>New Image</button>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button
          className="sq-box sq-home sq-emoji"
          onClick={onHome}
          aria-label="Back to home screen"
          title="Home"
        >
          <span aria-hidden="true">🏠</span>
        </button>
      </div>

      {/* Flexible stage: takes the room left between the top bar and the
          controls. The square frame inside scales down to fit whatever is
          available (capped at the desktop size), so the image never overflows
          on short or narrow screens. */}
      <div className="sat-stage">
        <div className="sat-frame">
          <SatelliteImage
            key={a.code}
            src={`${IMG_BASE}${a.code}.jpg`}
            alt="Satellite view of an airport"
          />
          {/* North compass indicator — satellite images are north-up. */}
          <svg className="sat-compass" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="rgba(255,255,255,0.75)" stroke="#111" strokeWidth="1.5" />
            <text x="18" y="11" textAnchor="middle" fontSize="9" fontWeight="700" fill="#111">N</text>
            <polygon points="18,13 13.5,24 18,21 22.5,24" fill="#111" />
          </svg>
        </div>
      </div>

      <div className="sat-controls-slot">
        <div className="quiz-controls">
          <p className="prompt" style={{ fontWeight: 700 }}>Which airport is shown?</p>
          <AirportGuessInput
            key={`${round}-${current.index}`}
            onSubmit={handleGuess}
            disabled={!!feedback}
            onHint={handleHint}
            onHintClose={closeHint}
            hintMaxed={hintLevel >= 2}
            hintLevel={hintLevel}
            hintOpen={hintOpen}
            hintText={hintText}
            getSuggestions={getSuggestions}
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

export default function AirportSatelliteQuiz({ onHome }) {
  const [gameKey, setGameKey] = useState(0);
  // { score, review } — null until the last round is answered.
  const [result, setResult] = useState(null);

  const restart = () => {
    setResult(null);
    setGameKey((k) => k + 1);
  };

  if (result) {
    return (
      <ResultsScreen
        score={result.score}
        total={TOTAL_ROUNDS}
        review={result.review}
        onPlayAgain={restart}
        onHome={onHome}
      />
    );
  }

  return (
    <Game
      key={gameKey}
      onHome={onHome}
      onFinish={(score, review) => setResult({ score, review })}
    />
  );
}
