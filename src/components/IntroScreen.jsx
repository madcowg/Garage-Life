import { useState } from "react";
import { C } from "../theme";
import { Shell } from "./shared";

const DEFAULT_NAME = "Paul Walker";

// Shown once, right after NEW GAME — before the car picker. Sets the scene
// and asks the one thing NewCareerScreen never has: who's actually driving.
// The name typed here becomes the header CareerHome shows in place of the
// static "GARAGE LIFE" title, so this is also effectively "name your save."
export default function IntroScreen({ onContinue }) {
  const [name, setName] = useState(DEFAULT_NAME);

  return (
    <Shell maxWidth={560}>
        <div style={{ fontSize: 11, color: C.teal, letterSpacing: 3, marginBottom: 10 }}>CAPE MARLOW — ARRIVAL</div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20, fontSize: 12, lineHeight: 1.7, color: "#ccc" }}>
          Cape Marlow's been running the same coast-road autocross points chase every summer for longer than
          anyone bothers to count. A beat-up shop two blocks off the highway, an airfield lined with orange
          cones and chalk, and a standings sheet that doesn't care who you were before you showed up.
          <br /><br />
          Rex doesn't need your life story. Just a name for the waiver.
        </div>

        <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>WHAT SHOULD WE CALL YOU?</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={DEFAULT_NAME}
          maxLength={40}
          style={{
            width: "100%", padding: 12, marginBottom: 20, background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.white, fontFamily: "monospace", fontSize: 13, boxSizing: "border-box",
          }}
        />

        <button
          onClick={() => onContinue((name || "").trim() || DEFAULT_NAME)}
          style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}
        >
          CONTINUE →
        </button>
    </Shell>
  );
}
