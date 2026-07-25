import { C } from "../theme";

// Shared responsive screen shell — every screen (including full-bleed ones
// like the title) sizes from the actual viewport: 100dvh tall (mobile
// browser-chrome safe), full-width column on phones, centered max-width
// column on desktop. Keeps the app and title screen reading as one app
// instead of two different layouts.
export function Shell({ maxWidth = 760, children }) {
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.white, fontFamily: "monospace", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth, padding: "clamp(10px, 3vw, 24px)" }}>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export function cardBtnStyle(active) {
  return { flex: "1 1 160px", minWidth: 160, textAlign: "left", padding: 10, background: active ? "#1c1c3a" : C.panel, border: `1px solid ${active ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white };
}

export function ToggleRow({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: 8, background: active ? "#122b28" : C.panel, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
      <div style={{ fontSize: 10, fontWeight: "bold" }}>{active ? "☑" : "☐"} {label}</div>
      <div style={{ fontSize: 8, color: "#777" }}>{desc}</div>
    </button>
  );
}
