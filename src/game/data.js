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
  hondaNsxNa1:      { name: "Honda NSX (NA1)",         hp: 4, handling: 5, grip: 5, trans: 4, blurb: "Mid-engine, aluminum-chassis precision. Senna-tuned balance.", tier: "unlockable", sprite: "hondaNsxNa1" },

  // BMW Legends — a future upgrade tier, one rung above the JDM unlockable
  // roster (real handling identities are wired in card-core-v2 so they're
  // ready to go), but not yet reachable in any career: no unlock condition
  // targets tier "legend", and Junkyard/NewCareerScreen both filter on
  // "unlockable" specifically. Flip the tier (and the matching vehicle's
  // `status` in card-core-v2/vehicles.js) when it's time to bring them in.
  bmwM3E36: { name: "BMW M3 (E36)", hp: 3, handling: 4, grip: 4, trans: 3, blurb: "Naturally-aspirated inline-six. Balanced classic sport coupe.", tier: "legend", sprite: "bmwM3E36" },
  bmwM3E46: { name: "BMW M3 (E46)", hp: 4, handling: 5, grip: 4, trans: 4, blurb: "S54 inline-six — the benchmark-balanced M3 generation.", tier: "legend", sprite: "bmwM3E46" },
  bmwM5E39: { name: "BMW M5 (E39)", hp: 5, handling: 3, grip: 4, trans: 4, blurb: "S62 V8 sport sedan. Effortless power, sedan-heavy in the tight stuff.", tier: "legend", sprite: "bmwM5E39" },
  bmwM3E90: { name: "BMW M3 (E90)", hp: 4, handling: 4, grip: 5, trans: 4, blurb: "High-revving 4.0L V8. More muscle than the E46, more weight too.", tier: "legend", sprite: "bmwM3E90" },

  // Secret — not shown anywhere in the normal car list. Two unrelated ways
  // in: the "sell a car early" achievement payoff (App.jsx handleSellCar),
  // or typing "Lou"/"Fanaz" as your name at the intro screen (App.jsx
  // handleIntroContinue) — same car either way. No sprite asset (that
  // pipeline's blocked, see PixelLab backlog note) — it renders through a
  // dedicated procedural draw instead (RoadView.jsx drawVanRear), same as
  // the three starters.
  beaterVan: { name: "The Titty Twister", hp: 1, handling: 3, grip: 2, trans: 2, blurb: "A rattling convertible-top cargo van, all the badges long gone. Rex swears it runs. Rex was right, annoyingly.", tier: "secret" },
};

// Stage 1 mod progression (Season 1 design doc §7). Each unlocks permanently
// once lifetime cash earned this career crosses its threshold (see
// game/career.js), independent of current spendable balance.
export const MODS = [
  { id: "stage1_engine",     label: "Stage 1 Engine",     desc: "Filter + catback exhaust — mild power, no added risk", unlockThreshold: 100 },
  { id: "stage1_brakes",     label: "Stage 1 Brakes",     desc: "Race pads + braided lines — advantage on brake rolls", unlockThreshold: 200 },
  { id: "stage1_suspension", label: "Stage 1 Suspension", desc: "Anti-sway bars — advantage on mistake rolls", unlockThreshold: 300 },
  { id: "stage1_safety",     label: "Stage 1 Safety",     desc: "Race seat + harness — +1 to every roll", unlockThreshold: 400 },
];

// Reference price for Stage 1 Tires — available from day one, no unlock
// needed. Not a literal SKU cost in the shop yet; used to anchor base
// salary (career.js: baseSalary = STAGE1_TIRE_PRICE / 2).
export const STAGE1_TIRE_PRICE = 100;

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

