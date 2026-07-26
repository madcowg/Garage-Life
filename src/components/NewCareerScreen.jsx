import { useState } from "react";
import { CARS } from "../game/data";
import { STARTING_CASH, STARTER_CASH_DELTA, SEASON_LENGTH_MONTHS } from "../game/career";
import { Section, Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { ChoiceBox } from "./ds/controls/ChoiceBox";
import { Button } from "./ds/controls/Button";

function cashLabel(id) {
  const delta = STARTER_CASH_DELTA[id] ?? 0;
  if (delta === 0) return `$${STARTING_CASH} starting cash`;
  return `$${STARTING_CASH + delta} starting cash (${delta > 0 ? "+" : ""}${delta})`;
}

// Shown once at the start of a career (and again after Season Complete) —
// picks the starting car/variant. Mods/tire/gauges are chosen per-race in
// PreRaceSetup instead, since those can change race to race.
export default function NewCareerScreen({ meta, onStart, playerName }) {
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
    <Shell>
      <ScreenHeader title={playerName ?? "My Garage Life"} status={`New career — ${SEASON_LENGTH_MONTHS}-month season`} />

      <Section title="CHOOSE YOUR STARTER">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(CARS).filter(([, c]) => c.tier === "starter").map(([id, c]) => (
            <ChoiceBox
              key={id} tone="pink" marker selected={car === id} onClick={() => setCar(id)}
              title={c.name} desc={c.blurb}
              meta={`HP ${c.hp} · HDL ${c.handling} · GRIP ${c.grip} · TRN ${c.trans} — ${cashLabel(id)}`}
            />
          ))}
        </div>
        {car === "miata" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {CARS.miata.variants.map(v => (
              <Button key={v} tone="pink" variant={variant === v ? "filled" : "outlined"} size="sm" onClick={() => setVariant(v)}>
                {v === "NA" ? "1994 NA (Red)" : "2001 NB (Blue)"}
              </Button>
            ))}
          </div>
        )}
      </Section>

      {unlockedExtraCars.length > 0 && (
        <Section title="UNLOCKED FROM PAST CAREERS">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {unlockedExtraCars.map(([id, c]) => (
              <ChoiceBox key={id} tone="pink" marker selected={car === id} onClick={() => setCar(id)} title={c.name} desc={c.blurb} />
            ))}
          </div>
        </Section>
      )}

      <Section title="STILL LOCKED (earn these during a career)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
          {Object.entries(CARS).filter(([id, c]) => c.tier === "unlockable" && !meta.unlockedCars.includes(id)).map(([id, c]) => (
            <ChoiceBox key={id} locked lockNote="earn this during a career" title={c.name} desc={c.blurb} />
          ))}
        </div>
      </Section>

      <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", margin: "12px 0", lineHeight: 1.5 }}>
        Every career starts fresh — zero reputation, no wear damage — but anything you've
        unlocked from past careers is available from day one. Mods are chosen before each race, not here.
      </div>

      <Button tone="pink" size="lg" block onClick={() => onStart({ car, variant })}>Start career</Button>
    </Shell>
  );
}
