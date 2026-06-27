import { useState, useRef, useEffect } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { satelliteWorldAirports } from "../data/satellite-world-airports";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;
const HINT_MAX = 4;

// Satellite images live in public/satellite/world-airports/{IATA}.jpg and are
// served under the configured base path.
const IMG_BASE = `${import.meta.env.BASE_URL}satellite/world-airports/`;

// Cities served by more than one airport in the roster (Beijing PEK/PKX,
// Shanghai PVG/SHA, Tokyo HND/NRT, Osaka KIX/ITM, London LHR/LGW). For these the
// city name alone is ambiguous, so a city-only guess is NOT accepted — the player
// must give the IATA code or the specific airport name (both selectable from the
// autocomplete). Derived from the data so it stays correct if the roster changes.
const AMBIGUOUS_CITIES = (() => {
  const counts = new Map();
  for (const a of satelliteWorldAirports) {
    counts.set(a.city, (counts.get(a.city) || 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([city]) => city));
})();

// Accept a match on any of three: the exact IATA code, the full airport name
// (fuzzy), or the city name (fuzzy). The IATA code and full name uniquely
// identify an airport. The city name is accepted only when the city has a single
// airport in the roster — for same-city pairs the player must disambiguate via
// the code or full name.
function matchAirport(guess, airport) {
  const g = guess.trim().toLowerCase();
  if (g === airport.iata.toLowerCase()) return true;
  if (fuzzyMatch(guess, airport.name)) return true;
  if (!AMBIGUOUS_CITIES.has(airport.city) && fuzzyMatch(guess, airport.city)) return true;
  return false;
}

// Suggestions matched on IATA code, city, or airport name, formatted
// "HKG — Hong Kong International". The airport name in the label lets same-city
// pairs (e.g. Beijing PEK vs PKX) be told apart. Matches that START with the
// query rank ahead of those that merely CONTAIN it. The fill value (code) is the
// IATA code, so selecting any suggestion submits an unambiguous answer.
function getSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const a of satelliteWorldAirports) {
    const iata = a.iata.toLowerCase();
    const city = a.city.toLowerCase();
    const name = a.name.toLowerCase();
    if (iata.startsWith(q) || city.startsWith(q) || name.startsWith(q)) {
      starts.push(a);
    } else if (iata.includes(q) || city.includes(q) || name.includes(q)) {
      contains.push(a);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((a) => ({
    code: a.iata,
    label: `${a.iata} — ${a.name}`,
  }));
}

function pickAirport(usedIndices) {
  const available = satelliteWorldAirports
    .map((a, i) => ({ airport: a, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : satelliteWorldAirports.map((a, i) => ({ airport: a, index: i }));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Pick a random airport guaranteed to differ from the one currently shown. Used
// by the "New Image" button, which doesn't touch the used-index set or the round.
function pickDifferentAirport(currentIndex) {
  let pick;
  do {
    const i = Math.floor(Math.random() * satelliteWorldAirports.length);
    pick = { airport: satelliteWorldAirports[i], index: i };
  } while (pick.index === currentIndex && satelliteWorldAirports.length > 1);
  return pick;
}

function Game({ onHome, onFinish }) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickAirport(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = continent, 2 = country, 3 = city, 4 = IATA code.
  // hintOpen tracks bubble visibility; the level persists while dismissed. Both
  // reset per round.
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

  // Swap in a different random image without advancing the round or changing the
  // score. Only the shown airport and the hint state reset, so hints are fresh
  // for the new image. The guess input is keyed on current.index, so it clears too.
  const handleNewImage = () => {
    setCurrent((cur) => pickDifferentAirport(cur.index));
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

  const a = current.airport;
  // Hint 1 (continent), Hint 2 (country), Hint 3 (city), Hint 4 (IATA code).
  let hintText = null;
  if (hintLevel === 1) {
    hintText = `This airport is in ${a.region}.`;
  } else if (hintLevel === 2) {
    hintText = `This airport is in ${a.country}.`;
  } else if (hintLevel === 3) {
    hintText = `This airport serves ${a.city}.`;
  } else if (hintLevel === 4) {
    hintText = `Its IATA code is ${a.iata}.`;
  }

  const reveal = `${a.name} (${a.iata}) — ${a.city}, ${a.country}`;

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
          key={a.iata}
          src={`${IMG_BASE}${a.imageFile}`}
          alt="Satellite view of an airport"
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
          <p className="prompt" style={{ fontWeight: 700 }}>Which airport is shown?</p>
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
            placeholder="IATA code, airport, or city..."
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

export default function WorldAirportSatelliteQuiz({ onHome }) {
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
