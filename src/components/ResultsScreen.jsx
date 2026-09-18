import { wikipediaUrl, satelliteMapUrl } from "../utils/reviewLinks";

// One reviewed round. `item` is built by each quiz's Game component (see
// buildReviewEntry usage there) and always carries: round, correct, guess,
// answer, wiki (Wikipedia query), lat, lng, and optionally image and zoom.
function ReviewRow({ item }) {
  return (
    <li className={`review-row${item.correct ? " is-correct" : " is-missed"}`}>
      <span className="review-round">{item.round}</span>

      {item.image ? (
        <img
          className="review-thumb"
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          width="64"
          height="64"
        />
      ) : (
        <span className="review-mark" aria-hidden="true">
          {item.correct ? "✓" : "✗"}
        </span>
      )}

      <div className="review-body">
        <span className="review-answer">{item.answer}</span>
        {!item.correct && (
          <span className="review-guess">
            You said <em>{item.guess}</em>
          </span>
        )}
        <span className="review-links">
          <a
            href={wikipediaUrl(item.wiki)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            📖 Wikipedia
          </a>
          <a
            href={satelliteMapUrl(item.lat, item.lng, item.zoom)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ Map
          </a>
        </span>
      </div>
    </li>
  );
}

export default function ResultsScreen({
  score,
  total,
  review = [],
  onPlayAgain,
  onHome,
}) {
  const pct = Math.round((score / total) * 100);

  let message;
  if (pct === 100) message = "Perfect score!";
  else if (pct >= 80) message = "Great job!";
  else if (pct >= 50) message = "Not bad!";
  else message = "Keep practicing!";

  const missed = review.filter((r) => !r.correct).length;
  // Misses first (that's what the review is for), each group still in round
  // order — Array.prototype.sort is stable, so the slice keeps its order.
  const ordered = [...review].sort(
    (a, b) => Number(a.correct) - Number(b.correct)
  );

  return (
    <div className="results-screen">
      <div className="results-summary">
        <h2>Results</h2>
        <div className="score-display">
          <span className="score-big">{score}/{total}</span>
        </div>
        <p className="results-message">{message}</p>
        <div className="results-buttons">
          <button
            className="results-btn results-home"
            onClick={onPlayAgain}
            aria-label="Play again"
            title="Play again"
          >
            <span aria-hidden="true">🔄</span>
          </button>
          <button
            className="results-btn results-home"
            onClick={onHome}
            aria-label="Back to home screen"
            title="Home"
          >
            <span aria-hidden="true">🏠</span>
          </button>
        </div>
      </div>

      {ordered.length > 0 && (
        <div className="results-review">
          <div className="review-head">
            <h3>Review</h3>
            <span className="review-count">
              {missed === 0
                ? "Nothing missed"
                : `${missed} missed`}
            </span>
          </div>
          <ul className="review-list">
            {ordered.map((item) => (
              <ReviewRow key={item.round} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
