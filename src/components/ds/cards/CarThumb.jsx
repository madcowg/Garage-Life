import { useState } from "react";
import { CARS } from "../../../game/data";
import { CAR_SPRITES } from "../../../game/carAssets";

function spriteSrcFor(carId, variant) {
  const car = CARS[carId];
  if (!car) return null;
  const key = (variant && car.spriteVariants?.[variant]) || car.sprite;
  const entry = key && CAR_SPRITES[key];
  if (!entry) return null;
  // Prefer the flat "race" view over the USDM starters' "garage" 3/4 view —
  // the garage crops carry a baked-in drop shadow (and, for a few, leftover
  // sprite-sheet label text) that the rest of the roster's flat views don't
  // have, which read as inconsistent bleed-through next to every other card.
  return entry.front || entry.rear || entry.garageFront || entry.garageRear || null;
}

// Blocky placeholder silhouette for any car with no sprite art yet (a few of
// the JDM unlockable roster's asset-pack entries are still missing) — so a
// 404 reads as "art coming soon" instead of a broken-image icon.
function PlaceholderGlyph() {
  return (
    <svg viewBox="0 0 32 16" style={{ width: "38%", height: "38%", color: "var(--gl-text-dead)" }}>
      <rect x="2" y="9" width="28" height="5" fill="currentColor" />
      <rect x="8" y="4" width="17" height="6" fill="currentColor" />
      <rect x="4" y="13" width="5" height="3" fill="currentColor" />
      <rect x="22" y="13" width="5" height="3" fill="currentColor" />
    </svg>
  );
}

// Static car sprite for menu/list screens (car select, garage, dealership) —
// same sprite pack RoadView draws from, at a fixed thumbnail aspect so every
// screen that shows a car shows it the same size.
//
// silhouette: for a locked/mystery car, show that car's own real outline
// (not a generic placeholder) so the shape is exciting to unlock, but hide
// color/detail — brightness(0) flattens every opaque pixel to black while
// keeping the source PNG's alpha, so the transparent background survives
// and only the car's silhouette prints.
export function CarThumb({ carId, variant, silhouette = false }) {
  const [broken, setBroken] = useState(false);
  const src = spriteSrcFor(carId, variant);

  return (
    <div style={{
      position: "relative", aspectRatio: "16 / 10", borderRadius: "var(--gl-radius-plate)",
      background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {src && !broken ? (
        <img
          src={src} alt="" draggable={false} onError={() => setBroken(true)}
          style={{
            maxWidth: "86%", maxHeight: "86%", objectFit: "contain", imageRendering: "pixelated",
            ...(silhouette ? { filter: "brightness(0) invert(1)", opacity: 0.5 } : {}),
          }}
        />
      ) : <PlaceholderGlyph />}
    </div>
  );
}
