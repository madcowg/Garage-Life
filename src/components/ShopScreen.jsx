import { CARS, MODS, TIRE_CATALOG } from "../game/data";
import { discountedTirePrice, npcStandingTier, tireSellPrice, CAR_SELL_PRICE } from "../game/career";
import { C } from "../theme";
import { Shell, Section } from "./shared";

// Dead Reckoning Garage — the only place tires get bought and mods get
// bolted in. Browsing is free; leaving is the actual action (1 AP), same
// commitment pattern as paying an event entry fee in PreRaceSetup. Splits
// "unlocked" (meta, Rex will sell it to you) from "installed" (this
// career's equipment, permanent once done) — see career.js installedMods.
// Rex's standing (more business = better prices) discounts tires directly.
export default function ShopScreen({ career, meta, onBuyTire, onInstallMod, onLeave, onSellTire, onSellCar }) {
  const car = CARS[career.car];
  const owned = career.ownedTires ?? ["stock"];
  const installed = career.installedMods ?? [];
  const rexStanding = career.npcStanding?.rex ?? 0;
  const rexTier = npcStandingTier(rexStanding);
  const ownedCars = career.ownedCars ?? [career.car];
  const spareCars = ownedCars.filter(id => id !== career.car);

  return (
    <Shell maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>DEAD RECKONING GARAGE</div>
          <div style={{ fontSize: 11, color: C.teal, letterSpacing: 2 }}>{car.name} — CASH ${career.cash}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#888" }}>
          Rex: <span style={{ color: C.gold, fontWeight: "bold" }}>{rexTier}</span>
        </div>
      </div>

      <Section title="TIRES">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(TIRE_CATALOG).map(([id, t]) => {
            const isOwned = owned.includes(id);
            const requiresMet = !t.requires || owned.includes(t.requires);
            const price = discountedTirePrice(t.price, rexStanding);
            const canBuy = !isOwned && requiresMet && career.cash >= price;
            const canSell = owned.length > 1 && !Object.entries(TIRE_CATALOG).some(([oid, ot]) => ot.requires === id && owned.includes(oid));
            return (
              <div key={id} style={{ flex: "1 1 180px", padding: 10, background: isOwned ? "#122b28" : C.panel, border: `1px solid ${isOwned ? C.teal : C.border}`, borderRadius: 4, color: C.white, opacity: isOwned || requiresMet ? 1 : 0.55 }}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.label}</div>
                <div style={{ fontSize: 8, color: "#888", minHeight: 26, marginTop: 2 }}>{t.desc}</div>
                {isOwned ? (
                  <>
                    <div style={{ marginTop: 6, fontSize: 9, color: C.teal, fontWeight: "bold" }}>✓ OWNED</div>
                    {canSell && (
                      <button
                        onClick={() => onSellTire(id)}
                        style={{ marginTop: 4, width: "100%", padding: 5, background: "transparent", color: "#999", border: `1px solid ${C.border}`, borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 8 }}
                      >
                        SELL for ${tireSellPrice(id)}
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => canBuy && onBuyTire(id, price)} disabled={!canBuy} style={{ marginTop: 6, width: "100%", padding: 6, background: canBuy ? C.gold : "#1a1a2e", color: canBuy ? C.purple : "#555", border: "none", borderRadius: 3, cursor: canBuy ? "pointer" : "not-allowed", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}>
                    {!requiresMet ? `NEEDS ${TIRE_CATALOG[t.requires].label.toUpperCase()}` : price < t.price ? `BUY $${price} (was $${t.price})` : `BUY $${price}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="MODS">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {MODS.map(m => {
            const isInstalled = installed.includes(m.id);
            // A Junkyard nat-19 can install a mod before its cash threshold
            // is met — installed always wins over the locked display.
            const unlocked = meta.unlockedMods.includes(m.id) || isInstalled;
            if (!unlocked) {
              return (
                <div key={m.id} style={{ padding: 8, background: "#0a0a14", border: `1px dashed ${C.border}`, borderRadius: 4, opacity: 0.55 }}>
                  <div style={{ fontSize: 10, fontWeight: "bold" }}>🔒 {m.label}</div>
                  <div style={{ fontSize: 8, color: "#666" }}>Unlocks at ${m.unlockThreshold} lifetime earned</div>
                </div>
              );
            }
            return (
              <div key={m.id} style={{ padding: 8, background: isInstalled ? "#122b28" : C.panel, border: `1px solid ${isInstalled ? C.teal : C.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>{m.label}</div>
                <div style={{ fontSize: 8, color: "#888", minHeight: 20 }}>{m.desc}</div>
                {isInstalled ? (
                  <div style={{ marginTop: 6, fontSize: 9, color: C.teal, fontWeight: "bold" }}>✓ INSTALLED</div>
                ) : (
                  <button onClick={() => onInstallMod(m.id)} style={{ marginTop: 6, width: "100%", padding: 6, background: C.gold, color: C.purple, border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}>
                    INSTALL (this visit)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {spareCars.length > 0 && (
        <Section title="GARAGE">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {spareCars.map(id => (
              <div key={id} style={{ flex: "1 1 180px", padding: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, color: C.white }}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>{CARS[id]?.name ?? id}</div>
                <div style={{ fontSize: 8, color: "#888", marginTop: 2 }}>Not your active car — just sitting here.</div>
                <button
                  onClick={() => onSellCar(id)}
                  style={{ marginTop: 6, width: "100%", padding: 6, background: C.gold, color: C.purple, border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 9, fontWeight: "bold" }}
                >
                  SELL for ${CAR_SELL_PRICE}
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
        Once a mod's installed it stays on the car for the rest of the career — no need to come back for it.
        Rex doesn't charge extra for the labor, just the AP to make the trip.
      </div>

      <button
        onClick={onLeave}
        style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}
      >
        HEAD OUT (− 1 AP) →
      </button>
    </Shell>
  );
}
