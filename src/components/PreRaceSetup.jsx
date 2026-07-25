import { useState, useMemo } from "react";
import { CARS, MODS, TIRE_CATALOG } from "../game/data";
import { ENTRY_FEE, PREP_COSTS, DIY_PREP_AP_COST } from "../game/career";
import { buildPreRacePreview, getCard } from "../game/v2";
import { GameCard } from "./CardHand";
import { C } from "../theme";
import { Section, ToggleRow, Shell } from "./shared";

// Shown when the player spends a Race action from CareerHome — tire
// selection/gauges/maintenance-checklist, same as the old one-shot Setup
// screen, minus the car picker (fixed for the career). Mods and tire
// *purchases* live at the Shop now (ShopScreen) — this screen only lets you
// pick which owned tire to mount; installed mods are always active.
//
// Event prep and the maintenance checklist each cost real cash (PREP_COSTS)
// — they default OFF, so skipping one is an actual saving against an
// actual risk (Course Confusion DNF / hazard cards), not a free lunch.
// "Do it yourself" is the time-instead-of-money alternative: covers every
// item for a flat extra AP (spent immediately, on top of Race's own AP at
// finish) instead of the individual cash costs.
export default function PreRaceSetup({ career, onStart, onBack }) {
  const owned = career.ownedTires ?? ["stock"];
  const installedModIds = career.installedMods ?? [];
  const bestOwned = owned.includes("slicks") ? "slicks" : owned.includes("extreme_summer") ? "extreme_summer" : "stock";
  const [tire, setTire] = useState(bestOwned);
  const [diyPrep, setDiyPrep] = useState(false);
  const [diagnosticsPaid, setDiagnosticsPaid] = useState(false);
  const [courseWalkPaid, setCourseWalkPaid] = useState(false);
  const [maintenancePaid, setMaintenancePaid] = useState({ fluids: false, tires: false, brakes: false });

  const diagnostics = diyPrep || diagnosticsPaid;
  const courseWalk = diyPrep || courseWalkPaid;
  const maintenance = {
    fluids: diyPrep || maintenancePaid.fluids,
    tires: diyPrep || maintenancePaid.tires,
    brakes: diyPrep || maintenancePaid.brakes,
  };

  const car = CARS[career.car];
  const installedMods = MODS.filter(m => installedModIds.includes(m.id));
  const mods = Object.fromEntries(installedModIds.map(id => [id, true]));

  const prepCost = diyPrep ? 0 : (diagnostics ? PREP_COSTS.diagnostics : 0) + (courseWalk ? PREP_COSTS.courseWalk : 0)
    + (maintenance.fluids ? PREP_COSTS.fluids : 0) + (maintenance.tires ? PREP_COSTS.tires : 0) + (maintenance.brakes ? PREP_COSTS.brakes : 0);
  const extraAp = diyPrep ? DIY_PREP_AP_COST : 0;
  const totalCost = ENTRY_FEE + prepCost;

  const loadout = { car: career.car, variant: career.variant, mods, tire, diagnostics, courseWalk, maintenance };
  const preview = useMemo(() => {
    try { return buildPreRacePreview(loadout, career.wear); } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career.car, career.wear, installedModIds.join(","), tire, diagnostics, courseWalk, maintenance]);

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
          {installedMods.length === 0 ? (
            <div style={{ fontSize: 10, color: "#666" }}>Nothing installed yet — visit Dead Reckoning Garage (Shop, 1 AP) to bolt in anything you've unlocked.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {installedMods.map(m => (
                <div key={m.id} style={{ padding: 8, background: "#122b28", border: `1px solid ${C.teal}`, borderRadius: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>✓ {m.label}</div>
                  <div style={{ fontSize: 8, color: "#888" }}>{m.desc}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`TIRES (owned: cash $${career.cash})`}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {owned.map(id => {
              const t = TIRE_CATALOG[id];
              return (
                <div key={id} style={{ flex: 1, padding: 10, background: tire === id ? "#1c1c3a" : C.panel, border: `1px solid ${tire === id ? C.pink : C.border}`, borderRadius: 4, color: C.white }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.label}</div>
                  <div style={{ fontSize: 8, color: "#888", minHeight: 26, marginTop: 2 }}>{t.desc}</div>
                  <button onClick={() => setTire(id)} style={{ marginTop: 6, width: "100%", padding: 6, background: tire === id ? C.pink : C.panel2, color: tire === id ? C.purple : C.teal, border: `1px solid ${tire === id ? C.pink : C.teal}`, borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}>
                    {tire === id ? "MOUNTED" : "MOUNT"}
                  </button>
                </div>
              );
            })}
          </div>
          {owned.length < Object.keys(TIRE_CATALOG).length && (
            <div style={{ fontSize: 9, color: "#666", marginTop: 8 }}>Want better rubber? Buy it at Dead Reckoning Garage (Shop, from CareerHome).</div>
          )}
        </Section>

        <Section title="PREP & MAINTENANCE — PAY CASH, OR DO IT YOURSELF">
          <ToggleRow
            label={`Do It Yourself — ${DIY_PREP_AP_COST} AP instead of cash`}
            desc="Covers every item below for free, but costs an extra AP (on top of Race's own) — good when you're cash-poor but have AP to spare"
            active={diyPrep}
            onClick={() => setDiyPrep(v => !v)}
          />
        </Section>

        <Section title={diyPrep ? "EVENT PREP (covered — DIY)" : "EVENT PREP (costs cash, not AP)"}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, opacity: diyPrep ? 0.6 : 1 }}>
            <ToggleRow label={`Basic Diagnostics — $${PREP_COSTS.diagnostics}`} desc="Reveals exactly which hazards are in your deck" active={diagnostics} onClick={() => !diyPrep && setDiagnosticsPaid(v => !v)} />
            <ToggleRow label={`Walk the Course — $${PREP_COSTS.courseWalk}`} desc="Skip = risk Course Confusion (DNF)" active={courseWalk} onClick={() => !diyPrep && setCourseWalkPaid(v => !v)} />
          </div>
        </Section>

        <Section title={diyPrep ? "PRE-RACE MAINTENANCE CHECKLIST (covered — DIY)" : "PRE-RACE MAINTENANCE CHECKLIST (costs cash, not AP)"}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, opacity: diyPrep ? 0.6 : 1 }}>
            <ToggleRow label={`Check Fluids — $${PREP_COSTS.fluids}`} desc="Skip = 2 engine hazards" active={maintenance.fluids} onClick={() => !diyPrep && setMaintenancePaid(s => ({ ...s, fluids: !s.fluids }))} />
            <ToggleRow label={`Check Tires — $${PREP_COSTS.tires}`}  desc="Skip = 2 tire hazards"   active={maintenance.tires}  onClick={() => !diyPrep && setMaintenancePaid(s => ({ ...s, tires: !s.tires }))} />
            <ToggleRow label={`Check Brakes — $${PREP_COSTS.brakes}`} desc="Skip = 2 brake hazards"  active={maintenance.brakes} onClick={() => !diyPrep && setMaintenancePaid(s => ({ ...s, brakes: !s.brakes }))} />
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
          const apNeeded = extraAp + 1; // DIY prep (if any) + the race itself, both committed at registration
          const canAffordCash = career.cash >= totalCost;
          const canAffordAp = career.ap >= apNeeded;
          const ok = canAffordCash && canAffordAp;
          return (
            <>
              {(prepCost > 0 || diyPrep) && (
                <div style={{ textAlign: "center", fontSize: 9, color: "#888", marginBottom: 8 }}>
                  {diyPrep
                    ? `$${ENTRY_FEE} entry (prep done yourself, +${extraAp} AP)`
                    : `$${ENTRY_FEE} entry + $${prepCost} prep = $${totalCost} total`}
                </div>
              )}
              <button
                onClick={() => ok && onStart(loadout, totalCost, extraAp)}
                disabled={!ok}
                style={{ width: "100%", padding: "14px 0", background: ok ? C.pink : "#1a1a2e", color: ok ? C.purple : "#555", border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: ok ? "pointer" : "not-allowed", letterSpacing: 2 }}
              >
                {diyPrep ? `DIY PREP (${extraAp} AP) + ` : ""}PAY ${totalCost} & GRID UP →
              </button>
              {!canAffordCash && (
                <div style={{ textAlign: "center", fontSize: 9, color: C.red, marginTop: 8 }}>
                  Need ${totalCost} cash (${ENTRY_FEE} entry + ${prepCost} prep) — uncheck some prep or DIY it instead.
                </div>
              )}
              {canAffordCash && !canAffordAp && (
                <div style={{ textAlign: "center", fontSize: 9, color: C.red, marginTop: 8 }}>
                  Need {apNeeded} AP this month ({diyPrep ? "1 for DIY prep + 1 for the race itself" : "1 for the race"}) — only {career.ap} left.
                </div>
              )}
            </>
          );
        })()}
    </Shell>
  );
}
