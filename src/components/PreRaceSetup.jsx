import { useState } from "react";
import { CARS, MODS, TIRE_OPTIONS, GAUGE_DEFS } from "../game/data";
import { isModAvailable } from "../game/meta";
import { C } from "../theme";
import { Section, ToggleRow } from "./shared";

// Shown when the player spends a Race action from CareerHome — mods/tire/
// gauges/maintenance-checklist, same as the old one-shot Setup screen, minus
// the car picker (fixed for the career) and filtered to unlocked mods only.
export default function PreRaceSetup({ career, meta, onStart, onBack }) {
  const [mods, setMods] = useState({});
  const [tire, setTire] = useState("street_perf");
  const [gauges, setGauges] = useState({});
  const [maintenance, setMaintenance] = useState({ fluids: true, tires: true, brakes: true });

  const car = CARS[career.car];
  const availableMods = MODS.filter(m => isModAvailable(meta, m.id, m));
  const lockedMods = MODS.filter(m => !isModAvailable(meta, m.id, m));

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
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

        <Section title="TIRE COMPOUND">
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TIRE_OPTIONS).map(([id, t]) => (
              <button key={id} onClick={() => setTire(id)} style={{ flex: 1, textAlign: "left", padding: 10, background: tire === id ? "#1c1c3a" : C.panel, border: `1px solid ${tire === id ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.label}</div>
                <div style={{ fontSize: 9, color: "#888" }}>Grip +{t.grip} · Wear ×{t.wearRate}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="GAUGES (visibility, not performance)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {GAUGE_DEFS.map(g => (
              <ToggleRow key={g.id} label={g.label} desc={`Reveals ${g.covers} stress`} active={!!gauges[g.id]} onClick={() => setGauges(s => ({ ...s, [g.id]: !s[g.id] }))} />
            ))}
          </div>
        </Section>

        <Section title="PRE-RACE MAINTENANCE CHECKLIST">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <ToggleRow label="Check Fluids" desc="Skip = engine risk" active={maintenance.fluids} onClick={() => setMaintenance(s => ({ ...s, fluids: !s.fluids }))} />
            <ToggleRow label="Check Tires"  desc="Skip = tire risk"   active={maintenance.tires}  onClick={() => setMaintenance(s => ({ ...s, tires: !s.tires }))} />
            <ToggleRow label="Check Brakes" desc="Skip = brake risk"  active={maintenance.brakes} onClick={() => setMaintenance(s => ({ ...s, brakes: !s.brakes }))} />
          </div>
        </Section>

        <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
          Your course is randomly generated on rollout. Retrying after a run stays on the same course — like a real
          autocross event, you get multiple runs at the same layout — logged to your Course Log after each finish.
        </div>

        <button
          onClick={() => onStart({ car: career.car, variant: career.variant, mods, tire, gauges, maintenance })}
          style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}
        >
          ROLL OUT →
        </button>
      </div>
    </div>
  );
}
