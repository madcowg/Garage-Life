import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";
import { CARS } from "../game/data";

const C = { pink: "#FF6EC7", teal: "#00F5D4", white: "#E8EAF6", border: "#242440", panel: "#12122A" };

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
  } catch (e) { /* localStorage unavailable — course just won't persist */ }
}

export function loadCourseLog() {
  try { return JSON.parse(localStorage.getItem(COURSE_LOG_KEY) || "[]"); }
  catch (e) { return []; }
}

export default function CourseLog({ onBack }) {
  const entries = loadCourseLog();

  return (
    <div style={{ minHeight: "100%", background: "#0D0D1A", color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: C.pink, letterSpacing: 2 }}>SEASON COURSE LOG</div>
          <button onClick={onBack} style={{ padding: "8px 14px", background: C.panel, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>← BACK</button>
        </div>

        {entries.length === 0 && (
          <div style={{ fontSize: 11, color: "#666", textAlign: "center", padding: 40 }}>No runs yet this season — finish a race to log its course here.</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {entries.map((e, i) => (
            <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: 8 }}>
              <Thumb track={e.track} />
              <div style={{ fontSize: 9, color: C.teal, marginTop: 6 }}>{CARS[e.car]?.name || e.car}</div>
              <div style={{ fontSize: 9, color: "#888" }}>{e.time.toFixed(3)}s {e.won ? "🏆" : ""}</div>
              <div style={{ fontSize: 8, color: "#555" }}>{new Date(e.at).toLocaleDateString()} · Run #{entries.length - i}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
