import { useState } from "react";
import { CODEX, ACHIEVEMENTS, resolveCodexEntry, NPCS } from "../game/story";
import { racingCredTier, npcStandingTier } from "../game/career";
import { Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { RolodexTab } from "./ds/controls/RolodexTab";

const COLLECTIONS_TABS = [
  { key: "car", label: "CARS" },
  { key: "location", label: "PLACES" },
  { key: "achievements", label: "ACHIEVEMENTS" },
];

const NPC_PERKS = {
  rex: "10% off tires at Friendly, 20% at Trusted.",
  dez: "At Trusted, Dez covers your next entry fee once.",
  marisol: "Lowers the Civic Si's points requirement (40 → 30 → 20).",
  walt: "Lowers the RX-7's win requirement (3 → 2 → 1); at Trusted, waves one Maintain bill.",
};

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

// The people you know in Cape Marlow — grows as you meet them, never a tab
// among other collectibles (a relationship isn't something you "collect").
// Racing Cred sits at the top since it's the same scene-wide reputation
// every one of these relationships feeds into.
function RolodexView({ meta, career, onEngageNpc, npcEngageResult }) {
  const unlockedCodex = meta.codexUnlocked ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {career && (
        <div style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-pink)", borderRadius: "var(--gl-radius-panel)", padding: 12 }}>
          <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>Racing Cred: <span style={{ color: "var(--gl-pink)" }}>{career.racingCred}</span> — {racingCredTier(career.racingCred).label}</div>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4 }}>Clean wins raise it; DNFs, sloppy runs, and getting busted street racing lower it. Shifts your entry fee at the top and bottom tiers.</div>
        </div>
      )}
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
                  <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>{NPC_PERKS[npc.id]}</div>
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
    </div>
  );
}

// Everything you've discovered through the game — cars, places, and
// achievement milestones. People live in the Rolodex instead; a
// relationship isn't a thing you "collected".
function CollectionsView({ meta, tab, setTab }) {
  const unlockedCodex = meta.codexUnlocked ?? [];
  const unlockedAch = meta.achievementsUnlocked ?? [];
  const entries = Object.values(CODEX).filter(e => e.category === tab);

  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {COLLECTIONS_TABS.map(t => (
          <RolodexTab key={t.key} label={t.label} tone="gold" active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {tab === "achievements" ? (
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
    </>
  );
}

// Two distinct concepts sharing one screen shell: the Rolodex (people you
// know, grows as you meet them, 1 AP to engage) and Collections (cars,
// places, achievement milestones you've discovered — never people, a
// relationship isn't a collectible). Reachable from the title screen (no
// career needed) and from CareerHome's two nav buttons, which pick `mode`.
export default function CodexScreen({ meta, career, onBack, mode = "rolodex", initialTab = "car", onEngageNpc, npcEngageResult }) {
  const [tab, setTab] = useState(initialTab);
  const title = mode === "rolodex" ? "Rolodex" : COLLECTIONS_TABS.find(t => t.key === tab)?.label ?? "Collections";

  return (
    <Shell>
      <ScreenHeader title={title} nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>} />

      {mode === "rolodex" ? (
        <RolodexView meta={meta} career={career} onEngageNpc={onEngageNpc} npcEngageResult={npcEngageResult} />
      ) : (
        <CollectionsView meta={meta} tab={tab} setTab={setTab} />
      )}

      <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 20, lineHeight: 1.5, fontFamily: "var(--gl-font-body)" }}>
        {mode === "rolodex"
          ? "People you've met stay in your Rolodex forever, even across careers."
          : "Codex entries and achievements are permanent — once discovered in any career, they stay unlocked forever."}
      </div>
    </Shell>
  );
}
