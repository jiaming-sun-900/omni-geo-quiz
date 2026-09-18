import { useState, useRef } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import SatelliteImage from "./SatelliteImage";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { airportWikiQuery } from "../utils/reviewLinks";
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

// Every valid answer of each kind, handed to the fuzzy matcher so a guess that
// exactly names a different airport is rejected rather than treated as a typo of
// this one. Without it the shared "International" suffix made 58 wrong pairs
// score as correct across 23 of the 60 targets.
const AIRPORT_ANSWERS = [
  ...satelliteWorldAirports.map((a) => a.name),
  ...satelliteWorldAirports.map((a) => a.iata),
];
const AIRPORT_CITIES = [...new Set(satelliteWorldAirports.map((a) => a.city))];

// Accept a match on any of three: the exact IATA code, the full airport name
// (fuzzy), or the city name (fuzzy). The IATA code and full name uniquely
// identify an airport. The city name is accepted only when the city has a single
// airport in the roster — for same-city pairs the player must disambiguate via
// the code or full name.
function matchAirport(guess, airport) {
  const g = guess.trim().toLowerCase();
  if (g === airport.iata.toLowerCase()) return true;
  if (fuzzyMatch(guess, airport.name, AIRPORT_ANSWERS)) return true;
  if (
    !AMBIGUOUS_CITIES.has(airport.city) &&
    fuzzyMatch(guess, airport.city, AIRPORT_CITIES)
  ) {
    return true;
  }
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
  // Seeded with an empty set rather than usedIndices.current: nothing is used
  // yet on mount, and reading a ref during render is a React rules violation.
  const [current, setCurrent] = useState(() => pickAirport(new Set()));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = continent, 2 = country, 3 = city, 4 = IATA code.
  // hintOpen tracks bubble visibility; the level persists while dismissed. Both
  // reset per round.
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
      answer: `${current.airport.name} (${current.airport.iata}) — ${current.airport.city}, ${current.airport.country}`,
      wiki: airportWikiQuery(current.airport.name),
      lat: current.airport.lat,
      lng: current.airport.lng,
      image: `${IMG_BASE}${current.airport.imageFile}`,
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
            key={a.iata}
            src={`${IMG_BASE}${a.imageFile}`}
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
            hintMaxed={hintLevel >= HINT_MAX}
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
