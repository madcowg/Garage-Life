import { CARS } from "../game/data";
import { MAINTAIN_COST, SELF_MAINTAIN_COST, SEASON_LENGTH_MONTHS, JUNKYARD_CAR_CLAIM_PRICE, effectiveEntryFee, racingCredTier } from "../game/career";
import { Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";
import { RolodexNavButton } from "./ds/controls/RolodexNavButton";
import { ActionRow } from "./ds/controls/ActionRow";
import { StatTile } from "./ds/instruments/StatTile";
import { WearMeter } from "./ds/instruments/WearMeter";
import { CarCard } from "./ds/cards/CarCard";

// The between-races hub — month counter, resources, car condition, and the
// 3 monthly actions (design doc §1). Purely presentational: the parent
// (App.jsx) owns all career state and resolution logic.
export default function CareerHome({ career, onRace, onWork, onMaintain, onShop, onJunkyard, onStreetRace, onClaimJunkyardCar, onViewCodex, onViewAchievements }) {
  const car = CARS[career.car];
  const emp = career.employment;
  const maintainCost = emp.status === "unemployed" ? SELF_MAINTAIN_COST : MAINTAIN_COST;
  const canMaintain = career.cash >= maintainCost && !career.maintainedThisMonth;
  const offer = career.junkyardCarOffer;
  const offerCar = offer ? CARS[offer.carId] : null;
  const canClaim = offer && career.cash >= JUNKYARD_CAR_CLAIM_PRICE;
  const entryFee = effectiveEntryFee(career.racingCred ?? 0);
  const credTier = racingCredTier(career.racingCred ?? 0);
  const jobLabel = emp.status === "employed" ? `Employed (${emp.tenureMonths}mo)` : emp.status === "pending" ? "Starts next month" : "Unemployed";
  const jobTone = emp.status === "employed" ? "green" : emp.status === "pending" ? "orange" : "red";

  return (
    <div data-car={career.car}>
      <Shell>
        <ScreenHeader
          title={career.playerName ?? "My Garage Life"}
          status={`Month ${career.month} / ${SEASON_LENGTH_MONTHS} — ${career.ap} AP left`}
          nav={<>
            <RolodexNavButton tone="pink" label="ROLODEX" onClick={onViewCodex} />
            <RolodexNavButton tone="gold" label="ACHIEVEMENTS" onClick={onViewAchievements} />
          </>}
        />

        {offerCar && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
            background: "var(--gl-gold-fill)", border: "1px solid var(--gl-gold)", borderRadius: "var(--gl-radius-panel)", padding: 12, marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-gold)" }}>Junkyard find: {offerCar.name}</div>
              <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>Claim for ${JUNKYARD_CAR_CLAIM_PRICE} by month {offer.expiresMonth}, or the yard sells it off.</div>
            </div>
            <Button tone="gold" size="sm" disabled={!canClaim} reason={canClaim ? undefined : "can't afford yet"} onClick={onClaimJunkyardCar}>Claim ${JUNKYARD_CAR_CLAIM_PRICE}</Button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <StatTile label="CASH" value={career.cash} prefix="$" tone="gold" />
          <StatTile label="POINTS" value={career.reputation} tone="teal" />
          <StatTile label="CRED" value={`${career.racingCred ?? 0} — ${credTier.label}`} tone="pink" lcd={false} />
          <StatTile label="JOB" value={jobLabel} tone={jobTone} lcd={false} />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "stretch" }}>
          <CarCard carId={career.car} variant={career.variant} tone="teal" name={car.name} />
          <div style={{ flex: 1, background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10 }}>
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: "var(--gl-track-label)", marginBottom: 8, textTransform: "uppercase" }}>{car.name} — car condition</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <WearMeter label="ENGINE" value={career.wear.engine} />
              <WearMeter label="TIRES" value={career.wear.tires} />
              <WearMeter label="BRAKES" value={career.wear.brakes} />
              <WearMeter label="TRANS" value={career.wear.trans} />
            </div>
          </div>
        </div>

        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: "var(--gl-track-label)", marginBottom: 8, textTransform: "uppercase" }}>This month's actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ActionRow
            label="Race" tone="pink" onClick={onRace} disabled={career.racedThisMonth}
            reason="already run this month — one sanctioned event per month"
            cost={`1 AP, $${entryFee} entry fee, autocross event at the Airfield`}
          />

          {emp.status === "employed" && (
            <ActionRow label="Work" tone="teal" onClick={onWork} cost={`1 AP, $${emp.baseSalary}/mo base salary`} />
          )}
          {emp.status === "pending" && (
            <ActionRow label="Work" tone="orange" disabled reason="new job starts next month" cost="new job starts next month" />
          )}
          {emp.status === "unemployed" && (
            <ActionRow label="Look for work" tone="orange" onClick={onWork} cost="1 AP, unemployed" />
          )}

          <ActionRow
            label="Maintain" tone="green" onClick={onMaintain} disabled={!canMaintain}
            reason="already serviced this month"
            cost={`1 AP, $${maintainCost}${emp.status === "unemployed" ? " (DIY, no job)" : ""}, full service`}
          />

          <ActionRow label="Shop" tone="gold" onClick={onShop} cost="1 AP, buy tires / install mods at Dead Reckoning Garage" />

          <ActionRow label="Junkyard" tone="violet" onClick={onJunkyard} cost="1 AP, d20 for parts (nat 1 = $5 fee, nat 19 = mod for $10, nat 20 = a car to claim)" />

          <ActionRow label="Street racing" tone="red" onClick={onStreetRace} cost="1 AP, no entry fee, off the books — risky, no points" />
        </div>
      </Shell>
    </div>
  );
}
