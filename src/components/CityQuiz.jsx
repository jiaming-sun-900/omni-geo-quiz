import { useState, useRef, useEffect } from "react";
import USMap from "./USMap";
import GuessInput from "./GuessInput";
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

function Game({ onHome, onRestart, onFinish }) {
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
          <button className="sq-box sq-restart sq-emoji" onClick={onRestart}>🔄</button>
        </div>
      </div>

      <div className="sq-bottom-left">
        <button className="sq-box sq-home sq-emoji" onClick={onHome}>🏠</button>
      </div>

      <USMap dotPosition={[current.city.lng, current.city.lat]} />

      <div className="quiz-controls">
        {!feedback ? (
          <>
            <p className="prompt">Which city is the red dot on?</p>
            <GuessInput onSubmit={handleGuess} disabled={false} />
          </>
        ) : (
          <div className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}>
            <p>
              {feedback.correct
                ? `Correct! ${current.city.name}, ${current.city.state}`
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

export default function CityQuiz({ onHome }) {
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
