// Shared vaporwave palette — mirrors src/index.css's --gl-* color tokens as
// plain hex strings. Canvas 2D (RoadView.jsx, TrackCanvas.jsx) can't resolve
// CSS custom properties in fillStyle/strokeStyle, so this stays a literal JS
// object rather than "var(--gl-x)" — but the values themselves must stay in
// sync with index.css by hand. DOM/React components should reach for the CSS
// tokens directly where practical; C exists for canvas and any inline style
// that predates the token system.
export const C = {
  pink: "#FF5CC8", teal: "#16F2D6", purple: "#150730", white: "#E8EAF6",
  orange: "#FF7A2F", red: "#FF3B5C", gold: "#FFC93C", green: "#1FD75F",
  violet: "#7B2FBE",
  bg: "#0B0A1E", panel: "#14132E", panel2: "#0C0B20", border: "#272552",
  tealFill: "#0D2431", textMuted: "#9D99C6",
};

const SCANLINE_KEY = "garageLifeScanlines";
export function scanlinesEnabled() {
  try { return localStorage.getItem(SCANLINE_KEY) !== "off"; } catch { return true; }
}
export function setScanlinesEnabled(on) {
  try { localStorage.setItem(SCANLINE_KEY, on ? "on" : "off"); } catch { /* noop */ }
}
