import { C } from "../theme";
import { CARD_TYPES } from "../game/v2";

// Vaporwave card frames by type — teal Technique, pink Aggression, gold
// Utility, red Hazard, gray Strain (per the card game design doc §10).
const TYPE_STYLE = {
  [CARD_TYPES.TECHNIQUE]:  { border: C.teal,   glow: "0,245,212",  label: "TECHNIQUE" },
  [CARD_TYPES.AGGRESSION]: { border: C.pink,   glow: "255,110,199", label: "AGGRESSION" },
  [CARD_TYPES.UTILITY]:    { border: C.gold,   glow: "255,215,0",  label: "UTILITY" },
  [CARD_TYPES.HAZARD]:     { border: C.red,    glow: "255,45,85",  label: "HAZARD" },
  [CARD_TYPES.STRAIN]:     { border: "#666",   glow: "120,120,120", label: "UNSETTLED" },
};

const AFFINITY_ICON = {
  start: "🚦", finish: "🏁", braking: "🛑", tight: "🔄", flowing: "↩️",
  transition: "🔀", precision: "🎯", power: "⚡", straight: "⬆", complex: "🧩", any: "✳️",
};

function wearText(wear) {
  const parts = Object.entries(wear ?? {}).filter(([, v]) => v > 0).map(([k, v]) => `${k.slice(0, 2).toUpperCase()} ${v}`);
  return parts.join(" · ");
}

export function GameCard({ card, onClick, disabled, highlight, small, matchesSegment }) {
  const style = TYPE_STYLE[card.type] ?? TYPE_STYLE[CARD_TYPES.TECHNIQUE];
  const playable = !disabled && onClick;
  const w = small ? 88 : 108, h = small ? 124 : 152;
  return (
    <button
      onClick={playable ? onClick : undefined}
      disabled={!playable}
      style={{
        width: w, height: h, flexShrink: 0, textAlign: "left",
        background: "linear-gradient(180deg, #12122A 0%, #0a0a14 100%)",
        border: `2px solid ${style.border}`, borderRadius: 6, padding: 6,
        color: C.white, fontFamily: "monospace", position: "relative",
        cursor: playable ? "pointer" : "default",
        opacity: disabled ? 0.45 : 1,
        boxShadow: highlight ? `0 0 14px rgba(${style.glow},0.8)` : `0 0 6px rgba(${style.glow},0.25)`,
        transform: highlight ? "translateY(-6px)" : "none",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
    >
      <div style={{ fontSize: 6, color: style.border, letterSpacing: 1 }}>{style.label}</div>
      <div style={{ fontSize: small ? 8 : 9, fontWeight: "bold", lineHeight: 1.2, minHeight: small ? 20 : 24 }}>{card.name}</div>
      <div style={{ fontSize: 9, marginTop: 2 }}>
        {(card.affinity ?? []).map(tag => AFFINITY_ICON[tag] ?? "").join(" ")}
        {matchesSegment && <span style={{ color: C.green, fontSize: 7 }}> ✓ON</span>}
      </div>
      {card.timeDelta !== 0 && card.timeDelta != null && (
        <div style={{ fontSize: small ? 12 : 15, fontWeight: "bold", color: card.timeDelta < 0 ? C.green : C.orange, marginTop: 2 }}>
          {card.timeDelta > 0 ? "+" : ""}{card.timeDelta.toFixed(2)}s
        </div>
      )}
      {wearText(card.wear) && <div style={{ fontSize: 6, color: C.orange, marginTop: 1 }}>{wearText(card.wear)}</div>}
      <div style={{ fontSize: 6, color: "#888", position: "absolute", bottom: 5, left: 6, right: 6, lineHeight: 1.25, maxHeight: small ? 24 : 34, overflow: "hidden" }}>
        {card.text}
      </div>
    </button>
  );
}

// Card back — the Garage Life logo, used for the draw pile indicator.
export function CardBack({ count }) {
  return (
    <div style={{
      width: 64, height: 90, borderRadius: 6, border: `2px solid ${C.pink}`,
      background: "#12122A", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0,
    }}>
      <img
        src={`${import.meta.env.BASE_URL}garage-life-assets/menu/garage-life-logo.png`}
        alt="Garage Life" draggable={false}
        style={{ width: 54, imageRendering: "pixelated" }}
      />
      <div style={{ fontSize: 9, color: C.teal, fontFamily: "monospace" }}>×{count}</div>
    </div>
  );
}

export default function CardHand({ hand, segment, onPlayLine, onPlayUtility, utilityPlayed, drawCount }) {
  const segTags = segment?.tags ?? [];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", overflowX: "auto", padding: "10px 2px 4px" }}>
      <CardBack count={drawCount} />
      {hand.map(({ instanceId, card }) => {
        const isLine = [CARD_TYPES.TECHNIQUE, CARD_TYPES.AGGRESSION].includes(card.type);
        const isUtility = card.type === CARD_TYPES.UTILITY || card.type === CARD_TYPES.STRAIN;
        const matches = isLine && (card.affinity.includes("any") || card.affinity.some(t => segTags.includes(t)));
        return (
          <GameCard
            key={instanceId}
            card={card}
            matchesSegment={matches}
            highlight={matches}
            disabled={card.type === CARD_TYPES.HAZARD || (isUtility && utilityPlayed)}
            onClick={isLine ? () => onPlayLine(instanceId) : isUtility ? () => onPlayUtility(instanceId) : undefined}
          />
        );
      })}
    </div>
  );
}
