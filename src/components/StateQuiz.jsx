import { useState, useRef, useEffect } from "react";
import USMap, { states } from "./USMap";
import StateGuessInput from "./StateGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { getRandomPointInState } from "../utils/randomPoint";
import { matchesState } from "../data/states";

const TOTAL_ROUNDS = 10;

function pickRound(usedIds) {
  const available = states.filter((s) => !usedIds.has(s.id));
  const pool = available.length > 0 ? available : states;
  const state = pool[Math.floor(Math.random() * pool.length)];
  const point = getRandomPointInState(state);
  return { state, point };
}

function Game({ onHome, onFinish }) {
  const usedIds = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickRound(usedIds.current));
  const [feedback, setFeedback] = useState(null);
  const [showRivers, setShowRivers] = useState(false);
  const [showMountains, setShowMountains] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  // Bumped on each Shuffle; used as the guess input's key so remounting clears
  // the field (the new target may repeat, so identity alone isn't reliable).
  const [shuffleId, setShuffleId] = useState(0);
  const scoreRef = useRef(0);

  const handleGuess = (guess) => {
    const correct = matchesState(guess, current.state.properties.name);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    setFeedback({ correct, answer: current.state.properties.name });
    usedIds.current.add(current.state.id);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current);
    } else {
      setRound((r) => r + 1);
      setFeedback(null);
      setCurrent(pickRound(usedIds.current));
    }
  };

  // Generate a new random target without advancing the round or changing the
  // score. Clears feedback, and the input via the bumped shuffle key.
  const handleShuffle = () => {
    setCurrent(pickRound(usedIds.current));
    setFeedback(null);
    setShuffleId((n) => n + 1);
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
          <button className="sq-box sq-restart" onClick={handleShuffle}>Shuffle</button>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button className="sq-box sq-home sq-emoji" onClick={onHome}>🏠</button>
      </div>

      <USMap
        dotPosition={current.point}
        revealedStateId={feedback ? current.state.id : null}
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
        <p className="prompt">Which state is the red dot in?</p>
        <StateGuessInput key={shuffleId} onSubmit={handleGuess} disabled={!!feedback} />
      </div>

      {feedback && (
        <FeedbackBubble
          correct={feedback.correct}
          message={
            feedback.correct
              ? "Correct!"
              : `Incorrect! The answer was ${feedback.answer}.`
          }
        />
      )}
    </div>
  );
}

export default function StateQuiz({ onHome }) {
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

  return <Game key={gameKey} onHome={onHome} onFinish={setFinalScore} />;
}
