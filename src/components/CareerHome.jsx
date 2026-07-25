import { CARS } from "../game/data";
import { MAINTAIN_COST, SELF_MAINTAIN_COST, SEASON_LENGTH_MONTHS, ENTRY_FEE } from "../game/career";
import { C } from "../theme";
import { Shell } from "./shared";

function WearBar({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, color: "#888" }}>{label}</div>
      <div style={{ height: 5, background: "#222", borderRadius: 2, marginTop: 2 }}>
        <div style={{ height: 5, width: `${value}%`, background: value > 50 ? C.teal : value > 25 ? C.orange : C.red, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 8, marginTop: 1 }}>{Math.round(value)}%</div>
    </div>
  );
}

function actionBtnStyle(color, disabled) {
  return {
    textAlign: "left", padding: 14, background: disabled ? "#0a0a14" : C.panel2,
    border: `1px solid ${disabled ? C.border : color}`, borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer", color: disabled ? "#555" : C.white,
    opacity: disabled ? 0.6 : 1, fontFamily: "monospace", fontSize: 12, width: "100%",
  };
}

// The between-races hub — month counter, resources, car condition, and the
// 3 monthly actions (design doc §1). Purely presentational: the parent
// (App.jsx) owns all career state and resolution logic.
export default function CareerHome({ career, onRace, onWork, onMaintain, onShop, onJunkyard, onStreetRace, onViewLog, onViewCodex }) {
  const car = CARS[career.car];
  const emp = career.employment;
  const maintainCost = emp.status === "unemployed" ? SELF_MAINTAIN_COST : MAINTAIN_COST;
  const canMaintain = career.cash >= maintainCost && !career.maintainedThisMonth;

  return (
    <Shell maxWidth={640}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>GARAGE LIFE</div>
            <div style={{ fontSize: 11, color: C.teal, letterSpacing: 2 }}>MONTH {career.month} / {SEASON_LENGTH_MONTHS} — {career.ap} AP LEFT</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onViewCodex} style={{ padding: "8px 12px", background: C.panel, color: C.pink, border: `1px solid ${C.pink}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>📖 CODEX</button>
            <button onClick={onViewLog} style={{ padding: "8px 12px", background: C.panel, color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>📋 COURSE LOG</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 8, color: "#888" }}>CASH</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.gold }}>${career.cash}</div>
          </div>
          <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 8, color: "#888" }}>POINTS</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.teal }}>{career.reputation}</div>
          </div>
          <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 8, color: "#888" }}>JOB</div>
            <div style={{ fontSize: 10, fontWeight: "bold", color: emp.status === "employed" ? C.green : emp.status === "pending" ? C.orange : C.red }}>
              {emp.status === "employed" ? `Employed (${emp.tenureMonths}mo)` : emp.status === "pending" ? "Starts next month" : "Unemployed"}
            </div>
          </div>
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>{car.name} — CAR CONDITION</div>
          <div style={{ display: "flex", gap: 12 }}>
            <WearBar label="ENGINE" value={career.wear.engine} />
            <WearBar label="TIRES" value={career.wear.tires} />
            <WearBar label="BRAKES" value={career.wear.brakes} />
            <WearBar label="TRANS" value={career.wear.trans} />
          </div>
        </div>

        <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>THIS MONTH'S ACTIONS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={onRace} disabled={career.racedThisMonth} style={actionBtnStyle(C.pink, career.racedThisMonth)}>
            🏁 RACE <span style={{ fontSize: 9, opacity: 0.7 }}>
              — {career.racedThisMonth ? "already run this month — one sanctioned event per month" : `1 AP, $${ENTRY_FEE} entry fee, autocross event at the Airfield`}
            </span>
          </button>

          {emp.status === "employed" && (
            <button onClick={onWork} style={actionBtnStyle(C.teal)}>
              💼 WORK <span style={{ fontSize: 9, opacity: 0.7 }}>— 1 AP, ${emp.baseSalary}/mo base salary</span>
            </button>
          )}
          {emp.status === "pending" && (
            <div style={actionBtnStyle(C.orange, true)}>💼 New job starts next month</div>
          )}
          {emp.status === "unemployed" && (
            <button onClick={onWork} style={actionBtnStyle(C.orange)}>
              🔍 LOOK FOR WORK <span style={{ fontSize: 9, opacity: 0.7 }}>— 1 AP, unemployed</span>
            </button>
          )}

          <button onClick={onMaintain} disabled={!canMaintain} style={actionBtnStyle(C.green, !canMaintain)}>
            🔧 MAINTAIN <span style={{ fontSize: 9, opacity: 0.7 }}>
              — {career.maintainedThisMonth ? "already serviced this month" : `1 AP, $${maintainCost}${emp.status === "unemployed" ? " (DIY, no job)" : ""}, full service`}
            </span>
          </button>

          <button onClick={onShop} style={actionBtnStyle(C.gold)}>
            🏪 SHOP <span style={{ fontSize: 9, opacity: 0.7 }}>— 1 AP, buy tires / install mods at Dead Reckoning Garage</span>
          </button>

          <button onClick={onJunkyard} style={actionBtnStyle("#8a8a4a")}>
            🗑️ JUNKYARD <span style={{ fontSize: 9, opacity: 0.7 }}>— 1 AP, no cost, dig for parts worth cash</span>
          </button>

          <button onClick={onStreetRace} style={actionBtnStyle(C.red)}>
            🌃 STREET RACING <span style={{ fontSize: 9, opacity: 0.7 }}>— 1 AP, no entry fee, off the books — risky, no points</span>
          </button>
        </div>
    </Shell>
  );
}
