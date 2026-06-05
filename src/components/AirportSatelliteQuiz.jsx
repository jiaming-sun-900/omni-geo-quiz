import { useState, useRef, useEffect } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
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

// Accept the exact IATA code, or the city / full airport name via the shared
// fuzzy matcher (case-insensitive, typo tolerant).
function matchAirport(guess, airport) {
  if (guess.trim().toLowerCase() === airport.code.toLowerCase()) return true;
  if (fuzzyMatch(guess, airport.city)) return true;
  if (fuzzyMatch(guess, airport.name)) return true;
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

function Game({ onHome, onRestart, onFinish }) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickAirport(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = region hint, 2 = state hint (max). hintOpen tracks
  // bubble visibility; the level persists while dismissed. Both reset per round.
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const scoreRef = useRef(0);

  const handleGuess = (guess) => {
    const correct = matchAirport(guess, current.airport);
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
      setCurrent(pickAirport(usedIndices.current));
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
        key={a.code}
        src={`${IMG_BASE}${a.code}.jpg`}
        alt="Satellite view of an airport"
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
          <p className="prompt" style={{ fontWeight: 700 }}>Which airport is shown?</p>
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
