# Sprite / Asset Generation Spec (for Nano Banana / Gemini image gen)

This doc is the canonical style + convention reference for **every** art
category in the game, not just cars. The Universal Style Block below (chroma-key
process, hard-alpha edges, flat cel-shading, no gradients/dithering) applies to
all pixel-art categories; each category section further down calls out its own
camera angle, canvas size, and file-path convention on top of that shared base.

The car roster (all 15 cars across starter/unlockable/legend/secret tiers) is
**complete** — every entry in `src/game/data.js`'s `CARS` table has a working
front + rear sprite in `public/garage-life-assets/cars/`. There is no
outstanding "still needed" list for cars. See "Car Roster — Status" below for
the full inventory and recent changes (renames, tier moves, the secret car
finally getting art).

New asset categories about to start production — NPC portraits, location
backgrounds, mod/tire icons, achievement badges — are specced further down so
each follows one consistent convention instead of improvising per-drop.

## Universal Style Block (prepend to every car prompt)

```
Pixel art sprite, 16-bit SNES/Genesis era racing game style (think Top Gear /
OutRun 2 sprite scaling). Rear 3/4 view of a car, seen from a chase camera
almost directly behind and very slightly above — rear bumper reads a touch
wider/closer than the roofline, minimal perspective, NOT a full 3/4 angle.
Flat cel-shaded color fills, 2-3 shade levels per surface for basic light/
shadow, thick clean dark outlines (~2px at native resolution), no gradients,
no dithering, no photorealism, no anti-aliased soft edges. Single car,
centered, isolated on a solid magenta (#FF00FF) background for chroma-key
removal — no scenery, no ground shadow, no other objects. Native resolution
96px wide, proportional height (roughly 64-104px depending on the car's
rear height). Consistent flat overhead light source from behind-above.
```

**What's category-agnostic here (reuse for every future asset type):**
flat cel-shaded fills with 2-3 shade levels, thick clean dark outlines, no
gradients/no dithering/no soft anti-aliased edges, and — for anything that
isn't a full-scene background — isolate the subject on solid magenta
(#FF00FF) for chroma-key removal. Camera angle, canvas size, and background
treatment are the parts that change per category; each section below states
its own.

## How to use these

1. Paste the Universal Style Block (or the category-appropriate variant noted
   in that category's section) + one subject prompt per generation.
2. Ask for a transparent-background PNG export if the tool supports it
   directly; otherwise the flat magenta background chroma-keys out cleanly in
   any image editor.
3. Drop the result at the path listed for each asset.
4. Ping me once files land and I'll wire them in / verify in-browser.

---

## Car Roster — Status

All 15 cars have complete, working front + rear sprites. Nothing outstanding.

| Car | Tier | Sprite id | Notes |
|---|---|---|---|
| Mazda MX-5 Miata NA/NB | starter | `mazdaMiataNa` / `mazdaMiataNb` | nested garage+race convention |
| Acura Integra DC2 GS-R | starter | `acuraIntegraDc2Gsr` | nested garage+race convention |
| Honda Civic Si (EK) | unlockable | `hondaCivicSir` | **renamed** from "Honda Civic SiR (EK hatchback)" |
| Honda S2000 (AP1) | unlockable | `hondaS2000` | **renamed** from "Honda S2000 (AP1/AP2)" — spec now AP1 only |
| Mazda RX-7 FD | unlockable | `mazdaRx7Fd` | unchanged |
| Subaru Impreza WRX (bugeye) | unlockable | `subaruImprezaWrx` | **renamed** from "Subaru Impreza WRX (GC8)" |
| Mitsubishi Lancer Evo VI | unlockable | `mitsubishiEvo6` | unchanged |
| Nissan 240SX Fastback (S13) | unlockable | `nissan180sx` | **renamed** from "Nissan 180SX" |
| Nissan Skyline GT-R R34 | unlockable | `nissanSkylineR34` | unchanged |
| Toyota Supra Mk4 | unlockable | `toyotaSupraMk4` | unchanged |
| Honda NSX (NA1) | unlockable | `hondaNsxNa1` | unchanged |
| Chevrolet Corvette C6 Coupe | **unlockable** | `chevroletCorvetteC6` | **moved from starter to unlockable tier** — same car, now earned, nested garage+race convention |
| BMW M3 (E36) | legend (unreleased) | `bmwM3E36` | wired, not yet reachable in any career |
| BMW M3 (E46) | legend (unreleased) | `bmwM3E46` | wired, not yet reachable in any career |
| BMW M5 (E39) | legend (unreleased) | `bmwM5E39` | wired, not yet reachable in any career |
| BMW M3 (E90) | legend (unreleased) | `bmwM3E90` | wired, not yet reachable in any career |
| The Titty Twister (secret beater van) | secret | `beaterVan` | **now has real sprite art** (`beaterVan-front.png` / `beaterVan-rear.png`) — previously had no file |

Four cars above were renamed from the original generic real-world-model names
used when their prompts were first written (the prompts themselves, still
below, describe the same physical cars — only the in-game display name
changed, no re-render needed):

- "Honda Civic SiR (EK hatchback)" → **Honda Civic Si (EK)**
- "Honda S2000 (AP1/AP2)" → **Honda S2000 (AP1)**
- "Subaru Impreza WRX (GC8)" → **Subaru Impreza WRX (bugeye)**
- "Nissan 180SX" → **Nissan 240SX Fastback (S13)**

Path conventions in use (see `src/game/carAssets.js` header comment for the
authoritative version):
- Flat: `public/garage-life-assets/cars/<id>-front.png` / `<id>-rear.png` — JDM
  unlockable roster, BMW legend tier, and the secret van.
- Nested: `public/garage-life-assets/cars/<id>/garage-*.png` +
  `<id>/race-*.png` — the four USDM cars (Miata NA, Miata NB, Integra,
  Corvette). `race-rear.png` is what actually renders in RoadView today;
  `garage-*` sprites are banked for a future garage/car-select screen.

### Reference prompts (for regenerating/reprinting any car — all already fulfilled)

<details>
<summary>Acura Integra DC2 GS-R</summary>

```
1994-2001 Acura Integra DC2 GS-R (JDM 3-door hatchback... no — boxy NOTCHBACK
coupe with a real trunk, not a hatch). Pearl white body (#E7E9EE), darker
grey-white lower valence (#9AA0AC), dark tinted rear glass (#161B26). Wide
taillight clusters that span almost the full rear width, with a distinct
amber/orange outer segment (#FFB300) next to the red inner segment (#FF2D55).
Small trunk-lip spoiler. Rear license plate recess centered low. Clean,
balanced, "sleeper JDM icon" read — not aggressive or widebody.
```
</details>

<details>
<summary>Chevrolet Corvette C6 Coupe</summary>

```
2005-2013 Chevrolet Corvette C6 Coupe, rear end. Red body (#CE1F2A), dark
red-black lower shadow areas (#7A0F16), dark tinted glass (#12151D). Wide,
low, flared rear fenders. Signature quad round taillights — two round lights
per side, not oval, not LED strips. Black diffuser/valence bar spanning the
lower rear. Two center-mounted exhaust tips poking through the diffuser.
Reads as raw American muscle-sports-car power, low and wide.
```
</details>

<details>
<summary>The Titty Twister (secret beater van)</summary>

```
Rear view of a beat-up 1980s-90s full-size cargo/conversion van with a
retrofitted convertible soft-top (top up, visibly janky/homemade seam where
the roof was cut). Faded, patchy olive-drab paint (#8C9A6B) with a darker
olive shadow tone (#5B6644) where paint has worn thin — no two panels quite
the same shade. Tall, boxy, completely flat rear end (no taper at all,
unlike a normal car). A visible vertical seam down the center suggesting
rear barn-doors. Small, worn, slightly crooked taillights in a warm
orange-red (#FF6B35). Dark tinted rear window (#1B2233) with a strip of
duct tape crossing one corner where the glass is cracked. Overall vibe:
"somebody's third car that barely passes inspection," comedic and
lovable-junker, not sinister.
```
</details>

<details>
<summary>Honda Civic Si (EK)</summary>

```
1996-2000 Honda Civic SiR (EK) 3-door hatchback, rear view. Bright yellow
body. Large hatch glass. Wraparound-style tail lights with a clear/amber
outer lens segment. Small factory lip spoiler on the hatch edge. Twin
exhaust tip low on one side (JDM single-exit typical). Lightweight
hot-hatch read — small, low, eager.
```
</details>

<details>
<summary>Honda S2000 (AP1)</summary>

```
Honda S2000 roadster, rear view, soft top up. Deep blue body (Honda
"Sebring Silver" or blue both work — pick a saturated blue). Round-ish
tail lights set into a simple clean trunk lid, no spoiler. Center-exit
dual exhaust. Rear is narrow and tidy compared to the others — reads as
razor-sharp compact roadster.
```
</details>

<details>
<summary>Mazda RX-7 FD</summary>

```
Mazda RX-7 FD3S, rear view. Deep red or dark grey body — smooth, organic,
curvy rear fascia (no hard creases). Signature integrated pop-up-style
tail lights recessed into a smooth body-colored panel, not protruding.
Small integrated lip spoiler. Single center-ish exhaust. Reads as slippery,
rounded, rotary-smooth — the most "melted/organic" shape of the whole roster.
```
</details>

<details>
<summary>Subaru Impreza WRX (bugeye)</summary>

```
1990s Subaru Impreza WRX (GC8) sedan, rear view. Blue body, gold/bronze
wheels implied by rear stance (wheels mostly hidden from this angle, but
lower body should hint at rally-bred stance). Signature large trunk-mounted
rally spoiler with an upright riser. Clean rectangular tail lights. Rear
fog light detail low-center. Reads as boxy, upright, rally-homologation.
```
</details>

<details>
<summary>Mitsubishi Lancer Evo VI</summary>

```
Mitsubishi Lancer Evolution VI sedan, rear view. White or dark blue body.
Large, tall, upright rally wing on adjustable risers (taller and flatter
than the WRX's wing). Rectangular tail lights. Aggressive rear diffuser
element low on the bumper. Boxy sedan proportions, homologation-special
stance — reads as an even more track-focused sibling to the WRX.
```
</details>

<details>
<summary>Nissan 240SX Fastback (S13)</summary>

```
Nissan 180SX, rear view. Dark grey or black body. Signature slim
wraparound tail light bar spanning the full rear width in one continuous
red lens (no gap in the middle, unlike most cars). Fastback/hatch rear
glass. Clean, minimal, no spoiler. Reads as an understated RWD tuner
platform — the "blank canvas" car of the roster.
```
</details>

<details>
<summary>Nissan Skyline GT-R R34</summary>

```
Nissan Skyline GT-R R34, rear view. Silver or dark blue body. Signature
four round tail lights arranged in a 2x2 grid (very distinctive, must be
round and grouped, not a bar). Prominent rear diffuser element and lower
valance. Subtle factory lip spoiler. Wide, muscular, planted rear stance —
the "grip monster" of the roster, should read as the most technical/serious
shape.
```
</details>

<details>
<summary>Toyota Supra Mk4</summary>

```
Toyota Supra Mk4 (A80), rear view. Deep red or black body. Tall integrated
rear wing mounted on the trunk (factory "big wing" spec, not a small lip).
Rounded, organic tail lights similar in spirit to the RX-7 but slightly
more angular. Dual center-mounted exhaust. Wide rear haunches. Reads as
heavy, powerful, turbocharged GT — the biggest/heaviest-feeling car in
the roster.
```
</details>

---

## NPC Portraits

Four NPCs, per `src/game/story.js`'s `NPCS` table: Rex Alvarez (owner, Dead
Reckoning Garage), Dez (Miata regular), Marisol Vance (tuner-scene regular),
Walt Corliss (weekend racer). Used for codex entries / dialogue-adjacent UI,
not the chase-cam car view, so the camera convention differs from cars.

**Path:** `public/garage-life-assets/npcs/<id>.png` (ids: `rex`, `dez`,
`marisol`, `walt` — matching `NPCS` keys)

**Dimensions:** 384×480 portrait (3:4), native resolution — no upscale needed
at display size.

**Camera / framing:** 3/4 turn (not full-frontal mugshot, not full profile),
waist-up crop, eyeline roughly a third down from the top of frame.

**Background — call:** transparent (chroma-keyed) rather than in-context.
Tradeoff: an in-context background (garage bay for Rex, paddock/pit lane for
the other three) reads richer as a one-off illustration, but locks the
portrait to whatever UI panel shape it was composed for and creates visible
mismatched-lighting seams if it's ever cropped into a circle/rounded-square
avatar slot or placed over a different backdrop later. Transparent keeps the
portrait reusable across codex cards, dialogue boxes, and any future avatar
treatment without re-generating art — same reasoning that already applies to
every car sprite in this doc. Use transparent/chroma-key (#FF00FF) for
consistency with the rest of the asset pipeline.

**Style:** same flat cel-shaded rendering as the Universal Style Block (2-3
shade levels, thick dark outlines, no gradients/dithering/soft edges), applied
to a character bust instead of a vehicle.

---

## Locations

Two confirmed locations in `story.js`'s `LOCATIONS` table today (`garage`,
`airfield`), with a third (paint shop) in progress as an unnamed future
location.

**Path:** `public/garage-life-assets/environments/<name>.png`

**Dimensions:** 1536×1024 landscape — matches the existing
`environments/airfield.png` (confirmed 1536×1024 on disk) and
`environments/coastal-highway.png` treatment.

**Camera / framing:** wide establishing-shot landscape, matching the existing
airfield background's eye-level chase-camera-adjacent perspective (not a
top-down map view).

**Status by location:**

- **The Airfield** — done (`environments/airfield.png`).
- **Dead Reckoning Garage** — still needed. No background file exists yet for
  `loc_garage` (the codex entry references it, but there's no
  `environments/garage.png` on disk). Needs the same 1536×1024 landscape
  treatment as airfield.png.
- **Paint Shop** — art received but not yet integration-ready.
  `environments/paint shop clean.png` (2816×1189) and
  `environments/paint shop dirty.png` (2816×1197) both exist on disk, but —
  like the car sprites originally were — these are raw multi-panel
  reference sheets, not single cropped backgrounds. Opening either file
  shows a magenta-background sheet titled "CUSTOM JDM LEGENDS COLLECTION —
  THE PAINT BOOTH SPRITE," with a large center panel (the actual usable
  booth-interior background: a downdraft paint booth shown in a straight-on
  3/4 view with overhead lighting rigs, floor grating, and a bay door — clean
  in one file, heavily paint-splattered/grungy in the other) flanked by
  smaller reference panels — color swatch chips, close-ups of the booth's
  control panel, and a "UNIQUE VIEW (BOOTH MECHANICS)" close-up of the floor
  grate/sump detail in the corner. These still need the same crop/extraction
  pass the car sheets went through: pull just the large center booth-interior
  panel, discard the title bar and side reference panels, and save each as
  its own `environments/paint-shop-clean.png` / `environments/paint-shop-dirty.png`
  (or similar clean/dirty pair name) at final landscape dimensions before
  they're wired in. Treat as received-but-not-integrated, same status tier as
  a "priority 1, in progress" car sprite would have been.

**Rename note:** once cropped, prefer hyphenated lowercase filenames
(`paint-shop-clean.png`) over the current space-containing raw filenames, for
consistency with `airfield.png` / `coastal-highway.png` and to avoid
URL-encoding headaches when referenced from code.

---

## Upgrade / Mod Icons & Tire Icons

Covers the four Stage 1 mods (`src/game/data.js`'s `MODS` array — Engine,
Brakes, Suspension, Safety) and the three tire tiers (`TIRE_CATALOG` — Stock,
Extreme Performance Summer, Slicks). No prior icon-spec doc or reference
artifact was found in the repo for these (`src/components/ds/cards/ItemCard.jsx`
already has an `icon` prop wired up, rendered at 16×16, but nothing currently
populates it with real art — so this is a fresh spec, not a conflicting one).

**Path:**
- Mods: `public/garage-life-assets/mods/<id>.png` (ids: `stage1_engine`,
  `stage1_brakes`, `stage1_suspension`, `stage1_safety` — matching `MODS[].id`)
- Tires: `public/garage-life-assets/tires/<id>.png` (ids: `stock`,
  `extreme_summer`, `slicks` — matching `TIRE_CATALOG` keys)

**Dimensions:** 128×128, transparent background. (Displayed small — 16×16 in
`ItemCard` today — so render at 128×128 native and let it downscale cleanly;
don't hand-author at display size.)

**Camera / framing:** single object, no scene/background, 3/4 or straight
side-profile shot per the part's most recognizable silhouette — e.g. the
Stage 1 Engine icon as a 3/4 view of an air filter + catback exhaust tip,
brake icon as a 3/4 view of a caliper/rotor, suspension as a coilover/sway
bar, safety as a racing seat or harness buckle; tires as a 3/4 shot of the
tire+wheel showing tread pattern (stock = plain street tread, summer =
performance tread, slicks = smooth/no tread).

**Style:** same flat cel-shaded rendering as the Universal Style Block,
isolated on magenta (#FF00FF) for chroma-key, matching the car sprites'
outline weight and shading approach so icons don't look like a different
game's assets next to the car list.

---

## Achievement Badges

13 achievements total, per `src/game/story.js`'s `ACHIEVEMENTS` array:
`first_start`, `first_entry`, `first_win`, `clean_win`, `rep_20`,
`stage1_complete`, `nationals_bid`, `car_hondaCivicSir`, `car_mazdaRx7Fd`,
`cred_legend`, `trusted_by_all`, `ride_or_die`, `fire_sale`.

**Path:** `public/garage-life-assets/achievements/<id>.png` (id = the
achievement's `id` field above)

**Dimensions:** 128×128, transparent background.

**Camera / framing:** front-facing medallion/badge composition (not a scene
or character shot) — circular or shield-shaped badge frame with a central
icon motif representing the achievement (e.g. a checkered flag for
`first_win`, a clipboard/points sheet for `rep_20`, a wrench-and-bolt set for
`stage1_complete`, a car silhouette for the two car-unlock achievements).

**Style:** same flat cel-shaded rendering as the Universal Style Block (thick
dark outlines, 2-3 shade levels, no gradients/dithering), isolated on magenta
(#FF00FF) for chroma-key. Badge rim/frame should use a consistent metallic
palette across all 13 so they read as one set (e.g. bronze/silver/gold tiering
is available if a future rarity pass wants it, but isn't required now — flat
single-tier badge frame is fine for v1).
