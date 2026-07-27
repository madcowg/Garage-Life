// ============================================================================
// STORY / LORE — Cape Marlow, its cast, and the two layers of narrative:
//   1. Season snippets — short per-career beats (career_start, first_win,
//      mid_season, etc). Pulled from small text pools so replays don't read
//      identically. Tracked on career.storySeen so each fires once per run.
//   2. Codex + Achievements — permanent, career-independent. Unlocked once
//      ever (gated by meta.codexUnlocked / meta.achievementsUnlocked) the
//      first time their trigger fires in ANY career.
//
// Autocross-accurate by design: rivals are friendly (paddock culture, not
// beef), every event costs a real entry fee, and the season's stakes are a
// local points chase toward a Nationals-bid invite rather than a bare
// calendar cutoff. See career.js for ENTRY_FEE and SEASON_GRADE_LABEL.
// ============================================================================

export const NPCS = {
  rex: { id: "rex", name: "Rex Alvarez", role: "Owner, Dead Reckoning Garage" },
  dez: { id: "dez", name: "Dez", role: "Miata regular", car: "miata" },
  marisol: { id: "marisol", name: "Marisol Vance", role: "Tuner-scene regular", car: "integra" },
  walt: { id: "walt", name: "Walt Corliss", role: "Weekend racer", car: "corvette" },
};

export const LOCATIONS = {
  garage: { id: "garage", name: "Dead Reckoning Garage", order: 1 },
  airfield: { id: "airfield", name: "The Airfield", order: 2 },
};

// Trigger id -> pool of snippet strings (silent protagonist: scene + other
// characters' dialogue only, nostalgic/wistful tone).
export const SEASON_SNIPPETS = {
  career_start: [
    "The coast road into Cape Marlow still smells like salt and hot pavement — same as every summer the autocross crowd's run the old airfield lot. $300, a stock car, and an entry fee waiting to be paid.",
    "Cape Marlow doesn't announce itself. Just a coast highway, a beat-up shop two blocks off it, and an airfield lined with orange cones and chalk where the local points chase starts from zero — same as everyone else's.",
  ],
  first_entry: [
    "Rex takes the cash without counting it twice. \"Entry fee, work assignment, cone count — that's the whole sport. Rest is just driving.\" First event of the season, paid out of pocket, same as every car on that grid.",
    "Twenty-five bucks and a signature on the waiver, same as every car on that grid tonight — nobody's comped, nobody's sponsored, everybody's chasing the same clock.",
  ],
  first_win: [
    "Dez is first over to the car after the run, grinning. \"Nice! Didn't expect that from a stocker.\" Somebody always remembers your first clean beat.",
    "Cones down, clock beat, and half the paddock's already walking over to ask what you did different. That's the whole community in one gesture.",
  ],
  rep_20: [
    "Marisol nods once from across the paddock — not a rival's nod, a peer's. \"You're on the points board now. Board doesn't lie.\"",
    "Somebody's started tracking your name against the local standings sheet taped to Rex's office door. Small club, long memory.",
  ],
  mid_season: [
    "The sun sits lower every week now. Somewhere past the airfield fence, this year's points-series banner is already going up, a little more faded than last year's.",
    "Halfway through the local season and the standings sheet's getting crowded with names. Whoever's on top come the last event gets first crack at a Nationals bid.",
  ],
  final_month: [
    "Last scored event of the year. Whatever's on the standings sheet after tonight is what gets mailed in for the Nationals bid list.",
    "One more event, same cones, same $25 entry — but tonight's the one that decides who Cape Marlow sends to Nationals.",
  ],
  mod_stage1_engine: [
    "Rex slides the invoice across the counter — filter, catback, done. \"Now we're talking. Little bit of you in the car now.\"",
  ],
  mod_stage1_brakes: [
    "Race pads, braided lines, and Rex's usual grunt of approval. \"Won't fade on you now. That's half of autocross right there — trusting the car'll do what you ask twice in a row.\"",
  ],
  mod_stage1_suspension: [
    "Sway bars go in on a Tuesday afternoon, Rex talking you through it more than doing it for you. \"Feel that? That's the car finally agreeing with you.\"",
  ],
  mod_stage1_safety: [
    "Seat and harness bolted in tight. Walt leans over from the next bay, approving for once. \"Better late than never. Ask me how I know.\"",
  ],
  car_hondaCivicSir: [
    "Word gets around the paddock fast when a car changes hands. The SiR's been through three owners at Cape Marlow — everyone who's had it swears by it, and swears at it, in roughly equal measure.",
  ],
  car_mazdaRx7Fd: [
    "There's a rotary whine that carries further than any V8 on a quiet coast night. Every regular at the airfield can tell you exactly where they were the first time they heard one on course.",
  ],
  season_end_nationals: [
    "The final standings sheet goes up outside Rex's office, and your name's at the top of it. Somewhere in a folder, a Nationals invite has your name spelled right for once.",
  ],
  season_end_contender: [
    "Not the top of the sheet, but close enough that people stop asking who you are. Next season starts from the same place. That's the deal.",
  ],
  season_end_solid: [
    "A respectable line on the standings sheet — no invite this year, but nobody at the airfield forgets a season of showing up and paying the entry fee anyway.",
  ],
  season_end_building: [
    "The season ends the way most first seasons do: more laps than trophies, more lessons than wins. Rex has seen it before. \"Everybody's build year looks like this.\"",
  ],
  season_end_rebuilding: [
    "Cape Marlow doesn't stop running events just because your season didn't go how you planned. There's always another entry fee, another Saturday, another clock to beat.",
  ],
};

function hashPick(arr, seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

// Deterministic-ish pick keyed by a per-career seed so re-renders of the same
// snippet screen don't flicker between pool variants, but different careers
// (different seed) see different flavor text.
export function pickSnippetText(triggerId, seed = "") {
  const pool = SEASON_SNIPPETS[triggerId];
  if (!pool) return "";
  return pool.length === 1 ? pool[0] : hashPick(pool, `${triggerId}:${seed}`);
}

export const CAR_CODEX_TITLE = {
  miata: "Mazda MX-5 Miata — Cape Marlow's Starter Car",
  integra: "Acura Integra DC2 GS-R — The Balanced Bet",
  corvette: "Chevrolet Corvette C6 — Raw Power, Tight Corners",
};
const CAR_CODEX_BODY = {
  miata: "Lightest thing on the grid, and half the paddock started in one. Doesn't win on power. Wins on nobody expecting it to.",
  integra: "No bonus, no penalty, no excuses. The DC2's the car people point to when they say the driver mattered more than the spec sheet.",
  corvette: "Plenty of car for the straights, more than plenty for the tight technical — the C6 punishes anyone who forgets which one Cape Marlow's course design favors.",
  hondaCivicSir: "Word gets around the paddock fast when a car changes hands. The SiR's been through three owners at Cape Marlow — everyone who's had it swears by it, and swears at it, in roughly equal measure.",
  mazdaRx7Fd: "There's a rotary whine that carries further than any V8 on a quiet coast night. Every regular at the airfield can tell you exactly where they were the first time they heard one on course.",
};

// category: "npc" | "car" | "location". body resolved lazily for cars
// (depends on which car was chosen), static for npc/location.
export const CODEX = {
  npc_rex: { id: "npc_rex", category: "npc", title: "Rex Alvarez — Dead Reckoning Garage", body: "Ran codriver seat in regional rally before a bad stage put him behind a counter instead of a wheel. Doesn't talk about it unless you ask twice. Sells every Stage 1 part in Cape Marlow and remembers every car that's come through his bays." },
  npc_dez: { id: "npc_dez", category: "npc", title: "Dez", body: "Bought a $400 Miata with money saved from a dishwashing job at the diner off Route 9. Still drives it. Still grins like it's the first event, every event." },
  npc_marisol: { id: "npc_marisol", category: "npc", title: "Marisol Vance", body: "Runs the tightest lines at the airfield and hands out setup advice like it costs her nothing — because to her, it doesn't. The club only gets faster if everyone does." },
  npc_walt: { id: "npc_walt", category: "npc", title: "Walt Corliss", body: "Bought the Corvette outright the week he retired. Took two seasons of DNFs before he stopped blaming the car. Now he's the first one over the fence to check on anyone who spins." },
  loc_garage: { id: "loc_garage", category: "location", title: "Dead Reckoning Garage", body: "Two blocks off the coast road, one bay always smells like brake cleaner. Every Stage 1 part that's ever gone into a Cape Marlow car passed over this counter first." },
  loc_airfield: { id: "loc_airfield", category: "location", title: "The Airfield", body: "A decommissioned strip past the last stoplight in town. Orange cones and chalk lines mark the course, a card table handles entry fees, and a standings sheet's been taped to the same clipboard for years." },
  car_miata: { id: "car_miata", category: "car", carId: "miata" },
  car_integra: { id: "car_integra", category: "car", carId: "integra" },
  car_corvette: { id: "car_corvette", category: "car", carId: "corvette" },
  car_hondaCivicSir: { id: "car_hondaCivicSir", category: "car", carId: "hondaCivicSir" },
  car_mazdaRx7Fd: { id: "car_mazdaRx7Fd", category: "car", carId: "mazdaRx7Fd" },
};

// Resolves a codex entry's display title/body, filling in car-specific text
// at read time (so CAR_CODEX_TITLE/BODY stay the single source of truth).
export function resolveCodexEntry(entry) {
  if (entry.category === "car") {
    return { ...entry, title: CAR_CODEX_TITLE[entry.carId], body: CAR_CODEX_BODY[entry.carId] };
  }
  return entry;
}

// Rolodex "engage" flavor lines (App.jsx handleEngageNpc) — one AP buys a
// beat with an already-met NPC, nudging their standing and your racing cred
// either up (friendly) or down (antagonize). Dating-sim-esque, but each NPC
// reacts in their own established voice rather than a generic response.
export const NPC_ENGAGE_LINES = {
  rex: {
    friendly: "You hang around the bay a while, actually listening when he explains why the last owner's alignment was garbage. Rex warms up half a degree — which, for Rex, is a lot.",
    antagonize: "You mouth off about his prices in front of two other customers. Rex doesn't say much back. He doesn't have to — word gets around a shop fast.",
  },
  dez: {
    friendly: "You end up leaning on the fence next to Dez's Miata for twenty minutes, trading notes on nothing important. Turns out that's most of how friendships at Cape Marlow actually happen.",
    antagonize: "You take a cheap shot at the Miata being \"basically a lawnmower.\" Dez laughs it off in the moment. The paddock remembers who said it, though.",
  },
  marisol: {
    friendly: "You ask Marisol a real question about her line through the sweeper instead of just nodding along. She notices — she always notices who's actually listening.",
    antagonize: "You wave off her setup advice like you already know better. She shrugs and walks off — she's got better places to put her time than someone who won't listen.",
  },
  walt: {
    friendly: "Walt tells the DNF story again, the one from two seasons back. You let him finish it this time instead of changing the subject. He appreciates that more than he says.",
    antagonize: "You needle him about the DNFs, one time too many. Walt goes quiet, and so does everyone else who heard it.",
  },
};

// quip: the snarky one-liner AchievementToast shows under the title — a
// game-show-host jab at the player, not a description (desc already covers
// that). Written deadpan/teasing, never actually mean.
export const ACHIEVEMENTS = [
  { id: "first_start", title: "New Arrival", desc: "Start your first career in Cape Marlow.", quip: "Congratulations, you have arrived somewhere. The bar was on the floor and you still had to duck." },
  { id: "first_entry", title: "Paid Your Dues", desc: "Pay your first event entry fee and grid up.", quip: "You handed a stranger $25 to let you drive in a circle. Bold opening move." },
  { id: "first_win", title: "Beat the Clock", desc: "Beat the target time in an autocross event.", quip: "The clock lost. The clock has never lost before. We're all very surprised, including you." },
  { id: "clean_win", title: "Cone Free", desc: "Win an event without hitting a single cone.", quip: "Not one cone. Rex is checking your car for hidden radar. There isn't any. You're just good now." },
  { id: "rep_20", title: "On the Board", desc: "Reach 20 points in a single season.", quip: "Your name is on a clipboard. This is what fame looks like in Cape Marlow." },
  { id: "stage1_complete", title: "Fully Built", desc: "Unlock every Stage 1 mod.", quip: "Every bolt-on Rex sells, installed. The car is now 4% you and 96% invoice." },
  { id: "nationals_bid", title: "Nationals Bid", desc: "End a season with a Nationals-bid points finish.", quip: "Somewhere, a Nationals official is spelling your name wrong on an envelope. Progress." },
  { id: "car_hondaCivicSir", title: "Civic Duty", desc: "Unlock the Honda Civic Si (EK).", quip: "Its fourth owner in Cape Marlow. It has opinions about all three previous ones." },
  { id: "car_mazdaRx7Fd", title: "Rotary Regard", desc: "Unlock the Mazda RX-7 FD.", quip: "It burns a little oil, it whines a little loud, and everyone still turns around for it. Rotary tax." },
  { id: "cred_legend", title: "Paddock Legend", desc: "Reach Paddock Legend racing cred in a season.", quip: "Paddock Legend. Not Nationals Legend, not Actually Famous Legend — Paddock Legend. Take the win." },
  { id: "trusted_by_all", title: "One of Us", desc: "Earn Trusted standing with everyone in Cape Marlow.", quip: "Rex, Dez, Marisol, and Walt all trust you now. Historians will note this took less effort than it should have." },
  { id: "ride_or_die", title: "Ride or Die", desc: "Finish a season with a spare car you never sold.", quip: "A whole spare car sat in the garage all season and you just... let it sit there. Loyalty, or laziness. We're not judging. We're a little judging." },
  { id: "fire_sale", title: "Fire Sale", desc: "Sell a car before the season hits its halfway point.", quip: "Barely warmed the seat before flipping it for cash. Ruthless. Efficient. Slightly concerning." },
];

// Per-career triggers get de-duped via career.storySeen (fire once per run);
// mod_*/car_* triggers are inherently once-ever (only raised when newly
// added to meta), so they don't need storySeen tracking.
export const PER_CAREER_TRIGGERS = new Set(["career_start", "first_entry", "first_win", "rep_20", "mid_season", "final_month"]);

// trigger id -> { achievements: [...], codex: [...] } permanent meta unlocks.
// career_start's codex/achievement effects are resolved dynamically (depend
// on which car was chosen) — see resolveTriggerUnlocks below.
const TRIGGER_EFFECTS = {
  first_entry: { achievements: ["first_entry"], codex: ["loc_airfield"] },
  first_win: { achievements: ["first_win"], codex: ["npc_dez"] },
  rep_20: { achievements: ["rep_20"], codex: ["npc_marisol"] },
  mod_stage1_safety: { achievements: [], codex: ["npc_walt"] },
  car_hondaCivicSir: { achievements: ["car_hondaCivicSir"], codex: ["car_hondaCivicSir"] },
  car_mazdaRx7Fd: { achievements: ["car_mazdaRx7Fd"], codex: ["car_mazdaRx7Fd"] },
};

export function resolveTriggerUnlocks(triggerId, { carId } = {}) {
  if (triggerId === "career_start") {
    return { achievements: ["first_start"], codex: ["npc_rex", "loc_garage", `car_${carId}`] };
  }
  return TRIGGER_EFFECTS[triggerId] || { achievements: [], codex: [] };
}

// Diffs a career before/after an action to find newly-fired per-career
// triggers, plus any mod/car ids newly unlocked this action (already
// deduped against meta by checkModUnlocks/checkCarUnlocks).
export function getNewStoryTriggers({ prevCareer, nextCareer, newMods = [], newCars = [] }) {
  const seen = prevCareer.storySeen || [];
  const fired = [];
  const mark = (id) => { if (!seen.includes(id) && !fired.includes(id)) fired.push(id); };

  if (prevCareer.eventsRegistered === 0 && nextCareer.eventsRegistered >= 1) mark("first_entry");
  if (prevCareer.wins === 0 && nextCareer.wins >= 1) mark("first_win");
  if (prevCareer.reputation < 20 && nextCareer.reputation >= 20) mark("rep_20");
  if (prevCareer.month < 6 && nextCareer.month >= 6) mark("mid_season");
  if (prevCareer.month < 10 && nextCareer.month >= 10) mark("final_month");
  newMods.forEach(id => mark(`mod_${id}`));
  newCars.forEach(id => mark(`car_${id}`));

  return fired;
}
