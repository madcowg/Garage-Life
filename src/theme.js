// Shared vaporwave palette — used across all screens for visual consistency.
export const C = {
  pink: "#FF6EC7", teal: "#00F5D4", purple: "#1A0533", white: "#E8EAF6",
  orange: "#FF6B35", red: "#FF2D55", gold: "#FFD700", green: "#00C853",
  bg: "#0D0D1A", panel: "#12122A", panel2: "#0a0a14", border: "#242440",
};

// CRT scanline overlay — a pure CSS effect layered on top of a scaled-up
// pixel-art canvas via an absolutely-positioned sibling div. Doesn't touch
// the canvas's own low-res buffer, so the underlying art stays chunky/16-bit;
// this only adds the CRT sheen on display. Apply to a `position: relative`
// wrapper around any pixelated canvas. Toggleable from the title screen's
// Settings panel — components check scanlinesEnabled() at render time.
export const SCANLINE_OVERLAY = {
  position: "absolute", inset: 0, pointerEvents: "none",
  backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3px)",
  mixBlendMode: "multiply",
};

const SCANLINE_KEY = "garageLifeScanlines";
export function scanlinesEnabled() {
  try { return localStorage.getItem(SCANLINE_KEY) !== "off"; } catch { return true; }
}
export function setScanlinesEnabled(on) {
  try { localStorage.setItem(SCANLINE_KEY, on ? "on" : "off"); } catch { /* noop */ }
}
