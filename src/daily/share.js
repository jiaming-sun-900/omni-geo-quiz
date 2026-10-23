import { isTouchDevice } from "../utils/isTouch";

// One square per round: green answered without a hint, yellow answered after
// one, red missed.
export function roundSquare(entry) {
  if (!entry.correct) return "🟥";
  return entry.hints > 0 ? "🟨" : "🟩";
}

// Two rows of five, matching the plan: the US round, then the world round.
export function gridRows(review) {
  const squares = review.map(roundSquare);
  return [squares.slice(0, 5).join(""), squares.slice(5).join("")].filter(Boolean);
}

export function shareText(number, score, review) {
  const url = `${window.location.origin}${import.meta.env.BASE_URL}daily`;
  return [`Omni Geo Quiz Daily #${number} · ${score}/${review.length}`, ...gridRows(review), url].join(
    "\n"
  );
}

// The phone share sheet where there is one, the clipboard otherwise. Resolves
// to "shared", "copied", "cancelled" or "failed"; on "failed" the caller shows
// the text so it can be copied by hand.
export async function share(text) {
  if (navigator.share && isTouchDevice()) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
