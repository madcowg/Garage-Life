import { C } from "../theme";

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export function cardBtnStyle(active) {
  return { flex: 1, textAlign: "left", padding: 10, background: active ? "#1c1c3a" : C.panel, border: `1px solid ${active ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white };
}

export function ToggleRow({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: 8, background: active ? "#122b28" : C.panel, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
      <div style={{ fontSize: 10, fontWeight: "bold" }}>{active ? "☑" : "☐"} {label}</div>
      <div style={{ fontSize: 8, color: "#777" }}>{desc}</div>
    </button>
  );
}
