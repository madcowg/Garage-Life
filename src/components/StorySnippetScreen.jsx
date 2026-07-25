import { C, SCANLINE_OVERLAY, scanlinesEnabled } from "../theme";

const BASE = import.meta.env.BASE_URL;

// Full-bleed story beat card — same coastal-highway backdrop treatment as
// TitleScreen, so narrative moments read as part of the same world instead
// of a bolted-on popup.
export default function StorySnippetScreen({ text, onContinue }) {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", overflow: "hidden", background: C.bg }}>
      <img
        src={`${BASE}garage-life-assets/environments/coastal-highway.png`}
        alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.55) saturate(0.85)" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,13,26,0.35) 0%, rgba(13,13,26,0.75) 60%, rgba(13,13,26,0.92) 100%)" }} />
      {scanlinesEnabled() && <div style={{ ...SCANLINE_OVERLAY, position: "absolute" }} />}

      <div style={{ position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 5vw, 40px)" }}>
        <div style={{ fontSize: 9, color: C.teal, letterSpacing: 3, marginBottom: 18 }}>CAPE MARLOW</div>
        <div style={{
          maxWidth: 480, fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, color: C.white,
          textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.6)", marginBottom: 28,
        }}>
          {text}
        </div>
        <button
          onClick={onContinue}
          style={{ padding: "12px 32px", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 12, letterSpacing: 2, cursor: "pointer" }}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
