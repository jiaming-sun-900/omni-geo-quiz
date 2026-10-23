import { useState, useRef } from "react";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import SatelliteImage from "./SatelliteImage";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { stateAbbreviations } from "../data/states";
import { satelliteCities } from "../data/satellite-cities";
import { cityAbbreviations, matchCity } from "../data/cities";

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
    // DC sits with Maryland. Without an entry here its region hint fell back to
    // "This city is in District of Columbia.", which named the answer.
    Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "MD", "DE", "DC"],
    // Phrased to fit "This city is in the …".
    "non-contiguous US": ["AK", "HI"],
  };
  for (const [region, abbrs] of Object.entries(regions)) {
    for (const abbr of abbrs) REGION_BY_ABBR[abbr] = region;
  }
}

// The data stores full state names; stateAbbreviations maps them (and DC) to
// the abbreviations the region table is keyed by.
function regionForState(stateName) {
  const abbr = stateAbbreviations[stateName];
  return REGION_BY_ABBR[abbr] || null;
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
    const abbr = cityAbbreviations[c.name]?.toLowerCase();
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

// `excludeIndex` is the city currently on screen. New Image passes it, so it
// can neither hand back the image already showing nor (while unplayed entries
// remain) one answered earlier in this game, which would then appear twice in
// the end-of-game review.
function pickCity(usedIndices, excludeIndex = -1) {
  const selectable = satelliteCities
    .map((c, i) => ({ city: c, index: i }))
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
  const [current, setCurrent] = useState(() => pickCity(new Set()));
  const [feedback, setFeedback] = useState(null);
  // hintLevel: 0 = none, 1 = region hint, 2 = state hint (max). hintOpen tracks
  // bubble visibility; the level persists while dismissed. Both reset per round.
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const scoreRef = useRef(0);
  // One entry per answered round, handed to ResultsScreen at the end.
  const reviewRef = useRef([]);

  const handleGuess = (guess) => {
    const correct = matchCity(guess, current.city);
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
      answer: `${current.city.name}, ${current.city.state}`,
      wiki: `${current.city.name}, ${current.city.state}`,
      lat: current.city.lat,
      lng: current.city.lng,
      image: `${IMG_BASE}${current.city.imageFile}`,
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
      setCurrent(pickCity(usedIndices.current));
    }
  };

  // Swap in a different random image without advancing the round or changing the
  // score. Only the shown city and the hint state reset, so hints are fresh for
  // the new image. The guess input is keyed on current.index, so it clears too.
  const handleNewImage = () => {
    setCurrent(pickCity(usedIndices.current, current.index));
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

  const c = current.city;
  // Hint 1 (region), Hint 2 (state).
  let hintText = null;
  if (hintLevel === 1) {
    const region = regionForState(c.state);
    hintText = region
      ? `This city is in the ${region}.`
      : `This city is in ${c.state}.`;
  } else if (hintLevel === 2) {
    // DC's "state" is the answer itself, so its second hint has to be a clue
    // rather than the state name.
    hintText =
      c.name === "St. Louis"
        ? "This city is the home of the developer of this game 👨‍💻"
        : c.state === "District of Columbia"
          ? "This city is not in any state."
          : `This city is in ${c.state}.`;
  }

  const reveal = `${c.name}, ${c.state}`;

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
            key={c.imageFile}
            src={`${IMG_BASE}${c.imageFile}`}
            alt="Satellite view of a city"
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
          <p className="prompt" style={{ fontWeight: 700 }}>
            Which city is shown in the satellite image?
          </p>
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
