import { useState, useRef } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import SatelliteImage from "./SatelliteImage";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { airportWikiQuery } from "../utils/reviewLinks";
import { satelliteWorldAirports } from "../data/satellite-world-airports";
import { makeAirportMatcher } from "../utils/airportMatch";

const TOTAL_ROUNDS = 10;
const HINT_MAX = 4;

// Satellite images live in public/satellite/world-airports/{IATA}.jpg and are
// served under the configured base path.
const IMG_BASE = `${import.meta.env.BASE_URL}satellite/world-airports/`;

// Code, name, short name ("Heathrow", "Haneda", "Pudong") or, where it names a
// single airport, the city. Beijing, Shanghai, Tokyo, Osaka and London each have
// two airports in the roster, so for those the city alone is not accepted. See
// utils/airportMatch.js.
const matchAirport = makeAirportMatcher(satelliteWorldAirports, "iata");

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

// `excludeIndex` is the airport currently on screen. New Image passes it, so it
// can neither hand back the image already showing nor (while unplayed entries
// remain) one answered earlier in this game, which would then appear twice in
// the end-of-game review.
function pickAirport(usedIndices, excludeIndex = -1) {
  const selectable = satelliteWorldAirports
    .map((a, i) => ({ airport: a, index: i }))
    .filter(({ index }) => index !== excludeIndex);
  const available = selectable.filter(({ index }) => !usedIndices.has(index));
  const pool = available.length > 0 ? available : selectable;
  return pool[Math.floor(Math.random() * pool.length)];
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
    setCurrent(pickAirport(usedIndices.current, current.index));
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
