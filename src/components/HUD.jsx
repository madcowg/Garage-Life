import { CARS } from "../game/data";

const C = { teal: "#00F5D4", orange: "#FF6B35", red: "#FF2D55", gold: "#FFD700", white: "#E8EAF6" };

function WearMeter({ label, value, visible }) {
  return (
    <div style={{ minWidth: 52 }}>
      <div style={{ fontSize: 7, color: "#888" }}>{label}</div>
      {visible ? (
        <>
          <div style={{ height: 4, background: "#222", borderRadius: 2, marginTop: 2 }}>
            <div style={{ height: 4, width: `${value}%`, background: value > 50 ? C.teal : value > 25 ? C.orange : C.red, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 8, marginTop: 1 }}>{Math.round(value)}%</div>
        </>
      ) : (
        <div style={{ fontSize: 10, color: "#444" }}>???</div>
      )}
    </div>
  );
}

// Car condition only now — the minimap and elapsed/target time moved onto
// RoadView itself as HUD overlays (top-left / top-center of the race
// visual, not a separate panel below it).
export default function HUD({ loadout, wear }) {
  const showEngine = loadout.gauges.oilGauge || loadout.gauges.coolantGauge || loadout.gauges.boostGauge;
  const showTrans = loadout.gauges.transGauge;
  const car = CARS[loadout.car];

  return (
    <div style={{
      background: "#0a0a14", border: "1px solid #242440", borderRadius: 4, padding: 8,
      marginBottom: 10, fontFamily: "monospace",
    }}>
      <div style={{ fontSize: 9, color: C.gold, fontWeight: "bold", marginBottom: 6 }}>{car.name}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <WearMeter label="ENGINE" value={wear.engine} visible={showEngine} />
        <WearMeter label="TIRES"  value={wear.tires}  visible={true} />
        <WearMeter label="BRAKES" value={wear.brakes} visible={true} />
        <WearMeter label="TRANS"  value={wear.trans}  visible={showTrans} />
      </div>
    </div>
  );
}
