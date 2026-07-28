import { CARS } from "../game/data";
import { CAR_SELL_PRICE } from "../game/career";
import { Shell, Section } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { CarCard } from "./ds/cards/CarCard";
import { WearMeter } from "./ds/instruments/WearMeter";

// The player's own garage — every car owned this career, separate from
// Dead Reckoning Garage (Rex's parts shop). The active car shows full
// condition; spares (from a Junkyard nat-20 claim) are here to look at or
// sell, not to install parts on — only the active car races.
export default function MyGarageScreen({ career, onSellCar, onBack }) {
  const ownedCars = career.ownedCars ?? [career.car];
  const spareCars = ownedCars.filter(id => id !== career.car);
  const activeCar = CARS[career.car];

  return (
    <Shell>
      <ScreenHeader
        title="My Garage"
        status={`${ownedCars.length} car${ownedCars.length > 1 ? "s" : ""} owned`}
        nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>}
      />

      <Section title="ACTIVE CAR">
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
          <CarCard carId={career.car} variant={career.variant} tone="teal" name={activeCar.name} desc={activeCar.blurb} />
          <div style={{ flex: 1, minWidth: 200, background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10 }}>
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: "var(--gl-track-label)", marginBottom: 8, textTransform: "uppercase" }}>Condition</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <WearMeter label="ENGINE" value={career.wear.engine} />
              <WearMeter label="TIRES" value={career.wear.tires} />
              <WearMeter label="BRAKES" value={career.wear.brakes} />
              <WearMeter label="TRANS" value={career.wear.trans} />
            </div>
          </div>
        </div>
      </Section>

      <Section title={`SPARE CARS (${spareCars.length})`}>
        {spareCars.length === 0 ? (
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", textAlign: "center", padding: 20 }}>
            No spares yet — a Junkyard nat-20 is the only way to pick up a second car this career.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {spareCars.map(id => (
              <CarCard
                key={id} carId={id} tone="violet"
                name={CARS[id]?.name ?? id} desc="Not your active car — just sitting here."
                footer={<Button tone="gold" size="sm" block onClick={() => onSellCar(id)}>Sell ${CAR_SELL_PRICE}</Button>}
              />
            ))}
          </div>
        )}
      </Section>
    </Shell>
  );
}
