import { useState } from "react";
import { CODEX, ACHIEVEMENTS, resolveCodexEntry, NPCS } from "../game/story";
import { racingCredTier, npcStandingTier, NPC_STANDING_THRESHOLDS } from "../game/career";
import { Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { RolodexTab } from "./ds/controls/RolodexTab";

const TABS = [
  { key: "npc", label: "PEOPLE" },
  { key: "car", label: "CARS" },
  { key: "location", label: "PLACES" },
  { key: "standing", label: "STANDING" },
  { key: "achievements", label: "COLLECTIONS" },
];

const NPC_PERKS = {
  rex: "10% off tires at Friendly, 20% at Trusted.",
  dez: "At Trusted, Dez covers your next entry fee once.",
  marisol: "Lowers the Civic Si's points requirement (40 → 30 → 20).",
  walt: "Lowers the RX-7's win requirement (3 → 2 → 1); at Trusted, waves one Maintain bill.",
};

function Meter({ value, max = 60 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height: 6, background: "var(--gl-panel-sunk)", borderRadius: "var(--gl-radius-chip)", marginTop: 4 }}>
      <div style={{ height: 6, width: `${pct}%`, background: "var(--gl-teal)", borderRadius: "var(--gl-radius-chip)" }} />
    </div>
  );
}

function LockedCard() {
  return (
    <div style={{ background: "var(--gl-panel-sunk)", border: "1px dashed var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 12, opacity: 0.55 }}>
      <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-text-dead)" }}>???</div>
      <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 4 }}>Not yet discovered.</div>
    </div>
  );
}

function EntryCard({ title, body, quip, bodyStyle }) {
  return (
    <div style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-teal)", borderRadius: "var(--gl-radius-panel)", padding: 12 }}>
      <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-gold)" }}>{title}</div>
      <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4, lineHeight: 1.5, ...bodyStyle }}>{body}</div>
      {quip && (
        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-pink)", marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{quip}</div>
      )}
    </div>
  );
}

// Meta-level browsable lore + milestones — reachable from the title screen
// (no career needed) and from CareerHome. Locked entries stay silhouettes
// until their story trigger fires (see game/story.js + App.jsx).
export default function CodexScreen({ meta, career, onBack, initialTab = "npc", onEngageNpc, npcEngageResult }) {
  const [tab, setTab] = useState(initialTab);
  const unlockedCodex = meta.codexUnlocked ?? [];
  const unlockedAch = meta.achievementsUnlocked ?? [];

  const entries = Object.values(CODEX).filter(e => e.category === tab);

  return (
    <Shell>
      <ScreenHeader title={TABS.find(t => t.key === tab)?.label ?? "Rolodex"} nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {TABS.map(t => (
          <RolodexTab key={t.key} label={t.label} tone="pink" active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {tab === "standing" ? (
        !career ? (
          <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-text-3)", textAlign: "center", padding: 20 }}>Start a career to build standing in Cape Marlow.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-pink)", borderRadius: "var(--gl-radius-panel)", padding: 12 }}>
              <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>Racing Cred: <span style={{ color: "var(--gl-pink)" }}>{career.racingCred}</span> — {racingCredTier(career.racingCred).label}</div>
              <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4 }}>Clean wins raise it; DNFs, sloppy runs, and getting busted street racing lower it. Shifts your entry fee at the top and bottom tiers.</div>
            </div>
            {Object.values(NPCS).map(npc => {
              const value = career.npcStanding?.[npc.id] ?? 0;
              const tier = npcStandingTier(value);
              return (
                <div key={npc.id} style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{npc.name}</div>
                    <div style={{ fontSize: "var(--gl-size-micro)", color: tier === "TRUSTED" ? "var(--gl-gold)" : tier === "FRIENDLY" ? "var(--gl-teal)" : "var(--gl-text-3)", fontWeight: 700 }}>{tier}</div>
                  </div>
                  <Meter value={value} max={NPC_STANDING_THRESHOLDS.TRUSTED} />
                  <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 6 }}>{NPC_PERKS[npc.id]}</div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "npc" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {Object.values(NPCS).map(npc => {
            const codexId = `npc_${npc.id}`;
            const unlocked = unlockedCodex.includes(codexId);
            if (!unlocked) return <LockedCard key={npc.id} />;
            const entry = CODEX[codexId];
            const standing = career?.npcStanding?.[npc.id] ?? 0;
            const tier = career ? npcStandingTier(standing) : null;
            const noAp = !career || career.ap <= 0;
            return (
              <div key={npc.id} style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-teal)", borderRadius: "var(--gl-radius-panel)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-gold)" }}>{entry.title}</div>
                  <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4, lineHeight: 1.5, fontFamily: "var(--gl-font-body)" }}>{entry.body}</div>
                </div>
                {career && (
                  <>
                    <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, color: tier === "TRUSTED" ? "var(--gl-gold)" : tier === "FRIENDLY" ? "var(--gl-teal)" : "var(--gl-text-3)" }}>{tier} — {standing} standing</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button tone="teal" size="sm" disabled={noAp} reason={noAp ? "no AP left this month" : undefined} onClick={() => onEngageNpc(npc.id, "friendly")}>Be friendly (−1 AP)</Button>
                      <Button tone="red" size="sm" disabled={noAp} reason={noAp ? "no AP left this month" : undefined} onClick={() => onEngageNpc(npc.id, "antagonize")}>Antagonize (−1 AP)</Button>
                    </div>
                    {npcEngageResult?.npcId === npc.id && (
                      <div style={{ fontSize: "var(--gl-size-micro)", color: npcEngageResult.mode === "friendly" ? "var(--gl-teal)" : "var(--gl-red)", fontStyle: "italic", lineHeight: 1.5 }}>{npcEngageResult.message}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : tab === "achievements" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAch.includes(a.id);
            return unlocked
              ? <EntryCard key={a.id} title={a.title} body={a.desc} quip={a.quip} />
              : <LockedCard key={a.id} />;
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {entries.map(e => {
            const unlocked = unlockedCodex.includes(e.id);
            if (!unlocked) return <LockedCard key={e.id} />;
            const resolved = resolveCodexEntry(e);
            return <EntryCard key={e.id} title={resolved.title} body={resolved.body} bodyStyle={{ fontFamily: "var(--gl-font-body)" }} />;
          })}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 20, lineHeight: 1.5, fontFamily: "var(--gl-font-body)" }}>
        Codex entries and achievements are permanent — once discovered in any career, they stay unlocked forever.
      </div>
    </Shell>
  );
}
