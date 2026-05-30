import { useState, useRef, useEffect } from "react";
import { cityAbbreviations, getCitySuggestions } from "../data/cities";

export default function GuessInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef();
  const wrapperRef = useRef();

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

  const suggestions = getCitySuggestions(value);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    setHighlighted(-1);
    setOpen(v.trim().length > 0);
  };

  const handleSelect = (name) => {
    setValue(name);
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
      handleSelect(suggestions[highlighted].name);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <div className="autocomplete-wrapper" ref={wrapperRef}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setOpen(true)}
          placeholder="Type your answer..."
          disabled={disabled}
          autoComplete="off"
          autoFocus
        />
        {open && suggestions.length > 0 && (
          <ul className="autocomplete-dropdown" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.label}
                className={i === highlighted ? "highlighted" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s.name);
                }}
                onMouseEnter={() => setHighlighted(i)}
                role="option"
                aria-selected={i === highlighted}
              >
                <span className="state-name">{s.label}</span>
                {cityAbbreviations[s.name] && (
                  <span className="state-abbr">{cityAbbreviations[s.name]}</span>
                )}
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
