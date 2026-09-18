import { useState, useRef } from "react";
import USMap from "./USMap";
import { states } from "../data/usGeo";
import StateGuessInput from "./StateGuessInput";
import FeedbackBubble from "./FeedbackBubble";
import ResultsScreen from "./ResultsScreen";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";
import { getRandomPointInState } from "../utils/randomPoint";
import { matchesState } from "../data/states";

const TOTAL_ROUNDS = 10;

// Wikipedia resolves a bare state name for 48 of the 50 (it redirects e.g.
// "New York" to "New York (state)"). These two are disambiguation pages instead,
// so the review link spells out the article title.
const WIKI_TITLE = {
  Georgia: "Georgia (U.S. state)",
  Washington: "Washington (state)",
};

function wikiTitleForState(name) {
  return WIKI_TITLE[name] || name;
}

// The District of Columbia (FIPS 11) is drawn on the map but never asked. It is
// not a state, and at map scale it is unanswerable anyway: projected onto the
// widest desktop map it measures 5.2 x 6.3px, so the red dot sitting on it also
// covers Maryland and Virginia and the three are indistinguishable.
const QUIZ_POOL = states.filter((s) => s.id !== "11");

function pickRound(usedIds) {
  const available = QUIZ_POOL.filter((s) => !usedIds.has(s.id));
  const pool = available.length > 0 ? available : QUIZ_POOL;
  const state = pool[Math.floor(Math.random() * pool.length)];
  const point = getRandomPointInState(state);
  return { state, point };
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
  const usedIds = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  // Seeded with an empty set rather than usedIds.current: nothing is used yet
  // on mount, and reading a ref during render is a React rules violation.
  const [current, setCurrent] = useState(() => pickRound(new Set()));
  const [feedback, setFeedback] = useState(null);
  // Bumped on each Shuffle; used as the guess input's key so remounting clears
  // the field (the new target may repeat, so identity alone isn't reliable).
  const [shuffleId, setShuffleId] = useState(0);
  const scoreRef = useRef(0);
  // One entry per answered round, handed to ResultsScreen at the end.
  const reviewRef = useRef([]);

  const handleGuess = (guess) => {
    const correct = matchesState(guess, current.state.properties.name);
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
      answer: current.state.properties.name,
      wiki: wikiTitleForState(current.state.properties.name),
      lng: current.point[0],
      lat: current.point[1],
      // The coordinates are a random point inside the state, not a landmark, so
      // the default city-level zoom would open on an arbitrary field. Zoom 6
      // frames the whole state instead.
      zoom: 6,
    });
    setFeedback({ correct, answer: current.state.properties.name });
    usedIds.current.add(current.state.id);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current, reviewRef.current);
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

  // Enter or a click anywhere advances the round while the bubble is up.
  useAdvanceOnDismiss(!!feedback, handleNext);

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
  // { score, review } — null until the last round is answered.
  const [result, setResult] = useState(null);
  // Toggle state lives here (above the gameKey remount) so Start Over resets
  // score/round but preserves the overlay toggles — same as City/Airport.
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
