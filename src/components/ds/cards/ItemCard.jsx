import { Button } from "../controls/Button";

// Shop inventory: tires, mods, spare cars. Owned fills with a 12% teal mix and
// states OWNED; locked is dashed and states the goal. Price always visible.
export function ItemCard({ title, desc, price, wasPrice, owned = false, installed = false, locked = false, lockNote, affordable = true, actionLabel = "Buy", onAction, secondary, icon }) {
  const state = installed ? "installed" : owned ? "owned" : locked ? "locked" : "available";
  const line = state === "available" ? "var(--gl-border)" : state === "locked" ? "var(--gl-border)" : "var(--gl-teal)";
  return (
    <div style={{
      flex: "1 1 180px", minWidth: 170, padding: 10, borderRadius: "var(--gl-radius-panel)",
      border: `1px ${state === "locked" ? "dashed" : "solid"} ${line}`,
      backgroundImage: "var(--gl-face-texture), linear-gradient(180deg, #1B1A3C 0%, var(--gl-panel) 48%, #0E0D24 100%)",
      backgroundColor: state === "owned" || state === "installed" ? "var(--gl-teal-fill)" : "transparent",
      boxShadow: "0 2px 0 #0A0918, var(--gl-inset-highlight)",
      opacity: state === "locked" ? 0.55 : 1, fontFamily: "var(--gl-font-mono)", color: "var(--gl-text-1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {icon && <img src={icon} alt="" style={{ width: 16, height: 16, imageRendering: "pixelated" }} />}
        <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{title}</div>
      </div>
      {desc && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", minHeight: 28, marginTop: 3, lineHeight: 1.45, fontFamily: "var(--gl-font-body)" }}>{desc}</div>}
      {state === "locked" && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 4 }}>locked — {lockNote}</div>}
      {(state === "owned" || state === "installed") && (
        <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: 1, color: "var(--gl-teal)", marginTop: 6, textTransform: "uppercase" }}>✓ {state}</div>
      )}
      {state === "available" && (
        <div style={{ marginTop: 7 }}>
          <Button tone="gold" size="sm" block disabled={!affordable} reason={affordable ? undefined : "can't afford"} onClick={onAction}>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
              <span>{actionLabel}</span>
              <span style={{ fontSize: 9 }}>$</span>
              <span style={{ fontFamily: "var(--gl-font-lcd)", fontStyle: "italic", fontSize: 12 }}>{price}</span>
              {wasPrice != null && <span style={{ fontSize: 9, fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: 0.7 }}>was ${wasPrice}</span>}
            </span>
          </Button>
        </div>
      )}
      {secondary && <div style={{ marginTop: 5 }}>{secondary}</div>}
    </div>
  );
}
