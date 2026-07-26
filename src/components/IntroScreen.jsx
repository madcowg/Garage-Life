import { useState } from "react";
import { Shell } from "./shared";
import { Button } from "./ds/controls/Button";

const DEFAULT_NAME = "Paul Walker";

// Shown once, right after NEW GAME — before the car picker. Sets the scene
// and asks the one thing NewCareerScreen never has: who's actually driving.
// The name typed here becomes the header CareerHome shows in place of the
// static "GARAGE LIFE" title, so this is also effectively "name your save."
export default function IntroScreen({ onContinue }) {
  const [name, setName] = useState(DEFAULT_NAME);

  return (
    <Shell maxWidth={560}>
        <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-teal)", letterSpacing: 3, marginBottom: 10 }}>CAPE MARLOW — ARRIVAL</div>

        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 16, marginBottom: 20, fontSize: "var(--gl-size-label)", lineHeight: 1.7, color: "var(--gl-text-3)" }}>
          Cape Marlow's been running the same coast-road autocross points chase every summer for longer than
          anyone bothers to count. A beat-up shop two blocks off the highway, an airfield lined with orange
          cones and chalk, and a standings sheet that doesn't care who you were before you showed up.
          <br /><br />
          Rex doesn't need your life story. Just a name for the waiver.
        </div>

        <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 8 }}>WHAT SHOULD WE CALL YOU?</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onClick={() => { if (name === DEFAULT_NAME) setName(""); }}
          placeholder={DEFAULT_NAME}
          maxLength={40}
          style={{
            width: "100%", padding: 12, marginBottom: 20, background: "var(--gl-panel)", border: "1px solid var(--gl-border)",
            borderRadius: "var(--gl-radius-panel)", color: "var(--gl-text-1)", fontFamily: "var(--gl-font-mono)", fontSize: 13, boxSizing: "border-box",
          }}
        />

        <Button tone="pink" size="lg" block onClick={() => onContinue((name || "").trim() || DEFAULT_NAME)}>Continue</Button>
    </Shell>
  );
}
