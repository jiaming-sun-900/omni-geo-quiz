import { useState, useRef, useEffect } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { satelliteWorldCities } from "../data/satellite-world-cities";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;
const HINT_MAX = 4;

// Satellite images live in public/satellite/world-cities/{imageFile} and are
// served under the configured base path.
const IMG_BASE = `${import.meta.env.BASE_URL}satellite/world-cities/`;

// Common abbreviations the quiz accepts, keyed by city name. Only abbreviations
// in genuine common usage belong here — fuzzyMatch already handles typos and the
// full names.
const CITY_ABBR = {
  "Hong Kong": "HK",
  "Kuala Lumpur": "KL",
};

// Accept the city name (case-insensitive, typo tolerant via fuzzy match) or one
// of the common abbreviations above. Validation is on the city name only, not the
// country. The autocomplete fills "City, Country", so a trailing ", Country" is
// stripped before matching.
function matchCity(guess, city) {
  const raw = guess.trim();
  const cityPart = raw.includes(",") ? raw.slice(0, raw.indexOf(",")).trim() : raw;
  const abbr = CITY_ABBR[city.name];
  if (abbr && cityPart.toLowerCase() === abbr.toLowerCase()) return true;
  if (fuzzyMatch(cityPart, city.name)) return true;
  return false;
}

// Suggestions matched on city name or its abbreviation, formatted "City, Country".
// Matches that START with the query rank ahead of those that merely CONTAIN it.
// The "City, Country" string doubles as the fill value and is stripped back to
// the city name on submit.
function getSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const c of satelliteWorldCities) {
    const name = c.name.toLowerCase();
    const abbr = CITY_ABBR[c.name]?.toLowerCase();
    if (name.startsWith(q) || abbr?.startsWith(q)) {
      starts.push(c);
    } else if (name.includes(q) || abbr?.includes(q)) {
      contains.push(c);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((c) => ({
    code: `${c.name}, ${c.country}`,
    label: `${c.name}, ${c.country}`,
  }));
}

function pickCity(usedIndices) {
  const available = satelliteWorldCities
    .map((c, i) => ({ city: c, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : satelliteWorldCities.map((c, i) => ({ city: c, index: i }));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Pick a random city guaranteed to differ from the one currently shown. Used by
// the "New Image" button, which doesn't touch the used-index set or the round.
function pickDifferentCity(currentIndex) {
  let pick;
  do {
    const i = Math.floor(Math.random() * satelliteWorldCities.length);
    pick = { city: satelliteWorldCities[i], index: i };
  } while (pick.index === currentIndex && satelliteWorldCities.length > 1);
  return pick;
}

// First letter of the city's primary name. Multi-word names use the first
// letter of the first word (Hong Kong -> H, Cape Town -> C, La Paz -> L).
function firstLetter(name) {
  return name.trim()[0].toUpperCase();
}

function Game({ onHome, onFinish }) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickCity(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = region, 2 = country, 3 = first letter, 4 = funFact.
  // hintOpen tracks bubble visibility; the level persists while dismissed. Both
  // reset per round.
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

  // Swap in a different random image without advancing the round or changing the
  // score. Only the shown city and the hint state reset, so hints are fresh for
  // the new image. The guess input is keyed on current.index, so it clears too.
  const handleNewImage = () => {
    setCurrent((cur) => pickDifferentCity(cur.index));
    setHintLevel(0);
    setHintOpen(false);
  };

  // First click reopens an already-revealed hint; otherwise advance (capped at HINT_MAX).
  const handleHint = () => {
    if (!hintOpen && hintLevel > 0) {
      setHintOpen(true);
      return;
    }
    setHintLevel((l) => Math.min(l + 1, HINT_MAX));
    setHintOpen(true);
  };

  const closeHint = () => setHintOpen(false);

  const c = current.city;
  // Hint 1 (region), Hint 2 (country), Hint 3 (first letter), Hint 4 (fun fact).
  let hintText = null;
  if (hintLevel === 1) {
    hintText = `This city is in ${c.region}.`;
  } else if (hintLevel === 2) {
    hintText = `This city is in ${c.country}.`;
  } else if (hintLevel === 3) {
    hintText = `The city's name starts with "${firstLetter(c.name)}".`;
  } else if (hintLevel === 4) {
    hintText = c.funFact;
  }

  const reveal = `${c.name}, ${c.country}`;

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
          <button className="sq-box sq-restart" onClick={handleNewImage}>New Image</button>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button className="sq-box sq-home sq-emoji" onClick={onHome}>🏠</button>
      </div>

      {/* Top spacer; paired with the equal-flex controls wrapper below so the
          image keeps its original vertical position while the controls center
          in the gap beneath it. */}
      <div style={{ flex: 1 }} />

      <div
        style={{
          position: "relative",
          alignSelf: "center",
          flexShrink: 0,
          width: "min(68vh, 88vw)",
          height: "min(68vh, 88vw)",
        }}
      >
        <img
          key={c.imageFile}
          src={`${IMG_BASE}${c.imageFile}`}
          alt="Satellite view of a city"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* North compass indicator — satellite images are north-up. */}
        <svg
          width="56"
          height="56"
          viewBox="0 0 36 36"
          aria-hidden="true"
          style={{ position: "absolute", top: "8px", right: "8px", pointerEvents: "none" }}
        >
          <circle cx="18" cy="18" r="16" fill="rgba(255,255,255,0.75)" stroke="#111" strokeWidth="1.5" />
          <text x="18" y="11" textAnchor="middle" fontSize="9" fontWeight="700" fill="#111">N</text>
          <polygon points="18,13 13.5,24 18,21 22.5,24" fill="#111" />
        </svg>
      </div>

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
            key={current.index}
            onSubmit={handleGuess}
            disabled={!!feedback}
            onHint={handleHint}
            onHintClose={closeHint}
            hintDisabled={hintLevel >= HINT_MAX}
            hintLevel={hintLevel}
            hintOpen={hintOpen}
            hintText={hintText}
            hintMax={HINT_MAX}
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

export default function WorldCitySatelliteQuiz({ onHome }) {
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
      onFinish={setFinalScore}
    />
  );
}
