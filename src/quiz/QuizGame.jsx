import { useState, useRef } from "react";
import StateGuessInput from "../components/StateGuessInput";
import GuessInput from "../components/GuessInput";
import AirportGuessInput from "../components/AirportGuessInput";
import FeedbackBubble from "../components/FeedbackBubble";
import { useAdvanceOnDismiss } from "../utils/useAdvanceOnDismiss";

export const TOTAL_ROUNDS = 10;

// One game of ten rounds, for any mode. Everything mode-specific comes from the
// mode definition (`def`, see src/modes/), so the seven quizzes share one copy
// of the round logic instead of seven:
//
//   pool              the entries to ask about
//   prepare(item)?    turns an entry into the round's target (the State Quiz
//                     picks a random point inside the state); default: itself
//   Stage             MapStage or SatelliteStage, given the target
//   dot / revealStateId / image / imageAlt   what the stage draws
//   prompt, input, placeholder?, getSuggestions?   the question and the field
//   hints             functions target → hint; a hint is a string or
//                     { lead, items } for a list. Empty means no Hint button.
//   match(guess, t)   the answer check
//   reveal(t)         the answer as shown in the feedback bubble
//   review(t)         { answer, wiki, lat, lng, image?, zoom? } for ResultsScreen

// `exclude` is the entry currently on screen. Shuffle / New Image pass it, so a
// reshuffle can neither hand back the target already showing nor (while
// unplayed entries remain) one answered earlier in this game, which would then
// appear twice in the end-of-game review.
function pick(def, used, exclude = -1) {
  const selectable = def.pool.map((_, i) => i).filter((i) => i !== exclude);
  const fresh = selectable.filter((i) => !used.has(i));
  const from = fresh.length > 0 ? fresh : selectable;
  const index = from[Math.floor(Math.random() * from.length)];
  const item = def.pool[index];
  return { index, target: def.prepare ? def.prepare(item) : item };
}

function renderHint(hint) {
  if (hint == null || typeof hint === "string") return hint;
  return (
    <>
      {hint.lead}
      <ul>
        {hint.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

const hintAsText = (hint) =>
  hint == null || typeof hint === "string" ? hint : `${hint.lead} ${hint.items.join(", ")}`;

export default function QuizGame({ def, onHome, onFinish, overlays, toggleOverlay }) {
  const used = useRef(new Set());
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  // Seeded with an empty set rather than used.current: nothing is used yet on
  // mount, and reading a ref during render is a React rules violation.
  const [current, setCurrent] = useState(() => pick(def, new Set()));
  const [feedback, setFeedback] = useState(null);
  // Bumped on each Shuffle; with the round it keys the guess input, so a new
  // target remounts the field, which is what clears it.
  const [shuffleId, setShuffleId] = useState(0);
  // hintLevel: how many hints are out (0 = none). hintOpen: whether the bubble
  // is showing. The level survives dismissing the bubble, so reopening shows the
  // same hint. Both reset with each new target.
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  // What the screen-reader live region last said. The feedback and hint bubbles
  // mount with their text already in them, which many screen readers don't
  // announce; a region that is always present and changes its text, is.
  const [announcement, setAnnouncement] = useState("");
  const scoreRef = useRef(0);
  // One entry per answered round, handed to ResultsScreen at the end.
  const reviewRef = useRef([]);

  const t = current.target;
  const satellite = Boolean(def.image);
  const hintMax = def.hints.length;
  const hint = hintLevel > 0 ? def.hints[hintLevel - 1](t) : null;

  const handleGuess = (guess) => {
    const correct = def.match(guess, t);
    if (correct) {
      const next = score + 1;
      setScore(next);
      scoreRef.current = next;
    }
    // Pushed here, so a Shuffle that replaces the target without an answer is
    // correctly not recorded.
    reviewRef.current.push({ round, correct, guess, ...def.review(t) });
    const message = correct
      ? `Correct! ${def.reveal(t)}`
      : `Incorrect! The answer was ${def.reveal(t)}.`;
    setFeedback({ correct, message });
    setAnnouncement(message);
    setHintOpen(false);
    used.current.add(current.index);
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish(scoreRef.current, reviewRef.current);
      return;
    }
    setRound((r) => r + 1);
    setFeedback(null);
    setHintLevel(0);
    setHintOpen(false);
    setCurrent(pick(def, used.current));
  };

  // A new target without advancing the round or changing the score. The button
  // is disabled while the feedback bubble is up, and this deliberately does NOT
  // clear the feedback: doing so re-enabled the input on an already-scored
  // round, so answering again scored again and a 27/10 was reachable.
  const handleShuffle = () => {
    setCurrent(pick(def, used.current, current.index));
    setHintLevel(0);
    setHintOpen(false);
    setShuffleId((n) => n + 1);
  };

  // If the bubble was dismissed but a hint is already out, the first click just
  // reopens it; otherwise it reveals the next level.
  const handleHint = () => {
    if (!hintOpen && hintLevel > 0) {
      setHintOpen(true);
      return;
    }
    const level = Math.min(hintLevel + 1, hintMax);
    setHintLevel(level);
    setHintOpen(true);
    setAnnouncement(hintAsText(def.hints[level - 1](t)));
  };

  // Enter or a click anywhere advances the round while the bubble is up.
  useAdvanceOnDismiss(!!feedback, handleNext);

  const inputKey = `${round}-${shuffleId}`;
  let input;
  if (def.input === "state") {
    input = <StateGuessInput key={inputKey} onSubmit={handleGuess} disabled={!!feedback} />;
  } else if (def.input === "city") {
    input = <GuessInput key={inputKey} onSubmit={handleGuess} disabled={!!feedback} />;
  } else {
    input = (
      <AirportGuessInput
        key={inputKey}
        onSubmit={handleGuess}
        disabled={!!feedback}
        onHint={handleHint}
        onHintClose={() => setHintOpen(false)}
        hintMaxed={hintLevel >= hintMax}
        hintLevel={hintLevel}
        hintOpen={hintOpen}
        hintText={renderHint(hint)}
        hintMax={hintMax}
        // Left to the input's own defaults (the US airport list and its
        // placeholder) when the mode doesn't say.
        {...(def.getSuggestions && { getSuggestions: def.getSuggestions })}
        {...(def.placeholder && { placeholder: def.placeholder })}
      />
    );
  }

  const controls = (
    <div className="quiz-controls">
      <p className="prompt" style={satellite ? { fontWeight: 700 } : undefined}>
        {def.prompt}
      </p>
      {input}
    </div>
  );

  const { Stage } = def;
  return (
    <div className="quiz-container state-quiz">
      <div className="state-quiz-header">
        <div className="sq-right">
          <div className="sq-box sq-round" role="status">
            Round {round}/{TOTAL_ROUNDS}
          </div>
          <div className="sq-box sq-score" role="status">
            Score: {score}
          </div>
          <button className="sq-box sq-restart" onClick={handleShuffle} disabled={!!feedback}>
            {satellite ? "New Image" : "Shuffle"}
          </button>
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

      <Stage
        def={def}
        target={t}
        revealed={!!feedback}
        overlays={overlays}
        toggleOverlay={toggleOverlay}
      />

      {/* Satellite stages flex to fill the screen, so their controls sit in a
          slot that doesn't grow; on the map they stay in the main flow. */}
      {satellite ? <div className="sat-controls-slot">{controls}</div> : controls}

      {feedback && <FeedbackBubble correct={feedback.correct} message={feedback.message} />}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
