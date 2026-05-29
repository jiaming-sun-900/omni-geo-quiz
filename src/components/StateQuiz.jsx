import { useState, useRef, useEffect } from "react";
import USMap, { states } from "./USMap";
import StateGuessInput from "./StateGuessInput";
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

function Game({ onHome, onRestart, onFinish }) {
  const usedIds = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => pickRound(usedIds.current));
  const [feedback, setFeedback] = useState(null);
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

  const nextBtnRef = useRef(null);
  useEffect(() => {
    if (feedback) nextBtnRef.current?.focus({ preventScroll: true });
  }, [feedback]);

  return (
    <div className="quiz-container state-quiz">
      <div className="state-quiz-header">
        <div className="sq-right">
          <div className="sq-box sq-round">Round {round}/{TOTAL_ROUNDS}</div>
          <div className="sq-box sq-score">Score: {score}</div>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button className="sq-box sq-home" onClick={onHome}>🏠 Home</button>
        <button className="sq-box sq-restart" onClick={onRestart}>🔄 Start Over</button>
      </div>

      <USMap
        dotPosition={current.point}
        revealedStateId={feedback ? current.state.id : null}
      />

      <div className="quiz-controls">
        {!feedback ? (
          <>
            <p className="prompt">Which state is the red dot in?</p>
            <StateGuessInput onSubmit={handleGuess} disabled={false} />
          </>
        ) : (
          <div className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}>
            <p>
              {feedback.correct
                ? "Correct!"
                : `Incorrect! The answer was ${feedback.answer}.`}
            </p>
            <button
              ref={nextBtnRef}
              className="btn primary"
              onClick={handleNext}
            >
              {round >= TOTAL_ROUNDS ? "See Results" : "Next"}
            </button>
          </div>
        )}
      </div>
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

  return <Game key={gameKey} onHome={onHome} onRestart={restart} onFinish={setFinalScore} />;
}
