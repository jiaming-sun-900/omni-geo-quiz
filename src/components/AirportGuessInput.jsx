import { useState, useRef, useEffect } from "react";
import { getAirportSuggestions } from "../data/airports";

// Floating tooltip bubble that hovers ABOVE the Hint button. Absolutely
// positioned and given a high z-index so it overlaps page content instead of
// pushing anything down or causing scroll. Fades/rises in whenever the hint
// changes (keyed by animKey, so passing JSX content doesn't re-trigger the fade
// on every render). Inline styles keep the shared stylesheet untouched.
function HintBubble({ animKey, content }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [animKey]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: `translateX(-50%) translateY(${shown ? "-10px" : "-4px"})`,
        width: "max-content",
        maxWidth: "70vw",
        padding: "0.75rem 1rem",
        background: "#fff",
        color: "#1a1a2e",
        border: "2px solid #111",
        borderRadius: "12px",
        boxShadow: "3px 3px 0px #111",
        fontSize: "1.08rem",
        fontWeight: 600,
        lineHeight: 1.35,
        textAlign: "left",
        whiteSpace: "normal",
        zIndex: 1000,
        pointerEvents: "none",
        opacity: shown ? 1 : 0,
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
      role="status"
    >
      {content}
      {/* little tail pointing down at the button */}
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "9px solid #111",
        }}
      />
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

  useEffect(() => {
    if (!disabled) {
      setValue("");
      setOpen(false);
      setHighlighted(-1);
      inputRef.current?.focus();
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

  const suggestions = getAirportSuggestions(value);

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
    <form className="guess-form" onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
      <div style={{ position: "relative", display: "flex" }} ref={hintWrapRef}>
        {hintOpen && hintText && <HintBubble animKey={hintLevel} content={hintText} />}
        <button
          type="button"
          className={`btn hint-btn${hintDisabled ? " maxed" : ""}`}
          onClick={onHint}
        >
          {hintLevel > 0 ? `Hint ${hintLevel}/2` : "Hint"}
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
          placeholder="IATA code or city..."
          disabled={disabled}
          autoComplete="off"
          autoFocus
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
