import { useState, useRef } from "react";
import USMap from "./USMap";
import GuessInput from "./GuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { cities, allCityNames } from "../data/cities";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;

// `excludeIndex` is the city currently on screen. Shuffle passes it so a
// reshuffle can't hand back the dot you are already looking at.
function pickCity(usedIndices, excludeIndex = -1) {
  const selectable = cities
    .map((c, i) => ({ city: c, index: i }))
    .filter(({ index }) => index !== excludeIndex);
  const available = selectable.filter(({ index }) => !usedIndices.has(index));
  const pool = available.length > 0 ? available : selectable;
  return pool[Math.floor(Math.random() * pool.length)];
}

function Game({
  onHome,
  onFinish,
  showRivers,
  setShowRivers,
  showMountains,
  setShowMountains,
  showBorders,
  setShowBorders,
}) {
  const usedIndices = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  // Seeded with an empty set rather than usedIndices.current: nothing is used
  // yet on mount, and reading a ref during render is a React rules violation.
  const [current, setCurrent] = useState(() => pickCity(new Set()));
  const [feedback, setFeedback] = useState(null);
  // Bumped on each Shuffle; used as the guess input's key so remounting clears
  // the field (the new target may repeat, so identity alone isn't reliable).
  const [shuffleId, setShuffleId] = useState(0);
  const scoreRef = useRef(0);
  // One entry per answered round, handed to ResultsScreen at the end.
  const reviewRef = useRef([]);

  const handleGuess = (guess) => {
    const correct = fuzzyMatch(guess, current.city.name, allCityNames);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    // Recorded for the end-of-game review (see ResultsScreen).
    reviewRef.current.push({
      round,
      correct,
      guess,
      answer: `${current.city.name}, ${current.city.state}`,
      // Wikipedia redirects "Denver, Colorado" to "Denver", so the
      // City, State form resolves for both naming conventions.
      wiki: `${current.city.name}, ${current.city.state}`,
      lat: current.city.lat,
      lng: current.city.lng,
    });
    setFeedback({
      correct,
      answer: `${current.city.name}, ${current.city.state}`,
    });
    usedIndices.current.add(current.index);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current, reviewRef.current);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setCurrent(pickCity(usedIndices.current));
    }
  };

  // Generate a new random target without advancing the round or changing the
  // score. The input clears via the bumped shuffle key. Feedback is deliberately
  // NOT cleared here — and the button is disabled while it is up. Clearing it
  // re-enabled the input on an already-scored round, so answering again scored
  // again without the round advancing: a 27/10 "Perfect score!" was reachable.
  const handleShuffle = () => {
    setCurrent(pickCity(usedIndices.current, current.index));
    setShuffleId((n) => n + 1);
  };

  // Enter or a click anywhere advances the round while the bubble is up.
  useAdvanceOnDismiss(!!feedback, handleNext);

  return (
    <div className="quiz-container state-quiz">
      <div className="state-quiz-header">
        <div className="sq-right">
          <div className="sq-box sq-round" role="status">Round {round}/{TOTAL_ROUNDS}</div>
          <div className="sq-box sq-score" role="status">Score: {score}</div>
          <button className="sq-box sq-restart" onClick={handleShuffle} disabled={!!feedback}>Shuffle</button>
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

      <USMap
        dotPosition={[current.city.lng, current.city.lat]}
        showRivers={showRivers}
        showMountains={showMountains}
        showBorders={showBorders}
      />

      <div className="sq-toggles">
        <div className="sq-toggle">
          <span className="sq-toggle-label">Rivers</span>
          <button
            type="button"
            role="switch"
            aria-label="Rivers"
            aria-checked={showRivers}
            className={`push-toggle ${showRivers ? "on" : ""}`}
            onClick={() => setShowRivers((v) => !v)}
          >
            {showRivers ? "ON" : "OFF"}
          </button>
        </div>
        <div className="sq-toggle">
          <span className="sq-toggle-label">Mountains</span>
          <button
            type="button"
            role="switch"
            aria-label="Mountains"
            aria-checked={showMountains}
            className={`push-toggle ${showMountains ? "on" : ""}`}
            onClick={() => setShowMountains((v) => !v)}
          >
            {showMountains ? "ON" : "OFF"}
          </button>
        </div>
        <div className="sq-toggle">
          <span className="sq-toggle-label">State Borders</span>
          <button
            type="button"
            role="switch"
            aria-label="State Borders"
            aria-checked={showBorders}
            className={`push-toggle ${showBorders ? "on" : ""}`}
            onClick={() => setShowBorders((v) => !v)}
          >
            {showBorders ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="quiz-controls">
        <p className="prompt">Which city is the red dot in?</p>
        {/* Keyed on round + shuffle so a new target remounts the field, which is
            what clears it (see GuessInput). */}
        <GuessInput
          key={`${round}-${shuffleId}`}
          onSubmit={handleGuess}
          disabled={!!feedback}
        />
      </div>

      {feedback && (
        <FeedbackBubble
          correct={feedback.correct}
          message={
            feedback.correct
              ? `Correct! ${current.city.name}, ${current.city.state}`
              : `Incorrect! The answer was ${feedback.answer}.`
          }
        />
      )}
    </div>
  );
}

export default function CityQuiz({ onHome }) {
  const [gameKey, setGameKey] = useState(0);
  // { score, review } — null until the last round is answered.
  const [result, setResult] = useState(null);
  // Toggle state lives here (above the gameKey remount) so Start Over resets
  // score/round but preserves the overlay toggles.
  const [showRivers, setShowRivers] = useState(false);
  const [showMountains, setShowMountains] = useState(false);
  const [showBorders, setShowBorders] = useState(false);

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
      showRivers={showRivers}
      setShowRivers={setShowRivers}
      showMountains={showMountains}
      setShowMountains={setShowMountains}
      showBorders={showBorders}
      setShowBorders={setShowBorders}
    />
  );
}
