import { CARD_TYPES } from "../game/v2";
import { GameCard } from "./ds/cards/GameCard";
import { DeckPile } from "./ds/cards/DeckPile";

const BASE = import.meta.env.BASE_URL;

function wearText(wear) {
  const parts = Object.entries(wear ?? {}).filter(([, v]) => v > 0).map(([k, v]) => `${k.slice(0, 2).toUpperCase()} ${v}`);
  return parts.join(" · ");
}

export default function CardHand({ hand, segment, onPlayLine, onPlayUtility, utilityPlayed, drawCount }) {
  const segTags = segment?.tags ?? [];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", overflowX: "auto", padding: "10px 2px 4px" }}>
      <DeckPile count={drawCount} logoSrc={`${BASE}garage-life-assets/menu/garage-life-logo.png`} />
      {hand.map(({ instanceId, card }) => {
        const isLine = [CARD_TYPES.TECHNIQUE, CARD_TYPES.AGGRESSION].includes(card.type);
        const isUtility = card.type === CARD_TYPES.UTILITY || card.type === CARD_TYPES.STRAIN;
        const matches = isLine && (card.affinity.includes("any") || card.affinity.some(t => segTags.includes(t)));
        return (
          <GameCard
            key={instanceId}
            name={card.name}
            type={card.type}
            text={card.text}
            timeDelta={card.timeDelta}
            wear={wearText(card.wear)}
            tags={(card.affinity ?? []).join(" · ").toUpperCase()}
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
