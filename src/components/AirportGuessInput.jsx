import { useState, useRef, useEffect } from "react";
import { getAirportSuggestions } from "../data/airports";
import { isTouchDevice } from "../utils/isTouch";

// Floating tooltip bubble that hovers ABOVE the Hint button. Absolutely
// positioned and given a high z-index so it overlaps page content instead of
// pushing anything down or causing scroll. Fades/rises in whenever the hint
// changes (keyed by animKey, so passing JSX content doesn't re-trigger the fade
// on every render). Styling lives in App.css under `.hint-bubble`, which also
// re-anchors the bubble on phone widths where the Hint button is too narrow and
// too far left for a centered bubble to stay on screen.
function HintBubble({ animKey, content }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [animKey]);

  return (
    <div className={`hint-bubble${shown ? " is-shown" : ""}`} role="status">
      {content}
      {/* little tail pointing down at the button */}
      <span className="hint-bubble-tail" />
    </div>
  );
}

export default function AirportGuessInput({
  onSubmit,
  disabled,
  onHint,
  onHintClose,
  hintDisabled,
  hintLevel,
  hintOpen,
  hintText,
  hintMax = 2,
  getSuggestions = getAirportSuggestions,
  placeholder = "IATA code or city...",
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef();
  const wrapperRef = useRef();
  const hintWrapRef = useRef();

  // While the hint bubble is open, a click anywhere outside the Hint button
  // closes it (the level is preserved by the parent). The button's own click is
  // ignored here so it can toggle/advance the hint itself. The listener attaches
  // after the opening click has finished, so it doesn't immediately re-close.
  useEffect(() => {
    if (!hintOpen) return;
    const onDocClick = (e) => {
      if (hintWrapRef.current?.contains(e.target)) return;
      onHintClose?.();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [hintOpen, onHintClose]);

  // Clear the field when a new round starts. Refocusing is skipped on touch
  // devices so the on-screen keyboard doesn't cover the map/image unasked.
  useEffect(() => {
    if (!disabled) {
      setValue("");
      setOpen(false);
      setHighlighted(-1);
      if (!isTouchDevice()) inputRef.current?.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const suggestions = getSuggestions(value);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    setHighlighted(-1);
    setOpen(v.trim().length > 0);
  };

  const handleSelect = (code) => {
    setValue(code);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted].code);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <form className="guess-form guess-form-hint" onSubmit={handleSubmit}>
      <div className="hint-wrap" ref={hintWrapRef}>
        {hintOpen && hintText && <HintBubble animKey={hintLevel} content={hintText} />}
        <button
          type="button"
          className={`btn hint-btn${hintDisabled ? " maxed" : ""}`}
          onClick={onHint}
        >
          {hintLevel > 0 ? `Hint ${hintLevel}/${hintMax}` : "Hint"}
        </button>
      </div>
      <div className="autocomplete-wrapper" ref={wrapperRef}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          autoFocus={!isTouchDevice()}
        />
        {open && suggestions.length > 0 && (
          <ul className="autocomplete-dropdown" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.code}
                className={i === highlighted ? "highlighted" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s.code);
                }}
                onMouseEnter={() => setHighlighted(i)}
                role="option"
                aria-selected={i === highlighted}
              >
                <span className="state-name">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="btn primary" disabled={disabled || !value.trim()}>
        Submit
      </button>
    </form>
  );
}
