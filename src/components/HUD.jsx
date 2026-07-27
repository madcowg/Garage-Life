import { CARS } from "../game/data";
import { WearMeter } from "./ds/instruments/WearMeter";

// Car condition only now — the minimap and elapsed/target time moved onto
// RoadView itself as HUD overlays (top-left / top-center of the race
// visual, not a separate panel below it). Shares the same WearMeter used on
// CareerHome so condition reads identically everywhere in the game.
export default function HUD({ loadout, wear }) {
  const showEngine = loadout.gauges.oilGauge || loadout.gauges.coolantGauge || loadout.gauges.boostGauge;
  const showTrans = loadout.gauges.transGauge;
  const car = CARS[loadout.car];

  return (
    <div style={{
      background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10,
      marginBottom: 10,
    }}>
      <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: "var(--gl-track-label)", marginBottom: 8, textTransform: "uppercase" }}>{car.name} — car condition</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <WearMeter label="ENGINE" value={wear.engine} visible={showEngine} />
        <WearMeter label="TIRES"  value={wear.tires}  visible={true} />
        <WearMeter label="BRAKES" value={wear.brakes} visible={true} />
        <WearMeter label="TRANS"  value={wear.trans}  visible={showTrans} />
      </div>
    </div>
  );
}
