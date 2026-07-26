import { useState } from "react";
import { C, SCANLINE_OVERLAY, scanlinesEnabled, setScanlinesEnabled } from "../theme";
import { clearCareerSnapshot } from "../game/careerStore";
import { META_KEY } from "../game/meta";

const BASE = import.meta.env.BASE_URL;

function TitleButton({ label, onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: 260, padding: "13px 0", fontFamily: "monospace", fontWeight: "bold",
        fontSize: 13, letterSpacing: 2, borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
        background: primary ? C.pink : "rgba(18,18,42,0.85)",
        color: disabled ? "#555" : primary ? C.purple : C.white,
        border: primary ? "none" : `1px solid ${disabled ? C.border : C.teal}`,
        opacity: disabled ? 0.6 : 1,
        textShadow: primary ? "none" : "0 0 6px rgba(0,245,212,0.4)",
      }}
    >
      {label}
    </button>
  );
}

export default function TitleScreen({ hasSave, onNewGame, onContinue, onCodex }) {
  const [showSettings, setShowSettings] = useState(false);
  const [scan, setScan] = useState(scanlinesEnabled());
  const [confirmErase, setConfirmErase] = useState(false);

  const toggleScan = () => { setScanlinesEnabled(!scan); setScan(!scan); };
  const eraseAll = () => {
    clearCareerSnapshot();
    try { localStorage.removeItem(META_KEY); } catch { /* noop */ }
    window.location.reload();
  };

  return (
    <div style={{ position: "relative", minHeight: "100dvh", overflow: "hidden", background: C.bg }}>
      {/* Airfield backdrop (event setup at sunset) — pixel art scaled to
          cover, CRT on top. coastal-highway.png stays in the asset folder
          for the planned intro animation (drive down the coast, logo
          drops) that plays before landing on this screen. */}
      <img
        src={`${BASE}garage-life-assets/environments/airfield.png`}
        alt="" draggable={false}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.85)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,13,26,0.15) 0%, rgba(13,13,26,0.55) 70%, rgba(13,13,26,0.85) 100%)" }} />
      {scan && <div style={{ ...SCANLINE_OVERLAY, position: "absolute" }} />}

      <div style={{ position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <img
          src={`${BASE}garage-life-assets/menu/garage-life-logo.png`}
          alt="My Garage Life" draggable={false}
          style={{ width: "min(480px, 80vw)", imageRendering: "pixelated", marginBottom: 18, filter: "drop-shadow(0 0 18px rgba(255,110,199,0.55))" }}
        />

        {!showSettings ? (
          <>
            <TitleButton label="NEW GAME" onClick={onNewGame} primary />
            <TitleButton label="CONTINUE CAREER" onClick={onContinue} disabled={!hasSave} />
            <TitleButton label="CODEX" onClick={onCodex} />
            <TitleButton label="SETTINGS" onClick={() => setShowSettings(true)} />
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(232,234,246,0.65)", marginTop: 16, letterSpacing: 1 }}>
              AUTOCROSS SEASON · THE DECK IS THE CAR
            </div>
          </>
        ) : (
          <div style={{ background: "rgba(10,10,20,0.92)", border: `1px solid ${C.teal}`, borderRadius: 6, padding: 20, width: 300, fontFamily: "monospace" }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: C.teal, letterSpacing: 2, marginBottom: 14 }}>SETTINGS</div>
            <button onClick={toggleScan} style={{ width: "100%", textAlign: "left", padding: 10, marginBottom: 8, background: "#12122A", border: `1px solid ${scan ? C.teal : C.border}`, borderRadius: 4, color: C.white, cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>
              {scan ? "☑" : "☐"} CRT scanlines
            </button>
            {!confirmErase ? (
              <button onClick={() => setConfirmErase(true)} style={{ width: "100%", textAlign: "left", padding: 10, marginBottom: 8, background: "#12122A", border: `1px solid ${C.border}`, borderRadius: 4, color: C.red, cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>
                Erase all save data…
              </button>
            ) : (
              <button onClick={eraseAll} style={{ width: "100%", textAlign: "left", padding: 10, marginBottom: 8, background: "#2a0d14", border: `1px solid ${C.red}`, borderRadius: 4, color: C.red, cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>
                ⚠ Really erase career AND all unlocks? Click to confirm.
              </button>
            )}
            <button onClick={() => { setShowSettings(false); setConfirmErase(false); }} style={{ width: "100%", padding: 10, background: C.pink, border: "none", borderRadius: 4, color: C.purple, fontWeight: "bold", cursor: "pointer", fontFamily: "monospace", fontSize: 10, letterSpacing: 1 }}>
              BACK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
