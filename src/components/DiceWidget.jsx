import { useState, useEffect, useRef } from "react";

// Standard six-face pip layouts on a 3x3 grid (row, col), 0-indexed.
const PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Face({ value, color }) {
  const pips = PIPS[value] || PIPS[1];
  return (
    <div style={{
      width: 44, height: 44, background: "#12122A", border: `2px solid ${color}`,
      borderRadius: 6, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)",
      padding: 5, boxShadow: `0 0 10px ${color}55`,
    }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const r = Math.floor(i / 3), c = i % 3;
        const active = pips.some(([pr, pc]) => pr === r && pc === c);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />}
          </div>
        );
      })}
    </div>
  );
}

// Builds the compact transparency line under the die — design doc §9's
// whole point is that build advantages show up here, not as hidden math.
// Only rendered when there's actually something to show (an advantage
// reroll happened, or a modifier applied) — a plain unmodified roll shows
// nothing extra, keeping the common case uncluttered.
function chainText(rawRoll, secondRoll, modifier, finalValue) {
  const parts = [];
  if (secondRoll != null) parts.push(`${rawRoll}/${secondRoll}→${Math.max(rawRoll, secondRoll)}`);
  else if (rawRoll != null) parts.push(`${rawRoll}`);
  if (modifier) parts.push(`${modifier > 0 ? "+" : ""}${modifier}`);
  parts.push(`=${finalValue}`);
  return parts.join(" ");
}

// rollToken: change this value every time a new roll should play (e.g. an
// incrementing counter). value: the true, final rolled result (1-6).
// rawRoll/secondRoll/modifier: optional — the build-driven chain behind
// `value` (design doc §9: maintenance modifier, advantage rerolls, Safety's
// flat bonus), shown transparently rather than folded invisibly into value.
export default function DiceWidget({ rollToken, value, label, rawRoll, secondRoll, modifier }) {
  const [displayFace, setDisplayFace] = useState(value || 1);
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef(null);
  const prevToken = useRef(rollToken);

  useEffect(() => {
    if (rollToken === prevToken.current || rollToken == null) return;
    prevToken.current = rollToken;
    setRolling(true);
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setDisplayFace(1 + Math.floor(Math.random() * 6));
      ticks++;
      if (ticks > 9) {
        clearInterval(intervalRef.current);
        setDisplayFace(value);
        setRolling(false);
      }
    }, 55);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollToken]);

  const color = rolling ? "#FFD700" : (value <= 2 ? "#FF2D55" : value <= 4 ? "#FF6B35" : "#00C853");
  const showChain = !rolling && (secondRoll != null || !!modifier);

  return (
    <div style={{
      position: "fixed", right: 16, bottom: 16, zIndex: 50,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      fontFamily: "monospace",
    }}>
      {label && <div style={{ fontSize: 8, color: "#888", letterSpacing: 1 }}>{label}</div>}
      <Face value={displayFace} color={color} />
      {showChain && (
        <div style={{ fontSize: 8, color: "#aaa", textAlign: "center", maxWidth: 90 }}>
          {chainText(rawRoll, secondRoll, modifier, value)}
        </div>
      )}
    </div>
  );
}
