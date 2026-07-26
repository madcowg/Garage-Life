import { useState, useEffect, useRef } from "react";
import { clearCareerSnapshot } from "../game/careerStore";
import { META_KEY } from "../game/meta";
import { Button } from "./ds/controls/Button";

const BASE = import.meta.env.BASE_URL;
const ZOOM_MS = 900;

// "Go into the TV" — the framed screen scales up past the viewport edges
// while staying fully opaque (no fade), so the airfield art visibly fills
// and swallows the screen before the caller's screen swap cuts over —
// that's what actually reads as the camera pushing through the glass,
// versus a fade which just looks like a dissolve. onLaunch fires at the
// end of ZOOM_MS once the frame has scaled well past 100% of the viewport.
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
  // place with a little overshoot. Fixed px offset (not a percentage) so
  // the transform's reference frame can't shift while the image is still
  // resolving its intrinsic size.
  useEffect(() => {
    const t = setTimeout(() => setLogoDropped(true), 80);
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
      position: "relative", height: "100dvh", overflow: "hidden", background: "var(--gl-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(6px, 1.5vh, 18px)",
      padding: "clamp(6px, 1.5vh, 20px)", boxSizing: "border-box",
    }}>
      <audio ref={audioRef} preload="auto" src={`${BASE}garage-life-assets/audio/racing-by-the-coast.mp3`} />

      {/* Stage: logo and frame share this position:relative anchor so the
          logo can sit ABOVE the frame in paint order while overlapping down
          into its top edge, instead of the two being separate flex siblings
          (which just pushed the frame further down the page). */}
      <div style={{ position: "relative", width: "min(640px, 90vw)", maxHeight: "68vh" }}>
        <div style={{
          position: "relative", width: "100%", aspectRatio: "4 / 3", maxHeight: "68vh", overflow: "hidden",
          borderRadius: zooming ? 0 : "var(--gl-radius-panel)", border: zooming ? "none" : "3px solid var(--gl-border)",
          boxShadow: zooming ? "none" : "0 0 32px rgba(var(--gl-teal-rgb),0.25), var(--gl-inset-highlight)",
          transform: zooming ? "scale(9)" : "scale(1)",
          transition: `transform ${ZOOM_MS}ms cubic-bezier(0.6,0,0.9,0), border-radius ${ZOOM_MS}ms ease`,
          pointerEvents: zooming ? "none" : "auto",
          zIndex: zooming ? 20 : 1,
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
                <div style={{ width: 220 }}><Button tone="violet" variant="outlined" size="lg" block onClick={onCodex}>Achievements</Button></div>
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

        {/* Logo overlaps down into the frame's top edge (absolute, anchored
            to the stage above) instead of sitting in normal flow above it —
            that's what makes it read as dropping ONTO the screen rather than
            pushing the screen down the page. */}
        <img
          src={`${BASE}garage-life-assets/menu/garage-life-logo.png`}
          alt="My Garage Life" draggable={false}
          style={{
            position: "absolute", top: 0, left: "50%", zIndex: 5,
            maxHeight: "34vh", maxWidth: "82vw", width: "auto", height: "auto",
            objectFit: "contain", imageRendering: "pixelated",
            filter: "drop-shadow(0 0 28px rgba(var(--gl-pink-rgb),0.55))",
            transform: logoDropped
              ? "translate(-50%, -55%)"
              : "translate(-50%, calc(-55% - 900px))",
            opacity: zooming ? 0 : 1,
            transition: "transform 1.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}
