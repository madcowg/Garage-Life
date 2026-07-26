// ============================================================================
// GARAGE LIFE — AUTOCROSS DATA
// ============================================================================

// Starters — the original three, now with real USDM sprites. Miata has two
// cosmetic-only variants (NA/NB) — identical stats/multiplier, different
// sprite skin, picked via spriteVariants in the Setup screen.
export const CARS = {
  miata:    { name: "Mazda MX-5 Miata NA/NB", hp: 2, handling: 5, grip: 5, trans: 3, blurb: "Lightweight handler. Autocross bonus.", tier: "starter", variants: ["NA", "NB"], sprite: "mazdaMiataNa", spriteVariants: { NA: "mazdaMiataNa", NB: "mazdaMiataNb" } },
  integra:  { name: "Acura Integra DC2 GS-R", hp: 3, handling: 4, grip: 4, trans: 3, blurb: "Balanced JDM icon. No penalties.", tier: "starter", sprite: "acuraIntegraDc2Gsr" },
  corvette: { name: "Chevrolet Corvette C6 Coupe", hp: 5, handling: 2, grip: 3, trans: 4, blurb: "Raw power. Tight-technical penalty.", tier: "starter", sprite: "chevroletCorvetteC6" },

  // Unlockables — the JDM roster from the asset pack, real-world grounded:
  // light RWD/FWD cars and AWD rally homologation specials get an autocross
  // bonus (agility/traction matter more than raw power in tight technical
  // sections, same logic as the Miata's bonus); heavy big-power GT cars get
  // a penalty, same logic as the Corvette's. No unlock mechanic exists yet
  // (pending the reputation/rewards system) — these render locked for now.
  hondaCivicSir:    { name: "Honda Civic SiR",         hp: 2, handling: 5, grip: 4, trans: 3, blurb: "Featherweight VTEC hatch. Autocross bonus.", tier: "unlockable", sprite: "hondaCivicSir" },
  hondaS2000:       { name: "Honda S2000",             hp: 3, handling: 5, grip: 5, trans: 4, blurb: "High-revving roadster. Razor-sharp chassis.", tier: "unlockable", sprite: "hondaS2000" },
  mazdaRx7Fd:       { name: "Mazda RX-7 FD",           hp: 3, handling: 4, grip: 4, trans: 3, blurb: "Rotary balance icon. Nimble, demands respect.", tier: "unlockable", sprite: "mazdaRx7Fd" },
  subaruImprezaWrx: { name: "Subaru Impreza WRX",      hp: 3, handling: 4, grip: 5, trans: 3, blurb: "Rally-bred AWD traction, confident in tight sections.", tier: "unlockable", sprite: "subaruImprezaWrx" },
  mitsubishiEvo6:   { name: "Mitsubishi Lancer Evo VI", hp: 4, handling: 4, grip: 5, trans: 4, blurb: "AWD rally homologation special.", tier: "unlockable", sprite: "mitsubishiEvo6" },
  nissan180sx:      { name: "Nissan 180SX",            hp: 3, handling: 3, grip: 3, trans: 3, blurb: "SR20 RWD tuner platform. No penalties, no favors.", tier: "unlockable", sprite: "nissan180sx" },
  nissanSkylineR34: { name: "Nissan Skyline GT-R R34",  hp: 5, handling: 3, grip: 5, trans: 4, blurb: "AWD grip monster — weight bites in tight corners.", tier: "unlockable", sprite: "nissanSkylineR34" },
  toyotaSupraMk4:   { name: "Toyota Supra Mk4",        hp: 5, handling: 2, grip: 3, trans: 4, blurb: "Turbocharged 2JZ powerhouse. Heavy in the tight stuff.", tier: "unlockable", sprite: "toyotaSupraMk4" },

  // Secret — not shown anywhere in the normal car list. Two unrelated ways
  // in: the "sell a car early" achievement payoff (App.jsx handleSellCar),
  // or typing "Lou"/"Fanaz" as your name at the intro screen (App.jsx
  // handleIntroContinue) — same car either way. No sprite asset (that
  // pipeline's blocked, see PixelLab backlog note) — it renders through a
  // dedicated procedural draw instead (RoadView.jsx drawVanRear), same as
  // the three starters.
  beaterVan: { name: "The Titty Twister", hp: 1, handling: 3, grip: 2, trans: 2, blurb: "A rattling convertible-top cargo van, all the badges long gone. Rex swears it runs. Rex was right, annoyingly.", tier: "secret" },
};

// Corner-type segments get a direct time multiplier per car — matches the GDD
// literally (Miata +10% autocross bonus, Corvette tight-technical penalty)
// applied to the segment itself, not the scoreboard. Unlockable multipliers
// follow the same real-handling-character logic (see CARS comment above).
export const CORNER_SEGMENTS = ["hairpin", "sweeper", "slalom", "chicane"];
export const CAR_CORNER_MULT = {
  miata: 0.90, integra: 1.00, corvette: 1.10,
  hondaCivicSir: 0.90, hondaS2000: 0.92, mazdaRx7Fd: 0.95, subaruImprezaWrx: 0.94,
  mitsubishiEvo6: 0.93, nissan180sx: 1.00, nissanSkylineR34: 1.05, toyotaSupraMk4: 1.08,
};

// Stage 1 mod progression (Season 1 design doc §7) — replaces the old flat
// 5-mod list entirely. Each unlocks permanently once lifetime cash earned
// this career crosses its threshold (see game/career.js), independent of
// current spendable balance. Engine is a straight time bonus (MOD_RELEVANCE
// below); Brakes/Suspension/Safety act on the dice itself (MOD_ADVANTAGE /
// SAFETY_MOD_ID below, applied in logic.js) rather than a flat time bonus —
// see design doc §9 for why they're split this way.
export const MODS = [
  { id: "stage1_engine",     label: "Stage 1 Engine",     desc: "Filter + catback exhaust — mild power, no added risk", unlockThreshold: 100 },
  { id: "stage1_brakes",     label: "Stage 1 Brakes",     desc: "Race pads + braided lines — advantage on brake rolls", unlockThreshold: 200 },
  { id: "stage1_suspension", label: "Stage 1 Suspension", desc: "Anti-sway bars — advantage on mistake rolls", unlockThreshold: 300 },
  { id: "stage1_safety",     label: "Stage 1 Safety",     desc: "Race seat + harness — +1 to every roll", unlockThreshold: 400 },
];

export const MOD_RELEVANCE = {
  stage1_engine: ["launch", "sweeper", "finish"],
};

// Which category each mod grants a second/kept-best die on (design doc §9B).
export const MOD_ADVANTAGE = {
  stage1_brakes: "brake",
  stage1_suspension: "mistake",
};
// The one mod that's a flat +1 to every roll regardless of category (§9C).
export const SAFETY_MOD_ID = "stage1_safety";

// Reference price for Stage 1 Tires — available from day one, no unlock
// needed. Not a literal SKU cost in the shop yet; used to anchor base
// salary (career.js: baseSalary = STAGE1_TIRE_PRICE / 2).
export const STAGE1_TIRE_PRICE = 100;

// Legacy tire table — still referenced by the retired dice-era logic.js and
// its simulation scripts. The career UI uses TIRE_CATALOG below instead.
export const TIRE_OPTIONS = {
  all_season:  { label: "All-Season",         grip: 0, wearRate: 0.7 },
  street_perf: { label: "Street Performance", grip: 1, wearRate: 1.0 },
  racing:      { label: "Racing Compound",    grip: 2, wearRate: 1.4 },
};

// Tire purchase progression — tires are bought with career cash, not freely
// selected (a free picker defeats the point of buying tires). Stock is what
// the car came on; each step up is a real cash sink and a real deck change
// (see v2.js TIRE_MAP → engine tiers). Purchases are per-career (they're
// consumable-ish equipment, not permanent meta unlocks). `requires` gates
// the natural progression: you don't jump from stock to slicks.
export const TIRE_CATALOG = {
  stock: {
    label: "Stock Tires", price: 0,
    desc: "What the car came on. They're fine. That's the problem.",
  },
  extreme_summer: {
    label: "Extreme Performance Summer", price: 200,
    desc: "200-treadwear summer rubber — adds Grip Window cards to the deck.",
  },
  slicks: {
    label: "Slicks", price: 500, requires: "extreme_summer",
    desc: "Maximum grip, three Grip Windows — but no Eyes Up, brutal cold first runs, and they eat themselves every event.",
  },
};

export const GAUGE_DEFS = [
  { id: "oilGauge",     label: "Oil Pressure Gauge", covers: "Engine" },
  { id: "coolantGauge", label: "Coolant Temp Gauge", covers: "Engine" },
  { id: "boostGauge",   label: "Boost Gauge",        covers: "Engine" },
  { id: "transGauge",   label: "Trans Temp Gauge",   covers: "Transmission" },
];

export const CORNER_POOL = ["hairpin", "sweeper", "slalom", "chicane"];

// Decision base times are 3x the original values — a real autocross course
// runs ~30-45s, not 10-15s, and that extra time is deliberate: it gives a
// mistake room to be recoverable instead of dominating the whole run, same
// as real autocross where a single bobble rarely costs you the whole course.
// Hazard penalty magnitudes (logic.js) are unchanged, so they're now a
// smaller fraction of total time — that's the intended effect, not a bug.
export const SEGMENTS = {
  launch: {
    label: "LAUNCH", icon: "🚦", color: "#FF6EC7", statKey: "hp",
    desc: "Standing start, flat pavement.",
    decisions: [
      { id: "roll",  label: "Roll Out",     desc: "Progressive throttle. Safe.",       time: 6.0, stress: { engine: 3, tires: 2, trans: 2, brakes: 0 } },
      { id: "clean", label: "Clean Launch", desc: "Controlled, near the limit.",       time: 4.5, stress: { engine: 5, tires: 4, trans: 4, brakes: 0 } },
      { id: "send",  label: "Full Send",    desc: "Redline drop. Max wheelspin risk.", time: 3.0, stress: { engine: 8, tires: 7, trans: 7, brakes: 0 } },
    ],
    mistake: "wheelspin",
  },
  hairpin: {
    label: "HAIRPIN", icon: "🔄", color: "#00F5D4", statKey: "handling",
    desc: "Tight 180°. Slow in, fast out.",
    decisions: [
      { id: "late_apex",   label: "Late Apex",   desc: "Conservative. Predictable.",   time: 9.6, stress: { engine: 0, tires: 2, trans: 0, brakes: 4 } },
      { id: "trail_brake", label: "Trail Brake", desc: "Carry speed to the limit.",    time: 7.8, stress: { engine: 0, tires: 4, trans: 1, brakes: 6 } },
      { id: "attack",      label: "Attack",      desc: "Hot entry. Edge of rotation.", time: 6.6, stress: { engine: 0, tires: 6, trans: 2, brakes: 8 } },
    ],
    mistake: "understeer",
  },
  sweeper: {
    label: "SWEEPER", icon: "↩️", color: "#FF6B35", statKey: "grip",
    desc: "Long high-speed arc. Sustained grip demand.",
    decisions: [
      { id: "lift",  label: "Lift & Coast", desc: "Ease off. Safe margin.",        time: 8.4, stress: { engine: 2, tires: 2, trans: 0, brakes: 0 } },
      { id: "trail", label: "Trail In",     desc: "Slight trail, rotate the car.", time: 6.9, stress: { engine: 3, tires: 4, trans: 1, brakes: 0 } },
      { id: "flat",  label: "Flat Out",     desc: "Commit. Max grip demand.",      time: 5.7, stress: { engine: 5, tires: 7, trans: 0, brakes: 0 } },
    ],
    mistake: "push_wide",
  },
  slalom: {
    label: "SLALOM", icon: "🔀", color: "#FFD700", statKey: "handling",
    desc: "Cone gates. Rhythm and transitions. Transmission under load.",
    decisions: [
      { id: "safe",   label: "Play Safe",   desc: "Wide entries. No cone risk.",     time: 9.0, stress: { engine: 0, tires: 1, trans: 2, brakes: 0 } },
      { id: "rhythm", label: "Find Rhythm", desc: "Smooth, consistent transitions.", time: 7.2, stress: { engine: 0, tires: 2, trans: 4, brakes: 0 } },
      { id: "throw",  label: "Throw It",    desc: "Aggressive weight transfer.",     time: 5.4, stress: { engine: 1, tires: 4, trans: 7, brakes: 0 } },
    ],
    mistake: "cone_clip",
  },
  chicane: {
    label: "CHICANE", icon: "↔️", color: "#7B2FBE", statKey: "handling",
    desc: "Quick left-right. Braking into a direction change.",
    decisions: [
      { id: "early_brake", label: "Brake Early",    desc: "Safe entry. Time lost.",      time: 8.7, stress: { engine: 0, tires: 2, trans: 1, brakes: 3 } },
      { id: "late_brake",  label: "Late Brake",     desc: "Deep braking, high reward.",  time: 6.6, stress: { engine: 0, tires: 3, trans: 2, brakes: 6 } },
      { id: "momentum",    label: "Carry Momentum", desc: "Minimal braking. Pure grip.", time: 6.0, stress: { engine: 0, tires: 5, trans: 1, brakes: 1 } },
    ],
    mistake: "push_wide",
  },
  finish: {
    label: "FINISH", icon: "🏁", color: "#E8EAF6", statKey: "hp",
    desc: "Final straight. Drive it through the line.",
    decisions: [
      { id: "safe_finish", label: "Safe Finish",      desc: "Don't overdrive it.", time: 5.4, stress: { engine: 3, tires: 1, trans: 1, brakes: 0 } },
      { id: "push_finish", label: "Push to the Line", desc: "Every last tenth.",   time: 3.9, stress: { engine: 6, tires: 2, trans: 3, brakes: 0 } },
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
