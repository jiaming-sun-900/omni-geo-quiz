import { useEffect, useRef } from "react";

// Chrome that owns its own clicks. Everything else on the screen counts as
// "click anywhere to continue", but a click on the Rivers/Mountains/Borders
// toggles, on the header boxes (Shuffle / New Image) or on the Home button used
// to do its own job AND advance the round in the same gesture, which silently
// burned a round whenever you flipped an overlay to double-check an answer.
const OWN_CLICK = ".sq-toggles, .state-quiz-header, .sq-bottom-left";

// While the feedback bubble is up, the next Enter press or click advances the
// round (or finishes the game).
//
// The listeners are attached by an effect keyed on `active`, so they go on after
// the render that raised the bubble — the very keypress or click that submitted
// the answer therefore can't dismiss it immediately. `onAdvance` is read through
// a ref that is refreshed after every render, so the handler always calls the
// current closure (with the current round) without having to re-attach.
export function useAdvanceOnDismiss(active, onAdvance) {
  const advanceRef = useRef(onAdvance);

  useEffect(() => {
    advanceRef.current = onAdvance;
  });

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault();
        advanceRef.current();
      }
    };
    const onClick = (e) => {
      if (e.target?.closest?.(OWN_CLICK)) return;
      advanceRef.current();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [active]);
}
