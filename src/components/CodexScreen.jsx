import { useState } from "react";
import { CODEX, ACHIEVEMENTS, resolveCodexEntry } from "../game/story";
import { C } from "../theme";
import { Shell } from "./shared";

const TABS = [
  { key: "npc", label: "PEOPLE" },
  { key: "car", label: "CARS" },
  { key: "location", label: "PLACES" },
  { key: "achievements", label: "ACHIEVEMENTS" },
];

function LockedCard() {
  return (
    <div style={{ background: "#0a0a14", border: `1px dashed ${C.border}`, borderRadius: 4, padding: 12, opacity: 0.55 }}>
      <div style={{ fontSize: 11, fontWeight: "bold" }}>🔒 ???</div>
      <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>Not yet discovered.</div>
    </div>
  );
}

function EntryCard({ title, body, icon }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.teal}`, borderRadius: 4, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: "bold", color: C.gold }}>{icon ? `${icon} ` : ""}{title}</div>
      <div style={{ fontSize: 10, color: "#bbb", marginTop: 4, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

// Meta-level browsable lore + milestones — reachable from the title screen
// (no career needed) and from CareerHome. Locked entries stay silhouettes
// until their story trigger fires (see game/story.js + App.jsx).
export default function CodexScreen({ meta, onBack }) {
  const [tab, setTab] = useState("npc");
  const unlockedCodex = meta.codexUnlocked ?? [];
  const unlockedAch = meta.achievementsUnlocked ?? [];

  const entries = Object.values(CODEX).filter(e => e.category === tab);

  return (
    <Shell maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>CODEX</div>
        <button onClick={onBack} style={{ padding: "8px 12px", background: C.panel, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>← BACK</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: "1 1 120px", padding: "8px 10px", background: tab === t.key ? "#1c1c3a" : C.panel,
              border: `1px solid ${tab === t.key ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer",
              color: tab === t.key ? C.pink : "#999", fontFamily: "monospace", fontSize: 9, fontWeight: "bold", letterSpacing: 1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "achievements" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAch.includes(a.id);
            return unlocked
              ? <EntryCard key={a.id} title={a.title} body={a.desc} icon={a.icon} />
              : <LockedCard key={a.id} />;
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {entries.map(e => {
            const unlocked = unlockedCodex.includes(e.id);
            if (!unlocked) return <LockedCard key={e.id} />;
            const resolved = resolveCodexEntry(e);
            return <EntryCard key={e.id} title={resolved.title} body={resolved.body} />;
          })}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 9, color: "#555", marginTop: 20, lineHeight: 1.5 }}>
        Codex entries and achievements are permanent — once discovered in any career, they stay unlocked forever.
      </div>
    </Shell>
  );
}
