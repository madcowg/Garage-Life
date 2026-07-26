import { useState, useEffect, useRef } from "react";
import { clearCareerSnapshot } from "../game/careerStore";
import { META_KEY } from "../game/meta";
import { Button } from "./ds/controls/Button";

const BASE = import.meta.env.BASE_URL;
const ZOOM_MS = 650;

// "Go into the TV" — the framed screen below the logo scales up past the
// viewport edges while fading, so starting a career reads as the camera
// pushing through the glass into the game rather than a plain screen swap.
// onLaunch fires after ZOOM_MS so the caller's screen swap lands mid-fade.
function useTvZoom() {
  const [zooming, setZooming] = useState(false);
  const launch = (onDone) => {
    setZooming(true);
    setTimeout(onDone, ZOOM_MS);
  };
  return { zooming, launch };
}

export default function TitleScreen({ hasSave, onNewGame, onContinue, onCodex, scan, onToggleScan }) {
  const [showSettings, setShowSettings] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [logoDropped, setLogoDropped] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const { zooming, launch } = useTvZoom();
  const audioRef = useRef(null);

  // Logo drop-in, early-90s-game style: starts off the top edge, eases into
  // place with a little overshoot. Delayed one frame so the CSS transition
  // actually plays instead of snapping straight to its resting position.
  useEffect(() => {
    const t = setTimeout(() => setLogoDropped(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Autoplay is blocked by the browser until a user gesture; the title
  // screen is usually the very first thing rendered, so we attempt it and
  // silently fall back to starting on the first click/keypress anywhere.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    const onFirstGesture = () => { tryPlay(); window.removeEventListener("pointerdown", onFirstGesture); window.removeEventListener("keydown", onFirstGesture); };
    window.addEventListener("pointerdown", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);
    return () => { window.removeEventListener("pointerdown", onFirstGesture); window.removeEventListener("keydown", onFirstGesture); };
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    if (!audioRef.current) return;
    if (next) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  };

  const eraseAll = () => {
    clearCareerSnapshot();
    try { localStorage.removeItem(META_KEY); } catch { /* noop */ }
    window.location.reload();
  };

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden", background: "var(--gl-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(10px, 3vw, 22px)",
      padding: "clamp(10px, 3vw, 24px)",
    }}>
      <audio ref={audioRef} src={`${BASE}garage-life-assets/audio/racing-by-the-coast.mp3`} />

      <img
        src={`${BASE}garage-life-assets/menu/garage-life-logo.png`}
        alt="My Garage Life" draggable={false}
        style={{
          width: "min(1440px, 92vw)", imageRendering: "pixelated",
          filter: "drop-shadow(0 0 28px rgba(var(--gl-pink-rgb),0.55))",
          transform: logoDropped ? "translateY(0)" : "translateY(-160%)",
          opacity: zooming ? 0 : 1,
          transition: "transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
        }}
      />

      <div style={{
        position: "relative", width: "min(640px, 92vw)", aspectRatio: "4 / 3", overflow: "hidden",
        borderRadius: "var(--gl-radius-panel)", border: "3px solid var(--gl-border)",
        boxShadow: "0 0 32px rgba(var(--gl-teal-rgb),0.25), var(--gl-inset-highlight)",
        transform: zooming ? "scale(7)" : "scale(1)", opacity: zooming ? 0 : 1,
        transition: `transform ${ZOOM_MS}ms cubic-bezier(0.7,0,0.84,0), opacity ${ZOOM_MS}ms ease`,
        pointerEvents: zooming ? "none" : "auto",
      }}>
        <img
          src={`${BASE}garage-life-assets/environments/airfield.png`}
          alt="" draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", filter: "brightness(0.85)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,10,30,0.15) 0%, rgba(11,10,30,0.6) 65%, rgba(11,10,30,0.9) 100%)" }} />

        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "clamp(10px, 3vw, 20px)" }}>
          {!showSettings ? (
            <>
              <div style={{ width: 220 }}><Button tone="pink" size="lg" block onClick={() => launch(onNewGame)}>New game</Button></div>
              <div style={{ width: 220 }}><Button tone="teal" variant="outlined" size="lg" block disabled={!hasSave} reason={hasSave ? undefined : "no career saved yet"} onClick={() => launch(onContinue)}>Continue career</Button></div>
              <div style={{ width: 220 }}><Button tone="violet" variant="outlined" size="lg" block onClick={onCodex}>Codex</Button></div>
              <div style={{ width: 220, marginBottom: 4 }}><Button tone="teal" variant="outlined" size="lg" block onClick={() => setShowSettings(true)}>Settings</Button></div>
            </>
          ) : (
            <div style={{
              background: "var(--gl-panel)", border: "1px solid var(--gl-teal)", borderRadius: "var(--gl-radius-panel)",
              padding: 18, width: 260, fontFamily: "var(--gl-font-mono)", marginBottom: 4,
            }}>
              <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 12 }}>SETTINGS</div>
              <div style={{ marginBottom: 8 }}>
                <Button tone={scan ? "teal" : "violet"} variant="outlined" size="sm" block onClick={onToggleScan}>{scan ? "CRT scanlines: on" : "CRT scanlines: off"}</Button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Button tone={musicOn ? "teal" : "violet"} variant="outlined" size="sm" block onClick={toggleMusic}>{musicOn ? "Music: on" : "Music: off"}</Button>
              </div>
              {!confirmErase ? (
                <div style={{ marginBottom: 8 }}>
                  <Button tone="red" variant="outlined" size="sm" block onClick={() => setConfirmErase(true)}>Erase all save data…</Button>
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <Button tone="red" size="sm" block onClick={eraseAll}>Really erase career AND all unlocks? Confirm.</Button>
                </div>
              )}
              <Button tone="pink" size="sm" block onClick={() => { setShowSettings(false); setConfirmErase(false); }}>Back</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
