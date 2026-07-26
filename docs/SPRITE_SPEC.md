# Car Sprite Generation Spec (for Nano Banana / Gemini image gen)

Each vehicle below has a ready-to-paste prompt. Prepend the **Universal Style Block**
to every single prompt — it's what keeps all 13 cars visually consistent with each
other and with the two sprites already in the game (Miata NA/NB) that don't need
regenerating.

## Universal Style Block (prepend to every prompt)

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

## How to use these

1. Paste the Universal Style Block + one vehicle prompt per generation.
2. Ask for a transparent-background PNG export if the tool supports it directly;
   otherwise the flat magenta background chroma-keys out cleanly in any image editor.
3. Drop the result at the path listed under each vehicle, replacing what's there
   (or adding it fresh for the secret van, which has no file yet).
4. Ping me once files land and I'll wire them in / verify in-browser.

---

## Priority 1 — confirmed wrong, replace now

### Acura Integra DC2 GS-R
**Path:** `public/garage-life-assets/cars/acuraIntegraDc2Gsr/race-rear.png`
```
1994-2001 Acura Integra DC2 GS-R (JDM 3-door hatchback... no — boxy NOTCHBACK
coupe with a real trunk, not a hatch). Pearl white body (#E7E9EE), darker
grey-white lower valence (#9AA0AC), dark tinted rear glass (#161B26). Wide
taillight clusters that span almost the full rear width, with a distinct
amber/orange outer segment (#FFB300) next to the red inner segment (#FF2D55).
Small trunk-lip spoiler. Rear license plate recess centered low. Clean,
balanced, "sleeper JDM icon" read — not aggressive or widebody.
```

### Chevrolet Corvette C6 Coupe
**Path:** `public/garage-life-assets/cars/chevroletCorvetteC6/race-rear.png`
```
2005-2013 Chevrolet Corvette C6 Coupe, rear end. Red body (#CE1F2A), dark
red-black lower shadow areas (#7A0F16), dark tinted glass (#12151D). Wide,
low, flared rear fenders. Signature quad round taillights — two round lights
per side, not oval, not LED strips. Black diffuser/valence bar spanning the
lower rear. Two center-mounted exhaust tips poking through the diffuser.
Reads as raw American muscle-sports-car power, low and wide.
```

## Priority 2 — brand new, no reference sprite exists

### The Titty Twister (secret car)
**Path:** `public/garage-life-assets/cars/beaterVan-rear.png` *(new file/folder — pick whichever matches the flat-file naming convention used for the JDM roster)*
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

## Priority 3 — existing sprites unverified, regenerate for consistency once P1/P2 land

*(No established in-game color palette for these yet — colors below are suggested,
adjust to taste. Real-world rear-end styling cues included for accuracy.)*

### Honda Civic SiR (EK hatchback)
**Path:** `public/garage-life-assets/cars/hondaCivicSir-rear.png`
```
1996-2000 Honda Civic SiR (EK) 3-door hatchback, rear view. Bright yellow
body. Large hatch glass. Wraparound-style tail lights with a clear/amber
outer lens segment. Small factory lip spoiler on the hatch edge. Twin
exhaust tip low on one side (JDM single-exit typical). Lightweight
hot-hatch read — small, low, eager.
```

### Honda S2000 (AP1/AP2)
**Path:** `public/garage-life-assets/cars/hondaS2000-rear.png`
```
Honda S2000 roadster, rear view, soft top up. Deep blue body (Honda
"Sebring Silver" or blue both work — pick a saturated blue). Round-ish
tail lights set into a simple clean trunk lid, no spoiler. Center-exit
dual exhaust. Rear is narrow and tidy compared to the others — reads as
razor-sharp compact roadster.
```

### Mazda RX-7 FD
**Path:** `public/garage-life-assets/cars/mazdaRx7Fd-rear.png`
```
Mazda RX-7 FD3S, rear view. Deep red or dark grey body — smooth, organic,
curvy rear fascia (no hard creases). Signature integrated pop-up-style
tail lights recessed into a smooth body-colored panel, not protruding.
Small integrated lip spoiler. Single center-ish exhaust. Reads as slippery,
rounded, rotary-smooth — the most "melted/organic" shape of the whole roster.
```

### Subaru Impreza WRX (GC8)
**Path:** `public/garage-life-assets/cars/subaruImprezaWrx-rear.png`
```
1990s Subaru Impreza WRX (GC8) sedan, rear view. Blue body, gold/bronze
wheels implied by rear stance (wheels mostly hidden from this angle, but
lower body should hint at rally-bred stance). Signature large trunk-mounted
rally spoiler with an upright riser. Clean rectangular tail lights. Rear
fog light detail low-center. Reads as boxy, upright, rally-homologation.
```

### Mitsubishi Lancer Evo VI
**Path:** `public/garage-life-assets/cars/mitsubishiEvo6-rear.png`
```
Mitsubishi Lancer Evolution VI sedan, rear view. White or dark blue body.
Large, tall, upright rally wing on adjustable risers (taller and flatter
than the WRX's wing). Rectangular tail lights. Aggressive rear diffuser
element low on the bumper. Boxy sedan proportions, homologation-special
stance — reads as an even more track-focused sibling to the WRX.
```

### Nissan 180SX
**Path:** `public/garage-life-assets/cars/nissan180sx-rear.png`
```
Nissan 180SX, rear view. Dark grey or black body. Signature slim
wraparound tail light bar spanning the full rear width in one continuous
red lens (no gap in the middle, unlike most cars). Fastback/hatch rear
glass. Clean, minimal, no spoiler. Reads as an understated RWD tuner
platform — the "blank canvas" car of the roster.
```

### Nissan Skyline GT-R R34
**Path:** `public/garage-life-assets/cars/nissanSkylineR34-rear.png`
```
Nissan Skyline GT-R R34, rear view. Silver or dark blue body. Signature
four round tail lights arranged in a 2x2 grid (very distinctive, must be
round and grouped, not a bar). Prominent rear diffuser element and lower
valance. Subtle factory lip spoiler. Wide, muscular, planted rear stance —
the "grip monster" of the roster, should read as the most technical/serious
shape.
```

### Toyota Supra Mk4
**Path:** `public/garage-life-assets/cars/toyotaSupraMk4-rear.png`
```
Toyota Supra Mk4 (A80), rear view. Deep red or black body. Tall integrated
rear wing mounted on the trunk (factory "big wing" spec, not a small lip).
Rounded, organic tail lights similar in spirit to the RX-7 but slightly
more angular. Dual center-mounted exhaust. Wide rear haunches. Reads as
heavy, powerful, turbocharged GT — the biggest/heaviest-feeling car in
the roster.
```
