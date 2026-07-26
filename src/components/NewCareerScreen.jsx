import { useState } from "react";
import { CARS } from "../game/data";
import { STARTING_CASH, STARTER_CASH_DELTA, SEASON_LENGTH_MONTHS } from "../game/career";
import { Section, Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { CarCard } from "./ds/cards/CarCard";

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

  // Every mapped car that isn't a starter, isn't unlocked yet, and isn't a
  // secret (those stay hidden entirely) — including "legend" tier, which
  // has sprite art wired but no in-career unlock path yet. Shown as a
  // silhouette + "???" (see CarCard mystery cards below), not the real
  // name/art/stats, so growing this list previews how much more there is
  // to find without spoiling any of it.
  const lockedCars = Object.entries(CARS).filter(
    ([id, c]) => (c.tier === "unlockable" || c.tier === "legend") && !meta.unlockedCars.includes(id)
  );

  return (
    <Shell>
      <ScreenHeader title={playerName ?? "My Garage Life"} status={`New career — ${SEASON_LENGTH_MONTHS}-month season`} />

      <Section title="CHOOSE YOUR STARTER">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(CARS).filter(([, c]) => c.tier === "starter").map(([id, c]) => (
            <CarCard
              key={id} carId={id} variant={id === "miata" ? variant : undefined}
              tone="pink" marker selected={car === id} onClick={() => setCar(id)}
              name={c.name} desc={c.blurb}
              stats={`HP ${c.hp} · HDL ${c.handling} · GRIP ${c.grip} · TRN ${c.trans}`}
              footer={<div style={{ fontSize: 9, color: "var(--gl-text-3)" }}>{cashLabel(id)}</div>}
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
              <CarCard key={id} carId={id} tone="pink" marker selected={car === id} onClick={() => setCar(id)} name={c.name} desc={c.blurb} />
            ))}
          </div>
        </Section>
      )}

      <Section title={`STILL LOCKED (${lockedCars.length})`} collapsible defaultOpen={false}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {lockedCars.map(([id]) => (
            <CarCard key={id} locked lockNote="earn this during a career" name="???" />
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
