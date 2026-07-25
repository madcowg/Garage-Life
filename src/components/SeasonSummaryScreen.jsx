import { CARS, MODS } from "../game/data";
import { C } from "../theme";
import { Shell } from "./shared";

const GRADE_COLOR = { S: C.gold, A: C.green, B: C.teal, C: C.orange, D: C.red };

// End-of-season recap (design doc §4) — this is a 1-season MVP, so "season
// complete" and "career complete" are the same screen for now.
export default function SeasonSummaryScreen({ career, grade, unlocksEarned, onNewCareer }) {
  const car = CARS[career.car];
  const winRate = career.racesEntered > 0 ? Math.round((career.wins / career.racesEntered) * 100) : 0;

  return (
    <Shell maxWidth={560}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: C.teal, letterSpacing: 2 }}>SEASON COMPLETE</div>
          <div style={{ fontSize: 64, fontWeight: "bold", color: GRADE_COLOR[grade] || C.white, lineHeight: 1 }}>{grade}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{car.name}{career.variant ? ` (${career.variant})` : ""}</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Stat label="LIFETIME EARNED" value={`$${career.lifetimeCashEarned}`} color={C.gold} />
          <Stat label="FINAL CASH" value={`$${career.cash}`} color={C.gold} />
          <Stat label="REPUTATION" value={career.reputation} color={C.teal} />
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>RACE RECORD</div>
          <div style={{ fontSize: 11 }}>
            {career.racesEntered} entered · {career.wins} won · {career.cleanWins} clean wins · {winRate}% win rate
          </div>
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>UNLOCKED THIS CAREER</div>
          {unlocksEarned.length === 0 ? (
            <div style={{ fontSize: 10, color: "#666" }}>Nothing new this run — everything earned stays unlocked forever, so it's never wasted progress.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {unlocksEarned.map(id => {
                const carDef = CARS[id];
                const modDef = MODS.find(m => m.id === id);
                const label = carDef ? `🚗 ${carDef.name}` : modDef ? `🔧 ${modDef.label}` : id;
                return <div key={id} style={{ fontSize: 11, color: C.gold }}>{label}</div>;
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
          Everything unlocked above is now available at the start of every future career, forever — but the next
          career starts from the same $300/zero-reputation baseline as this one did.
        </div>

        <button
          onClick={onNewCareer}
          style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}
        >
          NEW CAREER →
        </button>
    </Shell>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 8, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}
