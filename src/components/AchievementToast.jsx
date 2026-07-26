import { useEffect, useState } from "react";

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
        maxWidth: 280, background: "var(--gl-panel)", border: "1px solid var(--gl-gold)",
        borderRadius: "var(--gl-radius-panel)", padding: "10px 14px", fontFamily: "var(--gl-font-mono)",
        boxShadow: "0 0 16px rgba(var(--gl-gold-rgb),0.35), var(--gl-inset-highlight)",
        opacity: closing ? 0 : 1, transform: closing ? "translateX(12px)" : "translateX(0)",
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-gold)", fontWeight: 700, letterSpacing: 2 }}>NEW ACHIEVEMENT!</div>
      <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-text-1)", marginTop: 4 }}>
        {achievement.title}
      </div>
      {achievement.quip && (
        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4, lineHeight: 1.4 }}>{achievement.quip}</div>
      )}
    </div>
  );
}
