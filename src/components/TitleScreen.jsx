import { useState, useEffect, useRef } from "react";
import { clearCareerSnapshot } from "../game/careerStore";
import { META_KEY } from "../game/meta";
import { Button } from "./ds/controls/Button";

// The source file has no VBR/Xing header, which sends plain <audio>
// elements into an infinite "loading" spin in Chromium (readyState never
// leaves HAVE_NOTHING) — confirmed the file itself decodes fine via
// AudioContext.decodeAudioData, so we play it through Web Audio instead of
// HTMLMediaElement entirely. One-shot (matches the no-loop requirement);
// mute/unmute is a gain toggle rather than pause/resume since there's
// nothing to resume from once the single playback finishes.
//
// Playback only ever starts from the explicit click-gate (the browser
// autoplay policy requires a real user gesture anyway), so there's no
// mount-time attempt and no global gesture listener here — `start` is
// called directly by whatever gesture should trigger it.
function useIntroMusic(src) {
  const [musicOn, setMusicOn] = useState(true);
  const ctxRef = useRef(null);
  const gainRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.45;
    gain.connect(ctx.destination);
    ctxRef.current = ctx;
    gainRef.current = gain;
    return () => { ctx.close().catch(() => {}); };
  }, []);

  const start = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) { startedRef.current = false; return; }
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const buf = await fetch(src).then(r => r.arrayBuffer());
      const decoded = await ctx.decodeAudioData(buf);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(gain);
      source.start(0);
    } catch { startedRef.current = false; }
  };

  const toggleMusic = () => {
    setMusicOn(next => {
      const on = !next;
      if (gainRef.current) gainRef.current.gain.value = on ? 0.45 : 0;
      return on;
    });
  };

  return { musicOn, toggleMusic, start };
}

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
  const [gateOpen, setGateOpen] = useState(false);
  const [logoDropped, setLogoDropped] = useState(false);
  const { zooming, launch } = useTvZoom();
  const { musicOn, toggleMusic, start: startMusic } = useIntroMusic(`${BASE}garage-life-assets/audio/racing-by-the-coast.mp3`);

  // Logo drop-in, early-90s-game style: starts off the top edge, eases into
  // place with a little overshoot. Fixed px offset (not a percentage) so
  // the transform's reference frame can't shift while the image is still
  // resolving its intrinsic size. Waits on the click-gate so the drop and
  // the music start together, instead of the drop firing on mount while
  // audio silently waits on a gesture that may never come.
  useEffect(() => {
    if (!gateOpen) return undefined;
    const t = setTimeout(() => setLogoDropped(true), 80);
    return () => clearTimeout(t);
  }, [gateOpen]);

  const enterTitle = () => {
    setGateOpen(true);
    startMusic();
  };

  const eraseAll = () => {
    clearCareerSnapshot();
    try { localStorage.removeItem(META_KEY); } catch { /* noop */ }
    window.location.reload();
  };

  // Black click/tap gate: the one deliberate user gesture the browser's
  // autoplay policy requires, framed as part of the intro rather than an
  // incidental first click — so audio and the logo drop fire together.
  if (!gateOpen) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={enterTitle}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") enterTitle(); }}
        style={{
          position: "relative", height: "100dvh", width: "100%", background: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxSizing: "border-box",
        }}
      >
        <div style={{
          fontFamily: "var(--gl-font-display)", fontSize: "clamp(11px, 2.4vw, 16px)",
          letterSpacing: "var(--gl-track-display)", textTransform: "uppercase", textAlign: "center",
          color: "var(--gl-teal)", textShadow: "0 0 16px rgba(var(--gl-teal-rgb),0.6)",
          animation: "gl-blink 1.2s steps(2) infinite",
        }}>
          Click anywhere to start
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", height: "100dvh", overflow: "hidden", background: "var(--gl-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "clamp(6px, 1.5vh, 18px)",
      padding: "clamp(6px, 1.5vh, 20px)", boxSizing: "border-box",
    }}>
      {/* Stage: logo and frame share this position:relative anchor so the
          logo can sit ABOVE the frame in paint order while overlapping down
          into its top edge, instead of the two being separate flex siblings
          (which just pushed the frame further down the page). */}
      <div style={{ position: "relative", width: "min(800px, 95vw)", maxHeight: "85vh" }}>
        <div style={{
          position: "relative", width: "100%", aspectRatio: "4 / 3", maxHeight: "85vh", overflow: "hidden",
          background: "var(--gl-bg)",
          borderRadius: zooming ? 0 : "var(--gl-radius-panel)", border: zooming ? "none" : "4px solid var(--gl-border)",
          boxShadow: zooming ? "none" : "0 0 40px rgba(var(--gl-teal-rgb),0.25), var(--gl-inset-highlight)",
          transform: zooming ? "scale(9)" : "scale(1)",
          transition: `transform ${ZOOM_MS}ms cubic-bezier(0.6,0,0.9,0), border-radius ${ZOOM_MS}ms ease`,
          pointerEvents: zooming ? "none" : "auto",
          zIndex: zooming ? 20 : 1,
        }}>
          <img
            src={`${BASE}garage-life-assets/environments/airfield.png`}
            alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated", filter: "brightness(0.85)" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,10,30,0.15) 0%, rgba(11,10,30,0.6) 65%, rgba(11,10,30,0.9) 100%)" }} />
        </div>

        {/* Logo overlaps down into the frame at ~70% of its height (absolute,
            anchored to the stage) instead of sitting in normal flow above it
            — that's what makes it read as dropping ONTO the screen rather
            than pushing it down the page. Sits BELOW the button layer in
            z-order so the buttons stay fully legible over it. */}
        <img
          src={`${BASE}garage-life-assets/menu/garage-life-logo.png`}
          alt="My Garage Life" draggable={false}
          style={{
            position: "absolute", top: "40%", left: "50%", zIndex: 5,
            maxHeight: "42vh", maxWidth: "95vw", width: "auto", height: "auto",
            objectFit: "contain", imageRendering: "pixelated",
            filter: "drop-shadow(0 0 35px rgba(var(--gl-pink-rgb),0.55))",
            transform: logoDropped
              ? "translate(-50%, calc(-50% - 58px))"
              : "translate(-50%, calc(-50% - 58px - 900px))",
            opacity: zooming ? 0 : 1,
            transition: "transform 1.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
          }}
        />

        {/* Button layer: a separate absolutely-positioned sibling (matching
            the frame's bounds via inset:0) so it paints ABOVE the logo
            regardless of where the logo overlaps, instead of being nested
            inside the frame where it'd share the frame's (lower) stacking
            order and get covered. */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
          gap: 13, padding: "clamp(13px, 3.75vw, 25px)", "--gl-size-heading": "18px", "--gl-btn-pad-lg": "10px 25px",
          transform: "translateY(-58px)",
          opacity: zooming ? 0 : 1, pointerEvents: zooming ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}>
          {!showSettings ? (
            <>
              {/* Filled pink button reads visually smaller than the outlined
                  ones at the same font-size (dark text on a bright fill vs
                  bright text on a dark outline — a real irradiation
                  illusion, confirmed all four render at the same computed
                  14px). Bumping just this one compensates for it. */}
              <div style={{ width: 225, "--gl-size-heading": "19px" }}><Button tone="pink" size="lg" block onClick={() => launch(onNewGame)}>New game</Button></div>
              <div style={{ width: 225 }}><Button tone="teal" variant="outlined" size="lg" block disabled={!hasSave} reason={hasSave ? undefined : "no career saved yet"} onClick={() => launch(onContinue)}>Continue</Button></div>
              <div style={{ width: 225 }}><Button tone="violet" variant="outlined" size="lg" block onClick={onCodex}>Achievements</Button></div>
              <div style={{ width: 225, marginBottom: 4 }}><Button tone="teal" variant="outlined" size="lg" block onClick={() => setShowSettings(true)}>Settings</Button></div>
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
