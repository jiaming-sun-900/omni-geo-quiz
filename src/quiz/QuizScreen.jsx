import { useState } from "react";
import QuizGame, { TOTAL_ROUNDS } from "./QuizGame";
import ResultsScreen from "../components/ResultsScreen";

// A mode's whole screen: the game, then its results. Play Again bumps
// `gameKey`, which remounts QuizGame for a clean restart. The map overlays live
// here, above that remount, so a new game resets the score and round but keeps
// Rivers / Mountains / State Borders as the player set them.
export default function QuizScreen({ def, onHome }) {
  const [gameKey, setGameKey] = useState(0);
  // { score, review }; null until the last round is answered.
  const [result, setResult] = useState(null);
  const [overlays, setOverlays] = useState({ rivers: false, mountains: false, borders: false });

  if (result) {
    return (
      <ResultsScreen
        score={result.score}
        total={TOTAL_ROUNDS}
        review={result.review}
        onPlayAgain={() => {
          setResult(null);
          setGameKey((k) => k + 1);
        }}
        onHome={onHome}
      />
    );
  }

  return (
    <QuizGame
      key={gameKey}
      def={def}
      onHome={onHome}
      onFinish={(score, review) => setResult({ score, review })}
      overlays={overlays}
      toggleOverlay={(key) => setOverlays((o) => ({ ...o, [key]: !o[key] }))}
    />
  );
}
