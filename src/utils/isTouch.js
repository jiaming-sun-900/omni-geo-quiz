// True on devices whose primary input is a finger (phones, tablets).
//
// Used to suppress the quiz inputs' autofocus: on desktop, focusing the field
// right away lets you type the answer the moment a round starts, but on a phone
// it pops the on-screen keyboard over half the layout before you've even seen
// the map. Guarded for SSR / very old browsers, where it resolves to false and
// the desktop behaviour (autofocus) is kept.
export function isTouchDevice() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}
