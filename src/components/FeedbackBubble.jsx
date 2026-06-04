import { useState, useEffect } from "react";

// A floating, screen-centered feedback bubble. Rendered with position: fixed and
// a high z-index so it hovers over all other content and never affects the
// layout of any other element (no reflow / no shift). Green for correct, red for
// incorrect. It fades/scales in on mount and stays until the parent unmounts it
// (when the user presses Enter or clicks to advance). Inline styles keep the
// shared stylesheet untouched.
export default function FeedbackBubble({ correct, message }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${shown ? 1 : 0.96})`,
        zIndex: 4000,
        minWidth: "min(400px, 80vw)",
        width: "max-content",
        maxWidth: "80vw",
        padding: "2.25rem 2.5rem",
        borderRadius: "16px",
        border: "2px solid #111",
        background: correct ? "#DCF5DC" : "#FBD7D7",
        color: correct ? "#1b5e20" : "#8a1c1c",
        fontSize: "1.25rem",
        fontWeight: 700,
        textAlign: "left",
        lineHeight: 1.4,
        pointerEvents: "none",
        opacity: shown ? 1 : 0,
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}
    >
      {message}
    </div>
  );
}
