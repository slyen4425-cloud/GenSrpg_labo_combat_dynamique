# Projectile Animation / Depth V1 — 2026-10-12

## User need
- A rotating Tornade projectile should loop its sprite frames faster without accelerating its travel or triggering the impact earlier.
- Travel sprites should optionally shrink from the player toward the distant opponent and grow in the reverse direction, matching the side perspective of the combat arena.

## Existing foundation audited
- `applySpriteVisual` already owned the animation of frame sequences / strips; its `loop` mode repeats native sprite frames, while `stretch` binds the sequence to the whole travel duration.
- The projectile FX renderer already animates the traveling shell with three approximate scale values 0.94 / 1.04 / 0.98 times the authored display scale. These provide motion pulse but not directional depth.
- The Human Skill Editor already exposes trajectory mode and travel playback mode, but neither a loop-rate multiplier nor distance-depth controls.

## Additive contract (SkillPresentationBinding V11)
For **travel** sprite only, new optional fields:
- `frameSpeedMultiplier`: 0.25–4, defaults to 1. Applied only when `playbackMode:"loop"`. A loop using the asset's 800 ms cycle becomes 400 ms at 2 or approximately 267 ms at 3. Runtime travel duration is unchanged.
- `perspectiveAmount`: 0–0.5, defaults to 0 (disabled). A linear player→opponent projectile interpolates visual scale from 100% to `(1 - amount) × 100%` of its normal animated scale; opponent→player interpolates from the smaller scale to 100%. The inherited 0.94 / 1.04 / 0.98 movement pulse remains.
- Perspective is inapplicable to `trajectoryMode:"skyfall"`, explicitly rejected if enabled there. Beam FX is not changed by these fields. These are not gameplay targeting rules.
- V1–V10 validation/normalization remains unchanged; the editor selects V11 only when the new values differ from 1 and 0.

## Real data path and authority
`Human Editor -> Capture Skill Draft -> Skill Presentation Binding V11 -> Capture Presentation Asset Resolver (also determines player/opponent view) -> dom-skill-fx applySpriteVisual + projectile shell keyframes`.

- The editor displays “Vitesse de boucle du sprite” (1–4×) and “Perspective pendant le trajet” (0–0.5). For Tornade, switch playback to “Boucler pendant le trajet” and set 2× or 3×.
- The editor saves/loads both values and they survive the existing Capture skill transfer JSON export/import format.
- FX renderer changes only frame playback timing and the three shell **visual** scale values; it does not change travel `translate3d` positions, `durationMs`, Combat Runtime, opaque core anchor or alpha-contact sensor.
- All historical skills and sprites without opt-in preserve their exact old keyframes, normal sprite timing, underlying battle rules and targeting geometry.
- No global CSS clock, mutation observer, new animation loop or user assets introduced.

## Checks
- RED regression tests added at `be4b28c975dc44337f3bd66f5e1c308816f47ac2` before implementation.
- GREEN code+HTML `99e8a7f0399a921b7d32c722d15021633b75f042`: Laboratory CI `38255845203` **SUCCESS**, all three jobs foundation / Chromium Firestorm / Chromium Creature Library green.
- `tests/unit/projectile-animation-depth-v1.test.mjs`: V11 validation, editor build/restore/transfer, real presentation asset resolver, frame-rate speed with unchanged projectile duration, outgoing and incoming depth, unchanged legacy scale easings and HTML/UI presence.
- Previous projectile geometry, Fireball direct/skyfall, swooping attack and browser bootstrap sentinels remain intact in the whole suite.
- Smartphone landscape product acceptance is separate from CI GREEN; user has yet to test Tornade.

## Governance
- Base `gh-pages`: `00d10a87c4a1041abf8e3a62fa85c0095bd54d66`.
- Start checkpoint: `checkpoint/lab-start-projectile-animation-depth-v1-2026-10-12`.
- Work branch: `work/lab-projectile-animation-depth-v1-2026-10-12`.
- Scope limited to the contract V11 registration/implementation, Capture editor UI, FX asset projection/renderer, dedicated tests, this note and current work.
- `main`, `global-assets`, `Zombicide-40k`, Exploration, native collision and creature library data have not been modified.
