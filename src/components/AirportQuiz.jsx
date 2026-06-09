import { useState, useRef, useEffect } from "react";
import USMap from "./USMap";
import AirportGuessInput from "./AirportGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { airports, matchAirport } from "../data/airports";

const TOTAL_ROUNDS = 10;

function pickAirport(usedIndices) {
  const available = airports
    .map((a, i) => ({ airport: a, index: i }))
    .filter(({ index }) => !usedIndices.has(index));
  const pool =
    available.length > 0
      ? available
      : airports.map((a, i) => ({ airport: a, index: i }));
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
  const [current, setCurrent] = useState(() => pickAirport(usedIndices.current));
  const [feedback, setFeedback] = useState(null);
  // Bumped on each Shuffle; used as the guess input's key so remounting clears
  // the field (the new target may repeat, so identity alone isn't reliable).
  const [shuffleId, setShuffleId] = useState(0);
  // hintLevel: 0 = none shown yet, 1 = airline hub hint, 2 = state hint (max).
  // hintOpen: whether the bubble is currently visible. The level persists even
  // while the bubble is dismissed, so reopening shows the same hint. Both reset
  // each round.
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

  // Generate a new random target without advancing the round or changing the
  // score. Resets the hint, clears feedback, and clears the input via the
  // bumped shuffle key.
  const handleShuffle = () => {
    setCurrent(pickAirport(usedIndices.current));
    setFeedback(null);
    setHintLevel(0);
    setHintOpen(false);
    setShuffleId((n) => n + 1);
  };

  // Hint button: if the bubble was dismissed but a hint is already revealed,
  // the first click just reopens it at the same level; otherwise it advances to
  // the next level (capped at 2). Progression itself is unchanged.
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
  // Hint 1 (airlines): one airline -> single line; multiple -> bullet list.
  // Hint 2 (state): single line.
  let hintText = null;
  if (hintLevel === 1) {
    hintText =
      a.hubs.length === 1 ? (
        `This airport is a hub for ${a.hubs[0]}.`
      ) : (
        <>
          This airport is a hub for:
          <ul style={{ margin: "0.45rem 0 0", paddingLeft: "1.4rem" }}>
            {a.hubs.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </>
      );
  } else if (hintLevel === 2) {
    hintText = `This airport is in ${a.state}.`;
  }

  const reveal = `${a.name} (${a.code}) — ${a.city}, ${a.state}`;

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
    <div
      className="quiz-container state-quiz"
      style={{ minHeight: "100vh", background: "#FAF7F4" }}
    >
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
        dotPosition={[a.lng, a.lat]}
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
        <p className="prompt">Which airport is marked by the red dot?</p>
        <AirportGuessInput
          key={shuffleId}
          onSubmit={handleGuess}
          disabled={!!feedback}
          onHint={handleHint}
          onHintClose={closeHint}
          hintDisabled={hintLevel >= 2}
          hintLevel={hintLevel}
          hintOpen={hintOpen}
          hintText={hintText}
        />
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

export default function AirportQuiz({ onHome }) {
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
