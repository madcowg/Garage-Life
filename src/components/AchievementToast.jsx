import { useEffect, useState } from "react";
import { C } from "../theme";

const DISPLAY_MS = 5000;
const FADE_MS = 300;

// Fixed-position, non-blocking popup — unlike every other reward moment in
// this game (ActionResultScreen), an achievement shouldn't stop play to be
// acknowledged. Auto-dismisses itself; a click just skips the wait. App.jsx
// queues one achievement id at a time (achievementPopupQueue) so a run that
// unlocks several in one action shows them in sequence, not stacked.
export default function AchievementToast({ achievement, onDismiss }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setClosing(false);
    const showTimer = setTimeout(() => setClosing(true), DISPLAY_MS);
    return () => clearTimeout(showTimer);
  }, [achievement.id]);

  useEffect(() => {
    if (!closing) return;
    const removeTimer = setTimeout(onDismiss, FADE_MS);
    return () => clearTimeout(removeTimer);
  }, [closing, onDismiss]);

  return (
    <div
      onClick={() => setClosing(true)}
      style={{
        position: "fixed", top: 14, right: 14, zIndex: 60, cursor: "pointer",
        maxWidth: 280, background: "rgba(10,10,20,0.94)", border: `1px solid ${C.gold}`,
        borderRadius: 6, padding: "10px 14px", fontFamily: "monospace",
        boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
        opacity: closing ? 0 : 1, transform: closing ? "translateX(12px)" : "translateX(0)",
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      <div style={{ fontSize: 9, color: C.gold, fontWeight: "bold", letterSpacing: 2 }}>🏆 NEW ACHIEVEMENT!</div>
      <div style={{ fontSize: 12, fontWeight: "bold", color: C.white, marginTop: 4 }}>
        {achievement.icon} {achievement.title}
      </div>
      {achievement.quip && (
        <div style={{ fontSize: 9, color: "#999", marginTop: 4, lineHeight: 1.4 }}>{achievement.quip}</div>
      )}
    </div>
  );
}
