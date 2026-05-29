import { useState, useRef, useEffect } from "react";

export default function GuessInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    if (!disabled) {
      setValue("");
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  };

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer..."
        disabled={disabled}
        autoFocus
      />
      <button type="submit" className="btn primary" disabled={disabled || !value.trim()}>
        Submit
      </button>
    </form>
  );
}
