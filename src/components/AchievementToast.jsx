import { useEffect, useState } from "react";

const AUTO_COLLAPSED_MS = 6000; // time before an untouched banner dismisses itself
const EXPANDED_MS = 5000; // time after the quip is revealed before it dismisses
const FADE_MS = 300;

// Full-width banner docked to the top of the screen — unlike every other
// reward moment in this game (ActionResultScreen), an achievement shouldn't
// stop play to be acknowledged. Collapsed state only names the achievement;
// clicking it reveals the quip in place. App.jsx queues one achievement id
// at a time (achievementPopupQueue) so a run that unlocks several in one
// action shows them in sequence, not stacked.
export default function AchievementToast({ achievement, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setClosing(false);
  }, [achievement.id]);

  useEffect(() => {
    if (closing) return;
    const ms = expanded ? EXPANDED_MS : AUTO_COLLAPSED_MS;
    const timer = setTimeout(() => setClosing(true), ms);
    return () => clearTimeout(timer);
  }, [expanded, closing, achievement.id]);

  useEffect(() => {
    if (!closing) return;
    const removeTimer = setTimeout(onDismiss, FADE_MS);
    return () => clearTimeout(removeTimer);
  }, [closing, onDismiss]);

  const handleClick = () => {
    if (!expanded) setExpanded(true);
    else setClosing(true);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, cursor: "pointer",
        display: "flex", justifyContent: "center",
        opacity: closing ? 0 : 1, transform: closing ? "translateY(-8px)" : "translateY(0)",
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      <div style={{
        width: "min(560px, 100%)", margin: "0 12px", marginTop: 12,
        background: "var(--gl-panel)", border: "1px solid var(--gl-gold)",
        borderRadius: "var(--gl-radius-panel)", padding: "10px 16px",
        boxShadow: "0 0 16px rgba(var(--gl-gold-rgb),0.35), var(--gl-inset-highlight)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--gl-font-display)", fontSize: "var(--gl-size-micro)", color: "var(--gl-gold)", letterSpacing: "var(--gl-track-label)", whiteSpace: "nowrap" }}>NEW ACHIEVEMENT</div>
          <div style={{ fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-text-1)", textAlign: "center" }}>
            {achievement.title}
          </div>
        </div>
        {expanded && achievement.quip && (
          <div style={{ fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 6, lineHeight: 1.4, textAlign: "center" }}>
            {achievement.quip}
          </div>
        )}
        {!expanded && (
          <div style={{ fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 2, textAlign: "center" }}>
            tap for details
          </div>
        )}
      </div>
    </div>
  );
}
