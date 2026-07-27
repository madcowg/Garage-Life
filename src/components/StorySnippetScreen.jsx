import { Shell } from "./shared";
import { Button } from "./ds/controls/Button";

const BASE = import.meta.env.BASE_URL;

// Narrative beat card — same Shell column as every other screen (design
// tokens, same Button), with the coastal-highway art framed as a bordered
// panel rather than a full-bleed backdrop, so it reads as part of the same
// app instead of a separate full-screen hero moment.
export default function StorySnippetScreen({ text, onContinue }) {
  return (
    <Shell>
      <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-teal)", letterSpacing: 3, marginBottom: 10, textAlign: "center" }}>CAPE MARLOW</div>

      <div style={{
        position: "relative", aspectRatio: "16 / 9", overflow: "hidden",
        borderRadius: "var(--gl-radius-panel)", border: "1px solid var(--gl-border)", marginBottom: 20,
      }}>
        <img
          src={`${BASE}garage-life-assets/environments/coastal-highway.png`}
          alt="" draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.7) saturate(0.9)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,10,30,0.1) 0%, rgba(11,10,30,0.8) 100%)" }} />
      </div>

      <div style={{
        background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)",
        padding: 16, marginBottom: 20, fontSize: "var(--gl-size-label)", lineHeight: 1.7, color: "var(--gl-text-3)", textAlign: "center",
        fontFamily: "var(--gl-font-body)",
      }}>
        {text}
      </div>

      <Button tone="pink" size="lg" block onClick={onContinue}>Continue</Button>
    </Shell>
  );
}
