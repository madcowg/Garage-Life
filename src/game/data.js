// ============================================================================
// GARAGE LIFE — AUTOCROSS DATA
// ============================================================================

export const CARS = {
  miata:    { name: "Mazda Miata NA/NB",        hp: 2, handling: 5, grip: 5, trans: 3, blurb: "Lightweight handler. Autocross bonus." },
  integra:  { name: "Acura Integra DC2",        hp: 3, handling: 4, grip: 4, trans: 3, blurb: "Balanced JDM icon. No penalties." },
  corvette: { name: "Chevrolet Corvette C4/C5", hp: 5, handling: 2, grip: 3, trans: 4, blurb: "Raw power. Tight-technical penalty." },
};

// Corner-type segments get a direct time multiplier per car — matches the GDD
// literally (Miata +10% autocross bonus, Corvette tight-technical penalty)
// applied to the segment itself, not the scoreboard.
export const CORNER_SEGMENTS = ["hairpin", "sweeper", "slalom", "chicane"];
export const CAR_CORNER_MULT = { miata: 0.90, integra: 1.00, corvette: 1.10 };

export const MODS = [
  { id: "coilovers_tuned", label: "Tuned Coilovers",       desc: "Fewer corner mistakes" },
  { id: "lsd",              label: "Limited Slip Diff",     desc: "Less trans stress on exit" },
  { id: "sway_bars",        label: "Sway Bars",             desc: "Fewer corner mistakes" },
  { id: "brake_upgrade",    label: "Brake Upgrade",         desc: "Less brake hazard severity" },
  { id: "turbo_stock",      label: "Turbo (Stock Internals)", desc: "+Power, +engine stress risk" },
];

export const MOD_RELEVANCE = {
  coilovers_tuned: ["hairpin", "sweeper", "slalom", "chicane"],
  lsd:             ["hairpin", "chicane", "slalom", "launch"],
  sway_bars:       ["hairpin", "sweeper", "slalom", "chicane"],
  brake_upgrade:   ["hairpin", "chicane"],
  turbo_stock:     ["launch", "sweeper", "finish"],
};

export const TIRE_OPTIONS = {
  all_season:  { label: "All-Season",         grip: 0, wearRate: 0.7 },
  street_perf: { label: "Street Performance", grip: 1, wearRate: 1.0 },
  racing:      { label: "Racing Compound",    grip: 2, wearRate: 1.4 },
};

export const GAUGE_DEFS = [
  { id: "oilGauge",     label: "Oil Pressure Gauge", covers: "Engine" },
  { id: "coolantGauge", label: "Coolant Temp Gauge", covers: "Engine" },
  { id: "boostGauge",   label: "Boost Gauge",        covers: "Engine" },
  { id: "transGauge",   label: "Trans Temp Gauge",   covers: "Transmission" },
];

export const CORNER_POOL = ["hairpin", "sweeper", "slalom", "chicane"];

export const SEGMENTS = {
  launch: {
    label: "LAUNCH", icon: "🚦", color: "#FF6EC7", statKey: "hp",
    desc: "Standing start, flat pavement.",
    decisions: [
      { id: "roll",  label: "Roll Out",     desc: "Progressive throttle. Safe.",       time: 2.0, stress: { engine: 3, tires: 2, trans: 2, brakes: 0 } },
      { id: "clean", label: "Clean Launch", desc: "Controlled, near the limit.",       time: 1.5, stress: { engine: 5, tires: 4, trans: 4, brakes: 0 } },
      { id: "send",  label: "Full Send",    desc: "Redline drop. Max wheelspin risk.", time: 1.0, stress: { engine: 8, tires: 7, trans: 7, brakes: 0 } },
    ],
    mistake: "wheelspin",
  },
  hairpin: {
    label: "HAIRPIN", icon: "🔄", color: "#00F5D4", statKey: "handling",
    desc: "Tight 180°. Slow in, fast out.",
    decisions: [
      { id: "late_apex",   label: "Late Apex",   desc: "Conservative. Predictable.",   time: 3.2, stress: { engine: 0, tires: 2, trans: 0, brakes: 4 } },
      { id: "trail_brake", label: "Trail Brake", desc: "Carry speed to the limit.",    time: 2.6, stress: { engine: 0, tires: 4, trans: 1, brakes: 6 } },
      { id: "attack",      label: "Attack",      desc: "Hot entry. Edge of rotation.", time: 2.2, stress: { engine: 0, tires: 6, trans: 2, brakes: 8 } },
    ],
    mistake: "understeer",
  },
  sweeper: {
    label: "SWEEPER", icon: "↩️", color: "#FF6B35", statKey: "grip",
    desc: "Long high-speed arc. Sustained grip demand.",
    decisions: [
      { id: "lift",  label: "Lift & Coast", desc: "Ease off. Safe margin.",        time: 2.8, stress: { engine: 2, tires: 2, trans: 0, brakes: 0 } },
      { id: "trail", label: "Trail In",     desc: "Slight trail, rotate the car.", time: 2.3, stress: { engine: 3, tires: 4, trans: 1, brakes: 0 } },
      { id: "flat",  label: "Flat Out",     desc: "Commit. Max grip demand.",      time: 1.9, stress: { engine: 5, tires: 7, trans: 0, brakes: 0 } },
    ],
    mistake: "push_wide",
  },
  slalom: {
    label: "SLALOM", icon: "🔀", color: "#FFD700", statKey: "handling",
    desc: "Cone gates. Rhythm and transitions. Transmission under load.",
    decisions: [
      { id: "safe",   label: "Play Safe",   desc: "Wide entries. No cone risk.",     time: 3.0, stress: { engine: 0, tires: 1, trans: 2, brakes: 0 } },
      { id: "rhythm", label: "Find Rhythm", desc: "Smooth, consistent transitions.", time: 2.4, stress: { engine: 0, tires: 2, trans: 4, brakes: 0 } },
      { id: "throw",  label: "Throw It",    desc: "Aggressive weight transfer.",     time: 1.8, stress: { engine: 1, tires: 4, trans: 7, brakes: 0 } },
    ],
    mistake: "cone_clip",
  },
  chicane: {
    label: "CHICANE", icon: "↔️", color: "#7B2FBE", statKey: "handling",
    desc: "Quick left-right. Braking into a direction change.",
    decisions: [
      { id: "early_brake", label: "Brake Early",    desc: "Safe entry. Time lost.",      time: 2.9, stress: { engine: 0, tires: 2, trans: 1, brakes: 3 } },
      { id: "late_brake",  label: "Late Brake",     desc: "Deep braking, high reward.",  time: 2.2, stress: { engine: 0, tires: 3, trans: 2, brakes: 6 } },
      { id: "momentum",    label: "Carry Momentum", desc: "Minimal braking. Pure grip.", time: 2.0, stress: { engine: 0, tires: 5, trans: 1, brakes: 1 } },
    ],
    mistake: "push_wide",
  },
  finish: {
    label: "FINISH", icon: "🏁", color: "#E8EAF6", statKey: "hp",
    desc: "Final straight. Drive it through the line.",
    decisions: [
      { id: "safe_finish", label: "Safe Finish",      desc: "Don't overdrive it.", time: 1.8, stress: { engine: 3, tires: 1, trans: 1, brakes: 0 } },
      { id: "push_finish", label: "Push to the Line", desc: "Every last tenth.",   time: 1.3, stress: { engine: 6, tires: 2, trans: 3, brakes: 0 } },
    ],
    mistake: "wheelspin",
  },
};

export const MISTAKE_CARDS = {
  wheelspin:  { name: "Wheelspin",   icon: "🌀" },
  understeer: { name: "Understeer", icon: "↗️" },
  push_wide:  { name: "Push Wide",  icon: "↗️" },
  cone_clip:  { name: "Cone Clip",  icon: "🔺", isCone: true },
};
