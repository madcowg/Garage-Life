import { CARS, MODS } from "../game/data";
import { SEASON_GRADE_LABEL } from "../game/career";
import { Shell } from "./shared";
import { Button } from "./ds/controls/Button";
import { StatTile } from "./ds/instruments/StatTile";

const GRADE_TONE = { S: "gold", A: "green", B: "teal", C: "orange", D: "red" };

// End-of-season recap (design doc §4) — this is a 1-season MVP, so "season
// complete" and "career complete" are the same screen for now.
export default function SeasonSummaryScreen({ career, grade, unlocksEarned, onNewCareer }) {
  const car = CARS[career.car];
  const winRate = career.racesEntered > 0 ? Math.round((career.wins / career.racesEntered) * 100) : 0;
  const gradeTone = GRADE_TONE[grade] || "teal";

  return (
    <Shell>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-teal)", letterSpacing: 2 }}>POINTS CHASE CONCLUDED</div>
          <div style={{ fontSize: 64, fontWeight: "bold", color: `var(--gl-${gradeTone})`, lineHeight: 1 }}>{grade}</div>
          <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-gold)", fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{SEASON_GRADE_LABEL[grade] || ""}</div>
          <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-text-3)", marginTop: 4 }}>{car.name}{career.variant ? ` (${career.variant})` : ""}</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <StatTile label="LIFETIME EARNED" value={career.lifetimeCashEarned} prefix="$" tone="gold" />
          <StatTile label="FINAL CASH" value={career.cash} prefix="$" tone="gold" />
          <StatTile label="POINTS" value={career.reputation} tone="teal" />
        </div>

        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 8 }}>RACE RECORD</div>
          <div style={{ fontSize: "var(--gl-size-label)" }}>
            {career.racesEntered} entered · {career.wins} won · {career.cleanWins} clean wins · {winRate}% win rate
          </div>
        </div>

        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 8 }}>UNLOCKED THIS CAREER</div>
          {unlocksEarned.length === 0 ? (
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)" }}>Nothing new this run — everything earned stays unlocked forever, so it's never wasted progress.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {unlocksEarned.map(id => {
                const carDef = CARS[id];
                const modDef = MODS.find(m => m.id === id);
                const label = carDef ? carDef.name : modDef ? modDef.label : id;
                return <div key={id} style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-gold)" }}>{label}</div>;
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", margin: "12px 0", lineHeight: 1.5 }}>
          Everything unlocked above is now available at the start of every future career, forever — but the next
          career starts from the same $300/zero-reputation baseline as this one did.
        </div>

        <Button tone="pink" size="lg" block onClick={onNewCareer}>New career</Button>
    </Shell>
  );
}
