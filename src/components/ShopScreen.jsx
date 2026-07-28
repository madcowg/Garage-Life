import { CARS, MODS, TIRE_CATALOG } from "../game/data";
import { discountedTirePrice, npcStandingTier, tireSellPrice } from "../game/career";
import { Shell, Section } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { ItemCard } from "./ds/cards/ItemCard";

// Dead Reckoning Garage — the only place tires get bought and mods get
// bolted in. Browsing is free; leaving is the actual action (1 AP), same
// commitment pattern as paying an event entry fee in PreRaceSetup. Splits
// "unlocked" (meta, Rex will sell it to you) from "installed" (this
// career's equipment, permanent once done) — see career.js installedMods.
// Rex's standing (more business = better prices) discounts tires directly.
// Spare-car viewing/selling lives in MyGarageScreen, not here — this is
// Rex's parts shop, not the player's own garage.
export default function ShopScreen({ career, meta, onBuyTire, onInstallMod, onLeave, onSellTire, onBack, apCharged }) {
  const car = CARS[career.car];
  const owned = career.ownedTires ?? ["stock"];
  const installed = career.installedMods ?? [];
  const rexStanding = career.npcStanding?.rex ?? 0;
  const rexTier = npcStandingTier(rexStanding);

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
            const canAfford = career.cash >= m.price;
            return (
              <ItemCard
                key={m.id}
                title={m.label}
                desc={m.desc}
                price={m.price}
                lockNote={`$${m.unlockThreshold} lifetime earned`}
                installed={isInstalled}
                locked={!unlocked}
                affordable={canAfford}
                actionLabel="Install"
                onAction={() => canAfford && onInstallMod(m.id, m.price)}
              />
            );
          })}
        </div>
      </Section>

      <div style={{ textAlign: "center", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", margin: "12px 0", lineHeight: 1.5, fontFamily: "var(--gl-font-body)" }}>
        Once a mod's installed it stays on the car for the rest of the career — no need to come back for it.
        {apCharged ? " Rex doesn't charge extra for the labor, just the AP to make the trip." : " Just browsing costs nothing — the AP only gets spent once Rex actually does the work."}
      </div>

      <Button tone="pink" size="lg" block onClick={onLeave}>{apCharged ? "Head out (− 1 AP)" : "Back"}</Button>
    </Shell>
  );
}
