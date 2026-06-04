import { useState, useRef, useEffect } from "react";
import USMap from "./USMap";
import GuessInput from "./GuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { cities } from "../data/cities";
import { fuzzyMatch } from "../utils/fuzzyMatch";

const TOTAL_ROUNDS = 10;

function pickCity(usedIndices) {
  const available = cities
    .map((c, i) => ({ city: c, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : cities.map((c, i) => ({ city: c, index: i }));
  return pool[Math.floor(Math.random() * pool.length)];
}

function Game({
  onHome,
  onRestart,
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
  const [current, setCurrent] = useState(() => pickCity(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);

  const handleGuess = (guess) => {
    const correct = fuzzyMatch(guess, current.city.name);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    setFeedback({
      correct,
      answer: `${current.city.name}, ${current.city.state}`,
    });
    usedIndices.current.add(current.index);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setCurrent(pickCity(usedIndices.current));
    }
  };

  // While the bubble is up, the next Enter press or click anywhere advances the
  // round (or finishes). Listeners attach after this render, so the very event
  // that submitted the answer doesn't immediately dismiss the bubble. Reuses
  // handleNext, so the game logic is unchanged.
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
    <div className="quiz-container state-quiz">
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
        <GuessInput onSubmit={handleGuess} disabled={!!feedback} />
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
  const [finalScore, setFinalScore] = useState(null);
  // Toggle state lives here (above the gameKey remount) so Start Over resets
  // score/round but preserves the overlay toggles.
  const [showRivers, setShowRivers] = useState(false);
  const [showMountains, setShowMountains] = useState(false);
  const [showBorders, setShowBorders] = useState(false);

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
      showRivers={showRivers}
      setShowRivers={setShowRivers}
      showMountains={showMountains}
      setShowMountains={setShowMountains}
      showBorders={showBorders}
      setShowBorders={setShowBorders}
    />
  );
}
