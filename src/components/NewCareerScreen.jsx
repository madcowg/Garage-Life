import { useState } from "react";
import { CARS } from "../game/data";
import { STARTING_CASH, STARTER_CASH_DELTA, SEASON_LENGTH_MONTHS } from "../game/career";
import { Section, Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { CarCard } from "./ds/cards/CarCard";
import { CarStatLine } from "./ds/instruments/StatIcon";

function cashLabel(id) {
  const delta = STARTER_CASH_DELTA[id] ?? 0;
  if (delta === 0) return `$${STARTING_CASH} starting cash`;
  return `$${STARTING_CASH + delta} starting cash (${delta > 0 ? "+" : ""}${delta})`;
}

// Fixed 3-slot starter lineup — NA and NB are separate top-level picks (not
// a variant toggle on one Miata card) so each gets its own card, its own
// sprite, and its own selection state.
const STARTER_PICKS = [
  { id: "miata", variant: "NA", name: "Mazda MX-5 Miata (NA)" },
  { id: "miata", variant: "NB", name: "Mazda MX-5 Miata (NB)" },
  { id: "integra", variant: undefined, name: CARS.integra.name },
];

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
          {STARTER_PICKS.map(pick => {
            const c = CARS[pick.id];
            const isSelected = car === pick.id && (!pick.variant || variant === pick.variant);
            return (
              <CarCard
                key={pick.name} carId={pick.id} variant={pick.variant}
                tone="pink" marker selected={isSelected}
                onClick={() => { setCar(pick.id); if (pick.variant) setVariant(pick.variant); }}
                name={pick.name} desc={c.blurb}
                stats={<CarStatLine hp={c.hp} handling={c.handling} grip={c.grip} trans={c.trans} />}
                footer={<div style={{ fontSize: 9, color: "var(--gl-text-3)" }}>{cashLabel(pick.id)}</div>}
              />
            );
          })}
        </div>
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
          {lockedCars.map(([id, c]) => (
            <CarCard key={id} carId={id} silhouette locked lockNote="earn this during a career" name="???" desc={c.blurb} />
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
