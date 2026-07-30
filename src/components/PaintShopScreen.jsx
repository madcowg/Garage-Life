import { Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";

const BASE = import.meta.env.BASE_URL;
const BOOTH_BG = `${BASE}garage-life-assets/environments/paint-shop-clean.png`;

// Scene/shell only — no recolor mechanic yet. See TODO.md Phase 3: masking
// the flattened car sprites by color (paint/wheels/glass) didn't work, the
// mechanic needs hand-painted or freshly-layered mask art before this screen
// can do anything beyond show the booth. Not linked from any nav button yet.
export default function PaintShopScreen({ career, onBack }) {
  return (
    <Shell>
      <ScreenHeader
        title="The Paint Booth"
        status="Coming soon"
        cash={career.cash}
        nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>}
      />

      <div style={{
        position: "relative", width: "100%", aspectRatio: "1098 / 925",
        borderRadius: "var(--gl-radius-panel)", overflow: "hidden", border: "1px solid var(--gl-border)",
        backgroundImage: `url(${BOOTH_BG})`, backgroundSize: "cover", backgroundPosition: "center",
        marginBottom: 16,
      }} />

      <div style={{
        background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)",
        padding: 14, textAlign: "center", fontSize: "var(--gl-size-label)", color: "var(--gl-text-3)",
      }}>
        Rex is still setting up the booth. Paint jobs aren't ready yet.
      </div>
    </Shell>
  );
}
