import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";
import { CARS } from "../game/data";
import { Shell } from "./shared";
import { ScreenHeader } from "./ds/shell/ScreenHeader";
import { Button } from "./ds/controls/Button";

function Thumb({ track }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawTrack(ctx, track, { width: 120, height: 84, showCones: true, activeSegIndex: -1, palette: { bg: "#0a0a14", track: "#2A2A44", cone: "#FF6B35", gateCone: "#FFD700" } });
  }, [track]);
  return <canvas ref={ref} width={120} height={84} style={{ width: "100%", imageRendering: "pixelated", display: "block", borderRadius: 3 }} />;
}

export const COURSE_LOG_KEY = "garageLifeCourseLog";

export function saveCourseToLog(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(COURSE_LOG_KEY) || "[]");
    existing.unshift(entry);
    localStorage.setItem(COURSE_LOG_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch { /* localStorage unavailable — course just won't persist */ }
}

export function loadCourseLog() {
  try { return JSON.parse(localStorage.getItem(COURSE_LOG_KEY) || "[]"); }
  catch { return []; }
}

export default function CourseLog({ onBack }) {
  const entries = loadCourseLog();

  return (
    <Shell>
      <ScreenHeader title="Season course log" nav={<Button tone="teal" variant="outlined" size="sm" onClick={onBack}>Back</Button>} />

      {entries.length === 0 && (
        <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-text-dead)", textAlign: "center", padding: 40 }}>No runs yet this season — finish a race to log its course here.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {entries.map((e, i) => (
          <div key={i} style={{ background: "var(--gl-panel)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 8 }}>
            <Thumb track={e.track} />
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", marginTop: 6 }}>{CARS[e.car]?.name || e.car}</div>
            <div style={{ fontSize: "var(--gl-size-micro)", color: e.won ? "var(--gl-gold)" : "var(--gl-text-3)", fontWeight: e.won ? 700 : 400 }}>{e.time.toFixed(3)}s{e.won ? " — WON" : ""}</div>
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)" }}>{new Date(e.at).toLocaleDateString()} · Run #{entries.length - i}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
