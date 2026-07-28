import { CARS } from "../game/data";
import { CAR_SPRITES } from "../game/carAssets";
import { CAR_SELL_PRICE, MAX_OWNED_CARS } from "../game/career";
import { Shell, Section } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { WearMeter } from "./ds/instruments/WearMeter";

const BASE = import.meta.env.BASE_URL;
const GARAGE_BG = `${BASE}garage-life-assets/environments/my-garage.jpg`;

function carSpriteKey(carId, variant) {
  const car = CARS[carId];
  if (!car) return null;
  if (variant && car.spriteVariants?.[variant]) return car.spriteVariants[variant];
  return car.sprite;
}
// Garage-front view when a car has one (the USDM starters); everything
// else falls back to its race-front sprite — still a front 3/4 view, just
// without the dedicated garage angle.
function carImageFor(carId, variant) {
  const sprite = CAR_SPRITES[carSpriteKey(carId, variant)];
  return sprite ? (sprite.garageFront ?? sprite.front) : null;
}

// The player's own garage — a stock two-car bay, the same hard cap as
// MAX_OWNED_CARS (career.js): exactly the active car plus one spare, until
// a bigger garage becomes buyable alongside more race modes/seasons.
// Separate from Dead Reckoning Garage (Rex's parts shop) — this is just
// where the player's own cars live.
export default function MyGarageScreen({ career, onSellCar, onBack }) {
  const ownedCars = career.ownedCars ?? [career.car];
  const spareCars = ownedCars.filter(id => id !== career.car);
  const activeCar = CARS[career.car];
  const bays = [
    { carId: career.car, variant: career.variant, active: true },
    ...spareCars.map(id => ({ carId: id, variant: undefined, active: false })),
  ];

  return (
    <Shell>
      <ScreenHeader
        title="My Garage"
        status={`${ownedCars.length} / ${MAX_OWNED_CARS} bays filled`}
        cash={career.cash}
        nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>}
      />

      <div style={{
        position: "relative", width: "100%", aspectRatio: "960 / 576",
        borderRadius: "var(--gl-radius-panel)", overflow: "hidden", border: "1px solid var(--gl-border)",
        backgroundImage: `url(${GARAGE_BG})`, backgroundSize: "cover", backgroundPosition: "center",
        marginBottom: 16,
      }}>
        {Array.from({ length: MAX_OWNED_CARS }).map((_, i) => {
          const bay = bays[i];
          const img = bay ? carImageFor(bay.carId, bay.variant) : null;
          return (
            <div key={i} style={{ position: "absolute", left: i === 0 ? "27%" : "68%", bottom: "16%", transform: "translateX(-50%)", textAlign: "center" }}>
              {img ? (
                <>
                  <img src={img} alt="" style={{ width: 150, maxWidth: "22vw", imageRendering: "pixelated", filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.55))" }} />
                  <div style={{ marginTop: 4, fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: bay.active ? "var(--gl-teal)" : "var(--gl-text-3)" }}>
                    {bay.active ? "Active" : "Spare"}
                  </div>
                </>
              ) : (
                <div style={{ width: 110, height: 64, border: "1px dashed rgba(157,143,189,0.45)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", background: "rgba(11,10,30,0.5)" }}>
                  empty bay
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Section title="ACTIVE CAR">
        <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{activeCar.name}</div>
        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 2, fontFamily: "var(--gl-font-body)" }}>{activeCar.blurb}</div>
        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <WearMeter label="ENGINE" value={career.wear.engine} />
            <WearMeter label="TIRES" value={career.wear.tires} />
            <WearMeter label="BRAKES" value={career.wear.brakes} />
            <WearMeter label="TRANS" value={career.wear.trans} />
          </div>
        </div>
      </Section>

      {spareCars.length === 0 ? (
        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", textAlign: "center", padding: 12 }}>
          Second bay's open — a Junkyard nat-20 is the only way to fill it this career.
        </div>
      ) : (
        <Section title={`SPARE CARS (${spareCars.length})`}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {spareCars.map(id => (
              <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--gl-panel)", border: "1px solid var(--gl-violet)", borderRadius: "var(--gl-radius-panel)", padding: 10, minWidth: 220 }}>
                <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{CARS[id]?.name ?? id}</div>
                <Button tone="gold" size="sm" onClick={() => onSellCar(id)}>Sell ${CAR_SELL_PRICE}</Button>
              </div>
            ))}
          </div>
        </Section>
      )}
    </Shell>
  );
}
