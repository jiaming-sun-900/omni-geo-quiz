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

function Game({ onHome, onFinish }) {
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
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="btn-back" onClick={onHome}>&larr; Home</button>
        <h2>City Quiz</h2>
        <div className="quiz-stats">
          <span>Round {round}/{TOTAL_ROUNDS}</span>
          <span className="score-badge">Score: {score}</span>
        </div>
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

  if (finalScore !== null) {
    return (
      <ResultsScreen
        score={finalScore}
        total={TOTAL_ROUNDS}
        onPlayAgain={() => {
          setFinalScore(null);
          setGameKey((k) => k + 1);
        }}
        onHome={onHome}
      />
    );
  }

  return <Game key={gameKey} onHome={onHome} onFinish={setFinalScore} />;
}
