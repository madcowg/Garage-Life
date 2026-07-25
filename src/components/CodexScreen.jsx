import { useState } from "react";
import { CODEX, ACHIEVEMENTS, resolveCodexEntry, NPCS } from "../game/story";
import { racingCredTier, npcStandingTier, NPC_STANDING_THRESHOLDS } from "../game/career";
import { C } from "../theme";
import { Shell } from "./shared";

const TABS = [
  { key: "npc", label: "PEOPLE" },
  { key: "car", label: "CARS" },
  { key: "location", label: "PLACES" },
  { key: "standing", label: "STANDING" },
  { key: "achievements", label: "ACHIEVEMENTS" },
];

const NPC_PERKS = {
  rex: "10% off tires at Friendly, 20% at Trusted.",
  dez: "At Trusted, Dez covers your next entry fee once.",
  marisol: "Lowers the Civic SiR's points requirement (40 → 30 → 20).",
  walt: "Lowers the RX-7's win requirement (3 → 2 → 1); at Trusted, waves one Maintain bill.",
};

function Meter({ value, max = 60 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, marginTop: 4 }}>
      <div style={{ height: 6, width: `${pct}%`, background: C.teal, borderRadius: 3 }} />
    </div>
  );
}

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
export default function CodexScreen({ meta, career, onBack }) {
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

      {tab === "standing" ? (
        !career ? (
          <div style={{ fontSize: 10, color: "#666", textAlign: "center", padding: 20 }}>Start a career to build standing in Cape Marlow.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.pink}`, borderRadius: 4, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: "bold" }}>Racing Cred: <span style={{ color: C.pink }}>{career.racingCred}</span> — {racingCredTier(career.racingCred).label}</div>
              <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>Clean wins raise it; DNFs, sloppy runs, and getting busted street racing lower it. Shifts your entry fee at the top and bottom tiers.</div>
            </div>
            {Object.values(NPCS).map(npc => {
              const value = career.npcStanding?.[npc.id] ?? 0;
              const tier = npcStandingTier(value);
              return (
                <div key={npc.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, fontWeight: "bold" }}>{npc.name}</div>
                    <div style={{ fontSize: 9, color: tier === "TRUSTED" ? C.gold : tier === "FRIENDLY" ? C.teal : "#888", fontWeight: "bold" }}>{tier}</div>
                  </div>
                  <Meter value={value} max={NPC_STANDING_THRESHOLDS.TRUSTED} />
                  <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>{NPC_PERKS[npc.id]}</div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "achievements" ? (
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
