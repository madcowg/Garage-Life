import { useState, useMemo } from "react";
import { CARS, MODS, TIRE_CATALOG } from "../game/data";
import { ENTRY_FEE } from "../game/career";
import { isModAvailable } from "../game/meta";
import { buildPreRacePreview, getCard } from "../game/v2";
import { GameCard } from "./CardHand";
import { C } from "../theme";
import { Section, ToggleRow, Shell } from "./shared";

// Shown when the player spends a Race action from CareerHome — mods/tire/
// gauges/maintenance-checklist, same as the old one-shot Setup screen, minus
// the car picker (fixed for the career) and filtered to unlocked mods only.
export default function PreRaceSetup({ career, meta, onStart, onBack, onBuyTire }) {
  const owned = career.ownedTires ?? ["stock"];
  const bestOwned = owned.includes("slicks") ? "slicks" : owned.includes("extreme_summer") ? "extreme_summer" : "stock";
  const [mods, setMods] = useState({});
  const [tire, setTire] = useState(bestOwned);
  const [diagnostics, setDiagnostics] = useState(false);
  const [courseWalk, setCourseWalk] = useState(true);
  const [maintenance, setMaintenance] = useState({ fluids: true, tires: true, brakes: true });

  const car = CARS[career.car];
  const availableMods = MODS.filter(m => isModAvailable(meta, m.id, m));
  const lockedMods = MODS.filter(m => !isModAvailable(meta, m.id, m));

  const loadout = { car: career.car, variant: career.variant, mods, tire, diagnostics, courseWalk, maintenance };
  const preview = useMemo(() => {
    try { return buildPreRacePreview(loadout, career.wear); } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career.car, career.wear, mods, tire, diagnostics, courseWalk, maintenance]);

  return (
    <Shell maxWidth={640}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>RACE SETUP</div>
            <div style={{ fontSize: 11, color: C.teal, letterSpacing: 2 }}>{car.name}{career.variant ? ` (${career.variant})` : ""} — MONTH {career.month}/10</div>
          </div>
          <button onClick={onBack} style={{ padding: "8px 12px", background: C.panel, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>← BACK</button>
        </div>

        <Section title="INSTALLED MODS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {availableMods.map(m => (
              <ToggleRow key={m.id} label={m.label} desc={m.desc} active={!!mods[m.id]} onClick={() => setMods(s => ({ ...s, [m.id]: !s[m.id] }))} />
            ))}
          </div>
          {lockedMods.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
              {lockedMods.map(m => (
                <div key={m.id} style={{ padding: 8, background: "#0a0a14", border: `1px dashed ${C.border}`, borderRadius: 4, opacity: 0.55 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>🔒 {m.label}</div>
                  <div style={{ fontSize: 8, color: "#666" }}>Unlocks at ${m.unlockThreshold} lifetime earned</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`TIRES (cash: ${career.cash})`}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(TIRE_CATALOG).map(([id, t]) => {
              const isOwned = owned.includes(id);
              const requiresMet = !t.requires || owned.includes(t.requires);
              const canBuy = !isOwned && requiresMet && career.cash >= t.price;
              return (
                <div key={id} style={{ flex: 1, padding: 10, background: tire === id ? "#1c1c3a" : C.panel, border: `1px solid ${tire === id ? C.pink : isOwned ? C.border : "#1a1a2e"}`, borderRadius: 4, color: C.white, opacity: isOwned || requiresMet ? 1 : 0.55 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.label}</div>
                  <div style={{ fontSize: 8, color: "#888", minHeight: 26, marginTop: 2 }}>{t.desc}</div>
                  {isOwned ? (
                    <button onClick={() => setTire(id)} style={{ marginTop: 6, width: "100%", padding: 6, background: tire === id ? C.pink : C.panel2, color: tire === id ? C.purple : C.teal, border: `1px solid ${tire === id ? C.pink : C.teal}`, borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}>
                      {tire === id ? "MOUNTED" : "MOUNT"}
                    </button>
                  ) : (
                    <button onClick={() => canBuy && onBuyTire(id, t.price)} disabled={!canBuy} style={{ marginTop: 6, width: "100%", padding: 6, background: canBuy ? C.gold : "#1a1a2e", color: canBuy ? C.purple : "#555", border: "none", borderRadius: 3, cursor: canBuy ? "pointer" : "not-allowed", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}>
                      {!requiresMet ? `NEEDS ${TIRE_CATALOG[t.requires].label.toUpperCase()}` : `BUY $${t.price}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="EVENT PREP (information, not performance)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <ToggleRow label="Basic Diagnostics" desc="Reveals exactly which hazards are in your deck" active={diagnostics} onClick={() => setDiagnostics(v => !v)} />
            <ToggleRow label="Walk the Course" desc="Skip = risk Course Confusion (DNF)" active={courseWalk} onClick={() => setCourseWalk(v => !v)} />
          </div>
        </Section>

        <Section title="PRE-RACE MAINTENANCE CHECKLIST">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <ToggleRow label="Check Fluids" desc="Skip = 2 engine hazards" active={maintenance.fluids} onClick={() => setMaintenance(s => ({ ...s, fluids: !s.fluids }))} />
            <ToggleRow label="Check Tires"  desc="Skip = 2 tire hazards"   active={maintenance.tires}  onClick={() => setMaintenance(s => ({ ...s, tires: !s.tires }))} />
            <ToggleRow label="Check Brakes" desc="Skip = 2 brake hazards"  active={maintenance.brakes} onClick={() => setMaintenance(s => ({ ...s, brakes: !s.brakes }))} />
          </div>
        </Section>

        {preview && (
          <Section title={`YOUR DECK (${preview.deck.cardIds.length} cards${preview.hazardIds.length ? ` + ${preview.hazardIds.length} hazards` : ""})`}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {[...preview.deck.cardIds].sort().map((id, i) => (
                <GameCard key={`${id}-${i}`} card={getCard(id)} small />
              ))}
            </div>
            {preview.hazardIds.length > 0 && (
              <div style={{ fontSize: 10, color: C.red, marginTop: 6 }}>
                ⚠ {preview.preview.exact
                  ? Object.entries(preview.preview.exact).map(([id, n]) => `${n}× ${getCard(id).name}`).join(", ")
                  : `${preview.hazardIds.length} hazard cards in the deck${preview.preview.unknown ? ` (${preview.preview.unknown} unknown — no diagnostics)` : ""}`}
              </div>
            )}
          </Section>
        )}

        <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
          The event is 4 timed runs on one course — best run counts. Your deck is your car: play one Line card
          per segment (plus an optional Utility). On-affinity cards get full effect.
        </div>

        {(() => {
          const canAffordEntry = career.cash >= ENTRY_FEE;
          return (
            <>
              <button
                onClick={() => canAffordEntry && onStart(loadout)}
                disabled={!canAffordEntry}
                style={{ width: "100%", padding: "14px 0", background: canAffordEntry ? C.pink : "#1a1a2e", color: canAffordEntry ? C.purple : "#555", border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: canAffordEntry ? "pointer" : "not-allowed", letterSpacing: 2 }}
              >
                PAY ${ENTRY_FEE} ENTRY & GRID UP →
              </button>
              {!canAffordEntry && (
                <div style={{ textAlign: "center", fontSize: 9, color: C.red, marginTop: 8 }}>
                  Need ${ENTRY_FEE} cash for the entry fee — every car on the grid pays it, win or DNF.
                </div>
              )}
            </>
          );
        })()}
    </Shell>
  );
}
