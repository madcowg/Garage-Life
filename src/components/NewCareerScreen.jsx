import { useState } from "react";
import { CARS } from "../game/data";
import { STARTING_CASH, SEASON_LENGTH_MONTHS } from "../game/career";
import { C } from "../theme";
import { Section, cardBtnStyle, Shell } from "./shared";

// Shown once at the start of a career (and again after Season Complete) —
// picks the starting car/variant. Mods/tire/gauges are chosen per-race in
// PreRaceSetup instead, since those can change race to race.
export default function NewCareerScreen({ meta, onStart }) {
  const [car, setCar] = useState("miata");
  const [variant, setVariant] = useState("NA");

  // Secret cars (tier: "secret") stay out of the "STILL LOCKED" grid below
  // entirely — no placeholder, no hint — but once actually unlocked they
  // belong in this same "available to pick" list right alongside the
  // regular unlockable JDM roster.
  const unlockedExtraCars = Object.entries(CARS).filter(
    ([id, c]) => (c.tier === "unlockable" || c.tier === "secret") && meta.unlockedCars.includes(id)
  );

  return (
    <Shell maxWidth={640}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>GARAGE LIFE</div>
        <div style={{ fontSize: 11, color: C.teal, letterSpacing: 2, marginBottom: 20 }}>
          NEW CAREER — {SEASON_LENGTH_MONTHS}-MONTH SEASON
        </div>

        <Section title="CHOOSE YOUR STARTER">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(CARS).filter(([, c]) => c.tier === "starter").map(([id, c]) => (
              <button key={id} onClick={() => setCar(id)} style={cardBtnStyle(car === id)}>
                <div style={{ fontWeight: "bold", fontSize: 11 }}>{c.name}</div>
                <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{c.blurb}</div>
                <div style={{ fontSize: 9, color: C.teal, marginTop: 6 }}>HP {c.hp} · HDL {c.handling} · GRIP {c.grip} · TRN {c.trans}</div>
              </button>
            ))}
          </div>
          {car === "miata" && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {CARS.miata.variants.map(v => (
                <button key={v} onClick={() => setVariant(v)} style={{ padding: "6px 14px", background: variant === v ? "#1c1c3a" : C.panel, border: `1px solid ${variant === v ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white, fontSize: 10, fontFamily: "monospace" }}>
                  {v === "NA" ? "1994 NA (Red)" : "2001 NB (Blue)"}
                </button>
              ))}
            </div>
          )}
        </Section>

        {unlockedExtraCars.length > 0 && (
          <Section title="UNLOCKED FROM PAST CAREERS">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {unlockedExtraCars.map(([id, c]) => (
                <button key={id} onClick={() => setCar(id)} style={cardBtnStyle(car === id)}>
                  <div style={{ fontWeight: "bold", fontSize: 11 }}>{c.name}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{c.blurb}</div>
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="STILL LOCKED (earn these during a career)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
            {Object.entries(CARS).filter(([id, c]) => c.tier === "unlockable" && !meta.unlockedCars.includes(id)).map(([id, c]) => (
              <div key={id} style={{ padding: 8, background: "#0a0a14", border: `1px dashed ${C.border}`, borderRadius: 4, opacity: 0.6 }}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>🔒 {c.name}</div>
                <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>{c.blurb}</div>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
          Every career starts fresh — ${STARTING_CASH} cash, zero reputation, no wear damage — but anything you've
          unlocked from past careers is available from day one. Mods are chosen before each race, not here.
        </div>

        <button
          onClick={() => onStart({ car, variant })}
          style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}
        >
          START CAREER →
        </button>
    </Shell>
  );
}
