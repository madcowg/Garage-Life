import { CARS, MODS, TIRE_CATALOG } from "../game/data";
import { discountedTirePrice, npcStandingTier, tireSellPrice, CAR_SELL_PRICE } from "../game/career";
import { Shell, Section } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { ItemCard } from "./ds/cards/ItemCard";
import { CarCard } from "./ds/cards/CarCard";

// Dead Reckoning Garage — the only place tires get bought and mods get
// bolted in. Browsing is free; leaving is the actual action (1 AP), same
// commitment pattern as paying an event entry fee in PreRaceSetup. Splits
// "unlocked" (meta, Rex will sell it to you) from "installed" (this
// career's equipment, permanent once done) — see career.js installedMods.
// Rex's standing (more business = better prices) discounts tires directly.
export default function ShopScreen({ career, meta, onBuyTire, onInstallMod, onLeave, onSellTire, onSellCar, onBack }) {
  const car = CARS[career.car];
  const owned = career.ownedTires ?? ["stock"];
  const installed = career.installedMods ?? [];
  const rexStanding = career.npcStanding?.rex ?? 0;
  const rexTier = npcStandingTier(rexStanding);
  const ownedCars = career.ownedCars ?? [career.car];
  const spareCars = ownedCars.filter(id => id !== career.car);

  return (
    <Shell>
      <ScreenHeader
        title="Dead Reckoning Garage"
        status={`${car.name} — cash $${career.cash}`}
        nav={<>
          <Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", alignSelf: "center" }}>Rex: <span style={{ color: "var(--gl-gold)", fontWeight: 700 }}>{rexTier}</span></div>
        </>}
      />

      <Section title="TIRES">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(TIRE_CATALOG).map(([id, t]) => {
            const isOwned = owned.includes(id);
            const requiresMet = !t.requires || owned.includes(t.requires);
            const price = discountedTirePrice(t.price, rexStanding);
            const canBuy = !isOwned && requiresMet && career.cash >= price;
            const canSell = owned.length > 1 && !Object.entries(TIRE_CATALOG).some(([oid, ot]) => ot.requires === id && owned.includes(oid));
            return (
              <ItemCard
                key={id}
                title={t.label}
                desc={t.desc}
                owned={isOwned}
                locked={!isOwned && !requiresMet}
                lockNote={!requiresMet ? `needs ${TIRE_CATALOG[t.requires].label}` : undefined}
                affordable={canBuy}
                price={price}
                wasPrice={price < t.price ? t.price : undefined}
                actionLabel="Buy"
                onAction={() => canBuy && onBuyTire(id, price)}
                secondary={isOwned && canSell ? (
                  <Button tone="violet" variant="outlined" size="sm" block onClick={() => onSellTire(id)}>Sell for ${tireSellPrice(id)}</Button>
                ) : undefined}
              />
            );
          })}
        </div>
      </Section>

      <Section title="MODS">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODS.map(m => {
            const isInstalled = installed.includes(m.id);
            // A Junkyard nat-19 can install a mod before its cash threshold
            // is met — installed always wins over the locked display.
            const unlocked = meta.unlockedMods.includes(m.id) || isInstalled;
            return (
              <ItemCard
                key={m.id}
                title={m.label}
                desc={m.desc}
                lockNote={`$${m.unlockThreshold} lifetime earned`}
                installed={isInstalled}
                locked={!unlocked}
                affordable
                actionLabel="Install (this visit)"
                onAction={() => onInstallMod(m.id)}
              />
            );
          })}
        </div>
      </Section>

      {spareCars.length > 0 && (
        <Section title="GARAGE">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {spareCars.map(id => (
              <CarCard
                key={id} carId={id} tone="violet"
                name={CARS[id]?.name ?? id} desc="Not your active car — just sitting here."
                footer={<Button tone="gold" size="sm" block onClick={() => onSellCar(id)}>Sell ${CAR_SELL_PRICE}</Button>}
              />
            ))}
          </div>
        </Section>
      )}

      <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", margin: "12px 0", lineHeight: 1.5 }}>
        Once a mod's installed it stays on the car for the rest of the career — no need to come back for it.
        Rex doesn't charge extra for the labor, just the AP to make the trip.
      </div>

      <Button tone="pink" size="lg" block onClick={onLeave}>Head out (− 1 AP)</Button>
    </Shell>
  );
}
