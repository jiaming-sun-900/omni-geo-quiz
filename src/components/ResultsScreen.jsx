export default function ResultsScreen({ score, total, onPlayAgain, onHome }) {
  const pct = Math.round((score / total) * 100);

  let message;
  if (pct === 100) message = "Perfect score!";
  else if (pct >= 80) message = "Great job!";
  else if (pct >= 50) message = "Not bad!";
  else message = "Keep practicing!";

  return (
    <div className="results-screen">
      <h2>Results</h2>
      <div className="score-display">
        <span className="score-big">{score}/{total}</span>
        <span className="score-pct">{pct}%</span>
      </div>
      <p className="results-message">{message}</p>
      <div className="results-buttons">
        <button className="btn primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn secondary" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
