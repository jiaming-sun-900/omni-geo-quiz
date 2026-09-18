import { useState, useRef, useEffect, useId } from "react";
import {
  stateAbbreviations,
  getStateSuggestions,
} from "../data/states";
import { isTouchDevice } from "../utils/isTouch";

// The field is a combobox: the dropdown already had role="listbox" / "option",
// but without aria-expanded / aria-controls / aria-activedescendant on the input
// a screen reader was never told the suggestions existed, and arrow-key movement
// through them was silent.
export default function StateGuessInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const listId = useId();
  const inputRef = useRef();
  const wrapperRef = useRef();

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

  const suggestions = getStateSuggestions(value);

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
      setHighlighted((h) =>
        h <= 0 ? suggestions.length - 1 : h - 1
      );
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
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
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlighted >= 0 ? `${listId}-opt-${highlighted}` : undefined
          }
          aria-label="State name or abbreviation"
          placeholder="State name or abbreviation..."
          disabled={disabled}
          autoComplete="off"
          autoFocus={!isTouchDevice()}
        />
        {open && suggestions.length > 0 && (
          <ul className="autocomplete-dropdown" role="listbox" id={listId}>
            {suggestions.map((name, i) => (
              <li
                key={name}
                id={`${listId}-opt-${i}`}
                className={i === highlighted ? "highlighted" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(name);
                }}
                onMouseEnter={() => setHighlighted(i)}
                role="option"
                aria-selected={i === highlighted}
              >
                <span className="state-name">{name}</span>
                <span className="state-abbr">{stateAbbreviations[name]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="submit"
        className="push-toggle"
        disabled={disabled || !value.trim()}
      >
        Submit
      </button>
    </form>
  );
}
