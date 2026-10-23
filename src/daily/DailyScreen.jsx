import { useEffect, useState } from "react";
import QuizGame from "../quiz/QuizGame";
import ResultsScreen from "../components/ResultsScreen";
import { buildPlan } from "./plan";
import { dateKey, dayNumber, msUntilTomorrow } from "./date";
import { getDay, saveDay, getStats } from "./store";
import { gridRows, shareText, share } from "./share";
import "./daily.css";

// Time to the next challenge, e.g. "5h 12m". Ticks every 30 seconds.
function Countdown() {
  const [ms, setMs] = useState(msUntilTomorrow);
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilTomorrow()), 30000);
    return () => clearInterval(id);
  }, []);
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const SHARE_LABEL = { copied: "Copied!", shared: "Shared!" };

function DailyResults({ day, record, onHome }) {
  const number = dayNumber(day);
  const { streak, played } = getStats(day);
  const [shareState, setShareState] = useState(null);
  const text = shareText(number, record.score, record.review);

  const onShare = async () => {
    setShareState(await share(text));
    // The label goes back to "Share" so a second share reads as possible.
    setTimeout(() => setShareState((s) => (s === "failed" ? s : null)), 2000);
  };

  return (
    <ResultsScreen
      heading={`Daily #${number}`}
      score={record.score}
      total={record.review.length}
      review={record.review}
      onHome={onHome}
    >
      <div className="daily-result">
        <p className="daily-grid" aria-hidden="true">
          {gridRows(record.review).map((row) => (
            <span key={row}>{row}</span>
          ))}
        </p>
        <button type="button" className="daily-play" onClick={onShare}>
          {SHARE_LABEL[shareState] ?? "Share"}
        </button>
        {/* No clipboard (an insecure context, or permission refused): show the
            text so it can still be copied by hand. */}
        {shareState === "failed" && <pre className="daily-share-text">{text}</pre>}
        <p className="daily-stats">
          Streak {streak} · Played {played} · Next in <Countdown />
        </p>
      </div>
    </ResultsScreen>
  );
}

// Today's ten rounds, the same for everyone on this date. One go per day:
// every answer is saved as it happens, so leaving and coming back resumes at
// the next round, and a finished day opens straight on its results.
export default function DailyScreen({ onHome }) {
  // Fixed at mount: a game started at 23:59 stays that day's game.
  const [day] = useState(() => dateKey());
  const [plan] = useState(() => buildPlan(day));
  const [record, setRecord] = useState(() => {
    const saved = getDay(day);
    // A save that recorded the last answer but not the finish still counts.
    return saved?.review.length >= plan.length ? { ...saved, status: "done" } : saved;
  });
  const [overlays, setOverlays] = useState({ rivers: false, mountains: false, borders: false });

  if (record?.status === "done") {
    return <DailyResults day={day} record={record} onHome={onHome} />;
  }

  return (
    <QuizGame
      plan={plan}
      initial={record ?? undefined}
      onAnswer={(review, score) => saveDay(day, { status: "playing", score, review: [...review] })}
      onFinish={(score, review) => {
        const done = { status: "done", score, review: [...review] };
        saveDay(day, done);
        setRecord(done);
      }}
      onHome={onHome}
      overlays={overlays}
      toggleOverlay={(key) => setOverlays((o) => ({ ...o, [key]: !o[key] }))}
    />
  );
}
